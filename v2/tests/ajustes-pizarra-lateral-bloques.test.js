import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');
const cssPartido = fs.readFileSync('css/claude-partido.css', 'utf8');
const cssShell = fs.readFileSync('css/claude-shell.css', 'utf8');
const cssRedesign = fs.readFileSync('styles-redesign.css', 'utf8');

test('index.html incluye la Pizarra táctica de previsualización compacta y controles de color', () => {
  assert.match(html, /id="tactic-board-colors-card"/, 'Debe incluir la tarjeta #tactic-board-colors-card');
  assert.match(html, /id="cbx-mini-pitch-preview"/, 'Debe incluir el SVG del mini campo #cbx-mini-pitch-preview');
  assert.match(html, /id="mini-arrow-path"/, 'Debe incluir la flecha táctica #mini-arrow-path');
  assert.match(html, /id="cbx-mini-token-1"/, 'Debe incluir la ficha 1 del equipo');
  assert.match(html, /id="cbx-mini-rival-1"/, 'Debe incluir la ficha 1 del rival');
  assert.match(html, /id="cbx-tb-pitch-swatches"/, 'Debe incluir selector de césped');
  assert.match(html, /id="cbx-tb-lines-swatches"/, 'Debe incluir selector de líneas');
  assert.match(html, /id="cbx-tb-team-swatches"/, 'Debe incluir selector de fichas equipo');
  assert.match(html, /id="cbx-tb-rival-swatches"/, 'Debe incluir selector de fichas rival');
  assert.match(html, /id="cbx-tb-arrow-swatches"/, 'Debe incluir selector de flechas');
  assert.match(html, /id="cbx-reset-tactic-colors-btn"/, 'Debe incluir botón restablecer colores de pizarra');
});

test('index.html incluye la Personalización de la barra lateral izquierda', () => {
  assert.match(html, /id="sidebar-colors-card"/, 'Debe incluir la tarjeta #sidebar-colors-card');
  assert.match(html, /id="cbx-sidebar-bg-swatches"/, 'Debe incluir selector de fondo lateral');
  assert.match(html, /id="cbx-sidebar-ink-swatches"/, 'Debe incluir selector de texto lateral');
  assert.match(html, /id="cbx-sidebar-preview-box"/, 'Debe incluir la caja de previsualización del lateral');
});

test('index.html incluye previsualización de bloque y botón Guardar consistente', () => {
  assert.match(html, /id="preview-card-demo-wrap"/, 'Debe incluir la muestra de bloque en la vista previa');
  assert.match(html, /id="cbx-preview-banner-btn"/, 'Debe incluir el botón de muestra #cbx-preview-banner-btn');
  // Asegurar que es un botón o no tiene color de fuente en negro
  assert.match(html, /<button[^>]*id="cbx-preview-banner-btn"[^>]*class="[^"]*primary[^"]*"/, 'El botón Guardar debe ser un button con clase primary');
});

test('styles-redesign.css y css/claude-partido.css no fuerzan texto negro en el botón Guardar ni botones primarios', () => {
  // Verificar la exclusión en la regla data-has-custom-font-color
  assert.match(cssRedesign, /span:[^{]*:not\(#cbx-preview-banner-btn\)[^{]*:not\(#preview-sample-btn\)[^{]*:not\(\.cbx-preview-banner-btn\)[^{]*:not\(\.primary\)/,
    'styles-redesign.css debe excluir botones primarios y el botón Guardar de la regla de span custom font color');
  assert.match(cssRedesign, /#cbx-preview-banner-btn[^{]*\{[^}]*color:\s*var\(--btnInk/,
    '#cbx-preview-banner-btn debe tener color var(--btnInk) en styles-redesign.css');
  assert.match(cssPartido, /#cbx-preview-banner-btn[^{]*\{[^}]*color:\s*var\(--btnInk,\s*#ffffff\)\s*!important;/,
    '#cbx-preview-banner-btn debe tener color blanco forzado en css/claude-partido.css');
});

test('css/claude-shell.css aplica las variables personalizables a la barra lateral', () => {
  assert.match(cssShell, /#cb-claude-sidebar\s*\{[^}]*background:\s*var\(--sidebar-bg/,
    '#cb-claude-sidebar debe soportar var(--sidebar-bg)');
  assert.match(cssShell, /color:\s*var\(--sidebar-ink/,
    'Los botones de la barra lateral deben soportar var(--sidebar-ink)');
});

test('css/claude-partido.css contiene estilos para el mini campo y variables de pizarra', () => {
  assert.match(cssPartido, /#cbx-mini-pitch-preview/, 'Debe definir regla para #cbx-mini-pitch-preview');
  assert.match(cssPartido, /var\(--tb-pitch/, 'Debe usar variable --tb-pitch');
  assert.match(cssPartido, /var\(--tb-lines/, 'Debe usar variable --tb-lines');
  assert.match(cssPartido, /var\(--tb-team/, 'Debe usar variable --tb-team');
  assert.match(cssPartido, /var\(--tb-rival/, 'Debe usar variable --tb-rival');
  assert.match(cssPartido, /var\(--tb-arrow/, 'Debe usar variable --tb-arrow');
});

test('js/app.js implementa configuración y persistencia de pizarra y barra lateral', () => {
  assert.match(app, /DEFAULT_TACTIC_BOARD/, 'Debe definir DEFAULT_TACTIC_BOARD con valores por defecto');
  assert.match(app, /sidebarBg/, 'Debe registrar sidebarBg en configuraciones');
  assert.match(app, /sidebarInk/, 'Debe registrar sidebarInk en configuraciones');
  assert.match(app, /tbPitch/, 'Debe registrar tbPitch en configuraciones');
  assert.match(app, /tbLines/, 'Debe registrar tbLines en configuraciones');
  assert.match(app, /tbTeam/, 'Debe registrar tbTeam en configuraciones');
  assert.match(app, /tbRival/, 'Debe registrar tbRival en configuraciones');
  assert.match(app, /tbArrow/, 'Debe registrar tbArrow en configuraciones');
  assert.match(app, /function updateTacticBoardPreviewBox/, 'Debe definir updateTacticBoardPreviewBox');
  assert.match(app, /function resetTacticBoardColors/, 'Debe definir resetTacticBoardColors');
  assert.match(app, /--sidebar-bg/, 'applyCustomTheme debe inyectar --sidebar-bg');
  assert.match(app, /--sidebar-ink/, 'applyCustomTheme debe inyectar --sidebar-ink');
  assert.match(app, /--tb-pitch/, 'applyCustomTheme debe inyectar --tb-pitch');
  assert.match(app, /--tb-lines/, 'applyCustomTheme debe inyectar --tb-lines');
  assert.match(app, /--tb-team/, 'applyCustomTheme debe inyectar --tb-team');
  assert.match(app, /--tb-rival/, 'applyCustomTheme debe inyectar --tb-rival');
  assert.match(app, /--tb-arrow/, 'applyCustomTheme debe inyectar --tb-arrow');
});

test('css/claude-entreno.css oculta #tacticas cuando no tiene clase active', () => {
  const cssEntreno = fs.readFileSync('css/claude-entreno.css', 'utf8');
  assert.match(cssEntreno, /#tacticas:not\(\.active\)\s*\{[^}]*display:\s*none\s*!important;/,
    '#tacticas debe tener display: none !important cuando no está activo para no filtrarse en Ajustes');
  assert.match(cssEntreno, /#tacticas\.active\s*\{[^}]*display:\s*flex;/,
    '#tacticas debe tener display: flex solo cuando está activo');
});

test('index.html y js/app.js incluyen goles en contra/favor, semáforos y botones en la vista previa rica', () => {
  assert.match(html, /id="preview-gf-num"/, 'Debe incluir el marcador de goles a favor en la cabecera');
  assert.match(html, /id="preview-ga-num"/, 'Debe incluir el marcador de goles en contra en la cabecera');
  assert.match(html, /id="preview-sem-gk"/, 'Debe incluir la píldora semáforo de portero');
  assert.match(html, /id="preview-sem-win"/, 'Debe incluir la píldora semáforo de victoria');
  assert.match(html, /id="preview-sample-btn2"/, 'Debe incluir botón secundario en la vista previa');
  assert.match(html, /id="preview-sample-wa"/, 'Debe incluir muestra de WhatsApp en la vista previa');
  assert.match(html, /id="preview-sample-res"/, 'Debe incluir muestra de resultado de temporada en la vista previa');

  assert.match(app, /#preview-gf-num/, 'updateThemePreviewBox debe actualizar goles a favor');
  assert.match(app, /#preview-ga-num/, 'updateThemePreviewBox debe actualizar goles en contra');
  assert.match(app, /preview-sem-gk/, 'updateThemePreviewBox debe actualizar semáforos');
});

test('css/claude-shell.css y styles-redesign.css aplican reactivamente el fondo de la app', () => {
  assert.match(cssShell, /background:\s*var\(--bg/, 'css/claude-shell.css debe usar var(--bg)');
  assert.match(cssRedesign, /background:\s*var\(--bg/, 'styles-redesign.css debe usar var(--bg)');
});

test('css/claude-partido.css propaga los colores de pizarra a todas las pizarras del sistema', () => {
  assert.match(cssPartido, /\.tac-field\s*\{[^}]*fill:\s*var\(--tb-pitch/, 'Debe aplicar --tb-pitch a .tac-field');
  assert.match(cssPartido, /\.tac-line[^{]*\{[^}]*stroke:\s*var\(--tb-lines/, 'Debe aplicar --tb-lines a .tac-line');
  assert.match(cssPartido, /\.tac-player\s*circle[^{]*\{[^}]*fill:\s*var\(--tb-team/, 'Debe aplicar --tb-team a .tac-player circle');
  assert.match(cssPartido, /\.tac-opponent\s*circle[^{]*\{[^}]*fill:\s*var\(--tb-rival/, 'Debe aplicar --tb-rival a .tac-opponent circle');
});

test('index.html y js/app.js incluyen selector de 6 pestañas de previsualización en vivo en Ajustes', () => {
  assert.match(html, /data-preview-pane="scoreboard"/, 'Debe incluir pestaña marcador');
  assert.match(html, /data-preview-pane="hoy"/, 'Debe incluir pestaña hoy');
  assert.match(html, /data-preview-pane="convocatoria"/, 'Debe incluir pestaña convocatoria');
  assert.match(html, /data-preview-pane="lanzadores"/, 'Debe incluir pestaña lanzadores');
  assert.match(html, /data-preview-pane="staff"/, 'Debe incluir pestaña cuerpo técnico');
  assert.match(html, /data-preview-pane="pizarra"/, 'Debe incluir pestaña pizarra táctica');

  assert.match(html, /id="preview-pane-scoreboard"/, 'Debe incluir panel marcador');
  assert.match(html, /id="preview-pane-hoy"/, 'Debe incluir panel hoy');
  assert.match(html, /id="preview-pane-convocatoria"/, 'Debe incluir panel convocatoria');
  assert.match(html, /id="preview-pane-lanzadores"/, 'Debe incluir panel lanzadores');
  assert.match(html, /id="preview-pane-staff"/, 'Debe incluir panel cuerpo técnico');
  assert.match(html, /id="preview-pane-pizarra"/, 'Debe incluir panel pizarra táctica');

  assert.match(app, /cbx-preview-tab-btn/, 'js/app.js debe delegar clics para conmutar pestañas de preview');
  assert.match(app, /preview-tab-mini-pitch/, 'updateTacticBoardPreviewBox debe actualizar la mini pizarra de la pestaña');
});

test('Módulos clave eliminan verdes fijos y responden a variables de personalización', () => {
  const cssHoy = fs.readFileSync('css/claude-hoy.css', 'utf8');
  const cssPlantilla = fs.readFileSync('css/claude-plantilla.css', 'utf8');

  // En Hoy, el banner responde a --bn y los paneles a --cardBg
  assert.doesNotMatch(cssHoy, /linear-gradient\(135deg,\s*#0a251b,\s*#297053\)/, 'Hoy no debe tener gradiente verde fijo');
  assert.match(cssHoy, /var\(--bn,\s*var\(--cbx-hero/, 'Hoy debe usar variable dinámica --bn');
  assert.match(cssHoy, /var\(--cardBg/, 'Paneles de Hoy deben usar var(--cardBg)');

  // En Lanzadores y Cuerpo Técnico, no debe haber verde hardcodeado #092b21 ni #116847
  assert.doesNotMatch(cssPlantilla, /#092b21/, 'Plantilla no debe contener verde hardcodeado #092b21');
  assert.doesNotMatch(cssPlantilla, /#116847/, 'Plantilla no debe contener verde hardcodeado #116847');

  // Botón Actualizar (#manual-refresh) blindado en blanco
  assert.match(cssHoy, /#manual-refresh[^{]*\{[^}]*color:\s*#ffffff\s*!important;/, 'Botón Actualizar debe tener texto blanco garantizado');
});

