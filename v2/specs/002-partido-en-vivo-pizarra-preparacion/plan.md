# Plan de Arquitectura: 002 - Pizarra Táctica en Partido en Vivo y Preparación

- **Identificador:** `002-partido-en-vivo-pizarra-preparacion`
- **Fecha:** 01/10/2026
- **Estado:** Implementado

---

## 1. Diseño Técnico y Arquitectura

1. **Reutilización del Lienzo Táctico:**
   - La función `renderTacticsBoardSvg(sc, target)` en `js/app.js` toma el elemento SVG existente y actualiza sus nodos internos (`tac-field`, `tac-line`, `tac-player`, `tac-opponent`, `tac-ball`) mediante coordenadas vectoriales normalizadas (0 a 100).
   - `cargarFormacion` en `js/live-tactics.js` recalcula los puestos y conserva los jugadores asignados cuando la formación cambia.

2. **Control de Visibilidad del Rival:**
   - Se mantiene la variable en módulo `liveTacticsShowOpponent = false` en `js/app.js`.
   - Cuando es `false`, el bucle de renderizado omite la inclusión de las piezas `.tac-opponent`.
   - Cuando es `true`, inyecta los oponentes posicionados en el campo rival con dorsales nítidos.

3. **Compatibilidad con Rediseño Claude:**
   - `arrangeClaudeLiveBoard(sc)` inserta los chips horizontales de formación (`.cbx-live-formation-chips`) y el botón conmutable `#live-rival-toggle-btn`.
   - Se agrupan las herramientas avanzadas y asignaciones bajo un `<details class="cbx-live-board-options">` colapsable para maximizar el área visible del campo en pantallas de entrenadores.

---

## 2. Archivos Afectados

- `js/app.js`: Lógica de renderizado dinámico de la pizarra en vivo y preparación (`renderTacticsBoardSvg`, `arrangeClaudeLiveBoard`, `renderPrepBoard`).
- `js/live-tactics.js`: Dominio táctico en vivo (`cargarFormacion`, `LIVE_FORMATIONS`, `asignarJugador`).
- `css/claude-entreno.css`: Estilos visuales de la barra de chips, botones de rival y pizarra en vivo.
- `styles.css`: Estilos estructurales base.
- `tests/live-tactics.test.js`: Pruebas de dominio táctico en vivo.

---

## 3. Verificación

- Verificación de la suite de 603 tests con `npm test`.
- Verificación sintáctica con `npm run check`.
