import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterExercises } from '../js/training-domain.js';
import { EJERCICIOS_VALIDADOS, toCampoBaseExercise } from '../js/ejercicios-validados.js';
import { EJERCICIOS_NUEVO_FORMATO, EJERCICIOS_NUEVO_FORMATO_ANTERIORES, NUEVOS_EJERCICIOS_IDS } from '../js/ejercicios-nuevo-formato.js';
import { renderExerciseGridCard, renderValidatedExerciseHTML } from '../js/ejercicio-viewer.js';

test('Solo con vídeo considera el vídeo humano y no el MP4 gráfico principal', () => {
  const pool = [
    {
      id: 'solo-grafico',
      name: 'Solo animación',
      category: 'Finalización',
      formato_juego: 'futbol_11',
      video: 'https://example.test/ejercicio.mp4',
      hasHumanVideo: false,
    },
    {
      id: 'con-humano',
      name: 'Con vídeo humano',
      category: 'Finalización',
      formato_juego: 'futbol_11',
      video: 'https://example.test/ejercicio.mp4',
      video_muestra: 'https://example.test/video-muestra.mp4',
      hasHumanVideo: true,
    },
  ];

  const filtered = filterExercises(pool, { video: true });
  assert.deepEqual(filtered.map(({ id }) => id), ['con-humano']);
});

test('el mapeo conserva separados el MP4 gráfico y el vídeo humano', () => {
  const source = {
    id: 'test-separacion-video',
    nombre: 'Prueba separación de vídeos',
    categoria: 'Finalización',
    formato_juego: 'Fútbol 11',
    datos_rapidos: {},
    media: { video: 'https://example.test/ejercicio.mp4' },
    video: 'https://example.test/humanos.mp4',
  };

  const mapped = toCampoBaseExercise(source);
  assert.equal(mapped.video, 'https://example.test/ejercicio.mp4');
  assert.equal(mapped.video_muestra, 'https://example.test/humanos.mp4');
  assert.equal(mapped.hasHumanVideo, true);
});

test('un MP4 gráfico repetido en video no se considera vídeo humano', () => {
  const source = {
    id: 'test-solo-grafico',
    nombre: 'Solo gráfico',
    categoria: 'Finalización',
    formato_juego: 'Fútbol 11',
    datos_rapidos: {},
    media: { video: 'https://example.test/ejercicio.mp4' },
    video: 'https://example.test/ejercicio.mp4',
  };

  const mapped = toCampoBaseExercise(source);
  assert.equal(mapped.video, 'https://example.test/ejercicio.mp4');
  assert.equal(mapped.video_muestra, '');
  assert.equal(mapped.hasHumanVideo, false);
});

test('los 12 actuales separan preview, MP4 gráfico y vídeo humano sin mezclar F7/F11', () => {
  assert.equal(EJERCICIOS_NUEVO_FORMATO.length, 12);
  for (const exercise of EJERCICIOS_NUEVO_FORMATO) {
    const category = String(exercise.categoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const tagKeys = (exercise.etiquetas || []).map((tag) => String(tag).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
    assert.equal(tagKeys.includes(category), false, `${exercise.id}: categoría repetida en etiquetas`);
    assert.equal(String(exercise.datos_rapidos?.jugadores || '').includes('/'), false, `${exercise.id}: jugadores mezclados F7/F11`);
    assert.equal(String(exercise.datos_rapidos?.duracion || '').includes('/'), false, `${exercise.id}: duración mezclada F7/F11`);

    if (exercise.media?.preview) {
      assert.match(exercise.media.preview, /\/ejercicio-videos\//, `${exercise.id}: preview publicada debe usar el bucket ejercicio-videos`);
      assert.doesNotMatch(exercise.media.preview, /\/ejercicio-previews\//, `${exercise.id}: no debe usar el bucket inexistente`);
    } else {
      assert.ok(exercise.preview_video, `${exercise.id}: si preview.png no está publicada debe existir fallback desde el MP4 gráfico`);
      assert.equal(exercise.preview_video, exercise.media?.video, `${exercise.id}: la preview temporal debe salir del MP4 gráfico, no del vídeo humano`);
    }

    assert.ok(exercise._video_ejercicio_original, `${exercise.id}: debe conservarse la ruta original del MP4 gráfico`);
    assert.equal(exercise.media?.video, exercise._video_ejercicio_original, `${exercise.id}: el reproductor principal debe ser el MP4 gráfico`);
    assert.ok(exercise.video_muestra_humanos, `${exercise.id}: falta vídeo humano de muestra`);
    assert.notEqual(exercise.media?.video, exercise.video_muestra_humanos, `${exercise.id}: MP4 gráfico y vídeo humano deben permanecer separados`);
  }
});

test('los 12 actuales normalizan el vídeo humano pesado a GitHub Releases y conservan crop de portada', () => {
  for (const exercise of EJERCICIOS_NUEVO_FORMATO) {
    assert.match(
      exercise.video_muestra_humanos,
      /^https:\/\/github\.com\/Miguelperezh\/campobase\/releases\/download\/campobase-videos-v1\//,
      `${exercise.id}: el vídeo humano debe salir de GitHub Releases`,
    );
    assert.doesNotMatch(
      exercise.video_muestra_humanos,
      /supabase\.co\/storage/,
      `${exercise.id}: el vídeo humano normalizado no debe depender de Supabase Storage`,
    );
    assert.ok(exercise.preview_crop, `${exercise.id}: falta preview_crop`);
    assert.ok(Number(exercise.preview_crop.width) > 0, `${exercise.id}: crop sin ancho`);
    assert.ok(Number(exercise.preview_crop.height) > 0, `${exercise.id}: crop sin alto`);
  }
});

test('las portadas de los 12 actuales usan preview estática recortada y la ficha mantiene el orden preview -> gráfico -> humano', () => {
  for (const exercise of EJERCICIOS_NUEVO_FORMATO) {
    const card = renderExerciseGridCard(exercise);
    assert.match(card, /card-preview-static-canvas|data-preview-image="1"/, `${exercise.id}: falta portada estática`);
    assert.match(card, /data-preview-crop="[^"]+"/, `${exercise.id}: la portada no lleva crop`);

    const detail = renderValidatedExerciseHTML(exercise);
    const previewPos = detail.indexOf('data-media-order="1"');
    const graphicPos = detail.indexOf('exercise-video-wrap');
    const humanPos = detail.indexOf('exercise-media-human');
    assert.ok(previewPos >= 0, `${exercise.id}: falta preview dentro de la ficha`);
    assert.ok(graphicPos > previewPos, `${exercise.id}: el MP4 gráfico debe ir después de la preview`);
    assert.ok(humanPos > graphicPos, `${exercise.id}: el vídeo humano debe ir después del MP4 gráfico`);
    assert.match(detail, /data-preview-crop="[^"]+"/, `${exercise.id}: la preview interna no lleva crop`);
  }
});

test('los 12 actuales anuncian vídeo humano de muestra separado del MP4 gráfico', () => {
  const mapped = EJERCICIOS_NUEVO_FORMATO.map(toCampoBaseExercise);
  const humanIds = filterExercises(mapped, { video: true }).map((item) => item.id);
  assert.equal(humanIds.length, 12);
  assert.deepEqual(humanIds, NUEVOS_EJERCICIOS_IDS);
});

test('el filtro real devuelve exactamente ejercicios con vídeo humano y mantiene los 12 actuales arriba cuando correspondan', () => {
  const mapped = EJERCICIOS_VALIDADOS.map(toCampoBaseExercise);
  const expectedIds = mapped.filter((item) => item.hasHumanVideo).map((item) => item.id);
  const filtered = filterExercises(mapped, { video: true });
  assert.deepEqual(filtered.map((item) => item.id), expectedIds);

  const legacyOnlyGraphic = mapped.find((item) => !NUEVOS_EJERCICIOS_IDS.includes(item.id) && item.video && !item.hasHumanVideo);
  assert.ok(legacyOnlyGraphic, 'Debe existir al menos un ejercicio histórico con MP4 gráfico pero sin vídeo humano');
  assert.equal(filtered.some((item) => item.id === legacyOnlyGraphic.id), false, 'Solo con vídeo no debe incluir MP4 gráficos sin vídeo humano');

  const f7 = filterExercises(mapped, { formato_juego: 'futbol_7' });
  const f11 = filterExercises(mapped, { formato_juego: 'futbol_11' });
  const expectedF7New = mapped.slice(0, 12).filter((item) => item.formato_juego === 'futbol_7').map((item) => item.id);
  const expectedF11New = mapped.slice(0, 12).filter((item) => item.formato_juego === 'futbol_11').map((item) => item.id);
  assert.deepEqual(f7.slice(0, expectedF7New.length).map((item) => item.id), expectedF7New);
  assert.deepEqual(f11.slice(0, expectedF11New.length).map((item) => item.id), expectedF11New);
});


test('las 4 versiones anteriores permanecen aisladas del catálogo activo', () => {
  assert.equal(EJERCICIOS_NUEVO_FORMATO_ANTERIORES.length, 4);
  const active = new Set(NUEVOS_EJERCICIOS_IDS);
  for (const previous of EJERCICIOS_NUEVO_FORMATO_ANTERIORES) {
    assert.equal(active.has(previous.id), false, previous.id);
  }
});

test('Solo con vídeo no confunde un MP4 gráfico persistido de un ejercicio validado con vídeo humano', () => {
  const pool = [
    {
      id: 'validado-antiguo-solo-grafico',
      name: 'Validado antiguo',
      category: 'Finalización',
      formato_juego: 'futbol_11',
      validated: true,
      source: 'validado',
      video: 'https://example.test/ejercicio.mp4',
    },
    {
      id: 'personal-antiguo-con-video',
      name: 'Personal con vídeo',
      category: 'Finalización',
      formato_juego: 'futbol_11',
      source: 'personal',
      video: 'https://example.test/video-humano.mp4',
    },
    {
      id: 'validado-con-humano-explicito',
      name: 'Validado con muestra',
      category: 'Finalización',
      formato_juego: 'futbol_11',
      validated: true,
      source: 'validado',
      video: 'https://example.test/ejercicio.mp4',
      video_muestra: 'https://example.test/video-muestra.mp4',
    },
  ];

  const filtered = filterExercises(pool, { video: true });
  assert.deepEqual(filtered.map(({ id }) => id), [
    'personal-antiguo-con-video',
    'validado-con-humano-explicito',
  ]);
});

test('la tarjeta nunca pinta el bucket inexistente de previews y limpia categoría, jugadores y duración', () => {
  const card = renderExerciseGridCard({
    id: 'nuevo-prueba-visual',
    _nuevo_formato: true,
    nombre: 'Prueba visual',
    categoria: 'Finalización',
    etiquetas: ['Finalización', 'Tiro'],
    datos_rapidos: {
      jugadores: '15 / 16-22 jugadores',
      duracion: '8-10 min. / 10-12 min.',
      material: 'Balones',
    },
    media: {
      preview: 'https://example.test/storage/v1/object/public/ejercicio-previews/nuevo/preview.png',
    },
    video: 'https://example.test/video-humano.mp4',
  });

  assert.doesNotMatch(card, /ejercicio-previews/);
  assert.doesNotMatch(card, /card-preview-video/);
  assert.match(card, /card-thumb-placeholder/);
  assert.equal((card.match(/<span class="pill">Finalización<\/span>/g) || []).length, 1);
  assert.match(card, /15-22 jugadores/);
  assert.doesNotMatch(card, /card-duration-badge/);
  assert.doesNotMatch(card, /8-12 min aprox\./);
});


test('la biblioteca principal incluye los vídeos humanos persistidos sin convertir los MP4 gráficos en vídeo humano', () => {
  const source = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  assert.match(source, /humanVideoExerciseIds/);
  assert.match(source, /state\.videos\.map/);
  assert.match(source, /hasHumanVideo: true/);
  assert.match(source, /filterExercises\(filterableExercises, filters\)/);
});

test('el planificador de sesiones usa solo vídeo humano y respeta ejercicios F7 y F11', () => {
  const source = readFileSync(new URL('../js/session-planner-ui.js', import.meta.url), 'utf8');
  assert.match(source, /function hasHumanVideo\(item\)/);
  assert.match(source, /if \(onlyVideo && !hasHumanVideo\(item\)\) return false;/);
  assert.doesNotMatch(source, /onlyVideo[^\n]+animationVideo/);
  assert.match(source, /function matchesFormat\(item, target = formatVal\)/);
  assert.match(source, /item\.formato_juego === 'todos'/);
  assert.match(source, /item\.formatos_juego\.includes\(target\)/);
});
