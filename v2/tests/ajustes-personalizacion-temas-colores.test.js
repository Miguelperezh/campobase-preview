import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');
const css = fs.readFileSync('css/claude-partido.css', 'utf8');

test('index.html incluye las 6 tarjetas de personalización canónica de Claude en Ajustes', () => {
  // 1. Vista previa del tema
  assert.match(html, /id="theme-preview-card"/, 'Falta la tarjeta de Vista previa del tema');
  assert.match(html, /id="preview-scoreboard-header"/, 'Falta la cabecera del marcador de vista previa');
  assert.match(html, /id="preview-crest-demo"/, 'Falta el escudo demo de la vista previa');
  assert.match(html, /id="preview-team-name"/, 'Falta el nombre de equipo en la vista previa');
  assert.match(html, /id="preview-score"/, 'Falta el marcador en la vista previa');
  assert.match(html, /id="preview-sample-btn"/, 'Falta el botón de muestra en la vista previa');

  // 2. Temas guardados
  assert.match(html, /id="saved-themes-card"/, 'Falta la tarjeta de Temas guardados');
  assert.match(html, /id="cbx-presets-list"/, 'Falta el contenedor de chips de presets');
  assert.match(html, /id="new-preset-name"/, 'Falta el input para nuevo preset');
  assert.match(html, /id="save-current-preset-btn"/, 'Falta el botón Guardar tema actual');
  assert.match(html, /id="match-preset-info"/, 'Falta el texto de información de tema de partido');

  // 3. Fuente de títulos y marcadores
  assert.match(html, /id="title-font-card"/, 'Falta la tarjeta de Fuente de títulos y marcadores');
  assert.match(html, /id="title-font-options"/, 'Falta el contenedor de opciones de fuente de títulos');

  // 4. Colores con significado (Semáforos)
  assert.match(html, /id="semantic-colors-card"/, 'Falta la tarjeta de Colores con significado');
  assert.match(html, /id="sem-gk"/, 'Falta el color picker para Porteros');
  assert.match(html, /id="sem-def"/, 'Falta el color picker para Defensas');
  assert.match(html, /id="sem-mid"/, 'Falta el color picker para Medios');
  assert.match(html, /id="sem-fw"/, 'Falta el color picker para Delanteros');
  assert.match(html, /id="sem-win"/, 'Falta el color picker para Victoria');
  assert.match(html, /id="sem-draw"/, 'Falta el color picker para Empate');
  assert.match(html, /id="sem-loss"/, 'Falta el color picker para Derrota');

  // 5. Fondos, tarjetas y botones
  assert.match(html, /id="surfaces-buttons-card"/, 'Falta la tarjeta de Fondos, tarjetas y botones');
  assert.match(html, /id="cbx-app-bg-swatches"/, 'Falta el contenedor de swatches de fondo de app');
  assert.match(html, /id="cbx-app-bg-pct-slider"/, 'Falta el slider de intensidad de fondo de app');
  assert.match(html, /id="cbx-card-swatches"/, 'Falta el contenedor de swatches de tarjetas');
  assert.match(html, /id="cbx-card-pct-slider"/, 'Falta el slider de intensidad de tarjetas');
  assert.match(html, /id="cbx-card-title-swatches"/, 'Falta el contenedor de swatches de títulos de tarjetas');
  assert.match(html, /id="cbx-btn2-swatches"/, 'Falta el contenedor de swatches de botones secundarios');
  assert.match(html, /id="cbx-btn2-ink-swatches"/, 'Falta el contenedor de swatches de texto de botones secundarios');
  assert.match(html, /id="cbx-wa-ink-swatches"/, 'Falta el contenedor de swatches de texto de WhatsApp');
  assert.match(html, /id="cbx-res-ink-swatches"/, 'Falta el contenedor de swatches de texto de resultados');
  assert.match(html, /id="cbx-gf-swatches"/, 'Falta el contenedor de goles a favor');
  assert.match(html, /id="cbx-ga-swatches"/, 'Falta el contenedor de goles en contra');
  assert.match(html, /id="cbx-reset-colors-btn"/, 'Falta el botón Restablecer estos colores');

  // 6. Cabeceras y botones
  assert.match(html, /id="banners-buttons-card"/, 'Falta la tarjeta de Cabeceras y botones');
  assert.match(html, /id="cbx-bn-bg-swatches"/, 'Falta el contenedor de fondo de cabeceras');
  assert.match(html, /id="cbx-bn-ink-swatches"/, 'Falta el contenedor de texto de cabeceras');
  assert.match(html, /id="cbx-btn-bg-swatches"/, 'Falta el contenedor de fondo de botones principales');
  assert.match(html, /id="cbx-btn-ink-swatches"/, 'Falta el contenedor de texto de botones principales');
  assert.match(html, /id="cbx-preview-banner-box"/, 'Falta la muestra de cabecera en directo');
});

test('css/claude-partido.css define reglas para los nuevos controles de personalización y variables reactivas', () => {
  assert.match(css, /\.cbx-badge-new/, 'Falta estilo para .cbx-badge-new');
  assert.match(css, /\.cbx-swatch-btn/, 'Falta estilo para .cbx-swatch-btn');
  assert.match(css, /\.cbx-swatch-btn\.active/, 'Falta estilo para .cbx-swatch-btn.active');
  assert.match(css, /\.cbx-slider-row/, 'Falta estilo para .cbx-slider-row');
  assert.match(css, /\.cbx-preset-chip/, 'Falta estilo para .cbx-preset-chip');
  assert.match(css, /\.cbx-preset-apply-btn/, 'Falta estilo para .cbx-preset-apply-btn');
  assert.match(css, /\.cbx-preset-match-btn/, 'Falta estilo para .cbx-preset-match-btn');
  assert.match(css, /\.cbx-title-font-btn/, 'Falta estilo para .cbx-title-font-btn');
  assert.match(css, /\.cbx-preview-gf-badge/, 'Falta estilo para .cbx-preview-gf-badge');
  assert.match(css, /\.cbx-preview-ga-badge/, 'Falta estilo para .cbx-preview-ga-badge');

  // Comprobar aplicación de variables a elementos reales
  assert.match(css, /var\(--cardBg/, 'Debe aplicar --cardBg a paneles');
  assert.match(css, /var\(--cardTitle/, 'Debe aplicar --cardTitle a títulos de panel');
  assert.match(css, /var\(--btn\b/, 'Debe aplicar --btn a botones primarios');
  assert.match(css, /var\(--btnInk\b/, 'Debe aplicar --btnInk a texto de botones primarios');
  assert.match(css, /var\(--btn2\b/, 'Debe aplicar --btn2 a botones secundarios');
  assert.match(css, /var\(--btn2Ink\b/, 'Debe aplicar --btn2Ink a texto de botones secundarios');
  assert.match(css, /var\(--waInk\b/, 'Debe aplicar --waInk a botones de WhatsApp');
  assert.match(css, /var\(--resInk\b/, 'Debe aplicar --resInk a resultados de temporada');
});

test('js/app.js implementa la inyección de variables extendidas y cálculo de color-mix', () => {
  assert.match(app, /TITLE_FONT_MAP/, 'Debe definir mapa de fuentes de títulos');
  assert.match(app, /TITLE_FONT_OPTIONS/, 'Debe definir opciones de fuentes de títulos');
  assert.match(app, /DEFAULT_SEM/, 'Debe definir semáforos por defecto');
  assert.match(app, /DEFAULT_PRESETS/, 'Debe definir presets por defecto');
  assert.match(app, /EXTENDED_SWATCH_CONFIGS/, 'Debe definir configuraciones de swatches');

  // Inyección de variables en applyCustomTheme
  assert.match(app, /--cardBg/);
  assert.match(app, /--cardTitle/);
  assert.match(app, /--bn/);
  assert.match(app, /--bnInk/);
  assert.match(app, /--btn/);
  assert.match(app, /--btnInk/);
  assert.match(app, /--btn2/);
  assert.match(app, /--btn2Ink/);
  assert.match(app, /--waInk/);
  assert.match(app, /--resInk/);
  assert.match(app, /--gf/);
  assert.match(app, /--ga/);
  assert.match(app, /--sem-gk/);
  assert.match(app, /--sem-def/);
  assert.match(app, /--sem-mid/);
  assert.match(app, /--sem-fw/);
  assert.match(app, /--sem-win/);
  assert.match(app, /--sem-draw/);
  assert.match(app, /--sem-loss/);

  // color-mix e intensidades
  assert.match(app, /color-mix\(in srgb/);
  assert.match(app, /theme\.appBgPct/);
  assert.match(app, /theme\.cardPct/);
});

test('js/app.js proporciona funciones operativas para presets, semáforos y restablecimiento de colores', () => {
  assert.match(app, /function updateThemePreviewBox/);
  assert.match(app, /function renderCustomizerControls/);
  assert.match(app, /function syncCustomizerControls/);
  assert.match(app, /function renderSavedThemePresets/);
  assert.match(app, /function saveCurrentThemePreset/);
  assert.match(app, /function applyThemePreset/);
  assert.match(app, /function setMatchThemePreset/);
  assert.match(app, /function deleteThemePreset/);
  assert.match(app, /function resetExtendedColors/);
  assert.match(app, /function setSemanticColor/);
});

test('js/app.js aplica el tema específico de partido (matchPreset) en vivo y restaura al cambiar de vista', () => {
  assert.match(app, /state\.settings\.presets\[state\.settings\.matchPreset\]/);
  assert.match(app, /viewId === 'partido'/);
  assert.match(app, /previousViewId === 'partido'/);
});

test('index.html y css/claude-hoy.css sitúan la previsualización arriba y hacen configurables los accesos rápidos', () => {
  const cssHoy = fs.readFileSync('css/claude-hoy.css', 'utf8');

  // theme-preview-card está al principio de settings-grid antes de Identidad del club
  const previewPos = html.indexOf('id="theme-preview-card"');
  const clubIdentityPos = html.indexOf('<h3>Identidad del club</h3>');
  assert.ok(previewPos > 0 && previewPos < clubIdentityPos, 'theme-preview-card debe estar antes de Identidad del club al inicio de Ajustes');

  // preview-pane-hoy incluye pendientes y accesos rápidos
  assert.match(html, /id="preview-hoy-pending-card"/, 'Falta la tarjeta demo de pendientes en preview Hoy');
  assert.match(html, /id="preview-hoy-quick-card"/, 'Falta la tarjeta demo de accesos rápidos en preview Hoy');

  // surfaces-buttons-card incluye la caja de preview inline
  assert.match(html, /id="cbx-surfaces-preview-box"/, 'Falta la caja de preview en vivo en surfaces-buttons-card');
  assert.match(html, /id="cbx-preview-btn2-sample"/, 'Falta la muestra de botón secundario en surfaces-buttons-card');
  assert.match(html, /id="cbx-preview-quick-btn-1"/, 'Falta la muestra de accesos rápidos en surfaces-buttons-card');

  // css/claude-hoy.css aplica var(--btn2) y var(--btn2Ink) a los accesos rápidos y pendientes
  assert.match(cssHoy, /body\.cb-redesign-active #hoy \.today-quick button\s*\{[^}]*background:\s*var\(--btn2/,
    '.today-quick button debe usar var(--btn2)');
  assert.match(cssHoy, /body\.cb-redesign-active #hoy \.today-pending button[^{]*\{[^}]*background:\s*var\(--btn2/,
    '.today-pending button debe usar var(--btn2)');
});

test('styles-redesign.css garantiza la adaptación fluida a columna única en pantallas móviles', () => {
  const redesignCss = fs.readFileSync('styles-redesign.css', 'utf8');
  assert.match(redesignCss, /@media\s*\(max-width:\s*760px\)\s*\{\s*body\.cb-redesign-active \.settings-grid\s*\{[^}]*grid-template-columns:\s*1fr !important/);
  assert.match(redesignCss, /\.cbx-preview-tab-btn\s*\{[^}]*flex-shrink:\s*0 !important/);
  assert.match(redesignCss, /\.cbx-preview-tabs\s*\{[^}]*-webkit-overflow-scrolling:\s*touch !important/);
});

test('css/claude-plantilla.css e index.html vinculan especialistas a cardBg y cardBorder sin forzar tinte de botón', () => {
  const cssPlantilla = fs.readFileSync('css/claude-plantilla.css', 'utf8');
  assert.match(cssPlantilla, /\.specialist-item\s*\{[^}]*background:\s*var\(--cardBg,\s*#ffffff\)\s*!important/);
  assert.match(cssPlantilla, /\.specialist-item\s*\{[^}]*border:\s*1px\s*solid\s*var\(--cardBorder/);
  assert.doesNotMatch(cssPlantilla, /\.specialist-item\s*\{[^}]*color-mix\([^}]*var\(--btn/, 'specialist-item no debe usar color-mix con --btn');

  // En js/app.js updateThemePreview debe asignar finalCardBg y cardBorder
  assert.match(app, /el\.style\.background = finalCardBg/);
  assert.match(app, /el\.style\.borderColor = cardBorder/);
});

test('css/claude-entreno.css y css/claude-partido.css incluyen adaptación móvil completa para impresión y PDF', () => {
  const cssEntreno = fs.readFileSync('css/claude-entreno.css', 'utf8');
  const cssPartido = fs.readFileSync('css/claude-partido.css', 'utf8');

  // Barra flotante en móvil fija y botón salir destacado
  assert.match(cssEntreno, /@media screen and \(max-width:\s*850px\)/);
  assert.match(cssEntreno, /\.cb-print-btn-close\s*\{[^}]*order:\s*-1\s*!important/);
  assert.match(cssEntreno, /\.cb-print-btn-close\s*\{[^}]*grid-column:\s*1\s*\/\s*-1\s*!important/);
  assert.match(cssEntreno, /\.cb-print-sheet\s*\{[^}]*width:\s*100%\s*!important/);

  // Plan de partido en móvil adaptado
  assert.match(cssPartido, /@media screen and \(max-width:\s*850px\)/);
  assert.match(cssPartido, /\.cb-print-sheet\.cbx-pmp-sheet\s*\{[^}]*width:\s*100%\s*!important/);
});

test('js/app.js no muestra tácticas ficticias fijas (UD Lomo Verde) cuando no hay tácticas guardadas', () => {
  assert.doesNotMatch(app, /UD Lomo Verde/, 'No deben existir presets ficticios fijados en la vista táctica');
  assert.match(app, /cbx-saved-tactics-empty/, 'Debe mostrar estado vacío limpio si no hay tácticas');
});



