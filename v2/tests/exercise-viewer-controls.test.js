import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import test from 'node:test';

const source = fs.readFileSync('js/exercise-viewer-controls.js', 'utf8');
const layoutSource = fs.readFileSync('js/exercise-viewer-layout.js', 'utf8');
const supabaseClient = fs.readFileSync('js/supabase-client.js', 'utf8');
const serviceWorker = fs.readFileSync('sw.js', 'utf8');

function publishedBoardHtml() {
  const encoded = [1, 2, 3, 4].map((n) => fs.readFileSync(`assets/exercise-board/part-${n}.b64`, 'utf8')).join('');
  return zlib.gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');
}

test('Movimiento grande activa el modo animated real sin ocultar el reproductor', async () => {
  await import('../js/exercise-viewer-controls.js');
  assert.match(source, /data-embedded-view=\"animated\"/);
  assert.match(source, /triggerEmbeddedMode/);
  assert.match(source, /embedded-view-controls/);
  assert.doesNotMatch(source, /label === '▶ Movimiento'/);
  assert.doesNotMatch(source, /label === 'Movimiento'/);
  assert.match(source, /exercise-board-viewer-back/);
  assert.match(source, /min-height:56px!important/);
  assert.match(layoutSource, /doc\.getElementById\('viewPlay'\)\s*\|\|\s*doc\.getElementById\('phasePlay'\)/);
  assert.match(layoutSource, /exercise-board-viewer-play/);
});

test('la cadena real Movimiento -> animated -> viewPlay llega a playPhases', () => {
  const boardHtml = publishedBoardHtml();
  assert.match(boardHtml, /data-embedded-view="animated"/);
  assert.match(boardHtml, /id="viewPlay">▶ Reproducir/);
  assert.match(boardHtml, /viewPlayBtn\.addEventListener\('click',\(\)=>\{if\(typeof playPhases==='function'&&!phase3Playing\)playPhases\(\)\}\)/);

  let animatedClicks = 0;
  const innerAnimated = { click(){ animatedClicks += 1; } };
  const frame = {
    contentDocument: {
      body: { classList: { contains: (name) => name === 'embedded-view' } },
      querySelector: (selector) => selector === '[data-embedded-view="animated"]' ? innerAnimated : null,
    },
  };
  const fakeDocument = {
    querySelector: (selector) => selector.includes('iframe') ? frame : null,
    querySelectorAll: () => [],
    documentElement: { dataset: {} },
  };
  const controlsContext = { globalThis: null, document: fakeDocument, console, MutationObserver: class {}, setTimeout };
  controlsContext.globalThis = controlsContext;
  vm.createContext(controlsContext);
  vm.runInContext(`${source.replace("if (typeof document !== 'undefined')", 'if (false)')}\nglobalThis.__triggerEmbeddedMode=triggerEmbeddedMode;`, controlsContext);
  assert.equal(controlsContext.__triggerEmbeddedMode('movement'), true);
  assert.equal(animatedClicks, 1, 'Movimiento debe pulsar el control animated interno');

  let replayClicks = 0;
  const viewPlay = { disabled: false, click(){ replayClicks += 1; } };
  const phasePlay = { disabled: false, click(){ throw new Error('No debe priorizar phasePlay en el visor'); } };
  const playbackDoc = { getElementById(id){ return id === 'viewPlay' ? viewPlay : id === 'phasePlay' ? phasePlay : null; }, querySelectorAll(){ return []; } };
  const layoutContext = { globalThis: null, console, document: {}, window: {}, MutationObserver: class {}, setTimeout };
  layoutContext.globalThis = layoutContext;
  vm.createContext(layoutContext);
  vm.runInContext(`${layoutSource.replace("if (typeof document !== 'undefined')", 'if (false)')}\nglobalThis.__runInnerPlayback=runInnerPlayback;`, layoutContext);
  layoutContext.__runInnerPlayback({ contentDocument: playbackDoc });
  assert.equal(replayClicks, 1, 'Reproducir debe pulsar viewPlay, que llama a playPhases');
});

test('2475 publica solo la corrección del visor y mantiene la integración validada', () => {
  assert.match(supabaseClient, /exercise-viewer-controls\.js\?v=2475/);
  assert.match(supabaseClient, /exercise-viewer-layout\.js\?v=2475/);
  assert.match(supabaseClient, /exercise-board-persistence\.js\?v=20260927-v66-real-calendar-dates/);
  assert.match(supabaseClient, /runtime-refresh\.js\?v=20260927-v66-real-calendar-dates/);
  assert.match(serviceWorker, /exerciseboard-2475/);
  assert.match(serviceWorker, /exercise-viewer-controls\.js\?v=2475/);
  assert.match(serviceWorker, /exercise-viewer-layout\.js\?v=2475/);
});
