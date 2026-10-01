-- CampoBase · bloquear borrado físico desde clientes
-- 19/09/2026
-- La app usa tombstones (UPDATE con deleted_at). Un cliente autenticado no debe
-- poder hacer DELETE físico de los datos deportivos y saltarse la recuperación.

create or replace function public.bloquear_borrado_fisico_campobase()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null then
    raise exception using
      errcode = '42501',
      message = format(
        'CAMPOBASE_HARD_DELETE_BLOCKED: %s/%s. Use tombstone para conservar recuperación.',
        TG_TABLE_NAME,
        OLD.id
      );
  end if;
  return OLD;
end;
$$;

drop trigger if exists trg_bloquear_delete_jugadores on public.jugadores;
create trigger trg_bloquear_delete_jugadores
before delete on public.jugadores
for each row execute function public.bloquear_borrado_fisico_campobase();

drop trigger if exists trg_bloquear_delete_partidos on public.partidos;
create trigger trg_bloquear_delete_partidos
before delete on public.partidos
for each row execute function public.bloquear_borrado_fisico_campobase();

drop trigger if exists trg_bloquear_delete_convocatorias on public.convocatorias;
create trigger trg_bloquear_delete_convocatorias
before delete on public.convocatorias
for each row execute function public.bloquear_borrado_fisico_campobase();

drop trigger if exists trg_bloquear_delete_asistencias on public.asistencias;
create trigger trg_bloquear_delete_asistencias
before delete on public.asistencias
for each row execute function public.bloquear_borrado_fisico_campobase();

drop trigger if exists trg_bloquear_delete_configuracion on public.configuracion;
create trigger trg_bloquear_delete_configuracion
before delete on public.configuracion
for each row execute function public.bloquear_borrado_fisico_campobase();
