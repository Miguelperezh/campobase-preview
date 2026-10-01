# Plan de Implementación: Spec 007

## 1. Modificaciones en Código JavaScript (`js/app.js`)

### 1.1 Homogeneizar Popup Táctico (`openTacticsPopup`)
- Actualizar `openTacticsPopup(sc, idx, clientX, clientY)`:
  - Cambiar `const w = 240, h = 120` por `const w = Math.min(340, window.innerWidth - 24), h = 130`.
  - Formatear opciones con `${escapeHtml(x.number ? x.number + ' · ' : '')}${escapeHtml(x.name)}`.
  - Formatear suplentes con `${escapeHtml(x.number ? x.number + ' · ' : '')}${escapeHtml(x.name)} (Suplente)`.

### 1.2 Homogeneizar Disposición de la Pizarra en Vivo (`arrangeClaudeLiveBoard`)
- Reemplazar `<details class="cbx-live-board-options">` con un contenedor abierto permanente `<section class="cbx-live-board-options cbx-live-slots-panel panel">`.
- Mantener la barra de herramientas `#live-tactics-tools` directamente visible e interactiva.
- Ubicar `#live-tactics-slots` en panel abierto adaptativo.

## 2. Modificaciones en Estilos CSS (`css/claude-partido.css`)

### 2.1 Reorganización de `.cbx-live-main`
- Por defecto (< 1280px):
  - `display: grid; grid-template-columns: 1fr; gap: 18px; max-width: 720px; margin: 0 auto;`.
- En pantallas ultra-anchas (`@media(min-width: 1280px)`):
  - `grid-template-columns: minmax(560px, 640px) minmax(340px, 1fr) minmax(280px, 1fr); max-width: 1400px; margin: 0;`.
- En pantallas móviles (`@media(max-width: 720px)`):
  - Conservar maquetación vertical secuencial.

### 2.2 Estilo Hero en `#live-tactics .board-wrap` y `#delegate-tactics .board-wrap`
- Actualizar dimensiones: `width: 100%; max-width: 640px; margin: 8px auto; padding: 12px; border-radius: 20px; background: #155438; box-shadow: 0 4px 20px rgba(0,0,0,.12);`.
- SVG `#live-tactics-board`: `display: block; width: 100%; max-width: 640px; margin: 0 auto; aspect-ratio: 1 / 1;`.
- Colores tácticos unificados: `.tac-field` en `#205f43`, fichas con trazo `#cbd5e1` y números `#0b2d20`.

### 2.3 Estilo de Puestos en Vivo
- `.cbx-live-board-options .live-tactics-slots`: `display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;`.
- `.suplentes`: `grid-column: 1 / -1;`.

## 3. Plan de Pruebas
- Crear `tests/partido-en-vivo-pizarra-hero.test.js`:
  - Verificar que `.cbx-live-main` define max-width de 640px para la pizarra táctica en vivo.
  - Verificar que `openTacticsPopup` calcula 340px de ancho y formatea con ` · `.
  - Verificar que `arrangeClaudeLiveBoard` no pliega herramientas ni puestos en un details cerrado.
- Ejecutar `npm test` y `npm run check`.
