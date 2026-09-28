// Sincronización transversal de CampoBase.
// Partidos, convocatorias y asistencias son la fuente de verdad. La ficha de Plantilla
// se recalcula desde esos registros después de cada mutación, incluso si el usuario
// dejó un <details> abierto y el render general de app.js decidió no repintar.

import { getAll, putBatch } from './db.js';
import {
  applyPlayerStatAdjustments,
  buildPlayerHistory,
  buildPlayerSummary,
  derivePlayerMatchStats,
} from './domain.js';
import { buildPostgameMatchUpdate } from './match-postgame-editor.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

const RELEVANT_STORES = new Set(['players', 'matches', 'trainings', 'callups']);
let syncQueued = false;
let appRefreshQueued = false;
let deriving = false;

function localDate(value = '') {
  if (!value) return 'Sin fecha';
  const hasTime = String(value).includes('T');
  return new Intl.DateTimeFormat('es-ES', hasTime
    ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(hasTime ? value : `${value}T12:00:00`));
}

function sameJson(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function setStrong(span, value) {
  const strong = span?.querySelector('strong');
  if (strong) strong.textContent = String(value ?? '—');
}

function metricSpan(summaryRoot, text) {
  return $$(':scope > span', summaryRoot).find((span) => String(span.textContent).toLocaleLowerCase('es').includes(text));
}

function patchSummary(summaryRoot, summary) {
  if (!summaryRoot) return;
  setStrong(metricSpan(summaryRoot, 'goles'), summary.goals);
  setStrong(metricSpan(summaryRoot, 'amarillas/rojas'), `${summary.yellowCards}/${summary.redCards}`);
  setStrong(metricSpan(summaryRoot, 'lesiones'), summary.injuries);
  setStrong(metricSpan(summaryRoot, 'incidencias'), summary.incidents);
  setStrong(metricSpan(summaryRoot, 'convocatorias'), summary.callups);
  setStrong(metricSpan(summaryRoot, 'rotaciones'), summary.rotations);
  setStrong(metricSpan(summaryRoot, 'tarde/ausente'), `${summary.late}/${summary.absent}`);
  setStrong(metricSpan(summaryRoot, ' min'), summary.minutes);
  setStrong(metricSpan(summaryRoot, 'media'), summary.averageRating ?? '—');
}

function enhancedHistory(playerId, trainings, callups, matches) {
  const base = buildPlayerHistory(playerId, trainings, callups, matches);
  const byMatchId = new Map(matches.map((match) => [match.id, match]));
  return base.map((item) => {
    if (item.kind !== 'match') return item;
    const match = byMatchId.get(item.id);
    if (!match) return item;
    const extra = [];
    const playerComment = String(match.playerComments?.[playerId] ?? '').trim();
    if (playerComment) extra.push(`Comentario: ${playerComment}`);
    for (const observation of match.positionObservations ?? []) {
      if (observation.playerId !== playerId || !String(observation.note ?? '').trim()) continue;
      const minute = Number.isFinite(Number(observation.second)) ? Math.max(0, Math.round(Number(observation.second) / 60)) : null;
      const context = [minute !== null ? `min ${minute}` : '', observation.position || '', observation.note].filter(Boolean).join(' · ');
      extra.push(`Observación: ${context}`);
    }
    return extra.length ? { ...item, detail: [item.detail, ...extra].filter(Boolean).join(' · ') } : item;
  });
}

function historyMarkup(history) {
  return history.map((item) => {
    const type = item.type === 'callup' ? 'Convocatoria' : item.kind === 'match' ? 'Partido' : 'Entrenamiento';
    return `<li class="history-row"><span class="history-date">${esc(localDate(item.date))}</span><span class="history-type">${esc(type)}</span><span class="history-detail">${esc(item.detail || '')}</span></li>`;
  }).join('');
}

function patchHistory(performance, history) {
  if (!performance) return;
  let details = $('.player-history', performance);
  const staleEmpty = $$('.meta', performance).find((node) => node.textContent.trim() === 'Sin actividad registrada.');
  if (!history.length) {
    details?.remove();
    return;
  }
  staleEmpty?.remove();
  if (!details) {
    details = document.createElement('details');
    details.className = 'player-history';
    details.innerHTML = '<summary></summary><ul class="plain-list"></ul>';
    performance.appendChild(details);
  }
  $(':scope > summary', details).textContent = `Historial completo (${history.length})`;
  $('.plain-list', details).innerHTML = historyMarkup(history);
}

function patchPlayerCard(card, player, matches, trainings, callups) {
  const leagueAutomatic = buildPlayerSummary(player.id, matches, trainings, callups, 'league');
  const preseasonAutomatic = buildPlayerSummary(player.id, matches, trainings, callups, 'preseason');
  const league = applyPlayerStatAdjustments(leagueAutomatic, player.statAdjustments?.league);
  const preseason = applyPlayerStatAdjustments(preseasonAutomatic, player.statAdjustments?.preseason);

  const identity = $('.player-identity', card);
  if (identity) {
    const avatarEl = $('.avatar', identity);
    const hasPhoto = typeof player.photo === 'string' && player.photo.startsWith('data:image/');
    if (hasPhoto) {
      if (!avatarEl || avatarEl.tagName !== 'IMG' || avatarEl.src !== player.photo) {
        avatarEl?.remove();
        const img = document.createElement('img');
        img.className = 'avatar';
        img.src = player.photo;
        img.alt = `Foto de ${player.name}`;
        identity.prepend(img);
      }
    } else if (!avatarEl || avatarEl.tagName !== 'DIV') {
      avatarEl?.remove();
      const div = document.createElement('div');
      div.className = 'avatar';
      div.setAttribute('aria-hidden', 'true');
      div.textContent = (player.name || '').slice(0, 2).toUpperCase();
      identity.prepend(div);
    }
  }

  const performance = $('.player-performance', card);
  const summaries = $$('.player-summary', performance);
  patchSummary(summaries[0], league);
  patchSummary(summaries[1], preseason);
  const media = $('.liga-media .valor', card);
  if (media) media.textContent = String(league.averageRating ?? '—');
  const rank = $('.rank', performance);
  if (rank) {
    const prefix = rank.textContent.match(/^\s*\d+\./)?.[0] ?? '';
    rank.textContent = `${prefix} ${league.minutes + preseason.minutes} min acumulados`.trim();
  }
  patchHistory(performance, enhancedHistory(player.id, trainings, callups, matches));
  return { league, preseason };
}

async function reconcileDerivedPlayerRecords(players, matches) {
  if (deriving) return;
  const updates = [];
  for (const player of players) {
    const derived = derivePlayerMatchStats(player.id, matches);
    if (
      Number(player.totalMinutes ?? 0) === Number(derived.totalMinutes ?? 0)
      && sameJson(player.seasonMinutes, derived.seasonMinutes)
      && sameJson(player.preseasonMinutes, derived.preseasonMinutes)
      && sameJson(player.ratingHistory, derived.ratingHistory)
      && sameJson(player.minuteReasons, derived.minuteReasons)
    ) continue;
    updates.push({ ...player, ...derived });
  }
  if (!updates.length) return;
  deriving = true;
  try { await putBatch({ players: updates }); }
  finally { deriving = false; }
}

export async function syncPlayerCards({ reconcile = false } = {}) {
  const root = $('#players-list');
  const [players, matches, trainings, callups] = await Promise.all(['players', 'matches', 'trainings', 'callups'].map(getAll));
  const currentMatchIds = new Set(matches.map((match) => match.id));
  const currentCallups = callups.filter((callup) => !callup.matchId || currentMatchIds.has(callup.matchId));
  const currentTrainings = trainings.filter((record) => !record.matchId || currentMatchIds.has(record.matchId));

  if (reconcile) await reconcileDerivedPlayerRecords(players, matches);
  if (!root) return;
  const byId = new Map(players.map((player) => [player.id, player]));
  let squadMinutes = 0;
  let squadRotations = 0;
  for (const card of $$('.card.player', root)) {
    const playerId = $('.edit-player', card)?.dataset.id;
    const player = byId.get(playerId);
    if (!player) continue;
    const { league, preseason } = patchPlayerCard(card, player, matches, currentTrainings, currentCallups);
    squadMinutes += league.minutes + preseason.minutes;
    squadRotations += league.rotations + preseason.rotations;
  }

  const squad = $('#squad-stats');
  if (squad) {
    const stats = $$('.stat', squad);
    const playersStat = stats.find((node) => /jugadores/i.test(node.textContent));
    const minutesStat = stats.find((node) => /minutos acumulados/i.test(node.textContent));
    const rotationsStat = stats.find((node) => /ausencias por rotación/i.test(node.textContent));
    if (playersStat) setStrong(playersStat, players.length);
    if (minutesStat) setStrong(minutesStat, squadMinutes);
    if (rotationsStat) setStrong(rotationsStat, squadRotations);
  }
}

function uiBusy() {
  if (document.querySelector('dialog[open]')) return true;
  const active = document.activeElement;
  return Boolean(active?.matches?.('input,select,textarea'));
}

function scheduleCardSync(reconcile = false) {
  if (syncQueued) return;
  syncQueued = true;
  window.setTimeout(() => {
    syncQueued = false;
    syncPlayerCards({ reconcile }).catch((error) => console.warn('No se pudo actualizar la ficha de Plantilla:', error));
  }, 100);
}

function scheduleAppRefresh() {
  if (appRefreshQueued || document.body.classList.contains('auth-locked')) return;
  appRefreshQueued = true;
  const attempt = () => {
    if (uiBusy()) return window.setTimeout(attempt, 120);
    appRefreshQueued = false;
    if (navigator.onLine) window.dispatchEvent(new Event('online'));
  };
  window.setTimeout(attempt, 120);
}

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2600);
}

async function savePostgameSynced(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  const form = event.target.closest('#postgame-performance-form');
  if (!form) return;
  const dialog = form.closest('dialog');
  const matchId = dialog?.dataset.matchId;
  const duration = Number(dialog?.dataset.duration) || 70;
  const playersOnField = Number(dialog?.dataset.playersOnField) || 7;
  const [players, matches] = await Promise.all(['players', 'matches'].map(getAll));
  const match = matches.find((item) => item.id === matchId);
  if (!match) throw new TypeError('No se encontró el partido.');
  const entries = $$('.postgame-player-row', dialog).map((row) => ({
    playerId: row.dataset.playerId,
    minutes: Number($('[data-postgame="minutes"]', row).value),
    rating: $('[data-postgame="rating"]', row).value,
    comment: $('[data-postgame="comment"]', row).value,
  }));
  const updatedMatch = buildPostgameMatchUpdate(match, entries, $('#postgame-match-comment', dialog)?.value || '', duration, playersOnField);
  const updatedMatches = matches.map((item) => item.id === match.id ? updatedMatch : item);
  const affectedIds = new Set(entries.map((entry) => entry.playerId));
  const updatedPlayers = players.filter((player) => affectedIds.has(player.id)).map((player) => ({
    ...player,
    ...derivePlayerMatchStats(player.id, updatedMatches),
    // statAdjustments se conserva tal cual. Una corrección manual sigue siendo un delta,
    // pero ya no congela el total cuando cambian los minutos o la puntuación del partido.
  }));
  await putBatch({ matches: [updatedMatch], players: updatedPlayers });
  dialog.close();
  showToast('Partido guardado. Plantilla y ficha de jugadores actualizadas.');
}

function install() {
  scheduleCardSync(true);
  document.addEventListener('campobase:data-changed', (event) => {
    const stores = new Set(event.detail?.stores ?? []);
    if (![...stores].some((store) => RELEVANT_STORES.has(store))) return;
    scheduleCardSync(stores.has('matches'));
    scheduleAppRefresh();
  });

  // El editor postpartido anterior rebajaba/subía el ajuste manual para conservar
  // artificialmente el total previo. Capturamos su guardado y mantenemos la fuente real.
  document.addEventListener('submit', (event) => {
    if (!event.target.closest?.('#postgame-performance-form')) return;
    savePostgameSynced(event).catch((error) => {
      console.error(error);
      const dialog = event.target.closest('dialog');
      let node = $('.player-sync-error', dialog);
      if (!node) {
        node = document.createElement('p');
        node.className = 'warning panel player-sync-error';
        $('.postgame-player-row', dialog)?.before(node);
      }
      node.textContent = error.message || 'No se pudo guardar el partido.';
    });
  }, true);

  const players = $('#players-list');
  if (players) new MutationObserver(() => scheduleCardSync(false)).observe(players, { childList: true, subtree: false });
  window.addEventListener('pageshow', () => scheduleCardSync(true));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
