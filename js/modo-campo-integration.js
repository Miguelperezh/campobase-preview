import './session-reorder-ui.js?v=1';
import './session-editor-usability.js?v=1';
import './custom-exercise-persistence.js?v=1';

// Integración oficial de Modo Campo con la aplicación estable.
// No reimplementa lógica de negocio: solo añade acceso/retorno y abre las
// funciones ya existentes de CampoBase cuando se llega desde Modo Campo.

const hasBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
const params = new URLSearchParams(hasBrowser ? window.location.search : '');
const fromCampo = params.get('fromCampo') === '1';
const DETAIL_BADGE_KEY = 'campobase.detailBadgeStyle';
const DETAIL_BADGE_STYLE_ID = 'cb-detail-badge-user-style';

function installTopbarActionLayout() {
  if (document.getElementById('cb-campo-topbar-layout')) return;
  const style = document.createElement('style');
  style.id = 'cb-campo-topbar-layout';
  style.textContent = `
    body.cb-redesign-active .plantilla-staff-info {
      overflow: visible !important;
    }
    body.cb-redesign-active .plantilla-staff-role-badge {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: fit-content !important;
      max-width: 8rem !important;
      overflow: visible !important;
      text-overflow: clip !important;
      white-space: normal !important;
      overflow-wrap: normal !important;
      word-break: normal !important;
      line-height: 1.05 !important;
      text-align: center !important;
    }
    body.cb-redesign-active .player-performance[open] .player-performance-summary {
      background: var(--cb-slate-100, #f1f5f9) !important;
      color: var(--cb-slate-900, #0f172a) !important;
    }
    @media (max-width: 650px) {
      body.cb-redesign-active .topbar {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        align-items: stretch !important;
        gap: .45rem !important;
        padding-top: max(.65rem, env(safe-area-inset-top, 0px)) !important;
        overflow: visible !important;
      }
      body.cb-redesign-active .topbar-brand {
        width: 100% !important;
        min-width: 0 !important;
      }
      body.cb-redesign-active .topbar .status {
        width: 100% !important;
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        align-items: stretch !important;
        gap: .35rem !important;
        padding-top: .4rem !important;
        margin-top: .05rem !important;
        border-top: 1px solid var(--cb-slate-200, var(--line, #e2e8f0)) !important;
        flex-direction: initial !important;
      }
      body.cb-redesign-active .topbar .status #active-format {
        grid-column: 1 / -1 !important;
        justify-self: end !important;
        min-height: 28px !important;
        font-size: .62rem !important;
        padding: .25rem .55rem !important;
      }
      body.cb-redesign-active .topbar .status #role-label,
      body.cb-redesign-active .topbar .status #network-dot,
      body.cb-redesign-active .topbar .status #network-label {
        display: none !important;
      }
      body.cb-redesign-active .topbar .status #open-field-mode,
      body.cb-redesign-active .topbar .status #return-to-field-mode,
      body.cb-redesign-active .topbar .status #manual-refresh,
      body.cb-redesign-active .topbar .status #logout {
        width: 100% !important;
        min-width: 0 !important;
        min-height: 40px !important;
        margin: 0 !important;
        padding: .45rem .35rem !important;
        font-size: .68rem !important;
        white-space: normal !important;
        line-height: 1.05 !important;
        text-align: center !important;
      }
      body.cb-redesign-active .topbar .status #open-field-mode,
      body.cb-redesign-active .topbar .status #return-to-field-mode { grid-column: 1; }
      body.cb-redesign-active .topbar .status #manual-refresh { grid-column: 2; }
      body.cb-redesign-active .topbar .status #logout { grid-column: 3; }
    }
  `;
  document.head.appendChild(style);
}

function addTopbarButton({ id, text, onClick, primary = false }) {
  if (document.getElementById(id)) return;
  const role = window.__campobase?.state?.role;
  if (role === 'delegate' || document.body.classList.contains('delegate-mode')) {
    const perms = window.__campobase?.state?.settings?.delegatePermissions || ['partido'];
    if (!perms.includes('modo-campo')) return;
  }
  const status = document.querySelector('.topbar .status');
  const logout = document.getElementById('logout');
  if (!status) return;
  const button = document.createElement('button');
  button.id = id;
  button.type = 'button';
  button.className = `${primary ? 'primary' : 'secondary'} compact`;
  button.textContent = text;
  button.addEventListener('click', onClick);
  if (logout?.parentNode === status) status.insertBefore(button, logout);
  else status.appendChild(button);
}

function saveCacheAndNavigate() {
  try {
    const app = window.__campobase;
    if (app?.state) {
      const cache = {
        players: app.state.players || [],
        callups: app.state.callups || [],
        matches: app.state.matches || [],
        attendance: app.state.trainings || [],
        settings: app.state.settings || [],
        at: Date.now(),
      };
      localStorage.setItem('campobase.directFieldCache', JSON.stringify(cache));
    }
  } catch {}
  window.location.href = './modo-campo-directo.html';
}

function installEntryButtons() {
  const role = window.__campobase?.state?.role;
  if (role === 'delegate' || document.body.classList.contains('delegate-mode')) {
    const perms = window.__campobase?.state?.settings?.delegatePermissions || ['partido'];
    if (!perms.includes('modo-campo')) return;
  }
  if (fromCampo) {
    addTopbarButton({
      id: 'return-to-field-mode',
      text: '← Volver a Modo Campo',
      primary: true,
      onClick: saveCacheAndNavigate,
    });
    return;
  }
  addTopbarButton({
    id: 'open-field-mode',
    text: 'Modo Campo',
    onClick: saveCacheAndNavigate,
  });
}

function waitForSelector(selector, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const immediate = document.querySelector(selector);
    if (immediate) return resolve(immediate);
    const started = Date.now();
    const timer = window.setInterval(() => {
      const element = document.querySelector(selector);
      if (element || Date.now() - started >= timeoutMs) {
        clearInterval(timer);
        resolve(element || null);
      }
    }, 100);
  });
}

function clearActionFromUrl() {
  const current = new URL(window.location.href);
  current.searchParams.delete('campoAction');
  current.searchParams.delete('source');
  current.searchParams.delete('id');
  window.history.replaceState({}, '', `${current.pathname}${current.search}${current.hash}`);
}

async function openRealAction() {
  const action = params.get('campoAction');
  if (!action) return;

  const app = window.__campobase;
  if (!app?.showView) {
    window.setTimeout(openRealAction, 120);
    return;
  }

  const id = params.get('id') || '';

  if (action === 'live') {
    app.showView('partido');
    clearActionFromUrl();
    return;
  }
  if (action === 'delegate') {
    app.showView('delegado');
    clearActionFromUrl();
    return;
  }
  if (action === 'whatsapp-session' && id) {
    app.showView('sesiones');
    const button = await waitForSelector(`.open-whatsapp-session[data-id="${CSS.escape(id)}"]`);
    button?.click();
    clearActionFromUrl();
    return;
  }
  if (action === 'whatsapp-match' && id) {
    app.showView('calendario');
    const button = await waitForSelector(`.open-whatsapp-match[data-id="${CSS.escape(id)}"]`);
    button?.click();
    clearActionFromUrl();
    return;
  }
  if (action === 'attendance' && id) {
    const source = params.get('source') === 'match' ? 'match' : 'session';
    app.showView('asistencia');
    const button = await waitForSelector(`[data-attendance-source="${source}"][data-source-id="${CSS.escape(id)}"]`);
    button?.click();
    clearActionFromUrl();
  }
}

function normalizeDorsal(value = '') {
  const raw = String(value).trim().replace(/^#\s*/, '');
  if (!raw) return '';
  return /^\d+$/.test(raw) ? String(Number(raw)) : raw.toLocaleLowerCase('es');
}

function showDorsalWarning(form, message) {
  let warning = form.querySelector('.cb-dorsal-warning');
  if (!warning) {
    warning = document.createElement('p');
    warning.className = 'warning panel cb-dorsal-warning';
    warning.setAttribute('role', 'alert');
    const numberField = form.elements.number?.closest('label') || form.elements.number;
    numberField?.insertAdjacentElement('afterend', warning);
  }
  warning.textContent = message;

  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 3200);
  }
}

function clearDorsalWarning(form) {
  form?.querySelector('.cb-dorsal-warning')?.remove();
}

function findDorsalOwner(number, currentId = '') {
  const normalized = normalizeDorsal(number);
  if (!normalized) return null;

  for (const card of document.querySelectorAll('#players-list .card.player[data-player-id]')) {
    if (card.dataset.playerId === currentId) continue;
    const badge = card.querySelector('.player-subhead-pill')?.textContent || '';
    const match = badge.match(/Dorsal\s+(.+)/i);
    if (!match || normalizeDorsal(match[1]) !== normalized) continue;
    return {
      id: card.dataset.playerId,
      name: card.querySelector('.player-name h3, h3')?.textContent?.trim() || 'otro jugador',
    };
  }
  return null;
}

function installPlayerDorsalGuard() {
  document.addEventListener('submit', (event) => {
    const form = event.target?.closest?.('#player-form');
    if (!form) return;

    clearDorsalWarning(form);
    const numberInput = form.elements.number;
    const dorsal = normalizeDorsal(numberInput?.value || '');
    if (!dorsal) return;

    const owner = findDorsalOwner(dorsal, form.elements.id?.value || '');
    if (!owner) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    showDorsalWarning(form, `El dorsal ${dorsal} ya está asignado a ${owner.name}. Elige otro dorsal.`);
    numberInput?.focus();
    numberInput?.select?.();
  }, true);

  document.addEventListener('input', (event) => {
    if (event.target?.matches?.('#player-form [name="number"]')) {
      clearDorsalWarning(event.target.closest('#player-form'));
    }
  });
}

function readDetailBadgeSettings() {
  try {
    const value = JSON.parse(localStorage.getItem(DETAIL_BADGE_KEY) || 'null');
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

function detailBadgeFont(value) {
  return value === 'inter'
    ? 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    : '"Barlow Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
}

function installDetailBadgeStyles() {
  if (document.getElementById(DETAIL_BADGE_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = DETAIL_BADGE_STYLE_ID;
  style.textContent = `
    html[data-cb-detail-badges="custom"] body.cb-redesign-active #active-format.format-badge,
    html[data-cb-detail-badges="custom"] body.cb-redesign-active .plantilla-staff-role-badge,
    html[data-cb-detail-badges="custom"] body.cb-redesign-active .staff-badge {
      background: var(--cb-detail-badge-bg) !important;
      color: var(--cb-detail-badge-text) !important;
      font-family: var(--cb-detail-badge-font) !important;
      font-weight: var(--cb-detail-badge-weight) !important;
      border-color: transparent !important;
    }
    .cb-detail-badge-preview-row {
      display: flex;
      flex-wrap: wrap;
      gap: .6rem;
      align-items: center;
      margin: .8rem 0 1rem;
    }
    .cb-detail-badge-preview {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 32px;
      padding: .35rem .7rem;
      border-radius: 999px;
      line-height: 1;
    }
    .cb-detail-badge-fields {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .75rem;
    }
    .cb-detail-badge-bold {
      display: flex !important;
      align-items: center;
      gap: .55rem;
      min-height: 44px;
    }
    @media (max-width: 650px) {
      .cb-detail-badge-fields { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
}

function applyDetailBadgeSettings(settings) {
  installDetailBadgeStyles();
  const root = document.documentElement;
  if (!settings) {
    root.removeAttribute('data-cb-detail-badges');
    root.style.removeProperty('--cb-detail-badge-bg');
    root.style.removeProperty('--cb-detail-badge-text');
    root.style.removeProperty('--cb-detail-badge-font');
    root.style.removeProperty('--cb-detail-badge-weight');
    return;
  }

  root.setAttribute('data-cb-detail-badges', 'custom');
  root.style.setProperty('--cb-detail-badge-bg', settings.background || '#c8102e');
  root.style.setProperty('--cb-detail-badge-text', settings.text || '#000000');
  root.style.setProperty('--cb-detail-badge-font', detailBadgeFont(settings.font));
  root.style.setProperty('--cb-detail-badge-weight', settings.bold === false ? '500' : '800');
}

function updateDetailBadgePreview(form) {
  const background = form.elements.background?.value || '#c8102e';
  const text = form.elements.text?.value || '#000000';
  const font = detailBadgeFont(form.elements.font?.value || 'barlow');
  const weight = form.elements.bold?.checked ? '800' : '500';
  form.querySelectorAll('.cb-detail-badge-preview').forEach((preview) => {
    preview.style.background = background;
    preview.style.color = text;
    preview.style.fontFamily = font;
    preview.style.fontWeight = weight;
  });
}

function installDetailBadgeSettings() {
  applyDetailBadgeSettings(readDetailBadgeSettings());

  const grid = document.querySelector('#ajustes .settings-grid');
  if (!grid || document.getElementById('detail-badge-settings-panel')) return;

  const saved = readDetailBadgeSettings();
  const panel = document.createElement('article');
  panel.className = 'panel';
  panel.id = 'detail-badge-settings-panel';
  panel.innerHTML = `
    <h3>Distintivos de información</h3>
    <p class="meta">Configura de forma común los distintivos como «F7 · 7 en campo · 70 min» y los cargos del cuerpo técnico. No modifica el resto del tema.</p>
    <form id="detail-badge-settings-form">
      <div class="cb-detail-badge-fields">
        <label>Color de fondo
          <input type="color" name="background" value="${saved?.background || '#c8102e'}">
        </label>
        <label>Color del texto
          <input type="color" name="text" value="${saved?.text || '#000000'}">
        </label>
        <label>Fuente
          <select name="font">
            <option value="barlow" ${(saved?.font || 'barlow') === 'barlow' ? 'selected' : ''}>Actual · Barlow Condensed</option>
            <option value="inter" ${saved?.font === 'inter' ? 'selected' : ''}>Alternativa · Inter</option>
          </select>
        </label>
        <label class="cb-detail-badge-bold">
          <input type="checkbox" name="bold" ${saved?.bold === false ? '' : 'checked'}> Negrita
        </label>
      </div>
      <div class="cb-detail-badge-preview-row" aria-label="Vista previa">
        <span class="cb-detail-badge-preview">F7 · 7 en campo · 70 min</span>
        <span class="cb-detail-badge-preview">1º ENTRENADOR</span>
      </div>
      <button class="primary" type="submit">Guardar distintivos</button>
    </form>
  `;

  const themePanel = grid.querySelector('#theme-settings-form')?.closest('.panel');
  if (themePanel) themePanel.insertAdjacentElement('afterend', panel);
  else grid.appendChild(panel);

  const form = panel.querySelector('#detail-badge-settings-form');
  updateDetailBadgePreview(form);
  form.addEventListener('input', () => updateDetailBadgePreview(form));
  form.addEventListener('change', () => updateDetailBadgePreview(form));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const settings = {
      background: form.elements.background.value,
      text: form.elements.text.value,
      font: form.elements.font.value === 'inter' ? 'inter' : 'barlow',
      bold: form.elements.bold.checked,
    };
    localStorage.setItem(DETAIL_BADGE_KEY, JSON.stringify(settings));
    applyDetailBadgeSettings(settings);
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = 'Distintivos actualizados.';
      toast.classList.add('show');
      window.setTimeout(() => toast.classList.remove('show'), 2600);
    }
  });
}

function install() {
  installTopbarActionLayout();
  installEntryButtons();
  installPlayerDorsalGuard();
  installDetailBadgeSettings();
  openRealAction().catch((error) => console.warn('No se pudo abrir la función solicitada desde Modo Campo:', error));
}

if (hasBrowser) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
