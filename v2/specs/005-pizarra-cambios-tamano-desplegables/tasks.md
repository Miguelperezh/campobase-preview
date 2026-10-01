# Lista de Tareas: 005 - Ampliación de Pizarra Táctica de Cambios y Corrección de Desplegables de Nombres

- **Identificador:** `005-pizarra-cambios-tamano-desplegables`
- **Estado:** Completado
- **Fecha:** 01/10/2026

---

## Tareas de Implementación

- [x] **Tarea 1: Ampliar la pizarra de cambios a 640px y reequilibrar la cuadrícula del editor**
  - Archivo: `css/claude-partido.css`
  - Modificar `.cbx-prep-editor-layout` a `grid-template-columns: minmax(300px, 360px) minmax(0, 1fr)`.
  - Ampliar `.cbx-prep-pitch .board-wrap` y `#prep-board` a `max-width: 640px`.
  - Incrementar `.board-wrap` en `#partido` a `max-width: 600px`.

- [x] **Tarea 2: Eliminar corte de nombres en los desplegables de puestos (`#prep-slots`)**
  - Archivo: `css/claude-partido.css`
  - Cambiar `.cbx-prep-slots-details .live-tactics-slots` a `grid-template-columns: 1fr`.
  - Ajustar padding, tamaño de fuente (`13.5px`), color y altura mínima de `.slot select`.

- [x] **Tarea 3: Ampliar el popup táctico flotante (`#prep-popup`)**
  - Archivos: `js/app.js`, `css/claude-partido.css`
  - En `prepOpenPopup`, aumentar `w` de `240` a `Math.min(340, window.innerWidth - 24)`.
  - En CSS, añadir `min-width: 320px; max-width: min(92vw, 380px);` y tipografía `13.5px` para el select.

- [x] **Tarea 4: Añadir botón de ampliación a pantalla completa de la pizarra de preparación**
  - Archivo: `js/app.js`
  - Añadir `#prep-full-btn` (`⛶ Ampliar pizarra`) en la cabecera/barra de la pizarra de preparación.
  - Conectar evento para mostrar la pizarra táctica ampliada dentro del lightbox `#prep-lightbox`.

- [x] **Tarea 5: Ampliar diálogo modal de sustituciones de calendario (`#calendar-substitutions-v2-dialog`)**
  - Archivo: `css/claude-partido.css`
  - Asignar `width: min(820px, calc(100% - 2rem)) !important`.
  - Configurar `.calendar-action-row .form-row` con espacio holgado y tipografía `13.5px` para que los nombres de los jugadores quepan completos.

- [x] **Tarea 6: Suite de Tests Automatizados**
  - Archivo: `tests/cambios-pizarra-desplegables.test.js`
  - Verificar reglas CSS y cálculos de ancho en JavaScript.

- [x] **Tarea 7: Verificación, Bitácora y Despliegue**
  - Ejecutar `npm run check` y `npm test`.
  - Actualizar `agente.md` con la sección de la entrega 22.
  - Sincronizar y publicar en `campobase-preview-deploy` (directorio `v2/`).
  - Proveer URL de validación al usuario.
