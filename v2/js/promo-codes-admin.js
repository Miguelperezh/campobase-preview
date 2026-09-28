// FASE 2 · Códigos promocionales y regalos
// Integración aislada: la autoridad real reside exclusivamente en Supabase.

import { getCampoBaseSupabaseClient } from './supabase-client.js';

const PROMO_PANEL_ID = 'cb-promo-admin-section';
const REDEEM_PANEL_ID = 'cb-coach-redeem-panel';
const SESSION_ROLE_KEY = 'campobase.sessionRole';
let initialized = false;

const escapeHtml = (value = '') => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\"/g, '&quot;')
  .replace(/'/g, '&#39;');

function appTitle() {
  const title = String(document?.title || '').split('·')[0].trim();
  return title || 'Gestión deportiva';
}

function currentAppUrl() {
  return typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
}

function currentLocalRole() {
  try { return sessionStorage.getItem(SESSION_ROLE_KEY) || ''; }
  catch { return ''; }
}

async function requireAuthenticatedClient() {
  const client = getCampoBaseSupabaseClient();
  if (!client?.rpc || !client?.auth?.getSession) {
    throw new Error('No se puede conectar con tu cuenta en este momento.');
  }
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (!data?.session?.user) {
    throw new Error('Inicia sesión para utilizar esta función.');
  }
  return client;
}

export function generateRandomPromoCode(prefix = 'REGALO') {
  const groups = ['PRO', 'CLUB', 'EQUIPO', 'MISTER', 'COACH'];
  const group = groups[Math.floor(Math.random() * groups.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  const cleanPrefix = String(prefix || 'REGALO').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${cleanPrefix || 'REGALO'}-${group}-${num}`;
}

export function getPromoCodeStatus(code) {
  if (!code || code.activo === false) return 'pausado';
  if (code.expira_en) {
    const exp = new Date(code.expira_en).getTime();
    if (Number.isFinite(exp) && exp < Date.now()) return 'caducado';
  }
  const max = code.max_usos == null ? null : Number(code.max_usos);
  const used = Number(code.usos_actuales) || 0;
  if (max !== null && used >= max) return 'agotado';
  return 'disponible';
}

function statusLabel(code) {
  const status = getPromoCodeStatus(code);
  const max = code.max_usos == null ? '∞' : Number(code.max_usos);
  const used = Number(code.usos_actuales) || 0;
  if (status === 'disponible') return `🟢 Disponible (${used}/${max} usos)`;
  if (status === 'agotado') return `🔥 Agotado (${used}/${max})`;
  if (status === 'caducado') return '⏳ Caducado';
  return '⏸️ Pausado';
}

export async function createPromoCodeRecord({ code, type, discount = 0, months = 0, maxUses = 1, expiresAt = null, description = '' }) {
  const client = await requireAuthenticatedClient();
  const cleanCode = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9\-_]/g, '');
  if (cleanCode.length < 3 || cleanCode.length > 30) throw new Error('El código debe tener entre 3 y 30 caracteres.');
  const { data, error } = await client.rpc('crear_codigo_promocional', {
    p_codigo: cleanCode,
    p_tipo: type,
    p_descuento: Number(discount) || 0,
    p_meses: Number(months) || 0,
    p_max_usos: maxUses == null ? null : Number(maxUses),
    p_expira_en: expiresAt,
    p_descripcion: String(description || '').trim(),
  });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.message || 'No se pudo crear el código.');
  return data;
}

export async function listPromoCodeRecords() {
  const client = await requireAuthenticatedClient();
  const { data, error } = await client.rpc('listar_codigos_promocionales');
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function setPromoCodeActiveState(code, active) {
  const client = await requireAuthenticatedClient();
  const { data, error } = await client.rpc('cambiar_estado_codigo', {
    p_codigo: String(code || '').trim().toUpperCase(),
    p_activo: Boolean(active),
  });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.message || 'No se pudo cambiar el estado del código.');
}

export async function deletePromoCodeRecord(code) {
  const client = await requireAuthenticatedClient();
  const { data, error } = await client.rpc('eliminar_codigo_promocional', {
    p_codigo: String(code || '').trim().toUpperCase(),
  });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.message || 'No se pudo eliminar el código.');
}

export async function redeemPromoCodeFlow(code) {
  const client = await requireAuthenticatedClient();
  const cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode) throw new Error('Introduce un código.');
  const { data, error } = await client.rpc('canjear_codigo_regalo', { p_codigo: cleanCode });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.message || 'Código no válido, caducado o agotado.');
  window.dispatchEvent(new CustomEvent('campobase:subscription-updated', { detail: data.subscription || null }));
  return data;
}

export function buildPromoWhatsAppMessage(promo) {
  if (!promo) return '';
  const name = appTitle();
  const url = currentAppUrl();
  let benefit = 'Acceso Pro vitalicio';
  if (promo.tipo === 'meses_gratis') benefit = `${promo.meses_gratis} meses gratis de acceso Pro`;
  if (promo.tipo === 'descuento_porcentaje') benefit = `${promo.descuento_porcentaje}% de descuento en la suscripción`;
  const limit = promo.max_usos == null ? 'Uso ilimitado' : promo.max_usos === 1 ? '1 solo uso' : `${promo.max_usos} usos`;
  return `⚽ *Código de ${name}*\n\n🎁 *Ventaja:* ${benefit}\n🔑 *Código:* *${promo.codigo}*\n👥 *Límite:* ${limit}\n\n👉 *Cómo canjearlo:*\n1. Abre ${url}\n2. Ve a Ajustes > Canjear código\n3. Introduce *${promo.codigo}* y pulsa Canjear.`;
}

function styles() {
  if (document.getElementById('cb-promo-styles')) return;
  const style = document.createElement('style');
  style.id = 'cb-promo-styles';
  style.textContent = `
    .cb-promo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:.75rem;margin-top:.8rem}
    .cb-promo-card{border:1px solid var(--line,#e2e8f0);border-radius:14px;padding:.8rem;background:var(--card,#fff)}
    .cb-promo-card code{font-weight:900;font-size:.95rem;overflow-wrap:anywhere}
    .cb-promo-status{margin-left:auto}
    .cb-promo-create-box{margin-top:.75rem}
    .cb-promo-list-header{display:flex;align-items:center;justify-content:space-between;gap:.6rem;flex-wrap:wrap;margin-top:1rem}
    .cb-promo-admin-panel.hidden{display:none!important}
    @media(max-width:760px){.cb-promo-grid{grid-template-columns:1fr}.cb-promo-list-header .button-row{width:100%}}
  `;
  document.head.appendChild(style);
}

function adminMarkup() {
  return `
    <article class="panel cb-promo-admin-panel hidden" id="${PROMO_PANEL_ID}">
      <div class="panel-head"><div><h3>🎁 Bonos, regalos y promociones</h3></div></div>
      <form id="cb-create-promo-form" class="cb-promo-create-box">
        <div class="form-row">
          <label>Código promocional<div class="button-row"><input type="text" id="cb-promo-new-code" maxlength="30" required placeholder="Ej. REGALO-CLUB-2026"><button type="button" id="cb-promo-random-btn" class="secondary compact">🎲 Al azar</button></div></label>
          <label>Tipo de beneficio<select id="cb-promo-benefit-type"><option value="vitalicio_regalo">👑 Regalo Pro vitalicio</option><option value="meses_gratis">🗓️ Meses gratis</option><option value="descuento_porcentaje">🏷️ Descuento en %</option></select></label>
        </div>
        <div class="form-row hidden" id="cb-promo-conditional-row">
          <label id="cb-promo-months-field" class="hidden">Meses gratis<select id="cb-promo-months-input"><option value="1">1 mes</option><option value="2">2 meses</option><option value="3" selected>3 meses</option><option value="6">6 meses</option><option value="12">12 meses</option></select></label>
          <label id="cb-promo-discount-field" class="hidden">Descuento<input type="number" id="cb-promo-discount-input" min="1" max="100" step="5" value="50"></label>
        </div>
        <div class="form-row">
          <label>Límite de usos<select id="cb-promo-usage-limit-type"><option value="single">⚡ 1 solo uso</option><option value="custom">👥 Número fijo de usos</option><option value="unlimited">♾️ Ilimitado</option></select></label>
          <label id="cb-promo-custom-uses-field" class="hidden">N.º exacto de usos<input type="number" id="cb-promo-custom-uses" min="1" max="10000" value="5"></label>
          <label>Caducidad<select id="cb-promo-expiry-type"><option value="never">♾️ Sin caducidad</option><option value="date">📅 Con fecha límite</option></select></label>
          <label id="cb-promo-custom-expiry-field" class="hidden">Fecha límite<input type="date" id="cb-promo-expiry-date"></label>
        </div>
        <label>Para quién es / nota interna<input type="text" id="cb-promo-description" maxlength="120" placeholder="Opcional"></label>
        <div class="button-row"><button type="submit" class="primary" id="cb-promo-submit-btn">Crear código</button><span class="meta" id="cb-promo-form-feedback"></span></div>
      </form>
      <div class="cb-promo-list-header"><h4>Códigos creados (<span id="cb-promo-count">0</span>)</h4><div class="button-row"><button type="button" class="secondary compact" id="cb-promo-refresh-btn">🔄 Refrescar</button><select id="cb-promo-filter-status" class="compact"><option value="all">Todos</option><option value="disponible">Disponibles</option><option value="agotado">Agotados</option><option value="caducado">Caducados</option><option value="pausado">Pausados</option></select></div></div>
      <div id="cb-promo-cards-container" class="cb-promo-grid"><p class="meta">Inicia sesión para cargar los códigos.</p></div>
    </article>`;
}

function redeemMarkup() {
  return `
    <article class="panel cb-promo-redeem-panel" id="${REDEEM_PANEL_ID}">
      <h3>🎁 Canjear código de regalo o promoción</h3>
      <p class="meta">Introduce el código recibido.</p>
      <form id="cb-coach-redeem-form"><div class="form-row"><input type="text" id="cb-coach-code-input" maxlength="30" autocomplete="off" placeholder="Introduce tu código" required><button type="submit" class="primary" id="cb-coach-redeem-submit-btn">Canjear código</button></div></form>
      <div id="cb-coach-redeem-feedback" class="meta"></div>
    </article>`;
}

function ensurePanels() {
  styles();
  const grid = document.querySelector('#ajustes .settings-grid');
  if (!grid) return false;
  if (!document.getElementById(PROMO_PANEL_ID)) grid.insertAdjacentHTML('beforeend', adminMarkup());
  if (!document.getElementById(REDEEM_PANEL_ID)) grid.insertAdjacentHTML('beforeend', redeemMarkup());
  return true;
}

export function updatePromoAdminVisibility(isOwner = currentLocalRole() === 'owner') {
  const panel = document.getElementById(PROMO_PANEL_ID);
  if (!panel) return;
  panel.classList.toggle('hidden', !isOwner);
  if (isOwner) renderPromoCodeCardsList().catch(() => {});
}

export async function renderPromoCodeCardsList(filter = document.getElementById('cb-promo-filter-status')?.value || 'all') {
  const target = document.getElementById('cb-promo-cards-container');
  const count = document.getElementById('cb-promo-count');
  if (!target) return;
  let codes;
  try {
    codes = await listPromoCodeRecords();
  } catch (error) {
    target.innerHTML = `<p class="meta">${escapeHtml(error.message)}</p>`;
    if (count) count.textContent = '0';
    return;
  }
  const filtered = codes.filter((item) => filter === 'all' || getPromoCodeStatus(item) === filter);
  if (count) count.textContent = String(filtered.length);
  if (!filtered.length) {
    target.innerHTML = '<p class="meta">No hay códigos con este filtro.</p>';
    return;
  }
  target.innerHTML = filtered.map((item) => {
    const typeLabel = item.tipo === 'meses_gratis' ? `${Number(item.meses_gratis) || 0} meses gratis` : item.tipo === 'descuento_porcentaje' ? `${Number(item.descuento_porcentaje) || 0}% de descuento` : 'Regalo Pro vitalicio';
    const expiry = item.expira_en ? new Date(item.expira_en).toLocaleDateString('es-ES') : 'Sin caducidad';
    const uses = item.max_usos == null ? `${Number(item.usos_actuales) || 0}/∞ usos` : `${Number(item.usos_actuales) || 0}/${Number(item.max_usos)} usos`;
    return `<div class="cb-promo-card" data-code="${escapeHtml(item.codigo)}"><div class="panel-head"><code>${escapeHtml(item.codigo)}</code><span class="meta cb-promo-status">${escapeHtml(statusLabel(item))}</span></div><p><strong>${escapeHtml(typeLabel)}</strong></p>${item.descripcion ? `<p class="meta">👤 ${escapeHtml(item.descripcion)}</p>` : ''}<p class="meta">${escapeHtml(expiry)} · ${escapeHtml(uses)}</p><div class="button-row"><button type="button" class="secondary compact cb-copy-code-btn" data-code="${escapeHtml(item.codigo)}">📋 Código</button><button type="button" class="primary compact cb-copy-wa-btn" data-code="${escapeHtml(item.codigo)}">📱 WhatsApp</button><button type="button" class="secondary compact cb-toggle-active-btn" data-code="${escapeHtml(item.codigo)}" data-active="${item.activo !== false}">${item.activo !== false ? '⏸️ Pausar' : '▶️ Activar'}</button><button type="button" class="secondary compact cb-delete-code-btn" data-code="${escapeHtml(item.codigo)}">🗑️ Eliminar</button></div></div>`;
  }).join('');
}

function setConditionalFields() {
  const type = document.getElementById('cb-promo-benefit-type')?.value;
  document.getElementById('cb-promo-conditional-row')?.classList.toggle('hidden', type === 'vitalicio_regalo');
  document.getElementById('cb-promo-months-field')?.classList.toggle('hidden', type !== 'meses_gratis');
  document.getElementById('cb-promo-discount-field')?.classList.toggle('hidden', type !== 'descuento_porcentaje');
}

function bindEvents() {
  const random = document.getElementById('cb-promo-random-btn');
  random?.addEventListener('click', () => {
    const input = document.getElementById('cb-promo-new-code');
    if (input) { input.value = generateRandomPromoCode(); input.focus(); }
  });

  document.getElementById('cb-promo-benefit-type')?.addEventListener('change', setConditionalFields);
  document.getElementById('cb-promo-usage-limit-type')?.addEventListener('change', (event) => {
    document.getElementById('cb-promo-custom-uses-field')?.classList.toggle('hidden', event.currentTarget.value !== 'custom');
  });
  document.getElementById('cb-promo-expiry-type')?.addEventListener('change', (event) => {
    document.getElementById('cb-promo-custom-expiry-field')?.classList.toggle('hidden', event.currentTarget.value !== 'date');
  });

  document.getElementById('cb-create-promo-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = document.getElementById('cb-promo-form-feedback');
    try {
      if (feedback) feedback.textContent = 'Guardando…';
      const type = document.getElementById('cb-promo-benefit-type')?.value || 'vitalicio_regalo';
      const usageType = document.getElementById('cb-promo-usage-limit-type')?.value || 'single';
      const expiryType = document.getElementById('cb-promo-expiry-type')?.value || 'never';
      let maxUses = 1;
      if (usageType === 'custom') maxUses = Number(document.getElementById('cb-promo-custom-uses')?.value) || 1;
      if (usageType === 'unlimited') maxUses = null;
      let expiresAt = null;
      if (expiryType === 'date') {
        const raw = document.getElementById('cb-promo-expiry-date')?.value;
        if (raw) {
          const [year, month, day] = raw.split('-').map(Number);
          expiresAt = new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
        }
      }
      await createPromoCodeRecord({
        code: document.getElementById('cb-promo-new-code')?.value,
        type,
        discount: type === 'descuento_porcentaje' ? Number(document.getElementById('cb-promo-discount-input')?.value) || 0 : 0,
        months: type === 'meses_gratis' ? Number(document.getElementById('cb-promo-months-input')?.value) || 0 : 0,
        maxUses,
        expiresAt,
        description: document.getElementById('cb-promo-description')?.value || '',
      });
      if (feedback) feedback.textContent = 'Código creado.';
      event.currentTarget.reset();
      setConditionalFields();
      await renderPromoCodeCardsList();
    } catch (error) {
      if (feedback) feedback.textContent = error.message;
    }
  });

  document.getElementById('cb-promo-refresh-btn')?.addEventListener('click', () => renderPromoCodeCardsList());
  document.getElementById('cb-promo-filter-status')?.addEventListener('change', () => renderPromoCodeCardsList());

  document.getElementById('cb-promo-cards-container')?.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const code = button.dataset.code;
    try {
      if (button.classList.contains('cb-copy-code-btn')) {
        await navigator.clipboard.writeText(code);
        return;
      }
      if (button.classList.contains('cb-copy-wa-btn')) {
        const items = await listPromoCodeRecords();
        const promo = items.find((item) => item.codigo === code);
        await navigator.clipboard.writeText(buildPromoWhatsAppMessage(promo));
        return;
      }
      if (button.classList.contains('cb-toggle-active-btn')) {
        await setPromoCodeActiveState(code, button.dataset.active !== 'true');
        await renderPromoCodeCardsList();
        return;
      }
      if (button.classList.contains('cb-delete-code-btn')) {
        if (!window.confirm(`¿Eliminar el código ${code}? Los códigos con canjes registrados deben pausarse para conservar su historial.`)) return;
        await deletePromoCodeRecord(code);
        await renderPromoCodeCardsList();
      }
    } catch (error) {
      window.alert(error.message);
    }
  });

  document.getElementById('cb-coach-redeem-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = document.getElementById('cb-coach-redeem-feedback');
    const button = document.getElementById('cb-coach-redeem-submit-btn');
    try {
      if (button) button.disabled = true;
      const result = await redeemPromoCodeFlow(document.getElementById('cb-coach-code-input')?.value);
      if (feedback) feedback.textContent = result.message || 'Código canjeado correctamente.';
      event.currentTarget.reset();
    } catch (error) {
      if (feedback) feedback.textContent = error.message;
    } finally {
      if (button) button.disabled = false;
    }
  });

  document.querySelectorAll('[data-view="ajustes"]').forEach((button) => button.addEventListener('click', () => setTimeout(() => updatePromoAdminVisibility(), 0)));
  const roleLabel = document.getElementById('role-label');
  if (roleLabel) new MutationObserver(() => updatePromoAdminVisibility()).observe(roleLabel, { childList: true, characterData: true, subtree: true });
}

export function initPromoCodesAdminUI() {
  if (initialized) return;
  const start = () => {
    if (!ensurePanels()) return false;
    bindEvents();
    setConditionalFields();
    updatePromoAdminVisibility();
    initialized = true;
    return true;
  };
  if (start()) return;
  const observer = new MutationObserver(() => {
    if (start()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPromoCodesAdminUI, { once: true });
  else initPromoCodesAdminUI();
}
