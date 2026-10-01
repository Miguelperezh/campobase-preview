# Lista de Tareas: 004 - Desbloqueo y Flujo Integral de Preparar Partido

- **Identificador:** `004-preparar-partido-flujo-y-editor`
- **Estado:** Completado
- **Fecha:** 01/10/2026

---

## Tareas de Implementación

- [x] **Tarea 1: Ocultación incondicional de la lista de partidos y scroll en `openPreparacionEditor`**
  - Archivo: `js/app.js`
  - Quitar la condición `if (!document.body.classList.contains('cb-redesign-active'))`.
  - Asegurar `$('#preparacion-list').classList.add('hidden')` y `$('#preparacion-editor').classList.remove('hidden')`.
  - Añadir scroll suave al inicio de `#preparacion`.

- [x] **Tarea 2: Blindaje de reglas CSS para `#preparacion-list` y `#preparacion-editor`**
  - Archivo: `css/claude-partido.css`
  - Añadir reglas de alta especificidad para que `#preparacion-list.hidden` y `#preparacion:has(#preparacion-editor:not(.hidden)) #preparacion-list` tengan `display: none !important`.

- [x] **Tarea 3: Botón directo `[Preparar]` y función `ensureCallupForMatch` para partidos sin convocatoria**
  - Archivo: `js/app.js`
  - En `renderPreparaciones()`, añadir botón `[Preparar]` también a partidos sin convocatoria previa.
  - Implementar `ensureCallupForMatch(match)` para generar convocatoria automática con jugadores de la plantilla y abrir el editor de inmediato.

- [x] **Tarea 4: Auto-asignación inteligente de los 7 puestos en `prepBuildTeam`**
  - Archivos: `js/app.js` / `js/live-tactics.js`
  - Asegurar que al abrir la preparación de un partido nuevo, los 7 puestos (portero y 6 jugadores de campo) queden poblados con jugadores disponibles para evitar alineaciones vacías y bloqueos al guardar.

- [x] **Tarea 5: Botón de retorno visible en cabecera y cierre de popup táctico**
  - Archivo: `js/app.js`
  - Preservar botón `[← Volver a partidos]` en la cabecera `#preparacion-editor > .section-head`.
  - Añadir listener para cerrar `#prep-popup` al hacer clic fuera o pulsar Escape.

- [x] **Tarea 6: Conexión y enlace desde Partido en Vivo**
  - Archivo: `js/app.js`
  - Añadir acción directa a `#preparacion` si no hay partidos convocados en `#partido`.

- [x] **Tarea 7: Suite de Tests Automatizados**
  - Archivo: `tests/preparacion-flujo.test.js`
  - Verificar ocultación de lista, auto-creación de convocatoria, población de 7 titulares y guardado en IndexedDB.

- [x] **Tarea 8: Verificación Completa, Linter y Despliegue**
  - Ejecutar `npm run check` y `npm test`.
  - Sincronizar con repositorio de deploy en `v2/`.
  - Actualizar `agente.md` con la sección de la entrega 004.
  - Proporcionar URL al usuario.
