import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('CSS claude-partido.css oculta preparacion-list cuando el editor está activo', () => {
  const css = fs.readFileSync(path.join(rootDir, 'css', 'claude-partido.css'), 'utf8');
  assert.ok(css.includes('#preparacion-list.hidden'), 'Debe incluir regla para #preparacion-list.hidden');
  assert.ok(css.includes('#preparacion.is-editing #preparacion-list'), 'Debe incluir regla para #preparacion.is-editing #preparacion-list');
  assert.ok(css.includes('#prep-back-head'), 'Debe incluir estilos para el botón de retorno en la cabecera');
});

test('openPreparacionEditor oculta incondicionalmente preparacion-list y muestra el editor', () => {
  const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');
  assert.ok(
    !appJs.includes("if (!document.body.classList.contains('cb-redesign-active')) $('#preparacion-list').classList.add('hidden')"),
    'No debe existir la condición que impedía ocultar la lista en rediseño Claude'
  );
  assert.ok(
    appJs.includes("$('#preparacion-list').classList.add('hidden');"),
    'openPreparacionEditor debe ocultar preparacion-list directamente'
  );
  assert.ok(
    appJs.includes("$('#preparacion-editor').classList.remove('hidden');"),
    'openPreparacionEditor debe mostrar preparacion-editor'
  );
  assert.ok(
    appJs.includes("$('#preparacion')?.classList.add('is-editing');"),
    'openPreparacionEditor debe añadir la clase is-editing a #preparacion'
  );
});

test('renderPreparaciones ofrece Preparar partido directamente a partidos sin convocatoria', () => {
  const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');
  assert.ok(
    appJs.includes('prep-open primary" data-id="${escapeHtml(match.id)}">Preparar partido</button>'),
    'Los partidos sin convocatoria deben incluir el botón prep-open para preparar directamente'
  );
  assert.ok(
    appJs.includes('async function ensureCallupForMatch(match)'),
    'Debe existir la función ensureCallupForMatch para generar convocatoria base automática'
  );
});

test('prepBuildTeam puebla los 7 puestos iniciales con jugadores compatibles y el portero', () => {
  const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');
  assert.ok(
    appJs.includes('function prepBuildTeam(formation, keeperId)'),
    'Debe existir prepBuildTeam'
  );
  assert.ok(
    appJs.includes("if (slot.pos === 'Portero') return { ...slot, playerId: safeKeeper };"),
    'prepBuildTeam debe asegurar al portero en la portería y asignar jugadores a campo'
  );
});

test('La cabecera del editor conserva el botón prep-back-head y se gestiona el cierre limpio', () => {
  const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');
  assert.ok(
    appJs.includes('id="prep-back-head"'),
    'El editor debe renderizar prep-back-head en la cabecera'
  );
  assert.ok(
    appJs.includes('closeEditor'),
    'wirePrepEditor debe enlazar closeEditor tanto para prep-back como prep-back-head'
  );
  assert.ok(
    appJs.includes("classList.remove('is-editing')"),
    'Al cerrar el editor o guardar debe retirarse la clase is-editing'
  );
});

test('Partido en vivo ofrece enlace directo a Preparación cuando no hay partidos convocados', () => {
  const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');
  assert.ok(
    appJs.includes('id="live-go-prep"'),
    'El estado vacío de renderLive debe incluir el botón live-go-prep para ir a preparación'
  );
});

test('window.__campobase exporta openPreparacionEditor y ensureCallupForMatch', () => {
  const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');
  assert.ok(
    appJs.includes('openPreparacionEditor,'),
    'window.__campobase debe exportar openPreparacionEditor'
  );
  assert.ok(
    appJs.includes('ensureCallupForMatch,'),
    'window.__campobase debe exportar ensureCallupForMatch'
  );
});
