import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

test('el formateador global de fechas no entrega fechas inválidas a Intl.DateTimeFormat', () => {
  const start = app.indexOf('const localDate = (value) => {');
  const end = app.indexOf('const localDateKey', start);
  assert.ok(start >= 0 && end > start);
  const source = app.slice(start, end);

  assert.match(source, /Number\.isFinite\(parsed\.getTime\(\)\)/);
  assert.match(source, /parsed\.getFullYear\(\) !== year/);
  assert.match(source, /parsed\.getMonth\(\) \+ 1 !== month/);
  assert.match(source, /parsed\.getDate\(\) !== day/);
  assert.match(source, /return 'Fecha inválida'/);
  assert.match(source, /try \{/);
  assert.match(source, /catch \{/);
});

test('el build PWA de este hotfix es v65 en app', () => {
  assert.match(app, /20260927-v66-real-calendar-dates/);
});
