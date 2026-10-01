import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const compat = fs.readFileSync(new URL('../js/session-picker-compat.js', import.meta.url), 'utf8');
const demo = fs.readFileSync(new URL('../js/demo-session.js', import.meta.url), 'utf8');
const sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('el selector visual conserva la clase que usa el planificador al reconstruir el catálogo', () => {
  assert.match(compat, /session-picker-card/);
  assert.match(compat, /classList\.add\('picker-card'\)/);
  assert.match(compat, /MutationObserver/);
  assert.match(compat, /childList: true, subtree: true/);
});

test('añadir, quitar o mover ejercicios vuelve a preparar el catálogo sin ocultarlo', () => {
  assert.match(compat, /add-exercise-to-session/);
  assert.match(compat, /remove-session-block/);
  assert.match(compat, /move-session-block/);
  assert.match(compat, /requestAnimationFrame/);
});

test('la compatibilidad carga antes del planificador y queda publicada en PWA', () => {
  const compatIndex = demo.indexOf("session-picker-compat.js?v=2461");
  const plannerIndex = demo.indexOf("session-planner-ui.js?v=20260927-v66-real-calendar-dates");
  assert.ok(compatIndex >= 0);
  assert.ok(plannerIndex > compatIndex);
  assert.match(sw, /sessionplanner-2461/);
  assert.match(sw, /session-picker-compat\.js\?v=2461/);
  assert.match(pkg.scripts.check, /node --check js\/session-picker-compat\.js/);
  assert.equal(pkg.version, '2.44.0');
});
