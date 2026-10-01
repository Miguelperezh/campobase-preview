import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = await readFile(new URL('../supabase/09_data_audit_history.sql', import.meta.url), 'utf8');

test('la migración crea un historial protegido por RLS', () => {
  assert.match(migration, /create table if not exists public\.campobase_datos_historial/i);
  assert.match(migration, /alter table public\.campobase_datos_historial enable row level security/i);
  assert.match(migration, /auth\.uid\(\) = user_id/);
});

test('partidos convocatorias asistencias y configuración guardan versión anterior antes de update/delete', () => {
  for (const table of ['partidos', 'convocatorias', 'asistencias', 'configuracion']) {
    assert.match(migration, new RegExp(`before update or delete on public\\.${table}`, 'i'));
  }
  assert.match(migration, /to_jsonb\(OLD\)/);
});

test('la migración guarda líneas base y snapshot validado de jugadores sin reescribir los originales', () => {
  assert.match(migration, /baseline_20260919/);
  assert.match(migration, /baseline_validada_20260919/);
  assert.match(migration, /insert into public\.jugadores_historial/i);
  assert.doesNotMatch(migration, /update\s+public\.jugadores/i);
  assert.doesNotMatch(migration, /delete\s+from\s+public\.jugadores/i);
});
