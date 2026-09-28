// Tácticas del manual de Migue (Unión Viera Alevín D).
// Cada táctica es una ficha completa con bloques. La pizarra táctica personal
// de Migue es independiente del GIF: se abre plegada y no reproduce los
// movimientos de la animación.
// Estructura: { id, nombre, formacion, organizacion, principio, framesManifest,
//   team?, bloques[] }
// Cada bloque: { id, orden, nombre_corto, titulo, objetivo, idea_clave,
//   decisiones[], que_vigilar[], consignas[], errores[], animacion, fuente }
// `framesManifest` apunta al manifiesto de duraciones de esa táctica (módulo
// tactica-XXXX-frames.js). `team` (opcional) permite una numeración de dorsales
// distinta de la canónica de tactics.js para que la pizarra coincida con el GIF.

import { TACTICA_1231_FRAMES } from './tactica-1231-frames.js';
import { TACTICA_1213_FRAMES } from './tactica-1213-frames.js';
import { TACTICA_1321_FRAMES } from './tactica-1321-frames.js';
import { TACTICA_1222_FRAMES } from './tactica-1222-frames.js';
import { TACTICA_1132_FRAMES } from './tactica-1132-frames.js';
import { TACTICA_133_FRAMES } from './tactica-133-frames.js';
import { TACTICA_1312_FRAMES } from './tactica-1312-frames.js';
import { TACTICA_FINAL_FRAMES } from './tactica-final-frames.js';
import { TACTICA_11311_FRAMES } from './tactica-11311-frames.js';
import { TACTICA_1141_FRAMES } from './tactica-1141-frames.js';
import { TACTICA_1411_FRAMES } from './tactica-1411-frames.js';
import { TACTICA_12211_FRAMES } from './tactica-12211-frames.js';

export const TACTICAS_INTERACTIVAS = Object.freeze([
{
  "id": "CAMPOBASE-TACTICA-1321-GUIA-COMPLETA",
  "nombre": "Sistema 1-3-2-1",
  "formacion": "1-3-2-1",
  "organizacion": "1 portero · 3 defensas · 2 medios · 1 delantero",
  "principio": "El sistema exige compensaciones constantes: si todos van, alguien debe cubrir.",
  "framesManifest": TACTICA_1321_FRAMES,
  "team": [
    { "x": 50, "y": 90, "n": "1", "pos": "Portero" },
    { "x": 25, "y": 72, "n": "2", "pos": "Carrilero izq." },
    { "x": 75, "y": 72, "n": "3", "pos": "Carrilero der." },
    { "x": 50, "y": 76, "n": "4", "pos": "Central" },
    { "x": 30, "y": 48, "n": "5", "pos": "Medio izq." },
    { "x": 70, "y": 48, "n": "6", "pos": "Medio der." },
    { "x": 50, "y": 30, "n": "7", "pos": "Delantero" }
  ],
  "bloques": [
    {
      "id": "bloque-1-funciones",
      "orden": 1,
      "nombre_corto": "Funciones",
      "titulo": "Posicionamiento y funciones",
      "objetivo": "Entender la estructura base del 1-3-2-1 y qué función cumple cada jugador para no romper el sistema.",
      "idea_clave": "Si todos van, alguien debe compensar.",
      "decisiones": [
        "2 y 3 son carrileros: dan amplitud, suben y bajan.",
        "4 es el único central y necesita ayudas constantes.",
        "5 y 6 son box-to-box: atacan y defienden.",
        "Si un carrilero sube, un mediocentro cubre su espalda.",
        "7 puede fijar, bajar a recibir o caer a banda para hacer jugar."
      ],
      "que_vigilar": [
        "Amplitud real de 2 y 3.",
        "Ayudas constantes al 4.",
        "Recorrido completo de 5 y 6."
      ],
      "consignas": ["Dos y tres, amplitud", "Cuatro protegido", "Cinco y seis, box-to-box"],
      "errores": [
        "Carrileros que no bajan.",
        "Dejar solo al 4.",
        "Todos arriba sin compensar."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1321-GUIA-COMPLETA/bloque-1/frames/f",
        "total": 196
      },
      "fuente": { "documento": "Táctica 1-3-2-1 · Bloque 1 (Posicionamiento y funciones)", "seccion": "Posicionamiento y funciones" }
    },
    {
      "id": "bloque-2-salida",
      "orden": 2,
      "nombre_corto": "Salida",
      "titulo": "Salida de balón",
      "objetivo": "Enseñar distintas salidas de balón: por dentro, con el portero o en largo.",
      "idea_clave": "Superioridad para salir, portero jugador y largo con intención.",
      "decisiones": [
        "Primera salida: 4 contra 1 con 2 y 3 bajando.",
        "Si presionan, jugar largo a 5 o 6 en banda.",
        "Si 7 domina el juego aéreo, puede recibir largo y descargar.",
        "Otra opción mete al portero con el 4 para crear superioridad.",
        "Si el receptor está marcado, el pase va al espacio, no al pie."
      ],
      "que_vigilar": [
        "Superioridad numérica en la salida.",
        "Amplitud de 2 y 3 para cambiar de orientación.",
        "Segunda jugada tras el balón largo."
      ],
      "consignas": ["Salimos con superioridad", "Portero, jugador", "Largo con intención"],
      "errores": [
        "Salir sin superioridad.",
        "Jugar largo sin preparar la segunda jugada.",
        "Pasar al pie cuando el receptor está marcado."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1321-GUIA-COMPLETA/bloque-2/frames/f",
        "total": 194
      },
      "fuente": { "documento": "Táctica 1-3-2-1 · Bloque 2 (Salida de balón)", "seccion": "Salida de balón" }
    },
    {
      "id": "bloque-3-ataque",
      "orden": 3,
      "nombre_corto": "Ataque",
      "titulo": "Ataque y progresión",
      "objetivo": "Progresar en campo rival sin convertirse en un embudo, con amplitud, movilidad y equilibrio.",
      "idea_clave": "Atacar con amplitud, movilidad y equilibrio preventivo.",
      "decisiones": [
        "2 y 3 siguen dando amplitud para abrir huecos interiores.",
        "7 puede bajar como mediapunta para hacer jugar.",
        "Si 7 baja, el carrilero contrario ataca el área como delantero.",
        "El carrilero del lado del balón llega alto a zona de centro.",
        "Un mediocentro llega a remate; el otro protege la transición."
      ],
      "que_vigilar": [
        "Amplitud para no hacer un embudo.",
        "Llegada del carrilero contrario al área.",
        "Equilibrio preventivo del medio que se queda."
      ],
      "consignas": ["Amplitud siempre", "Siete hace jugar", "Uno llega, otro equilibra"],
      "errores": [
        "Convertirse en un embudo.",
        "Subir los dos medios a la vez.",
        "Perder la amplitud al atacar."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1321-GUIA-COMPLETA/bloque-3/frames/f",
        "total": 191
      },
      "fuente": { "documento": "Táctica 1-3-2-1 · Bloque 3 (Ataque y progresión)", "seccion": "Ataque y progresión" }
    },
    {
      "id": "bloque-4-defensa",
      "orden": 4,
      "nombre_corto": "Defensa",
      "titulo": "Defensa por carriles y basculaciones",
      "objetivo": "Defender juntos cuando el rival mueve el balón por carriles, protegiendo el centro y al único central.",
      "idea_clave": "Defender juntos y no dejar solo al 4.",
      "decisiones": [
        "La prioridad es proteger el carril central.",
        "Si el balón va a banda, todo el bloque bascula.",
        "El carrilero del lado del balón salta a presionar.",
        "Si ese carrilero salta, un mediocentro cubre por dentro.",
        "El lado débil se cierra hacia dentro para proteger el área."
      ],
      "que_vigilar": [
        "Basculación colectiva al lado del balón.",
        "Cobertura interior tras el salto del carrilero.",
        "Ayuda al 4 en el pasillo interior."
      ],
      "consignas": ["Centro protegido", "Todos basculamos", "Cuatro nunca solo"],
      "errores": [
        "Dejar el centro abierto.",
        "Saltar sin cobertura interior.",
        "No bascular como bloque."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1321-GUIA-COMPLETA/bloque-4/frames/f",
        "total": 193
      },
      "fuente": { "documento": "Táctica 1-3-2-1 · Bloque 4 (Defensa por carriles y basculaciones)", "seccion": "Defensa por carriles y basculaciones" }
    }
  ]
},
{
  "id": "CAMPOBASE-TACTICA-1231-GUIA-COMPLETA",
  "nombre": "Sistema 1-2-3-1",
  "formacion": "1-2-3-1",
  "organizacion": "1 portero · 2 defensas · 3 medios · 1 delantero",
  "principio": "Provocar una decisión rival y reconocer qué compañero o espacio queda libre.",
  "framesManifest": TACTICA_1231_FRAMES,
  "bloques": [
    {
      "id": "bloque-1-funciones",
      "orden": 1,
      "nombre_corto": "Funciones",
      "titulo": "Posiciones, variantes y funciones",
      "objetivo": "Comprender cómo se transforma el 1-2-3-1 sin convertir las posiciones en lugares rígidos.",
      "idea_clave": "Si uno abandona su zona, otro ocupa o protege el espacio que deja.",
      "decisiones": [
        "Elegir exteriores como interiores o carrileros según el partido.",
        "Si un defensa sale a banda, el otro protege el centro.",
        "Si el 9 abandona el carril central, el 4 puede atacarlo."
      ],
      "que_vigilar": [
        "Equilibrio entre 3 y 2.",
        "Apoyos cercanos al 4.",
        "Amplitud real de 11 y 7."
      ],
      "consignas": ["Uno sale, otro cubre", "Cuatro, apoyo", "Nueve fija"],
      "errores": [
        "Posiciones estáticas.",
        "Dejar solo al 4.",
        "Moverse sin cubrir el espacio liberado."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1231-GUIA-COMPLETA/bloque-1/frames/f",
        "total": 189
      },
      "fuente": { "documento": "Táctica 1-2-3-1 · Bloque 1 (Funciones)", "seccion": "Funciones" }
    },
    {
      "id": "bloque-2-salida",
      "orden": 2,
      "nombre_corto": "Salida",
      "titulo": "Salida de balón",
      "objetivo": "Superar la primera presión mediante superioridad, fijación y elección del jugador libre.",
      "idea_clave": "Poseedor → rival que salta → compañero que queda libre.",
      "decisiones": [
        "Portero, 3 y 2 generan el 3 contra 1.",
        "El defensa libre conduce hasta fijar.",
        "Si cierran fuera, usar al 9 de cara; si no conviene jugar corto, directo hacia banda."
      ],
      "que_vigilar": [
        "Distancias de la primera línea.",
        "Pase después de fijar.",
        "Segunda jugada protegida."
      ],
      "consignas": ["Defensa libre", "Conduce y fija", "Nueve, de cara", "Atrae y cambia"],
      "errores": [
        "Pasar demasiado pronto.",
        "Cerrar los dos exteriores.",
        "Jugar directo al centro sin equilibrio."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1231-GUIA-COMPLETA/bloque-2/frames/f",
        "total": 196
      },
      "fuente": { "documento": "Táctica 1-2-3-1 · Bloque 2 (Salida de balón)", "seccion": "Salida de balón" }
    },
    {
      "id": "bloque-3-ataque",
      "orden": 3,
      "nombre_corto": "Ataque",
      "titulo": "Ataque organizado",
      "objetivo": "Crear ventajas cuando el balón ya está controlado en la zona media o alta.",
      "idea_clave": "Circular o conducir, provocar el salto y atacar inmediatamente el espacio liberado.",
      "decisiones": [
        "El defensa libre progresa.",
        "Si sale un central rival, el 9 rompe a su espalda.",
        "Si el 9 viene, 4, 7 u 11 atacan el carril que libera."
      ],
      "que_vigilar": [
        "Momento de la ruptura.",
        "Amplitud del lado contrario.",
        "Paciencia si el rival bascula bien."
      ],
      "consignas": ["Si sale, espalda", "Si cierran, fuera", "Nueve viene; otro rompe"],
      "errores": [
        "Romper antes del salto.",
        "Acercarse todos al balón.",
        "Forzar cuando el rival está bien colocado."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1231-GUIA-COMPLETA/bloque-3/frames/f",
        "total": 196
      },
      "fuente": { "documento": "Táctica 1-2-3-1 · Bloque 3 (Ataque organizado)", "seccion": "Ataque organizado" }
    },
    {
      "id": "bloque-4-defensa",
      "orden": 4,
      "nombre_corto": "Defensa",
      "titulo": "Defensa organizada",
      "objetivo": "Orientar, bascular, cubrir y reorganizarse desde bloque alto hasta bloque bajo.",
      "idea_clave": "Balón rival → jugador que sale → compañero que cubre → equipo que bascula.",
      "decisiones": [
        "El 9 orienta la salida hacia banda.",
        "El exterior cercano presiona y el bloque achica.",
        "En bloque bajo, 11–3–2–7 forman la línea de cuatro y el 4 protege delante."
      ],
      "que_vigilar": [
        "Intensidad y dirección del 9.",
        "Cobertura interior.",
        "Retorno de los exteriores."
      ],
      "consignas": ["Orienta a banda", "Todos basculamos", "Centro cerrado", "Si no robamos, replegamos"],
      "errores": [
        "Presionar uno solo.",
        "Saltar dos al mismo rival.",
        "Mantener una presión cuando el bloque está roto."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1231-GUIA-COMPLETA/bloque-4/frames/f",
        "total": 196
      },
      "fuente": { "documento": "Táctica 1-2-3-1 · Bloque 4 (Defensa)", "seccion": "Defensa organizada" }
    },
    {
      "id": "bloque-5-transicion",
      "orden": 5,
      "nombre_corto": "Transición",
      "titulo": "Transición defensa–ataque",
      "objetivo": "Atacar el desorden rival desde el instante anterior a la recuperación.",
      "idea_clave": "La contra empieza antes del robo, pero la primera acción después de recuperar debe asegurar el balón.",
      "decisiones": [
        "Antes del robo, 7 reconoce la banda libre y 9 prepara la diagonal.",
        "Quien recupera busca primero un pase seguro y cercano al 4.",
        "El 4 activa al jugador exterior; el 9 ofrece apoyo y después ataca profundidad."
      ],
      "que_vigilar": [
        "Preparación antes del robo.",
        "Primer pase seguro.",
        "Acelerar solo cuando aparece la ventaja."
      ],
      "consignas": ["Preparados antes", "Primero seguro", "Ahora acelera", "Apoyo y ruptura"],
      "errores": [
        "Salir todos antes de recuperar.",
        "Intentar el pase lejano desde el robo.",
        "Acelerar sin haber asegurado la posesión."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1231-GUIA-COMPLETA/bloque-5/frames/f",
        "total": 196
      },
      "fuente": { "documento": "Táctica 1-2-3-1 · Bloque 5 (Transición)", "seccion": "Transición defensa–ataque" }
    }
  ]
},
{
  "id": "CAMPOBASE-TACTICA-1213-GUIA-COMPLETA",
  "nombre": "Sistema 1-2-1-3",
  "formacion": "1-2-1-3",
  "organizacion": "1 portero · 2 defensas · 1 medio · 3 delanteros",
  "principio": "El sistema se interpreta por funciones, no por posiciones rígidas: cada movimiento exige una compensación colectiva.",
  "framesManifest": TACTICA_1213_FRAMES,
  "team": [
    { "x": 50, "y": 90, "n": "1", "pos": "Portero" },
    { "x": 30, "y": 76, "n": "4", "pos": "Defensa izq." },
    { "x": 70, "y": 76, "n": "5", "pos": "Defensa der." },
    { "x": 50, "y": 58, "n": "6", "pos": "Mediocentro" },
    { "x": 25, "y": 34, "n": "8", "pos": "Delantero izq." },
    { "x": 50, "y": 30, "n": "9", "pos": "Delantero centro" },
    { "x": 75, "y": 34, "n": "10", "pos": "Delantero der." }
  ],
  "bloques": [
    {
      "id": "bloque-1-funciones",
      "orden": 1,
      "nombre_corto": "Funciones",
      "titulo": "Posicionamiento, variantes y funciones",
      "objetivo": "Comprender la estructura base 1-2-1-3 y las dobles funciones según balón, compañero y espacio.",
      "idea_clave": "Si un jugador abre, otro protege u ocupa el espacio interior.",
      "decisiones": [
        "8 y 10 se abren como carrileros o se meten por dentro como mediapuntas.",
        "Si 8/10 están por dentro, 4 y 5 dan amplitud.",
        "Si un central se proyecta, los demás compensan.",
        "6 baja y equilibra cuando un defensor sale o aparece una pérdida."
      ],
      "que_vigilar": [
        "Equilibrio cuando 8/10 se abren o se meten por dentro.",
        "Amplitud desde 4/5 cuando 8/10 están por dentro.",
        "Lectura del 6 para sostener o bajar."
      ],
      "consignas": ["Uno abre, otro cubre", "Seis sostiene", "Cuatro y cinco dan amplitud"],
      "errores": [
        "Enseñar el sistema como posiciones inmóviles.",
        "Abrir sin proteger el espacio interior.",
        "Salir 4/5 sin que 6 lea cuándo sostener o bajar."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1213-GUIA-COMPLETA/bloque-1/frames/f",
        "total": 196
      },
      "fuente": { "documento": "Táctica 1-2-1-3 · Bloque 1 (Posicionamiento y funciones)", "seccion": "Posicionamiento, variantes y funciones" }
    },
    {
      "id": "bloque-2-defensa",
      "orden": 2,
      "nombre_corto": "Defensa",
      "titulo": "Comportamiento defensivo",
      "objetivo": "Proteger el carril central, bascular juntos y defender el área con superioridad.",
      "idea_clave": "Centro antes que banda; balón fuera, bloque junto.",
      "decisiones": [
        "Orientar al rival hacia banda y tapar el carril central.",
        "Temporizar el 1 contra 1 y esperar ayudas.",
        "En bloque bajo, cerrar el área con línea de 5."
      ],
      "que_vigilar": [
        "Basculación colectiva al lado del balón.",
        "Ayudas y defensa del centro.",
        "8 y 10 también defienden."
      ],
      "consignas": ["Centro antes que banda", "Balón fuera, bloque junto", "Temporiza antes de entrar"],
      "errores": [
        "Perseguir al rival y dejar el centro abierto.",
        "Entrar al 1 contra 1 sin esperar ayudas.",
        "No replegar a línea de 5 cuando el rival hunde."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1213-GUIA-COMPLETA/bloque-2/frames/f",
        "total": 196
      },
      "fuente": { "documento": "Táctica 1-2-1-3 · Bloque 2 (Comportamiento defensivo)", "seccion": "Comportamiento defensivo" }
    },
    {
      "id": "bloque-3-salida",
      "orden": 3,
      "nombre_corto": "Salida",
      "titulo": "Salida de balón",
      "objetivo": "Salir en corto y en largo usando la amplitud de 8 y 10 para estirar al rival.",
      "idea_clave": "Abrir, fijar y encontrar al libre.",
      "decisiones": [
        "Fijar al rival por fuera y usar la amplitud de 8 y 10.",
        "4 recibe y conduce; si saltan a 4, aparece 6.",
        "Si saltan a 6, cambio al lado libre con 5.",
        "Alternativa de juego largo con 9, 8 y 10 preparados para la caída."
      ],
      "que_vigilar": [
        "8 y 10 realmente abiertos y altos.",
        "6 visible como apoyo central.",
        "El poseedor fija antes de soltar."
      ],
      "consignas": ["Abre, fija y encuentra al libre", "Cuatro conduce", "Seis, apoyo central"],
      "errores": [
        "Pasar sin fijar al rival.",
        "No usar la amplitud de 8 y 10.",
        "Jugar largo sin preparar la caída y la segunda jugada."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1213-GUIA-COMPLETA/bloque-3/frames/f",
        "total": 196
      },
      "fuente": { "documento": "Táctica 1-2-1-3 · Bloque 3 (Salida de balón)", "seccion": "Salida de balón" }
    }
  ]
},
{
  "id": "CAMPOBASE-TACTICA-1222-GUIA-COMPLETA",
  "nombre": "Sistema 1-2-2-2",
  "formacion": "1-2-2-2",
  "organizacion": "1 portero · 2 defensas · 2 medios · 2 delanteros",
  "principio": "El sistema se juega en dos de los tres carriles y deja uno libre a propósito: el bloque se mueve como una piña y la amplitud se ocupa, no se vive pegado a banda.",
  "framesManifest": TACTICA_1222_FRAMES,
  "team": [
    { "x": 50, "y": 90, "n": "1", "pos": "Portero" },
    { "x": 30, "y": 76, "n": "4", "pos": "Defensa izq." },
    { "x": 70, "y": 76, "n": "5", "pos": "Defensa der." },
    { "x": 40, "y": 58, "n": "6", "pos": "Medio izq." },
    { "x": 60, "y": 58, "n": "8", "pos": "Medio der." },
    { "x": 35, "y": 40, "n": "9", "pos": "Delantero izq." },
    { "x": 65, "y": 40, "n": "10", "pos": "Delantero der." }
  ],
  "bloques": [
    {
      "id": "bloque-1-funciones",
      "orden": 1,
      "nombre_corto": "Funciones",
      "titulo": "Posicionamiento y movimientos reales",
      "objetivo": "Entender la estructura base 1-2-2-2 y cómo el bloque se mueve compacto ocupando dos carriles y dejando uno libre.",
      "idea_clave": "Juntos como una piña, dos carriles activos y uno libre.",
      "decisiones": [
        "Estructura inicial 1-2-2-2, equipo compacto.",
        "Balón a banda: un central sale a banda y actúa como central-lateral.",
        "Un centrocampista se convierte en carrilero.",
        "Un delantero cae al mismo lado; el resto acompaña.",
        "Por el centro, los dos centrales cierran y los medios pueden salir a bandas.",
        "Tras pérdida, la cercanía permite achicar y recuperar alrededor del balón."
      ],
      "que_vigilar": [
        "Compactación del bloque al moverse.",
        "Dos carriles activos y uno libre de forma intencionada.",
        "Acompañamiento del bloque cuando uno va a banda."
      ],
      "consignas": ["Juntos como una piña", "Dos carriles, uno libre", "Si uno va, el bloque acompaña"],
      "errores": [
        "Efecto embudo por no asociarse ni ocupar la banda con intención.",
        "Moverse sin que el bloque acompañe.",
        "Defender los tres carriles a la vez."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1222-GUIA-COMPLETA/bloque-1/frames/f",
        "total": 195
      },
      "fuente": { "documento": "Táctica 1-2-2-2 · Bloque 1 (Posicionamiento y movimientos reales)", "seccion": "Posicionamiento y movimientos reales" }
    },
    {
      "id": "bloque-2-ataque",
      "orden": 2,
      "nombre_corto": "Ataque",
      "titulo": "Ataque posicional, asociación y tras pérdida",
      "objetivo": "Enseñar cómo el sistema genera apoyos cercanos, ocupación puntual de banda y reacción inmediata tras pérdida.",
      "idea_clave": "Viajar juntos; la amplitud la da un interior, no el sistema por sí solo.",
      "decisiones": [
        "El equipo viaja junto con el balón.",
        "La amplitud la da uno de los interiores (8).",
        "Cuando el balón llega a un carril, se juntan varios jugadores en esa zona.",
        "El 10 recibe con opciones; 8 se acerca y 5 y 9 quedan cerca.",
        "Tras pérdida, varios saltan a robar y 5 y 9 cubren espacios.",
        "Rotación ofensiva: 9 abre como extremo y 10 pasa a delantero."
      ],
      "que_vigilar": [
        "Apoyos cercanos al poseedor (10 no está solo).",
        "Coberturas de 5 y 9 tras pérdida.",
        "Presencia en remate al rotar 9 y 10."
      ],
      "consignas": ["Viajamos juntos", "10 no está solo", "Si perdemos, robamos cerca", "9 abre, 10 fija"],
      "errores": [
        "Aislar al 10 cuando recibe.",
        "Dar amplitud sin que acompañe el bloque.",
        "Tras pérdida, correr hacia atrás en vez de robar cerca.",
        "Rotar 9 y 10 sin mantener presencia en remate."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1222-GUIA-COMPLETA/bloque-2/frames/f",
        "total": 168
      },
      "fuente": { "documento": "Táctica 1-2-2-2 · Bloque 2 (Ataque posicional, asociación y tras pérdida)", "seccion": "Ataque posicional, asociación y tras pérdida" }
    },
    {
      "id": "bloque-3-defensa",
      "orden": 3,
      "nombre_corto": "Defensa",
      "titulo": "Defensa en dos carriles y presión en banda",
      "objetivo": "Defender como una trampa por carriles: cerrar el centro, orientar al rival a banda y robar allí.",
      "idea_clave": "Centro cerrado, dos carriles defendidos y uno libre.",
      "decisiones": [
        "Cerrar el carril central y orientar el juego a banda.",
        "Bascular todo el bloque al lado del balón.",
        "Defender dos carriles y dejar libre el carril lejano.",
        "Achicar espacio alrededor del poseedor.",
        "Presionar en banda para intentar robar.",
        "En cambio aéreo, bascular durante el vuelo y repetir al otro lado."
      ],
      "que_vigilar": [
        "Basculación colectiva al lado del balón.",
        "Carril central siempre cerrado.",
        "Moverse durante el cambio aéreo."
      ],
      "consignas": ["Centro cerrado", "Dos carriles, uno libre", "Bascular juntos", "Robar en banda"],
      "errores": [
        "Salto individual sin apoyo del bloque.",
        "Bascular tarde y abrir el carril central.",
        "Defender los tres carriles a la vez.",
        "Quedarse mirando el cambio de orientación."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1222-GUIA-COMPLETA/bloque-3/frames/f",
        "total": 189
      },
      "fuente": { "documento": "Táctica 1-2-2-2 · Bloque 3 (Defensa en dos carriles y presión en banda)", "seccion": "Defensa en dos carriles y presión en banda" }
    },
    {
      "id": "bloque-4-variante-2-4",
      "orden": 4,
      "nombre_corto": "Variante 2-4",
      "titulo": "Variante defensiva 2-4",
      "objetivo": "Mostrar la variante 2-4 en la que los dos interiores pasan a carrileros para defender con más anchura y salir mejor jugando.",
      "idea_clave": "Robar con jugadores de buen pie para salir jugando.",
      "decisiones": [
        "Se activa con balón rival por dentro o rival potente.",
        "Los dos interiores se abren y trabajan como carrileros.",
        "La línea defensiva ensanchada orienta el juego hacia banda.",
        "El recuperador es un jugador con buen pie.",
        "Tras recuperar, primer pase seguro y triángulos."
      ],
      "que_vigilar": [
        "No abrirse demasiado ni vaciar el centro.",
        "Primer pase seguro tras el robo.",
        "Apoyos cercanos para triangular."
      ],
      "consignas": ["Interiores, fuera", "Estructura 2-4", "Robo y cabeza", "Triángulo"],
      "errores": [
        "Abrir mucho y dejar sin base a los dos de atrás.",
        "Vaciar el centro al sacar los interiores.",
        "Rifar el primer pase tras recuperar.",
        "Separar tanto los apoyos que no se pueda triangular."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1222-GUIA-COMPLETA/bloque-4/frames/f",
        "total": 193
      },
      "fuente": { "documento": "Táctica 1-2-2-2 · Bloque 4 (Variante defensiva 2-4)", "seccion": "Variante defensiva 2-4" }
    },
    {
      "id": "bloque-5-contraataque",
      "orden": 5,
      "nombre_corto": "Contraataque",
      "titulo": "Línea de 4 y contraataque",
      "objetivo": "Mostrar el bloque más bajo con línea de cuatro y dos referencias arriba para salir a la contra.",
      "idea_clave": "Proteger con 4 y guardar 2 referencias arriba.",
      "decisiones": [
        "Se usa cuando el rival ataca más.",
        "6 y 8 se cierran y forman línea de 4 con los dos de atrás.",
        "Las bandas se cierran un poco.",
        "9 y 10 quedan arriba como referencias.",
        "Se invita al rival a avanzar para que deje espacio.",
        "Tras robar, primer pase hacia arriba y contraataque."
      ],
      "que_vigilar": [
        "Línea de 4 sin huecos.",
        "9 y 10 arriba (no bajar del todo).",
        "Aprovechar el espacio tras el robo."
      ],
      "consignas": ["Línea de 4", "9 y 10, arriba", "Que vengan", "Robo y corre"],
      "errores": [
        "Bajar también a 9 y 10 y quedarse sin salida.",
        "Dejar huecos entre los cuatro defensores.",
        "Cerrar tanto que no se pueda correr tras recuperar.",
        "Invitar al rival sin controlar distancias ni el momento del robo."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1222-GUIA-COMPLETA/bloque-5/frames/f",
        "total": 192
      },
      "fuente": { "documento": "Táctica 1-2-2-2 · Bloque 5 (Línea de 4 y contraataque)", "seccion": "Línea de 4 y contraataque" }
    }
  ]
},
{
  "id": "CAMPOBASE-TACTICA-1132-GUIA-COMPLETA",
  "nombre": "Sistema 1-1-3-2",
  "formacion": "1-1-3-2",
  "organizacion": "1 portero · 1 defensa · 3 medios · 2 delanteros",
  "principio": "El bloque viaja junto y trabaja en dos de los tres carriles: la basculación y la presión tras pérdida nacen de esa cercanía, no de correr hacia atrás.",
  "framesManifest": TACTICA_1132_FRAMES,
  "team": [
    { "x": 50, "y": 90, "n": "1", "pos": "Portero" },
    { "x": 50, "y": 74, "n": "5", "pos": "Defensa" },
    { "x": 28, "y": 58, "n": "11", "pos": "Medio izq." },
    { "x": 50, "y": 60, "n": "8", "pos": "Mediocentro" },
    { "x": 72, "y": 58, "n": "7", "pos": "Medio der." },
    { "x": 36, "y": 40, "n": "9", "pos": "Delantero izq." },
    { "x": 64, "y": 40, "n": "10", "pos": "Delantero der." }
  ],
  "bloques": [
    {
      "id": "bloque-1-defensa",
      "orden": 1,
      "nombre_corto": "Defensa",
      "titulo": "Defensa y basculación",
      "objetivo": "Defender en banda basculando el bloque de los tres medios, con el 5 dando equilibrio y el equipo moviéndose mientras viaja el balón.",
      "idea_clave": "Tres medios juntos, 5 equilibra y el bloque cambia con el balón.",
      "decisiones": [
        "El sistema parte de portero, líbero, 3 medios y 2 puntas.",
        "Balón a izquierda: se reconoce el lado fuerte.",
        "11, 8 y 7 se desplazan; 5 equilibra por detrás.",
        "El equipo se mueve mientras viaja el balón en el cambio de orientación.",
        "Balón a derecha: la presión en banda cambia de lado.",
        "Misma lógica en espejo hacia el lado derecho."
      ],
      "que_vigilar": [
        "Basculación de los tres medios como bloque.",
        "Equilibrio del 5 (no se despega de la cobertura).",
        "Moverse durante el cambio de orientación, no después."
      ],
      "consignas": ["Tres medios juntos", "5 equilibra", "Dos carriles", "Cambio de lado = cambia el bloque"],
      "errores": [
        "Mezclar variantes defensivas en una misma jugada.",
        "Perder el equilibrio del 5.",
        "Basculación tardía.",
        "Amontonarse sobre el balón."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1132-GUIA-COMPLETA/bloque-1/frames/f",
        "total": 140
      },
      "fuente": { "documento": "Táctica 1-1-3-2 · Bloque 1 (Defensa y basculación)", "seccion": "Defensa y basculación" }
    },
    {
      "id": "bloque-2a-salida",
      "orden": 2,
      "nombre_corto": "Salida 2A",
      "titulo": "Salida base con 5 a la altura del portero",
      "objetivo": "Representar la primera salida: superioridad inicial con portero y 5, apoyo del 8 por dentro, amplitud de 7 y 11, y 9 y 10 arriba.",
      "idea_clave": "Superioridad de dos en la base y progresión por 8 o directa.",
      "decisiones": [
        "La salida parte de la estructura inicial del 1-1-3-2.",
        "El 5 baja a la altura del portero.",
        "El 8 ofrece línea de pase por el carril central.",
        "7 y 11 abren el campo para dar amplitud.",
        "9 y 10 quedan altos como referencias de progresión.",
        "Portero y 5 activan la salida corta.",
        "La continuación puede ser por 8 o directa a 9/10."
      ],
      "que_vigilar": [
        "Superioridad numérica en la base.",
        "Amplitud de 7 y 11.",
        "9 y 10 arriba (no bajar del todo)."
      ],
      "consignas": ["5 baja", "8 apoya", "7 y 11 abiertos", "9 y 10 arriba", "Portero juega"],
      "errores": [
        "Hacer bajar a más de un medio al mismo espacio.",
        "Perder la amplitud de 7 y 11.",
        "Bajar a 9 y 10 y quedarse sin referencia ofensiva.",
        "Colocar a 5 en mala altura o sin ángulo con el portero.",
        "Pensar que solo existe una única continuación tras el primer pase."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1132-GUIA-COMPLETA/bloque-2/frames/f",
        "total": 162
      },
      "fuente": { "documento": "Táctica 1-1-3-2 · Bloque 2A (Salida base con 5 a la altura del portero)", "seccion": "Salida base con 5 a la altura del portero" }
    },
    {
      "id": "bloque-2b-salida",
      "orden": 3,
      "nombre_corto": "Salida 2B",
      "titulo": "Salida con delanteros abiertos",
      "objetivo": "Representar la segunda salida: 9 y 10 se abren como extremos y la construcción se apoya en 11, 8 y 7 para generar ventaja por banda.",
      "idea_clave": "Delanteros abiertos y salida ofensiva que busca hacer daño desde el inicio.",
      "decisiones": [
        "La segunda salida parte del 1-1-3-2 con intención distinta.",
        "9 y 10 se abren muchísimo y actúan como extremos.",
        "Portero y 5 activan el costado con ayuda de 11.",
        "La banda puede generar una situación de superioridad.",
        "El balón puede progresar desde 11 hacia el extremo abierto.",
        "5 también puede jugar directo a 10 cuando este viene a recibir."
      ],
      "que_vigilar": [
        "Apertura real de 9 y 10.",
        "Superioridad real en banda.",
        "No olvidar la opción directa."
      ],
      "consignas": ["9 y 10 abiertos", "11 viene", "Activa banda", "Busca 10", "Salida ofensiva"],
      "errores": [
        "Dejar a 9 y 10 cerrados como si fueran puntas normales.",
        "No acercar suficientes apoyos a la banda.",
        "Perder a 8 y 7 como parte de la construcción.",
        "Pensar que solo existe la vía 5-11-10 y olvidar el pase directo.",
        "Convertir esta salida ofensiva en una posesión plana sin amenaza."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1132-GUIA-COMPLETA/bloque-3/frames/f",
        "total": 166
      },
      "fuente": { "documento": "Táctica 1-1-3-2 · Bloque 2B (Salida con delanteros abiertos)", "seccion": "Salida con delanteros abiertos" }
    },
    {
      "id": "bloque-3-carriles",
      "orden": 4,
      "nombre_corto": "Dos carriles",
      "titulo": "Juego en dos de los tres carriles",
      "objetivo": "Mostrar que el bloque viaja junto y ocupa dos carriles dejando uno libre, cambiando de lado cuando cambia el balón.",
      "idea_clave": "Viajar juntos, dos carriles ocupados y uno libre.",
      "decisiones": [
        "Se parte del dibujo base y del concepto de los tres carriles.",
        "Balón a izquierda: el equipo se acerca al lado fuerte.",
        "Se ocupan carril izquierdo y central; el derecho queda libre.",
        "El bloque acompaña mientras viaja el balón en el cambio de lado.",
        "El nuevo lado fuerte pasa al carril derecho.",
        "Se ocupan carril central y derecho; el izquierdo queda libre.",
        "Sin viaje conjunto y buena cercanía, el sistema se rompe o se hace embudo."
      ],
      "que_vigilar": [
        "Ocupar dos carriles, no tres a la vez.",
        "El bloque se mueve con el balón.",
        "Cercanía sin separación excesiva."
      ],
      "consignas": ["Viajad juntos", "Dos carriles", "Uno libre", "Cambia el balón, cambia el bloque"],
      "errores": [
        "Usar los tres carriles a la vez constantemente.",
        "No acompañar el cambio de lado.",
        "Dejar jugadores demasiado lejos del balón.",
        "Confundir amplitud útil con separación excesiva.",
        "Provocar embudo por mala ocupación o mala cercanía."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1132-GUIA-COMPLETA/bloque-4/frames/f",
        "total": 168
      },
      "fuente": { "documento": "Táctica 1-1-3-2 · Bloque 3 (Juego en dos de los tres carriles)", "seccion": "Juego en dos de los tres carriles" }
    },
    {
      "id": "bloque-4-presion",
      "orden": 5,
      "nombre_corto": "Tras pérdida",
      "titulo": "Presión tras pérdida y transición",
      "objetivo": "Mostrar que la presión tras pérdida nace porque el equipo ya estaba junto en ataque: pérdida, salto inmediato, robo y transición rápida.",
      "idea_clave": "Si la perdemos, saltamos; roba y corre.",
      "decisiones": [
        "El bloque ya ataca junto, en pocos carriles.",
        "Un punta cae a banda y 8 pisa zona alta.",
        "La pérdida llega cerca del lado fuerte.",
        "Los jugadores cercanos aprietan al momento.",
        "La acumulación de cercanos facilita la recuperación.",
        "8 conduce y activa a 10 para castigar al rival."
      ],
      "que_vigilar": [
        "Pérdida con apoyos cerca.",
        "Salto inmediato, sin replegar primero.",
        "Aprovechar la recuperación con transición rápida."
      ],
      "consignas": ["Juntos", "Si la perdemos, saltamos", "Achica", "Roba y corre"],
      "errores": [
        "Atacar demasiado separado y querer presionar una pérdida lejana.",
        "Enseñar una pérdida aislada que haga imposible la presión.",
        "Replegar primero y presionar después.",
        "Recuperar y no castigar la desorganización rival.",
        "Olvidar que esta presión depende del bloque previo."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1132-GUIA-COMPLETA/bloque-5/frames/f",
        "total": 196
      },
      "fuente": { "documento": "Táctica 1-1-3-2 · Bloque 4 (Presión tras pérdida y transición)", "seccion": "Presión tras pérdida y transición" }
    }
  ]
},
{
  "id": "CAMPOBASE-TACTICA-133-GUIA-COMPLETA",
  "nombre": "Sistema 1-3-3",
  "formacion": "1-3-3",
  "organizacion": "1 portero · 3 defensas · 3 atacantes",
  "principio": "Dos líneas de tres, sencillas y equilibradas: la amplitud la da una línea u otra según la variante, y el 10 es siempre la referencia central.",
  "framesManifest": TACTICA_133_FRAMES,
  "team": [
    { "x": 50, "y": 90, "n": "1", "pos": "Portero" },
    { "x": 24, "y": 72, "n": "4", "pos": "Lateral izq." },
    { "x": 76, "y": 72, "n": "5", "pos": "Lateral der." },
    { "x": 50, "y": 76, "n": "6", "pos": "Defensa central" },
    { "x": 78, "y": 36, "n": "8", "pos": "Extremo der." },
    { "x": 22, "y": 36, "n": "9", "pos": "Extremo izq." },
    { "x": 50, "y": 30, "n": "10", "pos": "Delantero centro" }
  ],
  "bloques": [
    {
      "id": "bloque-1-estructura",
      "orden": 1,
      "nombre_corto": "Estructura",
      "titulo": "Estructura base y variantes de amplitud",
      "objetivo": "Entender la estructura 1-3-3 y sus dos variantes de amplitud: quién abre y quién juega por dentro en cada una.",
      "idea_clave": "Dos líneas de tres; la amplitud la da una línea u otra, nunca las dos a la vez.",
      "decisiones": [
        "Estructura base: tres defensas atrás y tres atacantes delante.",
        "Variante A: 4 y 5 dan amplitud; 8 y 9 juegan por dentro.",
        "Variante B: 8 y 9 dan amplitud; 4 y 5 juegan más por dentro.",
        "6 equilibra la base en ambas variantes.",
        "10 mantiene la referencia central.",
        "No se mezclan las variantes: se elige una y se mantiene."
      ],
      "que_vigilar": [
        "Que la estructura 1-3-3 se vea clara desde el inicio.",
        "Que solo una línea dé amplitud en cada variante.",
        "Que 6 equilibre y 10 fije por dentro."
      ],
      "consignas": ["Dos líneas de tres", "Una línea abre, la otra por dentro", "6 equilibra", "10 fija"],
      "errores": [
        "Mezclar las dos variantes a la vez.",
        "Efecto embudo por meter a todos por dentro.",
        "Perder la amplitud y no abrir el campo."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-133-GUIA-COMPLETA/bloque-1/frames/f",
        "total": 166
      },
      "fuente": { "documento": "Táctica 1-3-3 · Bloque 1 (Estructura y variantes de amplitud)", "seccion": "Estructura y variantes de amplitud" }
    },
    {
      "id": "bloque-2-salida",
      "orden": 2,
      "nombre_corto": "Salida",
      "titulo": "Salida de balón, superioridad y opciones",
      "objetivo": "Enseñar la salida con superioridad 4v3 usando al portero y las cuatro soluciones reales: corto a 9, largo a 9, largo a 8 y largo a 10.",
      "idea_clave": "Portero + tres de base superan la primera presión; luego se lee corto o largo.",
      "decisiones": [
        "Portero + 4 + 6 + 5 forman la base de cuatro.",
        "Ante tres rivales, el portero permite superioridad 4v3.",
        "4/9 y 5/8 se escalonan a distinta altura.",
        "Si 9 viene al pie, 4 juega corto.",
        "Si 9 rompe al espacio, 4 juega largo.",
        "Largo a 8: si está libre, controla y gira; si no, descarga con 5.",
        "Largo a 10: 9 y 8 cierran para la segunda jugada."
      ],
      "que_vigilar": [
        "Que el portero participe en la salida.",
        "Que 4/9 y 5/8 no estén a la misma altura.",
        "Que 8 no fuerce el giro si está marcado.",
        "Que nadie deje solo al 10 en el pase largo."
      ],
      "consignas": ["Portero participa", "Escalona alturas", "Lee corto o largo", "Gira si puedes, si no descarga", "Balón a 10: todos a la caída"],
      "errores": [
        "Sacar al portero de la circulación.",
        "Poner 4/9 o 5/8 a la misma altura.",
        "Obligar a 8 a girar si está marcado.",
        "Jugar largo a 10 sin acercar a 8 y 9."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-133-GUIA-COMPLETA/bloque-2/frames/f",
        "total": 192
      },
      "fuente": { "documento": "Táctica 1-3-3 · Bloque 2 (Salida de balón, superioridad y opciones)", "seccion": "Salida de balón" }
    },
    {
      "id": "bloque-3-ataque-8-9",
      "orden": 3,
      "nombre_corto": "Ataque 8-9",
      "titulo": "Ataque con 8 y 9 abiertos y cambio de frente",
      "objetivo": "Mostrar el ataque cuando 8 y 9 dan amplitud: atraer a un lado, fijar con 10 y cambiar rápido al lado débil.",
      "idea_clave": "Abrir, fijar y atacar el lado libre.",
      "decisiones": [
        "8 y 9 abren el campo por fuera.",
        "El rival bascula hacia el lado del balón.",
        "10 fija por dentro y atrae atención interior.",
        "La pelota cambia rápido al lado opuesto.",
        "En el lado débil aparece superioridad: 2 contra 1 o 2 contra 2.",
        "La ventaja se explota por fuera o con combinación."
      ],
      "que_vigilar": [
        "Amplitud real de 8 y 9.",
        "Que 10 no salga de la zona interior.",
        "Que el cambio de frente sea rápido, no lento.",
        "Que la ventaja creada se aproveche."
      ],
      "consignas": ["Abre con 8 y 9", "Fija con 10", "Atrae un lado", "Cambio rápido", "Ataca el lado débil"],
      "errores": [
        "No dar amplitud real.",
        "Cambio de frente lento.",
        "Sacar a 10 de la zona interior.",
        "Mover la pelota sin fijar antes al rival.",
        "Crear ventaja y no aprovecharla."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-133-GUIA-COMPLETA/bloque-3/frames/f",
        "total": 168
      },
      "fuente": { "documento": "Táctica 1-3-3 · Bloque 3 (Ataque con 8 y 9 abiertos y cambio de frente)", "seccion": "Ataque con amplitud exterior y cambio de frente" }
    },
    {
      "id": "bloque-4-ataque-4-5",
      "orden": 4,
      "nombre_corto": "Ataque 4-5",
      "titulo": "Ataque con 4 y 5 abiertos y 8 y 9 por dentro",
      "objetivo": "Mostrar la segunda variante ofensiva: la amplitud la dan 4 y 5, y 8 y 9 se meten por dentro junto a 10.",
      "idea_clave": "Cambiar quién abre y quién ataca por dentro genera la ventaja.",
      "decisiones": [
        "4 y 5 abren el campo desde atrás.",
        "8 y 9 ocupan por dentro y se relacionan con 10.",
        "Los tres interiores fijan rivales.",
        "El poseedor en banda atrae la ayuda rival.",
        "Si el rival ayuda, se abre otro espacio.",
        "Puede aparecer pared, descarga o 1 contra 1 útil."
      ],
      "que_vigilar": [
        "Que la amplitud la den 4 y 5, no 8 y 9.",
        "Que no queden vacíos los carriles interiores.",
        "Que 10 mantenga la referencia central.",
        "Reconocer cuándo la ayuda rival ya ha saltado."
      ],
      "consignas": ["4 y 5 abiertos", "8 y 9 dentro", "10 fija", "Atrae ayuda", "Si salta, usa al de dentro"],
      "errores": [
        "Repetir el bloque anterior y volver a abrir a 8 y 9.",
        "Dejar vacíos los carriles interiores.",
        "Quitar a 10 de la referencia central.",
        "No reconocer cuándo la ayuda rival ya ha saltado.",
        "Perder la ventaja por frenar demasiado la acción."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-133-GUIA-COMPLETA/bloque-4/frames/f",
        "total": 165
      },
      "fuente": { "documento": "Táctica 1-3-3 · Bloque 4 (Ataque con 4 y 5 abiertos y 8 y 9 por dentro)", "seccion": "Ataque con amplitud desde atrás e interiores por dentro" }
    },
    {
      "id": "bloque-5-ajuste-ajedrez",
      "orden": 5,
      "nombre_corto": "Ajuste 4-2-2",
      "titulo": "Ajuste ofensivo contra 4-2-2 para liberar a 8",
      "objetivo": "Enseñar la adaptación ante un rival con línea fuerte tipo 4-2-2: fijar con 6, meter a 5 por dentro y liberar a 8 por fuera.",
      "idea_clave": "Fijar, mover a 5 y liberar a 8.",
      "decisiones": [
        "El rival cambia a un dibujo fuerte tipo 4-2-2.",
        "6 conduce hasta fijar, sin pasar rápido.",
        "5 abandona la banda y entra por dentro.",
        "8 ocupa la banda liberada.",
        "9 y 10 quedan como dos puntas y siguen fijando.",
        "El rival intenta cambiar marcas y bascular, pero llega tarde.",
        "8 queda libre o en ventaja para atacar."
      ],
      "que_vigilar": [
        "Que 6 fije antes de soltar el balón.",
        "Que 5 entre por dentro con coordinación.",
        "Que 8 ocupe la banda liberada.",
        "Que 9 y 10 sigan fijando como dos puntas."
      ],
      "consignas": ["6, fija", "5, dentro", "8, fuera", "9 y 10, fijad", "Si ajustan tarde, castiga banda"],
      "errores": [
        "Que 6 pase sin fijar.",
        "Mover a 5 dentro sin activar a 8.",
        "Perder la referencia de 9 y 10 como dos puntas.",
        "Dejar que la jugada se pare y el rival recomponga.",
        "Confundir esta secuencia con la del bloque 4."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-133-GUIA-COMPLETA/bloque-5/frames/f",
        "total": 165
      },
      "fuente": { "documento": "Táctica 1-3-3 · Bloque 5 (Ajuste ofensivo contra 4-2-2 para liberar a 8)", "seccion": "Adaptación ofensiva vs 4-2-2" }
    }
  ]
},
{
  "id": "CAMPOBASE-TACTICA-1312-GUIA-COMPLETA",
  "nombre": "Sistema 1-3-1-2",
  "formacion": "1-3-1-2",
  "organizacion": "1 portero · 3 defensas · 1 medio · 2 delanteros",
  "principio": "El sistema no es rígido: la amplitud la da una línea u otra según la variante, y el 10 es siempre la referencia de equilibrio.",
  "framesManifest": TACTICA_1312_FRAMES,
  "team": [
    { "x": 50, "y": 90, "n": "1", "pos": "Portero" },
    { "x": 24, "y": 72, "n": "4", "pos": "Defensa izq." },
    { "x": 50, "y": 76, "n": "5", "pos": "Defensa central" },
    { "x": 76, "y": 72, "n": "6", "pos": "Defensa der." },
    { "x": 30, "y": 40, "n": "7", "pos": "Delantero izq." },
    { "x": 70, "y": 40, "n": "9", "pos": "Delantero der." },
    { "x": 50, "y": 58, "n": "10", "pos": "Centrocampista" }
  ],
  "bloques": [
    {
      "id": "bloque-1-estructura",
      "orden": 1,
      "nombre_corto": "Estructura",
      "titulo": "Estructura base y variantes del sistema",
      "objetivo": "Mostrar el 1-3-1-2 base y separar las variantes reales: quién da amplitud y qué papel juegan 7, 9, 10 y el posible líbero.",
      "idea_clave": "El sistema no es rígido: puede abrir desde atrás o desde los delanteros, y la elección depende de perfiles y del rival.",
      "decisiones": [
        "Estructura base: 1 portero, 3 defensas, 1 centrocampista y 2 delanteros.",
        "Variante A: la amplitud la dan los defensas exteriores (4 y 6), que se convierten en laterales/carrileros.",
        "Con 4 y 6 abiertos, 7 y 9 pueden cerrarse como medias puntas.",
        "Variante B: la amplitud la dan los delanteros (7 y 9), que se convierten en extremos.",
        "Variante asimétrica: un lado gana profundidad y el otro equilibrio, según el perfil de los jugadores.",
        "Variante con líbero: uno de los defensas protege detrás o salta delante de la línea.",
        "10 actúa siempre como centrocampista de equilibrio."
      ],
      "que_vigilar": [
        "Que la base 1-3-1-2 se vea clara desde el inicio.",
        "Que solo una línea dé amplitud en cada variante.",
        "Que 10 no pierda la referencia de centrocampista.",
        "Que el líbero se mueva con intención, no sin propósito."
      ],
      "consignas": ["Entiende la base", "Decide quién da amplitud", "Usa los perfiles", "Da sentido al líbero"],
      "errores": [
        "Mezclar varias variantes a la vez sin separar sus funciones.",
        "Perder la referencia del 10 como centrocampista.",
        "Convertir la asimetría en caos.",
        "Mover al líbero sin propósito.",
        "Dibujar amplitud y juego interior ocupando el mismo espacio."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1312-GUIA-COMPLETA/bloque-1/frames/f",
        "total": 167
      },
      "fuente": { "documento": "Táctica 1-3-1-2 · Bloque 1 (Estructura y variantes)", "seccion": "Estructura base y variantes funcionales" }
    },
    {
      "id": "bloque-2-salida",
      "orden": 2,
      "nombre_corto": "Salida",
      "titulo": "Salida de balón y primera progresión",
      "objetivo": "Representar las salidas de balón del 1-3-1-2 y separar las tres variantes de inicio: corto por fuera, largo a banda y carga del costado con tres.",
      "idea_clave": "El portero participa y la salida se adapta a la presión rival: si hay corto se usa, si no se va a banda con compañeros cerca.",
      "decisiones": [
        "Variante 1: dos defensas junto al portero y uno más abierto generan superioridad inicial de cuatro.",
        "El centrocampista se separa y los dos delanteros caen a banda para dar amplitud.",
        "Se puede jugar corto por fuera y progresar desde ahí.",
        "Variante 2: los defensas exteriores actúan como laterales; portero y otro defensor sostienen la salida.",
        "7 y 9 se cierran algo para generar triángulos con 10.",
        "Si no hay corto, se juega largo a banda para buscar un 2 contra 1 y ganar la caída.",
        "Variante 3: un defensor se suma al centro del campo y se carga un costado con tres jugadores."
      ],
      "que_vigilar": [
        "Que el portero participe en la salida.",
        "Que el carril central quede protegido.",
        "Que no se fuerce el centro.",
        "Que el balón largo a banda tenga compañeros cerca para la segunda jugada."
      ],
      "consignas": ["Lee la presión", "Sal por fuera", "Gana la caída", "Protege el centro", "Carga el lado con 3"],
      "errores": [
        "Forzar el centro.",
        "Confundir amplitud con separación inútil.",
        "Jugar largo sin preparar la segunda jugada.",
        "Cerrar tanto a 7 y 9 que no existan triángulos.",
        "Olvidar que en una variante un defensor se suma al medio para cargar la banda."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1312-GUIA-COMPLETA/bloque-2/frames/f",
        "total": 167
      },
      "fuente": { "documento": "Táctica 1-3-1-2 · Bloque 2 (Salida de balón)", "seccion": "Salida de balón y primera progresión" }
    },
    {
      "id": "bloque-3-progresion",
      "orden": 3,
      "nombre_corto": "Progresión",
      "titulo": "Progresión ofensiva y ventajas",
      "objetivo": "Representar la progresión ofensiva del 1-3-1-2 y separar las dos vías: amplitud con delanteros y amplitud con defensas.",
      "idea_clave": "Si abren los delanteros se gana anchura arriba y superioridad por dentro; si abren los defensas se ganan más apoyos interiores cerca del balón.",
      "decisiones": [
        "Opción A: la amplitud la dan los delanteros (7 y 9) que caen a banda.",
        "Con 7 y 9 abiertos aparece superioridad interior con cuatro jugadores para asociarse.",
        "Desde ahí se saca el balón por banda o se usan diagonales para hacer daño.",
        "Opción B: la amplitud la dan los defensas (4 y 6) si tienen capacidad para jugar por fuera.",
        "En esa variante, 7 ayuda, 9 queda como referencia y 10 cae al lado del balón.",
        "El objetivo es reunir tres jugadores en banda para crear superioridad.",
        "El lado débil queda listo para cambio de frente, 1 contra 1, diagonal o centro."
      ],
      "que_vigilar": [
        "Que no se mezclen las dos opciones al mismo tiempo.",
        "Que al abrir mucho no se deje de acompañar por dentro.",
        "Que la sobrecarga lateral tenga una continuación útil.",
        "Que no baje también la referencia (9) y se pierda profundidad.",
        "Que el lado débil quede vivo."
      ],
      "consignas": ["Decide la amplitud", "Usa el lado fuerte", "Mantén el lado débil", "7 ayuda", "9 fija"],
      "errores": [
        "Mezclar las dos opciones al mismo tiempo.",
        "Abrir mucho pero no acompañar por dentro.",
        "Cargar banda sin tercera pieza.",
        "Hacer bajar también a la referencia y perder profundidad.",
        "No dejar viva la opción del lado débil."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1312-GUIA-COMPLETA/bloque-3/frames/f",
        "total": 169
      },
      "fuente": { "documento": "Táctica 1-3-1-2 · Bloque 3 (Progresión ofensiva)", "seccion": "Progresión ofensiva y ventajas" }
    },
    {
      "id": "bloque-4-basculaciones",
      "orden": 4,
      "nombre_corto": "Basculaciones",
      "titulo": "Basculaciones y defensa de banda",
      "objetivo": "Mostrar cómo protege el centro el 1-3-1-2 y separar las dos formas de bascular: banda defendida por el exterior defensivo o por el extremo.",
      "idea_clave": "El carril central es la prioridad; uno salta a banda, el resto cierra por dentro y 10 conserva el equilibrio.",
      "decisiones": [
        "El campo se divide en tres carriles y la prioridad defensiva es proteger el carril central.",
        "Variante A: el exterior defensivo del lado del balón salta a banda.",
        "El delantero próximo cierra en ayuda y los otros defensores se recomponen por dentro.",
        "10 conserva el equilibrio en zona intermedia.",
        "Si el balón cambia de lado, cambia también qué defensor actúa como lateral.",
        "Variante B: si 7 y 9 juegan como extremos, el extremo del lado del balón baja a defender.",
        "La línea de tres queda compacta, 10 no se hunde del todo y el extremo lejano cierra para el cambio de orientación."
      ],
      "que_vigilar": [
        "Que el carril central no se abra para llegar antes a banda.",
        "Que no salten dos jugadores a la misma marca.",
        "Que no se persiga el cambio de lado con el mismo jugador.",
        "Que 10 no se hunda demasiado y pierda el equilibrio."
      ],
      "consignas": ["Centro cerrado", "Uno salta", "El resto cierra", "10 equilibra", "Cambia roles"],
      "errores": [
        "Mezclar ambas variantes en una misma acción.",
        "Abrir el carril central para llegar antes a banda.",
        "Hacer saltar dos jugadores a la misma marca.",
        "Perseguir el cambio de lado con el mismo jugador.",
        "Hundir demasiado a 10 y perder equilibrio."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1312-GUIA-COMPLETA/bloque-4/frames/f",
        "total": 166
      },
      "fuente": { "documento": "Táctica 1-3-1-2 · Bloque 4 (Basculaciones)", "seccion": "Defensa de banda y basculaciones" }
    },
    {
      "id": "bloque-5-pressing",
      "orden": 5,
      "nombre_corto": "Pressing",
      "titulo": "Pressing alto y variantes defensivas",
      "objetivo": "Mostrar la presión alta del 1-3-1-2 y separar la variante base con dos puntas de la transformación 3-2-1, enseñando la relación entre presión y riesgo.",
      "idea_clave": "Presionar alto no es correr todos: dos puntas igualan la primera salida, 10 tapa al mediocentro y a más hombres arriba, más riesgo detrás.",
      "decisiones": [
        "7 y 9 saltan sobre los dos defensas de salida rivales.",
        "10 controla al mediocentro rival para evitar una salida interior limpia.",
        "Variante 3-2-1: un solo delantero y más estructura detrás.",
        "El 7, como delantero movible, ayuda a 10 en la presión interior.",
        "Se conserva así la estructura de tres defensas atrás.",
        "Variante más arriesgada: más hombres emparejados arriba y menos red detrás."
      ],
      "que_vigilar": [
        "Que los dos puntas no vayan al mismo balón.",
        "Que el mediocentro rival no quede libre.",
        "Que no se rompa la línea de tres.",
        "Que la presión arriesgada esté coordinada."
      ],
      "consignas": ["Orienta la salida", "Tapa por dentro", "Elige el riesgo", "Mantén la estructura"],
      "errores": [
        "Dos puntas al mismo balón.",
        "Mediocentro rival libre.",
        "Romper la línea de tres.",
        "Presión arriesgada sin coordinación."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1312-GUIA-COMPLETA/bloque-5/frames/f",
        "total": 166
      },
      "fuente": { "documento": "Táctica 1-3-1-2 · Bloque 5 (Pressing alto)", "seccion": "Pressing alto y variantes defensivas" }
    },
    {
      "id": "bloque-6-bloque-bajo",
      "orden": 6,
      "nombre_corto": "Bloque bajo",
      "titulo": "Bloque bajo, línea de 5 y transición",
      "objetivo": "Completar la fase defensiva en zona 2: separar la opción clásica 1-3-1-2 de la variante de línea de cinco, y mostrar la transición rápida tras el robo.",
      "idea_clave": "En zona 2 se puede mantener el 1-3-1-2 compacto o meter a 7 y 9 como extremos para formar línea de cinco; tras el robo, 7 y 9 atacan el espacio.",
      "decisiones": [
        "Variante clásica: 1-3-1-2 compacta con el carril central muy tapado.",
        "Variante de línea de cinco: 7 y 9 bajan y forman una línea de cinco con la defensa (7-4-5-6-9).",
        "10 queda por delante como referencia de equilibrio y continuidad.",
        "Los extremos cierran los costados sin romper el centro.",
        "La línea se desplaza junta según el balón (basculación conjunta).",
        "Tras el robo, se asegura el primer apoyo.",
        "7 y 9 atacan rápidamente el espacio que deja el rival."
      ],
      "que_vigilar": [
        "Que no se confunda este bloque con el pressing alto.",
        "Que 7 y 9 no se queden arriba pretendiendo formar línea de 5.",
        "Que no se rompa la línea por perseguir individualmente.",
        "Que tras el robo no se regale el primer pase.",
        "Que la transición no sea lenta cuando el rival está abierto."
      ],
      "consignas": ["Centro cerrado", "Línea junta", "7 y 9 a bandas", "Roba y asegura", "Sal rápido"],
      "errores": [
        "Confundir este bloque con el pressing alto.",
        "Dejar a 7 y 9 arriba y pretender formar línea de 5.",
        "Romper la línea por perseguir individualmente.",
        "Robar y regalar el primer pase.",
        "Hacer una transición lenta cuando el rival está abierto."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1312-GUIA-COMPLETA/bloque-6/frames/f",
        "total": 169
      },
      "fuente": { "documento": "Táctica 1-3-1-2 · Bloque 6 (Bloque bajo, línea de 5 y transición)", "seccion": "Defensa en zona 2 y transición ofensiva" }
    }
  ]
},
{
  "id": "CAMPOBASE-TACTICA-FINAL-LINEA3-GUIA-COMPLETA",
  "nombre": "Sistema 1-3-2-1 (línea de 3)",
  "formacion": "1-3-2-1",
  "organizacion": "1 portero · 3 defensas · 2 carrileros · 1 mediapunta",
  "principio": "Base de tres con buen pie, dos carrileros/extremos con mucho recorrido y una mediapunta con llegada: ocupar todos los carriles y atacar el espacio que deja el rival.",
  "framesManifest": TACTICA_FINAL_FRAMES,
  "team": [
    { "x": 50, "y": 90, "n": "1", "pos": "Portero" },
    { "x": 25, "y": 72, "n": "4", "pos": "Central izq." },
    { "x": 50, "y": 76, "n": "5", "pos": "Central" },
    { "x": 75, "y": 72, "n": "6", "pos": "Central der." },
    { "x": 22, "y": 40, "n": "7", "pos": "Carrilero izq." },
    { "x": 50, "y": 30, "n": "10", "pos": "Mediapunta" },
    { "x": 78, "y": 40, "n": "11", "pos": "Carrilero der." }
  ],
  "bloques": [
    {
      "id": "bloque-1-estructura",
      "orden": 1,
      "nombre_corto": "Estructura",
      "titulo": "Estructura, línea de 3 y carrileros",
      "objetivo": "Fijar la base de tres con buen manejo de balón, los dos carrileros/extremos con recorrido y la mediapunta con llegada, ocupando todos los carriles.",
      "idea_clave": "Línea de 3 con salida limpia, amplitud por bandas y mediapunta con llegada.",
      "decisiones": [
        "Tres jugadores sostienen la base con buen pie.",
        "Los dos carrileros ganan altura y amplitud por su banda.",
        "La mediapunta llega a zona ofensiva y puede finalizar.",
        "Se ocupan carriles interiores y exteriores a la vez.",
        "Los carrileros no son laterales rígidos: tienen todo el recorrido."
      ],
      "que_vigilar": [
        "Que la línea de 3 no se junte demasiado.",
        "Amplitud real de los dos carrileros.",
        "Que la mediapunta no se aleje del juego."
      ],
      "consignas": ["Tres detrás", "Abre el campo", "Corre por banda", "Mediapunta llega", "Ocupa todos los carriles"],
      "errores": [
        "Convertir a los carrileros en laterales rígidos.",
        "Juntar demasiado la línea de 3.",
        "Alejar a la mediapunta del juego.",
        "Ocupar dos jugadores el mismo carril y dejar otro vacío."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-FINAL-LINEA3-GUIA-COMPLETA/bloque-1/frames/f",
        "total": 84
      },
      "fuente": { "documento": "Sistema final · Bloque 1 (Estructura, línea de 3 y carrileros)", "seccion": "Estructura y funciones" }
    },
    {
      "id": "bloque-2-bloque-bajo",
      "orden": 2,
      "nombre_corto": "Bloque bajo",
      "titulo": "Bloque bajo y transición",
      "objetivo": "Mostrar el repliegue muy bajo cerca de portería, el robo y el ataque inmediato del espacio con diagonales de carrileros y llegada de la mediapunta.",
      "idea_clave": "Repliegue, robo y ataque inmediato del espacio.",
      "decisiones": [
        "El equipo repliega muy bajo, cerca de su portería.",
        "Se compactan los espacios y se protege la portería.",
        "El rival, al atacar arriba, deja espacio a su espalda.",
        "Tras el robo se mira rápido al espacio libre.",
        "Los carrileros atacan con diagonal al hueco.",
        "La mediapunta acompaña y puede finalizar."
      ],
      "que_vigilar": [
        "Que el bloque no se adelante cuando toca replegar.",
        "Que no se hunda sin dejar salida.",
        "Que las diagonales ataquen el hueco, no corran rectas por banda."
      ],
      "consignas": ["Repliega", "Junta líneas", "Roba y mira delante", "Diagonal al espacio", "Mediapunta llega"],
      "errores": [
        "Adelantar el bloque cuando la fuente habla de repliegue.",
        "Hundirse sin dejar salida.",
        "Correr recto por banda sin atacar el hueco.",
        "Juntar a todos en el mismo espacio."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-FINAL-LINEA3-GUIA-COMPLETA/bloque-2/frames/f",
        "total": 85
      },
      "fuente": { "documento": "Sistema final · Bloque 2 (Bloque bajo y transición)", "seccion": "Defensa y transición" }
    }
  ]
},
{
  "id": "CAMPOBASE-TACTICA-11311-GUIA-COMPLETA",
  "nombre": "Sistema 1-1-3-1-1",
  "formacion": "1-1-3-1-1",
  "organizacion": "1 portero · 1 defensa · 3 medios · 1 mediapunta · 1 delantero",
  "principio": "Carril central protegido, mediapunta como enlace y exteriores flexibles: un sistema que protege el centro y puede mutar en movimiento a una forma 1-3-2-1.",
  "framesManifest": TACTICA_11311_FRAMES,
  "team": [
    { "x": 50, "y": 90, "n": "1", "pos": "Portero" },
    { "x": 70, "y": 48, "n": "2", "pos": "Medio der." },
    { "x": 50, "y": 76, "n": "5", "pos": "Defensa" },
    { "x": 50, "y": 55, "n": "6", "pos": "Medio central" },
    { "x": 30, "y": 48, "n": "8", "pos": "Medio izq." },
    { "x": 50, "y": 30, "n": "9", "pos": "Delantero" },
    { "x": 50, "y": 40, "n": "10", "pos": "Mediapunta" }
  ],
  "bloques": [
    {
      "id": "bloque-1-estructura",
      "orden": 1,
      "nombre_corto": "Estructura",
      "titulo": "Estructura y mediapunta",
      "objetivo": "Fijar la estructura 1-1-3-1-1, el papel de la mediapunta como enlace y la flexibilidad de los centrocampistas exteriores.",
      "idea_clave": "Centro protegido, mediapunta que enlaza y exteriores flexibles.",
      "decisiones": [
        "El carril central queda bien protegido.",
        "La mediapunta enlaza y da visión entre medios y delantero.",
        "El delantero también puede ayudar y bajar a recibir.",
        "Los exteriores son flexibles: banda, carrilero, lateral o extremo.",
        "En movimiento puede aparecer una forma funcional 1-3-2-1."
      ],
      "que_vigilar": [
        "Que no desaparezca la mediapunta.",
        "Que el centro no quede abierto.",
        "Que los exteriores no se vuelvan rígidos."
      ],
      "consignas": ["Protege el centro", "10 enlaza", "9 ayuda", "Exteriores flexibles", "Entiende la lógica"],
      "errores": [
        "Dibujar el sistema como si no existiera la mediapunta.",
        "Abrir demasiado el centro.",
        "Tratar a los exteriores como jugadores rígidos.",
        "Bajar tanto al 9 que deje de ser referencia."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-11311-GUIA-COMPLETA/bloque-1/frames/f",
        "total": 85
      },
      "fuente": { "documento": "Táctica 1-1-3-1-1 · Bloque 1 (Estructura y mediapunta)", "seccion": "Estructura base y funciones" }
    },
    {
      "id": "bloque-2-transformacion",
      "orden": 2,
      "nombre_corto": "Transformación",
      "titulo": "Transformación funcional y apoyos",
      "objetivo": "Mostrar cómo los exteriores bajan y crean una línea funcional de 3, con dos apoyos interiores, la mediapunta enlazando y el delantero ayudando.",
      "idea_clave": "Mismo sistema, alturas diferentes: no es un sistema nuevo.",
      "decisiones": [
        "Los exteriores bajan de altura.",
        "Aparece una línea funcional de tres por detrás.",
        "Dos jugadores quedan por delante para dar salida.",
        "La mediapunta conecta las líneas.",
        "El delantero se acerca para ayudar."
      ],
      "que_vigilar": [
        "Que no se confunda con un sistema nuevo.",
        "Que los exteriores no se hundan demasiado.",
        "Que los dos apoyos no queden en la misma línea sin ángulos."
      ],
      "consignas": ["Tres detrás", "Dos apoyos", "10 enlaza", "9 ayuda", "Mantén salida limpia"],
      "errores": [
        "Llamarlo 1-3-2-1 como táctica nueva.",
        "Hundir demasiado a los exteriores.",
        "Dejar a los dos apoyos en la misma línea sin ángulos.",
        "Hacer que el delantero desaparezca de la zona ofensiva."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-11311-GUIA-COMPLETA/bloque-2/frames/f",
        "total": 85
      },
      "fuente": { "documento": "Táctica 1-1-3-1-1 · Bloque 2 (Transformación funcional)", "seccion": "Transformación y apoyos" }
    }
  ]
},
{
  "id": "CAMPOBASE-TACTICA-1141-GUIA-COMPLETA",
  "nombre": "Sistema 1-1-4-1",
  "formacion": "1-1-4-1",
  "organizacion": "1 portero · 1 defensa · 4 medios · 1 delantero",
  "principio": "Un solo defensa rápido y contundente, cuatro centrocampistas para dominar el balón y un delantero que fija o baja como falso 9, sin renunciar al equilibrio.",
  "framesManifest": TACTICA_1141_FRAMES,
  "team": [
    { "x": 50, "y": 90, "n": "1", "pos": "Portero" },
    { "x": 70, "y": 48, "n": "2", "pos": "Medio der." },
    { "x": 30, "y": 48, "n": "4", "pos": "Medio izq." },
    { "x": 50, "y": 76, "n": "5", "pos": "Defensa" },
    { "x": 40, "y": 55, "n": "6", "pos": "Medio interior" },
    { "x": 60, "y": 55, "n": "8", "pos": "Medio interior" },
    { "x": 50, "y": 30, "n": "9", "pos": "Delantero" }
  ],
  "bloques": [
    {
      "id": "bloque-1-estructura",
      "orden": 1,
      "nombre_corto": "Estructura",
      "titulo": "Estructura y roles",
      "objetivo": "Mostrar el sistema base 1-1-4-1 y fijar las responsabilidades del único defensa, los medios de banda y el delantero.",
      "idea_clave": "Dominar el balón con cuatro medios sin perder el equilibrio.",
      "decisiones": [
        "El único defensa corrige y protege la espalda.",
        "Los cuatro centrocampistas concentran el dominio del juego.",
        "Los exteriores dan amplitud y deben retornar.",
        "El delantero mantiene una referencia alta.",
        "El delantero puede bajar como falso 9."
      ],
      "que_vigilar": [
        "Que el único defensa no quede aislado.",
        "Que los medios de banda retornen.",
        "Que el falso 9 no baje demasiado."
      ],
      "consignas": ["Domina balón", "Amplitud y retorno", "Corrige detrás", "9 fija", "9 puede bajar"],
      "errores": [
        "Aislar al único defensa.",
        "Medios de banda sin retorno.",
        "Cuatro medios planos y sin movilidad.",
        "Falso 9 demasiado bajo."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1141-GUIA-COMPLETA/bloque-1/frames/f",
        "total": 84
      },
      "fuente": { "documento": "Táctica 1-1-4-1 · Bloque 1 (Estructura y roles)", "seccion": "Estructura base e intención ofensiva" }
    },
    {
      "id": "bloque-2-defensa",
      "orden": 2,
      "nombre_corto": "Defensa",
      "titulo": "Transformación defensiva",
      "objetivo": "Mostrar cómo el 1-1-4-1 ofensivo se reorganiza al defender: variante 3-2-1 y variante de línea de 4, sin renunciar a la salida con calidad tras el robo.",
      "idea_clave": "Mismos jugadores, dos transformaciones defensivas.",
      "decisiones": [
        "Los dos medios exteriores bajan a ambos lados del único defensa.",
        "Aparece una línea de 3 con dos medios por delante (3-2-1).",
        "Si hace falta, un medio interior baja y se forma línea de 4.",
        "Queda un medio por delante y el 9 mantiene la referencia alta.",
        "Tras el robo se busca salir jugando con calidad."
      ],
      "que_vigilar": [
        "Que el retorno de los exteriores sea completo.",
        "Que la línea de 4 no quede desordenada.",
        "Que no se pierda la salida tras el robo."
      ],
      "consignas": ["Bandas bajan", "3 detrás", "Si hace falta un interior baja", "9 arriba", "Roba y juega"],
      "errores": [
        "Dejar al único defensa aislado.",
        "Que un medio de banda no retorne.",
        "Bajar a todos los centrocampistas y perder salida.",
        "Robar y rifar el balón."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1141-GUIA-COMPLETA/bloque-2/frames/f",
        "total": 85
      },
      "fuente": { "documento": "Táctica 1-1-4-1 · Bloque 2 (Transformación defensiva)", "seccion": "Organización defensiva" }
    }
  ]
},
{
  "id": "CAMPOBASE-TACTICA-1411-GUIA-COMPLETA",
  "nombre": "Sistema 1-4-1-1",
  "formacion": "1-4-1-1",
  "organizacion": "1 portero · 4 defensas · 1 medio · 1 delantero",
  "principio": "Línea de cuatro completa, todos los carriles ocupados y un box-to-box que ayuda en ataque y defensa: un sistema para proteger el resultado y progresar por el medio.",
  "framesManifest": TACTICA_1411_FRAMES,
  "team": [
    { "x": 50, "y": 90, "n": "1", "pos": "Portero" },
    { "x": 20, "y": 76, "n": "2", "pos": "Lateral der." },
    { "x": 40, "y": 78, "n": "4", "pos": "Central izq." },
    { "x": 60, "y": 78, "n": "5", "pos": "Central der." },
    { "x": 80, "y": 76, "n": "6", "pos": "Lateral izq." },
    { "x": 50, "y": 55, "n": "8", "pos": "Medio" },
    { "x": 50, "y": 30, "n": "9", "pos": "Delantero" }
  ],
  "bloques": [
    {
      "id": "bloque-1-estructura",
      "orden": 1,
      "nombre_corto": "Estructura",
      "titulo": "Estructura y funciones",
      "objetivo": "Mostrar la estructura base 1-4-1-1 y definir las funciones de los cuatro defensas, el box-to-box y el delantero.",
      "idea_clave": "Línea de 4, todos los carriles ocupados y un box-to-box con recorrido.",
      "decisiones": [
        "Línea completa de cuatro defensores.",
        "Todos los carriles quedan ocupados.",
        "Los laterales pueden avanzar como carrileros.",
        "Un central puede saltar mientras el otro compensa.",
        "El medio ayuda en ataque y defensa (box-to-box).",
        "El delantero fija y ayuda a equilibrar."
      ],
      "que_vigilar": [
        "Que los laterales no suban sin cobertura.",
        "Que los dos centrales no abandonen el eje.",
        "Que el medio no sea estático."
      ],
      "consignas": ["4 detrás", "Laterales ida y vuelta", "Centrales protegen", "8 box-to-box", "9 fija"],
      "errores": [
        "Subir a los dos laterales sin cobertura.",
        "Que los dos centrales abandonen el eje.",
        "Usar un medio estático como si fuera box-to-box.",
        "Hundir al delantero y perder profundidad."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1411-GUIA-COMPLETA/bloque-1/frames/f",
        "total": 81
      },
      "fuente": { "documento": "Táctica 1-4-1-1 · Bloque 1 (Estructura y funciones)", "seccion": "Estructura base" }
    },
    {
      "id": "bloque-2-triangulaciones",
      "orden": 2,
      "nombre_corto": "Triangulaciones",
      "titulo": "Triangulaciones por carril",
      "objetivo": "Mostrar cómo el equipo crea relaciones de tres hombres en uno u otro costado sin perder la base de cuatro defensores.",
      "idea_clave": "Apoyo corto y ángulo: triángulo 4-5-8 a la izquierda y 6-2-9 a la derecha.",
      "decisiones": [
        "En el lado izquierdo, el apoyo lo da el 8 y aparece el triángulo 4-5-8.",
        "En el lado derecho, el apoyo lo da el 9 y aparece el triángulo 6-2-9.",
        "El balón cambia de lado con orden, sin romper la estructura.",
        "El 9 cae a banda para ayudar en el lado derecho.",
        "Se conserva la base de cuatro defensores."
      ],
      "que_vigilar": [
        "Que el 8 no llegue demasiado lejos y no apoye corto.",
        "Que el 9 no caiga siempre y vacíe el centro.",
        "Que no se rompa la línea de 4."
      ],
      "consignas": ["Apoyo corto", "Ángulo", "Cambia sin romper", "8 en un lado", "9 en el otro"],
      "errores": [
        "Que el 8 llegue demasiado lejos y no apoye corto.",
        "Que el 9 caiga siempre y vacíe el centro.",
        "Romper la línea de 4 por mover demasiadas piezas.",
        "Confundir triangulación con tres jugadores parados sin ángulos."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1411-GUIA-COMPLETA/bloque-2/frames/f",
        "total": 85
      },
      "fuente": { "documento": "Táctica 1-4-1-1 · Bloque 2 (Triangulaciones por carril)", "seccion": "Triangulaciones y superioridades" }
    },
    {
      "id": "bloque-3-equilibrio",
      "orden": 3,
      "nombre_corto": "Equilibrio",
      "titulo": "Equilibrio defensivo y protección de resultado",
      "objetivo": "Cerrar el uso defensivo del 1-4-1-1: línea de 4 completa, todos los carriles ocupados, box-to-box ayudando y carril central protegido.",
      "idea_clave": "Línea de 4, 8 ayuda por delante y carril central protegido.",
      "decisiones": [
        "El bloque recupera su línea de cuatro.",
        "El 8 ayuda por delante de la línea.",
        "El 9 mantiene relación con el bloque.",
        "Todos los carriles quedan ocupados.",
        "El carril central queda especialmente protegido.",
        "8 y 9 ajustan para dar equilibrio."
      ],
      "que_vigilar": [
        "Que no se invente una línea de 5.",
        "Que el 8 no se hunda demasiado.",
        "Que no queden pasillos interiores abiertos."
      ],
      "consignas": ["Línea de 4", "8 ayuda", "9 acompaña", "Cierra centro", "Ocupa carriles"],
      "errores": [
        "Inventar una línea de 5.",
        "Hundir demasiado al 8.",
        "Dejar pasillos interiores abiertos.",
        "Desconectar al 9 del bloque."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-1411-GUIA-COMPLETA/bloque-3/frames/f",
        "total": 85
      },
      "fuente": { "documento": "Táctica 1-4-1-1 · Bloque 3 (Equilibrio defensivo)", "seccion": "Defensa y protección de resultado" }
    }
  ]
},
{
  "id": "CAMPOBASE-TACTICA-12211-GUIA-COMPLETA",
  "nombre": "Sistema 1-2-2-1-1",
  "formacion": "1-2-2-1-1",
  "organizacion": "1 portero · 2 defensas · 2 medios · 1 mediapunta · 1 delantero",
  "principio": "Cinco jugadores protegen el carril central, la mediapunta enlaza y el delantero queda como referencia alta: obligar al rival a progresar por fuera.",
  "framesManifest": TACTICA_12211_FRAMES,
  "team": [
    { "x": 50, "y": 90, "n": "1", "pos": "Portero" },
    { "x": 30, "y": 74, "n": "4", "pos": "Defensa izq." },
    { "x": 70, "y": 74, "n": "5", "pos": "Defensa der." },
    { "x": 40, "y": 58, "n": "6", "pos": "Medio izq." },
    { "x": 60, "y": 58, "n": "8", "pos": "Medio der." },
    { "x": 50, "y": 30, "n": "9", "pos": "Delantero" },
    { "x": 50, "y": 44, "n": "10", "pos": "Mediapunta" }
  ],
  "bloques": [
    {
      "id": "bloque-1-estructura",
      "orden": 1,
      "nombre_corto": "Estructura",
      "titulo": "Estructura y carril central",
      "objetivo": "Fijar la estructura 1-2-2-1-1 y explicar cómo cinco jugadores protegen el carril central para obligar al rival a progresar por fuera.",
      "idea_clave": "Cinco protegen el carril central y el 9 queda como referencia alta.",
      "decisiones": [
        "2 defensas + 2 centrocampistas + mediapunta protegen el carril central.",
        "El delantero queda como referencia alta.",
        "Los dos defensas y los dos centrocampistas necesitan movilidad coordinada.",
        "El objetivo es obligar al rival a progresar por fuera.",
        "La mediapunta enlaza entre medios y delantero."
      ],
      "que_vigilar": [
        "Que el carril central quede bien protegido.",
        "Que la movilidad de defensas y medios sea coordinada.",
        "Que el 9 no pierda la referencia alta."
      ],
      "consignas": ["Cinco protegen el centro", "Movilidad coordinada", "10 enlaza", "9 referencia alta", "Obliga a salir por fuera"],
      "errores": [
        "Abrir el carril central.",
        "Defensas y medios sin movilidad coordinada.",
        "Perder la referencia alta del 9.",
        "Dejar de enlazar con la mediapunta."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-12211-GUIA-COMPLETA/bloque-1/frames/f",
        "total": 163
      },
      "fuente": { "documento": "Táctica 1-2-2-1-1 · Bloque 1 (Estructura y carril central)", "seccion": "Estructura y carril central" }
    },
    {
      "id": "bloque-2-basculacion",
      "orden": 2,
      "nombre_corto": "Basculación",
      "titulo": "Basculación a banda y robo",
      "objetivo": "Mostrar cómo el bloque gira hacia el lado del balón, concentra ayudas, achica espacio y roba en el costado fuerte.",
      "idea_clave": "Girar, achicar y robar en el costado fuerte.",
      "decisiones": [
        "Cuando el balón va a banda, el bloque se desplaza hacia ese lado.",
        "Se concentran hasta cuatro jugadores cerca del balón.",
        "Se achica el espacio para encerrar al rival.",
        "La prioridad es cerrar el centro.",
        "Tras el robo, el 10 enlaza y el 9 ofrece profundidad."
      ],
      "que_vigilar": [
        "Que la basculación no sea tardía.",
        "Que no se abra el pasillo interior.",
        "Que lleguen ayudas reales, no solo dos jugadores."
      ],
      "consignas": ["Gira", "Achica", "Ayuda", "Roba", "10 cerca", "9 arriba"],
      "errores": [
        "Basculación desordenada o tardía.",
        "Abrir el pasillo interior.",
        "Llegar solo con dos jugadores y sin ayudas.",
        "Robar y no tener continuidad."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-12211-GUIA-COMPLETA/bloque-2/frames/f",
        "total": 165
      },
      "fuente": { "documento": "Táctica 1-2-2-1-1 · Bloque 2 (Basculación a banda)", "seccion": "Basculación y robo en banda" }
    },
    {
      "id": "bloque-3-transformaciones",
      "orden": 3,
      "nombre_corto": "Transformaciones",
      "titulo": "Transformaciones por dentro y falso 9",
      "objetivo": "Mostrar los dos ajustes del sistema cuando el balón va al centro: línea de 3 por detrás y variante con falso 9, sin venderlos como tácticas nuevas.",
      "idea_clave": "Balón al centro: uno baja a la línea de 3 y el 9 puede caer como falso 9.",
      "decisiones": [
        "Un centrocampista baja y forma la línea de 3 por detrás.",
        "El otro medio queda por delante como apoyo interior.",
        "La mediapunta sigue siendo nexo entre medio y ataque.",
        "En la segunda variante, el 9 baja y actúa como falso 9.",
        "La intención es ganar equilibrio central y mejores apoyos interiores."
      ],
      "que_vigilar": [
        "Que no se presente como un sistema nuevo separado.",
        "Que no se rompan las distancias.",
        "Que el 9 no se hunda tanto que desaparezca su amenaza."
      ],
      "consignas": ["Balón al centro", "Uno baja", "3 detrás", "10 mediapunta", "9 falso 9"],
      "errores": [
        "Presentarlo como un sistema nuevo separado.",
        "Romper las distancias.",
        "Hundir tanto al 9 que desaparezca su amenaza.",
        "Inventar numeraciones no respaldadas por la fuente."
      ],
      "animacion": {
        "frames": "assets/tacticas/CAMPOBASE-TACTICA-12211-GUIA-COMPLETA/bloque-3/frames/f",
        "total": 159
      },
      "fuente": { "documento": "Táctica 1-2-2-1-1 · Bloque 3 (Transformaciones por dentro)", "seccion": "Transformación central y falso 9" }
    }
  ]
}
]);

export function findTacticaInteractiva(id) {
  return TACTICAS_INTERACTIVAS.find((t) => t.id === id);
}

// Tácticas interactivas asociadas a una formación concreta.
export function tacticasDeFormacion(formacion) {
  return TACTICAS_INTERACTIVAS.filter((t) => t.formacion === formacion);
}
