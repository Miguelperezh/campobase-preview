import './calendar-substitutions-entry.js?v=2447';
import './session-visual-planner.js?v=2451';
import './session-materials.js?v=2452';
import './session-top-actions.js?v=2458';
import './session-picker-compat.js?v=2461';
import './session-planner-ui.js?v=20260927-v66-real-calendar-dates';
import './attendance-linked-sources.js?v=claude-asistencia-3';
import './player-data-sync.js?v=2453';
import './attendance-history-responsive.js?v=2455';
import './today-dashboard.js?v=color-controls-6';

export const DEMO_DURATION_MS = 2 * 60 * 60 * 1_000;

function validDemoId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(id);
}

export function createDemoSession(id, now = Date.now()) {
  if (!validDemoId(id)) throw new TypeError('El identificador de la sesión demo no es válido.');
  if (!Number.isFinite(now)) throw new TypeError('La hora de inicio de la demo no es válida.');
  return { id, expiresAt: now + DEMO_DURATION_MS };
}

export function isDemoSessionActive(session, now = Date.now()) {
  return Boolean(
    session
    && validDemoId(session.id)
    && Number.isFinite(session.expiresAt)
    && Number.isFinite(now)
    && now < session.expiresAt,
  );
}

export function demoDatabaseName(session) {
  if (!session || !validDemoId(session.id)) throw new TypeError('La sesión demo no es válida.');
  return `campobase-demo-${session.id}`;
}

export function roleCanUseOwnerFeatures(role) {
  return role === 'owner' || role === 'demo';
}
