# Plan de Arquitectura: 001 - Leyenda Táctica Autocontenida e Impresión Dossier A4 Claude

- **Identificador:** `001-tacticas-leyenda-impresion-a4`
- **Fecha:** 01/10/2026
- **Estado:** Implementado

---

## 1. Enfoque y Diseño Técnico

Para solventar definitivamente la deformación de las flechas de la leyenda sin riesgo de colisión con los estilos globales de la pizarra:

1. **Desacoplamiento de la Leyenda respecto a los Markers Dinámicos:**
   - La barra de herramientas táctica utiliza `renderTacticToolIcon(kind)` con markers dinámicos para sus botones de selección interactiva.
   - La leyenda descriptiva (`actionLabel`) delega en una función especializada: `renderLegendArrow(kind)`.
   - `renderLegendArrow` genera un `<svg class="tactic-legend-arrow" viewBox="0 0 28 14">` que no requiere `<defs>` ni `<marker>`:
     - Cuerpo del trazo: `<line x1="2" y1="7" x2="19" y2="7" stroke="..." stroke-width="..." stroke-dasharray="..." stroke-linecap="butt"/>`
     - Cabeza de flecha: `<polygon points="18,3.5 26,7 18,10.5" fill="..."/>`
     - Estilos inline inmutables: `display:inline-block!important; width:28px!important; height:14px!important; min-width:28px!important; max-width:28px!important; aspect-ratio:auto!important; vertical-align:middle!important;`

2. **Aislamiento en las Reglas de Estilo CSS:**
   - En `styles.css`: se reemplazó la regla universal `.tactic-board svg` por el selector hijo directo `.tactic-board > svg:first-child`, protegiendo a cualquier SVG secundario dentro de `<figure class="tactic-board">`.
   - Se crearon reglas explícitas de alta especificidad para `.board-legend svg` y `svg.tactic-legend-arrow` tanto en `styles.css` como en `css/claude-entreno.css`.

3. **Garantía del Formato de Impresión A4 Claude Validado:**
   - Preservación de `js/print-session-export.js` con soporte para hoja individual de ejercicio con grid de dos columnas (`.cb-print-columns-grid`), métricas, campo y notas pautadas.
   - Preservación de la portada de sesión (`.cbx-print-cover-page`) con checklist de asistencia, objetivos, timeline y ejercicios desglosados en páginas A4 consecutivas.
   - Ejecución directa de `window.print()` en escritorio y PWA.

---

## 2. Archivos Afectados

- `js/tactics.js`: Nueva función `renderLegendArrow(kind)` y actualización de `actionLabel(kind)`.
- `styles.css`: Corrección del selector `.tactic-board > svg:first-child` y blindaje de `.board-legend svg`.
- `css/claude-entreno.css`: Reglas de alta especificidad para `.board-legend svg, svg.tactic-legend-arrow`.
- `tests/tactics.test.js`: Verificación unitaria de `tactic-legend-arrow`, polígono y dimensiones.
- `docs/constitution.md`: Principios fundacionales SDD.
- `specs/001-tacticas-leyenda-impresion-a4/spec.md`: Requisitos y criterios de aceptación.
- `specs/001-tacticas-leyenda-impresion-a4/plan.md`: Diseño técnico y arquitectura.
- `specs/001-tacticas-leyenda-impresion-a4/tasks.md`: Plan de tareas.
- `agente.md`: Documentación de la entrega v60.

---

## 3. Estrategia de Verificación y Cero Regresiones

1. Ejecución de `node --check` en todos los archivos JS del proyecto (`npm run check`).
2. Ejecución completa de la suite de 603 tests con `node:test` (`npm test`).
3. Sincronización con el repositorio de deploy `campobase-preview-deploy` para validación en vivo.
