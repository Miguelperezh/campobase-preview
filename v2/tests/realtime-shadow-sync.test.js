import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const supabaseClient = await readFile(new URL('../js/supabase-client.js', import.meta.url), 'utf8');

test('Realtime se añade como segunda vía sin retirar los respaldos actuales', () => {
  assert.match(supabaseClient, /CAMPOBASE_REALTIME_TABLES\s*=\s*Object\.freeze\(Object\.values\(CLOUD_TABLES\)\)/);
  assert.match(supabaseClient, /'postgres_changes'/);
  assert.match(supabaseClient, /event:\s*'\*',\s*schema:\s*'public',\s*table/);
  assert.match(app, /ensureRealtimeSubscription/);
  assert.match(app, /setInterval\(\(\) => synchronizeCloud\(\)\.catch\(handleError\),\s*10000\)/);
  assert.match(app, /setInterval\(\(\) => pollLiveState\(\)\.catch\(handleError\),\s*1000\)/);
});

test('los eventos Realtime se agrupan antes de usar la sincronización segura existente', () => {
  assert.match(app, /function scheduleRealtimeCloudSync\(\)/);
  assert.match(app, /window\.setTimeout\([\s\S]*synchronizeCloud\(\)\.catch\(handleError\);[\s\S]*250\)/);
  assert.match(app, /subscribeToChanges\([\s\S]*scheduleRealtimeCloudSync/);
});

test('si Realtime falla se conserva explícitamente el polling de seguridad', () => {
  assert.match(app, /Realtime no disponible; se mantiene el polling de seguridad/);
  assert.match(app, /No se pudo iniciar Realtime; se mantiene el polling de seguridad/);
});
