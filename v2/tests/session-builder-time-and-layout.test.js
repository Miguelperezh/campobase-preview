import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildFlexibleTrainingSession, formatSessionDurationInfo } from '../js/exercise-planning.js';

const appSource = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const plannerSource = fs.readFileSync(new URL('../js/session-planner-ui.js', import.meta.url), 'utf8');
const visualPlannerSource = fs.readFileSync(new URL('../js/session-visual-planner.js', import.meta.url), 'utf8');
const indexSource = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const stylesSource = fs.readFileSync(new URL('../styles-redesign.css', import.meta.url), 'utf8');

test('buildFlexibleTrainingSession guarda la hora de la sesión y el tipo', () => {
  const session = buildFlexibleTrainingSession({
    date: '2026-09-15',
    time: '18:30',
    name: 'Sesión de finalización',
    targetDuration: 75,
    sessionKind: 'match-warmup',
    blocks: [{ type: 'warmup', exerciseId: 'ex-1', duration: 15 }],
  }, {
    id: 'test-session-1',
    availableExerciseIds: ['ex-1'],
    createdAt: 1000,
    now: 2000,
  });

  assert.equal(session.time, '18:30');
  assert.equal(session.sessionKind, 'match-warmup');
  assert.equal(session.date, '2026-09-15');
});

test('el formulario de sesión incluye selector de hora 24h y cierra la fila antes de la lista', () => {
  assert.match(appSource, /time24Markup\('time'/);
  assert.match(appSource, /session-datetime-row/);
  assert.match(stylesSource, /#session-form \.button-row/);
  assert.match(stylesSource, /max-height: 56px !important/);
});

test('el modal de añadir ejercicio a sesión incluye selector de hora 24h', () => {
  assert.match(indexSource, /name="timeHour"/);
  assert.match(indexSource, /name="timeMinute"/);
  assert.match(appSource, /composeTime24\(values\.timeHour, values\.timeMinute/);
});

test('las tarjetas del catálogo de sesión y del visual planner no concatenan códigos técnicos al nombre', () => {
  assert.doesNotMatch(appSource, /session-exercise-picker[\s\S]*?\$\{item\.code/);
  assert.doesNotMatch(visualPlannerSource, /exercise-card session-generic-detail[\s\S]*?\$\{item\.code/);
});

test('session-planner-ui usa las portadas de la biblioteca canónica v2 y campos avanzados', () => {
  assert.match(plannerSource, /item\?\.media\?\.preview/);
  assert.match(plannerSource, /item\?\.media\?\.video/);
  assert.match(plannerSource, /item\?\.que_se_trabaja/);
  assert.match(plannerSource, /item\?\.objetivo_principal/);
});

test('las sesiones de la lista tienen botón interactivo de desplegar/replegar y muestran la hora', () => {
  assert.match(appSource, /toggle-session-blocks/);
  assert.match(appSource, /session-plan-collapsible/);
  assert.match(appSource, /session\.time \? ` · ⏰ \$\{session\.time\}` : ''/);
});

test('el detalle de sesión muestra cada ejercicio con miniatura, datos limpios y botón para ver con MP4', () => {
  assert.match(appSource, /session-block-card/);
  assert.match(appSource, /session-block-preview/);
  assert.match(appSource, /🎬 Ver ejercicio con MP4/);
  assert.match(appSource, /showExerciseDetail/);
});

test('buildFlexibleTrainingSession guarda el campo de entrenamiento (pitch) y calcula material automáticamente', () => {
  const session = buildFlexibleTrainingSession({
    date: '2026-09-15',
    time: '17:00',
    pitch: 'Campo Pepe Gonçalvez',
    name: 'Sesión en Pepe Gonçalvez',
    targetDuration: 60,
    blocks: [
      { type: 'warmup', exerciseId: 'ex-1', duration: 15 },
      { type: 'main', exerciseId: 'ex-2', duration: 30 },
    ],
  }, {
    id: 'session-pitch-test',
    availableExerciseIds: ['ex-1', 'ex-2'],
    exercises: [
      { id: 'ex-1', name: 'Calentamiento con conos', materiales: [{ nombre: 'cono', cantidad: 6 }] },
      { id: 'ex-2', name: 'Rondo con balón', materiales: [{ nombre: 'balón de fútbol', cantidad: 2 }, { nombre: 'cono', cantidad: 4 }] },
    ],
  });

  assert.equal(session.pitch, 'Campo Pepe Gonçalvez');
  assert.equal(session.material, '2 balones de fútbol, 10 conos');
});

test('el formulario de sesión y el diálogo de añadir ejercicio permiten introducir el campo de entrenamiento', () => {
  assert.match(appSource, /name="pitch"/);
  assert.match(indexSource, /name="pitch"/);
  assert.match(stylesSource, /\.session-details-row/);
});

test('las tarjetas de sesión muestran el campo y la duración claramente en la línea meta con tiempo programado y restante', () => {
  assert.match(appSource, /session\.pitch \? ` · 🏟️ \$\{escapeHtml\(session\.pitch\)\}` : ''/);
  assert.match(appSource, /durationInfo\.metaText/);
  assert.match(appSource, /Material total \(calculado automáticamente/);
});

test('formatSessionDurationInfo calcula minutos creados, programados y restantes', () => {
  // Caso exacto del usuario: 75 min programados, 15 min creados -> quedan 60 min
  const infoRemaining = formatSessionDurationInfo(15, 75);
  assert.equal(infoRemaining.total, 15);
  assert.equal(infoRemaining.target, 75);
  assert.equal(infoRemaining.diff, 60);
  assert.equal(infoRemaining.metaText, '⏱️ 15 / 75 min (quedan 60 min para completar entreno)');
  assert.equal(infoRemaining.pillText, '15 / 75 min');
  assert.equal(infoRemaining.badgeText, 'Quedan 60 min');
  assert.equal(infoRemaining.planText, '⏱️ 15 de 75 min programados (quedan 60 min para completar entreno)');
  assert.equal(infoRemaining.status, 'remaining');

  // Caso completa: 60 min creados de 60 min programados
  const infoComplete = formatSessionDurationInfo(60, 60);
  assert.equal(infoComplete.metaText, '⏱️ 60 / 60 min (sesión lista para empezar)');
  assert.equal(infoComplete.pillText, '60 / 60 min');
  assert.equal(infoComplete.badgeText, 'Sesión lista para empezar');
  assert.equal(infoComplete.status, 'complete');

  // Caso sobrante: 70 min creados de 60 min programados
  const infoExceeded = formatSessionDurationInfo(70, 60);
  assert.equal(infoExceeded.metaText, '⏱️ 70 / 60 min (sobran 10 min)');
  assert.equal(infoExceeded.pillText, '70 / 60 min');
  assert.equal(infoExceeded.badgeText, 'Sobran 10 min');
  assert.equal(infoExceeded.status, 'exceeded');

  // Con lista de bloques
  const infoBlocks = formatSessionDurationInfo([{ duration: 15 }, { duration: 30 }], 60);
  assert.equal(infoBlocks.total, 45);
  assert.equal(infoBlocks.metaText, '⏱️ 45 / 60 min (quedan 15 min para completar entreno)');
});

test('sesiones existentes sin targetDuration asignan 75 min para Pilar y 60 min por defecto', () => {
  assert.match(appSource, /includes\('pilar'\)\)\s*\?\s*75\s*:\s*60/);
});

test('formatSessionDurationInfo con pitch Pilar y sin targetDuration usa 75 min y calcula minutos restantes', () => {
  const infoPilar = formatSessionDurationInfo(15, null, 'Campo del Pilar');
  assert.equal(infoPilar.total, 15);
  assert.equal(infoPilar.target, 75);
  assert.equal(infoPilar.diff, 60);
  assert.equal(infoPilar.metaText, '⏱️ 15 / 75 min (quedan 60 min para completar entreno)');
  assert.equal(infoPilar.pillText, '15 / 75 min');
  assert.equal(infoPilar.badgeText, 'Quedan 60 min');
});

test('buildFlexibleTrainingSession permite guardar una sesión sin ejercicios para enviar fechas a padres', () => {
  const session = buildFlexibleTrainingSession({
    date: '2026-09-22',
    time: '18:00',
    pitch: 'Campo Pepe Gonçalvez',
    name: 'Entrenamiento de martes',
    targetDuration: 60,
    blocks: [],
  }, {
    id: 'session-empty-test',
    availableExerciseIds: [],
    exercises: [],
    createdAt: 1000,
    now: 2000,
  });

  assert.equal(session.id, 'session-empty-test');
  assert.equal(session.date, '2026-09-22');
  assert.equal(session.time, '18:00');
  assert.equal(session.name, 'Entrenamiento de martes');
  assert.equal(session.pitch, 'Campo Pepe Gonçalvez');
  assert.equal(session.totalDuration, 0);
  assert.deepEqual(session.blocks, []);
});

test('buildFlexibleTrainingSession permite guardar sesiones que exceden el tiempo objetivo sin bloquear', () => {
  const session = buildFlexibleTrainingSession({
    date: '2026-09-24',
    time: '17:30',
    name: 'Sesión intensiva',
    targetDuration: 60,
    blocks: [
      { type: 'warmup', exerciseId: 'ex-1', duration: 35 },
      { type: 'main', exerciseId: 'ex-2', duration: 45 },
    ],
  }, {
    id: 'session-exceeded-test',
    availableExerciseIds: ['ex-1', 'ex-2'],
    exercises: [],
    createdAt: 1000,
    now: 2000,
  });

  assert.equal(session.totalDuration, 80);
  assert.equal(session.targetDuration, 60);
  assert.equal(session.blocks.length, 2);
});

test('el formulario de sesión no deshabilita el botón de guardar por falta de bloques', () => {
  assert.doesNotMatch(appSource, /<button class="primary" type="submit" \$\{sessionDraftBlocks\.length \? '' : 'disabled'\}>Guardar sesión<\/button>/);
  assert.match(appSource, /<button class="primary" type="submit">Guardar sesión<\/button>/);
});

