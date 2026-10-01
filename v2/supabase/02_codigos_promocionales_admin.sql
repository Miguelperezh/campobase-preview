-- FASE 2 · Códigos promocionales y regalos
-- IMPORTANTE: este archivo queda preparado en la rama aislada.
-- No modifica las tablas deportivas existentes y requiere Supabase Auth para operar.

create extension if not exists pgcrypto;

create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  club_name text,
  role text not null default 'coach' check (role in ('owner', 'coach')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.perfiles enable row level security;

create table if not exists public.codigos_promocionales (
  codigo text primary key,
  tipo text not null check (tipo in ('vitalicio_regalo', 'meses_gratis', 'descuento_porcentaje')),
  descuento_porcentaje integer not null default 0 check (descuento_porcentaje between 0 and 100),
  meses_gratis integer not null default 0 check (meses_gratis between 0 and 36),
  max_usos integer check (max_usos is null or max_usos >= 1),
  usos_actuales integer not null default 0 check (usos_actuales >= 0),
  expira_en timestamptz,
  descripcion text,
  activo boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.codigos_promocionales enable row level security;

create table if not exists public.canjes_promocionales (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  detalle jsonb,
  canjeado_en timestamptz not null default now(),
  constraint unique_canje_usuario_codigo unique (codigo, user_id),
  constraint canjes_promocionales_codigo_fkey foreign key (codigo)
    references public.codigos_promocionales(codigo) on delete restrict
);

create index if not exists canjes_promocionales_user_idx on public.canjes_promocionales(user_id);
create index if not exists canjes_promocionales_codigo_idx on public.canjes_promocionales(codigo);
alter table public.canjes_promocionales enable row level security;

create table if not exists public.suscripciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  estado text not null default 'trial',
  plan text not null default 'mensual',
  promo_code text,
  pending_discount_code text,
  pending_discount_percent integer not null default 0 check (pending_discount_percent between 0 and 100),
  expira_en timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.suscripciones enable row level security;

create or replace function public.is_app_owner()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.crear_codigo_promocional(
  p_codigo text,
  p_tipo text default 'vitalicio_regalo',
  p_descuento integer default 0,
  p_meses integer default 0,
  p_max_usos integer default 1,
  p_expira_en timestamptz default null,
  p_descripcion text default null
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_codigo text := upper(trim(coalesce(p_codigo, '')));
begin
  if not public.is_app_owner() then
    return json_build_object('success', false, 'message', 'Acceso denegado.');
  end if;

  if length(v_codigo) < 3 or length(v_codigo) > 30 or v_codigo !~ '^[A-Z0-9_-]+$' then
    return json_build_object('success', false, 'message', 'El código debe tener entre 3 y 30 caracteres y solo letras, números, guiones o guiones bajos.');
  end if;

  if p_tipo not in ('vitalicio_regalo', 'meses_gratis', 'descuento_porcentaje') then
    return json_build_object('success', false, 'message', 'Tipo de beneficio no válido.');
  end if;

  if p_tipo = 'meses_gratis' and (coalesce(p_meses, 0) < 1 or p_meses > 36) then
    return json_build_object('success', false, 'message', 'Los meses gratis deben estar entre 1 y 36.');
  end if;

  if p_tipo = 'descuento_porcentaje' and (coalesce(p_descuento, 0) < 1 or p_descuento > 100) then
    return json_build_object('success', false, 'message', 'El descuento debe estar entre 1% y 100%.');
  end if;

  if p_max_usos is not null and p_max_usos < 1 then
    return json_build_object('success', false, 'message', 'El límite de usos debe ser al menos 1 o ilimitado.');
  end if;

  if p_expira_en is not null and p_expira_en <= now() then
    return json_build_object('success', false, 'message', 'La caducidad debe estar en el futuro.');
  end if;

  if exists (select 1 from public.codigos_promocionales where codigo = v_codigo) then
    return json_build_object('success', false, 'message', 'Ya existe un código con ese nombre.');
  end if;

  insert into public.codigos_promocionales (
    codigo, tipo, descuento_porcentaje, meses_gratis, max_usos,
    usos_actuales, expira_en, descripcion, activo, created_by
  ) values (
    v_codigo,
    p_tipo,
    case when p_tipo = 'descuento_porcentaje' then p_descuento else 0 end,
    case when p_tipo = 'meses_gratis' then p_meses else 0 end,
    p_max_usos,
    0,
    p_expira_en,
    nullif(trim(coalesce(p_descripcion, '')), ''),
    true,
    auth.uid()
  );

  return json_build_object('success', true, 'message', 'Código creado correctamente.');
end;
$$;

create or replace function public.listar_codigos_promocionales()
returns setof public.codigos_promocionales
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_app_owner() then return; end if;
  return query select * from public.codigos_promocionales order by created_at desc;
end;
$$;

create or replace function public.cambiar_estado_codigo(p_codigo text, p_activo boolean)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_app_owner() then
    return json_build_object('success', false, 'message', 'Acceso denegado.');
  end if;
  update public.codigos_promocionales
  set activo = coalesce(p_activo, false)
  where codigo = upper(trim(coalesce(p_codigo, '')));
  if not found then
    return json_build_object('success', false, 'message', 'Código no encontrado.');
  end if;
  return json_build_object('success', true);
end;
$$;

create or replace function public.eliminar_codigo_promocional(p_codigo text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_codigo text := upper(trim(coalesce(p_codigo, '')));
begin
  if not public.is_app_owner() then
    return json_build_object('success', false, 'message', 'Acceso denegado.');
  end if;
  if exists (select 1 from public.canjes_promocionales where codigo = v_codigo) then
    return json_build_object('success', false, 'message', 'Este código tiene canjes registrados. Paúsalo para conservar el historial.');
  end if;
  delete from public.codigos_promocionales where codigo = v_codigo;
  if not found then
    return json_build_object('success', false, 'message', 'Código no encontrado.');
  end if;
  return json_build_object('success', true);
end;
$$;

create or replace function public.canjear_codigo_regalo(p_codigo text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_codigo public.codigos_promocionales%rowtype;
  v_user_id uuid := auth.uid();
  v_clean text := upper(trim(coalesce(p_codigo, '')));
  v_actual public.suscripciones%rowtype;
  v_expira timestamptz;
  v_plan text;
  v_mensaje text;
begin
  if v_user_id is null then
    return json_build_object('success', false, 'message', 'Debes iniciar sesión para canjear un código.');
  end if;

  if exists (select 1 from public.canjes_promocionales where codigo = v_clean and user_id = v_user_id) then
    return json_build_object('success', false, 'message', 'Ya has canjeado este código anteriormente.');
  end if;

  select * into v_codigo
  from public.codigos_promocionales
  where codigo = v_clean
    and activo = true
    and (max_usos is null or usos_actuales < max_usos)
  for update;

  if not found then
    return json_build_object('success', false, 'message', 'Código no válido, pausado o agotado.');
  end if;

  if v_codigo.expira_en is not null and v_codigo.expira_en < now() then
    return json_build_object('success', false, 'message', 'Este código ha caducado.');
  end if;

  select * into v_actual from public.suscripciones where user_id = v_user_id;

  if v_codigo.tipo = 'descuento_porcentaje'
     and coalesce(v_actual.pending_discount_percent, 0) > 0 then
    return json_build_object('success', false, 'message', 'Ya tienes un descuento pendiente. Úsalo antes de canjear otro.');
  end if;

  update public.codigos_promocionales
  set usos_actuales = usos_actuales + 1,
      activo = case
        when max_usos is null then true
        else (usos_actuales + 1 < max_usos)
      end
  where codigo = v_codigo.codigo;

  insert into public.canjes_promocionales (codigo, user_id, tipo, detalle)
  values (
    v_codigo.codigo,
    v_user_id,
    v_codigo.tipo,
    jsonb_build_object('descuento', v_codigo.descuento_porcentaje, 'meses', v_codigo.meses_gratis)
  );

  if v_codigo.tipo = 'vitalicio_regalo' then
    insert into public.suscripciones (user_id, estado, plan, promo_code, expira_en, updated_at)
    values (v_user_id, 'gift_free', 'vitalicio_regalo', v_codigo.codigo, null, now())
    on conflict (user_id) do update set
      estado = 'gift_free', plan = 'vitalicio_regalo', promo_code = excluded.promo_code,
      expira_en = null, updated_at = now();
    v_expira := null;
    v_plan := 'vitalicio_regalo';
    v_mensaje := 'Código canjeado. Tienes acceso Pro vitalicio.';

  elsif v_codigo.tipo = 'meses_gratis' then
    if v_actual.user_id is not null and v_actual.plan = 'vitalicio_regalo' and v_actual.expira_en is null then
      v_expira := null;
      v_plan := 'vitalicio_regalo';
      v_mensaje := 'Código registrado. Tu acceso vitalicio ya es superior a este beneficio.';
    else
      v_expira := greatest(now(), coalesce(v_actual.expira_en, now())) + make_interval(months => v_codigo.meses_gratis);
      v_plan := coalesce(nullif(v_actual.plan, ''), 'mensual');
      insert into public.suscripciones (user_id, estado, plan, promo_code, expira_en, updated_at)
      values (v_user_id, 'gift_free', v_plan, v_codigo.codigo, v_expira, now())
      on conflict (user_id) do update set
        estado = 'gift_free', promo_code = excluded.promo_code,
        expira_en = excluded.expira_en, updated_at = now();
      v_mensaje := 'Código canjeado. Se han añadido ' || v_codigo.meses_gratis || ' meses a tu vigencia.';
    end if;

  else
    insert into public.suscripciones (user_id, pending_discount_code, pending_discount_percent, updated_at)
    values (v_user_id, v_codigo.codigo, v_codigo.descuento_porcentaje, now())
    on conflict (user_id) do update set
      pending_discount_code = excluded.pending_discount_code,
      pending_discount_percent = excluded.pending_discount_percent,
      updated_at = now();
    v_expira := v_actual.expira_en;
    v_plan := coalesce(nullif(v_actual.plan, ''), 'mensual');
    v_mensaje := 'Descuento guardado para la próxima suscripción.';
  end if;

  return json_build_object(
    'success', true,
    'message', v_mensaje,
    'subscription', json_build_object(
      'plan', v_plan,
      'promo_code', v_codigo.codigo,
      'expira_en', v_expira,
      'pending_discount_percent', case when v_codigo.tipo = 'descuento_porcentaje' then v_codigo.descuento_porcentaje else 0 end
    )
  );
end;
$$;

revoke all on function public.is_app_owner() from public;
revoke all on function public.crear_codigo_promocional(text,text,integer,integer,integer,timestamptz,text) from public;
revoke all on function public.listar_codigos_promocionales() from public;
revoke all on function public.cambiar_estado_codigo(text,boolean) from public;
revoke all on function public.eliminar_codigo_promocional(text) from public;
revoke all on function public.canjear_codigo_regalo(text) from public;

grant execute on function public.is_app_owner() to authenticated;
grant execute on function public.crear_codigo_promocional(text,text,integer,integer,integer,timestamptz,text) to authenticated;
grant execute on function public.listar_codigos_promocionales() to authenticated;
grant execute on function public.cambiar_estado_codigo(text,boolean) to authenticated;
grant execute on function public.eliminar_codigo_promocional(text) to authenticated;
grant execute on function public.canjear_codigo_regalo(text) to authenticated;
