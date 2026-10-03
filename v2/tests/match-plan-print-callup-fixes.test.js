import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildMatchPlanHtml } from '../js/print-match-plan.js';

const appSource = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const printMatchPlanSource = fs.readFileSync(new URL('../js/print-match-plan.js', import.meta.url), 'utf8');
const printSessionExportSource = fs.readFileSync(new URL('../js/print-session-export.js', import.meta.url), 'utf8');
const stylesRedesignSource = fs.readFileSync(new URL('../styles-redesign.css', import.meta.url), 'utf8');
const claudePlantillaCss = fs.readFileSync(new URL('../css/claude-plantilla.css', import.meta.url), 'utf8');
const claudePartidoCss = fs.readFileSync(new URL('../css/claude-partido.css', import.meta.url), 'utf8');

const mockPlayers = [
  { id: 'p1', name: 'Mateo Moyano', number: 1, positions: ['Portero'] },
  { id: 'p13', name: 'Carlos Campillo', number: 13, positions: ['Portero'] },
  { id: 'p3', name: 'Antonio Roldán', number: 3, positions: ['Medio'] },
  { id: 'p5', name: 'Diego Andrés', number: 5, positions: ['Defensa'] },
  { id: 'p7', name: 'Alejandro Pedrós', number: 7, positions: ['Delantero'] },
  { id: 'p8', name: 'Alejandro Suárez', number: 8, positions: ['Defensa'] },
  { id: 'p9', name: 'Ignacio Poladura', number: 9, positions: ['Delantero'] },
  { id: 'p11', name: 'Aitor Navarro', number: 11, positions: ['Defensa'] },
  { id: 'p12', name: 'Javier Navarro', number: 12, positions: ['Medio'] },
  { id: 'p15', name: 'Pelayo Marrero', number: 15, positions: ['Medio'] },
  { id: 'p16', name: 'Pablo Montesdeoca', number: 16, positions: ['Defensa'] },
  { id: 'p18', name: 'Dylan Campanario', number: 18, positions: ['Defensa'] },
];

const mockMatchF7 = {
  id: 'match-alevin-1',
  opponent: 'Huracán A',
  round: '5',
  date: '2026-10-15',
  time: '11:00',
  pitch: 'Pepe Gonçalvez',
  venue: 'home',
  format: 'F7',
};

const mockPrepF7_70min = {
  matchId: 'match-alevin-1',
  formacion: '1-3-2-1',
  moments: [
    {
      id: 'm-0',
      minute: 0,
      formation: '1-3-2-1',
      team: [
        { pos: 'Portero', playerId: 'p13' },
        { pos: 'Defensa izq.', playerId: 'p18' },
        { pos: 'Central', playerId: 'p16' },
        { pos: 'Defensa der.', playerId: 'p5' },
        { pos: 'Medio izq.', playerId: 'p3' },
        { pos: 'Medio der.', playerId: 'p15' },
        { pos: 'Delantero', playerId: 'p7' },
      ],
    },
    {
      id: 'm-17',
      minute: 17,
      formation: '1-3-2-1',
      team: [
        { pos: 'Portero', playerId: 'p1' },
        { pos: 'Defensa izq.', playerId: 'p8' },
        { pos: 'Central', playerId: 'p16' },
        { pos: 'Defensa der.', playerId: 'p11' },
        { pos: 'Medio izq.', playerId: 'p12' },
        { pos: 'Medio der.', playerId: 'p15' },
        { pos: 'Delantero', playerId: 'p9' },
      ],
    },
    {
      id: 'm-35',
      minute: 35,
      formation: '1-3-2-1',
      team: [
        { pos: 'Portero', playerId: 'p13' },
        { pos: 'Defensa izq.', playerId: 'p18' },
        { pos: 'Central', playerId: 'p16' },
        { pos: 'Defensa der.', playerId: 'p5' },
        { pos: 'Medio izq.', playerId: 'p3' },
        { pos: 'Medio der.', playerId: 'p15' },
        { pos: 'Delantero', playerId: 'p7' },
      ],
    },
    {
      id: 'm-50',
      minute: 50,
      formation: '1-3-2-1',
      team: [
        { pos: 'Portero', playerId: 'p1' },
        { pos: 'Defensa izq.', playerId: 'p8' },
        { pos: 'Central', playerId: 'p16' },
        { pos: 'Defensa der.', playerId: 'p11' },
        { pos: 'Medio izq.', playerId: 'p12' },
        { pos: 'Medio der.', playerId: 'p15' },
        { pos: 'Delantero', playerId: 'p9' },
      ],
    },
  ],
};

const mockStateF7 = {
  matches: [mockMatchF7],
  players: mockPlayers,
  preparaciones: [mockPrepF7_70min],
  callups: [{ matchId: 'match-alevin-1', availableIds: mockPlayers.map((p) => p.id), format: 'F7' }],
  settings: { teamName: 'Alevín Unión Viera', coachName: 'Migue' },
};

test('buildMatchPlanHtml estructura el plan de partido en 2 hojas A4 independientes con cb-print-page', () => {
  const html = buildMatchPlanHtml(mockMatchF7, mockStateF7);

  // Ambas páginas cuentan con la clase .cb-print-page para html2canvas / jsPDF
  assert.ok(html.includes('cbx-pmp-page-1'), 'Debe contener la hoja 1 (cbx-pmp-page-1)');
  assert.ok(html.includes('cbx-pmp-page-2'), 'Debe contener la hoja 2 (cbx-pmp-page-2)');
  assert.ok(html.includes('cb-print-sheet cbx-pmp-sheet cb-print-page cbx-pmp-page-1'), 'Hoja 1 debe tener cb-print-page');
  assert.ok(html.includes('cb-print-sheet cbx-pmp-sheet cb-print-page cbx-pmp-page-2'), 'Hoja 2 debe tener cb-print-page');

  // Hoja 1 contiene cronograma y titulares
  assert.ok(html.includes('TITULARES Y SISTEMA INICIAL'));
  assert.ok(html.includes('VENTANAS DE SUSTITUCIÓN EXPLICADAS'));
  assert.ok(html.includes('Página 1 de 2'));

  // Hoja 2 contiene reparto de minutos y acta de campo
  assert.ok(html.includes('REPARTO DE MINUTOS Y ACTA DE CAMPO'));
  assert.ok(html.includes('PÁGINA 2 DE 2'));
  assert.ok(html.includes('Página 2 de 2'));
  assert.ok(html.includes('ACTA DE CAMPO (Anotaciones a mano)'));
});

test('buildMatchPlanHtml calcula correctamente 70 min para F7 con tramos hasta 50 min y no corta a 50 min', () => {
  const html = buildMatchPlanHtml(mockMatchF7, mockStateF7);

  // Debe sumar sobre / 70′ y no sobre / 50′
  assert.ok(html.includes('/ 70′'), 'La tabla de minutos debe totalizar sobre 70 minutos oficiales de F7');
  assert.doesNotMatch(html, /\/ 50′/, 'No debe limitar a 50 minutos cuando hay cambios en el min 50');

  // En el minuto 35 debe marcar Descanso
  assert.ok(html.includes('MINUTO 35′'), 'Debe incluir la ventana del min 35');
  assert.ok(html.includes('Descanso'), 'Debe marcar el minuto 35 como Descanso');

  // En el minuto 50 los jugadores deben tener tramos válidos 50′–70′ (20 min)
  assert.ok(html.includes('50′–70′'), 'Debe reflejar el tramo final 50′ a 70′');
  assert.ok(html.includes('relevo en descanso a los 35′'), 'Regla de portero debe usar 35′ en F7 de 70′');
});

test('desduplicación de convocatorias y reutilización de id para un mismo matchId', () => {
  // deduplicateCallups en app.js
  assert.match(appSource, /function deduplicateCallups\s*\(/, 'app.js debe definir deduplicateCallups');
  assert.match(appSource, /const map = new Map\(\);/, 'deduplicateCallups debe usar mapa para deduplicar por matchId o clave');

  // saveCallup reutiliza convocatoria existente
  assert.match(appSource, /const existingForMatch = \(!existing && match\?\.id\)/, 'saveCallup debe buscar si ya existe convocatoria para match.id');
  assert.match(appSource, /const targetId = existing\?\.id \|\| existingForMatch\?\.id \|\| uid\(\);/, 'saveCallup debe reutilizar el id existente');
  assert.match(appSource, /mId !== match\.id/, 'nextCallups debe filtrar por matchId para evitar duplicados del rival');
});

test('renderClaudeCallup vincula el plan por tramos a la preparación guardada del partido', () => {
  assert.match(appSource, /const prep = matchId \? prepForMatch\(matchId\) : null;/, 'renderClaudeCallup debe obtener la preparación con prepForMatch');
  assert.match(appSource, /if \(prep && prep\.team && prep\.team\.length\)/, 'renderClaudeCallup debe usar prep para derivar el plan');
  assert.match(appSource, /moments = normalizeMoments\(prep\)/, 'renderClaudeCallup debe normalizar los momentos de prep');
});

test('personalización de colores no rompe badges ni píldoras de minutos en cronograma e impresión', () => {
  // Exclusiones en styles-redesign.css para spans de minutos y badges
  assert.match(stylesRedesignSource, /:not\(\.cbx-pmp-min-pill\)/, 'styles-redesign debe excluir .cbx-pmp-min-pill');
  assert.match(stylesRedesignSource, /:not\(\.cbx-pmp-badge-accent\)/, 'styles-redesign debe excluir .cbx-pmp-badge-accent');
  assert.match(stylesRedesignSource, /:not\(\.cb-print-floating-bar \*\)/, 'styles-redesign debe proteger floating bar');

  // Estilos de especialistas en claude-plantilla.css vinculados a cardTitle / cbx-ink
  assert.match(claudePlantillaCss, /\.specialist-rank-row strong\s*\{[^}]*color:\s*var\(--cardTitle/);
  assert.match(claudePlantillaCss, /\.specialist-item h4\s*\{[^}]*color:\s*var\(--cardTitle/);

  // Estilos de convocatoria en claude-partido.css
  assert.match(claudePartidoCss, /\.cbx-callup-person strong\s*\{[^}]*color:\s*var\(--cardTitle/);
  assert.match(claudePartidoCss, /\.cbx-plan-row > span\s*\{[^}]*color:\s*var\(--cardTitle/);
});

test('executePrint integra el botón FAB de cierre flotante de forma segura en container', () => {
  assert.match(printSessionExportSource, /container\.prepend\(fabCloseBtn\);/, 'fabCloseBtn debe insertarse dentro de container');
  assert.match(printSessionExportSource, /if \(typeof fabCloseBtn\?\.addEventListener === 'function'\)/, 'fabCloseBtn debe comprobar addEventListener');
});
