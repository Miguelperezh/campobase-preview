import e01 from './ejercicios-nuevo-formato/01-campobase-video-3-finalizaciones-centro-exterior-centro-lateral.js';
import e02 from './ejercicios-nuevo-formato/02-campobase-video-6-saltos-laterales-knee-drive-sprint-13-7m.js';
import e03 from './ejercicios-nuevo-formato/03-campobase-video-conduccion-dejar-balon-3-conos-vuelta-lateral-pase.js';
import e04 from './ejercicios-nuevo-formato/04-campobase-video-conduccion-frenada-planta-sprint-ida-vuelta-recuperacion.js';
import e05 from './ejercicios-nuevo-formato/05-campobase-video-desplazamiento-lateral-progresivo-pasillo.js';
import e06 from './ejercicios-nuevo-formato/06-campobase-video-duelos-3v2-finalizacion-robo-rotacion.js';
import e07 from './ejercicios-nuevo-formato/07-campobase-video-finalizacion-doble-2-balones-transicion-1v1-cambio-carril-v2.js';
import e08 from './ejercicios-nuevo-formato/08-campobase-pase-balon-espacio-2-conos-1v1-finalizacion-v2.js';
import e09 from './ejercicios-nuevo-formato/09-campobase-video-pies-rapidos-sprint-3-variaciones.js';
import e10 from './ejercicios-nuevo-formato/10-campobase-video-reaccion-giro-inicial-senales-laterales-cono-balon-v3.js';
import e11 from './ejercicios-nuevo-formato/11-campobase-video-reactive-knee-drive-skater-3-variaciones.js';
import e12 from './ejercicios-nuevo-formato/12-campobase-video-rodillas-altas-laterales-zigzag-cod-sprint.js';
import e13 from './ejercicios-nuevo-formato/13-campobase-video-conduccion-dejar-balon-3-conos-pase-v2.js';
import e14 from './ejercicios-nuevo-formato/14-campobase-video-finalizacion-doble-tiro-transicion-1v1-cambio-carril.js';
import e15 from './ejercicios-nuevo-formato/15-campobase-video-reaccion-espaldas-senales-lateral-giro-cono-balon-v2.js';
import e16 from './ejercicios-nuevo-formato/16-campobase-video-reaccion-lateral-senal-balon-cono.js';

// Los 12 primeros son las versiones actuales validadas.
const RAW_EJERCICIOS_NUEVO_FORMATO = [e01, e02, e03, e04, e05, e06, e07, e08, e09, e10, e11, e12];
const RAW_EJERCICIOS_NUEVO_FORMATO_ANTERIORES = [e13, e14, e15, e16];

function key(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es');
}

function uniqueStrings(values = []) {
  const seen = new Set();
  return values.filter((value) => {
    const clean = String(value || '').trim();
    const normalized = key(clean);
    if (!clean || !normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function summarizeNumericRange(value, suffix) {
  const source = String(value || '').trim();
  const numbers = [...source.matchAll(/\d+(?:[.,]\d+)?/g)]
    .map((match) => Number(match[0].replace(',', '.')))
    .filter(Number.isFinite);
  if (!numbers.length) return source;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const format = (number) => Number.isInteger(number) ? String(number) : String(number).replace('.', ',');
  return min === max ? `${format(min)} ${suffix}` : `${format(min)}-${format(max)} ${suffix}`;
}

const GRAPHIC_VIDEO_PATH_ALIAS = Object.freeze({
  'CAMPOBASE-VIDEO-3-FINALIZACIONES-CENTRO-EXTERIOR-CENTRO-LATERAL':
    'assets/ejercicios/CAMPOBASE-VIDEO-3-FINALIZACIONES-CENTRO-EXTERIOR-CENTRO-LATERAL/CampoBase_3_Finalizaciones_Centro_Exterior_Centro_Lateral_V1.mp4',
  'CAMPOBASE-VIDEO-6-SALTOS-LATERALES-KNEE-DRIVE-SPRINT-13-7M':
    'assets/ejercicios/CAMPOBASE-VIDEO-6-SALTOS-LATERALES-KNEE-DRIVE-SPRINT-13-7M/CampoBase_6_Saltos_Laterales_Knee_Drive_Sprint_13_7m_V4.mp4',
  'CAMPOBASE-VIDEO-CONDUCCION-DEJAR-BALON-3-CONOS-VUELTA-LATERAL-PASE':
    'assets/ejercicios/CAMPOBASE-VIDEO-CONDUCCION-DEJAR-BALON-3-CONOS-VUELTA-LATERAL-PASE/CampoBase_Conduccion_Dejar_Balon_3_Conos_Vuelta_Lateral_Pase_V1.mp4',
  'CAMPOBASE-VIDEO-CONDUCCION-FRENADA-PLANTA-SPRINT-IDA-VUELTA-RECUPERACION':
    'assets/ejercicios/CAMPOBASE-VIDEO-DEJA-BALON-GIRA-CONO-PASA-SIGUIENTE-COLA/CampoBase_Deja_Balon_Gira_Cono_Pasa_Siguiente_Cola_V3.mp4',
  'CAMPOBASE-VIDEO-DESPLAZAMIENTO-LATERAL-PROGRESIVO-PASILLO':
    'assets/ejercicios/CAMPOBASE-VIDEO-DESPLAZAMIENTO-LATERAL-PROGRESIVO-PASILLO/CampoBase_Desplazamiento_Lateral_Progresivo_Pasillo_Cambios_Apoyo_V1.mp4',
  'CAMPOBASE-VIDEO-DUELOS-3V2-FINALIZACION-ROBO-ROTACION':
    'assets/ejercicios/CAMPOBASE-VIDEO-DUELOS-3V2-FINALIZACION-ROBO-ROTACION/CampoBase_Duelos_3vs2_Finalizacion_Robo_Rotacion_V1.mp4',
  'CAMPOBASE-VIDEO-FINALIZACION-DOBLE-2-BALONES-TRANSICION-1V1-CAMBIO-CARRIL-V2':
    'assets/ejercicios/CAMPOBASE-VIDEO-FINALIZACION-DOBLE-2-BALONES-TRANSICION-1V1-CAMBIO-CARRIL-V2/CampoBase_Finalizacion_Doble_2_Balones_Transicion_1v1_Cambio_Carril_V2.mp4',
  'CAMPOBASE-PASE-BALON-ESPACIO-2-CONOS-1V1-FINALIZACION-V2':
    'assets/ejercicios/CAMPOBASE-VIDEO-PASE-BALON-ESPACIO-2-CONOS-1V1-FINALIZACION/CampoBase_Pase_Balon_Espacio_2_Conos_1v1_Finalizacion_V2.mp4',
  'CAMPOBASE-VIDEO-PIES-RAPIDOS-SPRINT-3-VARIACIONES':
    'assets/ejercicios/CAMPOBASE-VIDEO-PIES-RAPIDOS-SPRINT-3-VARIACIONES/CampoBase_Pies_Rapidos_Sprint_3_Variaciones_V1.mp4',
  'CAMPOBASE-VIDEO-REACCION-GIRO-INICIAL-SENALES-LATERALES-CONO-BALON-V3':
    'assets/ejercicios/CAMPOBASE-VIDEO-REACCION-GIRO-INICIAL-SENALES-LATERALES-CONO-BALON-V3/CampoBase_Reaccion_Giro_Inicial_Senales_Laterales_Cono_Balon_V3.mp4',
  'CAMPOBASE-VIDEO-REACTIVE-KNEE-DRIVE-SKATER-3-VARIACIONES':
    'assets/ejercicios/CAMPOBASE-VIDEO-REACTIVE-KNEE-DRIVE-SKATER-3-VARIACIONES/CampoBase_Reactive_Knee_Drive_Skater_3_Variaciones_V3.mp4',
  'CAMPOBASE-VIDEO-RODILLAS-ALTAS-LATERALES-ZIGZAG-COD-SPRINT':
    'assets/ejercicios/CAMPOBASE-VIDEO-RODILLAS-ALTAS-LATERALES-ZIGZAG-COD-SPRINT/CampoBase_Rodillas_Altas_Laterales_Zigzag_Cambios_Direccion_Sprint_V1.mp4',
});


const GRAPHIC_MEDIA_CROP = Object.freeze({
  'CAMPOBASE-VIDEO-3-FINALIZACIONES-CENTRO-EXTERIOR-CENTRO-LATERAL': { x: 52, y: 217, width: 812, height: 557, sourceWidth: 1280, sourceHeight: 820 },
  'CAMPOBASE-VIDEO-6-SALTOS-LATERALES-KNEE-DRIVE-SPRINT-13-7M': { x: 47, y: 217, width: 817, height: 557, sourceWidth: 1280, sourceHeight: 820 },
  'CAMPOBASE-VIDEO-CONDUCCION-DEJAR-BALON-3-CONOS-VUELTA-LATERAL-PASE': { x: 54, y: 219, width: 406, height: 553, sourceWidth: 1280, sourceHeight: 820 },
  'CAMPOBASE-VIDEO-CONDUCCION-FRENADA-PLANTA-SPRINT-IDA-VUELTA-RECUPERACION': { x: 47, y: 217, width: 821, height: 557, sourceWidth: 1280, sourceHeight: 820 },
  'CAMPOBASE-VIDEO-DESPLAZAMIENTO-LATERAL-PROGRESIVO-PASILLO': { x: 52, y: 217, width: 812, height: 557, sourceWidth: 1280, sourceHeight: 820 },
  'CAMPOBASE-VIDEO-DUELOS-3V2-FINALIZACION-ROBO-ROTACION': { x: 65, y: 230, width: 786, height: 437, sourceWidth: 1280, sourceHeight: 820 },
  'CAMPOBASE-VIDEO-FINALIZACION-DOBLE-2-BALONES-TRANSICION-1V1-CAMBIO-CARRIL-V2': { x: 56, y: 221, width: 804, height: 549, sourceWidth: 1280, sourceHeight: 820 },
  'CAMPOBASE-PASE-BALON-ESPACIO-2-CONOS-1V1-FINALIZACION-V2': { x: 55, y: 219, width: 815, height: 552, sourceWidth: 1280, sourceHeight: 820 },
  'CAMPOBASE-VIDEO-PIES-RAPIDOS-SPRINT-3-VARIACIONES': { x: 52, y: 217, width: 812, height: 557, sourceWidth: 1280, sourceHeight: 820 },
  'CAMPOBASE-VIDEO-REACCION-GIRO-INICIAL-SENALES-LATERALES-CONO-BALON-V3': { x: 47, y: 217, width: 817, height: 557, sourceWidth: 1280, sourceHeight: 820 },
  'CAMPOBASE-VIDEO-REACTIVE-KNEE-DRIVE-SKATER-3-VARIACIONES': { x: 54, y: 219, width: 808, height: 553, sourceWidth: 1280, sourceHeight: 820 },
  'CAMPOBASE-VIDEO-RODILLAS-ALTAS-LATERALES-ZIGZAG-COD-SPRINT': { x: 52, y: 217, width: 812, height: 557, sourceWidth: 1280, sourceHeight: 820 },
});

const HUMAN_VIDEO_PATH_ALIAS = Object.freeze({
  // Alias histórico para conservar compatibilidad con imports anteriores.
  'CAMPOBASE-VIDEO-CONDUCCION-FRENADA-PLANTA-SPRINT-IDA-VUELTA-RECUPERACION':
    'CAMPOBASE-VIDEO-DEJA-BALON-GIRA-CONO-PASA-SIGUIENTE-COLA/video.mp4',
});

const HUMAN_VIDEO_PUBLIC_BASE =
  'https://mdzpygfwugawlmknywxa.supabase.co/storage/v1/object/public/ejercicio-videos/';

const HUMAN_VIDEO_RELEASE_BASE =
  'https://github.com/Miguelperezh/campobase/releases/download/campobase-videos-v1';

const HUMAN_VIDEO_RELEASE_ASSET = Object.freeze({
  'CAMPOBASE-VIDEO-3-FINALIZACIONES-CENTRO-EXTERIOR-CENTRO-LATERAL':
    'CAMPOBASE-VIDEO-3-FINALIZACIONES-CENTRO-EXTERIOR-CENTRO-LATERAL__video.mp4',
  'CAMPOBASE-VIDEO-6-SALTOS-LATERALES-KNEE-DRIVE-SPRINT-13-7M':
    'CAMPOBASE-VIDEO-6-SALTOS-LATERALES-KNEE-DRIVE-SPRINT-13-7M__video.mp4',
  'CAMPOBASE-VIDEO-CONDUCCION-DEJAR-BALON-3-CONOS-VUELTA-LATERAL-PASE':
    'CAMPOBASE-VIDEO-CONDUCCION-DEJAR-BALON-3-CONOS-VUELTA-LATERAL-PASE__video.mp4',
  'CAMPOBASE-VIDEO-CONDUCCION-FRENADA-PLANTA-SPRINT-IDA-VUELTA-RECUPERACION':
    'CAMPOBASE-VIDEO-DEJA-BALON-GIRA-CONO-PASA-SIGUIENTE-COLA__video.mp4',
  'CAMPOBASE-VIDEO-DESPLAZAMIENTO-LATERAL-PROGRESIVO-PASILLO':
    'CAMPOBASE-VIDEO-DESPLAZAMIENTO-LATERAL-PROGRESIVO-PASILLO__video.mp4',
  'CAMPOBASE-VIDEO-DUELOS-3V2-FINALIZACION-ROBO-ROTACION':
    'CAMPOBASE-VIDEO-DUELOS-3V2-FINALIZACION-ROBO-ROTACION__video.mp4',
  'CAMPOBASE-VIDEO-FINALIZACION-DOBLE-2-BALONES-TRANSICION-1V1-CAMBIO-CARRIL-V2':
    'CAMPOBASE-VIDEO-FINALIZACION-DOBLE-2-BALONES-TRANSICION-1V1-CAMBIO-CARRIL-V2__video.mp4',
  'CAMPOBASE-PASE-BALON-ESPACIO-2-CONOS-1V1-FINALIZACION-V2':
    'CAMPOBASE-VIDEO-PASE-BALON-ESPACIO-2-CONOS-1V1-FINALIZACION__video.mp4',
  'CAMPOBASE-VIDEO-PIES-RAPIDOS-SPRINT-3-VARIACIONES':
    'CAMPOBASE-VIDEO-PIES-RAPIDOS-SPRINT-3-VARIACIONES__video.mp4',
  'CAMPOBASE-VIDEO-REACCION-GIRO-INICIAL-SENALES-LATERALES-CONO-BALON-V3':
    'CAMPOBASE-VIDEO-REACCION-GIRO-INICIAL-SENALES-LATERALES-CONO-BALON-V3__video.mp4',
  'CAMPOBASE-VIDEO-REACTIVE-KNEE-DRIVE-SKATER-3-VARIACIONES':
    'CAMPOBASE-VIDEO-REACTIVE-KNEE-DRIVE-SKATER-3-VARIACIONES__video.mp4',
  'CAMPOBASE-VIDEO-RODILLAS-ALTAS-LATERALES-ZIGZAG-COD-SPRINT':
    'CAMPOBASE-VIDEO-RODILLAS-ALTAS-LATERALES-ZIGZAG-COD-SPRINT__video.mp4',
});

function normalizeNewExercise(exercise) {
  const categoryKey = key(exercise.categoria);
  const etiquetas = uniqueStrings(exercise.etiquetas || [])
    .filter((tag) => key(tag) !== categoryKey);
  const queSeTrabaja = uniqueStrings(exercise.que_se_trabaja || []).slice(0, 4);
  const datosRapidos = { ...(exercise.datos_rapidos || {}) };
  if (datosRapidos.jugadores) datosRapidos.jugadores = summarizeNumericRange(datosRapidos.jugadores, 'jugadores');
  if (datosRapidos.duracion) datosRapidos.duracion = summarizeNumericRange(datosRapidos.duracion, 'min aprox.');

  const originalMedia = exercise.media || {};
  const releaseHumanAsset = HUMAN_VIDEO_RELEASE_ASSET[exercise.id] || '';
  let humanVideo = releaseHumanAsset
    ? `${HUMAN_VIDEO_RELEASE_BASE}/${encodeURIComponent(releaseHumanAsset)}`
    : String(
        exercise.video_muestra_humanos
        || exercise.video_muestra_url
        || exercise.video_humano
        || exercise.video_humanos
        || exercise.video
        || ''
      ).trim();

  const graphicVideo = String(
    GRAPHIC_VIDEO_PATH_ALIAS[exercise.id]
    || exercise.video_ejercicio
    || originalMedia.video
    || originalMedia.mp4
    || ''
  ).trim();

  if (!humanVideo && HUMAN_VIDEO_PATH_ALIAS[exercise.id]) {
    humanVideo = HUMAN_VIDEO_PUBLIC_BASE + HUMAN_VIDEO_PATH_ALIAS[exercise.id];
  }

  const graphicCrop = GRAPHIC_MEDIA_CROP[exercise.id] || null;

  const originalPreview = String(
    exercise.preview
    || originalMedia.preview
    || ''
  ).trim();

  // Los ZIP validados guardan preview.png junto al resto de assets del ejercicio
  // en el bucket ejercicio-videos. Algunos imports anteriores generaron por error
  // URLs hacia un bucket inexistente (ejercicio-previews); se corrige de forma
  // aditiva y sin tocar los ejercicios legacy.
  const assetPreviewPath = String(exercise?._assets?.preview_path || '').trim();
  let preview = originalPreview.replace('/ejercicio-previews/', '/ejercicio-videos/');
  if (assetPreviewPath && graphicVideo.includes('/ejercicio-videos/')) {
    preview = graphicVideo.split('/ejercicio-videos/')[0]
      + '/ejercicio-videos/'
      + assetPreviewPath;
  }

  // En el lote importado, preview.png aún no está publicado en Storage.
  // Nunca dejamos una URL 404. La interfaz genera una preview estática
  // desde el MP4 gráfico (nunca desde el vídeo humano) hasta que exista PNG.
  if (GRAPHIC_VIDEO_PATH_ALIAS[exercise.id] && /\/preview\.png(?:$|[?#])/i.test(preview)) {
    preview = '';
  }

  const formatoOriginal = String(
    exercise.formato_futbol_original
    || exercise.formato_futbol
    || ''
  ).trim();
  const formatoKey = key(formatoOriginal);
  const formatoJuego = formatoKey.includes('11')
    ? 'futbol_11'
    : formatoKey.includes('7')
      ? 'futbol_7'
      : String(exercise.formato_juego || 'todos');
  const formatosJuego = formatoJuego === 'futbol_7'
    ? ['futbol_7']
    : formatoJuego === 'futbol_11'
      ? ['futbol_11']
      : (exercise.formatos_juego || ['futbol_7', 'futbol_11']);
  const formatLabel = formatoJuego === 'futbol_7'
    ? 'F7'
    : formatoJuego === 'futbol_11'
      ? 'F11'
      : (exercise.format || 'F7/F11');

  return {
    ...exercise,
    etiquetas,
    que_se_trabaja: queSeTrabaja,
    datos_rapidos: datosRapidos,
    formato_juego: formatoJuego,
    formatos_juego: formatosJuego,
    format: formatLabel,
    media: {
      ...originalMedia,
      preview,
      video: graphicVideo,
      mp4: graphicVideo,
    },
    preview,
    preview_video: graphicVideo,
    preview_crop: graphicCrop,
    media_crop: null, // El MP4 gráfico se reproduce íntegro (100%) sin recortar porterías ni desbordar
    video_ejercicio: graphicVideo,
    video: humanVideo,
    video_muestra_humanos: humanVideo,
    _video_ejercicio_original: graphicVideo,
    _preview_original: originalPreview,
  };
}

export const EJERCICIOS_NUEVO_FORMATO = Object.freeze(
  RAW_EJERCICIOS_NUEVO_FORMATO.map(normalizeNewExercise)
);

// Se conservan para histórico/compatibilidad, pero no entran en Biblioteca ni selector de sesiones.
export const EJERCICIOS_NUEVO_FORMATO_ANTERIORES = Object.freeze(
  RAW_EJERCICIOS_NUEVO_FORMATO_ANTERIORES.map(normalizeNewExercise)
);

export const NUEVOS_EJERCICIOS_IDS = Object.freeze(EJERCICIOS_NUEVO_FORMATO.map(({ id }) => id));
