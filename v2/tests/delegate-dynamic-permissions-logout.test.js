import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [appCode, cssCode, navCode, html] = await Promise.all([
  readFile(new URL('../js/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../styles-redesign.css', import.meta.url), 'utf8'),
  readFile(new URL('../js/redesign-nav.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
]);

test('la pantalla de login no revela el PIN del delegado (0000) ni PINs en texto de ayuda', () => {
  // En app.js el mensaje de ayuda no filtra "0000" ni números de PIN
  assert.doesNotMatch(appCode, /auth-help.*?\(0000\)/);
  assert.match(appCode, /Configura tus PIN de acceso para proteger la aplicación\./);
  assert.match(appCode, /Introduce tu PIN de acceso\./);

  // En index.html el texto de ayuda es neutro y seguro
  assert.match(html, /<p id="auth-help">Introduce tu PIN de acceso\.<\/p>/);

  // Las cabeceras del delegado no imprimen "(PIN 0000)" en el eyebrow
  assert.doesNotMatch(appCode, /Vista Delegado \(PIN 0000\)/);
});

test('el delegado tiene cabecera con botón visible de Cerrar sesión en cualquier vista', () => {
  // En index.html existe la cabecera dedicada del delegado con su botón de cerrar sesión
  assert.match(html, /<header id="cb-delegate-topbar" class="cb-delegate-topbar"/);
  assert.match(html, /<button type="button" id="cb-delegate-logout-btn" class="cb-delegate-logout-btn">Cerrar sesión<\/button>/);

  // En CSS, la cabecera del delegado es visible solo cuando está en delegate-mode
  assert.match(cssCode, /body\.delegate-mode:not\(\.auth-locked\) #cb-delegate-topbar\s*\{\s*display:\s*flex !important;/);

  // app.js gestiona el clic en cb-delegate-logout-btn y ejecuta logoutUser
  assert.match(appCode, /target\.id === 'cb-delegate-logout-btn' \|\| target\.closest\('#cb-delegate-logout-btn'\)/);
});

test('logoutUser elimina SESSION_ROLE_KEY y restaura el estado limpio de la app', () => {
  assert.match(appCode, /async function logoutUser\(\)/);
  assert.match(appCode, /sessionStorage\.removeItem\(SESSION_ROLE_KEY\);/);
  assert.match(appCode, /document\.body\.classList\.remove\('delegate-mode', 'delegate-single-view', 'delegate-multi-view', 'delegate-allow-modo-campo'\);/);
  assert.match(appCode, /restoreNormalNavUi\(\);/);
  assert.match(appCode, /showAuth\(\);/);
});

test('el formulario de permisos en Ajustes soporta dinámicamente todas las secciones de CampoBase', () => {
  // Formulario en HTML contiene los checkboxes de las distintas secciones
  assert.match(html, /name="delegatePermAsistencia"/);
  assert.match(html, /name="delegatePermCalendario"/);
  assert.match(html, /name="delegatePermCuerpoTecnico"/);
  assert.match(html, /name="delegatePermPreparacion"/);
  assert.match(html, /name="delegatePermSesiones"/);
  assert.match(html, /name="delegatePermEjercicios"/);
  assert.match(html, /name="delegatePermTacticas"/);
  assert.match(html, /name="delegatePermHoy"/);

  // saveDelegateAccountSettings recoge dinámicamente todos los checkboxes marcados
  assert.match(appCode, /form\.querySelectorAll\('\.delegate-perms-list input\[type="checkbox"\]:checked'\)\.forEach/);

  // populateDelegateAccountForm marca todos los checkboxes según los permisos guardados
  assert.match(appCode, /form\.querySelectorAll\('\.delegate-perms-list input\[type="checkbox"\]'\)\.forEach/);
});

test('la navegación del delegado se adapta dinámicamente a los permisos sin límites manuales fijos', () => {
  // Módulos visibles en #cb-bottom-nav según permisos reales
  assert.match(appCode, /mod === 'inicio'[\s\S]*?perms\.includes\('hoy'\)/);
  assert.match(appCode, /mod === 'entrenos'[\s\S]*?perms\.includes\('sesiones'\) \|\| perms\.includes\('ejercicios'\)/);

  // redesign-nav maneja dinámicamente cualquier módulo permitido en delegate-mode
  assert.match(navCode, /const mod = MODULE_CONFIG\[moduleKey\];\s*if \(mod\) \{\s*const currentView = getActiveViewId\(\);/);

  // renderSubNav filtra los sub-tabs según los permisos del delegado
  assert.match(navCode, /if \(document\.body\.classList\.contains\('delegate-mode'\)\) \{[\s\S]*?subTabs = subTabs\.filter/);

  // styles-redesign permite que cualquier vista activa autorizada se vea sin solaparse
  assert.match(cssCode, /body\.delegate-mode\.delegate-multi-view \.view\.active\s*\{\s*display:\s*block !important;/);
  assert.match(cssCode, /body\.delegate-mode\.delegate-multi-view \.view:not\(\.active\)\s*\{\s*display:\s*none !important;/);
});
