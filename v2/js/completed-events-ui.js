import './exercise-view-mode-ui.js?v=2519';
import './modo-campo-integration.js?v=1';
import { put } from './db.js';

// Desde el 15/09/2026 las sesiones solo se archivan cuando el entrenador las
// marca como realizadas de forma explícita. Las sesiones anteriores se conservan
// como legado para no desmontar el historial ya validado.
const SESSION_GROUP_ID = 'completed-sessions-collapsible';
const MATCH_GROUP_ID = 'played-matches-collapsible';
const MANUAL_CLOSE_FROM = '2026-09-15';
let syncQueued = false;
let completionBound = false;

function installStaffRoleThemeParity() {
  if (document.getElementById('cb-staff-role-theme-parity')) return;
  const style = document.createElement('style');
  style.id = 'cb-staff-role-theme-parity';
  style.textContent = `
    body.cb-redesign-active .staff-role-blue {
      background: var(--cb-accent, var(--accent, #c8102e)) !important;
      color: var(--cb-accent-text, #ffffff) !important;
    }
  `;
  document.head.appendChild(style);
}

function sessionIsArchived(session) {
  if (session?.status === 'closed' || session?.status === 'finished' || session?.closedAt || session?.archived === true) return true;
  const day = String(session?.date || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && day < MANUAL_CLOSE_FROM;
}

function matchIsArchived(match) {
  return match?.status === 'finished' || match?.status === 'closed' || Boolean(match?.closedAt);
}

function makeAccordion({ id, title, count }) {
  const details = document.createElement('details');
  details.id = id;
  details.className = 'panel played-matches-accordion completed-events-accordion';
  details.innerHTML = `
    <summary class="played-matches-summary">
      <div class="played-matches-head">
        <span class="pill accent">✓</span>
        <h3 class="played-matches-title">${title}</h3>
        <span class="meta played-matches-count">(${count})</span>
      </div>
      <span class="pill secondary played-toggle-pill"></span>
    </summary>
    <div class="stack played-matches-cards completed-events-cards"></div>`;
  return details;
}

function ensureManualCompletionButtons() {
  const sessionsRoot = document.getElementById('sessions-list');
  const sessions = window.__campobase?.state?.trainingSessions;
  if (sessionsRoot && Array.isArray(sessions)) {
    const byId = new Map(sessions.map((session) => [String(session.id), session]));
    for (const card of sessionsRoot.querySelectorAll('article.session-card[data-session-id]')) {
      const session = byId.get(String(card.dataset.sessionId));
      if (!session || sessionIsArchived(session)) continue;
      const actions = card.querySelector('.button-row');
      if (!actions || actions.querySelector('.mark-session-complete')) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mark-session-complete secondary';
      button.dataset.id = session.id;
      button.textContent = '✓ Realizado';
      actions.appendChild(button);
    }
  }

  const matchesRoot = document.getElementById('matches-list');
  const matches = window.__campobase?.state?.matches;
  if (matchesRoot && Array.isArray(matches)) {
    const byId = new Map(matches.map((match) => [String(match.id), match]));
    for (const card of matchesRoot.querySelectorAll('article.match-card[data-match-id]')) {
      const match = byId.get(String(card.dataset.matchId));
      if (!match || matchIsArchived(match)) continue;
      const actions = card.querySelector('.button-row');
      if (!actions || actions.querySelector('.mark-match-complete')) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mark-match-complete secondary';
      button.dataset.id = match.id;
      button.textContent = '✓ Realizado';
      actions.appendChild(button);
    }
  }
}

function groupCompletedSessions() {
  const root = document.getElementById('sessions-list');
  const sessions = window.__campobase?.state?.trainingSessions;
  if (!root || !Array.isArray(sessions)) return;

  if (root.querySelector(`#${SESSION_GROUP_ID}`)) return;

  const completedIds = new Set(
    sessions.filter(sessionIsArchived).map((session) => String(session.id)),
  );
  if (!completedIds.size) return;

  const cards = [...root.children].filter((node) =>
    node.matches?.('article.session-card[data-session-id]') && completedIds.has(String(node.dataset.sessionId)),
  );
  if (!cards.length) return;

  const group = makeAccordion({
    id: SESSION_GROUP_ID,
    title: 'Sesiones realizadas',
    count: cards.length,
  });
  const stack = group.querySelector('.completed-events-cards');
  cards.forEach((card) => stack.appendChild(card));
  root.appendChild(group);
}

function groupPlayedMatchesFallback() {
  const root = document.getElementById('matches-list');
  const matches = window.__campobase?.state?.matches;
  if (!root || !Array.isArray(matches)) return;

  if (root.querySelector(`#${MATCH_GROUP_ID}`)) return;

  const playedIds = new Set(matches.filter(matchIsArchived).map((match) => String(match.id)));
  if (!playedIds.size) return;

  const cards = [...root.children].filter((node) =>
    node.matches?.('article.match-card[data-match-id]') && playedIds.has(String(node.dataset.matchId)),
  );
  if (!cards.length) return;
  const byId = new Map(matches.map((m) => [String(m.id), m]));
  cards.sort((a, b) => {
    const ma = byId.get(String(a.dataset.matchId));
    const mb = byId.get(String(b.dataset.matchId));
    return String(mb?.date || '').localeCompare(String(ma?.date || '')) || (mb?.createdAt ?? 0) - (ma?.createdAt ?? 0);
  });

  const group = makeAccordion({ id: MATCH_GROUP_ID, title: 'Partidos jugados', count: cards.length });
  const stack = group.querySelector('.completed-events-cards');
  cards.forEach((card) => stack.appendChild(card));
  root.appendChild(group);
}

function syncCompletedEvents() {
  ensureManualCompletionButtons();
  groupCompletedSessions();
  groupPlayedMatchesFallback();
}

function scheduleSync() {
  if (syncQueued) return;
  syncQueued = true;
  requestAnimationFrame(() => {
    syncQueued = false;
    syncCompletedEvents();
  });
}

async function completeSessionManually(sessionId, button) {
  const sessions = window.__campobase?.state?.trainingSessions;
  const session = Array.isArray(sessions) ? sessions.find((item) => String(item.id) === String(sessionId)) : null;
  if (!session || sessionIsArchived(session)) return;

  const accepted = window.confirm('¿Marcar esta sesión como realizada? Pasará a «Sesiones realizadas». Guardar asistencia, editarla o pasar la hora no la archiva.');
  if (!accepted) return;

  button.disabled = true;
  try {
    const now = Date.now();
    await put('settings', { ...session, status: 'closed', closedAt: now, updatedAt: now });
    if (typeof window.__campobase?.refresh === 'function') {
      await window.__campobase.refresh(true);
      window.__campobase.renderTrainingSessions?.();
    } else window.location.reload();
  } catch (error) {
    console.warn('No se pudo marcar la sesión como realizada:', error);
    button.disabled = false;
  }
}

async function completeMatchManually(matchId, button) {
  const matches = window.__campobase?.state?.matches;
  const match = Array.isArray(matches) ? matches.find((item) => String(item.id) === String(matchId)) : null;
  if (!match || matchIsArchived(match)) return;

  const accepted = window.confirm('¿Marcar este partido como realizado? Pasará a «Partidos jugados». Guardar asistencia, editar el partido o introducir un marcador no lo archiva.');
  if (!accepted) return;

  button.disabled = true;
  try {
    const now = Date.now();
    await put('matches', { ...match, status: 'finished', closedAt: now, updatedAt: now });
    if (typeof window.__campobase?.refresh === 'function') {
      await window.__campobase.refresh(true);
      window.__campobase.renderMatches?.();
    } else window.location.reload();
  } catch (error) {
    console.warn('No se pudo marcar el partido como realizado:', error);
    button.disabled = false;
  }
}

function bindManualCompletion() {
  if (completionBound) return;
  completionBound = true;
  document.addEventListener('click', (event) => {
    const sessionButton = event.target.closest('.mark-session-complete');
    if (sessionButton) {
      event.preventDefault();
      event.stopPropagation();
      completeSessionManually(sessionButton.dataset.id, sessionButton);
      return;
    }
    const matchButton = event.target.closest('.mark-match-complete');
    if (matchButton) {
      event.preventDefault();
      event.stopPropagation();
      completeMatchManually(matchButton.dataset.id, matchButton);
    }
  });
}

function install() {
  installStaffRoleThemeParity();
  bindManualCompletion();
  syncCompletedEvents();

  const sessionsRoot = document.getElementById('sessions-list');
  const matchesRoot = document.getElementById('matches-list');
  if (sessionsRoot) new MutationObserver(scheduleSync).observe(sessionsRoot, { childList: true, subtree: true });
  if (matchesRoot) new MutationObserver(scheduleSync).observe(matchesRoot, { childList: true, subtree: true });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
