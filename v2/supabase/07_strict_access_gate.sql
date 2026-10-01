-- CampoBase · acceso estricto: prueba, regalo/código gratis o suscripción pagada.
-- El rol Administrador/owner por sí solo NO concede acceso comercial.
-- Las cuentas de delegado heredan el acceso del titular de su equipo.

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
  select exists (
    select 1
    from team_owner t
    join public.suscripciones s on s.user_id = t.id
    where
      (
        s.estado = 'gift_free'
        and (s.expira_en is null or s.expira_en > now())
      )
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
