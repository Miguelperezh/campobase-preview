import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('CSS claude-partido.css homogeneiza la pizarra en vivo y delegado a 640px hero con colores unificados', () => {
  const css = fs.readFileSync(path.join(rootDir, 'css', 'claude-partido.css'), 'utf8');
  assert.ok(
    css.includes('#partido #live-tactics .board-wrap,body.cb-redesign-active #delegado #delegate-tactics .board-wrap { width: 100%; max-width: 640px; margin: 8px auto; padding: 12px; border: 0; border-radius: 20px; background: #155438;'),
    'La pizarra en vivo y delegado debe tener max-width: 640px, padding 12px, border-radius 20px y fondo #155438'
  );
  assert.ok(
    css.includes('#partido #live-tactics .board-wrap svg,body.cb-redesign-active #delegado #delegate-tactics .board-wrap svg { display: block; width: 100%; max-width: 640px;'),
    'El SVG de la pizarra debe poder alcanzar hasta 640px'
  );
  assert.ok(
    css.includes('#partido #live-tactics .board-wrap .tac-field,body.cb-redesign-active #delegado #delegate-tactics .board-wrap .tac-field { fill: #205f43; }'),
    'El campo táctico debe usar el color verde #205f43 unificado con preparación'
  );
  assert.ok(
    css.includes('#partido #live-tactics .board-wrap .tac-player circle,body.cb-redesign-active #delegado #delegate-tactics .board-wrap .tac-player circle { fill: #fff; stroke: #cbd5e1; stroke-width: .6; }'),
    'Las fichas tácticas deben usar trazo #cbd5e1 y relleno blanco'
  );
  assert.ok(
    css.includes('#partido #live-tactics .board-wrap .tac-player .num,body.cb-redesign-active #delegado #delegate-tactics .board-wrap .tac-player .num { fill: #0b2d20; }'),
    'Los números dorsales deben ser legibles con #0b2d20'
  );
});

test('CSS claude-partido.css prioriza la pizarra táctica en .cbx-live-main con 1 columna por defecto y 640px en ultra-ancho', () => {
  const css = fs.readFileSync(path.join(rootDir, 'css', 'claude-partido.css'), 'utf8');
  assert.ok(
    css.includes('body.cb-redesign-active #partido .cbx-live-main { display: grid; grid-template-columns: 1fr; gap: 18px; align-items: start; max-width: 720px; margin: 0 auto; }'),
    '.cbx-live-main debe usar 1 columna centrada de hasta 720px por defecto para no estrangular la pizarra táctica en 1024px'
  );
  assert.ok(
    css.includes('minmax(560px, 640px) minmax(340px, 1fr) minmax(280px, 1fr)'),
    'En pantallas ultra-anchas (>=1280px) la pizarra en vivo conserva entre 560px y 640px de ancho'
  );
  assert.ok(
    css.includes('.cbx-live-board-options .live-tactics-slots { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));'),
    'Los puestos de partido en vivo deben maquetarse en cuadrícula adaptativa de al menos 280px por puesto'
  );
  assert.ok(
    css.includes('.cbx-live-board-options .suplentes { grid-column: 1 / -1;'),
    'Los suplentes deben ocupar el ancho total de la cuadrícula'
  );
});

test('js/app.js configura openTacticsPopup con 340px y formateo limpio con punto medio', () => {
  const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');
  assert.ok(
    appJs.includes('const w = Math.min(340, window.innerWidth - 24), h = 130;'),
    'openTacticsPopup debe calcular ancho hasta 340px y altura 130px'
  );
  assert.ok(
    appJs.includes('${escapeHtml(x.number ? x.number + \' · \' : \'\')}${escapeHtml(x.name)}'),
    'openTacticsPopup y renderTacticsSlots deben formatear con punto medio sin truncar'
  );
});

test('js/app.js mantiene herramientas y puestos en vivo permanentemente abiertos sin details plegado', () => {
  const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');
  assert.ok(
    appJs.includes('optionsPanel.className = \'cbx-live-board-options cbx-live-slots-panel panel\';'),
    'arrangeClaudeLiveBoard debe usar una sección panel abierta'
  );
  assert.ok(
    !appJs.includes('details.className = \'cbx-live-board-options\';'),
    'No debe envolver herramientas ni puestos en un elemento details plegable'
  );
  assert.ok(
    appJs.includes('optionsPanel.append(sc.tools(), sc.slots(), root.querySelector(\'.keeper-note\'), root.querySelector(\'.live-tactics-legend\'));'),
    'Las herramientas tácticas y los puestos deben estar integrados en el panel abierto'
  );
});
