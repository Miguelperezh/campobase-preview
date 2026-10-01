import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('CSS claude-partido.css amplía la pizarra de preparación a 640px y prioriza la columna táctica', () => {
  const css = fs.readFileSync(path.join(rootDir, 'css', 'claude-partido.css'), 'utf8');
  assert.ok(
    css.includes('max-width: 640px'),
    'Debe definir max-width: 640px para la pizarra táctica de preparación'
  );
  assert.ok(
    css.includes('#preparacion .cbx-prep-pitch .board-wrap'),
    'Debe estilizar .board-wrap de preparación con dimensiones generosas'
  );
  assert.ok(
    css.includes('#preparacion .cbx-prep-editor-layout { display: grid; grid-template-columns: 1fr;'),
    'La cuadrícula debe dar prioridad visual a la pizarra táctica con 1 columna por defecto'
  );
  assert.ok(
    css.includes('minmax(560px, 640px)'),
    'En pantallas amplias la pizarra táctica tiene entre 560px y 640px'
  );
});

test('CSS claude-partido.css maqueta los desplegables de puestos de forma visible y generosa sin truncar', () => {
  const css = fs.readFileSync(path.join(rootDir, 'css', 'claude-partido.css'), 'utf8');
  assert.ok(
    css.includes('#preparacion .cbx-prep-slots-details .live-tactics-slots { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));'),
    'Los puestos de preparación deben organizarse en cuadrícula adaptativa que permite 2 columnas holgadas'
  );
  assert.ok(
    css.includes('text-overflow: ellipsis;'),
    'Los selectores deben definir text-overflow: ellipsis'
  );
  assert.ok(
    css.includes('font-size: 13.5px;'),
    'Los selectores deben tener tipografía legible de 13.5px'
  );
});

test('El popup táctico y el diálogo de sustituciones de calendario ofrecen anchura holgada', () => {
  const css = fs.readFileSync(path.join(rootDir, 'css', 'claude-partido.css'), 'utf8');
  assert.ok(
    css.includes('min-width: 320px !important'),
    'El popup táctico debe tener al menos 320px de ancho mínimo'
  );
  assert.ok(
    css.includes('#calendar-substitutions-v2-dialog { width: min(820px, calc(100% - 2rem)) !important;'),
    'El diálogo de sustituciones de calendario debe ampliarse a 820px'
  );
});

test('js/app.js integra botón de ampliación de pizarra, calcula ancho de popup y mantiene desplegables siempre visibles', () => {
  const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');
  assert.ok(
    appJs.includes('id="prep-full-btn"'),
    'Debe existir el botón prep-full-btn para ampliar pizarra'
  );
  assert.ok(
    appJs.includes('id="prep-board-full"'),
    'Debe existir el elemento svg prep-board-full'
  );
  assert.ok(
    appJs.includes('Math.min(340, window.innerWidth - 24)'),
    'prepOpenPopup debe calcular al menos 340px de anchura'
  );
  assert.ok(
    appJs.includes('renderPrepBoard(targetSvg = null)'),
    'renderPrepBoard debe soportar renderizar en svg ampliado'
  );
  assert.ok(
    appJs.includes('layout.append(pitch, controls);'),
    'arrangeClaudePrepEditor debe colocar la pizarra primero en el orden visual'
  );
  assert.ok(
    appJs.includes('controls.prepend(slotsPanel);'),
    'arrangeClaudePrepEditor debe anteponer los desplegables de puestos para que queden visibles'
  );
  assert.ok(
    !appJs.includes('details.open = prepDraft.some'),
    'No debe ocultar los desplegables en un details plegado'
  );
});
