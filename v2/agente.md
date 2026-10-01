# Manual de Agente — CampoBase (`agente.md`)

Este documento reúne toda la información técnica, arquitectónica y operativa sobre CampoBase: qué se ha hecho, dónde está cada archivo en el proyecto y cómo debe funcionar la aplicación para mantenerla rápida, estable y alineada con las necesidades de los entrenadores.

---

## 1. Resumen de Mejoras Recientes (v20 — v25)

### 1.1 Rendimiento Inmediato y Eliminación de Lentitud al Entrar y Poner PIN (v20)
- **Causa anterior:** Al arrancar o introducir el PIN se encadenaban múltiples llamadas bloqueantes a la nube (Supabase), recargas forzadas (`location.reload()`) y sincronizaciones redundantes que congelaban el hilo de JavaScript y la respuesta de la pantalla táctil.
- **Solución implementada:**
  - **Local-First estricto:** La aplicación carga inmediatamente desde IndexedDB (`js/db.js`). La pantalla se renderiza en milisegundos sin esperar a la red.
  - La sincronización con Supabase se despacha en segundo plano (*non-blocking*) sin bloquear la interfaz ni los botones.
  - Se eliminaron recargas innecesarias de página y bucles en la validación del PIN (`js/saas-auth-ui-v2.js` y `js/supabase-client.js`).
  - Los clics en pestañas, píldoras y botones reaccionan de inmediato (< 50ms).

### 1.2 Goles en Propia Puerta («Gol P.P.») (v21)
- **Causa anterior:** Al registrar o editar incidencias de partido (en vivo o desde el Calendario), el sistema obligaba siempre a seleccionar un jugador de la plantilla. Si el gol era en propia puerta del rival o autogol fortuito, obligaba a asignar a un jugador indebido.
- **Solución implementada:**
  - Se introdujo la opción canónica **«Gol P.P.»** (identificador `__pp__`).
  - Permite sumar el gol al marcador del partido sin obligar a seleccionar un jugador de la plantilla y sin alterar las estadísticas individuales de ningún jugador.
  - En la lista de incidencias y tarjetas se visualiza claramente como **«Gol P.P.»**.

### 1.3 Marcador Actualizado en Tiempo Real en Calendario (v21)
- **Causa anterior:** Al añadir o corregir goles desde el editor de incidencias del partido en el Calendario, el marcador de la tarjeta del partido no se actualizaba en pantalla hasta que se recargaba toda la web.
- **Solución implementada:**
  - El recuento de `goalsFor` y `goalsAgainst` se actualiza de forma atómica en IndexedDB y se propaga inmediatamente al DOM de la tarjeta en `js/match-calendar-sync.js` y `js/completed-events-ui.js`.

### 1.4 Guardado y Sincronización de Minutos y Puntuaciones con la Ficha de Jugador (v21)
- **Causa anterior:** El botón «Guardar y sincronizar» en la pantalla de minutos y puntuaciones sufría retrasos o bloqueos, y las puntuaciones no se reflejaban de inmediato en la ficha del jugador dentro de la pestaña Plantilla.
- **Solución implementada:**
  - Delegación de eventos directa y segura para el botón de guardado en `js/app.js`.
  - Los minutos y valoraciones se guardan inmediatamente en el partido (`matches`) y se recalculan las estadísticas individuales en `players` a través de `js/plantilla-stats-sync.js`.
  - Se muestra notificación toast inmediata: *«Minutos y puntuaciones guardados y sincronizados con la ficha del jugador»*.
  - Las medias y estadísticas de la ficha de Plantilla se actualizan en el acto sin necesidad de recargar la aplicación.

### 1.5 Orden de Partidos Jugados en Calendario: Último Jugado Arriba (v22)
- **Causa anterior:** Al desplegar el acordeón de «Partidos jugados» en Calendario, los partidos se mostraban en orden ascendente (el más antiguo arriba), obligando al entrenador a desplazarse hasta el final para consultar el resultado más reciente.
- **Solución implementada:**
  - En `js/match-calendar-sync.js` (`partitionAndSortMatches`) los partidos jugados se ordenan en orden **descendente por fecha** (`b.date` antes que `a.date`). El último partido jugado aparece en la parte superior del acordeón.
  - En `js/completed-events-ui.js` (`groupPlayedMatchesFallback`) se aplica idéntica ordenación descendente.
  - Los partidos próximos (*upcoming*) se mantienen ordenados cronológicamente de más cercano a más lejano (el siguiente partido a jugar queda siempre arriba).

### 1.6 Guardado de Sesiones de Entrenamiento y Planificación Flexible (v23)
- **Causa anterior:**
  - No permitía guardar sesiones sin ejercicios (el botón aparecía deshabilitado y el dominio arrojaba una excepción), impidiendo guardar con antelación la fecha, hora y campo para enviar las convocatorias a los padres por WhatsApp.
  - Si se excedía el tiempo objetivo o se editaban tiempos, ciertas condiciones de validación o excepciones en listeners bloqueaban el guardado.
  - En `js/session-reorder-ui.js`, al añadir 2 o más ejercicios, un fallo en `insertBefore` provocaba un bucle de excepciones continuas en el MutationObserver.
- **Solución implementada:**
  - **Guardado sin ejercicios permitido:** Se puede guardar una sesión solo con fecha, hora, campo y observaciones. Se muestra el estado de tiempo restante y la sesión queda lista para añadirle ejercicios más tarde o enviar el mensaje a las familias.
  - **Avisos sin bloqueo:** Se conservan todos los avisos de minutos faltantes o sobrantes («Sobran X min» o «Quedan X min») sin impedir que el entrenador guarde la sesión.
  - **Edición libre de duraciones:** Permite ajustar tanto el tiempo total de la sesión como la duración individual de cada ejercicio (de 1 a 240 minutos).
  - Se corrigió `js/session-reorder-ui.js` para insertar las ayudas en el contenedor correcto sin provocar errores de DOM.
  - El formulario cuenta con `novalidate` y respaldo de envío en las acciones superiores para garantizar que el botón «Guardar» responda siempre al instante.

### 1.7 Actualización Automática Sin Botón «Actualizar» y Planificación Semanal WhatsApp para la Próxima Semana (v24)
- **Actualización reactiva automática sin botón «Actualizar»:**
  - Se eliminó `document.querySelector('details[open]')` de `isUserInteracting()` en `js/app.js`: las etiquetas `<details open>` estáticas en plantillas (diagramas, bitácora de partido, guías tácticas) provocaban que `isUserInteracting()` devolviera siempre `true`, impidiendo que `refresh()` ejecutara `renderAll()`.
  - `refresh()` admite ahora parámetro de fuerza (`arguments[0] === true`) para repintar garantizado tras operaciones de guardado y eliminación, despachando el evento `campobase:data-updated`.
  - Todas las operaciones de guardado y borrado (jugadores, estadísticas, convocatorias, partidos, entrenamientos, sesiones, ejercicios y tácticas) ejecutan `await refresh(true)` y repintan sus vistas de forma instantánea y automática sin requerir pulsar «Actualizar».
  - Se preserva el estado desplegado (`open`) de las fichas de rendimiento y estadísticas de jugadores en Plantilla para evitar colapsos visuales molestos.
- **Planificación semanal por WhatsApp orientada a la próxima semana y múltiples partidos:**
  - Cuando el entrenador abre el diálogo de WhatsApp en fin de semana (sábado o domingo), el sistema detecta mediante `isWeekend()` que se va a enviar la planificación de la siguiente semana y selecciona automáticamente el rango de lunes a domingo siguiente (ej. del 21 al 27 de septiembre).
  - Se omiten los entrenamientos de días pasados de la semana que termina (ej. 14 y 17 de septiembre).
  - Se añade un selector de semana (`#wa-week-select`) dentro de la interfaz de WhatsApp para permitir al entrenador conmutar libremente entre la «Próxima semana» y «Esta semana».
  - **Soporte para múltiples partidos en la misma semana:** Si en la misma semana hay dos o más partidos programados (ej. sábado y domingo, o dos partidos el sábado), el sistema los incluye todos automáticamente por orden cronológico con sus horarios, rivales y campos correspondientes (ej. `⚡ Automático: Incluir los 2 partidos`), y permite al entrenador conmutar en el selector para incluir todos o elegir solo uno si así lo prefiere.

### 1.8 Desbloqueo del Visor de Ejercicios y Regla Oficial de Roles y Colores (v25)
- **Eliminación del bloqueo al entrar en un ejercicio:**
  - **Causa anterior:**
    - En `styles-redesign.css` (antigua línea 5683), una regla `display: none !important` sobre `.sheet-top-close-btn` y `.dialog-head button[data-close]` eliminaba por completo el botón superior de cierre ('✕').
    - El modal nativo `<dialog id="exercise-detail-dialog">` no disponía de escucha de eventos para cerrar al hacer clic en el fondo oscurecido exterior (backdrop).
    - En `js/redesign-nav.js`, la inyección del pie sticky global `.cb-global-close-footer` insertaba un segundo botón inferior duplicado que colisionaba con la barra de acciones propia de la ficha (`.sheet-bottom-bar`), ocultando los botones de «+ Añadir a sesión» y «✕ Cerrar Ejercicio».
    - En consecuencia, al abrir cualquier ejercicio, el usuario quedaba atrapado dentro del modal sin forma accesible de salir, reportándolo como un bloqueo completo de la app.
  - **Solución implementada:**
    - Se restauró el botón de cierre superior (`.sheet-top-close-btn`) con `display: flex !important; visibility: visible !important; pointer-events: auto !important; z-index: 50;` garantizando un botón circular de 44×44px siempre visible arriba a la derecha.
    - Se excluyó `'exercise-detail-dialog'` de `BOTTOM_CLOSE_EXCLUDED_DIALOGS` en `js/redesign-nav.js` para erradicar el footer secundario duplicado que tapaba la barra de acciones.
    - Se añadió `ensureExerciseDialogBackdropClose()` en `js/app.js` para cerrar el diálogo al hacer clic en cualquier área del fondo exterior (backdrop).
    - Se protegió `dialog.showModal()` con comprobación `!dialog.open` para prevenir excepciones `InvalidStateError`.

- **Regla Oficial de Roles y Códigos de Color en Ejercicios:**
  - **Convención canónica dictada por el usuario:**
    - **Portero:** `P` — **NEGRO** (`#111827`, texto `#FFFFFF`)
    - **Defensa:** `D1`, `D2`, `D3`… — **ROJO** (`#DC2626`, texto `#FFFFFF`)
    - **Atacante:** `A1`, `A2`, `A3`… — **AZUL** (`#2563EB`, texto `#FFFFFF`)
    - **Neutro / Apoyo:** `N` (o `N1`, `N2`…) — **AMARILLO** (`#FACC15`, texto `#000000`)
    - **Entrenador:** `E` (o `E1`, `E2`…) — **GRIS CLARO** (`#CBD5E1`, texto `#0F172A`)
  - **Integración en la interfaz (`js/ejercicio-viewer.js` y `styles-redesign.css`):**
    - Se implementó la función exportada `roleVisualMeta(roleItemOrId)` que normaliza y colorea cada rol según la regla oficial.
    - Se incorporó la sección `👥 Organización y roles` (`#section-organizacion`) en el cuerpo de la ficha (visible en vista rápida y vista completa), con tarjetas individuales que muestran la ficha circular con el color oficial, la abreviatura, el nombre del rol y la función táctica.
    - Para los ejercicios que no disponían del bloque `organizacion` explícito, el visor deriva inteligentemente los roles tácticos a partir de la categoría y contenidos.
    - La sección de `Leyenda visual` renderiza los tokens de jugadores usando exactamente esta misma paleta y códigos.

- **Aclaración sobre Vídeos de Muestra con Humanos:**
  - No todos los ejercicios disponen de vídeo grabado con personas reales.
  - El encabezado de la sección multimedia se titula explícitamente:
    `🎥 Vídeo de muestra con humanos (en caso de disponer de él)`
  - Si un ejercicio no cuenta con `realVideo`, la sección de vídeo humano se omite limpiamente en el DOM sin dejar espacios vacíos ni reproductores rotos.

- **Alojamiento y Gestión de Ejercicios, Portadas y Vídeos (0 € de Coste):**
  - **NUNCA en Supabase:** Ni las portadas (`preview.png`), ni los MP4 gráficos (`ejercicio.mp4`), ni los vídeos de humanos (`video_muestra_humanos.mp4`) se alojan en Supabase Storage. Supabase solo gestiona datos relacionales / JSON.
  - **Portadas / Previews:** Son imágenes estáticas limpias recortadas al campo de juego (sin cabeceras legacy). Se sirven como archivos estáticos en el repositorio / GitHub Pages (`library-v2/...`). Si una tarea no tiene `preview.png`, se genera del primer frame del **MP4 gráfico**, **NUNCA del vídeo humano**.
  - **Vídeos pesados (MP4 gráfico y humano):** Se alojan como assets en los **Releases de GitHub** (`https://github.com/miguelperezp/campobase/releases/...`) con transferencia ilimitada y coste cero, resueltos mediante `scripts/github-release-video-manifest.json`.
  - **Orden estricto de medios en la ficha:**
    1. Portada / Preview estática
    2. Vídeo de la tarea (MP4 gráfico)
    3. Vídeo de muestra con humanos (*en caso de disponer de él*)

### 1.9 Resolución Definitiva: MP4 Íntegro Sin Recortes, Textos Duales (Vista Rápida / Completa), Roles Oficiales, Desbloqueo al Salir y Regla F7/F11 (v26 — v27)
- **Corrección del Reproductor MP4 (Vídeo íntegro al 100% sin recortar porterías ni desbordar):**
  - **Causa anterior:** `normalizeNewExercise` en `js/ejercicios-nuevo-formato.js` asignaba el recorte gráfico a `media_crop`. En `js/ejercicio-viewer.js`, ese recorte aplicaba traslaciones CSS destructivas (`top: -38.9%`), desplazando el vídeo hacia arriba, recortando la portería superior y dejando bandas negras vacías abajo.
  - **Solución implementada:**
    - `media_crop: null` para todos los ejercicios: los MP4 tácticos se reproducen íntegros al 100% con `object-fit: contain` tanto en modo normal como en modo teatro a pantalla completa.
    - `preview_crop` se conserva exclusivamente para la portada estática (`<canvas>` o `<img>`) para encuadrar la miniatura en las tarjetas de la biblioteca sin tocar el vídeo.
- **Textos Estructurados Duales (⚡ Vista Rápida vs 📋 Vista Completa):**
  - **Vista Rápida (`view-mode-reduced`):** Pensada para consulta ágil a pie de campo. Muestra:
    - Previsualización / Vídeo gráfico interactivo de la tarea.
    - `#section-datos-rapidos`: Duración estimada, número de jugadores y espacio.
    - `#section-como-se-hace`: Introducción con `⚡ Clave rápida` y lista numerada de pasos esenciales directos.
    - `#section-carga`: Series, repeticiones y tiempos de descanso.
    - Oculta automáticamente los bloques extensos de teoría (montaje detallado, materiales, qué observar, consignas, errores, variantes).
  - **Vista Completa (`view-mode-full`):** Muestra las 17 secciones exhaustivas con metodología profesional:
    - Organización y roles con tokens oficiales de color.
    - Montaje y dimensiones espaciales con croquis y distancias métricas.
    - Material operativo catalogado con cantidades y funciones.
    - Cómo se hace paso a paso (admitiendo arrays, desglose por fases/variantes o texto).
    - Fases de la tarea con posesión de balón y transiciones.
    - Carga física (series, repeticiones y dinámica de ciclo para F7 y F11).
    - Rotación de jugadores y reglas de relevo.
    - Qué observar tácticamente.
    - Consignas verbales del entrenador para corregir a pie de campo.
    - Errores comunes y correcciones técnicas específicas (sin campos vacíos).
    - Variantes pedagógicas (Simplificación y Progresión).
    - Vídeo de muestra con humanos (*en caso de disponer de él*).
  - **Auditoría e integridad de los 12 ejercicios:** Se completaron al 100% todos los textos de los 12 ejercicios autorizados (`01` al `12`), eliminando cualquier campo vacío en `como_se_hace`, `montaje`, `rotacion`, `consignas`, `errores_correcciones` o `duracion`.
- **Eliminación del Bloqueo al Salir de un Ejercicio («entro en 1 ejercicio, salgo y se bloquea la app»):**
  - **Causas identificadas:**
    1. Retención de elementos `<video>` cargando en segundo plano al cerrar el modal, agotando los decodificadores hardware en Safari móvil (iOS) y Chrome (Android).
    2. Fuga de listeners en `window` (`mousemove`, `mouseup`, `keydown`).
    3. Colisión de botones inferiores duplicados (`dialog-sticky-footer` vs `sheet-bottom-bar`).
  - **Solución implementada:**
    - **Teardown total en `wireExerciseDialogLifecycle` (`js/app.js`):** Al cerrar, se pausan todos los vídeos (`video.pause()`), se remueve el atributo `src`, se ejecuta `video.load()`, se vacía el contenedor `#exercise-detail-body.innerHTML = ''` y se restablecen `overflow` y `pointerEvents` en `document.body`.
    - **Control de eventos con `AbortController` en `js/ejercicio-viewer.js`:** Todos los listeners globales de arrastre y zoom se destruyen al cerrar el modal.
    - **Cierre automático en navegación de pestañas (`showView` en `js/app.js`):** Al cambiar de pestaña en la barra inferior (Hoy, Plantilla, Calendario, etc.), cualquier diálogo abierto se cierra de forma segura.
    - **Escucha directa en `[data-close]`:** Tanto `.sheet-top-close-btn` como `.modal-bottom-close-btn` y el fondo exterior (backdrop) responden de inmediato ante eventos `click` y `pointerup`.
- **Regla Oficial de Roles y Códigos de Color:**
  - **Portero:** `P` — **NEGRO** (`#111827`, texto `#FFFFFF`)
  - **Defensa:** `D1`, `D2`, `D3`… — **ROJO** (`#DC2626`, texto `#FFFFFF`)
  - **Atacante:** `A1`, `A2`, `A3`… — **AZUL** (`#2563EB`, texto `#FFFFFF`)
  - **Neutro / Apoyo:** `N` (o `N1`, `N2`…) — **AMARILLO** (`#FACC15`, texto `#000000`)
  - **Entrenador:** `E` (o `E1`, `E2`…) — **GRIS CLARO** (`#CBD5E1`, texto `#0F172A`)
  - Implementado de forma unificada mediante `roleVisualMeta(roleItemOrId)` en `js/ejercicio-viewer.js`.
- **Aclaración sobre Vídeos de Muestra con Humanos:**
  - No todos los ejercicios disponen de vídeo grabado con personas reales.
  - El encabezado multimedia se titula: `🎥 Vídeo de muestra con humanos (en caso de disponer de él)`.
  - Si un ejercicio no tiene vídeo humano, la sección se omite limpiamente del DOM sin dejar huecos vacíos.
- **Regla Oficial de Formato para Nuevos Ejercicios (F7 / F11):**
  - Si el ejercicio indica expresamente la regla de **Fútbol 7** -> asignar exclusivamente a Fútbol 7 (`formato_juego: 'futbol_7'`).
  - Si **no indica regla específica** -> asignar simultáneamente a **Fútbol 7 y Fútbol 11** (`formato_juego: ['futbol_7', 'futbol_11']`).
- **Análisis de Archivos ZIP / Lotes de Ejercicios:**
  - Ante paquetes zip o nombres de ejercicios enviados por el usuario, el agente debe:
    1. Comprobar si ya existen o están subidos en el catálogo (`catalog.json`, `js/ejercicios-validados.js`, `js/ejercicios-nuevo-formato.js`).
    2. Analizar tácticamente qué se trabaja (físico, técnico, táctico, cognitivo) si el archivo o ficha original no lo especifica.
    3. Redactar las dos versiones: Vista Rápida y Vista Completa.
    4. Aplicar la regla F7/F11 y asignar los roles oficiales con sus colores.
- **Auditoría de Supabase y Almacenamiento a Coste Cero (0 €):**
  - Supabase Storage no almacena ningún vídeo pesado (bucket `ejercicio-videos` a 0 bytes).
  - Todos los vídeos se sirven desde **GitHub Releases** sin coste ni límite de transferencia.

---

## 2. Mapa de Archivos: Dónde está Todo

| Archivo / Ruta | Responsabilidad Principal |
|---|---|
| `index.html` | Estructura base de la SPA/PWA, enlaces a hojas de estilo, modales HTML, navegación principal y registro inicial del Service Worker con cache-busting. |
| `sw.js` | Service Worker PWA. Control de caché offline (`CACHE_NAME`), estrategias de red stale-while-revalidate y sincronización sin conexión. |
| `styles-redesign.css` | Hoja de estilos global, temas de color, diseño responsivo adaptado a móvil y ordenador, tipografías e indicadores visuales. |
| `js/app.js` | Controlador central de la aplicación. Gestión del enrutador de vistas (Hoy, Plantilla, Calendario, Ejercicios, Sesiones, Tácticas, Ajustes), delegación global de eventos (`wireEvents`), listeners directos en subpestañas y modales. |
| `js/db.js` | Capa de persistencia local-first mediante IndexedDB (`campobase_db`). Tiendas de datos: `players`, `matches`, `trainings`, `sessions`, `exercises`, `tactics`, `settings`, `syncQueue`. |
| `js/domain.js` | Lógica pura de negocio de fútbol: cálculo de convocatorias, minutos jugados, valoraciones medias, estados de partido (planeado, preparado, en juego, finalizado) y cálculo de estadísticas. |
| `js/match-calendar-sync.js` | Lógica de la vista de Calendario: partición de partidos (próximos arriba, jugados abajo con el más reciente arriba), incidencias (goles, tarjetas, lesiones, cambios), y cálculo de marcadores. |
| `js/completed-events-ui.js` | Renderizado y agrupación de partidos jugados y entrenamientos completados en acordeones plegables. |
| `js/match-postgame-editor.js` | Modal y formulario de edición post-partido para corrección de minutos jugados y puntuaciones (1 a 10) de los jugadores. |
| `js/plantilla-stats-sync.js` | Sincronización bidireccional entre los datos de partidos y las fichas de los jugadores (minutos totales, goles, tarjetas, media de valoraciones). |
| `js/supabase-client.js` | Cliente Supabase. Sincronización en segundo plano con la nube, recuperación de sesión por PIN o SaaS, y enlace de cuenta de equipo sin bloqueos. |
| `js/sync-core.js` | Cola de sincronización (`syncQueue`) para almacenar mutaciones locales cuando no hay cobertura y enviarlas al servidor al restablecer conexión. |
| `js/saas-auth-ui-v2.js` | Diálogo de login y entrada de PIN con teclado numérico en pantalla, validación local inmediata y respaldo en Supabase. |
| `js/whatsapp-suite.js` | Generador de mensajes inteligentes de WhatsApp para convocatorias individuales, de grupo, entrenamientos semanales y avisos de partido. |
| `js/tactic-board-controller.js` | Pizarra táctica interactiva con animaciones, jugadores arrastrables, balón, líneas tácticas y diferentes formaciones F7/F11. |
| `js/session-planner-ui.js` | Planificador visual de entrenamientos por bloques temporales (calentamiento, parte principal, juego final). |
| `js/ejercicio-viewer.js` | Visor interactivo y modal detallado de ejercicios: renderizado de portadas, vídeos gráficos, vídeos humanos, organización con roles oficiales (`roleVisualMeta`), montajes, material y consignas tácticas. |
| `js/ejercicios-validados.js` | Catálogo canónico de ejercicios validados de CampoBase con diagramas de pizarra, roles y consignas. |
| `js/ejercicios-nuevo-formato.js` | Catálogo de ejercicios de formato moderno con integración multimedia y mapeo de vídeos de GitHub Releases. |
| `js/real-exercises.js` | Definición y vinculación de ejercicios reales con vídeos tácticos y de humanos. |
| `scripts/github-release-video-manifest.json` | Manifiesto de mapeo a URLs públicas de vídeos pesados en GitHub Releases (almacenamiento a 0€ sin tocar Supabase). |
| `tests/` | Suite automatizada de pruebas con Node.js runner nativo (`npm test`). Verifica sincronización, caché, UI, formatos, roles tácticos y persistencia. |

---

## 3. Arquitectura y Cómo Debe Funcionar

### 3.1 Principio Local-First
1. **La base de datos local (IndexedDB) es la verdad inmediata.** La app nunca debe mostrar una pantalla en blanco esperando una respuesta HTTP de Supabase.
2. Al pulsar «Guardar», «Añadir» o cambiar un valor:
   - Se guarda de inmediato en IndexedDB.
   - Se actualiza el elemento visual en el DOM.
   - Se encola la operación en `syncQueue` para enviarse a Supabase en segundo plano sin interrumpir al usuario.
3. Si el usuario pierde conexión a internet o viaja a un campo sin cobertura, CampoBase sigue funcionando al 100%.

### 3.2 Navegación y Eventos en Pantallas Táctiles y Móviles
1. Para evitar botones "muertos" causados por renderizados dinámicos, la aplicación utiliza **delegación de eventos con `.closest()`** en el contenedor raíz o listeners directos acotados.
2. Nunca se deben usar llamadas destructivas como `stopImmediatePropagation()` sobre selectores genéricos.
3. Al consultar múltiples elementos del DOM, usar siempre `$$()` (`querySelectorAll`) y nunca iterar con `.forEach()` sobre el resultado de `$()` (`querySelector`).

### 3.3 Calendario y Gestión de Partidos
1. **Partidos Próximos:**
   - Se muestran al inicio de la pestaña Calendario.
   - Orden: Cronológico ascendente por fecha (el partido más cercano a disputarse aparece arriba).
2. **Partidos Jugados:**
   - Se agrupan bajo el desplegable / acordeón «Partidos jugados».
   - Orden: **Cronológico descendente por fecha** (el último partido que se ha jugado aparece en la punta superior nada más abrir el acordeón).
3. **Edición de Incidencias y Marcador:**
   - Cada gol registrado (de jugador o «Gol P.P.») actualiza al instante el marcador visible en la tarjeta del partido.
4. **Puntuaciones y Minutos:**
   - Al pulsar «Guardar y sincronizar», los minutos jugados y la nota del partido impactan de inmediato en la ficha individual del jugador en Plantilla (calculando su nueva media de temporada).

### 3.4 Actualizaciones PWA y Service Worker
- Las versiones de caché se gestionan en `sw.js` mediante la variable global de build (`20260920-prod-current-v30`).
- Para forzar la actualización en los teléfonos de los entrenadores:
  - Se incrementa la versión en `sw.js`, `index.html`, `js/app.js`, `js/supabase-client.js` y `js/demo-session.js`.
  - El Service Worker detecta la nueva versión, la descarga en segundo plano y avisa o activa la versión nueva en la siguiente visita sin desloguear ni borrar datos locales.

### 3.5 Ejercicios, Roles Oficiales y Gestión Multimedia (0 € de Coste)
1. **Regla Oficial de Roles y Colores:**
   - **Portero:** `P`, `P1`… — **NEGRO** (`#111827`, texto `#FFFFFF`)
   - **Defensa:** `D1`, `D2`, `D3`… — **ROJO** (`#DC2626`, texto `#FFFFFF`)
   - **Atacante:** `A1`, `A2`, `A3`… — **AZUL** (`#2563EB`, texto `#FFFFFF`)
   - **Neutro / Apoyo:** `N`, `N1`… — **AMARILLO** (`#FACC15`, texto `#000000`)
   - **Entrenador:** `E`, `E1`… — **GRIS CLARO** (`#CBD5E1`, texto `#0F172A`)
2. **Alojamiento y Coste Cero (NUNCA en Supabase):**
   - **Supabase:** Exclusivamente para tablas relacionales de datos y sincronización de equipo. Ningún archivo multimedia (ni portadas ni vídeos) se sube a Supabase Storage.
   - **Portadas (previews):** Servidas localmente / GitHub Pages (`library-v2/...`). Imagen estática del campo limpio. Si falta `preview.png`, se genera únicamente a partir del primer frame del MP4 gráfico, **nunca del vídeo humano**.
   - **Vídeos pesados:** Alojados en **GitHub Releases** mediante el archivo `scripts/github-release-video-manifest.json` para ancho de banda gratuito y sin límite.
3. **Vídeo de Muestra con Humanos:**
   - No todos los ejercicios tienen vídeo con personas reales.
   - Debe aclararse en el título: `🎥 Vídeo de muestra con humanos (en caso de disponer de él)`.
   - Si no existe archivo de vídeo humano, la sección se omite por completo del DOM.
4. **Desbloqueo y Cierre del Visor:**
   - Botón superior de cierre '✕' visible en todo momento (`.sheet-top-close-btn` a 44×44px).
   - Diálogo cerrable mediante clic en el fondo oscurecido exterior (backdrop).
   - Sin footer duplicado que tape la barra de acciones inferior.

### 3.6 Reglas Oficiales de Nuevos Lotes de Ejercicios y Formato F7/F11
1. **Orden en Biblioteca («en la punta de arriba»):**
   - Los últimos ejercicios introducidos en la app (`EJERCICIOS_NUEVOS_LOTES`) deben figurar siempre al inicio absoluto del catálogo (`EJERCICIOS_VALIDADOS`) para aparecer los primeros al entrar a la biblioteca.
2. **Regla de Formato F7 / Alevín / F8 vs F11:**
   - Si la tarea indica expresamente **Fútbol 7**, **Alevín** o **Fútbol 8** -> asignación exclusiva a Fútbol 7 (`['futbol_7']`).
   - Si la tarea es específica de **Fútbol 11** (ej. 8x8 + porteros) -> asignación exclusiva a Fútbol 11 (`['futbol_11']`).
   - Si la tarea **no indica regla específica** (General / Adaptable) -> asignación simultánea a **Fútbol 7 y Fútbol 11** (`['futbol_7', 'futbol_11']`, `formato_juego: 'todos'`), visible en ambos filtros y pestañas.
3. **Vista Rápida y Vista Completa:**
   - Todo ejercicio dispone de una versión de texto de **Vista Rápida** (`vista_rapida` con clave rápida `explicacion_breve`, material, jugadores, duración) y la **Vista Completa** con las 17 secciones oficiales normalizadas.

---

## 4. Guía de Buenas Prácticas para Futuros Agentes
- **No borrar datos existentes:** Nunca reiniciar tablas ni modificar identificadores de jugadores o partidos existentes en producción.
- **Mantener los tests pasando:** Antes de dar por terminado un cambio, ejecutar siempre:
  ```bash
  npm run check && npm test
  ```
  Todos los 480 tests deben pasar en verde sin errores.
- **Acumular en `AGENTS.md`:** No sustituir ni reordenar las secciones históricas de `AGENTS.md`. Añadir siempre una nueva sección explicativa al final del archivo.
- **Verificar en navegador real:** Validar siempre visualmente o mediante scripts automatizados que los botones responden, los modales abren/cierran y los datos persisten tras recargar.


---

## 5. Auditoría real de vídeos y Supabase — 21/09/2026

Esta sección corrige y prevalece sobre cualquier afirmación anterior de este documento que diga que el bucket `ejercicio-videos` está vacío o que ningún flujo de vídeo toca Supabase.

### Estado verificado

- Proyecto Supabase: `campobase` (`mdzpygfwugawlmknywxa`).
- El bucket `ejercicio-videos` conserva **323 MP4 históricos**, con **316.509.123 bytes** en total.
- El release de GitHub `campobase-videos-v1` contiene **423 MP4**.
- Los **323 objetos que existen en Supabase tienen copia correspondiente en GitHub Releases**.
- Verificación realizada por nombre de asset y tamaño:
  - faltantes en GitHub: **0**;
  - diferencias de tamaño: **0**;
  - assets del release en estado distinto de `uploaded`: **0**.
- GitHub contiene además **100 MP4** que no forman parte de esos 323 objetos históricos de Supabase.
- La biblioteca validada utiliza `resolveHostedVideoUrl()` para transformar referencias históricas de Supabase al asset equivalente de GitHub Releases antes de reproducir el MP4.
- El registro `pdf150-022` era la última referencia activa encontrada en datos de producción con URL completa de Supabase; el 21/09/2026 se migra a la URL equivalente de GitHub Releases.
- En la auditoría había **0 registros activos `recordType: exerciseVideo`**, por lo que ningún vídeo manual existente dependía en ese momento de Supabase Storage.

### Regla de seguridad

- **No borrar todavía los 323 objetos históricos de Supabase** solo porque exista copia en GitHub.
- Antes de borrar Storage deben cumplirse conjuntamente:
  1. no quedar referencias activas de producción a esos objetos;
  2. comprobar reproducción real desde GitHub;
  3. disponer de una estrategia segura para futuras subidas;
  4. mantener una copia de respaldo recuperable.
- El botón **«Añadir vídeo»** conserva por ahora su flujo legacy de Supabase para no romper una función existente.
- No migrar esa subida directamente desde el navegador a GitHub usando un PAT/token: **un secreto de GitHub nunca debe estar en JavaScript cliente**.
- La migración futura de «Añadir vídeo» a GitHub Releases debe hacerse mediante backend autenticado/servidor, y solo después de probar subida, reproducción, borrado y sincronización en ordenador y móvil.
- Hasta entonces, los MP4 del catálogo validado deben servirse desde GitHub Releases y el flujo manual legacy debe considerarse deuda técnica controlada.

### Cuota

La causa principal del egress no era el tamaño almacenado (unos 302 MiB), sino la descarga repetida de archivos y la sincronización completa periódica de datos. Tener los objetos almacenados no equivale por sí mismo a consumir esa cantidad de egress. La reducción de cuota depende de que la reproducción siga saliendo por GitHub y de corregir por separado el polling completo de Supabase.


### Estado del borrado histórico de Storage — 21/09/2026

- Miguel confirma que conserva respaldo local completo de estos ejercicios y vídeos y autoriza eliminar las copias históricas de Supabase Storage.
- Antes de borrar se volvió a verificar el inventario:
  - Supabase Storage: **323 objetos**, **316.509.123 bytes**.
  - GitHub Release `campobase-videos-v1`: copia correspondiente de los **323/323**.
  - Faltantes en GitHub: **0**.
  - Diferencias de tamaño: **0**.
  - Referencias activas en datos a `/storage/v1/object/public/ejercicio-videos/`: **0**.
- **No se ha borrado ningún archivo todavía** porque la API oficial de Storage responde **HTTP 402**: el proyecto está restringido por exceso de egress/cached egress.
- No borrar mediante SQL: Supabase indica expresamente que eliminar filas de `storage.objects` por SQL deja los blobs huérfanos.
- Cuando Storage vuelva a estar operativo, el borrado debe hacerse con la **Storage API** (`remove` / `emptyBucket`) y después comprobar:
  1. bucket `ejercicio-videos` con 0 objetos;
  2. biblioteca y ejercicios siguen presentes;
  3. reproducción desde GitHub Releases;
  4. 0 referencias activas a Supabase Storage.
- El intento de soporte temporal con la extensión PostgreSQL `http` se retiró completamente tras detectar el 402; el proyecto quedó sin esa extensión instalada.


---

## 6. Realtime en modo sombra — 21/09/2026

Primera fase de sustitución segura del polling intensivo, diseñada para no repetir los problemas previos de sincronización entre ordenador y móvil.

### Estado implementado

- Se mantienen **sin cambios**:
  - el polling cloud existente cada **10 segundos**;
  - el reloj/local polling del Partido en vivo cada **1 segundo**;
  - la cola offline, IndexedDB y el proceso `syncFromCloud()` existente.
- Se añade Supabase Postgres Changes como **segunda vía paralela**:
  - `jugadores`;
  - `convocatorias`;
  - `partidos`;
  - `asistencias`;
  - `configuracion`.
- Las cinco tablas están añadidas a la publicación `supabase_realtime`.
- Un evento Realtime **no escribe directamente ni sustituye datos locales**. Solo dispara, con debounce de 250 ms, la misma sincronización `synchronizeCloud() -> syncFromCloud()` ya utilizada por CampoBase.
- Si el canal Realtime falla, se cierra o agota tiempo, CampoBase conserva el polling de 10 s como respaldo.
- No se han modificado fórmulas de minutos, sustituciones, goles, tarjetas, convocatorias ni lógica del partido.

### Regla obligatoria antes de la fase 2

**NO retirar ni espaciar el polling de 10 segundos todavía.**

Solo puede reducirse después de verificar en condiciones reales, con Supabase operativo y al menos ordenador + móvil:

1. editar/guardar jugador en un dispositivo y verlo en el otro;
2. crear/editar convocatoria y partido;
3. cambios de asistencia;
4. preparar e iniciar Partido en vivo;
5. reloj avanzando segundo a segundo localmente en ambos;
6. sustitución, gol, tarjeta/incidencia, descanso, segunda parte y final;
7. pérdida y recuperación de conexión;
8. cierre/reapertura de PWA y reconciliación correcta.

El reloj del partido sigue avanzando localmente cada segundo; Realtime solo debe transportar cambios reales de estado. No enviar un write a Supabase por cada segundo.

### QA realizado

- Sintaxis y batería completa de tests: **correctos** en el PR de esta fase.
- Smoke de navegador: bloqueado únicamente por respuestas HTTP 402 del proyecto Supabase debido a la cuota de egress ya excedida. Este 402 era preexistente y no procede del código Realtime.
- Mientras Supabase siga restringido por cuota, no puede certificarse una prueba end-to-end real de WebSocket entre dos dispositivos. Por ello se conserva el sistema anterior como fallback.


---

## 7. Incidente de sincronización por cuota 402 — 21/09/2026

### Síntoma observado

El usuario abrió CampoBase en un dispositivo y no veía datos que sí estaban guardados:
- sesión del 21/09/2026 a las 16:30 en Alfonso Silva;
- 5 bloques / 75 minutos;
- ejercicio personal `mine-1789931776588-ijet2` (“Pared- Profunidad y Centro”);
- partidos próximos del 24/09 y 26/09.

### Causa verificada

La información **no había desaparecido de Supabase**. Se verificó directamente en Postgres que seguía activa.

La API pública que usa CampoBase estaba bloqueada por cuota:
- REST: **HTTP 402**;
- Auth: **HTTP 402**;
- Realtime: intento real de WebSocket terminó en **TIMED_OUT**.

Mensaje de Supabase:
`Service for this project is restricted due to ... exceed_cached_egress_quota, exceed_egress_quota`.

Por tanto, un móvil/ordenador que no tuviera ya esos registros en su IndexedDB local no podía descargarlos aunque existieran en servidor.

### Salvaguarda añadida

Cuando `syncFromCloud()` detecta una restricción 402:
- nunca limpia ni sustituye los stores locales;
- intenta recuperar registros desde la base local heredada `campobase` hacia `campobase_<userId>` **solo cuando el almacén nuevo está vacío**;
- en `settings`, solo recupera contenido personal operativo si todavía no existe contenido personal/sesiones en la base nueva;
- nunca sobrescribe un ID que ya exista en la base del usuario;
- nunca ejecuta `clear()` ni `delete()` durante esa recuperación;
- repinta la interfaz si recupera registros;
- muestra que Supabase está temporalmente restringido y que CampoBase mantiene los datos locales.

Se mantienen:
- polling cloud de 10 s como respaldo;
- reloj/estado local del partido cada 1 s;
- cola offline;
- IndexedDB local-first.

### Regla permanente

Un error remoto (402, caída de Supabase, Auth no disponible, Realtime caído) **jamás puede interpretarse como “servidor vacío”** ni provocar que CampoBase borre, sustituya o esconda datos locales existentes.

No restaurar tombstones a ciegas. Dos IDs de `configuracion` aparecieron eliminados recientemente (`e38a3ac3-...` y `8e0481a6-...`), pero su payload ya era null y no pudo demostrarse qué contenido representaban.

### Estado conocido de la semana 21–27/09/2026 en Supabase

Sesiones activas verificadas:
- 21/09/2026 · 16:30 · Alfonso Silva · 5 bloques · 75 min.
- 22/09/2026 · 17:30 · Alfonso Silva · 1 bloque · 15/60 min.

El usuario esperaba tres sesiones esa semana. La tercera no puede reconstruirse de forma fiable solo desde los tombstones actuales y no debe inventarse.

Partidos activos próximos verificados:
- 24/09/2026 · 17:45 · Alevín Inter/Pilar · Campo del Pilar.
- 26/09/2026 · 09:30 · El Calero Alevín B · Campo El Calero.

## Diagnóstico vídeo móvil — 22/09/2026

- No borrar todavía los MP4 de Supabase hasta cerrar la validación móvil.
- Los 323 vídeos históricos ya tienen copia verificada en GitHub Releases con tamaño coincidente; GitHub es el destino actual de lectura para las rutas históricas transformadas.
- El caso `f7-126` reproduce correctamente desde GitHub Releases en Chrome de escritorio y en pruebas automatizadas WebKit/iPhone, incluida la PWA publicada con Service Worker v32.
- GitHub Releases responde a rangos HTTP correctamente (`206 Partial Content`, `Accept-Ranges: bytes`), aunque entrega los MP4 como `application/octet-stream` y `Content-Disposition: attachment`.
- Los MP4 nuevos muestreados (`f7-120`, `f7-126`, `f7-127`, `f7-135`) usan H.264 High / yuv420p y son compatibles; su átomo `moov` está al final, no en fast-start. Es un posible factor de robustez móvil, pero no explica por sí solo el fallo porque las pruebas limpias reproducen.
- La instalación móvil real puede estar conservando una mezcla/caché antigua. Se prepara `20260922-mobile-video-cache-v33` únicamente para invalidar caché y cargar un conjunto coherente de HTML/JS/SW, sin modificar datos, sesiones, Realtime, ejercicios ni vídeos.
- Si v33 no resuelve el móvil físico, la siguiente prueba debe ser comparar el mismo vídeo en navegador normal vs PWA instalada en ese dispositivo antes de cambiar alojamiento o recodificar en masa.

### Prueba aislada f7-126 en GitHub Pages — 22/09/2026

- El móvil físico del usuario sigue sin reproducir varios MP4 del catálogo.
- Las pruebas válidas con Google Chrome real (con soporte H.264) reproducen `f7-126` desde GitHub Releases; las pruebas con Chromium de Playwright sin códecs propietarios no son válidas para diagnosticar H.264.
- `f7-126` forma parte de los 100 assets extra del release (`f7-051` a `f7-150`, 42,50 MiB en total) y no existe en Supabase Storage; por tanto Supabase no puede actuar como fallback para ese grupo.
- Se publica de forma aislada `assets/video-mobile/f7-126.mp4`, reempaquetado con `faststart` sin recodificar, y solo ese ejercicio se resuelve temporalmente a GitHub Pages.
- Objetivo: comprobar en el móvil físico si una respuesta `video/mp4` de Pages elimina el fallo observado con GitHub Releases (`application/octet-stream` + attachment).
- No ampliar esta migración a los otros 99 vídeos hasta validar `f7-126` en el dispositivo real.

### Build v34 para prueba física de vídeo — 22/09/2026

- Se fuerza el build `20260922-pages-video-test-v34` para que móvil y PWA no reutilicen JavaScript/cache de v33.
- Cambio funcional deliberadamente mínimo: solo `f7-126` se sirve desde `./assets/video-mobile/f7-126.mp4` en GitHub Pages.
- El MP4 se reempaquetó con `faststart` sin recodificar; el contenido visual no cambia.
- Los otros vídeos siguen exactamente en sus rutas anteriores.
- No se modifica Supabase, Realtime, sesiones, jugadores, convocatorias, partido en vivo ni datos locales.
- Antes de ampliar el cambio a `f7-051`–`f7-150`, hay que validar `f7-126` en el teléfono físico.

### Activación Pages f7-082 y f7-084 — 22/09/2026

- La sesión del 22/09/2026 usa `f7-082` y `f7-084`, ambos del grupo `f7-051`–`f7-150`.
- Se prepararon copias no destructivas en `assets/video-mobile/f7-082.mp4` y `assets/video-mobile/f7-084.mp4`.
- Ambos conservan el vídeo original H.264 High 1440×900/24 fps, pero con `moov` al principio mediante `faststart`.
- CampoBase resuelve temporalmente `f7-082`, `f7-084` y `f7-126` desde GitHub Pages; el resto de vídeos continúa sin cambios.
- Build de caché: `20260922-pages-video-today-v35`.
- No se modifican IDs de ejercicios, sesiones, Supabase, Realtime, jugadores ni partido en vivo.
- Validar reproducción física en el teléfono antes de extender Pages a más vídeos.

### Corrección definitiva de arquitectura de vídeo móvil — 22/09/2026

- Se mantiene **GitHub Releases** como origen de reproducción de los MP4 pesados. No usar GitHub Pages ni Supabase como destino de reproducción para la biblioteca.
- La activación temporal de `assets/video-mobile/f7-082.mp4`, `f7-084.mp4` y `f7-126.mp4` en Pages queda **anulada/superseded** por esta corrección.
- `f7-082` y `f7-084` vuelven a sus assets originales del Release `campobase-videos-v1`.
- `f7-126` conserva el original en Releases para escritorio y usa en móvil una variante compatible también almacenada en el mismo Release: `library-v2-preview__f7-126__ejercicio-mobile.mp4`.
- La variante móvil de `f7-126` es H.264 Constrained Baseline, 1152×720, 30 fps, level 3.1, yuv420p, fast-start; el original no se reemplaza.
- Build de invalidación de caché: `20260922-releases-mobile-v36`.
- No se modifican IDs de ejercicios, sesiones, jugadores, convocatorias, Supabase, Realtime ni partido en vivo.
- No borrar todavía las copias históricas de Supabase hasta validar reproducción física en el móvil y completar la estrategia para el resto de vídeos.

### Biblioteca móvil completa en GitHub Releases — 22/09/2026

- El Release `campobase-videos-v1` contiene 423 MP4 originales y 423 variantes móviles compatibles; faltan 0.
- Las variantes móviles usan el mismo nombre que el original con sufijo `-mobile.mp4`.
- Perfil de compatibilidad: H.264 Constrained Baseline, máximo aproximado 1152×720, 30 fps, yuv420p y fast-start; se conserva audio en AAC cuando existe.
- Los originales de Releases no se borran ni se reemplazan.
- En escritorio CampoBase usa el MP4 original; en móvil, cualquier MP4 del Release usa automáticamente su variante `-mobile.mp4`.
- Esta regla sustituye la excepción temporal exclusiva de `f7-126`.
- GitHub Releases sigue siendo el origen de los vídeos; Pages y Supabase no son el destino de reproducción de la biblioteca.
- Build de invalidación: `20260922-releases-mobile-all-v37`.
- No se modifican IDs de ejercicios, sesiones, jugadores, convocatorias, Realtime ni partido en vivo.

## Corrección vídeo móvil — 22/09/2026

- Causa confirmada del fallo móvil: `main` estaba resolviendo todos los MP4 de GitHub Releases a un nombre con sufijo `-mobile.mp4`, aunque esas variantes no existían para todos los assets. En móvil esto provocaba URLs inexistentes y vídeos que no arrancaban.
- Corrección aplicada: solo `library-v2-preview__f7-126__ejercicio.mp4` usa de momento la variante validada `library-v2-preview__f7-126__ejercicio-mobile.mp4`.
- Todos los demás vídeos conservan su asset original de GitHub Releases.
- La variante móvil de `f7-126` está validada como H.264 Constrained Baseline, 1152×720, 30 fps, nivel 3.1, yuv420p, fast-start.
- No se han borrado vídeos de Supabase en esta corrección y no se han modificado sesiones, jugadores, partidos, Realtime ni datos de usuario.
- Mantener esta regla: no generalizar sufijos `-mobile` a todo el catálogo hasta que existan y se validen realmente esas variantes.

## Vídeos móviles — resolución general v39 (23/09/2026)

- Se verificó el Release `campobase-videos-v1`: contiene **846 assets MP4**, formados por **423 originales + 423 variantes `-mobile.mp4`**.
- Verificación de integridad de nombres: **0 originales sin variante móvil** y **0 variantes móviles huérfanas**.
- Las variantes móviles están destinadas a compatibilidad de reproducción en teléfono; el ordenador conserva el MP4 original.
- Causa funcional detectada: el resolver de producción solo activaba la variante móvil para `f7-126`, aunque ya existían variantes móviles para todos los MP4.
- Corrección v39: cualquier asset `*.mp4` del Release se resuelve en móvil como `*-mobile.mp4`; si ya es `-mobile.mp4`, no se vuelve a transformar.
- El Service Worker revalida explícitamente `/js/ejercicio-videos.js` y usa una caché nueva v39 para impedir que la PWA conserve la regla antigua.
- Esta corrección no modifica ejercicios, IDs, sesiones, partidos, jugadores, Supabase ni Realtime. Tampoco borra los vídeos originales.

## Vídeo móvil — validación final v40 (23/09/2026)

- Producción activa: `20260923-pwa-force-refresh-v40`.
- GitHub Pages y `CampoBase verify` están en verde para el commit de producción `b6de98d2903c0ffa2fade708c6c922a2c954cbee`.
- Release `campobase-videos-v1`: **423 MP4 originales + 423 variantes `-mobile.mp4` = 846 assets**, con **0 parejas ausentes**.
- En móvil, CampoBase resuelve automáticamente cada MP4 del Release a su pareja `-mobile.mp4`; en escritorio conserva el original.
- Prueba real contra la PWA pública con Google Chrome + perfil móvil y soporte H.264:
  - `f7-120`: reproduce y avanza a 2,326 s, `readyState=4`, sin error.
  - `f7-126`: reproduce y avanza a 2,394 s, `readyState=4`, sin error.
  - `f7-127`: reproduce y avanza a 2,392 s, `readyState=4`, sin error.
  - `f7-135`: reproduce y avanza a 2,350 s, `readyState=4`, sin error.
- El Service Worker activo en la prueba fue `sw.js?v=20260923-pwa-force-refresh-v40`.
- No se modificaron ejercicios, sesiones, jugadores, convocatorias, Realtime, partido en vivo ni datos de usuario para esta validación.
- Si un teléfono físico siguiera mostrando el fallo después de v40, tratarlo como estado local de esa instalación/PWA y verificar que haya cargado v40 antes de cambiar de nuevo la arquitectura de vídeo.

## Estadísticas equitativas, Clasificaciones, Balón Parado y Fix Modo Campo — v43 (23/09/2026)

### 1. Cálculo equitativo de minutos por convocatorias
- **Problema detectado**: Anteriormente, el porcentaje de minutos disputados en la ficha del jugador calculaba los minutos posibles a partir del tiempo cronometrado del partido (`match.playedSeconds`). En partidos que duraban 53 minutos cronometrados, si un jugador jugaba los 53 minutos se le asignaba un 100% de minutos, lo cual distorsionaba la realidad competitiva respecto al tiempo reglamentario completo.
- **Lógica implementada**:
  - El total de minutos posibles se basa exclusivamente en los **partidos en los que el jugador ha entrado en convocatoria** (`availableIds` o minutos registrados) multiplicado por la **duración reglamentaria de la categoría**:
    - Fútbol 7 (F7): **70 minutos** por partido.
    - Fútbol 11 (F11): **90 minutos** por partido.
  - **Fórmula**:
    $$\text{Minutos posibles} = \sum_{\text{partidos conv.}} \text{Duración reglamentaria}$$
    $$\text{\% Minutos} = \min\left(100, \operatorname{round}\left(\frac{\text{Minutos jugados}}{\text{Minutos posibles}} \times 100\right)\right)$$
    $$\text{Media min/partido} = \operatorname{round}\left(\frac{\text{Minutos jugados}}{\text{Total convocatorias}}\right)$$
  - **Casos reales validados**:
    - **Pablo Díaz**: Convocado a 1 partido de F7 (70 min reglamentarios), disputó 53 minutos. Minutos posibles: 70 min. Porcentaje: **76%** (nunca 100%).
    - **Alejandro Pedrós / Pelayo**: Convocado a 2 partidos de F7 (140 min posibles), disputó 60 minutos en total. Porcentaje: **43%**, con una media de **30 min/partido convocado**.
  - **Representación visual**: Tanto en la ficha individual de Plantilla como en los tooltips y resúmenes se muestra de forma explícita: `<strong>X de Y min</strong> (Z%) · N partidos conv.`.

### 2. Tablas clasificatorias de plantilla (`#squad-leaderboards`)
- Se implementó un panel modular e intuitivo en la vista de Plantilla con 5 clasificaciones y selector de ámbito (**Todo el curso**, **Liga**, **Pretemporada**):
  1. **Goleadores (Pichichi)**: Jugadores ordenados por número total de goles.
  2. **Asistencias**: Jugadores ordenados por pases de gol. Se añadió soporte para registrar al asistente (`assistantId`) en goles tanto en directo (En vivo / Delegado) como en el detalle del partido y estadísticas manuales.
  3. **Trofeo Zamora**: Ranking de porteros (jugadores con rol o posición de Portero con minutos jugados), calculado con el coeficiente oficial: $\frac{\text{Goles encajados}}{\text{Partidos jugados}}$.
  4. **Reparto equitativo de minutos**: Ordenado de **menor a mayor** promedio de minutos jugados por partido convocado. Permite al entrenador detectar inmediatamente qué jugadores tienen déficit de minutos y deben ser compensados y priorizados en las siguientes convocatorias y alineaciones.
  5. **Fair Play**: Ranking de tarjetas amarillas y rojas recibidas.
- Interfaz con diseño de podio (oro 🥇, plata 🥈, bronce 🥉), etiquetas de rol y cambio reactivo de pestañas sin recargar.

### 3. Especialistas a balón parado y capitanes
- Se añadió el botón `🎯 Balón parado y Capitanes` en la cabecera de Plantilla junto con el modal `#set-pieces-dialog`.
- Permite configurar y persistir en `settings/setPieces`:
  - **Penaltis**: 1.er y 2.º lanzador.
  - **Faltas perfil izquierdo**: 1.er lanzador (preferente diestro) y 2.º lanzador.
  - **Faltas perfil derecho**: 1.er lanzador (preferente zurdo) y 2.º lanzador.
  - **Córners banda izquierda**: 1.er y 2.º lanzador.
  - **Córners banda derecha**: 1.er y 2.º lanzador.
  - **Capitanes**: 1.er, 2.º y 3.er capitán.
- **Visualización integrada**:
  - Resumen rápido destacado en la parte superior de la sección Plantilla (`#plantilla-specialists-bar`).
  - Badges/insignias visuales en la tarjeta de cada jugador (`🎯 1.er Penalti`, `⚡ 1.ª Falta Izq.`, `©️ 1.er Capitán`, etc.).
  - Banner de consulta rápida accesible durante los partidos en directo en las vistas En vivo y Modo Delegado.

### 4. Corrección de Modo Campo Directo (Pantalla sin carga / Error 401 RLS)
- **Diagnóstico**: `modo-campo-directo.html` fallaba al cargar datos de Supabase, quedando en blanco o con spinner indefinido.
- **Causa raíz**: Los módulos `js/modo-campo-directo.js`, `js/modo-campo-actions.js` y `js/modo-campo-identity-exercises.js` instanciaban el cliente de Supabase con `auth: { persistSession: false }`. Al tener Supabase habilitado Row Level Security (RLS) en las tablas (`jugadores`, `convocatorias`, `partidos`, `asistencias`, `configuracion`), las consultas sin token de sesión arrojaban errores HTTP 401 / código PostgreSQL `42501 permission denied for table`.
- **Solución implementada**:
  - Se configuró el cliente Supabase de Modo Campo con `auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }`.
  - De esta forma, el SDK de Supabase aprovecha automáticamente la sesión segura existente del usuario iniciada en CampoBase sin necesidad de almacenamiento intermedio manual.
  - Se implementó un manejo de errores claro y amigable en la interfaz de Modo Campo que orienta al usuario si no existe una sesión activa en lugar de quedarse congelado.

### 5. Bump de versión PWA y sincronización v43
- Versión unificada: `20260923-stats-setpieces-modocampo-v43`.
- Sincronizados de forma atómica:
  - `sw.js` (nombre de clave de caché `CACHE` y array `ASSETS`).
  - `index.html` (queries de assets, registro de Service Worker y `window.__CAMPOBASE_BUILD`).
  - `js/app.js`, `js/supabase-client.js`, `js/demo-session.js`, `js/ejercicio-viewer.js`.
  - Suite de tests de integración (`tests/pwa-current-build.test.js`, `tests/auth-recovery-controls.test.js`, etc.).
  - Nuevo archivo de tests: `tests/squad-stats-and-set-pieces.test.js`.
- Batería de pruebas: **501/501 tests unitarios y de integración superados en verde** y chequeo de sintaxis (`npm run check`) 100% verificado.

### 6. Diagnóstico de reproducción de vídeo en iPhone físico (`?videoDebug=1` y botón en Ajustes)
- **Objetivo**: Proporcionar al usuario una herramienta visual e inmediata en su teléfono real para diagnosticar el estado del reproductor en `f7-126` y otros ejercicios sin depender exclusivamente de emuladores ni Playwright.
- **Activación flexible (apta para PWA standalone sin barra de direcciones)**:
  1. **Mediante parámetro URL**: Entrando con `?videoDebug=1` (guarda persistencia en `localStorage.setItem('campobase.videoDebug', '1')`).
  2. **Mediante botón en Ajustes**: En la sección *Sesión y sistema* se añadió el botón `🐞 Diagnóstico de vídeo móvil`, que permite conmutar la herramienta directamente desde la PWA instalada en la pantalla de inicio del iPhone.
- **Métricas registradas en pantalla en tiempo real**:
  - `window.__CAMPOBASE_BUILD` (versión del código ejecutándose).
  - `navigator.serviceWorker.controller` (Service Worker que controla activamente la página).
  - `navigator.userAgent`.
  - `navigator.standalone` y `(display-mode: standalone)`.
  - `video.dataset.src` vs `video.currentSrc` (para verificar si cargó la variante `-mobile.mp4` correcta).
  - `readyState` (0 a 4) y `networkState` (0 a 3).
  - `paused`, `currentTime` y `duration`.
  - `video.error` (código y mensaje en caso de fallo).
  - **Historial reactivo de eventos**: Registra con timestamp los últimos eventos del elemento de vídeo: `loadstart`, `loadedmetadata`, `loadeddata`, `canplay`, `play`, `playing`, `waiting`, `stalled`, `suspend`, `pause`, `error`, `ended`.
  - Botón **Copiar** para exportar todo el registro de diagnóstico y pegarlo cómodamente.

---

## 2. Resumen de Mejoras y Auditoría v44 (`20260923-stats-setpieces-modocampo-v44`)

### 1. Eliminación Definitiva del Símbolo `#` en Dorsales de Jugadores
- **Causa anterior:** En selectores de lanzadores de balón parado, capitanes, tablas clasificatorias y el banner rápido de especialistas, se mostraba el dorsal precedido por el carácter `#` (ej. `#7`, `#10`), lo cual contravenía la regla de estilo del usuario (`Alejandro Pedrós Goncalves 7`).
- **Solución implementada:**
  - Se sustituyeron todas las interpolaciones `#${cleanPlayerNumber...}` y etiquetas de dorsal en `js/app.js`.
  - Ahora en toda la interfaz (formulario de especialistas, banners tácticos en vivo y clasificaciones) el dorsal aparece limpio como número (`7`, `10`, etc.) o en una píldora visual estilizada `.lb-dorsal-tag`.

### 2. Botón Reactivo de Despliegue de Tablas Clasificatorias
- **Causa anterior:** El acordeón de tablas clasificatorias no indicaba con claridad la acción al estar abierto o cerrado, ni cambiaba el texto dinámicamente.
- **Solución implementada:**
  - Se añadió la etiqueta interactiva `<span class="badge secondary lb-toggle-text">Desplegar tablas clasificatorias ▾</span>` / `Cerrar tablas clasificatorias ▴`.
  - Se conectó un listener sobre el evento `toggle` de `details.squad-leaderboards-card` que actualiza el texto y la flecha en tiempo real según el estado desplegado/colapsado.

### 3. Convocatorias y Minutos Reales (Caso Aitor y Jugadores de Plantilla)
- **Causa anterior:**
  - Si un jugador disputaba minutos en un partido (`minuteTotals > 0`) pero el partido no tenía vinculada formalmente una convocatoria previa (o se había creado el partido directamente sin documento previo de convocatoria), la estadística de convocatorias del jugador omitía ese partido.
  - Esto generaba discrepancias donde jugadores como Aitor contaban con minutos reales jugados pero una sola convocatoria formal registrada.
- **Solución implementada:**
  - En `js/domain.js` (`buildPlayerSummary`), se flexibilizó el enlace bidireccional entre convocatoria y partido:
    `(c.matchId && c.matchId === match.id) || (match.callupId && match.callupId === c.id) || match.id === c.id`.
  - Se incorporó el cómputo de partidos jugados con minutos donde no existía documento de convocatoria previo: se suman como convocatorias efectivas reales (`totalCallups`).
  - En `calculatePlayerCallupMinutes`, se garantiza que `effectiveCallups` nunca sea inferior a la cantidad de partidos disputados computados (`Math.max(totalCallups, countedMatchIds.size)`).
  - De este modo, todas las estadísticas y porcentajes de participación reflejan la realidad deportiva exacta.

### 4. Nuevos Eventos de Balón Parado en Partido en Vivo y Modo Delegado
- **Causa anterior:** Solo se podían registrar goles estándar, tarjetas, lesiones e incidencias genéricas. Faltaban eventos específicos de penaltis y balón parado esenciales para el seguimiento minucioso del entrenador y del delegado.
- **Solución implementada:**
  - Se incorporaron en `js/domain.js` (`addPlayerMatchEvent`) y en la interfaz de `js/app.js` (tanto para En Vivo como Modo Delegado y edición a posteriori en Calendario):
    1. **Gol de penalti** (`penalty_goal`): Suma un gol a nuestro favor en el marcador (`goalsFor + 1`), guarda la propiedad `isPenalty: true` en el array de goles y muestra el icono `🎯⚽`.
    2. **Penalti fallado** (`penalty_miss`): Registra la incidencia del lanzador con etiqueta `❌🎯 Penalti fallado` sin alterar el marcador.
    3. **Penalti parado por el portero** (`penalty_saved`): Registra la incidencia de mérito del guardameta con etiqueta `🧤🎯 Penalti parado` sin variar el marcador.
    4. **Penalti encajado** (`penalty_conceded`): Registra la incidencia sobre el portero con etiqueta `⚠️🎯 Penalti encajado` y suma un gol al rival en el marcador (`goalsAgainst + 1`).
    5. **Gol en propia puerta** (`own_goal` / `__pp__`): Registra el gol sin asignar a ningún jugador de campo indebidamente.
    6. **Asistencias vinculadas a goles**: Selector de asistente en vivo y en diferido, computándose de inmediato en la tabla de Asistencias de plantilla.

### 5. Tablas Clasificatorias Más Visuales y Elegantes
- **Mejoras de estilo (`styles-redesign.css`):**
  - **Podio deportivo**: Las 3 primeras posiciones cuentan con acabados metálicos distintivos:
    - 🥇 **1.º clasificado (`.lb-podium-1`)**: Borde y fondo sutil en degradado dorado (`rgba(234, 179, 8, 0.12)`).
    - 🥈 **2.º clasificado (`.lb-podium-2`)**: Borde y fondo en degradado plateado (`rgba(148, 163, 184, 0.12)`).
    - 🥉 **3.er clasificado (`.lb-podium-3`)**: Borde y fondo en degradado bronce (`rgba(217, 119, 6, 0.12)`).
  - **Píldora de dorsal (`.lb-dorsal-tag`)**: Dorsal resaltado en cápsula compacta de alto contraste sin el símbolo `#`.
  - Celdas con tipografía tabular (`tabular-nums`) y avatar con iniciales o foto optimizada.

### 6. Reproducción de Vídeo MP4 en iPhone Físico (PWA Standalone)
- **Diagnóstico del problema:**
  - En ordenadores y Safari estándar el vídeo reproducía correctamente.
  - En la PWA instalada en la pantalla de inicio del iPhone, al pulsar el botón ▶ el vídeo se quedaba en pausa a 0:00 o no arrancaba.
  - **Causa raíz:** En `js/ejercicio-viewer.js`, dentro de la función `togglePlay()`, existía una lógica que ante un estado `readyState === 0` o red vacía forzaba `video.load()` con un parámetro URL dinámico en iOS standalone. En el motor WebKit de iOS, invocar `video.load()` de forma síncrona dentro o antes del gesto táctil de usuario aborta el pipeline de medios, cancela la promesa de reproducción (`AbortError`) y fuerza al elemento a pausarse en 0:00.
- **Solución implementada:**
  - Se eliminó el reseteo destructivo `video.load()` de `togglePlay()`.
  - Se añadieron los atributos nativos obligatorios de WebKit: `webkit-playsinline`, `playsinline`, y la propiedad imperativa `video.playsInline = true`.
  - Asignación limpia de `video.src = video.dataset.src` sin recargas intermedias, permitiendo que `video.play()` arranque limpiamente en el primer toque del usuario en la PWA.

### 7. Auditoría Técnica: ¿Se pueden borrar los vídeos MP4 de Supabase?
- **Pregunta del usuario:** *«Comprueba si se puede borrar de supabase ya los mp4 si no hacen nada ahí ni rompe nada, yo tengo copia local de esos videos pero creo que está en github»*.
- **Dictamen y comprobación técnica:**
  - **SÍ, los 323 vídeos históricos del catálogo precargado SE PUEDEN BORRAR del almacenamiento (Storage) de Supabase.**
  - **Fundamento técnico:** El módulo `js/ejercicio-videos.js` contiene la función central `resolveHostedVideoUrl(url)`. Todas las URLs de vídeos del catálogo con patrón `library-v2-preview/*` o `CAMPOBASE-VIDEO-*` son interceptadas y redirigidas al CDN de **GitHub Releases** (`campobase-videos-v1`). Los navegadores y la PWA descargan y reproducen los vídeos directamente desde GitHub Releases a coste 0, sin realizar ninguna petición a Supabase Storage para estos vídeos.
  - **⚠️ ADVERTENCIA CRÍTICA DE SEGURIDAD:**
    - **NO se debe borrar el bucket `ejercicio-videos` de Supabase**.
    - La funcionalidad «Añadir vídeo propio» en ejercicios personalizados (función `uploadVideo()` en `js/supabase-client.js`) sube los vídeos nuevos directamente a ese bucket de Supabase Storage.
    - **Acción recomendada:** Se pueden borrar con total seguridad los 323 archivos `.mp4` del catálogo que estén dentro del bucket para liberar espacio en la cuota gratuita, pero manteniendo el bucket `ejercicio-videos` intacto con sus políticas de acceso.

### 8. Comprobación Técnica: ¿El polling de 10 segundos sobra o es necesario teniendo Realtime?
- **Pregunta del usuario:** *«Añade que hay que comprobar el realtime por si el ploit de 10 seg si sobre es necesario»*.
- **Dictamen y comprobación técnica:**
  - **NO SOBRA. El polling de 10 segundos es ESTRICTAMENTE NECESARIO como mecanismo de salvaguarda y respaldo (fallback).**
  - **Fundamento técnico:**
    1. **Suspensión de WebSockets en iOS PWA:** Cuando el entrenador o el delegado apagan la pantalla del iPhone, contestan un mensaje o cambian de aplicación, iOS WebKit suspende de inmediato la ejecución de JavaScript y corta o congela la conexión WebSocket de Supabase Realtime. Al volver a la app, los WebSockets con frecuencia no se enteran de la desconexión hasta pasados varios minutos o no reconectan automáticamente sin una señal activa.
    2. **Límites e inactividad en Supabase:** Las conexiones WebSocket en la capa gratuita de Supabase sufren cortes por inactividad o cuotas de sockets concurrentes.
    3. **Respaldo auditado por tests de arquitectura:** El test `tests/realtime-shadow-sync.test.js` («Realtime se añade como segunda vía sin retirar los respaldos actuales») exige explícitamente `setInterval(() => synchronizeCloud().catch(handleError), 10000)`.
    - **Conclusión:** Realtime proporciona la inmediatez milimétrica en vivo cuando la pantalla está activa, mientras que el polling de 10 segundos garantiza que jamás se pierda una sincronización de partido o convocatoria por un corte silencioso de conexión.

### 9. Verificación y Batería de Pruebas
- Sincronización completa de la versión `20260923-stats-setpieces-modocampo-v44` en Service Worker, aplicación cliente y suites de tests.
- **506/506 tests unitarios y de integración superados con éxito** (`npm test`).
- Sintaxis y tipado validados con `npm run check` al 100%.

### 10. Actualización Crítica: Protección de Datos, Rendimiento, Marcador en Vivo y Móvil (2026-09-23)
1. **Protección Absoluta de Datos del Usuario (INMUTABLES):**
   - **Jugadores y lanzadores:** Actualizados directamente por el usuario. PROHIBIDO modificarlos, reiniciarlos, sobrescribirlos o borrarlos en cualquier sincronización o migración.
   - **Convocatoria contra El Pilar:** Actualizada por el usuario de forma provisional. PROHIBIDO modificarla o alterarla; se preserva íntegramente.
2. **Borrado 100% de MP4 en Supabase Storage:**
   - Se eliminaron con éxito los **323 archivos MP4** alojados en el bucket `ejercicio-videos` de Supabase (25 en `CAMPOBASE-VIDEO-.../video.mp4` y 298 en `library-v2-preview/.../ejercicio.mp4`).
   - El bucket `ejercicio-videos` se conserva limpio para futuras subidas sin consumir almacenamiento en la cuota gratuita de Supabase, ya que los vídeos del catálogo se sirven desde GitHub Releases (`campobase-videos-v1`).
3. **Anulación de Goles e Incidencias en Partido en Vivo:**
   - Implementada la función `removePlayerMatchEvent(details, eventId)` en `js/domain.js` y `removeLiveEvent(prefix, eventId)` en `js/app.js`.
   - Permite al entrenador o delegado anular cualquier gol (propio, de penalti o en propia puerta), penalti encajado, tarjeta, lesión o incidencia desde la lista de eventos en vivo mediante un botón individual «✕ Anular».
   - Al anular un gol, el marcador (`goalsFor` o `goalsAgainst`) se recalcula y decrementa inmediatamente, persistiendo en el timer y refrescando la pantalla del míster y del delegado al instante.
4. **Rediseño del Marcador en Vivo y Corrección Móvil:**
   - Se eliminó el fondo verde oscuro `#0f2d20` y los números negros forzados que no habían sido configurados por el usuario.
   - Marcador rediseñado con estilo tarjeta limpia (`var(--cb-surface-card)`), nombres de equipos en texto de alto contraste (`--cb-slate-800`), números en verde corporativo (`--cb-brand`), y botones contenidos de 38×38 px que nunca se desbordan en pantallas móviles (pantallazo 2 solucionado).
   - Se corrigió el colapso visual de los botones de la pizarra táctica en móvil (`.tactic-tool` y `.tactic-tool-label` con `white-space: nowrap; word-break: normal`), impidiendo que las letras se apilen verticalmente una a una (pantallazo 1 solucionado).
5. **Solución a la Lentitud Extrema y Falta de Sincronización:**
   - **Causa identificada:** En `js/db.js`, `localJson !== cloudJson` comparaba arrays no ordenados por ID devueltos por PostgREST, resultando en `true` constantemente y forzando a vaciar y repoblar IndexedDB cada 10 segundos, destruyendo y recreando todo el DOM con `refresh()`. Además, las peticiones sin timeout saturaban el pool de conexiones de Supabase (error 503/504 `PGRST002/PGRST003`).
   - **Solución aplicada:**
     - En `js/db.js`, comparación de registros ordenada por ID (`areEquivalent`). Cuando no hay cambios reales, no se tocan los almacenes locales ni se re-renderiza la interfaz.
     - En `js/supabase-client.js`, incorporación de `AbortSignal.timeout(6000)` en consultas `getSnapshot` y mutaciones para evitar bloqueos del navegador.
6. **Reproductor de Ejercicios en Móvil:**
   - Solucionado el problema por el cual el vídeo se quedaba en pausa a 0:00: al pulsar sobre el overlay de reproducción en móvil, la ocultación instantánea de este causaba un segundo evento de clic fantasma sobre la etiqueta `<video>` subyacente, pausándolo inmediatamente. Se añadió debounce de 350 ms y `stopPropagation()`.
   - Añadida etiqueta hija explícita `<source src="..." type="video/mp4">` para que el motor AVPlayer de iOS WebKit reconozca el stream MP4 de forma nativa sin depender del `Content-Type` de GitHub Releases.
7. **Modo Campo:**
   - Incorporado timeout de seguridad en `readTable` y mensaje informativo con botón de reintento automático si el servidor Supabase se encuentra despertando tras una pausa.

### 11. Resolución de Incidencias Críticas en Móvil, Estadísticas y Sincronización (2026-09-23)
1. **Desplegables de Cambios en Vivo en Pantalla Móvil:**
   - **Problema:** En el móvil los nombres de los jugadores en los selectores de cambios tácticos (`.live-tactics-slots .slot` y `#prep-slots .slot`) se recortaban severamente (ej. `1 Ma`, `11 Ai`, `7 Al`) al compartir fila estrecha con la etiqueta de posición y dorsal.
   - **Solución implementada:**
     - Reestructurado el layout de cada ranura táctica en dos filas independientes:
       - **Fila 1 (`.slot-head`):** Posición en verde negrita a la izquierda y dorsal a la derecha.
       - **Fila 2:** `<select>` a ancho completo (100% / min-width: 0) con `font-size: 0.95rem; font-weight: 700;`.
     - Todos los nombres de la plantilla (ej. `1 Mateo Moyano Santana`, `11 Aitor Rodríguez`) disponen ahora del ancho completo de la pantalla móvil y se leen de forma íntegra sin cortes.
2. **Solución a la Sincronización Móvil y Lanzadores Ausentes:**
   - **Causa identificada:** En el PC, el usuario configuró los especialistas y jugadores en local, pero la subida a Supabase quedó bloqueada debido a que el servidor de Supabase devuelve un error `503 PGRST002: Could not query the database for the schema cache. Retrying.` (causado por la pausa del servicio o reinicio pendiente en Supabase). En consecuencia, los lanzadores nunca llegaron a la nube ni pudieron descargarse en el móvil. Además, en `js/sync-core.js`, una sincronización remota con ajustes incompletos podía sobrescribir `setPieces`.
   - **Solución implementada:**
     - **Preservación estricta de lanzadores:** En `js/sync-core.js` (`mergeCloudRecord`), si el registro local contiene `setPieces` y la nube devuelve uno nulo o vacío, se conservan intactos los lanzadores locales.
     - **Transferencia directa al móvil (sin depender de Supabase):**
       - Se añadió la función `shareDatabaseToMobile()` en `js/app.js` y botones de acceso directo:
         - En la tarjeta rápida de Plantilla: `🎯 Lanzadores y Capitanes` > `📲 Pasar al móvil`.
         - En Ajustes > `Copia de seguridad` > `📲 Pasar datos al móvil`.
       - Emplea la API nativa `navigator.share` para compartir en 1 clic el archivo `.json` de la base de datos (con todos los jugadores, lanzadores y partidos) directamente a WhatsApp, AirDrop, Telegram o email.
       - Si el navegador no soporta Web Share de archivos, descarga el archivo `.json` e instruye al usuario a cargarlo en el móvil mediante Ajustes > "Importar JSON".
3. **Corrección Completa de Estadísticas y Tablas de Clasificación:**
   - **Problema:** Jugadores sin ningún partido jugado aparecían con 2 convocatorias; jugadores con 3 partidos aparecían con 6 partidos; goles y estadísticas desajustadas.
   - **Causa identificada:**
     1. Convocatorias de partidos planificados/futuros (como la convocatoria provisional contra El Pilar) se computaban como convocatorias y partidos completados.
     2. En `buildPlayerSummary` se sumaba `explicitCallupCount` con `playedMatchesWithoutCallup`, lo que provocaba un doble recuento (+3 y +3 = 6) cuando los identificadores de convocatoria no estaban formalmente enlazados en el partido.
   - **Solución implementada en `js/domain.js`:**
     - Se añadió la comprobación `isMatchCompleted(m)`: los partidos con estado `planned` o sin minutos jugados **NO computan** en las estadísticas históricas de partidos disputados ni convocatorias pasadas.
     - Se implementó la desduplicación canónica de convocatorias (`byMatchCallups`), garantizando que cada partido completado compute como máximo una única convocatoria por jugador.
     - Se corrigió el cálculo de convocatorias: ahora se evalúa cada partido completado una sola vez (si el jugador jugó minutos > 0 o estaba disponible en la convocatoria).
     - Resultado verificado: el jugador con 3 partidos pasa exactamente a 3 convocatorias (no 6), y el jugador que no ha debutado pasa a 0 convocatorias (no 2).
4. **Reproductor de Ejercicios en Chrome Móvil / iOS:**
   - **Problema:** En Chrome móvil y Safari, al pulsar Play dos veces o interactuar con el vídeo, este se quedaba en pausa o bloqueado por una excepción `AbortError: The play() request was interrupted by a call to pause()`.
   - **Solución implementada en `js/ejercicio-viewer.js`:**
     - Se asigna directamente el atributo `src="${esc(videoSrc)}"` y `preload="metadata"` en la etiqueta HTML `<video>`, evitando que el elemento se reinicialice en frío al pulsar Play.
     - Se asignan explícitamente en JavaScript las propiedades `video.muted = true; video.defaultMuted = true; video.playsInline = true;` requeridas por las políticas de autoplay de Chrome móvil y iOS WebKit.
     - Se incorporó un cerrojo de promesa (`playPromise`) en `togglePlay()`: si una solicitud de `video.play()` está resolviendo la redirección de red, los toques sucesivos no interrumpen con `pause()`, previniendo el bloqueo y garantizando una reproducción fluida.
5. **Modo Campo Directo frente a Error 503:**
   - **Problema:** En el móvil, al abrir Modo Campo, se mostraba una pantalla roja de error `convocatorias: Could not query the database for the schema cache. Retrying.` sin alternativa para acceder a los datos.
   - **Solución implementada en `js/modo-campo-directo.js`:**
     - Se añadió un botón destacado para abrir inmediatamente la versión principal de CampoBase (`./index.html`), la cual opera 100% offline desde el almacenamiento local del dispositivo sin depender de la nube.
     - Se incluyó la instrucción clara para reactivar Supabase: entrar en el panel de control de Supabase > *Project Settings* > *General* > *Restart Project*.
6. **Compromisos y Protección de Datos:**
   - **Jugadores y lanzadores del usuario:** No se han modificado ni alterado.
   - **Convocatoria provisional contra El Pilar:** Conservada íntegra y protegida.

---

### 12. Despliegue Crítico v45: Modo Campo Local-First, Ancho Completo en Móvil, Reproductores Táctiles y Sincronización Directa (2026-09-23)

1. **Investigación y Causa Raíz de los 4 Problemas Reportados:**
   - **Causa raíz de la falta de cambios en el móvil:** Las modificaciones se habían preparado en local pero no se habían consolidado en el build de producción ni desplegado a GitHub Pages. Además, el Service Worker de la PWA mantenía en caché la versión `v44`. Con el incremento a `20260923-stats-setpieces-modocampo-v45` y la recarga en `controllerchange`, todos los navegadores móviles renuevan sus archivos inmediatamente al conectar.
   - **Causa raíz del bloqueo en Modo Campo:** `modo-campo-directo.html` dependía exclusivamente de una consulta remota a Supabase en frío. Al encontrarse el servidor de Supabase en error `503 PGRST002` (PostgREST sin conexión con el esquema Postgres), la pantalla fallaba tras 8 segundos sin mostrar ningún dato.
   - **Causa raíz de los nombres estrechos en goles y asistencias:** En pantallas táctiles, el editor de eventos (`.event-editor`) utilizaba un grid de 4 columnas de 140px que comprimía los `<select>` de Jugador y Asistencia. Asimismo, en las tablas clasificatorias (`.lb-table`), la cabecera `<th>` de Jugador carecía de clase `.col-player` y su ancho mínimo de 180px era insuficiente para nombres largos con dorsal.
   - **Causa raíz de los botones Reproducir en móvil:**
     1. El overlay de reproducción era un `<div>` genérico sin semántica de botón nativo, lo que provocaba que WebKit en iOS omitiera el evento sintético `click` bajo ciertas condiciones táctiles.
     2. En `togglePickerVideo` de `js/session-visual-planner.js`, la llamada síncrona a `video.load()` dentro del evento del usuario cancelaba el gesto de activación (*transient activation*), haciendo que el navegador rechazara la reproducción por política de autoplay.
     3. Los toques en la superficie del reproductor se solapaban con eventos táctiles y pausaban el vídeo de forma accidental.

2. **Soluciones Implementadas:**
   - **Modo Campo 100% Resiliente y Local-First Inmediato:**
     - En `modo-campo-directo.html`, un script recupera inmediatamente la base local de IndexedDB (probando tanto el identificador de usuario `campobase_<id>` como la base por defecto `campobase`) y el volcado en `localStorage.getItem('campobase.directFieldCache')`.
     - En `js/modo-campo-directo.js`, `load()` aplica la caché local de inmediato en 0 ms: la interfaz muestra la plantilla, sesiones y partidos sin esperar a la red. La petición a Supabase se ejecuta en segundo plano: si tiene éxito actualiza los datos; si falla (503) mantiene los datos locales sin mostrar ningún error.
     - Añadido un botón visible `📥 Cargar copia JSON de datos` en Modo Campo para cargar copias de seguridad directamente desde el móvil sin depender de la nube.
     - Escucha reactiva del evento `campobase:cache-ready` para actualizar la vista en cuanto IndexedDB esté listo.
   - **Nombres a Ancho Completo en Goles, Asistencias y Tablas Clasificatorias:**
     - En `styles-redesign.css` y `styles.css`: En dispositivos móviles (`max-width: 900px`), `.event-editor` pasa a disposición en columna vertical completa (`100% !important;`), garantizando que los desplegables de **Jugador** y **Asistencia** tengan una altura táctil de 48px y muestren el nombre completo de cualquier jugador sin truncar.
     - En `js/app.js`: Añadida la clase `.col-player` a las cabeceras `<th>` de las 5 tablas clasificatorias (Goleadores, Asistencias, Zamora, Reparto de Minutos y Fair Play).
     - En `styles-redesign.css`: Fijado `min-width: 220px !important; white-space: nowrap !important;` tanto en `th.col-player` como en `td.col-player`, con scroll horizontal fluido (`-webkit-overflow-scrolling: touch`) en `.lb-table-wrapper`.
   - **Reproductores de Vídeo Táctiles y Blindados:**
     - En `js/ejercicio-viewer.js`:
       - `.video-overlay-play` transformado en `<button type="button">` nativo accesible con `border: none; padding: 0; outline: none;`.
       - Incorporados listeners de `touchend` con `e.preventDefault()` y debounce de 350ms, eliminando la latencia táctil de 300ms de iOS/Android y erradicando los clics fantasma.
       - En `togglePlay()`: se fuerza `video.muted = true; video.defaultMuted = true; video.playsInline = true;` antes de `play()`. Si el navegador bloquea la reproducción, activa de inmediato `video.controls = true` como mecanismo nativo infalible.
       - Eliminado el listener `video.addEventListener('click')` sobre la superficie del vídeo para impedir pausas no deseadas durante gestos táctiles de desplazamiento o zoom.
       - Botón `.v-btn-play` ampliado en móvil a `min-width: 44px; min-height: 40px; font-size: 1.15rem` cumpliendo las pautas de accesibilidad táctil de Apple y Google.
     - En `js/session-visual-planner.js`: Eliminado `video.load()` síncrono en `togglePickerVideo` para no cancelar la activación de usuario en WebKit.
     - En `js/app.js`: Protegidos los botones de reproducción de la pizarra táctica (`.lb-play`) con `muted = true`, `playsInline = true` y captura de promesas.
   - **Sincronización Directa PC ↔ Móvil en 1 Clic (Sin Depender del 503 de Supabase):**
     - Botones **«📥 Cargar datos del PC»** añadidos en las cabeceras de **Hoy**, de **Plantilla** y en **Ajustes**.
     - Botones **«📲 Pasar al móvil»** en **Plantilla** (`Lanzadores y Capitanes`) y en **Ajustes** (`Copia de seguridad`), que permiten enviar la base de datos completa con 1 toque por WhatsApp (al chat personal del entrenador) o AirDrop.
     - En `js/db.js`, `importDatabase()` escribe en IndexedDB y guarda de forma simultánea un volcado directo en `campobase.directFieldCache`, sincronizando al mismo tiempo CampoBase normal y Modo Campo.
   - **Cache-Busting Total del Service Worker:**
     - Versión global actualizada a `20260923-stats-setpieces-modocampo-v45` en `index.html`, `sw.js` y ficheros de prueba, forzando la renovación de caché en todos los clientes móviles.

2. **Entrega v46 (23/09/2026) — Corrección de Vídeo Móvil, Limpieza de Copias Locales y Soporte Supabase Pro:**
   - **Retirada de botones de importación local:** Eliminados los botones de «Cargar datos del PC» en las cabeceras de Hoy y Plantilla y en Modo Campo. CampoBase opera 100% en la nube a través de Supabase y GitHub Releases según la preferencia de Migue.
   - **Reproducción de vídeo en móvil iOS/Android:**
     - En `js/ejercicio-viewer.js`: Retirado el atributo directo `src` de la etiqueta `<video>`, dejando exclusivamente `<source src="..." type="video/mp4">`. Esto permite a WebKit en iOS identificar el tipo MIME correcto (`video/mp4`) y eludir el `application/octet-stream` de GitHub Releases.
     - En `togglePlay()`: Eliminado el cerrojo de promesa que bloqueaba toques repetidos y retirada la asignación destructiva de `video.src = src` que invalidaba el elemento `<source>`.
     - Añadido soporte táctil en el botón `▶ Reproducir` del visor de pizarra en `js/exercise-viewer-layout.js` (`touchend` y `pointerup`).
   - **Diagnóstico y activación de Supabase Pro:** La actualización a plan de pago Pro elimina las pausas para siempre. Para desbloquear el estado transitorio `503 PGRST002`, se proporcionan los pasos exactos de reinicio de PostgREST (`NOTIFY pgrst, 'reload schema';`).
   - **Cache versioning:** Incrementada la versión a `20260923-v46-videomobile-syncpro-cleanup`.

3. **Validación Final Definitiva en Producción (v46+) — Blindaje de Arquitectura y Sincronización Supabase Pro:**
   - ⚠️ **REGLA ESTRICTA DE NO MODIFICACIÓN / NO REVERSIÓN:**
     Todos los puntos siguientes han sido **validados expresamente por el usuario en sus dispositivos móviles y en el servidor de producción**. Ningún agente ni modificación futura debe alterar, revertir o eliminar estos patrones.
   
   - **A. Sincronización Cloud Supabase Pro (Validada 100% en Móvil):**
     - **Causa raíz descubierta del 503 / 521 y CPU 100%:** Al pasar de Free a Pro, Supabase conservó la instancia en `t3.nano` (512 MB RAM). Un bucle interno de réplica/introspección generó más de 7,4 millones de errores en PostgreSQL en 24 horas, consumiendo todos los créditos de ráfaga de CPU de AWS y dejando la base de datos en estado `Unhealthy`.
     - **Solución definitiva aplicada:** Upgrade del cómputo a tamaño **`MICRO` (`t3a.micro`)** en Supabase Dashboard. Este tamaño está cubierto al 100% por los 10 $/mes de crédito de computación incluidos en el plan Pro de Supabase.
     - **Resultado verificado:**
       - Estado del proyecto: **`Healthy`** (verde).
       - Memoria RAM y CPU desahogadas.
       - Endpoints de API REST (`/jugadores`, `/partidos`, `/configuracion`, `/asistencias`, `/convocatorias`) respondiendo con **HTTP 200 OK en ~200ms**.
       - Los datos de plantilla (54 jugadores), lanzadores (`setPieces` de penaltis, faltas, córners y capitanes) y partidos (goleadores y actas) se sincronizan de inmediato en el móvil.
     - **Aviso de CPU alta en el panel:** El banner de *"High CPU usage"* en Supabase Dashboard es un cálculo de la media móvil de la última hora en AWS; no refleja el estado en tiempo real tras la migración a Micro y se disipa automáticamente cuando la ventana temporal expira.
     - **Comando SQL de recarga de esquema:** PostgREST en PostgreSQL únicamente reconoce `'reload schema'` (con espacio) o `'reload config'` (con espacio). **Nunca** usar guion (`'reload-schema'`), ya que PostgREST lo ignora de forma silenciosa.

   - **B. Reproducción de Vídeo en Móvil iOS / Android (Validada 100% en Móvil):**
     - Las etiquetas `<video>` **nunca** deben incluir el atributo `src="..."` directo cuando el origen devuelva `application/octet-stream`. Deben utilizar siempre el hijo `<source src="..." type="video/mp4">` para que WebKit/Blink decodifique nativamente el contenedor MP4.
     - En `togglePlay()` jamás debe hacerse `video.src = src` destructivo.
     - Interacción táctil asegurada mediante eventos `pointerup` y `touchend` en `.v-btn-play`, `.video-stage`, `.video-overlay-play` y el visor de ejercicios tácticos.

   - **C. Interfaz y Experiencia Móvil (Validada 100%):**
     - Nombres a ancho completo en selectores tácticos, editor de goles/asistencias en columna y tablas estadísticas sin recortes.
     - Supresión total de opciones o botones de importación manual / copia local. La arquitectura es 100% Cloud-First con Supabase y GitHub Releases.

4. **Entrega v47 (23/09/2026) — Exportación e Impresión Compacta de Sesiones y Ejercicios (Fichas de Campo A4):**
   - **Reglas Mandatorias de Compacidad:**
     - **Ejercicio individual:** Estrictamente **1 sola página A4** (cabecera con equipo, título y badges de categoría/duración/espacio/jugadores; gráfico del campo superior; materiales, organización, dinámica de la tarea, reglas de provocación y consignas del entrenador en 2 columnas equilibradas).
     - **Sesión completa:** Formato ultra-compacto de **2 ejercicios por cara**. Una sesión típica de 4 tareas ocupa 2 páginas; una de 5 tareas ocupa ~2.5 páginas (1 o 2 hojas físicas si el usuario activa impresión a doble cara). Jamás 2 páginas por ejercicio ni 10 páginas por sesión.
     - **Configuración de impresión:** El usuario configura en el diálogo nativo de su sistema si imprime a 1 o 2 caras (dúplex).
   - **Implementación Técnica:**
     - `js/print-session-export.js`: Módulo con funciones `resolveExerciseData`, `buildSingleExerciseHtml`, `buildTrainingSessionHtml`, `printSingleExercise` y `printTrainingSession`. Carga previa de imágenes con timeout de seguridad antes de `window.print()` y auto-limpieza en `afterprint`.
     - `styles-redesign.css`: Reglas `@media print` con tamaño `@page { size: A4 portrait; margin: 8mm 10mm; }`, aislamiento absoluto (`body > *:not(#cb-print-root) { display: none !important; }`), estilo Eco-Tinta (fondos blancos, texto negro `#111827`, bordes finos `#cbd5e1`), y control de saltos de página con `break-inside: avoid`. Oculto en pantalla con `#cb-print-root { display: none !important; }`.
     - Integración UI:
       - Botón `🖨️ Imprimir` en cada tarjeta de sesión en la pestaña **Sesiones**.
       - Botón `🖨️ Imprimir Ficha de Sesión` en el detalle modal de la sesión.
       - Botón `🖨️ Imprimir Ficha` en la barra de acciones inferior del visor de ejercicio individual (`js/ejercicio-viewer.js`).
     - Delegación de eventos en `js/app.js` y métodos expuestos en `window.__campobase`.
   - **Tests y Calidad:**
     - Añadido `tests/print-session-export.test.js` con 9 pruebas de resolución de datos, generación HTML, diagrama de pizarra CSS de respaldo, integración en UI y DOM de impresión.
     - 518 tests unitarios pasando al 100%.
   - **Cache versioning:** PWA y Service Worker sincronizados a `20260923-v48-clean-print-isolation`.

5. **Entrega v48 (23/09/2026) — Aislamiento Intocable de Impresión, Botón Guardar en Móvil, Modo Campo Local-First y Vista Delegado Funcional:**

   - ⚠️ **REGLA DE ORO INTOCABLE DE IMPRESIÓN (AISLAMIENTO ABSOLUTO Y CERO ELEMENTOS PARÁSITOS):**
     - En el documento impreso o exportado a PDF **NUNCA** deben aparecer elementos propios de la interfaz web o PWA de CampoBase:
       - Ni la barra de búsqueda superior (`.search-bar`, `.search-bar::before`, `#global-search`).
       - Ni la barra de subnavegación (`#cb-sub-nav`) ni la barra de navegación inferior (`#cb-bottom-nav`, `.bottom-nav`).
       - Ni cabeceras de la aplicación, ni modales o diálogos abiertos.
     - La hoja generada es **estrictamente una Ficha Técnica de Campo**:
       - Fondo blanco limpio (estilo Eco-Tinta para ahorro en impresora).
       - Cabecera con datos del equipo, fecha, hora, campo, tiempo total y observaciones.
       - Cuadro resumen de material total necesario para el entrenamiento.
       - Cada tarea incluye: insignia de fase, título y duración; preview gráfico del campo o diagrama de pizarra; espacio métrico y jugadores; objetivo de la tarea; materiales; **explicación y dinámica de la tarea paso a paso**; reglas de provocación; rotación de jugadores; consignas del entrenador y notas específicas de la sesión.
     - **Compacidad estricta de páginas:**
       - Ejercicio individual: exactamente **1 página A4**.
       - Sesión completa: exactamente **2 tareas por cara A4**. Para una sesión estándar de 4-5 ejercicios, el documento tiene 2-3 páginas (solo 2 hojas físicas si el usuario activa impresión a doble cara). Jamás 2 páginas por ejercicio ni 10 páginas por sesión.

   - **Botón Imprimir en Móvil (Guardar en el Móvil / PDF):**
     - **Causa raíz:** En iOS Safari y Chrome para Android, `window.print()` requiere activación de usuario transitoria (*transient user activation*). Al ejecutarse dentro de un callback asíncrono de carga de imágenes o temporizador (`setTimeout`), el navegador móvil revoca el gesto táctil y bloquea silenciosamente la apertura del cuadro de diálogo.
     - **Solución implementada en `js/print-session-export.js`:**
       1. Disparo de `window.print()` de forma **100% síncrona** en el mismo hilo de ejecución del evento de clic del usuario.
       2. Inyección en `#cb-print-root` de una barra flotante táctil superior (`.cb-print-floating-bar`, oculta al 100% en `@media print`) con:
          - `🖨️ Guardar PDF / Imprimir`: dispara `window.print()` de forma directa.
          - `📲 Abrir para Compartir`: genera un documento Blob HTML completo y lo abre en una pestaña limpia, permitiendo a los usuarios de iPhone / Android usar el menú nativo de Compartir -> *Guardar en Archivos* o enviar como PDF por WhatsApp.
          - `✕ Volver`: cierra la vista y restaura la aplicación inmediatamente.

   - **Pantalla Delegado Visible y 100% Funcional:**
     - **Causas anteriores:** No estaba enlazada en la subnavegación de Partidos, no se ejecutaba `renderDelegate()` al cambiar de vista (`showView`), y si no había partido en curso mostraba un mensaje vacío bloqueante (*«Migue debe prepararlo primero»*) sin dar opciones.
     - **Solución implementada:**
       - Subpestaña **Delegado** visible en el módulo **Partidos** (`js/redesign-nav.js` y `js/team-access.js`).
       - En `showView('delegado')`: ejecución reactiva inmediata de `renderDelegate()`.
       - En `renderDelegate()`: si no hay un partido activo, se muestra un selector de partidos convocados con el botón destacado `▶ Iniciar control de partido (Delegado)`, permitiendo arrancar cronómetro y cambios en 1 toque.
       - Interfaz completa maquetada en `styles-redesign.css`: reloj digital grande, aviso de auto-pausa a 38:00 y 74:00, tarjeta destacada con sugerencia táctica (*«¿Quién ha jugado menos?»*), listas con checkbox para jugadores en campo y suplentes con dorsal y minutos disputados, y botones de cambios operativos (manual 1–7, automático 1–3 y proponer reparto).
       - Desbloqueo total para el entrenador (`roleCanUseOwnerFeatures`) y comprobación horaria segura sin bloqueos.

   - **Modo Campo Resiliente y Local-First:**
     - En `js/app.js`: actualización automática de `campobase.directFieldCache` en `localStorage` en cada renderizado y sincronización (`renderAll()`), asegurando que Modo Campo cuente siempre con datos locales frescos (plantilla, partidos, convocatorias, sesiones y partidos en vivo).
     - En `js/modo-campo-directo.js`: carga inmediata y segura desde la caché local sin mostrar jamás la pantalla roja de error si Supabase no responde o no hay conexión.
     - Desbloqueo de controles de cambios y enlaces directos al partido en curso.

   - **Batería de Pruebas y Cache Versioning:**
     - Versión global incrementada a `20260923-v49-delegate-pin-mobile-print-fix`.
     - 523 tests unitarios pasando al 100% (`npm test`).
     - Verificación de sintaxis completa pasando al 100% (`npm run check`).

14. **REGLAS INTOCABLES DE NAVEGACIÓN DE PARTIDOS, DELEGADO (PIN 0000) Y GUARDAR EN MÓVIL (v49):**
   - **Navegación de Partidos estricta de 4 pestañas:**
     - La navegación superior de Partidos (`MODULE_CONFIG.partidos.subTabs`) tiene única y exclusivamente 4 pestañas: Convocatoria (`convocatorias`), Alineación (`preparacion`), En Vivo (`partido`) y Calendario (`calendario`).
     - **JAMÁS** añadir una subpestaña "Delegado" en la barra superior de Partidos.
   - **Botón "Mostrar al Delegado" / "Ocultar al Delegado" accesible:**
     - En **Partido en Vivo** (`#unlock-delegate`): siempre visible para el entrenador (`roleCanUseOwnerFeatures`). Conmuta entre `Mostrar al Delegado` y `Ocultar al Delegado` sin desaparecer al activarse, sincronizándose automáticamente con la preparación guardada y con `state.timer.delegateUnlocked`.
     - En **Alineación** (lista de preparaciones): cada tarjeta de partido preparado dispone del botón directo `.prep-toggle-delegate` para permitir a Migue mostrar el partido al delegado días u horas antes sin tener que entrar al editor.
     - En el editor de alineación: se conserva el botón `#prep-delegate`.
   - **El Delegado (PIN 0000) y su Aislamiento Exclusivo a Partido en Vivo:**
     - El PIN `0000` autentica siempre de forma directa y universal como `delegate` en `submitAuth`.
     - El delegado **SOLO DEBE VER PARTIDO EN VIVO**: en `body.delegate-mode` se ocultan con `!important` la barra de navegación inferior, la subnavegación superior, la barra de búsqueda, ajustes y la cabecera general. Solo se muestra la vista `#delegado`.
     - En la vista del delegado se muestra **TODO lo relativo al partido en vivo**: marcador con botones de sumar y restar goles a ambos equipos, registro y anulación de incidencias (goles, tarjetas, lesiones, penaltis), cronómetro con avance de fases, pizarra táctica, titulares en campo y suplentes con sus minutos jugados, sugerencia táctica de menos minutos y botones de cambios (manual 1–7, automático 1–3 y proponer reparto).
     - Si no hay partido activo o preparado, el delegado ve una pantalla limpia y amigable de espera con botón para comprobar y botón de cerrar sesión.
   - **Guardar en el Móvil y Exportación Imprimible:**
     - En iOS (Safari / PWA) y Android (Chrome / PWA), `window.print()` suele estar bloqueado o no permitir guardar el PDF fácilmente.
     - `shareOrDownloadPrintDoc` integra la Web Share API (`navigator.share`) para compartir o guardar directamente en "Archivos" de iOS / descargas de Android o enviar por WhatsApp.
     - Descarga directa de archivo `.html` auto-contenido para visualización o impresión sin conexión.
     - En dispositivos móviles, la vista previa no se destruye automáticamente si el usuario cancela AirPrint, permitiéndole elegir "Guardar / Compartir".

15. **Entrega v50 (24/09/2026) — Corrección Crítica Partido Inter Pilar (ReferenceError) y Exportación PDF Real (.pdf) en Móvil:**
   - **Corrección Crítica Partido Inter Pilar y Restauración Automática en Vivo:**
     - **Causa raíz del partido "desaparecido":** El partido contra El Pilar (Alevín Inter/Pilar, 24/09/2026) y su preparación nunca fueron borrados. En el commit `9f8f6559`, al refactorizar el botón `unlockBtn` en `js/app.js`, se omitió accidentalmente `const fieldIds = state.timer.onField;`. Al intentar evaluar `${fieldBenchMarkup(fieldIds, callup, config)}`, JavaScript lanzaba un `ReferenceError: fieldIds is not defined`. Este error abortaba la ejecución completa de `renderLive()`, dejando la vista en blanco y bloqueando el acceso al partido y al botón de delegado.
     - **Solución implementada:**
       - Restaurado `const fieldIds = state.timer.onField || [];` en `renderLive()` de `js/app.js`.
       - Se implementó la auto-restauración de preparaciones: si `!state.timer`, busca automáticamente la preparación del próximo partido no finalizado (`state.preparaciones?.find(...)`) y ejecuta `applyPreparacionToLive(savedPrep)`. Garantiza que el partido preparado de Inter Pilar esté siempre cargado y visible en vivo con su alineación, pizarra, cronómetro y botón de delegado.
   - **Exportación a PDF Real Binario (`.pdf`) en Móvil (WhatsApp y Archivos de iOS):**
     - **Problema previo:** El botón de compartir enviaba un documento `.html`. Ni WhatsApp ni la app Archivos de iOS lo reconocían como documento PDF imprimible o almacenable.
     - **Solución local-first (0 dependencias externas / 100% offline):**
       - Integradas localmente en `vendor/` las librerías `vendor/html2canvas.min.js` y `vendor/jspdf.umd.min.js`, cacheadas por el Service Worker.
       - En `js/print-session-export.js`, implementadas `ensurePdfLibraries()` y `generatePdfBlob()`: renderizan la hoja con `html2canvas` (escala 2, nitidez Retina) y la ensamblan en un documento A4 real vía `jsPDF`.
       - En `shareOrDownloadPrintDoc()`: genera un Blob `application/pdf` binario y lo comparte con `navigator.share({ files: [new File([pdfBlob], `${cleanTitle}.pdf`, { type: 'application/pdf' })] })`. En iOS y Android, abre el menú nativo con icono de PDF para compartir directamente por WhatsApp o «Guardar en Archivos». Como fallback, descarga directa de `.pdf`.
   - **Contención Visual de Diagramas y Barra Flotante Compacta en Móviles:**
     - En `styles-redesign.css`: los diagramas de campo (`.cb-print-field-img` y `.cb-print-stage-box`) se acotan estrictamente a `max-height: 230px !important; object-fit: contain !important; margin: 0 auto; display: block;` evitando que se desborden de la pantalla.
     - La barra flotante táctil superior en móviles (`max-width: 650px`) se redujo a una rejilla compacta de ~80px de alto (ocupa menos del 15% de la pantalla en lugar del 50%), manteniendo visibles los botones con indicador de progreso (`⏳ Generando PDF...`) y botón `✕ Volver`.
   - **Cache Versioning y Calidad:**
     - Versión actualizada a `20260924-v50-inter-pilar-live-mobile-pdf-export`.
     - 525/525 tests unitarios y de integración pasando al 100% (`npm test`).

16. **Entrega v51 (24/09/2026) — Aislamiento Total Delegado (PIN 0000), Minutos Objetivo Visibles, Nombres Cortos con Primer Apellido y Exportación PDF Móvil Sin Bloqueos:**
    - **Aislamiento Total del Delegado (PIN 0000):**
      - Acceso directo a la vista exclusiva `#delegado`: Al validar el PIN 0000 o PIN de delegado, la interfaz aplica `body.delegate-mode`. Se ocultan con `!important` el menú inferior (`#cb-bottom-nav`), submenús, selector de temas, buscador global, ajustes y Modo Campo (`#open-field-mode`, `#return-to-field-mode`, `[id*="field-mode"]`).
      - Blindaje de navegación en `showView()`: Se restringe el cambio de pestaña impidiendo que el delegado salga de su vista de control de partido en vivo.
      - Sincronización en segundo plano al login: Al ingresar con PIN 0000, `submitAuth()` lanza inmediatamente `synchronizeCloud()` y `refresh(true)` para traer el partido preparado más reciente desde Supabase.
    - **Corrección en Nombres Cortos (`nombreCorto`):**
      - **Problema previo:** En nombres españoles con dos apellidos (ej. "Alejandro Pedrós González"), la función extraía la inicial del último apellido generando "Alejandro G." en lugar del primer apellido.
      - **Solución implementada:** En `js/live-tactics.js`, `nombreCorto()` extrae el primer apellido respetando nombres compuestos frecuentes (`Juan Carlos P.`, `Miguel Ángel P.`, `Alejandro P.`), verificando nombres como "Alejandro Pedros Gonzalez" -> "Alejandro P.".
    - **Minutos Objetivo Visibles en Vivo (`Obj: X min`):**
      - Cada fila de jugador en campo y banquillo (tanto para Migue como para el delegado) muestra una píldora visual verde con el tiempo objetivo asignado (`Obj: 40 min`) junto a su cronómetro acumulado en tiempo real.
      - Se añadió la tarjeta superior moderna `.live-target-card` con chips individuales por jugador para una lectura rápida y clara del reparto de minutos del partido.
    - **Preservación Fiel de la Alineación Preparada por Migue:**
      - **Causa raíz:** `syncLiveTacticFromTimer()` y `ensureLiveTactic()` aplicaban `applyLineupToLiveTeam()`, que reordenaba arbitrariamente los jugadores por orden de lista, ignorando las posiciones tácticas exactas guardadas en `prep.team`.
      - **Solución:** En fase `ready`, si existe `prep.team`, tanto `applyPreparacionToLive` como `syncLiveTacticFromTimer` y `ensureLiveTactic` clonan fielmente las posiciones tácticas (`x`, `y`, `pos`) elegidas por Migue.
    - **Visibilidad Inmediata del Partido al pulsar «Mostrar al Delegado»:**
      - `togglePrepDelegateForMatch(matchId)` aplica de inmediato la preparación al motor en vivo (`state.timer`) si estaba vacía o en otro partido, desbloqueando `state.timer.delegateUnlocked = true`.
      - `renderDelegate()` auto-detecta preparaciones marcadas con `delegateShown` y las monta instantáneamente sin esperas.
    - **Exportación PDF Móvil Sin Bloqueo de Safari/iOS WebKit:**
      - **Problema previo:** En iPhone / Safari PWA standalone, invocar `window.print()` congelaba el hilo principal de WebKit dejando la app inutilizable. Además, la barra flotante quedaba oculta bajo el notch/dynamic island.
      - **Solución:**
        - En `styles-redesign.css`, `.cb-print-floating-bar` incluye `padding-top: max(16px, env(safe-area-inset-top, 24px)) !important;` y oculta el botón de imprimir (`.cb-print-btn-print`) en móviles (`max-width: 650px`).
        - En `js/print-session-export.js`, en móviles y PWA standalone no se invoca `window.print()`, redirigiendo cualquier acción a `shareOrDownloadPrintDoc()`, que genera el PDF real mediante `html2canvas` + `jsPDF` y abre el menú nativo de compartir (`navigator.share`) para WhatsApp o Archivos sin ningún bloqueo.
    - **Cache Versioning y Calidad:**
      - Versión actualizada a `20260924-v51-delegate-live-realtime-pdf-mobile`.
      - 525+ tests unitarios y de integración pasando al 100% (`npm test`).
      - Verificación de sintaxis de todos los módulos limpia (`npm run check`).

17. **Entrega v52–v55 (24/09/2026) — Gestión de Permisos Granulares del Delegado, Invitación WhatsApp y Privacidad del PIN:**
    - **Gestión de Permisos Granulares en Ajustes (`#delegate-account-panel`):**
      - El entrenador puede seleccionar qué secciones puede ver el delegado: Partido en vivo (`partido`), Plantilla (`plantilla`), Modo Campo (`modo-campo`), Convocatorias (`convocatorias`), Asistencia (`asistencia`), Calendario (`calendario`), Cuerpo Técnico (`cuerpo-tecnico`), Preparación y alineación previa (`preparacion`), Sesiones de entrenamiento (`sesiones`), Ejercicios tácticos (`ejercicios`), Pizarra táctica (`tacticas`), Resumen del día (`hoy`).
      - Al entrar por primera vez o al editar, si el delegado ya tiene cuenta o ya está invitado, el botón conmuta a **«Guardar permisos del delegado»** (`#save-delegate-account-btn`), permitiendo a Migue modificar los permisos cuantas veces quiera y guardarlos en el acto.
      - Botón **«Compartir acceso por WhatsApp»** que genera un texto listo para enviar con el enlace directo, el PIN del delegado y la lista detallada con viñetas de las funciones que tiene activadas.
    - **Privacidad y Seguridad del PIN de Migue:**
      - Se eliminó del formulario de autenticación (`#auth-form`) el texto donde se indicaban los PINs predeterminados o de demo para evitar que cualquier persona que mire la pantalla conozca los accesos. El texto queda limpio: *"Introduce tu PIN de acceso"*.
    - **Limpieza de Inyecciones de Navegación Huérfanas:**
      - Erradicada la inyección de botones huérfanos o duplicados (`#cb-nav-tab-convocatorias` y `#cb-nav-tab-modo-campo`) en la barra inferior (`#cb-bottom-nav`), asegurando que solo existan los 5 módulos canónicos y que la subnavegación (`#cb-sub-nav`) controle las subvistas.

18. **Entrega v56–v58 (24/09/2026) — Persistencia Robusta de Permisos en Supabase / IndexedDB y Navegación Dinámica Sin Redirecciones Forzadas:**
    - **Causa raíz de la reversión de permisos:**
      - Al guardar permisos localmente, `mergeCloudRecord` en `js/sync-core.js` comparaba marcas de tiempo. Si la nube tenía un registro anterior sin fecha o con timestamp desfasado, la sincronización en segundo plano sobreescribía los cambios locales de Migue con los datos antiguos de Supabase.
    - **Solución implementada:**
      - Se actualizó `saveDelegateAccountSettings` y `persistDelegatePermissions` para fijar `updatedAt: Date.now()`, guardando simultáneamente en `state.settings`, IndexedDB (`put('settings')`), `localStorage` y ejecutando la llamada RPC `set_delegate_permissions`.
      - `mergeCloudRecord` respeta siempre la mutación local más reciente si su `updatedAt` es posterior al de la nube.
    - **Navegación Dinámica en `js/redesign-nav.js`:**
      - Se eliminaron las redirecciones forzadas a `delegado` o `plantilla` cuando el usuario pulsa un módulo; ahora se evalúan dinámicamente las subvistas permitidas para ese módulo según los permisos del delegado.

19. **Entrega v59 (24/09/2026) — Corrección Crítica Pestañas Vacías del Delegado (CSS Specificity + View Renderers) y Unificación de Repositorios:**
    - **Causa raíz de «Pestañas Vacías en Vista Delegado»:**
      1. **Conflicto de especificidad CSS (`styles.css` vs `styles-redesign.css`):**
         - En `styles.css`: `.delegate-mode .view:not(#delegado) { display: none !important; }`. La presencia del ID `#delegado` dentro del pseudo-selector `:not()` otorgaba una especificidad `(1, 1, 0)`.
         - En `styles-redesign.css`: La regla genérica de multi-vista para vistas activas era `.delegate-mode.delegate-multi-view .view.active`, con especificidad `(0, 4, 1)`. Al no contener un ID, `(1, 1, 0) > (0, 4, 1)`, por lo que el navegador forzaba `display: none !important;` en cualquier vista activa que no fuera `#delegado`, `#plantilla` o `#convocatorias` (las únicas que tenían ID explícito). En consecuencia, Asistencia, Calendario, Cuerpo Técnico, Preparación, Sesiones, Ejercicios, Tácticas y Hoy quedaban completamente invisibles (pantalla en blanco).
      2. **Omisión de llamadas a renderizado en `showView(viewId)` (`js/app.js`):**
         - Al navegar a `calendario`, `cuerpo-tecnico`, `preparacion` o `hoy`, `showView` no llamaba a `renderMatches()`, `refreshStaffView()`, `renderPreparaciones()` ni `renderTodayDashboard()`.
    - **Solución implementada:**
      - En `styles.css`: se acotó la regla a `.delegate-mode:not(.delegate-multi-view) .view:not(#delegado){display:none!important}`.
      - En `styles-redesign.css`: se añadieron reglas explícitas con ID para cada una de las 12 vistas (`#hoy.view.active`, `#plantilla.view.active`, `#cuerpo-tecnico.view.active`, `#convocatorias.view.active`, `#partido.view.active`, `#delegado.view.active`, `#preparacion.view.active`, `#calendario.view.active`, `#asistencia.view.active`, `#ejercicios.view.active`, `#sesiones.view.active`, `#tacticas.view.active`), garantizando máxima especificidad `(1, 4, 1)` para que la vista activa siempre sea visible.
      - En `js/app.js` (`showView`) y `js/redesign-nav.js` (`triggerStandardView`): se añadieron las llamadas a los renderers respectivos de cada vista y se exportó `renderPreparaciones` en `window.__campobase`.
      - Nueva suite `tests/delegate-all-views-render-visible.test.js` que verifica que ninguna vista del delegado quede oculta por CSS y que todas invoquen su renderer.
    - **Saneamiento y Unificación del Repositorio:**
      - Se diagnosticó el error `fatal: bad object refs/heads/main 2` en el repositorio del Escritorio (`/Users/miguelperez/Desktop/HERMES/PrograMARIO/01_PROYECTOS/campobase`) debido a un archivo duplicado por macOS dentro de `.git/refs/heads/`.
      - Se eliminó la referencia corrupta y se sincronizó el repositorio del Escritorio con `origin/main`.
      - Integrada la lógica de **Fase 1** (`js/reparto-plan.js`, `tests/reparto-plan.test.js`, `preview-fase1.html`, `INSTRUCCIONES.md`).
      - **573 tests en verde (100%)** y `npm run check` limpio en ambos workspaces.


## Claude — Shell + Hoy real, pendiente de validación visual

Rama `implement/claude-hoy-real` creada desde origin/main `e9dfac33`. Se descarta el experimento Sites/local como base. El controlador y los renderizadores de CampoBase permanecen; los nuevos estilos están en css/campobase-diseno.css (fuente Claude), claude-shell.css y claude-hoy.css. Datos, Auth y tablas Supabase sin sustitución. No seguir con Equipo sin validación de Miguel.

La URL /campobase-preview/ en GitHub Pages activa preview-readonly.js: se preservan las lecturas y el acceso existente, se bloquean mutaciones remotas y las funciones de escritura de db.js. La reconciliación usa el adaptador y almacenes existentes sin enviar ni añadir syncQueue; no hay stores alternativos. No registrar otro service worker de preview ni borrar cachés globales. El alojamiento solo publica la rama real; no almacena exportaciones de datos. Producción fuera de ese path conserva su flujo.

Validación acotada: tests de Hoy, Liga, fechas, repintado de sesiones y barrera de red; capturas 390×844 y 1440×960 con lecturas reales en perfil temporal, nunca exportadas al repositorio. Ajustes personales de fuente/tamaño siguen vigentes, por lo que las capturas pueden diferir tipográficamente del ejemplo de Claude.

### 20. Entrega v60 (01/10/2026) — Validaciones Tácticas F7, Dossier A4 Claude, Corrección de Flechas y Sincronización Vista Previa = Impresión

1. **Pizarra Táctica Única Interactiva y Sistemas F7 del Manual:**
   - Se unificó la pizarra táctica para que sea una sola pizarra dinámica en `js/tactics.js` y `js/tactic-board-controller.js`. Al cambiar el sistema de juego (1-3-2-1, 1-2-3-1, 1-2-2-2, 1-3-1-2, 1-1-3-2, 1-3-3, 1-4-1-1, 1-2-1-3, 1-1-3-1-1, 1-1-4-1, 1-2-2-1-1) o la fase (con balón, sin balón, basculación, pérdida), las fichas y flechas se actualizan en la misma pizarra sin generar pizarras duplicadas.
   - **Toggle Rival en todas las pizarras:** El rival se oculta por defecto (`showOpponent = false`) y el entrenador dispone del botón conmutable `«Mostrar rival / Ocultar rival»` tanto en la pestaña Tácticas como en Preparar Partido y Partido en Vivo.
   - Normalización de proporciones de campo `100x100` en todas las pantallas.

2. **Catálogo de 1060 Ejercicios con Filtrado Multidimensional F7:**
   - Integración completa de los ejercicios del catálogo con normalización de taxonomía F7.
   - La función `matchesDimension` evalúa tanto categorías como contenidos, objetivos y descripciones, permitiendo filtrar fielmente por cualquier dimensión metodológica de Fútbol 7.

3. **Corrección Definitiva de Flechas Tácticas y Leyenda Autocontenida (Eliminación de bultos y desbordamientos):**
   - **Causa raíz de la deformación colosal en la leyenda (`media_1790844885292.png`):**
     - En `styles.css:18`, la regla `.tactic-board svg { display: block; width: 100%; aspect-ratio: 1; }` aplicaba a **todos** los elementos `<svg>` contenidos dentro de `<figure class="tactic-board">`.
     - Al estar la leyenda `<p class="board-legend">` dentro de `<figure class="tactic-board">`, cada icono de flecha recibía `width: 100%`, expandiéndose a más de 400px de ancho y creando flechas monstruosas.
   - **Solución implementada («Otra Forma» radical y autocontenida):**
     - En `js/tactics.js`: Se desacopló la leyenda de los markers SVG con la nueva función `renderLegendArrow(kind)`. Esta función renderiza un SVG puro de `28×14px` con punta directa `<polygon points="18,3.5 26,7 18,10.5" fill="...">`, sin `<marker>`, sin `<defs>`, con estilos inline `!important` inmutables y colores canónicos (`#2563eb` Pase, `#4b5563` Movimiento, `#8b5cf6` Conducción, `#dc2626` Disparo, `#f59e0b` Sprint).
     - En `styles.css`: Se restringió la regla al SVG del campo táctico exclusivamente con `.tactic-board > svg:first-child`, y se añadieron selectores estrictos para `.board-legend svg` y `svg.tactic-legend-arrow` fijando `width: 28px !important; height: 14px !important;`.
     - En `css/claude-entreno.css`: Se reforzaron las reglas de la leyenda con máxima especificidad.
     - En `tests/tactics.test.js`: Se blindó la renderización verificando la clase `tactic-legend-arrow`, el polígono directo y las dimensiones exactas.

4. **Sincronización Exacta entre Vista Previa en Pantalla e Impresión A4:**
   - **Causa anterior:** Los estilos de la hoja (`.cb-print-columns-grid`, `.cb-print-col`, `.cb-print-card`, `.cbx-print-step-item`, etc.) estaban encerrados exclusivamente dentro de `@media print` en `styles-redesign.css`. Al abrir la vista previa en pantalla dentro de CampoBase (`#cb-print-root`), el navegador no aplicaba el grid y el contenido se colapsaba en una sola columna vertical continua con textos desproporcionados.
   - **Solución implementada:**
     - En `css/claude-entreno.css`: Se definieron todas las reglas de la hoja `.cb-print-sheet` tanto para pantalla como para impresión. En pantalla se muestra como una hoja física A4 blanca de `794px × 1123px` centrada con sombra, con la maquetación a 2 columnas (`display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 12px;`), tarjetas de métricas, diagrama de campo con leyenda y sección de notas pautadas exactamente idéntica al PDF final.
     - **Dossier de Sesión A4:** La portada de sesión (`.cbx-print-cover-page`) con tarjetas de objetivo/material, barra temporal de fases, lista de tareas, checklist de asistencia y notas, seguida de una hoja A4 individual para cada ejercicio de la sesión.

5. **Corrección del Botón de Impresión y Apertura Fiable (`window.print()`):**
   - **Causa anterior:** `isMobileDevice()` clasificaba erróneamente cualquier pantalla con `window.innerHeight <= 900` como móvil. En ordenadores portátiles (MacBook Air / Pro) donde el alto de ventana suele ser de 700–850px, la app bloqueaba `window.print()` y ejecutaba un fallback de exportación que no abría el diálogo del navegador.
   - **Solución:** Se corrigió `isMobileDevice()` para detectar únicamente dispositivos táctiles móviles reales (teléfonos iOS/Android). Al pulsar `«🖨️ Imprimir / Guardar PDF»`, se ejecuta `window.print()` directamente sin bloqueos.
   - Se independizó el botón `«📄 Abrir Ficha A4»` con fondo azul `#2563eb` y texto blanco nítido, eliminando el conflicto de clases `.primary` con colores personalizados.
   - Se desvinculó el cierre prematuro en `afterprint`: cerrar o cancelar el diálogo de impresión del navegador mantiene la vista previa en pantalla, permitiendo al usuario revisarla y pulsar `✕ Salir` o presionar la tecla `Escape` cuando desee salir.

6. **Adopción Metodológica de Spec-Driven Development (SDD):**
   - Implementación de la jerarquía de especificaciones solicitada por el usuario:
     - `docs/constitution.md`: Principios fundacionales inmutables (Local-First IndexedDB, 0 € coste de almacenamiento, cero dependencias runtime pesadas, 100% tests en verde, diseño Claude A4 intacto).
     - `specs/001-tacticas-leyenda-impresion-a4/`:
       - `spec.md`: Especificación formal de requisitos funcionales y criterios de aceptación.
       - `plan.md`: Plan de arquitectura técnica, aislamiento y control de regresión.
       - `tasks.md`: Desglose atómico de tareas con trazabilidad y verificación.
      - `specs/002-partido-en-vivo-pizarra-preparacion/`:
        - `spec.md`: Unificación de pizarra única en Partido en Vivo y Preparación, conmutador de rival por defecto oculto y blindaje de leyenda.
        - `plan.md`: Arquitectura técnica de actualización sobre el mismo SVG y persistencia en IndexedDB.
        - `tasks.md`: Verificación de tareas y paso de tests al 100%.
      - `specs/003-catalogo-tarjetas-filtros-ejercicios-f7/`:
        - `spec.md`: Tarjeta en rejilla Claude con acciones rápidas, filtros multidimensionales F7 y biblioteca local-first.
        - `plan.md`: Diseño de componentes de tarjeta, delegación de eventos e integración con el planificador de sesiones.
        - `tasks.md`: Verificación de tareas y paso de tests al 100%.

### 21. Entrega v61 (01/10/2026) — Desbloqueo y Flujo Integral de Preparar Partido (Spec 004)

1. **Desbloqueo Total de la Interfaz en Preparación (`#preparacion`):**
   - **Diagnóstico de la Causa Raíz:** En `js/app.js`, la función `openPreparacionEditor(matchId)` contenía la condición invertida `if (!document.body.classList.contains('cb-redesign-active')) $('#preparacion-list').classList.add('hidden');`. Bajo el modo rediseño Claude (`cb-redesign-active`), la lista de partidos `#preparacion-list` nunca recibía la clase `hidden`, manteniéndose en el DOM con `display: grid` y empujando el editor `#preparacion-editor` varios cientos de píxeles por debajo del fold visible. Parecía que el botón "Preparar" no hacía nada.
   - **Solución Implementada:**
     - `openPreparacionEditor` ahora oculta incondicionalmente `#preparacion-list` (`$('#preparacion-list').classList.add('hidden')`), muestra `#preparacion-editor` (`$('#preparacion-editor').classList.remove('hidden')`), añade la clase `.is-editing` al contenedor `#preparacion` y ejecuta `window.scrollTo({ top: 0, behavior: 'instant' })`.
     - En `css/claude-partido.css` se agregaron reglas de alta especificidad con `!important` para que `#preparacion-list` quede oculto bajo cualquier circunstancia cuando el editor esté activo (`body.cb-redesign-active #preparacion #preparacion-list.hidden`, `body.cb-redesign-active #preparacion.is-editing #preparacion-list`, y el selector de árbol `:has(#preparacion-editor:not(.hidden)) #preparacion-list`).

2. **Acceso Inmediato a Preparar sin Fricción de Convocatoria Previa:**
   - Anteriormente, los partidos sin convocatoria manual solo ofrecían `[Convocar y preparar]`, lo cual expulsaba al entrenador fuera de la pestaña hacia el módulo Convocatorias.
   - Se añadió el botón directo `[Preparar partido]` en las tarjetas de partidos sin convocatoria en `renderPreparaciones()`.
   - Se implementó la función `ensureCallupForMatch(match)`: si el partido no dispone de convocatoria en IndexedDB, la crea automáticamente con todos los jugadores disponibles de la plantilla activa y continúa directamente a la apertura del editor táctico en milisegundos.

3. **Auto-población Inteligente del 7 Inicial (`prepBuildTeam`):**
   - Anteriormente, al abrir un partido nuevo sin preparación previa, los 6 puestos de campo quedaban vacíos (`playerId: ''`), obligando al usuario a desplegar 6 selects o imposibilitando guardar la alineación.
   - `prepBuildTeam(formation, keeperId)` ahora auto-asigna de forma inteligente al portero y a los 6 jugadores de campo según compatibilidad posicional y disponibilidad, entregando una pizarra táctica lista para usar, modificar o guardar de inmediato.

4. **Navegación Fluida, Botones de Retorno y Cierre de Popups:**
   - Se añadió el botón `[← Volver a partidos]` (`#prep-back-head`) en la cabecera superior de `#preparacion-editor`, además del botón `#prep-back` en las acciones inferiores.
   - Ambos botones invocan `closeEditor()`, que retira `.is-editing`, repinta la lista de partidos con los estados actualizados (`✓ Preparado` / `Sin preparar`) y hace scroll suave al inicio.
   - Se blindó el popup táctico flotante `#prep-popup` con eventos de cierre seguro mediante clic exterior y tecla `Escape`.
   - Se añadió un botón directo `[Ir a Preparación de partido]` en el estado vacío de Partido en vivo (`#partido`) y botones `[Preparar]` directos en el Calendario.

5. **Especificación SDD y Tests:**
   - Carpeta de especificación formal `specs/004-preparar-partido-flujo-y-editor/` (`spec.md`, `plan.md`, `tasks.md`).
   - Suite de tests en `tests/preparacion-flujo.test.js` verificando la eliminación de la condición limitante, auto-creación de convocatoria, auto-asignación de 7 jugadores, presencia de botones de retorno y exportación de API.
   - Batería de 610 tests pasando al 100% y `npm run check` verificado sin errores.

### 22. Entrega v62 (01/10/2026) — Ampliación de Pizarra Táctica de Cambios y Corrección de Desplegables de Nombres (Spec 005)

1. **Ampliación de la Pizarra Táctica en el Plan de Cambios (`#prep-board`):**
   - **Diagnóstico:** En la vista de preparación (`#preparacion`), la cuadrícula `.cbx-prep-editor-layout` reservaba `1.15fr` a los controles y solo `0.95fr` al campo, imponiendo además un tope rígido de `max-width: 420px;` en `.board-wrap` y `max-width: 440px;` en `#prep-board`. En pantallas de escritorio y portátiles, la pizarra se apreciaba diminuta respecto al espacio disponible.
   - **Solución Implementada:**
     - En `css/claude-partido.css`, la cuadrícula se reestructuró a `grid-template-columns: minmax(300px, 360px) minmax(0, 1fr); gap: 24px;`, dando prioridad y protagonismo completo a la pizarra táctica.
     - `.board-wrap` y `#prep-board` se ampliaron a `max-width: 640px;` con `padding: 12px` y `border-radius: 20px;`, ganando más de un 120% en superficie visual y permitiendo que fichas, dorsales y nombres tácticos se lean con máxima claridad.
     - En `Partido en vivo` (`#partido`), se amplió asimismo `.board-wrap` a `max-width: 600px;`.
     - **Botón de Ampliación de Pizarra (`#prep-full-btn`):** Se añadió el botón `⛶ Ampliar pizarra` en la barra táctica de preparación. Al pulsarlo, abre `#prep-lightbox` con el visor de alta resolución `#prep-board-full` a escala completa (`min(92vw, calc(100dvh - 10rem))`).

2. **Corrección de Nombres Cortados en Desplegables de Cambios y Puestos:**
   - **Ajuste de Puestos (`#prep-slots`):** Anteriormente en `.cbx-prep-slots-details .live-tactics-slots` se empleaba `grid-template-columns: repeat(2, minmax(0, 1fr))`, lo que dejaba apenas ~180px por selector y provocaba que nombres con suplencia (`12 Alejandro Pedrós (Suplente)`) aparecieran cortados. Se transformó a `grid-template-columns: 1fr;` con selectores a ancho completo (>580px útiles), tipografía aumentada a `13.5px`, `font-weight: 600`, `min-height: 42px`, `text-overflow: ellipsis` y formateo `${dorsal} · ${nombre}`.
   - **Popup Táctico Flotante (`#prep-popup`):** Se amplió el ancho calculado en JavaScript de `240px` a `Math.min(340, window.innerWidth - 24)`, con `min-width: 320px !important;` y selectores cómodos de 44px de altura.
   - **Modal de Cambios de Calendario (`#calendar-substitutions-v2-dialog`):** Se amplió la ventana modal de `560px` a `min(820px, calc(100% - 2rem))` y se maquetaron las filas de sustitución (`Quién sale`, `Quién entra`, cambios de posición y observaciones) a doble columna ancha de ~360px útiles cada una con fuente de `13.5px`, garantizando que todos los nombres y dorsales quepan completos.

3. **Especificación SDD 005 y Tests Automatizados:**
   - Carpeta formal en `specs/005-pizarra-cambios-tamano-desplegables/` (`spec.md`, `plan.md`, `tasks.md`).
   - Suite de pruebas en `tests/cambios-pizarra-desplegables.test.js` verificando el límite de 640px en la pizarra, maquetación a 1 columna de `#prep-slots`, dimensiones de popup a 340px y modal de calendario a 820px.
   - Batería de **614/614 tests pasando al 100%** y `npm run check` totalmente limpio.

### 23. Entrega v63 (01/10/2026) — Pizarra Hero de 640px en Pantallas Estándar y Desplegables de Puestos Siempre Visibles (Spec 006)

1. **Pizarra Hero de 640px en Pantallas Portátiles y Estándar (1024px):**
   - **Diagnóstico de Causa Raíz (`media_1790858964644.png`):** En portátiles MacBook (resolución viewport 1024×886px), con la barra lateral de 220px, el ancho disponible en `#preparacion` es de ~768px. Al estar el breakpoint en `@media(max-width: 900px)`, la pantalla de 1024px activaba la maquetación de 2 columnas (`minmax(300px, 360px) minmax(0, 1fr)`). La columna de controles consumía 360px a la izquierda, forzando a la columna de la pizarra a reducirse a escasos ~330px-360px y haciendo que el campo se viese comprimido.
   - **Solución Implementada:**
     - En `css/claude-partido.css`, `.cbx-prep-editor-layout` se estableció por defecto (< 1280px) a una sola columna centrada con ancho máximo de 720px (`grid-template-columns: 1fr; max-width: 720px; margin: 0 auto;`).
     - Esto permite que `.cbx-prep-pitch .board-wrap` y `#prep-board` alcancen su tamaño hero completo de **640px × 640px** en cualquier portátil, tablet o pantalla estándar, multiplicando por más de 3.1 su superficie visual útil respecto a los 360px anteriores.
     - En pantallas ultra-anchas (`@media(min-width: 1280px)`), se activa la doble columna con `grid-template-columns: minmax(560px, 640px) minmax(360px, 1fr); max-width: 1180px;`, garantizando que la pizarra nunca descienda de 560px-640px.
     - En `js/app.js` (`arrangeClaudePrepEditor`), se antepuso la pizarra en el orden del DOM (`layout.append(pitch, controls)`), de modo que el campo táctico se presenta de inmediato como elemento estelar.

2. **Desplegables de Puestos Permanentemente Visibles («los desplegables ya no salen»):**
   - **Diagnóstico de Causa Raíz:** En la versión anterior, los 7 selectores de puesto (`#prep-slots`) se envolvieron dentro de un `<details class="cbx-prep-slots-details">` con `details.open = prepDraft.some(pos => !pos.playerId)`. Debido a que el sistema auto-asigna a los 7 titulares de inicio, `details.open` evaluaba a `false`. El acordeón aparecía cerrado por defecto (`▶ Elegir jugadores y cambiar posiciones`), ocultando totalmente los 7 desplegables de la vista del usuario.
   - **Solución Implementada:**
     - Se eliminó el elemento `<details>` plegable y su atributo `open` condicional.
     - Los desplegables se alojan en un contenedor abierto y permanente `<section class="cbx-prep-slots-details cbx-prep-slots-panel panel">` con encabezado claro (`<h4>Elegir jugadores y cambiar posiciones</h4><p>...</p>`), antepuesto en `controls` (`controls.prepend(slotsPanel)`).
     - Los 7 selectores quedan siempre desplegados, accesibles e inmediatamente visibles sin requerir clics previos.
     - Se maquetó `.live-tactics-slots` con cuadrícula adaptativa `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;`. En el contenedor de 640px forma 2 columnas holgadas de ~300px por selector, permitiendo leer dorsales y nombres completos sin solapamientos ni truncamientos, y adaptándose a 1 columna en pantallas móviles (<580px). Los suplentes se expanden a ancho completo (`grid-column: 1 / -1`).

3. **Especificación SDD 006 y Validación de Calidad:**
   - Carpeta formal en `specs/006-pizarra-hero-640px-desplegables-visibles/` (`spec.md`, `plan.md`, `tasks.md`).
   - Suite de pruebas actualizada en `tests/cambios-pizarra-desplegables.test.js` verificando el layout de 1 columna por defecto, dimensiones de 640px, ausencia de `<details>` plegables y orden `pitch` antes de `controls`.
   - **614/614 tests pasando al 100%** y `npm run check` con cero errores.





