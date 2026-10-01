import test from 'node:test';
import assert from 'node:assert/strict';
import { describeMoment, plannedMinutes, validLineup } from '../js/match-moments.js';

const initial = { minute: 0, formation: '1-3-2-1', team: [
  { pos: 'Portero', playerId: 'gk' }, { pos: 'Central', playerId: 'y' },
  { pos: 'Lateral derecho', playerId: 'z' }, { pos: 'Lateral izquierdo', playerId: 'a' },
  { pos: 'Medio derecho', playerId: 'b' }, { pos: 'Medio izquierdo', playerId: 'c' },
  { pos: 'Delantero', playerId: 'd' },
] };
const minute15 = { minute: 15, formation: '1-3-2-1', team: [
  { pos: 'Portero', playerId: 'gk' }, { pos: 'Central', playerId: 'z' },
  { pos: 'Lateral derecho', playerId: 'x' }, { pos: 'Lateral izquierdo', playerId: 'a' },
  { pos: 'Medio derecho', playerId: 'b' }, { pos: 'Medio izquierdo', playerId: 'c' },
  { pos: 'Delantero', playerId: 'd' },
] };

test('un momento admite que entre X por Y y Z cambie de puesto a la vez', () => {
  const change = describeMoment(initial, minute15);
  assert.deepEqual(change.outIds, ['y']);
  assert.deepEqual(change.inIds, ['x']);
  assert.deepEqual(change.pairs, [{ inId: 'x', outId: 'y' }]);
  assert.deepEqual(change.moved, [{ playerId: 'z', position: 'Central' }]);
  assert.equal(validLineup(minute15.team, ['gk', 'x', 'y', 'z', 'a', 'b', 'c', 'd']), true);
  assert.equal(validLineup([{ ...minute15.team[0], playerId: 'x' }, ...minute15.team.slice(1)], ['gk', 'x', 'y', 'z', 'a', 'b', 'c', 'd']), false);
});

test('dos entradas se emparejan con su salida aunque otro titular cambie de posición', () => {
  const next = { ...minute15, team: minute15.team.map((slot) => ({ ...slot })) };
  next.team[3].playerId = 'w';
  next.team[5].playerId = 'a';
  const change = describeMoment(initial, next);
  assert.deepEqual(change.pairs, [{ inId: 'x', outId: 'y' }, { inId: 'w', outId: 'c' }]);
  assert.deepEqual(change.moved, [
    { playerId: 'z', position: 'Central' },
    { playerId: 'a', position: 'Medio izquierdo' },
  ]);
});

test('los minutos previstos siguen las alineaciones de cada tramo', () => {
  const minutes = plannedMinutes([initial, minute15]);
  assert.equal(minutes.y, 15);
  assert.equal(minutes.x, 55);
  assert.equal(minutes.z, 70);
});
