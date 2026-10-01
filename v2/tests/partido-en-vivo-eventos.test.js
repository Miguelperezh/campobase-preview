import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { addPlayerMatchEvent, removePlayerMatchEvent } from '../js/domain.js';

const appSource = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const stylesSource = fs.readFileSync(new URL('../css/claude-partido.css', import.meta.url), 'utf8');

test('addPlayerMatchEvent y removePlayerMatchEvent gestionan goles, tipos y marcha atrás del marcador', () => {
  const initialDetails = {
    goals: [],
    cards: [],
    injuries: [],
    incidents: [],
    goalsFor: 0,
    goalsAgainst: 0,
  };

  // 1. Gol nuestro de jugada
  const d1 = addPlayerMatchEvent(initialDetails, {
    id: 'g-1',
    kind: 'goal',
    playerId: 'p1',
    assistantId: 'p2',
    second: 120,
    note: 'Gol de jugada',
  });
  assert.equal(d1.goalsFor, 1, 'Debe sumar 1 a goalsFor');
  assert.equal(d1.goals.length, 1);
  assert.equal(d1.goals[0].assistantId, 'p2');

  // 2. Gol de penalti
  const d2 = addPlayerMatchEvent(d1, {
    id: 'g-2',
    kind: 'penalty_goal',
    playerId: 'p3',
    second: 300,
    note: 'Gol de penalti',
  });
  assert.equal(d2.goalsFor, 2, 'Debe sumar 1 más a goalsFor');
  assert.equal(d2.goals.length, 2);
  assert.equal(d2.goals[1].isPenalty, true);

  // 3. Gol rival
  const d3 = addPlayerMatchEvent(d2, {
    id: 'g-rival',
    kind: 'opponent_goal',
    playerId: '__rival__',
    second: 450,
    note: 'Jugada rival',
  });
  assert.equal(d3.goalsAgainst, 1, 'Debe sumar 1 a goalsAgainst');
  assert.equal(d3.incidents.length, 1);

  // 4. Penalti parado por nuestro portero (no suma gol rival)
  const d4 = addPlayerMatchEvent(d3, {
    id: 'pen-save',
    kind: 'penalty_saved',
    playerId: 'gk-1',
    second: 600,
    note: 'Parado por gk-1',
  });
  assert.equal(d4.goalsAgainst, 1, 'Penalti parado no debe alterar el marcador');
  assert.equal(d4.incidents.find((i) => i.id === 'pen-save')?.type, 'penalty_saved');

  // 5. Marcha atrás: anular el gol de penalti g-2
  const d5 = removePlayerMatchEvent(d4, 'g-2');
  assert.equal(d5.goalsFor, 1, 'Anular gol debe decrementar goalsFor a 1');
  assert.equal(d5.goals.some((g) => g.id === 'g-2'), false, 'g-2 debe ser eliminado');

  // 6. Marcha atrás: anular el gol rival
  const d6 = removePlayerMatchEvent(d5, 'g-rival');
  assert.equal(d6.goalsAgainst, 0, 'Anular gol rival debe decrementar goalsAgainst a 0');
  assert.equal(d6.incidents.some((i) => i.id === 'g-rival'), false);
});

test('app.js integra especialistas de balón parado y regla del portero en penaltis', () => {
  // Verificación de priorización de especialistas en app.js
  assert.match(appSource, /sp\.penalties\?\.primary/, 'app.js debe leer especialista primario de penaltis');
  assert.match(appSource, /sp\.penalties\?\.secondary/, 'app.js debe leer especialista secundario de penaltis');
  assert.match(appSource, /cbx-la-sp-badge/, 'app.js debe generar badge de especialista');
  assert.match(appSource, /1\.º Especialista/, 'app.js debe etiquetar al 1.º lanzador');

  // Verificación de regla del portero en penaltis en contra
  assert.match(appSource, /cbx-la-keeper-notice/, 'app.js debe renderizar aviso con portero activo');
  assert.match(appSource, /¡PARADÓN!/, 'app.js debe contemplar la celebración PARADÓN');

  // Verificación de celebración con marcador y minuto
  assert.match(appSource, /showLiveCelebration\('¡GOOOL!',\s*playerName\(playerId\),\s*false,\s*scoreText,\s*minuteText\)/, 'showLiveCelebration debe recibir marcador y minuto en gol');
  assert.match(appSource, /showLiveCelebration\('¡PARADÓN!',\s*playerName\(playerId\),\s*true,\s*scoreText,\s*minuteText\)/, 'showLiveCelebration debe recibir marcador y minuto en paradón');
});

test('claude-partido.css contiene estilos de especialistas y celebraciones enriquecidas', () => {
  assert.match(stylesSource, /\.cbx-la-player\.is-specialist/, 'Debe tener estilo para jugador especialista');
  assert.match(stylesSource, /\.cbx-la-sp-badge/, 'Debe tener estilo para badge de especialista');
  assert.match(stylesSource, /\.cbx-la-keeper-notice/, 'Debe tener estilo para aviso de portero bajo palos');
  assert.match(stylesSource, /\.cbx-celebration-score/, 'Debe tener estilo para marcador en celebración');
  assert.match(stylesSource, /\.cbx-celebration-min/, 'Debe tener estilo para minuto en celebración');
  assert.match(stylesSource, /\.cbx-live-celebration\s*\*\s*,\s*body\.cb-redesign-active\s*\.cbx-live-celebration\s*\*\s*,\s*body\.cb-redesign-active\[data-has-custom-font-color="true"\]\s*\.cbx-live-celebration\s*\*[\s\S]*?color:\s*#ffffff\s*!important/, 'Debe forzar color blanco puro en todos los textos de la celebración incluso con fuente personalizada');
});
