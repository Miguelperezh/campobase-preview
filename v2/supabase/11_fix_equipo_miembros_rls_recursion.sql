-- CampoBase · evitar recursión RLS entre equipos_cuenta y equipo_miembros.
-- Causa observada en producción: "infinite recursion detected in policy for relation equipo_miembros".
-- No modifica filas de usuario; solo sustituye la comprobación recursiva por una función SECURITY DEFINER.

create or replace function public.is_team_owner(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.equipos_cuenta e
    where e.id = p_team_id
      and e.owner_user_id = auth.uid()
  );
$$;

revoke all on function public.is_team_owner(uuid) from public;
grant execute on function public.is_team_owner(uuid) to authenticated;

drop policy if exists equipo_miembros_lectura_equipo on public.equipo_miembros;
create policy equipo_miembros_lectura_equipo
on public.equipo_miembros for select to authenticated
using (
  user_id = auth.uid()
  or public.is_team_owner(equipo_id)
);
