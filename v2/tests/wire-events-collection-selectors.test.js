import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

test('wireEvents usa selectores de colección para pestañas y cierres', () => {
  assert.match(
    appSource,
    /\$\$\('\.exercise-library-tab'\)\.forEach/,
    'Las pestañas de ejercicios deben usar $$() porque se recorren con forEach',
  );
  assert.match(
    appSource,
    /\$\$\('\[data-close\]'\)\.forEach/,
    'Los botones data-close deben usar $$() porque se recorren con forEach',
  );
  assert.match(
    appSource,
    /\$\$\('\[data-dialog\]'\)\.forEach/,
    'Los botones data-dialog deben usar $$() porque se recorren con forEach',
  );
  assert.doesNotMatch(
    appSource,
    /(^|[^$])\$\('\.exercise-library-tab'\)\.forEach/m,
  );
  assert.doesNotMatch(
    appSource,
    /(^|[^$])\$\('\[data-close\]'\)\.forEach/m,
  );
  assert.doesNotMatch(
    appSource,
    /(^|[^$])\$\('\[data-dialog\]'\)\.forEach/m,
  );
});
