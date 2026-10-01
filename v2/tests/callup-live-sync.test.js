import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildReadyTimerFromPreparation } from '../js/live-tactics.js';
import { guardSaasSession } from '../js/saas-session-guard.js';

test('buildReadyTimerFromPreparation auto-repara la alineación cuando faltan jugadores por cambios en convocatoria', () => {
  const team = [
    { pos: 'Portero', playerId: 'p1' },
    { pos: 'Defensa Central', playerId: 'p2' },
    { pos: 'Lateral Derecho', playerId: 'p3' },
    { pos: 'Lateral Izquierdo', playerId: 'p_excluded' }, // este jugador ya no está convocado
    { pos: 'Mediocentro', playerId: 'p5' },
    { pos: 'Extremo', playerId: 'p6' },
    { pos: 'Delantero', playerId: 'p7' },
  ];
  // En availableIds, 'p_excluded' fue quitado y entró 'p_new'
  const availableIds = ['p1', 'p2', 'p3', 'p5', 'p6', 'p7', 'p_new', 'p_bench'];

  const timer = buildReadyTimerFromPreparation({
    matchId: 'm1',
    team,
    availableIds,
    firstKeeper: 'p1',
    secondKeeper: 'p_new',
  });

  assert.equal(timer.onField.length, 7, 'Debe haber exactamente 7 jugadores en campo');
  assert.equal(new Set(timer.onField).size, 7, 'Los 7 jugadores deben ser únicos');
  assert.ok(timer.onField.includes('p1'), 'El portero debe estar en campo');
  assert.ok(!timer.onField.includes('p_excluded'), 'El jugador excluido no debe estar en campo');
  assert.ok(timer.onField.includes('p_new'), 'El jugador sustituto disponible debe ocupar la plaza vacante');
});

test('guardSaasSession no lanza ReferenceError cuando session no existe o hay usuario vinculado', async () => {
  const fakeClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  };
  // No debe lanzar error
  const result = await guardSaasSession(fakeClient);
  assert.equal(result, true);
});

test('saveCallup sincroniza la preparación y el temporizador en vivo con la nueva convocatoria', async () => {
  const appJs = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  assert.match(
    appJs,
    /prepForMatch\(match\.id\)[\s\S]*applyPreparacionToLive/,
    'saveCallup debe actualizar la preparación y el partido en vivo',
  );
  assert.match(
    appJs,
    /liveTactic = null/,
    'saveCallup debe invalidar liveTactic para que la pizarra en vivo se regenere con los nuevos convocados',
  );
});

test('submitAuth aplica el rol inmediatamente y corre la sincronización en background', async () => {
  const appJs = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const submitAuthBody = appJs.slice(appJs.indexOf('async function submitAuth'), appJs.indexOf('async function pollLiveState'));
  assert.match(
    submitAuthBody,
    /\$\('#auth-dialog'\)\?\.close\(\);\s*applyRole\('owner'\);/,
    'submitAuth debe cerrar el diálogo y aplicar rol inmediatamente tras verificar PIN local',
  );
});

test('syncFromCloud comprueba si los datos cambiaron antes de sustituir el almacén', async () => {
  const dbJs = await readFile(new URL('../js/db.js', import.meta.url), 'utf8');
  assert.match(
    dbJs,
    /changed:\s*hasChanges/,
    'syncFromCloud debe devolver si hubo cambios en los datos descargados',
  );
});
