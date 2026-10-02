# Plan de Implementación SDD 013: Ajustes — Personalización de Pizarra Táctica, Barra Lateral, Bloques y Botones

## Fase 1: Estructura HTML (`index.html`)
1. Insertar la tarjeta `#tactic-board-colors-card` en `#ajustes .settings-grid` con:
   - Mini campo SVG compacto de previsualización con líneas, fichas de equipo, fichas de rival, balón y flechas.
   - Filas de swatches y selectores libres para Césped, Líneas, Equipo, Rival y Flechas.
   - Botón «Restablecer colores de pizarra».
2. Añadir en `index.html` controles para la barra lateral:
   - Fondo de barra lateral (`sidebarBg`).
   - Texto de barra lateral (`sidebarInk`).
3. Reemplazar `<span id="cbx-preview-banner-btn">` por `<button type="button" id="cbx-preview-banner-btn" class="primary">` con atributos de accesibilidad y `color: var(--btnInk, #ffffff) !important;`.
4. Mejorar la sección de Fondos y Tarjetas para incluir colores directos de bloques y tarjeta demo de bloque en la vista previa.

## Fase 2: Estilos CSS (`css/claude-shell.css`, `css/claude-partido.css`, `styles-redesign.css`)
1. En `css/claude-shell.css`:
   - Conectar `#cb-claude-sidebar` con `var(--sidebar-bg, var(--cb-shell-hero, #0a251b))`.
   - Conectar botones y textos del lateral con `var(--sidebar-ink)`.
2. En `styles-redesign.css`:
   - Excluir `#cbx-preview-banner-btn`, `#preview-sample-btn` y botones de vista previa de la regla destructiva de color de `span`.
3. En `css/claude-partido.css`:
   - Definir clases y estilos para el mini campo táctico de previsualización (`.cbx-mini-pitch-preview`, `.cbx-mini-token`, etc.).
   - Vincular `--tb-pitch`, `--tb-lines`, `--tb-team`, `--tb-rival`, `--tb-arrow` a todas las pizarras del sistema.

## Fase 3: Controlador JavaScript (`js/app.js`)
1. Constantes y configuración por defecto para `DEFAULT_TACTIC_BOARD` y `SIDEBAR_CONFIGS`.
2. Lógica en `applyCustomTheme`:
   - Inyección de variables de pizarra táctica y barra lateral.
   - Actualización del mini campo de previsualización.
   - Actualización de `#cb-claude-sidebar` en tiempo real.
   - Corrección de `updateThemePreviewBox` asegurando que `#cbx-preview-banner-btn` siempre tenga `btnInk` (blanco por defecto).
3. Funciones de ayuda:
   - `renderTacticBoardCustomizer()`
   - `updateTacticBoardColors(key, value)`
   - `resetTacticBoardColors()`
   - Sincronización en `syncCustomizerControls()`.
4. Listeners en `initCustomizationListeners()`.

## Fase 4: Pruebas y Validación
1. Crear test automatizado `tests/ajustes-pizarra-lateral-bloques.test.js`.
2. Ejecutar `npm run check && npm test` asegurando 100% de tests verdes.
3. Actualizar `agente.md` con la Entrega v70.
4. Desplegar en GitHub Pages y validar commit activo.
