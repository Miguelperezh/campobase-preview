import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

test('auth-dialog incluye botones de Modo Demo, Recargar app y ¿Olvidaste el PIN?', () => {
  assert.match(html, /id="auth-demo-btn"/, 'Debe incluir botón Modo Demo');
  assert.match(html, /id="auth-reload-btn"/, 'Debe incluir botón Recargar app');
  assert.match(html, /id="auth-reset-btn"/, 'Debe incluir botón de recuperación de PIN');
});

test('Ajustes incluye controles de Cerrar sesión y Recargar app', () => {
  assert.match(html, /id="settings-logout"/, 'Ajustes debe incluir botón Cerrar sesión');
  assert.match(html, /id="settings-reload"/, 'Ajustes debe incluir botón Recargar app');
});

test('submitAuth en js/app.js permite escribir demo y maneja recuperacion de PIN', () => {
  assert.match(app, /pin\.toLowerCase\(\)\s*===\s*'demo'/, 'Debe admitir "demo" directamente en el PIN');
  assert.match(app, /auth-demo-btn/, 'Debe conectar listener de Modo Demo');
  assert.match(app, /auth-reload-btn/, 'Debe conectar listener de Recargar app');
  assert.match(app, /auth-reset-btn/, 'Debe conectar listener de reseteo de PIN');
  assert.match(app, /settings-logout/, 'Debe conectar listener de Cerrar sesión en ajustes');
  assert.match(app, /settings-reload/, 'Debe conectar listener de Recargar en ajustes');
});

test('sw.js e index.html están sincronizados a v=20260927-v66-real-calendar-dates', () => {
  assert.match(sw, /duration-2503/, 'sw.js debe tener la clave de caché con 2503');
  assert.match(html, /styles-redesign\.css\?v=20260927-v66-real-calendar-dates/, 'index.html debe cargar estilos con v=20260927-v66-real-calendar-dates');
  assert.match(html, /js\/app\.js\?v=20260927-v66-real-calendar-dates/, 'index.html debe cargar app.js con v=20260927-v66-real-calendar-dates');
});
