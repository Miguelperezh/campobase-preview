import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mergeCloudRecord } from '../js/sync-core.js';

const [appCode, cssCode, navCode] = await Promise.all([
  readFile(new URL('../js/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../styles-redesign.css', import.meta.url), 'utf8'),
  readFile(new URL('../js/redesign-nav.js', import.meta.url), 'utf8'),
]);

test('mergeCloudRecord conserva delegatePermissions y delegatePin para que la nube no los borre', () => {
  const local = {
    id: 'main',
    format: 'F7',
    delegatePin: '1234',
    delegatePermissions: ['partido', 'plantilla', 'modo-campo', 'convocatorias'],
  };
  const cloud = {
    id: 'main',
    format: 'F7',
  };
  const merged = mergeCloudRecord('settings', local, cloud);
  assert.deepEqual(merged.delegatePermissions, ['partido', 'plantilla', 'modo-campo', 'convocatorias']);
  assert.equal(merged.delegatePin, '1234');
});

test('getDelegatePermissions y refresh usan respaldo en localStorage para máxima resiliencia', () => {
  assert.match(appCode, /localStorage\.getItem\('campobase\.delegatePermissions'\)/);
  assert.match(appCode, /localStorage\.setItem\('campobase\.delegatePermissions'/);
});

test('en delegado multi-vista, #delegado se oculta limpiamente al ver plantilla o convocatorias', () => {
  assert.match(cssCode, /body\.delegate-mode\.delegate-multi-view #delegado\.view:not\(\.active\)/);
  assert.match(cssCode, /body\.delegate-mode\.delegate-multi-view #plantilla\.view:not\(\.active\)/);
  assert.match(cssCode, /body\.delegate-mode\.delegate-multi-view #convocatorias\.view:not\(\.active\)/);
});

test('observadores de redesign-nav están optimizados para evitar lentitud y recargas innecesarias', () => {
  // Solo reacciona a cambios de vistas en el DOM de la app
  assert.match(navCode, /const hasViewChange = mutations\.some\(\(m\) => m\.target\?\.classList\?\.contains\('view'\)\);/);

  // Solo reacciona a diálogos y overlays reales para el botón cerrar inferior
  assert.match(navCode, /nodeName === 'DIALOG'/);
});

test('triggerStandardView y bottom-nav actualizan estado activo y renderizan convocatorias y delegado', () => {
  assert.match(navCode, /window\.__campobase(?:\?\.|\.)renderCallups/);
  assert.match(navCode, /window\.__campobase(?:\?\.|\.)renderDelegate/);
  assert.match(navCode, /window\.triggerStandardView = triggerStandardView;/);
  assert.match(appCode, /window\.__campobase = \{[\s\S]*?syncDelegateModeDom/);
});
