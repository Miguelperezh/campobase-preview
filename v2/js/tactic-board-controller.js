// Controlador reutilizable de la pizarra táctica editable.
// Reutiliza el patrón validado de CampoBase: durante el arrastre se actualizan
// las coordenadas in situ (setAttribute sobre circle/text), NO se re-renderiza
// el contenedor en cada pointermove. Re-renderizar en cada move desconecta el
// SVG y provoca el salto de la ficha a la esquina (x/y = 96).
//
// Se usa tanto en la pizarra normal como en la ampliada, manteniéndolas
// sincronizadas a través del mismo estado.

import { TACTIC_TOOLS, createTacticMove, moveTacticPiece, renderTacticToolIcon } from './tactics.js';

const ARROW_KINDS = new Set(['pass', 'move', 'dribble', 'shot', 'sprint']);

// Convierte un evento de puntero a coordenadas del viewBox (0..100) del SVG.
function boardPoint(event, svg) {
  const rect = svg.getBoundingClientRect();
  return {
    x: Math.max(4, Math.min(96, ((event.clientX - rect.left) / rect.width) * 100)),
    y: Math.max(4, Math.min(96, ((event.clientY - rect.top) / rect.height) * 100)),
  };
}

// Actualiza una pieza in situ en todas las pizarras conectadas (normal y ampliada).
function updatePieceInPlace(roots, side, idx, piece) {
  for (const root of roots) {
    const el = root.querySelector(`[data-piece="${side}"][data-idx="${idx}"]`);
    if (!el) continue;
    const circle = el.querySelector('circle');
    const text = el.querySelector('text');
    if (circle) { circle.setAttribute('cx', piece.x); circle.setAttribute('cy', piece.y); }
    if (text) { text.setAttribute('x', piece.x); text.setAttribute('y', piece.y + 1.3); }
  }
}

// Inicializa la interacción de una pizarra táctica editable.
//   board / boardFull: contenedores donde se pinta el SVG (renderTacticBoard).
//   tools / toolsFull: barras de herramientas (normal y ampliada).
//   getState / setState: acceso al estado de la táctica (team, opponent, ball, moves).
//   render: callback que repinta board y boardFull a partir del estado actual.
export function initTacticBoard({ board, boardFull, tools, toolsFull, getState, setState, render }) {
  let tool = 'select';
  const roots = [board, boardFull].filter(Boolean);

  function renderTools() {
    const markup = TACTIC_TOOLS.map((t) => `<button type="button" class="tactic-tool ${t.id === tool ? 'active' : ''}" data-board-tool="${t.id}" title="${t.label}">${renderTacticToolIcon(t.id)}<span class="tactic-tool-label">${t.label}</span></button>`).join('');
    if (tools) tools.innerHTML = markup;
    if (toolsFull) toolsFull.innerHTML = markup;
  }

  function setTool(id) {
    tool = id;
    renderTools();
  }

  function renderAll() {
    renderTools();
    render();
  }

  function begin(event) {
    const svg = event.target.closest('.tactic-board svg');
    if (!svg) return;
    const piece = event.target.closest('[data-piece]')?.dataset.piece;
    const point = boardPoint(event, svg);

    if (tool === 'select' && (piece === 'team' || piece === 'opponent')) {
      const idx = Number(event.target.closest('[data-idx]').dataset.idx);
      const side = piece;
      const move = (ev) => {
        const p = boardPoint(ev, svg);
        setState(moveTacticPiece(getState(), side, idx, p));
        updatePieceInPlace(roots, side, idx, getState()[side][idx]);
      };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        render();
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    } else if (tool === 'ball') {
      setState(moveTacticPiece(getState(), 'ball', 0, point));
      render();
    } else if (tool === 'erase') {
      const arrow = event.target.closest('[data-piece="arrow"]');
      if (arrow?.dataset.idx !== undefined) {
        const idx = Number(arrow.dataset.idx);
        setState({ ...getState(), moves: (getState().moves || []).filter((_, i) => i !== idx) });
        render();
      }
    } else if (tool === 'clear') {
      setState({ ...getState(), moves: [] });
      tool = 'select';
      render();
    } else if (ARROW_KINDS.has(tool)) {
      const start = point;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', start.x); line.setAttribute('y1', start.y);
      line.setAttribute('x2', start.x); line.setAttribute('y2', start.y);
      line.setAttribute('class', 'tac-arrow');
      svg.appendChild(line);
      const move = (ev) => { const p = boardPoint(ev, svg); line.setAttribute('x2', p.x); line.setAttribute('y2', p.y); };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        const to = { x: Number(line.getAttribute('x2')), y: Number(line.getAttribute('y2')) };
        line.remove();
        const created = createTacticMove(start, to, tool);
        if (created) setState({ ...getState(), moves: [...(getState().moves || []), created] });
        render();
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    }
  }

  for (const root of roots) root.addEventListener('pointerdown', begin);
  for (const bar of [tools, toolsFull].filter(Boolean)) {
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-board-tool]');
      if (btn) setTool(btn.dataset.boardTool);
    });
  }

  renderAll();
  return { setTool, getTool: () => tool, render: renderAll };
}
