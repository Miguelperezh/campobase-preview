import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, app, sw, cloud] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../js/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../sw.js', import.meta.url), 'utf8'),
  readFile(new URL('../js/supabase-client.js', import.meta.url), 'utf8'),
]);

const BUILD = '20260927-v66-real-calendar-dates';

test('index app cloud y service worker apuntan al mismo build actual', () => {
  assert.match(html, new RegExp(BUILD));
  assert.match(app, new RegExp(BUILD));
  assert.match(sw, new RegExp(BUILD));
  assert.match(cloud, new RegExp(BUILD));
});

test('el HTML puede actualizar el service worker aunque un bundle anterior falle', () => {
  assert.match(html, /window\.__CAMPOBASE_BUILD/);
  assert.match(html, /serviceWorker\.register\('\.\/sw\.js\?v=/);
  assert.match(html, /registration\.update\(\)/);
  assert.match(html, /controllerchange/);
});

test('las navegaciones de la PWA intentan siempre HTML actual desde red', () => {
  assert.match(sw, /event\.request\.mode === 'navigate'/);
  assert.match(sw, /fetch\(event\.request, \{ cache: 'no-store' \}\)/);
});

test('refresh no contiene la regresión normalizePlayerName ni borra jugadores automáticamente', () => {
  const refreshArea = app.slice(app.indexOf('async function deduplicatePlayers'), app.indexOf('function renderAll'));
  assert.doesNotMatch(refreshArea, /normalizePlayerName/);
  assert.doesNotMatch(refreshArea, /remove\('players'/);
  assert.doesNotMatch(refreshArea, /put\('players'/);
});
