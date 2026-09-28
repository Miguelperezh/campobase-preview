// Material necesario de una sesión, derivado de los ejercicios que realmente contiene.
// No suma cantidades incompatibles ni inventa totales: muestra cada requisito real y
// agrupa los ejercicios que comparten exactamente el mismo material.

import { getAll } from './db.js';
import { EJERCICIOS_VALIDADOS, toCampoBaseExercise, findValidatedExercise } from './ejercicios-validados.js';
import { initVideoSection } from './ejercicio-videos.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
let queued = false;
let snapshotCache = null;

function exerciseMaterial(exercise) {
  const validated = findValidatedExercise(exercise?.id);
  return String(validated?.vista_rapida?.material || exercise?.material || '').trim();
}

function exerciseName(exercise) {
  const validated = findValidatedExercise(exercise?.id);
  return String(validated?.nombre || exercise?.name || 'Ejercicio');
}

function buildSnapshot(records) {
  const stored = records.filter((item) => item?.recordType === 'exercise' && item.example !== true);
  const byId = new Map(stored.map((exercise) => [exercise.id, exercise]));
  for (const exercise of EJERCICIOS_VALIDADOS.map(toCampoBaseExercise)) byId.set(exercise.id, exercise);
  return {
    sessions: records.filter((item) => item?.recordType === 'trainingSession'),
    exercises: byId,
  };
}

async function snapshot() {
  if (!snapshotCache) snapshotCache = buildSnapshot(await getAll('settings'));
  return snapshotCache;
}

export function materialRequirements(session, exercisesById) {
  const groups = new Map();
  for (const block of session?.blocks || []) {
    const exercise = exercisesById.get(block.exerciseId);
    if (!exercise) continue;
    const material = exerciseMaterial(exercise);
    if (!material) continue;
    if (!groups.has(material)) groups.set(material, []);
    const names = groups.get(material);
    const name = exerciseName(exercise);
    if (!names.includes(name)) names.push(name);
  }
  return [...groups.entries()].map(([material, exercises]) => ({ material, exercises }));
}

function materialHTML(session, exercisesById, compact = false) {
  const requirements = materialRequirements(session, exercisesById);
  const manual = String(session?.material || '').trim();
  if (!requirements.length && !manual) return '';
  return `<div class="session-materials-auto ${compact ? 'compact' : 'panel'}">
    <strong>Material necesario${compact ? '' : ' para la sesión'}</strong>
    ${requirements.length ? `<ul class="plain-list">${requirements.map((item) => `<li><strong>${esc(item.material)}</strong>${compact ? '' : `<small>${esc(item.exercises.join(' · '))}</small>`}</li>`).join('')}</ul>` : ''}
    ${manual ? `<p class="meta"><strong>Material general añadido:</strong> ${esc(manual)}</p>` : ''}
  </div>`;
}

async function enhanceSessionList() {
  const root = $('#sessions-list');
  if (!root) return;
  const data = await snapshot();
  const sessionsById = new Map(data.sessions.map((session) => [session.id, session]));
  $$('.view-session[data-id]', root).forEach((button) => {
    const card = button.closest('article.panel');
    if (!card || card.querySelector('.session-materials-auto')) return;
    const session = sessionsById.get(button.dataset.id);
    if (!session) return;
    const html = materialHTML(session, data.exercises, true);
    if (!html) return;
    const plan = card.querySelector('.session-plan');
    if (plan) plan.insertAdjacentHTML('afterend', html);
  });
}

async function enhanceSessionDetail() {
  const visual = $('#session-detail-body .session-visual-detail');
  if (!visual) return;
  const data = await snapshot();
  const session = data.sessions.find((item) => item.id === visual.dataset.sessionId);
  if (!session) return;

  if (!visual.querySelector(':scope > .session-materials-auto')) {
    const html = materialHTML(session, data.exercises, false);
    if (html) {
      const summary = visual.querySelector('.session-detail-summary');
      if (summary) summary.insertAdjacentHTML('afterend', html);
    }
  }

  // El módulo visual anterior mostraba el campo manual como "Material total".
  // Lo retiramos solo en la vista visual para no duplicar la información.
  $$('#session-detail-body .session-visual-detail > .panel').forEach((panel) => {
    const strong = panel.querySelector(':scope > strong');
    if (strong?.textContent.trim() === 'Material total' && !panel.classList.contains('session-materials-auto')) panel.remove();
  });

  // Los vídeos subidos a Supabase también respetan lazy loading cuando aparecen
  // dentro de "Ver sesión". initVideoSection es idempotente.
  $$('#session-detail-body .videos').forEach((videos) => initVideoSection(videos));
}

function schedule() {
  if (queued) return;
  queued = true;
  window.setTimeout(async () => {
    queued = false;
    try {
      await enhanceSessionList();
      await enhanceSessionDetail();
    } catch (error) {
      console.warn('No se pudo calcular el material de la sesión:', error);
    }
  }, 50);
}

function installStyles() {
  if ($('#session-materials-styles')) return;
  const style = document.createElement('style');
  style.id = 'session-materials-styles';
  style.textContent = `
    .session-materials-auto{margin-top:.8rem}
    .session-materials-auto.compact{padding:.7rem .8rem;border:1px solid var(--line);border-radius:12px;background:var(--card)}
    .session-materials-auto .plain-list{margin:.45rem 0 0}
    .session-materials-auto li{margin:.25rem 0;line-height:1.35}
    .session-materials-auto li small{display:block;color:var(--muted);font-size:.72rem;font-weight:500;margin-top:.12rem}
    .session-materials-auto p{margin:.5rem 0 0}
  `;
  document.head.appendChild(style);
}

function install() {
  installStyles();
  schedule();
  const sessions = $('#sessions-list');
  const detail = $('#session-detail-body');
  if (sessions) new MutationObserver(schedule).observe(sessions, { childList: true, subtree: true });
  if (detail) new MutationObserver(schedule).observe(detail, { childList: true, subtree: true });
  document.addEventListener('click', (event) => {
    if (event.target.closest('#new-session,.edit-session,.delete-session')) snapshotCache = null;
    if (event.target.closest('[data-view="sesiones"],.view-session')) schedule();
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
