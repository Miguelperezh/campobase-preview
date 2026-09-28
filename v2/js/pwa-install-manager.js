// Gestor de instalación PWA
// Capa aislada de UI. No toca Supabase ni datos deportivos.

let deferredInstallPrompt = null;
let isAppInstalled = false;
let initialized = false;

const PERMANENT_DISMISS_KEY = 'pwa.install.hidden.device.v1';
const LEGACY_PERMANENT_DISMISS_KEY = 'campobase.pwa_permanently_dismissed';
const SESSION_DISMISS_KEY = 'campobase.pwa_dismissed';
const STYLE_LINK_ID = 'cb-pwa-install-styles';

export function detectPlatform(ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '')) {
  if (!ua) return 'other';
  if (/iPad|iPhone|iPod/i.test(ua)) return 'ios';
  if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'mac';
  if (/Windows/i.test(ua)) return 'windows';
  if (/Linux/i.test(ua)) return 'linux';
  return 'other';
}

export function detectBrowser(ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '')) {
  if (typeof navigator !== 'undefined' && navigator.brave) return 'brave';
  if (/EdgiOS\//i.test(ua)) return 'edge-ios';
  if (/EdgA\//i.test(ua)) return 'edge-android';
  if (/Edg\//i.test(ua)) return 'edge';
  if (/OPiOS\//i.test(ua)) return 'opera-ios';
  if (/OPR\//i.test(ua)) return 'opera';
  if (/SamsungBrowser\//i.test(ua)) return 'samsung';
  if (/CriOS\//i.test(ua)) return 'chrome-ios';
  if (/FxiOS\//i.test(ua)) return 'firefox-ios';
  if (/Chrome\//i.test(ua)) return 'chrome';
  if (/Firefox\//i.test(ua)) return 'firefox';
  if (/Safari\//i.test(ua)) return 'safari';
  return 'other';
}

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator?.standalone);
}

export function getInstallButtonLabel() {
  return 'Instalar aplicación';
}

export function isPermanentlyDismissed() {
  try {
    return localStorage.getItem(PERMANENT_DISMISS_KEY) === 'true' || localStorage.getItem(LEGACY_PERMANENT_DISMISS_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setPermanentlyDismissed(value = true) {
  try {
    if (value) {
      localStorage.setItem(PERMANENT_DISMISS_KEY, 'true');
      sessionStorage.removeItem(SESSION_DISMISS_KEY);
    } else {
      localStorage.removeItem(PERMANENT_DISMISS_KEY);
      localStorage.removeItem(LEGACY_PERMANENT_DISMISS_KEY);
      sessionStorage.removeItem(SESSION_DISMISS_KEY);
    }
  } catch {}
}

function isDismissedForSession() {
  try { return sessionStorage.getItem(SESSION_DISMISS_KEY) === 'true'; }
  catch { return false; }
}

function dismissForSession() {
  try { sessionStorage.setItem(SESSION_DISMISS_KEY, 'true'); }
  catch {}
}

function ensureStylesheet() {
  if (document.getElementById(STYLE_LINK_ID)) return;
  const link = document.createElement('link');
  link.id = STYLE_LINK_ID;
  link.rel = 'stylesheet';
  link.href = 'pwa-install.css?v=3';
  document.head.appendChild(link);
}

const BROWSER_LOGOS = {
  chrome: 'https://resources.whatwg.org/browser-logos/chrome.svg',
  safari: 'https://resources.whatwg.org/browser-logos/safari-ios.svg',
  edge: 'https://resources.whatwg.org/browser-logos/edge.svg',
  firefox: 'https://resources.whatwg.org/browser-logos/firefox.png',
  opera: 'https://resources.whatwg.org/browser-logos/opera.svg',
  samsung: 'https://resources.whatwg.org/browser-logos/samsung.svg',
  brave: 'https://cdn.simpleicons.org/brave/FB542B',
};

function platformSvg(kind) {
  const base = 'class="cb-brand-logo cb-brand-logo-platform" viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
  if (kind === 'apple') {
    return `<svg ${base}><path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>`;
  }
  if (kind === 'windows') {
    return `<svg ${base}><path fill="currentColor" d="M0 0h11.38v11.38H0zm12.62 0H24v11.38H12.62zM0 12.62h11.38V24H0zm12.62 0H24V24H12.62z"/></svg>`;
  }
  if (kind === 'android') {
    return `<svg ${base}><path fill="currentColor" d="M18.44 5.56c-.68 1.17-1.35 2.33-2.03 3.5l-.11-.05c-1.83-.69-3.48-.8-4.42-.78-1.86.01-3.35.46-4.26.82-.08-.15-1.75-3.02-2.02-3.49a1.15 1.15 0 0 0-.14-.19c-.33-.36-.91-.49-1.38-.2-.48.28-.71.93-.39 1.5 1.95 3.37-.1-.22 1.95 3.36.02.03-.5.26-1.39 1.02C2.9 12.18.45 14.77 0 18.99h24c-.12-1.11-.37-2.1-.75-3.07-.74-1.91-1.84-3.29-2.74-4.18a12.1 12.1 0 0 0-2.13-1.69c.66-1.12 1.31-2.26 1.97-3.38.21-.36.19-.8-.01-1.12a1.1 1.1 0 0 0-.85-.54c-.52-.05-.94.32-1.05.55zm-.04 8.46c.4.59.32 1.33-.16 1.65-.48.32-1.19.1-1.58-.49-.4-.6-.32-1.34.16-1.66.47-.31 1.18-.1 1.58.5zM7.21 13.53c.48.32.55 1.06.15 1.65-.39.59-1.1.81-1.58.49-.48-.32-.55-1.06-.16-1.65.4-.6 1.11-.81 1.59-.49z"/></svg>`;
  }
  if (kind === 'linux') {
    return `<img class="cb-brand-logo cb-brand-logo-browser" src="https://cdn.simpleicons.org/linux/FCC624" alt="" aria-hidden="true" loading="eager" decoding="async">`;
  }
  return `<svg ${base}><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="2"/></svg>`;
}

function browserLogo(kind) {
  const src = BROWSER_LOGOS[kind];
  if (!src) return platformSvg('generic');
  return `<img class="cb-brand-logo cb-brand-logo-browser" src="${src}" alt="" aria-hidden="true" loading="eager" decoding="async">`;
}

function logo(kind, type = 'platform') {
  return `<span class="cb-brand-logo-wrap">${type === 'browser' ? browserLogo(kind) : platformSvg(kind)}</span>`;
}

function platformInfo(platform = detectPlatform()) {
  if (platform === 'ios') return ['apple', 'iPhone / iPad'];
  if (platform === 'mac') return ['apple', 'Mac'];
  if (platform === 'android') return ['android', 'Android'];
  if (platform === 'windows') return ['windows', 'Windows'];
  if (platform === 'linux') return ['linux', 'Linux'];
  return ['generic', 'Tu dispositivo'];
}

function browserInfo(browser = detectBrowser()) {
  if (browser === 'safari') return ['safari', 'Safari'];
  if (browser === 'edge' || browser === 'edge-ios' || browser === 'edge-android') return ['edge', 'Edge'];
  if (browser === 'chrome' || browser === 'chrome-ios') return ['chrome', 'Chrome'];
  if (browser === 'firefox' || browser === 'firefox-ios') return ['firefox', 'Firefox'];
  if (browser === 'opera' || browser === 'opera-ios') return ['opera', 'Opera'];
  if (browser === 'brave') return ['brave', 'Brave'];
  if (browser === 'samsung') return ['samsung', 'Samsung Internet'];
  return ['generic', 'Navegador'];
}

function deviceChips(platform = detectPlatform(), browser = detectBrowser()) {
  const [pIcon, pLabel] = platformInfo(platform);
  const [bIcon, bLabel] = browserInfo(browser);
  return `<div class="cb-pwa-platform-row"><span class="cb-pwa-platform-chip">${logo(pIcon, 'platform')}<span>${pLabel}</span></span><span class="cb-pwa-platform-chip">${logo(bIcon, 'browser')}<span>${bLabel}</span></span></div>`;
}

function createBanner() {
  const el = document.createElement('aside');
  el.id = 'cb-pwa-install-banner';
  el.className = 'cb-pwa-banner cb-hidden';
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', 'Instalar aplicación');
  el.innerHTML = `<div class="cb-pwa-banner-content"><div class="cb-pwa-banner-leading"><div class="cb-pwa-banner-copy"><strong>Instalar como aplicación</strong><p>Acceso rápido y ventana independiente.</p>${deviceChips()}</div></div><div class="cb-pwa-banner-actions"><button id="cb-pwa-install-btn" class="primary compact" type="button">Instalar aplicación</button><button id="cb-pwa-dismiss-btn" class="ghost compact" type="button">Ahora no</button><button id="cb-pwa-never-btn" class="ghost compact cb-pwa-never" type="button">No volver a mostrar en este dispositivo</button></div></div>`;
  return el;
}

function createSettingsPanel() {
  const platform = detectPlatform();
  const browser = detectBrowser();
  const [pIcon, pLabel] = platformInfo(platform);
  const [bIcon, bLabel] = browserInfo(browser);
  const el = document.createElement('article');
  el.className = 'panel cb-install-settings-card';
  el.id = 'cb-install-settings-panel';
  el.innerHTML = `<div class="cb-install-settings-head"><div class="cb-install-settings-icon">${logo(pIcon, 'platform')}</div><div><p class="eyebrow">Aplicación</p><h3>Instalar aplicación</h3><p class="meta">Úsala como una app en ${pLabel} con ${bLabel}.</p></div></div>${deviceChips(platform, browser)}<div id="cb-install-status-box" class="cb-install-status-box"><button id="cb-settings-install-btn" class="primary compact" type="button">Instalar aplicación</button><p id="cb-settings-installed-msg" class="meta hidden">La aplicación ya está instalada y funcionando como app en este dispositivo.</p><p id="cb-settings-hidden-msg" class="meta hidden">El aviso de instalación está desactivado en este dispositivo. No volverá a mostrarse hasta que lo actives de nuevo aquí.</p><button id="cb-settings-restore-pwa-btn" class="secondary compact hidden" type="button">Volver a mostrar aviso de instalación</button></div>`;
  return el;
}

function ensureUi() {
  ensureStylesheet();
  if (!document.getElementById('cb-pwa-install-banner')) {
    const banner = createBanner();
    const topbar = document.querySelector('.topbar');
    topbar?.parentNode ? topbar.parentNode.insertBefore(banner, topbar) : document.body.prepend(banner);
  }
  if (!document.getElementById('cb-install-settings-panel')) {
    document.querySelector('#ajustes .settings-grid')?.appendChild(createSettingsPanel());
  }
}

function setHidden(el, hidden) {
  if (!el) return;
  el.classList.toggle('hidden', hidden);
  el.classList.toggle('cb-hidden', hidden);
}

function updateUi({ forceBanner = false } = {}) {
  ensureUi();
  const installed = isStandalone() || isAppInstalled;
  const permanent = isPermanentlyDismissed();
  const sessionDismissed = isDismissedForSession();
  const banner = document.getElementById('cb-pwa-install-banner');
  const mainBtn = document.getElementById('cb-pwa-install-btn');
  const settingsBtn = document.getElementById('cb-settings-install-btn');

  if (mainBtn) mainBtn.textContent = getInstallButtonLabel();
  if (settingsBtn) settingsBtn.textContent = getInstallButtonLabel();

  setHidden(settingsBtn, installed);
  setHidden(document.getElementById('cb-settings-installed-msg'), !installed);
  setHidden(document.getElementById('cb-settings-hidden-msg'), installed || !permanent);
  setHidden(document.getElementById('cb-settings-restore-pwa-btn'), installed || !permanent);
  setHidden(banner, installed || permanent || (!forceBanner && sessionDismissed));
}

function showModal(title, kicker, platformIcon, browserIcon, intro, steps, note = '') {
  document.querySelector('.cb-install-modal-backdrop')?.remove();
  const modal = document.createElement('div');
  modal.className = 'cb-install-modal-backdrop';
  modal.innerHTML = `<div class="cb-install-modal-card" role="dialog" aria-modal="true"><div class="cb-install-modal-hero"><div class="cb-install-modal-logos"><span class="cb-install-modal-logo">${logo(platformIcon, 'platform')}</span><span class="cb-install-modal-logo">${logo(browserIcon, 'browser')}</span></div><div><p class="cb-pwa-kicker">${kicker}</p><h3>${title}</h3></div></div><div class="cb-install-modal-body"><p>${intro}</p><ol class="cb-install-steps">${steps.map((s, i) => `<li><span>${i + 1}</span><div>${s}</div></li>`).join('')}</ol>${note ? `<p class="meta" style="margin-top:.85rem">${note}</p>` : ''}</div><div class="cb-install-modal-footer"><button class="primary" type="button" data-cb-install-close>Cerrar</button></div></div>`;
  document.body.appendChild(modal);
  modal.querySelector('[data-cb-install-close]')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', event => { if (event.target === modal) modal.remove(); });
}

export function getInstallGuide(platform = detectPlatform(), browser = detectBrowser()) {
  const [, bLabel] = browserInfo(browser);

  if (platform === 'ios') {
    if (browser === 'chrome-ios') {
      return { browserIcon: 'chrome', intro: 'En Chrome para iPhone o iPad se añade la aplicación desde el botón Compartir.', steps: ['Mira la <strong>barra de direcciones</strong> de Chrome y pulsa el botón <strong>Compartir</strong> que está a su derecha.', 'Busca y pulsa <strong>«Añadir a pantalla de inicio»</strong>.', 'Revisa el nombre de la aplicación y pulsa <strong>«Añadir»</strong>.'], note: 'Si el sitio está disponible como app web, el icono de la pantalla de inicio abrirá la aplicación web.' };
    }
    if (browser === 'firefox-ios') {
      return { browserIcon: 'firefox', intro: 'Firefox para iPhone y iPad permite crear el acceso desde su botón Compartir.', steps: ['Busca el icono <strong>Compartir</strong> en la barra de direcciones de Firefox y púlsalo.', 'En el menú de compartir, pulsa <strong>«Añadir a pantalla de inicio»</strong>.', 'Revisa el nombre y pulsa <strong>«Añadir»</strong> arriba a la derecha.'], note: 'Firefox documenta este flujo como acceso directo a la pantalla de inicio.' };
    }
    if (browser === 'safari') {
      return { browserIcon: 'safari', intro: 'Safari permite convertir este sitio en una app web desde el menú Compartir.', steps: ['En iPhone, pulsa <strong>Menú de página</strong> y después <strong>Compartir</strong>; si ves directamente el botón Compartir, púlsalo. En iPad, pulsa <strong>Compartir</strong> y después <strong>Más</strong>.', 'Pulsa <strong>«Añadir a pantalla de inicio»</strong>. Si no aparece en iPhone, baja hasta <strong>«Editar acciones»</strong> y añádela.', 'Activa <strong>«Abrir como app web»</strong>.', 'Pulsa <strong>«Añadir»</strong>.'], note: 'El icono se añadirá a la pantalla de inicio y abrirá el sitio como una app web.' };
    }
    return { browserIcon: browserInfo(browser)[0], intro: `No hay una ruta oficial única verificada para instalar una PWA desde ${bLabel} en iPhone/iPad. Para evitar indicaciones incorrectas, usa Safari o Chrome.`, steps: ['Abre este sitio en <strong>Safari</strong> o <strong>Chrome</strong>.', 'Pulsa <strong>Compartir</strong> y elige <strong>«Añadir a pantalla de inicio»</strong>.', 'Si usas Safari, activa <strong>«Abrir como app web»</strong> y pulsa <strong>«Añadir»</strong>.'] };
  }

  if (platform === 'android') {
    if (browser === 'chrome') {
      return { browserIcon: 'chrome', intro: 'Chrome para Android tiene una ruta específica para instalar aplicaciones web.', steps: ['Mira a la <strong>derecha de la barra de direcciones</strong> y pulsa los <strong>tres puntos verticales ⋮</strong>. Ese es el menú de Chrome.', 'Pulsa <strong>«Instalar y crear acceso directo»</strong>.', 'Pulsa <strong>«Instalar»</strong> y confirma si Android te lo pide.'] };
    }
    if (browser === 'firefox') {
      return { browserIcon: 'firefox', intro: 'Firefox para Android instala las apps web desde su menú de tres puntos.', steps: ['Pulsa el botón de los <strong>tres puntos ⋮</strong> de Firefox.', 'Pulsa <strong>«Instalar»</strong>. Si Firefox no reconoce la PWA, puede mostrar <strong>«Añadir a pantalla de inicio»</strong>.', 'Coloca el icono donde quieras o pulsa la opción de <strong>añadir automáticamente</strong>.'], note: 'La opción puede variar entre instalación de app web y acceso directo según cómo Firefox detecte el sitio.' };
    }
    if (browser === 'opera') {
      return { browserIcon: 'opera', intro: 'Opera para Android permite añadir una página desde el menú situado junto a la barra de direcciones.', steps: ['Pulsa los <strong>tres puntos</strong> situados en el extremo derecho de la barra de direcciones.', 'Pulsa <strong>«Añadir a»</strong>.', 'Elige <strong>añadir a la pantalla de inicio</strong> y confirma.'] };
    }
    if (browser === 'samsung') {
      return { browserIcon: 'samsung', intro: 'Samsung Internet puede mostrar directamente un indicador de instalación para las PWA.', steps: ['Busca el indicador <strong>+</strong> de aplicación web en la barra de direcciones; si aparece, púlsalo.', 'Si no aparece, abre el menú de Samsung Internet y busca <strong>«Añadir a Inicio»</strong> o la opción equivalente de pantalla de inicio.', 'Confirma para crear el icono de la aplicación.'] };
    }
    return { browserIcon: browserInfo(browser)[0], intro: `En ${bLabel} para Android el nombre exacto puede variar. Se intentará primero abrir el instalador nativo del navegador.`, steps: ['Busca el botón de menú junto a la <strong>barra de direcciones</strong>.', 'Busca una opción llamada <strong>«Instalar»</strong>, <strong>«Instalar aplicación»</strong> o <strong>«Añadir a pantalla de inicio»</strong>.', 'Confirma para crear la aplicación o el acceso.'] };
  }

  if (browser === 'chrome') {
    return { browserIcon: 'chrome', intro: 'En Chrome de ordenador la instalación está dentro del menú de los tres puntos.', steps: ['Mira <strong>arriba a la derecha de Chrome</strong>. Busca los <strong>tres puntos verticales ⋮</strong>, junto a la zona del perfil, y púlsalos. Ese botón abre el menú de Chrome.', 'Dentro del menú, pulsa <strong>«Enviar, guardar y compartir»</strong>. En algunas versiones de Chrome puede aparecer como <strong>«Transmitir, guardar y compartir»</strong>.', 'Pulsa <strong>«Instalar página como aplicación…»</strong>.', 'Confirma la instalación. La aplicación se abrirá en su propia ventana.'], note: 'Si Chrome muestra un icono de instalación directamente en la barra de direcciones, también puedes pulsarlo.' };
  }

  if (platform === 'mac' && browser === 'safari') {
    return { browserIcon: 'safari', intro: 'Safari en macOS Sonoma 14 o posterior puede convertir este sitio en una app web.', steps: ['En la barra de menús superior del Mac, pulsa <strong>«Archivo»</strong>.', 'Pulsa <strong>«Añadir al Dock»</strong>. También puedes usar el botón <strong>Compartir</strong> de Safari y después <strong>«Añadir al Dock»</strong>.', 'Revisa el nombre y pulsa <strong>«Añadir»</strong>.'], note: 'La app web quedará disponible en Aplicaciones, Dock o Spotlight.' };
  }

  if (browser === 'edge') {
    return { browserIcon: 'edge', intro: 'Edge permite instalar cualquier sitio como aplicación desde su menú principal.', steps: ['Mira la <strong>esquina superior derecha</strong> de Edge y pulsa <strong>«Configuración y más …»</strong>.', 'Pulsa <strong>«Más herramientas»</strong> → <strong>«Aplicaciones»</strong>.', 'Pulsa <strong>«Instalar este sitio como una aplicación»</strong>.', 'Confirma la instalación.'] };
  }

  if (platform === 'windows' && browser === 'firefox') {
    return { browserIcon: 'firefox', intro: 'Firefox para Windows puede instalar sitios como aplicaciones web desde la barra de direcciones.', steps: ['Mira la <strong>barra de direcciones</strong> de Firefox.', 'Pulsa el botón de <strong>aplicaciones web</strong> cuando aparezca.', 'Firefox instalará el sitio y añadirá acceso desde Windows.'], note: 'La disponibilidad depende de la versión de Firefox instalada.' };
  }

  if (platform === 'mac' && browser === 'firefox') {
    return { browserIcon: 'firefox', intro: 'Firefox en Mac no ofrece el mismo flujo nativo de aplicaciones web que Safari, Chrome o Edge.', steps: ['Abre este sitio en <strong>Safari</strong>, <strong>Chrome</strong> o <strong>Edge</strong>.', 'Usa la guía de instalación que aparecerá para ese navegador.', 'Confirma la instalación.'] };
  }

  return { browserIcon: browserInfo(browser)[0], intro: `No hay una ruta oficial verificada específica para ${bLabel} en este sistema.`, steps: ['Busca en la barra de direcciones un <strong>icono de instalación</strong>.', 'Si no aparece, abre el menú principal del navegador y busca <strong>«Instalar»</strong> o <strong>«Añadir a pantalla de inicio»</strong>.', 'Si tampoco aparece, abre este sitio en <strong>Chrome</strong>, <strong>Edge</strong> o <strong>Safari</strong> y sigue la guía específica.'] };
}

export function showInstallInstructions(platform = detectPlatform(), browser = detectBrowser()) {
  const [pIcon, pLabel] = platformInfo(platform);
  const [, bLabel] = browserInfo(browser);
  const guide = getInstallGuide(platform, browser);
  showModal('Instalar aplicación', `${pLabel.toUpperCase()} · ${bLabel.toUpperCase()}`, pIcon, guide.browserIcon || browserInfo(browser)[0], guide.intro, guide.steps, guide.note || '');
}

export function showIosInstallInstructions(browser = detectBrowser()) {
  showInstallInstructions('ios', browser);
}

export function showDesktopInstallInstructions(platform = detectPlatform(), browser = detectBrowser()) {
  showInstallInstructions(platform, browser);
}

export async function promptInstall() {
  if (detectPlatform() === 'ios') {
    showInstallInstructions();
    return { outcome: 'manual-ios' };
  }
  if (!deferredInstallPrompt) {
    showInstallInstructions();
    return { outcome: 'manual' };
  }
  try {
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      isAppInstalled = true;
      deferredInstallPrompt = null;
      updateUi();
    }
    return choice;
  } catch (error) {
    console.warn('[PWA] No se pudo abrir el instalador:', error);
    showInstallInstructions();
    return { outcome: 'dismissed' };
  }
}

function bindEvents() {
  document.getElementById('cb-pwa-install-btn')?.addEventListener('click', () => promptInstall());
  document.getElementById('cb-settings-install-btn')?.addEventListener('click', () => promptInstall());
  document.getElementById('cb-pwa-dismiss-btn')?.addEventListener('click', () => { dismissForSession(); updateUi(); });
  document.getElementById('cb-pwa-never-btn')?.addEventListener('click', () => { setPermanentlyDismissed(true); updateUi(); });
  document.getElementById('cb-settings-restore-pwa-btn')?.addEventListener('click', () => { setPermanentlyDismissed(false); updateUi({ forceBanner: true }); });
  window.cbDismissPwa = permanent => { permanent ? setPermanentlyDismissed(true) : dismissForSession(); updateUi(); };
}

export function initPwaInstallManager() {
  if (initialized || typeof window === 'undefined' || typeof document === 'undefined') return;
  initialized = true;
  ensureUi();
  bindEvents();
  updateUi();

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateUi();
  });

  window.addEventListener('appinstalled', () => {
    isAppInstalled = true;
    deferredInstallPrompt = null;
    setPermanentlyDismissed(true);
    updateUi();
  });

  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', () => updateUi());
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPwaInstallManager, { once: true });
  else initPwaInstallManager();
}
