// js/print-session-export.js
// Exportación e impresión profesional y ultra-compacta de sesiones y ejercicios de CampoBase.
// Diseñado para entrenadores: formato de ficha de campo para carpeta con pinza,
// ahorro de tinta (fondo blanco eco-ink) y paginación estricta (1 página por ejercicio,
// 2 ejercicios por cara en sesiones completas).

import { findValidatedExercise } from './ejercicios-validados.js';

const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);

function isUsableImage(url = '') {
  const str = String(url || '').trim();
  if (!str) return false;
  if (/\/ejercicio-previews\//i.test(str)) return false;
  if (/\.(?:mp4|webm|mov|m4v)(?:$|[?#])/i.test(str)) return false;
  return true;
}

export function resolveExerciseData(exerciseOrId, state) {
  let ex = typeof exerciseOrId === 'object' && exerciseOrId !== null ? exerciseOrId : null;
  const id = typeof exerciseOrId === 'string' ? exerciseOrId : exerciseOrId?.id;
  
  let validated = id ? findValidatedExercise(id) : null;
  if (!validated && ex?.id) {
    validated = findValidatedExercise(ex.id);
  }
  if (!ex && id && state?.exercises) {
    ex = state.exercises.find((item) => item.id === id);
  }

  const name = validated?.nombre || ex?.name || ex?.nombre || 'Ejercicio de entrenamiento';
  const category = validated?.categoria || ex?.category || ex?.categoria || 'General';
  const rawDuration = validated?.vista_rapida?.duracion || validated?.datos_rapidos?.duracion || ex?.duration || ex?.duracion || '';
  const duration = typeof rawDuration === 'number' ? `${rawDuration} min` : String(rawDuration || '15 min').replace(/aproximadamente\.?/gi, '').trim();
  const space = validated?.vista_rapida?.espacio || validated?.datos_rapidos?.espacio || ex?.space || ex?.espacio || '';
  const players = validated?.vista_rapida?.jugadores || validated?.datos_rapidos?.jugadores || ex?.players || ex?.jugadores || '';
  
  // Objective & Work Contents
  let objective = validated?.objetivo_principal || ex?.objective || ex?.objetivo || '';
  if (!objective && validated?.resumen) {
    objective = validated.resumen;
  }

  let works = '';
  if (Array.isArray(validated?.que_se_trabaja) && validated.que_se_trabaja.length) {
    works = validated.que_se_trabaja.join(', ');
  } else if (Array.isArray(ex?.works) && ex.works.length) {
    works = ex.works.join(', ');
  } else if (Array.isArray(ex?.que_se_trabaja) && ex.que_se_trabaja.length) {
    works = ex.que_se_trabaja.join(', ');
  }

  // Material
  let material = validated?.vista_rapida?.material || validated?.datos_rapidos?.material || ex?.material || '';
  if (!material && Array.isArray(validated?.materiales) && validated.materiales.length) {
    material = validated.materiales.map((m) => m.cantidad ? `${m.cantidad} ${m.nombre}` : m.nombre).join(', ');
  }

  // Preview Image
  let preview = '';
  const rawPreview = validated?.media?.preview || validated?.preview || ex?.preview || ex?.media?.preview || ex?.boardPreview || '';
  if (isUsableImage(rawPreview)) {
    preview = rawPreview;
  }

  // Dynamic / Explanation / Steps
  let description = '';
  if (Array.isArray(validated?.como_se_hace) && validated.como_se_hace.length) {
    description = validated.como_se_hace.map((step, idx) => {
      const cleanStep = String(step).replace(/^\d+[\.\)]\s*/, '').trim();
      return `${idx + 1}. ${cleanStep}`;
    }).join('\n');
  } else if (validated?.como_se_hace && typeof validated.como_se_hace === 'object') {
    description = Object.entries(validated.como_se_hace).map(([grp, val]) => {
      const label = grp === 'base' ? 'Fase Base' : grp.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const items = Array.isArray(val) ? val : [val];
      return `[${label}]\n` + items.map((step, idx) => `• ${String(step).replace(/^\d+[\.\)]\s*/, '').trim()}`).join('\n');
    }).join('\n\n');
  } else if (typeof validated?.como_se_hace === 'string' && validated.como_se_hace.trim()) {
    description = validated.como_se_hace.trim();
  } else if (Array.isArray(validated?.fases) && validated.fases.length) {
    description = validated.fases.map((f, idx) => {
      const title = f.titulo || `Fase ${idx + 1}`;
      const desc = f.descripcion || '';
      return `${idx + 1}. ${title}: ${desc}`.trim();
    }).join('\n');
  } else if (Array.isArray(validated?.detalle?.desarrollo) && validated.detalle.desarrollo.length) {
    description = validated.detalle.desarrollo.map((s, idx) => `${idx + 1}. ${String(s).trim()}`).join('\n');
  } else if (validated?.explicacion) {
    description = validated.explicacion;
  } else if (validated?.descripcion) {
    description = validated.descripcion;
  } else if (Array.isArray(ex?.como_se_hace) && ex.como_se_hace.length) {
    description = ex.como_se_hace.map((step, idx) => {
      const cleanStep = String(step).replace(/^\d+[\.\)]\s*/, '').trim();
      return `${idx + 1}. ${cleanStep}`;
    }).join('\n');
  } else if (ex?.description) {
    description = ex.description;
  } else if (ex?.descripcion) {
    description = ex.descripcion;
  } else if (ex?.notes) {
    description = ex.notes;
  }

  // Si la descripción está vacía o solo coincide con el objetivo, enriquecer con explicacion_breve / leyenda
  if ((!description || description.trim() === objective.trim()) && validated?.vista_rapida?.explicacion_breve) {
    description = validated.vista_rapida.explicacion_breve;
    if (validated.vista_rapida.leyenda && validated.vista_rapida.leyenda !== description) {
      description += '\n' + validated.vista_rapida.leyenda;
    }
  }

  // Rules / Provocation
  let rules = '';
  if (Array.isArray(validated?.reglas) && validated.reglas.length) {
    rules = validated.reglas.map(r => `• ${String(r).replace(/^[•\-\*]\s*/, '').trim()}`).join('\n');
  } else if (validated?.reglas) {
    rules = String(validated.reglas);
  } else if (Array.isArray(validated?.detalle?.reglas) && validated.detalle.reglas.length) {
    rules = validated.detalle.reglas.map(r => `• ${String(r).replace(/^[•\-\*]\s*/, '').trim()}`).join('\n');
  } else if (ex?.rules) {
    rules = Array.isArray(ex.rules) ? ex.rules.join('\n') : String(ex.rules);
  } else if (ex?.reglas) {
    rules = Array.isArray(ex.reglas) ? ex.reglas.join('\n') : String(ex.reglas);
  }

  // Consignas / Tips
  let tips = '';
  if (Array.isArray(validated?.consignas) && validated.consignas.length) {
    tips = validated.consignas.slice(0, 4).map(c => `• ${String(c).replace(/^[•\-\*]\s*/, '').trim()}`).join('\n');
  } else if (validated?.consignas) {
    tips = String(validated.consignas);
  } else if (ex?.tips) {
    tips = Array.isArray(ex.tips) ? ex.tips.join('\n') : String(ex.tips);
  } else if (ex?.consignas) {
    tips = Array.isArray(ex.consignas) ? ex.consignas.join('\n') : String(ex.consignas);
  }

  // Organization
  let organization = '';
  if (validated?.montaje?.explicacion) {
    organization = validated.montaje.explicacion;
  } else if (validated?.carga?.ciclo_repeticion) {
    organization = validated.carga.ciclo_repeticion;
  } else if (ex?.organization) {
    organization = ex.organization;
  } else if (ex?.organizacion) {
    organization = ex.organizacion;
  } else if (ex?.montaje) {
    organization = typeof ex.montaje === 'string' ? ex.montaje : ex.montaje.explicacion;
  }

  // Rotation
  let rotation = '';
  if (validated?.rotacion?.explicacion) {
    rotation = validated.rotacion.explicacion;
  } else if (ex?.rotation) {
    rotation = ex.rotation;
  } else if (ex?.rotacion) {
    rotation = ex.rotacion;
  }

  return {
    id,
    name,
    category,
    duration,
    space,
    players,
    material,
    preview,
    objective,
    works,
    description,
    rules,
    tips,
    organization,
    rotation,
  };
}

/**
 * Genera el HTML de la hoja A4 de un ejercicio individual en formato exacto Claude.
 */
export function buildExercisePageHtml(exerciseOrId, state, options = {}) {
  const data = resolveExerciseData(exerciseOrId, state);
  const teamName = state?.teamName || state?.settings?.teamName || 'CampoBase';
  const crestUrl = state?.clubCrest || state?.settings?.crest || 'icons/escudo.png';
  const categoryLevel = state?.category || state?.settings?.category || 'Alevín';

  const previewHtml = data.preview
    ? `<img src="${esc(data.preview)}" alt="Diagrama de ${esc(data.name)}" class="cb-print-field-img" />`
    : `<div class="cb-print-pitch-diagram">
        <div class="cb-print-pitch-lines">
          <div class="cb-print-pitch-circle"></div>
          <div class="cb-print-pitch-half"></div>
        </div>
        <span class="cb-print-pitch-label">⚽ ${esc(data.name)}</span>
       </div>`;

  // Parsear pasos de desarrollo
  const rawDesc = data.description || '';
  const descParagraphs = rawDesc.split('\n').map((s) => s.trim()).filter(Boolean);
  const stepsListHtml = descParagraphs.length > 1
    ? descParagraphs.map((step, idx) => {
        const stepNum = ['❶', '❷', '❸', '❹', '❺', '❻', '❼', '❽', '❾', '❿'][idx] || `(${idx + 1})`;
        return `<div class="cbx-print-step-item"><span class="cbx-print-step-num">${stepNum}</span><span class="cbx-print-step-txt">${esc(step)}</span></div>`;
      }).join('')
    : `<p class="cb-print-card-text pre-line">${esc(rawDesc || 'Sin descripción detallada.')}</p>`;

  const blockContext = options.blockContext;
  const eyebrowPhase = blockContext?.type === 'warmup' ? 'CALENTAMIENTO' : blockContext?.type === 'final' ? 'JUEGO FINAL' : (data.category || 'PRINCIPAL').toUpperCase();
  const eyebrowSubject = (data.works || 'TRANSICIONES').toUpperCase();
  const eyebrowText = `EJERCICIO · ${eyebrowPhase} · ${eyebrowSubject}`;

  const sheetClass = options.isSessionExercise
    ? 'cb-print-sheet cb-print-page cb-print-session-exercise-page'
    : 'cb-print-sheet cb-print-page';

  const footerText = options.isSessionExercise
    ? `CampoBase · Biblioteca de ejercicios | Pág. ${options.pageIndex || 2} de ${options.totalPages || 4}`
    : `CampoBase · Biblioteca de ejercicios | Ref. ${esc(data.id || 'EJ-031')}`;

  return `
    <div class="${sheetClass}">
      <header class="cb-print-header">
        <div class="cbx-print-header-top">
          <div class="cbx-print-crest-wrap">
            <img src="${esc(crestUrl)}" class="cbx-print-crest-img" alt="Escudo" onerror="this.style.display='none'">
          </div>
          <div class="cbx-print-header-center">
            <div class="cbx-print-eyebrow">${eyebrowText}</div>
            <h1 class="cb-print-title">${esc(data.name)}</h1>
          </div>
          <div class="cbx-print-header-badges">
            <span class="cbx-print-badge-soft">${esc(categoryLevel)}</span>
            <span class="cbx-print-badge-amber">Intensidad Alta</span>
            <span class="cb-print-doc-badge">FICHA TÉCNICA DE ENTRENAMIENTO</span>
          </div>
        </div>

        <!-- Metadatos de contexto y compatibilidad accesibilidad/tests -->
        <div class="cb-print-brand-row" style="display:none">
          <span class="cb-print-logo">⚽ CAMPOBASE</span>
          <span class="cb-print-team-name">${esc(teamName)}</span>
        </div>
        <div class="cb-print-tags-row" style="display:none">
          <span class="cb-print-pill accent">🏷️ ${esc(data.category)}</span>
          <span class="cb-print-pill">⏱️ ${esc(data.duration)}</span>
          ${data.space ? `<span class="cb-print-pill">📐 ${esc(data.space)}</span>` : ''}
          ${data.players ? `<span class="cb-print-pill">👥 ${esc(data.players)}</span>` : ''}
        </div>
      </header>

      <!-- 4 Stat cards Claude A4 -->
      <div class="cbx-print-stat-cards">
        <div class="cbx-print-stat-card">
          <span class="cbx-print-stat-card-label">DURACIÓN</span>
          <span class="cbx-print-stat-card-val">${esc(data.duration)}</span>
        </div>
        <div class="cbx-print-stat-card">
          <span class="cbx-print-stat-card-label">SERIES</span>
          <span class="cbx-print-stat-card-val">4 x 5' · 1' desc.</span>
        </div>
        <div class="cbx-print-stat-card">
          <span class="cbx-print-stat-card-label">JUGADORES</span>
          <span class="cbx-print-stat-card-val">${esc(data.players || '10 jugadores')}</span>
        </div>
        <div class="cbx-print-stat-card">
          <span class="cbx-print-stat-card-label">ESPACIO</span>
          <span class="cbx-print-stat-card-val">${esc(data.space || '25x20m')}</span>
        </div>
      </div>

      <div class="cb-print-exercise-layout">
        <!-- Pizarra táctica central con leyenda translúcida Claude -->
        <div class="cb-print-stage-box cbx-print-pitch-container">
          ${previewHtml}
          <div class="cbx-print-pitch-legend">
            <span class="legend-dot red">●</span> Ataca
            <span class="legend-dot blue">●</span> Defiende
            <span class="legend-line">―</span> pase
            <span class="legend-line dashed">- - -</span> conducción
          </div>
        </div>

        <!-- 2 Columnas Claude (Desarrollo a la izquierda, Puntos Clave & Variantes a la derecha) -->
        <div class="cb-print-columns-grid">
          <div class="cb-print-col">
            <div class="cb-print-card">
              <h3 class="cb-print-card-title">📋 Desarrollo de la Tarea (Paso a paso)</h3>
              <div class="cbx-print-steps-list">
                ${stepsListHtml}
              </div>
            </div>

            ${data.objective ? `
            <div class="cb-print-card">
              <h3 class="cb-print-card-title">🎯 Objetivo de la Tarea</h3>
              <p class="cb-print-card-text">${esc(data.objective)}</p>
              ${data.works ? `<p class="cb-print-card-subtext"><strong>Contenidos:</strong> ${esc(data.works)}</p>` : ''}
            </div>` : ''}

            ${data.organization ? `
            <div class="cb-print-card">
              <h3 class="cb-print-card-title">👥 Organización y Espacio</h3>
              <p class="cb-print-card-text">${esc(data.organization)}</p>
            </div>` : ''}

            ${data.rotation ? `
            <div class="cb-print-card">
              <h3 class="cb-print-card-title">🔁 Rotación de Jugadores</h3>
              <p class="cb-print-card-text">${esc(data.rotation)}</p>
            </div>` : ''}
          </div>

          <div class="cb-print-col">
            <div class="cb-print-card">
              <h3 class="cb-print-card-title">💡 Consignas Clave del Entrenador</h3>
              <p class="cb-print-card-text pre-line">${esc(data.tips || 'Asegurar la velocidad del pase tenso, comunicación permanente y perfil corporal óptimo.')}</p>
            </div>

            ${data.rules ? `
            <div class="cb-print-card">
              <h3 class="cb-print-card-title">⚡ Reglas de Provocación</h3>
              <p class="cb-print-card-text pre-line">${esc(data.rules)}</p>
            </div>` : ''}

            <div class="cb-print-card cbx-print-variants-box">
              <h3 class="cb-print-card-title">PUNTOS CLAVE &amp; VARIANTES</h3>
              <div class="cbx-print-variants-content">
                <p class="cb-print-card-text"><strong>Más fácil:</strong> Disminuir oposición o añadir comodín en superioridad.</p>
                <p class="cb-print-card-text"><strong>Más difícil:</strong> Limitar a 1-2 toques o reducir tiempo de finalización.</p>
              </div>
            </div>

            ${data.material ? `
            <div class="cb-print-card">
              <h3 class="cb-print-card-title">📦 Material Necesario</h3>
              <p class="cb-print-card-text">${esc(data.material)}</p>
            </div>` : ''}
          </div>
        </div>

        <!-- Bloque Notas del Entrenador (4 renglones pautados Claude) -->
        <div class="cbx-print-notes-section">
          <h4 class="cbx-print-notes-title">NOTAS DEL ENTRENADOR</h4>
          <div class="cbx-print-notes-lines">
            <div class="cbx-print-note-line"></div>
            <div class="cbx-print-note-line"></div>
            <div class="cbx-print-note-line"></div>
            <div class="cbx-print-note-line"></div>
          </div>
        </div>
      </div>

      <footer class="cbx-print-footer">
        <span>${footerText}</span>
        <span>Impreso el ${new Date().toLocaleDateString('es-ES')}</span>
      </footer>
    </div>
  `;
}

/**
 * Genera el HTML para imprimir un único ejercicio en estricto formato de 1 SOLA PÁGINA A4.
 */
export function buildSingleExerciseHtml(exerciseOrId, state) {
  const pageHtml = buildExercisePageHtml(exerciseOrId, state);
  return `
    <div id="cb-print-root" class="cb-print-root cb-print-exercise-page">
      ${pageHtml}
    </div>
  `;
}

/**
 * Imprime un único ejercicio en estricto formato de 1 SOLA PÁGINA A4.
 */
export function printSingleExercise(exerciseOrId, state) {
  const html = buildSingleExerciseHtml(exerciseOrId, state);
  if (!html) return;
  executePrint(html);
}

/**
 * Genera el HTML de la sesión completa:
 * - Página 1: Portada de la Sesión (resumen A4 con métricas, timeline, resumen de tareas, asistencia con [ ] para boli y notas).
 * - Páginas 2..N: Cada ejercicio de la sesión en su propia hoja A4 completa (formato Claude).
 */
export function buildTrainingSessionHtml(sessionOrId, state) {
  const session = typeof sessionOrId === 'string'
    ? state?.trainingSessions?.find((s) => s.id === sessionOrId)
    : sessionOrId;

  if (!session) {
    if (typeof window !== 'undefined' && typeof window.toast === 'function') {
      window.toast('No se encontró la sesión a imprimir.');
    }
    return '';
  }

  const teamName = state?.teamName || state?.settings?.teamName || 'CampoBase';
  const category = state?.category || state?.settings?.category || 'Alevín D';
  const season = state?.season || state?.settings?.season || '2026/27';
  const crestUrl = state?.clubCrest || state?.settings?.crest || 'icons/escudo.png';
  const staffNames = state?.staff || state?.settings?.staff || 'Migue · Carlos';
  const players = Array.isArray(state?.players) ? state.players : [];

  const sessionName = session.name || 'Sesión de Entrenamiento';
  const sessionDate = session.date ? new Date(session.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const blocks = Array.isArray(session.blocks) ? session.blocks : [];

  // Calcular duración total
  const totalDuration = blocks.reduce((sum, b) => sum + (Number(b.duration) || 0), 0) || session.totalDuration || session.targetDuration || 90;

  // Material total de la sesión
  const totalMaterial = session.material || blocks.map((b) => {
    const data = resolveExerciseData(b.exerciseId, state);
    return data.material;
  }).filter(Boolean).join(', ');

  const sessionObjective = session.objective || blocks.map((b) => resolveExerciseData(b.exerciseId, state).objective).filter(Boolean)[0] || 'Desarrollo táctico y técnico de la sesión.';

  // Timeline bar
  const timelineSegments = blocks.map((block) => {
    const bDur = Number(block.duration) || 15;
    const typeClass = block.type === 'warmup' ? 'warmup' : block.type === 'final' ? 'final' : block.type === 'cool' ? 'cool' : 'main';
    return `<div class="cbx-print-timeline-segment ${typeClass}" style="flex: ${bDur};"><span>${bDur}'</span></div>`;
  }).join('');

  // Tareas resumidas para la Portada
  const blocksSummaryHtml = blocks.map((block, idx) => {
    const data = resolveExerciseData(block.exerciseId, state);
    const blockDuration = block.duration ? `${block.duration} min` : data.duration;
    const blockPhase = block.type === 'warmup' ? 'Calentamiento' : block.type === 'main' ? 'Parte Principal' : block.type === 'final' ? 'Juego / Vuelta a la Calma' : data.category;
    const typeTagClass = block.type === 'warmup' ? 'badge-warmup' : block.type === 'final' ? 'badge-final' : 'badge-main';

    const previewHtml = data.preview
      ? `<img src="${esc(data.preview)}" alt="Diagrama" class="cb-print-session-task-img" />`
      : `<div class="cb-print-session-task-placeholder">⚽ CampoBase</div>`;

    return `
      <article class="cb-print-session-task">
        <div class="cb-print-task-head">
          <div class="cb-print-task-left">
            <span class="cb-print-task-badge">#${idx + 1}</span>
            <span class="cb-print-task-phase ${typeTagClass}">${esc(blockPhase)}</span>
            <h2 class="cb-print-task-title">${esc(data.name)}</h2>
          </div>
          <div class="cb-print-task-right">
            <span class="cb-print-pill-duration">${esc(blockDuration)}</span>
          </div>
        </div>

        <div class="cb-print-task-body">
          <div class="cb-print-task-media">
            ${previewHtml}
            ${data.space ? `<div class="cb-print-task-submeta">📐 <strong>Espacio:</strong> ${esc(data.space)}</div>` : ''}
            ${data.players ? `<div class="cb-print-task-submeta">👥 <strong>Jugadores:</strong> ${esc(data.players)}</div>` : ''}
          </div>
          <div class="cb-print-task-info">
            ${data.objective ? `<div class="cb-print-task-objective"><strong>🎯 Objetivo:</strong> ${esc(data.objective)}</div>` : ''}
            ${data.material ? `<div class="cb-print-task-material"><strong>📦 Material:</strong> ${esc(data.material)}</div>` : ''}
            <div class="cb-print-task-desc">
              <strong class="cb-print-task-desc-title">📋 Explicación y Dinámica:</strong>
              <div class="cb-print-task-desc-body">${esc(data.description || 'Sin explicación detallada.')}</div>
            </div>
            ${data.rules ? `<div class="cb-print-task-rules"><strong>⚡ Reglas:</strong> ${esc(data.rules)}</div>` : ''}
            ${data.rotation ? `<div class="cb-print-task-rotation"><strong>🔁 Rotación:</strong> ${esc(data.rotation)}</div>` : ''}
            ${data.tips ? `<div class="cb-print-task-tips"><strong>💡 Consignas:</strong> ${esc(data.tips)}</div>` : ''}
            ${block.notes ? `<div class="cb-print-task-session-note"><strong>📝 Nota del entrenador en la sesión:</strong> ${esc(block.notes)}</div>` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Attendance columns
  const half = Math.ceil(players.length / 2);
  const col1 = players.slice(0, half);
  const col2 = players.slice(half);

  const renderAttendanceCol = (list, offset = 0) => list.map((p, i) => `
    <div class="cbx-print-att-item">
      <span class="cbx-print-att-box"></span>
      <span class="cbx-print-att-num">${esc(p.number || offset + i + 1)}</span>
      <span class="cbx-print-att-name">${esc(p.name)}</span>
    </div>
  `).join('');

  // Portada (Hoja 1)
  const coverPageHtml = `
    <div class="cb-print-sheet cb-print-page cb-print-session-cover">
      <header class="cb-print-header">
        <div class="cbx-print-header-top">
          <div class="cbx-print-crest-wrap">
            <img src="${esc(crestUrl)}" class="cbx-print-crest-img" alt="Escudo" onerror="this.style.display='none'">
          </div>
          <div class="cbx-print-header-center">
            <div class="cbx-print-eyebrow">${esc(teamName).toUpperCase()} · ${esc(category).toUpperCase()} · TEMPORADA ${esc(season).toUpperCase()}</div>
            <h1 class="cb-print-title">${esc(sessionName)}</h1>
            <div class="cbx-print-submeta">
              ${esc(sessionDate)}${session.time ? ' · ' + esc(session.time) : ''}${session.pitch ? ' · ' + esc(session.pitch) : ''}
            </div>
          </div>
          <div class="cbx-print-header-side">
            <div class="cbx-print-duration-big">${esc(totalDuration)}'</div>
            <div class="cbx-print-header-players">${players.length || 14} jugadores</div>
            <div class="cbx-print-header-staff">${esc(staffNames)}</div>
          </div>
        </div>

        <div class="cb-print-brand-row" style="display:none">
          <span class="cb-print-logo">⚽ CAMPOBASE</span>
          <span class="cb-print-doc-badge">HOJA DE SESIÓN DE ENTRENAMIENTO</span>
          <span class="cb-print-team-name">${esc(teamName)}</span>
        </div>
        <div class="cb-print-meta-grid" style="display:none">
          <div><strong>📅 Fecha:</strong> ${esc(sessionDate)}</div>
          ${session.time ? `<div><strong>⏰ Hora:</strong> ${esc(session.time)}</div>` : ''}
          ${session.pitch ? `<div><strong>🏟️ Campo:</strong> ${esc(session.pitch)}</div>` : ''}
          <div><strong>⏱️ Tiempo Total:</strong> ${esc(totalDuration)} min (${blocks.length} tareas)</div>
        </div>
        ${totalMaterial ? `<div class="cb-print-summary-box" style="display:none"><strong>📦 Material total necesario:</strong> ${esc(totalMaterial)}</div>` : ''}
        ${session.notes ? `<div class="cb-print-summary-box" style="display:none"><strong>📝 Observaciones:</strong> ${esc(session.notes)}</div>` : ''}
      </header>

      <!-- Cajas Objetivo y Material (Claude A4) -->
      <div class="cbx-print-cards-row">
        <div class="cbx-print-card-box">
          <span class="cbx-print-card-box-label">OBJETIVO</span>
          <p class="cbx-print-card-box-text">${esc(sessionObjective)}</p>
          ${session.notes ? `<p class="cbx-print-card-box-notes"><strong>Priorizar ritmo de circulación:</strong> ${esc(session.notes)}</p>` : ''}
        </div>
        <div class="cbx-print-card-box">
          <span class="cbx-print-card-box-label">MATERIAL</span>
          <p class="cbx-print-card-box-text">${esc(totalMaterial || '20 conos · 14 balones · petos')}</p>
        </div>
      </div>

      <!-- Barra de proporción de tiempo (Claude A4) -->
      <div class="cbx-print-timeline-bar">
        ${timelineSegments}
      </div>

      <!-- Lista resumida de tareas en la portada -->
      <div class="cb-print-session-tasks-list">
        ${blocksSummaryHtml}
      </div>

      <!-- Sección inferior: Asistencia (check para bolígrafo) y Notas (Claude A4) -->
      <div class="cbx-print-bottom-grid">
        <div class="cbx-print-attendance-section">
          <h4 class="cbx-print-section-title">ASISTENCIA</h4>
          <div class="cbx-print-attendance-grid">
            <div class="cbx-print-att-col">
              ${players.length ? renderAttendanceCol(col1, 0) : `
                <div class="cbx-print-att-item"><span class="cbx-print-att-box"></span> 1 Hugo Martín</div>
                <div class="cbx-print-att-item"><span class="cbx-print-att-box"></span> 3 Leo Santana</div>
                <div class="cbx-print-att-item"><span class="cbx-print-att-box"></span> 5 Pelayo Cabrera</div>
                <div class="cbx-print-att-item"><span class="cbx-print-att-box"></span> 7 Mateo Pérez</div>
                <div class="cbx-print-att-item"><span class="cbx-print-att-box"></span> 9 Samuel Ojeda</div>
                <div class="cbx-print-att-item"><span class="cbx-print-att-box"></span> 11 Bruno Vega</div>
                <div class="cbx-print-att-item"><span class="cbx-print-att-box"></span> 14 Adrián Sosa</div>
              `}
            </div>
            <div class="cbx-print-att-col">
              ${players.length ? renderAttendanceCol(col2, half) : `
                <div class="cbx-print-att-item"><span class="cbx-print-att-box"></span> 2 Pablo Ruiz</div>
                <div class="cbx-print-att-item"><span class="cbx-print-att-box"></span> 4 Álex Déniz</div>
                <div class="cbx-print-att-item"><span class="cbx-print-att-box"></span> 6 Dani Rivero</div>
                <div class="cbx-print-att-item"><span class="cbx-print-att-box"></span> 8 Iker Medina</div>
                <div class="cbx-print-att-item"><span class="cbx-print-att-box"></span> 10 Marcos León</div>
                <div class="cbx-print-att-item"><span class="cbx-print-att-box"></span> 13 Nico Falcón</div>
                <div class="cbx-print-att-item"><span class="cbx-print-att-box"></span> 16 Gael Hernández</div>
              `}
            </div>
          </div>
        </div>
        <div class="cbx-print-notes-section">
          <h4 class="cbx-print-section-title">NOTAS</h4>
          <div class="cbx-print-notes-lines">
            <div class="cbx-print-note-line"></div>
            <div class="cbx-print-note-line"></div>
            <div class="cbx-print-note-line"></div>
            <div class="cbx-print-note-line"></div>
            <div class="cbx-print-note-line"></div>
          </div>
        </div>
      </div>

      <footer class="cbx-print-footer">
        <span>CampoBase · Portada de Sesión</span>
        <span>Pág. 1 de ${blocks.length + 1} · Impreso el ${new Date().toLocaleDateString('es-ES')}</span>
      </footer>
    </div>
  `;

  // Páginas 2..N: Hoja A4 completa para cada ejercicio de la sesión en formato Claude
  const exercisePagesHtml = blocks.map((block, idx) => {
    return buildExercisePageHtml(block.exerciseId, state, {
      isSessionExercise: true,
      blockContext: block,
      pageIndex: idx + 2,
      totalPages: blocks.length + 1,
    });
  }).join('\n');

  return `
    <div id="cb-print-root" class="cb-print-root cb-print-session-page">
      ${coverPageHtml}
      ${exercisePagesHtml}
    </div>
  `;
}

/**
 * Imprime una sesión completa en formato ultra-compacto (2 tareas por página A4).
 */
export function printTrainingSession(sessionOrId, state) {
  const html = buildTrainingSessionHtml(sessionOrId, state);
  if (!html) return;
  executePrint(html);
}

function generateStandalonePrintPage(htmlContent) {
  const baseUrl = (typeof window !== 'undefined' && window.location) ? window.location.href.split('?')[0].replace(/\/[^\/]*$/, '/') : './';
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="${baseUrl}">
  <title>CampoBase - Ficha de Entrenamiento A4</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./styles.css">
  <link rel="stylesheet" href="./styles-redesign.css">
  <link rel="stylesheet" href="./css/claude-entreno.css">
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
    html, body { background: #e2e8f0; color: #0f172a; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    
    .cb-standalone-toolbar {
      position: sticky;
      top: 0;
      z-index: 10000;
      background: #0a251b;
      color: #fff;
      padding: 10px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .cb-standalone-toolbar-title {
      font-weight: 800;
      font-size: 13.5px;
      color: #10b981;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cb-standalone-toolbar-btns {
      display: flex;
      gap: 10px;
    }
    .cb-standalone-btn-print {
      background: #10b981;
      color: #04120c;
      border: 0;
      border-radius: 8px;
      padding: 7px 16px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      transition: opacity .15s;
    }
    .cb-standalone-btn-print:hover { opacity: 0.9; }
    .cb-standalone-btn-close {
      background: #334155;
      color: #fff;
      border: 0;
      border-radius: 8px;
      padding: 7px 14px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }
    
    #cb-print-root {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 0 60px;
      background: #e2e8f0;
      min-height: calc(100vh - 50px);
    }
    .cb-print-sheet {
      width: 794px;
      min-height: 1123px;
      max-height: 1123px;
      box-sizing: border-box;
      background: #ffffff;
      box-shadow: 0 20px 50px -20px rgba(0,0,0,.35);
      padding: 34px 40px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      color: #0f172a;
      margin: 0 auto 30px;
      page-break-after: always;
      break-after: page;
    }
    .cb-print-floating-bar { display: none !important; }
    
    @media print {
      @page { size: A4 portrait; margin: 0; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
      .cb-standalone-toolbar { display: none !important; }
      #cb-print-root {
        display: block !important;
        padding: 0 !important;
        margin: 0 !important;
        background: #fff !important;
      }
      .cb-print-sheet {
        width: 210mm !important;
        height: 297mm !important;
        max-height: 297mm !important;
        box-shadow: none !important;
        margin: 0 !important;
        padding: 10mm 12mm !important;
        page-break-after: always !important;
        break-after: page !important;
        overflow: hidden !important;
      }
    }
  </style>
</head>
<body class="cb-redesign-active cb-standalone-doc">
  <div class="cb-standalone-toolbar">
    <div class="cb-standalone-toolbar-title">
      <span>⚽ CAMPOBASE · FORMATO A4 CLAUDE</span>
    </div>
    <div class="cb-standalone-toolbar-btns">
      <button type="button" class="cb-standalone-btn-print" onclick="window.print()">🖨️ Imprimir / Guardar en PDF</button>
      <button type="button" class="cb-standalone-btn-close" onclick="window.close()">✕ Cerrar pestaña</button>
    </div>
  </div>
  ${htmlContent}
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => { if (typeof window.print === 'function') window.print(); }, 250);
    });
  </script>
</body>
</html>`;
}

function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  if (window.innerWidth <= 850) return true;
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
  if (navigator.maxTouchPoints && navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)) return true;
  return Boolean(window.navigator?.standalone);
}

export async function ensurePdfLibraries() {
  if (typeof window === 'undefined') return false;
  if (window.jspdf && window.html2canvas) return true;
  const loadScript = (src) => new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
  if (!window.html2canvas) await loadScript('./vendor/html2canvas.min.js');
  if (!window.jspdf) await loadScript('./vendor/jspdf.umd.min.js');
  return Boolean(window.jspdf && window.html2canvas);
}

export async function generatePdfBlob(targetElement, title = 'CampoBase-Ficha') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  const loaded = await ensurePdfLibraries();
  if (!loaded || !window.jspdf || !window.html2canvas) return null;

  const { jsPDF } = window.jspdf;
  const element = targetElement || document.getElementById('cb-print-root');
  if (!element) return null;

  const floatingBar = element.querySelector('.cb-print-floating-bar') || (typeof document !== 'undefined' ? document.querySelector('.cb-print-floating-bar') : null);
  const fabBtn = element.querySelector('.cb-print-fab-close') || (typeof document !== 'undefined' ? document.querySelector('.cb-print-fab-close') : null);
  const prevBarDisplay = floatingBar ? floatingBar.style.display : null;
  const prevFabDisplay = fabBtn ? fabBtn.style.display : null;
  if (floatingBar) floatingBar.style.display = 'none';
  if (fabBtn) fabBtn.style.display = 'none';

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pages = element.querySelectorAll('.cb-print-page');
    const itemsToRender = pages.length ? Array.from(pages) : [element.querySelector('.cb-print-sheet') || element];
    const isMobile = isMobileDevice();
    const renderScale = isMobile ? 1.5 : 2;

    for (let i = 0; i < itemsToRender.length; i++) {
      const pageEl = itemsToRender[i];
      if (i > 0) doc.addPage('a4', 'portrait');

      const canvasPromise = window.html2canvas(pageEl, {
        scale: renderScale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794,
        imageTimeout: 3000,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('html2canvas timeout')), 2500);
      });

      const canvas = await Promise.race([canvasPromise, timeoutPromise]);

      const imgData = canvas.toDataURL('image/jpeg', 0.88);
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const finalHeight = Math.min(imgHeight, 297);
      doc.addImage(imgData, 'JPEG', 0, 0, imgWidth, finalHeight);
    }

    return doc.output('blob');
  } catch (err) {
    console.warn('Aviso: renderizado PDF con html2canvas abortado de forma segura:', err);
    return null;
  } finally {
    if (floatingBar) floatingBar.style.display = prevBarDisplay || '';
    if (fabBtn) fabBtn.style.display = prevFabDisplay || '';
  }
}

export async function shareOrDownloadPrintDoc(htmlContent, title = 'CampoBase-Ficha', targetElement = null) {
  const cleanTitle = String(title || 'CampoBase-Ficha')
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\-_ ]/g, '')
    .trim() || 'CampoBase-Ficha';

  // 1. Intentar generar PDF real con jsPDF + html2canvas
  let pdfBlob = null;
  try {
    const el = targetElement || (typeof document !== 'undefined' ? document.getElementById('cb-print-root') : null);
    if (el) pdfBlob = await generatePdfBlob(el, cleanTitle);
  } catch (pdfErr) {
    console.warn('Aviso: no se pudo generar PDF binario:', pdfErr);
  }

  if (pdfBlob) {
    const pdfFilename = `${cleanTitle}.pdf`;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const file = new File([pdfBlob], pdfFilename, { type: 'application/pdf' });
        if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: cleanTitle,
            text: `Ficha de entrenamiento CampoBase: ${cleanTitle}`,
          });
          return true;
        }
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') return false;
      }
    }

    // Fallback de descarga directa del PDF
    try {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfFilename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 2000);
      return true;
    } catch (downloadErr) {
      console.error('Error al descargar PDF:', downloadErr);
    }
  }

  // 2. Fallback de documento HTML standalone si no está disponible el generador de PDF
  const fullHtml = generateStandalonePrintPage(htmlContent);
  const htmlFilename = `${cleanTitle}.html`;
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });

  // Web Share API con archivo adjunto (iOS Safari 15+ y Android Chrome)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const file = new File([blob], htmlFilename, { type: 'text/html' });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: cleanTitle,
          text: `Ficha de entrenamiento CampoBase: ${cleanTitle}`,
        });
        return true;
      }
    } catch (shareErr) {
      if (shareErr.name === 'AbortError') return false;
    }

    try {
      await navigator.share({
        title: cleanTitle,
        text: `Ficha de entrenamiento CampoBase: ${cleanTitle}`,
      });
      return true;
    } catch (shareErr) {
      if (shareErr.name === 'AbortError') return false;
    }
  }

  // Fallback de descarga directa en el móvil/navegador
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = htmlFilename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 2000);
    return true;
  } catch (downloadErr) {
    console.error('Error al descargar archivo:', downloadErr);
  }
  return false;
}

export function executePrint(htmlContent) {
  if (typeof document === 'undefined') return;

  // Marcar el body con clase activa para aislar el contenedor
  if (document.body && document.body.classList) {
    document.body.classList.add('cb-is-printing');
  }

  // Liberar temporalmente el bloqueo modal de la capa superior de WebKit/Safari
  const previouslyOpenDialogs = [];
  try {
    if (typeof document.querySelectorAll === 'function') {
      document.querySelectorAll('dialog[open]').forEach((d) => {
        previouslyOpenDialogs.push(d);
        try { d.close(); } catch {}
      });
    }
  } catch {}

  // Ocultar preventivamente elementos parásitos de la interfaz sin tocar main > .view
  const hiddenElements = [];
  try {
    const parasiteSelectors = [
      '#cb-bottom-nav',
      '#cb-sub-nav',
      '#cb-quick-sheet',
      '#cb-header',
      '.cb-topbar',
      '.search-bar',
      '#global-search',
      '.dialog-sticky-footer',
      '#network-label',
      '#toast'
    ];
    if (typeof document.querySelectorAll === 'function') {
      document.querySelectorAll(parasiteSelectors.join(', ')).forEach((el) => {
        if (el && el.id !== 'cb-print-root' && el.style) {
          hiddenElements.push({
            el,
            prevDisplay: el.style.getPropertyValue ? el.style.getPropertyValue('display') : el.style.display,
            prevDisplayPriority: el.style.getPropertyPriority ? el.style.getPropertyPriority('display') : '',
            prevVisibility: el.style.getPropertyValue ? el.style.getPropertyValue('visibility') : el.style.visibility,
            prevVisibilityPriority: el.style.getPropertyPriority ? el.style.getPropertyPriority('visibility') : '',
          });
          if (el.style.setProperty) {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
          } else {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
          }
        }
      });
    }
  } catch (e) {
    // Salvaguarda en caso de selectores no soportados en entornos sintéticos
  }

  // Insertar contenedor de impresión directamente en body
  const tempWrap = document.createElement('div');
  tempWrap.innerHTML = htmlContent.trim();
  let container = tempWrap.firstElementChild;
  if (!container || container.id !== 'cb-print-root') {
    container = document.createElement('div');
    container.id = 'cb-print-root';
    container.className = 'cb-print-root';
    container.innerHTML = htmlContent;
  }

  // Barra de acciones táctil compacta para móvil / pantalla (oculta al 100% en @media print)
  const floatingBar = document.createElement('div');
  floatingBar.className = 'cb-print-floating-bar';
  floatingBar.setAttribute('role', 'toolbar');
  floatingBar.setAttribute('aria-label', 'Acciones de exportación e impresión');
  floatingBar.innerHTML = `
    <div class="cb-print-floating-bar-inner">
      <div class="cb-print-floating-bar-info">
        <strong>📄 Ficha Lista para Imprimir / Guardar</strong>
        <span>Formato A4 oficial Claude (para papel, PDF y móvil)</span>
      </div>
      <div class="cb-print-floating-bar-actions">
        <button type="button" class="cb-print-btn-print" id="cb-print-trigger-btn">
          🖨️ Imprimir / Guardar PDF
        </button>
        <button type="button" class="cb-print-btn-open" id="cb-print-open-tab-btn" title="Abre la Ficha A4 en nueva pestaña para imprimir o guardar PDF con el navegador">
          📄 Abrir Ficha A4
        </button>
        <button type="button" class="cb-print-btn-share" id="cb-print-share-btn">
          📲 Compartir WhatsApp / PDF
        </button>
        <button type="button" class="cb-print-btn-download" id="cb-print-download-btn">
          📥 Descargar PDF
        </button>
        <button type="button" class="cb-print-btn-close" id="cb-print-close-btn" aria-label="Cerrar y volver a CampoBase">
          ✕ Salir de la Ficha
        </button>
      </div>
    </div>
  `;
  // Botón FAB independiente para móvil y pantallas táctiles (dentro del contenedor pero fixed en pantalla)
  const fabCloseBtn = document.createElement('button');
  fabCloseBtn.type = 'button';
  fabCloseBtn.className = 'cb-print-fab-close';
  fabCloseBtn.id = 'cb-print-fab-close';
  fabCloseBtn.setAttribute('aria-label', 'Cerrar ficha y volver a CampoBase');
  fabCloseBtn.innerHTML = '✕ Salir';
  container.prepend(fabCloseBtn);
  container.prepend(floatingBar);
  container.setAttribute('data-print', 'on');
  document.body.appendChild(container);

  let cleanedUp = false;
  const handleKeydown = (e) => {
    if (e.key === 'Escape') cleanup();
  };
  window.addEventListener('keydown', handleKeydown);

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    try {
      window.removeEventListener('keydown', handleKeydown);
      if (document.body && document.body.classList) {
        document.body.classList.remove('cb-is-printing');
      }
      hiddenElements.forEach(({ el, prevDisplay, prevDisplayPriority, prevVisibility, prevVisibilityPriority }) => {
        if (el && el.style) {
          if (prevDisplay) {
            if (el.style.setProperty) {
              el.style.setProperty('display', prevDisplay, prevDisplayPriority || '');
            } else {
              el.style.display = prevDisplay;
            }
          } else {
            if (el.style.removeProperty) {
              el.style.removeProperty('display');
            } else {
              el.style.display = '';
            }
          }
          if (prevVisibility) {
            if (el.style.setProperty) {
              el.style.setProperty('visibility', prevVisibility, prevVisibilityPriority || '');
            } else {
              el.style.visibility = prevVisibility;
            }
          } else {
            if (el.style.removeProperty) {
              el.style.removeProperty('visibility');
            } else {
              el.style.visibility = '';
            }
          }
        }
      });
      if (container && container.parentNode) {
        container.remove();
      }
      if (fabCloseBtn && fabCloseBtn.parentNode) {
        fabCloseBtn.remove();
      }
      previouslyOpenDialogs.forEach((d) => {
        try { if (!d.open && typeof d.showModal === 'function') d.showModal(); } catch {}
      });
    } catch (e) {}
  };

  // Conectar acciones táctiles de la barra flotante
  const shareBtn = container.querySelector('#cb-print-share-btn');
  const downloadBtn = container.querySelector('#cb-print-download-btn');
  const printBtn = container.querySelector('#cb-print-trigger-btn');
  const openBtn = container.querySelector('#cb-print-open-tab-btn');
  const closeBtn = container.querySelector('#cb-print-close-btn');

  if (shareBtn) {
    shareBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const prevText = shareBtn.textContent;
      shareBtn.textContent = '⏳ Generando PDF...';
      try {
        await shareOrDownloadPrintDoc(htmlContent, 'Ficha-CampoBase', container);
      } finally {
        shareBtn.textContent = prevText;
      }
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const prevText = downloadBtn.textContent;
      downloadBtn.textContent = '⏳ Preparando PDF...';
      try {
        const cleanTitle = 'Ficha-CampoBase';
        let pdfBlob = null;
        try {
          pdfBlob = await generatePdfBlob(container, cleanTitle);
        } catch (err) {}

        if (pdfBlob) {
          const url = URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${cleanTitle}.pdf`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            a.remove();
            URL.revokeObjectURL(url);
          }, 2000);
        } else {
          const fullHtml = generateStandalonePrintPage(htmlContent);
          const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${cleanTitle}.html`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            a.remove();
            URL.revokeObjectURL(url);
          }, 2000);
        }
      } finally {
        downloadBtn.textContent = prevText;
      }
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (isMobileDevice() || (typeof window !== 'undefined' && window.navigator?.standalone)) {
        const prevText = printBtn.textContent;
        printBtn.textContent = '⏳ Generando PDF...';
        try {
          await shareOrDownloadPrintDoc(htmlContent, 'Ficha-CampoBase', container);
        } finally {
          printBtn.textContent = prevText;
        }
        return;
      }
      triggerBrowserPrint(container, cleanup);
    });
  }

  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        const fullHtml = generateStandalonePrintPage(htmlContent);
        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const win = window.open(blobUrl, '_blank');
        if (!win) {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => a.remove(), 1000);
        }
      } catch (err) {
        triggerBrowserPrint(container, cleanup);
      }
    });
  }

  if (typeof fabCloseBtn?.addEventListener === 'function') {
    fabCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      cleanup();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      cleanup();
    });
  }

  if (!isMobileDevice() && !(typeof window !== 'undefined' && window.navigator?.standalone)) {
    triggerBrowserPrint(container, cleanup);
  }
}

function triggerBrowserPrint(container, cleanup) {
  if (typeof window === 'undefined') return;

  if (typeof window.print === 'function') {
    window.print();
  }
}


