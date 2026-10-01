import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildWhatsAppMatchFamilySummary } from '../js/whatsapp-suite.js';
import { replacePlayerRatings, buildPlayerRatings } from '../js/domain.js';

const appSource = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const stylesSource = fs.readFileSync(new URL('../css/claude-partido.css', import.meta.url), 'utf8');

test('buildWhatsAppMatchFamilySummary genera el resumen deportivo para familias sin datos privados ni notas', () => {
  const match = {
    id: 'm-1',
    date: '2026-10-03T10:30:00',
    venue: 'home',
    type: 'league',
    opponent: 'A.D. Huracán',
    goalsFor: 3,
    goalsAgainst: 1,
    playedSeconds: 70 * 60,
    goals: [
      { playerId: 'p1', team: 'for' },
      { playerId: 'p1', team: 'for' },
      { playerId: 'p2', team: 'for' },
    ],
    minuteTotals: {
      p1: 40 * 60,
      p2: 35 * 60,
      p3: 35 * 60,
    },
    ratings: { p1: 5, p2: 4, p3: 4 },
  };

  const players = [
    { id: 'p1', name: 'Hugo Santana', number: '9' },
    { id: 'p2', name: 'Alejandro Pedrós', number: '10' },
    { id: 'p3', name: 'Mario Rodríguez', number: '1' },
  ];

  const callup = {
    availableIds: ['p1', 'p2', 'p3'],
    matchType: 'league',
  };

  const text = buildWhatsAppMatchFamilySummary({
    match,
    players,
    callup,
    teamName: 'C.F. Unión Viera Alevín D',
  });

  // 1. Debe contener encabezado, resultado y rival
  assert.match(text, /RESUMEN DE PARTIDO — C\.F\. UNIÓN VIERA ALEVÍN D/i);
  assert.match(text, /3 – 1/);
  assert.match(text, /A\.D\. Huracán/);
  assert.match(text, /Local/);

  // 2. Goleadores agrupados
  assert.match(text, /Hugo Santana \(2\)/);
  assert.match(text, /Alejandro Pedrós/);

  // 3. Minutos por jugador ordenados por dorsal
  assert.match(text, /1 · Mario Rodríguez: 35′/);
  assert.match(text, /9 · Hugo Santana: 40′/);
  assert.match(text, /10 · Alejandro Pedrós: 35′/);

  // 4. Agradecimiento a las familias y deportividad
  assert.match(text, /deportividad y respeto constante desde la grada/i);

  // 5. PRIVACIDAD: Nunca incluir notas de puntuación 1-5 ni valoraciones internas
  assert.doesNotMatch(text, /puntuaci[oó]n/i, 'No debe filtrar la palabra puntuación');
  assert.doesNotMatch(text, /nota/i, 'No debe incluir notas');
  assert.doesNotMatch(text, /rating/i, 'No debe incluir ratings');
  assert.doesNotMatch(text, /5 estrellas/i, 'No debe filtrar estrellas');
});

test('claude-partido.css contiene estilos post-partido, resumen de familias y puntuaciones 1-5', () => {
  assert.match(stylesSource, /\.cbx-postmatch-view/, 'Debe existir .cbx-postmatch-view');
  assert.match(stylesSource, /\.cbx-family-summary-card/, 'Debe existir .cbx-family-summary-card con gradiente verde');
  assert.match(stylesSource, /\.cbx-family-wa-btn/, 'Debe existir el botón verde de WhatsApp');
  assert.match(stylesSource, /\.cbx-ratings-card/, 'Debe existir la tarjeta de puntuaciones con borde ámbar');
  assert.match(stylesSource, /\.cbx-star-btn/, 'Debe existir el botón de estrella/nota');
  assert.match(stylesSource, /\.cbx-postmatch-actions/, 'Debe existir la botonera de acciones post-partido');
  assert.match(stylesSource, /\.cbx-family-summary-card\s*\*[\s\S]*?color:\s*#ffffff\s*!important/, 'El texto de la tarjeta de familias debe ser blanco puro con !important');
});

test('app.js integra renderPostMatchSummary, reopenLiveMatch y guardado en ciclo de vida', () => {
  assert.match(appSource, /function renderPostMatchSummary/, 'Debe definir renderPostMatchSummary');
  assert.match(appSource, /async function reopenLiveMatch/, 'Debe definir reopenLiveMatch');
  assert.match(appSource, /state\.recentFinishedMatchId = match\.id/, 'finishMatch debe almacenar recentFinishedMatchId');
  assert.match(appSource, /renderPostMatchSummary\(/, 'renderLive debe invocar renderPostMatchSummary si recentFinishedMatchId está activo');
  assert.match(appSource, /window\.__campobase = \{[\s\S]*?renderPostMatchSummary[\s\S]*?reopenLiveMatch[\s\S]*?finishMatch/, 'Debe exponer funciones post-partido en window.__campobase');
});

test('replacePlayerRatings valida permisos del entrenador y no permite calificar al delegado', () => {
  const players = [
    { id: 'p1', name: 'Hugo Santana', ratingHistory: [] },
  ];
  const values = { p1: 5 };
  const metadata = { matchId: 'm1', date: '2026-10-03', role: 'delegate' };

  assert.throws(
    () => replacePlayerRatings(players, values, metadata),
    /Solo Migue puede puntuar/i,
    'El delegado no debe poder puntuar'
  );

  const ownerMetadata = { matchId: 'm1', date: '2026-10-03', role: 'owner' };
  const result = replacePlayerRatings(players, values, ownerMetadata);
  assert.equal(result.ratings.p1, 5);
  assert.equal(result.players[0].ratingHistory.length, 1);
  assert.equal(result.players[0].ratingHistory[0].rating, 5);
});
