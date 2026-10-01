import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Sesiones muestra Guardar y Cancelar junto a + Sesión mientras el editor está abierto', async () => {
  const source = await projectFile('js/session-top-actions.js');
  assert.match(source, /session-top-save/);
  assert.match(source, /session-top-cancel/);
  assert.match(source, /newSession\.insertAdjacentElement\('afterend', save\)/);
  assert.match(source, /save\.insertAdjacentElement\('afterend', cancel\)/);
  assert.match(source, /requestSubmit/);
  assert.match(source, /\.cancel-session/);
});

test('Material total y Observaciones generales se mueven arriba sin duplicar campos', async () => {
  const source = await projectFile('js/session-top-actions.js');
  assert.match(source, /form\.elements\.material\?\.closest\('label'\)/);
  assert.match(source, /form\.elements\.notes\?\.closest\('label'\)/);
  assert.match(source, /notesGrid\.append\(materialLabel\)/);
  assert.match(source, /notesGrid\.append\(notesLabel\)/);
  assert.match(source, /session-editor-overview/);
  assert.match(source, /Ejercicios seleccionados/);
  assert.match(source, /session-exercise-library/);
});

test('las acciones superiores respetan el estado del Guardar original y se retiran al cerrar', async () => {
  const source = await projectFile('js/session-top-actions.js');
  assert.match(source, /const disabled = !submit \|\| submit\.disabled/);
  assert.match(source, /save\.disabled !== disabled/);
  assert.match(source, /if \(!open\)[\s\S]*save\?\.remove\(\)[\s\S]*cancel\?\.remove\(\)/);
});

test('la PWA carga la versión 2458 de las acciones y layout de sesión', async () => {
  const [demo, sw, pkg] = await Promise.all([
    projectFile('js/demo-session.js'),
    projectFile('sw.js'),
    projectFile('package.json'),
  ]);
  assert.match(demo, /session-top-actions\.js\?v=2458/);
  assert.match(sw, /session-top-actions\.js\?v=2458/);
  assert.match(sw, /sessiontop-2458/);
  assert.match(pkg, /node --check js\/session-top-actions\.js/);
});
