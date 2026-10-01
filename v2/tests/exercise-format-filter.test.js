import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  FORMATO_JUEGO_OPTIONS,
  normalizeFormatoJuego,
  buildExercise,
  filterExercises,
} from '../js/training-domain.js';
import { EJERCICIOS_VALIDADOS, toCampoBaseExercise } from '../js/ejercicios-validados.js';
import { NUEVOS_EJERCICIOS_IDS } from '../js/ejercicios-nuevo-formato.js';
import { NUEVOS_LOTES_IDS } from '../js/ejercicios-nuevos-lotes.js';
import { formatSessionDurationInfo } from '../js/exercise-planning.js';

test('FORMATO_JUEGO_OPTIONS contiene las 3 opciones canónicas con valores estables', () => {
  assert.deepEqual(FORMATO_JUEGO_OPTIONS, [
    { id: 'todos', label: 'Todos' },
    { id: 'futbol_7', label: 'Fútbol 7' },
    { id: 'futbol_11', label: 'Fútbol 11' },
  ]);
});

test('normalizeFormatoJuego mapea todas las variaciones de Astra para F7 y F11', () => {
  const f7Variants = ['Fútbol 7', 'futbol 7', 'futbol7', 'fútbol 7', 'F7', 'f7', 'futbol_7', 'FÚTBOL 7'];
  for (const v of f7Variants) assert.equal(normalizeFormatoJuego(v), 'futbol_7', `Debe mapear "${v}" a "futbol_7"`);

  const f11Variants = ['Fútbol 11', 'futbol 11', 'futbol11', 'fútbol 11', 'F11', 'f11', 'futbol_11', 'FÚTBOL 11'];
  for (const v of f11Variants) assert.equal(normalizeFormatoJuego(v), 'futbol_11', `Debe mapear "${v}" a "futbol_11"`);

  assert.equal(normalizeFormatoJuego(''), 'futbol_11');
  assert.equal(normalizeFormatoJuego(null), 'futbol_11');
  assert.equal(normalizeFormatoJuego(undefined), 'futbol_11');
  assert.equal(normalizeFormatoJuego('desconocido'), 'futbol_11');
  assert.equal(normalizeFormatoJuego('Alevín'), 'futbol_11');
  assert.equal(normalizeFormatoJuego('todos'), 'todos');
});

test('el catálogo conserva los históricos, antepone los 100 nuevos lotes arriba y 12 nuevos después respetando F7/F11', () => {
  const mapped = EJERCICIOS_VALIDADOS.map(toCampoBaseExercise);
  assert.equal(mapped.length, 1060);
  assert.deepEqual(mapped.slice(0, 100).map((e) => e.id), NUEVOS_LOTES_IDS, 'Los 100 últimos introducidos deben estar en la punta de arriba');
  assert.deepEqual(mapped.slice(100, 112).map((e) => e.id), NUEVOS_EJERCICIOS_IDS, 'Los 12 del lote anterior van a continuación');

  const f11 = mapped.filter((e) => e.formato_juego === 'futbol_11');
  const f7 = mapped.filter((e) => e.formato_juego === 'futbol_7');
  const todos = mapped.filter((e) => e.formato_juego === 'todos');
  assert.equal(todos.length, 420);

  const nuevosLotes = mapped.slice(0, 100);
  for (const ex of nuevosLotes) {
    assert.ok(Array.isArray(ex.formatos_juego) && ex.formatos_juego.length > 0);
  }
});

test('buildExercise asigna por defecto futbol_11 cuando no viene especificado', () => {
  const ex = buildExercise({
    name: 'Ejercicio 14 jugadores',
    category: 'Posesión',
    players: '14 jugadores',
    material: 'Balones',
    duration: 15,
    difficulty: 'Media',
  }, { id: 'test-f7-count' });

  assert.equal(ex.formato_juego, 'futbol_11');
});

test('filtrado por formato respeta el F7/F11 según reglas en catálogo ampliado a 1060 ejercicios', () => {
  const currentExercises = EJERCICIOS_VALIDADOS.map(toCampoBaseExercise);

  const allFiltered = filterExercises(currentExercises, { formato_juego: 'todos' });
  assert.equal(allFiltered.length, 1060);
  assert.deepEqual(allFiltered.slice(0, 100).map((e) => e.id), NUEVOS_LOTES_IDS);

  const f11Filtered = filterExercises(currentExercises, { formato_juego: 'futbol_11' });
  assert.equal(f11Filtered.length, 714);

  const f7Filtered = filterExercises(currentExercises, { formato_juego: 'futbol_7' });
  assert.equal(f7Filtered.length, 766);

  const f7ByFormatKey = filterExercises(currentExercises, { format: 'futbol_7' });
  assert.equal(f7ByFormatKey.length, 766);
});

test('inyección de ejercicio Astra F7 con categoría Posesión y filtrado combinado', () => {
  const baseExercises = EJERCICIOS_VALIDADOS.map(toCampoBaseExercise);

  const astraExercise = toCampoBaseExercise({
    id: 'astra-f7-001',
    nombre: 'Rondo F7 4v3 con transiciones extra',
    categoria: 'Posesión',
    formato_juego: 'Fútbol 7',
    objetivo_principal: 'Mantener posesión y bascular en espacio de F7',
    datos_rapidos: { jugadores: '7 jugadores', duracion: '15 min' },
  });

  assert.equal(astraExercise.formato_juego, 'futbol_7');
  assert.equal(astraExercise.category, 'Posesión');

  const pool = [astraExercise, ...baseExercises];

  const f7Only = filterExercises(pool, { formato_juego: 'futbol_7' });
  assert.equal(f7Only.length, 767);
  assert.ok(f7Only.some(e => e.id === 'astra-f7-001'));

  const f11Only = filterExercises(pool, { formato_juego: 'futbol_11' });
  assert.equal(f11Only.length, 714);
  assert.ok(!f11Only.some(e => e.id === 'astra-f7-001'));

  const todosOnly = filterExercises(pool, { formato_juego: 'todos' });
  assert.equal(todosOnly.length, 1061);
  assert.ok(todosOnly.some(e => e.id === 'astra-f7-001'));

  const textF7 = filterExercises(pool, { text: 'transiciones extra', formato_juego: 'futbol_7' });
  assert.equal(textF7.length, 1);
  assert.equal(textF7[0].id, 'astra-f7-001');
});

test('index.html contiene el desplegable Formato con exactamente las 3 opciones requeridas y sin no_especificado', () => {
  const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  assert.match(html, /<select\s+name="formato_juego"/);
  assert.match(html, /value="todos"/);
  assert.match(html, /value="futbol_7"/);
  assert.match(html, /value="futbol_11"/);
  assert.doesNotMatch(html, /<option\s+value="no_especificado"/);
});

test('duración de sesión: texto exacto para entreno incompleto y completo', () => {
  const pilarRemaining = formatSessionDurationInfo(15, 75, 'Campo del Pilar');
  assert.equal(pilarRemaining.metaText, '⏱️ 15 / 75 min (quedan 60 min para completar entreno)');

  const pilarComplete = formatSessionDurationInfo(75, 75, 'Campo del Pilar');
  assert.equal(pilarComplete.metaText, '⏱️ 75 / 75 min (sesión lista para empezar)');
  assert.equal(pilarComplete.badgeText, 'Sesión lista para empezar');
  assert.equal(pilarComplete.status, 'complete');
});
