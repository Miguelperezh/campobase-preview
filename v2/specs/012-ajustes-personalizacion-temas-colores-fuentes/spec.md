# Especificación SDD 012: Ajustes — Personalización Completa de Temas, Colores, Tarjetas, Botones y Fuentes (Fiel a Claude)

## 1. Contexto y Objetivos
Siguiendo las secciones **BS** a **CI** de la Especificación Maestra (`01_ESPECIFICACION_TOTAL_NO_RESUMIDA.md`) y el diseño canónico de Claude (`CampoBase App.dc.html`, líneas 593–660 y 1440–1505), la pestaña de **Ajustes** debe albergar el sistema visual total de personalización reactiva de CampoBase.

El usuario exige explícitamente:
> *"todo debe ser personalizable, etc... pero absolutamente todos los colores de fondo, botones, tarjetas. fuentes de cada cosa y color. lee lo de claude"*

Esta especificación cubre:
1. **Identidad del Club**:
   - Escudo oficial (subida PNG/JPG con preview inmediata, persistencia en IndexedDB y botón para restaurar escudo por defecto).
   - Nombre del equipo para toda la aplicación.
2. **Preferencias Visuales y Tema Base**:
   - Tono de fondo de la app (`themeBg`: 13 opciones de Claude).
   - Color de acento del club (`accentColor` / `accentPreset`: 8 swatches + color picker libre).
   - Familia tipográfica del texto (`fontFamily`: Sistema, Deportiva, Legible, Moderna, Técnica, Clásica).
   - Tamaño de texto en listas y fichas (`fontScale`: Compacto, Normal, Grande, Muy grande, Gigante, Enorme, Ultra).
   - Grosor de texto y negrita (`fontWeight`: Normal, Seminegrita, Negrita de campo, Extra negrita, Ultra negrita).
   - Legibilidad y contraste (`textColor`: Contraste óptimo, Negro puro, Contraste extremo sol, Azul noche, Blanco puro).
   - Color de fuente libre de la app (`fontColor`: 9 swatches + selector libre hex).
3. **Fuente de Títulos y Marcadores (`fontTitle`)**:
   - Selección tipográfica independiente para cabeceras, títulos (`h1`, `h2`, `h3`), marcadores y números (`--cbx-disp`, `--disp`).
   - Opciones: Auto (igual que texto), Barlow Condensed, Oswald, Bebas Neue, Montserrat, Outfit, JetBrains Mono, Merriweather.
   - Selector visual con muestra de texto en mayúsculas en tiempo real.
4. **Temas Guardados (Presets) y Tema de Partido en Vivo**:
   - Guardar el tema visual completo actual con nombre personalizado.
   - Lista interactiva de chips de presets con degradado visual del tema (`presetChips`).
   - Botón directo para aplicar el preset al instante.
   - Botón `Partido` (`matchPreset`): permite asignar un tema exclusivo para cuando se entra en «Partido en vivo» (ej. Negro Contraste Sol para exterior bajo luz solar).
   - Botón de borrado `×` de cada preset.
5. **Colores con Significado (Semáforos / Posiciones y Resultados)**:
   - Porteros (`gk`), Defensas (`def`), Medios (`mid`), Delanteros (`fw`).
   - Victoria (`win`), Empate (`draw`), Derrota (`loss`).
   - Selectores de color individuales reflejados en insignias, actas y marcadores de temporada.
6. **Fondos, Tarjetas y Botones**:
   - **Fondo de la app**: Color base (`appBgHue`) + Slider de Intensidad 0–100% (`appBgPct`).
   - **Fondo de tarjetas**: Color base (`cardHue`) + Slider de Intensidad 0–100% (`cardPct`).
   - **Títulos de tarjetas**: Color de titulares (`cardTitle`).
   - **Botones secundarios**: Fondo (`btn2Bg`) y texto (`btn2Ink`).
   - **Botón de WhatsApp**: Color del texto (`waInk`) conservando el fondo oficial verde.
   - **Resultados de temporada**: Color del texto (`resInk`).
   - **Goles A favor y En contra**:
     - A favor: Color de barra (`gfColor`), fondo de botón (`gfBg`), texto de botón (`gfInk`).
     - En contra: Color de barra (`gaColor`), fondo de botón (`gaBg`), texto de botón (`gaInk`).
   - Botón `Restablecer estos colores` (limpia solo este ámbito sin alterar el resto).
7. **Cabeceras y Botones Principales**:
   - Fondo de cabeceras (`bannerBg`) y texto de cabeceras (`bannerInk`).
   - Fondo de botones principales (`btnBg`) y texto de botones principales (`btnInk`).
   - Muestra visual previa en tiempo real.
8. **Vista Previa del Tema en Directo**:
   - Tarjeta interactiva en la parte superior/destacada que muestra inmediatamente:
     - Escudo del club.
     - Banda con marcador en vivo de muestra (`Unión Viera 4:2 Rival`).
     - Muestra de fondo de app y panel de tarjeta.
     - Muestra de texto estándar en listas y fichas.
     - Botón de muestra.
   - Se actualiza reactivamente al vuelo sin requerir recargar la página.

---

## 2. Requisitos Técnicos y Variables CSS
Todas las personalizaciones alimentan las variables CSS estándar en `:root` y `body`:
- `--cbx-hero`, `--hero`: Color hero del tema activo.
- `--cbx-acc`, `--acc`, `--accent`: Color de acento.
- `--cbx-bg`, `--bg`: Fondo de la aplicación (calculado con `color-mix(in srgb, ${hue} ${pct}%, #ffffff)`).
- `--cardBg`, `--card`: Fondo de las tarjetas y paneles.
- `--cardTitle`: Color de los titulares de tarjetas.
- `--cbx-ui`, `--ui`: Tipografía del cuerpo y listas.
- `--cbx-disp`, `--disp`: Tipografía de titulares y marcadores.
- `--ink`: Color de texto de la aplicación.
- `--bn`, `--bnInk`: Fondo y texto de bandas y cabeceras.
- `--btn`, `--btnInk`: Fondo y texto de botones primarios.
- `--btn2`, `--btn2Ink`: Fondo y texto de botones secundarios.
- `--waInk`: Texto de botones WhatsApp.
- `--resInk`: Texto de resultados de partidos.
- `--gf`, `--gfBg`, `--gfInk`: Goles a favor.
- `--ga`, `--gaBg`, `--gaInk`: Goles en contra.
- `--sem-gk`, `--sem-def`, `--sem-mid`, `--sem-fw`, `--sem-win`, `--sem-draw`, `--sem-loss`: Colores semánticos.

---

## 3. Criterios de Aceptación
1. En la pestaña Ajustes se muestran todas las tarjetas canónicas de Claude: Identidad, Preferencias visuales, Vista previa del tema, Temas guardados, Fuente de títulos, Colores con significado, Fondos/tarjetas/botones y Cabeceras/botones.
2. Cada control dispone de swatches predefinidos y selector libre de color (`<input type="color">`), así como sliders de intensidad porcentual cuando corresponda.
3. La tarjeta de Vista previa del tema responde inmediatamente a cualquier cambio visual.
4. Los temas guardados pueden guardarse, aplicarse, eliminarse y asignarse a «Partido» en vivo.
5. El botón de restablecer colores devuelve los colores extendidos a su estado automático sin borrar otros ajustes.
6. Todos los cambios se persisten en `state.settings` y `IndexedDB` / `localStorage` para mantenerse tras recargar.
7. Los tests automatizados pasan al 100% y `npm run check` con 0 errores.
