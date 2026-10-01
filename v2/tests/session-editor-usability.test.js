import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('el resumen de la sesión se presenta como lista vertical sin desplazamiento horizontal', async () => {
  const js = await read('js/session-editor-usability.js');
  assert.match(js, /#session-plan-strip\.sp-strip/);
  assert.match(js, /display: grid !important/);
  assert.match(js, /grid-template-columns: minmax\(0, 1fr\) !important/);
  assert.match(js, /overflow: visible !important/);
  assert.match(js, /white-space: normal !important/);
});

test('cada ejercicio visible permite subir y bajar reutilizando el motor de orden existente', async () => {
  const js = await read('js/session-editor-usability.js');
  assert.match(js, /↑ Subir/);
  assert.match(js, /↓ Bajar/);
  assert.match(js, /\.move-session-block\[data-index=/);
  assert.match(js, /button\.click\(\)/);
  assert.doesNotMatch(js, /moveSessionBlock\s*\(/);
});

test('el buscador y el campo de minutos recuperan foco tras el render', async () => {
  const js = await read('js/session-editor-usability.js');
  assert.match(js, /target\.id === 'sp-search'/);
  assert.match(js, /target\.matches\('\[data-sp-time\]'\)/);
  assert.match(js, /focus\(\{ preventScroll: true \}\)/);
  assert.match(js, /setSelectionRange/);
  assert.match(js, /queueMicrotask/);
});

test('los ejercicios personales usan un ID persistente compatible con la limpieza histórica', async () => {
  const js = await read('js/custom-exercise-persistence.js');
  assert.match(js, /USER_EXERCISE_PREFIX = 'pdf98-user-'/);
  assert.match(js, /buildExercise\(values/);
  assert.match(js, /recordType: 'exercise'/);
  assert.match(js, /example: false/);
  assert.match(js, /userCreated: true/);
  assert.match(js, /await put\('settings'/);
  assert.match(js, /event\.stopImmediatePropagation\(\)/);
});

test('la integración normal carga las correcciones de sesión y ejercicios personales', async () => {
  const integration = await read('js/modo-campo-integration.js');
  assert.match(integration, /session-editor-usability\.js\?v=1/);
  assert.match(integration, /custom-exercise-persistence\.js\?v=1/);
});

test('los módulos nuevos tienen sintaxis válida', () => {
  for (const path of ['js/session-editor-usability.js', 'js/custom-exercise-persistence.js']) {
    execFileSync(process.execPath, ['--check', fileURLToPath(new URL(path, root))], { stdio: 'pipe' });
  }
});
