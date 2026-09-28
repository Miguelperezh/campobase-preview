(() => {
  'use strict';

  const SUPABASE_URL = 'https://mdzpygfwugawlmknywxa.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_j7duh_i5pNnMZMtT0YT-fg_l76UA_gH';
  const LEGACY_SESSION_CUTOFF = '2026-09-15';

  const state = {
    players: [],
    callups: [],
    matches: [],
    attendance: [],
    settings: [],
    sessions: [],
    team: {},
    field: null,
    attendanceDrafts: new Map(),
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const clone = (value) => JSON.parse(JSON.stringify(value));

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function dateKey(value = '') { return String(value).slice(0, 10); }
  function timeFrom(value = '') { return String(value).includes('T') ? String(value).split('T')[1].slice(0, 5) : ''; }
  function fmtDate(value) {
    const key = dateKey(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return key || 'Sin fecha';
    return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(`${key}T12:00:00`));
  }
  function relation(value) {
    const key = dateKey(value);
    const today = todayKey();
    const t = new Date(`${today}T12:00:00`);
    t.setDate(t.getDate() + 1);
    const tomorrow = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    if (key === today) return 'Hoy';
    if (key === tomorrow) return 'Mañana';
    return fmtDate(key);
  }

  function sessionClosed(session) {
    if (session?.status === 'closed' || session?.status === 'finished' || session?.closedAt || session?.archived === true) return true;
    const key = dateKey(session?.date);
    return /^\d{4}-\d{2}-\d{2}$/.test(key) && key < LEGACY_SESSION_CUTOFF;
  }
  function matchClosed(match) {
    return match?.status === 'finished' || match?.status === 'closed' || Boolean(match?.closedAt);
  }

  async function readTable(client, table) {
    const query = client.from(table).select('id,payload,updated_at,deleted_at');
    if (typeof query.abortSignal === 'function' && typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      query.abortSignal(AbortSignal.timeout(8000));
    }
    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message || error.code || 'error de lectura'}`);
    return (data || []).filter((row) => !row.deleted_at && row.payload).map((row) => row.payload);
  }

  function sourceText() {
    return `Supabase directo · ${state.players.length} jugadores · ${state.sessions.length} sesiones · ${state.matches.length} partidos · ${state.attendance.length} asistencias`;
  }
  function status(text, cls) { return `<span class="status ${cls}">${esc(text)}</span>`; }
  function sessionMinutes(session) {
    const sum = (session?.blocks || []).reduce((acc, block) => acc + (Number(block?.duration) || 0), 0);
    return sum || Number(session?.totalDuration) || Number(session?.targetDuration) || 0;
  }
  function playerName(id) { return state.players.find((p) => String(p.id) === String(id))?.name || 'Jugador'; }
  function teamName() { return state.team.teamName || 'Mi equipo'; }

  function sessionCard(session, archived = false) {
    const rel = relation(session.date);
    return `<article class="card" data-session-id="${esc(session.id)}">
      ${status(archived ? 'Realizada' : rel === 'Hoy' ? 'Hoy' : 'Próxima', archived ? 'done' : rel === 'Hoy' ? 'today' : 'next')}
      <h3>${esc(session.name || 'Sesión de entrenamiento')}</h3>
      <p>${esc(rel)}${session.time ? ` · ${esc(session.time)}` : ''}${session.pitch ? ` · ${esc(session.pitch)}` : ''}</p>
      <div class="meta"><span class="pill">⏱ ${sessionMinutes(session) || '—'} min</span><span class="pill">⚽ ${(session.blocks || []).length} ejercicios</span>${session.material ? `<span class="pill">📦 ${esc(session.material)}</span>` : ''}</div>
      <div class="actions">
        <button class="btn primary" data-start-session="${esc(session.id)}">▶ Entrenar ahora</button>
        <button class="btn secondary" data-attendance-session="${esc(session.id)}">👥 Asistencia</button>
      </div>
    </article>`;
  }
  function matchCard(match, archived = false) {
    const rel = relation(match.date);
    const time = timeFrom(match.date);
    return `<article class="card" data-match-id="${esc(match.id)}">
      ${status(archived ? 'Jugado' : rel === 'Hoy' ? 'Hoy' : 'Próximo', archived ? 'done' : rel === 'Hoy' ? 'today' : 'next')}
      <h3>${esc(match.opponent || 'Rival')}</h3>
      <p>${esc(rel)}${time ? ` · ${esc(time)}` : ''}${match.location ? ` · ${esc(match.location)}` : ''}</p>
      <div class="meta"><span class="pill">${match.venue === 'away' ? '✈ Fuera' : '🏠 Casa'}</span>${archived ? `<span class="pill">⚽ ${Number(match.goalsFor) || 0}–${Number(match.goalsAgainst) || 0}</span>` : ''}</div>
      <div class="actions">
        <button class="btn primary" data-start-match="${esc(match.id)}">${archived ? 'Ver partido' : '▶ Partido ahora'}</button>
        <button class="btn secondary" data-attendance-match="${esc(match.id)}">👥 Asistencia</button>
      </div>
    </article>`;
  }

  function upcomingSessions() { return state.sessions.filter((s) => !sessionClosed(s)).sort((a,b) => `${a.date || ''}${a.time || ''}`.localeCompare(`${b.date || ''}${b.time || ''}`)); }
  function archivedSessions() { return state.sessions.filter(sessionClosed).sort((a,b) => `${b.date || ''}${b.time || ''}`.localeCompare(`${a.date || ''}${a.time || ''}`)); }
  function upcomingMatches() { return state.matches.filter((m) => !matchClosed(m)).sort((a,b) => String(a.date || '').localeCompare(String(b.date || ''))); }
  function archivedMatches() { return state.matches.filter(matchClosed).sort((a,b) => String(b.date || '').localeCompare(String(a.date || ''))); }

  function renderHoy() {
    const today = todayKey();
    const session = upcomingSessions().find((s) => dateKey(s.date) === today) || upcomingSessions()[0];
    const match = upcomingMatches().find((m) => dateKey(m.date) === today) || upcomingMatches()[0];
    const actualTodaySession = session && dateKey(session.date) === today;
    const actualTodayMatch = match && dateKey(match.date) === today;
    let title = 'Lo esencial a golpe de vista';
    let text = 'Prueba independiente. Los datos se leen directamente desde Supabase.';
    let actions = `<button class="btn accent big" data-nav="entrenos">Ver entrenos</button><button class="btn ghost big" data-nav="partidos">Ver partidos</button>`;
    if (actualTodayMatch) {
      title = `Partido hoy contra ${match.opponent || 'el rival'}`;
      text = `${timeFrom(match.date) ? `A las ${timeFrom(match.date)} · ` : ''}${match.location || 'Ubicación no indicada'}`;
      actions = `<button class="btn accent big" data-start-match="${esc(match.id)}">▶ Abrir partido</button><button class="btn ghost big" data-attendance-match="${esc(match.id)}">👥 Asistencia</button>`;
    } else if (actualTodaySession) {
      title = `Entrenamiento hoy${session.time ? ` · ${session.time}` : ''}`;
      text = `${session.name || 'Sesión preparada'} · ${sessionMinutes(session) || '—'} min${session.pitch ? ` · ${session.pitch}` : ''}`;
      actions = `<button class="btn accent big" data-start-session="${esc(session.id)}">▶ Empezar entrenamiento</button><button class="btn ghost big" data-attendance-session="${esc(session.id)}">👥 Asistencia</button>`;
    }
    $('#hoy').innerHTML = `<section class="hero"><p class="kicker">Qué toca ahora</p><h2>${esc(title)}</h2><p>${esc(text)}</p><div class="actions">${actions}</div></section>
      <p class="source-proof">${esc(sourceText())}</p>
      <div class="grid"><section><div class="section-head"><h3>Próximo entreno</h3><span>${session ? esc(relation(session.date)) : '—'}</span></div>${session ? sessionCard(session) : '<div class="card empty">Sin sesiones próximas</div>'}</section><section><div class="section-head"><h3>Próximo partido</h3><span>${match ? esc(relation(match.date)) : '—'}</span></div>${match ? matchCard(match) : '<div class="card empty">Sin partidos próximos</div>'}</section></div>`;
  }

  function renderEntrenos() {
    const upcoming = upcomingSessions();
    const archived = archivedSessions();
    $('#entrenos').innerHTML = `<div class="section-head"><div><p class="kicker">Entrenos</p><h2>Grande, directo y sin menús innecesarios</h2></div><span>${upcoming.length} activas</span></div>
      <div class="stack">${upcoming.length ? upcoming.map((s) => sessionCard(s)).join('') : '<div class="card empty">No hay sesiones activas</div>'}</div>
      ${archived.length ? `<details class="fold"><summary>Sesiones realizadas (${archived.length})</summary><div class="fold-body stack">${archived.map((s) => sessionCard(s,true)).join('')}</div></details>` : ''}`;
  }

  function renderPartidos() {
    const upcoming = upcomingMatches();
    const archived = archivedMatches();
    $('#partidos').innerHTML = `<div class="section-head"><div><p class="kicker">Partidos</p><h2>Partido y asistencia a un toque</h2></div><span>${upcoming.length} próximos</span></div>
      <div class="stack">${upcoming.length ? upcoming.map((m) => matchCard(m)).join('') : '<div class="card empty">No hay partidos próximos</div>'}</div>
      ${archived.length ? `<details class="fold"><summary>Partidos jugados (${archived.length})</summary><div class="fold-body stack">${archived.map((m) => matchCard(m,true)).join('')}</div></details>` : ''}`;
  }

  function liveRecord() { return state.settings.find((item) => item?.id === 'live') || null; }
  function liveTimer() { return liveRecord()?.timer || null; }
  function liveMatch() {
    const timer = liveTimer();
    return timer ? state.matches.find((m) => String(m.id) === String(timer.matchId)) || null : null;
  }
  function callupForMatch(match) {
    return state.callups.find((c) => String(c.id) === String(match?.callupId) || String(c.matchId || '') === String(match?.id));
  }
  function eligibleLiveMatches() { return upcomingMatches().filter((m) => Boolean(m.callupId || callupForMatch(m))); }
  function timerSeconds(timer) {
    if (!timer) return 0;
    let seconds = Number(timer.elapsed) || 0;
    const runningSince = Number(timer.runningSince);
    if (runningSince > 0) seconds += Math.max(0, Math.floor((Date.now() - runningSince) / 1000));
    return seconds;
  }
  function formatClock(seconds) {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    return `${String(Math.floor(safe / 60)).padStart(2,'0')}:${String(safe % 60).padStart(2,'0')}`;
  }
  function scoreFor(match, timer) {
    const details = timer?.details || {};
    return { for: Number(details.goalsFor ?? match?.goalsFor ?? 0) || 0, against: Number(details.goalsAgainst ?? match?.goalsAgainst ?? 0) || 0 };
  }
  function currentFieldIds(timer, callup) {
    const onField = Array.isArray(timer?.onField) ? timer.onField : [];
    const available = callup?.availableIds || [];
    return { onField, bench: available.filter((id) => !onField.includes(id)) };
  }
  function playerList(ids = []) {
    return ids.length ? ids.map((id) => `<div class="live-player"><strong>${esc(playerName(id))}</strong></div>`).join('') : '<p class="empty">Sin jugadores</p>';
  }

  function renderVivo() {
    const timer = liveTimer();
    const match = liveMatch();
    if (!timer || !match) {
      const eligible = eligibleLiveMatches();
      $('#vivo').innerHTML = `<div class="section-head"><div><p class="kicker">Partido en vivo</p><h2>Control de partido</h2></div></div>
        <div class="card"><h3>No hay un partido en vivo iniciado</h3><p>En la versión integrada, desde aquí podrás preparar e iniciar el partido con las mismas funciones validadas de CampoBase.</p></div>
        <div class="stack">${eligible.map((m) => `<article class="card"><h3>${esc(m.opponent || 'Rival')}</h3><p>${esc(relation(m.date))}${timeFrom(m.date) ? ` · ${esc(timeFrom(m.date))}` : ''}</p><button class="btn primary" data-preview-live="${esc(m.id)}">Ver preparación de partido</button></article>`).join('') || '<div class="card empty">No hay partidos convocados disponibles.</div>'}</div>`;
      return;
    }
    const score = scoreFor(match, timer);
    const callup = callupForMatch(match);
    const field = currentFieldIds(timer, callup);
    $('#vivo').innerHTML = `<div class="section-head"><div><p class="kicker">Partido en vivo</p><h2>${esc(teamName())} · ${esc(match.opponent || 'Rival')}</h2></div><span>${esc(timer.phase || 'ready')}</span></div>
      <section class="live-score card"><div><strong>${esc(teamName())}</strong><span>${score.for}</span></div><div class="clock-big">${formatClock(timerSeconds(timer))}</div><div><strong>${esc(match.opponent || 'Rival')}</strong><span>${score.against}</span></div></section>
      <div class="actions"><button class="btn secondary" data-attendance-match="${esc(match.id)}">👥 Asistencia</button><button class="btn primary" data-preview-live="${esc(match.id)}">Abrir vista grande</button></div>
      <div class="grid live-grid"><section class="card"><h3>En campo</h3>${playerList(field.onField)}</section><section class="card"><h3>Banquillo</h3>${playerList(field.bench)}</section></div>
      <p class="note">Prueba aislada: esta pantalla no registra goles, cambios ni tiempo. La integración final reutilizará la lógica validada de CampoBase.</p>`;
  }

  function renderDelegado() {
    const timer = liveTimer();
    const match = liveMatch();
    if (!timer || !match) {
      const eligible = eligibleLiveMatches();
      $('#delegado').innerHTML = `
        <div class="section-head"><div><p class="kicker">Vista delegado</p><h2>Control de partido y cambios</h2></div></div>
        <div class="card">
          <h3>${eligible.length ? 'Partidos convocados disponibles' : 'Disponible cuando haya partido convocado'}</h3>
          <p>Para gestionar el cronómetro, actas y cambios en directo, abre el partido convocado:</p>
          <div class="actions" style="margin-top:0.75rem;">
            ${eligible.map((m) => `<a class="btn primary" href="./index.html?view=delegado&fromCampo=1" style="text-decoration:none;display:inline-flex;align-items:center;margin-bottom:0.5rem;">▶ Iniciar ${esc(m.opponent || 'Partido')}</a>`).join('')}
            <a class="btn secondary" href="./index.html?view=delegado&fromCampo=1" style="text-decoration:none;display:inline-flex;align-items:center;">Abrir Vista Delegado completa</a>
          </div>
        </div>
      `;
      return;
    }
    const callup = callupForMatch(match);
    const field = currentFieldIds(timer, callup);
    $('#delegado').innerHTML = `<div class="section-head"><div><p class="kicker">Vista delegado</p><h2>${esc(teamName())} · ${esc(match.opponent || 'Rival')}</h2></div><span>${formatClock(timerSeconds(timer))}</span></div>
      <div class="grid live-grid"><section class="card delegate-out"><h3>Sale del campo</h3>${playerList(field.onField)}</section><section class="card delegate-in"><h3>Entra al campo</h3>${playerList(field.bench)}</section></div>
      <div class="card">
        <h3>Control de Cambios en Vivo</h3>
        <div class="actions">
          <a class="btn primary" href="./index.html?view=delegado&fromCampo=1" style="text-decoration:none;display:inline-flex;align-items:center;">⚡ Gestionar cambios en directo</a>
        </div>
      </div>`;
  }

  function showView(id) {
    $$('.view').forEach((view) => view.classList.toggle('active', view.id === id));
    $$('.nav').forEach((button) => button.classList.toggle('active', button.dataset.nav === id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function attendanceRecordForSession(session) {
    return state.attendance.find((row) => row.kind !== 'match' && String(row.sessionId || '') === String(session.id))
      || state.attendance.find((row) => row.kind !== 'match' && dateKey(row.date) === dateKey(session.date));
  }
  function attendanceRecordForMatch(match) {
    return state.attendance.find((row) => row.kind === 'match' && String(row.matchId || '') === String(match.id));
  }
  function attendanceKey(kind, id) { return `${kind}:${id}`; }
  function attendancePlayers(kind, event) {
    if (kind !== 'match') return state.players;
    const callup = callupForMatch(event);
    const ids = callup?.availableIds || [];
    return ids.length ? ids.map((pid) => state.players.find((p) => String(p.id) === String(pid))).filter(Boolean) : state.players;
  }
  function attendanceDraft(kind, event) {
    const key = attendanceKey(kind, event.id);
    if (state.attendanceDrafts.has(key)) return state.attendanceDrafts.get(key);
    const record = kind === 'match' ? attendanceRecordForMatch(event) : attendanceRecordForSession(event);
    const players = attendancePlayers(kind, event);
    const existing = new Map((record?.attendance || []).map((entry) => [String(entry.playerId), entry]));
    const draft = {
      id: record?.id || '',
      kind,
      matchId: kind === 'match' ? event.id : '',
      sessionId: kind === 'session' ? event.id : '',
      date: dateKey(record?.date || event.date),
      notes: record?.notes || '',
      attendance: players.map((p) => ({ playerId: p.id, ...(existing.get(String(p.id)) || { status:'present', arrivalTime:'', note:'' }) })),
    };
    state.attendanceDrafts.set(key, draft);
    return draft;
  }
  function hourOptions(selected = '') {
    return '<option value="">hh</option>' + Array.from({length:24},(_,i)=>String(i).padStart(2,'0')).map((v)=>`<option value="${v}" ${selected === v ? 'selected' : ''}>${v}</option>`).join('');
  }
  function minuteOptions(selected = '') {
    return '<option value="">mm</option>' + Array.from({length:60},(_,i)=>String(i).padStart(2,'0')).map((v)=>`<option value="${v}" ${selected === v ? 'selected' : ''}>${v}</option>`).join('');
  }
  function splitArrival(value = '') {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value || '');
    return { hour: match?.[1] || '', minute: match?.[2] || '' };
  }
  function attendanceSummary(draft) {
    const counts = { present:0, late:0, absent:0 };
    draft.attendance.forEach((entry) => { counts[entry.status] = (counts[entry.status] || 0) + 1; });
    return `<div class="attendance-summary"><span class="pill">✓ ${counts.present} presentes</span><span class="pill">⏱ ${counts.late} tarde</span><span class="pill">✕ ${counts.absent} ausentes</span></div>`;
  }
  function openAttendance(kind, id) {
    const isMatch = kind === 'match';
    const event = isMatch ? state.matches.find((m) => String(m.id) === String(id)) : state.sessions.find((s) => String(s.id) === String(id));
    if (!event) return;
    const draft = attendanceDraft(kind, event);
    const byId = new Map(draft.attendance.map((entry) => [String(entry.playerId), entry]));
    const rows = attendancePlayers(kind, event).slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'es')).map((player) => {
      const entry = byId.get(String(player.id)) || { status:'present', arrivalTime:'', note:'' };
      const arrival = splitArrival(entry.arrivalTime);
      return `<div class="attendance-row-full" data-player-id="${esc(player.id)}">
        <div class="attendance-player-name"><strong>${esc(player.name || 'Jugador')}</strong></div>
        <label>Estado<select data-att-status><option value="present" ${entry.status==='present'?'selected':''}>Presente</option><option value="late" ${entry.status==='late'?'selected':''}>Tarde</option><option value="absent" ${entry.status==='absent'?'selected':''}>Ausente</option></select></label>
        <div class="arrival-box ${entry.status==='late'?'':'hidden'}"><span>Hora de llegada</span><div class="time-pair"><select data-att-hour>${hourOptions(arrival.hour)}</select><b>:</b><select data-att-minute>${minuteOptions(arrival.minute)}</select></div></div>
        <label class="observation">Observaciones<input data-att-note maxlength="200" value="${esc(entry.note || '')}" placeholder="Incidencia o comentario"></label>
      </div>`;
    }).join('');
    const title = isMatch ? `Asistencia · ${event.opponent || 'Partido'}` : `Asistencia · ${event.name || 'Entrenamiento'}`;
    $('#overlay-body').innerHTML = `<form id="campo-attendance-form" data-att-kind="${kind}" data-att-id="${esc(event.id)}"><p class="kicker">${isMatch ? 'Partido' : 'Entrenamiento'}</p><h2 class="field-title">${esc(title)}</h2>${attendanceSummary(draft)}<div class="attendance-list">${rows || '<div class="empty">Sin jugadores</div>'}</div><label class="record-notes">Notas del registro<textarea data-att-record-notes maxlength="1000" placeholder="Notas generales">${esc(draft.notes || '')}</textarea></label><button class="btn primary big" type="submit">Guardar prueba de asistencia</button><p class="note">Misma estructura que la asistencia real: Presente, Tarde con hora, Ausente y observaciones. En esta prueba aislada los cambios solo viven en esta pantalla y no escriben en Supabase.</p></form>`;
    openOverlay();
  }
  function saveAttendancePreview(form) {
    const kind = form.dataset.attKind;
    const id = form.dataset.attId;
    const event = kind === 'match' ? state.matches.find((m)=>String(m.id)===String(id)) : state.sessions.find((s)=>String(s.id)===String(id));
    if (!event) return;
    const draft = attendanceDraft(kind, event);
    draft.notes = $('[data-att-record-notes]', form)?.value || '';
    draft.attendance = $$('.attendance-row-full', form).map((row) => {
      const statusValue = $('[data-att-status]', row)?.value || 'present';
      const hour = $('[data-att-hour]', row)?.value || '';
      const minute = $('[data-att-minute]', row)?.value || '';
      return {
        playerId: row.dataset.playerId,
        status: statusValue,
        arrivalTime: statusValue === 'late' && hour && minute ? `${hour}:${minute}` : '',
        note: $('[data-att-note]', row)?.value || '',
      };
    });
    state.attendanceDrafts.set(attendanceKey(kind,id), clone(draft));
    showToast('Asistencia de prueba guardada solo en esta pantalla.');
    openAttendance(kind,id);
  }

  function exerciseName(id) {
    const custom = state.settings.find((item) => item.recordType === 'exercise' && String(item.id) === String(id));
    return custom?.name || `Ejercicio ${id || 'sin identificar'}`;
  }
  function startSession(id) {
    const session = state.sessions.find((s) => String(s.id) === String(id));
    if (!session) return;
    state.field = { type:'session', id, index:0 };
    renderSessionField(session, session.blocks || []);
  }
  function renderSessionField(session, blocks) {
    const index = Math.max(0, Math.min(state.field?.index || 0, Math.max(0, blocks.length - 1)));
    const block = blocks[index];
    $('#overlay-body').innerHTML = `<p class="kicker">${esc(session.name || 'Entrenamiento')} · ${blocks.length ? `${index+1}/${blocks.length}` : 'sin ejercicios'}</p><h2 class="field-title">${esc(block ? exerciseName(block.exerciseId) : 'Sesión sin ejercicios')}</h2>${block ? `<div class="meta"><span class="pill">⏱ ${Number(block.duration)||'—'} min</span><span class="pill">${esc(block.type || 'Ejercicio')}</span></div>${block.notes ? `<div class="card"><h3>Cómo hacerlo / consigna</h3><p class="big-copy">${esc(block.notes)}</p></div>` : ''}<div class="actions"><button class="btn secondary" data-field-prev ${index===0?'disabled':''}>← Anterior</button><button class="btn primary" data-attendance-session="${esc(session.id)}">👥 Asistencia</button><button class="btn secondary" data-field-next ${index>=blocks.length-1?'disabled':''}>Siguiente →</button></div>` : ''}<p class="note">Prueba directa. Las fichas completas de ejercicios seguirán siendo las ya validadas de CampoBase en la integración final.</p>`;
    openOverlay();
  }

  function startMatch(id) {
    const match = state.matches.find((m) => String(m.id) === String(id));
    if (!match) return;
    renderMatchOverlay(match);
  }
  function renderMatchOverlay(match) {
    const timer = liveTimer();
    const active = timer && String(timer.matchId) === String(match.id);
    const score = scoreFor(match, active ? timer : null);
    const callup = callupForMatch(match);
    const field = currentFieldIds(active ? timer : null, callup);
    $('#overlay-body').innerHTML = `<p class="kicker">${esc(relation(match.date))}${timeFrom(match.date)?` · ${esc(timeFrom(match.date))}`:''}</p><h2 class="field-title">${esc(match.opponent || 'Partido')}</h2><section class="live-score card"><div><strong>${esc(teamName())}</strong><span>${score.for}</span></div><div class="clock-big">${active ? formatClock(timerSeconds(timer)) : '00:00'}</div><div><strong>${esc(match.opponent || 'Rival')}</strong><span>${score.against}</span></div></section><div class="actions"><button class="btn primary" data-attendance-match="${esc(match.id)}">👥 Asistencia</button><button class="btn secondary" data-nav="delegado" data-close-before-nav>Vista delegado</button><button class="btn secondary" data-nav="vivo" data-close-before-nav>Partido en vivo</button></div>${active ? `<div class="grid live-grid"><section class="card"><h3>En campo</h3>${playerList(field.onField)}</section><section class="card"><h3>Banquillo</h3>${playerList(field.bench)}</section></div>` : '<p class="note">El partido todavía no tiene un control en vivo activo.</p>'}`;
    openOverlay();
  }

  function openOverlay() { $('#overlay').classList.remove('hidden'); window.scrollTo({top:0}); }
  function closeOverlay() { $('#overlay').classList.add('hidden'); state.field = null; }
  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function applyCache(cache) {
    if (!cache) return;
    if (cache.players?.length) state.players = cache.players;
    if (cache.callups?.length) state.callups = cache.callups;
    if (cache.matches?.length) state.matches = cache.matches;
    if (cache.attendance?.length || cache.trainings?.length) state.attendance = cache.attendance || cache.trainings;
    const rawSettings = cache.settings;
    state.settings = Array.isArray(rawSettings) ? rawSettings : (rawSettings && typeof rawSettings === 'object' ? [rawSettings] : []);
    state.sessions = cache.sessions || cache.trainingSessions || state.settings.filter((item) => item?.recordType === 'trainingSession');
    state.team = state.settings.find((item) => item?.id === 'main') || cache.team || (typeof rawSettings === 'object' && !Array.isArray(rawSettings) ? rawSettings : {});
    const sync = $('#sync');
    if (sync) sync.textContent = `Modo local · ${state.players.length} jugadores · ${state.matches.length} partidos`;
    renderHoy(); renderEntrenos(); renderPartidos(); renderDelegado(); renderVivo();
  }

  async function load() {
    const sync = $('#sync');

    // 1. Carga inmediata síncrona desde caché provista por la página
    if (globalThis.__CAMPOBASE_CACHE__?.players?.length) {
      applyCache(globalThis.__CAMPOBASE_CACHE__);
    }

    try {
      if (!globalThis.supabase?.createClient) throw new Error('No se cargó el cliente de Supabase.');
      const client = globalThis.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
      const [players, callups, matches, attendance, settings] = await Promise.all([
        readTable(client,'jugadores'), readTable(client,'convocatorias'), readTable(client,'partidos'), readTable(client,'asistencias'), readTable(client,'configuracion'),
      ]);
      state.players = players; state.callups = callups; state.matches = matches; state.attendance = attendance; state.settings = settings;
      state.sessions = settings.filter((item) => item?.recordType === 'trainingSession');
      state.team = settings.find((item) => item?.id === 'main') || {};
      sync.textContent = sourceText();
      renderHoy(); renderEntrenos(); renderPartidos(); renderDelegado(); renderVivo();
    } catch (error) {
      // Si tenemos datos locales (de __CAMPOBASE_CACHE__), NUNCA mostrar la pantalla roja de error
      if (state.players.length > 0) {
        if (sync) sync.textContent = `Modo local · ${state.players.length} jugadores · ${state.matches.length} partidos`;
        return;
      }
      if (globalThis.__CAMPOBASE_CACHE__?.players?.length) {
        applyCache(globalThis.__CAMPOBASE_CACHE__);
        return;
      }
      sync.textContent = 'Modo local';
      // Mantener la app activa en modo local sin bloqueo
      renderHoy(); renderEntrenos(); renderPartidos(); renderDelegado(); renderVivo();
    }
  }

  window.addEventListener('campobase:cache-ready', (e) => {
    if (state.players.length === 0 && e.detail?.players?.length) {
      applyCache(e.detail);
    }
  });

  document.addEventListener('change', async (event) => {
    if (event.target?.id === 'campo-direct-file-input') {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const data = json.data || json;
        if (data.players || data.matches) {
          state.players = data.players || [];
          state.callups = data.callups || [];
          state.matches = data.matches || [];
          state.attendance = data.trainings || data.attendance || [];
          state.settings = data.settings || [];
          state.sessions = state.settings.filter((item) => item?.recordType === 'trainingSession');
          state.team = state.settings.find((item) => item?.id === 'main') || {};
          const sync = $('#sync');
          if (sync) sync.textContent = `Archivo cargado · ${state.players.length} jugadores · ${state.matches.length} partidos`;
          renderHoy(); renderEntrenos(); renderPartidos(); renderDelegado(); renderVivo();
          showToast('Datos cargados correctamente.');
        }
      } catch (err) {
        showToast('Error al leer el archivo JSON.');
      }
      return;
    }
    const statusSelect = event.target.closest('[data-att-status]');
    if (!statusSelect) return;
    const row = statusSelect.closest('.attendance-row-full');
    $('.arrival-box', row)?.classList.toggle('hidden', statusSelect.value !== 'late');
    if (statusSelect.value !== 'late') {
      const h = $('[data-att-hour]', row); const m = $('[data-att-minute]', row);
      if (h) h.value = ''; if (m) m.value = '';
    }
  });

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('#campo-attendance-form');
    if (!form) return;
    event.preventDefault();
    saveAttendancePreview(form);
  });

  document.addEventListener('click', (event) => {
    const nav = event.target.closest('[data-nav]');
    if (nav) {
      if (nav.hasAttribute('data-close-before-nav')) closeOverlay();
      showView(nav.dataset.nav);
      return;
    }
    const session = event.target.closest('[data-start-session]');
    if (session) { startSession(session.dataset.startSession); return; }
    const match = event.target.closest('[data-start-match]');
    if (match) { startMatch(match.dataset.startMatch); return; }
    const previewLive = event.target.closest('[data-preview-live]');
    if (previewLive) {
      const m = state.matches.find((item)=>String(item.id)===String(previewLive.dataset.previewLive));
      if (m) renderMatchOverlay(m);
      return;
    }
    const attSession = event.target.closest('[data-attendance-session]');
    if (attSession) { openAttendance('session', attSession.dataset.attendanceSession); return; }
    const attMatch = event.target.closest('[data-attendance-match]');
    if (attMatch) { openAttendance('match', attMatch.dataset.attendanceMatch); return; }
    if (event.target.closest('[data-close-overlay]')) { closeOverlay(); return; }
    if (event.target.closest('[data-field-prev]') && state.field?.type === 'session') {
      state.field.index = Math.max(0, state.field.index - 1);
      const s = state.sessions.find((x) => String(x.id) === String(state.field.id));
      renderSessionField(s, s?.blocks || []); return;
    }
    if (event.target.closest('[data-field-next]') && state.field?.type === 'session') {
      const s = state.sessions.find((x) => String(x.id) === String(state.field.id));
      state.field.index = Math.min(Math.max(0,(s?.blocks||[]).length-1), state.field.index + 1);
      renderSessionField(s, s?.blocks || []); return;
    }
  });

  window.addEventListener('DOMContentLoaded', load, { once:true });
})();
