import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('el controlador de pizarra reutilizable exporta initTacticBoard y usa el patrón in situ', async () => {
  const controller = await projectFile('js/tactic-board-controller.js');
  assert.match(controller, /export function initTacticBoard/);
  // Durante el arrastre se actualiza in situ (setAttribute), no se re-renderiza el contenedor.
  assert.match(controller, /updatePieceInPlace/);
  assert.match(controller, /setAttribute\('cx'/);
  assert.match(controller, /setAttribute\('cy'/);
  // El re-render solo ocurre al soltar (pointerup), no en cada pointermove.
  assert.match(controller, /const up = \(\) => \{[\s\S]*?render\(\)/);
});

test('el controlador cubre mover, balón, borrar línea, limpiar y los cinco tipos de flecha', async () => {
  const controller = await projectFile('js/tactic-board-controller.js');
  assert.match(controller, /tool === 'select'/);
  assert.match(controller, /tool === 'ball'/);
  assert.match(controller, /tool === 'erase'/);
  assert.match(controller, /tool === 'clear'/);
  assert.match(controller, /ARROW_KINDS\.has\(tool\)/);
  assert.match(controller, /createTacticMove\(start, to, tool\)/);
  assert.match(controller, /moveTacticPiece\(getState\(\), side, idx, p\)/);
});

test('el controlador sincroniza pizarra normal y ampliada a través del mismo estado', async () => {
  const controller = await projectFile('js/tactic-board-controller.js');
  assert.match(controller, /const roots = \[board, boardFull\]\.filter\(Boolean\)/);
  assert.match(controller, /for \(const root of roots\) root\.addEventListener\('pointerdown', begin\)/);
  assert.match(controller, /for \(const bar of \[tools, toolsFull\]\.filter\(Boolean\)\)/);
});

test('la guía muestra dentro del desplegable la pizarra editable real y la sincroniza al ampliar', async () => {
  const [viewer, css] = await Promise.all([
    projectFile('js/tactica-guia-viewer.js'),
    projectFile('styles.css'),
  ]);
  assert.match(viewer, /data-tg-board-tools role="toolbar" aria-label="Herramientas de la pizarra"/);
  assert.match(viewer, /<div data-tg-board><\/div>/);
  assert.match(viewer, /data-tg-board-open>⛶ Ampliar pizarra<\/button>/);
  assert.doesNotMatch(viewer, /<button[^>]+data-tg-board-full/);
  assert.match(viewer, /const board = \$\('\[data-tg-board\]'\)/);
  assert.match(viewer, /const tools = \$\('\[data-tg-board-tools\]'\)/);
  assert.match(viewer, /initTacticBoard\(\{ board, boardFull, tools, toolsFull,/);
  assert.match(viewer, /board\.innerHTML = renderTacticBoard\(boardState\)/);
  assert.match(viewer, /class="live-tactics-lightbox live-tactics" data-tg-board-lightbox/);
  assert.match(viewer, /class="tg-close-full" data-tg-board-close>Cerrar pizarra<\/button>/);
  assert.match(viewer, /class="tg-close-full" data-tg-player-close>Cerrar animación<\/button>/);
  assert.match(css, /\.tg-close-full\{[^}]*position:fixed[^}]*bottom:max\(16px,env\(safe-area-inset-bottom\)\)[^}]*background:var\(--brand\)[^}]*color:#fff/);
  assert.match(css, /\[data-tg-board-lightbox\]\.open \.tg-close-full\{display:block\}/);
  assert.match(css, /\[data-tg-board-lightbox\] \.lb-board\{[^}]*padding-bottom:calc\(4\.5rem \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /\[data-tg-board-lightbox\] \[data-tg-board-full\]\{width:auto;max-height:100%;flex:0 0 auto\}/);
  assert.match(css, /\[data-tg-board-lightbox\] \.lb-board \.tactic-tools\{[^}]*width:min\(40vw,360px\)[^}]*max-width:min\(40vw,360px\)[^}]*flex:0 0 min\(40vw,360px\)[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)[^}]*max-height:calc\(100dvh - 6rem\)/);
  // La pizarra de la guía captura el gesto táctil para dibujar flechas en móvil.
  assert.match(css, /\.tg-board-section \.tactic-board svg[^{]*\{[^}]*touch-action:none/);
  assert.match(css, /\[data-tg-board-lightbox\] \[data-tg-board-full\] \.tactic-board svg[^{]*\{[^}]*touch-action:none/);
  // Fullscreen CSS propio como respaldo a requestFullscreen (iOS Safari).
  assert.match(css, /\.tg-player-shell\.tg-fullscreen\{[^}]*position:fixed[^}]*inset:0/);
  assert.match(css, /\.tg-player-shell\.tg-fullscreen \.tg-close-full\{display:block\}/);
  assert.match(viewer, /playerShell\.classList\.add\('tg-fullscreen'\)/);
  assert.match(viewer, /playerShell\.classList\.remove\('tg-fullscreen'\)/);
});
