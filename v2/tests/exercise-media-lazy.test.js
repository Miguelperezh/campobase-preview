import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { EJERCICIOS_VALIDADOS } from '../js/ejercicios-validados.js';

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

function mp4Path(item) {
  const media = item.media || {};
  if (media.video || media.mp4) return media.video || media.mp4;
  const anim = item.animacion || {};
  return anim.mp4 || String(anim.gif || '').replace(/\.gif$/i, '.mp4');
}

test('las demostraciones validadas no anuncian MP4 inexistentes', async () => {
  const missing = [];
  const intentionallyUnavailable = new Set([
    'CAMPOBASE-VIDEO-CONDUCCION-FRENADA-PLANTA-SPRINT-IDA-VUELTA-RECUPERACION',
  ]);
  for (const item of EJERCICIOS_VALIDADOS) {
    const path = mp4Path(item);
    if (!path) {
      if (!intentionallyUnavailable.has(item.id)) missing.push(`${item.id}: sin ruta MP4`);
      continue;
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      continue;
    }
    try {
      await access(fileURLToPath(new URL(`../${path}`, import.meta.url)));
    } catch {
      missing.push(`${item.id}: ${path}`);
    }
  }
  assert.deepEqual(missing, [], `Faltan MP4 inesperadamente para:\n${missing.join('\n')}`);
});

test('las demostraciones de Ejercicios no reciben src ni preload auto al construir la biblioteca', async () => {
  const viewer = await projectFile('js/ejercicio-viewer.js');
  assert.match(viewer, /data-src="\$\{esc\(videoSrc\)\}"/);
  assert.match(viewer, /preload="none"/);
  assert.match(viewer, /function ensureVideoLoaded\(video, placeholder, previewOnly = false\)/);
  assert.match(viewer, /if \(!video\.getAttribute\('src'\)\) video\.src = src;/);
  assert.doesNotMatch(viewer, /class="frame-video"\s+src=/);
});

test('los visores pesados de Ejercicios se inicializan solo cerca del viewport y limpian fichas retiradas', async () => {
  const viewer = await projectFile('js/ejercicio-viewer.js');
  assert.match(viewer, /IntersectionObserver/);
  assert.match(viewer, /rootMargin: '350px 0px'/);
  assert.match(viewer, /activateValidatedExerciseViewer/);
  assert.match(viewer, /content-visibility:auto/);
  assert.match(viewer, /contain-intrinsic-size:auto 900px/);
  assert.match(viewer, /data-lazy-detail="1"/);
  assert.match(viewer, /const viewerTargets = new Set\(\)/);
  assert.match(viewer, /pruneDisconnectedViewerTargets/);
  assert.match(viewer, /viewerObserver\.unobserve\(target\)/);
  assert.doesNotMatch(viewer, /video-poster/);
  assert.doesNotMatch(viewer, /f00[01]\.jpg/);
});

test('los vídeos subidos a Supabase también usan data-src y preload none', async () => {
  const videos = await projectFile('js/ejercicio-videos.js');
  assert.match(videos, /<video controls preload="none" playsinline data-src=/);
  assert.match(videos, /IntersectionObserver/);
  assert.match(videos, /rootMargin: '300px 0px'/);
  assert.doesNotMatch(videos, /<video controls preload="metadata" playsinline src=/);
});

test('las tácticas interactivas tampoco precargan el MP4', async () => {
  const tactics = await projectFile('js/tactica-viewer.js');
  assert.match(tactics, /class="frame-video" data-src=/);
  assert.match(tactics, /preload="none"/);
  assert.match(tactics, /IntersectionObserver/);
  assert.doesNotMatch(tactics, /class="frame-video" src=/);
  assert.doesNotMatch(tactics, /preload="auto"><\/video>/);
});
