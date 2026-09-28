import { getAll, putBatch } from './db.js';
import {
  buildPlayerHistory,
  buildPlayerSummary,
  applyPlayerStatAdjustments,
  derivePlayerMatchStats,
  isPreseasonMatch,
  seasonKey,
  calculatePlayerCallupMinutes,
} from './domain.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const localDate = (value) => {
  if (!value) return 'Sin fecha';
  const hasTime = String(value).includes('T');
  return new Intl.DateTimeFormat('es-ES', hasTime
    ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(hasTime ? value : `${value}T12:00:00`));
};

const FIELD_LABELS = {
  goals: 'goles', assists: 'asist.', yellowCards: 'amarillas', redCards: 'rojas', injuries: 'lesiones', incidents: 'incidencias',
  callups: 'convocatorias', rotations: 'rotaciones', late: 'tarde', absent: 'ausente', minutes: 'minutos', averageRating: 'media',
};

let syncing = false;
let scheduled = false;
let calendarScheduled = false;

function scopeForMatch(match) {
  return isPreseasonMatch(match) ? 'preseason' : 'league';
}

function scopeLabel(scope) {
  return scope === 'preseason' ? 'Pretemporada' : 'Liga';
}

function scopedMatches(matches, scope) {
  return matches.filter((match) => scope === 'preseason' ? isPreseasonMatch(match) : !isPreseasonMatch(match));
}

function ratedMatchesForPlayer(matches, playerId, scope) {
  return scopedMatches(matches, scope)
    .filter((match) => Number.isFinite(match.ratings?.[playerId]))
    .map((match) => ({ ...match, _rating: Number(match.ratings[playerId]) }))
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
}

function rawRatingAverage(ratedMatches) {
  if (!ratedMatches.length) return null;
  return Number((ratedMatches.reduce((sum, match) => sum + match._rating, 0) / ratedMatches.length).toFixed(1));
}

function displayedRatingAverage(summary, player, scope, ratedMatches) {
  const hasManualAverage = Number.isFinite(player.statAdjustments?.[scope]?.averageRating);
  if (hasManualAverage && Number.isFinite(summary.averageRating)) return summary.averageRating;
  return rawRatingAverage(ratedMatches) ?? summary.averageRating ?? null;
}

function currentSeason(matches) {
  const dated = matches.filter((match) => match.date).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  if (dated.length) return seasonKey(dated[0].date);
  return seasonKey(new Date().toISOString().slice(0, 10));
}

function setSummaryMetric(summaryRoot, metric, value) {
  if (!summaryRoot) return;
  const span = $$('span', summaryRoot).find((item) => new RegExp(`\\b${metric}\\b`, 'i').test(item.textContent ?? ''));
  const strong = span?.querySelector('strong');
  if (strong) strong.textContent = value ?? '—';
}

function manualAdjustmentMarkup(player, scope) {
  const entries = Object.entries(player.statAdjustments?.[scope] ?? {}).filter(([, value]) => Number.isFinite(value) && Number(value) !== 0);
  if (!entries.length) return '';
  const text = entries.map(([field, value]) => `${FIELD_LABELS[field] ?? field} ${Number(value) > 0 ? '+' : ''}${value}`).join(' · ');
  return `<p class="meta"><strong>Ajuste manual incluido:</strong> ${esc(text)}. Los minutos se pueden repartir por partido desde Calendario.</p>`;
}

function removeLegacyMixedDetails(performance) {
  $$('details', performance).forEach((details) => {
    const summary = details.querySelector(':scope > summary')?.textContent?.trim() ?? '';
    if (/^(Minutos por temporada|Puntuaciones \(|Media por temporada)/.test(summary)) details.remove();
  });
  $$('.player-scope-detail-sync', performance).forEach((item) => item.remove());
}

function scopeDetailMarkup(scope, summary, average, ratedMatches, season, player) {
  const label = scopeLabel(scope);
  const ratingRows = ratedMatches.map((match) => `<li><strong>${esc(localDate(match.date))}</strong> · ${esc(match.opponent || 'Partido')} · ${match._rating}/5</li>`).join('');
  const ratingCount = ratedMatches.length;
  const averageText = Number.isFinite(average) ? `${average}/5` : '—';
  return `<div class="player-scope-detail-sync" data-scope="${scope}">
    <details><summary>Temporada · ${label}</summary><ul class="plain-list"><li><strong>${esc(season)}</strong> · ${summary.minutes} min · media ${averageText} · ${ratingCount} puntuación${ratingCount === 1 ? '' : 'es'}</li></ul>${manualAdjustmentMarkup(player, scope)}</details>
    ${ratingRows ? `<details><summary>Puntuaciones de ${label} (${ratingCount})</summary><ul class="plain-list">${ratingRows}</ul></details>` : ''}
  </div>`;
}

function cleanHistoryDetail(detail, match, player, scope) {
  let result = String(detail ?? '');
  const manualMinutes = Number(player.statAdjustments?.[scope]?.minutes);
  const seconds = match?.minuteTotals?.[player.id];
  if (Number.isFinite(manualMinutes) && manualMinutes !== 0 && Number.isFinite(seconds) && seconds < 5 * 60) {
    result = result
      .replace(/(^| · )\d+ min(?= · |$)/, '$1')
      .replace(/^ · | · $/g, '')
      .replace(/ ·  · /g, ' · ');
    if (!result) result = 'Minutos pendientes de repartir en Calendario';
  }
  return result;
}

function renderSyncedHistory(performance, player, matches, trainings, callups) {
  const details = performance.querySelector('.player-history');
  if (!details) return;
  const byMatchId = new Map(matches.map((match) => [match.id, match]));
  const history = buildPlayerHistory(player.id, trainings, callups, matches);
  const adjustmentRows = ['league', 'preseason'].flatMap((scope) => {
    const minutes = Number(player.statAdjustments?.[scope]?.minutes);
    if (!Number.isFinite(minutes) || minutes === 0) return [];
    return [{
      date: '—',
      type: 'Ajuste manual',
      detail: `${scopeLabel(scope)}: ${minutes > 0 ? '+' : ''}${minutes} min pendientes de repartir por partido en Calendario`,
    }];
  });
  const rows = history.map((item) => {
    const match = item.kind === 'match' ? byMatchId.get(item.id) : null;
    const scope = match ? scopeForMatch(match) : 'league';
    const type = item.type === 'callup' ? 'Convocatoria' : item.kind === 'match' ? 'Partido' : 'Entrenamiento';
    const detail = match ? cleanHistoryDetail(item.detail, match, player, scope) : item.detail;
    return `<li class="history-row"><span class="history-date">${esc(localDate(item.date))}</span><span class="history-type">${esc(type)}</span><span class="history-detail">${esc(detail)}</span></li>`;
  });
  const manualRows = adjustmentRows.map((item) => `<li class="history-row"><span class="history-date">${esc(item.date)}</span><span class="history-type">${esc(item.type)}</span><span class="history-detail">${esc(item.detail)}</span></li>`);
  const list = details.querySelector('.plain-list');
  if (list) list.innerHTML = [...manualRows, ...rows].join('');
  const summary = details.querySelector(':scope > summary');
  if (summary) summary.textContent = `Historial completo (${rows.length + manualRows.length})`;
}

async function syncPlantillaStats() {
  if (syncing || !$('#players-list')) return;
  syncing = true;
  try {
    const [players, matches, trainings, callups] = await Promise.all(['players', 'matches', 'trainings', 'callups'].map(getAll));
    const currentMatchIds = new Set(matches.map((match) => match.id));
    const currentCallups = callups.filter((callup) => !callup.matchId || currentMatchIds.has(callup.matchId));
    const currentTrainings = trainings.filter((record) => !record.matchId || currentMatchIds.has(record.matchId));
    const byId = new Map(players.map((player) => [player.id, player]));
    const season = currentSeason(matches);
    let squadMinutes = 0;

    for (const card of $$('#players-list .card.player')) {
      const playerId = card.querySelector('.edit-player')?.dataset.id;
      const player = byId.get(playerId);
      if (!player) continue;

      const leagueAutomatic = buildPlayerSummary(playerId, matches, currentTrainings, currentCallups, 'league');
      const preseasonAutomatic = buildPlayerSummary(playerId, matches, currentTrainings, currentCallups, 'preseason');
      const league = applyPlayerStatAdjustments(leagueAutomatic, player.statAdjustments?.league);
      const preseason = applyPlayerStatAdjustments(preseasonAutomatic, player.statAdjustments?.preseason);
      const leagueRatings = ratedMatchesForPlayer(matches, playerId, 'league');
      const preseasonRatings = ratedMatchesForPlayer(matches, playerId, 'preseason');
      const leagueAverage = displayedRatingAverage(league, player, 'league', leagueRatings);
      const preseasonAverage = displayedRatingAverage(preseason, player, 'preseason', preseasonRatings);
      squadMinutes += league.minutes + preseason.minutes;

      const media = card.querySelector('.liga-media .valor');
      if (media) media.textContent = Number.isFinite(leagueAverage) ? leagueAverage : '—';
      const mediaBox = card.querySelector('.liga-media');
      if (mediaBox) mediaBox.title = 'Media de Liga';

      const minuteBar = card.querySelector('.player-minute-bar');
      if (minuteBar) {
        const playerTotalMinutes = league.minutes + preseason.minutes;
        const playerTotalCallups = (league.callups ?? 0) + (preseason.callups ?? 0);
        const callupMinutesInfo = calculatePlayerCallupMinutes({
          playerId,
          matches,
          callups: currentCallups,
          defaultDuration: 70,
          totalCallups: playerTotalCallups,
          playedMinutes: playerTotalMinutes,
        });
        const minutePercent = callupMinutesInfo.percent;
        const possibleMinutes = callupMinutesInfo.possibleMinutes;
        const avgMinPerCallup = callupMinutesInfo.averageMinutesPerCallup;
        const totalCallupsCount = callupMinutesInfo.totalCallups;
        minuteBar.title = possibleMinutes > 0
          ? `${playerTotalMinutes} min disputados de ${possibleMinutes} min posibles en sus convocatorias (${minutePercent}%). Media: ${avgMinPerCallup} min/partido (${totalCallupsCount} conv.)`
          : `${playerTotalMinutes} min disputados (sin convocatorias registradas)`;
        const metaSpan = minuteBar.querySelector('.player-minute-meta span:last-child');
        if (metaSpan) {
          metaSpan.innerHTML = `<strong>${playerTotalMinutes} de ${possibleMinutes} min</strong> (${minutePercent}%)${totalCallupsCount > 0 ? ` · <span class="minute-avg-pill">${totalCallupsCount} ${totalCallupsCount === 1 ? 'partido conv.' : 'partidos conv.'}</span>` : ''}`;
        }
        const fill = minuteBar.querySelector('.player-minute-fill');
        if (fill) fill.style.width = `${minutePercent}%`;
      }

      const performance = card.querySelector('.player-performance');
      if (!performance) continue;
      const summaries = $$('.player-summary', performance);
      setSummaryMetric(summaries[0], 'media', Number.isFinite(leagueAverage) ? leagueAverage : '—');
      setSummaryMetric(summaries[1], 'media', Number.isFinite(preseasonAverage) ? preseasonAverage : '—');
      setSummaryMetric(summaries[0], 'min', league.minutes);
      setSummaryMetric(summaries[1], 'min', preseason.minutes);
      setSummaryMetric(summaries[0], 'goles', league.goals);
      setSummaryMetric(summaries[1], 'goles', preseason.goals);
      setSummaryMetric(summaries[0], 'asist', league.assists ?? 0);
      setSummaryMetric(summaries[1], 'asist', preseason.assists ?? 0);

      removeLegacyMixedDetails(performance);
      const leagueButton = performance.querySelector('.edit-player-stats[data-scope="league"]');
      const preseasonButton = performance.querySelector('.edit-player-stats[data-scope="preseason"]');
      leagueButton?.insertAdjacentHTML('afterend', scopeDetailMarkup('league', league, leagueAverage, leagueRatings, season, player));
      preseasonButton?.insertAdjacentHTML('afterend', scopeDetailMarkup('preseason', preseason, preseasonAverage, preseasonRatings, season, player));

      const rank = performance.querySelector('.rank');
      if (rank) {
        const prefix = rank.textContent.match(/^\s*\d+\./)?.[0] ?? '';
        rank.textContent = `${prefix} ${league.minutes + preseason.minutes} min acumulados`.trim();
      }
      renderSyncedHistory(performance, player, matches, currentTrainings, currentCallups);
    }

    const squadStats = $('#squad-stats');
    if (squadStats) {
      const stats = $$('.stat', squadStats);
      const minutesStat = stats.find((stat) => /minutos acumulados/i.test(stat.textContent));
      if (minutesStat) minutesStat.querySelector('strong').textContent = String(squadMinutes);
    }
  } finally {
    syncing = false;
  }
}

function ensurePerformanceDialog() {
  let dialog = $('#match-performance-dialog');
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.id = 'match-performance-dialog';
  dialog.innerHTML = `<form id="match-performance-form" novalidate>
    <div class="dialog-head"><h2 id="match-performance-title">Minutos y puntuaciones</h2><button type="button" data-close-performance aria-label="Cerrar">×</button></div>
    <p class="meta">Edita los minutos reales de cada convocado y, si quieres, su puntuación 1–5. Al guardar se recalculan Plantilla, Liga/Pretemporada, temporadas e historial.</p>
    <div id="match-performance-players" class="stack"></div>
    <div class="button-row"><button class="primary" type="submit">Guardar y sincronizar</button><button type="button" class="secondary" data-close-performance>Cancelar</button></div>
  </form>`;
  document.body.appendChild(dialog);
  dialog.querySelectorAll('[data-close-performance]').forEach((button) => button.addEventListener('click', () => dialog.close()));
  dialog.querySelector('form').addEventListener('submit', (event) => saveMatchPerformance(event).catch((error) => {
    console.error(error);
    const help = dialog.querySelector('.match-performance-error') ?? document.createElement('p');
    help.className = 'warning panel match-performance-error';
    help.textContent = error.message || 'No se pudieron guardar los minutos y puntuaciones.';
    dialog.querySelector('#match-performance-players').before(help);
  }));
  return dialog;
}

async function openMatchPerformanceEditor(matchId) {
  const [players, matches, callups] = await Promise.all(['players', 'matches', 'callups'].map(getAll));
  const match = matches.find((item) => item.id === matchId);
  if (!match) throw new TypeError('No se encontró el partido.');
  const callup = callups.find((item) => item.id === match.callupId || item.matchId === match.id);
  let ids = [...new Set([
    ...(callup?.availableIds ?? []),
    ...Object.keys(match.minuteTotals ?? {}),
    ...Object.keys(match.ratings ?? {}),
  ])];
  if (!ids.length) ids = players.map((player) => player.id);
  if (!ids.length) throw new TypeError('No hay jugadores disponibles para puntuar.');
  const byId = new Map(players.map((player) => [player.id, player]));
  const duration = match.format === 'F11' ? 90 : 70;
  const dialog = ensurePerformanceDialog();
  dialog.dataset.matchId = match.id;
  dialog.dataset.duration = String(duration);
  dialog.querySelector('#match-performance-title').textContent = `${scopeLabel(scopeForMatch(match))} · ${match.opponent || 'Partido'} · minutos y puntuaciones`;
  dialog.querySelector('.match-performance-error')?.remove();
  dialog.querySelector('#match-performance-players').innerHTML = ids.map((playerId) => {
    const player = byId.get(playerId);
    const minutes = Number.isFinite(match.minuteTotals?.[playerId]) ? Math.round(match.minuteTotals[playerId] / 60) : 0;
    const rating = Number.isFinite(match.ratings?.[playerId]) ? Number(match.ratings[playerId]) : '';
    return `<fieldset class="panel match-performance-row" data-player-id="${esc(playerId)}"><legend>${esc(player?.name ?? 'Jugador')}</legend><div class="form-row"><label>Minutos<input name="minutes-${esc(playerId)}" type="number" min="0" max="${duration}" step="1" value="${minutes}"></label><label>Puntuación 1–5<select name="rating-${esc(playerId)}"><option value="">Sin puntuación</option>${[1,2,3,4,5].map((value) => `<option value="${value}" ${rating === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label></div></fieldset>`;
  }).join('');
  dialog.showModal();
}

function migrateManualScopeAdjustments(player, scope, oldAutomatic, oldDisplayed, newAutomatic) {
  const statAdjustments = structuredClone(player.statAdjustments ?? {});
  const current = { ...(statAdjustments[scope] ?? {}) };

  if (Number.isFinite(current.minutes)) {
    const difference = Number(oldDisplayed.minutes) - Number(newAutomatic.minutes);
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

async function saveMatchPerformance(event) {
  event.preventDefault();
  const dialog = event.currentTarget.closest('dialog');
  const submitBtn = dialog.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
  }
  try {
    const matchId = dialog.dataset.matchId;
    const duration = Number(dialog.dataset.duration) || 70;
    const [players, matches, trainings, callups] = await Promise.all(['players', 'matches', 'trainings', 'callups'].map(getAll));
    const match = matches.find((item) => item.id === matchId);
    if (!match) throw new TypeError('El partido ya no existe.');
    const scope = scopeForMatch(match);
    const rows = $$('.match-performance-row', dialog);
    const minuteTotals = { ...(match.minuteTotals ?? {}) };
    const ratings = { ...(match.ratings ?? {}) };
    let totalPlayerMinutes = 0;

    for (const row of rows) {
      const playerId = row.dataset.playerId;
      const minInput = row.querySelector('input[type="number"]') || row.querySelector(`[name="minutes-${CSS.escape(playerId)}"]`);
      const ratingSelect = row.querySelector('select') || row.querySelector(`[name="rating-${CSS.escape(playerId)}"]`);
      const minutes = Number(minInput?.value || 0);
      const ratingRaw = ratingSelect?.value ?? '';
      const safeMinutes = Number.isInteger(minutes) && minutes >= 0 ? Math.min(minutes, duration) : 0;
      minuteTotals[playerId] = safeMinutes * 60;
      totalPlayerMinutes += safeMinutes;
      if (ratingRaw === '') delete ratings[playerId];
      else {
        const rating = Number(ratingRaw);
        if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
          ratings[playerId] = rating;
        } else {
          delete ratings[playerId];
        }
      }
    }

    const updatedMatch = { ...match, minuteTotals, ratings, status: 'finished', updatedAt: Date.now() };
    const updatedMatches = matches.map((item) => item.id === match.id ? updatedMatch : item);
    const affectedIds = new Set(rows.map((row) => row.dataset.playerId));
    const updatedPlayers = players.filter((player) => affectedIds.has(player.id)).map((player) => {
      try {
        const oldAutomatic = buildPlayerSummary(player.id, matches, trainings, callups, scope);
        const oldDisplayed = applyPlayerStatAdjustments(oldAutomatic, player.statAdjustments?.[scope]);
        const newAutomatic = buildPlayerSummary(player.id, updatedMatches, trainings, callups, scope);
        const statAdjustments = migrateManualScopeAdjustments(player, scope, oldAutomatic, oldDisplayed, newAutomatic);
        const derived = derivePlayerMatchStats(player.id, updatedMatches);
        const next = { ...player, ...derived };
        if (statAdjustments) next.statAdjustments = statAdjustments;
        else delete next.statAdjustments;
        return next;
      } catch {
        return player;
      }
    });

    await putBatch({ matches: [updatedMatch], players: updatedPlayers });
    dialog.close();
    if (typeof window.__campobase?.refresh === 'function') {
      await window.__campobase.refresh(true);
    }
    if (typeof window.__campobase?.renderAll === 'function') {
      window.__campobase.renderAll();
    }
    window.__campobase?.renderMatches?.();
    window.__campobase?.renderPlayers?.();
    const toastEl = document.getElementById('toast');
    if (toastEl) {
      toastEl.textContent = 'Minutos y puntuaciones guardados y sincronizados.';
      toastEl.classList.remove('hidden');
      setTimeout(() => toastEl.classList.add('hidden'), 3000);
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar y sincronizar';
    }
  }
}

async function enhanceCalendar() {
  const root = $('#matches-list');
  if (!root) return;
  const matches = await getAll('matches');
  const byId = new Map(matches.map((match) => [match.id, match]));
  for (const detailButton of $$('.match-detail', root)) {
    const match = byId.get(detailButton.dataset.id);
    if (!match || match.status !== 'finished') continue;
    const actions = detailButton.closest('.button-row');
    if (!actions || actions.querySelector(`.edit-match-performance[data-id="${CSS.escape(match.id)}"]`)) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'edit-match-performance secondary';
    button.dataset.id = match.id;
    button.textContent = 'Editar minutos y puntuaciones';
    actions.insertBefore(button, detailButton.nextSibling);
  }

  const detailDialog = $('#match-detail-dialog');
  const rateButton = detailDialog?.querySelector('.rate-match');
  if (rateButton) {
    rateButton.classList.remove('rate-match');
    rateButton.classList.add('edit-match-performance');
    rateButton.textContent = 'Editar minutos y puntuaciones';
  }
}

async function patchStatsDialog(playerId, scope) {
  const [players, matches, trainings, callups] = await Promise.all(['players', 'matches', 'trainings', 'callups'].map(getAll));
  const player = players.find((item) => item.id === playerId);
  const form = $('#player-stats-form');
  if (!player || !form) return;
  const automatic = buildPlayerSummary(playerId, matches, trainings, callups, scope);
  const summary = applyPlayerStatAdjustments(automatic, player.statAdjustments?.[scope]);
  const ratings = ratedMatchesForPlayer(matches, playerId, scope);
  const average = displayedRatingAverage(summary, player, scope, ratings);
  if (form.elements.averageRating && Number.isFinite(average)) form.elements.averageRating.value = average;
  const help = $('#player-stats-help');
  if (help) help.textContent = `Totales de ${scopeLabel(scope)}. Para que los minutos queden vinculados a cada partido, edítalos desde Calendario → Editar minutos y puntuaciones.`;
}

function scheduleSync() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    syncPlantillaStats().catch((error) => console.warn('No se pudo sincronizar la presentación de Plantilla:', error));
  });
}

function scheduleCalendar() {
  if (calendarScheduled) return;
  calendarScheduled = true;
  queueMicrotask(() => {
    calendarScheduled = false;
    enhanceCalendar().catch((error) => console.warn('No se pudo completar la edición de minutos del Calendario:', error));
  });
}

export function initPlantillaStatsSync() {
  const playersRoot = $('#players-list');
  const matchesRoot = $('#matches-list');
  const matchDetailBody = $('#match-detail-body');
  if (playersRoot && playersRoot.dataset.statsSync !== '1') {
    playersRoot.dataset.statsSync = '1';
    new MutationObserver(scheduleSync).observe(playersRoot, { childList: true });
  }
  if (matchesRoot && matchesRoot.dataset.performanceSync !== '1') {
    matchesRoot.dataset.performanceSync = '1';
    new MutationObserver(scheduleCalendar).observe(matchesRoot, { childList: true });
  }
  if (matchDetailBody && matchDetailBody.dataset.performanceSync !== '1') {
    matchDetailBody.dataset.performanceSync = '1';
    new MutationObserver(scheduleCalendar).observe(matchDetailBody, { childList: true, subtree: true });
  }

  document.addEventListener('click', (event) => {
    const performanceButton = event.target.closest('.edit-match-performance');
    if (performanceButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openMatchPerformanceEditor(performanceButton.dataset.id).catch((error) => window.alert(error.message || 'No se pudo abrir la edición del partido.'));
      return;
    }
    const statsButton = event.target.closest('.edit-player-stats');
    if (statsButton) window.setTimeout(() => patchStatsDialog(statsButton.dataset.playerId, statsButton.dataset.scope).catch(console.warn), 0);
  }, true);

  scheduleSync();
  scheduleCalendar();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPlantillaStatsSync, { once: true });
  else initPlantillaStatsSync();
}
