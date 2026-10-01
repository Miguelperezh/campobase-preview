# Plan de Arquitectura Técnica: 004 - Desbloqueo y Flujo Integral de Preparar Partido

- **Identificador:** `004-preparar-partido-flujo-y-editor`
- **Estado:** Completado
- **Módulos Afectados:** `js/app.js`, `css/claude-partido.css`, `tests/preparacion-flujo.test.js`

---

## 1. Diagnóstico de la Causa Raíz

1. **Condición Invertida en Rediseño Claude (`js/app.js:3942`):**
   ```javascript
   // CÓDIGO PROBLEMÁTICO ANTERIOR:
   if (!document.body.classList.contains('cb-redesign-active')) $('#preparacion-list').classList.add('hidden');
   ```
   En modo Claude (`cb-redesign-active`), la lista `#preparacion-list` **nunca se ocultaba**. Permanecía en el DOM con `display: grid;`, empujando el editor `#preparacion-editor` fuera del campo visual.
2. **Ausencia de Regla CSS de Ocultación de Alta Especificidad:**
   `css/claude-partido.css:68` define `body.cb-redesign-active #preparacion #preparacion-list { display: grid; ... }`. No existía regla con la misma especificidad para `.hidden` ni para el selector de estado `:has(#preparacion-editor:not(.hidden))`.
3. **Bloqueo Funcional por Ausencia de Convocatoria:**
   Los partidos sin convocatoria solo ofrecían `[Convocar y preparar]`, lo cual expulsaba al usuario de la pestaña hacia el módulo Convocatorias en lugar de dejarle preparar la alineación táctica de su partido.
4. **Pizarra Inicial con 6 Puestos Vacíos:**
   `prepBuildTeam()` solo rellenaba la posición de portero; los 6 puestos restantes quedaban con `playerId: ''`, obligando al usuario a rellenar manualmente uno por uno para poder guardar sin error.

---

## 2. Decisiones de Arquitectura e Implementación

### A. Ocultación y Apertura Garantizada
- En `openPreparacionEditor(matchId)`:
  - Eliminar incondicionalmente la comprobación de rediseño y ejecutar:
    ```javascript
    $('#preparacion-list').classList.add('hidden');
    $('#preparacion-editor').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'instant' });
    ```
- En `css/claude-partido.css`:
  - Añadir reglas estrictas:
    ```css
    body.cb-redesign-active #preparacion #preparacion-list.hidden,
    body.cb-redesign-active #preparacion:has(#preparacion-editor:not(.hidden)) #preparacion-list {
      display: none !important;
    }
    ```

### B. Auto-creación de Convocatoria Base (`ensureCallupForMatch`)
- Si un partido no tiene convocatoria y el usuario pulsa `[Preparar]`:
  - `ensureCallupForMatch(match)` toma los jugadores de la plantilla actual, calcula el reparto base, crea el registro en `callups`, asocia el `callupId` al partido y persiste en IndexedDB.
  - De inmediato invoca `openPreparacionEditor(match.id)` sin abandonar la pestaña de Preparación.

### C. Poblado Inteligente de Alineación Inicial
- Cuando `prepDraft` se inicializa para un partido sin preparación guardada:
  - Asignar el portero (`firstKeeper`).
  - Asignar los 6 puestos de campo con los convocados disponibles no porteros respetando compatibilidad de posiciones (defensas a defensas, etc.) y completando con los restantes convocados.
  - De esta forma, el entrenador ve inmediatamente una alineación completa de 7 jugadores lista en la pizarra.

### D. Botones de Retorno y Cabecera Accesible
- La cabecera del editor conserva el botón `#prep-back-head` con texto `← Volver a partidos`.
- En la botonera de acciones inferior se mantiene también `#prep-back`.
- Ambos botones ejecutan el cierre del editor, la visualización de la lista y la actualización de los estados.

### E. Cierre Automático de Popups y Menús Flotantes
- Escuchar eventos `pointerdown` y `keydown` fuera de `#prep-popup` para cerrarlo si el usuario no desea cambiar de jugador.

---

## 3. Plan de Verificación y Cero Regresiones

1. Verificar que `openPreparacionEditor` oculta la lista y muestra el editor en todos los tamaños de pantalla.
2. Verificar que guardar o volver restaura la lista con el estado actualizado.
3. Verificar que un partido sin convocatoria se puede preparar en un solo clic con jugadores de la plantilla.
4. Crear nueva suite de tests `tests/preparacion-flujo.test.js`.
5. Ejecutar `npm run check` y `npm test` para asegurar 100% de tests en verde.
