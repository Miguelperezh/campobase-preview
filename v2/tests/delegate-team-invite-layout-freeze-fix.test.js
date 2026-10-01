import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [appCode, cssCode, printCode, navCode, indexHtml] = await Promise.all([
  readFile(new URL('../js/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../styles-redesign.css', import.meta.url), 'utf8'),
  readFile(new URL('../js/print-session-export.js', import.meta.url), 'utf8'),
  readFile(new URL('../js/redesign-nav.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
]);

test('invitación de delegado incluye &team= y &perms= para escalar a cualquier equipo', () => {
  assert.match(appCode, /const teamParam = teamId \? `&team=\$\{encodeURIComponent\(teamId\)\}` : '';/);
  assert.match(appCode, /const permsParam = `&perms=\$\{encodeURIComponent\(perms\.join\(','\)\)\}`;/);
  assert.match(appCode, /directUrl = `\$\{baseUrl\}\?role=delegate&pin=\$\{encodeURIComponent\(pin\)\}\$\{teamParam\}\$\{permsParam\}`;/);

  // Comprobación de que init() parsea team y perms y vincula la base de datos SaaS
  assert.match(appCode, /const teamParam = params\.get\('team'\);/);
  assert.match(appCode, /const permsParam = params\.get\('perms'\);/);
  assert.match(appCode, /if \(roleParam === 'delegate'\) \{/);
  assert.match(appCode, /setBoundSaasUserId\(teamParam\);/);
  assert.match(appCode, /configureRealDatabase\(\);/);
});

test('delegado con permisos específicos muestra solo esas pestañas (multi-view vs single-view)', () => {
  // Función centralizadora syncDelegateModeDom
  assert.match(appCode, /function syncDelegateModeDom\(\) \{/);
  assert.match(appCode, /document\.body\.classList\.add\('delegate-single-view'\);/);
  assert.match(appCode, /document\.body\.classList\.add\('delegate-multi-view'\);/);

  // Limpieza de pestañas huérfanas en el rediseño para convocatorias y modo campo
  assert.match(appCode, /#cb-nav-tab-convocatorias'\)\?\.remove\(\)/);
  assert.match(appCode, /#cb-nav-tab-modo-campo'\)\?\.remove\(\)/);

  // Redirección dinámica en redesign-nav.js al pulsar en la barra del delegado
  assert.match(navCode, /if \(document\.body\.classList\.contains\('delegate-mode'\)\) \{/);
  assert.match(navCode, /const allowed = mod\.views\.filter/);
  assert.match(navCode, /triggerStandardView\(targetView\);/);

  // CSS de especificidad: delegado multi-vista muestra vistas activas ganando al aislamiento
  assert.match(cssCode, /body\.delegate-mode \.view:not\(#delegado\)\s*\{\s*display:\s*none !important;\s*\}/);
  assert.match(cssCode, /body\.delegate-mode\.delegate-multi-view #plantilla\.view\.active/);
  assert.match(cssCode, /body\.delegate-mode\.delegate-multi-view #convocatorias\.view\.active/);
});

test('partido en vivo y delegado en móvil no desbordan lateralmente (3 niveles)', () => {
  // Filas reestructuradas en 3 niveles verticales: nombre+reloj, barra 100%, badge obj + mins
  assert.match(appCode, /class="live-player-row-top"/);
  assert.match(appCode, /class="live-player-row-bar"/);
  assert.match(appCode, /live-bar-meta/);

  // CSS evita el desbordamiento horizontal en pantallas estrechas
  assert.match(cssCode, /#delegado \.check-row\.live-player-row/);
  assert.match(cssCode, /overflow-x:\s*hidden\s*!important;/);
  assert.match(cssCode, /padding-bottom:\s*calc\(6rem \+ env\(safe-area-inset-bottom,\s*24px\)\)\s*!important;/);
});

test('impresión y exportación nunca bloquean la app en móvil ni dejan vistas ocultas', () => {
  // executePrint libera los dialogs abiertos previamente para evitar el bloqueo del top-layer
  assert.match(printCode, /const previouslyOpenDialogs = \[\];/);
  assert.match(printCode, /document\.querySelectorAll\('dialog\[open\]'\)/);

  // parasiteSelectors no destruye main > .view con estilos inline !important
  assert.doesNotMatch(printCode, /parasiteSelectors[\s\S]*?'main > \.view'/);

  // generatePdfBlob tiene timeout seguro Promise.race con html2canvas
  assert.match(printCode, /const timeoutPromise = new Promise\(\(_, reject\) => \{/);
  assert.match(printCode, /setTimeout\(\(\) => reject\(new Error\('html2canvas timeout'\)\),\s*2500\);/);
  assert.match(printCode, /Promise\.race\(\[canvasPromise,\s*timeoutPromise\]\)/);

  // Barra flotante ofrece el botón visible de abrir en pestaña aislada
  assert.match(printCode, /id="cb-print-open-tab-btn"/);
  assert.match(printCode, /📄 Abrir Ficha A4/);
  assert.match(cssCode, /\.cb-print-btn-open\s*\{/);
});
