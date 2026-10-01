-- CampoBase · equipos compartidos y cuenta de delegado.
-- Cada cuenta principal posee un único equipo. Su delegado pertenece al mismo
-- equipo, hereda la suscripción del titular y nunca puede crear otro equipo.

alter table public.perfiles drop constraint if exists perfiles_role_check;
alter table public.perfiles
  add constraint perfiles_role_check
  check (role in ('owner','admin','coach','delegate'));

create table if not exists public.equipos_cuenta (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  nombre text not null default 'Mi equipo',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.equipo_miembros (
  equipo_id uuid not null references public.equipos_cuenta(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','coach','delegate')),
  view_permissions jsonb not null default '["delegado"]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (equipo_id, user_id),
  constraint equipo_miembros_permissions_array check (jsonb_typeof(view_permissions) = 'array')
);

create unique index if not exists equipo_un_solo_delegado_idx
  on public.equipo_miembros(equipo_id)
  where role = 'delegate';

alter table public.equipos_cuenta enable row level security;
alter table public.equipo_miembros enable row level security;

revoke all on public.equipos_cuenta from anon;
revoke all on public.equipo_miembros from anon;
revoke insert, update, delete on public.equipos_cuenta from authenticated;
revoke insert, update, delete on public.equipo_miembros from authenticated;
grant select on public.equipos_cuenta to authenticated;
grant select on public.equipo_miembros to authenticated;

insert into public.equipos_cuenta(owner_user_id, nombre)
select p.id, coalesce(nullif(trim(p.club_name), ''), 'Mi equipo')
from public.perfiles p
where p.role in ('owner','admin','coach')
on conflict (owner_user_id) do update
set nombre = case
  when public.equipos_cuenta.nombre = 'Mi equipo'
    then excluded.nombre
  else public.equipos_cuenta.nombre
end;

insert into public.equipo_miembros(equipo_id, user_id, role, view_permissions)
select e.id, p.id,
       case when p.role in ('owner','admin') then 'admin' else 'coach' end,
       '[]'::jsonb
from public.perfiles p
join public.equipos_cuenta e on e.owner_user_id = p.id
where p.role in ('owner','admin','coach')
on conflict (user_id) do update
set equipo_id = excluded.equipo_id,
    role = excluded.role,
    view_permissions = excluded.view_permissions,
    updated_at = timezone('utc', now());

create or replace function public.current_team_owner_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select e.owner_user_id
  from public.equipo_miembros m
  join public.equipos_cuenta e on e.id = m.equipo_id
  where m.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_team_owner_id() from public;
grant execute on function public.current_team_owner_id() to authenticated;

create or replace function public.mi_equipo_contexto()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'team_id', e.id,
    'team_name', e.nombre,
    'data_owner_user_id', e.owner_user_id,
    'membership_role', m.role,
    'view_permissions', m.view_permissions
  )
  from public.equipo_miembros m
  join public.equipos_cuenta e on e.id = m.equipo_id
  where m.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.mi_equipo_contexto() from public;
grant execute on function public.mi_equipo_contexto() to authenticated;

create or replace function public.has_app_access()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with team_owner as (
    select public.current_team_owner_id() as id
  )
  select
    exists (
      select 1
      from team_owner t
      join public.perfiles p on p.id = t.id
      where p.role in ('owner','admin')
    )
    or exists (
      select 1
      from team_owner t
      join public.suscripciones s on s.user_id = t.id
      where
        s.estado = 'gift_free'
        or (
          s.estado = 'active'
          and (s.expira_en is null or s.expira_en > now())
        )
        or (
          s.estado = 'trial'
          and s.expira_en is not null
          and s.expira_en > now()
        )
    );
$$;

revoke all on function public.has_app_access() from public;
grant execute on function public.has_app_access() to authenticated;

create or replace function public.get_my_subscription()
returns setof public.suscripciones
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select s.*
  from public.suscripciones s
  where s.user_id = public.current_team_owner_id()
  limit 1;
$$;

revoke all on function public.get_my_subscription() from public;
grant execute on function public.get_my_subscription() to authenticated;

create or replace function public.get_delegate_account()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'user_id', d.user_id,
    'email', p.email,
    'full_name', p.full_name,
    'username', p.username,
    'view_permissions', d.view_permissions
  )
  from public.equipos_cuenta e
  join public.equipo_miembros me
    on me.equipo_id = e.id
   and me.user_id = auth.uid()
   and me.role in ('admin','coach')
  left join public.equipo_miembros d
    on d.equipo_id = e.id
   and d.role = 'delegate'
  left join public.perfiles p on p.id = d.user_id
  where e.owner_user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_delegate_account() from public;
grant execute on function public.get_delegate_account() to authenticated;

create or replace function public.set_delegate_permissions(p_permissions text[])
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_team_id uuid;
  v_allowed constant text[] := array[
    'delegado','hoy','plantilla','cuerpo-tecnico','asistencia',
    'convocatorias','preparacion','partido','calendario',
    'sesiones','ejercicios','tacticas'
  ];
  v_clean text[];
begin
  select e.id into v_team_id
  from public.equipos_cuenta e
  join public.equipo_miembros m on m.equipo_id=e.id
  where e.owner_user_id=auth.uid()
    and m.user_id=auth.uid()
    and m.role in ('admin','coach')
  limit 1;

  if v_team_id is null then
    raise exception 'Solo el titular del equipo puede configurar al delegado.';
  end if;

  select array_agg(distinct x order by x)
    into v_clean
  from unnest(coalesce(p_permissions, array[]::text[])) x
  where x = any(v_allowed);

  v_clean := array_append(coalesce(v_clean, array[]::text[]), 'delegado');
  select array_agg(distinct x order by x) into v_clean from unnest(v_clean) x;

  update public.equipo_miembros
  set view_permissions=to_jsonb(v_clean),
      updated_at=timezone('utc', now())
  where equipo_id=v_team_id and role='delegate';

  if not found then
    raise exception 'Este equipo todavía no tiene una cuenta de delegado.';
  end if;

  return jsonb_build_object('success', true, 'view_permissions', to_jsonb(v_clean));
end;
$$;

revoke all on function public.set_delegate_permissions(text[]) from public;
grant execute on function public.set_delegate_permissions(text[]) to authenticated;

drop policy if exists equipos_cuenta_lectura_miembro on public.equipos_cuenta;
create policy equipos_cuenta_lectura_miembro
on public.equipos_cuenta for select to authenticated
using (
  exists (
    select 1 from public.equipo_miembros m
    where m.equipo_id=equipos_cuenta.id
      and m.user_id=auth.uid()
  )
);

drop policy if exists equipo_miembros_lectura_equipo on public.equipo_miembros;
create policy equipo_miembros_lectura_equipo
on public.equipo_miembros for select to authenticated
using (
  user_id=auth.uid()
  or exists (
    select 1
    from public.equipos_cuenta e
    where e.id=equipo_miembros.equipo_id
      and e.owner_user_id=auth.uid()
  )
);

do $$
declare
  t text;
begin
  foreach t in array array['jugadores','convocatorias','partidos','asistencias','configuracion']
  loop
    execute format('drop policy if exists campobase_user_%I on public.%I', t, t);
    execute format(
      'create policy campobase_user_%I on public.%I
       for all to authenticated
       using (user_id = public.current_team_owner_id() and public.has_app_access())
       with check (user_id = public.current_team_owner_id() and public.has_app_access())',
      t, t
    );
  end loop;
end $$;

create or replace function public.is_app_owner()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and role in ('owner','admin')
  );
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() = old.id then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_role on public.perfiles;
create trigger trg_protect_profile_role
before update on public.perfiles
for each row execute function public.protect_profile_role();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_team_id uuid;
  v_name text := coalesce(nullif(trim(new.raw_user_meta_data->>'club_name'), ''), 'Mi equipo');
begin
  insert into public.perfiles (id, email, username, full_name, club_name, role)
  values (
    new.id,
    new.email,
    lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    v_name,
    'coach'
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = timezone('utc', now());

  insert into public.equipos_cuenta(owner_user_id, nombre)
  values (new.id, v_name)
  on conflict (owner_user_id) do update set updated_at=timezone('utc', now())
  returning id into v_team_id;

  insert into public.equipo_miembros(equipo_id,user_id,role,view_permissions)
  values (v_team_id,new.id,'coach','[]'::jsonb)
  on conflict (user_id) do nothing;

  return new;
end;
$$;
