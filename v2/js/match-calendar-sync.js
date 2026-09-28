import { getAll } from './db.js';
import './completed-events-ui.js?v=2520';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

let scheduled = false;

function formatMinute(second) {
  if (!Number.isFinite(Number(second))) return '—';
  return `${Math.max(0, Math.ceil(Number(second) / 60))}'`;
}

function preparationForMatch(settings, matchId) {
  return settings
    .filter((item) => item?.recordType === 'preparacion' && item.matchId === matchId && Array.isArray(item.team))
    .sort((a, b) => Number(b.savedAt ?? 0) - Number(a.savedAt ?? 0))[0] ?? null;
}

export function lineupForMatch(match, settings = []) {
  if (Array.isArray(match?.lineupSnapshot) && match.lineupSnapshot.length) return match.lineupSnapshot;
  const prep = preparationForMatch(settings, match?.id);
  return (prep?.team ?? []).filter((slot) => slot?.playerId).map((slot) => ({
    playerId: slot.playerId,
    pos: slot.pos ?? '',
    x: slot.x,
    y: slot.y,
  }));
}

export function inferSubstitutionPositions(events = [], initialLineup = []) {
  const currentPosition = new Map(initialLineup.filter((slot) => slot?.playerId).map((slot) => [slot.playerId, slot.pos ?? '']));
  return events.map((event) => {
    const outIds = Array.isArray(event?.outIds) ? event.outIds : [];
    const inIds = Array.isArray(event?.inIds) ? event.inIds : [];
    const explicitOut = Array.isArray(event?.outPositions) ? event.outPositions : [];
    const explicitIn = Array.isArray(event?.inPositions) ? event.inPositions : [];
    const pairs = Math.max(outIds.length, inIds.length);
    const outPositions = [];
    const inPositions = [];
    for (let index = 0; index < pairs; index += 1) {
      const outId = outIds[index] ?? '';
      const inId = inIds[index] ?? '';
      const inferred = explicitOut[index] ?? (outId ? currentPosition.get(outId) : '') ?? '';
      const inPosition = explicitIn[index] ?? inferred;
      outPositions.push(inferred);
      inPositions.push(inPosition);
      if (outId) currentPosition.delete(outId);
      if (inId) currentPosition.set(inId, inPosition);
    }
    return { ...event, outPositions, inPositions };
  });
}

function playerName(byId, id) {
  if (id === '__pp__' || id === 'pp' || id === '__own_goal__') return 'Gol P.P.';
  return byId.get(id)?.name ?? 'Jugador eliminado';
}

function playerMinutes(match, playerId) {
  const seconds = Number(match?.minuteTotals?.[playerId]);
  return Number.isFinite(seconds) ? Math.max(0, Math.round(seconds / 60)) : 0;
}

function participantIds(match, callup) {
  const ids = new Set();
  for (const [playerId, seconds] of Object.entries(match?.minuteTotals ?? {})) {
    if (Number(seconds) >= 60) ids.add(playerId);
  }
  for (const event of match?.substitutionEvents ?? []) {
    for (const id of [...(event.outIds ?? []), ...(event.inIds ?? [])]) if (id) ids.add(id);
  }
  for (const slot of match?.lineupSnapshot ?? []) if (slot?.playerId) ids.add(slot.playerId);
  if (!ids.size && callup?.availableIds?.length && Number(match?.playedSeconds) >= 60) {
    for (const id of callup.availableIds) if (Number(match?.minuteTotals?.[id]) > 0) ids.add(id);
  }
  return [...ids];
}

function participationMarkup(match, callup, lineup, players) {
  const byId = new Map(players.map((player) => [player.id, player]));
  const starters = lineup.map((slot) => `<li><strong>${esc(playerName(byId, slot.playerId))}</strong>${slot.pos ? ` · ${esc(slot.pos)}` : ''}</li>`).join('');
  const playedIds = participantIds(match, callup);
  const played = playedIds
    .sort((a, b) => playerMinutes(match, b) - playerMinutes(match, a) || playerName(byId, a).localeCompare(playerName(byId, b), 'es'))
    .map((id) => `<li><strong>${esc(playerName(byId, id))}</strong> · ${playerMinutes(match, id)} min</li>`).join('');
  const events = inferSubstitutionPositions(match?.substitutionEvents ?? [], lineup);
  const changes = events.flatMap((event) => {
    const pairs = Math.max(event.outIds?.length ?? 0, event.inIds?.length ?? 0);
    return Array.from({ length: pairs }, (_, index) => {
      const outId = event.outIds?.[index] ?? '';
      const inId = event.inIds?.[index] ?? '';
      const outPos = event.outPositions?.[index] ?? '';
      const inPos = event.inPositions?.[index] ?? '';
      return `<li><strong>${formatMinute(event.second)}</strong> · sale ${esc(playerName(byId, outId))}${outPos ? ` (${esc(outPos)})` : ''} · entra ${esc(playerName(byId, inId))}${inPos ? ` (${esc(inPos)})` : ''}</li>`;
    });
  }).join('');
  const tacticEvents = [...(match?.tacticEvents ?? [])].sort((a, b) => Number(a.second) - Number(b.second));
  const tactics = tacticEvents.map((event) => `<li><strong>${formatMinute(event.second)}</strong> · ${esc(event.formation || 'Táctica sin nombre')}</li>`).join('');
  const rawSeconds = Object.values(match?.minuteTotals ?? {}).some((seconds) => Number(seconds) > 0 && Number(seconds) < 60);
  return `<section class="calendar-participation-sync panel">
    <div class="section-head"><div><p class="eyebrow">Participación</p><h3>Alineación, jugadores, cambios y tácticas</h3></div><button type="button" class="edit-lineup-changes secondary" data-id="${esc(match.id)}">Editar alineación, cambios y tácticas</button></div>
    ${rawSeconds ? '<p class="warning panel">Este partido conserva segundos incompletos del cronómetro original. Corrige los minutos desde «Editar minutos y puntuaciones».</p>' : ''}
    <details open><summary>Quién jugó (${playedIds.length})</summary>${played ? `<ul class="plain-list">${played}</ul>` : '<p class="meta">Todavía no hay minutos de juego fiables asignados a este partido.</p>'}</details>
    <details><summary>Siete inicial${lineup.length ? ` (${lineup.length})` : ''}</summary>${starters ? `<ul class="plain-list">${starters}</ul>` : '<p class="meta">No hay una alineación inicial guardada. Puedes completarla manualmente.</p>'}</details>
    <details><summary>Cambios (${events.reduce((total, event) => total + Math.max(event.outIds?.length ?? 0, event.inIds?.length ?? 0), 0)})</summary>${changes ? `<ul class="plain-list">${changes}</ul>` : '<p class="meta">No se registraron cambios en este partido.</p>'}</details>
    <details><summary>Cambios de táctica (${tacticEvents.length})</summary>${tactics ? `<ul class="plain-list">${tactics}</ul>` : '<p class="meta">No se registraron cambios de táctica en este partido.</p>'}</details>
  </section>`;
}

async function enhanceCalendarParticipation() {
  const root = $('#matches-list');
  if (!root) return;
  const [matches, players, callups, settings] = await Promise.all(['matches', 'players', 'callups', 'settings'].map(getAll));
  const byId = new Map(matches.map((match) => [match.id, match]));
  for (const detailButton of $$('.match-detail', root)) {
    const match = byId.get(detailButton.dataset.id);
    if (!match || match.status !== 'finished') continue;
    const actions = detailButton.closest('.button-row');
    if (!actions || actions.querySelector('.edit-lineup-changes')) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'edit-lineup-changes secondary';
    button.dataset.id = match.id;
    button.textContent = 'Alineación, cambios y tácticas';
    actions.appendChild(button);
  }

  const detailDialog = $('#match-detail-dialog');
  const matchId = detailDialog?.dataset.matchId;
  const body = $('#match-detail-body');
  const match = byId.get(matchId);
  if (body && match?.status === 'finished' && !body.querySelector('.calendar-participation-sync')) {
    const callup = callups.find((item) => item.id === match.callupId || item.matchId === match.id);
    const lineup = lineupForMatch(match, settings);
    body.insertAdjacentHTML('beforeend', participationMarkup(match, callup, lineup, players));
  }
}

function scheduleEnhance() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    enhanceCalendarParticipation().catch((error) => console.warn('No se pudo mostrar la participación del partido:', error));
  });
}

export function initMatchCalendarSync() {
  const matchesRoot = $('#matches-list');
  const detailBody = $('#match-detail-body');
  if (matchesRoot && matchesRoot.dataset.lineupSync !== '1') {
    matchesRoot.dataset.lineupSync = '1';
    new MutationObserver(scheduleEnhance).observe(matchesRoot, { childList: true, subtree: true });
  }
  if (detailBody && detailBody.dataset.lineupSync !== '1') {
    detailBody.dataset.lineupSync = '1';
    new MutationObserver(scheduleEnhance).observe(detailBody, { childList: true, subtree: true });
  }
  scheduleEnhance();
}

export function partitionAndSortMatches(matches) {
  if (!Array.isArray(matches)) throw new TypeError('Los partidos deben ser una lista.');
  const isPlayed = (match) => match?.status === 'finished' || match?.status === 'closed' || Boolean(match?.closedAt);
  const upcoming = matches
    .filter((match) => !isPlayed(match))
    .sort((a, b) => String(a?.date || '').localeCompare(String(b?.date || '')) || (a?.createdAt ?? 0) - (b?.createdAt ?? 0));
  const played = matches
    .filter(isPlayed)
    .sort((a, b) => String(b?.date || '').localeCompare(String(a?.date || '')) || (b?.createdAt ?? 0) - (a?.createdAt ?? 0));
  return { upcoming, played };
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMatchCalendarSync, { once: true });
  else initMatchCalendarSync();
}
