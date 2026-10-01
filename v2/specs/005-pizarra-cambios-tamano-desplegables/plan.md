# Plan de Arquitectura Técnica: 005 - Ampliación de Pizarra Táctica de Cambios y Corrección de Desplegables de Nombres

- **Identificador:** `005-pizarra-cambios-tamano-desplegables`
- **Estado:** Completado
- **Módulos Afectados:** `css/claude-partido.css`, `js/app.js`, `js/calendar-substitutions-v2.js`, `tests/cambios-pizarra-desplegables.test.js`

---

## 1. Análisis de Impacto y Diagnóstico

1. **Restricción de Tamaño de Pizarra en Preparación:**
   - En `css/claude-partido.css:109`: `grid-template-columns: minmax(0,1.15fr) minmax(0,.95fr);`.
   - En `css/claude-partido.css:133`: `.board-wrap { max-width: 420px; }`.
   - En `css/claude-partido.css:134`: `#prep-board { max-width: 440px; }`.
   - **Solución:** Invertir la proporción hacia `minmax(300px, 360px) minmax(0, 1fr)` y permitir que `.board-wrap` y `#prep-board` crezcan hasta `640px`.
2. **Corte de Nombres en Desplegables de Puestos:**
   - En `css/claude-partido.css:141`: `.cbx-prep-slots-details .live-tactics-slots { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); }`.
   - **Solución:** Cambiar a `grid-template-columns: 1fr;` para dotar a cada `<select>` del ancho íntegro del panel (>580px).
3. **Popup Táctico de Asignación Rápida Estrecho:**
   - En `js/app.js:4105`: `const w = 240, h = 120;`.
   - **Solución:** Calcular `const w = Math.min(340, window.innerWidth - 24);` y añadir estilos CSS específicos con `min-width: 320px;`.
4. **Desplegables en Diálogo de Calendario:**
   - En `styles.css:3`: `dialog { width: min(560px, calc(100% - 2rem)); }`.
   - **Solución:** En `css/claude-partido.css`, asignar a `#calendar-substitutions-v2-dialog` un ancho de `min(820px, calc(100% - 2rem))` con `.form-row` equilibrado y tipografía `13.5px`.

---

## 2. Plan de Pruebas y Validación

1. Test unitario en `tests/cambios-pizarra-desplegables.test.js`:
   - Validar que `css/claude-partido.css` define `max-width: 640px` para la pizarra de preparación.
   - Validar que `.cbx-prep-slots-details .live-tactics-slots` usa `grid-template-columns: 1fr`.
   - Validar que `#calendar-substitutions-v2-dialog` tiene anchura de al menos `800px`.
   - Validar que `prepOpenPopup` calcula un ancho de al menos `340px`.
2. Verificación de linter con `npm run check`.
3. Verificación de toda la suite con `npm test`.
