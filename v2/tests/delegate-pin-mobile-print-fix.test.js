import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { nombreCorto } from '../js/live-tactics.js';

const [appCode, cssCode, printCode, modoCampoCode] = await Promise.all([
  readFile(new URL('../js/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../styles-redesign.css', import.meta.url), 'utf8'),
  readFile(new URL('../js/print-session-export.js', import.meta.url), 'utf8'),
  readFile(new URL('../js/modo-campo-integration.js', import.meta.url), 'utf8'),
]);

test('nombreCorto devuelve el primer apellido para nombres simples y compuestos', () => {
  // Caso reportado por Migue: Alejandro Pedros Gonzalez debe ser Alejandro P. (no Alejandro G.)
  assert.equal(nombreCorto('Alejandro Pedros Gonzalez'), 'Alejandro P.');
  assert.equal(nombreCorto('Alejandro Pedrós González'), 'Alejandro P.');
  assert.equal(nombreCorto('Juan Carlos Perez Martinez'), 'Juan Carlos P.');
  assert.equal(nombreCorto('Miguel Ángel Garcia Gomez'), 'Miguel Ángel G.');
  assert.equal(nombreCorto('Carlos Sanchez'), 'Carlos S.');
  assert.equal(nombreCorto('Pablo'), 'Pablo');
  assert.equal(nombreCorto(''), '');
});

test('partido en vivo y vista delegado integran minutos objetivo visibles (Obj: X min)', () => {
  // Debe contener la tarjeta visual targetSummaryMarkup
  assert.match(appCode, /live-target-card/);
  assert.match(appCode, /target-chips-container/);
  assert.match(appCode, /target-chip/);
  assert.match(appCode, /Minutos objetivo a disputar en este partido/);

  // Cada jugador en campo y banquillo incluye el distintivo Obj: X min
  assert.match(appCode, /live-target-badge/);
  assert.match(appCode, /Obj:\s*<strong>\$\{targetMin\}\s*min<\/strong>/);
  assert.match(appCode, /live-clock-badge/);

  // Los estilos CSS para estas clases están definidos
  assert.match(cssCode, /\.live-target-card/);
  assert.match(cssCode, /\.target-chip/);
  assert.match(cssCode, /\.live-target-badge/);
  assert.match(cssCode, /\.live-player-row/);
});

test('el delegado con PIN 0000 queda aislado y accede directo sin Modo Campo', () => {
  // body.delegate-mode oculta navegación, buscador, ajustes y Modo Campo
  assert.match(cssCode, /body\.delegate-mode #open-field-mode/);
  assert.match(cssCode, /body\.delegate-mode \[id\*="field-mode"\]/);
  assert.match(cssCode, /body\.delegate-mode \.view:not\(#delegado\)\s*\{\s*display:\s*none !important;/);
  assert.match(cssCode, /body\.delegate-mode #delegado\s*\{\s*display:\s*block !important;/);

  // showView aísla al delegado según permisos configurados
  assert.match(appCode, /if \(state\.role === 'delegate'\)/);
  assert.match(appCode, /if \(onlyPartido && viewId !== 'delegado' && viewId !== 'partido'\) return;/);

  // modo-campo-integration respeta permisos del delegado
  assert.match(modoCampoCode, /if \(role === 'delegate' \|\| document\.body\.classList\.contains\('delegate-mode'\)\) \{\s*const perms = window\.__campobase\?\.state\?\.settings\?\.delegatePermissions \|\| \['partido'\];\s*if \(!perms\.includes\('modo-campo'\)\) return;/);
});

test('configuración de cuenta de delegado en Ajustes y reparto de minutos 100% visual', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  // Panel de cuenta de delegado en Ajustes
  assert.match(html, /id="delegate-account-panel"/);
  assert.match(html, /id="delegate-account-form"/);
  assert.match(html, /name="delegatePinInput"/);
  assert.match(html, /name="delegatePermPartido"/);
  assert.match(html, /name="delegatePermPlantilla"/);
  assert.match(html, /name="delegatePermModoCampo"/);
  assert.match(html, /name="delegatePermConvocatorias"/);
  assert.match(html, /id="delegate-invite-whatsapp-btn"/);
  assert.match(html, /id="delegate-invite-email-btn"/);

  // Reparto de minutos visual: barras y dashboard
  assert.match(appCode, /live-bar-track/);
  assert.match(appCode, /data-player-progress/);
  assert.match(appCode, /data-player-min-label/);
  assert.match(appCode, /data-player-pct-label/);
  assert.match(appCode, /renderLiveRepartoDashboard/);
  assert.match(appCode, /reparto-direct-sub-box/);
  assert.match(appCode, /btn-quick-sub-direct/);

  // Botón de WhatsApp en PDF no se corta
  assert.match(printCode, /📲 Compartir WhatsApp \/ PDF/);
  assert.match(cssCode, /\.cb-print-btn-share/);
  assert.match(cssCode, /white-space:\s*normal\s*!important;/);
});

test('el delegado ve el partido en cuanto Migue pulsa Mostrar al Delegado', () => {
  // delegateCanSeeLive comprueba si prep.delegateShown está activo
  assert.match(appCode, /const prep = prepForMatch\(state\.timer\.matchId\);/);
  assert.match(appCode, /if \(prep\?\.delegateShown \|\| state\.settings\?\.delegateAllMatches\) return true;/);

  // renderDelegate auto-conecta la preparación mostrada si el timer estaba en null o en otro partido
  assert.match(appCode, /if \(shownPrep && \(!state\.timer \|\| \(state\.timer\.phase === 'ready' && String\(state\.timer\.matchId\) !== String\(shownPrep\.matchId\)\)\)\)/);

  // togglePrepDelegateForMatch aplica la preparación al timer en vivo cuando se activa delegateShown
  assert.match(appCode, /else if \(prep\.delegateShown\) \{\s*await applyPreparacionToLive\(prep\);/);

  // Login del delegado con PIN 0000 sincroniza en segundo plano para traerse datos frescos
  assert.match(appCode, /applyRole\('delegate'\);\s*void \(async \(\) => \{\s*try \{\s*await synchronizeCloud\(\);\s*await refresh\(true\);\s*renderDelegate\(\);/);
});

test('la preparación no altera la alineación táctica elegida por Migue', () => {
  // En fase ready, syncLiveTacticFromTimer y ensureLiveTactic respetan prep.team
  assert.match(appCode, /if \(state\.timer\.phase === 'ready'\) \{\s*const prep = prepForMatch\(state\.timer\.matchId\);\s*if \(prep\?\.team\?\.length\) \{\s*liveTactic = \{[\s\S]*formacion: prep\.formacion \?\? liveTactic\.formacion,[\s\S]*team: prep\.team\.map/);
  assert.match(appCode, /if \(prep\?\.team\?\.length && state\.timer\.phase === 'ready'\) \{\s*liveTactic\.team = prep\.team\.map\(\(p\) => \(\{ \.\.\.p \}\)\);/);
});

test('exportación PDF en móvil no congela Safari/iOS WebKit y añade safe-area', () => {
  // Barra flotante con safe-area-inset-top para evitar notch / dynamic island
  assert.match(cssCode, /padding-top:\s*max\(16px,\s*env\(safe-area-inset-top,\s*24px\)\)\s*!important;/);

  // En móvil ocultamos el botón de imprimir porque window.print bloquea WebKit
  assert.match(cssCode, /\.cb-print-btn-print\s*\{\s*display:\s*none !important;/);

  // Botón imprimir redirige a compartir PDF si es móvil o PWA standalone
  assert.match(printCode, /if \(isMobileDevice\(\) \|\| \(typeof window !== 'undefined' && window\.navigator\?\.standalone\)\)/);
  assert.match(printCode, /await shareOrDownloadPrintDoc\(htmlContent, 'Ficha-CampoBase', container\);/);

  // No dispara window.print de forma desatendida en móvil al abrir
  assert.match(printCode, /if \(!isMobileDevice\(\) && !\(typeof window !== 'undefined' && window\.navigator\?\.standalone\)\)/);
});
