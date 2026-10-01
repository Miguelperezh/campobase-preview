# Plan de Arquitectura: 003 - Catálogo, Tarjetas y Filtros Multidimensionales de Ejercicios F7

- **Identificador:** `003-catalogo-tarjetas-filtros-ejercicios-f7`
- **Fecha:** 01/10/2026
- **Estado:** Implementado

---

## 1. Diseño Técnico y Arquitectura

1. **Estructura del Componente de Tarjeta:**
   - La función `renderExercises()` en `js/app.js` genera cada tarjeta con la plantilla `.cbx-exercise-card`.
   - La cabecera visual incluye un contenedor `cbx-card-thumb-wrap` que aloja la imagen lazy (`loading="lazy"`), los badges de formato (`cbx-card-badge-demo`, `cbx-card-badge-realvideo`) y el botón táctil de favorito `cbx-card-star-btn`.
   - El cuerpo de la tarjeta (`cbx-card-body`) organiza las píldoras de métricas (`cbx-card-pill-players`, `cbx-card-pill-dur`, `cbx-card-pill-diff`) y los botones de acción (`cbx-card-btn-demo`, `cbx-card-btn-add`).

2. **Flujo de Delegación de Eventos en Acciones:**
   - Clic en `.view-exercise` o `.cbx-card-btn-demo`: Invoca `showExerciseDetail(exerciseId)` para abrir el modal `#exercise-detail-dialog` con el reproductor interactivo y las 17 secciones oficiales.
   - Clic en `.add-exercise-to-session` o `.cbx-card-btn-add`: Si `#session-builder` está visible en el DOM, inserta el ejercicio en `sessionDraftBlocks`; de lo contrario, invoca `openAddToSession(exerciseId)`, abriendo `#add-session-dialog` con la fecha y hora por defecto.
   - Clic en `.favorite-exercise` o `.cbx-card-star-btn`: Invierte el estado booleano `item.favorite`, actualiza en IndexedDB (`put('settings', item)`), despacha `refresh(true)` y repinta la vista.

3. **Filtrado Multidimensional:**
   - Los chips `.cbx-dim-chip` actualizan el campo oculto `dimension` en `#exercise-filters`.
   - `filterExercises` en `js/training-domain.js` evalúa en cascada formato, categoría, jugadores, material, dificultad, duración, dimensión y texto.

---

## 2. Archivos Afectados

- `js/app.js`: Renderizado de tarjetas (`renderExercises`), gestión de filtros y escuchadores de eventos para `view-exercise`, `add-exercise-to-session` y `favorite-exercise`.
- `js/training-domain.js`: Lógica de filtrado en memoria (`filterExercises`, `matchesDimension`).
- `js/ejercicio-viewer.js`: Visor detallado oficial de 17 secciones y botón de impresión.
- `index.html`: Maquetación de la cabecera, tabs de biblioteca y formulario `#exercise-filters`.
- `css/claude-entreno.css`: Estilos visuales de tarjetas, chips y estados responsivos.

---

## 3. Estrategia de Verificación

- Verificación completa con `npm run check`.
- Ejecución de los 603 tests con `npm test`.
