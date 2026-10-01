import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  applySubstitution,
  calculatePlayedSeconds,
  suggestDelegateSubstitution,
  adjustLiveScore,
  addPlayerMatchEvent,
} from '../js/domain.js';
import { buildLiveState, buildReadyTimerFromPreparation } from '../js/live-tactics.js';
import { roleCanUseOwnerFeatures } from '../js/demo-session.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const app = read('js/app.js');
const runtime = read('js/runtime-refresh.js');
const board = read('js/exercise-board-persistence.js');
const planner = read('js/session-planner-ui.js');
const teamAccess = read('js/team-access.js');
const saas = read('js/saas-auth-ui-v2.js');
const demo = read('js/demo-session.js');
const sw = read('sw.js');
const html = read('index.html');

function allJsText(dir = new URL('../js/', import.meta.url)) {
  const root = dir.pathname;
  const walk = (folder) => readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    return statSync(path).isDirectory() ? walk(path) : (path.endsWith('.js') ? [readFileSync(path, 'utf8')] : []);
  });
  return walk(root).join('\n');
}

test('build actual está alineado en HTML, app, sesión, auth cloud y service worker', () => {
  const build = '20260927-v66-real-calendar-dates';
  for (const source of [html, app, demo, sw]) assert.match(source, new RegExp(build));
  assert.match(read('js/supabase-client.js'), new RegExp(build));
  assert.match(demo, /session-planner-ui\.js\?v=20260927-v66-real-calendar-dates/);
});

test('los botones principales del HTML tienen ruta de interacción o son submit/declarativos', () => {
  const corpus = allJsText();
  const buttons = [...html.matchAll(/<button\b([^>]*)>/gi)].map((match) => match[1]);
  const missing = [];
  for (const attrs of buttons) {
    if (/type=["']submit["']/i.test(attrs)) continue;
    if (/\bdata-(?:view|dialog|close|wa-type|target-view|s)=/i.test(attrs)) continue;
    if (/\bonsubmit=/i.test(attrs)) continue;
    const id = /\bid=["']([^"']+)["']/i.exec(attrs)?.[1];
    if (!id) continue;
    if (!corpus.includes(id)) missing.push(id);
  }
  assert.deepEqual(missing, [], `Botones sin referencia de cableado JS: ${missing.join(', ')}`);
});

test('wireEvents no repite la regresión querySelector().forEach', () => {
  assert.doesNotMatch(app, /(^|[^$])\$\('\.bottom-nav button'\)\.forEach/m);
  assert.doesNotMatch(app, /(^|[^$])\$\('\.exercise-library-tab'\)\.forEach/m);
  assert.doesNotMatch(app, /(^|[^$])\$\('\[data-close\]'\)\.forEach/m);
  assert.doesNotMatch(app, /(^|[^$])\$\('\[data-dialog\]'\)\.forEach/m);
  assert.match(app, /\$\$\('\.bottom-nav button'\)\.forEach/);
  assert.match(app, /\$\$\('\[data-dialog\]'\)\.forEach/);
});

test('+ Ejercicio abre de forma directa, local-first y su guardado no recarga toda la app', () => {
  assert.doesNotMatch(runtime, /#ejercicios \.section-head button\[data-dialog="exercise-dialog"\]/);
  assert.match(runtime, /window\.__campobaseOpenExerciseCreator = openCreator/);
  assert.match(runtime, /await readCustomExercises\(\)\.catch/);
  assert.match(runtime, /hydrateCustomExercises\(\{ attempts: 1 \}\)\.catch/);
  assert.match(app, /typeof window\.__campobaseOpenExerciseCreator === 'function'/);
  assert.match(html, /id="new-exercise"[^>]*data-dialog="exercise-dialog"/);
  const persist = board.slice(board.indexOf('async function persistExercise'), board.indexOf('async function deleteExercise'));
  assert.match(persist, /await put\('settings', record\)/);
  assert.match(persist, /verifiedLocal/);
  assert.match(persist, /syncFromCloud/);
  const afterSave = board.slice(board.indexOf('async function handlePersistRequest'), board.indexOf("if (typeof window !== 'undefined') window.addEventListener"));
  assert.doesNotMatch(afterSave, /window\.location\.reload/);
  assert.match(afterSave, /host\?\.refresh/);
  assert.match(afterSave, /setExerciseLibraryMode\?\.\('mine'\)/);
});

test('Ver todo de Sesiones abre el visor oficial y conserva el crop validado', () => {
  assert.match(planner, /session-exercise-library \.view-exercise\[data-exercise-id\]/);
  assert.match(planner, /window\.__campobase\.showExerciseDetail/);
  assert.match(app, /showExerciseDetail, setExerciseLibraryMode/);
  assert.match(planner, /data-sp-preview-crop/);
  assert.match(planner, /parsePreviewCrop/);
  assert.match(app, /data-preview-crop/);
});

test('todos los controles críticos de Partido en vivo tienen handler delegado', () => {
  const ids = [
    'prepare-live','advance-live','make-sub','exit-live','open-delegate','unlock-delegate','close-delegate',
    'delegate-manual-sub','apply-delegate-suggestion','owner-auto-sub','delegate-auto-sub',
    'propose-reparto','delegate-propose-reparto'
  ];
  for (const id of ids) {
    assert.match(app, new RegExp(`target\\.id === ['"]${id}['"]`), `falta handler para #${id}`);
  }
  for (const selector of ['score-step','add-live-event','save-live-comments']) {
    assert.match(app, new RegExp(`target\\.matches\\(['"]\\.${selector}['"]\\)`), `falta handler para .${selector}`);
  }
});

test('Delegado local y SaaS mantienen acceso al mismo equipo sin funciones exclusivas de Migue', () => {
  assert.match(app, /applyRole\('delegate'\)|role === 'delegate'/);
  assert.match(app, /showView\('delegado'\)/);
  assert.match(app, /if \(!roleCanUseOwnerFeatures\(state\.role\)\)[\s\S]*Solo Migue puede finalizarlo/);
  assert.equal(roleCanUseOwnerFeatures('delegate'), false);
  assert.equal(roleCanUseOwnerFeatures('owner'), true);
  assert.match(teamAccess, /membership_role === 'delegate'|role !== 'delegate'/);
  assert.match(teamAccess, /window\.__campobaseAllowedViews = permissions/);
  assert.match(teamAccess, /settingsNav\.hidden = true/);
  assert.match(saas, /profile\.role === 'delegate'/);
  assert.match(saas, /initTeamAccess/);
  assert.match(saas, /app\.synchronizeCloud/);
  assert.match(saas, /app\.refresh/);
});

test('motor de Partido en vivo conserva 7 jugadores únicos y minutos tras cambios del delegado', () => {
  const players = Array.from({ length: 10 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Jugador ${i + 1}`,
    number: String(i + 1),
    positions: i === 0 ? ['Portero'] : [],
  }));
  const availableIds = players.map((p) => p.id);
  const live = buildLiveState(players, availableIds, '1-3-2-1', 'F7', 'p1');
  live.team = live.team.map((slot, i) => ({ ...slot, playerId: `p${i + 1}` }));
  const ready = buildReadyTimerFromPreparation({
    matchId: 'm1', team: live.team, availableIds, firstKeeper: 'p1', secondKeeper: 'p1', delegateShown: true,
  });
  assert.equal(ready.onField.length, 7);
  const after = applySubstitution(ready.onField, ['p7'], ['p8'], availableIds, 7);
  assert.equal(after.length, 7);
  assert.equal(new Set(after).size, 7);
  assert.ok(after.includes('p8'));
  assert.ok(!after.includes('p7'));

  const totals = calculatePlayedSeconds(ready.onField, [{ second: 600, outIds: ['p7'], inIds: ['p8'], source: 'delegate' }], 1200);
  assert.equal(totals.p7, 600);
  assert.equal(totals.p8, 600);

  const suggestion = suggestDelegateSubstitution(after, availableIds.filter((id) => !after.includes(id)), totals, 1, ['p1']);
  assert.equal(suggestion.inIds.length, 1);
  assert.equal(suggestion.outIds.length, 1);
  assert.notEqual(suggestion.outIds[0], 'p1');
});

test('marcador e incidencias del partido actualizan estado sin mezclar comentarios del delegado', () => {
  let details = { goalsFor: 0, goalsAgainst: 0, goals: [], cards: [], injuries: [], incidents: [], comments: '', minuteReasons: {} };
  details = adjustLiveScore(details, 'for', 1);
  assert.equal(details.goalsFor, 1);
  details = addPlayerMatchEvent(details, { id: 'e1', kind: 'yellow', playerId: 'p2', second: 300, note: '' });
  assert.equal(details.cards.length, 1);
  assert.match(app, /roleCanUseOwnerFeatures\(state\.role\).*Comentarios internos/s);
});

test('refresh sigue sin borrar ni reescribir jugadores', () => {
  const area = app.slice(app.indexOf('async function deduplicatePlayers'), app.indexOf('function renderAll'));
  assert.doesNotMatch(area, /remove\('players'/);
  assert.doesNotMatch(area, /put\('players'/);
  assert.match(area, /return false/);
});


test('subpestañas superiores tienen listener directo y no dependen solo de document', () => {
  const nav = read('js/redesign-nav.js');
  assert.match(nav, /subNav\.querySelectorAll\('\.cb-sub-pill'\)\.forEach/);
  assert.match(nav, /button\.addEventListener\('click'/);
  assert.match(nav, /triggerStandardView\(viewId\)/);
});

test('Actualizar hace recarga controlada preservando sesión y vista', () => {
  assert.match(runtime, /campobase\.activeView/);
  assert.match(runtime, /campobase\.sessionRole/);
  assert.match(runtime, /window\.location\.replace/);
});
