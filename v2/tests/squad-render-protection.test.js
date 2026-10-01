import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, authUi, db, cloud, nav] = await Promise.all([
  readFile(new URL('../js/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../js/saas-auth-ui-v2.js', import.meta.url), 'utf8'),
  readFile(new URL('../js/db.js', import.meta.url), 'utf8'),
  readFile(new URL('../js/supabase-client.js', import.meta.url), 'utf8'),
  readFile(new URL('../js/redesign-nav.js', import.meta.url), 'utf8'),
]);

test('isUserInteracting no bloquea el repintado de datos cuando auth-dialog está abierto', () => {
  assert.match(app, /dialog\[open\]:not\(#auth-dialog\)/, 'isUserInteracting debe excluir #auth-dialog');
  assert.match(app, /!active\.closest\('#auth-dialog'\)/, 'isUserInteracting debe ignorar foco en inputs del auth-dialog');
});

test('showView plantilla ejecuta renderPlayers explícitamente', () => {
  const showViewFn = app.slice(app.indexOf('function showView('), app.indexOf('function applyGlobalSearch('));
  assert.match(showViewFn, /if \(viewId === 'plantilla'\)\s*\{\s*renderPlayers\(\);/);
  assert.match(showViewFn, /refreshPlantillaStaff\(\)/);
});

test('triggerStandardView en redesign-nav incluye caso para plantilla que repinta', () => {
  const navTrigger = nav.slice(nav.indexOf('export function triggerStandardView('), nav.indexOf('export function renderSubNav('));
  assert.match(navTrigger, /viewId === 'plantilla'/);
  assert.match(navTrigger, /renderAll\(\)/);
});

test('unlockBoundSession cierra el auth-dialog antes de refrescar y fuerza app.renderAll', () => {
  const unlockFn = authUi.slice(authUi.indexOf('async function unlockBoundSession('), authUi.indexOf('async function handlePersistentSession('));
  const closeIdx = unlockFn.indexOf('dialog.close()');
  const renderAllIdx = unlockFn.indexOf('app.renderAll()');
  assert.ok(closeIdx > 0, 'Debe llamar a dialog.close()');
  assert.ok(renderAllIdx > 0, 'Debe llamar a app.renderAll()');
  assert.ok(closeIdx < renderAllIdx, 'dialog.close() debe ejecutarse antes de renderAll()');
});

test('auth-dialog tiene listener de evento close para repintar al desbloquear', () => {
  assert.match(app, /\$\('#auth-dialog'\)\.addEventListener\('close'/);
  assert.match(app, /renderAll\(\)/);
});

test('replaceLocalStore nunca borra jugadores locales si la respuesta del servidor llega vacía', () => {
  const replaceFn = db.slice(db.indexOf('async function replaceLocalStore('), db.indexOf('async function queueInitialRecords('));
  assert.match(replaceFn, /store === 'players'/);
  assert.match(replaceFn, /localRecords\.length > 0/);
  assert.match(replaceFn, /omite vaciado local de jugadores/);
});

test('requireBoundUser tiene fallback tolerante a user.id si mi_equipo_contexto falla', () => {
  const reqUserFn = cloud.slice(cloud.indexOf('async function requireBoundUser('), cloud.indexOf('export function createCampoBaseCloudStore('));
  assert.match(reqUserFn, /let dataOwnerUserId = user\.id;/);
  assert.match(reqUserFn, /client\.rpc\('mi_equipo_contexto'\)/);
  assert.doesNotMatch(reqUserFn, /if \(teamError\) throw teamError;/);
});
