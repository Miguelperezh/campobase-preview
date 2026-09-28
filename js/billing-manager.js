import { redeemPromoCodeFlow } from './promo-codes-admin.js';
import { PLAN_PRICES, planFeaturesHTML } from './plan-catalog.js';

export { PLAN_PRICES } from './plan-catalog.js';

export const SUBSCRIPTION_CACHE_PREFIX = 'campobase.subscription.';

let initialized = false;
let currentContext = null;
let currentClient = null;

function appName() {
  return String(document?.title || 'Aplicación').trim() || 'Aplicación';
}

function cacheKey(userId) {
  return userId ? `${SUBSCRIPTION_CACHE_PREFIX}${userId}` : '';
}

export function isSubscriptionActive(sub, now = Date.now()) {
  if (!sub) return false;
  if (sub.estado === 'gift_free') {
    return !sub.expira_en || new Date(sub.expira_en).getTime() > now;
  }
  if (sub.estado === 'active') {
    return !sub.expira_en || new Date(sub.expira_en).getTime() > now;
  }
  if (sub.estado === 'trial') {
    return Boolean(sub.expira_en) && new Date(sub.expira_en).getTime() > now;
  }
  return false;
}

export function getDaysRemaining(sub, now = Date.now()) {
  if (!sub?.expira_en) return 0;
  const expires = new Date(sub.expira_en).getTime();
  if (!Number.isFinite(expires)) return 0;
  return Math.max(0, Math.ceil((expires - now) / 86400000));
}

export function formatBillingDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatSubscriptionStatus(sub, now = Date.now()) {
  if (!sub) return { label: 'Sin plan activo', canUseApp: false, kind: 'inactive' };
  if (sub.estado === 'gift_free') {
    const active = isSubscriptionActive(sub, now);
    if (!active) return { label: 'Regalo caducado', canUseApp: false, kind: 'inactive' };
    return sub.expira_en
      ? { label: `🎁 Pro gratis hasta ${new Date(sub.expira_en).toLocaleDateString('es-ES')}`, canUseApp: true, kind: 'gift' }
      : { label: '🎁 Pro vitalicio', canUseApp: true, kind: 'gift' };
  }
  if (sub.estado === 'active') {
    const active = isSubscriptionActive(sub, now);
    const planText = sub.plan === 'anual' ? 'Plan anual Pro' : 'Plan mensual Pro';
    return {
      label: active ? `⭐ ${planText}` : 'Plan finalizado',
      canUseApp: active,
      kind: active ? 'active' : 'inactive',
    };
  }
  if (sub.estado === 'trial') {
    const days = getDaysRemaining(sub, now);
    return days > 0
      ? { label: `⏳ Prueba Pro · ${days} ${days === 1 ? 'día restante' : 'días restantes'}`, canUseApp: true, kind: 'trial' }
      : { label: 'Prueba gratuita finalizada', canUseApp: false, kind: 'inactive' };
  }
  if (sub.estado === 'pending_payment') {
    return { label: 'Falta configurar la prueba', canUseApp: false, kind: 'pending' };
  }
  return { label: 'Suscripción inactiva', canUseApp: false, kind: 'inactive' };
}

export function saveCurrentSubscription(sub, userId) {
  if (!sub || !userId || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify({ ...sub, _verifiedAt: Date.now() }));
  } catch {}
}

export function getCachedSubscription(userId) {
  if (!userId || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export async function fetchUserSubscription(client, userId) {
  if (!client || !userId) return { subscription: null, source: 'none' };
  try {
    const { data, error } = await client.rpc('get_my_subscription');
    if (error) throw error;
    const row = Array.isArray(data) ? (data[0] || null) : (data || null);
    if (row) {
      saveCurrentSubscription(row, userId);
      return { subscription: row, source: 'server' };
    }
    return { subscription: null, source: 'server' };
  } catch (error) {
    console.warn('No se pudo actualizar el estado de la suscripción:', error);
  }
  return { subscription: getCachedSubscription(userId), source: 'cache' };
}

export async function startStripeCheckout(client, plan = 'monthly', returnUrl = '') {
  if (!client) throw new Error('No se ha podido iniciar el pago.');
  if (!Object.hasOwn(PLAN_PRICES, plan)) throw new TypeError('El plan seleccionado no es válido.');
  const { data, error } = await client.functions.invoke('create-checkout-session', {
    body: {
      plan,
      returnUrl: returnUrl || (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : ''),
    },
  });
  if (error) throw new Error(error.message || 'No se ha podido abrir el pago.');
  if (!data?.url) throw new Error(data?.message || 'El pago todavía no está disponible.');
  if (typeof window !== 'undefined') window.location.assign(data.url);
  return data;
}

export async function cancelSubscriptionAtPeriodEnd(client) {
  if (!client) throw new Error('No se ha podido cancelar la suscripción.');
  const { data, error } = await client.functions.invoke('cancel-subscription', { body: {} });
  if (error) throw new Error(error.message || 'No se ha podido cancelar la renovación.');
  if (!data?.success) throw new Error(data?.message || 'No se ha podido cancelar la renovación.');
  return data;
}

function ensureBillingUI(root = document) {
  const grid = root.querySelector('#ajustes .settings-grid');
  if (!grid) return false;

  if (!root.getElementById('cb-account-billing-panel')) {
    const panel = root.createElement('article');
    panel.id = 'cb-account-billing-panel';
    panel.className = 'panel cb-account-billing-panel';
    panel.innerHTML = `
      <div class="panel-head">
        <span class="eyebrow">Licencia y acceso</span>
        <h3>Mi cuenta y suscripción</h3>
      </div>
      <p><span id="cb-account-status-badge" class="badge">Comprobando…</span></p>
      <div class="account-details">
        <p><strong>Cuenta:</strong> <span id="cb-account-user-email">—</span></p>
        <p><strong>Plan:</strong> <span id="cb-account-plan-title">—</span></p>
        <p id="cb-account-expiry-box" class="hidden"><strong>Vigencia:</strong> <span id="cb-account-expiry-date">—</span></p>
        <p id="cb-account-discount-box" class="hidden"><strong>Descuento disponible:</strong> <span id="cb-account-discount">—</span></p>
      </div>
      <div id="cb-account-trial-summary" class="cb-account-trial-summary hidden"></div>
      <div class="button-row" id="cb-account-actions">
        <button type="button" class="primary compact hidden" id="cb-account-upgrade-btn">⭐ Ver planes Pro</button>
        <button type="button" class="secondary compact hidden" id="cb-account-cancel-btn">Cancelar renovación</button>
      </div>
      <p id="cb-account-action-feedback" class="meta" aria-live="polite"></p>
    `;
    grid.prepend(panel);
  }

  if (!root.getElementById('cb-paywall-dialog')) {
    const dialog = root.createElement('dialog');
    dialog.id = 'cb-paywall-dialog';
    dialog.className = 'cb-paywall-dialog';
    dialog.innerHTML = `
      <div class="dialog-head">
        <h2>⭐ Planes Pro</h2>
        <button type="button" data-close aria-label="Cerrar">×</button>
      </div>
      <div id="cb-paywall-dialog-body"></div>
    `;
    root.body.append(dialog);
  }
  const plans = root.getElementById('cb-plans-content');
  if (plans && !plans.dataset.billingReady) plans.dataset.billingReady = '1';
  return true;
}

function accountLabel(user, profile) {
  const name = profile?.full_name || user?.user_metadata?.full_name || profile?.username || '';
  if (name && user?.email) return `${name} · ${user.email}`;
  return user?.email || name || 'Cuenta conectada';
}

function planTitle(sub) {
  if (!sub) return 'Sin plan activo';
  if (sub.estado === 'gift_free') return sub.expira_en ? 'Pro gratis' : 'Pro vitalicio';
  if (sub.estado === 'pending_payment') return sub.plan === 'anual' ? 'Anual · pendiente de activar prueba' : 'Mensual · pendiente de activar prueba';
  if (sub.estado === 'trial') return sub.plan === 'anual' ? 'Anual · prueba Pro' : 'Mensual · prueba Pro';
  if (sub.estado === 'active') return sub.plan === 'anual' ? 'Pro anual' : 'Pro mensual';
  return 'Sin plan activo';
}

function formatExpiry(value) {
  return formatBillingDate(value);
}

export function renderPaywallModalHTML(sub = null, { delegate = false } = {}) {
  const discount = Number(sub?.pending_discount_percent) || 0;
  if (delegate) {
    return `
      <div class="cb-paywall-modal-card">
        <div class="panel-head">
          <p class="eyebrow">Acceso del equipo</p>
          <h3>La suscripción del equipo necesita renovación</h3>
          <p class="meta">La suscripción y los códigos promocionales los gestiona el entrenador titular. Tu cuenta de delegado seguirá asociada al mismo equipo.</p>
        </div>
        <div class="button-row cb-paywall-account-actions">
          <button type="button" class="secondary" id="cb-paywall-logout-btn">Salir de la cuenta</button>
        </div>
      </div>
    `;
  }
  return `
    <div class="cb-paywall-modal-card">
      <div class="panel-head">
        <p class="eyebrow">Acceso completo</p>
        <h3>Elige tu plan</h3>
        <p class="meta">Todas las funciones de CampoBase están incluidas en mensual y anual.</p>
        <p><span class="badge">Pago seguro con Stripe</span></p>
      </div>
      <div class="cb-access-rule">
        <strong>Acceso a CampoBase</strong>
        <ol class="cb-access-flow">
          <li><span class="cb-access-number">1</span><div><b>Crea tu cuenta</b><small>Empiezas con 14 días de acceso completo gratis.</small></div></li>
          <li><span class="cb-access-number">2</span><div><b>Usa la prueba</b><small>Durante esos 14 días puedes utilizar todas las funciones.</small></div></li>
          <li><span class="cb-access-number">3</span><div><b>Después de la prueba</b><small>Necesitas un plan mensual/anual o un código de regalo válido.</small></div></li>
        </ol>
        <p class="cb-access-blocked">Sin prueba activa, código gratuito válido o suscripción pagada, no se puede entrar a los datos del equipo.</p>
      </div>
      <article class="panel cb-plan-includes">
        <h4>Todo CampoBase incluido</h4>
        ${planFeaturesHTML()}
      </article>
      ${discount > 0 ? `<p class="cb-discount-banner">Tienes un <strong>${discount}% de descuento</strong> guardado para tu próxima suscripción.</p>` : ''}
      <div class="cb-plans-grid">
        <article class="card cb-plan-card">
          <h4>Plan mensual</h4>
          <p class="cb-plan-price"><strong>9,99 €</strong> / mes</p>
          <p class="meta">14 días gratis. Después 9,99 €/mes. Puedes cancelar antes de que termine la prueba.</p>
          <button type="button" class="secondary cb-checkout-btn" data-plan="monthly">Elegir mensual</button>
        </article>
        <article class="card cb-plan-card featured">
          <span class="eyebrow">Ahorra frente al mensual</span>
          <h4>Plan anual</h4>
          <p class="cb-plan-price"><strong>79 €</strong> / año</p>
          <p class="meta">14 días gratis. Después 79 €/año. Puedes cancelar antes de que termine la prueba.</p>
          <button type="button" class="primary cb-checkout-btn" data-plan="annual">Elegir anual</button>
        </article>
      </div>
      <div class="panel cb-promo-redeem-box">
        <h4>¿Tienes un código de regalo o descuento?</h4>
        <div class="form-row">
          <input type="text" id="cb-paywall-promo-input" placeholder="Introduce tu código" autocomplete="off">
          <button type="button" id="cb-paywall-redeem-btn" class="secondary">Canjear</button>
        </div>
        <p id="cb-paywall-promo-feedback" class="meta" aria-live="polite"></p>
      </div>
      <p id="cb-paywall-payment-feedback" class="meta" aria-live="polite"></p>
      <div class="button-row cb-paywall-account-actions">
        <button type="button" class="secondary hidden" id="cb-paywall-logout-btn">Salir de la cuenta</button>
      </div>
    </div>
  `;
}

function renderPlansView(root = document, context = currentContext) {
  const target = root.getElementById('cb-plans-content');
  if (!target) return;

  const isDelegate = context?.profile?.role === 'delegate';
  target.innerHTML = renderPaywallModalHTML(context?.subscription || null, { delegate: isDelegate });

  const sub = context?.subscription || null;
  const expiryLabel = formatBillingDate(sub?.expira_en);
  if (!isDelegate && expiryLabel && ['pending_payment', 'trial'].includes(sub?.estado)) {
    const planIncludes = target.querySelector('.cb-plan-includes');
    planIncludes?.insertAdjacentHTML('beforebegin', `
      <article class="panel cb-trial-summary">
        <span class="eyebrow">${sub.estado === 'trial' ? 'Prueba activa' : 'Antes de entrar'}</span>
        <h4>${sub.estado === 'trial' ? 'Tu prueba termina el' : 'Tu prueba de 14 días terminará el'} ${expiryLabel}</h4>
        <p class="meta">No se te cobrará antes de esa fecha. Puedes cancelar antes de que termine la prueba y no se realizará el primer cobro.</p>
      </article>
    `);
  }

  const header = target.querySelector('.panel-head');
  if (header && !isDelegate) {
    const accountStatus = formatSubscriptionStatus(context?.subscription || null).label;
    header.insertAdjacentHTML('afterend', `<article class="panel cb-plans-account-summary"><strong>Estado actual:</strong> ${accountStatus}</article>`);
  }

  const hasUser = Boolean(context?.user);
  const checkoutButtons = [...target.querySelectorAll('.cb-checkout-btn')];
  const status = formatSubscriptionStatus(context?.subscription || null);

  if (status.canUseApp && context?.subscription?.estado === 'gift_free') {
    checkoutButtons.forEach((button) => {
      button.disabled = true;
      button.textContent = context.subscription.expira_en ? 'Acceso gratis activo' : 'Incluido en tu Pro vitalicio';
    });
  } else if (!hasUser) {
    checkoutButtons.forEach((button) => {
      button.disabled = true;
      button.textContent = 'Inicia sesión para contratar';
    });
  } else {
    checkoutButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        const feedback = target.querySelector('#cb-paywall-payment-feedback');
        const label = button.textContent;
        button.disabled = true;
        button.textContent = 'Abriendo Stripe…';
        if (feedback) feedback.textContent = '';
        try {
          await startStripeCheckout(currentClient, button.dataset.plan);
        } catch (error) {
          if (feedback) feedback.textContent = error.message || 'No se ha podido abrir el pago.';
        } finally {
          button.disabled = false;
          button.textContent = label;
        }
      });
    });
  }

  const redeemButton = target.querySelector('#cb-paywall-redeem-btn');
  const redeemInput = target.querySelector('#cb-paywall-promo-input');
  const redeemFeedback = target.querySelector('#cb-paywall-promo-feedback');
  if (redeemButton && hasUser && !isDelegate) {
    redeemButton.addEventListener('click', async () => {
      const code = redeemInput?.value?.trim();
      if (!code) return;
      redeemButton.disabled = true;
      try {
        const result = await redeemPromoCodeFlow(code);
        if (redeemFeedback) redeemFeedback.textContent = result.message || 'Código aplicado.';
        if (redeemInput) redeemInput.value = '';
        await refreshBillingState();
      } catch (error) {
        if (redeemFeedback) redeemFeedback.textContent = error.message || 'No se ha podido aplicar el código.';
      } finally {
        redeemButton.disabled = false;
      }
    });
  } else if (redeemButton && !hasUser) {
    redeemButton.disabled = true;
  }

  target.querySelector('#cb-paywall-logout-btn')?.classList.add('hidden');

}

function trialCountdownText(sub) {
  if (!sub?.expira_en || sub.estado !== 'trial') return '';
  const days = getDaysRemaining(sub);
  const date = formatBillingDate(sub.expira_en);
  const daysText = days === 1 ? '1 día' : `${days} días`;
  return `Quedan ${daysText} · termina el ${date}`;
}

function renderTodayTrialBanner(root, context) {
  const host = root.getElementById('hoy');
  if (!host) return;
  let banner = root.getElementById('cb-today-trial-banner');
  const sub = context?.subscription;
  const isDelegate = context?.profile?.role === 'delegate';
  const show = Boolean(context?.user && !isDelegate && sub?.estado === 'trial' && isSubscriptionActive(sub));

  if (!show) {
    banner?.remove();
    return;
  }

  if (!banner) {
    banner = root.createElement('article');
    banner.id = 'cb-today-trial-banner';
    banner.className = 'cb-today-trial-banner';
    const head = host.querySelector('.section-head');
    if (head) head.insertAdjacentElement('afterend', banner);
    else host.prepend(banner);
  }

  const date = formatBillingDate(sub.expira_en);
  const days = getDaysRemaining(sub);
  const preview = Boolean(sub?._preview);
  banner.innerHTML = `
    <div class="cb-trial-banner-copy">
      <span class="eyebrow">${preview ? 'Simulación · Prueba Pro' : 'Prueba Pro'}</span>
      <strong>${days === 1 ? 'Queda 1 día' : `Quedan ${days} días`}</strong>
      <span>Termina el ${date}</span>
    </div>
    <div class="cb-trial-banner-note">
      <span>No se te cobrará antes de esa fecha.</span>
      <button type="button" class="ghost compact" data-open-subscription-settings>Gestionar prueba</button>
    </div>
  `;

  banner.querySelector('[data-open-subscription-settings]')?.addEventListener('click', () => {
    if (window.__campobase?.showView) window.__campobase.showView('ajustes');
    else root.querySelector('[data-view="ajustes"]')?.click();
  });
}

async function handleCancelSubscription(button, feedback) {
  if (!button || button.disabled) return;
  const sub = currentContext?.subscription;
  const endDate = formatBillingDate(sub?.expira_en);
  const message = sub?.estado === 'trial'
    ? `¿Cancelar la renovación? Seguirás teniendo acceso hasta ${endDate || 'el final de la prueba'} y no se realizará el primer cobro.`
    : `¿Cancelar la renovación? Mantendrás el acceso hasta ${endDate || 'el final del periodo actual'}.`;
  if (!confirm(message)) return;

  button.disabled = true;
  if (feedback) feedback.textContent = 'Cancelando renovación…';

  try {
    const result = await cancelSubscriptionAtPeriodEnd(currentClient);
    if (feedback) feedback.textContent = result.message || 'Renovación cancelada.';
    await refreshBillingState();
  } catch (error) {
    if (feedback) feedback.textContent = error.message || 'No se pudo cancelar la renovación.';
    button.disabled = false;
  }
}

function updateAccountBillingUI(root, context) {
  const panel = root.getElementById('cb-account-billing-panel');
  if (!panel) return;
  const userEl = panel.querySelector('#cb-account-user-email');
  const badgeEl = panel.querySelector('#cb-account-status-badge');
  const planEl = panel.querySelector('#cb-account-plan-title');
  const expiryBox = panel.querySelector('#cb-account-expiry-box');
  const expiryDate = panel.querySelector('#cb-account-expiry-date');
  const discountBox = panel.querySelector('#cb-account-discount-box');
  const discountEl = panel.querySelector('#cb-account-discount');
  const trialSummary = panel.querySelector('#cb-account-trial-summary');
  const upgrade = panel.querySelector('#cb-account-upgrade-btn');
  const cancelButton = panel.querySelector('#cb-account-cancel-btn');
  const actionFeedback = panel.querySelector('#cb-account-action-feedback');

  if (!context?.user) {
    if (userEl) userEl.textContent = 'Acceso local con PIN';
    if (badgeEl) badgeEl.textContent = 'Acceso local';
    if (planEl) planEl.textContent = 'Sin cuenta conectada';
    expiryBox?.classList.add('hidden');
    discountBox?.classList.add('hidden');
    trialSummary?.classList.add('hidden');
    cancelButton?.classList.add('hidden');
    if (actionFeedback) actionFeedback.textContent = '';
    upgrade?.classList.remove('hidden');
    if (upgrade) upgrade.textContent = '⭐ Ver planes y pagos';
    renderPlansView(root, context);
    renderTodayTrialBanner(root, context);
    return;
  }

  const sub = context.subscription;
  const status = formatSubscriptionStatus(sub);
  if (userEl) userEl.textContent = accountLabel(context.user, context.profile);
  if (badgeEl) badgeEl.textContent = status.label;
  if (planEl) planEl.textContent = planTitle(sub);

  const hasExpiry = Boolean(sub?.expira_en && sub?.estado !== 'gift_free');
  expiryBox?.classList.toggle('hidden', !hasExpiry);
  if (expiryDate && hasExpiry) expiryDate.textContent = formatExpiry(sub.expira_en);

  const discount = Number(sub?.pending_discount_percent) || 0;
  discountBox?.classList.toggle('hidden', discount <= 0);
  if (discountEl && discount > 0) discountEl.textContent = `${discount}%`;

  const isDelegate = context.profile?.role === 'delegate';
  const isTrial = sub?.estado === 'trial' && isSubscriptionActive(sub);
  const canCancel = !isDelegate
    && Boolean(sub?.stripe_subscription_id)
    && ['trial', 'active'].includes(sub?.estado)
    && !sub?.cancel_at_period_end;

  trialSummary?.classList.toggle('hidden', !isTrial);
  if (trialSummary && isTrial) {
    const date = formatBillingDate(sub.expira_en);
    trialSummary.innerHTML = `
      <span class="eyebrow">Prueba gratuita activa</span>
      <strong>${trialCountdownText(sub)}</strong>
      <span>No se te cobrará antes del ${date}. Puedes cancelar antes de que termine la prueba.</span>
    `;
  }

  cancelButton?.classList.toggle('hidden', !canCancel);
  if (cancelButton) {
    cancelButton.textContent = sub?.estado === 'trial' ? 'Cancelar antes del primer cobro' : 'Cancelar renovación';
    if (!cancelButton.dataset.bound) {
      cancelButton.dataset.bound = '1';
      cancelButton.addEventListener('click', () => handleCancelSubscription(cancelButton, actionFeedback));
    }
  }

  if (sub?.cancel_at_period_end && actionFeedback) {
    const date = formatBillingDate(sub.expira_en);
    actionFeedback.textContent = sub.estado === 'trial'
      ? `Prueba cancelada. Mantienes acceso hasta el ${date}; no se realizará el primer cobro.`
      : `Renovación cancelada. Mantienes acceso hasta el ${date}.`;
  } else if (actionFeedback) {
    actionFeedback.textContent = '';
  }

  upgrade?.classList.toggle('hidden', isDelegate);
  if (upgrade) upgrade.textContent = '⭐ Ver planes y pagos';
  renderPlansView(root, context);
  renderTodayTrialBanner(root, context);
}

function closePaywall(root = document) {
  const dialog = root.getElementById('cb-paywall-dialog');
  if (!dialog) return;
  dialog.dataset.forced = 'false';
  if (dialog.open) dialog.close();
}

async function openPaywallModal(root = document, { forced = false } = {}) {
  const dialog = root.getElementById('cb-paywall-dialog');
  const body = root.getElementById('cb-paywall-dialog-body');
  if (!dialog || !body) return;
  dialog.dataset.forced = String(Boolean(forced));
  body.innerHTML = renderPaywallModalHTML(currentContext?.subscription, { delegate: currentContext?.profile?.role === 'delegate' });

  const closeButton = dialog.querySelector('[data-close]');
  closeButton?.classList.toggle('hidden', forced);
  closeButton?.addEventListener('click', () => closePaywall(root), { once: true });

  if (!dialog.dataset.cancelGuardBound) {
    dialog.dataset.cancelGuardBound = '1';
    dialog.addEventListener('cancel', (event) => {
      if (dialog.dataset.forced === 'true') event.preventDefault();
    });
  }

  const logout = body.querySelector('#cb-paywall-logout-btn');
  logout?.classList.toggle('hidden', !forced);
  logout?.addEventListener('click', async () => {
    await currentClient?.auth.signOut();
    closePaywall(root);
  });

  body.querySelectorAll('.cb-checkout-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const feedback = body.querySelector('#cb-paywall-payment-feedback');
      const label = button.textContent;
      button.disabled = true;
      button.textContent = 'Abriendo pago…';
      if (feedback) feedback.textContent = '';
      try {
        await startStripeCheckout(currentClient, button.dataset.plan);
      } catch (error) {
        if (feedback) feedback.textContent = error.message || 'No se ha podido abrir el pago.';
      } finally {
        button.disabled = false;
        button.textContent = label;
      }
    });
  });

  const redeemButton = body.querySelector('#cb-paywall-redeem-btn');
  const redeemInput = body.querySelector('#cb-paywall-promo-input');
  const redeemFeedback = body.querySelector('#cb-paywall-promo-feedback');
  redeemButton?.addEventListener('click', async () => {
    const code = redeemInput?.value?.trim();
    if (!code) return;
    redeemButton.disabled = true;
    try {
      const result = await redeemPromoCodeFlow(code);
      if (redeemFeedback) redeemFeedback.textContent = result.message || 'Código aplicado.';
      if (redeemInput) redeemInput.value = '';
      await refreshBillingState();
    } catch (error) {
      if (redeemFeedback) redeemFeedback.textContent = error.message || 'No se ha podido aplicar el código.';
    } finally {
      redeemButton.disabled = false;
    }
  });

  if (!dialog.open && typeof dialog.showModal === 'function') dialog.showModal();
}

async function getProfile(client, userId) {
  const { data, error } = await client
    .from('perfiles')
    .select('id,email,username,full_name,role')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function refreshBillingState() {
  if (!currentClient || typeof document === 'undefined') return null;
  const { data, error } = await currentClient.auth.getSession();
  if (error) throw error;
  const user = data?.session?.user || null;
  if (!user) {
    currentContext = { user: null, profile: null, subscription: null, source: 'none' };
    updateAccountBillingUI(document, currentContext);
    renderPlansView(document, currentContext);
    renderTodayTrialBanner(document, currentContext);
    closePaywall(document);
    return currentContext;
  }

  const [profileResult, subscriptionResult] = await Promise.allSettled([
    getProfile(currentClient, user.id),
    fetchUserSubscription(currentClient, user.id),
  ]);
  const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
  const subscriptionPayload = subscriptionResult.status === 'fulfilled'
    ? subscriptionResult.value
    : { subscription: getCachedSubscription(user.id), source: 'cache' };

  currentContext = {
    user,
    profile,
    subscription: subscriptionPayload.subscription,
    source: subscriptionPayload.source,
  };
  updateAccountBillingUI(document, currentContext);
  renderPlansView(document, currentContext);
  renderTodayTrialBanner(document, currentContext);

  const canUse = formatSubscriptionStatus(currentContext.subscription).canUseApp;
  const subscriptionChecked = currentContext.source === 'server' || Boolean(currentContext.subscription);
  if (subscriptionChecked && !canUse) {
    await openPaywallModal(document, { forced: true });
  } else if (canUse) {
    closePaywall(document);
  }

  window.dispatchEvent(new CustomEvent('campobase:billing-state', { detail: currentContext }));
  return currentContext;
}

function bindBillingEvents(root = document) {
  const upgrade = root.getElementById('cb-account-upgrade-btn');
  if (upgrade && !upgrade.dataset.bound) {
    upgrade.dataset.bound = '1';
    upgrade.addEventListener('click', () => {
      if (window.__campobase?.showView) window.__campobase.showView('planes');
      else document.querySelector('[data-target-view="planes"]')?.click();
    });
  }

  window.addEventListener('campobase:subscription-updated', () => {
    refreshBillingState().catch((error) => console.warn('No se pudo actualizar la suscripción:', error));
  });

  currentClient.auth.onAuthStateChange(() => {
    queueMicrotask(() => refreshBillingState().catch((error) => console.warn('No se pudo actualizar la cuenta:', error)));
  });
}

export async function initBillingManager(client, root = document) {
  if (!client || !root || initialized) return;
  currentClient = client;
  if (!ensureBillingUI(root)) {
    const observer = new MutationObserver(() => {
      if (ensureBillingUI(root)) {
        observer.disconnect();
        initBillingManager(client, root).catch(() => {});
      }
    });
    observer.observe(root.documentElement, { childList: true, subtree: true });
    return;
  }
  initialized = true;
  bindBillingEvents(root);
  await refreshBillingState();

  const params = new URLSearchParams(window.location.search);
  if (params.get('billing') === 'success') {
    await refreshBillingState();
    params.delete('billing');
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', next);
  }
}

export { refreshBillingState, openPaywallModal, updateAccountBillingUI };
