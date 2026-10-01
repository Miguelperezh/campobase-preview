import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const versions = await readFile(new URL('../supabase/10_immutable_versions_and_stale_write_guard.sql', import.meta.url), 'utf8');
const deletes = await readFile(new URL('../supabase/11_block_client_hard_deletes.sql', import.meta.url), 'utf8');

test('cada tabla deportiva crítica tiene versionado INSERT UPDATE DELETE', () => {
  assert.match(versions, /create table if not exists public\.campobase_versiones_datos/i);
  assert.match(versions, /after insert or update or delete on public\.jugadores/i);
  for (const table of ['partidos', 'convocatorias', 'asistencias', 'configuracion']) {
    assert.match(versions, new RegExp(`after insert or update or delete on public\\.${table}`, 'i'));
  }
});

test('el historial es de solo lectura para clientes y queda protegido por RLS', () => {
  assert.match(versions, /enable row level security/i);
  assert.match(versions, /auth\.uid\(\) = user_id/);
  assert.match(versions, /revoke insert, update, delete, truncate on public\.campobase_versiones_datos from anon, authenticated/i);
});

test('una escritura con updated_at antiguo queda bloqueada en servidor', () => {
  assert.match(versions, /if NEW\.updated_at < OLD\.updated_at then/i);
  assert.match(versions, /CAMPOBASE_STALE_WRITE/);
  for (const table of ['jugadores', 'partidos', 'convocatorias', 'asistencias', 'configuracion']) {
    assert.match(versions, new RegExp(`before update on public\\.${table}`, 'i'));
  }
});

test('campos personales de jugadores tienen una segunda barrera de servidor', () => {
  for (const field of ['name','number','positions','foot','notes','fatherName','fatherPhone','motherName','motherPhone','photo','profileUpdatedAt']) {
    assert.ok(versions.includes(`'${field}'`), `Falta proteger ${field}`);
  }
  assert.match(versions, /new_profile_updated <= old_profile_updated/i);
});

test('clientes autenticados no pueden hacer DELETE físico de datos deportivos', () => {
  assert.match(deletes, /CAMPOBASE_HARD_DELETE_BLOCKED/);
  for (const table of ['jugadores', 'partidos', 'convocatorias', 'asistencias', 'configuracion']) {
    assert.match(deletes, new RegExp(`before delete on public\\.${table}`, 'i'));
  }
});
