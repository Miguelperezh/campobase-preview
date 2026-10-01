import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

test('el visor espera a que el movimiento esté cargado antes de reproducir', async () => {
  let source = fs.readFileSync('js/exercise-viewer-layout.js', 'utf8');
  source += '\nglobalThis.__runInnerPlayback = runInnerPlayback;';

  const context = { globalThis: null, console, setTimeout, clearTimeout };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context);

  let clicks = 0;
  const play = { disabled: true, click(){ clicks += 1; } };
  const doc = {
    getElementById(id){
      if (id === 'phasePlay') return play;
      return null;
    },
    querySelectorAll(){ return []; },
  };
  const frame = { contentDocument: doc };

  context.__runInnerPlayback(frame);
  setTimeout(() => { play.disabled = false; }, 170);
  await new Promise((resolve) => setTimeout(resolve, 520));

  assert.equal(clicks, 1, 'debe reproducir una vez cuando el Play interno ya está habilitado');
});

test('el visor prioriza el Play de fases real', () => {
  const source = fs.readFileSync('js/exercise-viewer-layout.js', 'utf8');
  assert.equal(source.includes("doc.getElementById('phasePlay')"), true);
  assert.equal(source.includes('attempt < 14'), true);
  assert.equal(source.includes('90)'), true);
});
