import test from 'node:test';
import assert from 'node:assert/strict';
import {
  nombreCorto, isKeeper, playerById, buildLiveState, buildReadyTimerFromPreparation, asignarJugador, cargarFormacion,
  applyLineupToLiveTeam, opcionesPosicion, suplentes, canAssignPlayerToSlot, LIVE_FORMATIONS, TACTICA_MP4,
} from '../js/live-tactics.js';

const players = [
  { id: 'j1', name: 'Ramiro Casati', number: '1', positions: ['Portero'] },
  { id: 'j2', name: 'Eidan Asensio', number: '3', positions: [] },
  { id: 'j3', name: 'Thiago Hernández', number: '4', positions: [] },
  { id: 'j4', name: 'Diego Andrés Anaya', number: '5', positions: [] },
  { id: 'j5', name: 'Nicolás Díaz-Saavedra', number: '6', positions: [] },
  { id: 'j6', name: 'Alejandro Pedrós', number: '7', positions: [] },
  { id: 'j7', name: 'Alejandro Suárez', number: '8', positions: [] },
  { id: 'j8', name: 'Ignacio Poladura', number: '9', positions: [] },
  { id: 'j9', name: 'Rodrigo Rodríguez', number: '10', positions: [] },
  { id: 'j10', name: 'Aitor Navarro', number: '11', positions: [] },
  { id: 'j11', name: 'Javier Navarro', number: '12', positions: [] },
  { id: 'j12', name: 'Pelayo Marrero', number: '15', positions: [] },
  { id: 'j13', name: 'Pablo Montesdeoca', number: '16', positions: [] },
  { id: 'j14', name: 'Marcel González', number: '18', positions: [] },
  { id: 'j15', name: 'Pablo González', number: '20', positions: [] },
];
const availableIds = players.map((p) => p.id);

test('nombreCorto muestra nombre + inicial del apellido', () => {
  assert.equal(nombreCorto('Ramiro Casati'), 'Ramiro C.');
  assert.equal(nombreCorto('Diego Andrés Anaya'), 'Diego A.');
  assert.equal(nombreCorto('Aarón'), 'Aarón');
  assert.equal(nombreCorto(''), '');
});

test('isKeeper detecta al portero por su posición', () => {
  assert.equal(isKeeper(players[0]), true);
  assert.equal(isKeeper(players[1]), false);
});

test('buildLiveState coloca solo el portero elegido y deja al resto como suplentes', () => {
  const state = buildLiveState(players, availableIds, '1-3-2-1', 'F7', 'j1');
  assert.equal(state.team.length, 7);
  assert.equal(state.opponent.length, 7);
  assert.equal(state.team.find((p) => p.pos === 'Portero').playerId, 'j1');
  assert.ok(state.team.filter((p) => p.pos !== 'Portero').every((p) => p.playerId === ''));
  // Rival en mitad superior (y < 50), equipo en mitad inferior (y >= 40, enfrentado).
  assert.ok(state.opponent.every((p) => p.y < 50));
  assert.ok(state.team.every((p) => p.y >= 40));
});

test('al restaurar un timer hidrata la pizarra con los siete jugadores y no solo con el portero', () => {
  const team = buildLiveState(players, availableIds, '1-3-2-1', 'F7', 'j1').team;
  const onField = ['j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'j7'];
  const restored = applyLineupToLiveTeam(team, onField, 'j1');
  assert.deepEqual(restored.map(({ playerId }) => playerId), onField);
});

test('el portero del segundo tiempo puede jugar de campo durante el primero', () => {
  const team = buildLiveState(players, availableIds, '1-3-2-1', 'F7', 'j1').team;
  const onField = ['j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'j7'];
  const restored = applyLineupToLiveTeam(team, onField, 'j1', ['j1', 'j7']);
  assert.equal(restored.filter(({ playerId }) => playerId).length, 7);
});

test('guardar preparación crea automáticamente el timer ready compartido con owner y delegado', () => {
  const team = buildLiveState(players, availableIds, '1-3-2-1', 'F7', 'j1').team
    .map((position, index) => ({ ...position, playerId: `j${index + 1}` }));
  const timer = buildReadyTimerFromPreparation({
    matchId: 'm1', team, availableIds, firstKeeper: 'j1', secondKeeper: 'j8', delegateShown: true,
  });
  assert.deepEqual(timer.onField, ['j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'j7']);
  assert.deepEqual(timer.initialOnField, timer.onField);
  assert.equal(timer.phase, 'ready');
  assert.equal(timer.delegateUnlocked, true);
  assert.equal(timer.firstKeeper, 'j1');
  assert.equal(timer.secondKeeper, 'j8');
});

test('elegir de portero a un jugador de campo lo intercambia y no lo duplica', () => {
  const team = buildLiveState(players, availableIds, '1-3-2-1', 'F7', 'j1').team
    .map((position, index) => ({ ...position, playerId: `j${index + 1}` }));
  const keeperIndex = team.findIndex(({ pos }) => pos === 'Portero');
  const swapped = asignarJugador(team, keeperIndex, 'j4');
  assert.equal(swapped[keeperIndex].playerId, 'j4');
  assert.equal(swapped[3].playerId, 'j1');
  assert.equal(new Set(swapped.map(({ playerId }) => playerId)).size, 7);
});

test('asignarJugador intercambia posiciones y nunca deja un jugador en dos sitios', () => {
  let team = buildLiveState(players, availableIds, '1-3-2-1', 'F7').team;
  team = asignarJugador(team, 1, 'j2');
  team = asignarJugador(team, 2, 'j3');
  assert.equal(team[1].playerId, 'j2');
  assert.equal(team[2].playerId, 'j3');
  // Mover j2 a la posición 2 intercambia con j3 (que estaba ahí).
  team = asignarJugador(team, 2, 'j2');
  assert.equal(team[2].playerId, 'j2');
  assert.equal(team[1].playerId, 'j3');
  // Un jugador nunca aparece en dos posiciones.
  const ids = team.map((p) => p.playerId).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length);
});

test('cargarFormacion conserva los asignados en orden, sin auto-asignar portero', () => {
  let team = buildLiveState(players, availableIds, '1-3-2-1', 'F7').team;
  team = asignarJugador(team, 1, 'j2');
  team = asignarJugador(team, 2, 'j3');
  team = asignarJugador(team, 3, 'j4');
  const nueva = cargarFormacion(team, players, availableIds, '1-2-3-1', 'F7');
  assert.equal(nueva.length, 7);
  const ids = nueva.map((p) => p.playerId).filter(Boolean);
  assert.deepEqual(ids.sort(), ['j2', 'j3', 'j4'].sort());
});

test('opcionesPosicion ordena titulares primero y suplentes después, solo convocados', () => {
  const team = buildLiveState(players, availableIds, '1-3-2-1', 'F7').team;
  const asignado = asignarJugador(team, 1, 'j2');
  const { titulares, suplentes } = opcionesPosicion(players, availableIds, asignado, 'Defensa izq.', '');
  // Titulares = solo j2 (el único asignado), ordenados por dorsal.
  assert.deepEqual(titulares.map((p) => p.id), ['j2']);
  assert.equal(suplentes.length, 13);
  assert.ok(!suplentes.some((p) => p.id === 'j2'));
  // Los no convocados quedan fuera.
  const convocadosParciales = ['j1', 'j2', 'j3'];
  const { titulares: t2, suplentes: s2 } = opcionesPosicion(players, convocadosParciales, asignado, 'Defensa izq.', '');
  assert.deepEqual([...t2, ...s2].map((p) => p.id).sort(), ['j2', 'j3']);
  const flexible = opcionesPosicion(players, convocadosParciales, asignado, 'Defensa izq.', '', true);
  assert.deepEqual([...flexible.titulares, ...flexible.suplentes].map((p) => p.id).sort(), ['j1', 'j2', 'j3']);
});

test('suplentes devuelve los convocados que no están en el campo', () => {
  const team = buildLiveState(players, availableIds, '1-3-2-1', 'F7').team;
  const asignado = asignarJugador(team, 1, 'j2');
  const lista = suplentes(players, availableIds, asignado);
  assert.equal(lista.length, 14);
  assert.ok(!lista.some((p) => p.id === 'j2'));
});

test('las formaciones en vivo tienen su MP4 asociado', () => {
  assert.deepEqual(LIVE_FORMATIONS, [
    '1-3-2-1', '1-2-3-1', '1-2-2-2', '1-2-1-3', '1-1-3-2', '1-3-3', '1-3-1-2',
    '1-1-3-1-1', '1-1-4-1', '1-4-1-1', '1-2-2-1-1',
  ]);
  for (const f of LIVE_FORMATIONS) {
    assert.match(TACTICA_MP4[f], /assets\/tacticas\/.*\.mp4$/);
    assert.equal(buildLiveState(players, availableIds, f).team.length, 7, `${f}: siete posiciones en vivo`);
  }
});

test('owner y delegado pueden cambiar el portero (causa mayor) y nadie puede colocarlo fuera de portería', () => {
  assert.equal(canAssignPlayerToSlot(players, 'owner', 'Portero', 'j1'), true);
  assert.equal(canAssignPlayerToSlot(players, 'delegate', 'Portero', 'j1'), true);
  assert.equal(canAssignPlayerToSlot(players, 'owner', 'Defensa izq.', 'j1'), false);
  assert.equal(canAssignPlayerToSlot(players, 'delegate', 'Defensa izq.', 'j2'), true);
  assert.equal(canAssignPlayerToSlot(players, 'delegate', 'Defensa izq.', ''), true);
});
