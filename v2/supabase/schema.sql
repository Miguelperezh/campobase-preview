-- CampoBase 1.6.0 · esquema Supabase para un solo equipo.
-- Ejecutar una vez en Supabase > SQL Editor.
--
-- MODELO: cada fila conserva el documento que ya usa CampoBase en `payload`.
-- Esto mantiene compatibilidad con IndexedDB y evita duplicar lógica entre nube y
-- caché. Dentro de los documentos:
--   jugadores: ficha, posiciones, notas, minutos, incidencias y ratingHistory.
--   partidos: calendario, marcador (goalsFor/goalsAgainst), goleadores (goals),
--             tarjetas (cards), lesiones (injuries), puntuaciones (ratings),
--             comentarios (comments), cambios y minutos.
--   convocatorias: seleccionados, excluidos, motivos y objetivos de minutos.
--   asistencias: actividad, fecha, comentarios y lista attendance por jugador.
--   configuracion: formato, partido en vivo y hashes/sal de los dos PIN.
--
-- SEGURIDAD: las políticas permiten CRUD con la publishable key. RLS está activo,
-- pero no aporta confidencialidad sin Supabase Auth. El PIN solo bloquea la interfaz.

create table if not exists public.jugadores (
  id text primary key,
  payload jsonb,
  updated_at bigint not null,
  deleted_at bigint,
  constraint jugadores_payload_valido check (
    (deleted_at is null and jsonb_typeof(payload) = 'object') or
    (deleted_at is not null and payload is null)
  )
);

create table if not exists public.partidos (
  id text primary key,
  payload jsonb,
  updated_at bigint not null,
  deleted_at bigint,
  constraint partidos_payload_valido check (
    (deleted_at is null and jsonb_typeof(payload) = 'object') or
    (deleted_at is not null and payload is null)
  )
);

create table if not exists public.convocatorias (
  id text primary key,
  payload jsonb,
  updated_at bigint not null,
  deleted_at bigint,
  constraint convocatorias_payload_valido check (
    (deleted_at is null and jsonb_typeof(payload) = 'object') or
    (deleted_at is not null and payload is null)
  )
);

create table if not exists public.asistencias (
  id text primary key,
  payload jsonb,
  updated_at bigint not null,
  deleted_at bigint,
  constraint asistencias_payload_valido check (
    (deleted_at is null and jsonb_typeof(payload) = 'object') or
    (deleted_at is not null and payload is null)
  )
);

create table if not exists public.configuracion (
  id text primary key,
  payload jsonb,
  updated_at bigint not null,
  deleted_at bigint,
  constraint configuracion_payload_valido check (
    (deleted_at is null and jsonb_typeof(payload) = 'object') or
    (deleted_at is not null and payload is null)
  )
);

create index if not exists jugadores_updated_at_idx on public.jugadores (updated_at);
create index if not exists partidos_updated_at_idx on public.partidos (updated_at);
create index if not exists convocatorias_updated_at_idx on public.convocatorias (updated_at);
create index if not exists asistencias_updated_at_idx on public.asistencias (updated_at);
create index if not exists configuracion_updated_at_idx on public.configuracion (updated_at);

alter table public.jugadores enable row level security;
alter table public.partidos enable row level security;
alter table public.convocatorias enable row level security;
alter table public.asistencias enable row level security;
alter table public.configuracion enable row level security;

grant select, insert, update, delete on public.jugadores to anon, authenticated;
grant select, insert, update, delete on public.partidos to anon, authenticated;
grant select, insert, update, delete on public.convocatorias to anon, authenticated;
grant select, insert, update, delete on public.asistencias to anon, authenticated;
grant select, insert, update, delete on public.configuracion to anon, authenticated;

drop policy if exists "campobase_publico_jugadores" on public.jugadores;
create policy "campobase_publico_jugadores" on public.jugadores
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "campobase_publico_partidos" on public.partidos;
create policy "campobase_publico_partidos" on public.partidos
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "campobase_publico_convocatorias" on public.convocatorias;
create policy "campobase_publico_convocatorias" on public.convocatorias
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "campobase_publico_asistencias" on public.asistencias;
create policy "campobase_publico_asistencias" on public.asistencias
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "campobase_publico_configuracion" on public.configuracion;
create policy "campobase_publico_configuracion" on public.configuracion
  for all to anon, authenticated using (true) with check (true);

-- Comprobación opcional tras ejecutar:
-- select schemaname, tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
--   and tablename in ('jugadores','partidos','convocatorias','asistencias','configuracion');
