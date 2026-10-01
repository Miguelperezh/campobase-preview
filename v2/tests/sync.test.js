import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLOUD_TABLES,
  buildMutation,
  mergeCloudRecord,
  reconcileCloudSnapshot,
  sanitizeRecordForCloud,
} from '../js/sync-core.js';

test('mapea cada almacén local a su tabla de Supabase', () => {
  assert.deepEqual(CLOUD_TABLES, {
    players: 'jugadores',
    callups: 'convocatorias',
    matches: 'partidos',
    trainings: 'asistencias',
    settings: 'configuracion',
  });
});

test('sincroniza la configuración única de los PIN para no volver a crearla en cada dispositivo', () => {
  const local = {
    id: 'main',
    format: 'F11',
    pinSalt: 'sal-local',
    ownerPinHash: 'hash-migue',
    delegatePinHash: 'hash-delegado',
  };
  assert.deepEqual(sanitizeRecordForCloud('settings', local), local);
  assert.deepEqual(sanitizeRecordForCloud('players', { id: 'p1', name: 'Leo' }), { id: 'p1', name: 'Leo' });
});

test('al bajar ajustes aplica los PIN configurados una vez en la nube', () => {
  const local = { id: 'main', format: 'F7' };
  const cloud = { id: 'main', format: 'F11', pinSalt: 'sal', ownerPinHash: 'm', delegatePinHash: 'd' };
  assert.deepEqual(mergeCloudRecord('settings', local, cloud), {
    id: 'main', format: 'F11', pinSalt: 'sal', ownerPinHash: 'm', delegatePinHash: 'd',
  });
});

test('durante la migración conserva los PIN ya creados si la nube todavía no los tiene', () => {
  const local = { id: 'main', format: 'F7', pinSalt: 'sal', ownerPinHash: 'm', delegatePinHash: 'd', demoPinSalt: 'sal-demo', demoPinHash: 'demo' };
  const cloud = { id: 'main', format: 'F11' };
  assert.deepEqual(mergeCloudRecord('settings', local, cloud), {
    id: 'main', format: 'F11', pinSalt: 'sal', ownerPinHash: 'm', delegatePinHash: 'd', demoPinSalt: 'sal-demo', demoPinHash: 'demo',
  });
});

test('mergeCloudRecord conserva los permisos y PIN del delegado si la nube todavía no los tiene', () => {
  const local = { id: 'main', format: 'F7', delegatePin: '1234', delegatePermissions: ['partido', 'plantilla', 'modo-campo'] };
  const cloud = { id: 'main', format: 'F7' };
  assert.deepEqual(mergeCloudRecord('settings', local, cloud), {
    id: 'main', format: 'F7', delegatePin: '1234', delegatePermissions: ['partido', 'plantilla', 'modo-campo'],
  });
});

test('la ficha permite elegir una foto o abrir la cámara del móvil', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /name="photo"[^>]*type="file"[^>]*accept="image\/\*"[^>]*capture="environment"/);
});

test('crea mutaciones reproducibles para altas y borrados offline', () => {
  assert.deepEqual(buildMutation('players', 'upsert', { id: 'p1', name: 'Leo' }, 123), {
    id: 'players:p1', store: 'players', operation: 'upsert', recordId: 'p1',
    payload: { id: 'p1', name: 'Leo' }, queuedAt: 123,
  });
  assert.deepEqual(buildMutation('matches', 'delete', 'm1', 456), {
    id: 'matches:m1', store: 'matches', operation: 'delete', recordId: 'm1',
    payload: null, queuedAt: 456,
  });
  assert.throws(() => buildMutation('desconocido', 'upsert', { id: 'x' }, 1), /almacén/i);
});

test('un snapshot antiguo no pisa altas ni resucita borrados que siguen pendientes', () => {
  const localPreparation = {
    id: 'prep-1', recordType: 'preparacion', matchId: 'm1', team: [{ playerId: 'p1' }], savedAt: 200,
  };
  const staleCloudPreparation = {
    id: 'prep-1', recordType: 'preparacion', matchId: 'm1', team: [{ playerId: 'portero' }], savedAt: 100,
  };
  const pendingUpsert = buildMutation('settings', 'upsert', localPreparation, 200);
  const pendingDelete = buildMutation('settings', 'delete', 'prep-borrada', 201);

  assert.deepEqual(reconcileCloudSnapshot(
    'settings',
    [localPreparation],
    [staleCloudPreparation, { id: 'prep-borrada', recordType: 'preparacion' }],
    [pendingUpsert, pendingDelete],
  ), [localPreparation]);
});
