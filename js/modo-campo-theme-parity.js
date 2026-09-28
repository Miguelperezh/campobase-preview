(() => {
  'use strict';

  const root = document.documentElement;

  function computedVar(name, fallback = '') {
    const value = getComputedStyle(root).getPropertyValue(name).trim();
    return value || fallback;
  }

  function setBoth(name, value) {
    if (!value || !document.body) return;
    root.style.setProperty(name, value);
    document.body.style.setProperty(name, value);
  }

  function mirrorDataAttribute(fieldName, normalName, defaultValue) {
    if (!document.body) return;
    const value = root.dataset[fieldName] || defaultValue;
    if (!value || value === defaultValue) {
      root.removeAttribute(normalName);
      document.body.removeAttribute(normalName);
      return;
    }
    root.setAttribute(normalName, value);
    document.body.setAttribute(normalName, value);
  }

  function syncThemeParity() {
    if (!document.body) return;

    const bg = computedVar('--field-bg', '#071711');
    const card = computedVar('--field-card', '#0e261d');
    const nav = computedVar('--field-nav', 'rgba(10,31,23,.96)');
    const input = computedVar('--field-input', '#091c15');
    const text = computedVar('--field-text', '#f8fafc');
    const border = computedVar('--field-border', '#1b4d3a');
    const accent = computedVar('--field-accent', '#10b981');
    const accentText = computedVar('--field-accent-text', '#ffffff');
    const family = computedVar('--field-font-family');

    // Las mismas variables de superficie que usa CampoBase normal.
    setBoth('--cb-surface-bg', bg);
    setBoth('--cb-surface-card', card);
    setBoth('--cb-surface-nav', nav);
    setBoth('--cb-surface-input', input);
    setBoth('--cb-slate-900', text);
    setBoth('--cb-slate-200', border);
    setBoth('--paper', bg);
    setBoth('--card', card);
    setBoth('--ink', text);
    setBoth('--line', border);

    // El mismo color de acento efectivo que usa CampoBase normal.
    setBoth('--accent', accent);
    setBoth('--cb-accent', accent);
    setBoth('--cb-accent-text', accentText);
    setBoth('--cb-pitch-600', accent);
    setBoth('--cb-pitch-700', accent);
    setBoth('--cb-brand', accent);

    // Modo Campo hereda también en body exactamente los valores ya resueltos.
    setBoth('--field-bg', bg);
    setBoth('--field-card', card);
    setBoth('--field-nav', nav);
    setBoth('--field-input', input);
    setBoth('--field-text', text);
    setBoth('--field-border', border);
    setBoth('--field-accent', accent);
    setBoth('--field-accent-text', accentText);
    if (family) setBoth('--cb-font-family', family);

    document.body.style.color = text;

    // CampoBase normal coloca estos atributos tanto en html como en body.
    mirrorDataAttribute('themeBg', 'data-theme-bg', 'default');
    mirrorDataAttribute('themeFamily', 'data-theme-family', 'system');
    mirrorDataAttribute('fontScale', 'data-font-scale', 'normal');
    mirrorDataAttribute('fontWeight', 'data-font-weight', 'normal');
  }

  function scheduleSync() {
    [0, 60, 180, 450, 1000, 2200].forEach((delay) => window.setTimeout(syncThemeParity, delay));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleSync, { once:true });
  else scheduleSync();

  window.addEventListener('pageshow', scheduleSync);
  window.addEventListener('storage', (event) => {
    if (event.key === 'campobase.theme') scheduleSync();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleSync();
  });
})();