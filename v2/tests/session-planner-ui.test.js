import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../js/session-planner-ui.js', import.meta.url), 'utf8');
const demo = fs.readFileSync(new URL('../js/demo-session.js', import.meta.url), 'utf8');
const sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('Sesiones conserva el flujo visual validado', () => {
  assert.match(source, /Objetivo de la sesión/);
  assert.match(source, /Propuesta de entrenamiento/);
  assert.match(source, /Fútbol 7/);
  assert.match(source, /Fútbol 11/);
  assert.match(source, /Duración del entrenamiento/);
  assert.match(source, /Física integrada con balón/);
  assert.match(source, /Toma de decisiones \+ juego/);
  assert.match(source, /Recuperación \/ baja carga/);
});

test('la biblioteca usa portadas ligeras y recupera las que no tienen frames', () => {
  assert.match(source, /\$\{frames\}000\.jpg/);
  assert.match(source, /loading="lazy"/);
  assert.match(source, /decoding="async"/);
  assert.match(source, /captureCoverFromVideo/);
  assert.match(source, /sp-cover-canvas/);
  assert.match(source, /preload = 'metadata'/);
  assert.doesNotMatch(source, /<video[^>]*class="sp-cover/);
});

test('la biblioteca mantiene favoritos, vídeo, ver y añadir', () => {
  assert.match(source, /Solo con vídeo/);
  assert.match(source, /Solo favoritos/);
  assert.match(source, /favorite-exercise/);
  assert.match(source, /view-exercise/);
  assert.match(source, /add-exercise-to-session/);
});

test('Sesiones permite filtrar Mis ejercicios dentro de Categoría', () => {
  assert.match(source, /Mis ejercicios/);
  assert.match(source, /category === '__mine__'/);
  assert.match(source, /item\.isMine/);
  assert.match(source, /card\.dataset\.userCreated/);
});

test('el resumen expresa minutos y permite ver o quitar sin quedarse fijo al hacer scroll', () => {
  assert.match(source, /min de \$\{target\} min/);
  assert.match(source, /remove-session-block/);
  assert.match(source, /data-exercise-id/);
  assert.match(source, /\.session-plan-control\{position:static/);
  assert.doesNotMatch(source, /\.session-plan-control\{position:sticky/);
  assert.match(source, /Añade ejercicios desde abajo\./);
});

test('el buscador global conserva el formato validado pero no queda fijado', () => {
  assert.match(source, /input\.placeholder = 'Buscar'/);
  assert.match(source, /\.search-bar:before\{content:"Buscar"/);
  assert.match(source, /background:var\(--brand\)/);
  assert.match(source, /\.search-bar\{position:static/);
  assert.doesNotMatch(source, /\.search-bar\{position:sticky/);
});

test('el planificador y la PWA cargan la misma revisión actual', () => {
  assert.match(demo, /session-planner-ui\.js\?v=20260927-v66-real-calendar-dates/);
  assert.match(sw, /20260927-v66-real-calendar-dates/);
  assert.match(sw, /session-planner-ui\.js\?v=20260927-v66-real-calendar-dates/);
  assert.match(pkg.scripts.check, /node --check js\/session-planner-ui\.js/);
  assert.equal(pkg.version, '2.44.0');
});
