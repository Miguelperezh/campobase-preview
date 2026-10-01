import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { materialRequirements } from '../js/session-materials.js';

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('el zoom del visor transforma solo el medio y no instala listeners globales por ficha', async () => {
  const source = await projectFile('js/media-lightbox.js');
  assert.match(source, /el\.style\.transform = `translate3d\(/);
  assert.match(source, /box\.addEventListener\('pointermove'/);
  assert.doesNotMatch(source, /window\.addEventListener\('mousemove'/);
  assert.doesNotMatch(source, /window\.addEventListener\('mouseup'/);
  assert.match(source, /window\.__viewersPlaying/);
});

test('el material de sesión se deriva de los ejercicios sin inventar sumas', () => {
  const exercises = new Map([
    ['a', { id: 'a', name: 'A', material: '6 conos + 3 balones' }],
    ['b', { id: 'b', name: 'B', material: '6 conos + 3 balones' }],
    ['c', { id: 'c', name: 'C', material: '2 porterías + petos' }],
  ]);
  const result = materialRequirements({ blocks: [{ exerciseId: 'a' }, { exerciseId: 'b' }, { exerciseId: 'c' }] }, exercises);
  assert.deepEqual(result, [
    { material: '6 conos + 3 balones', exercises: ['A', 'B'] },
    { material: '2 porterías + petos', exercises: ['C'] },
  ]);
});

test('Sesiones mantiene selector por categorías, MP4 lazy y flujo de añadir sin bloquear el clic', async () => {
  const source = await projectFile('js/session-visual-planner.js');
  assert.match(source, /EXERCISE_CATEGORIES/);
  assert.match(source, /session-category-select/);
  assert.match(source, /session-picker-video[^>]*preload="none"[^>]*data-src|session-picker-video[^>]*data-src[^>]*preload="none"/);
  assert.match(source, /rememberPickerAnchor\(add\)/);
  assert.doesNotMatch(source, /add\.disabled\s*=\s*true/);
});

test('Asistencia enlaza sesiones por sessionId y partidos por matchId sin dejar sesiones huérfanas', async () => {
  const source = await projectFile('js/attendance-linked-sources.js');
  assert.match(source, /record\?\.sessionId === sessionId/);
  assert.match(source, /record\?\.kind === 'match' && record\.matchId === matchId/);
  assert.match(source, /sessionId: session\?\.id \|\| null/);
  assert.match(source, /matchId: match\?\.id \|\| null/);
  assert.match(source, /kind: match \? 'match' : 'training'/);
  assert.match(source, /data-attendance-source/);
  assert.match(source, /data-source-id/);
  assert.match(source, /Editar asistencia/);
  assert.match(source, /cleanupOrphanSessionAttendance/);
  assert.match(source, /remove\('trainings', record\.id\)/);
});

test('los módulos nuevos se cargan desde CampoBase y están incluidos en la caché PWA', async () => {
  const demo = await projectFile('js/demo-session.js');
  const sw = await projectFile('sw.js');
  for (const name of ['session-materials.js', 'attendance-linked-sources.js']) {
    assert.match(demo, new RegExp(name.replace('.', '\\.')));
    assert.match(sw, new RegExp(name.replace('.', '\\.')));
  }
  assert.match(sw, /media-lightbox\.js/);
  assert.match(sw, /campobase-v2\.44\.0/);
});