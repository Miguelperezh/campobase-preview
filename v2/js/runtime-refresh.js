import { syncFromCloud, getAll } from './db.js';

const BUTTON_ID = 'manual-refresh';
const CATEGORY = 'Mis ejercicios';
const OPEN_AFTER_SAVE_KEY = 'campobase.openMyExercises';
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const escapeMultiline = (value = '') => escapeHtml(value).replace(/\n/g, '<br>');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let customExercises = new Map();
let overlay;
let frame;
let viewerChrome;
let viewerTitle;
let viewerMeta;
let viewerStaticButton;
let viewerMotionButton;
let pendingViewer = null;
let boardObjectUrl = '';
let boardHtmlPromise = null;
let hydrationPromise = null;

function buttonMarkup() {
  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.className = 'secondary compact';
  button.textContent = 'Actualizar';
  button.title = 'Sincronizar datos y recargar CampoBase';
  button.setAttribute('aria-label', 'Actualizar y sincronizar datos');
  return button;
}

async function refreshNow(button) {
  if (button) { button.disabled = true; button.textContent = 'Actualizando…'; }
  try {
    const activeView = document.querySelector('.view.active')?.id || '';
    const role = window.__campobase?.state?.role || '';
    if (activeView) sessionStorage.setItem('campobase.activeView', activeView);
    if (role) sessionStorage.setItem('campobase.sessionRole', role);

    await syncFromCloud().catch(() => null);

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
      await Promise.all(regs.map(async (reg) => {
        await reg.update().catch(() => null);
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }));
    }

    sessionStorage.setItem('campobase.safeReloadAfterUpdate', '1');
    const url = new URL(window.location.href);
    url.searchParams.set('_cb', String(Date.now()));
    window.location.replace(url.toString());
  } catch (error) {
    console.warn('No se pudo completar la actualización controlada:', error);
    if (button) {
      button.disabled = false;
      button.textContent = 'Actualizar';
    }
  }
}

export function installRuntimeRefresh() {
  if (document.getElementById(BUTTON_ID)) return;
  const status = document.querySelector('.topbar .status');
  if (!status) return;
  const button = buttonMarkup();
  const logout = document.getElementById('logout');
  status.insertBefore(button, logout ?? null);
  button.addEventListener('click', () => refreshNow(button));
}

function toBoardExercise(record = {}) {
  return {
    id: record.id,
    name: record.name || 'Ejercicio',
    objective: record.objective || '',
    description: record.description || '',
    players: record.players || '',
    material: record.material || '',
    duration: Number(record.duration) || 0,
    reps: Number(record.reps ?? record.boardReps) || 1,
    pause: Number(record.pause ?? record.boardPause) || 0,
    intensity: record.intensity || record.difficulty || '',
    saveMode: record.saveMode || record.boardSaveMode || (record.boardAnimation ? 'both' : 'static'),
    staticBoard: record.staticBoard ?? record.boardStatic ?? null,
    animatedBoard: record.animatedBoard ?? record.boardAnimation ?? null,
    preview: record.preview || record.boardPreview || '',
    coverSourceType: record.coverSourceType || record.boardCoverSourceType || 'phase',
    coverPhaseId: record.coverPhaseId || record.boardCoverPhaseId || '',
    coverPhaseName: record.coverPhaseName || record.boardCoverPhaseName || '',
    coverFrameProgress: Number(record.coverFrameProgress ?? record.boardCoverFrameProgress) || 0,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function getBoardHtml() {
  if (!boardHtmlPromise) {
    boardHtmlPromise = (async () => {
      const response = await fetch('./assets/exercise-board.html.gz', { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar la pizarra táctica.');
      const bytes = new Uint8Array(await response.arrayBuffer());
      const isGzip = bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
      if (!isGzip) return new TextDecoder().decode(bytes);
      if (typeof DecompressionStream !== 'function') throw new Error('Este navegador no admite el creador de ejercicios integrado.');
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      return new Response(stream).text();
    })().catch((error) => {
      boardHtmlPromise = null;
      throw error;
    });
  }
  return boardHtmlPromise;
}

function viewerMetadataMarkup(record) {
  const facts = [
    record.players ? ['Jugadores', record.players] : null,
    Number(record.duration) > 0 ? ['Duración', `${Number(record.duration)} min`] : null,
    record.intensity ? ['Intensidad', record.intensity] : null,
    record.material ? ['Material', record.material] : null,
    record.objective ? ['Objetivo', record.objective] : null,
    record.description ? ['Explicación / observaciones', record.description] : null,
  ].filter(Boolean);
  if (!facts.length) return '';
  return facts.map(([label, value]) => `
    <div class="exercise-board-viewer-fact ${label === 'Explicación / observaciones' ? 'wide' : ''}">
      <span>${escapeHtml(label)}</span><strong>${escapeMultiline(value)}</strong>
    </div>`).join('');
}

function updateViewerChrome(record, version = 'static') {
  if (!viewerChrome) return;
  viewerTitle.textContent = record.name || 'Ejercicio';
  viewerMeta.innerHTML = viewerMetadataMarkup(record);
  const hasMovement = Boolean(record.boardAnimation?.phases?.length > 1 || record.animatedBoard?.phases?.length > 1);
  viewerMotionButton.hidden = !hasMovement;
  viewerStaticButton.className = version === 'static' ? 'primary' : 'secondary';
  viewerMotionButton.className = version === 'movement' ? 'primary' : 'secondary';
  viewerStaticButton.setAttribute('aria-pressed', String(version === 'static'));
  viewerMotionButton.setAttribute('aria-pressed', String(version === 'movement'));
}

function sendViewerExercise() {
  if (!pendingViewer || !frame?.contentWindow || frame.dataset.boardReady !== '1') return;
  frame.contentWindow.postMessage({
    type: 'campobase:load-exercise',
    exercise: toBoardExercise(pendingViewer.record),
    version: pendingViewer.version,
  }, '*');
}

function setViewerVersion(version) {
  if (!pendingViewer) return;
  if (version === 'movement' && !pendingViewer.record.boardAnimation?.phases?.length) return;
  pendingViewer.version = version;
  updateViewerChrome(pendingViewer.record, version);
  sendViewerExercise();
}

function ensureOverlay() {
  if (overlay) return overlay;
  const style = document.createElement('style');
  style.textContent = `
    .exercise-board-overlay{position:fixed;inset:0;z-index:1200;background:#f7f5f0;display:none;flex-direction:column}
    .exercise-board-overlay.open{display:flex}
    .exercise-board-overlay iframe{width:100%;flex:1 1 auto;min-height:0;border:0;background:#f7f5f0;display:block}
    .exercise-board-viewer-chrome{display:none;background:#fff;border-bottom:1px solid #e3e0d8;padding:14px 18px;box-shadow:0 7px 20px rgba(26,26,26,.08);position:relative;z-index:3}
    .exercise-board-overlay.viewer-mode .exercise-board-viewer-chrome{display:block}
    .exercise-board-viewer-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    .exercise-board-viewer-back{min-height:44px!important;padding:.72rem 1rem!important;border-radius:12px!important}
    .exercise-board-viewer-title{font-size:22px;font-weight:850;color:#1a1a1a;margin-right:auto;min-width:160px}
    .exercise-board-viewer-modes{display:flex;gap:8px;align-items:center;background:#f7f5f0;padding:5px;border-radius:14px;border:1px solid #e3e0d8}
    .exercise-board-viewer-modes button{min-height:42px;padding:.65rem 1rem;border-radius:10px;font-weight:800}
    .exercise-board-viewer-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}
    .exercise-board-viewer-fact{background:#f7f5f0;border:1px solid #e3e0d8;border-radius:12px;padding:8px 10px;min-width:0}
    .exercise-board-viewer-fact.wide{grid-column:span 2}
    .exercise-board-viewer-fact span{display:block;color:#6b6b6b;font-size:11px;text-transform:uppercase;letter-spacing:.04em;font-weight:800;margin-bottom:3px}
    .exercise-board-viewer-fact strong{display:block;color:#1a1a1a;font-size:14px;line-height:1.35;overflow-wrap:anywhere}
    .custom-board-preview{overflow:hidden;border-radius:14px;background:#15533a;aspect-ratio:16/10;margin-top:.65rem}
    .custom-board-preview svg{width:100%;height:100%;display:block}
    .custom-board-motion-pill{margin-left:.35rem}
    .custom-board-card .exercise-highlights{margin-top:.75rem}
    .custom-board-card .custom-board-preview{max-height:360px}
    @media(max-width:800px){
      .exercise-board-viewer-chrome{padding:10px}
      .exercise-board-viewer-top{gap:8px}
      .exercise-board-viewer-title{order:3;width:100%;font-size:18px}
      .exercise-board-viewer-modes{margin-left:auto}
      .exercise-board-viewer-meta{grid-template-columns:repeat(2,minmax(0,1fr))}
      .exercise-board-viewer-fact.wide{grid-column:span 2}
    }
  `;
  document.head.append(style);

  overlay = document.createElement('div');
  overlay.className = 'exercise-board-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  viewerChrome = document.createElement('div');
  viewerChrome.className = 'exercise-board-viewer-chrome';
  viewerChrome.innerHTML = `
    <div class="exercise-board-viewer-top">
      <button type="button" class="secondary exercise-board-viewer-back">← Volver a ejercicios</button>
      <div class="exercise-board-viewer-title"></div>
      <div class="exercise-board-viewer-modes" aria-label="Vista del ejercicio">
        <button type="button" class="primary" data-board-view="static">Plano fijo</button>
        <button type="button" class="secondary" data-board-view="movement">Movimiento</button>
      </div>
    </div>
    <div class="exercise-board-viewer-meta"></div>`;
  viewerTitle = viewerChrome.querySelector('.exercise-board-viewer-title');
  viewerMeta = viewerChrome.querySelector('.exercise-board-viewer-meta');
  viewerStaticButton = viewerChrome.querySelector('[data-board-view="static"]');
  viewerMotionButton = viewerChrome.querySelector('[data-board-view="movement"]');
  viewerChrome.querySelector('.exercise-board-viewer-back').addEventListener('click', closeOverlay);
  viewerStaticButton.addEventListener('click', () => setViewerVersion('static'));
  viewerMotionButton.addEventListener('click', () => setViewerVersion('movement'));

  frame = document.createElement('iframe');
  frame.title = 'Creador de ejercicios CampoBase';
  overlay.append(viewerChrome, frame);
  document.body.append(overlay);
  return overlay;
}

function closeOverlay() {
  if (!overlay) return;
  overlay.classList.remove('open', 'viewer-mode');
  overlay.setAttribute('aria-hidden', 'true');
  frame.src = 'about:blank';
  delete frame.dataset.boardReady;
  if (boardObjectUrl) { URL.revokeObjectURL(boardObjectUrl); boardObjectUrl = ''; }
  pendingViewer = null;
}

async function readCustomExercises() {
  const settings = await getAll('settings');
  customExercises = new Map(settings
    .filter((record) => record.recordType === 'exercise' && record.customBoard === true)
    .map((record) => [record.id, record]));
  return [...customExercises.values()];
}

function clearPatchedFlags() {
  document.querySelectorAll('.exercise-card[data-custom-board-patched="1"]').forEach((card) => {
    delete card.dataset.customBoardPatched;
  });
}

async function hydrateCustomExercises({ attempts = 1 } = {}) {
  const records = await readCustomExercises();
  clearPatchedFlags();
  patchSoon();
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = (async () => {
    let cloudReady = false;
    for (let attempt = 0; attempt < Math.max(1, attempts); attempt += 1) {
      const result = await syncFromCloud().catch(() => null);
      if (result?.online === true) { cloudReady = true; break; }
      if (attempt < attempts - 1) await delay(150);
    }
    const refreshed = await readCustomExercises();
    clearPatchedFlags();
    patchSoon();
    return { records: refreshed, cloudReady };
  })().finally(() => { hydrationPromise = null; });
  return hydrationPromise;
}

function ensureCategoryOption() {
  const select = document.querySelector('#exercise-filters select[name="category"]');
  if (!select) return;
  let option = [...select.options].find((item) => item.value === CATEGORY);
  if (!option) {
    option = document.createElement('option');
    option.value = CATEGORY;
    option.textContent = CATEGORY;
  }
  if (select.lastElementChild !== option) select.append(option);
}

function customBoardCardMarkup(record) {
  const hasMovement = Boolean(record.boardAnimation?.phases?.length > 1);
  const highlights = [
    record.players ? `<span class="player-count">👥 ${escapeHtml(record.players)}</span>` : '',
    Number(record.duration) > 0 ? `<span class="pill accent">${Number(record.duration)} min</span>` : '',
    '<span class="meta">Pizarra táctica</span>',
  ].filter(Boolean).join('');
  const metadata = [
    record.material ? `<p><strong>Material:</strong> ${escapeHtml(record.material)}</p>` : '',
    record.intensity ? `<p><strong>Intensidad:</strong> ${escapeHtml(record.intensity)}</p>` : '',
    record.objective ? `<p><strong>Objetivo:</strong> ${escapeHtml(record.objective)}</p>` : '',
    record.description ? `<p><strong>Explicación / observaciones:</strong> ${escapeMultiline(record.description)}</p>` : '',
  ].filter(Boolean).join('');
  const preview = record.boardPreview
    ? `<details class="diagram-details" open><summary>Plano de pizarra</summary><div class="custom-board-preview">${record.boardPreview}</div></details>`
    : '';
  return `
    <div class="exercise-card-head"><div><span class="pill">Mis ejercicios</span>${hasMovement ? '<span class="pill accent custom-board-motion-pill">▶ Movimiento</span>' : ''}<h3>${escapeHtml(record.name || 'Ejercicio')}</h3></div><button type="button" class="favorite-exercise ${record.favorite ? 'active' : ''}" data-id="${escapeHtml(record.id)}" aria-label="${record.favorite ? 'Quitar de' : 'Añadir a'} favoritos">${record.favorite ? '★' : '☆'}</button></div>
    ${highlights ? `<div class="exercise-highlights">${highlights}</div>` : ''}
    ${metadata}
    ${preview}
    <div class="button-row"><button type="button" class="view-exercise secondary" data-exercise-id="${escapeHtml(record.id)}">Ver ejercicio</button><button type="button" class="add-exercise-to-session primary" data-id="${escapeHtml(record.id)}">Añadir a sesión</button></div>`;
}

function patchExerciseCards() {
  const list = document.getElementById('exercises-list');
  if (!list || !customExercises.size) return;
  list.querySelectorAll('.exercise-card').forEach((card) => {
    const idButton = card.querySelector('[data-id], [data-exercise-id]');
    const id = idButton?.dataset.id || idButton?.dataset.exerciseId;
    const record = customExercises.get(id);
    if (!record || card.dataset.customBoardPatched === '1') return;
    card.dataset.customBoardPatched = '1';
    card.classList.add('custom-board-card');
    card.innerHTML = customBoardCardMarkup(record);
  });
}

function patchSoon() {
  requestAnimationFrame(() => {
    ensureCategoryOption();
    patchExerciseCards();
  });
}

async function openCreator() {
  const records = await readCustomExercises().catch(() => []);
  ensureOverlay();
  overlay.classList.remove('viewer-mode');
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  pendingViewer = null;
  delete frame.dataset.boardReady;
  if (boardObjectUrl) URL.revokeObjectURL(boardObjectUrl);
  const boardHtml = await getBoardHtml();
  boardObjectUrl = URL.createObjectURL(new Blob([boardHtml], { type: 'text/html' }));
  frame.dataset.creatorExerciseCount = String(records.length);
  frame.src = `${boardObjectUrl}#embedded=1&mode=create`;
  hydrateCustomExercises({ attempts: 3 }).catch(() => null);
}

async function openViewer(record, version = 'static') {
  ensureOverlay();
  pendingViewer = { record, version };
  overlay.classList.add('viewer-mode', 'open');
  overlay.setAttribute('aria-hidden', 'false');
  updateViewerChrome(record, version);
  delete frame.dataset.boardReady;
  if (boardObjectUrl) URL.revokeObjectURL(boardObjectUrl);
  const boardHtml = await getBoardHtml();
  boardObjectUrl = URL.createObjectURL(new Blob([boardHtml], { type: 'text/html' }));
  frame.src = `${boardObjectUrl}#embedded=1&mode=view`;
}

async function handleBoardMessage(event) {
  if (!frame || event.source !== frame.contentWindow) return;
  const data = event.data || {};
  if (data.type === 'campobase:close-exercise-board') {
    closeOverlay();
    return;
  }
  if (data.type === 'campobase:exercise-board-ready' && data.mode === 'create') {
    const { records } = await hydrateCustomExercises({ attempts: 3 }).catch(() => ({ records: [...customExercises.values()] }));
    frame.contentWindow.postMessage({ type: 'campobase:init-editor', exercises: records.map(toBoardExercise) }, '*');
    return;
  }
  if (data.type === 'campobase:exercise-board-ready' && data.mode === 'view' && pendingViewer) {
    frame.dataset.boardReady = '1';
    sendViewerExercise();
  }
}

function interceptClicks(event) {
  const legacyMovementButton = event.target.closest('.view-exercise-motion[data-exercise-id]');
  if (legacyMovementButton) {
    const record = customExercises.get(legacyMovementButton.dataset.exerciseId);
    if (!record) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openViewer(record, 'movement').catch((error) => { console.error(error); alert(error.message || 'No se pudo abrir el movimiento.'); });
    return;
  }
  const viewButton = event.target.closest('.view-exercise[data-exercise-id], .session-exercise-link[data-exercise-id]');
  if (viewButton) {
    const record = customExercises.get(viewButton.dataset.exerciseId);
    const card = viewButton.closest('.exercise-card');
    const isMyExerciseCard = card?.querySelector('.pill')?.textContent?.trim() === CATEGORY;
    if (!record && !isMyExerciseCard) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const id = viewButton.dataset.exerciseId;
    (record ? Promise.resolve(record) : hydrateCustomExercises({ attempts: 3 }).then(() => customExercises.get(id)))
      .then((loaded) => {
        if (!loaded) throw new Error('No se encontró el ejercicio de pizarra guardado.');
        return openViewer(loaded, 'static');
      })
      .catch((error) => { console.error(error); alert(error.message || 'No se pudo abrir el ejercicio.'); });
  }
}

function restoreExercisesViewAfterSave() {
  let shouldOpen = false;
  try {
    shouldOpen = sessionStorage.getItem(OPEN_AFTER_SAVE_KEY) === '1';
    if (shouldOpen) sessionStorage.removeItem(OPEN_AFTER_SAVE_KEY);
  } catch { /* sin bloqueo */ }
  if (!shouldOpen) return;
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    ensureCategoryOption();
    const nav = document.querySelector('.bottom-nav button[data-view="ejercicios"]');
    const select = document.querySelector('#exercise-filters select[name="category"]');
    if (nav && select && [...select.options].some((option) => option.value === CATEGORY)) {
      nav.click();
      select.value = CATEGORY;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      hydrateCustomExercises({ attempts: 3 }).catch(() => patchSoon());
      clearInterval(timer);
    } else if (attempts > 80) clearInterval(timer);
  }, 100);
}

async function install() {
  ensureOverlay();
  ensureCategoryOption();
  document.addEventListener('click', interceptClicks, true);
  window.addEventListener('message', (event) => { handleBoardMessage(event).catch((error) => console.error(error)); });
  window.addEventListener('campobase:data-changed', async (event) => {
    if (!event.detail?.stores?.includes('settings')) return;
    await readCustomExercises().catch(() => null);
    clearPatchedFlags();
    patchSoon();
  });
  const filterSelect = document.querySelector('#exercise-filters select[name="category"]');
  if (filterSelect) new MutationObserver(ensureCategoryOption).observe(filterSelect, { childList: true });
  const list = document.getElementById('exercises-list');
  if (list) new MutationObserver(patchSoon).observe(list, { childList: true, subtree: true });
  restoreExercisesViewAfterSave();

  // Arranque local-first: no bloquear la UI esperando Supabase.
  await readCustomExercises().catch(() => []);
  patchSoon();

  // Una única sincronización en segundo plano. Si falla, la cola local se mantiene.
  hydrateCustomExercises({ attempts: 1 }).catch((error) => {
    console.warn('Sincronización de Mis ejercicios pendiente:', error.message);
  });
}

if (typeof window !== 'undefined') {
  window.__campobaseOpenExerciseCreator = openCreator;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { installRuntimeRefresh(); install(); }, { once: true });
  else { installRuntimeRefresh(); install(); }
}
