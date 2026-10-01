import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

test('Mis ejercicios se rehidrata, traduce el formato de Supabase y usa visor read-only', async () => {
  let source = fs.readFileSync('js/runtime-refresh.js', 'utf8');
  const persistence = fs.readFileSync('js/exercise-board-persistence.js', 'utf8');

  assert.equal(source.includes('saveFromBoard'), false, 'runtime-refresh no debe guardar ejercicios');
  assert.equal(source.includes("data.type === 'campobase:exercise-saved'"), false, 'runtime-refresh no debe escuchar el guardado');
  assert.equal(source.includes("put('settings'"), false, 'runtime-refresh no debe persistir settings');
  assert.equal(persistence.includes("data.type === 'campobase:exercise-saved'"), true, 'solo persistence debe escuchar el guardado');
  assert.equal(source.includes("await readCustomExercises().catch(() => [])"), true, 'debe cargar Mis ejercicios localmente al arrancar');
  assert.equal(source.includes('hydrateCustomExercises({ attempts: 1 })'), true, 'debe hacer una única sincronización cloud en segundo plano');
  assert.equal(source.includes('records.map(toBoardExercise)'), true, 'el Creador debe recibir el formato que entiende la pizarra');
  assert.equal(source.includes('exercise: toBoardExercise(pendingViewer.record)'), true, 'el visor debe recibir plano y movimiento en formato de pizarra');

  const persisted = [{
    id: 'mine-test-123', recordType: 'exercise', customBoard: true, name: 'Rondo salida',
    category: 'Mis ejercicios', players: '7', duration: 12, material: '4 conos y 1 balón',
    intensity: 'Media', objective: 'Salir de presión', description: 'Dos apoyos por fuera.\nObservar perfil corporal.', favorite: false,
    boardReps: 3, boardPause: 20, boardSaveMode: 'both',
    boardStatic: { field: 'full', phases: [{ id: 'frame-0' }] },
    boardPreview: '<svg viewBox="0 0 10 10"></svg>',
    boardAnimation: { phases: [{ id: 'p1' }, { id: 'p2' }] },
    boardCoverSourceType: 'frame', boardCoverFrameProgress: 0.5,
  }];

  source = source.replace(
    "import { syncFromCloud, getAll } from './db.js';",
    "const syncFromCloud=async()=>{globalThis.__syncCalls=(globalThis.__syncCalls||0)+1; if(globalThis.__syncCalls<3)return {online:false,pending:0}; globalThis.__cloudReady=true; return {online:true,pending:0};}; const getAll=async()=>globalThis.__cloudReady?globalThis.__persisted:[];",
  );
  source = source.replace('export function installRuntimeRefresh()', 'function installRuntimeRefresh()');
  source += '\nglobalThis.__renderCustomBoardCard = customBoardCardMarkup; globalThis.__hydrate = hydrateCustomExercises; globalThis.__toBoardExercise = toBoardExercise; globalThis.__viewerMetadataMarkup = viewerMetadataMarkup;';

  const context = {
    globalThis: null, console, URL, Blob, TextDecoder, Response, DecompressionStream, Uint8Array,
    setTimeout, clearTimeout, crypto: globalThis.crypto, __persisted: persisted,
    document: { querySelectorAll(){ return []; }, querySelector(){ return null; }, getElementById(){ return null; } },
    requestAnimationFrame(fn){ fn(); },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source.replace("if (typeof document !== 'undefined') {\n  if (document.readyState === 'loading')", "if (false) {\n  if (document.readyState === 'loading')"), context);

  const hydrated = await context.__hydrate({ attempts: 5 });
  assert.equal(context.__cloudReady, true);
  assert.equal(context.__syncCalls, 3, 'debe esperar a que Supabase esté disponible antes de fijar la lista');
  assert.equal(hydrated.records.length, 1);

  const boardExercise = context.__toBoardExercise(persisted[0]);
  assert.equal(boardExercise.saveMode, 'both');
  assert.equal(boardExercise.staticBoard.phases[0].id, 'frame-0');
  assert.equal(boardExercise.animatedBoard.phases.length, 2);
  assert.equal(boardExercise.reps, 3);
  assert.equal(boardExercise.pause, 20);
  assert.equal(boardExercise.description, 'Dos apoyos por fuera.\nObservar perfil corporal.');

  const html = context.__renderCustomBoardCard(persisted[0]);
  const visibleText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  assert.equal(visibleText.includes('mine-test-123'), false, 'el identificador interno no debe verse');

  for (const forbidden of [
    'Montaje', 'Desarrollo paso a paso', 'Rotación:', 'Qué se trabaja', 'Qué busco',
    'Qué debo observar', 'Correcciones breves', 'Si sale mal', 'Si sale bien', '>Editar<', '>Borrar<', '>Ver movimiento<',
  ]) assert.equal(html.includes(forbidden), false, `la ficha no debe contener: ${forbidden}`);

  for (const expected of [
    'Mis ejercicios', 'Rondo salida', '7', '12 min', '4 conos y 1 balón', 'Salir de presión',
    'Dos apoyos por fuera.', 'Explicación / observaciones', 'Plano de pizarra', 'Ver ejercicio', 'Añadir a sesión',
  ]) assert.equal(html.includes(expected), true, `la ficha debe contener: ${expected}`);

  const viewerMeta = context.__viewerMetadataMarkup(persisted[0]);
  for (const expected of ['Jugadores', 'Duración', 'Intensidad', 'Material', 'Objetivo', 'Explicación / observaciones', 'Observar perfil corporal.']) {
    assert.equal(viewerMeta.includes(expected), true, `el visor debe mostrar: ${expected}`);
  }

  for (const expected of ['Plano fijo', 'Movimiento', 'exercise-board-viewer-modes']) {
    assert.equal(source.includes(expected), true, `los controles del visor deben ser visibles: ${expected}`);
  }
});
