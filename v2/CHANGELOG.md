# Changelog

## Sin publicar — Claude: shell y Hoy real

- Cabecera, lateral, navegación móvil y Hoy adoptan composición, tarjetas, jerarquía y estilos de Claude, con los datos y acciones existentes.
- Temporada de Liga derivada sin escrituras; sesiones vacías muestran duración pendiente y Lo próximo conserva la siguiente sesión aunque haya entrenamiento hoy.
- Preview GitHub de la misma rama: Auth y lecturas Supabase existentes; mutaciones y cola bloqueadas en la preview. Sin cambios al despliegue productivo.


## 2.44.0 — 2026-09-09

- Pack150: 25 ejercicios nuevos publicados — 126-150 (Sección 6 «Portería», categoría Porteros), completando el Pack150 (149 ejercicios; el 096 omitido por decisión de Migue).
- Animaciones desarrolladas leyendo y entendiendo cada ejercicio contra el diagrama del PDF: postura básica, desplazamientos, recepciones (raso/medio/alto), achique 1v1, ángulos de remate, salida en esquina, blocajes aéreos (puños/manos), estiradas (baja/alta), recuperación tras estirada, saques (rolling/volea/meta), juego con los pies, salida fuera del área, doble remate, coordinación óculo-manual, fortaleza mental, comunicación con defensa, circuito integrado y test de evaluación.
- Correcciones de Migue aplicadas: portero bajo palos en todos los ejercicios, lanzador en el 139, salida del portero hacia el balón en el 134, portería en el 146, test 150 reproduciendo las 4 series sin artefactos, extremidades en negro.
- 170 pruebas automatizadas en verde; sin cambios en cronómetro, sustituciones, minutos, eventos, puntuaciones ni finalización del partido.

## 2.43.0 — 2026-09-09

- Pack150: 20 ejercicios nuevos publicados — 106-125 (Sección 5 «Defensa y Duelos 1v1», categoría Táctica), completando la sección.
- Animaciones desarrolladas leyendo y entendiendo cada ejercicio contra el diagrama del PDF: basculación colectiva, presión alta secuencial, duelo aéreo, marcaje en balón parado, slide tackle (entrada legal), bloqueo de remate, defensa del carril central con comodín, 1v1 lateral por banda (recortar), duelo por segunda pelota, salida ordenada tras robo, zona 4-4-2 y circuito defensivo integrado.
- 170 pruebas automatizadas en verde; sin cambios en cronómetro, sustituciones, minutos, eventos, puntuaciones ni finalización del partido.

## 2.42.0 — 2026-09-08

- Preparación de partido: al guardar, la alineación completa de siete jugadores, formación y porteros crea o actualiza automáticamente el partido en vivo en fase «Preparado».
- Partido en vivo: cualquier convocado puede actuar como portero; al elegir un jugador de campo se intercambia su posición sin duplicarlo, y el portero del segundo tiempo puede jugar de campo durante el primero.
- Delegado: recibe la misma alineación preparada y el permiso «Mostrar al delegado» mediante el estado compartido del partido en vivo.
- Sincronización: una sesión antigua en fase `ready` se reconstruye desde la preparación guardada y las mutaciones locales pendientes sobreviven a la descarga de Supabase.
- Preparación: el estado se repinta tras guardar y muestra «✓ Preparado» en lugar de quedarse visualmente en «Sin preparar».
- 170 pruebas automatizadas en verde; sin cambios en cronómetro, sustituciones, minutos, eventos, puntuaciones ni finalización del partido.

## 2.41.0 — 2026-09-08

- Pack150: 24 ejercicios nuevos publicados — 081-095 y 097-105 (Sección 4 Resistencia/Física y Sección 5 Defensa/Duelos 1v1). El 096 (Circuito integrado) se omite por decisión de Migue.
- Ejercicios físicos con figuras humanas anatómicas (Everkinetic, CC BY-SA 4.0) en lugar de círculos; los de fútbol se mantienen con círculos como el PDF original.
- Correcciones: sentadillas/burpees sin barra (peso corporal), 089 sin cinta de correr (remate a portería), 090 Nordic curl con el compañero detrás sujetando los tobillos, 091 salto horizontal con flecha recta, 100 sprint/yo-yo sin cinta.

## 2.40.0 — 2026-09-08

- Tácticas: cinco guías interactivas nuevas — 1-1-3-1-1, 1-1-4-1, 1-4-1-1, 1-2-2-1-1 y una variante de 1-3-2-1 (línea de 3) — con frames, bloques y animaciones.
- «Partido en vivo»: cuatro formaciones nuevas (1-1-3-1-1, 1-1-4-1, 1-4-1-1, 1-2-2-1-1) con su MP4 asociado.
- Catálogo de formaciones ampliado a once (F7) y diez en vivo.

## 2.39.0 — 2026-09-08

- Supabase: cada jugador conserva únicamente la puntuación de su partido más reciente; las puntuaciones históricas siguen guardadas en cada partido para estadísticas y medias.
- Limpiadas 12 referencias a un partido eliminado; verificación final: 13 jugadores con una puntuación válida, 2 sin puntuación y 0 historiales huérfanos o duplicados.
- Añadidas pruebas de regresión para puntuar un partido nuevo y para corregir uno anterior sin reemplazar la última puntuación.
- Preparación de partido: la alineación, formación y porteros guardados ahora se pasan al partido en vivo al iniciarlo.
- Preparación de partido: convocados ordenados alfabéticamente y mostrados como chips separados.
- Preparación de partido: añadido el botón «Ver táctica (GIF/MP4)» con reproductor y selector de velocidad.
- Preparación de partido: añadido el botón «Borrar preparación» para eliminar una preparación guardada (la convocatoria y el partido no se tocan).

## 2.38.0 — 2026-09-08

- Pack150: ejercicios 061-080 integrados y publicados; 061-075 completan la Sección 3 (Pase/Técnica/Posesión) y 076-080 inician la Sección 4 (Resistencia y Preparación Física).
- Diagramas corregidos para reproducir fielmente líneas de delimitación, zonas neutras sombreadas y objetivos externos; terminología corregida a «dar e ir».

## 2.37.0 — 2026-09-08

- Pack150 Sección 3: ejercicios 056-060 (Pase/Técnica/Posesión).
- 5 ejercicios nuevos: control de balón alto con muslo, control con pecho + descarga, recepción y giro con adversario a la espalda, pase corto contra pared, pase corto en tríos (triángulos).


## 2.36.0 — 2026-09-08

- Pack150 Sección 3 (Pase/Técnica/Posesión): ejercicios 051-055 integrados y publicados (dominios individuales pie dominante, dominios alternando pies, dominios con muslo y cabeza, dominios progresivos en circuito y control orientado con interior).

## 2.35.0 — 2026-09-08

- Nueva táctica del manual «Sistema 1-3-1-2» (6 bloques: Estructura, Salida, Progresión, Basculaciones, Pressing, Bloque bajo) con animación por frames y pizarra editable.
- Añadida a «Partido en vivo» (formación 1-3-1-2 con MP4 y numeración canónica 2,3,4,7,9,11).

## 2.34.0 — 2026-09-08

- Pack150 Sección 2 (Definición/Finalización): ejercicios 031-050 integrados y publicados (1v1 con portero centro/banda, 2v1, 3v2, cara a cara vaselina/raso, cabeceos estático/centro/defensivo-ofensivo, remates de larga distancia, defensor pasivo/activo, rondo, rebote, secuencias rotativas, vaselina, volea, media volea y circuito completo de finalización).

## 2.33.0 — 2026-09-08

- Nueva táctica del manual «Sistema 1-3-3» (5 bloques: Estructura, Salida, Ataque 8-9, Ataque 4-5, Ajuste 4-2-2) con animación por frames y pizarra editable.
- Añadida a «Partido en vivo» (formación 1-3-3 con MP4 y numeración canónica 2,3,4,7,9,11).

## 2.32.3 — 2026-09-08

- Pack150 Sección 2 (Definición/Finalización): ejercicios 026-030 integrados y publicados (definición estática pie dominante/no dominante, primer toque pase raso/aéreo, definición tras conducción rápida).

## 2.32.2 — 2026-09-08

- Botón «Cerrar vídeo» en el visor a pantalla completa del vídeo real (demostración), igual que «Cerrar animación».
- Los controles (selector de velocidad incluido) suben por encima del botón de cerrar al ampliar, para no solaparse (mismo criterio que la guía de tácticas).

## 2.32.1 — 2026-09-08

- Botón «Cerrar animación» en los GIF/MP4 de TODOS los ejercicios (antiguos y nuevos), igual que en las tácticas: botón rojo fijo abajo centrado que cierra el visor a pantalla completa.

## 2.32.0 — 2026-09-08

- Nueva táctica del manual «Variante 4 · 1-1-3-2» (5 bloques) con animación por frames y pizarra editable.
- Pack150: integrados los 25 ejercicios de la Sección 1 (Agilidad y Coordinación), 001-025, con GIF/MP4 y ficha completa.
- Series paso a paso: los 78 ejercicios (53 publicados + 25 Pack150) muestran ahora cada paso del desarrollo como casilla numerada, en lugar de un único texto seguido.
- 150 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.32.0`.

## 2.31.0 — 2026-09-07

- Nueva táctica del manual «Sistema 1-2-2-2» (formación nueva, no variante): 5 bloques (Funciones, Ataque, Defensa, Variante 2-4, Contraataque) con animación por frames y pizarra editable con dorsales del paquete (1, 4, 5, 6, 8, 9, 10).
- La 1-2-2-2 ya existía en «Partido en vivo»; se añade solo al manual de guías, sin tocar lo existente.
- Velocidad base 1× = la del GIF tal cual (los GIF ya vienen rápidos: 110/100/90/80 ms por bloque).
- 150 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.31.0`.

## 2.30.0 — 2026-09-07

- Nueva táctica del manual «Sistema 1-3-2-1» (sistema base): 4 bloques (Funciones, Salida, Ataque, Defensa) con animación por frames y pizarra editable con numeración clásica (1, 2, 3, 4, 5, 6, 7).
- La 1-3-2-1 ya existía en «Partido en vivo»; se añade solo al manual de guías, sin tocar lo existente.
- 147 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.30.0`.

## 2.29.0 — 2026-09-07

- Nueva táctica del manual «Sistema 1-2-1-3» (formación nueva, no variante): 3 bloques (Funciones, Defensa, Salida) con animación por frames y pizarra editable con dorsales del paquete (1, 4, 5, 6, 8, 9, 10).
- Añadida la formación 1-2-1-3 a «Partido en vivo» (pizarra con jugadores reales + MP4), sin tocar las formaciones existentes.
- Velocidad base 1× de las animaciones tácticas al triple de rápido (factor ⅓) en 1-2-3-1 y 1-2-1-3.
- Corrección móvil: la pizarra de la guía captura el gesto táctil para dibujar flechas (`touch-action:none`).
- Corrección móvil: el GIF/MP4 de la guía se amplía en iOS Safari con fullscreen CSS propio (respaldo a `requestFullscreen`).
- El PIN funciona también en el panel de previsualización del chat (SHA-256 puro como respaldo a `crypto.subtle`).
- 144 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.29.0`.

## 2.28.0 — 2026-09-07

- Corrección del ejercicio `CAMPOBASE-VIDEO-PASE-BALON-ESPACIO-2-CONOS-1V1-FINALIZACION`: se reinterpreta como circuito de conos con centro lateral y remate (pared inicial, salida por banda, circuito de conos, centro y remate ante portero), en lugar de 1v1. Se conserva el registro, el vídeo real y la URL de Supabase.
- Nueva animación GIF/MP4 (`CampoBase_Circuito_Conos_Centro_Remate_V3`) para el ejercicio corregido.
- 140 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.28.0`.

## 2.27.0 — 2026-09-07

- Corrección de la pizarra de la táctica «Sistema 1-2-3-1»: la pizarra editable real aparece dentro del desplegable y se sincroniza con su vista ampliada (mover jugadores/rivales/balón, dibujar pases/movimientos/conducciones/disparos/sprints, borrar línea, borrar todo, leyenda).
- El botón rojo «Cerrar pizarra» queda fijo abajo, visible y sin tapar el campo, con el mismo tratamiento que «Cerrar animación» del GIF/MP4.
- Herramientas y leyenda completas sin recorte en vertical y horizontal.
- 139 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.27.0`.

## 2.26.0 — 2026-09-07

- 11 ejercicios nuevos con vídeo real integrados en la biblioteca (formato `CAMPOBASE-VIDEO-*`): conducción + dejar balón + 3 conos + vuelta lateral + pase, pies rápidos + sprint explosivo (3 variaciones), finalización de primeras con servicio central y cambio de fila, duelos 3v2 con finalización (robo = fin y rotación por roles), ida por conos + vuelta por picas + finalización, 3 finalizaciones consecutivas (centro, zona exterior y centro lateral), competición de definición de cabeza con portero fijo, finalización doble (2 balones + transición + 1v1 + cambio de carril), definición con 4 picas (secuencia de pase y disparo), definición con pase entre líneas y pase filtrado, y pase + balón al espacio + carrera por 2 conos + 1v1 + finalización.
- Cada ejercicio con GIF convertido a MP4 ligero (animación) y vídeo real en Supabase Storage (`ejercicio-videos`).
- Tácticas interactivas: sustituidas las 6 tácticas antiguas del manual por un desplegable «Selecciona una táctica» con ficha maestra única. Primera táctica: «Sistema 1-2-3-1» (5 bloques con explicaciones de entrenador, lupa para ampliar y pizarra grande plegada por defecto).
- 138 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.26.0`.

## 2.25.0 — 2026-09-06

- 11 ejercicios nuevos con vídeo real integrados en la biblioteca (formato `CAMPOBASE-VIDEO-*`): knee drive reactivo + salto skater (3 variaciones), doble devolución alrededor de pica, rodillas altas laterales + zigzag, desplazamiento lateral progresivo en pasillo, reacción con giro inicial y señales, zigzag central/lateral alternado, pases continuos + mini vallas + sprint, conducción con cruz y pinchada, conduce/deja balón/gira cono, reacción par/impar blanco/amarillo, y 6 saltos laterales + knee drive + sprint de 13,7 m.
- Cada ejercicio con GIF convertido a MP4 ligero (animación) y vídeo real en Supabase Storage (`ejercicio-videos`).
- 131 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.25.0`.

## 2.24.0 — 2026-09-06

- La media de puntuación solo cuenta partidos donde el jugador jugó al menos 5 minutos. Un suplente que jugó 0 o menos de 5 minutos no baja su media.
- El total «minutos acumulados» de la plantilla ahora suma solo los minutos de LIGA (antes sumaba también pretemporada).
- Al borrar un partido se borran todas sus estadísticas de plantilla y minutos, como si no se hubiera jugado (ya era así; se confirma).
- 131 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.24.0`.

## 2.23.0 — 2026-09-06

- En la ficha de plantilla, a la derecha del avatar (mismo tamaño que las iniciales), aparece la media de puntuación de LIGA (no pretemporada).
- La media de puntuación ahora solo cuenta partidos donde el jugador jugó minutos (minutos > 0). Un jugador lesionado que no jugó no baja su media, ni en la ficha ni en el lateral.
- 131 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.23.0`.

## 2.22.0 — 2026-09-06

- Nueva pestaña «Preparación de partido» (solo Migue), entre Convocatoria y Partido en vivo. Permite preparar la alineación de varios partidos días antes: partido, porteros de cada tiempo, pizarra táctica y convocados (solo lectura, vienen de Convocatoria).
- Al guardar queda «✓ Guardado» y se puede reeditar. Los partidos finalizados desaparecen de la lista.
- Botón «Mostrar al Delegado» / «Ocultar al Delegado» por partido.
- La pestaña «Tácticas» se mueve entre Ejercicios y Calendario.
- Convocatoria y Partido en vivo no se tocan.
- 130 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.22.0`.

## 2.21.0 — 2026-09-06

- El delegado solo ve el partido en vivo 20 minutos antes de la hora programada (la que Migue pone en el calendario), o cuando Migue lo desbloquea antes con el botón «Enseñar al delegado», o cuando el partido ya ha empezado.
- Migue puede preparar el partido días antes (ya era posible); ahora el delegado no lo ve hasta que corresponde.
- 130 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.21.0`.

## 2.20.0 — 2026-09-06

- Fase B de la pizarra en vivo: al llegar al descanso se pide SIEMPRE la alineación del 2º tiempo. La pizarra se abre con el once del 1er tiempo y Migue (o el delegado) ajusta quién entra, quién sale y los cambios de posición antes de arrancar el 2º tiempo.
- Cambiar de táctica en la pizarra ya no borra jugadores: conserva los asignados y los reordena en la nueva formación (misma lógica que el 1er tiempo).
- «En campo» y «Suplentes» (antes «Banquillo») se ordenan de más a menos minutos jugados, para decidir los cambios con el acumulador a la vista.
- El portero del 2º tiempo entra en portería automáticamente; Migue y el delegado pueden poner a un jugador de campo de portero en caso de lesión.
- 130 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.20.0`.

## 2.19.0 — 2026-09-06

- Pretemporada separada de la liga: los amistosos y torneos se agrupan aparte y sus estadísticas aparecen en casillas propias bajo el título «Pretemporada», justo debajo de las de liga.
- Estadísticas editables: Migue puede corregir manualmente todas las casillas de Liga y de Pretemporada (goles, tarjetas, lesiones, incidencias, convocatorias, rotaciones, tarde/ausente, minutos y media). Solo cambia lo que toca; el resto se conserva y no se alteran los partidos, convocatorias ni asistencias originales.
- Borrado completo de partido: al borrar un partido desaparecen también sus minutos, puntuaciones, media, historial, asistencias, convocatorias y rotaciones asociadas, incluso datos antiguos o de partidos ya borrados.
- Convocatoria: nuevos motivos manuales «Lesionado» y «Sancionado», y «Otro motivo» con casilla de explicación obligatoria.
- 130 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.19.0`.

## 2.18.0 — 2026-09-05

- Pizarra táctica en vivo con jugadores reales (nombre + dorsal) para Migue y el delegado: asignar jugadores a posiciones, mover fichas/balón, dibujar flechas, ampliar a pantalla completa y ver el GIF/MP4 de la táctica.
- Sincronización bidireccional entre la pizarra y «En campo/Banquillo»: cambiar en un lado se refleja en el otro, también durante el partido (registra el cambio y su minuto).
- Todos los jugadores arrancan en el banquillo; Migue va completando la alineación inicial desde la pizarra o los desplegables.
- Regla del portero: 1 portero juega el partido completo; si hay 2, un tiempo cada uno. Migue y el delegado pueden cambiarlo a mano en caso de causa mayor (p. ej. lesión).
- Controles «Registrar cambio manual», «Automático (1–3)» y «Proponer reparto» disponibles para Migue también antes de empezar el partido.
- Desplegable de asignación al pinchar un jugador, en pizarra normal y ampliada, para Migue y delegado.
- 119 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.18.0`.

## 2.16.6 — 2026-09-03

- Nueva biblioteca de ejercicios validados con 12 ejercicios (GIF animado + ficha con vista rápida y detalle).
- Cada ejercicio muestra: tipo, qué se trabaja, tiempo estimado (editable), jugadores, material, series (con dígitos) y explicación breve.
- Reproductor de la animación con play/pausa, paso a paso, velocidad (0.5×/1×/2×) y pantalla completa con zoom.
- Botón «Ver detalles» con objetivos, claves del entrenador, montaje, desarrollo, correcciones, reglas, variantes y fuente.
- El tiempo editable descuenta del total de la sesión (aviso corta/exacta/excedida).
- Se eliminan los ejercicios precargados antiguos; los validados viven en `js/ejercicios-validados.js`.
- 101 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.16.6`.

## 2.16.5 — 2026-09-02

- El «Historial completo» de la ficha de jugador se muestra ordenado: fecha, tipo (Convocatoria/Partido/Entrenamiento) y detalle en columnas claras, con el estado de asistencia traducido (Presente/Tarde/Ausente en vez de «present»).
- 101 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.16.5`.

## 2.16.4 — 2026-09-02

- Los desplegables de «Ver actividad y estadísticas» y sus submenús (Minutos por temporada, Puntuaciones, Media por temporada, Historial completo) ya no se cierran solos: la sincronización en segundo plano no reconstruye la vista mientras haya un `<details>` abierto.
- 101 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.16.4`.

## 2.16.3 — 2026-09-02

- El recordatorio «Minutos por jugador» ya no muestra a los porteros: solo los jugadores de campo. Los minutos del portero siguen contando en su ficha de plantilla.
- 101 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.16.3`.

## 2.16.2 — 2026-09-02

- El recordatorio «Minutos por jugador» y la propuesta de reparto recalculan los objetivos en vivo con los porteros actuales, en vez de leer valores guardados con la lógica antigua.
- 101 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.16.2`.

## 2.16.1 — 2026-09-02

- Los porteros tienen minutos fijos en el reparto: uno juega el partido completo (70 min en F7), dos juegan un tiempo cada uno (35 min).
- Los porteros quedan excluidos de los cambios automáticos y de la propuesta de reparto; solo Migue puede cambiarlos a mano.
- 101 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.16.1`.

## 2.16.0 — 2026-09-02

- Cambio manual libre de 1 a 7 jugadores para Migue y el delegado (antes el delegado solo podía 1, 3 o 7).
- Cambio automático de 1 a 3 jugadores (antes exigía mínimo 2).
- Recordatorio fijo «Minutos por jugador» en el partido en vivo, con el reparto objetivo de cada convocado.
- Botón «Proponer reparto» que sugiere todos los cambios necesarios para que cada convocado alcance su objetivo de minutos, con aviso automático al quedar 10 minutos.
- Los selectores de portero muestran solo los convocados con posición «Portero»; con uno solo se asigna a ambos tiempos.
- Puntuar en casa: el partido se finaliza sin obligar a puntuar, y las notas se pueden dar o corregir después desde el detalle del partido.
- Corregido el «null» que aparecía en el marcador cuando un partido no tenía goles registrados.
- Corregido el cierre automático de desplegables y el desmarcado de cambios: la sincronización ya no re-renderiza la pantalla mientras se interactúa.
- Diálogos de detalle de partido y puntuación más anchos.
- 97 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.16.0`.

## 2.15.1 — 2026-09-02

- Corregido el error que aparecía después de guardar el PIN demo porque la referencia del formulario se perdía durante las operaciones asíncronas.
- Verificado de extremo a extremo: el PIN demo se crea, se guarda y abre una sesión temporal aislada, sin plantilla real ni acceso a Ajustes.
- 91 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.15.1`.

## 2.15.0 — 2026-09-01

- PIN de demostración: Migue puede crear un PIN temporal que abre una sesión aislada de dos horas, sin acceso a sus datos reales ni a Ajustes.
- La demo conserva toda la operativa de Migue (incluida la puntuación de jugadores) pero nunca precarga su plantilla; los datos viven solo en memoria y se eliminan al cerrar o al caducar.
- El delegado mantiene su acceso limitado al partido; Migue, la demo y el delegado usan cada uno su propio PIN.
- 90 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.15.0`.

## 2.14.1 — 2026-09-01

- Corregido el guardado al añadir o editar jugadores sin posición asignada.
- Las fichas de Plantilla separan con claridad dorsal, posición, pierna y rotaciones, y ajustan los textos largos dentro de cada recuadro.
- La Plantilla se ordena por dorsal ascendente; los jugadores sin dorsal quedan después, ordenados por nombre.
- Se mantienen sin cambios el borrado de jugadores y el resto de módulos ya validados.

## 2.14.0 — 2026-09-01

- Precarga idempotente de los 13 jugadores de Unión Viera Alevín D 2026/27 cuando la plantilla local está vacía.
- Ramiro Casati se crea como portero con dorsal 1; los otros doce jugadores quedan sin dorsal ni posición para completarlos desde el CRUD existente.
- Las plantillas que ya contienen jugadores se conservan sin cambios y la migración se registra mediante `squad-26-27-seeded` para evitar repeticiones.
- El módulo de precarga forma parte de la caché offline `campobase-v2.14.0`.

## 2.13.0 — 2026-08-31

- Fase 3: catálogo F7 ampliado de cinco a ocho formaciones con 1-3-3, 1-4-1-1 y 1-2-1-3.
- El 1-3-3 aporta dos líneas de tres: central libre para coberturas, extremos con amplitud y delantero centro móvil.
- Cada formación nueva incluye siete jugadores posicionados y una guía con objetivo, juego con balón, defensa sin balón y reacción tras pérdida.
- La guía táctica ya no aparece durante la edición: se muestra únicamente al abrir el detalle de una táctica guardada.
- Gramática y coherencia deportiva revisadas en los textos incorporados en esta iteración.
- 73 pruebas automatizadas en verde y caché PWA elevada a `campobase-v2.13.0`.

## 2.12.0 — 2026-08-31

- Fase 3: pizarra táctica con flechas de colores por acción (azul = pase, gris rayado = movimiento, púrpura = conducción, rojo = disparo, verde = sprint), balón blanco con borde oscuro y jugadores con número legible.
- Leyenda corregida para que corresponda con cada tipo de flecha.
- 69 pruebas automatizadas en verde.

## 2.11.0 — 2026-08-31

- Fase 3: pizarra táctica interactiva tipo RenderFoot/TacticalPad.
- Herramientas: mover jugadores (arrastrar), pase, movimiento, conducción, disparo, sprint y balón colocable.
- Círculos de jugadores más pequeños (r=3.2).
- Flechas dibujadas a mano con 5 tipos (pase, movimiento, conducción, disparo, sprint) y leyenda.
- Guardar táctica persiste posiciones movidas, balón y flechas dibujadas.
- 5 formaciones F7 explicadas (1-3-2-1, 1-2-3-1, 1-2-2-2, 1-3-1-2, 1-1-3-2) con ataque y defensa.
- 69 pruebas automatizadas en verde.

## 2.12.2 — 2026-08-31

### Corregido
- Flechas de color real: los markers SVG ahora usan `fill="context-stroke"` para heredar el color del trazo (antes eran todas negras). Sprint en amarillo `#f6cf4c` para contraste sobre campo verde.
- Números de jugadores centrados dentro del círculo (`text-anchor:middle`) en jugadores y rivales (antes desplazados a la derecha).
- Leyenda visual con barras de color real de cada tipo de flecha: pase/azul, movimiento/gris, conducción/púrpura, disparo/rojo, sprint/amarillo.

## 2.12.1 — 2026-08-31

### Corregido
- Reaparecen las reglas CSS `.tac-arrow.spr` y `.tac-sprint` con trazo verde diferenciado para las flechas de sprint. Sin esto, las flechas de sprint se renderizaban en negro y la leyenda perdía correspondencia.

## 2.10.0 — 2026-08-31

- Fase 3 mejorada: la pizarra táctica ahora precarga las 3 formaciones del manual de Migue (1-3-2-1, 1-2-3-1, 1-2-2-2) con sus posiciones.
- Cada formación incluye la explicación táctica: qué busco, con balón, sin balón/defensa y al perder el balón.
- Leyenda corregida: mi equipo en rojo y rival en negro (antes ambos del mismo color).
- 66 pruebas automatizadas en verde.

## 2.9.0 — 2026-08-31

- Fase 3: nueva pestaña «Tácticas» con pizarra táctica (F7 y F11).
- Formaciones iniciales automáticas por formato (7 y 11 jugadores) con rival.
- Pizarra SVG con movimientos animados (pase, movimiento, conducción, disparo) y leyenda.
- Tácticas guardadas por rival o situación, con CRUD completo (crear, ver, editar, borrar).
- 65 pruebas automatizadas en verde.

## 2.8.2 — 2026-08-31

- Sesiones en pestaña propia (navegación inferior), separadas de Ejercicios.
- Desde la pestaña de sesiones se pueden incluir ejercicios con el botón «+ Añadir» de cada tarjeta.
- Tiempo total de la sesión configurable (no fijo a 60): el indicador avisa si faltan minutos, están cubiertos o te pasas.
- Opción de marcar la sesión como calentamiento de partido/amistoso.
- Cada ejercicio dentro de una sesión guardada es pinchable y abre su ficha completa (diagrama, montaje, desarrollo, correcciones) para consultarlo durante el entreno.
- 61 pruebas automatizadas en verde.

## 2.7.0 — 2026-08-31

- Limpieza automática de los ejercicios precargados genéricos (los "6 chinos, 2 siluetas, 4 palos") que quedaron guardados en versiones anteriores. Solo se borran los precargados; los creados o editados a mano se conservan.
- Builder de sesión intuitivo: al pulsar «+ Sesión» y poner la fecha, se abre la lista de ejercicios bien hechos con un botón «+ Añadir» en cada uno que lo mete directo en la sesión (calentamiento, parte principal o juego final según su categoría).
- Restaurado `js/training-domain.js` (estaba sobrescrito y roto, faltaban los exports que la app y los tests necesitan).
- 60 pruebas automatizadas en verde.

## 2.5.0 — 2026-08-28

- Pizarras SVG blancas y negras con leyenda calculada por ejercicio.
- Formato de ficha operativa completo para todos los ejercicios.
- Flujo «Añadir a sesión» para crear o ampliar sesiones.
- Bloques reordenables, eliminables y con duración editable.
- Indicador en vivo de total, minutos restantes o exceso sobre 60.
- Nueva batería de pruebas de pizarra, normalización y sesiones.
- Caché PWA subida a `campobase-v2.5.0`.

## 2.1.0 — 2026-08-28

- Biblioteca ampliada de 36 a 80 ejercicios, con 44 incorporaciones y 10 tareas específicas de porteros.
- Diagramas SVG de pizarra accesibles y adaptables mediante diez plantillas reutilizables: pase, rondo, circuito, posesión, duelo, superioridad, finalización, partido reducido, calentamiento y porteros.
- Número de jugadores destacado en cada tarjeta y visible junto al nombre y la duración en los selectores de sesiones.
- Migración idempotente `phase2-v2-seeded`: añade solo identificadores ausentes y completa diagramas en ejercicios existentes sin sobrescribir nombre, favoritos ni otros cambios del usuario.
- Caché PWA elevada a `campobase-v2.1.0` y 52 pruebas automatizadas.

## 2.0.0 — 2026-08-28

- Nueva pestaña Ejercicios con 36 ejemplos iniciales, siete categorías, filtros por categoría, jugadores, material y dificultad, favoritos y CRUD completo.
- Sesiones de entrenamiento por fecha con calentamiento, 2-3 ejercicios principales, juego final, duración, material y consignas.
- Plantillas reutilizables de calentamiento de entreno (10 min) y partido (15 min).
- Ejercicios y sesiones se sincronizan en la tabla `configuracion` como documentos tipados, sin SQL ni tablas nuevas, y forman parte de la copia JSON existente.
- Caché PWA elevada a `campobase-v2.0.0` y 50 pruebas automatizadas.

## 1.8.0 — 2026-08-28

- Nombre de equipo configurable y condición local/visitante en calendario, convocatoria manual y partido en vivo.
- Porteros elegibles entre todos los convocados y persistidos para cada tiempo.
- Marcador de estadio con controles +/−, goleadores, tarjetas, lesiones e incidencias compartidos con el delegado; comentarios exclusivos de Migue.
- Ficha con resumen e historial de goles, tarjetas, lesiones, incidencias, convocatorias, asistencia, minutos y puntuaciones.

## 1.7.0 — 2026-08-28

- Sustituidos todos los controles nativos con hora por selectores propios `00–23` y `00–59` en convocatoria manual, calendario y llegadas de asistencia; iOS ya no puede imponer AM/PM.
- La rotación trabaja con jugadores únicos, mantiene provisionalmente el máximo de 14 durante decisiones pendientes y completa la convocatoria aunque existan fichas duplicadas.
- Eliminadas todas las llamadas a `confirm()`: las decisiones y borrados usan un diálogo HTML propio compatible con móvil.
- El rol autenticado se conserva en `sessionStorage` durante la pestaña actual. Una recarga causada por navegador o service worker restaura la sesión; el PIN solo reaparece al cerrar sesión o abrir una sesión nueva.
- Caché PWA elevada a `campobase-v1.7.0` y añadidas regresiones automáticas para los tres fallos.

## 1.6.0 — 2026-08-28

- La ficha permite abrir la cámara trasera o elegir una imagen del móvil; la foto se guarda como `data:image` dentro del documento del jugador y se sincroniza con el flujo Supabase existente, sin bucket adicional.
- Jugadores y fichas se muestran alfabéticamente por nombre en todas las vistas.
- Editar una convocatoria actualiza convocatoria, partido y contadores de rotación en un único lote local antes de sincronizar, sin cerrar la sesión ni pedir de nuevo el PIN.
- Los botones de edición declaran `type="button"` para impedir envíos de formulario accidentales.
- Los hashes salados de los dos PIN se sincronizan en `configuracion`: se configuran una vez y después se pide el PIN de Migue o del delegado al entrar; el error sigue siendo explícito: “PIN incorrecto.”
- La migración conserva los PIN locales de 1.5.0 y los sube cuando la nube todavía no contiene la configuración de acceso.

## 1.5.0 — 2026-08-28

- Supabase pasa a ser la fuente compartida para jugadores, partidos, convocatorias, asistencias y configuración operativa.
- IndexedDB se mantiene como caché y añade una cola persistente: las escrituras sin conexión se reintentan al recuperar red.
- Las bajas usan tombstones para propagarse a otros dispositivos; la app consulta la nube cada 10 segundos.
- El doble PIN sigue siendo local y sus hashes/sal nunca se envían a Supabase.
- Se incorpora `@supabase/supabase-js` 2.57.4 (MIT) como recurso vendorizado para que la PWA siga arrancando offline.
- Se documenta el límite crítico: la publishable key y las políticas RLS públicas no protegen datos en el servidor.

## 1.4.1 — 2026-08-28

- Al finalizar el segundo tiempo, Migue debe puntuar a cada convocado del 1 al 5 antes de guardar el partido.
- Las puntuaciones se guardan atómicamente en el partido y en el historial de la ficha de cada jugador mediante IndexedDB.
- El delegado solo puede pausar al final y avisar a Migue; no ve el formulario ni puede guardar puntuaciones.

## 1.4.0 — 2026-08-28

- Minutos acumulados por temporada en la ficha y motivo de menor participación.
- Contadores por jugador en tiempo real, guardado atómico del partido y registro de marcador, goleadores, tarjetas, lesiones y comentarios.
- Flujo Comienzo, Descanso, Segundo tiempo y Final, con auto-pausa a 38:00 y 74:00.
- Cambios manuales de 1–7, automáticos de 2–3 y rotación de un portero por tiempo.
- Doble PIN local con vista limitada del delegado; solo Migue puede cambiar ambos PIN.
- Actualización del vivo entre pestañas del mismo navegador mediante IndexedDB. La sincronización entre móviles requiere backend y queda bloqueada por la arquitectura estática autorizada.

## 1.3.0 — 2026-08-28

- Convocatorias editables y recálculo seguro de contadores de rotación.
- Memoria de exclusiones por enfermedad o decisión técnica con decisión explícita del entrenador antes de una futura rotación.
- Salida clara del partido en vivo para descartar el control actual y preparar otro.
- Entrenamientos antiguos editables, hora de llegada para tardanzas y listados ordenados por fecha sin cambiar de pantalla al guardar.
- Historial de incidencias, comentarios y exclusiones consultable en la ficha de Plantilla.
- Vista delegado limitada a tiempos y cambios: sugerencia del que menos juega, alerta urgente, cambios manuales de 1/3/7 y automático de 2–3.

## 1.2.0 — 2026-08-28

- Modalidad F7/F11 persistente, visible y aplicada a duración, jugadores en campo y reparto.
- Navegación ordenada: Plantilla, Convocatorias, Partido en vivo, Calendario, Asistencia y Ajustes.
- Horarios mostrados en 24 horas y controles de fecha/hora configurados en español.
- Convocatorias con listas separadas y total de exclusiones manuales y automáticas.
- Partido en vivo por fases, cambios manuales de 1–3 jugadores y guardado automático de eventos y minutos.
- Asistencia por entrenamientos y partidos, edición, historial por jugador, ausencias, rachas y tardanzas frecuentes.

## 1.0.0 — 2026-08-28

- Plantilla con foto, dorsal, posición, pierna, notas y clasificación de minutos.
- Convocatorias, reparto exacto F7/F11 y sugerencia de rotación equitativa.
- Partido en vivo con reloj, pausa, cambios de 2–3, minutos reales y puntuación 1–5.
- Calendario, resultados y asistencia a entrenamientos.
- Persistencia IndexedDB, modo offline y copia JSON.
