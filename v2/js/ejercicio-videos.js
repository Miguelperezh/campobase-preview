// Vídeos de ejercicios en CampoBase.
// Los MP4 pesados de producción se sirven desde GitHub Releases
// (tag `campobase-videos-v1`). Supabase conserva datos/metadata sincronizada y
// copias históricas de rollback, pero no es el destino vigente de nuevos MP4.
//
// `resolveHostedVideoUrl()` transforma referencias históricas válidas del bucket
// `ejercicio-videos` al asset equivalente de GitHub Releases. Los MP4 gráficos
// ligeros que forman parte del código pueden seguir cargando desde `assets/ejercicios`.
// Así los vídeos son visibles desde cualquier dispositivo sin guardarlos en IndexedDB.

import { SUPABASE_URL, VIDEO_BUCKET } from './supabase-client.js';

// Límite global de Supabase en el plan Free: 50 MB por archivo.
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export const GITHUB_VIDEO_RELEASE_TAG = 'campobase-videos-v1';
export const GITHUB_VIDEO_RELEASE_BASE = `https://github.com/Miguelperezh/campobase/releases/download/${GITHUB_VIDEO_RELEASE_TAG}`;

function isMobileVideoEnvironment() {
  if (typeof navigator === 'undefined') return false;
  if (navigator.userAgentData?.mobile === true) return true;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(String(navigator.userAgent || ''));
}

function releaseUrlForAsset(asset) {
  return `${GITHUB_VIDEO_RELEASE_BASE}/${encodeURIComponent(asset)}`;
}

function mobileReleaseAsset(asset) {
  const name = String(asset || '');
  if (!/\.mp4$/i.test(name) || /-mobile\.mp4$/i.test(name)) return name;
  return name.replace(/\.mp4$/i, '-mobile.mp4');
}

// El Release contiene una pareja móvil para cada uno de los 423 MP4 originales.
// En móvil usamos la variante H.264 compatible; en escritorio conservamos el original.
export function resolveHostedVideoUrl(value, { mobile = isMobileVideoEnvironment() } = {}) {
  const source = String(value ?? '').trim();
  if (!source) return '';

  const cleanSource = source.split(/[?#]/, 1)[0];
  const releasePrefix = `${GITHUB_VIDEO_RELEASE_BASE}/`;
  if (cleanSource.startsWith(releasePrefix)) {
    const rawAsset = cleanSource.slice(releasePrefix.length);
    let asset;
    try {
      asset = decodeURIComponent(rawAsset);
    } catch {
      asset = rawAsset;
    }
    if (!/\.mp4$/i.test(asset)) return source;
    return mobile ? releaseUrlForAsset(mobileReleaseAsset(asset)) : source;
  }

  const marker = `/storage/v1/object/public/${VIDEO_BUCKET}/`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return source;

  const rawPath = source.slice(markerIndex + marker.length).split(/[?#]/, 1)[0];
  let path;
  try {
    path = rawPath.split('/').map((segment) => decodeURIComponent(segment)).join('/');
  } catch {
    path = rawPath;
  }
  if (!/\.mp4$/i.test(path)) return source;

  const isLibraryV2 = path.startsWith('library-v2-preview/');
  const isCampoBaseHuman = path.startsWith('CAMPOBASE-VIDEO-') && /\/video\.mp4$/i.test(path);
  if (!isLibraryV2 && !isCampoBaseHuman) return source;

  const originalAsset = path.replaceAll('/', '__');
  return releaseUrlForAsset(mobile ? mobileReleaseAsset(originalAsset) : originalAsset);
}

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

// Ruta del archivo dentro del bucket: <exerciseId>/<videoId>.<ext>.
export function videoPath(exerciseId, videoId, extension) {
  const safeExercise = String(exerciseId ?? '').replace(/[^a-zA-Z0-9_-]/g, '');
  const safeVideo = String(videoId ?? '').replace(/[^a-zA-Z0-9_-]/g, '');
  const safeExt = String(extension ?? 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
  if (!safeExercise || !safeVideo) throw new TypeError('El vídeo necesita un ejercicio y un identificador válidos.');
  return `${safeExercise}/${safeVideo}.${safeExt}`;
}

// URL pública del flujo manual legacy. No usar esta función para los MP4 del
// catálogo validado: esos se resuelven mediante resolveHostedVideoUrl() hacia
// GitHub Releases. Se mantiene para no romper «Añadir vídeo» hasta migrar su
// subida a un backend autenticado.
export function videoPublicUrl(path) {
  const segments = String(path ?? '').split('/').map((segment) => encodeURIComponent(segment)).join('/');
  return `${SUPABASE_URL}/storage/v1/object/public/${VIDEO_BUCKET}/${segments}`;
}

// Construye y valida el registro de metadata de un vídeo.
export function buildVideoRecord(values, metadata = {}) {
  const exerciseId = String(values.exerciseId ?? '').trim();
  if (!exerciseId) throw new TypeError('El vídeo debe estar vinculado a un ejercicio.');
  const path = String(values.path ?? '').trim();
  if (!path) throw new TypeError('El vídeo necesita una ruta de almacenamiento.');
  const mime = String(values.mime ?? '');
  if (!/^video\//.test(mime)) throw new TypeError('El archivo debe ser un vídeo.');
  const size = Number(values.size);
  if (!Number.isFinite(size) || size <= 0) throw new TypeError('El tamaño del vídeo no es válido.');
  if (size > VIDEO_MAX_BYTES) throw new RangeError('El vídeo supera el límite de 50 MB.');
  return {
    id: metadata.id,
    recordType: 'exerciseVideo',
    exerciseId,
    nombre: String(values.nombre ?? '').trim() || 'Vídeo',
    path,
    mime,
    size,
    orden: Number.isFinite(Number(values.orden)) ? Number(values.orden) : 0,
    createdAt: metadata.createdAt,
    updatedAt: metadata.now,
  };
}

export function sortVideos(videos) {
  if (!Array.isArray(videos)) throw new TypeError('Los vídeos deben ser una lista.');
  return [...videos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0));
}

// HTML de la sección de vídeos de un ejercicio. Solo Migue (owner) puede subir o borrar.
// Importante: ningún vídeo recibe `src` al construir la biblioteca. La URL queda en
// `data-src` y se activa solo cuando el vídeo se aproxima a la pantalla o el usuario
// intenta reproducirlo.
export function renderVideoSectionHTML(videos = [], { role = null, exerciseId = '' } = {}) {
  const canManage = role === 'owner';
  const list = sortVideos(videos);
  if (!list.length && !canManage) return '';
  const items = list.map((video) => `
    <div class="video-item" data-video-id="${esc(video.id)}">
      <video controls preload="none" playsinline data-src="${esc(videoPublicUrl(video.path))}"></video>
      <div class="video-meta">
        <span class="video-name">${esc(video.nombre)}</span>
        ${canManage ? `<button type="button" class="delete-video danger compact" data-video-id="${esc(video.id)}" aria-label="Borrar vídeo">Borrar</button>` : ''}
      </div>
    </div>`).join('');
  const upload = canManage
    ? `<label class="button secondary compact video-upload">Añadir vídeo<input type="file" accept="video/*" class="video-file-input" data-exercise-id="${esc(exerciseId)}" hidden></label>`
    : '';
  return `
    <div class="videos" data-exercise-id="${esc(exerciseId)}">
      <h3>Vídeos</h3>
      ${items || '<p class="meta">Sin vídeos todavía.</p>'}
      ${upload}
    </div>`;
}

function activateVideo(video, preload = 'metadata') {
  if (!video?.dataset.src) return false;
  if (!video.getAttribute('src')) {
    video.src = video.dataset.src;
    video.preload = preload;
    video.load();
  } else if (preload === 'auto') {
    video.preload = 'auto';
  }
  return true;
}

function initLazyVideo(video) {
  if (!video || video.dataset._lazyVideoInit) return;
  video.dataset._lazyVideoInit = '1';

  // Si el usuario interactúa antes de que el observer lo acerque al viewport,
  // damos prioridad a la reproducción y activamos la carga completa.
  video.addEventListener('play', () => activateVideo(video, 'auto'));
  video.addEventListener('pointerdown', () => activateVideo(video, 'auto'), { once: true });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      activateVideo(video, 'metadata');
    }, { rootMargin: '300px 0px' });
    observer.observe(video);
  }
}

// Conecta la subida y el borrado de la sección de vídeos de un contenedor.
export function initVideoSection(root, { onUpload, onDelete } = {}) {
  if (!root || root.dataset._videoInit) return;
  root.dataset._videoInit = '1';

  root.querySelectorAll('video[data-src]').forEach(initLazyVideo);

  const input = root.querySelector('.video-file-input');
  if (input) {
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      if (onUpload) await onUpload(input.dataset.exerciseId, file);
    });
  }
  root.querySelectorAll('.delete-video').forEach((button) => {
    button.addEventListener('click', async () => {
      if (onDelete) await onDelete(button.dataset.videoId);
    });
  });
}
