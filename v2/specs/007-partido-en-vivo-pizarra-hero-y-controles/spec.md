# Spec 007: Partido en Vivo — Pizarra Táctica Hero de 640px y Controles Homogeneizados

## 1. Contexto y Objetivos

Habiendo validado la experiencia táctica en **Preparación de Partido (Spec 006)** con pizarra hero de 640px, desplegables siempre visibles en doble columna holgada sin nombres cortados y popup de 340px, el objetivo de esta especificación es trasladar exactamente esos mismos estándares de calidad visual y operativa a **Partido en Vivo (`#partido`)** y a la vista del **Delegado (`#delegado`)**.

## 2. Requisitos del Sistema

### R1. Pizarra Táctica Hero en Partido en Vivo (`#live-tactics` y `#delegate-tactics`)
- En pantallas de portátil y estándar (< 1280px, incluyendo resolución 1024×886px), la cuadrícula `.cbx-live-main` debe priorizar la pizarra táctica para que alcance hasta 640px de ancho (`max-width: 640px; margin: 0 auto;`), evitando que una división forzada en 3 columnas la estrangule a ~230px.
- En pantallas ultra-anchas (>= 1280px), `.cbx-live-main` organiza las columnas de modo que la pizarra táctica conserve un tamaño generoso de 560px–640px (`minmax(560px, 640px)`).
- Estilo visual de la pizarra unificado con Preparación: fondo `#155438`, campo `#205f43`, fichas con aro claro `#cbd5e1`, dorsales `#0b2d20` y etiquetas legibles.

### R2. Herramientas Tácticas y Puestos Siempre Visibles
- Eliminar el contenedor `<details class="cbx-live-board-options">` que ocultaba las herramientas tácticas (`#live-tactics-tools`) y los puestos tras un desplegable cerrado.
- Disponer la barra de herramientas tácticas (`.live-tactics-tools`) directamente visible e interactiva (seleccionar, balón, 5 tipos de flecha, goma y borrar todo).
- Los selectores de puestos (`#live-tactics-slots`) se maquetan en una cuadrícula adaptativa `repeat(auto-fit, minmax(280px, 1fr))` de ~300px por selector, evitando el truncamiento de nombres de jugadores y suplentes.

### R3. Popup Táctico Ampliado y Formateo Limpio (`openTacticsPopup`)
- Actualizar `openTacticsPopup` en `js/app.js`:
  - Ampliar el ancho calculado de `240px` a `Math.min(340, window.innerWidth - 24)`.
  - Formatear opciones con separador canónico ` · `: `${x.number ? x.number + ' · ' : ''}${x.name}` tanto para titulares como para suplentes.
  - Asegurar `min-width: 320px !important;` y altura mínima de 44px en selectores.

### R4. Vista Delegado (`#delegate-tactics`)
- La pizarra delegada hereda la misma homogeneización visual, acceso directo a herramientas y popup cómodo sin cortes.

### R5. Calidad, Tests y No Regresión
- Mantener los 614 tests existentes al 100% en verde y añadir tests específicos para la nueva maquetación hero de Partido en Vivo en `tests/partido-en-vivo-pizarra-hero.test.js`.
- `npm run check` con 0 errores de sintaxis.
