import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EJERCICIOS_VALIDADOS } from '../js/ejercicios-validados.js';
import { renderValidatedExerciseHTML } from '../js/ejercicio-viewer.js';
import {
  VIDEO_MAX_BYTES,
  buildVideoRecord,
  sortVideos,
  videoPath,
  videoPublicUrl,
  resolveHostedVideoUrl,
  renderVideoSectionHTML,
} from '../js/ejercicio-videos.js';

test('construye un registro de vídeo válido con su metadata', () => {
  const record = buildVideoRecord(
    { exerciseId: 'EX-1', nombre: 'Demo.mp4', path: 'EX-1/v1.mp4', mime: 'video/mp4', size: 1000, orden: 0 },
    { id: 'v1', createdAt: 1, now: 2 },
  );
  assert.equal(record.recordType, 'exerciseVideo');
  assert.equal(record.exerciseId, 'EX-1');
  assert.equal(record.nombre, 'Demo.mp4');
  assert.equal(record.path, 'EX-1/v1.mp4');
  assert.equal(record.size, 1000);
});

test('rechaza vídeos sin ejercicio, sin ruta, que no son vídeo o demasiado grandes', () => {
  assert.throws(() => buildVideoRecord({ exerciseId: '', path: 'x.mp4', mime: 'video/mp4', size: 1 }, { id: 'v' }), /ejercicio/i);
  assert.throws(() => buildVideoRecord({ exerciseId: 'E', path: '', mime: 'video/mp4', size: 1 }, { id: 'v' }), /ruta/i);
  assert.throws(() => buildVideoRecord({ exerciseId: 'E', path: 'x.mp4', mime: 'image/png', size: 1 }, { id: 'v' }), /vídeo/i);
  assert.throws(() => buildVideoRecord({ exerciseId: 'E', path: 'x.mp4', mime: 'video/mp4', size: VIDEO_MAX_BYTES + 1 }, { id: 'v' }), /50 MB/i);
});

test('ordena los vídeos por orden y, a igual orden, por fecha de creación', () => {
  const videos = [
    { id: 'b', orden: 1, createdAt: 2 },
    { id: 'a', orden: 0, createdAt: 1 },
    { id: 'c', orden: 0, createdAt: 3 },
  ];
  assert.deepEqual(sortVideos(videos).map((v) => v.id), ['a', 'c', 'b']);
});

test('genera la ruta y la URL pública del vídeo', () => {
  assert.equal(videoPath('EX-1', 'v1', 'mp4'), 'EX-1/v1.mp4');
  assert.equal(
    videoPublicUrl('EX-1/v1.mp4'),
    'https://mdzpygfwugawlmknywxa.supabase.co/storage/v1/object/public/ejercicio-videos/EX-1/v1.mp4',
  );
});

test('resuelve los MP4 históricos de Supabase hacia GitHub Releases sin tocar otras URLs', () => {
  assert.equal(
    resolveHostedVideoUrl('https://mdzpygfwugawlmknywxa.supabase.co/storage/v1/object/public/ejercicio-videos/library-v2-preview/pdf150-022/ejercicio.mp4'),
    'https://github.com/Miguelperezh/campobase/releases/download/campobase-videos-v1/library-v2-preview__pdf150-022__ejercicio.mp4',
  );
  assert.equal(
    resolveHostedVideoUrl('https://example.test/video.mp4'),
    'https://example.test/video.mp4',
  );
  assert.equal(
    resolveHostedVideoUrl('https://mdzpygfwugawlmknywxa.supabase.co/storage/v1/object/public/ejercicio-videos/library-v2-preview/pdf150-022/preview.png'),
    'https://mdzpygfwugawlmknywxa.supabase.co/storage/v1/object/public/ejercicio-videos/library-v2-preview/pdf150-022/preview.png',
  );
});

test('en móvil todos los MP4 usan su variante compatible y escritorio conserva el original', () => {
  const f126 = 'https://github.com/Miguelperezh/campobase/releases/download/campobase-videos-v1/library-v2-preview__f7-126__ejercicio.mp4';
  const f127 = 'https://github.com/Miguelperezh/campobase/releases/download/campobase-videos-v1/library-v2-preview__f7-127__ejercicio.mp4';

  assert.equal(
    resolveHostedVideoUrl(f126, { mobile: true }),
    'https://github.com/Miguelperezh/campobase/releases/download/campobase-videos-v1/library-v2-preview__f7-126__ejercicio-mobile.mp4',
  );
  assert.equal(
    resolveHostedVideoUrl(f127, { mobile: true }),
    'https://github.com/Miguelperezh/campobase/releases/download/campobase-videos-v1/library-v2-preview__f7-127__ejercicio-mobile.mp4',
  );
  assert.equal(resolveHostedVideoUrl(f126, { mobile: false }), f126);
});
test('la sección de vídeos muestra reproductor y solo Migue puede subir o borrar', () => {
  const videos = [{ id: 'v1', nombre: 'Demo', path: 'EX-1/v1.mp4', orden: 0, createdAt: 1 }];
  const owner = renderVideoSectionHTML(videos, { role: 'owner', exerciseId: 'EX-1' });
  assert.match(owner, /<video/);
  assert.match(owner, /video-file-input/);
  assert.match(owner, /delete-video/);
  const delegate = renderVideoSectionHTML(videos, { role: 'delegate', exerciseId: 'EX-1' });
  assert.match(delegate, /<video/);
  assert.doesNotMatch(delegate, /video-file-input/);
  assert.doesNotMatch(delegate, /delete-video/);
});

test('sin vídeos y sin permiso de Migue no se pinta la sección', () => {
  assert.equal(renderVideoSectionHTML([], { role: 'delegate', exerciseId: 'EX-1' }), '');
  assert.match(renderVideoSectionHTML([], { role: 'owner', exerciseId: 'EX-1' }), /Sin vídeos todavía/);
});


test('todas las referencias que se transforman apuntan a assets existentes y el manifiesto completo es resoluble', () => {
  const manifest = JSON.parse(readFileSync(new URL('../scripts/github-release-video-manifest.json', import.meta.url), 'utf8'));
  const knownPaths = new Set(manifest.map(({ name }) => name));
  const migratedRefs = new Set();

  const visit = (value) => {
    if (typeof value === 'string') {
      if (value.includes('/storage/v1/object/public/ejercicio-videos/') && /\.mp4(?:$|[?#])/i.test(value)) {
        const marker = '/storage/v1/object/public/ejercicio-videos/';
        const raw = value.slice(value.indexOf(marker) + marker.length).split(/[?#]/, 1)[0];
        const path = raw.split('/').map((segment) => decodeURIComponent(segment)).join('/');
        const resolved = resolveHostedVideoUrl(value);
        if (resolved !== value) {
          migratedRefs.add(path);
          assert.ok(knownPaths.has(path), `Referencia transformada sin asset: ${path}`);
          assert.match(resolved, /\/releases\/download\/campobase-videos-v1\//);
        }
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };

  EJERCICIOS_VALIDADOS.forEach(visit);
  assert.ok(migratedRefs.size > 0, 'Debe encontrar referencias migradas en la biblioteca');

  for (const { name } of manifest) {
    const synthetic = `https://mdzpygfwugawlmknywxa.supabase.co/storage/v1/object/public/ejercicio-videos/${name}`;
    const resolved = resolveHostedVideoUrl(synthetic);
    assert.notEqual(resolved, synthetic, `El manifiesto no es resoluble: ${name}`);
    assert.match(resolved, /\/releases\/download\/campobase-videos-v1\//);
  }
});


test('el visor renderiza los MP4 migrados desde GitHub Releases y no desde Supabase', () => {
  const html = renderValidatedExerciseHTML({
    id: 'pdf150-022',
    nombre: 'Prueba',
    categoria: 'Coordinación',
    media: {
      video: 'https://mdzpygfwugawlmknywxa.supabase.co/storage/v1/object/public/ejercicio-videos/library-v2-preview/pdf150-022/ejercicio.mp4',
    },
    datos_rapidos: {},
  });
  assert.match(
    html,
    /github\.com\/Miguelperezh\/campobase\/releases\/download\/campobase-videos-v1\/library-v2-preview__pdf150-022__ejercicio\.mp4/,
  );
  assert.doesNotMatch(
    html,
    /storage\/v1\/object\/public\/ejercicio-videos\/library-v2-preview\/pdf150-022\/ejercicio\.mp4/,
  );
});


test('todos los MP4 migrados usan variante móvil y escritorio conserva el asset original', () => {
  const f126 = 'https://mdzpygfwugawlmknywxa.supabase.co/storage/v1/object/public/ejercicio-videos/library-v2-preview/f7-126/ejercicio.mp4';
  const f127 = 'https://mdzpygfwugawlmknywxa.supabase.co/storage/v1/object/public/ejercicio-videos/library-v2-preview/f7-127/ejercicio.mp4';

  assert.equal(
    resolveHostedVideoUrl(f126, { mobile: true }),
    'https://github.com/Miguelperezh/campobase/releases/download/campobase-videos-v1/library-v2-preview__f7-126__ejercicio-mobile.mp4',
  );
  assert.equal(
    resolveHostedVideoUrl(f127, { mobile: true }),
    'https://github.com/Miguelperezh/campobase/releases/download/campobase-videos-v1/library-v2-preview__f7-127__ejercicio-mobile.mp4',
  );
  assert.equal(
    resolveHostedVideoUrl(f126, { mobile: false }),
    'https://github.com/Miguelperezh/campobase/releases/download/campobase-videos-v1/library-v2-preview__f7-126__ejercicio.mp4',
  );
});
