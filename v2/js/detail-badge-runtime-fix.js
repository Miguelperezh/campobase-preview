import { getOne, put } from './db.js';

// Personalización segura de cajas de acción rellenas y distintivos.
// IMPORTANTE: solo se usan selectores semánticos explícitos. Nunca se recorren
// botones, campos o estados activos para decidir por su color visual.

const STORAGE_KEY = 'campobase.detailBadgeStyle';
const PANEL_ID = 'detail-badge-settings-panel';
const FORM_ID = 'detail-badge-settings-form';
const STYLE_ID = 'cb-filled-box-user-style-v2';
const OWNED_ATTR = 'data-cb-filled-box-owned';
const LEGACY_BOX_CLASS = 'cb-user-boxed-surface';
const LEGACY_STYLE_ID = 'cb-user-boxed-surface-style';

// Ámbito deliberadamente cerrado: botones principales de marca + distintivos.
// La navegación, botones secundarios, inputs/selects, estados activos y avisos
// quedan fuera y siguen usando sus estilos propios.
const ACTION_SELECTOR = '.primary';
const BADGE_SELECTOR = '#active-format.format-badge, .plantilla-staff-role-badge, .staff-badge';
const TARGET_SELECTOR = `${ACTION_SELECTOR}, ${BADGE_SELECTOR}`;
const TEXT_CHILD_SELECTOR = ':scope > span, :scope > strong, :scope > b, :scope > small, :scope > em';
const OWNED_STYLE_PROPS = [
  'background-color',
  'color',
  '-webkit-text-fill-color',
  'font-family',
  'font-weight',
  'font-size',
];

const SIZE_OPTIONS = new Set(['compact', 'normal', 'large', 'xlarge', 'huge', 'enormous', 'ultra']);
const WEIGHT_OPTIONS = new Set(['normal', 'semibold', 'bold', 'extrabold', 'ultra-bold']);

const SIZE_MAP = {
  compact: { action: '.80rem', badge: '.62rem' },
  normal: { action: '.90rem', badge: '.72rem' },
  large: { action: '1rem', badge: '.80rem' },
  xlarge: { action: '1.10rem', badge: '.88rem' },
  huge: { action: '1.20rem', badge: '.96rem' },
  enormous: { action: '1.30rem', badge: '1.04rem' },
  ultra: { action: '1.40rem', badge: '1.12rem' },
};

const WEIGHT_MAP = {
  normal: '400',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  'ultra-bold': '900',
};

let activeSettings = null;
let observer = null;
let enhanceQueued = false;

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function validHex(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback;
}

function normalizeSettings(value) {
  if (!value || typeof value !== 'object') return null;
  const legacyWeight = value.bold === false ? 'normal' : 'extrabold';
  const weight = WEIGHT_OPTIONS.has(value.weight) ? value.weight : legacyWeight;
  const size = SIZE_OPTIONS.has(value.size) ? value.size : 'normal';
  return {
    background: validHex(value.background, '#c8102e'),
    text: validHex(value.text, '#000000'),
    font: value.font === 'inter' ? 'inter' : 'barlow',
    size,
    weight,
    // Compatibilidad con el código anterior mientras siga cargado en la PWA.
    bold: ['bold', 'extrabold', 'ultra-bold'].includes(weight),
    updatedAt: Number(value.updatedAt) || 0,
  };
}

function readLocalSettings() {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
  } catch {
    return null;
  }
}

function writeLocalSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

function fontFamily(font) {
  return font === 'inter'
    ? 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    : '"Barlow Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
}

function cleanupLegacyGlobalBoxStyles() {
  document.getElementById(LEGACY_STYLE_ID)?.remove();
  document.querySelectorAll(`.${LEGACY_BOX_CLASS}`).forEach((element) => {
    element.classList.remove(LEGACY_BOX_CLASS);
    OWNED_STYLE_PROPS.forEach((prop) => element.style.removeProperty(prop));
  });
}

function installStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${PANEL_ID} .cb-detail-badge-fields {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .75rem;
    }
    #${PANEL_ID} .cb-box-typography-field {
      min-width: 0;
    }
    #${PANEL_ID} .cb-detail-badge-preview {
      color: var(--cb-detail-badge-text, #000000) !important;
      -webkit-text-fill-color: var(--cb-detail-badge-text, #000000) !important;
    }
    @media (max-width: 650px) {
      #${PANEL_ID} .cb-detail-badge-fields { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
}

function clearOwnedStyles(element) {
  if (!element) return;
  OWNED_STYLE_PROPS.forEach((prop) => element.style.removeProperty(prop));
  element.removeAttribute(OWNED_ATTR);
  element.querySelectorAll(`[${OWNED_ATTR}="child"]`).forEach((child) => {
    ['color', '-webkit-text-fill-color', 'font-family', 'font-weight'].forEach((prop) => child.style.removeProperty(prop));
    child.removeAttribute(OWNED_ATTR);
  });
}

function applyTextToChild(child, settings) {
  if (!child) return;
  child.setAttribute(OWNED_ATTR, 'child');
  child.style.setProperty('color', settings.text, 'important');
  child.style.setProperty('-webkit-text-fill-color', settings.text, 'important');
  child.style.setProperty('font-family', fontFamily(settings.font), 'important');
  child.style.setProperty('font-weight', WEIGHT_MAP[settings.weight], 'important');
}

function applyToElement(element, settings) {
  if (!element) return;
  if (!settings) {
    clearOwnedStyles(element);
    return;
  }

  const isBadge = element.matches(BADGE_SELECTOR);
  const sizes = SIZE_MAP[settings.size] || SIZE_MAP.normal;
  element.setAttribute(OWNED_ATTR, isBadge ? 'badge' : 'action');
  element.style.setProperty('background-color', settings.background, 'important');
  element.style.setProperty('color', settings.text, 'important');
  element.style.setProperty('-webkit-text-fill-color', settings.text, 'important');
  element.style.setProperty('font-family', fontFamily(settings.font), 'important');
  element.style.setProperty('font-weight', WEIGHT_MAP[settings.weight], 'important');
  element.style.setProperty('font-size', isBadge ? sizes.badge : sizes.action, 'important');

  // Solo hijos de texto directos. No se alteran iconos, navegación ni controles.
  element.querySelectorAll(TEXT_CHILD_SELECTOR).forEach((child) => applyTextToChild(child, settings));
}

function applyToRealApp(settings, root = document) {
  cleanupLegacyGlobalBoxStyles();
  installStyles();
  activeSettings = normalizeSettings(settings);

  const html = document.documentElement;
  if (!activeSettings) {
    document.querySelectorAll(`[${OWNED_ATTR}]`).forEach((element) => clearOwnedStyles(element));
    html.removeAttribute('data-cb-detail-badges');
    return;
  }

  const sizes = SIZE_MAP[activeSettings.size] || SIZE_MAP.normal;
  html.setAttribute('data-cb-detail-badges', 'custom');
  html.style.setProperty('--cb-detail-badge-bg', activeSettings.background);
  html.style.setProperty('--cb-detail-badge-text', activeSettings.text);
  html.style.setProperty('--cb-detail-badge-font', fontFamily(activeSettings.font));
  html.style.setProperty('--cb-detail-badge-weight', WEIGHT_MAP[activeSettings.weight]);
  html.style.setProperty('--cb-detail-action-size', sizes.action);
  html.style.setProperty('--cb-detail-badge-size', sizes.badge);

  const scope = root?.querySelectorAll ? root : document;
  if (root instanceof Element && root.matches(TARGET_SELECTOR)) applyToElement(root, activeSettings);
  scope.querySelectorAll(TARGET_SELECTOR).forEach((element) => applyToElement(element, activeSettings));
}

function settingsFromForm(form) {
  if (!form) return activeSettings;
  return normalizeSettings({
    background: form.elements.background?.value,
    text: form.elements.text?.value,
    font: form.elements.font?.value,
    size: form.elements.size?.value || activeSettings?.size || 'normal',
    weight: form.elements.weight?.value || activeSettings?.weight || (form.elements.bold?.checked === false ? 'normal' : 'extrabold'),
    updatedAt: Date.now(),
  });
}

function selectMarkup(name, label, options, selected) {
  return `<label class="cb-box-typography-field">${label}
    <select name="${name}">
      ${options.map(([value, text]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${text}</option>`).join('')}
    </select>
  </label>`;
}

function updatePreview(form, settings = settingsFromForm(form)) {
  if (!form || !settings) return;
  const sizes = SIZE_MAP[settings.size] || SIZE_MAP.normal;
  form.querySelectorAll('.cb-detail-badge-preview').forEach((preview) => {
    preview.style.setProperty('background-color', settings.background, 'important');
    preview.style.setProperty('color', settings.text, 'important');
    preview.style.setProperty('-webkit-text-fill-color', settings.text, 'important');
    preview.style.setProperty('font-family', fontFamily(settings.font), 'important');
    preview.style.setProperty('font-weight', WEIGHT_MAP[settings.weight], 'important');
    preview.style.setProperty('font-size', sizes.badge, 'important');
  });
}

function hydrateForm(form, settings = activeSettings || readLocalSettings()) {
  if (!form || !settings) return;
  if (form.elements.background) form.elements.background.value = settings.background;
  if (form.elements.text) form.elements.text.value = settings.text;
  if (form.elements.font) form.elements.font.value = settings.font;
  if (form.elements.size) form.elements.size.value = settings.size;
  if (form.elements.weight) form.elements.weight.value = settings.weight;
  updatePreview(form, settings);
}

function enhanceSettingsPanel() {
  const panel = document.getElementById(PANEL_ID);
  const form = document.getElementById(FORM_ID);
  if (!panel || !form || form.dataset.cbFilledBoxV2 === '1') return false;

  form.dataset.cbFilledBoxV2 = '1';
  const current = activeSettings || readLocalSettings() || normalizeSettings({});
  const description = panel.querySelector(':scope > .meta');
  if (description) {
    description.textContent = 'Configura conjuntamente los botones principales rellenos y los distintivos de información. No modifica la navegación, los campos de formulario ni el resto de textos del tema.';
  }

  const grid = form.querySelector('.cb-detail-badge-fields');
  if (grid) {
    grid.querySelector('.cb-detail-badge-bold')?.remove();
    grid.insertAdjacentHTML('beforeend', selectMarkup('size', 'Tamaño de texto', [
      ['normal', 'Normal / Estándar (100%)'],
      ['large', 'Grande (+20% lectura cómoda)'],
      ['xlarge', 'Muy grande (+40% banquillo)'],
      ['huge', 'Gigante para sol directo (+60%)'],
      ['enormous', 'Enorme / Super legible (+80%)'],
      ['ultra', 'Ultra accesible (+100%)'],
      ['compact', 'Compacto (-10%)'],
    ], current.size));
    grid.insertAdjacentHTML('beforeend', selectMarkup('weight', 'Grosor de texto y negrita', [
      ['normal', 'Normal / Equilibrado (400)'],
      ['semibold', 'Seminegrita reforzada (600)'],
      ['bold', 'Negrita de campo (700)'],
      ['extrabold', 'Extra negrita potente (800)'],
      ['ultra-bold', 'Ultra negrita máxima (900)'],
    ], current.weight));
  }

  hydrateForm(form, current);
  return true;
}

async function persistSharedSettings(settings) {
  if (!settings) return;
  try {
    const current = await getOne('settings', 'main') || { id: 'main' };
    await put('settings', {
      ...current,
      id: 'main',
      detailBadgeStyle: settings,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.warn('No se pudo sincronizar la configuración de cajas y distintivos:', error);
  }
}

async function hydrateSharedSettings() {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    try {
      const current = await getOne('settings', 'main');
      const shared = normalizeSettings(current?.detailBadgeStyle);
      if (shared) {
        const local = readLocalSettings();
        const selected = !local || shared.updatedAt >= local.updatedAt ? shared : local;
        writeLocalSettings(selected);
        applyToRealApp(selected);
        hydrateForm(document.getElementById(FORM_ID), selected);
        return;
      }
      if (current) return;
    } catch {}
    await delay(250);
  }
}

function showSavedToast() {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = 'Colores y tipografía de cajas actualizados.';
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2600);
}

function bindSettingsForm() {
  // Captura antes del manejador antiguo inyectado por Modo Campo para que exista
  // una única fuente de verdad y no compitan dos implementaciones.
  const liveHandler = (event) => {
    const form = event.target?.closest?.(`#${FORM_ID}`);
    if (!form) return;
    event.stopPropagation();
    const settings = settingsFromForm(form);
    applyToRealApp(settings);
    // El manejador antiguo también intenta pintar la vista previa; reponemos
    // explícitamente color + text-fill al final del mismo ciclo.
    window.requestAnimationFrame(() => updatePreview(form, settings));
  };

  document.addEventListener('input', liveHandler, true);
  document.addEventListener('change', liveHandler, true);

  document.addEventListener('submit', (event) => {
    const form = event.target?.closest?.(`#${FORM_ID}`);
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const settings = settingsFromForm(form);
    writeLocalSettings(settings);
    applyToRealApp(settings);
    updatePreview(form, settings);
    persistSharedSettings(settings);
    showSavedToast();
  }, true);
}

function startObserver() {
  if (observer || !document.body) return;
  observer = new MutationObserver((mutations) => {
    let relevantRoot = null;
    let panelMayExist = false;
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (!relevantRoot && (node.matches(TARGET_SELECTOR) || node.querySelector(TARGET_SELECTOR))) relevantRoot = node;
        if (node.id === PANEL_ID || node.querySelector?.(`#${PANEL_ID}`)) panelMayExist = true;
      });
    }
    if (activeSettings && relevantRoot) applyToRealApp(activeSettings, relevantRoot);
    if (panelMayExist && !enhanceQueued) {
      enhanceQueued = true;
      window.requestAnimationFrame(() => {
        enhanceQueued = false;
        if (enhanceSettingsPanel()) {
          const settings = activeSettings || readLocalSettings();
          if (settings) applyToRealApp(settings);
        }
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function install() {
  cleanupLegacyGlobalBoxStyles();
  installStyles();
  const local = readLocalSettings();
  if (local) applyToRealApp(local);
  bindSettingsForm();
  startObserver();
  enhanceSettingsPanel();
  hydrateSharedSettings();

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    const settings = readLocalSettings();
    applyToRealApp(settings);
    hydrateForm(document.getElementById(FORM_ID), settings);
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
