import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, appCode, navCode, cssCode, redesignCssCode] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../js/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../js/redesign-nav.js', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../styles-redesign.css', import.meta.url), 'utf8'),
]);

test('styles.css y styles-redesign.css permiten que todas las vistas autorizadas del delegado sean visibles sin quedar en blanco', () => {
  // En styles.css, el aislamiento exclusivo solo aplica cuando NO es multi-view
  assert.match(
    cssCode,
    /\.delegate-mode:not\(\.delegate-multi-view\)\s*\.view:not\(#delegado\)\{display:none!important\}/,
    'styles.css no debe forzar display:none en modo multi-vista'
  );

  // En styles-redesign.css, cada vista activa tiene selector con ID explícito para superar la especificidad de :not(#delegado)
  const views = [
    '#hoy',
    '#plantilla',
    '#cuerpo-tecnico',
    '#convocatorias',
    '#partido',
    '#delegado',
    '#preparacion',
    '#calendario',
    '#asistencia',
    '#ejercicios',
    '#sesiones',
    '#tacticas',
  ];

  for (const viewId of views) {
    const activeRegex = new RegExp(`body\\.delegate-mode\\.delegate-multi-view\\s+${viewId}\\.view\\.active`);
    assert.match(
      redesignCssCode,
      activeRegex,
      `styles-redesign.css debe incluir selector explícito para ${viewId}.view.active en delegate-multi-view`
    );

    const inactiveRegex = new RegExp(`body\\.delegate-mode\\.delegate-multi-view\\s+${viewId}\\.view:not\\(\\.active\\)`);
    assert.match(
      redesignCssCode,
      inactiveRegex,
      `styles-redesign.css debe incluir selector explícito para ${viewId}.view:not(.active) en delegate-multi-view`
    );
  }
});

test('showView y triggerStandardView invocan el renderizado real de todas las vistas sin dejarlas vacías', () => {
  // showView en app.js maneja cuerpo-tecnico, calendario, preparacion y hoy
  assert.match(appCode, /viewId === 'cuerpo-tecnico'[\s\S]*?refreshStaffView/);
  assert.match(appCode, /viewId === 'calendario' \|\| viewId === 'partidos'[\s\S]*?renderMatches/);
  assert.match(appCode, /viewId === 'preparacion'[\s\S]*?renderPreparaciones/);
  assert.match(appCode, /viewId === 'hoy'[\s\S]*?renderTodayDashboard/);

  // triggerStandardView en redesign-nav.js también maneja preparacion
  assert.match(navCode, /viewId === 'preparacion'[\s\S]*?renderPreparaciones/);

  // window.__campobase exporta renderPreparaciones
  assert.match(appCode, /window\.__campobase\s*=\s*\{[\s\S]*?renderPreparaciones/);
});
