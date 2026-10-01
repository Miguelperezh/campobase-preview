import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  calculatePlayerCallupMinutes,
  getPlayerSetPieceRoles,
  buildSquadLeaderboards,
  buildPlayerSummary,
  addPlayerMatchEvent,
} from '../js/domain.js';
import { mergeCloudRecord } from '../js/sync-core.js';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('calculatePlayerCallupMinutes calcula minutos reglamentarios, porcentaje y media por partido convocado', () => {
  const matches = [
    {
      id: 'm1',
      type: 'league',
      status: 'finished',
      format: 'F7',
      playedSeconds: 53 * 60,
      minuteTotals: { 'p-pablo': 53 * 60 },
    },
    {
      id: 'm2',
      type: 'league',
      status: 'finished',
      format: 'F7',
      playedSeconds: 70 * 60,
      minuteTotals: { 'p-pedros': 30 * 60 },
    },
    {
      id: 'm3',
      type: 'league',
      status: 'finished',
      format: 'F7',
      playedSeconds: 70 * 60,
      minuteTotals: { 'p-pedros': 30 * 60 },
    },
  ];

  const callups = [
    { matchId: 'm1', availableIds: ['p-pablo'], exclusions: [] },
    { matchId: 'm2', availableIds: ['p-pedros'], exclusions: [] },
    { matchId: 'm3', availableIds: ['p-pedros'], exclusions: [] },
  ];

  // Caso Pablo Díaz: 1 partido convocado, 53 min jugados de 70 min posibles = 76% (nunca 100%)
  const pabloStats = calculatePlayerCallupMinutes({
    playerId: 'p-pablo',
    matches,
    callups,
    defaultDuration: 70,
    playedMinutes: 53,
  });
  assert.equal(pabloStats.totalCallups, 1);
  assert.equal(pabloStats.playedMinutes, 53);
  assert.equal(pabloStats.possibleMinutes, 70);
  assert.equal(pabloStats.percent, 76);
  assert.equal(pabloStats.averageMinutesPerCallup, 53);

  // Caso Alejandro Pedrós: 2 partidos convocados, 60 min jugados de 140 min posibles = 43% y 30 min/partido
  const pedrosStats = calculatePlayerCallupMinutes({
    playerId: 'p-pedros',
    matches,
    callups,
    defaultDuration: 70,
    playedMinutes: 60,
  });
  assert.equal(pedrosStats.totalCallups, 2);
  assert.equal(pedrosStats.playedMinutes, 60);
  assert.equal(pedrosStats.possibleMinutes, 140);
  assert.equal(pedrosStats.percent, 43);
  assert.equal(pedrosStats.averageMinutesPerCallup, 30);
});

test('getPlayerSetPieceRoles identifica correctamente especialistas y capitanes asignados', () => {
  const setPieces = {
    penalties: { primary: 'p1', secondary: 'p2' },
    freeKicksLeft: { primary: 'p2', secondary: 'p3' },
    freeKicksRight: { primary: 'p1', secondary: 'p2' },
    cornersLeft: { primary: 'p3', secondary: 'p1' },
    cornersRight: { primary: 'p2', secondary: 'p3' },
    captains: { primary: 'p1', secondary: 'p2', third: 'p3' },
  };

  const p1Roles = getPlayerSetPieceRoles('p1', setPieces);
  const p1Labels = p1Roles.map((r) => r.label);
  assert.ok(p1Labels.includes('1.er Penalti'));
  assert.ok(p1Labels.includes('1.ª Falta Der.'));
  assert.ok(p1Labels.includes('1.er Capitán'));

  const p2Roles = getPlayerSetPieceRoles('p2', setPieces);
  const p2Labels = p2Roles.map((r) => r.label);
  assert.ok(p2Labels.includes('1.ª Falta Izq.'));
  assert.ok(p2Labels.includes('1.er Córner Der.'));
  assert.ok(p2Labels.includes('2.º Capitán'));

  const p3Roles = getPlayerSetPieceRoles('p3', setPieces);
  const p3Labels = p3Roles.map((r) => r.label);
  assert.ok(p3Labels.includes('1.er Córner Izq.'));
  assert.ok(p3Labels.includes('3.er Capitán'));
});

test('index.html cuenta con el diálogo de balón parado, inputs de asistencias y contenedores de clasificación', async () => {
  const html = await read('index.html');
  assert.match(html, /id="set-pieces-dialog"/);
  assert.match(html, /id="plantilla-specialists-bar"/);
  assert.match(html, /id="squad-leaderboards"/);
  assert.match(html, /id="open-set-pieces-btn"/);
  assert.match(html, /name="assists"/);
  assert.match(html, /name="penaltiesPrimary"/);
  assert.match(html, /name="freeKicksLeftPrimary"/);
  assert.match(html, /name="freeKicksRightPrimary"/);
  assert.match(html, /name="cornersLeftPrimary"/);
  assert.match(html, /name="cornersRightPrimary"/);
  assert.match(html, /name="captainsPrimary"/);
  assert.match(html, /name="captainsSecondary"/);
  assert.match(html, /name="captainsThird"/);
});

test('plantilla-stats-sync formatea los minutos con X de Y min (Z%) y partidos convocados', async () => {
  const js = await read('js/plantilla-stats-sync.js');
  assert.match(js, /<strong>\$\{playerTotalMinutes\} de \$\{possibleMinutes\} min<\/strong>/);
  assert.match(js, /\(\$\{minutePercent\}%\)/);
  assert.match(js, /partidos conv\./);
  assert.match(js, /assists:\s*'asist\.'/);
});

test('Modo Campo directo usa sesión persistente para evitar rechazos RLS 401', async () => {
  const directo = await read('js/modo-campo-directo.js');
  const actions = await read('js/modo-campo-actions.js');
  const exercises = await read('js/modo-campo-identity-exercises.js');

  assert.match(directo, /persistSession:\s*true/);
  assert.match(actions, /persistSession:\s*true/);
  assert.match(exercises, /persistSession:\s*true/);
  assert.match(directo, /autoRefreshToken:\s*true/);
});

test('diagnóstico seguro ?videoDebug=1 y botón en Ajustes están disponibles', async () => {
  const html = await read('index.html');
  const app = await read('js/app.js');
  const viewer = await read('js/ejercicio-viewer.js');

  assert.match(html, /id="toggle-video-debug"/);
  assert.match(app, /#toggle-video-debug/);
  assert.match(app, /campobase\.videoDebug/);
  assert.match(viewer, /export function attachVideoDebugger/);
  assert.match(viewer, /videoDebug/);
  assert.match(viewer, /video-debug-panel/);
  assert.match(viewer, /DIAGNÓSTICO VÍDEO/);
  assert.match(viewer, /readyState/);
  assert.match(viewer, /networkState/);
});

test('partidos disputados sin convocatoria formal previa se computan como convocatorias y minutos reales (caso Aitor)', () => {
  const matches = [
    { id: 'm1', type: 'league', status: 'finished', minuteTotals: { 'p-aitor': 35 * 60 } },
    { id: 'm2', type: 'league', status: 'finished', minuteTotals: { 'p-aitor': 40 * 60 } },
    { id: 'm3', type: 'league', status: 'finished', minuteTotals: { 'p-aitor': 30 * 60 } },
  ];
  // Solo se creó convocatoria previa para el partido 1
  const callups = [
    { id: 'c1', matchId: 'm1', availableIds: ['p-aitor'], exclusions: [] },
  ];

  const summary = buildPlayerSummary('p-aitor', matches, [], callups, 'league');
  assert.equal(summary.callups, 3);
  assert.equal(summary.minutes, 105);

  const callupMinutes = calculatePlayerCallupMinutes({
    playerId: 'p-aitor',
    matches,
    callups,
    defaultDuration: 70,
    totalCallups: summary.callups,
    playedMinutes: summary.minutes,
  });
  assert.equal(callupMinutes.totalCallups, 3);
  assert.equal(callupMinutes.possibleMinutes, 210);
  assert.equal(callupMinutes.playedMinutes, 105);
  assert.equal(callupMinutes.percent, 50);
});

test('addPlayerMatchEvent gestiona goles de penalti, fallados, parados y encajados correctamente', () => {
  const initial = { goalsFor: 0, goalsAgainst: 0, goals: [], cards: [], injuries: [], incidents: [] };

  // 1. Gol de penalti propio
  const afterPenGoal = addPlayerMatchEvent(initial, { id: 'e1', kind: 'penalty_goal', playerId: 'p1', second: 120, note: '' });
  assert.equal(afterPenGoal.goalsFor, 1);
  assert.equal(afterPenGoal.goals[0].isPenalty, true);

  // 2. Penalti fallado
  const afterMiss = addPlayerMatchEvent(afterPenGoal, { id: 'e2', kind: 'penalty_miss', playerId: 'p1', second: 240, note: '' });
  assert.equal(afterMiss.goalsFor, 1);
  assert.equal(afterMiss.incidents[0].type, 'penalty_miss');

  // 3. Penalti parado por nuestro portero
  const afterSave = addPlayerMatchEvent(afterMiss, { id: 'e3', kind: 'penalty_saved', playerId: 'gk1', second: 360, note: '' });
  assert.equal(afterSave.goalsAgainst, 0);
  assert.equal(afterSave.incidents[1].type, 'penalty_saved');

  // 4. Penalti encajado
  const afterConceded = addPlayerMatchEvent(afterSave, { id: 'e4', kind: 'penalty_conceded', playerId: 'gk1', second: 480, note: '' });
  assert.equal(afterConceded.goalsAgainst, 1);
  assert.equal(afterConceded.incidents[2].type, 'penalty_conceded');
});

test('tablas clasificatorias y balón parado no contienen prefijo # en dorsales y tienen toggle dinámico', async () => {
  const app = await read('js/app.js');

  // No debe existir #${cleanPlayerNumber en app.js
  assert.doesNotMatch(app, /#\$\{cleanPlayerNumber/);
  // Toggle conmutable de tablas clasificatorias
  assert.match(app, /Desplegar tablas clasificatorias ▾/);
  assert.match(app, /Cerrar tablas clasificatorias ▴/);
  assert.match(app, /lb-toggle-text/);
});

test('reproducción de vídeo en iOS WebKit usa webkit-playsinline y no llama a video.load() destructivo al pulsar play', async () => {
  const viewer = await read('js/ejercicio-viewer.js');

  assert.match(viewer, /webkit-playsinline/);
  // togglePlay no debe llamar a video.load()
  const togglePlayMatch = viewer.match(/async function togglePlay\(\) \{([\s\S]*?)\n {2}\}/);
  assert.ok(togglePlayMatch, 'togglePlay exists');
  assert.doesNotMatch(togglePlayMatch[1], /video\.load\(\)/);
});

test('partidos planificados o convocatorias provisionales no computan como convocatorias jugadas ni duplican estadísticas', () => {
  const matches = [
    { id: 'm1', type: 'league', status: 'finished', minuteTotals: { p1: 35 * 60 } },
    { id: 'm2', type: 'league', status: 'finished', minuteTotals: { p1: 40 * 60 } },
    { id: 'm3', type: 'league', status: 'finished', minuteTotals: { p1: 30 * 60 } },
    { id: 'm-pilar', type: 'league', status: 'planned', minuteTotals: null },
  ];
  const callups = [
    { id: 'c1', matchId: 'm1', availableIds: ['p1'] },
    { id: 'c2', matchId: 'm2', availableIds: ['p1'] },
    { id: 'c3', matchId: 'm3', availableIds: ['p1'] },
    { id: 'c-pilar', matchId: 'm-pilar', availableIds: ['p1', 'p2'] },
  ];
  const p1Summary = buildPlayerSummary('p1', matches, [], callups, 'league');
  assert.equal(p1Summary.callups, 3, 'El jugador con 3 partidos jugados debe tener exactamente 3 convocatorias (no 6)');
  assert.equal(p1Summary.minutes, 105);

  const p2Summary = buildPlayerSummary('p2', matches, [], callups, 'league');
  assert.equal(p2Summary.callups, 0, 'El jugador que solo está en la convocatoria provisional de El Pilar debe tener 0 convocatorias jugadas (no 2)');
  assert.equal(p2Summary.minutes, 0);

  const boards = buildSquadLeaderboards({
    players: [{ id: 'p1', name: 'Aitor' }, { id: 'p2', name: 'Ramiro' }],
    matches,
    callups,
    scope: 'all',
  });
  const aitorLeaderboard = boards.minuteDistribution.find((item) => item.player.id === 'p1');
  const ramiroLeaderboard = boards.minuteDistribution.find((item) => item.player.id === 'p2');
  assert.equal(aitorLeaderboard.summary.callups, 3);
  assert.equal(ramiroLeaderboard.summary.callups, 0);
});

test('mergeCloudRecord preserva especialistas de balón parado configurados localmente cuando el registro remoto viene vacío', () => {
  const local = {
    id: 'main',
    teamName: 'Unión Viera',
    setPieces: {
      penalties: { primary: 'p1', secondary: 'p2' },
      freeKicksLeft: { primary: 'p2', secondary: 'p3' },
    },
  };
  const cloudWithoutSetPieces = {
    id: 'main',
    teamName: 'Unión Viera',
    setPieces: null,
  };
  const merged = mergeCloudRecord('settings', local, cloudWithoutSetPieces);
  assert.deepEqual(merged.setPieces, local.setPieces);
});

test('index.html y app.js integran botón para pasar datos al móvil por WhatsApp o AirDrop', async () => {
  const html = await read('index.html');
  const app = await read('js/app.js');

  assert.match(html, /id="share-data-mobile"/);
  assert.match(app, /shareDatabaseToMobile/);
  assert.match(app, /share-database-mobile-btn/);
  assert.match(app, /navigator\.share/);
});


