-- CampoBase 2.17.0 · bucket de vídeos de ejercicios.
-- Ejecutar UNA VEZ en Supabase > SQL Editor (requiere rol con permisos de storage).
--
-- Alternativa al bucket: crearlo desde el panel (Storage > New bucket > nombre
-- `ejercicio-videos`, público, límite 50 MB). Las políticas de abajo son obligatorias
-- en cualquier caso y solo se pueden crear por SQL.

-- 1) Bucket público con límite de 50 MB (límite global del plan Free) y solo vídeos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ejercicio-videos',
  'ejercicio-videos',
  true,
  52428800,
  array['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/mp4; codecs=avc1']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 52428800,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) Lectura pública: cualquiera con la URL puede reproducir (bucket público).
drop policy if exists "campobase_videos_lectura_publica" on storage.objects;
create policy "campobase_videos_lectura_publica" on storage.objects
  for select using (bucket_id = 'ejercicio-videos');

-- 3) Escritura con la publishable key. Mismo modelo que las tablas de CampoBase:
--    el PIN solo bloquea la interfaz, no aporta confidencialidad sin Supabase Auth.
drop policy if exists "campobase_videos_escritura_anon" on storage.objects;
create policy "campobase_videos_escritura_anon" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'ejercicio-videos');

drop policy if exists "campobase_videos_actualizacion_anon" on storage.objects;
create policy "campobase_videos_actualizacion_anon" on storage.objects
  for update to anon, authenticated using (bucket_id = 'ejercicio-videos') with check (bucket_id = 'ejercicio-videos');

drop policy if exists "campobase_videos_borrado_anon" on storage.objects;
create policy "campobase_videos_borrado_anon" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'ejercicio-videos');

-- Comprobación opcional tras ejecutar:
-- select id, name, public, file_size_limit from storage.buckets where id = 'ejercicio-videos';
