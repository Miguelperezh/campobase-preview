import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { partitionAndSortMatches } from '../js/match-calendar-sync.js';

const root = new URL('../', import.meta.url);

test('sesiones desde 15/09/2026 solo se archivan mediante Realizado', async () => {
  const source = await readFile(new URL('js/completed-events-ui.js', root), 'utf8');
  assert.match(source, /MANUAL_CLOSE_FROM = '2026-09-15'/);
  assert.match(source, /mark-session-complete/);
  assert.match(source, /textContent = '✓ Realizado'/);
  assert.match(source, /status: 'closed'/);
  assert.match(source, /closedAt: now/);
  assert.doesNotMatch(source, /sessionHasFinished/);
  assert.doesNotMatch(source, /attendance/);
});

test('partidos solo pasan a Jugados mediante estado finalizado/cerrado y tienen Realizado manual', async () => {
  const source = await readFile(new URL('js/completed-events-ui.js', root), 'utf8');
  assert.match(source, /mark-match-complete/);
  assert.match(source, /put\('matches', \{ \.\.\.match, status: 'finished'/);

  const matches = [
    { id: 'planned-score', date: '2026-09-20T09:00', status: 'planned', goalsFor: 0, goalsAgainst: 0 },
    { id: 'finished', date: '2026-09-09T18:00', status: 'finished', goalsFor: 3, goalsAgainst: 5 },
  ];
  const { upcoming, played } = partitionAndSortMatches(matches);
  assert.deepEqual(upcoming.map((m) => m.id), ['planned-score']);
  assert.deepEqual(played.map((m) => m.id), ['finished']);
});
