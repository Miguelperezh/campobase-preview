// js/tacticas-pdf-domain.js
// Base de conocimiento táctico de Fútbol 7 extraída del manual técnico y del documento
// oficial "Sistemas de Juego de Fútbol 7" (182764339-Sistemas-de-Juego-de-Futbol-7.pdf).
// Contiene el análisis exhaustivo de cada formación por líneas, funciones por posición,
// salida de balón, ataque, defensa, ventajas, inconvenientes y transición formativa a F11.

export const SISTEMAS_F7_ORDEN = Object.freeze([
  '1-3-2-1',
  '1-2-3-1',
  '1-2-2-2',
  '1-3-1-2',
  '1-1-3-2',
  '1-3-3',
  '1-4-1-1',
  '1-2-1-3',
  '1-1-3-1-1',
  '1-1-4-1',
  '1-2-2-1-1',
]);

export const SISTEMAS_F7_PDF = Object.freeze({
  '1-3-2-1': {
    nombre: 'Sistema 1-3-2-1',
    lineas: 'Tres líneas (1 portero · 3 defensas · 2 medios · 1 delantero)',
    tipoLineas: 'tres_lineas',
    resumen: 'Con el 1-3-2-1, el equipo ocupa el campo por alturas: línea defensiva protegida, apoyos interiores cerca del balón y un punta que fija a los centrales rivales.',
    estructura: 'Línea de 3 con 2 laterales y un central libre de coberturas. Doble pivote equilibrado en mediocampo (box-to-box o escalonados) y un delantero centro referencia.',
    funciones: [
      '2 y 3 (Carrileros/Laterales): Amplitud constante, progresión y repliegue.',
      '4 (Central): Eje defensivo con sentido de la anticipación y cobertura a bandas.',
      '5 y 6 (Medios): Uno más organizador/defensivo y otro con llegada; equilibrio preventivo.',
      '7 / 9 (Delantero): Desmarques de apoyo y ruptura, juego de espaldas y remate.',
    ],
    salida: 'Superioridad 4 contra 1 o 4 contra 2 en inicio con el portero como jugador de campo. Si el rival presiona alto, salida por fuera con los laterales o balón directo al espacio para el punta.',
    progresion: 'Los carrileros abren el campo para evitar el embudo central. Si el punta baja a recibir como apoyo, el carrilero contrario o un medio rompe en diagonal al espacio libre.',
    basculaciones: 'Prioridad de proteger el carril central. Si el balón va a banda, el bloque bascula compacto; el lateral salta y el medio cercano cubre el espacio interior.',
    pressing: 'Presión orientada con el delantero tapando el pase hacia el centro y los medios interceptando líneas interiores de pase.',
    ventajas: [
      'Mayor similitud al funcionamiento táctico del fútbol 11.',
      'Excelente distribución de espacios y esfuerzos entre líneas.',
      'Gran eficacia defensiva al jugar los elementos muy juntos inicialmente.',
      'Mejora de la posesión al no haber distancias excesivas entre compañeros.',
      'Gran peligro en salidas rápidas al contraataque.',
    ],
    inconvenientes: [
      'Pocas ayudas al punta si los mediocentros no acompañan las jugadas.',
      'Exige mayor trabajo y coordinación táctica colectiva.',
      'Demasiado recorrido físico requerido para los carrileros de banda.',
    ],
    f11: 'Elevada: es el sistema formativo por excelencia que prepara las transiciones al 1-4-2-3-1 y sistemas con laterales largos de Fútbol 11.',
  },

  '1-2-3-1': {
    nombre: 'Sistema 1-2-3-1',
    lineas: 'Tres líneas (1 portero · 2 defensas · 3 medios · 1 delantero)',
    tipoLineas: 'tres_lineas',
    resumen: 'Estructura en "W" que maximiza el dominio del centro del campo con tres medios. Es el sistema que más fomenta la creatividad asociativa y el toque.',
    estructura: 'Dos defensas centrales rápidos, tres centrocampistas (dos extremos en banda y un mediocentro organizador) y un punta rematador.',
    funciones: [
      '2 y 3 (Centrales): Coberturas mutuas, anticipación rápida y calidad técnica para iniciar.',
      '4 (Mediocentro organizador): Siempre por detrás del balón, equilibra ataque y defensa.',
      '5 y 6 / 7 y 11 (Bandas/Extremos): Habilidad en el regate, llegada a línea de fondo y centros.',
      '9 (Delantero): Movilidad en el área, finalización y presión sobre salida rival.',
    ],
    salida: 'Inicio limpio con 4 jugadores en primera y segunda línea (2 centrales + mediocentro + portero). Las bandas estiran para generar líneas de pase diagonales.',
    progresion: 'Excelente escalonamiento posicional en W. Permite triangulaciones continuas, cambios de orientación y llegada masiva al área rival.',
    basculaciones: 'Al jugar con solo dos centrales, los extremos deben replegar solidariamente para no dejar vendidas las bandas.',
    pressing: 'Muy agresivo: puede presionar el inicio del ataque rival con hasta 4 futbolistas (delantero + 3 medios).',
    ventajas: [
      'Máxima similitud ofensiva al funcionamiento del fútbol 11 (1-4-2-3-1).',
      'Gran agresividad defensiva para robar en campo rival.',
      'Excelente dominio de la posesión y control del ritmo de juego.',
    ],
    inconvenientes: [
      'Espacio libre a la espalda de los dos defensas y el portero.',
      'Requiere altísima concentración e intensidad sin balón.',
      'Déficit defensivo en bandas si los extremos se desentienden del repliegue.',
    ],
    f11: 'Muy elevada: paso natural directo al 1-4-2-3-1 y 1-4-4-2.',
  },

  '1-2-2-2': {
    nombre: 'Sistema 1-2-2-2',
    lineas: 'Tres líneas (1 portero · 2 defensas · 2 medios · 2 delanteros)',
    tipoLineas: 'tres_lineas',
    resumen: 'Variante inspirada en el "cuadrado mágico": dos centrales, dos medios interiores que equilibran y dos delanteros que fijan a la defensa rival.',
    estructura: 'Dos centrales contundentes, dos mediocentros coordinados y dos delanteros móviles con pegada.',
    funciones: [
      'Centrales: Defensa zonal y coberturas sin abrirse en exceso.',
      'Doble pivote central: Regla de compensación: si uno sube a rematar, el otro guarda la vigilancia preventiva.',
      'Delanteros en pareja: Uno ofrece desmarque de apoyo y el otro ataca la espalda de los centrales.',
    ],
    salida: 'Salida asociativa corta con el doble pivote o pase interior a los apoyos entre líneas de los dos delanteros.',
    progresion: 'Juego combinativo por dentro o incorporaciones sorpresivas por fuera; uno de los delanteros puede actuar como mediapunta.',
    basculaciones: 'Bloque central compacto. Obliga al rival a jugar por fuera donde el balón es menos peligroso.',
    pressing: 'Doble punta que asfixia el inicio rival e impide el pase al centro.',
    ventajas: [
      'Gran presencia en área rival con dos delanteros natos.',
      'Equilibrio central potente en zona de creación.',
      'Obliga a los rivales a acumular defensas atrás.',
    ],
    inconvenientes: [
      'Poca amplitud natural si los medios no caen a banda.',
      'Exige disciplina de repliegue a uno de los dos delanteros.',
    ],
    f11: 'Elevada: afinidad directa con el 4-2-2-2 y sistemas con doble delantero centro.',
  },

  '1-3-1-2': {
    nombre: 'Sistema 1-3-1-2',
    lineas: 'Tres líneas (1 portero · 3 defensas · 1 medio · 2 delanteros)',
    tipoLineas: 'tres_lineas',
    resumen: 'Distribución equilibrada que añade dos referencias en punta protegiendo la línea de tres defensas con un mediocentro posicional.',
    estructura: 'Tres defensas (dos laterales y un central), un mediocentro inteligente y dos puntas con movilidad.',
    funciones: [
      'Laterales: Incorporación por sorpresa en ataque y repliegue veloz.',
      'Central: Libre de marcaje, líder de la línea defensiva.',
      'Mediocentro: Distribución de juego y equilibrio por detrás del balón.',
      'Dos delanteros: Desmarques complementarios, caídas a banda y remate.',
    ],
    salida: 'La línea de tres ofrece salida ancha, el mediocentro descarga y conecta con cualquiera de los dos puntas.',
    progresion: 'Cuando un punta cae a banda, el otro ocupa la zona de remate y el lateral del lado débil cierra.',
    basculaciones: 'Línea de tres basculando junta ante cambios de frente; repliegue de los puntas para ayudar al medio.',
    pressing: 'Presión alta de los dos puntas para forzar el error en el inicio rival.',
    ventajas: [
      'Distribución muy racional del espacio y escalonamiento.',
      'Dos referencias de remate permanentes.',
      'Peligro constante por bandas mediante incorporaciones.',
    ],
    inconvenientes: [
      'Mucho terreno que cubrir para el único mediocentro si los laterales no equilibran.',
      'Riesgo de inferioridad en medio campo si no hay solidaridad.',
    ],
    f11: 'Elevada: base para sistemas 3-5-2 o 5-3-2 de F11.',
  },

  '1-1-3-2': {
    nombre: 'Sistema 1-1-3-2',
    lineas: 'Tres líneas (1 portero · 1 cierre · 3 medios · 2 delanteros)',
    tipoLineas: 'tres_lineas',
    resumen: 'Sistema ultra-ofensivo diseñado para monopolizar el campo contrario y ejercer una presión alta insostenible para el rival.',
    estructura: 'Un cierre de máxima jerarquía, tres centrocampistas dinámicos y dos delanteros agresivos.',
    funciones: [
      'Cierre: Coberturas amplias, velocidad en el corte y anticipación.',
      'Tres medios: Superioridad numérica en zona de creación y asfixia tras pérdida.',
      'Dos delanteros: Finalización continua y trabajo de pressing.',
    ],
    salida: 'Inicio rápido apoyado en los tres medios; portero adelantado actuando como líbero.',
    progresion: 'Llegada masiva de 5 jugadores a posiciones de remate.',
    basculaciones: 'Basculación alta y estrecha para cerrar pasillos interiores.',
    pressing: 'La presión más alta y asfixiante de todos los sistemas de Fútbol 7.',
    ventajas: [
      'Monopolio de la posesión en campo rival.',
      'Generación constante de ocasiones de gol.',
      'Ideal ante rivales muy replegados.',
    ],
    inconvenientes: [
      'Alto riesgo a la espalda del único cierre.',
      'Desequilibrio defensivo si el rival supera la primera línea.',
    ],
    f11: 'Media/Baja: apto para momentos específicos de partido con marcador adverso.',
  },

  '1-3-3': {
    nombre: 'Sistema 1-3-3',
    lineas: 'Dos líneas (1 portero · 3 defensas · 3 delanteros)',
    tipoLineas: 'dos_lineas',
    resumen: 'Estructura clásica y directa en dos líneas. Máxima sencillez táctica que explota la velocidad por bandas y el uno contra uno.',
    estructura: 'Tres defensas (dos laterales y central líbero) y tres delanteros (dos extremos abiertos y un 9 rematador).',
    funciones: [
      'Laterales: Coberturas y apoyo en largo; no necesitan gran recorrido.',
      'Central: Libre de marcaje, contundencia y despeje.',
      'Extremos: Pegados a la cal, velocidad pura, desborde 1x1 y centros.',
      'Delantero Centro: Fijar centrales y rematar todo balón en el área.',
    ],
    salida: 'Juego directo y vertical hacia los tres delanteros, o salida en largo buscando segundas jugadas.',
    progresion: 'Transiciones ultra-rápidas buscando duelos individuales en bandas.',
    basculaciones: 'Línea de 3 junta; los delanteros deben replegar si se quiere evitar la fractura del equipo.',
    pressing: 'Presión agresiva en primera línea sobre el inicio rival.',
    ventajas: [
      'Sencillez y claridad absoluta en las tareas de cada jugador.',
      'Favorece la amplitud, la profundidad y el 1 contra 1.',
      'Ideal cuando se tienen extremos rápidos y delanteros con gol.',
    ],
    inconvenientes: [
      'Vacío en el centro del campo (sin línea de medios).',
      'Equipo partido en dos si los delanteros no retroceden.',
    ],
    f11: 'Media: prepara a los extremos y laterales puros pero carece de trabajo asociativo interior.',
  },

  '1-4-1-1': {
    nombre: 'Sistema 1-4-1-1 (y 1-4-2)',
    lineas: 'Dos/Tres líneas (1 portero · 4 defensas · 1 medio · 1 delantero)',
    tipoLineas: 'dos_lineas',
    resumen: 'Fortaleza defensiva máxima. Cierra todos los pasillos interiores con cuatro defensas y transita al contraataque con velocidad.',
    estructura: 'Línea de 4 defensas (dos laterales y dos centrales), un mediocentro eje y un punta veloz.',
    funciones: [
      'Laterales: Se repliegan como defensores y se transforman en extremos en contraataque.',
      'Dos Centrales: Coberturas idénticas a F11, juego aéreo y contundencia.',
      'Mediocentro: Pulmón táctico, recuperación y primer pase.',
      'Punta: Velocidad al espacio y desahogo en balones divididos.',
    ],
    salida: 'Salida segura por bandas o contraataque directo a la espalda de la zaga contraria.',
    progresion: 'Despliegue veloz tras robo con subida alternada de los laterales.',
    basculaciones: 'Basculaciones de 4 defensas idénticas al fútbol profesional.',
    pressing: 'Repliegue intensivo en campo propio protegiendo el área.',
    ventajas: [
      'Solidez defensiva impenetrable; no deja espacios entre compañeros.',
      'Obliga al rival a disparar desde muy lejos.',
      'Enorme semejanza a la línea defensiva de 4 de Fútbol 11.',
    ],
    inconvenientes: [
      'Mucha distancia a la portería rival tras recuperar.',
      'Poca presencia de ataque en campo contrario.',
    ],
    f11: 'Muy elevada en fase defensiva (mecanismo idéntico a 4-4-2 o 4-2-3-1).',
  },

  '1-2-1-3': {
    nombre: 'Sistema 1-2-1-3',
    lineas: 'Tres líneas (1 portero · 2 defensas · 1 medio · 3 delanteros)',
    tipoLineas: 'tres_lineas',
    resumen: 'Esquema de vocación ofensiva y vertical. Dos defensas y un pivote sostienen al equipo mientras un tridente ataca constantemente.',
    estructura: 'Dos centrales abiertos, un mediocentro distribuidor y tres atacantes en línea.',
    funciones: [
      'Centrales: Concentración y rapidez al corte en transiciones.',
      'Mediocentro: Eje único de distribución e interceptación.',
      'Extremos y 9: Desbordes constantes por fuera y remate en el área.',
    ],
    salida: 'Pase del central al mediocentro o cambio de juego directo al extremo opuesto.',
    progresion: 'Ataques verticales con superioridad en los últimos metros.',
    basculaciones: 'Extremos obligados a replegar para apoyar al único mediocentro.',
    pressing: 'Tridente ofensivo que tapa toda la salida del rival.',
    ventajas: [
      'Desborde constante en 1x1 y centros peligrosos.',
      'Fija a las defensas rivales muy atrás.',
    ],
    inconvenientes: [
      'Un solo mediocentro puede quedar desbordado en transiciones rivales.',
    ],
    f11: 'Elevada para equipos que proyectan su juego al 1-4-3-3 con extremos abiertos.',
  },

  '1-1-3-1-1': {
    nombre: 'Sistema 1-1-3-1-1',
    lineas: 'Cuatro líneas (1 portero · 1 libre · 3 defensas/medios · 1 mediapunta · 1 delantero)',
    tipoLineas: 'cuatro_lineas',
    resumen: 'Innovación en cuatro alturas. Un defensa libre barre detrás de la línea de tres, un mediapunta conecta entre líneas y un delantero finaliza.',
    estructura: 'Portero, 1 libre, línea de 3, 1 mediapunta y 1 punta.',
    funciones: [
      'Libre: Cobertura a la espalda de la línea de 3, corte y visión de juego.',
      'Línea de 3: Laterales carrileros con ida y vuelta; central que presiona hacia adelante.',
      'Mediapunta: Inteligencia espacial, último pase y pausa.',
      'Delantero: Fijar y finalizar.',
    ],
    salida: 'Inicio escalonado con cuatro alturas de pase, rompiendo líneas con facilidad.',
    progresion: 'El mediapunta recibe de espaldas y gira para habilitar al punta o a los carrileros.',
    basculaciones: 'Doble filtro defensivo: línea de tres contenida y libre atento al espacio.',
    pressing: 'El delantero orienta y el mediapunta corta el pase interior.',
    ventajas: [
      'Racionalidad máxima en la ocupación escalonada del campo.',
      'Múltiples líneas de pase en cada fase del juego.',
      'Aparición natural de la figura del mediapunta formativo.',
    ],
    inconvenientes: [
      'Requiere gran madurez y comprensión táctica en los niños.',
    ],
    f11: 'Muy alta para la enseñanza de posiciones intermedias y juego de posición.',
  },

  '1-1-4-1': {
    nombre: 'Sistema 1-1-4-1',
    lineas: 'Tres líneas (1 portero · 1 defensa · 4 medios · 1 delantero)',
    tipoLineas: 'tres_lineas',
    resumen: 'Monopolio del centro del campo con cuatro centrocampistas. Juego de toques continuos, rondos dinámicos y dominio abrumador de la posesión.',
    estructura: 'Un defensa central rápido, cuatro mediocampistas (dos por dentro y dos por fuera) y un delantero centro.',
    funciones: [
      'Defensa: Rápido en coberturas y correcciones.',
      'Cuatro medios: Triangulaciones continuas, paciencia y cambios de ritmo.',
      'Delantero: Fijar y asociarse como apoyo.',
    ],
    salida: 'Superioridad absoluta en salida con cuatro receptores en el medio campo.',
    progresion: 'Avanzar juntos con balón dominado sin precipitarse.',
    basculaciones: 'Los medios exteriores deben replegar rápidamente para formar línea defensiva.',
    pressing: 'Asfixia al rival en cuanto intenta superar la línea de medios.',
    ventajas: [
      'Posesión casi total del balón durante el partido.',
      'Doble pivote interior con fluidez de pase.',
    ],
    inconvenientes: [
      'Exige máxima precisión para no perder balones en zona media.',
    ],
    f11: 'Elevada para educar en el fútbol asociativo.',
  },

  '1-2-2-1-1': {
    nombre: 'Sistema 1-2-2-1-1 (y 1-1-2-1-2)',
    lineas: 'Cuatro líneas (1 portero · 2 centrales · 2 medios · 1 mediapunta · 1 delantero)',
    tipoLineas: 'cuatro_lineas',
    resumen: 'Estructura en cuatro líneas muy compensada. Cierra el carril central con 5 futbolistas y canaliza el ataque a través del mediapunta.',
    estructura: 'Dos defensas centrales, dos medios interiores, un mediapunta de enlace y un punta.',
    funciones: [
      'Defensas: Mantener la línea compacta y dar cobertura mutua.',
      'Dos medios: Equilibrio y apoyo constante por detrás del balón.',
      'Mediapunta: Jugador más creativo del equipo, asistencia y llegada.',
      'Delantero: Movilidad y desmarques al espacio.',
    ],
    salida: 'Apoyos seguros y triangulaciones constantes por el centro.',
    progresion: 'El mediapunta encuentra espacios a la espalda de los medios rivales.',
    basculaciones: 'Bloque muy estrecho que obliga al rival a jugar por fuera.',
    pressing: 'Presión coordinada del punta y mediapunta cerrando líneas centrales.',
    ventajas: [
      'Carril central completamente bloqueado para el rival.',
      'Excelente fluidez en transiciones ofensivas.',
      'Desarrollo de la creatividad del mediapunta.',
    ],
    inconvenientes: [
      'Poca amplitud exterior si los delanteros no caen a banda.',
    ],
    f11: 'Muy alta: base perfecta para sistemas 4-2-3-1 y 3-4-2-1.',
  },
});

export function getSistemaF7Pdf(formacion) {
  return SISTEMAS_F7_PDF[formacion] || SISTEMAS_F7_PDF['1-3-2-1'];
}
