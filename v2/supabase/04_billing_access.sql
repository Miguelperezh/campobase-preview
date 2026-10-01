-- Fase 4: control de acceso por suscripción.
-- Mantiene al propietario con acceso permanente y bloquea datos SaaS cuando
-- la prueba o suscripción deja de estar vigente.

create or replace function public.has_app_access()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    exists (
      select 1
      from public.perfiles p
      where p.id = auth.uid()
        and p.role = 'owner'
    )
    or exists (
      select 1
      from public.suscripciones s
      where s.user_id = auth.uid()
        and (
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
        )
    );
$$;

revoke all on function public.has_app_access() from public;
grant execute on function public.has_app_access() to authenticated;

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
       using (auth.uid() = user_id and public.has_app_access())
       with check (auth.uid() = user_id and public.has_app_access())',
      t, t
    );
  end loop;
end $$;
