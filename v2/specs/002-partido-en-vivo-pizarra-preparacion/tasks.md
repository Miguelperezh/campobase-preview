# Tareas: 002 - Pizarra Táctica en Partido en Vivo y Preparación

- **Identificador:** `002-partido-en-vivo-pizarra-preparacion`
- **Fecha:** 01/10/2026
- **Estado:** Completado (5/5 tareas verificadas)

---

## Lista de Tareas

- [x] **TASK-01: Verificación de Pizarra Única Dinámica en Partido en Vivo**
  - Comprobar que `renderTacticsBoardSvg` actualiza el SVG único `#live-tactics-board` sin crear elementos duplicados.
  - Verificar que el selector y los chips de formación (`.cbx-live-formation-chips`) conmutan las piezas de los jugadores en el mismo lienzo.

- [x] **TASK-02: Verificación del Conmutador de Rival en Vivo y Preparación**
  - Validar que `#live-rival-toggle-btn` y `#prep-toggle-rival-btn` conmutan el estado del rival con toast de confirmación.
  - Verificar que por defecto el rival permanece oculto (`liveTacticsShowOpponent = false`, `prepShowRival = false`).

- [x] **TASK-03: Blindaje de Leyenda y Dimensiones en Vivo**
  - Asegurar que `.live-tactics-legend` hereda el aislamiento CSS y no produce desbordamientos.

- [x] **TASK-04: Ejecución de Tests y Linter**
  - Ejecutar `npm run check` y verificar 0 errores de sintaxis.
  - Ejecutar `npm test` y verificar 603 tests pasando al 100%.

- [x] **TASK-05: Documentación y Registro en `agente.md`**
  - Registrar la especificación `002-partido-en-vivo-pizarra-preparacion` en `agente.md` preservando el historial previo.
