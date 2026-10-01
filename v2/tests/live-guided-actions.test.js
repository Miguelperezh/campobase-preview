import test from 'node:test';
import assert from 'node:assert/strict';
import { addPlayerMatchEvent, removePlayerMatchEvent } from '../js/domain.js';

test('un gol rival guiado suma al marcador y se puede deshacer', () => {
  const initial = { goalsFor: 0, goalsAgainst: 0, goals: [], cards: [], injuries: [], incidents: [] };
  const withGoal = addPlayerMatchEvent(initial, { id: 'rival-1', kind: 'opponent_goal', playerId: '__rival__', second: 420, note: 'Jugada rival' });
  assert.equal(withGoal.goalsAgainst, 1);
  assert.equal(withGoal.incidents[0].type, 'opponent_goal');
  const undone = removePlayerMatchEvent(withGoal, 'rival-1');
  assert.equal(undone.goalsAgainst, 0);
  assert.deepEqual(undone.incidents, []);
});
