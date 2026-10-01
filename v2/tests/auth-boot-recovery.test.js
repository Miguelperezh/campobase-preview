import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('CampoBase nunca queda abierto sin login o PIN', async () => {
  const html = await projectFile('index.html');
  assert.match(html, /Salvavidas del arranque/);
  assert.match(html, /if \(app\?\.state\?\.role\) return/);
  assert.match(html, /document\.body\.classList\.add\('auth-locked'\)/);
  assert.match(html, /dialog\.showModal\(\)/);
});

test('recargar conserva la sesión segura de la pestaña y evita expulsar al usuario', async () => {
  const [app, auth, sw] = await Promise.all([
    projectFile('js/app.js'),
    projectFile('js/saas-auth-ui-v2.js'),
    projectFile('sw.js'),
  ]);
  assert.match(app, /campobase\.activeView/);
  assert.match(app, /20260927-v66-real-calendar-dates/);
  assert.match(auth, /browserSessionIsActive\(session\.user\.id\)[\s\S]*return unlockBoundSession\(client\)/);
  assert.doesNotMatch(auth, /browserSessionIsActive\(session\.user\.id\)[\s\S]{0,120}clearBrowserSessionActive\(\)/);
  assert.doesNotMatch(sw, /client\.navigate\(client\.url\)/);
});


test('una sesión Supabase válida recupera el enlace local sin abrir una base vacía', async () => {
  const client = await projectFile('js/supabase-client.js');
  assert.match(client, /if \(user\?\.id && !boundUserId\)[\s\S]*setBoundSaasUserId\(user\.id\)/);
  assert.match(client, /Recuperamos ese enlace desde la sesión|reconstruimos ese enlace desde la sesión/i);
});

test('si hay sesión válida y PIN del equipo, se conserva la sesión y se pide PIN', async () => {
  const auth = await projectFile('js/saas-auth-ui-v2.js');
  assert.match(auth, /Conserva la sesión válida/);
  assert.match(auth, /ownerPinHash/);
  assert.match(auth, /delegatePinHash/);
  assert.match(auth, /showLocalPin\(\)/);
  assert.doesNotMatch(auth, /await client\.auth\.signOut\(\)\.catch\(\(\) => \{\}\);\s*clearBoundSaasUserId\(\);\s*showPane\('login'\);\s*prefillRememberedIdentifier\(\);\s*return true;/);
});

test('el arranque tiene una salvaguarda final para que nunca queden app y acceso ocultos', async () => {
  const app = await projectFile('js/app.js');
  assert.match(app, /function ensureAuthPromptVisible/);
  assert.match(app, /if \(!state\.role\) ensureAuthPromptVisible\(\)/);
});
