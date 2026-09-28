import {
  bootstrapUserDatabase,
  claimLegacyOwner,
  clearBoundSaasUserId,
  getBoundSaasUserId,
  getCurrentProfile,
  getCurrentSession,
  legacyOwnerClaimAvailable,
  loginWithEmailOrUsername,
  migrateLegacyDatabaseToUser,
  registerCoachAccount,
  sendPasswordResetEmail,
  setBoundSaasUserId,
  signInWithCampoBasePin,
  updatePassword,
} from './auth-manager.js';
import { PLAN_PRICES, planFeaturesHTML } from './plan-catalog.js';
import { verifyPin } from './domain.js';
import { CLOUD_TABLES } from './sync-core.js';

let initialized = false;
let localPinMode = false;
let pendingSession = null;
let pendingProfile = null;
let pendingRememberDevice = false;
let pendingDevicePin = '';
let pendingPromoFeedback = '';
let pendingPreferredPlan = '';
let recoveryMode = false;

const REMEMBERED_ACCOUNT_KEY = 'campobase.rememberedAccount.v1';
const ACTIVE_BROWSER_SESSION_KEY = 'campobase.saasActiveBrowserSession';
const PENDING_PROMO_KEY = 'campobase.pendingPromo.v1';
const PENDING_PLAN_KEY = 'campobase.pendingPlan.v1';
const $ = (selector, root = document) => root.querySelector(selector);

function readJson(storage, key) {
  try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; }
}

function writeJson(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)); } catch { /* El acceso seguirá funcionando sin recordar el dispositivo. */ }
}

function removeStored(storage, key) {
  try { storage.removeItem(key); } catch { /* Sin almacenamiento disponible. */ }
}

function rememberedAccount() {
  const item = readJson(localStorage, REMEMBERED_ACCOUNT_KEY);
  return item && item.userId && item.pinHash && item.pinSalt ? item : null;
}

function browserSessionIsActive(userId = '') {
  try { return Boolean(userId && sessionStorage.getItem(ACTIVE_BROWSER_SESSION_KEY) === String(userId)); }
  catch { return false; }
}

function markBrowserSessionActive(userId) {
  try { sessionStorage.setItem(ACTIVE_BROWSER_SESSION_KEY, String(userId || '')); } catch { /* Sin bloqueo adicional. */ }
}

function clearBrowserSessionActive() {
  try { sessionStorage.removeItem(ACTIVE_BROWSER_SESSION_KEY); } catch { /* Sin estado que limpiar. */ }
}

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function deriveDevicePinHash(pin, saltBase64) {
  if (!globalThis.crypto?.subtle) throw new Error('Este dispositivo no permite guardar el acceso con PIN.');
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(String(pin)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt: base64ToBytes(saltBase64),
    iterations: 120000,
    hash: 'SHA-256',
  }, key, 256);
  return bytesToBase64(new Uint8Array(bits));
}

async function saveRememberedAccount(user, profile, pin) {
  const cleanPin = String(pin || '').trim();
  if (!/^\d{4,8}$/.test(cleanPin)) throw new Error('Para recordar esta cuenta, crea un PIN de 4 a 8 cifras para este dispositivo.');
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const pinSalt = bytesToBase64(saltBytes);
  const pinHash = await deriveDevicePinHash(cleanPin, pinSalt);
  writeJson(localStorage, REMEMBERED_ACCOUNT_KEY, {
    userId: user.id,
    email: user.email || profile?.email || '',
    username: profile?.username || user?.user_metadata?.username || '',
    label: profile?.full_name || profile?.username || user.email || 'Cuenta recordada',
    pinSalt,
    pinHash,
    savedAt: Date.now(),
  });
}

async function verifyRememberedPin(account, pin) {
  const cleanPin = String(pin || '').trim();
  if (!/^\d{4,8}$/.test(cleanPin)) return false;
  const actual = await deriveDevicePinHash(cleanPin, account.pinSalt);
  return actual === account.pinHash;
}

function pendingPromoFor(email = '') {
  const item = readJson(localStorage, PENDING_PROMO_KEY);
  if (!item?.code) return '';
  if (item.email && email && String(item.email).toLocaleLowerCase('es') !== String(email).toLocaleLowerCase('es')) return '';
  return String(item.code).trim().toUpperCase();
}

function savePendingPromo(email, code) {
  const clean = String(code || '').trim().toUpperCase();
  if (!clean) return;
  writeJson(localStorage, PENDING_PROMO_KEY, { email: String(email || '').trim().toLocaleLowerCase('es'), code: clean, savedAt: Date.now() });
}

function pendingPlanFor(email = '') {
  const item = readJson(localStorage, PENDING_PLAN_KEY);
  if (!item?.plan || !['monthly', 'annual'].includes(item.plan)) return '';
  if (item.email && email && String(item.email).toLocaleLowerCase('es') !== String(email).toLocaleLowerCase('es')) return '';
  return item.plan;
}

function savePendingPlan(email, plan) {
  if (!['monthly', 'annual'].includes(plan)) return;
  writeJson(localStorage, PENDING_PLAN_KEY, {
    email: String(email || '').trim().toLocaleLowerCase('es'),
    plan,
    savedAt: Date.now(),
  });
}

function clearPendingPlan() {
  removeStored(localStorage, PENDING_PLAN_KEY);
  pendingPreferredPlan = '';
}


async function redeemPromoIfPresent(code) {
  const clean = String(code || '').trim().toUpperCase();
  if (!clean) return '';
  try {
    const { redeemPromoCodeFlow } = await import('./promo-codes-admin.js?v=4');
    const result = await redeemPromoCodeFlow(clean);
    removeStored(localStorage, PENDING_PROMO_KEY);
    return result?.message || 'Código aplicado correctamente.';
  } catch (error) {
    removeStored(localStorage, PENDING_PROMO_KEY);
    return `El código no se pudo aplicar: ${error?.message || 'código no válido'}. Puedes volver a probarlo desde Ajustes.`;
  }
}

function installStyles() {
  if ($('#cb-saas-auth-style-v2')) return;
  const style = document.createElement('style');
  style.id = 'cb-saas-auth-style-v2';
  style.textContent = `
    #auth-dialog.auth-dialog{width:min(96vw,1080px);max-width:1080px;max-height:min(94vh,900px);overflow:auto}
    #saas-auth-shell{display:grid;gap:1rem;width:100%}
    #saas-auth-shell.hidden,#auth-form.hidden{display:none!important}
    .cb-auth-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.5rem;margin:0 0 .25rem}
    .cb-auth-tab{min-height:44px;border-radius:12px}
    .cb-auth-tab.active{background:var(--cb-brand,var(--cb-pitch-600,#173f35));color:#fff;border-color:transparent}
    .cb-auth-pane{display:grid;gap:.9rem;width:100%}
    .cb-auth-pane.hidden{display:none!important}
    .cb-auth-pane h2{margin:0}.cb-auth-pane .meta{margin:0}
    .cb-auth-pane label{display:grid;gap:.35rem;width:100%;min-width:0}
    .cb-auth-pane input,.cb-auth-pane select,.cb-auth-pane textarea{width:100%;min-width:0;min-height:46px}
    .cb-auth-pane .form-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem;width:100%}
    .cb-auth-actions{display:flex;gap:.55rem;flex-wrap:wrap;align-items:center}
    .cb-auth-actions>button{flex:1 1 170px}
    .cb-auth-message{min-height:1.2em;margin:0}.cb-auth-message.success{color:var(--cb-pitch-700,#166534)}
    .cb-auth-account{padding:1rem;border:1px solid var(--cb-slate-200,#e2e8f0);border-radius:14px;background:var(--cb-slate-50,#f8fafc)}
    .cb-auth-claim{padding:.95rem;border:1px solid color-mix(in srgb,var(--cb-brand,#173f35) 24%,transparent);border-radius:14px}
    .cb-auth-inline{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.6rem;align-items:end}
    .cb-auth-local-back{width:100%;margin-top:.65rem}
    .cb-auth-remember{display:grid;gap:.65rem;padding:.8rem;border:1px solid var(--line,#e2e8f0);border-radius:12px;background:color-mix(in srgb,var(--card,#fff) 94%,var(--cb-brand,#173f35) 6%)}
    .cb-auth-check{display:flex!important;grid-template-columns:none!important;align-items:center;gap:.55rem!important;font-weight:700;cursor:pointer}
    .cb-auth-check input{width:18px!important;min-height:18px!important;flex:0 0 18px}
    .cb-device-pin-wrap.hidden{display:none!important}
    .cb-remembered-card{display:grid;gap:.85rem;padding:1rem;border:1px solid color-mix(in srgb,var(--cb-brand,#173f35) 28%,var(--line,#e2e8f0));border-radius:15px;background:var(--card,#fff)}
    .cb-remembered-account{font-weight:800;font-size:1.02rem;overflow-wrap:anywhere}
    .cb-promo-optional{padding:.75rem;border:1px dashed color-mix(in srgb,var(--cb-brand,#173f35) 32%,var(--line,#e2e8f0));border-radius:12px}
    .cb-auth-plans-intro{padding:1rem;border:1px solid var(--line,#e2e8f0);border-radius:14px;background:var(--card,#fff)}
    .cb-auth-plans-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}
    .cb-auth-plan-card{display:grid;gap:.55rem;padding:1rem;border:1px solid var(--line,#e2e8f0);border-radius:14px;background:var(--card,#fff)}
    .cb-auth-plan-card.featured{border-width:2px;border-color:var(--cb-brand,var(--cb-pitch-600,#173f35))}
    .cb-auth-plan-price{font-size:1.35rem;margin:.1rem 0}
    .cb-auth-plan-price strong{font-size:1.65rem}
    #saas-public-plans .cb-feature-groups{grid-template-columns:1fr!important}
    #saas-public-plans .cb-plan-features{grid-template-columns:1fr!important}
    #saas-public-plans .cb-auth-plans-grid{grid-template-columns:1fr!important}
    #saas-public-plans .cb-feature-group{min-width:0}
    #saas-public-plans .cb-plan-features li span:last-child{word-break:normal!important;overflow-wrap:normal!important;hyphens:none!important}
    .cb-plan-features{display:grid;grid-template-columns:1fr;gap:.42rem;padding:0;margin:.7rem 0 0;list-style:none}
    .cb-plan-features li{display:flex;align-items:flex-start;gap:.45rem;min-width:0;font-size:.92rem;line-height:1.4;font-weight:650;word-break:normal;overflow-wrap:normal;hyphens:none}
    .cb-plan-features li>span:first-child{font-weight:900;color:var(--cb-brand,var(--cb-pitch-600,#173f35))}
    .cb-account-plan-choice{display:grid;gap:.8rem;padding:.9rem;border:1px solid var(--line,#e2e8f0);border-radius:14px;background:var(--card,#fff)}
    .cb-account-plan-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem}
    .cb-access-rule{display:grid;gap:.7rem;padding:1rem;border:1px solid var(--line,#e2e8f0);border-radius:14px;background:var(--cb-slate-50,#f8fafc)}
    .cb-access-flow{display:grid;gap:.55rem;margin:0;padding:0;list-style:none}
    .cb-access-flow li{display:grid;grid-template-columns:34px minmax(0,1fr);gap:.7rem;align-items:start;padding:.72rem .8rem;border:1px solid var(--line,#e2e8f0);border-radius:12px;background:var(--card,#fff)}
    .cb-access-flow b,.cb-access-flow small{display:block}.cb-access-flow b{font-size:.94rem;line-height:1.3}.cb-access-flow small{margin-top:.16rem;font-size:.82rem;line-height:1.4;color:var(--muted,#64748b)}
    .cb-access-number{display:grid;place-items:center;width:30px;height:30px;border-radius:999px;background:var(--cb-slate-900,#0f172a);color:#fff;font-weight:900}
    .cb-access-blocked{margin:0;padding-top:.7rem;border-top:1px solid var(--line,#e2e8f0);font-weight:800;line-height:1.45}
    @media(max-width:900px){
      #saas-public-plans .cb-feature-groups{grid-template-columns:1fr}
      #saas-public-plans .cb-plan-features{grid-template-columns:1fr}
    }
    @media(max-width:700px){
      #auth-dialog.auth-dialog{width:calc(100vw - 18px);max-height:calc(100vh - 18px);padding:1rem}
      .cb-auth-pane .form-row,.cb-auth-inline,.cb-auth-plans-grid,.cb-account-plan-actions,.cb-plan-features{grid-template-columns:1fr}
      .cb-auth-actions>button{flex-basis:100%}
    }
  `;
  document.head.appendChild(style);
}

function rememberBlock(context) {
  const id = context === 'register' ? 'saas-register-remember-device' : 'saas-remember-device';
  const pinId = context === 'register' ? 'saas-register-device-pin-wrap' : 'saas-device-pin-wrap';
  return `
    <div class="cb-auth-remember">
      <label class="cb-auth-check"><input id="${id}" name="rememberDevice" type="checkbox"> Recordar esta cuenta en este dispositivo</label>
      <p class="meta">Si la guardas, la próxima vez podrás entrar introduciendo solo el PIN de este dispositivo.</p>
      <label id="${pinId}" class="cb-device-pin-wrap hidden">PIN para este dispositivo
        <input name="devicePin" type="password" inputmode="numeric" minlength="4" maxlength="8" autocomplete="off" placeholder="4 a 8 cifras">
      </label>
    </div>`;
}

function shellMarkup() {
  return `
    <div id="saas-auth-shell">
      <div class="cb-auth-tabs" role="tablist" aria-label="Acceso">
        <button type="button" id="saas-tab-login" class="secondary cb-auth-tab active" role="tab" aria-selected="true">Iniciar sesión</button>
        <button type="button" id="saas-tab-register" class="secondary cb-auth-tab" role="tab" aria-selected="false">Crear cuenta</button>
        <button type="button" id="saas-tab-plans" class="secondary cb-auth-tab" role="tab" aria-selected="false">Planes</button>
      </div>

      <form id="saas-login-form" class="cb-auth-pane">
        <h2>Iniciar sesión</h2>
        <p class="meta">Accede a tu equipo desde cualquier dispositivo.</p>
        <label>Correo electrónico o @usuario
          <input name="identifier" type="text" minlength="3" maxlength="100" autocomplete="username" placeholder="correo@ejemplo.com o @usuario" required>
        </label>
        <label>Contraseña
          <input name="password" type="password" minlength="6" maxlength="100" autocomplete="current-password" required>
        </label>
        ${rememberBlock('login')}
        <p id="saas-login-message" class="cb-auth-message error" role="alert"></p>
        <div class="cb-auth-actions">
          <button class="primary" type="submit">Entrar</button>
          <button type="button" id="saas-demo-btn" class="secondary">Modo Demo</button>
        </div>
        <div class="cb-auth-actions">
          <button type="button" id="saas-forgot-btn" class="ghost compact">¿Olvidaste la contraseña?</button>
          <button type="button" id="saas-local-pin-btn" class="ghost compact">Acceder con PIN de CampoBase</button>
        </div>
      </form>

      <form id="saas-register-form" class="cb-auth-pane hidden">
        <h2>Crear cuenta de entrenador</h2>
        <p class="meta">Crea tu espacio de equipo. Cada cuenta mantiene sus datos separados.</p>
        <div class="form-row">
          <label>Nombre y apellidos<input name="fullName" type="text" maxlength="80" autocomplete="name" required></label>
          <label>Club o equipo<input name="clubName" type="text" maxlength="80" placeholder="Opcional"></label>
        </div>
        <div class="form-row">
          <label>Nombre de usuario<input name="username" type="text" minlength="3" maxlength="30" autocomplete="username" placeholder="usuario" required></label>
          <label>Correo electrónico<input name="email" type="email" maxlength="120" autocomplete="email" required></label>
        </div>
        <label>Contraseña<input name="password" type="password" minlength="6" maxlength="100" autocomplete="new-password" required></label>
        <label class="cb-promo-optional">¿Tienes un código de regalo o descuento? <span class="meta">(opcional)</span>
          <input name="promoCode" type="text" maxlength="30" autocomplete="off" placeholder="Introduce aquí tu código">
        </label>
        ${rememberBlock('register')}
        <p id="saas-register-message" class="cb-auth-message error" role="alert"></p>
        <div class="cb-auth-actions"><button class="primary" type="submit">Crear cuenta</button></div>
      </form>

      <section id="saas-public-plans" class="cb-auth-pane hidden" aria-labelledby="saas-plans-title">
        <div class="cb-auth-plans-intro">
          <h2 id="saas-plans-title">Planes CampoBase</h2>
          <p class="meta">Puedes consultar precios y todo lo incluido antes de crear tu cuenta. El pago se asocia después a una cuenta identificada para que quede ligado al equipo correcto.</p>
        </div>
        <div class="cb-auth-plans-grid">
          <article class="cb-auth-plan-card">
            <h3>Plan mensual</h3>
            <p class="cb-auth-plan-price"><strong>${PLAN_PRICES.monthly.shortPrice}</strong> / mes</p>
            <p class="meta">Mismas funciones Pro, pago mes a mes.</p>
            <button type="button" class="primary cb-public-plan-register" data-plan="monthly">Crear cuenta · Mensual</button>
          </article>
          <article class="cb-auth-plan-card featured">
            <span class="eyebrow">Mejor precio anual</span>
            <h3>Plan anual</h3>
            <p class="cb-auth-plan-price"><strong>${PLAN_PRICES.annual.shortPrice}</strong> / año</p>
            <p class="meta">Todas las funciones durante 12 meses.</p>
            <button type="button" class="primary cb-public-plan-register" data-plan="annual">Crear cuenta · Anual</button>
          </article>
        </div>
        <article class="cb-auth-plans-intro">
          <h3>Todo CampoBase incluido</h3>
          ${planFeaturesHTML()}
        </article>
        <div class="cb-access-rule">
          <strong>Acceso a CampoBase</strong>
          <ol class="cb-access-flow">
            <li><span class="cb-access-number">1</span><div><b>Crea tu cuenta</b><small>Empiezas con 14 días de acceso completo gratis.</small></div></li>
            <li><span class="cb-access-number">2</span><div><b>Usa la prueba</b><small>Durante esos 14 días puedes utilizar todas las funciones.</small></div></li>
            <li><span class="cb-access-number">3</span><div><b>Después de la prueba</b><small>Necesitas un plan mensual/anual o un código de regalo válido.</small></div></li>
          </ol>
          <p class="cb-access-blocked">Sin prueba activa, código gratuito válido o suscripción pagada, no se puede entrar a los datos del equipo.</p>
        </div>
      </section>

      <section id="saas-remembered-pane" class="cb-auth-pane hidden cb-remembered-card" aria-live="polite">
        <h2>Cuenta recordada</h2>
        <p id="saas-remembered-label" class="cb-remembered-account"></p>
        <p class="meta">Introduce tu PIN de CampoBase. Se comprueba con la configuración de tu cuenta en Supabase.</p>
        <form id="saas-remembered-pin-form" class="cb-auth-pane">
          <label>PIN<input name="pin" type="password" inputmode="numeric" minlength="4" maxlength="8" autocomplete="off" required autofocus></label>
          <p id="saas-remembered-message" class="cb-auth-message error" role="alert"></p>
          <div class="cb-auth-actions">
            <button class="primary" type="submit">Entrar</button>
            <button type="button" id="saas-remembered-other" class="secondary">Usar otra cuenta</button>
          </div>
        </form>
      </section>

      <section id="saas-account-choice" class="cb-auth-pane hidden cb-auth-account" aria-live="polite">
        <h2>Cuenta preparada</h2>
        <p id="saas-account-label" class="meta"></p>
        <p id="saas-account-promo-message" class="cb-auth-message" role="status"></p>
        <div id="saas-account-plan-choice" class="cb-account-plan-choice hidden">
          <div>
            <strong id="saas-account-plan-status">Comprobando plan…</strong>
            <p id="saas-account-plan-help" class="meta"></p>
          </div>
          <div class="cb-account-plan-actions">
            <button type="button" class="secondary saas-account-checkout" data-plan="monthly">Mensual · ${PLAN_PRICES.monthly.shortPrice}</button>
            <button type="button" class="primary saas-account-checkout" data-plan="annual">Anual · ${PLAN_PRICES.annual.shortPrice}</button>
          </div>
          <p id="saas-account-plan-message" class="cb-auth-message" role="status"></p>
        </div>
        <div id="saas-claim-offer" class="cb-auth-claim hidden">
          <strong>¿Ya usabas esta aplicación con tus datos actuales?</strong>
          <p class="meta">Puedes vincularlos a esta cuenta introduciendo tu PIN actual. Si esta es una cuenta nueva, entra normalmente.</p>
          <form id="saas-claim-form">
            <div class="cb-auth-inline">
              <label>PIN actual<input name="pin" type="password" inputmode="numeric" minlength="4" maxlength="8" autocomplete="current-password"></label>
              <button class="primary" type="submit">Vincular datos</button>
            </div>
            <p id="saas-claim-message" class="cb-auth-message error" role="alert"></p>
          </form>
        </div>
        <div class="cb-auth-actions">
          <button type="button" id="saas-enter-account" class="primary">Entrar a esta cuenta</button>
          <button type="button" id="saas-cancel-account" class="secondary">Usar otra cuenta</button>
        </div>
      </section>

      <form id="saas-password-update-form" class="cb-auth-pane hidden">
        <h2>Crear nueva contraseña</h2>
        <p class="meta">Escribe la nueva contraseña para tu cuenta.</p>
        <label>Nueva contraseña<input name="password" type="password" minlength="6" maxlength="100" autocomplete="new-password" required></label>
        <label>Repetir contraseña<input name="password2" type="password" minlength="6" maxlength="100" autocomplete="new-password" required></label>
        <p id="saas-password-message" class="cb-auth-message error" role="alert"></p>
        <div class="cb-auth-actions"><button class="primary" type="submit">Guardar contraseña</button></div>
      </form>
    </div>`;
}

function injectShell() {
  const dialog = $('#auth-dialog');
  const legacyForm = $('#auth-form');
  if (!dialog || !legacyForm || $('#saas-auth-shell')) return;
  legacyForm.insertAdjacentHTML('beforebegin', shellMarkup());
  const back = document.createElement('button');
  back.type = 'button';
  back.id = 'saas-local-back';
  back.className = 'secondary compact cb-auth-local-back';
  back.textContent = 'Volver a correo y contraseña';
  legacyForm.appendChild(back);
}

function setMessage(selector, message = '', success = false) {
  const element = $(selector);
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('success', Boolean(success));
  element.classList.toggle('error', !success);
}

function showPane(name) {
  localPinMode = false;
  $('#auth-form')?.classList.add('hidden');
  $('#saas-auth-shell')?.classList.remove('hidden');
  const panes = {
    login: $('#saas-login-form'),
    register: $('#saas-register-form'),
    plans: $('#saas-public-plans'),
    remembered: $('#saas-remembered-pane'),
    choice: $('#saas-account-choice'),
    password: $('#saas-password-update-form'),
  };
  Object.entries(panes).forEach(([key, pane]) => pane?.classList.toggle('hidden', key !== name));
  $('#saas-tab-login')?.classList.toggle('active', name === 'login');
  $('#saas-tab-register')?.classList.toggle('active', name === 'register');
  $('#saas-tab-plans')?.classList.toggle('active', name === 'plans');
  $('#saas-tab-login')?.setAttribute('aria-selected', String(name === 'login'));
  $('#saas-tab-register')?.setAttribute('aria-selected', String(name === 'register'));
  $('#saas-tab-plans')?.setAttribute('aria-selected', String(name === 'plans'));
  const tabs = $('.cb-auth-tabs');
  if (tabs) tabs.classList.toggle('hidden', ['remembered', 'choice', 'password'].includes(name));
}

function prefillRememberedIdentifier() {
  const account = rememberedAccount();
  const input = $('#saas-login-form')?.elements?.identifier;
  if (account && input && !input.value) input.value = account.email || (account.username ? `@${account.username}` : '');
}

function showLocalPin() {
  localPinMode = true;
  $('#saas-auth-shell')?.classList.add('hidden');
  $('#auth-form')?.classList.remove('hidden');
  if ($('#auth-error')) $('#auth-error').textContent = '';
}

function showRememberedPane(account) {
  showPane('remembered');
  $('#saas-remembered-label').textContent = account.label
    ? `${account.label}${account.email ? ` · ${account.email}` : ''}`
    : (account.email || account.username || 'Cuenta recordada');
  const form = $('#saas-remembered-pin-form');
  if (form) {
    form.reset();
    window.setTimeout(() => form.elements.pin?.focus(), 50);
  }
  setMessage('#saas-remembered-message', '');
}

async function verifyOwnerPinFromSupabase(client, userId, pin) {
  const cleanPin = String(pin || '').trim();
  if (!/^\d{4,8}$/.test(cleanPin) || !userId) return false;
  const { data, error } = await client
    .from(CLOUD_TABLES.settings)
    .select('payload')
    .eq('user_id', userId)
    .eq('id', 'main')
    .limit(1);
  if (error) throw error;
  const settings = data?.[0]?.payload;
  if (!settings?.pinSalt || !settings?.ownerPinHash) return false;
  return verifyPin(cleanPin, settings.pinSalt, settings.ownerPinHash);
}

async function getProfileOrFallback(client, user) {
  return await getCurrentProfile(client, user?.id).catch(() => null) || {
    id: user?.id || '',
    email: user?.email || '',
    username: user?.user_metadata?.username || '',
    full_name: user?.user_metadata?.full_name || '',
    club_name: user?.user_metadata?.club_name || 'Mi equipo',
    role: 'coach',
  };
}

async function activateAccount(user, profile, { migrateLegacy = false } = {}) {
  if (!user?.id) throw new Error('No se ha podido identificar la cuenta.');
  if (migrateLegacy) await migrateLegacyDatabaseToUser(user.id);
  await bootstrapUserDatabase(user.id, profile);
  setBoundSaasUserId(user.id);

  if (pendingRememberDevice) await saveRememberedAccount(user, profile, pendingDevicePin);
  markBrowserSessionActive(user.id);

  const localRole = profile?.role === 'delegate' ? 'delegate' : 'owner';
  try {
    sessionStorage.setItem('campobase.sessionRole', localRole);
    sessionStorage.removeItem('campobase.demoSession');
  } catch { /* La sesión SaaS permanece activa igualmente. */ }
  window.location.reload();
}

async function prepareSignedInChoice(client, data) {
  const user = data?.user || data?.session?.user;
  if (!user) throw new Error('No se ha podido identificar la cuenta.');
  const profile = await getProfileOrFallback(client, user);
  pendingSession = data?.session || (await getCurrentSession(client));
  pendingProfile = profile;

  if (profile.role === 'delegate' && user.user_metadata?.must_set_password) {
    recoveryMode = true;
    showPane('password');
    setMessage('#saas-password-message', 'Crea una contraseña para tu cuenta de delegado.', true);
    return { user, profile, available: false };
  }

  const available = profile.role === 'coach' && await legacyOwnerClaimAvailable(client).catch(() => false);
  $('#saas-account-label').textContent = profile.full_name
    ? `${profile.full_name}${profile.club_name ? ` · ${profile.club_name}` : ''}`
    : (profile.email || user.email || 'Cuenta de entrenador');
  $('#saas-claim-offer')?.classList.toggle('hidden', !available);
  setMessage('#saas-claim-message', '');
  setMessage('#saas-account-promo-message', pendingPromoFeedback, pendingPromoFeedback && !pendingPromoFeedback.startsWith('El código no se pudo'));

  const planBox = $('#saas-account-plan-choice');
  const enterButton = $('#saas-enter-account');
  const isDelegate = profile.role === 'delegate';
  let subscription = null;
  let planStatus = { canUseApp: false, label: 'Sin acceso activo' };

  try {
    const { fetchUserSubscription, formatSubscriptionStatus } = await import('./billing-manager.js?v=1');
    const result = await fetchUserSubscription(client, user.id);
    subscription = result.subscription;
    planStatus = formatSubscriptionStatus(subscription);
  } catch (error) {
    console.warn('No se pudo comprobar el plan antes de entrar:', error);
    planStatus = { canUseApp: false, label: 'No se pudo comprobar el acceso' };
  }

  if (planBox) {
    const shouldShow = !isDelegate;
    planBox.classList.toggle('hidden', !shouldShow);
    if (shouldShow) {
      const statusEl = $('#saas-account-plan-status');
      const helpEl = $('#saas-account-plan-help');
      if (statusEl) statusEl.textContent = planStatus.label || 'Elige tu plan';
      if (helpEl) {
        helpEl.textContent = subscription?.estado === 'trial' && planStatus.canUseApp
          ? 'Tienes acceso completo durante tu prueba gratuita. Puedes entrar ahora o contratar ya mensual/anual.'
          : subscription?.estado === 'gift_free' && planStatus.canUseApp
            ? 'Tu código gratuito está activo. Puedes entrar a CampoBase.'
            : planStatus.canUseApp
              ? 'Tu suscripción está activa. Puedes entrar a CampoBase.'
              : 'No tienes acceso activo. Necesitas una prueba vigente, un código gratuito válido o una suscripción mensual/anual.';
      }
      planBox.querySelectorAll('.saas-account-checkout').forEach((button) => {
        button.classList.toggle('primary', button.dataset.plan === pendingPreferredPlan);
        button.classList.toggle('secondary', button.dataset.plan !== pendingPreferredPlan);
      });
    }
  }

  if (enterButton) {
    const canEnter = Boolean(planStatus.canUseApp);
    enterButton.classList.toggle('hidden', !canEnter);
    enterButton.disabled = !canEnter;
    enterButton.textContent = subscription?.estado === 'trial' && planStatus.canUseApp
      ? 'Continuar con la prueba'
      : 'Entrar a esta cuenta';
  }

  showPane('choice');
  return { user, profile, available, subscription, canEnter: Boolean(planStatus.canUseApp) };
}

function waitForApp(timeoutMs = 12000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (window.__campobase?.state || Date.now() - started > timeoutMs) {
        clearInterval(timer);
        resolve(window.__campobase || null);
      }
    }, 80);
  });
}

async function unlockBoundSession(client) {
  const session = await getCurrentSession(client).catch(() => null);
  const bound = getBoundSaasUserId();
  if (!session?.user || !bound || bound !== session.user.id) return false;
  // Mantiene la autorización de esta pestaña mientras la sesión Supabase siga
  // siendo válida. sessionStorage desaparece al cerrar la pestaña/navegador.
  markBrowserSessionActive(session.user.id);
  const profile = await getProfileOrFallback(client, session.user);
  const app = await waitForApp();
  if (!app?.state) return false;

  const isDelegate = profile.role === 'delegate';
  const isAdmin = profile.role === 'owner' || profile.role === 'admin';
  const localRole = isDelegate ? 'delegate' : 'owner';
  app.state.role = localRole;
  // La cuenta SaaS de delegado usa navegación configurable. No activamos el
  // antiguo "delegate-mode", que seguirá reservado al PIN local limitado.
  app.state.delegateMode = false;
  try { sessionStorage.setItem('campobase.sessionRole', localRole); } catch { /* No bloquea la sesión. */ }
  document.body.classList.remove('auth-locked', 'delegate-mode', 'demo-mode');
  document.documentElement.dataset.saasRole = isAdmin ? 'admin' : (isDelegate ? 'delegate' : 'coach');
  const roleLabel = $('#role-label');
  if (roleLabel) roleLabel.textContent = isAdmin ? 'Administrador' : (isDelegate ? 'Delegado' : 'Entrenador');
  const settingsNav = $('#settings-nav');
  if (settingsNav) settingsNav.hidden = isDelegate;
  $('#demo-team-panel')?.classList.add('hidden');
  try {
    const { initTeamAccess } = await import('./team-access.js?v=20260924-v59-delegate-views-visible-render-fix');
    await initTeamAccess(client);
  } catch (error) {
    console.warn('No se pudo aplicar el acceso del equipo:', error);
  }

  // Al recuperar una sesión SaaS válida, cierra el diálogo primero y refresca inmediatamente desde Supabase.
  // No dejamos la interfaz abierta con una IndexedDB vacía esperando al intervalo.
  const dialog = $('#auth-dialog');
  if (dialog?.open) dialog.close();
  if (typeof app.synchronizeCloud === 'function') await app.synchronizeCloud();
  if (typeof app.refresh === 'function') await app.refresh();
  if (typeof app.renderAll === 'function') app.renderAll();
  return true;
}

async function handlePersistentSession(client) {
  const session = await getCurrentSession(client).catch(() => null);
  if (!session?.user) return false;
  let bound = getBoundSaasUserId();
  if (!bound) {
    setBoundSaasUserId(session.user.id);
    bound = session.user.id;
  }
  const remembered = rememberedAccount();
  if (bound !== session.user.id) return false;
  if (browserSessionIsActive(session.user.id) || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('campobase.sessionRole'))) {
    markBrowserSessionActive(session.user.id);
    return unlockBoundSession(client);
  }
  if (remembered?.userId === session.user.id) {
    showRememberedPane(remembered);
    return true;
  }

  // Conserva la sesión válida para que la sincronización pueda recuperar
  // los datos del equipo. Cuando los PIN ya han llegado desde la base del
  // usuario, pedimos el PIN local en lugar de cerrar sesión y dejar una
  // base vacía. Si no llegan, mostramos la cuenta preparada como fallback.
  const app = await waitForApp();
  const started = Date.now();
  while (app?.state && Date.now() - started < 6000) {
    if (app.state.settings?.ownerPinHash && app.state.settings?.delegatePinHash) {
      const dialog = $('#auth-dialog');
      if (dialog && !dialog.open) dialog.showModal();
      showLocalPin();
      return true;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 120));
  }

  await prepareSignedInChoice(client, { session, user: session.user });
  return true;
}

function wireRememberToggle(formSelector, checkboxSelector, wrapSelector) {
  const form = $(formSelector);
  const checkbox = $(checkboxSelector);
  const wrap = $(wrapSelector);
  if (!form || !checkbox || !wrap) return;
  const sync = () => {
    wrap.classList.toggle('hidden', !checkbox.checked);
    if (!checkbox.checked && form.elements.devicePin) form.elements.devicePin.value = '';
    if (form.elements.devicePin) form.elements.devicePin.required = checkbox.checked;
  };
  checkbox.addEventListener('change', sync);
  sync();
}

function bindEvents(client) {
  $('#saas-tab-login')?.addEventListener('click', () => { showPane('login'); prefillRememberedIdentifier(); });
  $('#saas-tab-register')?.addEventListener('click', () => showPane('register'));
  $('#saas-tab-plans')?.addEventListener('click', () => showPane('plans'));
  document.querySelectorAll('.cb-public-plan-register').forEach((button) => {
    button.addEventListener('click', () => {
      pendingPreferredPlan = button.dataset.plan || '';
      showPane('register');
      const form = $('#saas-register-form');
      if (form) form.dataset.preferredPlan = pendingPreferredPlan;
    });
  });
  document.querySelectorAll('.saas-account-checkout').forEach((button) => {
    button.addEventListener('click', async () => {
      const user = pendingSession?.user;
      if (!user) return showPane('login');
      const message = $('#saas-account-plan-message');
      const original = button.textContent;
      button.disabled = true;
      button.textContent = 'Abriendo Stripe…';
      setMessage('#saas-account-plan-message', '');
      try {
        const { startStripeCheckout } = await import('./billing-manager.js?v=1');
        pendingPreferredPlan = button.dataset.plan || '';
        savePendingPlan(user.email || '', pendingPreferredPlan);
        await startStripeCheckout(client, pendingPreferredPlan);
      } catch (error) {
        setMessage('#saas-account-plan-message', error.message || 'No se pudo abrir el pago.');
        button.disabled = false;
        button.textContent = original;
      }
      if (message) message.classList.remove('success');
    });
  });
  $('#saas-local-pin-btn')?.addEventListener('click', showLocalPin);
  $('#saas-local-back')?.addEventListener('click', () => { showPane('login'); prefillRememberedIdentifier(); });
  $('#saas-demo-btn')?.addEventListener('click', () => $('#auth-demo-btn')?.click());
  wireRememberToggle('#saas-login-form', '#saas-remember-device', '#saas-device-pin-wrap');
  wireRememberToggle('#saas-register-form', '#saas-register-remember-device', '#saas-register-device-pin-wrap');

  $('#saas-register-form')?.elements?.email?.addEventListener('input', (event) => {
    const username = $('#saas-register-form')?.elements?.username;
    if (!username || username.dataset.manual === '1' || username.value) return;
    const local = String(event.target.value || '').split('@')[0].toLocaleLowerCase('es').replace(/[^a-z0-9._-]/g, '').slice(0, 30);
    if (local.length >= 3) username.value = local;
  });
  $('#saas-register-form')?.elements?.username?.addEventListener('input', (event) => { event.target.dataset.manual = '1'; });

  $('#saas-login-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage('#saas-login-message', 'Entrando…');
    try {
      pendingRememberDevice = Boolean(form.elements.rememberDevice?.checked);
      pendingDevicePin = String(form.elements.devicePin?.value || '').trim();
      if (pendingRememberDevice && !/^\d{4,8}$/.test(pendingDevicePin)) throw new Error('Crea un PIN de 4 a 8 cifras para recordar esta cuenta en este dispositivo.');
      const data = await loginWithEmailOrUsername(client, form.elements.identifier.value, form.elements.password.value);
      pendingPreferredPlan = pendingPlanFor(data?.user?.email || '') || pendingPreferredPlan;
      const storedPromo = pendingPromoFor(data?.user?.email || '');
      pendingPromoFeedback = storedPromo ? await redeemPromoIfPresent(storedPromo) : '';
      setMessage('#saas-login-message', '');
      await prepareSignedInChoice(client, data);
    } catch (error) {
      setMessage('#saas-login-message', error.message || 'No se pudo iniciar sesión.');
    }
  });

  $('#saas-register-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage('#saas-register-message', 'Creando cuenta…');
    try {
      pendingRememberDevice = Boolean(form.elements.rememberDevice?.checked);
      pendingDevicePin = String(form.elements.devicePin?.value || '').trim();
      if (pendingRememberDevice && !/^\d{4,8}$/.test(pendingDevicePin)) throw new Error('Crea un PIN de 4 a 8 cifras para recordar esta cuenta en este dispositivo.');
      const promoCode = String(form.elements.promoCode?.value || '').trim().toUpperCase();
      pendingPreferredPlan = form.dataset.preferredPlan || pendingPreferredPlan || '';
      const data = await registerCoachAccount(client, {
        fullName: form.elements.fullName.value,
        clubName: form.elements.clubName.value,
        username: form.elements.username.value,
        email: form.elements.email.value,
        password: form.elements.password.value,
      });
      if (data?.session?.user) {
        pendingPromoFeedback = promoCode ? await redeemPromoIfPresent(promoCode) : '';
        setMessage('#saas-register-message', '');
        await prepareSignedInChoice(client, data);
      } else {
        if (promoCode) savePendingPromo(form.elements.email.value, promoCode);
        if (pendingPreferredPlan) savePendingPlan(form.elements.email.value, pendingPreferredPlan);
        setMessage('#saas-register-message', promoCode
          ? 'Cuenta creada. Confirma el correo e inicia sesión; el código se aplicará entonces.'
          : 'Cuenta creada. Revisa tu correo para confirmar la cuenta y después inicia sesión.', true);
      }
    } catch (error) {
      setMessage('#saas-register-message', error.message || 'No se pudo crear la cuenta.');
    }
  });

  $('#saas-remembered-pin-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const account = rememberedAccount();
    if (!account?.userId) return setMessage('#saas-remembered-message', 'No se ha podido identificar esta cuenta.');
    setMessage('#saas-remembered-message', 'Comprobando…');
    const enteredPin = event.currentTarget.elements.pin.value;
    let session = await getCurrentSession(client).catch(() => null);

    if (!session?.user || account.userId !== session.user.id) {
      try {
        session = await signInWithCampoBasePin(client, account.userId, enteredPin);
      } catch (error) {
        return setMessage('#saas-remembered-message', error.message || 'PIN incorrecto.');
      }
    } else {
      const deviceOk = await verifyRememberedPin(account, enteredPin).catch(() => false);
      let accountOk = false;
      if (!deviceOk) {
        try {
          accountOk = await verifyOwnerPinFromSupabase(client, session.user.id, enteredPin);
        } catch (error) {
          return setMessage('#saas-remembered-message', error.message || 'No se pudo comprobar el PIN en Supabase.');
        }
      }
      if (!deviceOk && !accountOk) return setMessage('#saas-remembered-message', 'PIN incorrecto.');
    }

    markBrowserSessionActive(session.user.id);
    try { sessionStorage.setItem('campobase.sessionRole', 'owner'); } catch { /* La sesión Supabase sigue siendo válida. */ }
    setMessage('#saas-remembered-message', '');
    await unlockBoundSession(client);
  });

  $('#saas-remembered-other')?.addEventListener('click', async () => {
    removeStored(localStorage, REMEMBERED_ACCOUNT_KEY);
    clearBrowserSessionActive();
    await client.auth.signOut().catch(() => {});
    clearBoundSaasUserId();
    showPane('login');
  });

  $('#saas-forgot-btn')?.addEventListener('click', async () => {
    const identifier = $('#saas-login-form')?.elements.identifier?.value || '';
    setMessage('#saas-login-message', '');
    try {
      await sendPasswordResetEmail(client, identifier);
      setMessage('#saas-login-message', 'Te hemos enviado un enlace para crear una nueva contraseña.', true);
    } catch (error) {
      setMessage('#saas-login-message', error.message || 'No se pudo enviar el enlace.');
    }
  });

  $('#saas-enter-account')?.addEventListener('click', async () => {
    const user = pendingSession?.user;
    if (!user) return showPane('login');
    if ($('#saas-enter-account')?.disabled) return;
    try {
      clearPendingPlan();
      await activateAccount(user, pendingProfile);
    } catch (error) {
      setMessage('#saas-claim-message', error.message || 'No se pudo abrir la cuenta.');
    }
  });

  $('#saas-cancel-account')?.addEventListener('click', async () => {
    await client.auth.signOut().catch(() => {});
    pendingSession = null;
    pendingProfile = null;
    pendingRememberDevice = false;
    pendingDevicePin = '';
    pendingPromoFeedback = '';
    pendingPreferredPlan = '';
    clearBoundSaasUserId();
    clearBrowserSessionActive();
    showPane('login');
    prefillRememberedIdentifier();
  });

  $('#saas-claim-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const user = pendingSession?.user;
    if (!user) return showPane('login');
    setMessage('#saas-claim-message', 'Vinculando datos…');
    try {
      await claimLegacyOwner(client, event.currentTarget.elements.pin.value);
      const profile = await getProfileOrFallback(client, user);
      await activateAccount(user, profile, { migrateLegacy: true });
    } catch (error) {
      setMessage('#saas-claim-message', error.message || 'No se pudieron vincular los datos.');
    }
  });

  $('#saas-password-update-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.elements.password.value !== form.elements.password2.value) {
      return setMessage('#saas-password-message', 'Las dos contraseñas no coinciden.');
    }
    try {
      await updatePassword(client, form.elements.password.value);
      setMessage('#saas-password-message', 'Contraseña actualizada.', true);
      recoveryMode = false;
      const session = await getCurrentSession(client);
      if (session?.user) await prepareSignedInChoice(client, { session, user: session.user });
      else showPane('login');
    } catch (error) {
      setMessage('#saas-password-message', error.message || 'No se pudo cambiar la contraseña.');
    }
  });

  document.addEventListener('click', async (event) => {
    const button = event.target?.closest?.('#logout, #settings-logout');
    if (!button) return;
    const session = await getCurrentSession(client).catch(() => null);
    if (!session?.user || getBoundSaasUserId() !== session.user.id) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    await client.auth.signOut().catch(() => {});
    clearBoundSaasUserId();
    clearBrowserSessionActive();
    removeStored(localStorage, REMEMBERED_ACCOUNT_KEY);
    try {
      sessionStorage.removeItem('campobase.sessionRole');
      sessionStorage.removeItem('campobase.demoSession');
    } catch { /* Sin sesión local que limpiar. */ }
    window.location.reload();
  }, true);

  client.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      recoveryMode = true;
      const dialog = $('#auth-dialog');
      if (dialog && !dialog.open) dialog.showModal();
      showPane('password');
    }
  });
}

function observeDialog(client) {
  const dialog = $('#auth-dialog');
  if (!dialog) return;
  const sync = async () => {
    if (!dialog.open || localPinMode || recoveryMode) return;
    if (await handlePersistentSession(client)) return;
    showPane('login');
    prefillRememberedIdentifier();
  };
  const observer = new MutationObserver(() => { sync().catch(() => { showPane('login'); prefillRememberedIdentifier(); }); });
  observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  window.setTimeout(() => sync().catch(() => { showPane('login'); prefillRememberedIdentifier(); }), 0);
}

export async function initSaasAuth(client) {
  if (initialized || typeof document === 'undefined') return;
  initialized = true;
  installStyles();
  injectShell();
  bindEvents(client);
  prefillRememberedIdentifier();
  observeDialog(client);

  const session = await getCurrentSession(client).catch(() => null);
  let bound = getBoundSaasUserId();
  if (session?.user?.id && !bound) {
    setBoundSaasUserId(session.user.id);
    bound = session.user.id;
  } else if (bound && session?.user && session.user.id !== bound) {
    clearBoundSaasUserId();
    bound = '';
  }

  const activeBrowserRole = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('campobase.sessionRole') : null;

  if (session?.user && bound === session.user.id) {
    if (browserSessionIsActive(session.user.id) || activeBrowserRole) {
      unlockBoundSession(client).catch(() => {});
      return;
    }
    const remembered = rememberedAccount();
    if (remembered?.userId === session.user.id) {
      const dialog = $('#auth-dialog');
      if (dialog && !dialog.open) dialog.showModal();
      showRememberedPane(remembered);
      return;
    }
    handlePersistentSession(client).catch(() => {});
    return;
  }

  if (activeBrowserRole) {
    const dialog = $('#auth-dialog');
    if (dialog?.open) dialog.close();
    document.body.classList.remove('auth-locked');
    const app = await waitForApp();
    if (app?.state) {
      app.state.role = activeBrowserRole;
      try { if (typeof app.renderAll === 'function') app.renderAll(); } catch {}
    }
    return;
  }

  const remembered = rememberedAccount();
  if (remembered?.userId) {
    const dialog = $('#auth-dialog');
    if (dialog && !dialog.open) dialog.showModal();
    showRememberedPane(remembered);
    return;
  }

  // Sin sesión SaaS válida nunca dejamos la app abierta y vacía:
  // mostramos siempre el acceso por cuenta, manteniendo disponible
  // el botón de acceso local con PIN.
  const dialog = $('#auth-dialog');
  if (dialog && !dialog.open) dialog.showModal();
  localPinMode = false;
  showPane('login');
  prefillRememberedIdentifier();
}
