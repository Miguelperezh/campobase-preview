import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

test('Crear ejercicio muestra fichas gestionables con imagen y el visor no permite volver a editar fases', () => {
  let source = fs.readFileSync('js/exercise-board-persistence.js', 'utf8');
  source = source.replace(
    "import { getAll, put, remove, syncFromCloud } from './db.js';",
    "const getAll=async()=>[]; const put=async()=>{}; const remove=async()=>{}; const syncFromCloud=async()=>({online:true,pending:0});",
  );
  source += '\nglobalThis.__creatorCardMarkup=creatorCardMarkup; globalThis.__applyReadOnlyViewer=applyReadOnlyViewer;';

  const context = {
    globalThis: null,
    console,
    crypto: globalThis.crypto,
    setTimeout,
    clearTimeout,
    alert() {},
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context);

  const html = context.__creatorCardMarkup({
    id: 'mine-card-1',
    name: 'Salida y pase',
    boardPreview: '<svg viewBox="0 0 10 10"><rect width="10" height="10"/></svg>',
    boardAnimation: { phases: [{ id: 'p1' }, { id: 'p2' }] },
    duration: 12,
    intensity: 'Alta',
    boardReps: 4,
    boardPause: 20,
    players: '8',
    material: '6 conos, 2 balones',
    objective: 'Salida limpia',
    description: 'Perfil orientado.\nObservar apoyos.',
  });

  for (const expected of [
    '<svg', 'Salida y pase', 'Movimiento', '12 min', 'Alta', '4 rep.', '20 s pausa', '8 jugadores',
    'Material:', '6 conos, 2 balones', 'Objetivo:', 'Salida limpia', 'Explicación / observaciones:',
    'Perfil orientado.', 'Editar ficha', 'Editar plano fijo', 'Editar movimientos', 'Borrar',
  ]) {
    assert.equal(html.includes(expected), true, `la ficha del Creador debe contener: ${expected}`);
  }

  const close = { disabled: false, hidden: false, tabIndex: 0 };
  let styleText = '';
  const doc = {
    body: { classList: { contains(value) { return value === 'embedded-view'; } } },
    getElementById(id) {
      if (id === 'closeBoardView') return close;
      if (id === 'campobase-readonly-view-style') return null;
      return null;
    },
    createElement(tag) { return { tagName: tag.toUpperCase(), id: '', textContent: '' }; },
    head: { append(node) { styleText += node.textContent || ''; } },
  };

  context.__applyReadOnlyViewer(doc);
  assert.equal(close.hidden, true, 'Cerrar vista debe quedar oculto');
  assert.equal(close.disabled, true, 'Cerrar vista debe quedar inutilizado');
  assert.equal(close.tabIndex, -1, 'Cerrar vista no debe poder recibir foco');
  assert.equal(styleText.includes('#closeBoardView{display:none!important}'), true);
  assert.equal(styleText.includes('.phase3-shell'), true, 'el editor de fases no debe mostrarse en el visor');
  assert.equal(styleText.includes('.material-panel'), true, 'los materiales de edición no deben mostrarse en el visor');
  assert.equal(styleText.includes('.inspector-panel'), true, 'el inspector de edición no debe mostrarse en el visor');
});
