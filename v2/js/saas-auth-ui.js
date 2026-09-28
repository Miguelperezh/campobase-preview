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
  updatePassword,
} from './auth-manager.js';

let initialized = false;
let localPinMode = false;
let pendingSession = null;
let pendingProfile = null;
let recoveryMode = false;

const $ = (selector, root = document) => root.querySelector(selector);

function installStyles() {
  if ($('#cb-saas-auth-style')) return;
  const style = document.createElement('style');
  style.id = 'cb-saas-auth-style';
  style.textContent = `
    #auth-dialog.auth-dialog { width:min(94vw, 560px); max-height:min(92vh, 760px); overflow:auto; }
    #saas-auth-shell { display:grid; gap:1rem; }
    #saas-auth-shell.hidden, #auth-form.hidden { display:none !important; }
    .cb-auth-tabs { display:grid; grid-template-columns:1fr 1fr; gap:.4rem; margin:0 0 .25rem; }
    .cb-auth-tab { min-height:42px; border-radius:12px; }
    .cb-auth-tab.active { background:var(--cb-brand, var(--cb-pitch-600, #173f35)); color:#fff; border-color:transparent; }
    .cb-auth-pane { display:grid; gap:.85rem; }
    .cb-auth-pane.hidden { display:none !important; }
    .cb-auth-pane h2 { margin:0; }
    .cb-auth-pane .meta { margin:0; }
    .cb-auth-actions { display:flex; gap:.55rem; flex-wrap:wrap; align-items:center; }
    .cb-auth-actions > button { flex:1 1 150px; }
    .cb-auth-message { min-height:1.2em; margin:0; }
    .cb-auth-message.success { color:var(--cb-pitch-700, #166534); }
    .cb-auth-account { padding:.85rem; border:1px solid var(--cb-slate-200, #e2e8f0); border-radius:14px; background:var(--cb-slate-50, #f8fafc); }
    .cb-auth-claim { padding:.9rem; border:1px solid color-mix(in srgb, var(--cb-brand, #173f35) 24%, transparent); border-radius:14px; }
    .cb-auth-inline { display:grid; grid-template-columns:1fr auto; gap:.5rem; align-items:end; }
    .cb-auth-local-back { width:100%; margin-top:.65rem; }
    @media (max-width:600px) {
      #auth-dialog.auth-dialog { width:calc(100vw - 18px); max-height:calc(100vh - 18px); padding:1rem; }
      .cb-auth-inline { grid-template-columns:1fr; }
      .cb-auth-actions > button { flex-basis:100%; }
    }
  `;
  document.head.appendChild(style);
}

function shellMarkup() {
  return `
    <div id="saas-auth-shell">
      <div class="cb-auth-tabs" role="tablist" aria-label="Acceso">
        <button type="button" id="saas-tab-login" class="secondary cb-auth-tab active" role="tab" aria-selected="true">Iniciar sesión</button>
        <button type="button" id="saas-tab-register" class="secondary cb-auth-tab" role="tab" aria-selected="false">Crear cuenta</button>
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
        <p id="saas-login-message" class="cb-auth-message error" role="alert"></p>
        <div class="cb-auth-actions">
          <button class="primary" type="submit">Entrar</button>
          <button type="button" id="saas-demo-btn" class="secondary">Modo Demo</button>
        </div>
        <div class="cb-auth-actions">
          <button type="button" id="saas-forgot-btn" class="ghost compact">¿Olvidaste la contraseña?</button>
          <button type="button" id="saas-local-pin-btn" class="ghost compact">Acceso local con PIN</button>
        </div>
      </form>

      <form id="saas-register-form" class="cb-auth-pane hidden">
        <h2>Crear cuenta de entrenador</h2>
        <p class="meta">Crea tu espacio de equipo. Cada cuenta mantiene sus datos separados.</p>
        <div class="form-row">
          <label>Nombre y apellidos
            <input name="fullName" type="text" maxlength="80" autocomplete="name" required>
          </label>
          <label>Club o equipo
            <input name="clubName" type="text" maxlength="80" placeholder="Opcional">
          </label>
        </div>
        <div class="form-row">
          <label>Nombre de usuario
            <input name="username" type="text" minlength="3" maxlength="30" autocomplete="username" placeholder="usuario" required>
          </label>
          <label>Correo electrónico
            <input name="email" type="email" maxlength="120" autocomplete="email" required>
          </label>
        </div>
        <label>Contraseña
          <input name="password" type="password" minlength="6" maxlength="100" autocomplete="new-password" required>
        </label>
        <p id="saas-register-message" class="cb-auth-message error" role="alert"></p>
        <div class="cb-auth-actions">
          <button class="primary" type="submit">Crear cuenta</button>
        </div>
      </form>

      <section id="saas-account-choice" class="cb-auth-pane hidden cb-auth-account" aria-live="polite">
        <h2>Cuenta preparada</h2>
        <p id="saas-account-label" class="meta"></p>
        <div id="saas-claim-offer" class="cb-auth-claim hidden">
          <strong>¿Ya usabas esta aplicación con tus datos actuales?</strong>
          <p class="meta">Puedes vincularlos a esta cuenta introduciendo el PIN actual de Migue. Si esta es una cuenta nueva, entra normalmente.</p>
          <form id="saas-claim-form">
            <div class="cb-auth-inline">
              <label>PIN actual de Migue
                <input name="pin" type="password" inputmode="numeric" minlength="4" maxlength="8" autocomplete="current-password">
              </label>
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
        <label>Nueva contraseña
          <input name="password" type="password" minlength="6" maxlength="100" autocomplete="new-password" required>
        </label>
        <label>Repetir contraseña
          <input name="password2" type="password" minlength="6" maxlength="100" autocomplete="new-password" required>
        </label>
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
  const login = $('#saas-login-form');
  const register = $('#saas-register-form');
  const choice = $('#saas-account-choice');
  const password = $('#saas-password-update-form');
  login?.classList.toggle('hidden', name !== 'login');
  register?.classList.toggle('hidden', name !== 'register');
  choice?.classList.toggle('hidden', name !== 'choice');
  password?.classList.toggle('hidden', name !== 'password');
  $('#saas-tab-login')?.classList.toggle('active', name === 'login');
  $('#saas-tab-register')?.classList.toggle('active', name === 'register');
  $('#saas-tab-login')?.setAttribute('aria-selected', String(name === 'login'));
  $('#saas-tab-register')?.setAttribute('aria-selected', String(name === 'register'));
  const tabs = $('.cb-auth-tabs');
  if (tabs) tabs.classList.toggle('hidden', name === 'choice' || name === 'password');
}

function showLocalPin() {
  localPinMode = true;
  $('#saas-auth-shell')?.classList.add('hidden');
  $('#auth-form')?.classList.remove('hidden');
  $('#auth-error').textContent = '';
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
  try {
    sessionStorage.setItem('campobase.sessionRole', 'owner');
    sessionStorage.removeItem('campobase.demoSession');
  } catch { /* La sesión SaaS permanece activa igualmente. */ }
  window.location.reload();
}

async function prepareSignedInChoice(client, data) {
  const user = data?.user || data?.session?.user || data?.session?.user;
  if (!user) throw new Error('No se ha podido identificar la cuenta.');
  const profile = await getProfileOrFallback(client, user);
  pendingSession = data?.session || (await getCurrentSession(client));
  pendingProfile = profile;

  const available = profile.role !== 'owner' && await legacyOwnerClaimAvailable(client).catch(() => false);
  $('#saas-account-label').textContent = profile.full_name
    ? `${profile.full_name}${profile.club_name ? ` · ${profile.club_name}` : ''}`
    : (profile.email || user.email || 'Cuenta de entrenador');
  $('#saas-claim-offer')?.classList.toggle('hidden', !available);
  setMessage('#saas-claim-message', '');
  showPane('choice');
  return { user, profile, available };
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
  const profile = await getProfileOrFallback(client, session.user);
  const app = await waitForApp();
  if (!app?.state) return false;

  app.state.role = 'owner';
  app.state.delegateMode = false;
  try { sessionStorage.setItem('campobase.sessionRole', 'owner'); } catch { /* No bloquea la sesión. */ }
  document.body.classList.remove('auth-locked', 'delegate-mode', 'demo-mode');
  document.documentElement.dataset.saasRole = profile.role === 'owner' ? 'owner' : 'coach';
  const roleLabel = $('#role-label');
  if (roleLabel) roleLabel.textContent = profile.role === 'owner' ? 'Administrador' : 'Entrenador';
  const settingsNav = $('#settings-nav');
  if (settingsNav) settingsNav.hidden = false;
  $('#demo-team-panel')?.classList.add('hidden');
  const dialog = $('#auth-dialog');
  if (dialog?.open) dialog.close();
  return true;
}

async function handleUnboundPersistentSession(client) {
  const session = await getCurrentSession(client).catch(() => null);
  if (!session?.user || getBoundSaasUserId()) return false;
  await prepareSignedInChoice(client, { session, user: session.user });
  const dialog = $('#auth-dialog');
  if (dialog && !dialog.open) dialog.showModal();
  return true;
}

function bindEvents(client) {
  $('#saas-tab-login')?.addEventListener('click', () => showPane('login'));
  $('#saas-tab-register')?.addEventListener('click', () => showPane('register'));
  $('#saas-local-pin-btn')?.addEventListener('click', showLocalPin);
  $('#saas-local-back')?.addEventListener('click', () => showPane('login'));
  $('#saas-demo-btn')?.addEventListener('click', () => $('#auth-demo-btn')?.click());

  $('#saas-login-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage('#saas-login-message', 'Entrando…');
    try {
      const data = await loginWithEmailOrUsername(client, form.elements.identifier.value, form.elements.password.value);
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
      const data = await registerCoachAccount(client, {
        fullName: form.elements.fullName.value,
        clubName: form.elements.clubName.value,
        username: form.elements.username.value,
        email: form.elements.email.value,
        password: form.elements.password.value,
      });
      if (data?.session?.user) {
        setMessage('#saas-register-message', '');
        await prepareSignedInChoice(client, data);
      } else {
        setMessage('#saas-register-message', 'Cuenta creada. Revisa tu correo para confirmar la cuenta y después inicia sesión.', true);
      }
    } catch (error) {
      setMessage('#saas-register-message', error.message || 'No se pudo crear la cuenta.');
    }
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
    try { await activateAccount(user, pendingProfile); }
    catch (error) { setMessage('#saas-claim-message', error.message || 'No se pudo abrir la cuenta.'); }
  });

  $('#saas-cancel-account')?.addEventListener('click', async () => {
    await client.auth.signOut().catch(() => {});
    pendingSession = null;
    pendingProfile = null;
    clearBoundSaasUserId();
    showPane('login');
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
    if (await unlockBoundSession(client)) return;
    if (await handleUnboundPersistentSession(client)) return;
    showPane('login');
  };
  const observer = new MutationObserver(() => { sync().catch(() => showPane('login')); });
  observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  window.setTimeout(() => sync().catch(() => showPane('login')), 0);
}

export async function initSaasAuth(client) {
  if (initialized || typeof document === 'undefined') return;
  initialized = true;
  installStyles();
  injectShell();
  bindEvents(client);
  observeDialog(client);

  const bound = getBoundSaasUserId();
  const session = await getCurrentSession(client).catch(() => null);
  if (bound && (!session?.user || session.user.id !== bound)) {
    clearBoundSaasUserId();
  }
  if (session?.user && bound === session.user.id) {
    unlockBoundSession(client).catch(() => {});
  }
}
