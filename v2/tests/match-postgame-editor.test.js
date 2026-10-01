import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPostgameMatchUpdate, postgameScope, rebaseScopeAdjustments } from '../js/match-postgame-editor.js';

test('edición postpartido guarda minutos reales, puntuación y comentarios en el propio partido', () => {
  const match = { id: 'm1', type: 'friendly', minuteTotals: { p1: 4 }, ratings: { p1: 3 } };
  const updated = buildPostgameMatchUpdate(match, [
    { playerId: 'p1', minutes: 35, rating: 4, comment: 'Mejoró tras pérdida.' },
    { playerId: 'p2', minutes: 35, rating: 3, comment: '' },
  ], 'Equipo más compacto en la segunda parte.', 70, 7);
  assert.equal(updated.minuteTotals.p1, 35 * 60);
  assert.equal(updated.minuteTotals.p2, 35 * 60);
  assert.equal(updated.ratings.p1, 4);
  assert.equal(updated.ratings.p2, 3);
  assert.equal(updated.playerComments.p1, 'Mejoró tras pérdida.');
  assert.equal(updated.playerComments.p2, undefined);
  assert.equal(updated.comments, 'Equipo más compacto en la segunda parte.');
  assert.equal(postgameScope(updated), 'preseason');
});

test('la suma de minutos no puede superar los minutos disponibles del equipo', () => {
  assert.throws(() => buildPostgameMatchUpdate({ id: 'm1', type: 'league' }, [
    { playerId: 'p1', minutes: 70, rating: 3 },
    { playerId: 'p2', minutes: 70, rating: 3 },
    { playerId: 'p3', minutes: 70, rating: 3 },
    { playerId: 'p4', minutes: 70, rating: 3 },
    { playerId: 'p5', minutes: 70, rating: 3 },
    { playerId: 'p6', minutes: 70, rating: 3 },
    { playerId: 'p7', minutes: 70, rating: 3 },
    { playerId: 'p8', minutes: 1, rating: 3 },
  ], '', 70, 7), /490/);
});

test('al repartir minutos manuales entre partidos el ajuste pendiente disminuye y desaparece al quedar cubierto', () => {
  const player = { id: 'p1', statAdjustments: { preseason: { minutes: 70 } } };
  const afterFirstMatch = rebaseScopeAdjustments(player, 'preseason', { minutes: 70, averageRating: null }, { minutes: 35, averageRating: null });
  assert.equal(afterFirstMatch.preseason.minutes, 35);

  const playerAfterFirst = { ...player, statAdjustments: afterFirstMatch };
  const afterSecondMatch = rebaseScopeAdjustments(playerAfterFirst, 'preseason', { minutes: 70, averageRating: null }, { minutes: 70, averageRating: null });
  assert.equal(afterSecondMatch, undefined);
});

test('Liga y Pretemporada permanecen separadas', () => {
  assert.equal(postgameScope({ type: 'league' }), 'league');
  assert.equal(postgameScope({ type: 'friendly' }), 'preseason');
  assert.equal(postgameScope({ type: 'tournament' }), 'preseason');
});
