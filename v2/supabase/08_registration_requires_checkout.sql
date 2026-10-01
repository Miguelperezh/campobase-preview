-- CampoBase · nuevas altas pendientes de configurar Stripe.
-- La cuenta se crea, pero no obtiene acceso hasta completar Checkout
-- o canjear un código gratuito válido.

alter table public.suscripciones
  add column if not exists cancel_at_period_end boolean not null default false;

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
  on conflict (owner_user_id) do update
    set updated_at = timezone('utc', now())
  returning id into v_team_id;

  insert into public.equipo_miembros(equipo_id, user_id, role, view_permissions)
  values (v_team_id, new.id, 'coach', '[]'::jsonb)
  on conflict (user_id) do nothing;

  insert into public.suscripciones(
    user_id, estado, plan, dias_prueba, expira_en, cancel_at_period_end
  )
  values (
    new.id, 'pending_payment', 'mensual', 14, now() + interval '14 days', false
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;
