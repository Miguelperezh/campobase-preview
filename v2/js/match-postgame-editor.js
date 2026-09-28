import { getAll, putBatch } from './db.js';
import {
  applyPlayerStatAdjustments,
  buildPlayerSummary,
  derivePlayerMatchStats,
  isPreseasonMatch,
} from './domain.js';
import { inferSubstitutionPositions, lineupForMatch } from './match-calendar-sync.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const MATCH_TYPE_LABELS = { league: 'Liga', friendly: 'Amistoso', tournament: 'Torneo' };

export function postgameScope(match = {}) {
  return isPreseasonMatch(match) ? 'preseason' : 'league';
}

export function rebaseScopeAdjustments(player, scope, oldDisplayed, newAutomatic) {
  const statAdjustments = structuredClone(player.statAdjustments ?? {});
  const current = { ...(statAdjustments[scope] ?? {}) };
  if (Number.isFinite(current.minutes)) {
    const difference = Math.round(Number(oldDisplayed.minutes ?? 0) - Number(newAutomatic.minutes ?? 0));
    if (difference === 0) delete current.minutes;
    else current.minutes = difference;
  }
  if (Number.isFinite(current.averageRating)) {
    const oldTarget = Number(oldDisplayed.averageRating ?? 0);
    const newBase = Number(newAutomatic.averageRating ?? 0);
    const difference = Number((oldTarget - newBase).toFixed(1));
    if (difference === 0) delete current.averageRating;
    else current.averageRating = difference;
  }
  if (Object.keys(current).length) statAdjustments[scope] = current;
  else delete statAdjustments[scope];
  return Object.keys(statAdjustments).length ? statAdjustments : undefined;
}

export function buildPostgameMatchUpdate(match, entries, matchComment = '', duration = 70, playersOnField = 7) {
  if (!match || typeof match !== 'object') throw new TypeError('El partido no es válido.');
  if (!Array.isArray(entries)) throw new TypeError('Los jugadores del partido deben ser una lista.');
  const minuteTotals = { ...(match.minuteTotals ?? {}) };
  const ratings = { ...(match.ratings ?? {}) };
  const playerComments = { ...(match.playerComments ?? {}) };
  let totalPlayerMinutes = 0;
  for (const entry of entries) {
    const playerId = String(entry.playerId ?? '').trim();
    if (!playerId) throw new TypeError('Falta el jugador en una fila del partido.');
    const minutes = Number(entry.minutes);
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > duration || !Number.isInteger(minutes)) {
      throw new RangeError(`Los minutos deben ser enteros entre 0 y ${duration}.`);
    }
    minuteTotals[playerId] = minutes * 60;
    totalPlayerMinutes += minutes;
    if (entry.rating === '' || entry.rating === null || entry.rating === undefined) delete ratings[playerId];
    else {
      const rating = Number(entry.rating);
      if (![1, 2, 3, 4, 5].includes(rating)) throw new RangeError('La puntuación debe estar entre 1 y 5.');
      ratings[playerId] = rating;
    }
    const comment = String(entry.comment ?? '').trim();
    if (comment) playerComments[playerId] = comment;
    else delete playerComments[playerId];
  }
  const maximumPlayerMinutes = duration * playersOnField;
  if (totalPlayerMinutes > maximumPlayerMinutes) {
    throw new RangeError(`La suma de minutos no puede superar ${maximumPlayerMinutes} (${duration} min × ${playersOnField} jugadores en campo).`);
  }
  return {
    ...match,
    minuteTotals,
    ratings,
    playerComments,
    comments: String(matchComment ?? '').trim(),
    status: 'finished',
    updatedAt: Date.now(),
  };
}

function durationForMatch(match) { return match.format === 'F11' ? 90 : 70; }
function playersOnFieldForMatch(match) { return match.format === 'F11' ? 11 : 7; }
function participantIds(match, callup) {
  return [...new Set([
    ...(callup?.availableIds ?? []),
    ...Object.keys(match.minuteTotals ?? {}),
    ...Object.keys(match.ratings ?? {}),
    ...Object.keys(match.playerComments ?? {}),
    ...(match.lineupSnapshot ?? []).map((slot) => slot?.playerId).filter(Boolean),
    ...(match.substitutionEvents ?? []).flatMap((event) => [...(event.outIds ?? []), ...(event.inIds ?? [])]),
  ])];
}

function ensureDialog() {
  let dialog = $('#postgame-performance-dialog');
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.id = 'postgame-performance-dialog';
  dialog.innerHTML = `<form id="postgame-performance-form">
    <div class="dialog-head"><h2 id="postgame-performance-title">Partido · jugadores</h2><button type="button" data-close-postgame aria-label="Cerrar">×</button></div>
    <p class="meta">Si no pudiste llevar el cronómetro durante el partido, completa aquí los minutos reales. Al guardar se sincronizan el partido, Plantilla, Liga/Pretemporada, medias, temporadas e historiales.</p>
    <label>Comentario general del partido<textarea id="postgame-match-comment" maxlength="1500" placeholder="Lectura general, contexto, sensaciones, aspectos para revisar después"></textarea></label>
    <div id="postgame-performance-players" class="stack"></div>
    <div class="button-row"><button class="primary" type="submit">Guardar y sincronizar todo</button><button type="button" class="secondary" data-close-postgame>Cancelar</button></div>
  </form>`;
  document.body.appendChild(dialog);
  dialog.querySelectorAll('[data-close-postgame]').forEach((button) => button.addEventListener('click', () => dialog.close()));
  dialog.querySelector('form').addEventListener('submit', (event) => savePostgame(event).catch(showDialogError));
  return dialog;
}

function rowMarkup(player, match, duration) {
  const playerId = player.id;
  const minutes = Number.isFinite(match.minuteTotals?.[playerId]) ? Math.max(0, Math.round(match.minuteTotals[playerId] / 60)) : 0;
  const rating = Number.isFinite(match.ratings?.[playerId]) ? Number(match.ratings[playerId]) : '';
  const comment = String(match.playerComments?.[playerId] ?? '');
  return `<fieldset class="panel postgame-player-row" data-player-id="${esc(playerId)}">
    <legend>${esc(player.number ? `${player.number} · ${player.name}` : player.name)}</legend>
    <div class="postgame-player-grid">
      <label>Minutos<input data-postgame="minutes" type="number" min="0" max="${duration}" step="1" value="${minutes}" required></label>
      <label>Puntuación 1–5<select data-postgame="rating"><option value="">Sin puntuación</option>${[1,2,3,4,5].map((value) => `<option value="${value}" ${rating === value ? 'selected' : ''}>${value}/5</option>`).join('')}</select></label>
      <label class="postgame-comment">Comentario del jugador<textarea data-postgame="comment" maxlength="800" placeholder="Opcional: qué hizo, dónde sufrió, qué mejoró, comportamiento táctico…">${esc(comment)}</textarea></label>
    </div>
  </fieldset>`;
}

async function openPostgame(matchId) {
  const [matches, players, callups] = await Promise.all(['matches', 'players', 'callups'].map(getAll));
  const match = matches.find((item) => item.id === matchId);
  if (!match) throw new TypeError('No se encontró el partido.');
  if (match.status !== 'finished') throw new TypeError('Esta edición posterior solo está disponible para partidos finalizados.');
  const callup = callups.find((item) => item.id === match.callupId || item.matchId === match.id);
  const ids = participantIds(match, callup);
  const byId = new Map(players.map((player) => [player.id, player]));
  const available = ids.map((id) => byId.get(id)).filter(Boolean)
    .sort((a, b) => Number(a.number ?? 999) - Number(b.number ?? 999) || String(a.name).localeCompare(String(b.name), 'es'));
  if (!available.length) throw new TypeError('El partido no tiene jugadores vinculados.');
  const duration = durationForMatch(match);
  const dialog = ensureDialog();
  dialog.dataset.matchId = match.id;
  dialog.dataset.duration = String(duration);
  dialog.dataset.playersOnField = String(playersOnFieldForMatch(match));
  $('#postgame-performance-title', dialog).textContent = `${MATCH_TYPE_LABELS[match.type] ?? 'Partido'} · ${match.opponent || 'Rival'} · minutos, puntuación y comentarios`;
  $('#postgame-match-comment', dialog).value = match.comments ?? '';
  $('#postgame-performance-players', dialog).innerHTML = available.map((player) => rowMarkup(player, match, duration)).join('');
  $('.postgame-performance-error', dialog)?.remove();
  dialog.showModal();
}

function showDialogError(error) {
  console.error(error);
  const dialog = $('#postgame-performance-dialog');
  if (!dialog) return;
  let node = $('.postgame-performance-error', dialog);
  if (!node) {
    node = document.createElement('p');
    node.className = 'warning panel postgame-performance-error';
    $('#postgame-performance-players', dialog)?.before(node);
  }
  node.textContent = error.message || 'No se pudieron guardar los datos del partido.';
}

async function savePostgame(event) {
  event.preventDefault();
  const dialog = event.currentTarget.closest('dialog');
  const matchId = dialog.dataset.matchId;
  const duration = Number(dialog.dataset.duration) || 70;
  const playersOnField = Number(dialog.dataset.playersOnField) || 7;
  const [players, matches, trainings, callups] = await Promise.all(['players', 'matches', 'trainings', 'callups'].map(getAll));
  const match = matches.find((item) => item.id === matchId);
  if (!match) throw new TypeError('No se encontró el partido.');
  const entries = $$('.postgame-player-row', dialog).map((row) => ({
    playerId: row.dataset.playerId,
    minutes: Number($('[data-postgame="minutes"]', row).value),
    rating: $('[data-postgame="rating"]', row).value,
    comment: $('[data-postgame="comment"]', row).value,
  }));
  const updatedMatch = buildPostgameMatchUpdate(match, entries, $('#postgame-match-comment', dialog).value, duration, playersOnField);
  const updatedMatches = matches.map((item) => item.id === match.id ? updatedMatch : item);
  const scope = postgameScope(match);
  const affectedIds = new Set(entries.map((entry) => entry.playerId));
  const updatedPlayers = players.filter((player) => affectedIds.has(player.id)).map((player) => {
    const oldAutomatic = buildPlayerSummary(player.id, matches, trainings, callups, scope);
    const oldDisplayed = applyPlayerStatAdjustments(oldAutomatic, player.statAdjustments?.[scope]);
    const newAutomatic = buildPlayerSummary(player.id, updatedMatches, trainings, callups, scope);
    const statAdjustments = rebaseScopeAdjustments(player, scope, oldDisplayed, newAutomatic);
    const derived = derivePlayerMatchStats(player.id, updatedMatches);
    const next = { ...player, ...derived };
    if (statAdjustments) next.statAdjustments = statAdjustments;
    else delete next.statAdjustments;
    return next;
  });
  await putBatch({ matches: [updatedMatch], players: updatedPlayers });
  dialog.close();
  if (typeof window.__campobase?.refresh === 'function') {
    await window.__campobase.refresh(true);
  }
  if (typeof window.__campobase?.renderAll === 'function') {
    window.__campobase.renderAll();
  }
  const toastEl = document.getElementById('toast');
  if (toastEl) {
    toastEl.textContent = 'Datos del partido guardados y sincronizados.';
    toastEl.classList.remove('hidden');
    setTimeout(() => toastEl.classList.add('hidden'), 3000);
  }
}

function minuteText(second) {
  if (!Number.isFinite(Number(second))) return '—';
  return `${Math.max(0, Math.round(Number(second) / 60))}'`;
}

function matchContextForPlayer(match, playerId, settings) {
  const lineup = lineupForMatch(match, settings);
  const initial = lineup.find((slot) => slot.playerId === playerId);
  const events = inferSubstitutionPositions(match.substitutionEvents ?? [], lineup);
  const changes = [];
  const positions = new Set();
  if (initial?.pos) positions.add(initial.pos);
  for (const event of events) {
    const outIndex = (event.outIds ?? []).indexOf(playerId);
    if (outIndex >= 0) {
      const pos = event.outPositions?.[outIndex] ?? '';
      if (pos) positions.add(pos);
      changes.push(`Sale ${minuteText(event.second)}${pos ? ` · ${pos}` : ''}`);
    }
    const inIndex = (event.inIds ?? []).indexOf(playerId);
    if (inIndex >= 0) {
      const pos = event.inPositions?.[inIndex] ?? '';
      if (pos) positions.add(pos);
      changes.push(`Entra ${minuteText(event.second)}${pos ? ` · ${pos}` : ''}`);
    }
  }
  return { initialPosition: initial?.pos ?? '', positions: [...positions], changes };
}

function localDate(value) {
  if (!value) return '';
  const hasTime = String(value).includes('T');
  return new Intl.DateTimeFormat('es-ES', hasTime
    ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(hasTime ? value : `${value}T12:00:00`));
}

function historyMarkup(playerId, matches, settings) {
  const rows = matches.filter((match) => match.status === 'finished').map((match) => {
    const context = matchContextForPlayer(match, playerId, settings);
    const minutes = Number.isFinite(match.minuteTotals?.[playerId]) ? Math.round(match.minuteTotals[playerId] / 60) : null;
    const rating = Number.isFinite(match.ratings?.[playerId]) ? match.ratings[playerId] : null;
    const comment = String(match.playerComments?.[playerId] ?? '').trim();
    const participated = Number(minutes) > 0 || rating !== null || comment || context.initialPosition || context.changes.length;
    if (!participated) return '';
    const positionText = context.positions.length ? context.positions.join(', ') : '—';
    return `<li class="postgame-history-row"><strong>${esc(localDate(match.date))} · ${esc(MATCH_TYPE_LABELS[match.type] ?? match.type ?? 'Partido')} · ${esc(match.opponent || 'Rival')}</strong><span>${minutes ?? '—'} min · ${rating ?? '—'}/5 · Posición/es: ${esc(positionText)}</span>${context.changes.length ? `<span>Cambios: ${esc(context.changes.join(' · '))}</span>` : ''}${comment ? `<span>Comentario: ${esc(comment)}</span>` : ''}</li>`;
  }).filter(Boolean).join('');
  return rows ? `<details class="postgame-player-history"><summary>Partidos: posiciones, cambios y comentarios</summary><ul class="plain-list">${rows}</ul></details>` : '';
}

let historyRunning = false;
async function patchPlayerHistories() {
  const root = $('#players-list');
  if (!root || historyRunning) return;
  historyRunning = true;
  try {
    const [matches, settings] = await Promise.all(['matches', 'settings'].map(getAll));
    for (const card of $$('.card.player', root)) {
      const playerId = $('.edit-player', card)?.dataset.id;
      const performance = $('.player-performance', card);
      if (!playerId || !performance) continue;
      $('.postgame-player-history', performance)?.remove();
      const markup = historyMarkup(playerId, matches, settings);
      if (markup) performance.insertAdjacentHTML('beforeend', markup);
    }
  } finally {
    historyRunning = false;
  }
}

async function patchMatchComments(matchId) {
  const body = $('#match-detail-body');
  if (!body || !matchId || $('.postgame-comments-detail', body)) return;
  const [matches, players] = await Promise.all(['matches', 'players'].map(getAll));
  const match = matches.find((item) => item.id === matchId);
  if (!match) return;
  const byId = new Map(players.map((player) => [player.id, player]));
  const playerRows = Object.entries(match.playerComments ?? {}).filter(([, comment]) => String(comment).trim()).map(([playerId, comment]) => `<li><strong>${esc(byId.get(playerId)?.name ?? 'Jugador eliminado')}:</strong> ${esc(comment)}</li>`).join('');
  if (!match.comments && !playerRows) return;
  body.insertAdjacentHTML('beforeend', `<section class="panel postgame-comments-detail"><h4>Comentarios del partido</h4>${match.comments ? `<p>${esc(match.comments)}</p>` : ''}${playerRows ? `<ul class="plain-list">${playerRows}</ul>` : ''}</section>`);
}

function patchButtons() {
  $$('.edit-match-performance, .rate-match').forEach((button) => {
    button.textContent = 'Minutos, puntuación y comentarios';
    button.title = 'Completar o corregir datos de jugadores después del partido';
  });
}

function injectStyles() {
  if ($('#postgame-editor-style')) return;
  const style = document.createElement('style');
  style.id = 'postgame-editor-style';
  style.textContent = `
    #postgame-performance-dialog{width:min(980px,94vw);max-height:92vh}.postgame-player-grid{display:grid;grid-template-columns:110px 150px minmax(260px,1fr);gap:.7rem;align-items:start}.postgame-comment textarea{min-height:76px;resize:vertical}.postgame-history-row{display:grid;gap:.2rem;padding:.55rem 0;border-bottom:1px solid #e5ebe8}.postgame-history-row:last-child{border-bottom:0}.postgame-history-row span{font-size:.82rem;color:#5c6963}.postgame-player-history{margin-top:.65rem}.postgame-comments-detail{margin-top:.8rem}
    @media(max-width:720px){.postgame-player-grid{grid-template-columns:1fr 1fr}.postgame-comment{grid-column:1/-1}}
    @media(max-width:480px){.postgame-player-grid{grid-template-columns:1fr}.postgame-comment{grid-column:auto}}
  `;
  document.head.appendChild(style);
}

function bind() {
  injectStyles();
  patchButtons();
  patchPlayerHistories().catch(console.warn);
  document.addEventListener('click', (event) => {
    const edit = event.target.closest('.edit-match-performance, .rate-match');
    if (edit?.dataset.id) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openPostgame(edit.dataset.id).catch(showDialogError);
      return;
    }
    const detail = event.target.closest('.match-detail');
    if (detail?.dataset.id) window.setTimeout(() => patchMatchComments(detail.dataset.id).catch(console.warn), 100);
  }, true);
  const rootObserver = new MutationObserver(() => {
    patchButtons();
    patchPlayerHistories().catch(console.warn);
  });
  const matches = $('#matches-list');
  const players = $('#players-list');
  if (matches) rootObserver.observe(matches, { childList: true, subtree: false });
  if (players) rootObserver.observe(players, { childList: true, subtree: false });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else queueMicrotask(bind);
}
