import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Modo Campo directo sigue leyendo Supabase sin almacenamiento local de datos', async () => {
  const js = await read('js/modo-campo-directo.js');
  assert.doesNotMatch(js, /from\s+['\"].*db\.js|import\s*\(/);
  assert.doesNotMatch(js, /indexedDB|localStorage|sessionStorage/);
  assert.match(js, /createClient\(SUPABASE_URL, SUPABASE_KEY/);
  for (const table of ['jugadores','convocatorias','partidos','asistencias','configuracion']) assert.match(js, new RegExp(`readTable\\(client,'${table}'\\)`));
});

test('la capa integrada guarda asistencia real y Realizado en Supabase', async () => {
  const js = await read('js/modo-campo-actions.js');
  assert.match(js, /upsertPayload\('asistencias', record\)/);
  assert.match(js, /\.upsert\(/);
  assert.match(js, /status:isMatch \? 'finished' : 'closed'/);
  assert.match(js, /closedAt:now/);
  assert.match(js, /Guardar asistencia/);
  assert.match(js, /✓ Realizado/);
  assert.doesNotMatch(js, /indexedDB|localStorage|sessionStorage/);
});

test('asistencia de campo conserva estado, tardanza, hora y observaciones', async () => {
  const js = await read('js/modo-campo-directo.js');
  assert.match(js, />Presente</);
  assert.match(js, />Tarde</);
  assert.match(js, />Ausente</);
  assert.match(js, /Hora de llegada/);
  assert.match(js, /data-att-hour/);
  assert.match(js, /data-att-minute/);
  assert.match(js, /Observaciones/);
  assert.match(js, /Notas del registro/);
});

test('Modo Campo conserva archivado manual desde el 15/09/2026', async () => {
  const js = await read('js/modo-campo-directo.js');
  assert.match(js, /LEGACY_SESSION_CUTOFF = '2026-09-15'/);
  assert.match(js, /status === 'closed'/);
  assert.match(js, /closedAt/);
  assert.match(js, /match\?\.status === 'finished'/);
  assert.doesNotMatch(js, /Number\.isFinite\(match\?\.goalsFor\)/);
});

test('la navegación de campo no incluye Plantilla y sí Delegado y En vivo', async () => {
  const html = await read('modo-campo-directo.html');
  assert.doesNotMatch(html, /data-nav="plantilla"/);
  assert.match(html, /data-nav="delegado"/);
  assert.match(html, /data-nav="vivo"/);
  assert.match(html, />Delegado</);
  assert.match(html, />En vivo</);
});

test('Modo Campo usa identidad real y el mismo tema efectivo que Ajustes', async () => {
  const html = await read('modo-campo-directo.html');
  const identity = await read('js/modo-campo-identity-exercises.js');
  assert.match(html, /id="campo-club-crest"/);
  assert.match(html, /id="campo-team-name"/);
  assert.doesNotMatch(html, /class="mark">CB</);
  assert.doesNotMatch(html, /CampoBase · Uso en campo/);
  assert.match(identity, /main\.clubCrest/);
  assert.match(identity, /main\.teamName/);
  assert.match(identity, /\.\.\.\(main\.theme \|\| \{\}\)/);
  assert.match(identity, /localStorage\.getItem\('campobase\.theme'\)/);
  assert.match(identity, /\.\.\.localTheme/);
  assert.match(identity, /FONT_SCALE_MAP/);
  assert.match(identity, /FONT_FAMILY_MAP/);
});

test('Modo Campo replica las variables de color y atributos efectivos de CampoBase normal', async () => {
  const html = await read('modo-campo-directo.html');
  const parity = await read('js/modo-campo-theme-parity.js');
  const css = await read('modo-campo-theme.css');
  assert.match(html, /js\/modo-campo-theme-parity\.js\?v=1/);
  for (const variable of ['--cb-surface-bg','--cb-surface-card','--cb-surface-nav','--cb-surface-input','--cb-slate-900','--cb-slate-200','--accent','--cb-accent','--cb-brand']) {
    assert.match(parity, new RegExp(variable.replace(/[-]/g, '\\-')));
  }
  assert.match(parity, /document\.body\.style\.setProperty/);
  assert.match(parity, /data-theme-bg/);
  assert.match(parity, /data-theme-family/);
  assert.match(css, /\.top\{background:var\(--field-nav\)!important/);
  assert.doesNotMatch(parity, /MutationObserver/);
});

test('Modo Campo no carga el catálogo pesado al entrar ni usa observadores globales continuos', async () => {
  const html = await read('modo-campo-directo.html');
  const identity = await read('js/modo-campo-identity-exercises.js');
  const actions = await read('js/modo-campo-actions.js');
  const parity = await read('js/modo-campo-theme-parity.js');
  assert.doesNotMatch(html, /library-v2\/data\/catalog-data\.js/);
  assert.doesNotMatch(html, /modo-campo-local-theme\.js/);
  assert.doesNotMatch(identity, /MutationObserver/);
  assert.doesNotMatch(actions, /MutationObserver/);
  assert.doesNotMatch(parity, /MutationObserver/);
  assert.match(identity, /fetch\('\.\/library-v2\/data\/catalog\.json'/);
});

test('Entrenar ahora muestra los ejercicios uno por uno con anterior y siguiente', async () => {
  const identity = await read('js/modo-campo-identity-exercises.js');
  assert.match(identity, /Ejercicio \$\{safeIndex \+ 1\} de \$\{blocks\.length\}/);
  assert.match(identity, /data-campo-field-prev/);
  assert.match(identity, /data-campo-field-next/);
  assert.match(identity, /campo-exercise-video/);
  assert.match(identity, /Cómo hacerlo/);
  assert.match(identity, /data-attendance-session/);
});

test('la página integrada carga únicamente las capas vigentes', async () => {
  const html = await read('modo-campo-directo.html');
  assert.match(html, /vendor\/supabase\.js/);
  assert.match(html, /js\/modo-campo-directo\.js\?v=4/);
  assert.match(html, /js\/modo-campo-identity-exercises\.js\?v=2/);
  assert.match(html, /js\/modo-campo-theme-parity\.js\?v=1/);
  assert.match(html, /js\/modo-campo-actions\.js\?v=2/);
  assert.match(html, /modo-campo-theme\.css\?v=3/);
  assert.match(html, /modo-campo-flow\.css\?v=1/);
  assert.doesNotMatch(html, /modo-campo-preview|js\/app\.js|js\/db\.js/);
});

test('CampoBase normal carga el puente oficial de Modo Campo sin tocar app.js', async () => {
  const completed = await read('js/completed-events-ui.js');
  assert.match(completed, /modo-campo-integration\.js\?v=1/);
  const integration = await read('js/modo-campo-integration.js');
  assert.match(integration, /text: 'Modo Campo'/);
  assert.match(integration, /Volver a Modo Campo/);
});

test('la cabecera móvil coloca Modo Campo, Actualizar y Cerrar sesión en horizontal debajo de la identidad', async () => {
  const integration = await read('js/modo-campo-integration.js');
  assert.match(integration, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(integration, /#manual-refresh/);
  assert.match(integration, /#logout/);
  assert.match(integration, /#open-field-mode/);
  assert.match(integration, /grid-template-columns: minmax\(0, 1fr\)/);
});

test('CampoBase normal hace visible la reordenación manual sin cambiar su motor', async () => {
  const integration = await read('js/modo-campo-integration.js');
  const reorder = await read('js/session-reorder-ui.js');
  assert.match(integration, /session-reorder-ui\.js\?v=1/);
  assert.match(reorder, /\.move-session-block/);
  assert.match(reorder, /↑ Subir/);
  assert.match(reorder, /↓ Bajar/);
  assert.match(reorder, /Orden manual/);
  assert.doesNotMatch(reorder, /put\(|upsert|Supabase|sessionDraftBlocks\s*=/);
});

test('Modo Campo enlaza las funciones reales de WhatsApp, Delegado y En vivo', async () => {
  const actions = await read('js/modo-campo-actions.js');
  const integration = await read('js/modo-campo-integration.js');
  assert.match(actions, /whatsapp-session/);
  assert.match(actions, /whatsapp-match/);
  assert.match(actions, /nav\.dataset\.nav === 'vivo'/);
  assert.match(actions, /nav\.dataset\.nav === 'delegado'/);
  assert.match(integration, /open-whatsapp-session/);
  assert.match(integration, /open-whatsapp-match/);
  assert.match(integration, /Volver a Modo Campo/);
});

test('scripts nuevos tienen sintaxis válida', () => {
  for (const path of ['js/modo-campo-directo.js', 'js/modo-campo-actions.js', 'js/modo-campo-integration.js', 'js/modo-campo-identity-exercises.js', 'js/modo-campo-theme-parity.js', 'js/session-reorder-ui.js']) {
    execFileSync(process.execPath, ['--check', fileURLToPath(new URL(path, root))], { stdio:'pipe' });
  }
});
