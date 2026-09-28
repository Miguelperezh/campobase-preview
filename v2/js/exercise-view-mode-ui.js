// Punto 6: diferencia clara entre vista rápida y vista completa del ejercicio.
// Solo modifica presentación. No lee ni escribe datos de jugadores, sesiones,
// partidos, ejercicios ni Supabase.

const STYLE_ID = 'campobase-exercise-view-mode-ui';
let documentObserver = null;

function installStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .exercise-view-mode-bar {
      margin: .75rem 1rem .35rem !important;
    }

    .exercise-media-preview,
    .exercise-media-human {
      margin: .75rem 1rem !important;
      padding: .75rem !important;
      border: 1px solid var(--line, #e2e8f0) !important;
      border-radius: 14px !important;
      background: var(--card, #ffffff) !important;
      box-sizing: border-box !important;
    }

    .exercise-media-label {
      margin: 0 0 .5rem !important;
      color: var(--ink, #0f172a) !important;
      font-size: .85rem !important;
      font-weight: 850 !important;
    }

    .exercise-preview-stage {
      width: 100% !important;
      aspect-ratio: 16 / 9 !important;
      display: grid !important;
      place-items: center !important;
      overflow: hidden !important;
      border-radius: 12px !important;
      background: #061c14 !important;
    }

    .exercise-preview-img,
    .exercise-preview-static-video,
    .exercise-preview-static-canvas,
    .card-preview-static-canvas {
      width: 100% !important;
      height: 100% !important;
      display: block !important;
      object-fit: contain !important;
    }

    .exercise-preview-static-video,
    .card-preview-static-video {
      pointer-events: none !important;
    }

    .exercise-media-human .video-item,
    .exercise-media-human video {
      width: 100% !important;
      max-width: 100% !important;
    }

    .exercise-media-human video {
      display: block !important;
      aspect-ratio: 16 / 9 !important;
      object-fit: contain !important;
      border-radius: 12px !important;
      background: #000 !important;
    }

    .exercise-view-mode-help {
      margin: 0 1rem .75rem !important;
      padding: .55rem .75rem !important;
      border-radius: 10px !important;
      background: var(--surface, #f8fafc) !important;
      border: 1px solid var(--line, #e2e8f0) !important;
      color: var(--muted, #64748b) !important;
      font-size: .78rem !important;
      line-height: 1.35 !important;
      font-weight: 650 !important;
    }

    .ejercicio-v2-sheet.view-mode-reduced .section-leyenda-subvideo,
    .ejercicio-v2-sheet.view-mode-reduced #section-que-se-trabaja,
    .ejercicio-v2-sheet.view-mode-reduced #section-objetivo,
    .ejercicio-v2-sheet.view-mode-reduced #section-organizacion,
    .ejercicio-v2-sheet.view-mode-reduced #section-montaje,
    .ejercicio-v2-sheet.view-mode-reduced #section-material,
    .ejercicio-v2-sheet.view-mode-reduced #section-fases,
    .ejercicio-v2-sheet.view-mode-reduced #section-rotacion,
    .ejercicio-v2-sheet.view-mode-reduced #section-que-observar,
    .ejercicio-v2-sheet.view-mode-reduced #section-consignas,
    .ejercicio-v2-sheet.view-mode-reduced #section-errores,
    .ejercicio-v2-sheet.view-mode-reduced #section-errores-correcciones,
    .ejercicio-v2-sheet.view-mode-reduced #section-variantes,
    .ejercicio-v2-sheet.view-mode-reduced .videos {
      display: none !important;
    }

    .ejercicio-v2-sheet.view-mode-reduced #section-datos-rapidos,
    .ejercicio-v2-sheet.view-mode-reduced #section-como-se-hace,
    .ejercicio-v2-sheet.view-mode-reduced #section-carga {
      display: flex !important;
    }

    .ejercicio-v2-sheet.view-mode-reduced .sheet-sections-body {
      gap: .8rem !important;
      padding-top: .8rem !important;
      padding-bottom: 1rem !important;
    }

    .ejercicio-v2-sheet.view-mode-reduced .section-block {
      gap: .4rem !important;
    }

    @media (max-width: 650px) {
      .exercise-view-mode-bar {
        margin: .6rem .75rem .3rem !important;
        gap: .35rem !important;
      }

      .view-mode-chip {
        min-height: 40px !important;
        padding: .45rem .5rem !important;
        font-size: .78rem !important;
      }

      .exercise-view-mode-help {
        margin: 0 .75rem .6rem !important;
        padding: .5rem .65rem !important;
        font-size: .74rem !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function modeForSheet(sheet) {
  return sheet.classList.contains('view-mode-full') ? 'full' : 'reduced';
}

function updateModeHelp(sheet) {
  const help = sheet.querySelector('.exercise-view-mode-help');
  if (!help) return;
  if (modeForSheet(sheet) === 'full') {
    help.textContent = 'Ficha completa: preview, MP4 gráfico, vídeo humano, montaje, material, fases, rotaciones, correcciones y variantes.';
  } else {
    help.textContent = 'Consulta rápida de campo: preview, MP4 gráfico, vídeo humano, datos clave, pasos y series/descansos.';
  }
}

function parsePreviewCrop(value = '') {
  const parts = String(value || '').split(',').map(Number);
  if (parts.length !== 6 || !parts.every(Number.isFinite)) return null;
  const [x, y, width, height, sourceWidth, sourceHeight] = parts;
  if (width <= 0 || height <= 0 || sourceWidth <= 0 || sourceHeight <= 0) return null;
  return { x, y, width, height, sourceWidth, sourceHeight };
}

function paintStaticPreviewCanvas(canvas) {
  if (!canvas || canvas.dataset.cbPreviewCanvasPainted === '1') return;
  const src = String(canvas.dataset.previewVideoSrc || '').trim();
  if (!src) return;

  canvas.dataset.cbPreviewCanvasPainted = '1';
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.crossOrigin = 'anonymous';
  video.src = src;

  const fail = () => {
    canvas.dataset.cbPreviewCanvasPainted = 'error';
    const wrap = canvas.closest('.card-thumb-wrap, .exercise-preview-stage, .session-block-preview');
    if (wrap && !wrap.querySelector('.card-thumb-placeholder')) {
      const fallback = document.createElement('div');
      fallback.className = 'card-thumb-placeholder';
      fallback.textContent = '⚽ CampoBase';
      canvas.replaceWith(fallback);
    }
  };

  const paint = () => {
    try {
      if (!video.videoWidth || !video.videoHeight) return fail();
      const crop = parsePreviewCrop(canvas.dataset.previewCrop);
      const ctx = canvas.getContext('2d');
      if (crop) {
        const scaleX = video.videoWidth / crop.sourceWidth;
        const scaleY = video.videoHeight / crop.sourceHeight;
        const sx = crop.x * scaleX, sy = crop.y * scaleY, sw = crop.width * scaleX, sh = crop.height * scaleY;
        const width = Math.min(960, Math.max(1, Math.round(sw)));
        const height = Math.max(1, Math.round(width * crop.height / crop.width));
        canvas.width = width; canvas.height = height;
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);
      } else {
        const width = Math.min(video.videoWidth, 960);
        const height = Math.max(1, Math.round(width * video.videoHeight / video.videoWidth));
        canvas.width = width; canvas.height = height;
        ctx.drawImage(video, 0, 0, width, height);
      }
      video.pause();
      video.removeAttribute('src');
      video.load();
    } catch {
      fail();
    }
  };

  video.addEventListener('error', fail, { once: true });
  video.addEventListener('loadeddata', () => {
    if (!Number.isFinite(video.duration) || video.duration <= 0.05) return paint();
    try {
      video.currentTime = 0.05;
      video.addEventListener('seeked', paint, { once: true });
    } catch {
      paint();
    }
  }, { once: true });
  video.load();
}

function freezePreviewVideo(video) {
  if (!video || video.dataset.cbPreviewVideoGuard === '1') return;
  video.dataset.cbPreviewVideoGuard = '1';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'metadata';

  const freeze = () => {
    try {
      if (video.currentTime < 0.04) video.currentTime = 0.05;
      video.pause();
    } catch {}
  };
  video.addEventListener('loadeddata', freeze);
  video.addEventListener('seeked', () => video.pause());
  video.addEventListener('play', () => video.pause());
}

function guardPreviewImage(img) {
  if (!img || img.dataset.cbPreviewGuard === '1') return;
  img.dataset.cbPreviewGuard = '1';
  img.addEventListener('error', () => {
    const source = String(img.dataset.previewVideoSrc || '').trim();
    if (source) {
      const canvas = document.createElement('canvas');
      canvas.className = img.classList.contains('card-preview-img')
        ? 'card-preview-img card-preview-static-canvas'
        : 'exercise-preview-static-canvas';
      canvas.dataset.previewVideoSrc = source;
      canvas.dataset.previewCrop = String(img.dataset.previewCrop || '');
      canvas.setAttribute('aria-label', img.alt || 'Vista previa del ejercicio');
      img.replaceWith(canvas);
      paintStaticPreviewCanvas(canvas);
      return;
    }

    const wrap = img.closest('.card-thumb-wrap');
    if (wrap) {
      img.remove();
      if (!wrap.querySelector('.card-thumb-placeholder')) {
        const fallback = document.createElement('div');
        fallback.className = 'card-thumb-placeholder';
        fallback.textContent = '⚽ CampoBase';
        wrap.insertBefore(fallback, wrap.firstChild);
      }
      return;
    }

    const previewBlock = img.closest('.exercise-media-preview');
    if (previewBlock) {
      const stage = previewBlock.querySelector('.exercise-preview-stage');
      if (stage) stage.innerHTML = '<div class="card-thumb-placeholder">⚽ CampoBase</div>';
    }
  }, { once: true });
}

function enhanceSheet(sheet) {
  if (!sheet) return;
  const bar = sheet.querySelector('.exercise-view-mode-bar');
  if (!bar) return;

  const reduced = bar.querySelector('[data-view-mode="reduced"]');
  const full = bar.querySelector('[data-view-mode="full"]');
  if (reduced) {
    reduced.textContent = '⚡ Vista rápida';
    reduced.title = 'Solo lo necesario en campo: preview, MP4 gráfico, vídeo humano, datos clave, pasos y series';
    reduced.setAttribute('aria-label', 'Vista rápida del ejercicio');
  }
  if (full) {
    full.textContent = '📋 Vista completa';
    full.title = 'Ficha completa con todo el detalle del ejercicio';
    full.setAttribute('aria-label', 'Vista completa del ejercicio');
  }

  let help = sheet.querySelector('.exercise-view-mode-help');
  if (!help) {
    help = document.createElement('div');
    help.className = 'exercise-view-mode-help';
    help.setAttribute('aria-live', 'polite');
    bar.insertAdjacentElement('afterend', help);
  }
  updateModeHelp(sheet);

  if (sheet.dataset.cbViewModeUiObserved === '1') return;
  sheet.dataset.cbViewModeUiObserved = '1';
  new MutationObserver(() => updateModeHelp(sheet)).observe(sheet, {
    attributes: true,
    attributeFilter: ['class'],
  });
}

function scan(root = document) {
  if (root.matches?.('.ejercicio-v2-sheet')) enhanceSheet(root);
  root.querySelectorAll?.('.ejercicio-v2-sheet').forEach(enhanceSheet);

  if (root.matches?.('[data-preview-image="1"], .exercise-preview-img')) guardPreviewImage(root);
  root.querySelectorAll?.('[data-preview-image="1"], .exercise-preview-img').forEach(guardPreviewImage);

  if (root.matches?.('.exercise-preview-static-video, .card-preview-static-video')) freezePreviewVideo(root);
  root.querySelectorAll?.('.exercise-preview-static-video, .card-preview-static-video').forEach(freezePreviewVideo);

  if (root.matches?.('.exercise-preview-static-canvas, .card-preview-static-canvas, .session-preview-static-canvas')) paintStaticPreviewCanvas(root);
  root.querySelectorAll?.('.exercise-preview-static-canvas, .card-preview-static-canvas, .session-preview-static-canvas').forEach(paintStaticPreviewCanvas);
}

function install() {
  installStyles();
  scan(document);
  if (documentObserver) return;
  documentObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) scan(node);
    }));
  });
  documentObserver.observe(document.body, { childList: true, subtree: true });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
