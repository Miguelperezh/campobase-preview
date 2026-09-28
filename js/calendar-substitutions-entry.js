import { getAll } from './db.js';

let editorModuleLoaded = false;

async function ensureEditorModule() {
  if (!editorModuleLoaded) {
    await import('./calendar-substitutions-v2.js?v=2447');
    editorModuleLoaded = true;
  }
}

async function openWithValidCallup(button) {
  const matchId = button.dataset.id;
  const [matches, callups] = await Promise.all([getAll('matches'), getAll('callups')]);
  const match = matches.find((item) => item.id === matchId);
  if (!match) return window.alert('No se encontró el partido.');
  const callup = callups.find((item) => item.id === match.callupId || item.matchId === match.id);
  if (!callup?.availableIds?.length) {
    return window.alert('Este partido no tiene una convocatoria válida. Crea o vincula la convocatoria antes de editar alineación, cambios y tácticas.');
  }

  await ensureEditorModule();
  button.dataset.callupValidated = '1';
  button.click();
  delete button.dataset.callupValidated;
}

function protectCalendarEditor(event) {
  const button = event.target.closest('.edit-lineup-changes');
  if (!button || button.dataset.callupValidated === '1') return;
  event.preventDefault();
  event.stopImmediatePropagation();
  openWithValidCallup(button).catch((error) => window.alert(error.message || 'No se pudo comprobar la convocatoria del partido.'));
}

function makeCalendarEditorButton(matchId) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'edit-lineup-changes secondary';
  button.dataset.id = matchId;
  button.textContent = 'Alineación, cambios y tácticas';
  return button;
}

function addCalendarButtons() {
  const root = document.querySelector('#matches-list');
  if (root) {
    root.querySelectorAll('article.panel').forEach((card) => {
      const detail = card.querySelector('.match-detail');
      const actions = detail?.closest('.button-row');
      const finished = [...card.querySelectorAll('.pill')].some((pill) => pill.textContent.trim() === 'Finalizado');
      if (!detail || !actions || !finished || actions.querySelector('.edit-lineup-changes')) return;
      actions.insertBefore(makeCalendarEditorButton(detail.dataset.id), detail.nextSibling);
    });
  }

  const dialog = document.querySelector('#match-detail-dialog');
  const body = document.querySelector('#match-detail-body');
  const matchId = dialog?.dataset.matchId;
  if (dialog?.open && body && matchId && !body.querySelector('.edit-lineup-changes')) {
    const actions = body.querySelector('.button-row');
    if (actions) actions.prepend(makeCalendarEditorButton(matchId));
  }
}

function installCalendarButtons() {
  addCalendarButtons();
  const matchesRoot = document.querySelector('#matches-list');
  const detailBody = document.querySelector('#match-detail-body');
  if (matchesRoot) new MutationObserver(addCalendarButtons).observe(matchesRoot, { childList: true, subtree: true });
  if (detailBody) new MutationObserver(addCalendarButtons).observe(detailBody, { childList: true, subtree: true });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-view="calendario"], .match-detail')) window.setTimeout(addCalendarButtons, 0);
  });
  window.addEventListener('pageshow', addCalendarButtons);
  window.addEventListener('focus', addCalendarButtons);
  window.setInterval(addCalendarButtons, 1500);
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', protectCalendarEditor, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installCalendarButtons, { once: true });
  else installCalendarButtons();
}
