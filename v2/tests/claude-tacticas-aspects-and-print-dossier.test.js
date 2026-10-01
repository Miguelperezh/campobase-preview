import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  SISTEMAS_F7_ORDEN,
  getSistemaF7Pdf,
  getAspectBoardData,
} from '../js/tacticas-pdf-domain.js';
import { renderTacticBoard } from '../js/tactics.js';
import {
  buildExercisePageHtml,
  buildSingleExerciseHtml,
  buildTrainingSessionHtml,
  resolveExerciseData,
} from '../js/print-session-export.js';

const appSource = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const indexHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const claudeEntrenoCss = fs.readFileSync(new URL('../css/claude-entreno.css', import.meta.url), 'utf8');
const stylesSource = fs.readFileSync(new URL('../styles-redesign.css', import.meta.url), 'utf8');

test('getAspectBoardData devuelve pizarra táctica completa para cada aspecto de todos los sistemas F7', () => {
  const aspects = ['estructura', 'salida', 'progresion', 'basculaciones', 'pressing', 'ventajas', 'f11'];

  for (const sys of SISTEMAS_F7_ORDEN) {
    for (const aspect of aspects) {
      const dataWithoutRival = getAspectBoardData(sys, aspect, false);
      assert.ok(dataWithoutRival, `Debe devolver datos para ${sys} - ${aspect}`);
      assert.equal(dataWithoutRival.formation, sys);
      assert.equal(dataWithoutRival.format, 'F7');
      assert.equal(dataWithoutRival.team.length, 7, `El equipo debe tener 7 jugadores en ${sys} - ${aspect}`);
      assert.equal(dataWithoutRival.showOpponent, false);
      assert.equal(dataWithoutRival.opponent.length, 0, `Sin rival, la lista de oponentes debe estar vacía`);

      // Verificar render sin rival
      const htmlNoRival = renderTacticBoard(dataWithoutRival, { showOpponent: false });
      assert.doesNotMatch(htmlNoRival, /class="tac-player tac-opponent"/, `No debe renderizar piezas rivales si showOpponent es false`);
      assert.match(htmlNoRival, /data-piece="team"/, `Debe renderizar las piezas de nuestro equipo`);

      // Con rival activo
      const dataWithRival = getAspectBoardData(sys, aspect, true);
      assert.equal(dataWithRival.showOpponent, true);
      assert.equal(dataWithRival.opponent.length, 7, `Con rival, debe incluir 7 jugadores rivales`);
      const htmlWithRival = renderTacticBoard(dataWithRival, { showOpponent: true });
      assert.match(htmlWithRival, /class="tac-opponent"/, `Debe renderizar piezas rivales si showOpponent es true`);
    }
  }
});

test('aspectos tácticos incluyen movimientos de pase y desmarque específicos del manual', () => {
  const salidaData = getAspectBoardData('1-3-2-1', 'salida', false);
  assert.ok(salidaData.moves.length > 0, 'La fase de salida debe tener flechas tácticas dibujadas');
  const salidaHtml = renderTacticBoard(salidaData, { showOpponent: false });
  assert.match(salidaHtml, /tac-arrow/, 'Debe renderizar flechas tácticas en la pizarra');

  const pressingData = getAspectBoardData('1-3-2-1', 'pressing', true);
  assert.ok(pressingData.moves.length > 0, 'La fase de pressing debe tener flechas de acoso');
  const pressingHtml = renderTacticBoard(pressingData, { showOpponent: true });
  assert.match(pressingHtml, /tac-arrow/);
});

test('interfaz de usuario integra botón de alternar rival y vinculación en app.js y index.html', () => {
  // Botón presente en index.html
  assert.match(indexHtml, /id="cbx-toggle-rival-btn"/);
  assert.match(indexHtml, /class="btn-rival-toggle-claude"/);
  assert.match(indexHtml, /Mostrar rival/);

  // app.js gestiona la variable claudeTacticShowRival por defecto en false
  assert.match(appSource, /let claudeTacticShowRival = false;/);
  assert.match(appSource, /getAspectBoardData\(claudeTacticFormation,\s*claudeTacticAspect,\s*claudeTacticShowRival\)/);
  assert.match(appSource, /target\.id === 'cbx-toggle-rival-btn'/);
  assert.match(appSource, /claudeTacticShowRival = !claudeTacticShowRival;/);

  // Estilos CSS definidos
  assert.match(claudeEntrenoCss, /\.btn-rival-toggle-claude/);
  assert.match(claudeEntrenoCss, /\.cbx-guide-aspect-container/);
  assert.match(claudeEntrenoCss, /\.cbx-guide-aspect-board-wrap/);
  assert.match(claudeEntrenoCss, /\.cbx-guide-aspect-pitch/);
});

test('buildExercisePageHtml y buildSingleExerciseHtml generan el formato Claude individual A4', () => {
  const exercise = {
    id: 'EJ-042',
    name: 'Transición ofensiva rápida 3v2',
    category: 'Transiciones',
    works: 'Fútbol 7 Ofensivo',
    duration: '20 min',
    space: '35x25m',
    players: '12 jugadores',
    material: '10 conos, 6 balones, petos',
    preview: 'https://example.com/drill.png',
    description: 'Paso 1: Recuperación en campo propio.\nPaso 2: Pase vertical buscando banda.\nPaso 3: Centro raso al segundo palo.',
    tips: 'Velocidad de ejecución máxima tras recuperación.',
    rules: 'Finalizar en menos de 8 segundos.',
  };

  const state = { teamName: 'Alevín A CD Laguna', category: 'Alevín' };
  const html = buildSingleExerciseHtml(exercise, state);

  // Encabezado
  assert.match(html, /cbx-print-eyebrow/);
  assert.match(html, /Transición ofensiva rápida 3v2/);
  assert.match(html, /Alevín/);
  assert.match(html, /Intensidad Alta/);

  // 4 stat cards
  assert.match(html, /cbx-print-stat-cards/);
  assert.match(html, /DURACIÓN/);
  assert.match(html, /20 min/);
  assert.match(html, /SERIES/);
  assert.match(html, /JUGADORES/);
  assert.match(html, /ESPACIO/);
  assert.match(html, /35x25m/);

  // Pizarra con leyenda
  assert.match(html, /cbx-print-pitch-legend/);
  assert.match(html, /Ataca/);
  assert.match(html, /Defiende/);

  // Columnas con pasos numerados
  assert.match(html, /cbx-print-step-num/);
  assert.match(html, /❶/);
  assert.match(html, /❷/);
  assert.match(html, /❸/);

  // Puntos clave, variantes y notas
  assert.match(html, /PUNTOS CLAVE &amp; VARIANTES/);
  assert.match(html, /Más fácil:/);
  assert.match(html, /Más difícil:/);
  assert.match(html, /NOTAS DEL ENTRENADOR/);
  assert.match(html, /cbx-print-note-line/);
  assert.match(html, /Ref\. EJ-042/);
});

test('buildTrainingSessionHtml genera dossier multi-página: Portada (Pág 1) + Hojas A4 individuales para cada ejercicio (Pág 2..N)', () => {
  const state = {
    teamName: 'Infantil B',
    category: 'Infantil',
    exercises: [
      { id: 'ex-1', name: 'Rondos 3v1', duration: 15, category: 'Calentamiento', description: 'Rondo a un toque.' },
      { id: 'ex-2', name: 'Salida de balón 4v3', duration: 25, category: 'Principal', description: 'Salida limpia con laterales.' },
      { id: 'ex-3', name: 'Partido condicionado', duration: 30, category: 'Final', description: 'Juego libre con 2 porterías.' },
    ],
    players: [
      { number: 1, name: 'Hugo Martín' },
      { number: 2, name: 'Pablo Ruiz' },
      { number: 3, name: 'Leo Santana' },
    ],
  };

  const session = {
    id: 'sess-dossier-1',
    name: 'Sesión 14 - Presión y Bloque',
    date: '2026-11-02',
    time: '18:00',
    pitch: 'Anexo 1',
    blocks: [
      { type: 'warmup', exerciseId: 'ex-1', duration: 15 },
      { type: 'main', exerciseId: 'ex-2', duration: 25, notes: 'Fijar central antes de soltar' },
      { type: 'final', exerciseId: 'ex-3', duration: 30 },
    ],
  };

  const html = buildTrainingSessionHtml(session, state);

  // Página 1: Portada
  assert.match(html, /cb-print-session-cover/);
  assert.match(html, /Pág\. 1 de 4/);
  assert.match(html, /cbx-print-timeline-bar/);
  assert.match(html, /ASISTENCIA/);
  assert.match(html, /cbx-print-att-box/);
  assert.match(html, /Hugo Martín/);
  assert.match(html, /cbx-print-notes-section/);

  // Páginas 2..4: Cada ejercicio en su propia hoja A4 completa
  const exercisePagesCount = (html.match(/cb-print-session-exercise-page/g) || []).length;
  assert.equal(exercisePagesCount, 3, 'Debe generar exactamente 3 páginas de ejercicios para los 3 bloques');

  assert.match(html, /Pág\. 2 de 4/);
  assert.match(html, /Pág\. 3 de 4/);
  assert.match(html, /Pág\. 4 de 4/);
  assert.match(html, /Rondos 3v1/);
  assert.match(html, /Salida de balón 4v3/);
  assert.match(html, /Partido condicionado/);

  // Reglas CSS de salto de página están en styles-redesign.css
  assert.match(stylesSource, /\.cb-print-page \+ \.cb-print-page\s*\{\s*page-break-before:\s*always\s*!important;\s*break-before:\s*page\s*!important;\s*\}/);
});
