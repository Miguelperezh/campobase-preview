import {
  EJERCICIOS_VALIDADOS as EJERCICIOS_VALIDADOS_BASE,
  toCampoBaseExercise as toCampoBaseExerciseBase,
  findValidatedExercise as findValidatedExerciseBase,
} from './ejercicios-validados-base.js';
import { EJERCICIOS_NUEVO_FORMATO, NUEVOS_EJERCICIOS_IDS } from './ejercicios-nuevo-formato.js';
import { EJERCICIOS_NUEVOS_LOTES, NUEVOS_LOTES_IDS } from './ejercicios-nuevos-lotes.js';
import { normalizeFormatoJuego } from './training-domain.js';

const NUEVOS_IDS = new Set(NUEVOS_EJERCICIOS_IDS);
const NUEVOS_LOTES_SET = new Set(NUEVOS_LOTES_IDS);

export const EJERCICIOS_VALIDADOS = Object.freeze([
  ...EJERCICIOS_NUEVOS_LOTES,
  ...EJERCICIOS_NUEVO_FORMATO,
  ...EJERCICIOS_VALIDADOS_BASE,
]);

export function findValidatedExercise(id) {
  return EJERCICIOS_NUEVOS_LOTES.find((item) => item.id === id)
    || EJERCICIOS_NUEVO_FORMATO.find((item) => item.id === id)
    || findValidatedExerciseBase(id);
}

function humanVideoUrl(item) {
  const explicit = String(
    item?.video_muestra_humanos
    || item?.video_muestra_url
    || item?.video_humano
    || item?.video_humanos
    || ''
  ).trim();
  if (explicit) return explicit;

  // Compatibilidad legacy: un vídeo superior solo es humano si no es el mismo
  // MP4 gráfico que ya figura en media.video/media.mp4.
  const topLevel = String(item?.video || '').trim();
  const graphic = String(
    item?.media?.video
    || item?.media?.mp4
    || item?.media?.mp4_url
    || ''
  ).trim();
  return topLevel && topLevel !== graphic ? topLevel : '';
}

export function toCampoBaseExercise(item) {
  const exercise = toCampoBaseExerciseBase(item);
  const videoMuestra = humanVideoUrl(item);
  const rawFormato = item?.formato_juego || exercise.formato_juego || 'todos';
  const formato_juego = normalizeFormatoJuego(rawFormato);
  const mapped = {
    ...exercise,
    // `video` del formato interno sigue siendo la animación/MP4 gráfico para no romper nada.
    // El vídeo humano queda separado y es el que usa el filtro «Solo con vídeo».
    formato_juego,
    formatos_juego: Array.isArray(item?.formatos_juego) && item.formatos_juego.length
      ? item.formatos_juego
      : (Array.isArray(exercise.formatos_juego) && exercise.formatos_juego.length
          ? exercise.formatos_juego
          : (formato_juego === 'futbol_7' ? ['futbol_7'] : ['futbol_7', 'futbol_11'])),
    format: item?.format || exercise.format || (formato_juego === 'futbol_7' ? 'F7' : 'F11'),
    preview: item?.media?.preview || item?.preview || exercise.preview || '',
    video_muestra: videoMuestra,
    hasHumanVideo: Boolean(videoMuestra),
  };

  if (NUEVOS_IDS.has(item?.id) || NUEVOS_LOTES_SET.has(item?.id)) {
    mapped.nuevoFormato = true;
  }

  return mapped;
}