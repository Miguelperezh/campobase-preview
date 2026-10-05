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

// The panel uses named controls rather than a generic button selector.
export function configurableElements(root) {
  if (!root?.id) return [];
  const options = [];
  const selectorFor = (element) => {
    const parts = [];
    for (let node = element; node && node !== root; node = node.parentElement) {
      if (node.id) { parts.unshift('#' + CSS.escape(node.id)); break; }
      const record = [...node.attributes].find((attribute) => /^data-.*id$/.test(attribute.name) && attribute.value);
      if (record) {
        const actionClasses = [...node.classList].filter((name) => !/^(active|selected|is-)/.test(name));
        parts.unshift(node.tagName.toLowerCase() + actionClasses.map((name) => '.' + CSS.escape(name)).join('') + '[' + record.name + '="' + CSS.escape(record.value) + '"]'); break; }
      const siblings = [...node.parentElement.children].filter((child) => child.tagName === node.tagName);
      parts.unshift(node.tagName.toLowerCase() + ':nth-of-type(' + (siblings.indexOf(node) + 1) + ')');
    }
    return '#' + CSS.escape(root.id) + ' ' + parts.join(' > ');
  };
  const named = (element) => (element.getAttribute('aria-label') || element.getAttribute('placeholder') || element.title || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90);
  const groups = [
    ['Botones y acciones', 'button,summary,a[href]'],
    ['Títulos y textos', 'h1,h2,h3,h4,h5,h6,p,label,legend,th,td,li,small,strong,b,span,dt,dd,time,div'],
    ['Campos y selectores', 'input:not([type="hidden"]),select,textarea,progress,meter'],
    ['Iconos y gráficos', 'svg,path,circle,rect,line,polyline,polygon'],
    ['Fondos, tarjetas y recuadros', 'header,footer,article,section,details,fieldset,div'],
  ];
  const seen = new Set();
  for (const [group, query] of groups) for (const element of root.querySelectorAll(query)) {
    if (seen.has(element) || element.closest('#cbx-quick-color-dialog') || element.matches('.cbx-context-gear-btn')) continue;
    if (element.closest('svg') && group !== 'Iconos y gráficos') continue;
    if (group === 'Títulos y textos' && element.children.length && !element.matches('h1,h2,h3,h4,h5,h6,label,legend,th,td,li,p')) continue;
    let context = element.parentElement;
    while (context && context !== root && !context.matches('article,section,fieldset,details,.card,.cbx-banner') && !/card|panel|hero/.test(context.className || '')) context = context.parentElement;
    context ||= root;
    const heading = context.querySelector('h1,h2,h3,h4,legend,summary');
    const name = named(element) || (element.labels?.[0] && named(element.labels[0])) || named(heading || context);
    if (group === 'Fondos, tarjetas y recuadros' && !element.matches('header,footer,article,section,details,fieldset') && !/(card|panel|banner|hero|badge|pill|row|bar|grid|pitch|board|track)/.test(element.className || '')) continue;
    if (!name && group !== 'Iconos y gráficos') continue;
    seen.add(element);
    const index = options.filter((option) => option.group === group && option.label === name).length + 1;
    options.push({ selector: selectorFor(element), group, label: name || 'Gráfico', context: heading ? named(heading) : '', tag: element.tagName.toLowerCase(), index });
  }
  options.push({ selector: '#' + CSS.escape(root.id), group: 'Fondos, tarjetas y recuadros', label: 'Fondo de la pantalla o ventana', context: '', tag: root.tagName.toLowerCase(), index: 1 });
  return options;
}

export function colorControlDescription(prop, label, screen) {
  const descriptions = {
    bannerBg: 'Fondo de la cabecera superior de esta pantalla.', bannerInk: 'Título y texto de esa cabecera.',
    seasonGoalsForColor: 'Color de las barras de goles a favor; conserva sus alturas y datos.',
    seasonGoalsAgainstColor: 'Color de las barras de goles en contra; independiente de goles a favor.',
    btnBg: 'Fondo de los botones de acción principal de esta pantalla.', btnInk: 'Texto e iconos de esos botones principales.',
    btn2Bg: 'Fondo de los botones secundarios de esta pantalla.', btn2Ink: 'Texto e iconos de esos botones secundarios.',
    fontColor: 'Texto descriptivo, notas y párrafos de esta pantalla.', cardTitle: 'Nombres y títulos de las tarjetas de esta pantalla.',
    cardBg: 'Superficie de las tarjetas y paneles de esta pantalla.', cardBorder: 'Línea que rodea las tarjetas y paneles.',
    dorsalBg: 'Fondo del distintivo donde aparece el dorsal.', dorsalInk: 'Número dentro del distintivo del dorsal.',
    accentColor: 'Color de acento usado por los elementos que heredan el tema de esta pantalla.',
    badgeBg: 'Fondo de las etiquetas informativas de las fichas.', badgeInk: 'Texto de esas etiquetas informativas.',
    callupHeaderBg: 'Fondo de la tarjeta del rival, donde aparece su nombre; independiente de + Convocatoria.',
    callupHeaderInk: 'Nombre del rival y datos de la cabecera de su tarjeta.',
    callupBadgeBg: 'Fondo del contador de jugadores convocados.', callupBadgeInk: 'Número y texto del contador de convocados.',
    callupOutBg: 'Fondo del contador de jugadores fuera de la convocatoria.', callupOutInk: 'Número y palabra «fuera» de ese contador.',
    callupBtnBg: 'Fondo del botón + Convocatoria, sin cambiar la tarjeta del rival.', callupBtnInk: 'Texto e icono de + Convocatoria.',
    planModeTrack: 'Fondo del recuadro que contiene Escalonado y Por partes.',
    planModeBg: 'Fondo de Escalonado o Por partes cuando esa opción no está seleccionada.',
    planModeInk: 'Texto de la opción del plan que no está seleccionada.',
    planModeActiveBg: 'Fondo de la opción seleccionada del plan.', planModeActiveInk: 'Texto de la opción seleccionada del plan.',
    closeBg: 'Fondo del botón Cerrar ejercicio.', closeInk: 'Texto e icono de Cerrar ejercicio.',
    sidebarBg: 'Fondo del menú lateral de escritorio. Se comparte entre pantallas.', sidebarInk: 'Texto de las opciones del menú lateral; independiente de la barra inferior.',
    bottomNavBg: 'Fondo de la barra inferior del móvil. Se comparte entre pantallas.', bottomNavInk: 'Texto e iconos de las pestañas inferiores sin seleccionar.',
    bottomNavActive: 'Texto, icono e indicador de la pestaña inferior seleccionada.',
    subNavBg: 'Fondo de las subpestañas sin seleccionar.', subNavInk: 'Texto de las subpestañas sin seleccionar.',
    subNavActiveBg: 'Fondo de la subpestaña seleccionada.', subNavActiveInk: 'Texto de la subpestaña seleccionada.',
    tbPitch: 'Césped de la pizarra táctica.', tbLines: 'Líneas que delimitan el campo de la pizarra.',
    tbTeam: 'Fichas de los jugadores de tu equipo en la pizarra.', tbRival: 'Fichas del equipo rival en la pizarra.', tbArrow: 'Flechas de movimiento dibujadas en la pizarra.',
  };
  if (descriptions[prop]) return descriptions[prop];
  const objects = {wa: 'botón WhatsApp', whistle: 'botón Silbato', print: 'botón Imprimir', edit: 'botón Editar', completed: 'botón Realizado sin marcar', completedActive: 'botón Realizado cuando está marcado', prepHeader: 'cabecera de la tarjeta del partido', todayMatch: 'tarjeta del partido en Hoy', callout: 'recuadro informativo', gf: 'marcador de goles de tu equipo', ga: 'marcador de goles del rival', spLead: 'distintivo del primer lanzador', spSub: 'distintivo del segundo lanzador'};
  const base = prop.replace(/(Bg|Ink)$/, '');
  if (objects[base]) return (prop.endsWith('Bg') ? 'Fondo del ' : 'Texto y números del ') + objects[base] + '.';
  return 'Cambia «' + label + '» en ' + screen + '.';
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
  const today = document.getElementById('hoy');
  paint(today, '.cbx-season-goals-for', '--season-goals-for');
  paint(today, '.cbx-season-goals-against', '--season-goals-against');
  const tactics = document.getElementById('tacticas');
  paint(tactics, '.cbx-tactics-hero', '--bn');
  paint(tactics, '.cbx-tactics-hero-text', null, '--bnInk');
  const specialists = document.getElementById('plantilla-specialists-bar');
  paint(specialists, '[data-specialist-kind="launcher"] [data-specialist-rank="1"] .specialist-rank', '--sp-lead-bg', '--sp-lead-ink');
  paint(specialists, '[data-specialist-kind="launcher"] [data-specialist-rank="2"] .specialist-rank', '--sp-sub-bg', '--sp-sub-ink');
  for (const rank of [1, 2, 3]) paint(specialists, '[data-specialist-kind="captain"] [data-specialist-rank="' + rank + '"] .specialist-rank', '--captain-' + rank + '-bg', '--captain-' + rank + '-ink');
  const callups = document.getElementById('convocatorias');
  paint(callups, '.edit-callup,.callup-open-prep', '--btn2', '--btn2Ink');
  paint(callups, '.cbx-callup-card,.cbx-callup-side .panel,.cbx-callup-metrics > div,.cbx-plan-change,.cbx-callup-player:not(.is-out)', '--cardBg');
  paint(callups, '.cbx-callup-status.is-called', '--callup-status-bg', '--callup-status-ink');
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
          originalColours.set(element, ['background', 'color', 'border-color', 'fill', 'stroke', 'accent-color'].map((prop) => [prop, element.style.getPropertyValue(prop), element.style.getPropertyPriority(prop)]));
          element.dataset.themeOverride = '1';
          if (element === button && colours.bg) element.style.setProperty('background', colours.bg, 'important');
          if (colours.ink) element.style.setProperty('color', colours.ink, 'important');
        }
      });
    }
    for (const [selector, colours] of Object.entries(settings.elementColors || {})) {
      if (!/^#[\w-]+(?: |$)/.test(selector)) continue;
      let matches;
      try { matches = document.querySelectorAll(selector); } catch { continue; }
      matches.forEach((element) => {
        if (!element.hasAttribute('data-theme-override')) originalColours.set(element, ['background', 'color', 'border-color', 'fill', 'stroke', 'accent-color'].map((prop) => [prop, element.style.getPropertyValue(prop), element.style.getPropertyPriority(prop)]));
        element.dataset.themeOverride = '1';
        for (const [prop, value] of Object.entries(colours)) if (['background', 'color', 'border-color', 'fill', 'stroke', 'accent-color'].includes(prop) && /^#[0-9a-f]{6}$/i.test(value)) element.style.setProperty(prop, value, 'important');
        if (element.matches('button,a,summary') && /^#[0-9a-f]{6}$/i.test(colours.color || '')) element.querySelectorAll('span,strong,small,b,svg').forEach((child) => {
          if (!child.hasAttribute('data-theme-override')) originalColours.set(child, ['background', 'color', 'border-color', 'fill', 'stroke', 'accent-color'].map((prop) => [prop, child.style.getPropertyValue(prop), child.style.getPropertyPriority(prop)]));
          child.dataset.themeOverride = '1';
          child.style.setProperty('color', colours.color, 'important');
        });

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
