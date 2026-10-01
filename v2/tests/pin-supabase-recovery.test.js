import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const cloud = await readFile(new URL('../js/supabase-client.js', import.meta.url), 'utf8');

test('si Supabase ya tiene PIN válidos la app los carga antes de decidir el acceso', () => {
  assert.match(cloud, /export async function getRemoteMainSettings\(\)/);
  assert.match(cloud, /\.eq\('id', 'main'\)/);
  assert.match(app, /async function hydratePinSettingsFromSupabase\(\)/);
  assert.match(app, /const remote = await getRemoteMainSettings\(\)/);
  assert.match(app, /const createModeVisible = !\$\('#initial-pin-fields'\)\?\.classList\.contains\('hidden'\)/);
});

test('guardar PIN compara valores limpios y solo permite 4 a 8 cifras', () => {
  assert.match(app, /const cleanOwnerPin = String\(ownerPin \|\| ''\)\.trim\(\)/);
  assert.match(app, /const cleanDelegatePin = String\(delegatePin \|\| ''\)\.trim\(\)/);
  assert.match(app, /if \(cleanOwnerPin === cleanDelegatePin\)/);
  assert.match(app, /Los PIN deben tener entre 4 y 8 cifras/);
});

test('la hidratación remota no escribe ni sustituye el PIN en Supabase', () => {
  const hydrate = app.slice(app.indexOf('async function hydratePinSettingsFromSupabase'), app.indexOf('async function showAuth'));
  assert.doesNotMatch(hydrate, /put\('settings'/);
  assert.doesNotMatch(hydrate, /upsert/);
});

test('si la pantalla visible es Introduce tu PIN nunca salta a crear dos PIN durante submit', () => {
  const submit = app.slice(app.indexOf('async function submitAuth'), app.indexOf('async function changePins'));
  assert.match(submit, /if \(createModeVisible\)[\s\S]*await savePins/);
  assert.match(submit, /else \{[\s\S]*const pin = String\(form\.elements\.pin\.value \|\| ''\)\.trim\(\)/);
  const loginBranch = submit.slice(submit.indexOf('} else {'));
  assert.doesNotMatch(loginBranch, /await savePins\(/);
  assert.match(loginBranch, /PIN incorrecto\. Comprueba que estás usando el PIN de CampoBase de esta cuenta\./);
});

