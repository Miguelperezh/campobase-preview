// Control común para ampliar MP4/animaciones sin desplazar los controles.
// El zoom y el arrastre solo transforman el medio; los botones permanecen anclados
// al lightbox. No instala listeners globales en window, evitando fugas al re-renderizar
// bibliotecas grandes de ejercicios.

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;
let openLightboxes = 0;
let previousOverflow = '';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lockDocument() {
  if (openLightboxes === 0) {
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
  }
  openLightboxes += 1;
}

function unlockDocument() {
  openLightboxes = Math.max(0, openLightboxes - 1);
  if (openLightboxes === 0) document.documentElement.style.overflow = previousOverflow;
}

export function attachMediaLightbox({ box, stage, mediaSelector = '.frame-video' } = {}) {
  if (!box || !stage) return null;
  if (box._mediaLightboxController) return box._mediaLightboxController;

  box.style.touchAction = 'none';
  box.style.overscrollBehavior = 'none';

  const pointers = new Map();
  let drag = null;
  let pinch = null;
  let locked = false;
  let interactionCounted = false;

  const media = () => box.querySelector(mediaSelector) || stage.querySelector(mediaSelector);

  function reset() {
    box.dataset.zoom = '1';
    box.dataset.tx = '0';
    box.dataset.ty = '0';
    apply();
  }

  function apply() {
    const el = media();
    if (!el) return;
    const zoom = Number(box.dataset.zoom || 1);
    const tx = Number(box.dataset.tx || 0);
    const ty = Number(box.dataset.ty || 0);
    el.style.transformOrigin = 'center center';
    el.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${zoom})`;
    el.style.willChange = zoom === 1 && tx === 0 && ty === 0 ? 'auto' : 'transform';
  }

  function restorePlayback(el, wasPlaying, time) {
    if (!el) return;
    try { el.currentTime = time; } catch {}
    if (wasPlaying) el.play()?.catch?.(() => {});
  }

  function open() {
    const el = media();
    if (!el || box.classList.contains('open')) return;
    const wasPlaying = typeof el.paused === 'boolean' ? !el.paused : false;
    const time = Number(el.currentTime || 0);
    box.appendChild(el);
    restorePlayback(el, wasPlaying, time);
    reset();
    box.classList.add('open');
    box.setAttribute('aria-modal', 'true');
    if (!locked) {
      lockDocument();
      locked = true;
    }
    // app.js usa este contador para no repintar mientras el usuario interactúa.
    // Contamos también un visor abierto aunque el vídeo esté pausado.
    if (!interactionCounted) {
      window.__viewersPlaying = (window.__viewersPlaying || 0) + 1;
      interactionCounted = true;
    }
  }

  function close() {
    const el = media();
    const wasPlaying = el && typeof el.paused === 'boolean' ? !el.paused : false;
    const time = Number(el?.currentTime || 0);
    box.classList.remove('open', 'dragging');
    box.removeAttribute('aria-modal');
    pointers.clear();
    drag = null;
    pinch = null;
    if (el && el.parentElement === box) {
      stage.appendChild(el);
      restorePlayback(el, wasPlaying, time);
    }
    reset();
    if (locked) {
      unlockDocument();
      locked = false;
    }
    if (interactionCounted) {
      window.__viewersPlaying = Math.max(0, (window.__viewersPlaying || 0) - 1);
      interactionCounted = false;
    }
  }

  function isControlTarget(target) {
    return Boolean(target?.closest?.('.lb-controls,.lb-close,.tg-close-full,button,input,select,label'));
  }

  box.addEventListener('click', (event) => {
    if (event.target === box) close();
  });
  box.querySelector('.lb-close')?.addEventListener('click', close);
  box.querySelector('.tg-close-full')?.addEventListener('click', close);

  box.addEventListener('wheel', (event) => {
    if (!box.classList.contains('open') || isControlTarget(event.target)) return;
    event.preventDefault();
    const current = Number(box.dataset.zoom || 1);
    const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
    box.dataset.zoom = String(clamp(current * factor, MIN_ZOOM, MAX_ZOOM));
    apply();
  }, { passive: false });

  function point(event) {
    return { x: event.clientX, y: event.clientY };
  }

  function twoPointerState() {
    const values = [...pointers.values()];
    if (values.length < 2) return null;
    const [a, b] = values;
    return {
      dist: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
      cx: (a.x + b.x) / 2,
      cy: (a.y + b.y) / 2,
    };
  }

  box.addEventListener('pointerdown', (event) => {
    if (!box.classList.contains('open') || isControlTarget(event.target)) return;
    event.preventDefault();
    try { box.setPointerCapture(event.pointerId); } catch {}
    pointers.set(event.pointerId, point(event));

    if (pointers.size === 1) {
      drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        tx: Number(box.dataset.tx || 0),
        ty: Number(box.dataset.ty || 0),
      };
      pinch = null;
      box.classList.add('dragging');
    } else if (pointers.size >= 2) {
      drag = null;
      pinch = twoPointerState();
      box.classList.remove('dragging');
    }
  });

  box.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return;
    event.preventDefault();
    pointers.set(event.pointerId, point(event));

    if (pointers.size >= 2) {
      const next = twoPointerState();
      if (!next) return;
      if (!pinch) {
        pinch = next;
        return;
      }
      const currentZoom = Number(box.dataset.zoom || 1);
      const nextZoom = clamp(currentZoom * (next.dist / Math.max(1, pinch.dist)), MIN_ZOOM, MAX_ZOOM);
      box.dataset.zoom = String(nextZoom);
      box.dataset.tx = String(Number(box.dataset.tx || 0) + (next.cx - pinch.cx));
      box.dataset.ty = String(Number(box.dataset.ty || 0) + (next.cy - pinch.cy));
      pinch = next;
      apply();
      return;
    }

    if (drag?.id === event.pointerId) {
      box.dataset.tx = String(drag.tx + (event.clientX - drag.x));
      box.dataset.ty = String(drag.ty + (event.clientY - drag.y));
      apply();
    }
  });

  function endPointer(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    try { box.releasePointerCapture(event.pointerId); } catch {}

    if (pointers.size === 1) {
      const [[id, remaining]] = pointers.entries();
      drag = {
        id,
        x: remaining.x,
        y: remaining.y,
        tx: Number(box.dataset.tx || 0),
        ty: Number(box.dataset.ty || 0),
      };
      pinch = null;
      box.classList.add('dragging');
    } else if (pointers.size === 0) {
      drag = null;
      pinch = null;
      box.classList.remove('dragging');
    }
  }

  box.addEventListener('pointerup', endPointer);
  box.addEventListener('pointercancel', endPointer);

  box.addEventListener('dblclick', (event) => {
    if (!box.classList.contains('open') || isControlTarget(event.target) || event.target === box) return;
    event.preventDefault();
    if (Number(box.dataset.zoom || 1) > 1) reset();
    else {
      box.dataset.zoom = '2.5';
      box.dataset.tx = '0';
      box.dataset.ty = '0';
      apply();
    }
  });

  const controller = { open, close, reset, apply };
  box._mediaLightboxController = controller;
  return controller;
}
