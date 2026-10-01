# Tareas: 001 - Leyenda Táctica Autocontenida e Impresión Dossier A4 Claude

- **Identificador:** `001-tacticas-leyenda-impresion-a4`
- **Fecha:** 01/10/2026
- **Estado:** Completado (6/6 tareas verificadas)

---

## Lista de Tareas

- [x] **TASK-01: Diagnóstico de Causa Raíz de la Deformación de la Leyenda**
  - Identificar que `.tactic-board svg` en `styles.css` alcanzaba los SVGs de la leyenda dentro de `<figure class="tactic-board">`.
  - Confirmar que los markers escalables inflaban el tamaño al 100% del contenedor.

- [x] **TASK-02: Implementar Función Autocontenida `renderLegendArrow` en `js/tactics.js`**
  - Crear `renderLegendArrow(kind)` generando un SVG fijo `28×14px` con `polygon` directo para la punta de flecha.
  - Asignar colores canónicos (`#2563eb` Pase, `#4b5563` Movimiento, `#8b5cf6` Conducción, `#dc2626` Disparo, `#f59e0b` Sprint).
  - Integrar estilos inline `!important` que impidan cualquier override externo.
  - Conectar `actionLabel(kind)` a `renderLegendArrow(kind)`.

- [x] **TASK-03: Corregir Selectores y Reglas CSS en `styles.css` y `css/claude-entreno.css`**
  - Modificar `.tactic-board svg` a `.tactic-board > svg:first-child` en `styles.css`.
  - Añadir reglas estrictas para `.board-legend svg` y `svg.tactic-legend-arrow` con dimensiones fijas de 28×14px.

- [x] **TASK-04: Blindaje y Pruebas Unitarias en `tests/tactics.test.js`**
  - Añadir aserciones que verifiquen la presencia de `class="tactic-legend-arrow"`, el polígono directo y las dimensiones de 28×14px.
  - Verificar que los 603 tests sigan pasando al 100% en verde.

- [x] **TASK-05: Creación de la Estructura Formal SDD (Spec-Driven Development)**
  - Crear `docs/constitution.md` con los principios no negociables (local-first, 0€ coste, 0 dependencias pesadas, 100% tests verde, diseño Claude validado).
  - Crear `specs/001-tacticas-leyenda-impresion-a4/` con `spec.md`, `plan.md` y `tasks.md`.

- [x] **TASK-06: Documentación en `agente.md` y Despliegue**
  - Incorporar la sección v60 en `agente.md` respetando las secciones históricas de otros agentes.
  - Sincronizar archivos modificados con `campobase-preview-deploy` y verificar git status.
