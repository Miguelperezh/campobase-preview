(() => {
  'use strict';

  const SUPABASE_URL = 'https://mdzpygfwugawlmknywxa.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_j7duh_i5pNnMZMtT0YT-fg_l76UA_gH';
  const client = globalThis.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true },
  });

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const dateOnly = (value = '') => String(value).slice(0, 10);

  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function assertClient() {
    if (!client) throw new Error('No está disponible la conexión de CampoBase con Supabase.');
  }

  async function readPayload(table, id) {
    assertClient();
    const { data, error } = await client.from(table).select('id,payload,deleted_at').eq('id', id).limit(1);
    if (error) throw error;
    const row = Array.isArray(data) ? data.find((item) => !item.deleted_at) : null;
    return row?.payload || null;
  }

  async function readActivePayloads(table) {
    assertClient();
    const { data, error } = await client.from(table).select('id,payload,deleted_at');
    if (error) throw error;
    return (data || []).filter((row) => !row.deleted_at && row.payload).map((row) => row.payload);
  }

  async function upsertPayload(table, record) {
    assertClient();
    const updatedAt = Number(record.updatedAt) || Date.now();
    const { error } = await client.from(table).upsert({ id:record.id, payload:record, updated_at:updatedAt, deleted_at:null }, { onConflict:'id' });
    if (error) throw error;
  }

  function attendanceEntryFromRow(row) {
    const status = $('[data-att-status]', row)?.value || 'present';
    const hour = $('[data-att-hour]', row)?.value || '';
    const minute = $('[data-att-minute]', row)?.value || '';
    return {
      playerId: row.dataset.playerId,
      status,
      arrivalTime: status === 'late' && hour && minute ? `${hour}:${minute}` : '',
      note: String($('[data-att-note]', row)?.value || '').trim(),
    };
  }

  async function saveRealAttendance(form) {
    const kind = form.dataset.attKind === 'match' ? 'match' : 'session';
    const sourceId = form.dataset.attId;
    const table = kind === 'match' ? 'partidos' : 'configuracion';
    const event = await readPayload(table, sourceId);
    if (!event) throw new Error(kind === 'match' ? 'El partido ya no está disponible.' : 'La sesión ya no está disponible.');

    const records = await readActivePayloads('asistencias');
    const eventDate = dateOnly(event.date);
    const existing = kind === 'match'
      ? records.find((record) => record?.kind === 'match' && String(record.matchId || '') === String(sourceId))
      : records.find((record) => String(record?.sessionId || '') === String(sourceId))
        || records.find((record) => record?.kind === 'training' && dateOnly(record.date) === eventDate);

    const now = Date.now();
    const record = {
      ...(existing || {}),
      id: existing?.id || crypto.randomUUID(),
      kind: kind === 'match' ? 'match' : 'training',
      matchId: kind === 'match' ? sourceId : null,
      sessionId: kind === 'session' ? sourceId : null,
      date: eventDate,
      notes: String($('[data-att-record-notes]', form)?.value || '').trim(),
      attendance: $$('.attendance-row-full', form).map(attendanceEntryFromRow),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    await upsertPayload('asistencias', record);
    showToast('Asistencia guardada y sincronizada.');
    window.setTimeout(() => window.location.reload(), 450);
  }

  async function markAsCompleted(kind, id, button) {
    const isMatch = kind === 'match';
    const accepted = window.confirm(isMatch
      ? '¿Marcar este partido como realizado? Pasará a «Partidos jugados». La asistencia o el marcador por sí solos no lo archivan.'
      : '¿Marcar esta sesión como realizada? Pasará a «Sesiones realizadas». La asistencia o el paso de la hora por sí solos no la archivan.');
    if (!accepted) return;
    button.disabled = true;
    try {
      const table = isMatch ? 'partidos' : 'configuracion';
      const current = await readPayload(table, id);
      if (!current) throw new Error(isMatch ? 'El partido ya no está disponible.' : 'La sesión ya no está disponible.');
      const now = Date.now();
      await upsertPayload(table, { ...current, status:isMatch ? 'finished' : 'closed', closedAt:now, updatedAt:now });
      showToast(isMatch ? 'Partido marcado como realizado.' : 'Sesión marcada como realizada.');
      window.setTimeout(() => window.location.reload(), 450);
    } catch (error) {
      button.disabled = false;
      showToast(error?.message || 'No se pudo guardar el cambio.');
    }
  }

  function normalAppUrl({ view, action, id = '' }) {
    const url = new URL('./index.html', window.location.href);
    url.searchParams.set('view', view);
    url.searchParams.set('fromCampo', '1');
    if (action) url.searchParams.set('campoAction', action);
    if (id) url.searchParams.set('id', id);
    return `${url.pathname}${url.search}`;
  }

  function appendLink(actions, className, text, href) {
    if (!actions || actions.querySelector(`.${className}`)) return;
    const link = document.createElement('a');
    link.className = `btn ghost ${className}`;
    link.textContent = text;
    link.href = href;
    actions.appendChild(link);
  }

  function appendCompletedButton(actions, kind, id) {
    if (!actions || actions.querySelector(`[data-campo-complete="${kind}"]`)) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn secondary campo-complete';
    button.dataset.campoComplete = kind;
    button.dataset.id = id;
    button.textContent = '✓ Realizado';
    actions.appendChild(button);
  }

  function enhanceCards() {
    for (const card of $$('article.card[data-session-id]')) {
      if (card.closest('.fold') || card.querySelector('.status.done')) continue;
      const actions = $('.actions', card);
      const id = card.dataset.sessionId;
      appendLink(actions, 'campo-whatsapp-session', '📱 WhatsApp', normalAppUrl({ view:'sesiones', action:'whatsapp-session', id }));
      appendCompletedButton(actions, 'session', id);
    }
    for (const card of $$('article.card[data-match-id]')) {
      if (card.closest('.fold') || card.querySelector('.status.done')) continue;
      const actions = $('.actions', card);
      const id = card.dataset.matchId;
      appendLink(actions, 'campo-whatsapp-match', '📱 WhatsApp', normalAppUrl({ view:'calendario', action:'whatsapp-match', id }));
      appendCompletedButton(actions, 'match', id);
    }
  }

  function normalizeIntegratedCopy() {
    const form = $('#campo-attendance-form');
    if (form) {
      const submit = $('button[type="submit"]', form);
      if (submit) submit.textContent = 'Guardar asistencia';
      $$('.note', form).forEach((note) => {
        if (/prueba|no escrib/i.test(note.textContent || '')) note.remove();
      });
    }
    $$('.note').forEach((note) => {
      if (/prueba aislada|integración final/i.test(note.textContent || '')) note.remove();
    });
  }

  function enhance() {
    enhanceCards();
    normalizeIntegratedCopy();
  }

  function scheduleEnhance() {
    [0, 120, 350, 800, 1600, 3000].forEach((delay) => window.setTimeout(enhance, delay));
  }

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('#campo-attendance-form');
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const submit = $('button[type="submit"]', form);
    if (submit) submit.disabled = true;
    saveRealAttendance(form).catch((error) => {
      if (submit) submit.disabled = false;
      showToast(error?.message || 'No se pudo guardar la asistencia.');
    });
  }, true);

  document.addEventListener('click', (event) => {
    const complete = event.target.closest('[data-campo-complete][data-id]');
    if (complete) {
      event.preventDefault();
      event.stopImmediatePropagation();
      markAsCompleted(complete.dataset.campoComplete, complete.dataset.id, complete);
      return;
    }

    if (event.target.closest('[data-attendance-session], [data-attendance-match]')) {
      window.setTimeout(normalizeIntegratedCopy, 0);
      window.setTimeout(normalizeIntegratedCopy, 120);
    }

    const nav = event.target.closest('[data-nav]');
    if (!nav) return;
    if (nav.dataset.nav === 'vivo') {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href = normalAppUrl({ view:'partido', action:'live' });
    } else if (nav.dataset.nav === 'delegado') {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href = normalAppUrl({ view:'delegado', action:'delegate' });
    } else {
      window.setTimeout(enhanceCards, 0);
    }
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleEnhance, { once:true });
  else scheduleEnhance();
  window.addEventListener('pageshow', scheduleEnhance);
})();