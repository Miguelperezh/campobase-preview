const FRAME_TITLE = 'Creador de ejercicios CampoBase';

const normalize = (value = '') => String(value).replace(/\s+/g, ' ').trim();

function findInnerPlaybackButton(doc) {
  return doc.getElementById('viewPlay')
    || doc.getElementById('phasePlay')
    || [...doc.querySelectorAll('button')].find((button) => {
      const label = normalize(button.textContent);
      return label.includes('Reproducir') || label.includes('Pausar');
    })
    || null;
}

function installInnerViewerStyle(doc) {
  if (doc.getElementById('campobase-view-fit-style')) return;
  const style = doc.createElement('style');
  style.id = 'campobase-view-fit-style';
  style.textContent = `
    body.embedded-view{overflow:hidden!important}
    body.embedded-view .campobase-view-board-host{overflow:hidden!important;display:flex!important;align-items:flex-start!important;justify-content:center!important}
    body.embedded-view .campobase-view-board-svg{display:block!important;width:100%!important;max-width:100%!important;margin:0 auto!important}
  `;
  doc.head.append(style);
}

function fitBoardToViewport(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch { return; }
  if (!doc?.body?.classList?.contains('embedded-view')) return;
  installInnerViewerStyle(doc);

  const svgs = [...doc.querySelectorAll('svg')];
  if (!svgs.length) return;
  const svg = svgs
    .map((candidate) => {
      const rect = candidate.getBoundingClientRect();
      const viewBox = candidate.viewBox?.baseVal;
      const score = Math.max(1, rect.width * rect.height, (viewBox?.width || 0) * (viewBox?.height || 0));
      return { svg: candidate, score };
    })
    .sort((a, b) => b.score - a.score)[0]?.svg;
  if (!svg) return;

  svg.classList.add('campobase-view-board-svg');
  const host = svg.parentElement;
  host?.classList.add('campobase-view-board-host');

  const rect = svg.getBoundingClientRect();
  const available = Math.max(260, (frame.contentWindow?.innerHeight || 700) - Math.max(rect.top, 0) - 12);
  svg.style.setProperty('height', `${available}px`, 'important');
  svg.style.setProperty('max-height', `${available}px`, 'important');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  if (host) {
    host.style.setProperty('height', `${available}px`, 'important');
    host.style.setProperty('max-height', `${available}px`, 'important');
  }
}

function runInnerPlayback(frame, attempt = 0) {
  let doc;
  try { doc = frame?.contentDocument; } catch { return; }
  if (!doc) return;
  const inner = findInnerPlaybackButton(doc);
  if (inner && !inner.disabled) {
    inner.click();
    return;
  }
  if (attempt < 14) setTimeout(() => runInnerPlayback(frame, attempt + 1), 90);
}

function syncPlayLabel(frame, outerPlay) {
  let doc;
  try { doc = frame.contentDocument; } catch { return; }
  if (!doc) return;
  const stop = doc.getElementById('phaseStop');
  if (stop && !stop.disabled) {
    outerPlay.disabled = true;
    outerPlay.textContent = '▶ Reproduciendo…';
    return;
  }
  outerPlay.disabled = false;
  outerPlay.textContent = '▶ Reproducir';
}

function installOuterPlay(frame) {
  const overlay = frame.closest('.exercise-board-overlay');
  if (!overlay?.classList?.contains('viewer-mode')) return;
  const modes = overlay.querySelector('.exercise-board-viewer-modes');
  if (!modes || modes.querySelector('.exercise-board-viewer-play')) return;

  const movement = modes.querySelector('[data-board-view="movement"]');
  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'secondary exercise-board-viewer-play';
  play.textContent = '▶ Reproducir';
  play.setAttribute('aria-label', 'Reproducir movimiento');
  play.hidden = Boolean(movement?.hidden);
  modes.append(play);

  if (movement) {
    const syncVisibility = () => { play.hidden = Boolean(movement.hidden); };
    new MutationObserver(syncVisibility).observe(movement, { attributes: true, attributeFilter: ['hidden', 'style'] });
  }

  const handlePlayClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (movement?.hidden) return;
    if (movement && movement.getAttribute('aria-pressed') !== 'true') movement.click();
    runInnerPlayback(frame);
    setTimeout(() => syncPlayLabel(frame, play), 180);
    setTimeout(() => syncPlayLabel(frame, play), 650);
    setTimeout(() => syncPlayLabel(frame, play), 1700);
  };

  play.addEventListener('click', handlePlayClick);
  play.addEventListener('touchend', handlePlayClick, { passive: false });
  play.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'touch') handlePlayClick(e);
  });

  setTimeout(() => syncPlayLabel(frame, play), 0);
  setTimeout(() => syncPlayLabel(frame, play), 200);
}

function hideInnerPlayback(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch { return; }
  if (!doc?.body?.classList?.contains('embedded-view')) return;
  [doc.getElementById('viewPlay'), doc.getElementById('phasePlay')].filter(Boolean).forEach((inner) => {
    inner.style.setProperty('display', 'none', 'important');
    inner.hidden = true;
    inner.tabIndex = -1;
    inner.setAttribute('aria-hidden', 'true');
  });
}

function patchFrame(frame) {
  if (!frame || frame.dataset.viewerLayoutPatched === '1') return;
  frame.dataset.viewerLayoutPatched = '1';
  frame.addEventListener('load', () => {
    if (!frame.src || frame.src === 'about:blank') return;
    const apply = () => {
      installOuterPlay(frame);
      hideInnerPlayback(frame);
      fitBoardToViewport(frame);
    };
    apply();
    setTimeout(apply, 80);
    setTimeout(apply, 250);
    setTimeout(apply, 600);
    try {
      const doc = frame.contentDocument;
      if (doc?.body && !doc.body.dataset.viewerLayoutObserver) {
        doc.body.dataset.viewerLayoutObserver = '1';
        new MutationObserver(apply).observe(doc.body, { childList: true, subtree: true, characterData: true });
      }
    } catch { /* same-origin blob esperado */ }
  });
}

function installOuterStyle() {
  if (document.getElementById('campobase-viewer-layout-style')) return;
  const style = document.createElement('style');
  style.id = 'campobase-viewer-layout-style';
  style.textContent = `
    .exercise-board-overlay.viewer-mode .exercise-board-viewer-modes{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:wrap!important}
    .exercise-board-overlay.viewer-mode .exercise-board-viewer-modes button{min-height:52px!important;padding:.8rem 1.15rem!important;font-size:15px!important;font-weight:850!important}
    .exercise-board-overlay.viewer-mode .exercise-board-viewer-play{background:#1a1a1a!important;color:#fff!important;border-color:#1a1a1a!important}
    @media(max-width:800px){
      .exercise-board-overlay.viewer-mode .exercise-board-viewer-modes{width:100%!important;margin-left:0!important}
      .exercise-board-overlay.viewer-mode .exercise-board-viewer-modes button{flex:1 1 30%!important;min-width:120px!important}
    }
  `;
  document.head.append(style);
}

function discover() {
  document.querySelectorAll(`iframe[title="${FRAME_TITLE}"]`).forEach(patchFrame);
}

function install() {
  installOuterStyle();
  discover();
  new MutationObserver(discover).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('resize', () => {
    document.querySelectorAll(`iframe[title="${FRAME_TITLE}"]`).forEach((frame) => fitBoardToViewport(frame));
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
