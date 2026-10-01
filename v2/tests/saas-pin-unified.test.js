import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/saas-auth-ui-v2.js', import.meta.url), 'utf8');

test('la cuenta recordada acepta el PIN owner guardado en Supabase', () => {
  assert.match(source, /async function verifyOwnerPinFromSupabase\(client, userId, pin\)/);
  assert.match(source, /\.from\(CLOUD_TABLES\.settings\)/);
  assert.match(source, /\.eq\('user_id', userId\)/);
  assert.match(source, /\.eq\('id', 'main'\)/);
  assert.match(source, /verifyPin\(cleanPin, settings\.pinSalt, settings\.ownerPinHash\)/);
});

test('el formulario de cuenta recordada prueba PIN del dispositivo y después PIN de CampoBase', () => {
  assert.match(source, /const deviceOk = await verifyRememberedPin\(account, enteredPin\)/);
  assert.match(source, /accountOk = await verifyOwnerPinFromSupabase\(client, session\.user\.id, enteredPin\)/);
  assert.match(source, /if \(!deviceOk && !accountOk\) return setMessage\('#saas-remembered-message', 'PIN incorrecto\.'\)/);
});

test('la interfaz deja claro que el PIN se comprueba con la cuenta en Supabase', () => {
  assert.match(source, /Introduce tu PIN de CampoBase\. Se comprueba con la configuración de tu cuenta en Supabase\./);
  assert.match(source, /Acceder con PIN de CampoBase/);
});
