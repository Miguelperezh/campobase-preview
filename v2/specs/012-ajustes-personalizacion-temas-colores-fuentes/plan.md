# Plan Técnico SDD 012: Ajustes — Personalización Completa y Fiel a Claude

## 1. Arquitectura de Módulos

### 1.1 `index.html` — Estructura Declarativa de la Pestaña Ajustes
Enriquecer la sección `#ajustes` con las tarjetas de la maqueta canónica de Claude:
1. **Identidad del Club**: Escudo con subida, preview y botón de restablecer por defecto; campo de nombre de equipo.
2. **Vista previa del tema en directo**: Tarjeta con marcador de ejemplo `Unión Viera 4:2 Rival`, fondo de app, texto de muestra y botón de muestra.
3. **Temas guardados (Presets)**: Chips interactivos de presets con indicador de degradado, botón de aplicación rápida, botón `Partido` para vincular al modo En Vivo y botón de borrado `×`. Botón «Guardar tema actual».
4. **Fuente de títulos y marcadores**: Selector independiente de tipografía para titulares y marcadores (`fontTitle`) con muestras en mayúsculas en vivo.
5. **Colores con significado (Semáforos)**: Controles de color para Porteros, Defensas, Medios, Delanteros, Victoria, Empate y Derrota.
6. **Fondos, tarjetas y botones**:
   - Fondo de app: swatches + color picker + slider de intensidad (0–100%).
   - Fondo de tarjetas: swatches + color picker + slider de intensidad (0–100%).
   - Títulos de tarjetas: swatches + color picker.
   - Botones secundarios: fondo y texto.
   - Botón de WhatsApp: texto (fondo fijo verde).
   - Resultados de temporada: texto.
   - Goles a favor y en contra: barras, fondo de botón y texto.
   - Botón «Restablecer estos colores».
7. **Cabeceras y botones principales**: Fondo y texto de cabeceras/bandas; fondo y texto de botones principales; con preview en directo.

### 1.2 `js/app.js` — Reactividad, Persistencia y Aplicación de Variables
- **Gestión de Estado Extendido de Ajustes**:
  - `state.settings.theme`: Objeto extendido que incluye:
    - `themeBg`, `accentPreset`, `accentColor`, `fontFamily`, `fontScale`, `fontWeight`, `textColor`, `fontColor`.
    - `fontTitle`.
    - `bannerBg`, `bannerInk`, `btnBg`, `btnInk`.
    - `appBgHue`, `appBgPct`, `cardHue`, `cardPct`, `cardTitle`.
    - `btn2Bg`, `btn2Ink`, `waInk`, `resInk`.
    - `gfColor`, `gfBg`, `gfInk`, `gaColor`, `gaBg`, `gaInk`.
  - `state.settings.presets`: Array de presets guardados `[{ name, theme, accent, font, fontTitle, ... }]`.
  - `state.settings.matchPreset`: Índice del preset reservado para En Vivo.
  - `state.settings.sem`: Objeto `{ gk, def, mid, fw, win, draw, loss }`.
- **Función `applyCustomTheme(theme)`**:
  - Inyecta todas las variables CSS calculadas en `:root` y `document.body`.
  - Calcula `color-mix` para fondos e intensidades de app y tarjetas.
  - Aplica luminancia y modo oscuro cuando `fontColor` es claro.
  - Actualiza la tarjeta de vista previa en tiempo real.
- **Función `renderSavedThemePresets()`**:
  - Renderiza los chips interactivos de presets y el texto indicador de tema de partido.
- **Función `saveCurrentThemePreset(name)`**:
  - Captura la configuración actual y la añade a la lista de presets persistidos.
- **Función `resetExtendedColors()`**:
  - Limpia las propiedades extendidas devolviendo al comportamiento automático.

### 1.3 `css/claude-partido.css` (o archivo complementario) — Estilos de Controles de Personalización
- Estilos para swatches de color con indicador de selección.
- Estilos para sliders de intensidad con porcentaje alineado.
- Estilos para la tarjeta de vista previa del tema y los chips de presets guardados.
- Aplicación de variables `--cardTitle`, `--btn2`, `--btn2Ink`, `--bn`, `--bnInk`, `--btn`, `--btnInk`.

---

## 2. Aislamiento y No Regresión
- Mantener la compatibilidad con todas las opciones existentes del formulario `#theme-settings-form` y selectores ya utilizados en tests.
- Conservar intactos los 637 tests existentes sin mutaciones destructivas de almacenamiento.
