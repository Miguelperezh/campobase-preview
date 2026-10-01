import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMatchState, applyCalendarAction, calculateMatchMinutes } from '../js/calendar-substitutions-v2.js';

test('solo puede salir un jugador en campo y entrar un suplente', () => {
  const state = buildMatchState([
    { playerId: 'p1', pos: 'Portero' },
    { playerId: 'p2', pos: 'Defensa' },
  ], ['p1', 'p2', 'p3']);
  const next = applyCalendarAction(state, { type: 'substitution', outId: 'p2', inId: 'p3', inPosition: 'Delantero' });
  assert.deepEqual(next.onField, ['p1', 'p3']);
  assert.deepEqual(next.bench, ['p2']);
  assert.equal(next.positions.get('p3'), 'Delantero');
  assert.throws(() => applyCalendarAction(state, { type: 'substitution', outId: 'p3', inId: 'p2' }), /campo/);
  assert.throws(() => applyCalendarAction(state, { type: 'substitution', outId: 'p2', inId: 'p1' }), /suplente/);
});

test('permite cambiar posiciones entre dos jugadores que siguen en el campo, incluido portero', () => {
  const state = buildMatchState([
    { playerId: 'p1', pos: 'Portero' },
    { playerId: 'p2', pos: 'Delantero' },
  ], ['p1', 'p2', 'p3']);
  const next = applyCalendarAction(state, { type: 'position_swap', playerAId: 'p1', playerBId: 'p2' });
  assert.equal(next.positions.get('p1'), 'Delantero');
  assert.equal(next.positions.get('p2'), 'Portero');
  assert.throws(() => applyCalendarAction(state, { type: 'position_swap', playerAId: 'p1', playerBId: 'p3' }), /campo/);
});

test('una observación solo puede registrarse para un jugador en campo', () => {
  const state = buildMatchState([{ playerId: 'p1', pos: 'Central' }], ['p1', 'p2']);
  assert.doesNotThrow(() => applyCalendarAction(state, { type: 'observation', playerId: 'p1', note: 'Correcto' }));
  assert.throws(() => applyCalendarAction(state, { type: 'observation', playerId: 'p2', note: 'No válido' }), /campo/);
});

test('un cambio de táctica se registra sin alterar quién está en campo ni los minutos', () => {
  const state = buildMatchState([
    { playerId: 'p1', pos: 'Portero' },
    { playerId: 'p2', pos: 'Central' },
  ], ['p1', 'p2', 'p3']);
  const next = applyCalendarAction(state, { type: 'tactic_change', formation: '1-2-3-1' });
  assert.deepEqual(next.onField, ['p1', 'p2']);
  assert.deepEqual(next.bench, ['p3']);
  assert.equal(next.positions.get('p2'), 'Central');
  assert.throws(() => applyCalendarAction(state, { type: 'tactic_change', formation: '9-9-9' }), /táctica válida/);
});

test('los minutos se recalculan desde los cambios reales del partido', () => {
  const lineup = [
    { playerId: 'p1', pos: 'Portero' },
    { playerId: 'p2', pos: 'Defensa' },
  ];
  const actions = [
    { type: 'tactic_change', second: 20 * 60, order: 0, formation: '1-2-3-1' },
    { type: 'substitution', second: 35 * 60, order: 1, outId: 'p2', inId: 'p3' },
    { type: 'substitution', second: 50 * 60, order: 2, outId: 'p1', inId: 'p4' },
  ];
  assert.deepEqual(calculateMatchMinutes(lineup, actions, 70 * 60), {
    p2: 35 * 60,
    p1: 50 * 60,
    p3: 35 * 60,
    p4: 20 * 60,
  });
});

test('permite sustituir a los siete jugadores en el mismo minuto', () => {
  const lineup = Array.from({ length: 7 }, (_, index) => ({ playerId: `p${index + 1}`, pos: index === 0 ? 'Portero' : `Pos${index}` }));
  const available = [...lineup.map((slot) => slot.playerId), ...Array.from({ length: 7 }, (_, index) => `s${index + 1}`)];
  let state = buildMatchState(lineup, available);
  for (let index = 0; index < 7; index += 1) {
    state = applyCalendarAction(state, { type: 'substitution', outId: `p${index + 1}`, inId: `s${index + 1}` });
  }
  assert.deepEqual(state.onField, Array.from({ length: 7 }, (_, index) => `s${index + 1}`));
  assert.equal(state.bench.length, 7);
});
