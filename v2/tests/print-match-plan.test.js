import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildMatchPlanHtml, printMatchPlan } from '../js/print-match-plan.js';

const appSource = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const stylesSource = fs.readFileSync(new URL('../css/claude-partido.css', import.meta.url), 'utf8');

const mockPlayers = [
  { id: 'p1', name: 'Hugo García', number: 1, positions: ['Portero'] },
  { id: 'p2', name: 'Mateo López', number: 2, positions: ['Defensa'] },
  { id: 'p3', name: 'Lucas Martín', number: 3, positions: ['Defensa'] },
  { id: 'p4', name: 'Leo González', number: 4, positions: ['Centrocampista'] },
  { id: 'p5', name: 'Daniel Pérez', number: 5, positions: ['Centrocampista'] },
  { id: 'p6', name: 'Alejandro Ruiz', number: 6, positions: ['Delantero'] },
  { id: 'p7', name: 'Manuel Sánchez', number: 7, positions: ['Delantero'] },
  { id: 'p8', name: 'Pablo Romero', number: 8, positions: ['Centrocampista'] },
  { id: 'p9', name: 'Álvaro Díaz', number: 9, positions: ['Delantero'] },
  { id: 'p13', name: 'Diego Torres', number: 13, positions: ['Portero'] },
];

const mockMatch = {
  id: 'match-101',
  opponent: 'UD Las Palmas B',
  round: '12',
  date: '2026-10-10',
  time: '10:30',
  pitch: 'Campo Municipal 1',
  venue: 'home',
  format: 'F7',
};

const mockPrep = {
  matchId: 'match-101',
  formacion: '1-3-2-1',
  team: [
    { pos: 'Portero', playerId: 'p1', x: 50, y: 88 },
    { pos: 'Lateral izquierdo', playerId: 'p2', x: 25, y: 70 },
    { pos: 'Central', playerId: 'p3', x: 50, y: 72 },
    { pos: 'Lateral derecho', playerId: 'p4', x: 75, y: 70 },
    { pos: 'Medio centro', playerId: 'p5', x: 38, y: 48 },
    { pos: 'Medio centro', playerId: 'p6', x: 62, y: 48 },
    { pos: 'Delantero', playerId: 'p7', x: 50, y: 26 },
  ],
  moments: [
    {
      id: 'm-0',
      minute: 0,
      formation: '1-3-2-1',
      team: [
        { pos: 'Portero', playerId: 'p1' },
        { pos: 'Lateral izquierdo', playerId: 'p2' },
        { pos: 'Central', playerId: 'p3' },
        { pos: 'Lateral derecho', playerId: 'p4' },
        { pos: 'Medio centro', playerId: 'p5' },
        { pos: 'Medio centro', playerId: 'p6' },
        { pos: 'Delantero', playerId: 'p7' },
      ],
    },
    {
      id: 'm-12',
      minute: 12,
      formation: '1-3-2-1',
      team: [
        { pos: 'Portero', playerId: 'p1' },
        { pos: 'Lateral izquierdo', playerId: 'p2' },
        { pos: 'Central', playerId: 'p3' },
        { pos: 'Lateral derecho', playerId: 'p4' },
        { pos: 'Medio centro', playerId: 'p8' }, // entra p8 por p5
        { pos: 'Medio centro', playerId: 'p6' },
        { pos: 'Delantero', playerId: 'p9' }, // entra p9 por p7
      ],
    },
    {
      id: 'm-25',
      minute: 25,
      formation: '1-3-2-1',
      team: [
        { pos: 'Portero', playerId: 'p13' }, // relevo de portero en descanso
        { pos: 'Lateral izquierdo', playerId: 'p5' }, // entra p5 por p2
        { pos: 'Central', playerId: 'p3' },
        { pos: 'Lateral derecho', playerId: 'p4' },
        { pos: 'Medio centro', playerId: 'p8' },
        { pos: 'Medio centro', playerId: 'p7' }, // entra p7 por p6
        { pos: 'Delantero', playerId: 'p9' },
      ],
    },
  ],
};

const mockState = {
  matches: [mockMatch],
  players: mockPlayers,
  preparaciones: [mockPrep],
  callups: [
    {
      matchId: 'match-101',
      availableIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p13'],
      format: 'F7',
    },
  ],
  settings: {
    teamName: 'Alevín A Unión Viera',
    coachName: 'Migue Pérez',
    delegateName: 'Carlos Santana',
  },
};

test('buildMatchPlanHtml genera estructura A4 completa y explicada para el cuerpo técnico', () => {
  const html = buildMatchPlanHtml(mockMatch, mockState);

  // 1. Contenedor y Ficha Oficial A4
  assert.ok(html.includes('cb-print-root cb-print-match-plan-root'), 'Debe tener la clase raíz cb-print-match-plan-root');
  assert.ok(html.includes('cb-print-sheet cbx-pmp-sheet'), 'Debe tener la clase de hoja A4 cbx-pmp-sheet');

  // 2. Cabecera Oficial y Datos del Partido
  assert.ok(html.includes('Alevín A Unión Viera'), 'Debe mostrar el nombre del equipo');
  assert.ok(html.includes('UD Las Palmas B'), 'Debe mostrar el rival');
  assert.ok(html.includes('Jornada 12'), 'Debe mostrar la jornada');
  assert.ok(html.includes('10:30 h'), 'Debe mostrar la hora');
  assert.ok(html.includes('Campo Municipal 1'), 'Debe mostrar el campo');

  // 3. Titulares Iniciales (0′) y Suplentes de Salida
  assert.ok(html.includes('TITULARES Y SISTEMA INICIAL'), 'Debe incluir la sección de titulares');
  assert.ok(html.includes('cbx-pmp-starter-card is-gk'), 'Debe marcar la tarjeta del portero titular');
  assert.ok(html.includes('Hugo García'), 'Debe mostrar a Hugo García de titular');
  assert.ok(html.includes('SUPLENTES DE INICIO (3)'), 'Debe identificar los 3 suplentes de inicio');
  assert.ok(html.includes('Pablo Romero'), 'Pablo Romero debe figurar en suplentes');
  assert.ok(html.includes('Álvaro Díaz'), 'Álvaro Díaz debe figurar en suplentes');
  assert.ok(html.includes('Diego Torres'), 'Diego Torres (portero suplente) debe figurar en suplentes');

  // 4. Cronograma Detallado y Didáctico de Sustituciones
  assert.ok(html.includes('VENTANAS DE SUSTITUCIÓN EXPLICADAS'), 'Debe incluir el cronograma didáctico');
  assert.ok(html.includes('MINUTO 12′'), 'Debe contener la ventana del minuto 12′');
  assert.ok(html.includes('MINUTO 25′'), 'Debe contener la ventana del descanso (minuto 25′)');
  assert.ok(html.includes('Descanso'), 'Debe etiquetar el minuto 25′ como Descanso');
  assert.ok(html.includes('🟢 ENTRA'), 'Debe contener etiqueta ENTRA');
  assert.ok(html.includes('🔴 SALE'), 'Debe contener etiqueta SALE');
  assert.ok(html.includes('🧤 PORTERÍA'), 'Debe resaltar el relevo de portería en el descanso');

  // 5. Tabla de Minutos y Tramos en el Césped
  assert.ok(html.includes('MINUTOS PREVISTOS POR JUGADOR'), 'Debe incluir la tabla de reparto');
  assert.ok(html.includes('cbx-pmp-table'), 'Debe renderizar la tabla cbx-pmp-table');
  assert.ok(html.includes('Tramos en el césped'), 'Debe tener la columna de tramos');
  assert.ok(html.includes('0′–12′'), 'Debe mostrar tramos específicos de participación');

  // 6. Pautas de Banquillo y Acta para Bolígrafo
  assert.ok(html.includes('PAUTAS CLAVE PARA EL CUERPO TÉCNICO'), 'Debe incluir pautas para el banquillo');
  assert.ok(html.includes('Regla del portero'), 'Debe incluir la regla del portero');
  assert.ok(html.includes('ACTA DE CAMPO (Anotaciones a mano)'), 'Debe incluir caja de acta');
  assert.ok(html.includes('RESULTADO:'), 'Debe incluir casillas de resultado');
  assert.ok(html.includes('Migue Pérez'), 'Debe incluir el nombre del entrenador en el pie');
});

test('buildMatchPlanHtml soporta borradores en tiempo real (drafts) desde el editor', () => {
  const customDraftMoments = [
    {
      id: 'd-0',
      minute: 0,
      formation: '1-3-1-2',
      team: [
        { pos: 'Portero', playerId: 'p13' },
        { pos: 'Defensa', playerId: 'p2' },
        { pos: 'Defensa', playerId: 'p3' },
        { pos: 'Defensa', playerId: 'p4' },
        { pos: 'Medio', playerId: 'p5' },
        { pos: 'Delantero', playerId: 'p8' },
        { pos: 'Delantero', playerId: 'p9' },
      ],
    },
    {
      id: 'd-20',
      minute: 20,
      formation: '1-3-1-2',
      team: [
        { pos: 'Portero', playerId: 'p1' },
        { pos: 'Defensa', playerId: 'p2' },
        { pos: 'Defensa', playerId: 'p3' },
        { pos: 'Defensa', playerId: 'p4' },
        { pos: 'Medio', playerId: 'p6' },
        { pos: 'Delantero', playerId: 'p7' },
        { pos: 'Delantero', playerId: 'p9' },
      ],
    },
  ];

  const html = buildMatchPlanHtml(mockMatch, mockState, {
    momentsDraft: customDraftMoments,
    formacionDraft: '1-3-1-2',
  });

  assert.ok(html.includes('1-3-1-2'), 'Debe reflejar la formación del borrador activo');
  assert.ok(html.includes('MINUTO 20′'), 'Debe reflejar el minuto 20′ del borrador activo');
  assert.ok(html.includes('Diego Torres'), 'Debe mostrar a Diego Torres de titular inicial según el borrador');
});

test('buildMatchPlanHtml maneja correctamente un partido sin ventanas adicionales', () => {
  const singleMomentState = {
    ...mockState,
    preparaciones: [{
      matchId: 'match-101',
      formacion: '1-3-2-1',
      team: mockPrep.moments[0].team,
      moments: [mockPrep.moments[0]],
    }],
  };

  const html = buildMatchPlanHtml(mockMatch, singleMomentState);
  assert.ok(html.includes('No se han configurado ventanas de cambio intermedias'), 'Debe avisar que los titulares disputarán el partido completo');
});

test('Integración en app.js y CSS para botones de impresión del plan de partido', () => {
  // Verificación de imports
  assert.match(appSource, /import\s*\{\s*printMatchPlan\s*\}\s*from\s*['"]\.\/print-match-plan\.js['"]/, 'app.js debe importar printMatchPlan');

  // Verificación de botones en la UI
  assert.match(appSource, /class="prep-print-plan secondary"/, 'renderPreparaciones debe incluir botón prep-print-plan');
  assert.match(appSource, /id="prep-print-current"/, 'openPreparacionEditor debe incluir botón prep-print-current');
  assert.match(appSource, /id="prep-print-moments"/, 'renderPrepMoments debe incluir botón prep-print-moments');
  assert.match(appSource, /class="cbx-plan-print secondary"/, 'savedPlanMarkup debe incluir botón cbx-plan-print');

  // Verificación de event delegation y click handlers
  assert.match(appSource, /target\.matches\('\.prep-print-plan'\)/, 'app.js debe delegar click a prep-print-plan');
  assert.match(appSource, /target\.closest\('\.cbx-plan-print'\)/, 'app.js debe delegar click a cbx-plan-print');
  assert.match(appSource, /#prep-print-current/, 'wirePrepEditor debe vincular prep-print-current');
  assert.match(appSource, /prep-print-moments/, 'wirePrepEditor debe vincular prep-print-moments');

  // Verificación de exportación en window.__campobase
  assert.match(appSource, /printMatchPlan,/, 'window.__campobase debe exponer printMatchPlan');

  // Verificación de estilos CSS en claude-partido.css
  assert.match(stylesSource, /\.cbx-pmp-sheet/, 'claude-partido.css debe contener estilos para .cbx-pmp-sheet');
  assert.match(stylesSource, /\.cbx-pmp-starter-card/, 'claude-partido.css debe contener estilos para titulares');
  assert.match(stylesSource, /\.cbx-pmp-moment-card/, 'claude-partido.css debe contener estilos para momentos');
  assert.match(stylesSource, /\.cbx-pmp-table/, 'claude-partido.css debe contener estilos para la tabla de minutos');
  assert.match(stylesSource, /@media print/, 'claude-partido.css debe contener reglas para @media print');
});
