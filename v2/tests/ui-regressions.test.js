import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('la versión 2.44.0 está sincronizada en paquete, lock y caché PWA', async () => {
  const [pkgText, lockText, sw] = await Promise.all([
    projectFile('package.json'), projectFile('package-lock.json'), projectFile('sw.js'),
  ]);
  const pkg = JSON.parse(pkgText);
  const lock = JSON.parse(lockText);
  assert.equal(pkg.version, '2.44.0');
  assert.equal(lock.version, '2.44.0');
  assert.equal(lock.packages[''].version, '2.44.0');
  assert.match(sw, /campobase-v2\.44\.0/);
});

test('todos los campos con hora usan selectores propios de 24 horas', async () => {
  const [html, app] = await Promise.all([projectFile('index.html'), projectFile('js/app.js')]);
  assert.doesNotMatch(html, /type=["'](?:time|datetime-local)["']/i);
  assert.doesNotMatch(app, /type=\\?["'](?:time|datetime-local)\\?["']/i);
  assert.match(html, /name="dateHour"/);
  assert.match(app, /time24Markup\('manualDate'/);
  assert.match(app, /time24Markup\(`arrivalTime-\$\{player\.id\}`/);
});

test('la aplicación no usa confirmaciones nativas', async () => {
  const app = await projectFile('js/app.js');
  assert.doesNotMatch(app, /\bconfirm\s*\(/);
  assert.match(app, /confirmation-dialog/);
});

test('la barra táctica usa las siete muestras SVG y permite leer todos los nombres sin truncarlos', async () => {
  const [app, css] = await Promise.all([
    projectFile('js/app.js'), projectFile('styles.css'),
  ]);
  assert.match(app, /renderTacticToolIcon\(tool\.id\)/);
  assert.match(app, /TACTIC_TOOLS\.map\(\(\{ id, label \}\) => `<button[^`]+renderTacticToolIcon\(id\)[^`]+tactic-tool-label[^`]+\$\{label\}/);
  assert.match(app, /title="\$\{label\}"/);
  assert.match(app, /target\.closest\('\.tactic-tool\[data-tactic-tool\]'\)/);
  assert.match(css, /\.tactic-tools\{[^}]*display:grid[^}]*overflow:visible/);
  assert.match(css, /\.tactic-tool\{[^}]*min-width:0[^}]*white-space:normal/);
});

test('las seis correcciones de tácticas y partido en vivo quedan conectadas en la UI real', async () => {
  const [html, app, css, tactics] = await Promise.all([
    projectFile('index.html'), projectFile('js/app.js'), projectFile('styles.css'), projectFile('js/tactics.js'),
  ]);
  assert.match(app, /id="owner-auto-sub"/);
  assert.match(app, /prep\?\.formacion \?\? '1-3-2-1'/);
  assert.match(app, /syncLiveTacticFromTimer\(\);/);
  assert.match(app, /class="lightbox live-tactics-lightbox live-tactics" id="tactic-board-lightbox"/);
  assert.match(app, /id="tactic-board-tools-full"/);
  assert.match(app, /class="live-tactics-legend compact"/);
  assert.match(html, /id="tactica-filters"[\s\S]*id="tacticas-interactivas"/);
  assert.match(app, /TACTICAS_INTERACTIVAS\.map\(\(t\) => `<option value="\$\{escapeHtml\(t\.id\)\}"\>/);
  assert.match(app, /renderTacticaGuiaHTML\(tactica\)/);
  assert.match(app, /initTacticaGuia\(root\.querySelector\('\.tactica-guia'\), tactica\)/);
  assert.match(tactics, /Borrar línea/);
  assert.match(tactics, /Borrar todo/);
  assert.match(css, /\.live-tactics-legend\.compact/);
});

test('permite añadir y editar jugadores aunque todavía no tengan posición', async () => {
  const [html, app] = await Promise.all([projectFile('index.html'), projectFile('js/app.js')]);
  assert.match(html, /Posiciones \(puedes marcar varias\)/);
  assert.match(app, /const positions = checkedValues\('positions', form\)/);
  assert.doesNotMatch(app, /if \(!positions\.length\).*Selecciona al menos una posición/);
});

test('las fichas de plantilla muestran dorsal, posición, pierna y rotaciones con etiquetas claras', async () => {
  const [app, css] = await Promise.all([projectFile('js/app.js'), projectFile('styles.css')]);
  assert.match(app, /class="player-data"/);
  assert.match(app, />Dorsal</);
  assert.match(app, />Posición</);
  assert.match(app, />Pierna</);
  assert.match(app, />Rotaciones</);
  assert.match(app, /class="player-head"/);
  assert.match(app, /class="player-performance"/);
  assert.match(app, />Ver actividad y estadísticas</);
  assert.doesNotMatch(app, /<div><h3>\$\{escapeHtml\(player\.name\)\} <span class="pill">#/);
  assert.match(css, /\.player-data/);
  assert.match(css, /\.player-head/);
  assert.match(css, /\.player-performance/);
  assert.match(css, /overflow-wrap:anywhere/);
});

test('actividad y estadísticas repite las mismas casillas bajo el título Pretemporada', async () => {
  const [app, css] = await Promise.all([projectFile('js/app.js'), projectFile('styles.css')]);
  assert.match(app, /buildPlayerSummary\(player\.id, state\.matches, currentTrainings, currentCallups, 'league'\)/);
  assert.match(app, /buildPlayerSummary\(player\.id, state\.matches, currentTrainings, currentCallups, 'preseason'\)/);
  assert.match(app, /<h4 class="player-stats-title">Pretemporada<\/h4>/);
  assert.equal((app.match(/<div class="player-summary">/g) ?? []).length, 2);
  assert.doesNotMatch(app, /Minutos de pretemporada/);
  assert.match(css, /\.player-stats-title/);
});

test('Migue puede editar todas las casillas de Liga y Pretemporada sin alterar los registros originales', async () => {
  const [app, html, css] = await Promise.all([projectFile('js/app.js'), projectFile('index.html'), projectFile('styles.css')]);
  assert.match(app, /class="edit-player-stats secondary" data-player-id="\$\{player\.id\}" data-scope="league"/);
  assert.match(app, /class="edit-player-stats secondary" data-player-id="\$\{player\.id\}" data-scope="preseason"/);
  assert.match(app, /function editPlayerStats\(/);
  assert.match(app, /async function savePlayerStats\(/);
  assert.match(app, /summary\.minutes \+ preseasonSummary\.minutes/);
  assert.match(app, /summary\.rotations \+ preseasonSummary\.rotations/);
  assert.match(app, /const playerSummaryTotals = new Map/);
  assert.match(html, /id="player-stats-dialog"/);
  assert.match(css, /\.stats-edit-grid/);
  for (const field of ['goals', 'yellowCards', 'redCards', 'injuries', 'incidents', 'callups', 'rotations', 'late', 'absent', 'minutes', 'averageRating']) {
    assert.match(html, new RegExp(`name="${field}"`));
  }
});

test('convocatoria ofrece lesionado, sancionado y otro motivo con explicación obligatoria', async () => {
  const app = await projectFile('js/app.js');
  assert.match(app, /injured: 'Lesionado'/);
  assert.match(app, /suspended: 'Sancionado'/);
  assert.match(app, /other: 'Otro motivo'/);
  assert.match(app, /name="reasonNote-\$\{player\.id\}"/);
  assert.match(app, /reason === 'other' && !note/);
  assert.match(app, /Otro motivo: \$\{note\}/);
});

test('borrar un partido limpia sus datos derivados, asistencia y convocatoria', async () => {
  const app = await projectFile('js/app.js');
  assert.match(app, /const currentCallups = state\.callups\.filter/);
  assert.match(app, /const currentTrainings = state\.trainings\.filter/);
  assert.match(app, /buildPlayerHistory\(player\.id, currentTrainings, currentCallups, state\.matches\)/);
  assert.match(app, /async function deleteMatch\(/);
  assert.match(app, /removeMatchFromPlayerStats/);
  assert.match(app, /callup\.id === match\.callupId \|\| callup\.matchId === match\.id/);
  assert.match(app, /match\.callupId/);
  assert.doesNotMatch(app, /if \(target\.matches\('\.delete-match'\).*for \(const record/);
});

test('la preparación guardada alimenta automáticamente el partido en vivo y el delegado', async () => {
  const app = await projectFile('js/app.js');
  assert.match(app, /await put\('settings', record\);\s*await refresh\(\);\s*await applyPreparacionToLive\(record\);/);
  assert.match(app, /delegateShown:\s*prep\.delegateShown/);
  assert.match(app, /prepDraft = asignarJugador\(prepDraft, keeperIndex, keeper1\.value\)/);
  assert.doesNotMatch(app, /const keepers = called\.filter/);
});

test('al guardar una preparación repinta su estado como Preparado', async () => {
  const app = await projectFile('js/app.js');
  assert.match(app, /<span class="pill ok">✓ Preparado<\/span>/);
  assert.match(app, /await applyPreparacionToLive\(record\);[\s\S]*renderPreparaciones\(\);[\s\S]*toast\('Preparación guardada\.'\)/);
  assert.doesNotMatch(app, /<span class="pill ok">✓ Guardado<\/span>/);
});

test('la sesión autenticada se restaura al recargar y el PIN no se abre incondicionalmente', async () => {
  const app = await projectFile('js/app.js');
  assert.match(app, /sessionStorage/);
  assert.match(app, /restoreSessionRole/);
  assert.match(app, /state\.settings\.ownerPinHash/);
  assert.doesNotMatch(app, /renderDelegate\(\);\s*showAuth\(\)/);
});

test('localhost desregistra el service worker viejo y recarga una sola vez para soltar su caché', async () => {
  const app = await projectFile('js/app.js');
  assert.match(app, /await Promise\.all\(registrations\.map\(\(registration\) => registration\.unregister\(\)\)\)/);
  assert.match(app, /navigator\.serviceWorker\.controller/);
  assert.match(app, /location\.reload\(\)/);
});

test('la iteración 9 expone equipo, localía, marcador de estadio y oculta comentarios al delegado', async () => {
  const [html, app] = await Promise.all([projectFile('index.html'), projectFile('js/app.js')]);
  assert.match(html, /Nombre de mi equipo/);
  assert.match(html, /name="venue"/);
  assert.match(app, /calledPlayerOptions/);
  assert.match(app, /data-score-team=/);
  assert.match(app, /roleCanUseOwnerFeatures\(state\.role\).*Comentarios/s);
  assert.match(app, /const keepers = \[\.\.\.called\]\.sort/, 'los selectores de portero incluyen a todos los convocados');
  assert.doesNotMatch(app, /const keepers = called\.filter/, 'no restringe la portería a quienes tengan posición Portero');
  assert.match(app, /getAttribute\('id'\)/, 'conserva el arreglo del listener de convocatorias');
});

test('la fase 2 expone ejercicios, filtros, favoritos, CRUD y sesiones por bloques', async () => {
  const [html, app, sw] = await Promise.all([
    projectFile('index.html'), projectFile('js/app.js'), projectFile('sw.js'),
  ]);
  assert.match(html, /data-view="ejercicios"/);
  assert.match(html, /id="exercise-filters"/);
  assert.match(html, /id="exercise-form"/);
  assert.match(app, /id="session-form"/);
  assert.match(app, /INITIAL_EXERCISES/);
  assert.match(app, /recordType === 'trainingSession'/);
  assert.match(app, /form\.getAttribute\('id'\)/, 'los formularios dinámicos mantienen el patrón seguro');
  assert.match(sw, /training-domain\.js/);
});

test('la mejora de fase 2 muestra diagramas y jugadores destacados también en selectores', async () => {
  const [app, css] = await Promise.all([projectFile('js/app.js'), projectFile('styles.css')]);
  assert.match(app, /renderBoardDiagrams\(item\)/);
  assert.match(app, /class="player-count"/);
  assert.match(app, /👥.*jugadores/);
  assert.match(app, /item\.players.*item\.duration.*min/s);
  assert.match(app, /phase2-v2-seeded/);
  assert.match(css, /\.player-count/);
  assert.match(css, /\.exercise-diagram/);
});

test('la pizarra completa y el flujo añadir a sesión están conectados en la interfaz', async () => {
  const [html, app, css, sw] = await Promise.all([
    projectFile('index.html'), projectFile('js/app.js'), projectFile('styles.css'), projectFile('sw.js'),
  ]);
  assert.match(html, /id="add-session-dialog"/);
  assert.match(app, /Añadir a sesión/);
  assert.match(app, /completeExercise\(rawItem\)/);
  assert.match(app, /renderBoardDiagrams\(item\)/);
  assert.match(app, /sessionDurationStatus/);
  assert.match(app, /move-session-block/);
  assert.match(app, /remove-session-block/);
  assert.match(app, /form\.getAttribute\('id'\)/, 'conserva el listener global seguro');
  assert.match(css, /\.exercise-board/);
  assert.match(css, /background:#fff/);
  assert.match(sw, /exercise-planning\.js/);
});

test('la limpieza elimina los ejercicios precargados malos y el builder de sesión es intuitivo', async () => {
  const [app, sw] = await Promise.all([projectFile('js/app.js'), projectFile('sw.js')]);
  assert.match(app, /ensureLegacyExercisesNotPresent/, 'existe la migración que limpia los malos');
  assert.match(app, /legacy-exercises-not-present-v2/, 'la migración tiene su flag');
  assert.match(app, /example === true/, 'solo borra los precargados, no los creados a mano');
  assert.match(app, /session-exercise-picker/, 'el builder muestra la lista de ejercicios');
  assert.match(app, /\+ Añadir/, 'cada ejercicio tiene botón para añadirlo');
  assert.match(app, /session-builder.*classList\.contains\('hidden'\)/, 'el botón añade directo cuando el builder está abierto');
  assert.match(sw, /campobase-v2\.44\.0/, 'caché actualizada');
});

test('la app no precarga ni sobrescribe automáticamente datos personales de jugadores', async () => {
  const [app, seed] = await Promise.all([projectFile('js/app.js'), projectFile('js/squad-seed.js')]);
  assert.doesNotMatch(app, /ensureSquadSeeded/);
  assert.doesNotMatch(app, /OFFICIAL_SQUAD_DATA/);
  assert.match(app, /putPlayerProfile/);
  assert.match(seed, /OFFICIAL_SQUAD_DATA = \[\]/);
  assert.match(seed, /players: \[\]/);
});

test('la pizarra táctica permite arrastrar piezas, colocar balón y dibujar cinco tipos de flecha', async () => {
  const [app, tactics, css] = await Promise.all([projectFile('js/app.js'), projectFile('js/tactics.js'), projectFile('styles.css')]);
  assert.match(tactics, /id: 'sprint'/, 'incluye la herramienta sprint');
  assert.match(app, /pointerdown/, 'inicia interacción táctil o con ratón');
  assert.match(app, /moveTacticPiece/, 'actualiza posiciones del tablero');
  assert.match(app, /createTacticMove/, 'guarda flechas dibujadas a mano');
  assert.match(tactics, /data-piece="ball"/, 'el balón es una pieza colocable');
  assert.match(css, /\.tac-sprint/, 'el sprint tiene trazo diferenciado');
});

test('la guía táctica se oculta en el builder y aparece al abrir el detalle guardado', async () => {
  const app = await projectFile('js/app.js');
  const builder = app.slice(app.indexOf('function tacticBuilder'), app.indexOf('async function saveTactic'));
  const save = app.slice(app.indexOf('async function saveTactic'), app.indexOf('function showTacticDetail'));
  const detail = app.slice(app.indexOf('function showTacticDetail'), app.indexOf('function tacticPoint'));

  assert.doesNotMatch(builder, /tactic-guide|FORMATION_GUIDES/, 'el editor no muestra explicaciones');
  assert.match(save, /classList\.add\('hidden'\)/, 'guardar cierra el editor');
  assert.match(detail, /FORMATION_GUIDES\[tactic\.formation\]/, 'el detalle usa la guía de la formación guardada');
  assert.match(detail, /qué busco/);
  assert.match(detail, /Con balón/);
  assert.match(detail, /Sin balón \/ defensa/);
  assert.match(detail, /Al perder el balón/);
  assert.match(app, /view-tactic[^\n]+showTacticDetail/, 'abrir una táctica guardada muestra su detalle');
});

test('las sesiones son una pestaña aparte, con ejercicios pinchables y tiempo configurable', async () => {
  const [html, app] = await Promise.all([projectFile('index.html'), projectFile('js/app.js')]);
  assert.match(html, /data-view="sesiones"/, 'hay pestaña de sesiones en la navegación');
  assert.match(html, /id="sesiones"/, 'existe la sección de sesiones');
  assert.match(html, /id="title-sessions"/, 'la sección de sesiones tiene título propio');
  assert.match(app, /showView\('sesiones'\)/, 'al guardar una sesión se muestra la pestaña de sesiones');
  assert.match(app, /session-exercise-link/, 'cada ejercicio de la sesión es pinchable');
  assert.match(app, /showExerciseDetail/, 'existe la función que muestra el detalle del ejercicio');
  assert.match(app, /targetDuration/, 'la sesión guarda el tiempo objetivo');
  assert.match(app, /sessionKind/, 'la sesión guarda si es calentamiento de partido/amistoso');
  assert.match(app, /sessionDurationStatus\(blocks, target\)/, 'el indicador usa el tiempo configurable');
});

test('el PIN demo abre una sesión aislada de dos horas sin ajustes ni datos reales', async () => {
  const [html, app, db, css, sw] = await Promise.all([
    projectFile('index.html'), projectFile('js/app.js'), projectFile('js/db.js'), projectFile('styles.css'), projectFile('sw.js'),
  ]);

  assert.match(html, /id="demo-pin-settings-form"/);
  assert.match(html, /name="demoPin"/);
  assert.match(html, /id="demo-team-form"/);
  assert.match(html, /data-view="ajustes"[^>]*id="settings-nav"/);
  assert.match(app, /demoPinSalt/);
  assert.match(app, /demoPinHash/);
  assert.match(app, /applyRole\('demo'/);
  assert.match(app, /configureDemoDatabase/);
  assert.match(app, /deleteDemoDatabase/);
  assert.match(app, /classList\.toggle\('demo-mode'/);
  assert.match(app, /settings-nav[^\n]+hidden/);
  assert.match(app, /DEMO_DURATION_MS/);
  assert.match(db, /if \(isDemoDatabase\(\)\) return \{ online: false, pending: 0, demo: true \}/);
  assert.match(css, /\.demo-mode \.club-crest\{display:none\}/);
  assert.match(sw, /demo-session\.js/);
});

test('guardar el PIN demo conserva el formulario durante las operaciones asíncronas', async () => {
  const app = await projectFile('js/app.js');
  const source = app.slice(app.indexOf('async function changeDemoPin'), app.indexOf('async function changeLiveScore'));
  const form = { resetCalled: false, reset() { this.resetCalled = true; } };
  let currentTargetReads = 0;
  const event = {
    preventDefault() {},
    get currentTarget() {
      currentTargetReads += 1;
      return currentTargetReads === 1 ? form : null;
    },
  };
  const state = { role: 'owner', settings: { id: 'main', pinSalt: 'owner-salt', ownerPinHash: 'owner-hash', delegatePinHash: 'delegate-hash' } };
  const verifications = [true, false, false];
  let message = '';

  await runInNewContext(`${source}; changeDemoPin(event);`, {
    state,
    toast: (value) => { message = value; },
    formObject: () => ({ currentPin: '2468', demoPin: '9999' }),
    verifyPin: async () => verifications.shift(),
    hashPin: async () => 'demo-hash',
    put: async () => {},
    crypto: { randomUUID: () => 'demo-salt' },
    event,
  });

  assert.equal(currentTargetReads, 1);
  assert.equal(form.resetCalled, true);
  assert.equal(message, 'PIN de demo guardado.');
  assert.equal(state.settings.demoPinSalt, 'demo-salt');
  assert.equal(state.settings.demoPinHash, 'demo-hash');
});

test('la demo conserva toda la operativa de Migue pero nunca precarga su plantilla', async () => {
  const app = await projectFile('js/app.js');
  const startDemo = app.slice(app.indexOf('async function startDemoSession'), app.indexOf('async function endDemoSession'));

  assert.match(app, /roleCanUseOwnerFeatures\(state\.role\)/);
  assert.match(startDemo, /ensurePhase2Seeded\(\)/);
  assert.doesNotMatch(startDemo, /ensureSquadSeeded\(\)/);
  assert.match(startDemo, /await refresh\(\)/);
});