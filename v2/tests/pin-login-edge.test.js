import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const edge = await readFile(new URL('../supabase/functions/pin-login/index.ts', import.meta.url), 'utf8');

test('el login PIN usa service role solo dentro de Edge y no expone la clave al cliente', () => {
  assert.match(edge, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(edge, /createClient\(supabaseUrl, serviceKey/);
  assert.doesNotMatch(edge, /return json\(\{[^}]*service/i);
});

test('el PIN se compara como SHA-256 de salt:pin y en tiempo constante', () => {
  assert.match(edge, /sha256Hex\(`\$\{config\.payload\.pinSalt\}:\$\{pin\}`\)/);
  assert.match(edge, /function safeEqual/);
  assert.match(edge, /const pinOk = safeEqual/);
});

test('el endpoint limita intentos antes de validar el PIN', () => {
  assert.match(edge, /pin_login_attempts/);
  assert.match(edge, /ipFailures/);
  assert.match(edge, /userFailures/);
  assert.match(edge, />= 5/);
  assert.match(edge, />= 20/);
  assert.match(edge, /Demasiados intentos/);
});

test('el PIN solo crea sesión para cuentas con acceso comercial activo', () => {
  assert.match(edge, /\.from\("suscripciones"\)/);
  assert.match(edge, /\["gift_free", "trial", "active"\]/);
  assert.match(edge, /Esta cuenta no tiene acceso activo/);
});

test('el endpoint genera token hash y no envía correo', () => {
  assert.match(edge, /auth\.admin\.generateLink/);
  assert.match(edge, /type: "magiclink"/);
  assert.match(edge, /hashed_token/);
  assert.doesNotMatch(edge, /signInWithOtp/);
});

test('el endpoint permite resolver la cuenta por PIN o identificador cuando no se pasa user_id', () => {
  assert.match(edge, /body\.identifier/);
  assert.match(edge, /from\("configuracion"\)/);
  assert.match(edge, /user_id: userId/);
});

