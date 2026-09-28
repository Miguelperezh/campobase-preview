// Visor de táctica interactiva: MP4 bajo demanda + controles completos, zoom táctico con clamping y botones de cierre accesibles.

import { attachMediaLightbox } from './media-lightbox.js';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

export function renderTacticaInteractivaHTML(tactica) {
  const vr = tactica.vista_rapida || {};
  const det = tactica.detalle || {};
  const anim = tactica.animacion || {};
  const videoSrc = anim.mp4 || (anim.gif || '').replace(/\.gif$/i, '.mp4');
  const pillsTrabaja = (vr.que_se_trabaja || []).map((t) => `<span class="pill trabaja">${esc(t)}</span>`).join('');
  const detalleBloques = Object.entries(det)
    .filter(([key, value]) => key !== 'fuente' && Array.isArray(value) && value.length)
    .map(([key, value]) => {
      const title = {
        que_busco: 'Qué busco', con_balon: 'Con balón', al_perder: 'Al perder el balón',
        en_defensa: 'En defensa', en_ataque: 'En ataque', cuando_usarla: 'Cuándo usarla',
        que_gano: 'Qué gano', que_vigilar: 'Qué vigilar', regla_equilibrio: 'Regla de equilibrio',
        principios: 'Principios',
      }[key] || key.replace(/_/g, ' ');
      return `<h3>${esc(title)}</h3><ul class="plain-list">${value.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
    }).join('');
  const source = det.fuente || {};
  const sourceText = source.documento ? `Fuente: ${esc(source.documento)}${source.seccion ? ` · ${esc(source.seccion)}` : ''}` : '';

  return `
  <div class="tactica-interactiva" data-id="${esc(tactica.id)}" data-video="${esc(videoSrc)}">
    <div class="pills"><span class="pill tipo">${esc(vr.tipo_principal || 'Táctica')}</span><span class="pill sistema">${esc(vr.sistema || tactica.formacion || '')}</span>${pillsTrabaja}</div>
    <h2 class="nombre">${esc(tactica.nombre)}</h2>
    
    <div class="player exercise-video-wrap">
      <div class="stage video-stage" style="position:relative">
        <video class="frame-video" data-src="${esc(videoSrc)}" playsinline muted loop preload="none"></video>
      </div>

      <!-- Barra de progreso -->
      <div class="v-progress-container">
        <input type="range" class="v-seek-bar" min="0" max="100" step="0.1" value="0" aria-label="Progreso táctico">
      </div>

      <div class="v-controls-bar">
        <div class="v-controls-left">
          <button type="button" class="btn-play v-btn primary" title="Reproducir / Pausar">▶</button>
          <button type="button" class="btn-prev v-btn" title="Paso anterior">⏮</button>
          <button type="button" class="btn-next v-btn" title="Paso siguiente">⏭</button>
          <button type="button" class="btn-restart v-btn" title="Reiniciar">↺</button>
        </div>

        <div class="v-controls-right">
          <!-- Selector de velocidad -->
          <div class="speed v-speed-group">
            <button type="button" data-s="1" class="v-btn-speed">1×</button>
            <button type="button" data-s="2" class="v-btn-speed on">2×</button>
            <button type="button" data-s="4" class="v-btn-speed">4×</button>
          </div>

          <!-- Controles de zoom táctico con clamping -->
          <div class="v-zoom-group" title="Zoom táctico">
            <button type="button" class="v-btn v-btn-zoom-out" title="Alejar zoom">🔍−</button>
            <button type="button" class="v-btn v-btn-zoom-reset" title="Restablecer zoom">100%</button>
            <button type="button" class="v-btn v-btn-zoom-in" title="Acercar zoom">🔍+</button>
          </div>

          <button type="button" class="btn-full v-btn" title="Ampliar a pantalla completa">⛶ <span class="v-btn-text">Ampliar</span></button>
        </div>
      </div>
    </div>

    <div class="leyenda"><strong>Leyenda:</strong> ${esc(vr.leyenda || '')}</div>
    <div class="detalle">${detalleBloques}${sourceText ? `<div class="fuente">${sourceText}</div>` : ''}</div>
    
    <!-- Lightbox / Pantalla completa con controles accesibles arriba y abajo -->
    <div class="lightbox">
      <button type="button" class="lb-close sheet-top-close-btn" title="Cerrar">✕</button>
      <div class="lb-controls">
        <button type="button" class="lb-prev" title="Paso anterior">⏮</button>
        <button type="button" class="lb-play" title="Reproducir / Pausar">▶</button>
        <button type="button" class="lb-next" title="Paso siguiente">⏭</button>
        <button type="button" class="lb-restart" title="Reiniciar">↺</button>
        <div class="speed">
          <button type="button" data-s="1">1×</button>
          <button type="button" data-s="2" class="on">2×</button>
          <button type="button" data-s="4">4×</button>
        </div>
        <div class="v-zoom-group">
          <button type="button" class="lb-zoom-out">🔍−</button>
          <button type="button" class="lb-zoom-reset">100%</button>
          <button type="button" class="lb-zoom-in">🔍+</button>
        </div>
      </div>
      <span class="hint">Rueda/pellizco: zoom · arrastra para encuadrar</span>
      <div class="lb-footer-bar">
        <button type="button" class="modal-bottom-close-btn tg-close-full" title="Cerrar táctica">
          ✕ Cerrar Táctica
        </button>
      </div>
    </div>
  </div>`;
}

function ensureLoaded(video, preload = 'metadata') {
  if (!video?.dataset.src) return Promise.resolve(false);
  if (video.readyState >= 2 && video.getAttribute('src')) return Promise.resolve(true);
  if (video._loadPromise) return video._loadPromise;
  if (!video.getAttribute('src')) video.src = video.dataset.src;
  video.preload = preload;
  video.load();
  video._loadPromise = new Promise((resolve) => {
    const done = () => { cleanup(); resolve(true); };
    const failed = () => { cleanup(); video.removeAttribute('src'); video.load(); video._loadPromise = null; resolve(false); };
    const cleanup = () => { video.removeEventListener('loadeddata', done); video.removeEventListener('error', failed); };
    if (video.readyState >= 2) return done();
    video.addEventListener('loadeddata', done, { once: true });
    video.addEventListener('error', failed, { once: true });
  });
  return video._loadPromise;
}

export function initTacticaViewer(root) {
  if (!root || root.dataset._viewerInit) return;
  root.dataset._viewerInit = '1';
  const video = root.querySelector('.frame-video');
  const stage = root.querySelector('.stage');
  const btnPlay = root.querySelector('.btn-play');
  const lb = root.querySelector('.lightbox');
  const lbPlay = lb?.querySelector('.lb-play');
  const seekBar = root.querySelector('.v-seek-bar');
  let speed = 2;
  let countedPlaying = false;

  // Zoom táctico
  let zoom = 1.0;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  function clampPan() {
    if (zoom <= 1.0) { panX = 0; panY = 0; return; }
    const rect = stage ? stage.getBoundingClientRect() : { width: 360, height: 240 };
    const maxPanX = (rect.width * (zoom - 1)) / 2;
    const maxPanY = (rect.height * (zoom - 1)) / 2;
    panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
    panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
  }

  function updateTransform() {
    clampPan();
    if (video) video.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    const badge = root.querySelector('.v-btn-zoom-reset');
    if (badge) badge.textContent = `${Math.round(zoom * 100)}%`;
    const lbBadge = lb?.querySelector('.lb-zoom-reset');
    if (lbBadge) lbBadge.textContent = `${Math.round(zoom * 100)}%`;
    if (stage) stage.classList.toggle('is-zoomed', zoom > 1.0);
  }

  function applyZoom(newZoom) {
    zoom = Math.max(1.0, Math.min(3.0, Math.round(newZoom * 10) / 10));
    if (zoom === 1.0) { panX = 0; panY = 0; }
    updateTransform();
  }

  root.querySelector('.v-btn-zoom-in')?.addEventListener('click', () => applyZoom(zoom + 0.25));
  root.querySelector('.v-btn-zoom-out')?.addEventListener('click', () => applyZoom(zoom - 0.25));
  root.querySelector('.v-btn-zoom-reset')?.addEventListener('click', () => applyZoom(1.0));
  lb?.querySelector('.lb-zoom-in')?.addEventListener('click', () => applyZoom(zoom + 0.25));
  lb?.querySelector('.lb-zoom-out')?.addEventListener('click', () => applyZoom(zoom - 0.25));
  lb?.querySelector('.lb-zoom-reset')?.addEventListener('click', () => applyZoom(1.0));

  // Dragging / Pan cuando hay zoom
  if (stage) {
    stage.addEventListener('mousedown', (e) => {
      if (zoom <= 1.0) return;
      isDragging = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      stage.style.cursor = 'grabbing';
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      updateTransform();
    });
    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      if (stage) stage.style.cursor = zoom > 1.0 ? 'grab' : 'default';
    });

    // Touch
    let initPinch = 0;
    let initZoom = 1.0;
    stage.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        initPinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        initZoom = zoom;
      } else if (e.touches.length === 1 && zoom > 1.0) {
        isDragging = true;
        startX = e.touches[0].clientX - panX;
        startY = e.touches[0].clientY - panY;
      }
    }, { passive: true });
    stage.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && initPinch > 0) {
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        applyZoom(initZoom * (dist / initPinch));
      } else if (e.touches.length === 1 && isDragging) {
        panX = e.touches[0].clientX - startX;
        panY = e.touches[0].clientY - startY;
        updateTransform();
      }
    }, { passive: true });
    stage.addEventListener('touchend', () => { isDragging = false; initPinch = 0; });
  }

  const setSpeed = (value) => {
    speed = value;
    if (video) video.playbackRate = value;
    root.querySelectorAll('.speed button').forEach((button) => button.classList.toggle('on', parseFloat(button.dataset.s) === value));
    lb?.querySelectorAll('.speed button').forEach((button) => button.classList.toggle('on', parseFloat(button.dataset.s) === value));
  };
  const markPlaying = (playing) => {
    if (playing && !countedPlaying) { window.__viewersPlaying = (window.__viewersPlaying || 0) + 1; countedPlaying = true; }
    if (!playing && countedPlaying) { window.__viewersPlaying = Math.max(0, (window.__viewersPlaying || 0) - 1); countedPlaying = false; }
  };
  const play = async () => {
    if (!video || !await ensureLoaded(video, 'auto')) return;
    try {
      video.playbackRate = speed;
      await video.play();
      if (btnPlay) btnPlay.textContent = '⏸';
      if (lbPlay) lbPlay.textContent = '⏸';
      markPlaying(true);
    } catch {}
  };
  const pause = () => {
    video?.pause();
    if (btnPlay) btnPlay.textContent = '▶';
    if (lbPlay) lbPlay.textContent = '▶';
    markPlaying(false);
  };
  const toggle = () => video?.paused ? play() : pause();
  const step = async (delta) => {
    if (!video || !await ensureLoaded(video, 'auto')) return;
    pause();
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + delta));
  };

  btnPlay?.addEventListener('click', toggle);
  lbPlay?.addEventListener('click', toggle);
  video?.addEventListener('click', toggle);
  root.querySelector('.btn-prev')?.addEventListener('click', () => step(-0.125));
  root.querySelector('.btn-next')?.addEventListener('click', () => step(0.125));
  root.querySelector('.btn-restart')?.addEventListener('click', async () => { pause(); if (video && await ensureLoaded(video, 'auto')) video.currentTime = 0; });
  lb?.querySelector('.lb-prev')?.addEventListener('click', () => step(-0.125));
  lb?.querySelector('.lb-next')?.addEventListener('click', () => step(0.125));
  lb?.querySelector('.lb-restart')?.addEventListener('click', async () => { pause(); if (video && await ensureLoaded(video, 'auto')) video.currentTime = 0; });
  root.querySelectorAll('.speed button').forEach((button) => button.addEventListener('click', () => setSpeed(parseFloat(button.dataset.s))));
  lb?.querySelectorAll('.speed button').forEach((button) => button.addEventListener('click', () => setSpeed(parseFloat(button.dataset.s))));

  if (seekBar && video) {
    video.addEventListener('timeupdate', () => {
      if (video.duration && !seekBar.matches(':active')) {
        seekBar.value = (video.currentTime / video.duration) * 100;
      }
    });
    seekBar.addEventListener('input', () => {
      if (video.duration) video.currentTime = (seekBar.value / 100) * video.duration;
    });
  }

  const controller = lb && stage ? attachMediaLightbox({ box: lb, stage, mediaSelector: '.frame-video' }) : null;
  root.querySelector('.btn-full')?.addEventListener('click', async () => {
    if (!video || !await ensureLoaded(video, 'auto')) return;
    controller?.open();
    applyZoom(1.0);
  });

  if (video?.dataset.src && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      ensureLoaded(video, 'metadata');
    }, { rootMargin: '300px 0px' });
    observer.observe(root);
  }
  setSpeed(speed);
}

export function attachTacticaLightbox(root) {
  if (!root) return;
  const box = root.querySelector('.lightbox');
  const stage = root.querySelector('.stage');
  if (box && stage) attachMediaLightbox({ box, stage, mediaSelector: '.frame-video' });
}
