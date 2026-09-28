// Renderizador y reproductor oficial V2 de fichas de ejercicios validados.
// Implementa las 17 secciones completas, controles interactivos, zoom táctico con clamping,
// leyenda visual bajo el vídeo y botones accesibles de cierre (superior con safe-area e inferior fijo).

import { renderVideoSectionHTML, resolveHostedVideoUrl } from './ejercicio-videos.js';
import { attachMediaLightbox } from './media-lightbox.js';
import { findValidatedExercise } from './ejercicios-validados.js';

export function attachLightbox(root) {
  if (root) attachMediaLightbox(root);
}

const viewerTargets = new Set();
let viewerObserver = null;

export function pruneDisconnectedViewerTargets() {
  for (const target of viewerTargets) {
    if (!target.isConnected) {
      viewerTargets.delete(target);
      if (viewerObserver) viewerObserver.unobserve(target);
    }
  }
}

export function activateValidatedExerciseViewer(root) {
  initValidatedExerciseViewer(root);
}

export function ensureVideoLoaded(video, placeholder, previewOnly = false) {
  if (!video) return Promise.resolve(false);
  const src = video.dataset.src;
  if (!src) return Promise.resolve(false);
  if (video.readyState >= 2 && video.getAttribute('src')) {
    if (placeholder) placeholder.style.display = 'none';
    return Promise.resolve(true);
  }
  if (video._loadPromise) return video._loadPromise;
  if (!video.getAttribute('src')) video.src = src;
  video.preload = previewOnly ? 'metadata' : 'auto';
  video.load();
  video._loadPromise = new Promise((resolve) => {
    const ready = () => { cleanup(); resolve(true); };
    const failed = () => { cleanup(); resolve(false); };
    const cleanup = () => {
      video.removeEventListener('loadeddata', ready);
      video.removeEventListener('error', failed);
    };
    if (video.readyState >= 2) return ready();
    video.addEventListener('loadeddata', ready, { once: true });
    video.addEventListener('error', failed, { once: true });
  });
  return video._loadPromise;
}

if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
  viewerObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        activateValidatedExerciseViewer(entry.target);
      }
    }
  }, { rootMargin: '350px 0px' });
}

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

function displayKey(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es');
}

function uniqueDisplayTags(values = []) {
  const seen = new Set();
  return values.filter((value) => {
    const clean = String(value || '').replace(/^--\s*/, '').trim();
    const key = displayKey(clean);
    if (!clean || !key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatExercisePlayers(value = '') {
  const source = String(value || '').trim();
  if (!source || !source.includes('/')) return source;
  const numbers = [...source.matchAll(/\d+(?:[.,]\d+)?/g)]
    .map((match) => Number(match[0].replace(',', '.')))
    .filter(Number.isFinite);
  if (!numbers.length) return source;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const fmt = (number) => Number.isInteger(number) ? String(number) : String(number).replace('.', ',');
  return min === max ? `${fmt(min)} jugadores` : `${fmt(min)}-${fmt(max)} jugadores`;
}

function isUsablePreview(value = '') {
  const source = String(value || '').trim();
  if (!source) return false;
  // Este bucket no existe en CampoBase; no renderizar nunca una imagen rota.
  if (/\/ejercicio-previews\//i.test(source)) return false;
  if (/\.(?:mp4|webm|mov|m4v)(?:$|[?#])/i.test(source)) return false;
  return true;
}

function normalizeMediaCrop(value) {
  const crop = value && typeof value === 'object' ? value : null;
  if (!crop) return null;
  const x = Number(crop.x), y = Number(crop.y), width = Number(crop.width), height = Number(crop.height);
  const sourceWidth = Number(crop.sourceWidth || 1280), sourceHeight = Number(crop.sourceHeight || 820);
  if (![x, y, width, height, sourceWidth, sourceHeight].every(Number.isFinite)) return null;
  if (width <= 0 || height <= 0 || sourceWidth <= 0 || sourceHeight <= 0) return null;
  return { x, y, width, height, sourceWidth, sourceHeight };
}
function mediaCropToken(crop) {
  return crop ? [crop.x, crop.y, crop.width, crop.height, crop.sourceWidth, crop.sourceHeight].join(',') : '';
}
function mediaCropStageStyle(crop) {
  return crop ? `position:relative;overflow:hidden;aspect-ratio:${crop.width} / ${crop.height};background:#8BC753` : 'position:relative';
}
function mediaCropVideoStyle(crop) {
  if (!crop) return '';
  const widthPct=(crop.sourceWidth/crop.width)*100, heightPct=(crop.sourceHeight/crop.height)*100;
  const leftPct=-(crop.x/crop.width)*100, topPct=-(crop.y/crop.height)*100;
  return `position:absolute;max-width:none;max-height:none;width:${widthPct.toFixed(5)}%;height:${heightPct.toFixed(5)}%;left:${leftPct.toFixed(5)}%;top:${topPct.toFixed(5)}%;object-fit:fill`;
}

export function formatExerciseDuration(dur) {
  if (!dur) return '';
  if (typeof dur === 'object') {
    if (dur.valor) return `${dur.valor} min`;
    if (dur.minutos) return `${dur.minutos} min`;
    return '';
  }
  const s = String(dur).trim();
  if (!s || s === 'null' || s === 'undefined') return '';
  if (/^\d+$/.test(s)) return `${s} min`;

  // Algunos ejercicios nuevos traen carga F7 / F11 en la misma cadena.
  // La tarjeta debe mostrar un único rango limpio, no dos textos separados por "/".
  if (s.includes('/')) {
    const numbers = [...s.matchAll(/\d+(?:[.,]\d+)?/g)]
      .map((match) => Number(match[0].replace(',', '.')))
      .filter(Number.isFinite);
    if (numbers.length) {
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      const fmt = (number) => Number.isInteger(number) ? String(number) : String(number).replace('.', ',');
      return min === max ? `${fmt(min)} min aprox.` : `${fmt(min)}-${fmt(max)} min aprox.`;
    }
  }
  return s;
}

export function renderActionVisualSVG(trazo = '') {
  const str = String(trazo || '');
  const isWavy = str.includes('~');
  const isDashed = str.includes('-');
  if (isWavy) {
    return `<svg class="legend-action-svg" viewBox="0 0 54 20" width="54" height="20" aria-hidden="true">
      <path d="M 4 10 Q 9 4, 15 10 T 27 10 T 39 10 L 44 10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <polygon points="42,5 50,10 42,15" fill="currentColor"/>
    </svg>`;
  }
  if (isDashed) {
    return `<svg class="legend-action-svg" viewBox="0 0 54 20" width="54" height="20" aria-hidden="true">
      <line x1="4" y1="10" x2="43" y2="10" stroke="currentColor" stroke-width="2.5" stroke-dasharray="4 3" stroke-linecap="round"/>
      <polygon points="42,5 50,10 42,15" fill="currentColor"/>
    </svg>`;
  }
  return `<svg class="legend-action-svg" viewBox="0 0 54 20" width="54" height="20" aria-hidden="true">
    <line x1="4" y1="10" x2="43" y2="10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <polygon points="42,5 50,10 42,15" fill="currentColor"/>
  </svg>`;
}

/**
 * Convenciones visuales y roles oficiales de CampoBase (Sección 2.9):
 * - Portero: `P` — NEGRO (#111827)
 * - Defensa: `D1`, `D2`, `D3`… — ROJO (#DC2626)
 * - Atacante: `A1`, `A2`, `A3`… — AZUL (#2563EB)
 * - Neutro / Apoyo: `N` — AMARILLO (#FACC15)
 * - Entrenador: `E` — GRIS CLARO (#CBD5E1)
 */
export function roleVisualMeta(roleItemOrId) {
  const rawId = typeof roleItemOrId === 'string'
    ? roleItemOrId.trim()
    : String(roleItemOrId?.id || roleItemOrId?.letra || roleItemOrId?.rol || '').trim();
  const rawRole = typeof roleItemOrId === 'object' ? String(roleItemOrId?.rol || '').trim() : '';
  const rawFunc = typeof roleItemOrId === 'object' ? String(roleItemOrId?.funcion || roleItemOrId?.descripcion || '').trim() : '';

  const idUpper = rawId.toUpperCase();
  const textCombined = `${idUpper} ${rawRole.toUpperCase()} ${rawFunc.toUpperCase()}`;

  // 1. Portero: P, P1, P2... — NEGRO
  if (/^P\d*$/.test(idUpper) || /PORTERO|ARQUERO|GOALKEEPER/.test(textCombined)) {
    const num = idUpper.replace(/\D/g, '');
    const code = num ? `P${num}` : 'P';
    return {
      code,
      label: num ? `Portero ${num}` : 'Portero',
      category: 'portero',
      bg: '#111827',
      color: '#FFFFFF',
      border: '#000000',
    };
  }

  // 2. Defensa: D1, D2, D3... — ROJO
  if (/^D\d*$/.test(idUpper) || /DEFENSA|DEFENSOR|OPOSICION|OPOSICIÓN/.test(textCombined)) {
    const num = idUpper.replace(/\D/g, '');
    const code = num ? `D${num}` : 'D1';
    return {
      code,
      label: num ? `Defensa ${num}` : 'Defensa',
      category: 'defensa',
      bg: '#DC2626',
      color: '#FFFFFF',
      border: '#B91C1C',
    };
  }

  // 3. Atacante: A1, A2, A3... — AZUL
  if (/^A\d*$/.test(idUpper) || /ATACANTE|DELANTERO|JUGADOR DE CAMPO/.test(textCombined)) {
    const num = idUpper.replace(/\D/g, '');
    const code = num ? `A${num}` : 'A1';
    return {
      code,
      label: num ? `Atacante ${num}` : 'Atacante',
      category: 'atacante',
      bg: '#2563EB',
      color: '#FFFFFF',
      border: '#1D4ED8',
    };
  }

  // 4. Neutro / Apoyo: N, N1, C, C1... — AMARILLO
  if (/^[NC]\d*$/.test(idUpper) || /NEUTRO|APOYO|COMODIN|COMODÍN/.test(textCombined)) {
    const num = idUpper.replace(/\D/g, '');
    const code = num ? `N${num}` : (idUpper.startsWith('C') ? 'C' : 'N');
    return {
      code,
      label: num ? `Neutro / Apoyo ${num}` : 'Neutro / Apoyo',
      category: 'neutro',
      bg: '#FACC15',
      color: '#000000',
      border: '#EAB308',
    };
  }

  // 5. Entrenador: E, E1... — GRIS CLARO
  if (/^E\d*$/.test(idUpper) || /ENTRENADOR|TECNICO|TÉCNICO|MISTER|EVALUADOR/.test(textCombined)) {
    const num = idUpper.replace(/\D/g, '');
    const code = num ? `E${num}` : 'E';
    return {
      code,
      label: num ? `Entrenador ${num}` : 'Entrenador',
      category: 'entrenador',
      bg: '#CBD5E1',
      color: '#0F172A',
      border: '#94A3B8',
    };
  }

  // Default: Atacante / Jugador de campo — AZUL
  return {
    code: idUpper || 'A1',
    label: rawRole || rawId || 'Atacante',
    category: 'atacante',
    bg: '#2563EB',
    color: '#FFFFFF',
    border: '#1D4ED8',
  };
}

/**
 * Renderiza la ficha completa V2 (17 secciones) para el visor modal o detalle.
 */
export function renderValidatedExerciseHTML(ex, options = {}) {
  const media = ex.media || {};
  const videoSrc = resolveHostedVideoUrl(String(
    media.video
    || media.mp4
    || ex.video_ejercicio
    || ex.animacion?.mp4
    || ''
  ).trim());
  const previewSrc = String(
    media.preview
    || ex.preview
    || ex.animacion?.preview
    || ''
  ).trim();
  const previewVideoSrc = resolveHostedVideoUrl(String(
    ex.preview_video
    || ex._preview_video_fallback
    || videoSrc
    || ''
  ).trim());
  const explicitHumanVideo = String(
    ex.video_muestra_humanos
    || ex.video_muestra
    || ex.video_muestra_url
    || ex.video_humano
    || ex.video_humanos
    || ex.video
    || ''
  ).trim();
  const realVideo = explicitHumanVideo && resolveHostedVideoUrl(explicitHumanVideo) !== videoSrc
    ? resolveHostedVideoUrl(explicitHumanVideo)
    : '';
  const graphicCrop = normalizeMediaCrop(ex.media_crop);
  const previewCrop = normalizeMediaCrop(ex.preview_crop || ex.media_crop);
  const previewCropToken = mediaCropToken(previewCrop);
  const graphicCropToken = mediaCropToken(graphicCrop);
  const dr = ex.datos_rapidos || {};
  const org = ex.organizacion || {};
  const cleanNombre = String(ex.nombre || '').replace(/^--\s*/, '').trim();

  // Tags en cabecera
  const tags = uniqueDisplayTags([ex.categoria, ...(ex.etiquetas || [])]);
  const tagsHtml = tags.map(t => `<span class="brand-badge">${esc(t)}</span>`).join('');

  // 1. Qué se trabaja
  let queTrabajaHtml = '';
  if (ex.que_se_trabaja && ex.que_se_trabaja.length) {
    queTrabajaHtml = `
      <div id="section-que-se-trabaja" class="section-block">
        <h3>⚽ Qué se trabaja</h3>
        <div class="pills-container">
          ${ex.que_se_trabaja.filter(t => t && t !== '--').map(t => `<span class="pill-tag">${esc(typeof t === 'string' ? t.replace(/^--\s*/, '').trim() : t)}</span>`).join('')}
        </div>
      </div>`;
  }

  // 2. Objetivos
  let objHtml = '';
  const cleanObj = String(ex.objetivo_principal || '').replace(/^--\s*/, '').trim();
  if (cleanObj || (ex.objetivos_secundarios && ex.objetivos_secundarios.length)) {
    objHtml = `
      <div id="section-objetivo" class="section-block">
        <h3>🏆 Objetivo del ejercicio</h3>
        ${cleanObj ? `<div class="main-objective-box">${esc(cleanObj)}</div>` : ''}
        ${ex.objetivos_secundarios && ex.objetivos_secundarios.length ? `
          <div style="margin-top:0.75rem">
            <div class="sub-label">Objetivos complementarios:</div>
            <ul class="plain-list bullet-list">
              ${ex.objetivos_secundarios.map(o => `<li>${esc(typeof o === 'string' ? o.replace(/^--\s*/, '').trim() : o)}</li>`).join('')}
            </ul>
          </div>` : ''}
      </div>`;
  }

  // 3. Datos rápidos
  const rapItems = [];
  if (dr.jugadores) rapItems.push(`<div class="quick-fact-card"><span class="fact-label">👥 Jugadores</span><span class="fact-value">${esc(formatExercisePlayers(dr.jugadores))}</span></div>`);
  const drDur = formatExerciseDuration(dr.duracion || ex.duracion || ex.duration || (ex.duracion_min ? `${ex.duracion_min} min` : ''));
  if (drDur) rapItems.push(`<div class="quick-fact-card"><span class="fact-label">⏱ Duración</span><span class="fact-value">${esc(drDur)}</span></div>`);
  if (dr.espacio) rapItems.push(`<div class="quick-fact-card"><span class="fact-label">📐 Espacio</span><span class="fact-value">${esc(dr.espacio)}</span></div>`);
  if (dr.material) rapItems.push(`<div class="quick-fact-card"><span class="fact-label">📦 Material</span><span class="fact-value">${esc(dr.material)}</span></div>`);
  let datosRapidosHtml = '';
  if (rapItems.length) {
    datosRapidosHtml = `
      <div id="section-datos-rapidos" class="section-block">
        <div class="quick-facts-grid">${rapItems.join('')}</div>
      </div>`;
  }

  // 3b. Organización y roles
  let organizacionHtml = '';
  const orgRoles = [];
  if (Array.isArray(org.roles) && org.roles.length) {
    org.roles.forEach((r) => orgRoles.push({ ...roleVisualMeta(r), funcion: r.funcion || r.descripcion || '' }));
  } else if (ex.leyenda_visual?.jugadores?.length) {
    ex.leyenda_visual.jugadores.forEach((j) => orgRoles.push({ ...roleVisualMeta(j), funcion: j.funcion || '' }));
  }

  // Fallback si la fuente no trae lista explícita de roles (ej. ejercicios nuevos o importados)
  if (!orgRoles.length) {
    const rawText = `${ex.nombre || ''} ${ex.categoria || ''} ${JSON.stringify(ex.materiales || '')} ${JSON.stringify(ex.como_se_hace || '')}`.toLowerCase();
    const hasKeeper = rawText.includes('portero') || org.porteros > 0;
    const hasDefender = rawText.includes('defens') || rawText.includes('1v1') || rawText.includes('duelo') || rawText.includes('oposic') || rawText.includes('intercep');
    const hasNeutral = rawText.includes('comod') || rawText.includes('apoyo') || rawText.includes('neutro');
    const hasCoach = rawText.includes('entrenador') || rawText.includes('servidor') || rawText.includes('pasador') || org.entrenadores > 0;

    orgRoles.push({ ...roleVisualMeta('A1'), funcion: 'Jugador / Atacante de la tarea' });
    if (hasDefender) orgRoles.push({ ...roleVisualMeta('D1'), funcion: 'Defensa / Oposición activa' });
    if (hasNeutral) orgRoles.push({ ...roleVisualMeta('N'), funcion: 'Jugador neutro / Apoyo' });
    if (hasKeeper) orgRoles.push({ ...roleVisualMeta('P'), funcion: 'Portero en portería' });
    if (hasCoach) orgRoles.push({ ...roleVisualMeta('E'), funcion: 'Entrenador / Servidor de balón' });
  } else {
    if (org.porteros > 0 && !orgRoles.some(r => r.category === 'portero')) {
      orgRoles.push({ ...roleVisualMeta('P'), funcion: 'Portero de la tarea' });
    }
    if (org.entrenadores > 0 && !orgRoles.some(r => r.category === 'entrenador')) {
      orgRoles.push({ ...roleVisualMeta('E'), funcion: 'Entrenador / Guía de la tarea' });
    }
  }

  const resumenJugadores = org.resumen_jugadores || (dr.jugadores ? formatExercisePlayers(dr.jugadores) : '');
  if (orgRoles.length || resumenJugadores) {
    organizacionHtml = `
      <div id="section-organizacion" class="section-block">
        <div class="section-head-mini" style="display:flex;align-items:center;justify-content:space-between;gap:0.6rem;flex-wrap:wrap;">
          <h3>👥 Organización y roles</h3>
          ${resumenJugadores ? `<span class="pill-org-count">${esc(resumenJugadores)}</span>` : ''}
        </div>
        ${org.oposicion ? `<p class="section-text" style="margin:0.4rem 0 0.5rem;font-size:0.86rem;"><strong>Oposición:</strong> ${esc(org.oposicion)}</p>` : ''}
        <div class="roles-chips-grid">
          ${orgRoles.map(r => `
            <div class="role-badge-card">
              <span class="role-token" style="background:${r.bg};color:${r.color};border:1px solid ${r.border};">${esc(r.code)}</span>
              <div class="role-desc-group">
                <span class="role-name">${esc(r.label)}</span>
                ${r.funcion ? `<span class="role-func" title="${esc(r.funcion)}">${esc(r.funcion)}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  // 4. Montaje
  let montajeHtml = '';
  if (ex.montaje && (ex.montaje.dimensiones || ex.montaje.espacio_tipo || ex.montaje.explicacion)) {
    const badges = [];
    if (ex.montaje.dimensiones) badges.push(`<span class="chip-metric">📏 ${esc(ex.montaje.dimensiones)}</span>`);
    if (ex.montaje.espacio_tipo) badges.push(`<span class="chip-metric">📍 ${esc(ex.montaje.espacio_tipo)}</span>`);
    montajeHtml = `
      <div id="section-montaje" class="section-block">
        <h3>📐 Montaje y dimensiones</h3>
        ${badges.length ? `<div class="chips-row">${badges.join('')}</div>` : ''}
        ${ex.montaje.explicacion ? `<p class="section-text">${esc(ex.montaje.explicacion).replace(/\n/g, '<br>')}</p>` : ''}
      </div>`;
  }

  // 5. Material operativo
  let materialHtml = '';
  if (ex.materiales && ex.materiales.length) {
    materialHtml = `
      <div id="section-material" class="section-block">
        <h3>📦 Material necesario</h3>
        <ul class="plain-list material-list">
          ${ex.materiales.map(m => `
            <li>
              <strong>${m.icono ? m.icono + ' ' : ''}${esc(m.nombre)}${m.cantidad ? ` (x${m.cantidad})` : ''}:</strong>
              ${esc(m.funcion || 'Material de la tarea')}
            </li>`).join('')}
        </ul>
      </div>`;
  }

  // 6. Cómo se hace (Paso a paso)
  let comoSeHaceHtml = '';
  const quickSummary = ex.vista_rapida?.explicacion_breve || ex.resumen || '';

  const renderStepsList = (steps = []) => {
    if (!steps || !steps.length) return '';
    return `
      <div class="numbered-steps">
        ${steps.map((step, idx) => `
          <div class="step-item">
            <span class="step-num">${idx + 1}</span>
            <div class="step-text">${esc(String(step).replace(/^\d+\.\s*/, ''))}</div>
          </div>`).join('')}
      </div>`;
  };

  let stepsBodyHtml = '';
  if (Array.isArray(ex.como_se_hace) && ex.como_se_hace.length) {
    stepsBodyHtml = renderStepsList(ex.como_se_hace);
  } else if (ex.como_se_hace && typeof ex.como_se_hace === 'object') {
    const entries = Object.entries(ex.como_se_hace);
    if (entries.length) {
      stepsBodyHtml = entries.map(([groupKey, val]) => {
        const label = groupKey === 'base' ? 'Fase Base' : groupKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const stepItems = Array.isArray(val) ? val : [val];
        return `
          <div class="como-se-hace-group" style="margin-bottom:1rem;">
            <div class="group-title" style="font-weight:750;font-size:0.92rem;margin:0.5rem 0 0.35rem;color:var(--ink,#0f172a);display:flex;align-items:center;gap:0.4rem;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--cb-accent,#00b074);"></span>
              ${esc(label)}
            </div>
            ${renderStepsList(stepItems)}
          </div>`;
      }).join('');
    }
  } else if (typeof ex.como_se_hace === 'string' && ex.como_se_hace.trim()) {
    stepsBodyHtml = `<p class="section-text">${esc(ex.como_se_hace)}</p>`;
  }

  if (stepsBodyHtml || quickSummary) {
    comoSeHaceHtml = `
      <div id="section-como-se-hace" class="section-block">
        <div class="section-head-mini" style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem;">
          <h3 style="margin:0;">⚙️ Cómo se hace (Paso a paso)</h3>
          ${ex.datos_rapidos?.duracion ? `<span class="pill-org-count">⏱ ${esc(ex.datos_rapidos.duracion)}</span>` : ''}
        </div>
        ${quickSummary ? `<div class="quick-summary-lead" style="margin:0 0 0.85rem;padding:0.6rem 0.85rem;border-radius:10px;background:var(--surface,#f8fafc);border-left:3px solid var(--cb-accent,#00b074);font-size:0.88rem;color:var(--ink,#0f172a);line-height:1.4;"><strong style="color:var(--cb-accent,#00b074);">⚡ Clave rápida:</strong> ${esc(quickSummary)}</div>` : ''}
        ${stepsBodyHtml}
      </div>`;
  }

  // 7. Fases
  let fasesHtml = '';
  if (ex.fases && ex.fases.length) {
    fasesHtml = `
      <div id="section-fases" class="section-block">
        <h3>🔄 Fases de la tarea</h3>
        <div class="phases-list">
          ${ex.fases.map(f => `
            <div class="phase-card">
              <div class="phase-title">
                <span>${esc(f.titulo || `Fase ${f.orden || ''}`)}</span>
                ${f.poseedor_balon ? `<span class="phase-ball">⚽ Balón: <strong>${esc(f.poseedor_balon)}</strong></span>` : ''}
              </div>
              <div class="phase-desc">${esc(f.descripcion || '')}</div>
              ${f.que_ocurre_despues ? `<div class="phase-meta">👉 <em>Siguiente:</em> ${esc(f.que_ocurre_despues)}</div>` : ''}
              ${f.condicion_final && f.condicion_final !== f.descripcion ? `<div class="phase-meta">🏁 <em>Cierre:</em> ${esc(f.condicion_final)}</div>` : ''}
            </div>`).join('')}
        </div>
      </div>`;
  }

  // 8. Series y carga
  let cargaHtml = '';
  const cargaItems = [];
  if (ex.carga?.duracion) cargaItems.push(`<div class="quick-fact-card"><span class="fact-label">⏱ Duración</span><span class="fact-value">${esc(ex.carga.duracion)}</span></div>`);
  if (ex.carga?.series) cargaItems.push(`<div class="quick-fact-card"><span class="fact-label">🔁 Series</span><span class="fact-value">${esc(ex.carga.series)}</span></div>`);
  if (ex.carga?.repeticiones) cargaItems.push(`<div class="quick-fact-card"><span class="fact-label">🔄 Repeticiones</span><span class="fact-value">${esc(ex.carga.repeticiones)}</span></div>`);
  if (ex.carga?.descanso) cargaItems.push(`<div class="quick-fact-card"><span class="fact-label">🛑 Descanso</span><span class="fact-value">${esc(ex.carga.descanso)}</span></div>`);
  if (cargaItems.length || ex.carga?.ciclo_repeticion) {
    cargaHtml = `
      <div id="section-carga" class="section-block">
        <h3>⏱ Series, repeticiones y descansos</h3>
        ${cargaItems.length ? `<div class="quick-facts-grid">${cargaItems.join('')}</div>` : ''}
        ${ex.carga?.ciclo_repeticion ? `<div class="carga-cycle"><strong>Dinámica del ciclo:</strong> ${esc(ex.carga.ciclo_repeticion)}</div>` : ''}
      </div>`;
  }

  // 9. Rotación
  let rotacionHtml = '';
  const hasRot = ex.rotacion && (ex.rotacion.explicacion || (ex.rotacion.detalles && ex.rotacion.detalles.length) || (ex.rotacion.reglas && ex.rotacion.reglas.length));
  if (hasRot) {
    rotacionHtml = `
      <div id="section-rotacion" class="section-block">
        <h3>🔁 Rotación de jugadores</h3>
        ${ex.rotacion.explicacion ? `<p class="section-text">${esc(ex.rotacion.explicacion)}</p>` : ''}
        ${ex.rotacion.detalles && ex.rotacion.detalles.length ? `
          <ul class="plain-list bullet-list">
            ${ex.rotacion.detalles.map(d => `<li>${esc(d)}</li>`).join('')}
          </ul>` : ''}
        ${ex.rotacion.reglas && ex.rotacion.reglas.length ? `
          <div class="rot-rules">
            <strong>Reglas de cambio:</strong>
            <ul class="plain-list bullet-list">
              ${ex.rotacion.reglas.map(r => `<li>${esc(r)}</li>`).join('')}
            </ul>
          </div>` : ''}
      </div>`;
  }

  // 10. Qué observar
  let queObservarHtml = '';
  if (ex.que_observar && ex.que_observar.length) {
    queObservarHtml = `
      <div id="section-que-observar" class="section-block">
        <h3>👀 Qué debe observar el entrenador</h3>
        <ul class="plain-list bullet-list">
          ${ex.que_observar.map(item => `<li>${esc(item)}</li>`).join('')}
        </ul>
      </div>`;
  }

  // 11. Consignas del entrenador
  let consignasHtml = '';
  if (ex.consignas && ex.consignas.length) {
    consignasHtml = `
      <div id="section-consignas" class="section-block">
        <h3>🗣️ Consignas del entrenador</h3>
        <div class="consignas-list">
          ${ex.consignas.map(c => `
            <div class="consigna-quote">
              <span class="quote-icon">📢</span>
              <div class="quote-body">"${esc(c)}"</div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  // 12. Errores y correcciones (DEDUPLICADOS para evitar repeticiones)
  let erroresHtml = '';
  if (ex.errores_correcciones && ex.errores_correcciones.length) {
    const seen = new Set();
    const unique = [];
    for (const ec of ex.errores_correcciones) {
      const err = (ec.error || '').trim();
      const corr = (ec.correccion || '').trim();
      if (!err && !corr) continue;
      const key = `${err.toLowerCase()}___${corr.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push({ error: err, correccion: corr });
    }
    if (unique.length) {
      erroresHtml = `
        <div id="section-errores-correcciones" class="section-block">
          <h3>⚠️ Errores habituales y correcciones</h3>
          <div class="error-corr-grid">
            ${unique.map(ec => `
              <div class="error-corr-card">
                ${ec.error ? `
                  <div class="err-row">
                    <span class="err-tag">Error habitual</span>
                    <span class="err-text">${esc(ec.error)}</span>
                  </div>` : ''}
                ${ec.correccion ? `
                  <div class="corr-row">
                    <span class="corr-tag">Corrección clave</span>
                    <span class="corr-text">${esc(ec.correccion)}</span>
                  </div>` : ''}
              </div>`).join('')}
          </div>
        </div>`;
    }
  }

  // 13. Variantes
  let variantesHtml = '';
  if (ex.variantes && ex.variantes.length) {
    variantesHtml = `
      <div id="section-variantes" class="section-block">
        <h3>🔀 Variantes progresivas</h3>
        <ul class="plain-list bullet-list">
          ${ex.variantes.map(v => {
            if (typeof v === 'string') return `<li>${esc(v)}</li>`;
            const name = v.variante || v.nombre || 'Variante';
            const desc = v.variacion || v.descripcion || '';
            const obj = v.objetivo ? `<em class="var-objective">(${esc(v.objetivo)})</em>` : '';
            return `<li><strong>${esc(name)}:</strong> ${esc(desc)} ${obj}</li>`;
          }).join('')}
        </ul>
      </div>`;
  }

  // 14. Leyenda visual (DIRECTAMENTE BAJO EL VÍDEO)
  let leyendaHtml = '';
  const ley = ex.leyenda_visual;
  const hasJugadores = ley?.jugadores && ley.jugadores.length;
  const hasMateriales = ley?.materiales && ley.materiales.length;
  const hasAcciones = ley?.acciones && ley.acciones.length;
  const hasZonas = ley?.zonas && ley.zonas.length;

  if (hasJugadores || hasMateriales || hasAcciones || hasZonas) {
    let subBlocks = '';
    if (hasJugadores) {
      subBlocks += `
        <div class="legend-category">
          <div class="legend-subtitle">Jugadores y roles</div>
          <div class="legend-items-grid">
            ${ley.jugadores.map(j => {
              const meta = roleVisualMeta(j);
              return `
              <div class="legend-card">
                <div class="legend-player-token" style="background:${meta.bg};color:${meta.color};border:1px solid ${meta.border};font-weight:900;">${esc(meta.code)}</div>
                <div class="legend-info">
                  <div class="legend-title">${esc(meta.label)}</div>
                  ${j.funcion ? `<div class="legend-detail">${esc(j.funcion)}</div>` : ''}
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>`;
    }
    if (hasMateriales) {
      subBlocks += `
        <div class="legend-category">
          <div class="legend-subtitle">Materiales en diagrama</div>
          <div class="legend-items-grid">
            ${ley.materiales.map(m => `
              <div class="legend-card">
                <div class="legend-mat-icon">${m.icono || '📦'}</div>
                <div class="legend-info">
                  <div class="legend-title">${esc(m.nombre)}${m.cantidad ? ` (x${m.cantidad})` : ''}</div>
                  ${m.funcion ? `<div class="legend-detail">${esc(m.funcion)}</div>` : ''}
                </div>
              </div>`).join('')}
          </div>
        </div>`;
    }
    if (hasAcciones) {
      subBlocks += `
        <div class="legend-category">
          <div class="legend-subtitle">Acciones y desplazamientos</div>
          <div class="legend-items-grid">
            ${ley.acciones.map(a => `
              <div class="legend-card">
                <span class="legend-action-visual" title="${esc(a.nombre || a.tipo || 'Acción')}">${renderActionVisualSVG(a.trazo)}</span>
                <div class="legend-info">
                  <div class="legend-title">${esc(a.nombre || a.tipo)}</div>
                  ${a.significado ? `<div class="legend-detail">${esc(a.significado)}</div>` : ''}
                </div>
              </div>`).join('')}
          </div>
        </div>`;
    }
    if (hasZonas) {
      subBlocks += `
        <div class="legend-category">
          <div class="legend-subtitle">Zonas del campo</div>
          <div class="legend-items-grid">
            ${ley.zonas.map(z => `
              <div class="legend-card">
                <span class="legend-zone-visual">${esc(z.id || 'ZONA')}</span>
                <div class="legend-info">
                  <div class="legend-title">${esc(z.id || 'Zona')}</div>
                  ${z.detalle ? `<div class="legend-detail">${esc(z.detalle)}</div>` : ''}
                </div>
              </div>`).join('')}
          </div>
        </div>`;
    }
    leyendaHtml = `
      <div id="section-leyenda" class="section-block section-leyenda-subvideo">
        <div class="section-head-mini">
          <h3>🗺️ Leyenda del ejercicio</h3>
          <span class="pill-legend-info">Guía visual de la animación</span>
        </div>
        <div class="modal-leyenda-content">${subBlocks}</div>
      </div>`;
  }

  const videosHTML = renderVideoSectionHTML(options.videos || [], { role: options.role, exerciseId: ex.id });

  return `
  <div class="ejercicio-v2-sheet ejercicio-validado view-mode-reduced" data-id="${esc(ex.id)}" data-video="${esc(videoSrc)}" style="content-visibility:auto;contain-intrinsic-size:auto 900px" data-lazy-detail="1">
    <!-- Cabecera de la ficha con botón superior accesible -->
    <div class="sheet-head">
      <div class="sheet-title-group">
        <div class="sheet-tags">${tagsHtml}</div>
        <h2 class="sheet-title">${esc(cleanNombre)}</h2>
      </div>
      <button type="button" class="sheet-top-close-btn" data-close aria-label="Cerrar ejercicio">✕</button>
    </div>

    <!-- Selector de modo de vista: reducida (pasos y series) vs completa -->
    <div class="exercise-view-mode-bar" role="tablist" aria-label="Modo de visualización del ejercicio">
      <button type="button" class="view-mode-chip active" data-view-mode="reduced" aria-selected="true" title="Vista rápida de campo: animación, series, repeticiones y pasos">
        ⚡ Vista reducida (Pasos y Series)
      </button>
      <button type="button" class="view-mode-chip" data-view-mode="full" aria-selected="false" title="Vista completa: todo el manual táctico, teoría, variantes y correcciones">
        📋 Vista completa (Todo el detalle)
      </button>
    </div>

    <!-- 1. Preview: siempre antes de cualquier vídeo -->
    ${isUsablePreview(previewSrc) ? `
      <div class="exercise-media-preview" data-media-order="1">
        <div class="exercise-media-label">Vista previa</div>
        <div class="exercise-preview-stage">
          <img src="${esc(previewSrc)}" alt="Vista previa de ${esc(cleanNombre)}" class="exercise-preview-img" loading="eager" data-preview-image="1" data-preview-video-src="${esc(previewVideoSrc)}" data-preview-crop="${esc(previewCropToken)}">
        </div>
      </div>` : previewVideoSrc ? `
      <div class="exercise-media-preview" data-media-order="1">
        <div class="exercise-media-label">Vista previa</div>
        <div class="exercise-preview-stage">
          <canvas class="exercise-preview-static-canvas" data-preview-video-src="${esc(previewVideoSrc)}" data-preview-crop="${esc(previewCropToken)}" aria-label="Vista previa de ${esc(cleanNombre)}"></canvas>
        </div>
      </div>` : `
      <div class="exercise-media-preview" data-media-order="1">
        <div class="exercise-media-label">Vista previa</div>
        <div class="exercise-preview-stage"><div class="card-thumb-placeholder">⚽ CampoBase</div></div>
      </div>`}

    <!-- 2. MP4 gráfico de fichas / animación -->
    <!-- Reproductor de animación con controles y zoom integrado -->
    <div class="exercise-video-wrap">
      <button type="button" class="theater-exit-btn hidden" title="Salir de pantalla completa" aria-label="Salir de pantalla completa">✕ Salir</button>
      <div class="video-stage" style="${mediaCropStageStyle(graphicCrop)}">
        <video class="frame-video${graphicCrop ? ' frame-video-cropped' : ''}" data-src="${esc(videoSrc)}" poster="${esc(previewSrc)}" data-media-crop="${esc(graphicCropToken)}" style="${mediaCropVideoStyle(graphicCrop)}" playsinline webkit-playsinline muted loop preload="none"><source src="${esc(videoSrc)}" type="video/mp4"></video>
        <button type="button" class="video-overlay-play" title="Reproducir animación" aria-label="Reproducir animación">
          <span class="overlay-play-icon">▶</span>
        </button>
      </div>

      <!-- Barra de progreso / seek -->
      <div class="v-progress-container">
        <input type="range" class="v-seek-bar" min="0" max="100" step="0.1" value="0" aria-label="Línea de tiempo de la animación">
      </div>

      <!-- Selector interactivo de zonas para enfocar y ampliar -->
      <div class="v-zones-bar" role="toolbar" aria-label="Zonas tácticas para enfocar y ampliar">
        <span class="v-zones-label">🔍 Zona a ampliar:</span>
        <div class="v-zones-track">
          <button type="button" class="v-zone-chip active" data-zone="all" title="Todo el campo (vista general 100%)">🏟️ Todo (100%)</button>
          <button type="button" class="v-zone-chip" data-zone="goal" title="Área rival / Portería / Finalización">🥅 Área / Gol</button>
          <button type="button" class="v-zone-chip" data-zone="midfield" title="Centro del campo / Construcción">⚙️ Centro</button>
          <button type="button" class="v-zone-chip" data-zone="defense" title="Zona defensiva / Inicio de jugada">🛡️ Defensa</button>
          <button type="button" class="v-zone-chip" data-zone="left" title="Banda izquierda">◀ Banda Izq</button>
          <button type="button" class="v-zone-chip" data-zone="right" title="Banda derecha">▶ Banda Der</button>
        </div>
      </div>

      <!-- Controles tácticos: Organizados en 2 filas fijas, compactas y siempre visibles -->
      <div class="v-controls-bar">
        <!-- Fila 1: Reproducción, saltos 5s, tiempo, bucle y botón de pantalla completa -->
        <div class="v-controls-row v-controls-playback-row">
          <div class="v-controls-subgroup">
            <button type="button" class="v-btn v-btn-play primary" title="Reproducir / Pausar">▶</button>
            <button type="button" class="v-btn v-btn-rewind" title="Retroceder 5 segundos">⏪ 5s</button>
            <button type="button" class="v-btn v-btn-forward" title="Adelantar 5 segundos">5s ⏩</button>
            <span class="v-time-display">00:00 / 00:00</span>
          </div>
          <div class="v-controls-subgroup">
            <button type="button" class="v-btn v-btn-loop active" title="Bucle continuo (repetir)" aria-label="Repetir en bucle">🔁</button>
            <button type="button" class="v-btn v-btn-fullscreen" title="Ampliar a pantalla completa" aria-label="Ampliar a pantalla completa">⛶ <span class="v-btn-text">Ampliar</span></button>
          </div>
        </div>

        <!-- Fila 2: Velocidad y controles de zoom táctico con clamping -->
        <div class="v-controls-row v-controls-tools-row">
          <div class="v-tools-item">
            <span class="v-tools-label">Velocidad:</span>
            <div class="v-speed-group" title="Velocidad de reproducción">
              <button type="button" class="v-btn-speed" data-speed="0.5">0.5×</button>
              <button type="button" class="v-btn-speed active" data-speed="1.0">1×</button>
              <button type="button" class="v-btn-speed" data-speed="1.5">1.5×</button>
            </div>
          </div>

          <div class="v-tools-item">
            <span class="v-tools-label">Zoom:</span>
            <div class="v-zoom-group" title="Zoom táctico">
              <button type="button" class="v-btn v-btn-zoom-out" title="Alejar zoom" aria-label="Alejar zoom">🔍−</button>
              <button type="button" class="v-btn v-btn-zoom-reset" title="Restablecer zoom al 100%" aria-label="Restablecer zoom">100%</button>
              <button type="button" class="v-btn v-btn-zoom-in" title="Acercar zoom" aria-label="Acercar zoom">🔍+</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Botón visible inferior para salir de pantalla completa -->
      <div class="theater-bottom-bar hidden">
        <button type="button" class="theater-bottom-close-btn" aria-label="Cerrar pantalla completa">
          ✕ Cerrar pantalla completa
        </button>
      </div>
    </div>

    <!-- 3. Vídeo de muestra con humanos -->
    ${realVideo ? `
      <div class="section-block real-video-block exercise-media-human" data-media-order="3">
        <h3>🎥 Vídeo de muestra con humanos (en caso de disponer de él)</h3>
        <div class="video-item">
          <video class="real-video-el" controls preload="none" playsinline webkit-playsinline muted><source src="${esc(realVideo)}" type="video/mp4"></video>
        </div>
      </div>` : ''}

    <!-- Leyenda visual (inmediatamente después del vídeo) -->
    ${leyendaHtml}

    <!-- Secciones operativas del ejercicio -->
    <div class="sheet-sections-body">
      ${queTrabajaHtml}
      ${objHtml}
      ${datosRapidosHtml}
      ${organizacionHtml}
      ${montajeHtml}
      ${materialHtml}
      ${comoSeHaceHtml}
      ${fasesHtml}
      ${cargaHtml}
      ${rotacionHtml}
      ${queObservarHtml}
      ${consignasHtml}
      ${erroresHtml}
      ${variantesHtml}
      ${videosHTML}
    </div>

    <!-- Barra de acciones: Imprimir + Añadir a sesión + botón de cierre inferior fijo -->
    <div class="sheet-bottom-bar">
      <button type="button" class="print-exercise-sheet secondary btn-print-exercise" data-id="${esc(ex.id)}" title="Imprimir o guardar ficha en PDF (1 página)">
        🖨️ Imprimir Ficha
      </button>
      <button type="button" class="add-exercise-to-session primary btn-add-session" data-id="${esc(ex.id)}">
        + Añadir a sesión
      </button>
      <button type="button" class="modal-bottom-close-btn" data-close>
        ✕ Cerrar Ejercicio
      </button>
    </div>
  </div>`;
}

/**
 * Renderiza la tarjeta compacta para la cuadrícula de la biblioteca (#exercises-list).
 */
export function renderExerciseGridCard(ex) {
  const media = ex.media || {};
  const rawPreview = media.preview || ex.preview || '';
  // La portada de la tarjeta es preview.png cuando existe; si aún no está
  // publicado, usamos un fotograma PAUSADO del MP4 gráfico, nunca del humano.
  const preview = isUsablePreview(rawPreview) ? rawPreview : '';
  const graphicPreviewVideo = resolveHostedVideoUrl(String(
    ex.preview_video
    || ex.video_ejercicio
    || media.video
    || media.mp4
    || ''
  ).trim());
  const graphicCrop = normalizeMediaCrop(ex.media_crop || ex.preview_crop);
  const graphicCropToken = mediaCropToken(graphicCrop);
  const dr = ex.datos_rapidos || {};
  const tags = uniqueDisplayTags([ex.categoria, ...(ex.etiquetas || [])]).slice(0, 2);
  const cleanNombre = String(ex.nombre || '').replace(/^--\s*/, '').trim();
  const players = formatExercisePlayers(dr.jugadores || '');

  return `
  <article class="panel exercise-card exercise-v2-card" data-exercise-id="${esc(ex.id)}">
    <div class="card-thumb-wrap view-exercise" data-exercise-id="${esc(ex.id)}">
      ${preview
        ? `<img src="${esc(preview)}" alt="${esc(cleanNombre)}" class="card-preview-img" loading="lazy" data-preview-image="1" data-preview-video-src="${esc(graphicPreviewVideo)}" data-preview-crop="${esc(graphicCropToken)}">`
        : graphicPreviewVideo
          ? `<canvas class="card-preview-img card-preview-static-canvas" data-preview-video-src="${esc(graphicPreviewVideo)}" data-preview-crop="${esc(graphicCropToken)}" aria-label="Vista previa de ${esc(cleanNombre)}"></canvas>`
          : `<div class="card-thumb-placeholder">⚽ CampoBase</div>`}
      <span class="card-play-badge">▶</span>
    </div>

    <div class="card-content">
      <div class="card-head-line">
        <div class="card-tags"><span class="pill pill-id" style="font-weight:700;letter-spacing:0.5px;background:rgba(255,255,255,0.08);">${esc(String(ex.id).toUpperCase())}</span>${tags.map(t => `<span class="pill">${esc(t)}</span>`).join('')}</div>
        <button type="button" class="favorite-exercise ${ex.favorite ? 'active' : ''}" data-id="${esc(ex.id)}" aria-label="Favorito">
          ${ex.favorite ? '★' : '☆'}
        </button>
      </div>

      <h3 class="card-title view-exercise" data-exercise-id="${esc(ex.id)}">${esc(cleanNombre)}</h3>

      <div class="card-meta-facts">
        ${players ? `<span>👥 ${esc(players)}</span>` : ''}
        ${dr.material ? `<span>📦 ${esc(dr.material)}</span>` : ''}
      </div>

      <div class="button-row card-actions">
        <button type="button" class="view-exercise primary" data-exercise-id="${esc(ex.id)}">
          Ver ejercicio
        </button>
        <button type="button" class="add-exercise-to-session secondary" data-id="${esc(ex.id)}">
          + Sesión
        </button>
      </div>
    </div>
  </article>`;
}

export function attachVideoDebugger(root, video, { isIOS = false, isStandalone = false } = {}) {
  let isDebug = false;
  try {
    if (typeof window !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('videoDebug') === '1') {
        isDebug = true;
        try { localStorage.setItem('campobase.videoDebug', '1'); } catch {}
      } else if (params.get('videoDebug') === '0') {
        isDebug = false;
        try { localStorage.removeItem('campobase.videoDebug'); } catch {}
      }
    }
    if (!isDebug && typeof localStorage !== 'undefined') {
      isDebug = localStorage.getItem('campobase.videoDebug') === '1';
    }
  } catch {}

  if (!isDebug || !root || !video) return null;

  let debugPanel = root.querySelector('.video-debug-panel');
  if (!debugPanel) {
    debugPanel = document.createElement('div');
    debugPanel.className = 'video-debug-panel';
    debugPanel.style.cssText = 'margin:10px 0;padding:10px;background:#090d16;color:#38bdf8;border:1px solid #0284c7;border-radius:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:11px;line-height:1.45;word-break:break-all;box-shadow:0 4px 12px rgba(0,0,0,0.5);';
    const container = root.querySelector('.exercise-video-wrap') || root;
    if (container.parentNode) {
      container.parentNode.insertBefore(debugPanel, container.nextSibling);
    } else {
      root.appendChild(debugPanel);
    }
  }

  const eventsLog = [];
  const logEvent = (name) => {
    const now = new Date().toLocaleTimeString('es-ES', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 2 });
    eventsLog.unshift(`${now} [${name}] (t=${Number(video.currentTime || 0).toFixed(2)}s, rs=${video.readyState})`);
    if (eventsLog.length > 10) eventsLog.pop();
    render();
  };

  const trackedEvents = ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'play', 'playing', 'waiting', 'stalled', 'suspend', 'pause', 'error', 'ended'];
  trackedEvents.forEach((evName) => {
    video.addEventListener(evName, () => logEvent(evName));
  });

  function render() {
    const swController = (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller)
      ? navigator.serviceWorker.controller.scriptURL
      : 'Sin controlador SW activo';
    const build = (typeof window !== 'undefined' && window.__CAMPOBASE_BUILD) || 'v43';
    const rState = `${video.readyState} (${['HAVE_NOTHING','HAVE_METADATA','HAVE_CURRENT_DATA','HAVE_FUTURE_DATA','HAVE_ENOUGH_DATA'][video.readyState] || '?'})`;
    const nState = `${video.networkState} (${['EMPTY','IDLE','LOADING','NO_SOURCE'][video.networkState] || '?'})`;
    const dur = Number.isFinite(video.duration) ? `${video.duration.toFixed(2)}s` : String(video.duration);
    const cur = Number.isFinite(video.currentTime) ? `${video.currentTime.toFixed(2)}s` : String(video.currentTime);
    const err = video.error ? `Code ${video.error.code}: ${video.error.message || 'Error de medios'}` : 'null';

    debugPanel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1px solid rgba(56,189,248,0.3);padding-bottom:6px;">
        <strong style="color:#f8fafc;font-size:12px;">🐞 DIAGNÓSTICO VÍDEO (iPhone / PWA)</strong>
        <div style="display:flex;gap:4px;">
          <button type="button" class="btn-copy-debug" style="padding:3px 8px;font-size:10px;background:#0284c7;color:#fff;border:none;border-radius:4px;cursor:pointer;">Copiar</button>
          <button type="button" class="btn-close-debug" style="padding:3px 8px;font-size:10px;background:#475569;color:#fff;border:none;border-radius:4px;cursor:pointer;">Cerrar</button>
        </div>
      </div>
      <div><strong>Build:</strong> ${build}</div>
      <div><strong>SW Controller:</strong> ${swController}</div>
      <div><strong>iOS:</strong> ${isIOS} | <strong>Standalone:</strong> ${isStandalone}</div>
      <div><strong>UA:</strong> <span style="font-size:10px;color:#94a3b8;">${typeof navigator !== 'undefined' ? navigator.userAgent : ''}</span></div>
      <div style="margin-top:4px;"><strong>data-src:</strong> <span style="color:#e2e8f0;">${video.dataset.src || '(vacío)'}</span></div>
      <div><strong>currentSrc:</strong> <span style="color:#e2e8f0;">${video.currentSrc || video.getAttribute('src') || '(vacío)'}</span></div>
      <div style="margin-top:4px;"><strong>readyState:</strong> ${rState}</div>
      <div><strong>networkState:</strong> ${nState}</div>
      <div><strong>paused:</strong> ${video.paused} | <strong>tiempo:</strong> ${cur} / ${dur}</div>
      <div><strong>error:</strong> <span style="color:${video.error ? '#f87171' : '#4ade80'}">${err}</span></div>
      <div style="margin-top:6px;border-top:1px dashed rgba(56,189,248,0.2);padding-top:4px;"><strong>Eventos registrados:</strong></div>
      <div style="font-size:10px;color:#94a3b8;margin-top:2px;">${eventsLog.length ? eventsLog.join('<br>') : 'Sin eventos todavía (pulsa Play para registrar)'}</div>
    `;

    debugPanel.querySelector('.btn-copy-debug')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = `DIAGNÓSTICO VÍDEO CAMPOBASE:
Build: ${build}
SW Controller: ${swController}
iOS / Standalone: ${isIOS} / ${isStandalone}
UA: ${typeof navigator !== 'undefined' ? navigator.userAgent : ''}
data-src: ${video.dataset.src || ''}
currentSrc: ${video.currentSrc || video.getAttribute('src') || ''}
readyState: ${rState}
networkState: ${nState}
paused: ${video.paused}
time: ${cur} / ${dur}
error: ${err}
Eventos:
${eventsLog.join('\n')}`;
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => alert('Diagnóstico copiado al portapapeles.'))
          .catch(() => prompt('Copia el texto:', text));
      } else {
        prompt('Copia el texto:', text);
      }
    });

    debugPanel.querySelector('.btn-close-debug')?.addEventListener('click', (e) => {
      e.stopPropagation();
      try { localStorage.removeItem('campobase.videoDebug'); } catch {}
      debugPanel.remove();
    });
  }

  render();
  return { render, logEvent };
}

/**
 * Inicializa el reproductor interactivo y controles de zoom táctico con clamping
 */
export function initValidatedExerciseViewer(root) {
  if (!root || root.dataset._viewerInit) return;
  root.dataset._viewerInit = '1';

  const video = root.querySelector('.frame-video');
  const stage = root.querySelector('.video-stage');
  const btnPlay = root.querySelector('.v-btn-play');
  const overlayPlay = root.querySelector('.video-overlay-play');
  const seekBar = root.querySelector('.v-seek-bar');
  const timeDisplay = root.querySelector('.v-time-display');
  const btnLoop = root.querySelector('.v-btn-loop');
  const btnFullscreen = root.querySelector('.v-btn-fullscreen');
  const speedButtons = root.querySelectorAll('.v-btn-speed');
  const btnZoomIn = root.querySelector('.v-btn-zoom-in');
  const btnZoomOut = root.querySelector('.v-btn-zoom-out');
  const btnZoomReset = root.querySelector('.v-btn-zoom-reset');
  const btnRewind = root.querySelector('.v-btn-rewind');
  const btnForward = root.querySelector('.v-btn-forward');
  const theaterBottomCloseBtn = root.querySelector('.theater-bottom-close-btn');
  // Modo de visualización: reducida vs completa
  const viewModeBar = root.querySelector('.exercise-view-mode-bar');
  if (viewModeBar) {
    let savedMode = 'reduced';
    try {
      savedMode = localStorage.getItem('campobase.exerciseViewMode') || 'reduced';
    } catch {}
    const setMode = (mode) => {
      root.classList.toggle('view-mode-reduced', mode === 'reduced');
      root.classList.toggle('view-mode-full', mode === 'full');
      viewModeBar.querySelectorAll('.view-mode-chip').forEach((btn) => {
        const isActive = btn.dataset.viewMode === mode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      try { localStorage.setItem('campobase.exerciseViewMode', mode); } catch {}
    };
    setMode(savedMode);
    viewModeBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-view-mode]');
      if (!btn) return;
      setMode(btn.dataset.viewMode);
    });
  }

  if (!video) return;

  // iPhone/iPad PWA: prepara el recurso antes del toque de Play.
  // En una instalación standalone física, iniciar redirección + carga + play
  // en el mismo gesto puede quedarse en 0:00 aunque Safari normal funcione.
  const ua = String(navigator?.userAgent || '');
  const isIOS = /iPad|iPhone|iPod/i.test(ua)
    || (navigator?.platform === 'MacIntel' && Number(navigator?.maxTouchPoints || 0) > 1);
  const isStandalone = Boolean(
    navigator?.standalone === true
    || window.matchMedia?.('(display-mode: standalone)')?.matches
  );
  // Configuración estricta para iOS WebKit / Chrome móvil / PWA
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('muted', '');

  const videoDebugger = attachVideoDebugger(root, video, { isIOS, isStandalone });

  // Estado del reproductor y zoom
  let zoom = 1.0;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  function formatTime(sec) {
    if (!sec || isNaN(sec) || !isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function updateTime() {
    if (!video.duration) return;
    const current = video.currentTime;
    const duration = video.duration;
    if (seekBar && !seekBar.matches(':active')) {
      seekBar.value = (current / duration) * 100;
    }
    if (timeDisplay) {
      timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    }
  }

  function updatePlayState(isPlaying) {
    if (btnPlay) btnPlay.textContent = isPlaying ? '⏸' : '▶';
    if (overlayPlay) {
      overlayPlay.classList.toggle('is-playing', isPlaying);
      overlayPlay.classList.toggle('playing', isPlaying);
      overlayPlay.classList.toggle('hidden', isPlaying);
      if (isPlaying) {
        overlayPlay.setAttribute('hidden', '');
        overlayPlay.style.setProperty('display', 'none', 'important');
        overlayPlay.style.setProperty('opacity', '0', 'important');
        overlayPlay.style.setProperty('visibility', 'hidden', 'important');
        overlayPlay.style.setProperty('pointer-events', 'none', 'important');
      } else {
        overlayPlay.removeAttribute('hidden');
        overlayPlay.style.removeProperty('display');
        overlayPlay.style.removeProperty('opacity');
        overlayPlay.style.removeProperty('visibility');
        overlayPlay.style.removeProperty('pointer-events');
      }
    }
    if (stage) stage.classList.toggle('is-playing', isPlaying);
    const wrap = root.querySelector('.exercise-video-wrap');
    if (wrap) wrap.classList.toggle('is-playing', isPlaying);
    videoDebugger?.render();
  }

  let lastToggleTime = 0;
  async function togglePlay() {
    const now = Date.now();
    if (now - lastToggleTime < 300) return;
    lastToggleTime = now;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');

    if (video.paused) {
      updatePlayState(true);
      try {
        const p = video.play();
        if (p && typeof p.catch === 'function') {
          p.catch((err) => {
            console.warn('Error al reproducir vídeo:', err);
            if (video.paused) updatePlayState(false);
          });
        }
      } catch (err) {
        console.warn('Error síncrono al reproducir vídeo:', err);
        if (video.paused) updatePlayState(false);
      }
    } else {
      video.pause();
      updatePlayState(false);
    }
  }

  const handleToggle = (ev) => {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    togglePlay();
  };

  if (btnPlay) {
    btnPlay.addEventListener('click', handleToggle);
    btnPlay.addEventListener('touchend', handleToggle, { passive: false });
  }
  if (overlayPlay) {
    overlayPlay.addEventListener('click', handleToggle);
    overlayPlay.addEventListener('touchend', handleToggle, { passive: false });
  }
  if (stage) {
    stage.addEventListener('click', (e) => {
      if (e.target.closest('.video-overlay-play, .theater-exit-btn')) return;
      handleToggle(e);
    });
  }

  video.addEventListener('error', () => {
    console.warn('Error en elemento de vídeo:', video.error);
    updatePlayState(false);
    video.controls = true;
  });

  video.addEventListener('play', () => updatePlayState(true));
  video.addEventListener('playing', () => updatePlayState(true));
  video.addEventListener('pause', () => updatePlayState(false));
  video.addEventListener('timeupdate', () => {
    if (!video.paused) updatePlayState(true);
    updateTime();
  });
  video.addEventListener('loadedmetadata', updateTime);
  video.addEventListener('ended', () => {
    if (!video.loop) {
      updatePlayState(false);
    }
  });

  if (seekBar) {
    seekBar.addEventListener('input', () => {
      if (video.duration) {
        video.currentTime = (seekBar.value / 100) * video.duration;
      }
    });
  }

  if (btnRewind) {
    btnRewind.addEventListener('click', () => {
      video.currentTime = Math.max(0, video.currentTime - 5);
    });
  }

  if (btnForward) {
    btnForward.addEventListener('click', () => {
      if (video.duration) video.currentTime = Math.min(video.duration, video.currentTime + 5);
    });
  }

  if (btnLoop) {
    btnLoop.addEventListener('click', () => {
      video.loop = !video.loop;
      btnLoop.classList.toggle('active', video.loop);
    });
  }

  speedButtons.forEach((b) => {
    b.addEventListener('click', () => {
      const spd = parseFloat(b.dataset.speed) || 1.0;
      video.playbackRate = spd;
      speedButtons.forEach(btn => btn.classList.toggle('active', btn === b));
    });
  });

  // ZOOM Y PAN TÁCTICO CON CLAMPING
  const zoneChips = root.querySelectorAll('.v-zone-chip');
  const theaterExitBtn = root.querySelector('.theater-exit-btn');

  function clampPan() {
    if (zoom <= 1.0) {
      panX = 0;
      panY = 0;
      return;
    }
    const rect = stage ? stage.getBoundingClientRect() : { width: 360, height: 240 };
    const maxPanX = (rect.width * (zoom - 1)) / 2;
    const maxPanY = (rect.height * (zoom - 1)) / 2;
    panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
    panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
  }

  function updateTransform() {
    clampPan();
    video.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    if (btnZoomReset) btnZoomReset.textContent = `${Math.round(zoom * 100)}%`;
    if (stage) stage.classList.toggle('is-zoomed', zoom > 1.0);
  }

  function applyZoom(newZoom) {
    zoom = Math.max(1.0, Math.min(3.0, Math.round(newZoom * 10) / 10));
    if (zoom === 1.0) {
      panX = 0;
      panY = 0;
      zoneChips.forEach((btn) => btn.classList.toggle('active', btn.dataset.zone === 'all'));
    }
    updateTransform();
  }

  function focusZone(zoneKey) {
    zoneChips.forEach((btn) => btn.classList.toggle('active', btn.dataset.zone === zoneKey));
    if (zoneKey === 'all') {
      applyZoom(1.0);
      return;
    }
    zoom = 1.85;
    const rect = stage ? stage.getBoundingClientRect() : { width: 360, height: 240 };
    const maxPanX = (rect.width * (zoom - 1)) / 2;
    const maxPanY = (rect.height * (zoom - 1)) / 2;

    switch (zoneKey) {
      case 'goal':
        // Portería y área de finalización
        panX = -maxPanX * 0.85;
        panY = 0;
        break;
      case 'midfield':
        // Centro del campo
        panX = 0;
        panY = 0;
        break;
      case 'defense':
        // Zona defensiva y salida
        panX = maxPanX * 0.85;
        panY = 0;
        break;
      case 'left':
        // Banda izquierda
        panX = 0;
        panY = maxPanY * 0.85;
        break;
      case 'right':
        // Banda derecha
        panX = 0;
        panY = -maxPanY * 0.85;
        break;
    }
    updateTransform();
  }

  zoneChips.forEach((chip) => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      focusZone(chip.dataset.zone);
    });
  });

  if (btnZoomIn) btnZoomIn.addEventListener('click', () => applyZoom(zoom + 0.25));
  if (btnZoomOut) btnZoomOut.addEventListener('click', () => applyZoom(zoom - 0.25));
  if (btnZoomReset) btnZoomReset.addEventListener('click', () => applyZoom(1.0));

  const viewerAbortController = new AbortController();
  const { signal } = viewerAbortController;

  // Panning al arrastrar cuando hay zoom
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
    }, { signal });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      if (stage) stage.style.cursor = zoom > 1.0 ? 'grab' : 'default';
    }, { signal });

    // Soporte táctil móvil (pinch-to-zoom y pan)
    let initialPinchDist = 0;
    let initialZoom = 1.0;

    stage.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        initialPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialZoom = zoom;
      } else if (e.touches.length === 1 && zoom > 1.0) {
        isDragging = true;
        startX = e.touches[0].clientX - panX;
        startY = e.touches[0].clientY - panY;
      }
    }, { passive: true });

    stage.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && initialPinchDist > 0) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / initialPinchDist;
        applyZoom(initialZoom * factor);
      } else if (e.touches.length === 1 && isDragging) {
        panX = e.touches[0].clientX - startX;
        panY = e.touches[0].clientY - startY;
        updateTransform();
      }
    }, { passive: true });

    stage.addEventListener('touchend', () => {
      isDragging = false;
      initialPinchDist = 0;
    });
  }

  // Modo Teatro / Ampliar a pantalla completa
  function toggleTheater(force) {
    const wrap = root.querySelector('.exercise-video-wrap');
    if (!wrap) return;
    const dialog = root.closest('dialog') || document.querySelector('#exercise-detail-dialog');
    const willBeFull = typeof force === 'boolean' ? force : !wrap.classList.contains('theater-fullscreen');
    wrap.classList.toggle('theater-fullscreen', willBeFull);
    if (dialog) {
      dialog.classList.toggle('is-theater-active', willBeFull);
    }
    if (theaterExitBtn) theaterExitBtn.classList.toggle('hidden', !willBeFull);
    const bottomBar = root.querySelector('.theater-bottom-bar');
    if (bottomBar) bottomBar.classList.toggle('hidden', !willBeFull);
    if (theaterBottomCloseBtn) theaterBottomCloseBtn.classList.toggle('hidden', !willBeFull);
    if (btnFullscreen) {
      btnFullscreen.classList.toggle('active', willBeFull);
      btnFullscreen.innerHTML = willBeFull ? '✕ <span class="v-btn-text">Reducir</span>' : '⛶ <span class="v-btn-text">Ampliar</span>';
    }
    applyZoom(1.0);
    zoneChips.forEach((btn) => btn.classList.toggle('active', btn.dataset.zone === 'all'));
  }

  if (btnFullscreen) btnFullscreen.addEventListener('click', () => toggleTheater());
  if (theaterExitBtn) theaterExitBtn.addEventListener('click', () => toggleTheater(false));
  if (theaterBottomCloseBtn) theaterBottomCloseBtn.addEventListener('click', () => toggleTheater(false));

  const parentDialog = root.closest('dialog') || document.querySelector('#exercise-detail-dialog');
  if (parentDialog) {
    const handleDialogClose = () => {
      toggleTheater(false);
      try {
        if (video) {
          video.pause();
          video.removeAttribute('src');
          video.load();
        }
        const realVideo = root.querySelector('.real-video-el');
        if (realVideo) {
          realVideo.pause();
          realVideo.removeAttribute('src');
          realVideo.load();
        }
      } catch {}
      try {
        viewerAbortController.abort();
      } catch {}
      parentDialog.removeEventListener('close', handleDialogClose);
    };
    parentDialog.addEventListener('close', handleDialogClose);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const wrap = root.querySelector('.exercise-video-wrap.theater-fullscreen');
      if (wrap) toggleTheater(false);
    }
  }, { signal });
}
