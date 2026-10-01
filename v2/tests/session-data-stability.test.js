import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('la cola local nunca se lee antes de preparar y vincular la sesión cloud', async () => {
  const db = await projectFile('js/db.js');
  const flush = db.slice(db.indexOf('export async function flushSyncQueue'), db.indexOf('async function replaceLocalStore'));
  const prepareIndex = flush.indexOf("cloudStore.prepare");
  const queueIndex = flush.indexOf("localGetAll(SYNC_QUEUE)");
  assert.ok(prepareIndex >= 0, 'flushSyncQueue debe preparar la sesión cloud');
  assert.ok(queueIndex > prepareIndex, 'la sesión debe prepararse antes de abrir la cola local');
});

test('la base IndexedDB real se resuelve de nuevo después de recuperar el usuario SaaS', async () => {
  const db = await projectFile('js/db.js');
  const open = db.slice(db.indexOf('export function openDatabase'), db.indexOf('function requestResult'));
  assert.match(open, /if \(!demoSession\) activeDatabaseName = boundDatabaseName\(\)/);
});

test('el store cloud expone prepare para validar usuario antes de sincronizar', async () => {
  const source = await projectFile('js/supabase-client.js');
  assert.match(source, /async prepare\(\)\s*\{[\s\S]*requireBoundUser\(client\)/);
});

test('CampoBase conserva la pestaña activa durante una recarga de la misma pestaña', async () => {
  const app = await projectFile('js/app.js');
  assert.match(app, /const ACTIVE_VIEW_KEY = 'campobase\.activeView'/);
  assert.match(app, /sessionStorage\.setItem\(ACTIVE_VIEW_KEY, viewId\)/);
  assert.match(app, /params\.get\('view'\) \|\| storedActiveView\(\)/);
});

test('el acceso local de la misma pestaña puede restaurarse sin volver a pedir PIN', async () => {
  const app = await projectFile('js/app.js');
  const restore = app.slice(app.indexOf('async function restoreSessionRole'), app.indexOf('function showAuth'));
  assert.match(restore, /if \(hasSaasBinding\) return false/);
  assert.match(restore, /applyRole\(role\);\s*return true/);
  const localRestore = restore.slice(restore.indexOf('let hasSaasBinding'));
  assert.doesNotMatch(localRestore, /removeItem\(SESSION_ROLE_KEY\)/);
});

test('la sesión SaaS activa de la pestaña no se consume después de una sola recarga', async () => {
  const auth = await projectFile('js/saas-auth-ui-v2.js');
  assert.match(auth, /markBrowserSessionActive\(session\.user\.id\)/);
  assert.doesNotMatch(auth, /browserSessionIsActive\(session\.user\.id\)[\s\S]{0,120}clearBrowserSessionActive\(\)/);
});

test('el service worker no fuerza una segunda navegación de todas las pestañas', async () => {
  const sw = await projectFile('sw.js');
  assert.doesNotMatch(sw, /client\.navigate\(client\.url\)/);
  assert.match(sw, /self\.clients\.claim\(\)/);
});

test('la URL de validación no registra ni sustituye el service worker de producción', async () => {
  const app = await projectFile('js/app.js');
  assert.match(app, /isValidationPreview = location\.pathname\.endsWith\('\/validacion-estabilidad\.html'\)/);
  assert.match(app, /'serviceWorker' in navigator && !isValidationPreview/);
});

test('showView recorre colecciones con $$ y no vuelve a provocar forEach sobre un único elemento', async () => {
  const app = await projectFile('js/app.js');
  const showView = app.slice(app.indexOf('function showView'), app.indexOf('// Buscador global'));
  assert.match(showView, /\$\$\('\.view'\)\.forEach/);
  assert.match(showView, /\$\$\('\.bottom-nav button'\)\.forEach/);
  assert.doesNotMatch(showView, /(^|[^$])\$\('\.view'\)\.forEach/m);
  assert.doesNotMatch(showView, /(^|[^$])\$\('\.bottom-nav button'\)\.forEach/m);
});

test('una mutación local obsoleta se descarta si Supabase tiene una versión posterior', async () => {
  const [db, cloud] = await Promise.all([
    projectFile('js/db.js'),
    projectFile('js/supabase-client.js'),
  ]);
  assert.match(db, /cloudStore\.shouldApplyMutation\(mutation\)/);
  assert.match(db, /if \(!shouldApply\)[\s\S]*removeQueuedMutation\(mutation\.id\)[\s\S]*continue/);
  assert.match(cloud, /async shouldApplyMutation\(mutation\)/);
  assert.match(cloud, /select\('updated_at,deleted_at'\)/);
  assert.match(cloud, /localQueuedAt >= remoteUpdatedAt/);
});

test('una sincronización derivada de jugadores no puede borrar teléfonos o padres más recientes de Supabase', async () => {
  const cloud = await projectFile('js/supabase-client.js');
  for (const field of ['fatherName', 'fatherPhone', 'motherName', 'motherPhone', 'name', 'number', 'positions', 'foot', 'notes', 'photo']) {
    assert.ok(cloud.includes(`'${field}'`), `Debe proteger el campo personal ${field}`);
  }
  assert.match(cloud, /remoteProfileUpdatedAt >= localProfileUpdatedAt/);
  assert.match(cloud, /if \(Object\.hasOwn\(remotePayload, field\)\) payload\[field\] = structuredClone\(remotePayload\[field\]\)/);
});

test('un fallo de guardado cloud online no se oculta como si hubiera guardado correctamente', async () => {
  const db = await projectFile('js/db.js');
  const writeArea = db.slice(db.indexOf('export async function put(store'), db.indexOf('export async function flushSyncQueue'));
  assert.doesNotMatch(writeArea, /flushSyncQueue\(\)\.catch\(\(\) => false\)/);
  assert.match(writeArea, /if \(canUseCloud\(\)\) await flushSyncQueue\(\)/);
});

test('Actualizar app conserva sesión, vista y evita una segunda recarga del service worker', async () => {
  const app = await projectFile('js/app.js');
  const helper = app.slice(app.indexOf('async function reloadAppPreservingSession'), app.indexOf("$('#auth-reload-btn')"));
  assert.match(helper, /sessionStorage\.setItem\(ACTIVE_VIEW_KEY, activeView\)/);
  assert.match(helper, /window\._swReloading = true/);
  assert.match(helper, /registration\.update\(\)\.catch/);
  assert.match(helper, /window\.location\.reload\(\)/);
  assert.doesNotMatch(helper, /removeItem\(SESSION_ROLE_KEY\)/);
  assert.doesNotMatch(helper, /removeItem\(DEMO_SESSION_KEY\)/);

  const authHandler = app.slice(app.indexOf("$('#auth-reload-btn')"), app.indexOf('let authResetConfirming'));
  assert.match(authHandler, /await reloadAppPreservingSession\(\)/);
  assert.doesNotMatch(authHandler, /removeItem\(SESSION_ROLE_KEY\)/);

  const settingsHandler = app.slice(app.indexOf("$('#settings-reload')"), app.indexOf("$('#pin-settings-form')"));
  assert.match(settingsHandler, /await reloadAppPreservingSession\(\)/);
});

test('cada escritura intenta recuperar el vínculo SaaS antes de decidir qué IndexedDB usar', async () => {
  const db = await projectFile('js/db.js');
  assert.match(db, /async function prepareStorageBindingForWrite\(\)/);
  assert.match(db, /await cloudStore\.prepare\(\)/);
  const putArea = db.slice(db.indexOf('export async function put(store'), db.indexOf('export async function putPlayerProfile'));
  const profileArea = db.slice(db.indexOf('export async function putPlayerProfile'), db.indexOf('export async function putBatch'));
  const batchArea = db.slice(db.indexOf('export async function putBatch'), db.indexOf('export async function remove(store'));
  const removeArea = db.slice(db.indexOf('export async function remove(store'), db.indexOf('export async function flushSyncQueue'));
  for (const area of [putArea, profileArea, batchArea, removeArea]) {
    assert.match(area, /await prepareStorageBindingForWrite\(\)/);
  }
});

test('la app puede diagnosticar y recuperar una cola legacy pendiente sin borrarla antes de sincronizar', async () => {
  const db = await projectFile('js/db.js');
  assert.match(db, /export async function getSyncDiagnostics\(\)/);
  assert.match(db, /export async function recoverLegacyPendingMutations\(\)/);
  const recover = db.slice(db.indexOf('export async function recoverLegacyPendingMutations'), db.indexOf('export async function exportDatabase'));
  const flushAt = recover.indexOf('await flushSyncQueue()');
  const cleanupAt = recover.indexOf("legacyDb.transaction(SYNC_QUEUE, 'readwrite')");
  assert.ok(flushAt >= 0 && cleanupAt > flushAt, 'La cola legacy solo debe limpiarse después de sincronizar');
});

test('Ajustes muestra estado de sincronización y acciones manuales de recuperación', async () => {
  const [html, app] = await Promise.all([
    projectFile('index.html'),
    projectFile('js/app.js'),
  ]);
  assert.match(html, /id="sync-status-panel"/);
  assert.match(html, /id="sync-now"/);
  assert.match(html, /id="recover-local-pending"/);
  assert.match(app, /async function refreshSyncStatusPanel\(\)/);
  assert.match(app, /await recoverLegacyPendingMutations\(\)/);
  assert.match(app, /await synchronizeCloud\(\)/);
});

test('el PIN actual del móvil puede recuperarse desde IndexedDB si Supabase conserva uno anterior', async () => {
  const [db, app] = await Promise.all([
    projectFile('js/db.js'),
    projectFile('js/app.js'),
  ]);
  assert.match(db, /export async function getLocalPinSettingsCandidates\(\)/);
  assert.match(db, /database\.transaction\('settings', 'readonly'\).*\.get\('main'\)/s);
  assert.match(app, /const candidates = await getLocalPinSettingsCandidates\(\)/);
  assert.match(app, /PIN reconocido\. Revisa Ajustes → Sincronización/);
  assert.doesNotMatch(app, /await put\('settings', recoveredSettings\)/);
});

test('mostrar el diálogo de acceso no consume sessionRole y el login PIN restaura datos cloud inmediatamente', async () => {
  const app = await projectFile('js/app.js');
  const showAuth = app.slice(app.indexOf('async function showAuth'), app.indexOf('function ensureAuthPromptVisible'));
  assert.doesNotMatch(showAuth, /removeItem\(SESSION_ROLE_KEY\)/);

  const submit = app.slice(app.indexOf('async function submitAuth'), app.indexOf('async function changePins'));
  assert.match(submit, /if \(!isDemoDatabase\(\)\) \{\s*await synchronizeCloud\(\);\s*await refresh\(\);\s*\}/);
  assert.match(app, /window\.__campobase = \{ refresh, synchronizeCloud,/);
});

test('restaurar una sesión SaaS válida descarga Supabase antes de cerrar el diálogo', async () => {
  const auth = await projectFile('js/saas-auth-ui-v2.js');
  const unlock = auth.slice(auth.indexOf('async function unlockBoundSession'), auth.indexOf('async function handlePersistentSession'));
  assert.match(unlock, /if \(typeof app\.synchronizeCloud === 'function'\) await app\.synchronizeCloud\(\)/);
  assert.match(unlock, /if \(typeof app\.refresh === 'function'\) await app\.refresh\(\)/);
});

