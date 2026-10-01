import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEMO_DURATION_MS,
  createDemoSession,
  demoDatabaseName,
  isDemoSessionActive,
  roleCanUseOwnerFeatures,
} from '../js/demo-session.js';
import {
  configureDemoDatabase,
  configureRealDatabase,
  currentDatabaseName,
  getAll,
  isDemoDatabase,
  put,
} from '../js/db.js';

test('crea una sesión demo aislada que caduca exactamente a las dos horas', () => {
  const session = createDemoSession('sesion-123', 1_000);

  assert.deepEqual(session, { id: 'sesion-123', expiresAt: 1_000 + DEMO_DURATION_MS });
  assert.equal(DEMO_DURATION_MS, 2 * 60 * 60 * 1_000);
  assert.equal(isDemoSessionActive(session, session.expiresAt - 1), true);
  assert.equal(isDemoSessionActive(session, session.expiresAt), false);
  assert.equal(demoDatabaseName(session), 'campobase-demo-sesion-123');
});

test('rechaza sesiones demo manipuladas y nombres que podrían salir de su base aislada', () => {
  assert.throws(() => createDemoSession('../real', 1_000), /identificador/i);
  assert.equal(isDemoSessionActive({ id: 'sesion-123', expiresAt: Number.NaN }, 1_000), false);
  assert.throws(() => demoDatabaseName({ id: '../real', expiresAt: 2_000 }), /sesión demo/i);
});

test('la demo puede usar toda la operativa de Migue salvo los ajustes', () => {
  assert.equal(roleCanUseOwnerFeatures('owner'), true);
  assert.equal(roleCanUseOwnerFeatures('demo'), true);
  assert.equal(roleCanUseOwnerFeatures('delegate'), false);
});

test('activa una base separada para la demo y desactiva toda sincronización real', () => {
  const session = createDemoSession('aislada-123', 1_000);

  configureDemoDatabase(session, 2_000);
  assert.equal(currentDatabaseName(), 'campobase-demo-aislada-123');
  assert.equal(isDemoDatabase(), true);

  configureRealDatabase();
  assert.equal(currentDatabaseName(), 'campobase');
  assert.equal(isDemoDatabase(), false);
});

test('no permite activar una base demo caducada', () => {
  const session = createDemoSession('caducada-123', 1_000);
  assert.throws(() => configureDemoDatabase(session, session.expiresAt), /caducada/i);
});

test('los datos demo viven solo en memoria y cada sesión empieza vacía', async () => {
  configureDemoDatabase(createDemoSession('memoria-uno', 1_000), 2_000);
  await put('players', { id: 'p1', name: 'Temporal' });
  assert.deepEqual(await getAll('players'), [{ id: 'p1', name: 'Temporal' }]);

  configureDemoDatabase(createDemoSession('memoria-dos', 1_000), 2_000);
  assert.deepEqual(await getAll('players'), []);
  configureRealDatabase();
});
