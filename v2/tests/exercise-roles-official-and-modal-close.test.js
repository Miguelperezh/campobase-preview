import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { roleVisualMeta, renderValidatedExerciseHTML } from '../js/ejercicio-viewer.js';
import { EJERCICIOS_VALIDADOS } from '../js/ejercicios-validados.js';

test('roleVisualMeta aplica las convenciones oficiales de roles y colores', () => {
  // Portero: P - NEGRO
  const p = roleVisualMeta('P');
  assert.equal(p.code, 'P');
  assert.equal(p.bg, '#111827');
  assert.equal(p.label, 'Portero');

  const p1 = roleVisualMeta({ id: 'P1', rol: 'portero' });
  assert.equal(p1.code, 'P1');
  assert.equal(p1.bg, '#111827');

  // Defensa: D1, D2... - ROJO
  const d1 = roleVisualMeta('D1');
  assert.equal(d1.code, 'D1');
  assert.equal(d1.bg, '#DC2626');
  assert.equal(d1.label, 'Defensa 1');

  const d2 = roleVisualMeta({ id: 'D2', rol: 'Defensa central' });
  assert.equal(d2.code, 'D2');
  assert.equal(d2.bg, '#DC2626');

  // Atacante: A1, A2, A3... - AZUL
  const a1 = roleVisualMeta('A1');
  assert.equal(a1.code, 'A1');
  assert.equal(a1.bg, '#2563EB');
  assert.equal(a1.label, 'Atacante 1');

  const a3 = roleVisualMeta({ id: 'A3', rol: 'Extremo derecho' });
  assert.equal(a3.code, 'A3');
  assert.equal(a3.bg, '#2563EB');

  // Neutro / Apoyo: N, C - AMARILLO
  const n = roleVisualMeta('N');
  assert.equal(n.code, 'N');
  assert.equal(n.bg, '#FACC15');
  assert.equal(n.color, '#000000');

  const c1 = roleVisualMeta({ id: 'C1', rol: 'Comodín' });
  assert.equal(c1.code, 'N1');
  assert.equal(c1.bg, '#FACC15');

  // Entrenador: E - GRIS CLARO
  const e = roleVisualMeta('E');
  assert.equal(e.code, 'E');
  assert.equal(e.bg, '#CBD5E1');
  assert.equal(e.color, '#0F172A');
});

test('renderValidatedExerciseHTML incluye la sección de Organización y roles con tokens oficiales', () => {
  const ex = EJERCICIOS_VALIDADOS[0];
  const html = renderValidatedExerciseHTML(ex);

  assert.ok(html.includes('id="section-organizacion"'), 'Debe incluir la sección de organización');
  assert.ok(html.includes('👥 Organización y roles'), 'Debe incluir el título de organización');
  assert.ok(html.includes('class="sheet-top-close-btn"'), 'Debe incluir el botón de cierre superior');
  assert.ok(html.includes('data-close'), 'El botón superior debe tener data-close');
});

test('los ejercicios con vídeo humano muestran la aclaración "(en caso de disponer de él)"', () => {
  const exWithVideo = EJERCICIOS_VALIDADOS.find(e => e.video_muestra_humanos || e.video_muestra);
  if (exWithVideo) {
    const html = renderValidatedExerciseHTML(exWithVideo);
    assert.match(html, /Vídeo de muestra con humanos \(en caso de disponer de él\)/);
  }
});

test('styles-redesign.css no oculta sheet-top-close-btn y define estilos de roles', () => {
  const css = fs.readFileSync('styles-redesign.css', 'utf8');
  assert.doesNotMatch(css, /\.sheet-top-close-btn\s*\{\s*display:\s*none\s*!important;?\s*\}/);
  assert.match(css, /\.sheet-top-close-btn[^{]*\{[^}]*display:\s*flex\s*!important/);
  assert.match(css, /#section-organizacion/);
  assert.match(css, /\.roles-chips-grid/);
  assert.match(css, /\.role-badge-card/);
});

test('redesign-nav.js excluye exercise-detail-dialog para evitar footer duplicado', () => {
  const navJs = fs.readFileSync('js/redesign-nav.js', 'utf8');
  assert.match(navJs, /BOTTOM_CLOSE_EXCLUDED_DIALOGS\s*=\s*new Set\(\[[^\]]*'exercise-detail-dialog'/);
});

test('app.js implementa teardown completo en wireExerciseDialogLifecycle para evitar bloqueos', () => {
  const appJs = fs.readFileSync('js/app.js', 'utf8');
  assert.match(appJs, /function wireExerciseDialogLifecycle\(/);
  assert.match(appJs, /video\.pause\(\)/);
  assert.match(appJs, /video\.removeAttribute\('src'\)/);
  assert.match(appJs, /video\.load\(\)/);
  assert.match(appJs, /body\.innerHTML\s*=\s*''/);
});

test('styles-redesign.css oculta el footer duplicado del diálogo cuando existe sheet-bottom-bar', () => {
  const css = fs.readFileSync('styles-redesign.css', 'utf8');
  assert.match(css, /#exercise-detail-dialog:has\(\.sheet-bottom-bar\)\s*>\s*\.dialog-sticky-footer/);
});

test('ejercicios-nuevo-formato normaliza media_crop como null para video integro y preview_crop para portada', async () => {
  const mod = await import('../js/ejercicios-nuevo-formato.js');
  const list = mod.EJERCICIOS_NUEVO_FORMATO;
  assert.ok(list.length >= 12, 'Debe haber al menos 12 ejercicios de nuevo formato');
  list.forEach(ex => {
    assert.equal(ex.media_crop, null, `El ejercicio ${ex.id} no debe tener media_crop para que el video se reproduzca íntegro`);
    assert.ok(ex.preview_crop, `El ejercicio ${ex.id} debe tener preview_crop para el encuadre de la miniatura`);
  });
});

test('los 12 ejercicios de nuevo formato tienen textos completos sin campos vacíos', async () => {
  const mod = await import('../js/ejercicios-nuevo-formato.js');
  const list = mod.EJERCICIOS_NUEVO_FORMATO.slice(0, 12);
  list.forEach(ex => {
    assert.ok(ex.como_se_hace && (Array.isArray(ex.como_se_hace) ? ex.como_se_hace.length > 0 : Object.keys(ex.como_se_hace).length > 0), `${ex.id} debe tener como_se_hace completo`);
    assert.ok(ex.montaje && ex.montaje.explicacion, `${ex.id} debe tener montaje.explicacion`);
    assert.ok(ex.rotacion && (ex.rotacion.explicacion || ex.rotacion.reglas?.length), `${ex.id} debe tener rotación explicada`);
    assert.ok(ex.consignas && ex.consignas.length > 0, `${ex.id} debe tener consignas`);
    assert.ok(ex.errores_correcciones && ex.errores_correcciones.length > 0, `${ex.id} debe tener errores_correcciones`);
    ex.errores_correcciones.forEach((ec, idx) => {
      assert.ok(ec.correccion && ec.correccion.trim().length > 0, `${ex.id} error ${idx} tiene corrección vacía`);
    });
    assert.ok(ex.materiales && ex.materiales.length > 0, `${ex.id} debe tener materiales`);
    assert.ok(ex.datos_rapidos?.duracion, `${ex.id} debe tener duración definida`);
  });
});

test('renderValidatedExerciseHTML renderiza como_se_hace adecuadamente para arrays y objetos', () => {
  const dummyArray = {
    id: 'TEST-1',
    nombre: 'Test Array',
    como_se_hace: ['Paso 1: inicio', 'Paso 2: acción', 'Paso 3: final']
  };
  const htmlArr = renderValidatedExerciseHTML(dummyArray);
  assert.ok(htmlArr.includes('id="section-como-se-hace"'));
  assert.ok(htmlArr.includes('Paso 1: inicio'));

  const dummyObj = {
    id: 'TEST-2',
    nombre: 'Test Obj',
    como_se_hace: {
      base: ['Paso base 1', 'Paso base 2'],
      variacion_1: ['Paso var 1']
    }
  };
  const htmlObj = renderValidatedExerciseHTML(dummyObj);
  assert.ok(htmlObj.includes('id="section-como-se-hace"'));
  assert.ok(htmlObj.includes('Fase Base'));
  assert.ok(htmlObj.includes('Paso base 1'));
  assert.ok(htmlObj.includes('Variacion 1'));
});

