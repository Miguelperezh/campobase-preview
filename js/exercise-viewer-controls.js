const FRAME_TITLE = 'Creador de ejercicios CampoBase';

function getViewerFrame() {
  return document.querySelector(`.exercise-board-overlay.viewer-mode iframe[title="${FRAME_TITLE}"]`)
    || document.querySelector(`iframe[title="${FRAME_TITLE}"]`);
}

function setOuterMode(mode) {
  document.querySelectorAll('.exercise-board-overlay.viewer-mode [data-board-view]').forEach((button) => {
    const active = button.dataset.boardView === mode;
    button.className = active ? 'primary' : 'secondary';
    button.setAttribute('aria-pressed', String(active));
  });
}

function triggerEmbeddedMode(mode) {
  const frame = getViewerFrame();
  if (!frame?.contentDocument) return false;
  const doc = frame.contentDocument;
  if (!doc.body?.classList?.contains('embedded-view')) return false;
  const target = doc.querySelector(mode === 'movement'
    ? '[data-embedded-view="animated"]'
    : '[data-embedded-view="static"]');
  if (!target) return false;
  target.click();
  setOuterMode(mode);
  return true;
}

function installOuterModeBridge() {
  if (document.documentElement.dataset.viewerModeBridge === '1') return;
  document.documentElement.dataset.viewerModeBridge = '1';
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.exercise-board-overlay.viewer-mode [data-board-view]');
    if (!button) return;
    const mode = button.dataset.boardView;
    if (mode !== 'static' && mode !== 'movement') return;
    if (!triggerEmbeddedMode(mode)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
}

function hideOnlyDuplicateInnerBar(doc) {
  if (!doc?.body?.classList?.contains('embedded-view')) return;
  const duplicateBar = doc.querySelector('.embedded-view-controls');
  if (!duplicateBar) return;
  duplicateBar.hidden = true;
  duplicateBar.setAttribute('aria-hidden', 'true');
  duplicateBar.style.setProperty('display', 'none', 'important');
}

function patchViewerFrame(frame) {
  if (!frame || frame.dataset.viewerControlsPatched === '1') return;
  frame.dataset.viewerControlsPatched = '1';
  frame.addEventListener('load', () => {
    if (!frame.src || frame.src === 'about:blank') return;
    let doc;
    try { doc = frame.contentDocument; } catch { return; }
    if (!doc) return;
    const clean = () => hideOnlyDuplicateInnerBar(doc);
    clean();
    setTimeout(clean, 0);
    setTimeout(clean, 80);
    setTimeout(clean, 250);
  });
}

function installViewerBackStyle() {
  if (document.getElementById('campobase-viewer-back-size')) return;
  const style = document.createElement('style');
  style.id = 'campobase-viewer-back-size';
  style.textContent = `
    .exercise-board-overlay.viewer-mode .exercise-board-viewer-back{
      min-height:56px!important;
      padding:.9rem 1.35rem!important;
      border-radius:14px!important;
      font-size:16px!important;
      line-height:1.1!important;
      font-weight:850!important;
      white-space:nowrap!important;
    }
  `;
  document.head.append(style);
}

function discoverViewerFrames() {
  document.querySelectorAll(`iframe[title="${FRAME_TITLE}"]`).forEach(patchViewerFrame);
}

function install() {
  installViewerBackStyle();
  installOuterModeBridge();
  discoverViewerFrames();
  new MutationObserver(discoverViewerFrames).observe(document.documentElement, { childList: true, subtree: true });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
