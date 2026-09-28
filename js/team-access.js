export const DELEGATE_VIEW_OPTIONS = Object.freeze([
  ['delegado', 'Vista delegado del partido'],
  ['hoy', 'Inicio / Hoy'],
  ['plantilla', 'Plantilla'],
  ['cuerpo-tecnico', 'Cuerpo técnico'],
  ['asistencia', 'Asistencia'],
  ['convocatorias', 'Convocatorias'],
  ['preparacion', 'Preparación de partido'],
  ['partido', 'Partido en vivo'],
  ['calendario', 'Calendario y resultados'],
  ['sesiones', 'Sesiones de entrenamiento'],
  ['ejercicios', 'Ejercicios'],
  ['tacticas', 'Pizarra táctica'],
  ['modo-campo', 'Modo Campo'],
]);

const MODULE_VIEWS = Object.freeze({
  inicio: ['hoy'],
  equipo: ['plantilla', 'cuerpo-tecnico', 'asistencia'],
  partidos: ['convocatorias', 'preparacion', 'partido', 'delegado', 'calendario'],
  entrenos: ['sesiones', 'ejercicios'],
  mas: ['tacticas'],
});

let currentClient = null;
let currentContext = null;
let observer = null;
let panelInitialized = false;

function normalizedPermissions(value) {
  const allowed = new Set(DELEGATE_VIEW_OPTIONS.map(([id]) => id));
  const raw = Array.isArray(value) ? value : [];
  const clean = [...new Set(raw.map(String).filter((item) => allowed.has(item)))];
  if (!clean.includes('delegado')) clean.push('delegado');
  return clean;
}

export async function fetchTeamContext(client) {
  if (!client) return null;
  const { data, error } = await client.rpc('mi_equipo_contexto');
  if (error) throw error;
  return data || null;
}

export async function fetchDelegateAccount(client) {
  let cached = null;
  try {
    cached = JSON.parse(localStorage.getItem('campobase.delegateAccount') || 'null');
  } catch {}

  if (!client) {
    return cached?.user_id || cached?.email ? cached : null;
  }

  let remote = null;
  try {
    const { data, error } = await client.rpc('get_delegate_account');
    if (!error && data?.user_id) remote = data;
  } catch {}

  if (!remote) {
    try {
      const { data: member } = await client
        .from('equipo_miembros')
        .select('user_id, role, view_permissions')
        .eq('role', 'delegate')
        .maybeSingle();
      if (member?.user_id) {
        remote = {
          user_id: member.user_id,
          email: cached?.email || '',
          full_name: cached?.full_name || 'Delegado del equipo',
          view_permissions: member.view_permissions || cached?.view_permissions || ['delegado'],
        };
      }
    } catch {}
  }

  if (remote) {
    const merged = {
      user_id: remote.user_id,
      email: remote.email || cached?.email || '',
      full_name: remote.full_name || cached?.full_name || 'Delegado del equipo',
      username: remote.username || cached?.username || '',
      view_permissions: remote.view_permissions || cached?.view_permissions || ['delegado'],
    };
    try { localStorage.setItem('campobase.delegateAccount', JSON.stringify(merged)); } catch {}
    return merged;
  }

  return cached?.user_id || cached?.email ? cached : null;
}

export async function inviteDelegateAccount(client, { email, fullName = '', permissions = [] } = {}) {
  if (!client) throw new Error('No se ha podido abrir la gestión del delegado.');
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanName = String(fullName || '').trim();
  const cleanPerms = normalizedPermissions(permissions);

  const { data, error } = await client.functions.invoke('invite-delegate', {
    body: {
      email: cleanEmail,
      fullName: cleanName,
      permissions: cleanPerms,
    },
  });

  if (error || !data?.success) {
    const msg = error?.message || data?.message || '';
    if (/ya tiene una cuenta|already|asociada/i.test(msg)) {
      const existing = {
        user_id: 'associated',
        email: cleanEmail || 'delegado@asociado.es',
        full_name: cleanName || 'Delegado asociado',
        view_permissions: cleanPerms,
      };
      try { localStorage.setItem('campobase.delegateAccount', JSON.stringify(existing)); } catch {}
      return existing;
    }
    throw new Error(msg || 'No se pudo invitar al delegado.');
  }

  const delegate = data.delegate || {
    user_id: 'invited',
    email: cleanEmail,
    full_name: cleanName,
    view_permissions: cleanPerms,
  };
  try { localStorage.setItem('campobase.delegateAccount', JSON.stringify(delegate)); } catch {}
  return delegate;
}

export async function saveDelegatePermissions(client, permissions = []) {
  const clean = normalizedPermissions(permissions);
  let saved = clean;
  if (client) {
    try {
      const { data, error } = await client.rpc('set_delegate_permissions', { p_permissions: clean });
      if (!error && data?.success) {
        saved = normalizedPermissions(data.view_permissions);
      }
    } catch (e) {
      console.warn('RPC set_delegate_permissions no disponible, guardando localmente:', e);
    }
  }
  try {
    const cached = JSON.parse(localStorage.getItem('campobase.delegateAccount') || '{}');
    cached.view_permissions = saved;
    localStorage.setItem('campobase.delegateAccount', JSON.stringify(cached));
    localStorage.setItem('campobase.delegatePermissions', JSON.stringify(saved));
  } catch {}
  if (typeof window !== 'undefined' && window.__campobase?.saveDelegatePermissions) {
    await window.__campobase.saveDelegatePermissions(saved);
  } else if (window.__campobaseState?.settings) {
    window.__campobaseState.settings.delegatePermissions = saved;
  }
  return saved;
}

export function isDelegateViewAllowed(viewId) {
  const active = window.__campobaseAllowedViews;
  if (!Array.isArray(active)) return true;
  if (viewId === 'delegado' && active.includes('partido')) return true;
  if (viewId === 'partido' && active.includes('delegado')) return true;
  return active.includes(viewId);
}

function applyNavigationVisibility() {
  const allowed = Array.isArray(window.__campobaseAllowedViews)
    ? new Set(window.__campobaseAllowedViews)
    : null;
  if (!allowed) return;

  document.querySelectorAll('.bottom-nav [data-view]').forEach((button) => {
    button.hidden = !allowed.has(button.dataset.view);
  });
  document.querySelectorAll('[data-target-view]').forEach((button) => {
    button.hidden = !allowed.has(button.dataset.targetView);
  });
  document.querySelectorAll('#cb-bottom-nav .cb-nav-tab[data-module]').forEach((button) => {
    const views = MODULE_VIEWS[button.dataset.module] || [];
    button.hidden = !views.some((view) => allowed.has(view));
  });

  const settingsNav = document.getElementById('settings-nav');
  if (settingsNav) settingsNav.hidden = true;
}

function installDelegateNavigationGuard() {
  if (document.documentElement.dataset.delegateGuardInstalled === '1') return;
  document.documentElement.dataset.delegateGuardInstalled = '1';

  document.addEventListener('click', (event) => {
    if (!Array.isArray(window.__campobaseAllowedViews)) return;
    const target = event.target?.closest?.('[data-view], [data-target-view]');
    const view = target?.dataset?.view || target?.dataset?.targetView;
    if (!view || isDelegateViewAllowed(view)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
  }, true);

  observer = new MutationObserver(() => applyNavigationVisibility());
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

export function applyTeamAccessContext(context) {
  currentContext = context || null;
  const role = context?.membership_role || '';
  if (role !== 'delegate') {
    window.__campobaseAllowedViews = null;
    document.documentElement.dataset.saasTeamRole = role || '';
    document.body?.classList.remove('saas-delegate-mode');
    return;
  }

  const permissions = normalizedPermissions(context?.view_permissions);
  window.__campobaseAllowedViews = permissions;
  document.documentElement.dataset.saasTeamRole = 'delegate';
  document.body?.classList.add('saas-delegate-mode');
  document.body?.classList.remove('delegate-mode');
  installDelegateNavigationGuard();
  applyNavigationVisibility();

  const active = document.querySelector('.view.active')?.id;
  if (active && !permissions.includes(active)) {
    const fallback = permissions.includes('delegado') ? 'delegado' : permissions[0];
    window.__campobase?.showView?.(fallback);
  }
}

function permissionMarkup(selected = [], { disabled = false } = {}) {
  const active = new Set(normalizedPermissions(selected));
  return DELEGATE_VIEW_OPTIONS.map(([id, label]) => {
    const mandatory = id === 'delegado';
    const isDisabled = disabled || mandatory;
    return `<label class="cb-delegate-permission">
      <input type="checkbox" name="delegateViews" value="${id}" ${active.has(id) ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
      <span>${label}${mandatory ? ' · acceso base' : ''}</span>
    </label>`;
  }).join('');
}

function selectedPermissions(form) {
  const values = [...form.querySelectorAll('input[name="delegateViews"]:checked')].map((input) => input.value);
  values.push('delegado');
  return normalizedPermissions(values);
}

function ensurePanel(root = document) {
  const grid = root.querySelector('#ajustes .settings-grid');
  if (!grid || root.getElementById('cb-delegate-account-panel')) return Boolean(grid);

  const panel = root.createElement('article');
  panel.id = 'cb-delegate-account-panel';
  panel.className = 'panel cb-delegate-account-panel';
  panel.innerHTML = `
    <div class="panel-head">
      <span class="eyebrow">Acceso del mismo equipo</span>
      <h3>Cuenta de delegado</h3>
      <p class="meta">Crea una cuenta independiente para tu delegado. Trabajará sobre este mismo equipo y tú decides exactamente qué partes de CampoBase puede ver.</p>
    </div>
    <div id="cb-delegate-account-content"><p class="meta">Comprobando…</p></div>
  `;
  const billing = root.getElementById('cb-account-billing-panel');
  if (billing?.parentElement === grid) billing.insertAdjacentElement('afterend', panel);
  else grid.prepend(panel);
  return true;
}

async function renderDelegatePanel(root = document) {
  const panel = root.getElementById('cb-delegate-account-panel');
  const content = root.getElementById('cb-delegate-account-content');
  if (!panel || !content || !currentClient) return;

  const context = currentContext || await fetchTeamContext(currentClient).catch(() => null);
  if (!context) {
    panel.classList.remove('hidden');
    content.innerHTML = `
      <div class="cb-delegate-access-preview">
        <div class="cb-delegate-account-summary">
          <div>
            <span class="eyebrow">Cuenta asociada</span>
            <label>Nombre del delegado
              <input type="text" placeholder="Nombre y apellidos" disabled>
            </label>
          </div>
          <div>
            <span class="eyebrow">Acceso propio</span>
            <label>Correo del delegado
              <input type="email" placeholder="delegado@correo.es" disabled>
            </label>
          </div>
        </div>
        <div class="cb-delegate-preview-copy">
          <h4>¿Qué puede ver el delegado?</h4>
          <p class="meta">La vista de delegado del partido siempre está incluida. El resto de permisos se configuran aquí. Ajustes y creación de equipos nunca están disponibles para el delegado.</p>
        </div>
        <div class="cb-delegate-permissions-grid">${permissionMarkup(['delegado'], { disabled: true })}</div>
        <p class="meta cb-delegate-login-note"><strong>Gestión:</strong> entra como Administrador o Entrenador para indicar el nombre y correo del delegado y activar o quitar permisos.</p>
      </div>
    `;
    return;
  }
  if (context.membership_role === 'delegate') {
    panel.classList.add('hidden');
    return;
  }
  const canManage = ['admin', 'coach'].includes(context.membership_role);
  panel.classList.toggle('hidden', !canManage);
  if (!canManage) return;

  root.getElementById('delegate-account-panel')?.classList.add('hidden');

  let delegate = await fetchDelegateAccount(currentClient).catch(() => null);
  const currentSavedPerms = (typeof window !== 'undefined' && window.__campobase?.getDelegatePermissions)
    ? window.__campobase.getDelegatePermissions()
    : (delegate?.view_permissions ||
       window.__campobaseState?.settings?.delegatePermissions ||
       JSON.parse(localStorage.getItem('campobase.delegatePermissions') || '["delegado"]'));

  content.innerHTML = `
    <form id="cb-delegate-permissions-form">
      <div class="form-row">
        <label>Nombre del delegado
          <input name="fullName" maxlength="120" autocomplete="name" placeholder="Nombre y apellidos (opcional)" value="${delegate?.full_name || ''}">
        </label>
        <label>Correo del delegado
          <input name="email" type="email" autocomplete="email" placeholder="delegado@correo.es (opcional si usa PIN)" value="${delegate?.email || ''}">
        </label>
      </div>
      <fieldset class="cb-delegate-permissions">
        <legend>Vistas permitidas</legend>
        <p class="meta">Marca qué secciones puede ver el delegado. Ajustes y creación de equipos nunca están disponibles para el delegado.</p>
        <div class="cb-delegate-permissions-grid">${permissionMarkup(currentSavedPerms)}</div>
      </fieldset>
      <p class="meta">Esta cuenta no puede crear equipos ni entrar en Ajustes.</p>
      <div class="button-row">
        <button type="submit" class="primary" id="cb-save-delegate-perms-btn">Guardar permisos del delegado</button>
      </div>
      <p id="cb-delegate-feedback" class="meta" aria-live="polite"></p>
    </form>
  `;

  const form = root.getElementById('cb-delegate-permissions-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = root.getElementById('cb-delegate-feedback');
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    if (feedback) feedback.textContent = 'Guardando permisos…';

    try {
      const perms = selectedPermissions(form);
      const email = String(form.elements.email?.value || '').trim();
      const fullName = String(form.elements.fullName?.value || '').trim();

      const saved = await saveDelegatePermissions(currentClient, perms);

      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        try {
          delegate = await inviteDelegateAccount(currentClient, { email, fullName, permissions: saved });
        } catch (inviteErr) {
          console.warn('Invitación por correo no enviada:', inviteErr.message);
        }
      }

      if (feedback) {
        feedback.textContent = `Permisos del delegado guardados correctamente (${saved.length} vistas activas).`;
      }
    } catch (error) {
      if (feedback) feedback.textContent = error.message || 'No se pudieron guardar los permisos.';
    } finally {
      if (button) button.disabled = false;
    }
  });
}

function installStyles(root = document) {
  if (root.getElementById('cb-team-access-style')) return;
  const style = root.createElement('style');
  style.id = 'cb-team-access-style';
  style.textContent = `
    .cb-delegate-account-panel{grid-column:1/-1;min-height:360px;padding:clamp(1rem,2.4vw,1.6rem)}
    .cb-delegate-account-panel .panel-head{max-width:900px;margin-bottom:1rem}
    .cb-delegate-account-panel .panel-head h3{font-size:clamp(1.35rem,2vw,1.75rem);margin:.15rem 0}
    .cb-delegate-account-panel .panel-head .meta{font-size:1rem;line-height:1.55}
    .cb-delegate-permissions{margin:1rem 0;padding:1rem;border:1px solid var(--line,#e2e8f0);border-radius:16px}
    .cb-delegate-permissions legend{font-weight:800;padding:0 .3rem}
    .cb-delegate-permissions-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.7rem .9rem;margin-top:.8rem}
    .cb-delegate-permission{display:flex;align-items:flex-start;gap:.65rem;min-width:0;padding:.7rem;border:1px solid color-mix(in srgb,var(--line,#e2e8f0) 88%,transparent);border-radius:12px;background:color-mix(in srgb,var(--card,#fff) 96%,var(--cb-brand,#173f35) 4%)}
    .cb-delegate-permission input{width:20px;min-height:20px;flex:0 0 20px;margin-top:.08rem}
    .cb-delegate-permission span{font-weight:700;line-height:1.35}
    .cb-delegate-account-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem 1rem;margin:.8rem 0 1rem;padding:.9rem;border-radius:14px;background:color-mix(in srgb,var(--card,#fff) 94%,var(--cb-brand,#173f35) 6%)}
    .cb-delegate-account-summary p{margin:0;overflow-wrap:anywhere}
    .cb-delegate-access-preview{display:grid;gap:.8rem}
    .cb-delegate-preview-copy h4{margin:0 0 .25rem;font-size:1.1rem}
    .cb-delegate-login-note{padding:.8rem;border-radius:12px;background:color-mix(in srgb,var(--card,#fff) 92%,var(--cb-brand,#173f35) 8%)}
    html[data-saas-team-role="delegate"] #settings-nav{display:none!important}
    @media(max-width:900px){.cb-delegate-permissions-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:680px){.cb-delegate-permissions-grid,.cb-delegate-account-summary{grid-template-columns:1fr}}
  `;
  root.head.append(style);
}

export async function initTeamAccess(client, root = document) {
  if (!client || !root) return null;
  currentClient = client;
  installStyles(root);
  currentContext = await fetchTeamContext(client).catch((error) => {
    console.warn('No se pudo cargar el equipo de la cuenta:', error);
    return null;
  });
  applyTeamAccessContext(currentContext);

  if (currentContext?.membership_role !== 'delegate') {
    ensurePanel(root);
    await renderDelegatePanel(root);
    if (!panelInitialized) {
      panelInitialized = true;
      document.querySelectorAll('[data-view="ajustes"]').forEach((button) => {
        button.addEventListener('click', () => setTimeout(() => renderDelegatePanel(root), 0));
      });
    }
  }

  return currentContext;
}

export function getCurrentTeamContext() {
  return currentContext;
}
