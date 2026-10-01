import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addExerciseToSession,
  buildFlexibleTrainingSession,
  completeExercise,
  moveSessionBlock,
  removeSessionBlock,
  renderBoardDiagrams,
  sessionBlockType,
  sessionDurationStatus,
} from '../js/exercise-planning.js';

const baseExercise = {
  id: 'e-square',
  name: 'Pase y sigo en cuadrado',
  category: 'Técnica',
  duration: 12,
  players: '16 jugadores. 4 grupos de 4.',
  material: '8 conos, 4 balones y 8 petos.',
  space: 'Cuadrado de 10×10 m.',
  difficulty: 'Media',
  description: 'A pasa a B. Después del pase, A corre al cono de B. B controla y pasa a C.',
  diagram: {
    cones: [{ x: 20, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 80 }, { x: 20, y: 80 }],
    players: [{ x: 20, y: 20, n: 'A' }, { x: 80, y: 20, n: 'B' }, { x: 80, y: 80, n: 'C' }],
    ball: { x: 20, y: 20 },
    arrows: [
      { x1: 20, y1: 20, x2: 80, y2: 20, kind: 'pass' },
      { x1: 20, y1: 20, x2: 80, y2: 20, kind: 'move' },
    ],
  },
};

test('completa cualquier ejercicio con todos los campos operativos para el entrenador', () => {
  const item = completeExercise(baseExercise);
  assert.match(item.code, /^E/);
  assert.match(item.intensity, /Media/i);
  for (const field of ['objective', 'rotation', 'lookFor', 'ifBad', 'ifGood']) assert.ok(item[field], `falta ${field}`);
  for (const field of ['montage', 'steps', 'works', 'observe', 'corrections']) {
    assert.ok(Array.isArray(item[field]) && item[field].length, `falta ${field}`);
  }
  assert.match(item.montage.join(' '), /10×10|10x10/i);
  assert.ok(item.steps.every((step) => typeof step === 'string' && step.length > 5));
});

test('la pizarra es blanca y negra, respeta el cuadrado y crea una leyenda solo con símbolos usados', () => {
  const html = renderBoardDiagrams(baseExercise);
  assert.match(html, /board-boundary board-square/);
  assert.match(html, /class="board-player"/);
  assert.match(html, /class="board-cone"/);
  assert.match(html, /⚽ = balón/);
  assert.match(html, /A\/B\/C = jugadores/);
  assert.match(html, /────→ = pase/);
  assert.match(html, /- - - → = movimiento sin balón/);
  assert.doesNotMatch(html, /conducción/);
  assert.doesNotMatch(html, /#[0-9a-f]{3,6}|rgb\(/i);
});

test('dibuja también los diagramas genéricos inferidos sin listas de coordenadas', () => {
  const html = renderBoardDiagrams({
    id: 'generic', name: 'Rondo sencillo', category: 'Táctica', players: '5', material: '4 conos y 1 balón',
    duration: 10, space: 'Cuadrado de 12x12 m', description: 'Conservar el balón.', diagram: { type: 'rondo', players: 5, cones: 4, goals: 0 },
  });
  assert.match(html, /class="board-player"/);
  assert.equal((html.match(/class="board-cone"/g) || []).length, 4);
  assert.match(html, /class="board-ball"/);
});

test('añade ejercicios por categoría, permite reordenar y quitar sin mutar la sesión original', () => {
  const session = { id: 's1', blocks: [] };
  const withMain = addExerciseToSession(session, baseExercise);
  const withFinal = addExerciseToSession(withMain, { ...baseExercise, id: 'p1', category: 'Partido condicionado / Small-sided games', duration: 18 });
  assert.deepEqual(withFinal.blocks.map(({ type }) => type), ['main', 'final']);
  assert.deepEqual(session.blocks, []);
  const moved = moveSessionBlock(withFinal.blocks, 1, -1);
  assert.deepEqual(moved.map(({ exerciseId }) => exerciseId), ['p1', 'e-square']);
  assert.deepEqual(removeSessionBlock(moved, 0).map(({ exerciseId }) => exerciseId), ['e-square']);
});

test('clasifica correctamente las categorías actuales al añadir ejercicios a una sesión', () => {
  assert.equal(sessionBlockType('Calentamiento / activación'), 'warmup');
  assert.equal(sessionBlockType('Calentamiento/activación'), 'warmup');
  assert.equal(sessionBlockType('Juego reducido'), 'final');
  assert.equal(sessionBlockType('Partido condicionado / Small-sided games'), 'final');
  assert.equal(sessionBlockType('Finalización'), 'main');
});

test('calcula el aviso de sesión hasta sumar exactamente 60 minutos', () => {
  assert.deepEqual(sessionDurationStatus([{ duration: 10 }, { duration: 20 }]), {
    total: 30, difference: 30, exact: false, message: 'Faltan 30 min para llegar a 60.',
  });
  assert.equal(sessionDurationStatus([{ duration: 15 }, { duration: 20 }, { duration: 25 }]).message, 'Sesión completa: 60 min exactos.');
  assert.equal(sessionDurationStatus([{ duration: 40 }, { duration: 25 }]).message, 'Sobran 5 min: ajusta los bloques hasta 60.');
});


test('crea y edita sesiones con ejercicios de Mis ejercicios sin perder identidad ni bloques', () => {
  const mine = {
    ...baseExercise,
    id: 'pdf98-user-test',
    name: 'Mi ejercicio propio',
    category: 'Finalización',
    duration: 14,
    material: '2 balones y 4 conos',
  };
  const second = {
    ...baseExercise,
    id: 'e-second',
    name: 'Segundo ejercicio',
    category: 'Juego reducido',
    duration: 16,
  };

  let draft = addExerciseToSession({ blocks: [] }, mine);
  draft = addExerciseToSession(draft, second);

  const created = buildFlexibleTrainingSession({
    date: '2026-09-18',
    time: '18:30',
    name: 'Sesión con ejercicio propio',
    pitch: 'Campo 1',
    targetDuration: 30,
    notes: 'Primera versión',
    blocks: draft.blocks,
  }, {
    id: 'session-user-1',
    availableExerciseIds: [mine.id, second.id],
    exercises: [mine, second],
    createdAt: 100,
    now: 200,
  });

  assert.equal(created.id, 'session-user-1');
  assert.equal(created.recordType, 'trainingSession');
  assert.equal(created.createdAt, 100);
  assert.equal(created.updatedAt, 200);
  assert.equal(created.totalDuration, 30);
  assert.deepEqual(created.blocks.map(({ exerciseId }) => exerciseId), [mine.id, second.id]);

  const reordered = moveSessionBlock(created.blocks, 1, -1).map((block, index) => ({
    ...block,
    duration: index === 0 ? 18 : 12,
    notes: index === 0 ? 'Consigna editada' : block.notes,
  }));

  const edited = buildFlexibleTrainingSession({
    ...created,
    name: 'Sesión editada',
    notes: 'Segunda versión',
    blocks: reordered,
  }, {
    id: created.id,
    availableExerciseIds: [mine.id, second.id],
    exercises: [mine, second],
    createdAt: created.createdAt,
    now: 300,
  });

  assert.equal(edited.id, created.id);
  assert.equal(edited.createdAt, 100);
  assert.equal(edited.updatedAt, 300);
  assert.equal(edited.name, 'Sesión editada');
  assert.equal(edited.notes, 'Segunda versión');
  assert.equal(edited.totalDuration, 30);
  assert.deepEqual(edited.blocks.map(({ exerciseId, duration }) => [exerciseId, duration]), [
    [second.id, 18],
    [mine.id, 12],
  ]);
  assert.equal(edited.blocks[0].notes, 'Consigna editada');
});


test('no permite guardar sesiones con una fecha de calendario imposible', () => {
  assert.throws(() => buildFlexibleTrainingSession({
    date: '2026-09-31',
    targetDuration: 60,
    blocks: [],
  }, {
    id: 'invalid-date-session',
    availableExerciseIds: [],
    exercises: [],
    createdAt: 1,
    now: 2,
  }), /fecha válida/i);

  assert.doesNotThrow(() => buildFlexibleTrainingSession({
    date: '2028-02-29',
    targetDuration: 60,
    blocks: [],
  }, {
    id: 'leap-session',
    availableExerciseIds: [],
    exercises: [],
    createdAt: 1,
    now: 2,
  }));
});
