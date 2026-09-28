// Fase 3 — Tácticas: pizarra táctica con formaciones reales (F7) y explicación
// de ataque y defensa, basada en el manual de campo de Migue (Unión Viera Alevín D).
// Formato de una táctica:
//   { id, recordType:'tactic', name, rival, situation, format:'F7'|'F11',
//     formation:'1-3-2-1'|'1-2-3-1'|'1-2-2-2'|'1-3-3'|'custom',
//     team:[{x,y,n,pos}], opponent:[{x,y,n}], ball:{x,y},
//     moves:[{from:{x,y},to:{x,y},kind:'pass'|'move'|'dribble'|'shot',label}],
//     attack:[...], defense:[...], notes, createdAt, updatedAt }

const clean = (value) => String(value ?? '').trim();

export const TACTIC_FORMATS = Object.freeze(['F7', 'F11']);

// Formaciones F7 del manual de Migue (coordenadas en viewBox 0..100, campo vertical).
// Numeración del manual: 2 = defensa derecho · 3 = defensa izquierdo · 4 = central ·
// 7 = medio/banda derecha · 11 = medio/banda izquierda · 9 = delantero · 1 = portero.
// 1-3-2-1: 1 portero · 3/4/2 defensas · 11/7 medios · 9 delantero
const FORMATION_1321 = Object.freeze([
  { x: 50, y: 90, n: '1', pos: 'Portero' },
  { x: 25, y: 72, n: '3', pos: 'Defensa izq.' },
  { x: 50, y: 76, n: '4', pos: 'Central (se incorpora)' },
  { x: 75, y: 72, n: '2', pos: 'Defensa der.' },
  { x: 30, y: 48, n: '11', pos: 'Medio/banda izq.' },
  { x: 70, y: 48, n: '7', pos: 'Medio/banda der.' },
  { x: 50, y: 30, n: '9', pos: 'Delantero' },
]);

// 1-2-3-1: 1 portero · 3/2 defensas · 11/4/7 mediocampo · 9 delantero
const FORMATION_1231 = Object.freeze([
  { x: 50, y: 90, n: '1', pos: 'Portero' },
  { x: 30, y: 74, n: '3', pos: 'Defensa izq.' },
  { x: 70, y: 74, n: '2', pos: 'Defensa der.' },
  { x: 50, y: 60, n: '4', pos: 'Mediocentro' },
  { x: 30, y: 46, n: '11', pos: 'Medio/banda izq.' },
  { x: 70, y: 46, n: '7', pos: 'Medio/banda der.' },
  { x: 50, y: 30, n: '9', pos: 'Delantero' },
]);

// 1-2-2-2: 1 portero · 3/2 defensas · 4/7 medios · 11/9 arriba
const FORMATION_1222 = Object.freeze([
  { x: 50, y: 90, n: '1', pos: 'Portero' },
  { x: 30, y: 74, n: '3', pos: 'Defensa izq.' },
  { x: 70, y: 74, n: '2', pos: 'Defensa der.' },
  { x: 40, y: 58, n: '4', pos: 'Medio' },
  { x: 60, y: 58, n: '7', pos: 'Medio' },
  { x: 35, y: 38, n: '11', pos: 'Delantero izq.' },
  { x: 65, y: 38, n: '9', pos: 'Delantero der.' },
]);

const FORMATION_1312 = Object.freeze([
  { x: 50, y: 90, n: '1', pos: 'Portero' },
  { x: 24, y: 72, n: '2', pos: 'Defensa izq.' },
  { x: 50, y: 75, n: '4', pos: 'Defensa central' },
  { x: 76, y: 72, n: '3', pos: 'Defensa der.' },
  { x: 50, y: 55, n: '7', pos: 'Mediocentro' },
  { x: 34, y: 34, n: '11', pos: 'Delantero izq.' },
  { x: 66, y: 34, n: '9', pos: 'Delantero der.' },
]);

const FORMATION_1132 = Object.freeze([
  { x: 50, y: 90, n: '1', pos: 'Portero' },
  { x: 50, y: 73, n: '4', pos: 'Cierre' },
  { x: 24, y: 55, n: '2', pos: 'Medio izq.' },
  { x: 50, y: 57, n: '7', pos: 'Mediocentro' },
  { x: 76, y: 55, n: '3', pos: 'Medio der.' },
  { x: 36, y: 34, n: '11', pos: 'Delantero izq.' },
  { x: 64, y: 34, n: '9', pos: 'Delantero der.' },
]);

// 1-3-3: 1 portero · 3 defensas · 3 atacantes (dos líneas sencillas y equilibradas)
const FORMATION_133 = Object.freeze([
  { x: 50, y: 90, n: '1', pos: 'Portero' },
  { x: 24, y: 72, n: '2', pos: 'Lateral izq.' },
  { x: 50, y: 76, n: '4', pos: 'Defensa central' },
  { x: 76, y: 72, n: '3', pos: 'Lateral der.' },
  { x: 22, y: 36, n: '7', pos: 'Extremo izq.' },
  { x: 50, y: 30, n: '9', pos: 'Delantero centro' },
  { x: 78, y: 36, n: '11', pos: 'Extremo der.' },
]);

// 1-4-1-1: 1 portero · 4 defensas · 1 medio · 1 delantero (muy defensiva)
const FORMATION_1411 = Object.freeze([
  { x: 50, y: 90, n: '1', pos: 'Portero' },
  { x: 20, y: 76, n: '2', pos: 'Defensa izq.' },
  { x: 40, y: 78, n: '3', pos: 'Central izq.' },
  { x: 60, y: 78, n: '4', pos: 'Central der.' },
  { x: 80, y: 76, n: '5', pos: 'Defensa der.' },
  { x: 50, y: 55, n: '7', pos: 'Medio' },
  { x: 50, y: 30, n: '9', pos: 'Delantero' },
]);

// 1-2-1-3: 1 portero · 2 defensas · 1 medio · 3 delanteros (muy ofensiva)
const FORMATION_1213 = Object.freeze([
  { x: 50, y: 90, n: '1', pos: 'Portero' },
  { x: 30, y: 76, n: '2', pos: 'Defensa izq.' },
  { x: 70, y: 76, n: '3', pos: 'Defensa der.' },
  { x: 50, y: 58, n: '4', pos: 'Medio' },
  { x: 25, y: 34, n: '7', pos: 'Delantero izq.' },
  { x: 50, y: 30, n: '9', pos: 'Delantero centro' },
  { x: 75, y: 34, n: '11', pos: 'Delantero der.' },
]);

// 1-1-3-1-1: 1 portero · 1 defensa · 3 medios · 1 mediapunta · 1 delantero
const FORMATION_11311 = Object.freeze([
  { x: 50, y: 90, n: '1', pos: 'Portero' },
  { x: 50, y: 76, n: '4', pos: 'Defensa' },
  { x: 30, y: 55, n: '2', pos: 'Medio izq.' },
  { x: 50, y: 58, n: '3', pos: 'Medio central' },
  { x: 70, y: 55, n: '7', pos: 'Medio der.' },
  { x: 50, y: 40, n: '11', pos: 'Mediapunta' },
  { x: 50, y: 30, n: '9', pos: 'Delantero' },
]);

// 1-1-4-1: 1 portero · 1 defensa · 4 medios · 1 delantero
const FORMATION_1141 = Object.freeze([
  { x: 50, y: 90, n: '1', pos: 'Portero' },
  { x: 50, y: 76, n: '4', pos: 'Defensa' },
  { x: 25, y: 55, n: '2', pos: 'Medio izq.' },
  { x: 40, y: 58, n: '3', pos: 'Medio interior izq.' },
  { x: 60, y: 58, n: '7', pos: 'Medio interior der.' },
  { x: 75, y: 55, n: '11', pos: 'Medio der.' },
  { x: 50, y: 30, n: '9', pos: 'Delantero' },
]);

// 1-2-2-1-1: 1 portero · 2 defensas · 2 medios · 1 mediapunta · 1 delantero
const FORMATION_12211 = Object.freeze([
  { x: 50, y: 90, n: '1', pos: 'Portero' },
  { x: 30, y: 74, n: '3', pos: 'Defensa izq.' },
  { x: 70, y: 74, n: '2', pos: 'Defensa der.' },
  { x: 40, y: 58, n: '4', pos: 'Medio izq.' },
  { x: 60, y: 58, n: '7', pos: 'Medio der.' },
  { x: 50, y: 44, n: '11', pos: 'Mediapunta' },
  { x: 50, y: 30, n: '9', pos: 'Delantero' },
]);

const F7_OPPONENT = Object.freeze([
  { x: 50, y: 10, n: '1' },
  { x: 30, y: 28, n: '2' },
  { x: 50, y: 24, n: '3' },
  { x: 70, y: 28, n: '4' },
  { x: 30, y: 50, n: '5' },
  { x: 50, y: 54, n: '6' },
  { x: 70, y: 50, n: '7' },
]);

const F11_TEAM = Object.freeze([
  { x: 50, y: 92, n: '1', pos: 'Portero' },
  { x: 20, y: 78, n: '2', pos: 'Lateral izq.' },
  { x: 40, y: 80, n: '3', pos: 'Central' },
  { x: 60, y: 80, n: '4', pos: 'Central' },
  { x: 80, y: 78, n: '5', pos: 'Lateral der.' },
  { x: 30, y: 60, n: '6', pos: 'Mediocentro' },
  { x: 50, y: 58, n: '8', pos: 'Mediocentro' },
  { x: 70, y: 60, n: '10', pos: 'Mediapunta' },
  { x: 25, y: 40, n: '7', pos: 'Extremo izq.' },
  { x: 50, y: 36, n: '9', pos: 'Delantero' },
  { x: 75, y: 40, n: '11', pos: 'Extremo der.' },
]);
const F11_OPPONENT = Object.freeze([
  { x: 50, y: 8, n: '1' },
  { x: 20, y: 22, n: '2' },
  { x: 40, y: 20, n: '3' },
  { x: 60, y: 20, n: '4' },
  { x: 80, y: 22, n: '5' },
  { x: 30, y: 40, n: '6' },
  { x: 50, y: 42, n: '8' },
  { x: 70, y: 40, n: '10' },
  { x: 25, y: 60, n: '7' },
  { x: 50, y: 64, n: '9' },
  { x: 75, y: 60, n: '11' },
]);

// Explicación táctica de cada formación (del manual de Migue).
export const FORMATION_GUIDES = Object.freeze({
  '1-3-2-1': {
    name: 'Sistema base · 1-3-2-1',
    queBusco: 'Parto de tres jugadores protegiendo por detrás del balón, dos medios y un delantero. El sistema debe dar seguridad sin convertir al equipo en un bloque estático. Las posiciones son referencias iniciales; los jugadores se mueven según la jugada.',
    conBalon: [
      '2 y 3 dan amplitud en la primera línea.',
      '7 y 11 ofrecen líneas de pase por fuera y por dentro.',
      '9 mantiene profundidad y evita venir siempre al balón.',
      '4 puede abandonar la línea de tres y sumarse al mediocampo cuando existe equilibrio detrás.',
    ],
    sinBalon: [
      '3 jugadores protegen por detrás del balón.',
      'El 4 protege primero el centro.',
      'Si 2 o 3 salen a banda, el 4 corrige por dentro y cubre el espacio.',
      'No perseguir rivales por todo el campo: proteger la estructura.',
    ],
    alPerder: [
      'El 4 recupera la zona central entre 3 y 2.',
      'Correcciones: «4, vuelve», «4, entre los dos», «4, cierra dentro».',
    ],
  },
  '1-2-3-1': {
    name: 'Variante 1 · 1-2-3-1',
    queBusco: 'La utilizo cuando necesito más presencia estable en mediocampo y puedo asumir jugar con dos defensas. El 4 actúa ya como mediocentro claro.',
    conBalon: [
      'Tres referencias en mediocampo.',
      'Más apoyos para salir y circular.',
      '7 y 11 pueden dar amplitud sin dejar solo al 4.',
    ],
    sinBalon: [
      '2 y 3 no pueden quedar demasiado separados.',
      'Si 4 se va demasiado arriba, aparece espacio delante de los defensas.',
      'Tras pérdida, 4 debe reaccionar rápido para proteger el centro.',
    ],
    alPerder: ['El 4 reacciona rápido para proteger el centro.'],
  },
  '1-2-2-2': {
    name: 'Variante 2 · 1-2-2-2',
    queBusco: 'La valoro cuando necesito más presencia arriba, el 9 está muy aislado o el rival defiende muy atrás. No es una orden automática por ir perdiendo.',
    conBalon: [
      'Más presencia arriba con dos delanteros.',
      'Los dos medios dan equilibrio.',
    ],
    sinBalon: [
      'Regla de equilibrio: si uno de los dos medios avanza claramente, el otro mantiene equilibrio.',
      'Si ambos suben a la vez, el equipo queda abierto por dentro.',
    ],
    alPerder: ['Un medio mantiene equilibrio mientras el otro presiona.'],
  },
  '1-3-1-2': {
    name: 'Variante 3 · 1-3-1-2',
    queBusco: 'Mantengo una primera línea de tres y añado dos referencias arriba. Es útil para fijar a los defensas rivales y atacar con apoyos cercanos sin renunciar a la protección de la portería.',
    conBalon: [
      'Los dos delanteros se separan para no ocupar el mismo carril.',
      'El 7 se ofrece por detrás del balón y decide hacia qué lado continuar.',
      '2 y 3 avanzan por turno; si uno sube, los otros dos defensas guardan equilibrio.',
    ],
    sinBalon: [
      'El 7 protege el espacio central delante de los tres defensas.',
      'El punta más cercano orienta la salida rival hacia una banda y el otro cierra el pase interior.',
      'La línea de tres bascula junta, sin perseguir fuera de su zona.',
    ],
    alPerder: ['El 7 frena el primer pase y los dos delanteros regresan por dentro antes de abrirse.'],
  },
  '1-1-3-2': {
    name: 'Variante 4 · 1-1-3-2',
    queBusco: 'Busco superioridad en mediocampo y dos jugadores cerca de portería. Es una estructura ofensiva para momentos controlados: exige que el cierre lea bien la cobertura y que los medios reaccionen juntos tras pérdida.',
    conBalon: [
      'Los medios exteriores dan amplitud y el 7 ofrece apoyo por dentro.',
      'Los dos delanteros alternan apoyo y profundidad: uno viene y el otro ataca el espacio.',
      'El cierre conduce solo si un medio ocupa su espalda y existe pase seguro.',
    ],
    sinBalon: [
      'Los tres medios forman una línea estrecha delante del cierre.',
      'No permitir un pase directo por el centro; orientar al rival hacia fuera.',
      'El portero juega adelantado para proteger el espacio a la espalda del cierre.',
    ],
    alPerder: ['El medio más cercano presiona; los otros dos cierran dentro y uno de los delanteros baja a ayudar.'],
  },
  '1-3-3': {
    name: 'Variante 5 · 1-3-3 (dos líneas equilibradas)',
    queBusco: 'Busco una estructura equilibrada, sencilla de enseñar y comprender: una línea de tres defensas y otra de tres atacantes. El central queda libre para dar coberturas, los extremos aportan amplitud y el delantero centro es móvil.',
    conBalon: [
      'Los extremos mantienen amplitud para abrir el campo y buscar el uno contra uno, el centro o la finalización.',
      'El delantero centro se mueve para ofrecer apoyo y atacar el área, sin ocupar siempre la misma zona.',
      'El central inicia y distribuye hacia los atacantes; puede incorporarse de forma puntual si los laterales guardan la cobertura.',
      'Los laterales apoyan por turno y pueden desdoblar a los extremos sin romper el equilibrio de la línea defensiva.',
    ],
    sinBalon: [
      'El central juega libre de marcaje para cubrir al lateral que salta a banda y proteger el espacio interior.',
      'Los tres defensas basculan juntos y los atacantes se acercan para evitar una separación excesiva entre líneas.',
      'Los extremos ayudan a cerrar las bandas y el delantero centro orienta la salida rival hacia un lado.',
    ],
    alPerder: [
      'El atacante más cercano frena la salida; los otros dos repliegan para juntar las líneas.',
      'Los laterales cierran hacia dentro y el central conserva la cobertura, evitando que la pérdida deje duelos abiertos a su espalda.',
    ],
  },
  '1-4-1-1': {
    name: 'Variante 6 · 1-4-1-1 (defensa compacta)',
    queBusco: 'Busco muy poco riesgo en zona propia y una vía de progresión por el medio. Me conviene cuando quiero proteger bien la portería, cuando el rival tiene un delantero muy fuerte o cuando tengo defensas laterales que cubren bien la banda.',
    conBalon: [
      'La progresión pasa por el medio (7): recibe entre líneas, decide si circula o pasa al 9.',
      'Los laterales (2 y 5) suben por turno si el medio lo necesita; no suben siempre.',
      'Los centrales (3 y 4) mantienen la estructura: si uno sube, el otro cubre el centro.',
    ],
    sinBalon: [
      'Cuatro jugadores en la primera línea: laterales y centrales juntos cubren el campo.',
      'El medio recorta el espacio entre la defensa y el delantero.',
      'No permitir pases directos al 9 por detrás de la línea; forzar al rival hacia el lateral.',
    ],
    alPerder: ['Los laterales repliegan, el medio baja si es necesario y el delantero regresa por dentro.'],
  },
  '1-2-1-3': {
    name: 'Variante 7 · 1-2-1-3 (ataque con tres delanteros)',
    queBusco: 'Busco superioridad en zona de ataque con tres jugadores avanzados. Me conviene cuando tengo superioridad numérica, contra defensas que no presionan o cuando necesito generar ventajas por fuera con un trío delantero.',
    conBalon: [
      'Los tres delanteros se separan por carriles: uno central, dos por fuera.',
      'El medio (4) busca el pase decisivo y, después de soltar el balón, mantiene una posición de apoyo.',
      'Los defensas (2 y 3) avanzan por turno para dar una línea de pase, sin dejar desprotegida la espalda.',
      'El delantero central atrae a los defensas rivales y libera a los otros dos.',
    ],
    sinBalon: [
      'Solo dos defensas cubren el campo: cuidan el equilibrio por detrás del balón.',
      'Los tres delanteros presionan juntos si el rival sale desde el portero.',
      'El medio debe recuperar rápido y reconstruir la línea de defensa.',
    ],
    alPerder: ['El medio retrocede primero; los delanteros orientan la presión y los defensas protegen el centro antes de salir a banda.'],
  },
  '1-1-3-1-1': {
    name: 'Variante 8 · 1-1-3-1-1 (centro protegido y mediapunta)',
    queBusco: 'Busco proteger el carril central con un único defensa y tres medios, y dar a la mediapunta el papel de enlace. Me conviene cuando quiero dominar el centro y tener una referencia que conecte con el delantero.',
    conBalon: [
      'El carril central queda bien protegido por el defensa y los tres medios.',
      'La mediapunta enlaza entre los medios y el delantero.',
      'Los medios exteriores son flexibles: pueden abrirse a banda o cerrarse por dentro.',
      'El delantero puede bajar a recibir sin dejar de ser referencia.',
    ],
    sinBalon: [
      'El único defensa necesita ayudas constantes de los medios.',
      'La mediapunta ayuda a cerrar por dentro.',
      'Los exteriores retornan para no dejar el centro abierto.',
    ],
    alPerder: ['La mediapunta frena el primer pase; los medios cierran dentro y el delantero orienta la salida rival.'],
  },
  '1-1-4-1': {
    name: 'Variante 9 · 1-1-4-1 (dominio con cuatro medios)',
    queBusco: 'Busco dominar el balón con cuatro centrocampistas y un único defensa rápido que corrige. Me conviene cuando quiero mucha posesión y tengo un defensa contundente y medios con recorrido.',
    conBalon: [
      'Los cuatro medios concentran el dominio del juego.',
      'Los exteriores dan amplitud y deben retornar.',
      'El delantero fija y puede bajar como falso 9.',
      'El único defensa corrige y protege la espalda.',
    ],
    sinBalon: [
      'El único defensa no puede quedar aislado.',
      'Los medios de banda retornan para recomponer la línea.',
      'Se puede transformar en 3-2-1 o en línea de 4 según la necesidad.',
    ],
    alPerder: ['Los medios exteriores bajan a ambos lados del defensa; si hace falta, un interior baja para formar línea de 4.'],
  },
  '1-2-2-1-1': {
    name: 'Variante 10 · 1-2-2-1-1 (carril central cerrado)',
    queBusco: 'Busco cerrar el carril central con cinco jugadores (dos defensas, dos medios y la mediapunta) y obligar al rival a progresar por fuera. Me conviene contra equipos que atacan por dentro.',
    conBalon: [
      'La mediapunta enlaza entre los medios y el delantero.',
      'Los dos medios y los dos defensas se mueven de forma coordinada.',
      'El delantero queda como referencia alta.',
      'Se puede transformar por dentro: un medio baja a la línea de 3 o el 9 cae como falso 9.',
    ],
    sinBalon: [
      'Cinco jugadores protegen el carril central.',
      'El bloque bascula hacia el lado del balón y achica espacio.',
      'Se concentran ayudas cerca del balón para robar en banda.',
    ],
    alPerder: ['La mediapunta frena el primer pase; el bloque bascula y el delantero ofrece la salida tras el robo.'],
  },
});

export const FORMATION_NAMES = Object.freeze(['1-3-2-1', '1-2-3-1', '1-2-2-2', '1-3-1-2', '1-1-3-2', '1-3-3', '1-4-1-1', '1-2-1-3', '1-1-3-1-1', '1-1-4-1', '1-2-2-1-1']);

export function defaultTactic(format = 'F7', formation = '1-3-2-1') {
  const isF11 = format === 'F11';
  const formations = { '1-3-2-1': FORMATION_1321, '1-2-3-1': FORMATION_1231, '1-2-2-2': FORMATION_1222, '1-3-1-2': FORMATION_1312, '1-1-3-2': FORMATION_1132, '1-3-3': FORMATION_133, '1-4-1-1': FORMATION_1411, '1-2-1-3': FORMATION_1213, '1-1-3-1-1': FORMATION_11311, '1-1-4-1': FORMATION_1141, '1-2-2-1-1': FORMATION_12211 };
  const team = isF11
    ? F11_TEAM.map((p) => ({ ...p }))
    : (formations[formation] || FORMATION_1321).map((p) => ({ ...p }));
  return {
    format,
    formation: isF11 ? 'custom' : (FORMATION_NAMES.includes(formation) ? formation : '1-3-2-1'),
    team,
    opponent: (isF11 ? F11_OPPONENT : F7_OPPONENT).map((p) => ({ ...p })),
    ball: { x: 50, y: 50 },
    moves: [],
    attack: [],
    defense: [],
  };
}

const xml = (value) => clean(value).replace(/[&<>\"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&apos;' })[c]);

const arrowStyle = (kind) => {
  const styles = {
    pass:   { cls: 'tac-arrow pac',  stroke: '#2b6cb0', dash: 'none',    weight: 1.4 },
    move:   { cls: 'tac-arrow mov',  stroke: '#6b6b6b', dash: '6 4',    weight: 1.2 },
    dribble:{ cls: 'tac-arrow dri',  stroke: '#7c3aed', dash: '4 2',    weight: 2.2 },
    shot:   { cls: 'tac-arrow tiq',  stroke: '#e8590c', dash: 'none',    weight: 2.6 },
    sprint: { cls: 'tac-arrow spr',  stroke: '#f6cf4c', dash: '3 1.5',  weight: 2.0 },
  };
  return styles[kind] ?? { cls: 'tac-arrow pac', stroke: '#2b6cb0', dash: 'none', weight: 1.4 };
};

const actionLabel = (kind) => {
  const defs = {
    pass: 'Pase', move: 'Movimiento sin balón', dribble: 'Conducción', shot: 'Disparo', sprint: 'Sprint',
  };
  return `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:.6rem">${renderTacticToolIcon(kind)}${defs[kind] ?? 'Pase'}</span>`;
};

// Herramientas de la pizarra interactiva.
export const TACTIC_TOOLS = Object.freeze([
  { id: 'select', label: 'Mover' },
  { id: 'pass', label: 'Pase' },
  { id: 'move', label: 'Movimiento' },
  { id: 'dribble', label: 'Conducción' },
  { id: 'shot', label: 'Disparo' },
  { id: 'sprint', label: 'Sprint' },
  { id: 'ball', label: 'Balón' },
  { id: 'erase', label: 'Borrar línea' },
  { id: 'clear', label: 'Borrar todo' },
]);

export function renderTacticToolIcon(kind) {
  const common = 'class="tactic-tool-icon" viewBox="0 0 32 18" aria-hidden="true" focusable="false"';
  if (kind === 'select') return `<svg ${common}><path d="M7 9h18M16 2v14M7 9l4-4M7 9l4 4M25 9l-4-4M25 9l-4 4M16 2l-4 4M16 2l4 4M16 16l-4-4M16 16l4-4" fill="none" stroke="#1a1a1a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  if (kind === 'ball') return `<svg ${common}><circle cx="16" cy="9" r="5" fill="#fff" stroke="#111" stroke-width="1.2"/><path d="M16 5.5l2 1.5-.8 2.4h-2.4L14 7zM11.4 8l2.6-1M18 7l2.6 1M14.8 9.4l-1.5 3M17.2 9.4l1.5 3" fill="none" stroke="#111" stroke-width=".7"/></svg>`;
  if (kind === 'erase') return `<svg ${common}><path d="M4 9h24M9 9l1-4h12l1 4M8 9l1 8h14l1-8M12 9v6M20 9v6" fill="none" stroke="#6b6b6b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  if (kind === 'clear') return `<svg ${common}><path d="M6 9h20M10 9l1-4h10l1 4M9 9l1 8h12l1-8" fill="none" stroke="#6b6b6b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 6h6" stroke="#6b6b6b" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  const s = arrowStyle(kind);
  const markerId = `tool-arrow-${kind}-${++toolIconSeq}`;
  return `<svg ${common}><defs><marker id="${markerId}" markerWidth="2" markerHeight="2" refX="2" refY="1" orient="auto"><path d="M0 0 L2 1 L0 2z" fill="context-stroke"/></marker></defs><path d="M3 9 L27 9" class="${s.cls}" stroke="${s.stroke}" stroke-width="${s.weight}" fill="none" stroke-dasharray="${s.dash}" stroke-linecap="round" marker-end="url(#${markerId})"/></svg>`;
}

const TOOL_KINDS = new Set(['pass', 'move', 'dribble', 'shot', 'sprint']);
let toolIconSeq = 0;

// Crea una flecha táctica; devuelve null si el trazo es demasiado corto.
export function createTacticMove(from, to, kind) {
  if (!TOOL_KINDS.has(kind)) throw new TypeError('Herramienta de flecha no válida.');
  if (Math.hypot(to.x - from.x, to.y - from.y) <= 2) return null;
  return { from: { ...from }, to: { ...to }, kind };
}

export function renderTacticArrow(from, to, kind, markerId = 'tac-arrow-shared', idx = '') {
  const s = arrowStyle(kind);
  const idxAttr = idx !== '' ? ` data-idx="${idx}"` : '';
  return `<path class="${s.cls}" d="M${from.x} ${from.y} L${to.x} ${to.y}" stroke="${s.stroke}" stroke-width="${s.weight}" fill="none" stroke-dasharray="${s.dash}" marker-end="url(#${markerId})" data-piece="arrow" data-kind="${xml(kind)}"${idxAttr}/>`;
}

export function renderTacticArrowDefs(markerId = 'tac-arrow-shared') { return marker(markerId); }

// Mueve una pieza (jugador, rival o balón) sin mutar la táctica original y
// limitando las coordenadas al campo (4..96).
export function moveTacticPiece(tactic, side, idx, point) {
  const clamp = (v) => Math.max(4, Math.min(96, v));
  const t = { ...tactic, team: tactic.team.map((p) => ({ ...p })), opponent: tactic.opponent.map((p) => ({ ...p })), ball: { ...tactic.ball } };
  const p = { x: clamp(point.x), y: clamp(point.y) };
  if (side === 'team') { if (!t.team[idx]) throw new TypeError('Pieza no válida.'); t.team[idx] = { ...t.team[idx], ...p }; }
  else if (side === 'opponent') { if (!t.opponent[idx]) throw new TypeError('Pieza no válida.'); t.opponent[idx] = { ...t.opponent[idx], ...p }; }
  else if (side === 'ball') { t.ball = p; }
  else throw new TypeError('Pieza no válida.');
  return t;
}

// Renderiza la pizarra táctica como SVG interactivo (arrastrar jugadores,
// dibujar flechas, colocar balón). Los elementos llevan data-atributos para
// que app.js maneje los eventos de puntero.
export function renderTacticBoard(tactic = {}, options = {}) {
  const t = { ...defaultTactic(tactic.format || 'F7', tactic.formation), ...tactic };
  const editable = options.editable !== false;
  const markerId = `tac-arrow-${clean(t.id || 'nueva').replace(/[^a-z0-9-]/gi, '')}`;
  const parts = [];
  parts.push('<rect class="tac-field" x="4" y="4" width="92" height="92" rx="3"/>');
  parts.push('<path class="tac-line" d="M50 4v92 M4 50h92"/>');
  parts.push('<circle class="tac-line" cx="50" cy="50" r="9"/>');
  parts.push('<rect class="tac-area" x="4" y="4" width="92" height="16"/>');
  parts.push('<rect class="tac-area" x="4" y="80" width="92" height="16"/>');
  if (editable) parts.push('<rect class="tac-capture" x="4" y="4" width="92" height="92" data-piece="capture"/>');
  for (let i = 0; i < (t.moves || []).length; i++) {
    const move = t.moves[i];
    parts.push(renderTacticArrow(move.from, move.to, move.kind, markerId, i));
  }
  for (let i = 0; i < (t.team || []).length; i++) {
    const p = t.team[i];
    parts.push(`<g class="tac-player" data-piece="team" data-idx="${i}"><circle cx="${p.x}" cy="${p.y}" r="4.2"/><text x="${p.x}" y="${p.y + 1.3}" class="tac-player-num">${xml(p.n)}</text></g>`);
  }
  for (let i = 0; i < (t.opponent || []).length; i++) {
    const p = t.opponent[i];
    parts.push(`<g class="tac-opponent" data-piece="opponent" data-idx="${i}"><circle cx="${p.x}" cy="${p.y}" r="4.0"/><text x="${p.x}" y="${p.y + 1.3}" class="tac-opp-num">${xml(p.n)}</text></g>`);
  }
  const ball = t.ball || { x: 50, y: 50 };
  parts.push(`<g class="tac-ball" data-piece="ball"><circle cx="${ball.x}" cy="${ball.y}" r="2.4" fill="#fff" stroke="#111" stroke-width="0.6"/></g>`);
  const swatches = `<span class="tac-legend-team">●</span> = mi equipo<span class="tac-legend-rival">●</span> = rival<span style="display:inline-flex;align-items:center;margin-right:.6rem"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#fff;border:1px solid #111;margin-right:4px"></span>balón</span>`;
  const arrowSwatches = (t.moves || []).length > 0
    ? [...new Set((t.moves || []).map((m) => m.kind || 'pass'))].map(actionLabel).join('')
    : '<span style="color:#888">dibujar flechas con las herramientas de arriba</span>';
  return `<figure class="tactic-board"><svg viewBox="0 0 100 100" role="img" aria-label="Pizarra táctica de ${xml(t.name || 'táctica')}">${marker(markerId)}${parts.join('')}</svg><p class="board-legend"><strong>Leyenda:</strong> ${swatches} ${arrowSwatches}</p></figure>`;
}

// Genera los markers SVG para las flechas. Usa fill="context-stroke" para que
// el marker herede el color del trazo de la flecha padre (no negro fijo).
// Tamaño reducido (2×2) para que la punta no sea enorme.
const marker = (id) => {
  const colors = ['#2b6cb0', '#6b6b6b', '#7c3aed', '#e8590c', '#f6cf4c'];
  let defs = '<defs>';
  for (const color of colors) {
    const mid = `${id}-${color.replace('#', '')}`;
    defs += `<marker id="${mid}" markerWidth="2" markerHeight="2" refX="2" refY="1" orient="auto"><path d="M0 0 L2 1 L0 2z" fill="context-stroke"/></marker>`;
  }
  defs += `<marker id="${id}" markerWidth="2" markerHeight="2" refX="2" refY="1" orient="auto"><path d="M0 0 L2 1 L0 2z" fill="context-stroke"/></marker>`;
  defs += '</defs>';
  return defs;
};

export function buildTactic(values, metadata = {}) {
  const name = clean(values.name);
  if (!name) throw new TypeError('La táctica necesita un nombre.');
  const format = clean(values.format) || 'F7';
  if (!TACTIC_FORMATS.includes(format)) throw new TypeError('Selecciona un formato válido.');
  const formation = clean(values.formation) || '1-3-2-1';
  return {
    id: metadata.id,
    recordType: 'tactic',
    name,
    rival: clean(values.rival),
    situation: clean(values.situation),
    format,
    formation: FORMATION_NAMES.includes(formation) ? formation : 'custom',
    team: Array.isArray(values.team) ? values.team : defaultTactic(format, formation).team,
    opponent: Array.isArray(values.opponent) ? values.opponent : defaultTactic(format, formation).opponent,
    ball: values.ball || { x: 50, y: 50 },
    moves: Array.isArray(values.moves) ? values.moves : [],
    attack: Array.isArray(values.attack) ? values.attack : [],
    defense: Array.isArray(values.defense) ? values.defense : [],
    notes: clean(values.notes),
    createdAt: metadata.createdAt,
    updatedAt: metadata.now,
  };
}

export function sortTactics(tactics) {
  if (!Array.isArray(tactics)) throw new TypeError('Las tácticas deben ser una lista.');
  return [...tactics].sort((a, b) => String(b.updatedAt || 0) - String(a.updatedAt || 0));
}
