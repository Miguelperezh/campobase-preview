import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXERCISE_CATEGORIES,
  INITIAL_EXERCISES,
  PHASE2_V2_EXERCISES,
  PHASE2_V3_EXERCISES,
  WARMUP_TEMPLATES,
  buildExercise,
  filterExercises,
  planPhase2V2Seed,
  renderExerciseDiagram,
  buildTrainingSession,
  sortTrainingSessions,
} from '../js/training-domain.js';
import { REAL_EXERCISES, SLIDESHARE_EXERCISES } from '../js/real-exercises.js';

test('los 30 ejercicios autorizados cumplen el formato operativo de los PDF', () => {
  const exercises = [...REAL_EXERCISES, ...SLIDESHARE_EXERCISES];
  const textFields = ['code', 'name', 'category', 'players', 'material', 'space', 'intensity', 'objective', 'lookFor', 'ifBad', 'ifGood'];
  const listFields = ['steps', 'works', 'observe', 'corrections'];

  assert.deepEqual(
    [REAL_EXERCISES.length, SLIDESHARE_EXERCISES.length, exercises.length],
    [20, 10, 30],
  );
  assert.equal(new Set(exercises.map(({ id }) => id)).size, 30, 'los identificadores deben ser únicos');

  for (const exercise of exercises) {
    for (const field of textFields) {
      assert.equal(typeof exercise[field], 'string', `${exercise.id}: ${field} debe ser texto`);
      assert.ok(exercise[field].trim(), `${exercise.id}: falta ${field}`);
    }
    assert.match(exercise.code, /^[CEPT]/, `${exercise.id}: el código debe empezar por C, E, P o T`);
    assert.ok(Number.isInteger(exercise.duration) && exercise.duration > 0, `${exercise.id}: duración inválida`);
    for (const field of listFields) {
      assert.ok(Array.isArray(exercise[field]) && exercise[field].length, `${exercise.id}: falta ${field}`);
      assert.ok(exercise[field].every((value) => typeof value === 'string' && value.trim()), `${exercise.id}: ${field} contiene valores vacíos`);
    }
    assert.equal(typeof exercise.diagram, 'object', `${exercise.id}: falta diagram`);
    assert.ok(Array.isArray(exercise.diagram.players) && exercise.diagram.players.length, `${exercise.id}: diagram.players necesita coordenadas`);
    assert.ok(
      ['defenders', 'cones', 'goals', 'arrows'].some((field) => Array.isArray(exercise.diagram[field]) && exercise.diagram[field].length),
      `${exercise.id}: el diagrama necesita elementos tácticos con coordenadas`,
    );
  }
});

test('precarga 80 ejercicios completos, con porteros y diagrama de pizarra', () => {
  assert.equal(INITIAL_EXERCISES.length, 80);
  assert.equal(new Set(INITIAL_EXERCISES.map(({ id }) => id)).size, 80);
  assert.ok(PHASE2_V2_EXERCISES.length >= 44);
  assert.ok(INITIAL_EXERCISES.filter(({ category }) => category === 'Porteros').length >= 8);
  assert.deepEqual(WARMUP_TEMPLATES.map(({ duration }) => duration), [10, 15]);
  for (const exercise of INITIAL_EXERCISES) {
    assert.ok(EXERCISE_CATEGORIES.includes(exercise.category));
    for (const field of ['name', 'players', 'material', 'duration', 'description', 'variants', 'difficulty', 'space', 'diagram']) {
      assert.notEqual(exercise[field], undefined, `${exercise.name}: falta ${field}`);
    }
    assert.ok(exercise.diagram.type, `${exercise.name}: falta tipo de diagrama`);
    const svg = renderExerciseDiagram(exercise);
    assert.match(svg, /^<svg/);
    assert.match(svg, /<marker/);
    assert.match(svg, /class="diagram-player"/);
  }
});

test('la migración v2 añade solo ejercicios nuevos y completa diagramas sin pisar ediciones', () => {
  const edited = { ...INITIAL_EXERCISES[0], name: 'Mi edición', favorite: true, diagram: undefined, updatedAt: 99 };
  const custom = { id: 'custom-1', recordType: 'exercise', name: 'Personalizado', category: 'Técnica', players: '5', material: 'Balones', duration: 8, updatedAt: 50 };
  const records = planPhase2V2Seed([edited, custom], 200);
  const ids = records.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(PHASE2_V2_EXERCISES.every(({ id }) => ids.includes(id)));
  assert.equal(records.find(({ id }) => id === edited.id).name, 'Mi edición');
  assert.equal(records.find(({ id }) => id === edited.id).favorite, true);
  assert.ok(records.find(({ id }) => id === custom.id).diagram.type);
  assert.deepEqual(records.at(-1), { id: 'phase2-v2-seeded', recordType: 'migration', version: 3, createdAt: 200 });
});

test('construye ejercicios editables, conserva favoritos y valida campos obligatorios', () => {
  const exercise = buildExercise({
    name: 'Rondo corto', category: 'Táctica', players: '5', material: 'Balones, conos',
    duration: '8', description: 'Conservar el balón.', variants: 'Dos toques', difficulty: 'Media', space: '12x12 m',
  }, { id: 'e1', favorite: true, createdAt: 10, now: 20 });
  assert.deepEqual(exercise, {
    id: 'e1', name: 'Rondo corto', category: 'Táctica', formato_juego: 'futbol_11', players: '5', material: 'Balones, conos',
    duration: 8, description: 'Conservar el balón.', variants: 'Dos toques', difficulty: 'Media', space: '12x12 m',
    diagram: { type: 'rondo', players: 5, cones: 4, goals: 0 }, favorite: true, createdAt: 10, updatedAt: 20,
  });
  assert.throws(() => buildExercise({ name: '', category: 'Táctica', duration: '5' }), /nombre/i);
  assert.throws(() => buildExercise({ name: 'X', category: 'Inventada', duration: '5' }), /categoría/i);
});

test('filtra ejercicios por categoría, jugadores, material, dificultad y favoritos', () => {
  const exercises = [
    { id: '1', category: 'Técnica', players: '4-5', material: 'Aros + balón', difficulty: 'Baja', favorite: true },
    { id: '2', category: 'Táctica', players: '8', material: 'Conos', difficulty: 'Alta', favorite: false },
  ];
  assert.deepEqual(filterExercises(exercises, { category: 'Técnica', players: '5', material: 'balón', difficulty: 'Baja', favorites: true }).map(({ id }) => id), ['1']);
  assert.deepEqual(filterExercises(exercises, { material: 'conos' }).map(({ id }) => id), ['2']);
});

test('filtra ejercicios por formato F7/F11, materiales canónicos y rangos de jugadores', () => {
  const exercises = [
    { id: 'f7-1', name: 'Rondo 4v2', category: 'Pase y posesión', players: '6 jugadores', material: '8 conos + balones', difficulty: 'Media' },
    { id: 'f11-1', name: 'Partido 11v11 táctico', category: 'Táctica', players: '22 jugadores', material: '2 porterías + balones', space: 'campo fútbol 11', difficulty: 'Alta' },
    { id: 'ind-1', name: 'Agilidad individual', category: 'Coordinación y agilidad', players: '1 jugadores', material: 'escalera de agilidad', difficulty: 'Baja' },
  ];
  assert.deepEqual(filterExercises(exercises, { format: 'F7' }).map(({ id }) => id), ['f7-1', 'ind-1']);
  assert.deepEqual(filterExercises(exercises, { format: 'F11' }).map(({ id }) => id), ['f7-1', 'f11-1']);
  assert.deepEqual(filterExercises(exercises, { material: 'cono' }).map(({ id }) => id), ['f7-1']);
  assert.deepEqual(filterExercises(exercises, { material: 'escalera' }).map(({ id }) => id), ['ind-1']);
  assert.deepEqual(filterExercises(exercises, { players: '5-6' }).map(({ id }) => id), ['f7-1']);
  assert.deepEqual(filterExercises(exercises, { players: '1-2' }).map(({ id }) => id), ['ind-1']);
  assert.deepEqual(filterExercises(exercises, { players: '15+' }).map(({ id }) => id), ['f11-1']);
});

test('crea una sesión con calentamiento, dos o tres ejercicios y juego final', () => {
  const session = buildTrainingSession({
    date: '2026-09-03', name: 'Salida de balón', warmupId: 'warmup-training-10', warmupDuration: '10',
    mainExerciseIds: ['e1', 'e2'], mainDurations: ['15', '20'], mainNotes: ['Perfil corporal', 'Ritmo alto'],
    finalExerciseId: 'e3', finalDuration: '15', finalNotes: 'Máximo tres toques', material: 'Balones y petos', notes: 'Hidratación',
  }, { id: 's1', availableExerciseIds: ['warmup-training-10', 'e1', 'e2', 'e3'], createdAt: 10, now: 20 });
  assert.equal(session.blocks.length, 4);
  assert.deepEqual(session.blocks.map(({ type, duration }) => [type, duration]), [
    ['warmup', 10], ['main', 15], ['main', 20], ['final', 15],
  ]);
  assert.equal(session.totalDuration, 60);
  assert.throws(() => buildTrainingSession({ ...session, mainExerciseIds: ['e1'] }, { availableExerciseIds: ['e1'] }), /2 o 3/i);
});

test('lista sesiones con los próximos arriba por orden de fecha sin mutar la entrada', () => {
  const sessions = [
    { id: 'past', date: '2026-09-10' },
    { id: 'today', date: '2026-09-14' },
    { id: 'future', date: '2026-09-17' },
    { id: 'tomorrow', date: '2026-09-15' },
  ];
  const sorted = sortTrainingSessions(sessions, '2026-09-14');
  assert.deepEqual(sorted.map(({ id }) => id), ['today', 'tomorrow', 'future', 'past']);
  assert.deepEqual(sessions.map(({ id }) => id), ['past', 'today', 'future', 'tomorrow']);
});
