import { getAll, put } from './db.js';
import { FORMATION_NAMES } from './tactics.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

let context = null;

function durationSeconds(match = {}) {
  const configured = Number(match.playedSeconds);
  if (Number.isFinite(configured) && configured > 0) return configured;
  return (match.format === 'F11' ? 90 : 70) * 60;
}

function playerLabel(player) {
  return `${player?.number ? `${player.number} · ` : ''}${player?.name ?? 'Jugador eliminado'}`;
}

function options(ids, playersById, selected = '', empty = true) {
  const list = [...ids].map((id) => playersById.get(id)).filter(Boolean)
    .sort((a, b) => Number(a.number ?? 999) - Number(b.number ?? 999) || String(a.name).localeCompare(String(b.name), 'es'));
  return `${empty ? '<option value="">—</option>' : ''}${list.map((player) => `<option value="${esc(player.id)}" ${player.id === selected ? 'selected' : ''}>${esc(playerLabel(player))}</option>`).join('')}`;
}

function formationOptions(selected = '1-3-2-1') {
  return FORMATION_NAMES.map((formation) => `<option value="${esc(formation)}" ${formation === selected ? 'selected' : ''}>${esc(formation)}</option>`).join('');
}

export function buildMatchState(lineup = [], availableIds = []) {
  const positions = new Map();
  const onField = [];
  for (const slot of lineup) {
    if (!slot?.playerId || onField.includes(slot.playerId)) continue;
    onField.push(slot.playerId);
    positions.set(slot.playerId, String(slot.pos ?? ''));
  }
  return {
    onField,
    bench: availableIds.filter((id) => !onField.includes(id)),
    positions,
  };
}

export function applyCalendarAction(state, action) {
  const next = {
    onField: [...state.onField],
    bench: [...state.bench],
    positions: new Map(state.positions),
  };
  if (action.type === 'substitution') {
    const { outId, inId } = action;
    if (!next.onField.includes(outId)) throw new RangeError('El jugador que sale debe estar en el campo.');
    if (!next.bench.includes(inId)) throw new RangeError('El jugador que entra debe estar como suplente.');
    const index = next.onField.indexOf(outId);
    const position = next.positions.get(outId) ?? '';
    next.onField[index] = inId;
    next.bench = next.bench.filter((id) => id !== inId);
    if (!next.bench.includes(outId)) next.bench.push(outId);
    next.positions.delete(outId);
    next.positions.set(inId, action.inPosition || position);
  } else if (action.type === 'position_swap') {
    const { playerAId, playerBId } = action;
    if (!next.onField.includes(playerAId) || !next.onField.includes(playerBId) || playerAId === playerBId) {
      throw new RangeError('El cambio de posición debe hacerse entre dos jugadores distintos que estén en el campo.');
    }
    const a = next.positions.get(playerAId) ?? '';
    const b = next.positions.get(playerBId) ?? '';
    next.positions.set(playerAId, action.playerAPosition || b);
    next.positions.set(playerBId, action.playerBPosition || a);
  } else if (action.type === 'tactic_change') {
    if (!FORMATION_NAMES.includes(action.formation)) throw new RangeError('Selecciona una táctica válida.');
  } else if (action.type === 'observation') {
    if (!next.onField.includes(action.playerId)) throw new RangeError('La observación debe corresponder a un jugador que esté en el campo en ese momento.');
  }
  return next;
}

export function calculateMatchMinutes(lineup = [], actions = [], matchDurationSeconds = 4200) {
  const current = new Map();
  const totals = {};
  for (const slot of lineup) if (slot?.playerId) current.set(slot.playerId, 0);
  const substitutions = [...actions].filter((action) => action.type === 'substitution').sort((a, b) => a.second - b.second || a.order - b.order);
  for (const action of substitutions) {
    const second = Math.max(0, Math.min(matchDurationSeconds, Number(action.second) || 0));
    if (current.has(action.outId)) {
      totals[action.outId] = (totals[action.outId] ?? 0) + Math.max(0, second - current.get(action.outId));
      current.delete(action.outId);
    }
    current.set(action.inId, second);
  }
  for (const [playerId, enteredAt] of current) totals[playerId] = (totals[playerId] ?? 0) + Math.max(0, matchDurationSeconds - enteredAt);
  return totals;
}

function lineupFromMatch(match, settings) {
  if (Array.isArray(match.lineupSnapshot) && match.lineupSnapshot.length) return match.lineupSnapshot;
  const prep = settings.filter((item) => item?.recordType === 'preparacion' && item.matchId === match.id && Array.isArray(item.team))
    .sort((a, b) => Number(b.savedAt ?? 0) - Number(a.savedAt ?? 0))[0];
  return (prep?.team ?? []).filter((slot) => slot?.playerId).map((slot) => ({ playerId: slot.playerId, pos: slot.pos ?? '' }));
}

function existingActions(match) {
  const actions = [];
  let order = 0;
  for (const event of match.substitutionEvents ?? []) {
    const pairs = Math.max(event.outIds?.length ?? 0, event.inIds?.length ?? 0);
    for (let index = 0; index < pairs; index += 1) actions.push({
      type: 'substitution', second: Number(event.second) || 0, order: order++,
      outId: event.outIds?.[index] ?? '', inId: event.inIds?.[index] ?? '',
      outPosition: event.outPositions?.[index] ?? '', inPosition: event.inPositions?.[index] ?? '',
    });
  }
  for (const event of match.positionEvents ?? []) actions.push({ ...event, type: 'position_swap', order: order++ });
  for (const event of match.tacticEvents ?? []) actions.push({ ...event, type: 'tactic_change', order: order++ });
  for (const event of match.positionObservations ?? []) actions.push({ ...event, type: 'observation', order: order++ });
  return actions.sort((a, b) => Number(a.second) - Number(b.second) || a.order - b.order);
}

function minuteInput(action = {}) {
  const minute = Number.isFinite(Number(action.second)) ? Math.round(Number(action.second) / 60) : '';
  return `<label>Minuto<input class="action-minute" type="number" min="0" max="120" step="1" value="${minute}"></label>`;
}

function substitutionRow(action = {}) {
  return `<div class="panel calendar-action-row" data-type="substitution">${minuteInput(action)}<div class="form-row"><label>Quién sale<select class="action-out"></select></label><label>Quién entra<select class="action-in"></select></label></div><div class="form-row"><label>Posición que deja<input class="action-out-position" maxlength="50" value="${esc(action.outPosition ?? '')}"></label><label>Posición en la que entra<input class="action-in-position" maxlength="50" value="${esc(action.inPosition ?? '')}"></label></div><button type="button" class="remove-calendar-action danger compact">Quitar</button></div>`;
}

function positionRow(action = {}) {
  return `<div class="panel calendar-action-row" data-type="position_swap">${minuteInput(action)}<div class="form-row"><label>Jugador 1<select class="action-player-a"></select></label><label>Jugador 2<select class="action-player-b"></select></label></div><p class="meta action-position-summary"></p><button type="button" class="remove-calendar-action danger compact">Quitar</button></div>`;
}

function tacticRow(action = {}) {
  return `<div class="panel calendar-action-row" data-type="tactic_change">${minuteInput(action)}<label>Nueva táctica<select class="action-formation">${formationOptions(action.formation || '1-3-2-1')}</select></label><p class="meta action-tactic-summary"></p><button type="button" class="remove-calendar-action danger compact">Quitar</button></div>`;
}

function observationRow(action = {}) {
  return `<div class="panel calendar-action-row" data-type="observation">${minuteInput(action)}<label>Jugador<select class="action-player"></select></label><label>Observación en esta posición<textarea class="action-note" maxlength="800" placeholder="Qué hizo, qué debe corregir, comportamiento en esta posición…">${esc(action.note ?? '')}</textarea></label><p class="meta action-position-summary"></p><button type="button" class="remove-calendar-action danger compact">Quitar</button></div>`;
}

function readLineup(dialog) {
  return $$('.v2-lineup-row', dialog).map((row) => ({ playerId: $('.v2-lineup-player', row).value, pos: $('.v2-lineup-position', row).value.trim() })).filter((slot) => slot.playerId);
}

function stateBeforeRow(targetRow) {
  const dialog = targetRow.closest('dialog');
  let state = buildMatchState(readLineup(dialog), context.availableIds);
  for (const row of $$('.calendar-action-row', dialog)) {
    if (row === targetRow) break;
    try { state = applyCalendarAction(state, readAction(row, state, false)); } catch {}
  }
  return state;
}

function readAction(row, state, strict = true) {
  const minute = Number($('.action-minute', row)?.value);
  if (!Number.isFinite(minute) || minute < 0) { if (strict) throw new RangeError('Cada registro necesita un minuto válido.'); }
  const base = { type: row.dataset.type, second: Math.max(0, Number.isFinite(minute) ? Math.round(minute * 60) : 0) };
  if (base.type === 'substitution') {
    const outId = $('.action-out', row).value;
    const inId = $('.action-in', row).value;
    if (strict && (!outId || !inId)) throw new RangeError('Cada cambio necesita quién sale y quién entra.');
    return { ...base, outId, inId, outPosition: $('.action-out-position', row).value.trim() || state.positions.get(outId) || '', inPosition: $('.action-in-position', row).value.trim() || state.positions.get(outId) || '' };
  }
  if (base.type === 'position_swap') {
    const playerAId = $('.action-player-a', row).value;
    const playerBId = $('.action-player-b', row).value;
    if (strict && (!playerAId || !playerBId)) throw new RangeError('Selecciona los dos jugadores que cambian de posición.');
    return { ...base, playerAId, playerBId, playerAPosition: state.positions.get(playerBId) ?? '', playerBPosition: state.positions.get(playerAId) ?? '' };
  }
  if (base.type === 'tactic_change') {
    const formation = $('.action-formation', row).value;
    if (strict && !FORMATION_NAMES.includes(formation)) throw new RangeError('Selecciona una táctica válida.');
    return { ...base, formation };
  }
  const playerId = $('.action-player', row).value;
  const note = $('.action-note', row).value.trim();
  if (strict && (!playerId || !note)) throw new RangeError('Selecciona un jugador y escribe la observación.');
  return { ...base, playerId, position: state.positions.get(playerId) ?? '', note };
}

function refreshActionRows(dialog) {
  if (!context) return;
  let state = buildMatchState(readLineup(dialog), context.availableIds);
  let currentFormation = $('#v2-initial-formation', dialog)?.value || '1-3-2-1';
  for (const row of $$('.calendar-action-row', dialog)) {
    const type = row.dataset.type;
    if (type === 'substitution') {
      const out = $('.action-out', row); const incoming = $('.action-in', row);
      const oldOut = out.value; const oldIn = incoming.value;
      out.innerHTML = options(state.onField, context.playersById, oldOut);
      incoming.innerHTML = options(state.bench, context.playersById, oldIn);
      if (state.onField.includes(oldOut)) out.value = oldOut;
      if (state.bench.includes(oldIn)) incoming.value = oldIn;
      const pos = state.positions.get(out.value) ?? '';
      if (!$('.action-out-position', row).value) $('.action-out-position', row).value = pos;
      if (!$('.action-in-position', row).value) $('.action-in-position', row).value = pos;
    } else if (type === 'position_swap') {
      const a = $('.action-player-a', row); const b = $('.action-player-b', row);
      const oldA = a.value; const oldB = b.value;
      a.innerHTML = options(state.onField, context.playersById, oldA);
      b.innerHTML = options(state.onField.filter((id) => id !== a.value), context.playersById, oldB);
      if (state.onField.includes(oldA)) a.value = oldA;
      if (state.onField.includes(oldB) && oldB !== a.value) b.value = oldB;
      $('.action-position-summary', row).textContent = a.value && b.value ? `${state.positions.get(a.value) || 'Sin posición'} ↔ ${state.positions.get(b.value) || 'Sin posición'}` : 'Solo aparecen jugadores que están en el campo.';
    } else if (type === 'tactic_change') {
      const select = $('.action-formation', row);
      const formation = select.value;
      $('.action-tactic-summary', row).textContent = formation ? `${currentFormation} → ${formation}` : 'Selecciona la nueva táctica.';
      if (formation) currentFormation = formation;
    } else {
      const player = $('.action-player', row); const old = player.value;
      player.innerHTML = options(state.onField, context.playersById, old);
      if (state.onField.includes(old)) player.value = old;
      $('.action-position-summary', row).textContent = player.value ? `Posición en este momento: ${state.positions.get(player.value) || 'Sin posición'}` : 'Solo aparecen jugadores que están en el campo.';
    }
    try { state = applyCalendarAction(state, readAction(row, state, false)); } catch {}
  }
}

function appendAction(dialog, type, action = {}) {
  const list = $('#v2-actions-list', dialog);
  const markup = type === 'substitution'
    ? substitutionRow(action)
    : type === 'position_swap'
      ? positionRow(action)
      : type === 'tactic_change'
        ? tacticRow(action)
        : observationRow(action);
  list.insertAdjacentHTML('beforeend', markup);
  refreshActionRows(dialog);
}

function ensureDialog() {
  let dialog = $('#calendar-substitutions-v2-dialog');
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.id = 'calendar-substitutions-v2-dialog';
  dialog.innerHTML = `<form id="calendar-substitutions-v2-form"><div class="dialog-head"><h2 id="calendar-substitutions-v2-title">Alineación, cambios y tácticas</h2><button type="button" data-v2-close aria-label="Cerrar">×</button></div><p class="meta">Todo lo que guardes aquí queda dentro del partido: siete inicial, táctica inicial, sustituciones, cambios de posición, cambios de táctica, minutos y observaciones por posición.</p><h3>Alineación inicial</h3><div id="v2-lineup-list"></div><h3>Táctica inicial</h3><label>Formación de inicio<select id="v2-initial-formation"></select></label><div class="section-head"><h3>Durante el partido</h3></div><div class="button-row"><button type="button" id="v2-add-sub" class="secondary">+ Cambio</button><button type="button" id="v2-add-position" class="secondary">+ Cambio de posición</button><button type="button" id="v2-add-tactic" class="secondary">+ Cambio de táctica</button><button type="button" id="v2-add-observation" class="secondary">+ Observación</button></div><div id="v2-actions-list" class="stack"></div><div class="button-row"><button type="submit" class="primary">Guardar todo en el partido</button><button type="button" class="secondary" data-v2-close>Cancelar</button></div></form>`;
  document.body.appendChild(dialog);
  $$('[data-v2-close]', dialog).forEach((button) => button.addEventListener('click', () => dialog.close()));
  $('#v2-add-sub', dialog).addEventListener('click', () => appendAction(dialog, 'substitution'));
  $('#v2-add-position', dialog).addEventListener('click', () => appendAction(dialog, 'position_swap'));
  $('#v2-add-tactic', dialog).addEventListener('click', () => appendAction(dialog, 'tactic_change'));
  $('#v2-add-observation', dialog).addEventListener('click', () => appendAction(dialog, 'observation'));
  dialog.addEventListener('click', (event) => { const remove = event.target.closest('.remove-calendar-action'); if (remove) { remove.closest('.calendar-action-row').remove(); refreshActionRows(dialog); } });
  dialog.addEventListener('change', (event) => { if (event.target.matches('select, input')) refreshActionRows(dialog); });
  $('#calendar-substitutions-v2-form', dialog).addEventListener('submit', save);
  return dialog;
}

async function open(matchId) {
  const [matches, players, callups, settings] = await Promise.all(['matches', 'players', 'callups', 'settings'].map(getAll));
  const match = matches.find((item) => item.id === matchId);
  if (!match) throw new TypeError('No se encontró el partido.');
  const callup = callups.find((item) => item.id === match.callupId || item.matchId === match.id);
  const availableIds = callup?.availableIds?.length ? [...callup.availableIds] : players.map((player) => player.id);
  const available = players.filter((player) => availableIds.includes(player.id));
  const lineup = lineupFromMatch(match, settings);
  context = { match, availableIds, playersById: new Map(available.map((player) => [player.id, player])) };
  const dialog = ensureDialog();
  $('#calendar-substitutions-v2-title', dialog).textContent = `${match.opponent || 'Partido'} · alineación, cambios y tácticas`;
  const size = match.format === 'F11' ? 11 : 7;
  $('#v2-lineup-list', dialog).innerHTML = Array.from({ length: size }, (_, index) => {
    const slot = lineup[index] ?? {};
    return `<div class="panel v2-lineup-row"><div class="form-row"><label>Jugador<select class="v2-lineup-player">${options(availableIds, context.playersById, slot.playerId)}</select></label><label>Posición<input class="v2-lineup-position" maxlength="50" value="${esc(slot.pos ?? '')}" placeholder="Ej. Central"></label></div></div>`;
  }).join('');
  const initialFormation = FORMATION_NAMES.includes(match.initialFormation) ? match.initialFormation : '1-3-2-1';
  const formationSelect = $('#v2-initial-formation', dialog);
  const tacticButton = $('#v2-add-tactic', dialog);
  if (match.format === 'F11') {
    formationSelect.innerHTML = '<option value="custom">Personalizada F11</option>';
    formationSelect.disabled = true;
    tacticButton.disabled = true;
    tacticButton.title = 'Los cambios de táctica predefinidos están disponibles en F7.';
  } else {
    formationSelect.disabled = false;
    formationSelect.innerHTML = formationOptions(initialFormation);
    formationSelect.value = initialFormation;
    tacticButton.disabled = false;
    tacticButton.removeAttribute('title');
  }
  $('#v2-actions-list', dialog).innerHTML = '';
  for (const action of existingActions(match)) appendAction(dialog, action.type, action);
  refreshActionRows(dialog);
  dialog.showModal();
}

async function save(event) {
  event.preventDefault();
  const dialog = event.currentTarget.closest('dialog');
  const lineupSnapshot = readLineup(dialog);
  const expected = context.match.format === 'F11' ? 11 : 7;
  if (lineupSnapshot.length !== expected) return window.alert(`La alineación inicial debe tener ${expected} jugadores.`);
  if (new Set(lineupSnapshot.map((slot) => slot.playerId)).size !== lineupSnapshot.length) return window.alert('Un jugador no puede ocupar dos posiciones en la alineación inicial.');

  let state = buildMatchState(lineupSnapshot, context.availableIds);
  const actions = [];
  for (const [order, row] of $$('.calendar-action-row', dialog).entries()) {
    const action = { ...readAction(row, state, true), order };
    state = applyCalendarAction(state, action);
    actions.push(action);
  }
  for (let index = 1; index < actions.length; index += 1) if (actions[index].second < actions[index - 1].second) return window.alert('Los registros deben estar ordenados por minuto.');

  const substitutionEvents = actions.filter((action) => action.type === 'substitution').map((action) => ({ second: action.second, outIds: [action.outId], inIds: [action.inId], outPositions: [action.outPosition], inPositions: [action.inPosition], source: 'calendar_manual_v2' }));
  const positionEvents = actions.filter((action) => action.type === 'position_swap').map(({ second, playerAId, playerBId, playerAPosition, playerBPosition }) => ({ second, playerAId, playerBId, playerAPosition, playerBPosition, source: 'calendar_manual_v2' }));
  const tacticEvents = actions.filter((action) => action.type === 'tactic_change').map(({ second, formation }) => ({ second, formation, source: 'calendar_manual_v2' }));
  const positionObservations = actions.filter((action) => action.type === 'observation').map(({ second, playerId, position, note }) => ({ second, playerId, position, note, source: 'calendar_manual_v2' }));
  const minuteTotals = calculateMatchMinutes(lineupSnapshot, actions, durationSeconds(context.match));
  const initialFormation = context.match.format === 'F11' ? (context.match.initialFormation || 'custom') : $('#v2-initial-formation', dialog).value;
  const updatedMatch = { ...context.match, lineupSnapshot, initialFormation, substitutionEvents, positionEvents, tacticEvents, positionObservations, minuteTotals, updatedAt: Date.now() };
  await put('matches', updatedMatch);
  dialog.close();
  context = null;
  window.setTimeout(() => window.location.reload(), 120);
}

function install() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.edit-lineup-changes');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    open(button.dataset.id).catch((error) => window.alert(error.message || 'No se pudo abrir la edición del partido.'));
  }, true);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
