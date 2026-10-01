# Especificación: 004 - Desbloqueo y Flujo Integral de Preparar Partido

- **Identificador:** `004-preparar-partido-flujo-y-editor`
- **Estado:** Completado
- **Fecha:** 01/10/2026
- **Módulo:** Preparación de partido (`#preparacion`) y Partido en vivo (`#partido`)

---

## 1. Contexto y Objetivos

- **Objetivo:** Resolver de forma definitiva el bloqueo reportado por el usuario: *"preparar partido no me permite hacerlo"*. Garantizar que cualquier entrenador pueda acceder a la preparación de un partido, visualizar el editor táctico de inmediato en pantalla completa (ocultando limpiamente la lista de tarjetas), configurar la alineación de 7 jugadores (con auto-asignación inteligente de titulares), guardar la preparación y volver sin fricción ni callejones sin salida.
- **Alcance Funcional:**
  1. **Apertura Garantizada del Editor (`openPreparacionEditor`):**
     - Ocultación incondicional de la lista de partidos (`#preparacion-list.hidden`).
     - Visibilidad prioritaria del panel `#preparacion-editor` con scroll al inicio de la vista.
     - Blindaje CSS para que `#preparacion-list` quede oculto al abrir el editor bajo cualquier modo de diseño (`body.cb-redesign-active`).
  2. **Acceso Directo a Preparación sin Barreras de Convocatoria Previa:**
     - En partidos que aún no tienen convocatoria manual previa, ofrecer el botón directo `[Preparar partido]` junto a `[Convocar y preparar]`.
     - Si el usuario pulsa `[Preparar partido]`, el sistema genera automáticamente una convocatoria base con los jugadores disponibles de la plantilla (`ensureCallupForMatch`) y abre el editor táctico en el acto.
  3. **Auto-población Inteligente del 7 Inicial:**
     - Si el partido no tiene preparación guardada previa, el editor asigna automáticamente al portero y a los 6 jugadores de campo según sus posiciones preferidas y disponibilidad, evitando pizarras con 6 puestos vacíos que bloqueen el guardado.
  4. **Navegación Fluida y Botón de Retorno:**
     - Botón `[← Volver a partidos]` tanto en la cabecera superior del editor como en la botonera de acciones inferior.
     - Retorno limpio que oculta el editor, muestra la lista de partidos y actualiza los estados (`Preparado` / `Sin preparar`).
  5. **Cierre de Popup Táctico:**
     - El selector flotante `#prep-popup` de asignación rápida se cierra automáticamente al pulsar fuera o al seleccionar un jugador.
  6. **Conexión con Partido en Vivo:**
     - Si la pestaña de Partido en vivo no tiene partidos convocados, ofrece botón directo `[Ir a Preparación de partido]`.

---

## 2. Requisitos Funcionales

- **RF-1 (Ocultación Estricta de la Lista de Partidos):** Al invocar `openPreparacionEditor(matchId)`, el elemento `#preparacion-list` recibe incondicionalmente la clase `hidden`, y CSS garantiza `display: none !important`.
- **RF-2 (Botón Preparar en Todos los Partidos Pendientes):** Todo partido no finalizado en `#preparacion` debe permitir pulsar `[Preparar]`. Si no tiene convocatoria, `ensureCallupForMatch(match)` la crea en IndexedDB con la plantilla activa y abre el editor sin obligar a cambiar de pestaña.
- **RF-3 (Alineación Inicial Completa):** Al abrir por primera vez la preparación de un partido, los 7 puestos tácticos (portero + 6 de campo) quedan poblados con convocados válidos para que el entrenador pueda pulsar `[Guardar preparación]` directamente o intercambiar puestos arrastrando o usando el selector.
- **RF-4 (Cabecera del Editor con Botón Volver):** La cabecera `#preparacion-editor > .section-head` conserva siempre su botón `[← Volver a partidos]`.
- **RF-5 (Descarte de Popup Flotante):** Hacer clic fuera del popup `#prep-popup` o pulsar Escape lo cierra de inmediato sin alterar la alineación.

---

## 3. Criterios de Aceptación

1. En la pestaña `#preparacion`, pulsar `[Preparar]` en cualquier partido abre inmediatamente el editor `#preparacion-editor` ocupando la pantalla y ocultando por completo las tarjetas de partidos.
2. Si un partido no tenía convocatoria previa, pulsar `[Preparar]` no redirige a Convocatorias: crea la convocatoria base y abre el editor de alineación directamente con los jugadores de la plantilla.
3. El editor arranca con los 7 jugadores asignados (portero en portería y 6 jugadores de campo en sus puestos).
4. El botón `[← Volver a partidos]` en la cabecera devuelve inmediatamente a la lista de partidos.
5. Al pulsar `[Guardar preparación]`, se persiste en IndexedDB, se cierra el editor, se muestra la lista con la píldora `✓ Preparado` y el plan queda listo para Partido en Vivo.
6. La suite completa de tests de Node.js pasa al 100% (603+ tests) y `npm run check` no arroja advertencias ni errores.
