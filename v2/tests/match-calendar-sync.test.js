import test from 'node:test';
import assert from 'node:assert/strict';
import { inferSubstitutionPositions, lineupForMatch, partitionAndSortMatches } from '../js/match-calendar-sync.js';

test('Calendario recupera el siete inicial desde Preparación cuando el partido no tiene snapshot propio', () => {
  const match = { id: 'm1' };
  const settings = [{
    id: 'prep1',
    recordType: 'preparacion',
    matchId: 'm1',
    savedAt: 10,
    team: [
      { playerId: 'p1', pos: 'Portero' },
      { playerId: 'p2', pos: 'Central' },
    ],
  }];
  assert.deepEqual(lineupForMatch(match, settings), [
    { playerId: 'p1', pos: 'Portero', x: undefined, y: undefined },
    { playerId: 'p2', pos: 'Central', x: undefined, y: undefined },
  ]);
});

test('un cambio hereda la posición del jugador que sale y la mantiene para cambios posteriores', () => {
  const lineup = [
    { playerId: 'p1', pos: 'Portero' },
    { playerId: 'p2', pos: 'Central' },
    { playerId: 'p3', pos: 'Extremo derecho' },
  ];
  const events = [
    { second: 600, outIds: ['p3'], inIds: ['p4'] },
    { second: 1200, outIds: ['p4'], inIds: ['p5'] },
  ];
  assert.deepEqual(inferSubstitutionPositions(events, lineup).map((event) => ({ out: event.outPositions, in: event.inPositions })), [
    { out: ['Extremo derecho'], in: ['Extremo derecho'] },
    { out: ['Extremo derecho'], in: ['Extremo derecho'] },
  ]);
});

test('las posiciones explícitas guardadas en Calendario tienen prioridad sobre la inferencia', () => {
  const lineup = [{ playerId: 'p2', pos: 'Central' }];
  const [event] = inferSubstitutionPositions([{
    second: 900,
    outIds: ['p2'],
    inIds: ['p6'],
    outPositions: ['Central'],
    inPositions: ['Pivote'],
  }], lineup);
  assert.deepEqual(event.outPositions, ['Central']);
  assert.deepEqual(event.inPositions, ['Pivote']);
});

test('partitionAndSortMatches separa próximos de jugados con los más próximos arriba y los jugados con el último por fecha arriba', () => {
  const matches = [
    { id: 'm-upcoming-2', date: '2026-09-26T10:00', status: 'planned' },
    { id: 'm-played-1', date: '2026-09-05T09:00', status: 'finished', goalsFor: 1, goalsAgainst: 6 },
    { id: 'm-upcoming-1', date: '2026-09-20T09:00', status: 'planned' },
    { id: 'm-played-2', date: '2026-09-09T18:00', status: 'finished', goalsFor: 3, goalsAgainst: 5 },
  ];
  const { upcoming, played } = partitionAndSortMatches(matches);
  assert.deepEqual(upcoming.map((m) => m.id), ['m-upcoming-1', 'm-upcoming-2']);
  assert.deepEqual(played.map((m) => m.id), ['m-played-2', 'm-played-1']);
  // Asegura inmutabilidad
  assert.equal(matches[0].id, 'm-upcoming-2');
});
