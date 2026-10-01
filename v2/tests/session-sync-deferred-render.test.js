import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('la sincronización recibida durante una interacción móvil se repinta al terminar la interacción', async () => {
  const source = await projectFile('js/app.js');

  assert.match(source, /let deferredRenderTimer = null;/);
  assert.match(source, /let deferredRenderRequested = false;/);
  assert.match(source, /function scheduleDeferredRender\(\)/);
  assert.match(source, /if \(isUserInteracting\(\)\) \{[\s\S]*setTimeout\(tryRender, 250\)/);
  assert.match(source, /deferredRenderRequested = false;[\s\S]*renderAll\(\);/);
  assert.match(source, /function renderOrDefer\(force = false\)/);
  assert.match(source, /renderOrDefer\(force\);/);
});

test('un refresh forzado cancela el repintado aplazado antes de renderizar', async () => {
  const source = await projectFile('js/app.js');

  assert.match(source, /if \(force \|\| !isUserInteracting\(\)\) \{/);
  assert.match(source, /window\.clearTimeout\(deferredRenderTimer\);/);
  assert.match(source, /deferredRenderTimer = null;/);
  assert.match(source, /renderAll\(\);/);
});


test('la reconciliación IndexedDB mantiene lecturas y escrituras atómicas para Safari/iOS', async () => {
  const source = await projectFile('js/db.js');
  const start = source.indexOf('async function replaceLocalStore');
  const end = source.indexOf('async function queueInitialRecords');
  const fn = source.slice(start, end);

  assert.match(fn, /db\.transaction\(\[store, SYNC_QUEUE\], 'readwrite'\)/);
  assert.match(fn, /localRequest\.onsuccess/);
  assert.match(fn, /pendingRequest\.onsuccess/);
  assert.match(fn, /reconcileAndWrite\(\)/);
  assert.match(fn, /objectStore\.clear\(\)/);
  assert.doesNotMatch(fn, /await Promise\.all/, 'no debe ceder el control entre getAll y clear\/put dentro de la transacción');
});
