import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const db = await readFile(new URL('../js/db.js', import.meta.url), 'utf8');
const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

test('un 402 de Supabase no sustituye ni vacía la base local', () => {
  assert.match(db, /function isCloudServiceRestricted\(error\)/);
  assert.match(db, /status === 402/);
  assert.match(db, /mergeMissingLegacyRecordsIntoBoundDatabase/);
  assert.match(db, /cloudRestricted:\s*true/);
});

test('la recuperación legacy solo añade IDs ausentes y nunca limpia el destino', () => {
  assert.match(db, /existingIds = new Set/);
  assert.match(db, /targetRecords\.length > 0\) continue/);
  assert.match(db, /targetHasUserContent/);
  assert.match(db, /missing = sourceRecords\.filter/);
  assert.match(db, /store\.put\(structuredClone\(record\)\)/);
  const recoveryStart = db.indexOf('async function mergeMissingLegacyRecordsIntoBoundDatabase');
  const recoveryEnd = db.indexOf('function isCloudServiceRestricted', recoveryStart);
  const recovery = db.slice(recoveryStart, recoveryEnd);
  assert.doesNotMatch(recovery, /\.clear\(\)/);
  assert.doesNotMatch(recovery, /\.delete\(/);
});

test('la interfaz avisa de cuota restringida y sigue refrescando datos locales recuperados', () => {
  assert.match(app, /Supabase está temporalmente restringido por cuota/);
  assert.match(app, /if \(result\?\.changed !== false\)\s*\{\s*await refresh\(\);/);
});

test('se mantienen los respaldos de sincronización actuales', () => {
  assert.match(app, /setInterval\(\(\) => pollLiveState\(\)\.catch\(handleError\),\s*1000\)/);
  assert.match(app, /setInterval\(\(\) => synchronizeCloud\(\)\.catch\(handleError\),\s*10000\)/);
});
