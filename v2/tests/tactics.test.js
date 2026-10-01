import test from 'node:test';
import assert from 'node:assert/strict';
import { TACTIC_FORMATS, FORMATION_NAMES, FORMATION_GUIDES, TACTIC_TOOLS, buildTactic, createTacticMove, defaultTactic, moveTacticPiece, renderTacticArrow, renderTacticBoard, renderTacticToolIcon, sortTactics } from '../js/tactics.js';

test('la pizarra táctica genera formaciones F7 y F11 con jugadores y rival', () => {
  const f7 = defaultTactic('F7');
  const f11 = defaultTactic('F11');
  assert.equal(f7.team.length, 7);
  assert.equal(f7.opponent.length, 7);
  assert.equal(f11.team.length, 11);
  assert.equal(f11.opponent.length, 11);
  assert.ok(f7.team.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.n));
  assert.ok(f11.team.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.n));
});

test('precarga once formaciones F7 explicadas con sus posiciones', () => {
  assert.deepEqual(FORMATION_NAMES, [
    '1-3-2-1', '1-2-3-1', '1-2-2-2', '1-3-1-2', '1-1-3-2', '1-3-3',
    '1-4-1-1', '1-2-1-3', '1-1-3-1-1', '1-1-4-1', '1-2-2-1-1',
  ]);
  for (const formation of FORMATION_NAMES) {
    const t = defaultTactic('F7', formation);
    assert.equal(t.team.length, 7, `${formation} debe tener 7 jugadores`);
    assert.ok(t.team.every((p) => p.pos), `${formation}: cada jugador tiene posición`);
    assert.ok(t.team.every((p) => p.x >= 4 && p.x <= 96 && p.y >= 4 && p.y <= 96), `${formation}: todos los jugadores están dentro del campo`);
    const board = renderTacticBoard(t, { editable: false });
    assert.equal((board.match(/class="tac-player"/g) || []).length, 7, `${formation}: renderiza exactamente 7 jugadores`);
    assert.ok(FORMATION_GUIDES[formation], `${formation}: tiene guía táctica`);
    assert.ok(FORMATION_GUIDES[formation].queBusco, `${formation}: tiene qué busco`);
    assert.ok(FORMATION_GUIDES[formation].conBalon.length, `${formation}: tiene con balón`);
    assert.ok(FORMATION_GUIDES[formation].sinBalon.length, `${formation}: tiene sin balón`);
  }
});

test('la formación 1-3-3 dispone tres defensas y tres atacantes con la guía específica', () => {
  const tactic = defaultTactic('F7', '1-3-3');
  assert.deepEqual(tactic.team.map(({ pos }) => pos), [
    'Portero', 'Lateral izq.', 'Defensa central', 'Lateral der.',
    'Extremo izq.', 'Delantero centro', 'Extremo der.',
  ]);
  const guideText = JSON.stringify(FORMATION_GUIDES['1-3-3']);
  assert.match(guideText, /equilibrada/i);
  assert.match(guideText, /central.*cobertura/i);
  assert.match(guideText, /extremos.*amplitud/i);
  assert.match(guideText, /delantero centro.*móvil/i);
});

test('mueve jugadores, rivales y balón sin mutar la táctica original y limita al campo', () => {
  const original = defaultTactic('F7');
  const playerMoved = moveTacticPiece(original, 'team', 0, { x: 120, y: -5 });
  const rivalMoved = moveTacticPiece(playerMoved, 'opponent', 1, { x: 41, y: 39 });
  const ballMoved = moveTacticPiece(rivalMoved, 'ball', 0, { x: 62, y: 63 });
  assert.deepEqual(original.team[0], { x: 50, y: 90, n: '1', pos: 'Portero' });
  assert.deepEqual(playerMoved.team[0], { ...original.team[0], x: 96, y: 4 });
  assert.deepEqual(rivalMoved.opponent[1], { ...original.opponent[1], x: 41, y: 39 });
  assert.deepEqual(ballMoved.ball, { x: 62, y: 63 });
  assert.throws(() => moveTacticPiece(original, 'cone', 0, { x: 1, y: 1 }), /pieza/i);
});

test('crea flechas de todas las herramientas y descarta trazos demasiado cortos', () => {
  for (const kind of ['pass', 'move', 'dribble', 'shot', 'sprint']) {
    assert.deepEqual(createTacticMove({ x: 10, y: 20 }, { x: 30, y: 40 }, kind), {
      from: { x: 10, y: 20 }, to: { x: 30, y: 40 }, kind,
    });
  }
  assert.equal(createTacticMove({ x: 10, y: 10 }, { x: 10.5, y: 10.5 }, 'pass'), null);
  assert.throws(() => createTacticMove({ x: 1, y: 1 }, { x: 2, y: 2 }, 'curve'), /herramienta/i);
});

test('las siete herramientas muestran muestras SVG con el mismo trazado y color que la pizarra', () => {
  const expected = {
    pass: ['#2b6cb0', '1.4', 'none'], move: ['#6b6b6b', '1.2', '6 4'],
    dribble: ['#7c3aed', '2.2', '4 2'], shot: ['#e8590c', '2.6', 'none'],
    sprint: ['#f6cf4c', '2', '3 1.5'],
  };
  assert.deepEqual(TACTIC_TOOLS.map(({ label }) => label), ['Mover', 'Pase', 'Movimiento', 'Conducción', 'Disparo', 'Sprint', 'Balón', 'Borrar línea', 'Borrar todo']);
  for (const tool of TACTIC_TOOLS) {
    const icon = renderTacticToolIcon(tool.id);
    assert.match(icon, /^<svg[^>]+class="tactic-tool-icon"/);
    assert.doesNotMatch(icon, /✋|➜|↝|⚡|🎯|💨|⚽/);
    if (expected[tool.id]) {
      const [stroke, width, dash] = expected[tool.id];
      assert.match(icon, new RegExp(`stroke="${stroke}"`));
      assert.match(icon, new RegExp(`stroke-width="${width}"`));
      assert.match(icon, new RegExp(`stroke-dasharray="${dash}"`));
      assert.match(icon, /<path[^>]+marker-end=/);
      const arrow = renderTacticArrow({ x: 3, y: 9 }, { x: 27, y: 9 }, tool.id, `test-${tool.id}`);
      for (const attr of [`stroke="${stroke}"`, `stroke-width="${width}"`, `stroke-dasharray="${dash}"`]) {
        assert.ok(icon.includes(attr) && arrow.includes(attr), `${tool.label}: muestra y flecha comparten ${attr}`);
      }
      assert.match(arrow, /marker-end=/);
    }
  }
  assert.match(renderTacticToolIcon('select'), /<path[^>]+stroke="#1a1a1a"/);
  assert.match(renderTacticToolIcon('ball'), /<circle[^>]+fill="#fff"[^>]+stroke="#111"/);
});

test('construye una táctica validando nombre, formato y formación', () => {
  const tactic = buildTactic({
    name: 'Salida de balón', rival: 'Las Palmas', situation: 'Saque de esquina', format: 'F7', formation: '1-2-3-1',
  }, { id: 't1', createdAt: 10, now: 20 });
  assert.equal(tactic.recordType, 'tactic');
  assert.equal(tactic.name, 'Salida de balón');
  assert.equal(tactic.rival, 'Las Palmas');
  assert.equal(tactic.format, 'F7');
  assert.equal(tactic.formation, '1-2-3-1');
  assert.equal(tactic.team.length, 7);
  assert.throws(() => buildTactic({ name: '', format: 'F7' }, {}), /nombre/i);
  assert.throws(() => buildTactic({ name: 'X', format: 'F9' }, {}), /formato/i);
});

test('renderiza la pizarra táctica editable con piezas pequeñas, balón fijo y sprint', () => {
  const tactic = { ...defaultTactic('F7', '1-3-3'), id: 't1', name: 'Salida', moves: [{ from: { x: 50, y: 46 }, to: { x: 50, y: 30 }, kind: 'sprint' }] };
  const html = renderTacticBoard(tactic, { editable: true });
  assert.match(html, /<svg/);
  assert.match(html, /class="tac-player"/);
  assert.match(html, /class="tac-opponent"/);
  assert.match(html, /class="tac-ball"/);
  assert.match(html, /r="4\.2"/, 'los jugadores son legibles con número a la derecha');
  assert.match(html, /data-piece="team"/, 'los jugadores se identifican para arrastrarlos');
  assert.match(html, /data-piece="ball"/, 'el balón es una pieza colocable');
  assert.match(html, /class="tac-ball"/, 'el balón tiene clase propia');
  assert.match(html, /tac-arrow.spr/, 'el sprint tiene trazo diferenciado');
  assert.match(html, /tac-legend-team/, 'mi equipo tiene color propio en la leyenda');
  assert.match(html, /tac-legend-rival/, 'rival tiene color propio en la leyenda');
  assert.match(html, /class="tactic-legend-arrow"/, 'las flechas de la leyenda usan la clase tactic-legend-arrow');
  assert.match(html, /<polygon points="18,3.5 26,7 18,10.5"/, 'la flecha de la leyenda dibuja la punta con polygon directo');
  assert.match(html, /width="28" height="14"/, 'la flecha de la leyenda tiene dimensiones 28x14 fijas');
});

test('cada formación incluye una guía completa de ataque y defensa', () => {
  for (const formation of FORMATION_NAMES) {
    const guide = FORMATION_GUIDES[formation];
    assert.ok(guide.queBusco, `${formation}: tiene qué busco`);
    assert.ok(Array.isArray(guide.conBalon) && guide.conBalon.length > 0, `${formation}: tiene con balón (ataque)`);
    assert.ok(Array.isArray(guide.sinBalon) && guide.sinBalon.length > 0, `${formation}: tiene sin balón / defensa`);
    assert.ok(Array.isArray(guide.alPerder) && guide.alPerder.length > 0, `${formation}: tiene al perder el balón`);
  }
});

test('ordena tácticas por fecha de actualización descendente', () => {
  const tactics = [{ id: 'a', updatedAt: 10 }, { id: 'b', updatedAt: 30 }, { id: 'c', updatedAt: 20 }];
  assert.deepEqual(sortTactics(tactics).map(({ id }) => id), ['b', 'c', 'a']);
  assert.deepEqual(tactics.map(({ id }) => id), ['a', 'b', 'c']);
});
