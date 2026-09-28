// Asistencia visual vinculada a las actividades reales de CampoBase.
// Sesiones y partidos se editan sin duplicarlos. Los registros siguen viviendo en
// `trainings`, por lo que Plantilla, historial y estadísticas leen la misma fuente.

import { getAll, put, remove } from './db.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

let renderQueued = false;
let rendering = false;
let cleanupQueued = false;
let activeFilter = 'all';

function formatDate(value = '') {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : 'Sin fecha';
}

function dateOnly(value = '') { return String(value).slice(0, 10); }
function sessionName(session) { return String(session?.name || '').trim() || 'Sesión de entrenamiento'; }
function activityDate(activity) { return dateOnly(activity?.date || ''); }

function splitTime(value = '') {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value));
  return { hour: match?.[1] ?? '', minute: match?.[2] ?? '' };
}

function timeOptions(max, selected = '', placeholder = '—') {
  return `<option value="" ${selected ? '' : 'selected'}>${placeholder}</option>` + Array.from({ length: max }, (_, index) => String(index).padStart(2, '0'))
    .map((value) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${value}</option>`).join('');
}

function sourcePanel() {
  let panel = $('#attendance-source-panel');
  if (panel) return panel;
  const section = $('#asistencia');
  const head = section?.querySelector('.section-head');
  if (!section || !head) return null;
  panel = document.createElement('article');
  panel.id = 'attendance-source-panel';
  panel.className = 'attendance-source-panel';
  head.insertAdjacentElement('afterend', panel);
  return panel;
}

async function snapshot() {
  const [matches, trainings, settings, callups, players] = await Promise.all([
    getAll('matches'), getAll('trainings'), getAll('settings'), getAll('callups'), getAll('players'),
  ]);
  return {
    matches,
    trainings,
    sessions: settings.filter((item) => item?.recordType === 'trainingSession'),
    callups,
    players: [...players].sort((a, b) => Number(a.number ?? 999) - Number(b.number ?? 999) || String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' })),
  };
}

function attendanceForMatch(trainings, matchId) {
  return trainings.find((record) => record?.kind === 'match' && record.matchId === matchId);
}

function attendanceForSession(trainings, session) {
  const sessionId = typeof session === 'string' ? session : session?.id;
  const sessionDate = typeof session === 'object' ? session?.date : null;
  return trainings.find((record) => {
    if (sessionId && record?.sessionId === sessionId) return true;
    if (sessionDate && record?.kind === 'training' && dateOnly(record?.date) === dateOnly(sessionDate)) return true;
    return false;
  });
}

export function summarizeAttendance(records = []) {
  const entries = records.flatMap((record) => record?.attendance ?? []);
  return {
    present: entries.filter((entry) => entry.status === 'present').length,
    late: entries.filter((entry) => entry.status === 'late').length,
    absent: entries.filter((entry) => entry.status === 'absent').length,
    total: entries.length,
  };
}

function recordCounts(record) {
  return summarizeAttendance(record ? [record] : []);
}

export function sortAttendanceActivities(activities, today = '') {
  const todayKey = today || (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  return [...activities].sort((a, b) => {
    const dateA = String(a.date || '');
    const dateB = String(b.date || '');
    const isUpcomingA = Boolean(dateA && dateA >= todayKey);
    const isUpcomingB = Boolean(dateB && dateB >= todayKey);

    // Los próximos arriba
    if (isUpcomingA && !isUpcomingB) return -1;
    if (!isUpcomingA && isUpcomingB) return 1;

    // Si ambos son próximos: de arriba abajo por orden de fecha (ascendente: hoy primero, luego mañana, etc.)
    if (isUpcomingA && isUpcomingB) {
      const cmp = dateA.localeCompare(dateB);
      if (cmp !== 0) return cmp;
      return String(a.title || '').localeCompare(String(b.title || ''), 'es');
    }

    // Si ambos son pasados: de arriba abajo por orden de fecha más reciente (descendente)
    const cmp = dateB.localeCompare(dateA);
    if (cmp !== 0) return cmp;
    return String(a.title || '').localeCompare(String(b.title || ''), 'es');
  });
}

export function buildAttendanceActivities({ sessions = [], matches = [], trainings = [], callups = [] } = {}, today = '') {
  const callupIds = new Set(callups.map((item) => item.id));
  const list = [
    ...sessions.map((session) => ({
      source: 'session', id: session.id, date: activityDate(session), title: sessionName(session),
      subtitle: `${session.blocks?.length || 0} ejercicios · ${Number(session.totalDuration) || 0} min`,
      attendance: attendanceForSession(trainings, session), ready: true,
    })),
    ...matches.map((match) => ({
      source: 'match', id: match.id, date: activityDate(match), title: String(match.opponent || 'Partido'),
      subtitle: match.type === 'league' ? 'Liga' : match.type === 'friendly' ? 'Amistoso' : match.type === 'tournament' ? 'Torneo' : 'Partido',
      attendance: attendanceForMatch(trainings, match.id), ready: Boolean(match.callupId && callupIds.has(match.callupId)),
    })),
  ];
  return sortAttendanceActivities(list, today);
}

function visibleActivities(rows) {
  if (activeFilter === 'pending') return rows.filter((row) => !row.attendance);
  if (activeFilter === 'session') return rows.filter((row) => row.source === 'session');
  if (activeFilter === 'match') return rows.filter((row) => row.source === 'match');
  return rows;
}

function filterButton(value, label, count) {
  return `<button type="button" class="attendance-filter ${activeFilter === value ? 'active' : ''}" data-attendance-filter="${value}"><span>${esc(label)}</span><strong>${count}</strong></button>`;
}

function activityCard(row) {
  const counts = recordCounts(row.attendance);
  const status = row.attendance ? '<span class="attendance-saved">Registrada</span>' : '<span class="attendance-pending">Pendiente</span>';
  const counters = row.attendance ? `<div class="attendance-mini-counts"><span class="present"><strong>${counts.present}</strong> presentes</span><span class="late"><strong>${counts.late}</strong> tarde</span><span class="absent"><strong>${counts.absent}</strong> ausentes</span></div>` : '<p class="meta">Todavía no se ha pasado asistencia.</p>';
  const button = row.source === 'match' && !row.ready
    ? '<button type="button" class="secondary" disabled title="Primero crea la convocatoria del partido">Falta convocatoria</button>'
    : `<button type="button" class="${row.attendance ? 'secondary' : 'primary'}" data-attendance-source="${row.source}" data-source-id="${esc(row.id)}">${row.attendance ? 'Editar asistencia' : 'Pasar asistencia'}</button>`;
  return `<article class="attendance-activity-card panel" data-activity-type="${row.source}">
    <div class="attendance-activity-head"><div><div class="attendance-tags"><span class="pill ${row.source === 'match' ? 'accent' : ''}">${row.source === 'match' ? 'Partido' : 'Sesión'}</span>${status}</div><h3>${esc(row.title)}</h3><p class="meta">${esc(formatDate(row.date))}${row.subtitle ? ` · ${esc(row.subtitle)}` : ''}</p></div>${button}</div>
    ${counters}
  </article>`;
}

async function renderSources() {
  const panel = sourcePanel();
  if (!panel || rendering) return;
  rendering = true;
  try {
    const data = await snapshot();
    if (!panel.isConnected) return;
    const todayKey = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    const rows = buildAttendanceActivities(data, todayKey);
    const visible = visibleActivities(rows);
    const totals = summarizeAttendance(data.trainings);
    const registered = rows.filter((row) => row.attendance).length;
    const pending = rows.length - registered;

    const isDone = (row) => Boolean(row.attendance) || (row.date && row.date < todayKey);

    let contentHTML = '';
    if (activeFilter === 'pending') {
      contentHTML = `<div class="attendance-activity-list">${visible.length ? visible.map(activityCard).join('') : '<div class="panel empty">No hay actividades pendientes de asistencia.</div>'}</div>`;
    } else {
      const upcomingOrPending = visible.filter((row) => !isDone(row));
      const completedOrDone = visible.filter((row) => isDone(row));

      let pendingHTML = '';
      if (upcomingOrPending.length) {
        pendingHTML = `<div class="attendance-activity-list">${upcomingOrPending.map(activityCard).join('')}</div>`;
      } else if (!completedOrDone.length) {
        pendingHTML = '<div class="panel empty">No hay actividades en este filtro.</div>';
      } else {
        pendingHTML = '<div class="panel empty"><p>✅ Todas las actividades próximas tienen su asistencia registrada al día.</p></div>';
      }

      let completedHTML = '';
      if (completedOrDone.length) {
        completedHTML = `
          <details class="attendance-completed-group panel">
            <summary class="attendance-completed-summary">
              <div class="attendance-completed-title">
                <span class="toggle-icon">▶</span>
                <strong>Asistencias registradas y finalizadas (${completedOrDone.length})</strong>
              </div>
              <span class="pill accent">Desplegar</span>
            </summary>
            <div class="attendance-activity-list attendance-completed-list">
              ${completedOrDone.map(activityCard).join('')}
            </div>
          </details>
        `;
      }
      contentHTML = `${pendingHTML}${completedHTML}`;
    }

    panel.innerHTML = `
      <div class="attendance-overview panel">
        <div class="attendance-overview-head"><div><p class="eyebrow">Control rápido</p><h3>Asistencia de actividades</h3><p class="meta">Sesiones y partidos ya creados. Un solo registro alimenta también la ficha de cada jugador.</p></div></div>
        <div class="attendance-overview-stats"><span><strong>${registered}</strong> registradas</span><span><strong>${pending}</strong> pendientes</span><span class="present"><strong>${totals.present}</strong> presentes</span><span class="late"><strong>${totals.late}</strong> tarde</span><span class="absent"><strong>${totals.absent}</strong> ausentes</span></div>
        <div class="attendance-filters" role="group" aria-label="Filtrar actividades">
          ${filterButton('all', 'Todas', rows.length)}${filterButton('session', 'Sesiones', rows.filter((row) => row.source === 'session').length)}${filterButton('match', 'Partidos', rows.filter((row) => row.source === 'match').length)}${filterButton('pending', 'Pendientes', pending)}
        </div>
      </div>
      ${contentHTML}`;
  } catch (error) {
    panel.innerHTML = `<p class="error panel">No se pudieron cargar las actividades para asistencia: ${esc(error?.message || 'error desconocido')}</p>`;
  } finally {
    rendering = false;
  }
}

function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  window.setTimeout(() => {
    renderQueued = false;
    renderSources();
  }, 60);
}

async function cleanupOrphanSessionAttendance() {
  const [settings, trainings] = await Promise.all([getAll('settings'), getAll('trainings')]);
  const sessions = settings.filter((item) => item?.recordType === 'trainingSession');
  if (!sessions.length) return 0; // Evita borrar si settings aún no ha sincronizado del servidor
  const sessionIds = new Set(sessions.map((item) => item.id));
  const orphans = trainings.filter((record) => record?.sessionId && !sessionIds.has(record.sessionId));
  for (const record of orphans) await remove('trainings', record.id);
  if (orphans.length) scheduleRender();
  return orphans.length;
}

function scheduleCleanup() {
  if (cleanupQueued) return;
  cleanupQueued = true;
  window.setTimeout(() => {
    cleanupQueued = false;
    cleanupOrphanSessionAttendance().catch((error) => console.warn('No se pudo limpiar una asistencia huérfana:', error));
  }, 150);
}

function statusChoice(playerId, value, selected, label) {
  return `<label class="attendance-choice ${value} ${selected === value ? 'selected' : ''}"><input type="radio" name="status-${esc(playerId)}" value="${value}" ${selected === value ? 'checked' : ''}><span>${esc(label)}</span></label>`;
}

function statusRow(player, entry = {}) {
  const status = ['present', 'late', 'absent'].includes(entry.status) ? entry.status : 'present';
  const { hour, minute } = splitTime(entry.arrivalTime || '');
  const initials = String(player.name || 'J').split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
  return `<article class="attendance-player-row panel" data-attendance-player="${esc(player.id)}">
    <div class="attendance-player-ident"><span class="attendance-avatar">${esc(initials)}</span><div><strong>${esc(player.name || 'Jugador')}</strong><small>${player.number ? `Dorsal ${esc(player.number)}` : 'Sin dorsal'}</small></div></div>
    <div class="attendance-status-choices" role="radiogroup" aria-label="Asistencia de ${esc(player.name)}">
      ${statusChoice(player.id, 'present', status, 'Presente')}${statusChoice(player.id, 'late', status, 'Tarde')}${statusChoice(player.id, 'absent', status, 'Ausente')}
    </div>
    <div class="attendance-row-extra">
      <div class="arrival-time ${status === 'late' ? '' : 'hidden'}"><span>Hora de llegada</span><div class="time-24"><select name="arrivalHour-${esc(player.id)}">${timeOptions(24, hour, 'hh')}</select><span>:</span><select name="arrivalMinute-${esc(player.id)}">${timeOptions(60, minute, 'mm')}</select></div></div>
      <label class="attendance-note">Comentario<input name="note-${esc(player.id)}" value="${esc(entry.note || '')}" maxlength="200" placeholder="Opcional: motivo, incidencia, observación…"></label>
    </div>
  </article>`;
}

function currentFormEntries(form) {
  return $$('[data-attendance-player]', form).map((row) => {
    const playerId = row.dataset.attendancePlayer;
    const status = $(`input[name="status-${CSS.escape(playerId)}"]:checked`, row)?.value || 'present';
    return { playerId, status };
  });
}

function updateEditorSummary(form) {
  const entries = currentFormEntries(form);
  const summary = {
    present: entries.filter((entry) => entry.status === 'present').length,
    late: entries.filter((entry) => entry.status === 'late').length,
    absent: entries.filter((entry) => entry.status === 'absent').length,
  };
  const root = $('.attendance-editor-summary', form);
  if (root) root.innerHTML = `<span class="present"><strong>${summary.present}</strong> presentes</span><span class="late"><strong>${summary.late}</strong> tarde</span><span class="absent"><strong>${summary.absent}</strong> ausentes</span>`;
  $$('[data-attendance-player]', form).forEach((row) => {
    const selected = $('input[type="radio"]:checked', row)?.value;
    $$('.attendance-choice', row).forEach((choice) => choice.classList.toggle('selected', choice.classList.contains(selected)));
    $('.arrival-time', row)?.classList.toggle('hidden', selected !== 'late');
  });
}

async function openActivityAttendance(source, sourceId) {
  const data = await snapshot();
  const session = source === 'session' ? data.sessions.find((item) => item.id === sourceId) : null;
  const match = source === 'match' ? data.matches.find((item) => item.id === sourceId) : null;
  if (source === 'session' && !session) throw new Error('La sesión ya no está disponible.');
  if (source === 'match' && !match) throw new Error('El partido ya no está disponible.');
  const callup = match ? data.callups.find((item) => item.id === match.callupId || item.matchId === match.id) : null;
  if (match && !callup?.availableIds?.length) throw new Error('Este partido necesita una convocatoria antes de pasar asistencia.');
  const players = match ? data.players.filter((player) => callup.availableIds.includes(player.id)) : data.players;
  const existing = match ? attendanceForMatch(data.trainings, match.id) : attendanceForSession(data.trainings, session);
  const byPlayer = new Map((existing?.attendance || []).map((entry) => [entry.playerId, entry]));
  const root = $('#training-builder');
  if (!root) return;
  const title = match ? `Partido · ${match.opponent || 'Rival'}` : sessionName(session);
  const subtitle = match
    ? `${formatDate(match.date)} · ${match.type === 'league' ? 'Liga' : match.type === 'friendly' ? 'Amistoso' : 'Torneo'}`
    : `${formatDate(session.date)} · ${session.blocks?.length || 0} ejercicios · ${Number(session.totalDuration) || 0} min`;

  root.classList.remove('hidden');
  root.innerHTML = `<form id="training-form" data-visual-attendance="1" data-attendance-source="${source}" data-source-id="${esc(sourceId)}" data-attendance-id="${esc(existing?.id || '')}">
    <div class="attendance-editor-head">
      <div><span class="pill ${match ? 'accent' : ''}">${match ? 'Partido' : 'Sesión'}</span><h3>${esc(title)}</h3><p class="meta">${esc(subtitle)}</p></div>
      <button type="button" class="secondary attendance-all-present">Todos presentes</button>
    </div>
    <div class="attendance-editor-summary" aria-live="polite"></div>
    <div class="attendance-player-list">${players.map((player) => statusRow(player, byPlayer.get(player.id))).join('')}</div>
    <label>Notas generales<textarea name="notes" maxlength="1000" placeholder="Opcional: contexto general de la sesión o partido">${esc(existing?.notes || '')}</textarea></label>
    <div class="button-row attendance-save-row"><button class="primary" type="submit">Guardar asistencia</button><button type="button" class="secondary cancel-training">Cancelar</button></div>
  </form>`;
  updateEditorSummary($('#training-form', root));
  root.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveVisualAttendance(form) {
  const source = form.dataset.attendanceSource;
  const sourceId = form.dataset.sourceId;
  const data = await snapshot();
  const session = source === 'session' ? data.sessions.find((item) => item.id === sourceId) : null;
  const match = source === 'match' ? data.matches.find((item) => item.id === sourceId) : null;
  if (source === 'session' && !session) throw new Error('La sesión ya no está disponible.');
  if (source === 'match' && !match) throw new Error('El partido ya no está disponible.');
  const callup = match ? data.callups.find((item) => item.id === match.callupId || item.matchId === match.id) : null;
  if (match && !callup?.availableIds?.length) throw new Error('El partido ya no tiene una convocatoria válida.');
  const players = match ? data.players.filter((player) => callup.availableIds.includes(player.id)) : data.players;
  const existing = match ? attendanceForMatch(data.trainings, match.id) : attendanceForSession(data.trainings, session);
  const attendance = players.map((player) => {
    const status = form.elements[`status-${player.id}`]?.value || 'present';
    if (!['present', 'late', 'absent'].includes(status)) throw new Error(`Estado no válido para ${player.name}.`);
    const hour = form.elements[`arrivalHour-${player.id}`]?.value || '';
    const minute = form.elements[`arrivalMinute-${player.id}`]?.value || '';
    const arrivalTime = status === 'late' && hour && minute ? `${hour}:${minute}` : '';
    return {
      playerId: player.id,
      status,
      arrivalTime,
      note: String(form.elements[`note-${player.id}`]?.value || '').trim(),
    };
  });
  const record = {
    ...(existing || {}),
    id: existing?.id || crypto.randomUUID(),
    kind: match ? 'match' : 'training',
    matchId: match?.id || null,
    sessionId: session?.id || null,
    date: dateOnly(match?.date || session?.date),
    notes: String(form.elements.notes?.value || '').trim(),
    attendance,
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  await put('trainings', record);
  $('#training-builder')?.classList.add('hidden');
  await renderSources();
  showToast('Asistencia guardada. La ficha de cada jugador se ha actualizado.');
}

async function openAttendanceRecord(button) {
  const [trainings, settings] = await Promise.all([getAll('trainings'), getAll('settings')]);
  const record = trainings.find((item) => item.id === button.dataset.id);
  if (!record) throw new Error('El registro de asistencia ya no existe.');
  if (record.sessionId) return openActivityAttendance('session', record.sessionId);
  if (record.matchId) return openActivityAttendance('match', record.matchId);
  if (record.kind === 'training' && record.date) {
    const session = settings.find((item) => item?.recordType === 'trainingSession' && dateOnly(item.date) === dateOnly(record.date));
    if (session) return openActivityAttendance('session', session.id);
  }
  // Registro histórico sin vínculo: conserva el editor antiguo en lugar de perderlo.
  button.dataset.visualFallback = '1';
  button.click();
  delete button.dataset.visualFallback;
}

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2600);
}

function installStyles() {
  if ($('#attendance-visual-styles')) return;
  const style = document.createElement('style');
  style.id = 'attendance-visual-styles';
  style.textContent = `
    .attendance-source-panel{display:grid;gap:.9rem;margin-bottom:1rem}.attendance-overview{margin:0}.attendance-overview-head h3{margin:.1rem 0}.attendance-overview-stats,.attendance-editor-summary,.attendance-mini-counts{display:flex;gap:.45rem;flex-wrap:wrap;margin-top:.75rem}.attendance-overview-stats>span,.attendance-editor-summary>span,.attendance-mini-counts>span{display:inline-flex;align-items:center;gap:.3rem;padding:.42rem .65rem;border-radius:999px;background:var(--paper);border:1px solid var(--line);font-size:.78rem}.attendance-overview-stats .present,.attendance-editor-summary .present,.attendance-mini-counts .present{border-color:#a9d8bd;background:#edf8f1}.attendance-overview-stats .late,.attendance-editor-summary .late,.attendance-mini-counts .late{border-color:#e7cf82;background:#fff8dc}.attendance-overview-stats .absent,.attendance-editor-summary .absent,.attendance-mini-counts .absent{border-color:#e4abab;background:#fff0f0}.attendance-filters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.45rem;margin-top:.8rem}.attendance-filter{display:flex;justify-content:center;align-items:center;gap:.35rem;min-height:42px;background:var(--card);border:1px solid var(--line);color:var(--ink)}.attendance-filter.active{border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}.attendance-activity-list{display:grid;gap:.65rem}.attendance-activity-card{margin:0}.attendance-activity-head{display:flex;align-items:center;justify-content:space-between;gap:.8rem}.attendance-activity-head h3{margin:.35rem 0 .15rem}.attendance-tags{display:flex;align-items:center;gap:.35rem;flex-wrap:wrap}.attendance-saved,.attendance-pending{font-size:.7rem;font-weight:800;padding:.25rem .45rem;border-radius:999px}.attendance-saved{background:#eaf7ef;color:#185b34}.attendance-pending{background:#f1f2f1;color:var(--muted)}
    #training-builder:has([data-visual-attendance="1"]){padding:0;background:transparent;border:0;box-shadow:none}#training-form[data-visual-attendance="1"]{display:grid;gap:.8rem}.attendance-editor-head{display:flex;align-items:flex-start;justify-content:space-between;gap:.8rem;padding:1rem;background:var(--card);border:1px solid var(--line);border-radius:14px}.attendance-editor-head h3{margin:.4rem 0 .15rem}.attendance-editor-summary{margin:0;padding:.1rem}.attendance-player-list{display:grid;gap:.55rem}.attendance-player-row{display:grid;grid-template-columns:minmax(150px,.8fr) minmax(270px,1.25fr) minmax(230px,1fr);gap:.8rem;align-items:center;margin:0;padding:.75rem}.attendance-player-ident{display:flex;align-items:center;gap:.6rem;min-width:0}.attendance-player-ident>div{display:grid;min-width:0}.attendance-player-ident strong{overflow-wrap:anywhere}.attendance-player-ident small{color:var(--muted)}.attendance-avatar{display:grid;place-items:center;flex:0 0 38px;width:38px;height:38px;border-radius:50%;background:var(--ink);color:var(--card);font-size:.72rem;font-weight:800}.attendance-status-choices{display:grid;grid-template-columns:repeat(3,1fr);gap:.35rem}.attendance-choice{position:relative;display:grid;place-items:center;min-height:42px;padding:.4rem;border:1px solid var(--line);border-radius:10px;background:var(--paper);font-size:.76rem;font-weight:750;cursor:pointer}.attendance-choice input{position:absolute;opacity:0;pointer-events:none}.attendance-choice.present.selected{background:#e5f5eb;border-color:#6eb98a;color:#174f2d}.attendance-choice.late.selected{background:#fff4c9;border-color:#d4ad2e;color:#6a5100}.attendance-choice.absent.selected{background:#ffe4e4;border-color:#cf7474;color:#7b2222}.attendance-row-extra{display:grid;gap:.45rem}.attendance-note{font-size:.72rem}.attendance-note input{margin-top:.2rem}.arrival-time{display:flex;align-items:center;gap:.4rem;font-size:.72rem;color:var(--muted)}.arrival-time.hidden{display:none}.attendance-save-row{position:sticky;bottom:calc(58px + env(safe-area-inset-bottom));z-index:4;padding:.7rem;background:color-mix(in srgb,var(--card) 94%,transparent);border:1px solid var(--line);border-radius:12px;backdrop-filter:blur(8px)}
    #attendance-stats .attendance-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:.65rem}#attendance-stats .attendance-player{margin:0}#attendance-stats .mini-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:.4rem}#attendance-stats .mini-stats>span{padding:.5rem;border-radius:9px;background:var(--paper);border:1px solid var(--line)}
    .attendance-completed-group{margin-top:1rem;border:1px solid var(--line);background:var(--card);border-radius:12px;padding:.85rem}.attendance-completed-summary{display:flex;align-items:center;justify-content:space-between;gap:.5rem;cursor:pointer;list-style:none;user-select:none;font-size:.88rem;font-weight:700}.attendance-completed-summary::-webkit-details-marker{display:none}.attendance-completed-title{display:flex;align-items:center;gap:.5rem}.attendance-completed-title .toggle-icon{display:inline-block;transition:transform .2s ease;font-size:.75rem;color:var(--muted)}details[open].attendance-completed-group .toggle-icon{transform:rotate(90deg)}.attendance-completed-list{margin-top:.85rem;border-top:1px solid var(--line);padding-top:.85rem}
    @media(max-width:900px){.attendance-player-row{grid-template-columns:1fr 1.4fr}.attendance-row-extra{grid-column:1/-1;grid-template-columns:1fr 2fr}.attendance-filters{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:620px){.attendance-activity-head,.attendance-editor-head{align-items:stretch;flex-direction:column}.attendance-activity-head>button,.attendance-editor-head>button{width:100%}.attendance-player-row{grid-template-columns:1fr}.attendance-row-extra{grid-column:auto;grid-template-columns:1fr}.attendance-status-choices{gap:.25rem}.attendance-choice{min-height:46px;padding:.35rem .2rem}.attendance-save-row{display:grid;grid-template-columns:1fr 1fr}.attendance-save-row button{width:100%}}
  `;
  document.head.appendChild(style);
}

function install() {
  installStyles();
  sourcePanel();
  scheduleRender();

  document.addEventListener('click', (event) => {
    const filter = event.target.closest('[data-attendance-filter]');
    if (filter) {
      activeFilter = filter.dataset.attendanceFilter;
      scheduleRender();
      return;
    }
    const source = event.target.closest('[data-attendance-source][data-source-id]');
    if (source && !source.closest('#training-form')) {
      event.preventDefault();
      openActivityAttendance(source.dataset.attendanceSource, source.dataset.sourceId).catch((error) => showToast(error.message));
      return;
    }
    const edit = event.target.closest('.edit-attendance[data-id]');
    if (edit && edit.dataset.visualFallback !== '1') {
      event.preventDefault();
      event.stopImmediatePropagation();
      openAttendanceRecord(edit).catch((error) => showToast(error.message));
      return;
    }
    const allPresent = event.target.closest('.attendance-all-present');
    if (allPresent) {
      const form = allPresent.closest('form');
      $$('input[type="radio"][value="present"]', form).forEach((input) => { input.checked = true; });
      updateEditorSummary(form);
      return;
    }
    if (event.target.closest('[data-view="asistencia"]')) scheduleRender();
    if (event.target.closest('.delete-session')) scheduleCleanup();
  }, true);

  document.addEventListener('change', (event) => {
    const form = event.target.closest('#training-form[data-visual-attendance="1"]');
    if (!form || !event.target.matches('input[type="radio"][name^="status-"]')) return;
    // El formulario visual comparte contenedor con el editor histórico. Cortamos este
    // cambio aquí para que el listener legado no intente tratar estos chips como <select>.
    event.stopImmediatePropagation();
    updateEditorSummary(form);
  }, true);

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('#training-form[data-visual-attendance="1"]');
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    saveVisualAttendance(form).catch((error) => showToast(error.message || 'No se pudo guardar la asistencia.'));
  }, true);

  document.addEventListener('campobase:data-changed', (event) => {
    const stores = new Set(event.detail?.stores ?? []);
    if (['trainings', 'matches', 'callups', 'players', 'settings'].some((store) => stores.has(store))) scheduleRender();
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
