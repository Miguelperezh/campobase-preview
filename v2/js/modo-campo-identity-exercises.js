(() => {
  'use strict';

  const SUPABASE_URL = 'https://mdzpygfwugawlmknywxa.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_j7duh_i5pNnMZMtT0YT-fg_l76UA_gH';

  const THEME_PRESETS = {
    default: { bg:'#071711', card:'#0e261d', nav:'rgba(10,31,23,.96)', input:'#091c15', text:'#f8fafc', border:'#1b4d3a' },
    dark: { bg:'#040806', card:'#0a140e', nav:'rgba(8,18,13,.96)', input:'#060e0a', text:'#f8fafc', border:'#153023' },
    'pitch-vivid': { bg:'#021e12', card:'#06331f', nav:'rgba(4,38,23,.96)', input:'#032516', text:'#f0fdf4', border:'#125435' },
    navy: { bg:'#061021', card:'#0c1b33', nav:'rgba(10,24,46,.96)', input:'#081427', text:'#f8fafc', border:'#183359' },
    ocean: { bg:'#03141f', card:'#072436', nav:'rgba(5,27,41,.96)', input:'#041c2b', text:'#f0f9ff', border:'#0e4161' },
    charcoal: { bg:'#0f1113', card:'#181b1e', nav:'rgba(19,22,25,.96)', input:'#121417', text:'#f8fafc', border:'#282d33' },
    steel: { bg:'#171d24', card:'#222a34', nav:'rgba(28,36,46,.96)', input:'#1a222a', text:'#f8fafc', border:'#33404f' },
    burgundy: { bg:'#170408', card:'#260810', nav:'rgba(29,6,12,.96)', input:'#1d050a', text:'#fff1f2', border:'#45101d' },
    purple: { bg:'#110722', card:'#1d0e38', nav:'rgba(23,10,44,.96)', input:'#16092b', text:'#faf5ff', border:'#381c6b' },
    light: { bg:'#ffffff', card:'#ffffff', nav:'rgba(255,255,255,.96)', input:'#f8fafc', text:'#0f172a', border:'#e2e8f0' },
    warm: { bg:'#f6f3eb', card:'#ffffff', nav:'rgba(246,243,235,.96)', input:'#fbf9f4', text:'#292524', border:'#e5dfd3' },
    sepia: { bg:'#eee6d8', card:'#faf6ee', nav:'rgba(238,230,216,.96)', input:'#f4ede1', text:'#2d241e', border:'#d7cbb6' },
    'high-vis': { bg:'#000000', card:'#080808', nav:'rgba(0,0,0,.98)', input:'#000000', text:'#ffffff', border:'#facc15' },
  };
  const FONT_SCALE_MAP = { compact:'14.5px', normal:'16px', large:'19.2px', xlarge:'22.4px', huge:'25.6px', enormous:'28.8px', ultra:'32px' };
  const FONT_FAMILY_MAP = {
    system:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    sport:'"Barlow Condensed", "Oswald", "DIN Alternate", "Impact", -apple-system, sans-serif',
    readable:'"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    modern:'"Outfit", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    technical:'"JetBrains Mono", "SF Mono", "Menlo", "Monaco", "Consolas", monospace',
    classic:'"Merriweather", "Charter", "Georgia", "Cambria", "Times New Roman", serif',
  };
  const TEXT_COLOR_MAP = { 'dark-slate':'#0f172a', 'pure-black':'#000000', 'high-contrast':'#000000', navy:'#0a1c36', 'pure-white':'#ffffff' };
  const FONT_WEIGHT_MAP = { normal:'400', semibold:'600', bold:'700', extrabold:'800', 'ultra-bold':'900' };

  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
  let client = null;
  let sessions = new Map();
  let currentMain = {};
  let catalogPromise = null;
  let activeSession = null;

  function readLocalTheme() {
    try { return JSON.parse(localStorage.getItem('campobase.theme') || '{}') || {}; }
    catch { return {}; }
  }

  function contrastFor(hex = '#c8102e') {
    const clean = String(hex).replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(clean)) return '#ffffff';
    const r = parseInt(clean.slice(0,2),16);
    const g = parseInt(clean.slice(2,4),16);
    const b = parseInt(clean.slice(4,6),16);
    return ((r * 299 + g * 587 + b * 114) / 1000) >= 135 ? '#0f172a' : '#ffffff';
  }

  function applyTheme(main = {}) {
    const localTheme = readLocalTheme();
    const theme = {
      themeBg:'default', accentPreset:'emerald', accentColor:'#10b981', fontFamily:'system', fontScale:'normal', fontWeight:'bold', textColor:'dark-slate',
      ...(main.theme || {}),
      ...localTheme,
    };
    const preset = THEME_PRESETS[theme.themeBg] || THEME_PRESETS.default;
    const fontColor = theme.fontColor || TEXT_COLOR_MAP[theme.textColor] || preset.text;
    const accent = theme.accentColor || '#10b981';
    const root = document.documentElement;
    root.style.setProperty('--field-bg', preset.bg);
    root.style.setProperty('--field-card', preset.card);
    root.style.setProperty('--field-nav', preset.nav);
    root.style.setProperty('--field-input', preset.input);
    root.style.setProperty('--field-text', fontColor || preset.text);
    root.style.setProperty('--field-border', preset.border);
    root.style.setProperty('--field-accent', accent);
    root.style.setProperty('--field-accent-text', contrastFor(accent));
    root.style.setProperty('--field-font-family', FONT_FAMILY_MAP[theme.fontFamily] || FONT_FAMILY_MAP.system);
    root.style.setProperty('--field-font-weight', FONT_WEIGHT_MAP[theme.fontWeight] || '700');
    root.style.fontSize = FONT_SCALE_MAP[theme.fontScale] || '16px';
    root.dataset.themeBg = theme.themeBg || 'default';
    root.dataset.themeFamily = theme.fontFamily || 'system';
    root.dataset.fontScale = theme.fontScale || 'normal';
    root.dataset.fontWeight = theme.fontWeight || 'bold';
    const meta = document.getElementById('campo-theme-color');
    if (meta) meta.content = accent;
  }

  function applyIdentity(main = {}) {
    currentMain = main;
    const name = main.teamName?.trim() || 'Mi equipo';
    const crest = main.clubCrest || './icons/escudo.png';
    const nameNode = document.getElementById('campo-team-name');
    const crestNode = document.getElementById('campo-club-crest');
    if (nameNode) nameNode.textContent = name;
    if (crestNode) {
      crestNode.src = crest;
      crestNode.alt = `Escudo de ${name}`;
    }
    document.title = `${name} · Modo Campo`;
    applyTheme(main);
  }

  function normalizeVisibleCopy() {
    const sync = document.getElementById('sync');
    if (sync && /Supabase|jugadores|sesiones|partidos|asistencias/i.test(sync.textContent || '')) sync.textContent = 'Actualizado';
    document.querySelectorAll('.source-proof').forEach((node) => node.remove());
    document.querySelectorAll('.hero p').forEach((node) => {
      if (/Prueba independiente|Supabase/i.test(node.textContent || '')) node.textContent = 'Consulta rápida de entrenos y partidos.';
    });
  }

  function scheduleLightRefresh() {
    const delays = [0, 120, 350, 800, 1600, 3000];
    delays.forEach((delay) => window.setTimeout(normalizeVisibleCopy, delay));
  }

  async function loadCatalog() {
    if (!catalogPromise) {
      catalogPromise = fetch('./library-v2/data/catalog.json', { cache:'force-cache' })
        .then((response) => {
          if (!response.ok) throw new Error('No se pudo cargar el catálogo de ejercicios.');
          return response.json();
        })
        .then((items) => new Map((Array.isArray(items) ? items : []).map((item) => [String(item.id), item])))
        .catch((error) => {
          catalogPromise = null;
          throw error;
        });
    }
    return catalogPromise;
  }

  function textFromStep(value) {
    if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
    if (!value || typeof value !== 'object') return '';
    return String(value.texto ?? value.text ?? value.descripcion ?? value.description ?? value.paso ?? value.instruccion ?? '').trim();
  }

  function exerciseSteps(exercise = {}) {
    const raw = exercise.como_se_hace ?? exercise.como_hacerlo ?? exercise.pasos ?? exercise.ejecucion ?? [];
    if (Array.isArray(raw)) return raw.map(textFromStep).filter(Boolean);
    if (typeof raw === 'string') return raw.split(/\n+/).map((item) => item.trim()).filter(Boolean);
    if (raw && typeof raw === 'object') return Object.values(raw).map(textFromStep).filter(Boolean);
    return [];
  }

  function exerciseTitle(exercise, fallbackId = '') {
    return exercise?.nombre || exercise?.name || exercise?.titulo || (fallbackId ? `Ejercicio ${fallbackId}` : 'Ejercicio');
  }

  function exerciseQuickMeta(exercise = {}) {
    const quick = exercise.datos_rapidos || exercise.datosRapidos || {};
    return [
      quick.jugadores ? `👥 ${quick.jugadores}` : null,
      quick.espacio ? `📐 ${quick.espacio}` : null,
      quick.material ? `📦 ${quick.material}` : null,
    ].filter(Boolean);
  }

  function exerciseMedia(exercise = {}) {
    return { preview: exercise.media?.preview || exercise.preview || '', video: exercise.media?.video || exercise.video || '' };
  }

  function objectiveText(exercise = {}) {
    const direct = exercise.objetivo_principal || exercise.objetivo || '';
    if (direct) return typeof direct === 'string' ? direct : textFromStep(direct);
    const work = exercise.que_se_trabaja;
    if (Array.isArray(work)) return textFromStep(work[0]);
    return textFromStep(work);
  }

  function showOverlayLoading(session) {
    const overlay = document.getElementById('overlay');
    const body = document.getElementById('overlay-body');
    if (!overlay || !body) return;
    body.innerHTML = `<p class="kicker">${esc(session.name || 'Entrenamiento')}</p><h2 class="field-title">Cargando ejercicio…</h2><div class="card"><p>Preparando la ficha para usarla en el campo.</p></div>`;
    overlay.classList.remove('hidden');
    window.scrollTo({ top:0, behavior:'auto' });
  }

  function renderExercise(session, blocks, catalog, index) {
    const overlay = document.getElementById('overlay');
    const body = document.getElementById('overlay-body');
    if (!overlay || !body) return;
    const safeIndex = Math.max(0, Math.min(index, Math.max(0, blocks.length - 1)));
    activeSession = { session, blocks, catalog, index:safeIndex };
    const block = blocks[safeIndex];
    if (!block) {
      body.innerHTML = `<p class="kicker">${esc(session.name || 'Entrenamiento')}</p><h2 class="field-title">Sesión sin ejercicios</h2><button class="btn primary" data-attendance-session="${esc(session.id)}">👥 Asistencia</button>`;
      overlay.classList.remove('hidden');
      return;
    }

    const exercise = catalog.get(String(block.exerciseId)) || null;
    const title = exerciseTitle(exercise, block.exerciseId);
    const media = exerciseMedia(exercise || {});
    const steps = exerciseSteps(exercise || {});
    const quick = exerciseQuickMeta(exercise || {});
    const objective = objectiveText(exercise || {});
    const mediaMarkup = media.video
      ? `<video class="campo-exercise-video" controls playsinline preload="metadata" ${media.preview ? `poster="${esc(media.preview)}"` : ''}><source src="${esc(media.video)}" type="video/mp4"></video>`
      : media.preview ? `<img class="campo-exercise-preview" src="${esc(media.preview)}" alt="Vista del ejercicio ${esc(title)}">` : '';

    body.innerHTML = `
      <div class="campo-exercise-progress"><strong>Ejercicio ${safeIndex + 1} de ${blocks.length}</strong><span>${Math.round(((safeIndex + 1) / blocks.length) * 100)}%</span></div>
      <div class="campo-progress-track"><i style="width:${((safeIndex + 1) / blocks.length) * 100}%"></i></div>
      <p class="kicker">${esc(session.name || 'Entrenamiento')}</p>
      <h2 class="field-title">${esc(title)}</h2>
      <div class="meta"><span class="pill">⏱ ${Number(block.duration) || '—'} min</span>${block.type ? `<span class="pill">${esc(block.type)}</span>` : ''}${quick.map((item) => `<span class="pill">${esc(item)}</span>`).join('')}</div>
      ${mediaMarkup}
      ${objective ? `<div class="card campo-exercise-objective"><h3>Objetivo</h3><p>${esc(objective)}</p></div>` : ''}
      <div class="card campo-exercise-steps"><h3>Cómo hacerlo</h3>${steps.length ? `<ol>${steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>` : '<p>Este ejercicio no tiene pasos estructurados en el catálogo.</p>'}</div>
      ${block.notes ? `<div class="card"><h3>Consigna de esta sesión</h3><p class="big-copy">${esc(block.notes)}</p></div>` : ''}
      <div class="campo-exercise-nav">
        <button class="btn secondary" data-campo-field-prev ${safeIndex === 0 ? 'disabled' : ''}>← Anterior</button>
        <button class="btn primary" data-attendance-session="${esc(session.id)}">👥 Asistencia</button>
        <button class="btn secondary" data-campo-field-next ${safeIndex >= blocks.length - 1 ? 'disabled' : ''}>Siguiente →</button>
      </div>`;
    overlay.classList.remove('hidden');
    window.scrollTo({ top:0, behavior:'auto' });
  }

  async function openSessionOneByOne(sessionId) {
    const session = sessions.get(String(sessionId));
    if (!session) return;
    const blocks = Array.isArray(session.blocks) ? session.blocks : [];
    showOverlayLoading(session);
    try {
      const catalog = await loadCatalog();
      renderExercise(session, blocks, catalog, 0);
    } catch (error) {
      const body = document.getElementById('overlay-body');
      if (body) body.innerHTML = `<p class="kicker">${esc(session.name || 'Entrenamiento')}</p><h2 class="field-title">No se pudo cargar la ficha</h2><div class="card"><p>${esc(error?.message || error)}</p></div><button class="btn primary" data-attendance-session="${esc(session.id)}">👥 Asistencia</button>`;
    }
  }

  function handleSessionNavigation(event) {
    const start = event.target.closest('[data-start-session]');
    if (start) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openSessionOneByOne(start.dataset.startSession).catch(console.warn);
      return;
    }
    const previous = event.target.closest('[data-campo-field-prev]');
    if (previous && activeSession) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderExercise(activeSession.session, activeSession.blocks, activeSession.catalog, activeSession.index - 1);
      return;
    }
    const next = event.target.closest('[data-campo-field-next]');
    if (next && activeSession) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderExercise(activeSession.session, activeSession.blocks, activeSession.catalog, activeSession.index + 1);
    }
  }

  async function readSettings() {
    if (!client) return;
    const { data, error } = await client.from('configuracion').select('id,payload,deleted_at').is('deleted_at', null);
    if (error) throw error;
    const payloads = (data || []).map((row) => row.payload).filter(Boolean);
    const main = payloads.find((item) => item.id === 'main') || {};
    sessions = new Map(payloads.filter((item) => item.recordType === 'trainingSession').map((item) => [String(item.id), item]));
    applyIdentity(main);
    scheduleLightRefresh();
  }

  async function init() {
    applyTheme({ theme:{} });
    if (!globalThis.supabase?.createClient) return;
    client = globalThis.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
    await readSettings().catch((error) => console.warn('No se pudo aplicar la identidad de Modo Campo:', error));
    scheduleLightRefresh();
  }

  document.addEventListener('click', handleSessionNavigation, true);
  window.addEventListener('storage', (event) => {
    if (event.key === 'campobase.theme') applyTheme(currentMain);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') readSettings().catch(() => applyTheme(currentMain));
  });
  window.addEventListener('pageshow', () => readSettings().catch(() => applyTheme(currentMain)));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();