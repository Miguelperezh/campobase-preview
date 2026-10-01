# Plan de Implementación: Spec 006

## 1. Arquitectura de Maquetación y DOM

### 1.1 Inversión de Jerarquía en DOM (`js/app.js`)
- En `arrangeClaudePrepEditor()`:
  - Ensamblar `layout.append(pitch, controls)` en lugar de `layout.append(controls, pitch)`.
  - Crear `slotsPanel` como elemento `<section class="cbx-prep-slots-details cbx-prep-slots-panel panel">` con `<h4>` y `<p>`.
  - Añadir `#prep-slots` dentro de `slotsPanel` y ejecutar `controls.prepend(slotsPanel)`.
  - Suprimir la lógica de `<details>` y su atributo condicional `open`.

### 1.2 Reglas CSS Responsivas (`css/claude-partido.css`)
- `.cbx-prep-editor-layout`:
  - Por defecto (< 1280px): `display: grid; grid-template-columns: 1fr; gap: 22px; max-width: 720px; margin: 0 auto;`.
  - A `@media (min-width: 1280px)`: `grid-template-columns: minmax(560px, 640px) minmax(360px, 1fr); max-width: 1180px; margin: 0;`.
- `.cbx-prep-pitch .board-wrap` y `#prep-board`:
  - `width: 100%; max-width: 640px; margin: 0 auto; aspect-ratio: 1 / 1;`.
- `.cbx-prep-slots-details .live-tactics-slots`:
  - `display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;`.
  - `.suplentes`: `grid-column: 1 / -1;`.

## 2. Plan de Pruebas y Verificación
- Actualizar `tests/cambios-pizarra-desplegables.test.js`:
  - Validar regla de 1 columna por defecto y 640px para la pizarra táctica.
  - Validar cuadrícula adaptativa en `.live-tactics-slots`.
  - Validar que `arrangeClaudePrepEditor` antepone la pizarra táctica y los selectores sin details plegable.
- Ejecutar `npm test` (verificar 614/614 tests pasando).
- Ejecutar `npm run check`.
