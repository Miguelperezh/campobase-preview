# Especificación SDD 013: Ajustes — Personalización de Pizarra Táctica, Barra Lateral, Bloques y Botones

## 1. Visión General
Esta especificación resuelve de forma integral y definitiva los requerimientos de personalización visual detallados por el usuario:
1. **Pizarra táctica en Ajustes:** Tarjeta específica con previsualización compacta del campo de juego (3 fichas de mi equipo, 2 del rival, balón y flechas) y controles intuitivos para personalizar el color del césped/fondo, líneas, fichas de mi equipo, fichas del rival y flechas tácticas, propagándose a todas las pizarras del sistema (Tácticas, Partido en vivo, Preparación).
2. **Personalización de la barra lateral / Menú lateral:** Control completo para personalizar el color de fondo (`sidebarBg`) y texto (`sidebarInk`) del menú lateral izquierdo (`#cb-claude-sidebar`).
3. **Consistencia tipográfica del botón Guardar:** Corrección del color de fuente del botón «Guardar» en la muestra de cabeceras/botones (`#cbx-preview-banner-btn`), asegurando que siempre use blanco puro (`#ffffff`) o el color configurado (`--btnInk`), evitando que la regla de fuente personalizada de `span` lo tiña de negro.
4. **Personalización visual e intuitiva de Bloques / Tarjetas:** Soporte para colores directos/sólidos en tarjetas (`cardBg`) además del tinte porcentual, selector de títulos de tarjetas (`cardTitle`) y bordes (`cardBorder`), con tarjeta demo en la vista previa.

## 2. Requisitos Técnicos

### 2.1 Pizarra táctica de previsualización y colores (`#tactic-board-colors-card`)
- Tarjeta en `index.html` dentro de `#ajustes .settings-grid`.
- Mini campo SVG compacto (max-width: 280px, aspect-ratio: 4/3 o 3/4) con:
  - Fondo del césped (`var(--tb-pitch, #1e523d)`).
  - Líneas del campo (`var(--tb-lines, rgba(255,255,255,0.4))`).
  - Fichas de mi equipo (`var(--tb-team, #c8102e)`).
  - Fichas del rival (`var(--tb-rival, #111827)`).
  - Flechas tácticas (`var(--tb-arrow, #facc15)`).
- Swatches de colores + selectores libres de color (`input[type="color"]`) para cada elemento.
- Botón «Restablecer colores de pizarra».
- Persistencia en `state.settings.tacticBoard` y aplicación reactiva a:
  - Mini campo de previsualización en Ajustes.
  - `#cbx-tactics-pitch-board` en vista Tácticas.
  - `#live-board` y `#prep-board` en Partido en vivo y Preparación.

### 2.2 Barra lateral / Menú lateral (`sidebarBg`, `sidebarInk`)
- Controles de color en Ajustes para:
  - Fondo de la barra lateral (`sidebarBg`).
  - Texto / enlaces de la barra lateral (`sidebarInk`).
- Inyección de variables `--sidebar-bg`, `--sidebar-ink`, `--sidebar-sub` en `:root`, `body` y `#cb-claude-sidebar`.
- Reglas CSS con `!important` en `#cb-claude-sidebar`, sus botones y encabezados para garantizar la aplicación inmediata.

### 2.3 Botón Guardar y Botones Primarios (`--btnInk` blanco / consistente)
- `#cbx-preview-banner-btn` pasa a ser un elemento con clase `.primary` y estilo prioritario `color: var(--btnInk, #ffffff) !important;`.
- En `styles-redesign.css`, la regla de alta especificidad de `body.cb-redesign-active[data-has-custom-font-color="true"] span` excluye a los botones y muestras (`:not(#cbx-preview-banner-btn):not(#preview-sample-btn)...`).
- `updateThemePreviewBox` asegura `previewBannerBtn.style.setProperty('color', btnInk, 'important')`.

### 2.4 Bloques / Tarjetas (`cardBg`, `cardTitle`, `cardBorder`)
- Swatches directos y selectores libres para el fondo de bloques (`cardBg`), permitiendo colores sólidos (`#ffffff`, `#f8fafc`, `#11221b`, `#18181b`, etc.).
- Tarjeta demo de bloque en la vista previa interactiva.
