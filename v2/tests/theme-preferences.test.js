import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');
const css = fs.readFileSync('styles-redesign.css', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

test('index.html no contiene el texto de advertencia de Privacidad y límites', () => {
  assert.doesNotMatch(html, /Privacidad y límites/, 'No debe existir el panel de Privacidad y límites');
  assert.doesNotMatch(html, /publishable key está incluida en la app pública/, 'No debe existir el texto explicativo de la key pública');
});

test('index.html carga Google Fonts para tipografías deportivas y legibles en cualquier dispositivo', () => {
  assert.match(html, /fonts\.googleapis\.com/, 'Debe conectar con Google Fonts');
  assert.match(html, /Barlow\+Condensed/, 'Debe cargar Barlow Condensed para estilo deportivo');
  assert.match(html, /Inter/, 'Debe cargar Inter para máxima legibilidad');
  assert.match(html, /JetBrains\+Mono/, 'Debe cargar JetBrains Mono para pizarra técnica');
  assert.match(html, /Outfit/, 'Debe cargar Outfit para estilo moderno');
});

test('index.html incluye los 13 fondos de la app con chips visuales', () => {
  const backgrounds = [
    'default', 'dark', 'pitch-vivid', 'navy', 'ocean',
    'charcoal', 'steel', 'burgundy', 'purple', 'light',
    'warm', 'sepia', 'high-vis'
  ];
  for (const bg of backgrounds) {
    assert.match(html, new RegExp(`data-bg="${bg}"`), `Falta el botón para el fondo ${bg}`);
  }
});

test('index.html ofrece escalas de tamaño gigantes y grosores de alto contraste', () => {
  assert.match(html, /value="huge"/);
  assert.match(html, /value="enormous"/);
  assert.match(html, /value="ultra"/);
  assert.match(html, /value="extrabold"/);
  assert.match(html, /value="ultra-bold"/);
});

test('styles-redesign.css define reglas para todos los fondos y escalas de hasta 32px', () => {
  assert.match(css, /html\[data-font-scale="ultra"\]\s*\{\s*font-size:\s*32px/);
  assert.match(css, /\[data-theme-bg="burgundy"\]/);
  assert.match(css, /\[data-theme-bg="ocean"\]/);
  assert.match(css, /\[data-theme-bg="steel"\]/);
  assert.match(css, /\[data-theme-bg="sepia"\]/);
  assert.match(css, /\[data-theme-bg="purple"\]/);
});

test('js/app.js aplica variables directas y delegación global para reactividad instantánea', () => {
  assert.match(app, /THEME_PRESETS/);
  assert.match(app, /FONT_SCALE_MAP/);
  assert.match(app, /FONT_FAMILY_MAP/);
  assert.match(app, /updateThemeProperty/);
  assert.match(app, /document\.addEventListener\('click'/);
  assert.match(app, /document\.addEventListener\('change'/);
});

test('sw.js renueva CACHE con versión themev para actualizar PWA móvil', () => {
  assert.match(sw, /themev\d+/);
  assert.match(sw, /exerciseboard-2475/);
  assert.match(sw, /image-crop-utils\.js/);
});

test('Ajustes permite cambiar el color de fuentes con swatches y selector nativo', () => {
  assert.match(html, /id="theme-font-color-swatches"/);
  assert.match(html, /id="theme-font-color-picker"/);
  assert.match(html, /font-color-swatch-btn/);
  assert.match(css, /\.font-color-swatch-btn/);
  assert.match(app, /theme\.fontColor/);
});

test('Plantilla incluye contenedor superior para el cuerpo técnico', () => {
  assert.match(html, /id="plantilla-staff-top"/);
  assert.match(css, /\.plantilla-staff-top/);
  assert.match(css, /\.plantilla-staff-bar/);
  assert.match(css, /\.plantilla-staff-card/);
});

test('La ficha de jugador da protagonismo a la media de liga y separa acciones', () => {
  assert.match(css, /\.player-rating-badge/);
  assert.match(css, /\.rating-tier-top/);
  assert.match(css, /\.player-card-actions-bar/);
  assert.match(app, /player-rating-badge/);
  assert.match(app, /player-card-actions-bar/);
});

test('Los diálogos de jugador y técnico integran controles de encuadre y avatar acotado', () => {
  assert.match(html, /id="player-photo-preview"/);
  assert.match(html, /id="staff-photo-preview"/);
  assert.match(html, /photo-adjust-controls/);
  assert.match(css, /\.avatar-preview-img/);
  assert.match(css, /\.photo-preview-wrapper/);
});

test('Pestaña Hoy no contiene el botón secundario duplicado de Actualizar', () => {
  assert.doesNotMatch(html, /today-refresh/, 'index.html no debe incluir el botón duplicado today-refresh en Hoy');
  const todayJs = fs.readFileSync('js/today-dashboard.js', 'utf8');
  assert.doesNotMatch(todayJs, /class="secondary today-refresh"/, 'today-dashboard.js no debe inyectar el botón today-refresh');
});

test('Color de fuentes aplica data-has-custom-font-color y --cb-font-custom-color con alta especificidad', () => {
  assert.match(css, /\[data-has-custom-font-color="true"\]/, 'CSS debe tener reglas para data-has-custom-font-color');
  assert.match(css, /var\(--cb-font-custom-color\)\s*!important/, 'CSS debe usar var(--cb-font-custom-color) con !important');
  assert.match(app, /data-has-custom-font-color/, 'app.js debe establecer el atributo data-has-custom-font-color');
  assert.match(app, /--cb-font-custom-color/, 'app.js debe establecer la variable --cb-font-custom-color');
});

test('attendance-linked-sources.js vincula asistencia por id o fecha y no ejecuta borrado destructivo en arranque', () => {
  const attendanceJs = fs.readFileSync('js/attendance-linked-sources.js', 'utf8');
  assert.doesNotMatch(attendanceJs, /function install\(\)\s*\{[^}]*scheduleCleanup\(\);/s, 'install() no debe llamar a scheduleCleanup() automáticamente');
  assert.match(attendanceJs, /dateOnly\(record\?\.date\)\s*===\s*dateOnly\(sessionDate\)/, 'attendanceForSession debe enlazar por fecha como respaldo');
});

test('Sincronización bidireccional entre textColor y fontColor y bootstrap en el head', () => {
  assert.match(html, /effectiveFontColor/, 'index.html head debe calcular effectiveFontColor al arrancar');
  assert.match(app, /TEXT_COLOR_MAP/, 'app.js debe definir TEXT_COLOR_MAP para mapear select a hex');
  assert.match(app, /COLOR_TO_TEXT_MAP/, 'app.js debe definir COLOR_TO_TEXT_MAP para mapear hex a select');
});

test('El formulario de jugador permite eliminar fotos permanentemente con photoRemoved', () => {
  assert.match(html, /<input name="photoRemoved" type="hidden" value="0">/, 'player-form debe incluir el campo hidden photoRemoved');
  assert.match(html, /id="player-remove-photo-btn"/, 'player-form debe incluir el botón Eliminar foto');
  assert.match(app, /const photoRemoved = form\.elements\.photoRemoved\?\.value === '1'/, 'savePlayer debe verificar si la foto fue eliminada');
  assert.match(app, /onPhotoChanged:\s*\(val\)\s*=>/, 'playerCropper debe incluir callback onPhotoChanged');
});
test('No expone textos técnicos ni menciones a Supabase en la interfaz visible para clientes', () => {
  assert.doesNotMatch(app, /Supabase sincronizado/, 'No debe mostrar Supabase sincronizado');
  assert.doesNotMatch(app, /Supabase pendiente/, 'No debe mostrar Supabase pendiente');
  assert.doesNotMatch(html, /Supabase sincroniza/, 'No debe mencionar Supabase en el panel de copia de seguridad');
  assert.match(css, /#network-label\s*\{\s*display:\s*none\s*!important;?\s*\}/, 'CSS debe ocultar network-label cuando está online');
});

