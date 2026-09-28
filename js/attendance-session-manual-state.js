import { getAll, put } from './db.js';

const ROOT_ID = 'attendance-source-panel';
let syncTimer = 0;
let syncing = false;

function sessionIsClosed(session) {
  return Boolean(
    session?.status === 'closed'
    || session?.status === 'finished'
    || session?.closedAt
    || session?.archived === true
  );
}

async function sessionMap() {
  const settings = await getAll('settings');
  return new Map(
    settings
      .filter((item) => item?.recordType === 'trainingSession' && item?.id)
      .map((session) => [String(session.id), session]),
  );
}

function sourceIdFromCard(card) {
  return String(card?.querySelector('[data-attendance-source="session"][data-source-id]')?.dataset?.sourceId || '');
}

function ensureOpenList(root, completedGroup) {
  const directLists = [...root.children].filter((node) => node.classList?.contains('attendance-activity-list') && !node.classList?.contains('attendance-completed-list'));
  if (directLists.length) return directLists[0];
  const list = document.createElement('div');
  list.className = 'attendance-activity-list attendance-manual-open-list';
  if (completedGroup) root.insertBefore(list, completedGroup);
  else root.appendChild(list);
  return list;
}

function ensureCompletedGroup(root) {
  let group = root.querySelector('.attendance-completed-group');
  if (group) return group;
  group = document.createElement('details');
  group.className = 'attendance-completed-group panel';
  group.innerHTML = `
    <summary class="attendance-completed-summary">
      <div class="attendance-completed-title">
        <span class="toggle-icon">▶</span>
        <strong>Actividades finalizadas (0)</strong>
      </div>
      <span class="pill accent">Desplegar</span>
    </summary>
    <div class="attendance-activity-list attendance-completed-list"></div>`;
  root.appendChild(group);
  return group;
}

function normalizeSessionCardLabel(card, closed) {
  const saved = card.querySelector('.attendance-saved');
  if (saved) saved.textContent = closed ? 'Asistencia guardada' : 'Asistencia preparada';
  const pending = card.querySelector('.attendance-pending');
  if (pending && !closed) pending.textContent = 'Asistencia pendiente';
  card.dataset.sessionClosed = closed ? '1' : '0';
}

function installRealizadoButton(card, session) {
  const head = card.querySelector('.attendance-activity-head');
  if (!head) return;
  let actions = head.querySelector('.attendance-session-actions');
  if (!actions) {
    const existingButton = [...head.children].find((child) => child.tagName === 'BUTTON');
    actions = document.createElement('div');
    actions.className = 'attendance-session-actions';
    if (existingButton) {
      head.replaceChild(actions, existingButton);
      actions.appendChild(existingButton);
    } else {
      head.appendChild(actions);
    }
  }

  const existing = actions.querySelector('.attendance-mark-session-realized');
  if (sessionIsClosed(session)) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'secondary attendance-mark-session-realized';
  button.dataset.sessionId = session.id;
  button.textContent = '✓ Realizado';
  button.title = 'La sesión solo se archivará cuando pulses Realizado';
  actions.appendChild(button);
}

function sortAttendancePlayersAlphabetically() {
  const list = document.querySelector('#training-form[data-visual-attendance="1"] .attendance-player-list');
  if (!list) return;
  const rows = [...list.querySelectorAll('.attendance-player-row')];
  const sorted = [...rows].sort((a, b) => {
    const nameA = a.querySelector('.attendance-player-ident strong')?.textContent || '';
    const nameB = b.querySelector('.attendance-player-ident strong')?.textContent || '';
    return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
  });
  const alreadySorted = rows.every((row, index) => row === sorted[index]);
  if (!alreadySorted) sorted.forEach((row) => list.appendChild(row));
}

function updateCompletedGroup(group) {
  if (!group) return;
  const list = group.querySelector('.attendance-completed-list');
  const count = list?.querySelectorAll('.attendance-activity-card').length || 0;
  const strong = group.querySelector('.attendance-completed-title strong');
  if (strong) strong.textContent = `Actividades finalizadas (${count})`;
  group.hidden = count === 0;
}

async function syncAttendanceSessionState() {
  if (syncing) return;
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  syncing = true;
  try {
    const sessions = await sessionMap();
    let completedGroup = root.querySelector('.attendance-completed-group');
    let completedList = completedGroup?.querySelector('.attendance-completed-list') || null;
    let openList = [...root.children].find((node) => node.classList?.contains('attendance-activity-list') && !node.classList?.contains('attendance-completed-list')) || null;

    const cards = [...root.querySelectorAll('article.attendance-activity-card[data-activity-type="session"]')];
    for (const card of cards) {
      const id = sourceIdFromCard(card);
      const session = sessions.get(id);
      if (!session) continue;
      const closed = sessionIsClosed(session);

      normalizeSessionCardLabel(card, closed);

      if (closed) {
        if (!completedGroup) {
          completedGroup = ensureCompletedGroup(root);
          completedList = completedGroup.querySelector('.attendance-completed-list');
        }
        if (card.parentElement !== completedList) completedList.appendChild(card);
      } else {
        if (!openList) openList = ensureOpenList(root, completedGroup);
        if (card.parentElement !== openList) openList.appendChild(card);
      }
      installRealizadoButton(card, session);
    }

    updateCompletedGroup(completedGroup);
  } finally {
    syncing = false;
  }
}

function scheduleSync() {
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    syncAttendanceSessionState().catch((error) => console.warn('No se pudo sincronizar el estado manual de sesiones:', error));
  }, 40);
}

async function markSessionRealized(button) {
  const id = String(button.dataset.sessionId || '');
  if (!id) return;
  const settings = await getAll('settings');
  const session = settings.find((item) => item?.recordType === 'trainingSession' && String(item.id) === id);
  if (!session || sessionIsClosed(session)) return;

  const accepted = window.confirm('¿Marcar esta sesión como realizada? La asistencia puede prepararse días antes y no archiva la sesión; solo este botón la cierra.');
  if (!accepted) return;

  button.disabled = true;
  try {
    const now = Date.now();
    await put('settings', { ...session, status: 'closed', closedAt: now, updatedAt: now });
    if (typeof window.__campobase?.refresh === 'function') await window.__campobase.refresh();
    scheduleSync();
  } catch (error) {
    button.disabled = false;
    throw error;
  }
}

function installStyles() {
  if (document.getElementById('attendance-manual-session-style')) return;
  const style = document.createElement('style');
  style.id = 'attendance-manual-session-style';
  style.textContent = `
    .attendance-session-actions{display:flex;gap:.45rem;align-items:center;flex-wrap:wrap;justify-content:flex-end;position:relative;z-index:2}
    .attendance-session-actions>button{pointer-events:auto}
    .attendance-manual-open-list{margin-top:.75rem}
    .attendance-activity-card[data-activity-type="session"][data-session-closed="0"]{border-left:3px solid color-mix(in srgb,var(--cb-brand,#173f35) 55%,transparent)}
    @media(max-width:620px){.attendance-session-actions{width:100%;display:grid;grid-template-columns:1fr 1fr}.attendance-session-actions>button{width:100%}}
  `;
  document.head.appendChild(style);
}

function mutationTouchesAttendancePanel(mutation) {
  const target = mutation.target;
  if (target?.id === ROOT_ID || target?.closest?.(`#${ROOT_ID}`)) return true;
  return [...(mutation.addedNodes || [])].some((node) => node?.id === ROOT_ID || node?.querySelector?.(`#${ROOT_ID}`));
}

function install() {
  installStyles();
  scheduleSync();

  document.addEventListener('click', (event) => {
    const realized = event.target.closest('.attendance-mark-session-realized');
    if (realized) {
      event.preventDefault();
      event.stopImmediatePropagation();
      markSessionRealized(realized).catch((error) => console.warn('No se pudo marcar la sesión como realizada:', error));
      return;
    }

    const attendanceButton = event.target.closest('[data-attendance-source][data-source-id], .edit-attendance[data-id]');
    if (attendanceButton) {
      window.setTimeout(sortAttendancePlayersAlphabetically, 120);
      window.setTimeout(sortAttendancePlayersAlphabetically, 350);
    }
  }, true);

  document.addEventListener('campobase:data-changed', (event) => {
    const stores = new Set(event.detail?.stores || []);
    if (stores.has('settings') || stores.has('trainings') || stores.has('players')) scheduleSync();
  });

  new MutationObserver((mutations) => {
    if (mutations.some(mutationTouchesAttendancePanel)) scheduleSync();
  }).observe(document.body, { childList: true, subtree: true });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
