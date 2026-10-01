# Tareas: Spec 006 — Pizarra Hero de 640px y Desplegables de Puestos Siempre Visibles

- [x] **T1: Modificación de `arrangeClaudePrepEditor` en `js/app.js`**
  - [x] Anteponer `pitch` a `controls` en `layout.append(pitch, controls)`.
  - [x] Reemplazar `<details>` con `<section class="cbx-prep-slots-details cbx-prep-slots-panel panel">`.
  - [x] Insertar `#prep-slots` dentro de `slotsPanel` y anteponerlo a `controls` con `controls.prepend(slotsPanel)`.
  - [x] Eliminar evaluación de `details.open = prepDraft.some(...)`.

- [x] **T2: Actualización de reglas CSS en `css/claude-partido.css`**
  - [x] `.cbx-prep-editor-layout`: `grid-template-columns: 1fr` con ancho centrado hasta 720px por defecto (< 1280px).
  - [x] Añadir regla `@media(min-width: 1280px)` para 2 columnas (`minmax(560px, 640px) minmax(360px, 1fr)`).
  - [x] Actualizar `.live-tactics-slots` a `repeat(auto-fit, minmax(280px, 1fr))` con suplentes ocupando ancho completo (`grid-column: 1 / -1`).

- [x] **T3: Actualización de pruebas automatizadas**
  - [x] Ajustar aserciones en `tests/cambios-pizarra-desplegables.test.js`.
  - [x] Ejecutar `npm test` verificando 614/614 tests en verde.
  - [x] Ejecutar `npm run check` con 0 errores de sintaxis.

- [x] **T4: Documentación en `agente.md` (Sección 23)**
  - [x] Añadir Entrega v63 describiendo los cambios, causas raíz y resultados, preservando intactas las secciones 1 a 22.

- [ ] **T5: Sincronización y despliegue a GitHub Pages**
  - [ ] Commit y push en `campobase` (rama `implement/claude-hoy-real`).
  - [ ] Sincronizar directorio `campobase-preview-deploy/v2/`.
  - [ ] Commit y push en `campobase-preview-deploy` (rama `main`).
  - [ ] Proveer URL al usuario: `https://miguelperezh.github.io/campobase-preview/v2/`.
