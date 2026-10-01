import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const planner = fs.readFileSync(new URL('../js/session-planner-ui.js', import.meta.url), 'utf8');
const viewer = fs.readFileSync(new URL('../js/ejercicio-viewer.js', import.meta.url), 'utf8');
const viewMode = fs.readFileSync(new URL('../js/exercise-view-mode-ui.js', import.meta.url), 'utf8');

test('los ejercicios creados por el entrenador sobreviven refresh y aparecen en Mis ejercicios', () => {
  assert.match(index, /data-exercise-library-mode="mine"/);
  assert.match(index, /Mis ejercicios/);
  assert.match(app, /const validatedIds = new Set\(EJERCICIOS_VALIDADOS/);
  assert.match(app, /persistedExerciseRecords = settingRecords\.filter/);
  assert.match(app, /userCreated: true/);
  assert.match(app, /source: 'personal'/);
  assert.match(app, /USER_EXERCISE_PREFIX = 'pdf98-user-'/);
  assert.match(app, /USER_EXERCISE_PREFIX.*uid|uid.*USER_EXERCISE_PREFIX/s);
  assert.match(app, /userCreated !== true/);
  assert.match(app, /setExerciseLibraryMode\('mine'\)/);
});

test('el selector de sesiones recibe metadatos de ejercicios personales', () => {
  assert.match(app, /data-user-created=/);
  assert.match(app, /data-category=/);
  assert.match(app, /data-formato-juego=/);
  assert.match(app, /data-material=/);
  assert.match(app, /data-difficulty=/);
});

test('crear y editar sesiones usa el mismo builder y confirma el guardado', () => {
  assert.match(index, /id="new-session"/);
  assert.match(app, /function sessionBuilder\(editId = ''/);
  assert.match(app, /if \(target\.matches\('\.edit-session'\)\)/);
  assert.match(app, /target\.closest\('dialog'\)\?\.close\(\)/);
  assert.match(app, /toast\(existing \? 'Sesión actualizada\.' : 'Sesión creada\.'\)/);
  assert.match(app, /sessionBlockType\(exercise\.category\)/);
  assert.match(app, /Editar sesión/);
});

test('la PWA fuerza la actualización de esta corrección', () => {
  assert.match(sw, /force2508-final-preview-own-sessions/);
  assert.match(app, /20260927-v66-real-calendar-dates/);
});


test('Mis ejercicios también está disponible en el filtro Categoría de la biblioteca', () => {
  assert.match(app, /<option value="__mine__">Mis ejercicios<\/option>/);
  assert.match(app, /mineCategorySelected = filters\.category === '__mine__'/);
  assert.match(app, /exerciseLibraryMode === 'mine' \|\| mineCategorySelected/);
});


test('Mis ejercicios aparece y filtra dentro del selector de ejercicios de Sesiones', () => {
  assert.match(planner, /const isMine = card\.dataset\.userCreated === '1'/);
  assert.match(planner, /<option value="__mine__"[^>]*>Mis ejercicios<\/option>/);
  assert.match(planner, /category === '__mine__' && !item\.isMine/);
});

test('el orden visual del nuevo formato es preview, MP4 gráfico y vídeo humano', () => {
  const previewAt = viewer.indexOf('data-media-order="1"');
  const graphicAt = viewer.indexOf('<!-- 2. MP4 gráfico de fichas / animación -->');
  const humanAt = viewer.indexOf('data-media-order="3"');
  assert.ok(previewAt >= 0, 'Debe existir la preview');
  assert.ok(graphicAt > previewAt, 'El MP4 gráfico debe ir después de la preview');
  assert.ok(humanAt > graphicAt, 'El vídeo humano debe ir después del MP4 gráfico');
  assert.doesNotMatch(viewMode, /\.view-mode-reduced \.real-video-block,/);
});
