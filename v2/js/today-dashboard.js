// Inicio "Hoy" de CampoBase.
// Resume sesiones, partidos y tareas pendientes sin crear ni modificar datos.

import { getAll } from './db.js';

const $ = (selector, root = document) => root.querySelector(selector);
const esc = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

let renderQueued = false;
let rendering = false;
let retryTimer = 0;

export function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateOnly(value = '') { return String(value).slice(0, 10); }

function isValidDateOnly(value = '') {
  const day = dateOnly(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = Number(match[3]);
  const parsed = new Date(`${day}T12:00:00`);
  return Number.isFinite(parsed.getTime())
    && parsed.getFullYear() === year
    && parsed.getMonth() + 1 === month
    && parsed.getDate() === date;
}

function formatDay(value = '') {
  const day = dateOnly(value);
  if (!isValidDateOnly(day)) return 'Fecha inválida';
  return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(new Date(`${day}T12:00:00`)).replace('.', '');
}

function formatLongToday(now = new Date()) {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
}

function formatMatchTime(value = '') {
  const match = /T(\d{2}):(\d{2})/.exec(String(value));
  return match ? `${match[1]}:${match[2]}` : '';
}

export function sessionMinutes(session) {
  const blocks = Array.isArray(session?.blocks) ? session.blocks : [];
  const total = blocks.reduce((sum, block) => sum + (Number(block?.duration) || 0), 0);
  return blocks.length ? total : (Number(session?.totalDuration) || 0);
}

function sessionTitle(session) { return String(session?.name || '').trim() || 'Sesión de entrenamiento'; }
function matchType(match) {
  if (match?.type === 'friendly') return 'Amistoso';
  if (match?.type === 'tournament') return 'Torneo';
  return 'Liga';
}

function attendanceForSession(trainings, sessionId) {
  return trainings.find((record) => record?.sessionId === sessionId);
}

function attendanceForMatch(trainings, matchId) {
  return trainings.find((record) => record?.kind === 'match' && record?.matchId === matchId);
}

function callupForMatch(callups, match) {
  return callups.find((callup) => callup?.id === match?.callupId || callup?.matchId === match?.id);
}

export function buildTodaySummary({ sessions = [], matches = [], trainings = [], callups = [], now = new Date() } = {}) {
  const today = localDayKey(now);
  const usableSessions = sessions.filter((session) => isValidDateOnly(session?.date));
  const usableMatches = matches.filter((match) => isValidDateOnly(match?.date));

  const todaySessions = usableSessions.filter((session) => dateOnly(session.date) === today);
  const todayMatches = usableMatches.filter((match) => dateOnly(match.date) === today);

  const nextSession = [...usableSessions]
    .filter((session) => dateOnly(session.date) >= today)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0] || null;

  const nextMatch = [...usableMatches]
    .filter((match) => match?.status !== 'finished' && dateOnly(match.date) >= today)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0] || null;

  const attendancePending = [
    ...usableSessions.filter((session) => dateOnly(session.date) <= today && !attendanceForSession(trainings, session.id))
      .map((session) => ({ kind: 'session', id: session.id, date: session.date, title: sessionTitle(session) })),
    ...usableMatches.filter((match) => dateOnly(match.date) <= today && !attendanceForMatch(trainings, match.id))
      .map((match) => ({ kind: 'match', id: match.id, date: match.date, title: match.opponent || 'Partido' })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const callupPending = usableMatches
    .filter((match) => match?.status !== 'finished' && dateOnly(match.date) >= today && !callupForMatch(callups, match))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const upcomingSessions = [...usableSessions].filter(session => dateOnly(session.date) > today).sort((a,b) => String(a.date).localeCompare(String(b.date)));
  const upcomingSession = upcomingSessions[0] || null;
  return { today, todaySessions, todayMatches, nextSession, upcomingSession, upcomingSessions, nextMatch, attendancePending, callupPending };
}

function ensureShell() {
  const main = $('#app');
  const plantilla = $('#plantilla');
  const nav = $('.bottom-nav');
  if (!main || !plantilla || !nav) return null;

  let section = $('#hoy');
  if (!section) {
    section = document.createElement('section');
    section.id = 'hoy';
    section.className = document.querySelector('.view.active') ? 'view' : 'view active';
    section.setAttribute('aria-labelledby', 'title-hoy');
    section.innerHTML = `
      <div class="section-head today-section-head">
        <div><p class="eyebrow">Resumen del equipo</p><h2 id="title-hoy">Hoy</h2></div>
      </div>
      <div id="today-dashboard"><div class="panel empty">Cargando el día…</div></div>`;
    main.insertBefore(section, plantilla);
  }

  let navButton = nav.querySelector('[data-view="hoy"]');
  if (!navButton) {
    navButton = document.createElement('button');
    navButton.type = 'button';
    navButton.dataset.view = 'hoy';
    navButton.textContent = 'Hoy';
    nav.insertBefore(navButton, nav.firstElementChild);
  }

  installStyles();
  return section;
}

function installStyles() {
  if ($('#today-dashboard-styles')) return;
  const style = document.createElement('style');
  style.id = 'today-dashboard-styles';
  style.textContent = `
    #hoy{max-width:1100px;margin:0 auto}.today-section-head{margin-bottom:1rem}
    .today-hero{background:var(--brand);color:#fff;border:0;display:grid;grid-template-columns:1fr auto;gap:1rem;align-items:center;padding:clamp(1.2rem,3vw,2rem)}
    .today-hero .eyebrow,.today-hero .meta{color:#f5dfe4}.today-hero h3{font-size:clamp(1.7rem,5vw,2.7rem);margin:.1rem 0 .35rem;text-transform:capitalize}.today-hero-counts{display:flex;gap:.55rem;flex-wrap:wrap;justify-content:flex-end}
    .today-count{min-width:92px;padding:.75rem .9rem;border-radius:14px;background:#ffffff18;border:1px solid #ffffff38;text-align:center}.today-count strong{display:block;font-size:1.6rem;line-height:1}.today-count span{font-size:.72rem}
    .today-layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(270px,.75fr);gap:1rem;margin-top:1rem;align-items:start}.today-main,.today-side{display:grid;gap:1rem}.today-title-row{display:flex;align-items:center;justify-content:space-between;gap:.7rem;margin-bottom:.75rem}.today-title-row h3{margin:0}.today-event-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:.75rem}
    .today-event{box-shadow:none;position:relative;overflow:hidden}.today-event.match{border-top:5px solid var(--brand)}.today-event.session{border-top:5px solid var(--accent)}.today-event h3{font-size:1.2rem;margin:.45rem 0}.today-event-meta{display:grid;gap:.3rem;margin:.7rem 0}.today-event-meta span{font-size:.84rem;color:var(--muted)}.today-event .button-row{margin-top:.75rem}
    .today-status-row{display:flex;gap:.4rem;flex-wrap:wrap}.today-ok{background:#dcfce7;color:#166534}.today-warning{background:#fff0d8;color:#704600}.today-pending-list{display:grid;gap:.55rem}.today-pending{display:grid;grid-template-columns:1fr auto;gap:.7rem;align-items:center;padding:.72rem;border:1px solid var(--line);border-radius:12px;background:#faf9f6}.today-pending strong{display:block}.today-pending small{color:var(--muted)}
    .today-quick{display:grid;grid-template-columns:1fr 1fr;gap:.55rem}.today-quick button{min-height:54px;text-align:left}.today-empty{padding:1.2rem;background:#faf9f6;border:1px dashed var(--line);border-radius:14px;color:var(--muted)}
    @media(max-width:760px){.today-hero{grid-template-columns:1fr}.today-hero-counts{justify-content:flex-start}.today-layout{grid-template-columns:1fr}.today-count{min-width:78px}.today-quick{grid-template-columns:1fr 1fr}.today-event-grid{grid-template-columns:1fr}}
  `;
  document.head.append(style);
}

async function snapshot() {
  const [matches, trainings, settings, callups] = await Promise.all([
    getAll('matches'), getAll('trainings'), getAll('settings'), getAll('callups'),
  ]);
  const stateSessions = (typeof window !== 'undefined' && window.__campobase?.state?.trainingSessions) || [];
  const settingsSessions = settings.filter((item) => item?.recordType === 'trainingSession');
  const sessionMap = new Map();
  for (const s of settingsSessions) if (s?.id) sessionMap.set(s.id, s);
  for (const s of stateSessions) if (s?.id) sessionMap.set(s.id, s);

  return {
    matches,
    trainings,
    callups,
    sessions: [...sessionMap.values()],
    live: settings.find(item => item?.id === 'live')?.timer || null,
  };
}

function goButton(view, label, primary = false) {
  return `<button type="button" class="${primary ? 'primary cbx-btn' : 'secondary cbx-btn-secondary'}" data-today-view="${esc(view)}">${esc(label)}</button>`;
}

function sessionCard(session, trainings, today) {
  const attendance = attendanceForSession(trainings, session.id);
  const isToday = dateOnly(session.date) === today;
  const blocks = Array.isArray(session.blocks) ? session.blocks.length : 0;
  const total = sessionMinutes(session);
  const target = Number(session?.targetDuration) || ((session?.pitch && String(session.pitch).toLowerCase().includes('pilar')) ? 75 : 60);
  let durationStr = `${total} min`;
  let remainingBadge = '';
  if (target > 0) {
    const diff = target - total;
    if (diff > 0) {
      durationStr = `${total} / ${target} min (quedan ${diff} min)`;
      remainingBadge = `<span class="pill today-warning">Quedan ${diff} min</span>`;
    } else if (diff < 0) {
      const surplus = Math.abs(diff);
      durationStr = `${total} / ${target} min (sobran ${surplus} min)`;
      remainingBadge = `<span class="pill today-warning">Sobran ${surplus} min</span>`;
    } else {
      durationStr = `${total} min completos`;
      remainingBadge = `<span class="pill today-ok">Completa</span>`;
    }
  }
  return `<article class="panel cbx-card today-event session">
    <div class="today-status-row"><span class="pill accent">${isToday ? 'HOY' : esc(formatDay(session.date))}</span><span class="pill">Entrenamiento</span>${remainingBadge}${attendance ? '<span class="pill today-ok">Asistencia hecha</span>' : '<span class="pill today-warning">Asistencia pendiente</span>'}</div>
    <h3>${esc(sessionTitle(session))}</h3>
    <div class="today-event-meta">${session.time ? `<span>${esc(session.time)}</span>` : ''}<span><strong>${esc(durationStr)}</strong> · ${blocks} ${blocks === 1 ? 'ejercicio' : 'ejercicios'}</span>${session.pitch ? `<span>${esc(session.pitch)}</span>` : ''}${session.material ? `<span>Material: ${esc(session.material)}</span>` : ''}</div>
    <div class="cbx-session-track" aria-label="Duración por bloques">${(session.blocks || []).map((block, index) => `<span style="flex:${Math.max(0, Number(block.duration) || 0)};background:${index === 0 ? 'var(--cbx-amber)' : index === blocks - 1 ? 'var(--cbx-blue)' : 'var(--cbx-acc)'}"></span>`).join('')}${target > total ? `<span style="flex:${target-total};background:var(--cbx-line)"></span>` : ''}</div>
    <div class="button-row">${goButton('sesiones', 'Ver sesión', true)}${goButton('asistencia', attendance ? 'Ver asistencia' : 'Pasar asistencia')}<button type="button" class="accent open-whistle-session" data-id="${esc(session.id)}">Silbato</button><button type="button" class="accent open-whatsapp-session" data-id="${esc(session.id)}">WhatsApp</button></div>
  </article>`;
}

function matchCard(match, trainings, callups, today, live = null) {
  const attendance = attendanceForMatch(trainings, match.id);
  const callup = callupForMatch(callups, match);
  const isToday = dateOnly(match.date) === today;
  const time = formatMatchTime(match.date);
  const venue = match.venue === 'away' ? 'Fuera' : 'Casa';
  const isLive = live?.matchId === match.id && live.phase !== 'finished' && live.phase !== 'ready';
  const hasResult = match.status === 'finished' || isLive;
  const score = isLive ? (live.details || match) : match;
  const team = typeof document === 'undefined' ? '' : ($('#topbar-team-name')?.textContent || 'Equipo');
  const crest = typeof document === 'undefined' ? '' : ($('#topbar-club-crest')?.getAttribute('src') || 'icons/escudo.png');
  const elapsed = Math.max(0, Number(live?.elapsed) || 0) + (live?.runningSince ? Math.max(0, (Date.now() - live.runningSince) / 1000) : 0);
  const clock = `${Math.floor(elapsed / 60)}:${String(Math.floor(elapsed % 60)).padStart(2, '0')}`;
  const scoreboard = hasResult ? `<div class="cbx-today-score"><div><img src="${esc(crest)}" alt=""><strong>${esc(team)}</strong></div><div><b>${Number(score.goalsFor) || 0} - ${Number(score.goalsAgainst) || 0}</b><small>${isLive ? esc(clock) : 'Finalizado'}</small></div><div><span class="cbx-opponent-crest">${esc((match.opponent || '').split(/\s+/).map(w => w[0]).slice(0,2).join(''))}</span><strong>${esc(match.opponent || 'Rival')}</strong></div></div>` : `<h3>${esc(match.opponent || 'Partido')}</h3>`;
  return `<article class="panel cbx-card today-event match ${hasResult ? 'cbx-today-match-score' : ''}">
    ${isLive ? '<span class="cbx-live-badge">● EN JUEGO</span>' : ''}
    <div class="today-status-row"><span class="pill accent">${isToday ? 'HOY' : esc(formatDay(match.date))}</span><span class="pill type-${esc(match.type || 'league')}">${esc(matchType(match))}</span>${callup ? '<span class="pill today-ok">Convocatoria lista</span>' : '<span class="pill today-warning">Falta convocatoria</span>'}</div>
    ${scoreboard}
    <div class="today-event-meta"><span><strong>${time || 'Hora pendiente'}</strong> · ${venue}</span>${match.location ? `<span>${esc(match.location)}</span>` : ''}${attendance ? '<span>Asistencia registrada</span>' : '<span>Asistencia pendiente</span>'}</div>
    <div class="button-row">${isLive ? goButton('partido', 'Abrir partido en vivo', true) : ''}${goButton('calendario', 'Ver partido', true)}${callup ? goButton('convocatorias', 'Ver convocatoria') : goButton('convocatorias', 'Crear convocatoria')}${callup ? `<button type="button" class="accent open-whatsapp-callup" data-id="${esc(callup.id)}">WhatsApp</button>` : `<button type="button" class="accent open-whatsapp-match" data-id="${esc(match.id)}">WhatsApp</button>`}</div>
  </article>`;
}

function pendingPanel(summary) {
  const attendanceRows = summary.attendancePending.slice(0, 3).map((item) => `<div class="today-pending"><div><strong>Asistencia pendiente</strong><small>${esc(item.title)} · ${esc(formatDay(item.date))}</small></div>${goButton('asistencia', 'Abrir')}</div>`).join('');
  const callupRows = summary.callupPending.slice(0, 3).map((match) => `<div class="today-pending"><div><strong>Falta convocatoria</strong><small>${esc(match.opponent || 'Partido')} · ${esc(formatDay(match.date))}${formatMatchTime(match.date) ? ` · ${esc(formatMatchTime(match.date))}` : ''}</small></div>${goButton('convocatorias', 'Abrir')}</div>`).join('');
  const rows = `${callupRows}${attendanceRows}`;
  return `<article class="panel"><div class="today-title-row"><h3>Pendiente de hacer</h3><span class="pill ${rows ? 'today-warning' : 'today-ok'}">${summary.callupPending.length + summary.attendancePending.length}</span></div>${rows ? `<div class="today-pending-list">${rows}</div>` : '<div class="today-empty">No tienes tareas pendientes detectadas.</div>'}</article>`;
}

function nextPanel(summary, data) {
  const items = (summary.upcomingSessions || []).slice(0, 3).map(session => ({date:session.date, markup:sessionCard(session, data.trainings, summary.today)}));
  if (summary.nextMatch && dateOnly(summary.nextMatch.date) !== summary.today) items.push({date:summary.nextMatch.date, markup:matchCard(summary.nextMatch, data.trainings, data.callups, summary.today)});
  items.sort((a,b) => String(a.date).localeCompare(String(b.date)));
  return `<article class="panel"><div class="today-title-row"><h3>Lo próximo</h3></div>${items.length ? `<div class="today-event-grid">${items.map(item=>item.markup).join('')}</div>` : '<div class="today-empty">Lo próximo ya está incluido en las actividades de hoy.</div>'}</article>`;
}

export function buildLeagueSummary(matches = []) {
  const games = matches.filter(match => match.type === 'league' && match.status === 'finished'
    && Number.isFinite(match.goalsFor) && Number.isFinite(match.goalsAgainst))
    .sort((a,b) => String(a.date).localeCompare(String(b.date)));
  return { games, goalsFor: games.reduce((n,m) => n + m.goalsFor, 0), goalsAgainst: games.reduce((n,m) => n + m.goalsAgainst, 0),
    points: games.reduce((n,m) => n + (m.goalsFor > m.goalsAgainst ? 3 : m.goalsFor === m.goalsAgainst ? 1 : 0), 0) };
}

function seasonPanel(matches) {
  const season = buildLeagueSummary(matches);
  const max = Math.max(1, ...season.games.flatMap(m => [m.goalsFor, m.goalsAgainst]));
  return `<article class="panel cbx-card cbx-season"><div class="today-title-row"><h3>Temporada · Liga</h3><span class="pill today-ok">${season.points} pts</span></div>
    ${season.games.length ? `<div class="cbx-season-strip">${season.games.map((m,i) => `<button type="button" data-today-match="${esc(m.id)}" class="cbx-result cbx-result-${m.goalsFor > m.goalsAgainst ? 'W' : m.goalsFor === m.goalsAgainst ? 'D' : 'L'}" aria-label="${esc(m.opponent)}: ${m.goalsFor} a ${m.goalsAgainst}"><small>${m.round ? 'J' + esc(m.round) : i+1}</small><b>${m.goalsFor}-${m.goalsAgainst}</b><span>${esc(m.opponent)}</span></button>`).join('')}</div>
    <div class="cbx-season-bars" aria-label="Goles a favor y en contra por partido">${season.games.map((m,i) => `<div><div><i class="cbx-season-goals-for" style="height:${Math.max(2,m.goalsFor/max*60)}px"></i><i class="cbx-season-goals-against" style="height:${Math.max(2,m.goalsAgainst/max*60)}px"></i></div><small>${m.round ? 'J'+esc(m.round) : i+1}</small></div>`).join('')}</div>` : '<div class="today-empty">Aún no hay resultados de Liga registrados.</div>'}
    <div class="cbx-season-totals"><span>A favor · ${season.goalsFor}</span><span>En contra · ${season.goalsAgainst}</span></div></article>`;
}

function renderMarkup(summary, data) {
  const todayCards = [
    ...summary.todayMatches.map((match) => matchCard(match, data.trainings, data.callups, summary.today, data.live)),
    ...summary.todaySessions.map((session) => sessionCard(session, data.trainings, summary.today)),
  ];
  const pendingCount = summary.callupPending.length + summary.attendancePending.length;
  return `
    <section class="cbx-banner today-hero">
      <div><p class="eyebrow">Tu equipo de un vistazo</p><h3>${esc(formatLongToday())}</h3></div>
      <div class="today-hero-counts"><div class="today-count"><strong>${summary.todaySessions.length}</strong><span>sesiones hoy</span></div><div class="today-count"><strong>${summary.todayMatches.length}</strong><span>partidos hoy</span></div><div class="today-count"><strong>${pendingCount}</strong><span>pendientes</span></div></div>
    </section>
    <div class="today-layout">
      <div class="today-main">
        <article class="panel"><div class="today-title-row"><h3>Tu día</h3><span class="pill accent">${summary.todayMatches.length + summary.todaySessions.length} ${summary.todayMatches.length + summary.todaySessions.length === 1 ? 'actividad' : 'actividades'}</span></div>${todayCards.length ? `<div class="today-event-grid">${todayCards.join('')}</div>` : '<div class="today-empty">Hoy no tienes sesión ni partido creado.</div>'}</article>
        ${nextPanel(summary, data)}
      </div>
      <aside class="today-side">
        ${seasonPanel(data.matches)}
        ${pendingPanel(summary)}
        <article class="panel"><div class="today-title-row"><h3>Accesos rápidos</h3></div><div class="today-quick">${goButton('sesiones', 'Sesiones')}${goButton('asistencia', 'Asistencia')}${goButton('calendario', 'Calendario')}${goButton('convocatorias', 'Convocatoria')}</div></article>
      </aside>
    </div>`;
}

export async function renderTodayDashboard() {
  const section = ensureShell();
  const root = $('#today-dashboard');
  if (!section || !root || rendering) return;
  rendering = true;
  try {
    const data = await snapshot();
    const summary = buildTodaySummary({ ...data, now: new Date() });
    root.innerHTML = renderMarkup(summary, data);
    window.clearTimeout(retryTimer);
  } catch (error) {
    root.innerHTML = '<div class="panel empty">Preparando el resumen de hoy…</div>';
    window.clearTimeout(retryTimer);
    retryTimer = window.setTimeout(() => scheduleRender(), 500);
  } finally {
    rendering = false;
  }
}

function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  window.setTimeout(() => {
    renderQueued = false;
    if ($('#hoy')?.classList.contains('active')) renderTodayDashboard();
  }, 50);
}

function bind() {
  const section = ensureShell();
  if (!section) return;

  document.addEventListener('click', (event) => {
    const match = event.target.closest('[data-today-match]');
    if (match) { window.__campobase?.showMatchDetail?.(match.dataset.todayMatch); return; }
    const target = event.target.closest('[data-today-view]');
    if (!target) return;
    const view = target.dataset.todayView;
    document.querySelector(`.bottom-nav button[data-view="${view}"]`)?.click();
  });

  const observer = new MutationObserver(() => {
    if (section.classList.contains('active')) scheduleRender();
  });
  observer.observe(section, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('campobase:data-changed', () => scheduleRender());
  window.addEventListener('load', () => scheduleRender(), { once: true });
  window.setTimeout(() => scheduleRender(), 250);
  window.setTimeout(() => scheduleRender(), 1000);
  window.setInterval(() => {
    if (section.classList.contains('active') && !document.querySelector('dialog[open]')) scheduleRender();
  }, 30000);
}

if (typeof document !== 'undefined') bind();
