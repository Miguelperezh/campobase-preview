import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

test('refresh no usa un normalizador inexistente', () => {
  assert.doesNotMatch(app, /normalizePlayerName\(/);
});

test('deduplicatePlayers no borra ni modifica jugadores durante refresh', () => {
  const block = app.slice(
    app.indexOf('async function deduplicatePlayers'),
    app.indexOf('async function refresh()')
  );
  assert.match(block, /return false/);
  assert.doesNotMatch(block, /put\(/);
  assert.doesNotMatch(block, /remove\(/);
  assert.doesNotMatch(block, /state\.players\s*=/);
});
