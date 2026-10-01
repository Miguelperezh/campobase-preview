import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

test('visor de Mis ejercicios mantiene Play visible, espera a que carguen las fases y ajusta la pizarra al viewport', () => {
  const source = fs.readFileSync('js/exercise-viewer-layout.js', 'utf8');

  assert.equal(source.includes("play.textContent = '▶ Reproducir'"), true, 'debe crear un Play visible en la cabecera');
  assert.equal(source.includes("doc.getElementById('phasePlay')"), true, 'debe controlar el Play real de las fases');
  assert.equal(source.includes("movement.getAttribute('aria-pressed') !== 'true'"), true, 'Play debe activar Movimiento si hace falta');
  assert.equal(source.includes('runInnerPlayback(frame)'), true, 'Play debe iniciar la reproducción real');
  assert.equal(source.includes('attempt < 14'), true, 'debe reintentar mientras las fases todavía están cargando');
  assert.equal(source.includes('inner.click()'), true, 'debe pulsar el Play interno cuando ya está habilitado');
  assert.equal(source.includes("doc.getElementById('viewPlay')"), true, 'debe ocultar el Play interior duplicado');
  assert.equal(source.includes("doc.getElementById('phasePlay')"), true, 'debe ocultar también el Play de fases duplicado');

  assert.equal(source.includes("querySelectorAll('svg')"), true, 'debe localizar el campo real');
  assert.equal(source.includes('frame.contentWindow?.innerHeight'), true, 'debe calcular el alto disponible del visor');
  assert.equal(source.includes("svg.style.setProperty('height', `${available}px`, 'important')"), true, 'debe ajustar el campo al alto disponible');
  assert.equal(source.includes("preserveAspectRatio', 'xMidYMid meet'"), true, 'el campo no debe deformarse');
  assert.equal(source.includes('overflow:hidden!important'), true, 'el visor debe evitar que el campo quede cortado por un contenedor desbordado');
});
