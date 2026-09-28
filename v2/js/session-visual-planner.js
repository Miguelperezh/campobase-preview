import { getAll } from './db.js';
import { EXERCISE_CATEGORIES } from './training-domain.js';
import { EJERCICIOS_VALIDADOS, toCampoBaseExercise, findValidatedExercise } from './ejercicios-validados.js';
import { renderValidatedExerciseHTML, initValidatedExerciseViewer, attachLightbox } from './ejercicio-viewer.js';
import { renderVideoSectionHTML, videoPublicUrl } from './ejercicio-videos.js';
import { calculateSessionTotalMaterial, completeExercise, formatSessionDurationInfo, renderBoardDiagrams, sessionDurationStatus } from './exercise-planning.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

let enhancingBuilder = false;
let detailSessionId = '';
let detailRenderToken = 0;
let pickerCache = null;
let selectedCategory = '';
let pendingPickerAnchor = null;
let enhancementQueued = false;

function blockLabel(type) {
  if (type === 'warmup') return 'Calentamiento';
  if (type === 'final') return 'Juego final';
  return 'Parte principal';
}

function videoSource(validated) {
  const animation = validated?.animacion ?? {};
  return animation.mp4 || String(animation.gif || '').replace(/\.gif$/i, '.mp4');
}

function firstUploadedVideo(videos = []) {
  const video = [...videos].sort((a, b) => Number(a.orden ?? 0) - Number(b.orden ?? 0) || Number(a.createdAt ?? 0) - Number(b.createdAt ?? 0))[0];
  return video?.path ? videoPublicUrl(video.path) : '';
}

function formatDate(value = '') {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : 'Sin fecha';
}

function asTextList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value == null || value === '') return [];
  return [String(value)];
}

function buildLibrary(records) {
  const storedExercises = records.filter((item) => item?.recordType === 'exercise' && item.example !== true);
  const mappedValidated = EJERCICIOS_VALIDADOS.map(toCampoBaseExercise);
  const exercisesById = new Map(storedExercises.map((item) => [item.id, item]));
  for (const exercise of mappedValidated) exercisesById.set(exercise.id, exercise);

  const videos = records.filter((item) => item?.recordType === 'exerciseVideo');
  const videosByExercise = new Map();
  for (const video of videos) {
    if (!videosByExercise.has(video.exerciseId)) videosByExercise.set(video.exerciseId, []);
    videosByExercise.get(video.exerciseId).push(video);
  }

  return {
    exercises: [...exercisesById.values()].sort((a, b) =>
      String(a.category || '').localeCompare(String(b.category || ''), 'es')
      || String(a.name || '').localeCompare(String(b.name || ''), 'es')),
    sessions: records.filter((item) => item?.recordType === 'trainingSession'),
    videosByExercise,
  };
}

async function librarySnapshot() {
  return buildLibrary(await getAll('settings'));
}

async function pickerLibrary() {
  if (pickerCache) return pickerCache;
  pickerCache = buildLibrary(await getAll('settings'));
  return pickerCache;
}

export function orderedSessionCategories(exercises = []) {
  const found = new Set(exercises.map((exercise) => String(exercise?.category || '').trim()).filter(Boolean));
  const extras = [...found].filter((category) => !EXERCISE_CATEGORIES.includes(category)).sort((a, b) => a.localeCompare(b, 'es'));
  return [...EXERCISE_CATEGORIES, ...extras];
}

export function filterSessionExercises(exercises = [], category = '') {
  return category ? exercises.filter((exercise) => exercise.category === category) : [...exercises];
}

function pickerCard(exercise, videos = []) {
  const validated = findValidatedExercise(exercise.id);
  const src = videoSource(validated) || firstUploadedVideo(videos);
  const works = asTextList(validated?.vista_rapida?.que_se_trabaja ?? exercise.works);
  const players = validated?.vista_rapida?.jugadores?.total ?? exercise.players ?? '';
  const duration = Number(exercise.duration) || 0;
  const preview = src
    ? `<div class="session-picker-media">
        <video class="session-picker-video" muted loop playsinline preload="none" data-src="${esc(src)}"></video>
        <button type="button" class="session-picker-play" aria-label="Reproducir demostración de ${esc(exercise.name)}">▶</button>
      </div>`
    : `<div class="session-picker-media session-picker-fallback">${renderBoardDiagrams(completeExercise(exercise))}</div>`;

  return `<article class="panel session-picker-card" data-session-category="${esc(exercise.category || 'Sin categoría')}">
    ${preview}
    <div class="session-picker-card-body">
      <div class="pills"><span class="pill">${esc(exercise.category || 'Sin categoría')}</span>${duration ? `<span class="pill accent">${duration} min</span>` : ''}</div>
      <h3>${esc(exercise.name || 'Ejercicio')}</h3>
      ${works.length ? `<p class="meta">${works.slice(0, 4).map(esc).join(' · ')}</p>` : ''}
      ${players ? `<p class="meta">Jugadores: ${esc(players)}</p>` : ''}
      <div class="button-row">
        <button type="button" class="view-exercise secondary" data-exercise-id="${esc(exercise.id)}">Ver ejercicio</button>
        <button type="button" class="add-exercise-to-session primary" data-id="${esc(exercise.id)}">+ Añadir</button>
      </div>
    </div>
  </article>`;
}

function categorySelectHTML(exercises) {
  const categories = orderedSessionCategories(exercises);
  if (selectedCategory && !categories.includes(selectedCategory)) selectedCategory = '';
  return `<label class="session-category-filter">Categoría
    <select class="session-category-select" aria-label="Filtrar ejercicios de la sesión por categoría">
      <option value="" ${selectedCategory === '' ? 'selected' : ''}>Todas</option>
      ${categories.map((category) => `<option value="${esc(category)}" ${selectedCategory === category ? 'selected' : ''}>${esc(category)}</option>`).join('')}
    </select>
  </label>`;
}

function renderPickerContents(picker, data) {
  const visibleExercises = filterSessionExercises(data.exercises, selectedCategory);
  picker.innerHTML = `
    <div class="session-picker-head">
      <div>
        <h3>Añadir ejercicios</h3>
        <p class="meta">Elige una categoría, mira el MP4 y pulsa «+ Añadir». Puedes cambiar los minutos en los bloques de la sesión.</p>
      </div>
      ${categorySelectHTML(data.exercises)}
    </div>
    <p class="session-picker-count meta">${visibleExercises.length} ${visibleExercises.length === 1 ? 'ejercicio' : 'ejercicios'}${selectedCategory ? ` · ${esc(selectedCategory)}` : ''}</p>
    <div class="exercise-grid session-picker-grid">${visibleExercises.map((exercise) => pickerCard(exercise, data.videosByExercise.get(exercise.id) || [])).join('')}</div>`;
  initPickerVideos(picker);
  reapplyGlobalSearch();
  restorePickerAnchor(picker);
}

function initPickerVideos(root) {
  const videos = $$('.session-picker-video[data-src]', root);
  const load = (video) => {
    if (video.src) return;
    video.src = video.dataset.src;
    video.load();
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        load(entry.target);
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '250px 0px' });
    videos.forEach((video) => observer.observe(video));
  } else {
    videos.slice(0, 8).forEach(load);
  }
}

function reapplyGlobalSearch() {
  const search = $('#global-search');
  if (!search?.value) return;
  window.setTimeout(() => search.dispatchEvent(new Event('input', { bubbles: true })), 0);
}

function rememberPickerAnchor(button) {
  const picker = button.closest('.session-exercise-picker');
  if (!picker) return;
  pendingPickerAnchor = {
    top: picker.getBoundingClientRect().top,
    blockCount: $$('.session-block', $('#session-form')).length,
  };
}

function restorePickerAnchor(picker) {
  if (!pendingPickerAnchor) return;
  const anchor = pendingPickerAnchor;
  pendingPickerAnchor = null;
  requestAnimationFrame(() => {
    if (!picker.isConnected) return;
    const newBlockCount = $$('.session-block', $('#session-form')).length;
    if (newBlockCount <= anchor.blockCount) return;
    const delta = picker.getBoundingClientRect().top - anchor.top;
    if (Math.abs(delta) > 1) window.scrollBy(0, delta);
  });
}

async function enhanceSessionBuilder() {
  const root = $('#session-builder');
  const form = $('#session-form', root);
  if (!root || !form || root.classList.contains('hidden') || enhancingBuilder) return;

  const name = form.elements.name;
  if (name) {
    name.removeAttribute('required');
    name.setAttribute('aria-required', 'false');
  }

  const picker = $('.session-exercise-picker', form);
  if (!picker || picker.dataset.visualPicker === '1') return;

  picker.dataset.visualPicker = '1';
  enhancingBuilder = true;
  try {
    const data = pickerCache || await pickerLibrary();
    if (!picker.isConnected) return;
    renderPickerContents(picker, data);
  } catch (error) {
    picker.dataset.visualPicker = '0';
    throw error;
  } finally {
    enhancingBuilder = false;
  }
}

function genericDetailCard(exercise, videos = []) {
  const item = completeExercise(exercise);
  const list = (items) => `<ul class="plain-list">${asTextList(items).map((value) => `<li>${esc(value)}</li>`).join('')}</ul>`;
  return `<article class="panel exercise-card session-generic-detail">
    <div class="exercise-card-head"><div><span class="pill">${esc(item.category)}</span><h2>${esc(item.name)}</h2></div></div>
    <div class="exercise-highlights"><span>${esc(item.players)}</span><span class="pill accent">${Number(item.duration) || 0} min</span><span class="meta">${esc(item.space)}</span></div>
    ${renderBoardDiagrams(item)}
    ${videos.length ? renderVideoSectionHTML(videos, { exerciseId: exercise.id }) : ''}
    <p>${esc(item.description)}</p>
    <h3>Objetivo</h3><p>${esc(item.objective)}</p>
    <h3>Montaje</h3>${list(item.montage)}
    <h3>Desarrollo paso a paso</h3>${list(item.steps)}
    <h3>Qué se trabaja</h3>${list(item.works)}
    <h3>Qué observar</h3>${list(item.observe)}
    <h3>Correcciones</h3>${list(item.corrections)}
    <p><strong>Si sale mal:</strong> ${esc(item.ifBad)}</p>
    <p><strong>Si sale bien:</strong> ${esc(item.ifGood)}</p>
  </article>`;
}

function prepareValidatedDetail(wrapper, block) {
  $('.add-exercise-to-session', wrapper)?.remove();
  $('.sheet-head', wrapper)?.remove();
  $('.sheet-bottom-bar', wrapper)?.remove();
  const timeInput = $('.tiempo-ejercicio', wrapper);
  if (timeInput) {
    timeInput.value = Number(block.duration) || 1;
    timeInput.disabled = true;
    const dataBox = timeInput.closest('.dato');
    const label = dataBox?.querySelector('small');
    const strong = dataBox?.querySelector('strong');
    const editable = dataBox?.querySelector('.editable');
    if (label) label.textContent = 'Tiempo en esta sesión';
    if (strong) strong.textContent = `${Number(block.duration) || 1} min`;
    if (editable) editable.textContent = 'editable desde «Editar sesión y tiempos»';
  }
  const validatedRoot = $('.ejercicio-validado', wrapper);
  if (validatedRoot) initValidatedExerciseViewer(validatedRoot);
  attachLightbox(wrapper);
}

async function renderSessionDetail(sessionId) {
  const token = ++detailRenderToken;
  const dialog = $('#session-detail-dialog');
  const body = $('#session-detail-body');
  if (!dialog || !body || !sessionId) return;

  const snapshot = await librarySnapshot();
  if (token !== detailRenderToken) return;
  const session = snapshot.sessions.find((item) => item.id === sessionId);
  if (!session || !dialog.open) return;
  const exercisesById = new Map(snapshot.exercises.map((item) => [item.id, item]));
  const durationInfo = formatSessionDurationInfo(session.blocks || [], session.targetDuration, session.pitch);
  const materialText = session.material || calculateSessionTotalMaterial(session.blocks, snapshot.exercises);

  body.innerHTML = `
    <div class="session-visual-detail" data-session-id="${esc(session.id)}">
      <div class="session-detail-summary panel">
        <div>
          <strong>${esc(formatDate(session.date))}${session.time ? ` · ⏰ ${esc(session.time)}` : ''}${session.pitch ? ` · 🏟️ ${esc(session.pitch)}` : ''}</strong>
          <span>${session.blocks?.length || 0} ejercicios · ${durationInfo.metaText}</span>
        </div>
        <div class="button-row" style="margin-top:0.4rem; flex-wrap: wrap;">
          <button type="button" class="open-whistle-session primary compact" data-id="${esc(session.id)}">⏱️ Cronómetro / Silbato</button>
          <button type="button" class="open-whatsapp-session secondary compact" data-id="${esc(session.id)}">📱 Compartir WhatsApp</button>
          <button type="button" class="edit-session secondary compact" data-id="${esc(session.id)}">Editar sesión y tiempos</button>
        </div>
      </div>
      <p class="meta" style="margin: 0.5rem 0 0.35rem;">👇 Toca un ejercicio para desplegarlo (solo se abrirá el que elijas):</p>
      <div class="session-detail-exercises">
        ${(session.blocks || []).map((block, index) => {
          const exercise = exercisesById.get(block.exerciseId);
          const validated = findValidatedExercise(block.exerciseId) || (exercise ? findValidatedExercise(exercise.id) : null);
          const exName = String(validated?.nombre || exercise?.name || 'Ejercicio').replace(/^--\s*/, '').trim();
          if (!exercise && !validated) {
            return `<details name="session-visual-accordion" class="session-detail-block session-block-accordion session-visual-accordion panel" data-session-block="${index}">
              <summary class="session-block-accordion-summary">
                <div class="session-block-summary-left">
                  <span class="session-block-badge">${index + 1}</span>
                  <div class="session-block-summary-info">
                    <div class="session-block-summary-tags">
                      <span class="pill compact ${block.type === 'warmup' ? 'warmup' : block.type === 'main' ? 'main' : 'accent'}">${blockLabel(block.type)}</span>
                      <span class="pill accent compact">${Number(block.duration) || 0} min</span>
                    </div>
                    <h4 class="session-block-summary-name">Ejercicio no disponible</h4>
                  </div>
                </div>
                <span class="toggle-icon">▶</span>
              </summary>
              <div class="session-block-accordion-body">
                <p>Este ejercicio ya no está disponible.</p>
              </div>
            </details>`;
          }
          const exerciseVideos = exercise ? (snapshot.videosByExercise.get(exercise.id) || []) : [];
          const content = validated
            ? renderValidatedExerciseHTML(validated, { videos: exerciseVideos })
            : genericDetailCard(exercise, exerciseVideos);
          return `<details name="session-visual-accordion" class="session-detail-block session-block-accordion session-visual-accordion panel" data-session-block="${index}">
            <summary class="session-block-accordion-summary">
              <div class="session-block-summary-left">
                <span class="session-block-badge">${index + 1}</span>
                <div class="session-block-summary-info">
                  <div class="session-block-summary-tags">
                    <span class="pill compact ${block.type === 'warmup' ? 'warmup' : block.type === 'main' ? 'main' : 'accent'}">${blockLabel(block.type)}</span>
                    <span class="pill accent compact">${Number(block.duration) || 0} min</span>
                  </div>
                  <h4 class="session-block-summary-name">${esc(exName)}</h4>
                </div>
              </div>
              <span class="toggle-icon">▶</span>
            </summary>
            <div class="session-block-accordion-body">
              ${block.notes ? `<p class="session-block-notes"><strong>Consignas / Notas:</strong> ${esc(block.notes)}</p>` : ''}
              <div class="session-detail-exercise-card">${content}</div>
              <div class="session-block-fold-bar" style="margin-top:0.75rem; text-align:center;">
                <button type="button" class="collapse-exercise-block-btn secondary compact" style="width:100%; max-width:320px; min-height:40px;">▲ Plegar ejercicio / Cerrar</button>
              </div>
            </div>
          </details>`;
        }).join('')}
      </div>
      ${materialText ? `<div class="panel" style="margin-top:0.75rem;"><strong>Material total necesario</strong><p>${esc(materialText)}</p></div>` : ''}
      ${session.notes ? `<div class="panel"><strong>Observaciones generales</strong><p>${esc(session.notes)}</p></div>` : ''}
      <div class="button-row" style="margin-top:1rem;"><button type="button" class="edit-session primary" data-id="${esc(session.id)}">Editar sesión y tiempos</button></div>
    </div>`;

  if (!body.__accordionBound) {
    body.__accordionBound = true;
    body.addEventListener('toggle', (event) => {
      if (event.target.open && event.target.classList.contains('session-visual-accordion')) {
        body.querySelectorAll('.session-visual-accordion[open]').forEach((det) => {
          if (det !== event.target) det.removeAttribute('open');
        });
      }
    }, true);
    body.addEventListener('click', (event) => {
      const foldBtn = event.target.closest('.collapse-exercise-block-btn');
      if (foldBtn) {
        const det = foldBtn.closest('details');
        if (det) {
          det.removeAttribute('open');
          det.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });
  }

  $$('.session-detail-block', body).forEach((wrapper, index) => {
    const block = session.blocks[index];
    if (block && findValidatedExercise(block.exerciseId)) prepareValidatedDetail(wrapper, block);
  });
}

function changeCategory(select) {
  selectedCategory = select.value;
  const picker = select.closest('.session-exercise-picker');
  if (!picker || !pickerCache) return;
  renderPickerContents(picker, pickerCache);
}

function togglePickerVideo(button) {
  const card = button.closest('.session-picker-card');
  const video = $('.session-picker-video', card);
  if (!video) return;
  if (!video.src && video.dataset.src) {
    video.src = video.dataset.src;
  }
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('muted', '');
  if (video.paused) {
    video.play().then(() => { button.textContent = '⏸'; }).catch((err) => {
      console.warn('Error al reproducir vídeo:', err);
      video.controls = true;
    });
  } else {
    video.pause();
    button.textContent = '▶';
  }
}

function installStyles() {
  if ($('#session-visual-planner-styles')) return;
  const style = document.createElement('style');
  style.id = 'session-visual-planner-styles';
  style.textContent = `
    .session-picker-head{display:flex;align-items:end;justify-content:space-between;gap:1rem;margin-bottom:.45rem}
    .session-picker-head>div{min-width:0}
    .session-category-filter{min-width:min(300px,100%)}
    .session-category-select{background:var(--card)}
    .session-picker-count{margin:.2rem 0 .8rem}
    .session-picker-grid{align-items:start}
    .session-picker-card{padding:0;overflow:hidden;display:grid;align-content:start;content-visibility:auto;contain-intrinsic-size:480px}
    .session-picker-card-body{padding:1rem}
    .session-picker-card h3{margin:.55rem 0 .35rem}
    .session-picker-media{position:relative;aspect-ratio:16/10;background:var(--ink);overflow:hidden;display:grid;place-items:center}
    .session-picker-video{width:100%;height:100%;object-fit:contain;background:var(--ink)}
    .session-picker-play{position:absolute;inset:auto auto .7rem .7rem;width:46px;height:46px;min-height:46px;padding:0;border-radius:50%;background:var(--card);color:var(--ink);box-shadow:var(--shadow)}
    .session-picker-fallback{padding:.5rem;background:var(--paper);overflow:hidden}
    .session-picker-fallback .exercise-board-sequence{max-height:260px;overflow:hidden}
    .session-detail-summary{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem}
    .session-detail-summary>div{display:grid;gap:.2rem}
    .session-detail-summary span{font-size:.82rem;color:var(--muted)}
    .session-detail-exercises{display:flex;flex-direction:column;gap:0.75rem;width:100%;max-width:100%;min-width:0;box-sizing:border-box}
    .session-detail-block{width:100%;max-width:100%;min-width:0;box-sizing:border-box}
    .session-block-accordion{width:100%;max-width:100%;min-width:0;box-sizing:border-box;overflow:hidden}
    .session-block-accordion-body{width:100%;max-width:100%;min-width:0;box-sizing:border-box;overflow-x:hidden}
    .session-detail-exercise-card{width:100%;max-width:100%;min-width:0;box-sizing:border-box;overflow-x:hidden}
    .session-detail-exercise-card>.ejercicio-validado,.session-detail-exercise-card>.exercise-card{margin:0;width:100%;max-width:100%;min-width:0;box-sizing:border-box;overflow-x:hidden;padding:0}
    #session-detail-dialog{width:min(760px,calc(100% - 1rem));max-width:calc(100vw - 1rem);box-sizing:border-box;overflow-x:hidden}
    @media(max-width:650px){
      .session-picker-head,.session-detail-summary,.session-detail-block-head{align-items:stretch;flex-direction:column}
      .session-category-filter,.session-detail-summary button{width:100%}
      .session-picker-grid{grid-template-columns:1fr}
      #session-detail-dialog{width:calc(100vw - 1rem);max-width:calc(100vw - 1rem);margin:auto;padding:0}
    }
  `;
  document.head.appendChild(style);
}

function scheduleBuilderEnhancement() {
  if (enhancementQueued) return;
  enhancementQueued = true;
  queueMicrotask(() => {
    enhancementQueued = false;
    enhanceSessionBuilder().catch((error) => console.warn('No se pudo mejorar el selector de ejercicios de la sesión:', error));
  });
}

function install() {
  installStyles();

  const builder = $('#session-builder');
  if (builder) new MutationObserver(scheduleBuilderEnhancement).observe(builder, { childList: true, subtree: true });
  scheduleBuilderEnhancement();

  const detailBody = $('#session-detail-body');
  if (detailBody) {
    new MutationObserver(() => {
      if (!detailSessionId || detailBody.querySelector('.session-visual-detail')) return;
      window.setTimeout(() => renderSessionDetail(detailSessionId).catch((error) => console.warn('No se pudo mostrar la sesión visual:', error)), 0);
    }).observe(detailBody, { childList: true, subtree: false });
  }

  document.addEventListener('change', (event) => {
    const category = event.target.closest('.session-category-select');
    if (category) changeCategory(category);
  }, true);

  document.addEventListener('click', (event) => {
    const add = event.target.closest('.session-exercise-picker .add-exercise-to-session');
    if (add) rememberPickerAnchor(add);

    const play = event.target.closest('.session-picker-play');
    if (play) {
      event.preventDefault();
      event.stopPropagation();
      togglePickerVideo(play);
      return;
    }

    const viewSession = event.target.closest('.view-session');
    if (viewSession?.dataset.id) {
      detailSessionId = viewSession.dataset.id;
      window.setTimeout(() => renderSessionDetail(detailSessionId).catch((error) => console.warn('No se pudo mostrar la sesión visual:', error)), 0);
    }

    if (event.target.closest('#new-session, #new-session-exercises, .edit-session')) pickerCache = null;
    if (event.target.closest('.edit-session')) detailRenderToken += 1;
  }, true);

  window.addEventListener('pageshow', scheduleBuilderEnhancement);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
