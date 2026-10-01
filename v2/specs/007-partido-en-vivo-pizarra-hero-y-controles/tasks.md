# Tareas: Spec 007 — Partido en Vivo: Pizarra Táctica Hero de 640px y Controles Homogeneizados

- [x] **T1: Modificación de `openTacticsPopup` y `arrangeClaudeLiveBoard` en `js/app.js`**
  - [x] Actualizar ancho de popup a `Math.min(340, window.innerWidth - 24)` y altura a `130px`.
  - [x] Formatear opciones de titulares y suplentes con ` · `.
  - [x] Reemplazar `<details class="cbx-live-board-options">` con panel abierto `<section class="cbx-live-board-options cbx-live-slots-panel panel">`.
  - [x] Asegurar herramientas `#live-tactics-tools` y puestos `#live-tactics-slots` siempre visibles.

- [x] **T2: Actualización de reglas CSS en `css/claude-partido.css`**
  - [x] Actualizar `.cbx-live-main` para pantallas < 1280px a 1 columna centrada de hasta 720px y >= 1280px con columna hero de 560px–640px.
  - [x] Actualizar `#live-tactics .board-wrap` y `#delegate-tactics .board-wrap` a 640px con fondo `#155438`.
  - [x] Actualizar colores de campo `.tac-field` (`#205f43`) y trazos de fichas (`#cbd5e1`).
  - [x] Configurar `.cbx-live-board-options .live-tactics-slots` con cuadrícula adaptativa `repeat(auto-fit, minmax(280px, 1fr))`.

- [x] **T3: Pruebas automatizadas y verificación**
  - [x] Crear `tests/partido-en-vivo-pizarra-hero.test.js`.
  - [x] Ejecutar `npm test` verificando que todos los tests pasen (618 tests).
  - [x] Ejecutar `npm run check` con 0 errores de sintaxis.

- [x] **T4: Documentación en `agente.md` (Sección 24)**
  - [x] Registrar la entrega v64 detallando causas raíz, mejoras y verificación, preservando secciones 1 a 23 intactas.

- [x] **T5: Sincronización y despliegue a GitHub Pages**
  - [x] Commit y push en `campobase` (rama `implement/claude-hoy-real`).
  - [x] Sincronizar directorio `campobase-preview-deploy/v2/`.
  - [x] Commit y push en `campobase-preview-deploy` (rama `main`).
  - [x] Proveer URL al usuario: `https://miguelperezh.github.io/campobase-preview/v2/`.
