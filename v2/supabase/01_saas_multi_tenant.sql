-- CampoBase · autenticación real y aislamiento multiusuario.
-- Migración no destructiva: conserva todos los registros existentes y los asigna
-- al propietario legado hasta que este vincule su cuenta real mediante su PIN.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Perfiles de usuario
-- ---------------------------------------------------------------------------

update public.perfiles
set username = lower(trim(username))
where username is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'perfiles_role_check'
      and conrelid = 'public.perfiles'::regclass
  ) then
    alter table public.perfiles
      add constraint perfiles_role_check check (role in ('owner', 'coach'));
  end if;
end $$;

create unique index if not exists perfiles_username_lower_unique
  on public.perfiles (lower(username))
  where username is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.perfiles (id, email, username, full_name, club_name, role)
  values (
    new.id,
    new.email,
    lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(nullif(trim(new.raw_user_meta_data->>'club_name'), ''), 'Mi equipo'),
    'coach'
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.perfiles enable row level security;

drop policy if exists perfiles_lectura_username_disponible on public.perfiles;
drop policy if exists perfiles_lectura_propia on public.perfiles;
create policy perfiles_lectura_propia on public.perfiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists perfiles_actualizacion_propia on public.perfiles;
create policy perfiles_actualizacion_propia on public.perfiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists perfiles_insercion_propia on public.perfiles;
create policy perfiles_insercion_propia on public.perfiles
  for insert to authenticated
  with check (auth.uid() = id);

revoke update on table public.perfiles from authenticated;
grant update (username, email, full_name, club_name, avatar_url, remember_device, updated_at)
  on table public.perfiles to authenticated;

create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select not exists (
    select 1 from public.perfiles
    where lower(username) = lower(trim(coalesce(p_username, '')))
  );
$$;

create or replace function public.resolve_login_email(p_username text)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select email
  from public.perfiles
  where lower(username) = lower(trim(coalesce(p_username, '')))
  limit 1;
$$;

revoke all on function public.username_available(text) from public;
revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Estado seguro de migración del propietario histórico
-- ---------------------------------------------------------------------------

create table if not exists public.saas_system_state (
  id text primary key check (id = 'singleton'),
  legacy_owner_id uuid references auth.users(id) on delete set null,
  owner_claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.saas_system_state enable row level security;
revoke all on table public.saas_system_state from anon, authenticated;

insert into public.saas_system_state (id)
values ('singleton')
on conflict (id) do nothing;

update public.saas_system_state s
set legacy_owner_id = candidate.id,
    updated_at = now()
from (
  select id
  from public.perfiles
  where role = 'owner'
  order by created_at
  limit 1
) candidate
where s.id = 'singleton'
  and s.legacy_owner_id is null;

-- ---------------------------------------------------------------------------
-- 3. Asociar los datos históricos al propietario legado sin borrarlos
-- ---------------------------------------------------------------------------

do $$
declare
  v_legacy_owner uuid;
begin
  select legacy_owner_id into v_legacy_owner
  from public.saas_system_state
  where id = 'singleton';

  if v_legacy_owner is null then
    raise exception 'No existe un propietario legado al que asignar los datos actuales.';
  end if;

  update public.jugadores set user_id = v_legacy_owner where user_id is null;
  update public.partidos set user_id = v_legacy_owner where user_id is null;
  update public.convocatorias set user_id = v_legacy_owner where user_id is null;
  update public.asistencias set user_id = v_legacy_owner where user_id is null;
  update public.configuracion set user_id = v_legacy_owner where user_id is null;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Clave compuesta por usuario + id. Permite que cada entrenador tenga
--    configuracion.id='main' y cualquier otro id sin chocar con otro club.
-- ---------------------------------------------------------------------------

do $$
declare
  v_table text;
  v_constraint text;
begin
  foreach v_table in array array['jugadores','partidos','convocatorias','asistencias','configuracion'] loop
    execute format('alter table public.%I alter column user_id set not null', v_table);

    select tc.constraint_name into v_constraint
    from information_schema.table_constraints tc
    where tc.table_schema = 'public'
      and tc.table_name = v_table
      and tc.constraint_type = 'PRIMARY KEY'
    limit 1;

    if v_constraint is not null then
      execute format('alter table public.%I drop constraint %I', v_table, v_constraint);
    end if;

    execute format('alter table public.%I add primary key (user_id, id)', v_table);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 5. RLS estricto. No se admiten filas huérfanas ni acceso anónimo.
-- ---------------------------------------------------------------------------

drop policy if exists campobase_user_jugadores on public.jugadores;
create policy campobase_user_jugadores on public.jugadores
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists campobase_user_partidos on public.partidos;
create policy campobase_user_partidos on public.partidos
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists campobase_user_convocatorias on public.convocatorias;
create policy campobase_user_convocatorias on public.convocatorias
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists campobase_user_asistencias on public.asistencias;
create policy campobase_user_asistencias on public.asistencias
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists campobase_user_configuracion on public.configuracion;
create policy campobase_user_configuracion on public.configuracion
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on table public.jugadores from anon;
revoke all on table public.partidos from anon;
revoke all on table public.convocatorias from anon;
revoke all on table public.asistencias from anon;
revoke all on table public.configuracion from anon;

grant select, insert, update, delete on table public.jugadores to authenticated;
grant select, insert, update, delete on table public.partidos to authenticated;
grant select, insert, update, delete on table public.convocatorias to authenticated;
grant select, insert, update, delete on table public.asistencias to authenticated;
grant select, insert, update, delete on table public.configuracion to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Vinculación segura de los datos actuales a la cuenta real de Migue.
--    Se valida en PostgreSQL contra el mismo SHA-256 que ya usa la app.
-- ---------------------------------------------------------------------------

create table if not exists public.saas_owner_claim_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  failed_attempts integer not null default 0,
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.saas_owner_claim_attempts enable row level security;
revoke all on table public.saas_owner_claim_attempts from anon, authenticated;

create or replace function public.legacy_owner_claim_available()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null
    and s.legacy_owner_id is not null
    and s.owner_claimed_by is null
    and auth.uid() <> s.legacy_owner_id
  from public.saas_system_state s
  where s.id = 'singleton';
$$;

create or replace function public.claim_legacy_owner(p_pin text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_legacy uuid;
  v_claimed uuid;
  v_settings jsonb;
  v_salt text;
  v_expected text;
  v_actual text;
  v_failed integer := 0;
  v_blocked timestamptz;
begin
  if v_user is null then
    return json_build_object('success', false, 'message', 'Debes iniciar sesión primero.');
  end if;

  select legacy_owner_id, owner_claimed_by
  into v_legacy, v_claimed
  from public.saas_system_state
  where id = 'singleton'
  for update;

  if v_legacy is null then
    return json_build_object('success', false, 'message', 'No hay datos anteriores pendientes de vincular.');
  end if;

  if v_claimed is not null then
    return json_build_object('success', false, 'message', 'Los datos anteriores ya están vinculados a una cuenta.');
  end if;

  if v_user = v_legacy then
    return json_build_object('success', true, 'message', 'Esta cuenta ya es la propietaria de los datos.');
  end if;

  select failed_attempts, blocked_until
  into v_failed, v_blocked
  from public.saas_owner_claim_attempts
  where user_id = v_user;

  if v_blocked is not null and v_blocked > now() then
    return json_build_object('success', false, 'message', 'Demasiados intentos. Espera unos minutos antes de volver a probar.');
  end if;

  if coalesce(p_pin, '') !~ '^\d{4,8}$' then
    return json_build_object('success', false, 'message', 'El PIN no tiene un formato válido.');
  end if;

  select payload into v_settings
  from public.configuracion
  where user_id = v_legacy
    and id = 'main'
    and deleted_at is null
  limit 1;

  v_salt := v_settings->>'pinSalt';
  v_expected := v_settings->>'ownerPinHash';

  if v_salt is null or v_expected is null then
    return json_build_object('success', false, 'message', 'No se ha encontrado la clave de los datos actuales.');
  end if;

  v_actual := encode(digest(v_salt || ':' || p_pin, 'sha256'), 'hex');

  if v_actual <> v_expected then
    insert into public.saas_owner_claim_attempts (user_id, failed_attempts, blocked_until, updated_at)
    values (v_user, 1, null, now())
    on conflict (user_id) do update set
      failed_attempts = public.saas_owner_claim_attempts.failed_attempts + 1,
      blocked_until = case
        when public.saas_owner_claim_attempts.failed_attempts + 1 >= 5 then now() + interval '15 minutes'
        else null
      end,
      updated_at = now();
    return json_build_object('success', false, 'message', 'El PIN de Migue no es correcto.');
  end if;

  if exists (select 1 from public.jugadores where user_id = v_user)
     or exists (select 1 from public.partidos where user_id = v_user)
     or exists (select 1 from public.convocatorias where user_id = v_user)
     or exists (select 1 from public.asistencias where user_id = v_user)
     or exists (select 1 from public.configuracion where user_id = v_user) then
    return json_build_object('success', false, 'message', 'Esta cuenta ya tiene datos propios. Usa una cuenta nueva para vincular los datos anteriores.');
  end if;

  update public.jugadores set user_id = v_user where user_id = v_legacy;
  update public.partidos set user_id = v_user where user_id = v_legacy;
  update public.convocatorias set user_id = v_user where user_id = v_legacy;
  update public.asistencias set user_id = v_user where user_id = v_legacy;
  update public.configuracion set user_id = v_user where user_id = v_legacy;

  update public.codigos_promocionales
  set created_by = v_user
  where created_by = v_legacy;

  update public.perfiles set role = 'coach', updated_at = now() where id = v_legacy;
  update public.perfiles set role = 'owner', updated_at = now() where id = v_user;

  update public.saas_system_state
  set owner_claimed_by = v_user,
      claimed_at = now(),
      updated_at = now()
  where id = 'singleton';

  delete from public.saas_owner_claim_attempts where user_id = v_user;

  return json_build_object('success', true, 'message', 'Datos vinculados correctamente.');
end;
$$;

revoke all on function public.legacy_owner_claim_available() from public;
revoke all on function public.claim_legacy_owner(text) from public;
grant execute on function public.legacy_owner_claim_available() to authenticated;
grant execute on function public.claim_legacy_owner(text) to authenticated;
