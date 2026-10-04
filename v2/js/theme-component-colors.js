// Component choices take precedence over the legacy blanket button rules.
let currentTheme = {};
const originalColours = new WeakMap();

export function configurableButtons(root) {
  const options = new Map();
  root?.querySelectorAll('button').forEach((button) => {
    const text = button.textContent.trim().replace(/\s+/g, ' ');
    const label = text.length > 2 ? text : button.getAttribute('aria-label') || button.title || text;
    const classes = [...button.classList].filter((name) => !/^(active|selected|is-)/.test(name));
    const action = ['data-wa-type', 'data-view', 'data-dialog', 'data-callup-plan-mode'].find((name) => button.hasAttribute(name));
    let local = button.id ? `#${CSS.escape(button.id)}` : `button${classes.map((name) => `.${CSS.escape(name)}`).join('')}`;
    if (!button.id && action) local += `[${action}="${CSS.escape(button.getAttribute(action))}"]`;
    if (local === 'button') {
      button.dataset.themeButtonKey = label;
      local += `[data-theme-button-key="${CSS.escape(label)}"]`;
    }
    const selector = `#${CSS.escape(root.id)} ${local}`;
    if (label && !options.has(selector)) options.set(selector, { selector, label });
  });
  return [...options.values()];
}

export function applyComponentColors(theme) {
  if (theme) currentTheme = theme;
  document.querySelectorAll('dialog[data-theme-view]').forEach((dialog) => {
    const source = document.getElementById(dialog.dataset.themeView);
    if (source) [...source.style].filter((prop) => prop.startsWith('--'))
      .forEach((prop) => dialog.style.setProperty(prop, source.style.getPropertyValue(prop)));
  });
  document.querySelectorAll('[data-theme-override]').forEach((element) => {
    const previous = originalColours.get(element);
    if (previous) for (const [prop, value, priority] of previous) {
      if (value) element.style.setProperty(prop, value, priority);
      else element.style.removeProperty(prop);
    }
    element.removeAttribute('data-theme-override');
  });
  const paint = (root, selector, bg, ink) => {
    root?.querySelectorAll(selector).forEach((element) => {
      if (bg) element.style.setProperty('background', `var(${bg})`, 'important');
      if (ink) {
        element.style.setProperty('color', `var(${ink})`, 'important');
        element.querySelectorAll('span,strong,small,b,svg,h1,h2,h3,h4,p').forEach((child) => child.style.setProperty('color', `var(${ink})`, 'important'));
      }
    });
  };
  const callups = document.getElementById('convocatorias');
  paint(callups, '.cbx-callup-card > header', '--callup-header-bg', '--callup-header-ink');
  paint(callups, '#new-callup', '--callup-btn-bg', '--callup-btn-ink');
  paint(callups, '.cbx-callup-badge-in', '--callup-badge-bg', '--callup-badge-ink');
  paint(callups, '.cbx-callup-badge-out', '--callup-out-bg', '--callup-out-ink');
  paint(callups, '.cbx-plan-mode-track', '--plan-mode-track');
  paint(callups, '.cbx-plan-mode-btn[aria-pressed="false"]', '--plan-mode-bg', '--plan-mode-ink');
  paint(callups, '.cbx-plan-mode-btn[aria-pressed="true"]', '--plan-mode-active-bg', '--plan-mode-active-ink');
  const sessions = document.getElementById('sesiones');
  for (const [selector, bg, ink] of [
    ['.cbx-btn-whistle', '--whistle-bg', '--whistle-ink'],
    ['.print-session', '--print-bg', '--print-ink'],
    ['.edit-session', '--edit-bg', '--edit-ink'],
    ['.cbx-btn-wa', '--wa-bg', '--wa-ink'],
    ['.cbx-btn-completed:not(.is-completed)', '--completed-bg', '--completed-ink'],
    ['.cbx-btn-completed.is-completed', '--completed-active-bg', '--completed-active-ink'],
  ]) paint(sessions, selector, bg, ink);
  for (const id of ['ejercicios', 'sesiones']) {
    const root = document.getElementById(id);
    paint(root, '.sp-title,.exercise-card h3,.exercise-card h4', null, '--cardTitle');
    paint(root, '.sp-body .meta,.sp-players-badge,.exercise-card p,.exercise-card small,.card-meta-facts,.cbx-session-meta,.cbx-session-block-phase', null, '--view-font-color');
    paint(root, '.sp-actions .secondary,.view-exercise.secondary', '--btn2', '--btn2Ink');
    paint(root, '.sp-actions .primary', '--btn', '--btnInk');
    if (currentTheme.views?.[id]?.badgeBg || currentTheme.views?.[id]?.badgeInk)
      paint(root, '.sp-category-tag,.exercise-card .pill,.sp-body .pill', '--badge-bg', '--badge-ink');
  }
  for (const id of ['exercise-detail-dialog', 'whatsapp-dialog']) {
    const root = document.getElementById(id);
    paint(root, '.dialog-close-prominent-btn,.modal-bottom-close-btn', '--close-bg', '--close-ink');
    paint(root, 'h2,h3,h4,.sheet-title', null, '--cardTitle');
    paint(root, 'p,label,li,td,th,.sheet-section-title,.sheet-bottom-bar,.fact-label,.fact-value,.phase-meta', null, '--view-font-color');
    paint(root, '.primary,.btn-add-session', '--btn', '--btnInk');
    paint(root, '.secondary,.btn-print-exercise,.tab-btn:not(.active)', '--btn2', '--btn2Ink');
    paint(root, '.tab-btn.active', '--btn', '--btnInk');
    paint(root, '#whatsapp-form,.dialog-head,.sheet-bottom-bar,.dialog-sticky-footer', '--cardBg', '--view-font-color');
  }
  document.querySelectorAll('dialog[data-theme-view]').forEach((dialog) => {
    paint(dialog, '.primary', '--btn', '--btnInk');
    paint(dialog, '.secondary', '--btn2', '--btn2Ink');
    paint(dialog, 'label,p', null, '--view-font-color');
  });
  const nav = document.getElementById('cb-bottom-nav');
  const sidebar = document.getElementById('cb-claude-sidebar');
  paint(sidebar, 'button,.cb-shell-brand strong', null, '--sidebar-ink');
  paint(sidebar, '.cb-shell-brand p,.cb-shell-group h2', null, '--sidebar-sub');
  paint(nav, '.cb-nav-tab:not(.active)', null, '--bottom-nav-ink');
  paint(nav, '.cb-nav-tab.active', null, '--bottom-nav-active');
  const subnav = document.getElementById('cb-sub-nav');
  paint(subnav, '.cb-sub-pill:not(.active)', '--sub-nav-bg', '--sub-nav-ink');
  paint(subnav, '.cb-sub-pill.active', '--sub-nav-active-bg', '--sub-nav-active-ink');
  for (const settings of Object.values(currentTheme.views || {})) {
    for (const [selector, colours] of Object.entries(settings.buttonColors || {})) {
      // Only selectors generated for an application container are accepted.
      if (!/^#[\w-]+ (button|#)/.test(selector)) continue;
      let matches;
      try { matches = document.querySelectorAll(selector); } catch { continue; }
      matches.forEach((button) => {
        for (const element of [button, ...button.querySelectorAll('span,strong,small,b,svg')]) {
          originalColours.set(element, ['background', 'color'].map((prop) => [prop, element.style.getPropertyValue(prop), element.style.getPropertyPriority(prop)]));
          element.dataset.themeOverride = '1';
          if (element === button && colours.bg) element.style.setProperty('background', colours.bg, 'important');
          if (colours.ink) element.style.setProperty('color', colours.ink, 'important');
        }
      });
    }
  }
}

export function observeComponentColors() {
  let scheduled = false;
  const update = () => {
    scheduled = false;
    document.querySelectorAll('.view').forEach((view) => {
      const liveHead = view.id === 'partido' ? view.querySelector('.cbx-live-hero-head') : null;
      const existing = view.querySelector('.cbx-context-gear-btn');
      if (existing) {
        if (liveHead && !liveHead.contains(existing)) liveHead.append(existing);
        else if (view.classList.contains('active') && !existing.getClientRects().length) {
          const visibleHeader = [...view.querySelectorAll('.today-hero,.section-head,.cbx-banner')].find((element) => element.getClientRects().length);
          (visibleHeader || view).append(existing);
        }
        return;
      }
      const target = liveHead || view.querySelector('.section-head') || view;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'cbx-context-gear-btn';
      button.dataset.gearTarget = view.id; button.textContent = '⚙️';
      button.setAttribute('aria-label', 'Ajustar colores de esta pestaña');
      target.append(button);
    });
    for (const [id, key] of [['exercise-detail-dialog', 'exercise-detail'], ['whatsapp-dialog', 'comunicador']]) {
      const root = document.getElementById(id);
      if (!root) continue;
      const existing = root.querySelector('.cbx-context-gear-btn');
      const target = root.querySelector('.sheet-head') || root.querySelector('.dialog-head') || root;
      if (existing) {
        if (root.open && !existing.getClientRects().length) target.append(existing);
        continue;
      }
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'cbx-context-gear-btn';
      button.dataset.gearTarget = key; button.textContent = '⚙️';
      button.setAttribute('aria-label', 'Ajustar colores de esta ventana');
      target.append(button);
    }
    document.querySelectorAll('dialog[open]:not(#auth-dialog):not(#cbx-quick-color-dialog):not(#exercise-detail-dialog):not(#whatsapp-dialog)').forEach((dialog) => {
      dialog.dataset.themeView ||= document.querySelector('.view.active')?.id || 'ajustes';
      if (dialog.querySelector('.cbx-context-gear-btn')) return;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'cbx-context-gear-btn';
      button.dataset.gearTarget = dialog.dataset.themeView; button.textContent = '⚙️';
      button.setAttribute('aria-label', 'Ajustar colores de esta ventana');
      (dialog.querySelector('.dialog-head') || dialog).append(button);
    });
    applyComponentColors();
  };
  new MutationObserver(() => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
  update();
}
