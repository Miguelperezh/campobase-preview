// ==========================================================================
// CONTROLADOR DE NAVEGACIÓN Y EXPERIENCIA REDISEÑADA V1 (CampoBase)
// Gestiona la barra maestra de 5 pestañas, los submenús segmentados
// por módulo y el menú flotante al pulgar (Quick Sheet).
// Totalmente desacoplado de la lógica de negocio y datos reales.
// ==========================================================================

import { renderTodayDashboard } from './today-dashboard.js?v=claude-hoy-real-2';
import { refreshStaffView, initStaffManagement } from './staff-management.js?v=claude-correccion-1';
import './pwa-install-manager.js?v=1';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Mapeo entre las 5 pestañas maestras y sus subvistas operativas
export const MODULE_CONFIG = {
  inicio: {
    label: 'Hoy',
    icon: `<svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    defaultView: 'hoy',
    views: ['hoy'],
    subTabs: [],
  },
  equipo: {
    label: 'Equipo',
    icon: `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    defaultView: 'plantilla',
    views: ['plantilla', 'cuerpo-tecnico', 'asistencia'],
    subTabs: [
      {
        id: 'plantilla',
        label: 'Plantilla',
        desc: 'Jugadores · Minutos y datos',
        icon: `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      },
      {
        id: 'cuerpo-tecnico',
        label: 'Técnicos',
        desc: 'Entrenadores, preparadores y delegados',
        icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/></svg>`,
      },
      {
        id: 'asistencia',
        label: 'Asistencia',
        desc: 'Control de faltas en entrenamientos',
        icon: `<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
      },
    ],
  },
  partidos: {
    label: 'Partido',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="3"/></svg>`,
    defaultView: 'convocatorias',
    views: ['convocatorias', 'preparacion', 'partido', 'calendario'],
    subTabs: [
      {
        id: 'convocatorias',
        label: 'Convocatoria',
        desc: 'Reparto equitativo y bajas',
        icon: `<svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>`,
      },
      {
        id: 'preparacion',
        label: 'Preparación',
        desc: 'Titulares, suplentes y táctica',
        icon: `<svg viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><circle cx="12" cy="12" r="3"/></svg>`,
      },
      {
        id: 'partido',
        label: 'En Vivo',
        desc: 'Cronómetro y cambios en directo',
        icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      },
      {
        id: 'calendario',
        label: 'Calendario',
        desc: 'Resultados y próximas jornadas',
        icon: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      },
    ],
  },
  entrenos: {
    label: 'Entreno',
    icon: `<svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14h6"/><path d="M9 18h6"/><path d="M9 10h6"/></svg>`,
    defaultView: 'sesiones',
    views: ['sesiones', 'ejercicios', 'tacticas'],
    subTabs: [
      {
        id: 'sesiones',
        label: 'Sesiones',
        desc: 'Planificación por bloques de 60-90 min',
        icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 10"/></svg>`,
      },
      {
        id: 'ejercicios',
        label: 'Ejercicios',
        desc: 'Biblioteca de fichas tácticas',
        icon: `<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
      },
      {
        id: 'tacticas',
        label: 'Tácticas',
        desc: 'Pizarra táctica interactiva libre',
        icon: `<svg viewBox="0 0 24 24"><path d="m3 3 18 18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`,
      },
    ],
  },
  ajustes: {
    label: 'Ajustes',
    icon: `<svg viewBox="0 0 24 24"><path d="M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z"/><circle cx="12" cy="12" r="3"/></svg>`,
    defaultView: 'ajustes',
    views: ['ajustes'],
    subTabs: [],
  },
};

const SHELL_GROUPS = [
  ['Equipo', [['hoy', 'Hoy'], ['plantilla', 'Plantilla'], ['cuerpo-tecnico', 'Cuerpo técnico'], ['asistencia', 'Asistencia']]],
  ['Partido', [['convocatorias', 'Convocatoria'], ['preparacion', 'Preparación'], ['partido', 'Partido en vivo'], ['calendario', 'Calendario']]],
  ['Entrenamiento', [['sesiones', 'Sesiones'], ['ejercicios', 'Ejercicios'], ['tacticas', 'Tácticas']]],
  ['Sistema', [['ajustes', 'Ajustes']]],
];

// Presentation only: keep the existing role and permission sources authoritative.
export function isShellViewAllowed(viewId) {
  if (typeof window === 'undefined') return true;
  const app = window.__campobase;
  const role = app?.state?.role;
  if (viewId === 'ajustes' && role === 'demo') return false;
  if (document.body.classList.contains('delegate-mode')) {
    if (viewId === 'ajustes') return false;
    const permissions = app?.getDelegatePermissions?.() || app?.state?.settings?.delegatePermissions || ['partido'];
    if (viewId === 'partido' || viewId === 'delegado') return permissions.includes('partido') || permissions.includes('delegado');
    return permissions.includes(viewId);
  }
  const allowed = window.__campobaseAllowedViews;
  return !Array.isArray(allowed) || allowed.includes(viewId);
}

function renderClaudeShell() {
  if ($('#cb-claude-sidebar')) return;
  const sidebar = document.createElement('aside');
  sidebar.id = 'cb-claude-sidebar';
  sidebar.setAttribute('aria-label', 'Navegación principal');
  sidebar.innerHTML = `<div class="cb-shell-brand"><img alt="Escudo del equipo"><div><p>Gestión de equipo</p><strong></strong></div></div>
    <nav>${SHELL_GROUPS.map(([label, views]) => `<section class="cb-shell-group"><h2>${label}</h2>${views.map(([id, title]) => `<button type="button" data-target-view="${id}">${title}</button>`).join('')}</section>`).join('')}</nav>
    <div class="cb-shell-role"></div>`;
  document.body.prepend(sidebar);
  const search = document.createElement('div');
  search.className = 'cbx-global-search';
  search.innerHTML = '<input type="search" placeholder="Buscar jugador, ejercicio o partido…" aria-label="Buscar jugadores, ejercicios y partidos"><div class="cbx-search-results" hidden></div>';
  $('.topbar .status')?.before(search);
  const input = search.querySelector('input'), results = search.querySelector('div');
  input.addEventListener('input', () => {
    results.replaceChildren();
    const query = input.value.trim().toLocaleLowerCase('es');
    results.hidden = query.length < 2;
    if (results.hidden) return;
    const state = window.__campobase?.state || {};
    const groups = [['players','plantilla','Jugador'],['exercises','ejercicios','Ejercicio'],['matches','calendario','Partido']];
    for (const [key,view,label] of groups) {
      if (!isShellViewAllowed(view)) continue;
      for (const record of (state[key] || []).filter(item => String(item.name || item.opponent || '').toLocaleLowerCase('es').includes(query)).slice(0,5)) {
        const button = document.createElement('button'); button.type = 'button';
        button.textContent = `${label} · ${record.name || record.opponent}`;
        button.addEventListener('click', () => {
          triggerStandardView(view); results.hidden = true;
          if (key === 'matches') window.__campobase?.showMatchDetail?.(record.id);
          else if (key === 'exercises') window.__campobase?.showExerciseDetail?.(record.id);
          else { const filter = $('#global-search'); if (filter) { filter.value = record.name; filter.dispatchEvent(new Event('input', {bubbles:true})); } }
        }); results.append(button);
      }
    }
    if (!results.childElementCount) results.textContent = 'Sin resultados';
  });
  input.addEventListener('keydown', event => { if (event.key === 'Escape') results.hidden = true; });
  document.addEventListener('click', event => { if (!search.contains(event.target)) results.hidden = true; });

  const title = document.createElement('p');
  title.id = 'cb-shell-view-title';
  $('.topbar-brand > div')?.append(title);
  const identityObserver = new MutationObserver(syncClaudeShell);
  for (const element of [$('#topbar-team-name'), $('#topbar-club-crest'), $('#role-label')]) {
    if (element) identityObserver.observe(element, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['src'] });
  }
  new MutationObserver(syncClaudeShell).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  syncClaudeShell();
}

function syncClaudeShell() {
  const sidebar = $('#cb-claude-sidebar');
  if (!sidebar) return;
  const view = getActiveViewId();
  const current = view === 'delegado' ? 'partido' : view;
  const setText = (element, value) => { if (element && element.textContent !== value) element.textContent = value; };
  setText(sidebar.querySelector('.cb-shell-brand strong'), $('#topbar-team-name')?.textContent || 'CampoBase');
  setText(sidebar.querySelector('.cb-shell-role'), $('#role-label')?.textContent || 'CampoBase');
  const crest = $('#topbar-club-crest')?.getAttribute('src');
  if (crest && sidebar.querySelector('img').getAttribute('src') !== crest) sidebar.querySelector('img').setAttribute('src', crest);
  const title = SHELL_GROUPS.flatMap(([, views]) => views).find(([id]) => id === current)?.[1] || 'CampoBase';
  setText($('#cb-shell-view-title'), title);
  sidebar.querySelectorAll('[data-target-view]').forEach((button) => {
    button.hidden = !isShellViewAllowed(button.dataset.targetView);
    if (button.dataset.targetView === current) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  sidebar.querySelectorAll('.cb-shell-group').forEach((group) => { group.hidden = !group.querySelector('button:not([hidden])'); });
  $$('#cb-bottom-nav .cb-nav-tab').forEach((button) => {
    const config = MODULE_CONFIG[button.dataset.module];
    const allowed = config?.views.some(isShellViewAllowed);
    button.hidden = !allowed;
    if (button.classList.contains('active')) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

export function getActiveViewId() {
  const activeView = $('.view.active');
  return activeView ? activeView.id : 'plantilla';
}

export function getActiveModule(viewId) {
  if (viewId === 'delegado') return 'partidos';
  for (const [modKey, mod] of Object.entries(MODULE_CONFIG)) {
    if (mod.views.includes(viewId)) return modKey;
  }
  return 'equipo';
}

export function triggerStandardView(viewId) {
  if (!isShellViewAllowed(viewId)) return;
  if (Array.isArray(window.__campobaseAllowedViews)) {
    const allowed = window.__campobaseAllowedViews.includes(viewId)
      || (viewId === 'delegado' && window.__campobaseAllowedViews.includes('partido'))
      || (viewId === 'partido' && window.__campobaseAllowedViews.includes('delegado'));
    if (!allowed) return;
  }
  if (window.__campobase && typeof window.__campobase.showView === 'function') {
    window.__campobase.showView(viewId);
  } else {
    const button = $(`.bottom-nav button[data-view="${viewId}"]`);
    if (button) button.click();
  }

  $$('.view').forEach((v) => v.classList.toggle('active', v.id === viewId));
  $$('.bottom-nav button').forEach((b) => b.classList.toggle('active', b.dataset.view === viewId));

  if (viewId === 'hoy') {
    renderTodayDashboard().catch(console.error);
  } else if (viewId === 'plantilla') {
    if (window.__campobase && typeof window.__campobase.renderAll === 'function') {
      window.__campobase.renderAll();
    }
  } else if (viewId === 'asistencia') {
    if (window.__campobase && typeof window.__campobase.renderAll === 'function') {
      window.__campobase.renderAll();
    }
  } else if (viewId === 'convocatorias') {
    if (window.__campobase && typeof window.__campobase.renderCallups === 'function') {
      window.__campobase.renderCallups();
    }
  } else if (viewId === 'delegado') {
    if (window.__campobase && typeof window.__campobase.renderDelegate === 'function') {
      window.__campobase.renderDelegate();
    }
  } else if (viewId === 'partido') {
    if (document.body.classList.contains('delegate-mode')) {
      if (window.__campobase && typeof window.__campobase.renderDelegate === 'function') {
        window.__campobase.renderDelegate();
      }
    } else if (window.__campobase && typeof window.__campobase.renderLive === 'function') {
      window.__campobase.renderLive();
    }
  } else if (viewId === 'calendario') {
    if (window.__campobase && typeof window.__campobase.renderMatches === 'function') {
      window.__campobase.renderMatches();
    }
  } else if (viewId === 'sesiones') {
    if (window.__campobase && typeof window.__campobase.renderTrainingSessions === 'function') {
      window.__campobase.renderTrainingSessions();
    }
  } else if (viewId === 'ejercicios') {
    if (window.__campobase && typeof window.__campobase.renderExercises === 'function') {
      window.__campobase.renderExercises();
    }
  } else if (viewId === 'tacticas') {
    if (window.__campobase && typeof window.__campobase.renderTactics === 'function') {
      window.__campobase.renderTactics();
    }
  } else if (viewId === 'cuerpo-tecnico') {
    refreshStaffView().catch(console.error);
  } else if (viewId === 'preparacion') {
    if (window.__campobase && typeof window.__campobase.renderPreparaciones === 'function') {
      window.__campobase.renderPreparaciones();
    }
  }

  closeQuickSheet();
  updateNavState();
}

if (typeof window !== 'undefined') {
  window.triggerStandardView = triggerStandardView;
}

export function syncTopbarHeight() {
  if (typeof document === 'undefined') return;
  const header = $('.topbar');
  if (!header) return;
  const h = header.offsetHeight || 66;
  document.documentElement.style.setProperty('--cb-topbar-height', `${h}px`);
}

let subNavDelegationInstalled = false;
export function installSubNavDelegation() {
  if (subNavDelegationInstalled || typeof document === 'undefined') return;
  subNavDelegationInstalled = true;

  const handleAction = (event) => {
    const pill = event.target?.closest?.('.cb-sub-pill, [data-target-view]');
    if (!pill) return;
    const viewId = pill.dataset.targetView;
    if (!isShellViewAllowed(viewId)) return;
    if (!viewId) return;
    event.preventDefault();
    triggerStandardView(viewId);
  };

  document.addEventListener('click', handleAction);
}

export function renderSubNav() {
  let subNav = $('#cb-sub-nav');
  if (!subNav) {
    subNav = document.createElement('nav');
    subNav.id = 'cb-sub-nav';
    subNav.setAttribute('aria-label', 'Subnavegación de sección');
    const header = $('.topbar');
    if (header && header.nextElementSibling) {
      header.parentNode.insertBefore(subNav, header.nextElementSibling);
    } else {
      document.body.prepend(subNav);
    }
  }

  syncTopbarHeight();
  installSubNavDelegation();

  const activeViewId = getActiveViewId();
  const activeModuleKey = getActiveModule(activeViewId);
  const activeModule = MODULE_CONFIG[activeModuleKey];

  let subTabs = activeModule?.subTabs || [];
  const isDelegate = document.body.classList.contains('delegate-mode');
  if (isDelegate) {
    let perms = ['partido'];
    try {
      perms = window.__campobase?.getDelegatePermissions?.()
        || window.__campobase?.state?.settings?.delegatePermissions
        || JSON.parse(localStorage.getItem('campobase.delegatePermissions') || '["partido"]');
    } catch {}
    subTabs = subTabs.filter((tab) => {
      if (tab.id === 'partido' || tab.id === 'delegado') return perms.includes('partido') || perms.includes('delegado');
      return perms.includes(tab.id);
    });
  }

  if (!activeModule || !subTabs || subTabs.length <= 1) {
    subNav.hidden = true;
    subNav.classList.add('cb-hidden');
    subNav.style.setProperty('display', 'none', 'important');
    subNav.dataset.renderedModule = '';
    return;
  }

  subNav.hidden = false;
  subNav.classList.remove('cb-hidden');
  subNav.style.removeProperty('display');

  const renderedKey = `${activeModuleKey}-${subTabs.map((t) => t.id).join(',')}`;
  // Si el módulo ya está pintado, solo actualizamos las clases activas sin destruir el DOM
  if (subNav.dataset.renderedModule === renderedKey) {
    subNav.querySelectorAll('.cb-sub-pill').forEach((btn) => {
      const target = btn.dataset.targetView;
      const isActive = target === activeViewId || (activeViewId === 'delegado' && target === 'partido');
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
    return;
  }

  subNav.dataset.renderedModule = renderedKey;
  const count = subTabs.length;

  subNav.innerHTML = `
    <div class="cb-sub-segmented" data-count="${count}" role="tablist">
      ${subTabs.map((tab) => {
        const isActive = tab.id === activeViewId || (activeViewId === 'delegado' && tab.id === 'partido');
        return `
          <button type="button" role="tab" class="cb-sub-pill ${isActive ? 'active' : ''}" data-target-view="${tab.id}" aria-selected="${isActive}">
            <span class="cb-pill-icon">${tab.icon}</span>
            <span class="cb-pill-label">${tab.label}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;

  subNav.querySelectorAll('.cb-sub-pill').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      let viewId = button.dataset.targetView;
      if (isDelegate && viewId === 'partido') viewId = 'delegado';
      if (viewId) triggerStandardView(viewId);
    });
  });
}

export function closeQuickSheet() {
  const sheet = $('#cb-quick-sheet');
  if (sheet) sheet.classList.remove('open');
}

export function toggleQuickSheet(moduleKey, triggerBtn) {
  let sheet = $('#cb-quick-sheet');
  if (sheet && sheet.dataset.module === moduleKey && sheet.classList.contains('open')) {
    closeQuickSheet();
    return;
  }

  if (!sheet) {
    sheet = document.createElement('div');
    sheet.id = 'cb-quick-sheet';
    document.body.append(sheet);

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#cb-quick-sheet') && !e.target.closest('.cb-nav-tab')) closeQuickSheet();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeQuickSheet();
    });
  }

  const mod = MODULE_CONFIG[moduleKey];
  if (!mod || !mod.subTabs || mod.subTabs.length <= 1) return;

  const isDelegate = document.body.classList.contains('delegate-mode');
  let allowedSubTabs = mod.subTabs || [];
  if (isDelegate) {
    let perms = ['partido'];
    try {
      perms = window.__campobase?.getDelegatePermissions?.()
        || window.__campobase?.state?.settings?.delegatePermissions
        || JSON.parse(localStorage.getItem('campobase.delegatePermissions') || '["partido"]');
    } catch {}
    allowedSubTabs = allowedSubTabs.filter((tab) => {
      if (tab.id === 'ajustes') return false;
      if (tab.id === 'partido' || tab.id === 'delegado') return perms.includes('partido') || perms.includes('delegado');
      return perms.includes(tab.id);
    });
    if (allowedSubTabs.length <= 1) return;
  }

  const activeViewId = getActiveViewId();
  sheet.dataset.module = moduleKey;
  sheet.innerHTML = `
    <div class="cb-quick-sheet-header">
      <div class="cb-quick-sheet-title">
        ${mod.icon}
        <strong>${mod.label}</strong>
      </div>
      <button type="button" class="cb-quick-sheet-close" aria-label="Cerrar">✕</button>
    </div>
    <div class="cb-quick-sheet-list" role="menu">
      ${allowedSubTabs.map((tab) => {
        const isActive = tab.id === activeViewId || (activeViewId === 'delegado' && tab.id === 'partido');
        return `
          <button type="button" class="cb-quick-sheet-item ${isActive ? 'active' : ''}" data-target-view="${tab.id}" role="menuitem">
            <span class="cb-sheet-item-icon">${tab.icon}</span>
            <div class="cb-sheet-item-body">
              <span class="cb-sheet-item-name">${tab.label}</span>
              <span class="cb-sheet-item-desc">${tab.desc || ''}</span>
            </div>
            ${isActive ? '<span class="cb-sheet-item-check">✓</span>' : ''}
          </button>
        `;
      }).join('')}
    </div>
  `;

  sheet.querySelector('.cb-quick-sheet-close').addEventListener('click', closeQuickSheet);
  sheet.querySelectorAll('.cb-quick-sheet-item').forEach((item) => {
    item.addEventListener('click', () => {
      closeQuickSheet();
      let viewId = item.dataset.targetView;
      if (isDelegate && viewId === 'partido') viewId = 'delegado';
      triggerStandardView(viewId);
    });
  });

  if (triggerBtn) {
    const rect = triggerBtn.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const sheetWidth = 280;
    const leftPos = Math.max(12, Math.min(window.innerWidth - sheetWidth - 12, center - (sheetWidth / 2)));
    sheet.style.left = `${leftPos}px`;
  }
  sheet.classList.add('open');
}

export function renderBottomNav() {
  if ($('#cb-bottom-nav')) return;

  const nav = document.createElement('nav');
  nav.id = 'cb-bottom-nav';
  nav.setAttribute('aria-label', 'Navegación principal');

  nav.innerHTML = Object.entries(MODULE_CONFIG).map(([key, mod]) => {
    const hasSubTabs = mod.subTabs && mod.subTabs.length > 1;
    return `
      <button type="button" class="cb-nav-tab" data-module="${key}" title="${mod.label}">
        ${mod.icon}
        <span class="cb-nav-label-wrap">
          <span>${mod.label}</span>
          ${hasSubTabs ? '<span class="cb-nav-has-sub">▾</span>' : ''}
        </span>
      </button>
    `;
  }).join('');

  document.body.append(nav);
  if (typeof window.__campobase?.syncDelegateModeDom === 'function') {
    window.__campobase.syncDelegateModeDom();
  }

  nav.querySelectorAll('.cb-nav-tab').forEach((button) => {
    button.addEventListener('click', () => {
      const moduleKey = button.dataset.module;
      const mod = MODULE_CONFIG[moduleKey];
      if (mod) {
        const currentView = getActiveViewId();
        const currentModule = getActiveModule(currentView);

        if (document.body.classList.contains('delegate-mode')) {
          closeQuickSheet();
          const perms = (window.__campobase?.getDelegatePermissions?.())
            || window.__campobase?.state?.settings?.delegatePermissions
            || JSON.parse(localStorage.getItem('campobase.delegatePermissions') || '["partido"]');

          const allowed = mod.views.filter((v) => {
            if (v === 'ajustes') return false;
            if (v === 'partido' || v === 'delegado') return perms.includes('partido') || perms.includes('delegado');
            return perms.includes(v);
          });
          if (!allowed.length) return;

          if (currentModule === moduleKey) {
            if (allowed.length > 1) toggleQuickSheet(moduleKey, button);
            return;
          }

          let targetView = allowed[0];
          if (moduleKey === 'partidos' && (perms.includes('partido') || perms.includes('delegado'))) {
            targetView = 'delegado';
          } else if (allowed.includes(mod.defaultView)) {
            targetView = mod.defaultView;
          }
          triggerStandardView(targetView);
          return;
        }

        if (currentModule === moduleKey && mod.subTabs && mod.subTabs.length > 1) {
          toggleQuickSheet(moduleKey, button);
        } else {
          closeQuickSheet();
          const targetView = mod.views.includes(currentView) ? currentView : mod.defaultView;
          triggerStandardView(targetView);
        }
      }
    });
  });
}

export function updateNavState() {
  const activeViewId = getActiveViewId();
  const activeModuleKey = getActiveModule(activeViewId);

  $$('#cb-bottom-nav .cb-nav-tab').forEach((btn) => {
    const mod = btn.dataset.module;
    const isActive = mod === activeModuleKey
      || (mod === 'partidos' && (activeViewId === 'delegado' || activeViewId === 'partido' || activeViewId === 'calendario' || activeViewId === 'convocatorias' || activeViewId === 'preparacion'))
      || (mod === 'equipo' && (activeViewId === 'plantilla' || activeViewId === 'asistencia' || activeViewId === 'cuerpo-tecnico'))
      || (mod === 'entrenos' && (activeViewId === 'sesiones' || activeViewId === 'ejercicios'))
      || (mod === 'inicio' && activeViewId === 'hoy')
      || (mod === 'convocatorias' && activeViewId === 'convocatorias');
    btn.classList.toggle('active', isActive);
  });

  syncClaudeShell();
  renderSubNav();
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (e.target?.closest?.('#cb-delegate-logout-btn')) {
      e.preventDefault();
      if (typeof window.__campobase?.logoutUser === 'function') {
        window.__campobase.logoutUser();
      }
    }
  });
}

// Punto 1 validable: todas las ventanas/modales y pantallas completas de la app
// tienen un botón inferior visible llamado exactamente «Cerrar».
// Esta capa no lee ni escribe datos y no altera la lógica de negocio.
const BOTTOM_CLOSE_STYLE_ID = 'cb-bottom-close-controls-style';
const BOTTOM_CLOSE_EXCLUDED_DIALOGS = new Set(['auth-dialog', 'exercise-detail-dialog']);
let bottomCloseSyncQueued = false;

function installBottomCloseStyles() {
  if (document.getElementById(BOTTOM_CLOSE_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = BOTTOM_CLOSE_STYLE_ID;
  style.textContent = `
    .cb-global-close-footer {
      position: fixed !important;
      left: 50% !important;
      right: auto !important;
      bottom: max(10px, env(safe-area-inset-bottom, 10px)) !important;
      transform: translateX(-50%) !important;
      width: min(calc(100vw - 20px), 520px) !important;
      max-width: calc(100vw - 20px) !important;
      box-sizing: border-box !important;
      z-index: 2147483000 !important;
      margin: 0 !important;
      padding: 0.55rem !important;
      border-radius: 14px !important;
      background: var(--card, #ffffff) !important;
      border: 1px solid var(--line, #e2e8f0) !important;
      box-shadow: 0 -3px 18px rgba(0,0,0,.18) !important;
    }
    .cb-global-close-button {
      width: 100% !important;
      min-height: 48px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 12px !important;
      font-weight: 800 !important;
      cursor: pointer !important;
      background: var(--cb-brand, var(--cb-accent, var(--brand, #c8102e))) !important;
      color: var(--cb-accent-text, #ffffff) !important;
      border: 1px solid var(--cb-brand, var(--cb-accent, var(--brand, #c8102e))) !important;
    }
    .cb-global-close-button:hover,
    .cb-global-close-button:focus-visible {
      background: var(--cb-brand, var(--cb-accent, var(--brand, #c8102e))) !important;
      color: var(--cb-accent-text, #ffffff) !important;
      border-color: var(--cb-brand, var(--cb-accent, var(--brand, #c8102e))) !important;
      filter: brightness(.92);
    }
    .lightbox .cb-global-close-footer,
    .tactica-overlay .cb-global-close-footer,
    .theater-fullscreen .cb-global-close-footer {
      background: transparent !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }
    dialog[open]:not(#auth-dialog) {
      padding-bottom: max(5.25rem, calc(4.5rem + env(safe-area-inset-bottom, 0px))) !important;
    }
    #match-detail-body {
      box-sizing: border-box !important;
      padding-left: clamp(1rem, 2.4vw, 1.35rem) !important;
      padding-right: clamp(1rem, 2.4vw, 1.35rem) !important;
      padding-bottom: 1rem !important;
    }
  `;
  document.head.appendChild(style);
}

function makeBottomCloseFooter() {
  const footer = document.createElement('div');
  footer.className = 'dialog-sticky-footer cb-global-close-footer';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'dialog-close-prominent-btn cb-global-close-button cb-managed-bottom-close';
  button.textContent = 'Cerrar';
  footer.appendChild(button);
  return footer;
}

function normalizeBottomCloseButton(button) {
  if (!button) return;
  button.type = 'button';
  button.classList.add('cb-global-close-button', 'cb-managed-bottom-close');
  if (button.textContent.trim() !== 'Cerrar') button.textContent = 'Cerrar';
}

function ensureDialogBottomClose(dialog) {
  if (!dialog || BOTTOM_CLOSE_EXCLUDED_DIALOGS.has(dialog.id)) return;
  let footer = Array.from(dialog.children).find((child) => child.classList?.contains('dialog-sticky-footer') || child.classList?.contains('cb-global-close-footer'));
  if (!footer) {
    footer = makeBottomCloseFooter();
    dialog.appendChild(footer);
  } else {
    footer.classList.add('cb-global-close-footer');
  }

  let button = footer.querySelector('.dialog-close-prominent-btn, [data-close], .cb-managed-bottom-close');
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'dialog-close-prominent-btn';
    footer.appendChild(button);
  }
  normalizeBottomCloseButton(button);
}

function ensureOverlayBottomClose(surface) {
  if (!surface) return;

  const theaterButton = surface.querySelector('.theater-bottom-close-btn');
  if (theaterButton) {
    normalizeBottomCloseButton(theaterButton);
    return;
  }

  let footer = Array.from(surface.children).find((child) => child.classList?.contains('cb-global-close-footer'));
  if (!footer) {
    footer = makeBottomCloseFooter();
    surface.appendChild(footer);
  }
  normalizeBottomCloseButton(footer.querySelector('.cb-managed-bottom-close'));
}

function closeFromBottom(button) {
  const dialog = button.closest('dialog');
  if (dialog) {
    if (dialog.id === 'confirmation-dialog') {
      document.getElementById('confirmation-cancel')?.click();
      return;
    }
    dialog.close();
    return;
  }

  const surface = button.closest('.lightbox, .tactica-overlay, .theater-fullscreen');
  if (!surface) return;

  const existingClose = surface.querySelector(
    '.lb-close, .lightbox-close, .theater-exit-btn, .sheet-top-close-btn, #tactica-interactiva-close, [data-lightbox-close], [aria-label="Cerrar"]'
  );
  if (existingClose && existingClose !== button) {
    existingClose.click();
    return;
  }

  const fullscreenToggle = surface.querySelector('.v-btn-fullscreen');
  if (fullscreenToggle) {
    fullscreenToggle.click();
    return;
  }

  surface.querySelectorAll('video').forEach((video) => video.pause());
  surface.classList.remove('open', 'theater-fullscreen');
  if (surface.classList.contains('tactica-overlay')) surface.classList.add('hidden');
}

function syncBottomCloseControls() {
  installBottomCloseStyles();
  document.querySelectorAll('dialog').forEach(ensureDialogBottomClose);
  document.querySelectorAll('.lightbox, .tactica-overlay, .theater-fullscreen').forEach(ensureOverlayBottomClose);
  document.querySelectorAll('.theater-bottom-close-btn').forEach((button) => normalizeBottomCloseButton(button));
}

function queueBottomCloseSync() {
  if (bottomCloseSyncQueued) return;
  bottomCloseSyncQueued = true;
  requestAnimationFrame(() => {
    bottomCloseSyncQueued = false;
    syncBottomCloseControls();
  });
}

function initBottomCloseControls() {
  syncBottomCloseControls();

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.cb-managed-bottom-close');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    closeFromBottom(button);
  }, true);

  const observer = new MutationObserver((mutations) => {
    let shouldSync = false;
    for (const m of mutations) {
      const target = m.target;
      if (!target) continue;
      if (m.type === 'attributes') {
        const tag = target.nodeName;
        if (tag === 'DIALOG' || target.classList?.contains('lightbox') || target.classList?.contains('tactica-overlay') || target.classList?.contains('theater-fullscreen')) {
          shouldSync = true;
          break;
        }
      } else if (m.type === 'childList') {
        if (m.addedNodes.length || m.removedNodes.length) {
          for (const node of m.addedNodes) {
            if (node.nodeName === 'DIALOG' || (node.querySelector && node.querySelector('dialog, .lightbox, .tactica-overlay, .theater-fullscreen'))) {
              shouldSync = true;
              break;
            }
          }
          if (shouldSync) break;
        }
      }
    }
    if (shouldSync) queueBottomCloseSync();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['open', 'class'],
  });
}

// Corrige únicamente el salto de 5 segundos hacia delante del visor.
// El visor usa bucle por defecto; si se salta exactamente al final, el navegador
// puede volver al inicio y parecer que el botón adelanta hacia atrás. Al llegar
// al final se detiene en el último fotograma en vez de activar el bucle.
function initForwardFiveSecondFix() {
  if (document.documentElement.dataset.cbForwardFiveSecondFix === '1') return;
  document.documentElement.dataset.cbForwardFiveSecondFix = '1';

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.v-btn-forward');
    if (!button) return;

    const root = button.closest('.ejercicio-v2-sheet, .ejercicio-validado');
    const video = root?.querySelector('.frame-video');
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const target = video.currentTime + 5;
    if (target >= video.duration) {
      video.pause();
      video.currentTime = Math.max(0, video.duration - 0.02);
      return;
    }

    video.currentTime = target;
  }, true);
}

export function initRedesign() {
  document.body.classList.add('cb-redesign-active');
  syncTopbarHeight();
  installSubNavDelegation();
  renderBottomNav();
  renderClaudeShell();
  renderSubNav();
  initStaffManagement();
  initBottomCloseControls();
  initForwardFiveSecondFix();

  const topbar = $('.topbar');
  if (topbar && typeof ResizeObserver !== 'undefined') {
    try {
      new ResizeObserver(() => syncTopbarHeight()).observe(topbar);
    } catch {}
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', syncTopbarHeight, { passive: true });
    window.addEventListener('orientationchange', syncTopbarHeight, { passive: true });
  }

  const main = $('#app');
  if (main) {
    const observer = new MutationObserver((mutations) => {
      const hasViewChange = mutations.some((m) => m.target?.classList?.contains('view'));
      if (hasViewChange) updateNavState();
    });
    observer.observe(main, { subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  updateNavState();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRedesign);
  } else {
    initRedesign();
  }
}
