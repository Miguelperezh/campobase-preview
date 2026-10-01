import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mergeCloudRecord } from '../js/sync-core.js';
import { getActiveModule, MODULE_CONFIG } from '../js/redesign-nav.js';
import { isDelegateViewAllowed, DELEGATE_VIEW_OPTIONS } from '../js/team-access.js';

const [appCode, navCode, html, teamAccessCode] = await Promise.all([
  readFile(new URL('../js/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../js/redesign-nav.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../js/team-access.js', import.meta.url), 'utf8'),
]);

test('mergeCloudRecord conserva los permisos locales aunque la nube ya tenga un registro antiguo', () => {
  const local = {
    id: 'main',
    format: 'F7',
    delegatePin: '1234',
    delegatePermissions: ['partido', 'convocatorias', 'asistencia'],
    updatedAt: 2000,
  };
  const cloud = {
    id: 'main',
    format: 'F7',
    delegatePin: '0000',
    delegatePermissions: ['partido'],
    updatedAt: 1000,
  };
  const merged = mergeCloudRecord('settings', local, cloud);
  assert.deepEqual(merged.delegatePermissions, ['partido', 'convocatorias', 'asistencia']);
  assert.equal(merged.delegatePin, '1234');
  assert.equal(merged.updatedAt, 2000);
});

test('mergeCloudRecord no pierde permisos locales cuando ninguno tiene timestamp', () => {
  const local = {
    id: 'main',
    format: 'F7',
    delegatePermissions: ['partido', 'plantilla', 'modo-campo'],
  };
  const cloud = {
    id: 'main',
    format: 'F7',
    delegatePermissions: ['partido'],
  };
  const merged = mergeCloudRecord('settings', local, cloud);
  assert.deepEqual(merged.delegatePermissions, ['partido', 'plantilla', 'modo-campo']);
});

test('getActiveModule asocia correctamente convocatorias a partidos y plantilla a equipo', () => {
  assert.equal(getActiveModule('convocatorias'), 'partidos');
  assert.equal(getActiveModule('delegado'), 'partidos');
  assert.equal(getActiveModule('partido'), 'partidos');
  assert.equal(getActiveModule('plantilla'), 'equipo');
  assert.equal(getActiveModule('asistencia'), 'equipo');
  assert.equal(getActiveModule('cuerpo-tecnico'), 'equipo');
});

test('DELEGATE_VIEW_OPTIONS incluye modo-campo e isDelegateViewAllowed respeta equivalencia partido/delegado', () => {
  const optionsMap = new Map(DELEGATE_VIEW_OPTIONS);
  assert.ok(optionsMap.has('modo-campo'), 'DELEGATE_VIEW_OPTIONS debe incluir modo-campo');

  // Test equivalence
  globalThis.window = globalThis.window || {};
  globalThis.window.__campobaseAllowedViews = ['partido', 'convocatorias'];
  assert.equal(isDelegateViewAllowed('delegado'), true);
  assert.equal(isDelegateViewAllowed('partido'), true);
  assert.equal(isDelegateViewAllowed('convocatorias'), true);
  assert.equal(isDelegateViewAllowed('plantilla'), false);
});

test('app.js guarda permisos con updatedAt y los propaga a Supabase RPC y IndexedDB', () => {
  assert.match(appCode, /const now = Date\.now\(\);[\s\S]*?delegatePermissions: perms,[\s\S]*?updatedAt: now/);
  assert.match(appCode, /set_delegate_permissions/);
  assert.match(appCode, /viewId === 'ajustes'[\s\S]*?populateDelegateAccountForm/);
});

test('applyDelegateNavFilters no inyecta botones huérfanos de convocatoria o modo campo en la barra inferior', () => {
  assert.doesNotMatch(appCode, /appendChild\(convTab\)/);
  assert.doesNotMatch(appCode, /appendChild\(fieldTab\)/);
  assert.match(appCode, /#cb-nav-tab-convocatorias'\)\?\.remove\(\)/);
  assert.match(appCode, /#cb-nav-tab-modo-campo'\)\?\.remove\(\)/);
});

test('redesign-nav filtra subTabs y no expone Ajustes a los delegados', () => {
  assert.match(navCode, /allowedSubTabs\.filter\(\(tab\) => \{[\s\S]*?tab\.id === 'ajustes'[\s\S]*?return false;/);
  assert.match(navCode, /subTabs\.filter\(\(tab\) => \{[\s\S]*?tab\.id === 'ajustes'[\s\S]*?return false;/);
});

test('el botón de guardar en ambos formularios dice claramente Guardar permisos del delegado', () => {
  assert.match(html, /<button class="primary" type="submit" id="save-delegate-account-btn">Guardar permisos del delegado<\/button>/);
  assert.match(teamAccessCode, /id="cb-save-delegate-perms-btn">Guardar permisos del delegado<\/button>/);
});
