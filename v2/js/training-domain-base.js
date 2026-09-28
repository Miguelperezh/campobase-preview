export const CANONICAL_V2_CATEGORIES = Object.freeze([
  'Calentamiento / activación',
  'Coordinación y agilidad',
  'Defensa y duelos',
  'Finalización',
  'Físico con balón',
  'Juego reducido',
  'Pase y posesión',
  'Porteros',
  'Transiciones',
  'Táctica',
  'Técnico-táctico',
]);

export const EXERCISE_CATEGORIES = Object.freeze([
  ...CANONICAL_V2_CATEGORIES,
  'Calentamiento/activación', 'Tecnificación', 'Posesión', 'Transición',
  'Coordinación/motricidad', 'Preparación física integrada',
]);

export const EXERCISE_DIFFICULTIES = Object.freeze(['Baja', 'Media', 'Alta']);

export const CANONICAL_MATERIALS = Object.freeze([
  { id: 'balon', label: 'Balones de fútbol' },
  { id: 'cono', label: 'Conos y chinos' },
  { id: 'porteria', label: 'Porterías' },
  { id: 'miniporteria', label: 'Miniporterías' },
  { id: 'pica', label: 'Picas y postes' },
  { id: 'valla', label: 'Vallas' },
  { id: 'aro', label: 'Aros' },
  { id: 'escalera', label: 'Escalera de agilidad' },
  { id: 'peto', label: 'Petos' },
  { id: 'colchoneta', label: 'Colchonetas' },
  { id: 'elastica', label: 'Bandas elásticas / Gomas' },
  { id: 'step', label: 'Step' },
  { id: 'medicinal', label: 'Balón medicinal' },
  { id: 'tenis', label: 'Pelotas de tenis' },
]);

export const PLAYER_COUNT_OPTIONS = Object.freeze([
  { id: '1-2', label: '1–2 jugadores (Individual / Parejas)', min: 1, max: 2 },
  { id: '3-4', label: '3–4 jugadores (Grupo reducido)', min: 3, max: 4 },
  { id: '5-6', label: '5–6 jugadores (Rondos pequeños)', min: 5, max: 6 },
  { id: '7-8', label: '7–8 jugadores (Líneas y duelos)', min: 7, max: 8 },
  { id: '9-11', label: '9–11 jugadores (Equipo medio)', min: 9, max: 11 },
  { id: '12-14', label: '12–14 jugadores (Plantilla F7)', min: 12, max: 14 },
  { id: '15+', label: '15+ jugadores (Fútbol 11 / Grupos amplios)', min: 15, max: 99 },
]);

export const FORMATO_JUEGO_OPTIONS = Object.freeze([
  { id: 'todos', label: 'Todos' },
  { id: 'futbol_7', label: 'Fútbol 7' },
  { id: 'futbol_11', label: 'Fútbol 11' },
]);

export function normalizeFormatoJuego(val, defaultVal = 'futbol_11') {
  if (!val) return defaultVal;
  const cleanStr = String(val)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const stripped = cleanStr.replace(/[\s_\-]+/g, '');

  if (stripped === 'todos') {
    return 'todos';
  }
  if (stripped === 'f7' || stripped === 'futbol7' || stripped === 'futbolsiete') {
    return 'futbol_7';
  }
  if (stripped === 'f11' || stripped === 'futbol11' || stripped === 'futbolonce') {
    return 'futbol_11';
  }
  return defaultVal;
}

export const FORMAT_OPTIONS = Object.freeze([
  { id: 'F7', label: 'Fútbol 7 (F7)' },
  { id: 'F11', label: 'Fútbol 11 (F11)' },
]);

const playerTotal = (players) => Math.min(12, Math.max(2, Number(String(players).match(/\d+/)?.[0]) || 8));

export function inferExerciseDiagram(values = {}) {
  const text = `${values.name ?? ''} ${values.description ?? ''}`.toLocaleLowerCase('es');
  const category = String(values.category ?? '');
  let type = 'passing';
  if (category === 'Porteros' || /porter[oa]/.test(text)) type = 'goalkeeper';
  else if (/rondo/.test(text)) type = 'rondo';
  else if (/1 contra 1|1v1|duelo/.test(text)) type = 'duel';
  else if (/2 contra 1|2v1|3 contra 2|superioridad/.test(text)) type = 'superiority';
  else if (/tiro|remate|finaliza/.test(text)) type = 'finishing';
  else if (/circuito|coordin|escalera|slalom|valla|zig-zag/.test(text)) type = 'circuit';
  else if (category === 'Juego reducido' || /partido|small-sided/.test(text)) type = 'small-sided';
  else if (/posesión|conservar/.test(text)) type = 'possession';
  else if (category === 'Calentamiento/activación' || /calentamiento|movilidad|activación/.test(text)) type = 'warmup';
  return Object.freeze({
    type,
    players: playerTotal(values.players),
    cones: /cono|pica|aro|valla|escalera/i.test(values.material ?? '') ? 4 : 0,
    goals: /portería/i.test(values.material ?? '') || ['goalkeeper', 'finishing', 'small-sided'].includes(type) ? (type === 'small-sided' ? 2 : 1) : 0,
  });
}

const exercise = (id, name, category, players, material, duration, description, difficulty = 'Media', space = 'Adaptable', variants = 'Ajustar distancias, ritmo y número de toques al nivel del grupo.') => Object.freeze({
  id, recordType: 'exercise', name, category, players, material, duration, description, variants, difficulty, space,
  diagram: inferExerciseDiagram({ name, category, players, material, description }),
  favorite: false, example: true, createdAt: 1, updatedAt: 1,
});

const coordination = [
  ['coord-01', 'Conducción ida y vuelta con aros', '4-5 por estación', 'Aros y balón', 3, 'Conducir hasta los aros, completar la secuencia de apoyos y volver con balón.', 'Baja', 'Carril de 12x4 m'],
  ['coord-02', 'Auto-pase + skipping en escalera', '4-5 por estación', 'Escalera y balón', 4, 'Auto-pase, skipping coordinativo en la escalera y control al salir.', 'Media', 'Carril de 12x4 m'],
  ['coord-03', 'Conducción + salto de vallas', '4-5 por estación', 'Vallas y conos', 4, 'Conducir entre conos, dejar el balón controlado, superar vallas y recuperarlo.', 'Media', 'Carril de 15x5 m'],
  ['coord-04', 'Coordinación adelante/atrás + pase', 'Parejas', 'Picas y balón', 3, 'Desplazamientos adelante y atrás entre picas antes de recibir y devolver el pase.', 'Baja', 'Cuadrado de 8x8 m'],
  ['coord-05', 'Zig-zag entre conos + escalera', '4-5 por estación', 'Conos y escalera', 4, 'Zig-zag con cambios de dirección y secuencia rápida de pies en escalera.', 'Media', 'Carril de 15x5 m'],
  ['coord-06', 'Conducción + giro 180° + slalom', '3-4 por estación', 'Aros y picas', 4, 'Conducir, girar 180 grados en el aro y completar el slalom.', 'Media', 'Carril de 15x5 m'],
  ['coord-07', 'Control + pase con desplazamiento', '7 participantes', 'Conos y balón', 6, 'Control orientado, pase al siguiente apoyo y desplazamiento a la posición libre.', 'Media', '20x15 m'],
  ['coord-08', 'Secuencia de controles y pases', '7 participantes', 'Conos y balón', 6, 'Encadenar controles orientados y pases siguiendo el circuito marcado.', 'Media', '20x15 m'],
  ['coord-09', 'Paredes continuas bilaterales', 'Parejas', 'Balón', 4, 'Paredes continuas alternando ambos perfiles y pierna de contacto.', 'Media', 'Carril de 12x6 m'],
  ['coord-10', 'Desmarque + finalización', 'Parejas + portero', 'Balón y portería', 4, 'Desmarque de ruptura tras pase, devolución y finalización ante portero.', 'Media', 'Media cancha'],
].map((item) => exercise(...item.slice(0, 2), 'Coordinación/motricidad', ...item.slice(2)));

const technical = [
  ['tech-01', 'Libera las líneas de pase', '5', '3 siluetas, 6 palos y balones', 24, 'Área 15x15 m. Coloca 3 siluetas (defensores) y 6 palos formando puertas. Los 5 jugadores circulan el balón moviéndose para abrir líneas de pase libres entre las siluetas. 2 series de 10 min con 2 min de recuperación. Trabaja pase, control orientado, desmarque y toca-y-vete.', 'Media', '15x15 m', 'Añade un defensor real que presione; limita a 2 toques.'],
  ['tech-02', 'Pase — Real Madrid CF', '6', '4 conos y balones', 12, 'Área 15x20 m. Circuito de pase y apoyo: los jugadores se colocan en las esquinas y el centro, encadenando pases cortos, medios y largos con orientación corporal correcta. 3 series de 3 min con 1 min de recuperación para rotar roles. Trabaja interior del pie, apoyo, lectura de trayectorias.', 'Media', '15x20 m', 'Cambia la dirección del circuito; exige pase a un toque.'],
  ['tech-03', 'Activación técnica 2 contra 1', '10', '6 chinos, 2 siluetas, 4 palos, 4 miniporterías y balones', 20, 'Área 15x20 m. Circuito técnico que termina en situación de 2 contra 1: dos atacantes superan a un defensor con pase, desmarque y control orientado para finalizar en una de las miniporterías. 2 series. Trabaja contra-movimiento, desmarque y tiro.', 'Media', '15x20 m', 'Añade un segundo defensor para 2 contra 2.'],
  ['tech-04', 'Triangulación, pases y tiro — Bayer Leverkusen', '8-16', 'Balones, conos y portería', 15, 'Triangulación rápida con tercer hombre: pase, pared y devolución para dejar al compañero de cara a portería y finalizar. Trabaja pase, recepción y posesión en progresión hacia el remate.', 'Alta', 'Media cancha', 'Limita a 2 toques; añade oposición pasiva.'],
  ['tech-05', 'Conducción de balón y tiro al objetivo — AFC Ajax', '6-14', 'Balones, conos y miniporterías', 12, 'Circuito de conducción a velocidad con cambios de dirección entre conos y tiro final a zona objetivo. Trabaja conducción, control del balón en carrera y precisión de remate.', 'Media', '25x15 m', 'Aumenta la velocidad; compite por tiempo.'],
  ['tech-06', '2 contra 2 en un cuadrado (dribling y posesión)', '4-12', 'Balones, conos y petos', 12, 'Duelo 2 contra 2 en un cuadrado de 12x12 m: proteger el balón, regatear y conservar la posesión ante la presión de la pareja rival. Trabaja atención, dribling y posesión.', 'Media', '12x12 m', 'Añade comodines en los lados.'],
  ['tech-07', 'Posesión 8 contra 8 + 2 comodines (control orientado)', '18', 'Balones, conos y petos', 18, 'Posesión 8 contra 8 con 2 comodines que juegan con el equipo que tiene el balón. Prioriza el control orientado y la continuidad del juego. Trabaja control orientado y exigencia cognitiva.', 'Alta', '40x35 m', 'Limita toques; reduce el espacio.'],
  ['tech-08', 'Circuito de perfeccionamiento técnico', '6-18', 'Balones, conos, picas y porterías', 15, 'Estaciones rotativas de pase, control, conducción, regate y finalización. Cada estación entrena un gesto técnico distinto y los jugadores rotan. Trabaja varios gestos técnicos en una sola tarea.', 'Media', 'Media cancha', 'Añade tiempo límite por estación.'],
  ['tech-09', 'Circuito técnico-motor: juego de la bandera', '8-18', 'Balones, conos y petos', 12, 'Circuito motor con reacción a señal: los jugadores conducen, reaccionan a un estímulo y conquistan la bandera con balón. Trabaja reactividad neuromuscular y conducción.', 'Media', '25x20 m', 'Cambia el estímulo (color, número, sonido).'],
  ['tech-10', 'Circuito motriz psicocinético con 1 contra 1', '6-16', 'Balones, conos y petos', 15, 'Estación motriz con estímulos cognitivos: el jugador decide el recorrido según la señal y termina en un duelo 1 contra 1. Trabaja esquemas motrices básicos y toma de decisión.', 'Alta', '30x20 m', 'Varía el estímulo y el recorrido.'],
].map((item) => exercise(...item.slice(0, 2), 'Tecnificación', ...item.slice(2)));

const tactical = [
  ['tact-01', 'Juego condicionado: cuadrícula de posesión — Real Madrid CF', '10-18', 'Balones, conos y petos', 15, 'Posesión por cuadrículas: el equipo debe ocupar y liberar espacios formando triángulos de posesión. Trabaja la circulación y la búsqueda constante del pase libre.', 'Alta', '35x30 m', 'Limita toques; obliga a cambiar de cuadrícula cada X pases.'],
  ['tact-02', 'Posesión posicional 5 contra 3 con dos porterías', '8', 'Balones, conos, petos y miniporterías', 15, 'El 5 contra 3 progresa hacia una de las dos porterías tras fijar la presión rival. Trabaja posesión, superioridad y finalización.', 'Alta', '25x20 m', 'Añade un comodín; reduce el espacio.'],
  ['tact-03', 'Fase ofensiva: amplitud y profundidad (6v6 o 7v7)', '12-14', 'Balones, conos, petos y porterías', 20, 'Partido a tema 6 contra 6 o 7 contra 7: ataque organizado ocupando carriles exteriores (amplitud) y buscando la espalda de la defensa (profundidad).', 'Alta', 'Media cancha', 'Obliga a tocar en banda antes de centrar.'],
  ['tact-04', 'Rondo 3vs1 en dos cuadrados', '8', '8 chinos, 2 balones y 2 petos', 14, 'Área 6x15 m dividida en dos cuadrados. Dos rondos 3 contra 1 conectados: el balón cambia de cuadrado tras una secuencia de pases. 8 series de 1\'30" con 2 min de recuperación a mitad. Trabaja desmarque, líneas de pase libres y transiciones.', 'Media', '6x15 m', 'Añade un segundo defensor; limita a 2 toques.'],
  ['tact-05', 'Partido por sectores: de la construcción a la finalización', '12-18', 'Balones, conos, petos y porterías', 20, 'Partido a tema por sectores: progresar desde la construcción respetando apoyos y ocupación racional hasta la finalización. Trabaja salida de balón y progresión.', 'Alta', 'Campo 60x40 m', 'Limita toques por sector; añade presión.'],
  ['tact-06', 'Partido a tema: ataque rápido de la profundidad', '10-18', 'Balones, petos y porterías', 18, 'Tras recuperar el balón, buscar pase vertical y desmarque profundo con contraataque y transiciones rápidas. Trabaja penetración y velocidad de ataque.', 'Alta', 'Media cancha', 'Limita el tiempo para finalizar.'],
  ['tact-07', 'Partido condicionado 7 contra 7 — FC Barcelona', '14', 'Balones, conos, petos y porterías', 20, 'Juego 7 contra 7 con obligación de posición y circulación, priorizando la consolidación de la posesión. Trabaja juego posicional.', 'Alta', 'Campo 55x40 m', 'Obliga a un mínimo de pases antes de finalizar.'],
  ['tact-08', 'Partido condicionado 8 contra 8 + 2 comodines laterales', '18', 'Balones, conos, petos y porterías', 20, 'Los 2 comodines laterales generan amplitud y superioridad exterior. Trabaja amplitud y finalización desde banda.', 'Alta', 'Campo 60x45 m', 'Los comodines solo juegan a un toque.'],
  ['tact-09', 'Small-sided game 3 contra 2 (finalización)', '5-15', 'Balones, petos y portería', 15, 'Ataque 3 contra 2 para fijar al defensor, soltar al compañero libre y finalizar. Trabaja superioridad orientada a la finalización.', 'Media', '30x25 m', 'Añade un defensor que recupera desde atrás.'],
  ['tact-10', 'Small-sided game 4 contra 4 + 2 comodines', '10', 'Balones, conos y petos', 15, 'Juego reducido 4 contra 4 con 2 comodines que crean superioridades. Trabaja posesión y finalización.', 'Media', '25x20 m', 'Los comodines juegan a un toque.'],
  ['tact-11', 'Small-sided game: El pentágono', '6-12', 'Balones, conos y petos', 15, 'Juego de apoyos y desmarques en espacio pentagonal para mejorar la técnica a alta intensidad. Trabaja reacción y apoyos.', 'Alta', 'Pentágono de 20 m', 'Limita toques; añade porterías en los lados.'],
  ['tact-12', 'Ataque contra defensa en tres zonas', '10-18', 'Balones, conos, petos y porterías', 20, 'El ataque progresa por tres zonas ante una defensa organizada, buscando superioridad por dentro y por fuera. Trabaja atraer y progresar.', 'Alta', 'Media cancha', 'Obliga a superar cada zona con pase.'],
  ['tact-13', 'Recibir y defender el balón', '2', '4 conos, 6 palos (2 de cada color), 1 peto y balones', 18, 'Área 20x20 m. Situaciones de 1 contra 1: un jugador recibe de espaldas y protege el balón ante oposición activa. 3 series de 5 min alternando 3 parejas (6 jugadores), con 1 min de recuperación. Trabaja control, protección, dribling y orientación.', 'Media', '20x20 m', 'Añade un segundo defensor; reduce el espacio.'],
].map((item) => exercise(...item.slice(0, 2), item[1].startsWith('Small-sided') || item[1].startsWith('Partido condicionado') ? 'Juego reducido' : 'Táctica', ...item.slice(2)));

const physical = [exercise('physical-01', 'Circuito físico: El cuadrado', 'Preparación física integrada', '8-20', 'Conos y petos', 15, 'Circuito en cuatro lados con velocidad, agilidad, resistencia y recuperación activa. Cada lado entrena una cualidad distinta y los jugadores rotan.', 'Media', 'Cuadrado de 20x20 m', 'Aumenta la intensidad o el número de vueltas.')];

const technicalV2 = [
  ['tech-11', 'Regate en puertas de colores', '6-16', 'Balones y conos', 12, 'Conducir y superar la puerta indicada con un cambio de ritmo.', 'Baja', '20x20 m'],
  ['tech-12', 'Control orientado y pase al tercer hombre', '6-15', 'Balones y conos', 14, 'Recibir perfilado, orientar el primer toque y conectar con el tercer apoyo.', 'Media', '24x18 m'],
  ['tech-13', 'Pared y finalización cruzada', '6-14', 'Balones, conos y portería', 14, 'Jugar una pared al borde del área y finalizar cruzado.', 'Media', 'Media cancha'],
  ['tech-14', 'Remate de centros laterales', '8-16', 'Balones, conos y portería', 16, 'Atacar primer palo, segundo palo y rechace ante un centro lateral.', 'Alta', 'Área y bandas'],
  ['tech-15', 'Tiro tras conducción diagonal', '6-14', 'Balones, conos y portería', 12, 'Conducir en diagonal, acomodar el balón y tirar desde frontal.', 'Media', '30x25 m'],
  ['tech-16', 'Primer toque bajo presión', '6-12', 'Balones, conos y petos', 12, 'Recibir con oposición cercana y orientar el control hacia espacio libre.', 'Alta', '18x18 m'],
  ['tech-17', 'Dominio y volea por parejas', 'Parejas', 'Balones', 10, 'Alternar controles aéreos y voleas suaves manteniendo continuidad.', 'Media', 'Carriles de 8x5 m'],
  ['tech-18', 'Slalom con finta y aceleración', '6-16', 'Balones, conos y picas', 12, 'Encadenar fintas en slalom y acelerar al superar la última pica.', 'Baja', 'Carril de 18x5 m'],
  ['tech-19', 'Pase largo y control aéreo', 'Parejas', 'Balones y conos', 14, 'Alternar envíos largos y controles orientados con muslo, pecho o pie.', 'Alta', 'Carril de 30x10 m'],
  ['tech-20', 'Finalización a dos toques', '6-15', 'Balones, conos y portería', 15, 'Controlar el pase frontal y finalizar antes del segundo toque.', 'Alta', 'Frontal y área'],
].map((item) => exercise(...item.slice(0, 2), 'Tecnificación', ...item.slice(2)));

const coordinationV2 = [
  ['coord-11', 'Escalera lateral y pase de precisión', '4-10', 'Escalera, balones y conos', 10, 'Completar apoyos laterales y pasar a una puerta pequeña.', 'Baja', 'Carril de 15x5 m'],
  ['coord-12', 'Aros, giro y recepción perfilada', '4-12', 'Aros, balones y conos', 10, 'Secuencia de pies en aros, giro y recepción orientada.', 'Media', 'Carril de 14x6 m'],
  ['coord-13', 'Reacción por colores con balón', '6-16', 'Balones y conos de colores', 12, 'Reaccionar a una señal, conducir al color indicado y regresar.', 'Media', '20x20 m'],
  ['coord-14', 'Vallas bajas y salida explosiva', '4-12', 'Vallas y conos', 10, 'Superar vallas con apoyos cortos y acelerar cinco metros.', 'Media', 'Carril de 15x4 m'],
  ['coord-15', 'Espejo coordinativo por parejas', 'Parejas', 'Conos', 10, 'Un jugador lidera desplazamientos y el compañero los reproduce.', 'Baja', 'Cuadrados de 8x8 m'],
  ['coord-16', 'Circuito óculo-pédico con dos balones', '6-12', 'Balones, aros y conos', 12, 'Coordinar pase simultáneo, apoyos en aros y cambio de estación.', 'Alta', '18x18 m'],
].map((item) => exercise(...item.slice(0, 2), 'Coordinación/motricidad', ...item.slice(2)));

const tacticalV2 = [
  ['tact-14', 'Basculación defensiva en bloque medio', '8-16', 'Balones, conos y petos', 16, 'Desplazar el bloque según la circulación rival cerrando líneas interiores.', 'Alta', '40x35 m'],
  ['tact-15', 'Salida de balón 4 contra 3', '7-14', 'Balones, conos, petos y miniporterías', 16, 'Superar la primera presión mediante amplitud, apoyo y tercer hombre.', 'Alta', '35x30 m'],
  ['tact-16', 'Transición tras pérdida en cinco segundos', '10-18', 'Balones, conos y petos', 16, 'Tras perder, presionar juntos durante cinco segundos o replegar.', 'Alta', '40x35 m'],
  ['tact-17', 'Defensa de centros y rechaces', '8-16', 'Balones, petos y portería', 16, 'Coordinar marcajes, despeje y ocupación de la frontal.', 'Alta', 'Área y bandas'],
].map((item) => exercise(...item.slice(0, 2), 'Táctica', ...item.slice(2)));

const physicalV2 = [
  ['physical-02', 'Velocidad repetida con balón', '6-18', 'Balones y conos', 12, 'Series cortas de conducción máxima con recuperación activa.', 'Alta', 'Carriles de 20x5 m'],
  ['physical-03', 'Cambios de dirección 5-10-5', '6-16', 'Conos', 10, 'Acelerar, frenar y cambiar de dirección en recorrido 5-10-5.', 'Media', 'Carril de 20x5 m'],
  ['physical-04', 'Resistencia intermitente con pase', '8-20', 'Balones y conos', 16, 'Alternar carrera intensa y recuperación mientras circula el balón.', 'Alta', '30x25 m'],
  ['physical-05', 'Fuerza por parejas y aceleración', 'Parejas', 'Conos y bandas elásticas', 12, 'Breve resistencia por parejas seguida de aceleración controlada.', 'Media', 'Carril de 15x5 m'],
].map((item) => exercise(...item.slice(0, 2), 'Preparación física integrada', ...item.slice(2)));

const warmupsV2 = [
  ['warmup-03', 'Rondo progresivo de activación', '6-12', 'Balones, conos y petos', 12, 'Empezar sin oposición y añadir defensores y límite de toques.', 'Media', 'Cuadrado de 15x15 m'],
  ['warmup-04', 'Movilidad dinámica con balón', 'Todo el equipo', 'Balones y conos', 10, 'Movilidad articular en desplazamiento combinada con conducción suave.', 'Baja', '20x15 m'],
  ['warmup-05', 'Pases por parejas en movimiento', 'Parejas', 'Balones y conos', 10, 'Progresar por el espacio con pases cortos y movilidad dinámica.', 'Baja', '25x20 m'],
  ['warmup-06', 'Juego de reacción y robo de petos', '8-20', 'Petos y conos', 10, 'Activación lúdica con cambios de dirección para capturar petos.', 'Baja', '20x20 m'],
].map((item) => exercise(...item.slice(0, 2), 'Calentamiento/activación', ...item.slice(2)));

const smallSidedV2 = [
  ['ssg-01', '3 contra 3 con cuatro miniporterías', '6-12', 'Balones, petos, conos y miniporterías', 15, 'Atacar cualquiera de dos miniporterías y reaccionar tras pérdida.', 'Media', '25x20 m'],
  ['ssg-02', '4 contra 4 a tres toques', '8-16', 'Balones, petos, conos y porterías', 16, 'Juego reducido con máximo tres toques para acelerar decisiones.', 'Media', '30x24 m'],
  ['ssg-03', '5 contra 5 con zonas de finalización', '10-16', 'Balones, petos, conos y porterías', 18, 'Solo se puede finalizar tras entrar controlando en la zona ofensiva.', 'Alta', '40x30 m'],
  ['ssg-04', '2 contra 2 + comodín ofensivo', '5-10', 'Balones, petos y miniporterías', 14, 'El comodín juega con quien tiene balón para crear un 3 contra 2.', 'Media', '22x18 m'],
  ['ssg-05', 'Partido de transiciones 4 contra 4', '8-16', 'Balones, petos y cuatro miniporterías', 16, 'Al recuperar se ataca inmediatamente la pareja de porterías opuesta.', 'Alta', '30x25 m'],
  ['ssg-06', '6 contra 6 por carriles', '12-18', 'Balones, petos, conos y porterías', 18, 'Ocupar al menos tres carriles antes de poder finalizar.', 'Alta', '45x35 m'],
].map((item) => exercise(...item.slice(0, 2), 'Juego reducido', ...item.slice(2)));

const goalkeepersV2 = [
  ['keeper-01', 'Blocaje frontal y caída lateral', '2-6 porteros', 'Balones, conos y portería', 12, 'Alternar blocaje frontal con caída lateral segura a ambos perfiles.', 'Media', 'Área pequeña'],
  ['keeper-02', 'Desplazamiento lateral y estirada', '2-6 porteros', 'Balones, conos y portería', 12, 'Ajustar apoyos laterales antes de una estirada rasa.', 'Media', 'Portería y área pequeña'],
  ['keeper-03', 'Uno contra uno: achique', '2-8', 'Balones, conos y portería', 14, 'Temporizar, reducir ángulo y decidir el momento del achique.', 'Alta', 'Área'],
  ['keeper-04', 'Juego aéreo en centros', '3-8', 'Balones, conos y portería', 15, 'Atacar centros desde ambos lados con impulso, blocaje y despeje.', 'Alta', 'Área'],
  ['keeper-05', 'Pase corto bajo presión', '3-8', 'Balones, petos y miniporterías', 14, 'Participar en una salida 3 contra 1 y encontrar la portería libre.', 'Alta', '20x18 m'],
  ['keeper-06', 'Saque largo a zonas objetivo', '2-6 porteros', 'Balones, conos y aros', 12, 'Alternar golpeo con pie y mano buscando zonas marcadas.', 'Media', 'Media cancha'],
  ['keeper-07', 'Doble intervención y recuperación', '2-6 porteros', 'Balones, conos y portería', 14, 'Resolver un primer tiro, levantarse y responder a un segundo.', 'Alta', 'Área pequeña'],
  ['keeper-08', 'Reflejos a corta distancia', '2-6 porteros', 'Balones y portería', 10, 'Responder a remates cercanos variados manteniendo posición base.', 'Alta', 'Área pequeña'],
  ['keeper-09', 'Pasos de ajuste y tiro cruzado', '2-6 porteros', 'Balones, conos y portería', 12, 'Ajustar posición a la circulación antes del tiro cruzado.', 'Media', 'Área'],
  ['keeper-10', 'Portero + línea defensiva', '6-10', 'Balones, petos, conos y portería', 16, 'Coordinar altura, coberturas y comunicación ante ataques de tres.', 'Alta', 'Media cancha'],
].map((item) => exercise(...item.slice(0, 2), 'Porteros', ...item.slice(2)));

export const WARMUP_TEMPLATES = Object.freeze([
  exercise('warmup-training-10', 'Calentamiento de entreno (10 min)', 'Calentamiento/activación', 'Todo el equipo', 'Balones y conos', 10, 'Juego libre y movilidad con balón (5 min) + activación técnica de pases o rondo (5 min).', 'Baja', '20x20 m', 'Cambiar el rondo por pases por parejas o conducción libre.'),
  exercise('warmup-match-15', 'Calentamiento de partido (15 min)', 'Calentamiento/activación', 'Convocados', 'Balones, conos y petos', 15, 'Movilidad articular y carrera suave (5 min) + activación con balón (5 min) + rondo o posesión reducida (5 min).', 'Media', '25x20 m', 'Ajustar intensidad y espacio según la hora, el césped y el rival.'),
]);

export const PHASE2_V2_EXERCISES = Object.freeze([
  ...technicalV2, ...coordinationV2, ...tacticalV2, ...physicalV2, ...warmupsV2, ...smallSidedV2, ...goalkeepersV2,
]);

export const PHASE2_V3_EXERCISES = Object.freeze([
  exercise('physical-06', 'Velocidad de reacción con salida', 'Preparación física integrada', '6-16', 'Conos y silbato', 10, 'Salidas explosivas desde distintas posiciones (sentado, tumbado, de espaldas) a la señal. Trabaja velocidad de reacción y aceleración.', 'Media', 'Carril de 15x5 m', 'Varía la posición de salida y la señal.'),
  exercise('physical-07', 'Circuito de agilidad con conos', 'Preparación física integrada', '6-18', 'Conos y picas', 12, 'Recorrido de agilidad con cambios de dirección, frenadas y aceleraciones entre conos. Trabaja agilidad y coordinación de carrera.', 'Media', '20x15 m', 'Compite por tiempo; añade balón.'),
  exercise('physical-08', 'Resistencia aeróbica con balón', 'Preparación física integrada', '8-20', 'Balones y conos', 18, 'Carrera continua a ritmo medio combinada con conducción y pases. Trabaja resistencia aeróbica manteniendo el contacto con el balón.', 'Media', 'Campo 40x30 m', 'Ajusta la intensidad según la edad.'),
  exercise('physical-09', 'Fuerza funcional por parejas', 'Preparación física integrada', 'Parejas', 'Conos y bandas elásticas', 12, 'Ejercicios de fuerza por parejas (empujes, tracciones, sentadillas asistidas) seguidos de aceleración corta. Trabaja fuerza y potencia.', 'Media', 'Carril de 15x5 m', 'Adapta la resistencia a la edad.'),
  exercise('physical-10', 'Intervalos de alta intensidad (HIIT)', 'Preparación física integrada', '6-18', 'Conos y silbato', 14, 'Series cortas de máxima intensidad (20-30 s) con recuperación activa. Trabaja potencia aeróbica y anaeróbica.', 'Alta', 'Campo 30x25 m', 'Ajusta duración y recuperación al nivel.'),
]);

export const INITIAL_EXERCISES = Object.freeze([...coordination, ...technical, ...tactical, ...physical, ...WARMUP_TEMPLATES, ...PHASE2_V2_EXERCISES]);

const clean = (value) => String(value ?? '').trim();

const DIAGRAM_LAYOUTS = Object.freeze({
  rondo: [[50, 18], [78, 35], [70, 68], [30, 68], [22, 35], [50, 48]],
  circuit: [[12, 75], [28, 58], [44, 72], [60, 48], [76, 62], [88, 28]],
  possession: [[20, 25], [45, 18], [75, 28], [28, 68], [58, 72], [82, 62], [50, 45]],
  duel: [[30, 50], [62, 50], [86, 50]],
  superiority: [[18, 25], [18, 72], [52, 50], [84, 50]],
  'small-sided': [[20, 25], [35, 48], [20, 72], [80, 25], [65, 48], [80, 72]],
  warmup: [[18, 28], [38, 22], [62, 28], [82, 22], [28, 68], [50, 72], [72, 66]],
  goalkeeper: [[84, 50], [55, 28], [55, 72], [25, 50]],
  finishing: [[16, 68], [38, 50], [60, 36], [85, 50]],
  passing: [[18, 25], [50, 18], [82, 25], [72, 70], [28, 70]],
});

const xml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);

export function renderExerciseDiagram(item) {
  const diagram = item.diagram?.type ? item.diagram : inferExerciseDiagram(item);
  const layout = DIAGRAM_LAYOUTS[diagram.type] ?? DIAGRAM_LAYOUTS.passing;
  const players = Array.from({ length: Math.min(diagram.players || 6, layout.length) }, (_, index) => layout[index]);
  const markerId = `arrow-${String(item.id ?? diagram.type).replace(/[^a-z0-9-]/gi, '')}`;
  const pathId = `seq-${String(item.id ?? diagram.type).replace(/[^a-z0-9-]/gi, '')}`;
  const seqPath = players.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
  const cones = Array.from({ length: Math.min(diagram.cones || 0, 4) }, (_, index) => `<path class="diagram-cone" d="M${14 + index * 24} 86 l3 -7 l3 7z"/>`).join('');
  const goals = diagram.goals > 0 ? `<path class="diagram-goal" d="M92 36 h5 v28 h-5"/>${diagram.goals > 1 ? '<path class="diagram-goal" d="M8 36 h-5 v28 h5"/>' : ''}` : '';
  const movement = players.slice(0, -1).map(([x, y], index) => {
    const [nextX, nextY] = players[index + 1];
    return `<path class="diagram-movement" d="M${x} ${y} L${nextX} ${nextY}" marker-end="url(#${markerId})"/>`;
  }).join('');
  const dots = players.map(([x, y], index) => `<g class="diagram-player"><circle cx="${x}" cy="${y}" r="4"/><text x="${x}" y="${y + 1.6}">${index + 1}</text></g>`).join('');
  const ball = `<circle class="diagram-ball" r="2.4"><animateMotion dur="4s" repeatCount="indefinite" path="${seqPath}"/></circle>`;
  return `<svg class="exercise-diagram" viewBox="0 0 100 100" role="img" aria-label="Diagrama animado de ${xml(item.name || 'ejercicio')}"><defs><marker id="${markerId}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6z"/></marker></defs><rect class="diagram-field" x="5" y="7" width="90" height="86" rx="3"/><path class="diagram-line" d="M50 7v86 M5 50h90"/><circle class="diagram-line" cx="50" cy="50" r="11"/>${goals}${cones}${movement}${dots}${ball}</svg>`;
}

export function planPhase2V2Seed(existingRecords, now = Date.now()) {
  const exercises = (existingRecords ?? []).filter(({ recordType }) => recordType === 'exercise');
  const existingIds = new Set(exercises.map(({ id }) => id));
  const additions = PHASE2_V2_EXERCISES.filter(({ id }) => !existingIds.has(id)).map((item) => structuredClone(item));
  const enriched = exercises.filter(({ diagram }) => !diagram?.type).map((item) => ({
    ...item,
    diagram: inferExerciseDiagram(item),
    updatedAt: now,
  }));
  return [...additions, ...enriched, { id: 'phase2-v2-seeded', recordType: 'migration', version: 3, createdAt: now }];
}

export function planPhase2V3Seed(existingRecords, now = Date.now()) {
  const exercises = (existingRecords ?? []).filter(({ recordType }) => recordType === 'exercise');
  const existingIds = new Set(exercises.map(({ id }) => id));
  const additions = PHASE2_V3_EXERCISES.filter(({ id }) => !existingIds.has(id)).map((item) => structuredClone(item));
  const refreshed = exercises.map((item) => {
    const improved = IMPROVED_DESCRIPTIONS[item.id];
    if (!improved) return item;
    return { ...item, ...improved, diagram: inferExerciseDiagram({ ...item, ...improved }), updatedAt: now };
  });
  return [...additions, ...refreshed, { id: 'phase2-v3-seeded', recordType: 'migration', version: 4, createdAt: now }];
}

const IMPROVED_DESCRIPTIONS = Object.freeze({
  'tech-01': { players: '5', material: '3 siluetas, 6 palos y balones', duration: 24, description: 'Área 15x15 m. Coloca 3 siluetas (defensores) y 6 palos formando puertas. Los 5 jugadores circulan el balón moviéndose para abrir líneas de pase libres entre las siluetas. 2 series de 10 min con 2 min de recuperación. Trabaja pase, control orientado, desmarque y toca-y-vete.', space: '15x15 m', variants: 'Añade un defensor real que presione; limita a 2 toques.' },
  'tech-02': { players: '6', material: '4 conos y balones', duration: 12, description: 'Área 15x20 m. Circuito de pase y apoyo: los jugadores se colocan en las esquinas y el centro, encadenando pases cortos, medios y largos con orientación corporal correcta. 3 series de 3 min con 1 min de recuperación para rotar roles. Trabaja interior del pie, apoyo, lectura de trayectorias.', space: '15x20 m', variants: 'Cambia la dirección del circuito; exige pase a un toque.' },
  'tech-03': { players: '10', material: '6 chinos, 2 siluetas, 4 palos, 4 miniporterías y balones', duration: 20, description: 'Área 15x20 m. Circuito técnico que termina en situación de 2 contra 1: dos atacantes superan a un defensor con pase, desmarque y control orientado para finalizar en una de las miniporterías. 2 series. Trabaja contra-movimiento, desmarque y tiro.', space: '15x20 m', variants: 'Añade un segundo defensor para 2 contra 2.' },
  'tact-04': { players: '8', material: '8 chinos, 2 balones y 2 petos', duration: 14, description: 'Área 6x15 m dividida en dos cuadrados. Dos rondos 3 contra 1 conectados: el balón cambia de cuadrado tras una secuencia de pases. 8 series de 1\'30" con 2 min de recuperación a mitad. Trabaja desmarque, líneas de pase libres y transiciones.', space: '6x15 m', variants: 'Añade un segundo defensor; limita a 2 toques.' },
  'tact-13': { players: '2', material: '4 conos, 6 palos (2 de cada color), 1 peto y balones', duration: 18, description: 'Área 20x20 m. Situaciones de 1 contra 1: un jugador recibe de espaldas y protege el balón ante oposición activa. 3 series de 5 min alternando 3 parejas (6 jugadores), con 1 min de recuperación. Trabaja control, protección, dribling y orientación.', space: '20x20 m', variants: 'Añade un segundo defensor; reduce el espacio.' },
});

export function buildExercise(values, metadata = {}) {
  const name = clean(values.name);
  if (!name) throw new TypeError('El ejercicio necesita un nombre.');
  const category = clean(values.category);
  if (!EXERCISE_CATEGORIES.includes(category)) throw new TypeError('Selecciona una categoría válida.');
  const duration = Number(values.duration);
  if (!Number.isInteger(duration) || duration < 1 || duration > 240) throw new RangeError('La duración debe estar entre 1 y 240 minutos.');
  const difficulty = clean(values.difficulty) || 'Media';
  if (!EXERCISE_DIFFICULTIES.includes(difficulty)) throw new TypeError('Selecciona una dificultad válida.');
  const formato_juego = normalizeFormatoJuego(values.formato_juego ?? values.format ?? metadata.formato_juego ?? metadata.format);
  return {
    id: metadata.id,
    name,
    category,
    formato_juego,
    players: clean(values.players),
    material: clean(values.material),
    duration,
    description: clean(values.description),
    variants: clean(values.variants),
    difficulty,
    space: clean(values.space),
    diagram: metadata.diagram?.type ? metadata.diagram : inferExerciseDiagram(values),
    favorite: Boolean(metadata.favorite),
    createdAt: metadata.createdAt,
    updatedAt: metadata.now,
  };
}

export function filterExercises(exercises, filters = {}) {
  if (!Array.isArray(exercises)) throw new TypeError('Los ejercicios deben ser una lista.');
  const material = clean(filters.material).toLocaleLowerCase('es');
  const players = clean(filters.players).toLocaleLowerCase('es');
  const formatVal = filters.formato_juego !== undefined ? filters.formato_juego : filters.format;
  const queryText = clean(filters.text || filters.search || filters.query).toLocaleLowerCase('es');

  return exercises.filter((item) => {
    if (filters.category && item.category !== filters.category) return false;
    if (filters.difficulty && item.difficulty !== filters.difficulty) return false;
    if (filters.favorites && !item.favorite) return false;
    if (filters.video && !item.video) return false;

    // Filtro por texto si se especifica
    if (queryText) {
      const haystack = `${item.id || ''} ${item.name || ''} ${item.description || ''} ${item.category || ''} ${item.material || ''} ${item.space || ''}`.toLocaleLowerCase('es');
      if (!haystack.includes(queryText)) return false;
    }

    // Filtro por formato (Fútbol 7, Fútbol 11, Todos)
    if (formatVal !== undefined && formatVal !== '' && formatVal !== 'todos' && formatVal !== 'Todos') {
      const targetNorm = normalizeFormatoJuego(formatVal, 'futbol_11');
      if (targetNorm !== 'todos') {
        const itemFormato = normalizeFormatoJuego(item.formato_juego || item.formato, 'futbol_11');
        if (targetNorm === 'futbol_7' || targetNorm === 'futbol_11') {
          if (item.formato_juego || item.formato) {
            if (itemFormato !== targetNorm) return false;
          } else if (filters.formato_juego !== undefined || formatVal === 'futbol_7' || formatVal === 'futbol_11') {
            if (itemFormato !== targetNorm) return false;
          } else {
            // Retrocompatibilidad heurística SOLO para llamadas legacy de tests antiguas sin formato_juego
            const text = `${item.name || ''} ${item.description || ''} ${item.category || ''} ${item.space || ''}`.toLowerCase();
            const numMatch = String(item.players || '').match(/\d+/);
            const count = numMatch ? parseInt(numMatch[0], 10) : 8;
            if (String(formatVal).toUpperCase() === 'F7') {
              const isF11Exclusive = count >= 16 && (text.includes('11x11') || text.includes('11v11') || text.includes('fútbol 11') || text.includes('f11'));
              if (isF11Exclusive) return false;
            } else if (String(formatVal).toUpperCase() === 'F11') {
              const isF7Exclusive = count <= 2 && (text.includes('parejas') || text.includes('sombreado') || text.includes('individual'));
              if (isF7Exclusive) return false;
            }
          }
        }
      }
    }

    // Filtro por material
    if (material) {
      const itemMat = clean(item.material).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const queryMat = material.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matchMat = itemMat.includes(queryMat) ||
        (queryMat === 'cono' && (itemMat.includes('cono') || itemMat.includes('chino'))) ||
        (queryMat === 'balon' && (itemMat.includes('balon') || itemMat.includes('pelota'))) ||
        (queryMat === 'porteria' && itemMat.includes('porteria')) ||
        (queryMat === 'miniporteria' && itemMat.includes('miniporteria')) ||
        (queryMat === 'pica' && (itemMat.includes('pica') || itemMat.includes('palo'))) ||
        (queryMat === 'elastica' && (itemMat.includes('elastica') || itemMat.includes('goma')));
      if (!matchMat) return false;
    }

    // Filtro por jugadores
    if (players) {
      const itemP = clean(item.players).toLocaleLowerCase('es');
      if (itemP.includes(players)) return true;
      const numMatch = itemP.match(/\d+/);
      const count = numMatch ? parseInt(numMatch[0], 10) : null;
      if (count !== null) {
        if (players === '1-2' && (count >= 1 && count <= 2)) return true;
        if (players === '3-4' && (count >= 3 && count <= 4)) return true;
        if (players === '5-6' && (count >= 5 && count <= 6)) return true;
        if (players === '7-8' && (count >= 7 && count <= 8)) return true;
        if (players === '9-11' && (count >= 9 && count <= 11)) return true;
        if (players === '12-14' && (count >= 12 && count <= 14)) return true;
        if (players === '15+' && count >= 15) return true;
        if (String(count) === players) return true;
      }
      return false;
    }

    return true;
  });
}

export function buildTrainingSession(values, metadata = {}) {
  const date = clean(values.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new TypeError('Selecciona una fecha válida para la sesión.');
  const mainIds = [...(values.mainExerciseIds ?? [])].filter(Boolean);
  if (mainIds.length < 2 || mainIds.length > 3) throw new RangeError('La parte principal debe tener 2 o 3 ejercicios.');
  const warmupId = clean(values.warmupId);
  const finalId = clean(values.finalExerciseId);
  const available = new Set(metadata.availableExerciseIds ?? []);
  if (![warmupId, ...mainIds, finalId].every((id) => id && available.has(id))) throw new TypeError('La sesión contiene un ejercicio que ya no está disponible.');
  const duration = (raw) => {
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1 || value > 240) throw new RangeError('Cada bloque debe durar entre 1 y 240 minutos.');
    return value;
  };
  const blocks = [
    { type: 'warmup', exerciseId: warmupId, duration: duration(values.warmupDuration), notes: clean(values.warmupNotes) },
    ...mainIds.map((exerciseId, index) => ({ type: 'main', exerciseId, duration: duration(values.mainDurations?.[index]), notes: clean(values.mainNotes?.[index]) })),
    { type: 'final', exerciseId: finalId, duration: duration(values.finalDuration), notes: clean(values.finalNotes) },
  ];
  return {
    id: metadata.id,
    recordType: 'trainingSession',
    date,
    time: clean(values.time),
    pitch: clean(values.pitch),
    name: clean(values.name) || 'Sesión de entrenamiento',
    material: clean(values.material),
    notes: clean(values.notes),
    blocks,
    totalDuration: blocks.reduce((sum, block) => sum + block.duration, 0),
    createdAt: metadata.createdAt,
    updatedAt: metadata.now,
  };
}

export function sortTrainingSessions(sessions, today = '') {
  if (!Array.isArray(sessions)) throw new TypeError('Las sesiones deben ser una lista.');
  const todayKey = today || (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  return [...sessions].sort((a, b) => {
    const dateA = String(a.date || '');
    const dateB = String(b.date || '');
    const isUpcomingA = Boolean(dateA && dateA >= todayKey);
    const isUpcomingB = Boolean(dateB && dateB >= todayKey);

    // Los próximos arriba
    if (isUpcomingA && !isUpcomingB) return -1;
    if (!isUpcomingA && isUpcomingB) return 1;

    // Si ambos son próximos: de arriba abajo por orden de fecha (ascendente: hoy primero, luego mañana, etc.)
    if (isUpcomingA && isUpcomingB) {
      const cmp = dateA.localeCompare(dateB);
      if (cmp !== 0) return cmp;
      const timeCmp = String(a.time || '').localeCompare(String(b.time || ''));
      if (timeCmp !== 0) return timeCmp;
      return (a.createdAt ?? 0) - (b.createdAt ?? 0);
    }

    // Si ambos son pasados: de arriba abajo por orden de fecha más reciente
    const cmp = dateB.localeCompare(dateA);
    if (cmp !== 0) return cmp;
    const timeCmp = String(b.time || '').localeCompare(String(a.time || ''));
    if (timeCmp !== 0) return timeCmp;
    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
  });
}
