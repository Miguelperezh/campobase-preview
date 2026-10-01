# Especificación: 003 - Catálogo, Tarjetas y Filtros Multidimensionales de Ejercicios F7

- **Identificador:** `003-catalogo-tarjetas-filtros-ejercicios-f7`
- **Estado:** Validado / Implementado
- **Fecha:** 01/10/2026
- **Módulo:** Ejercicios (`#ejercicios`)

---

## 1. Contexto y Objetivos

- **Objetivo:** Garantizar que el catálogo completo de ejercicios de Fútbol 7 opere con la máxima fluidez, accesibilidad táctil y fidelidad metodológica bajo el diseño Claude.
- **Alcance Funcional:**
  1. **Tarjeta de Ejercicio en Rejilla (`.cbx-exercise-card`):**
     - Portada visual: miniatura de campo o fotograma gráfico pausado del ejercicio (`cbx-card-thumb-wrap`).
     - Insignias de demostración: `«Ver demostración · GIF/MP4»` y `«Vídeo real»` (en los ejercicios que disponen de metraje grabado con humanos).
     - Botón de estrella de favorito reactivo (`.cbx-card-star-btn`) con persistencia atómica en IndexedDB.
     - Píldoras de métricas clave: número de jugadores (`.cbx-card-pill-players`), duración en minutos (`.cbx-card-pill-dur`) y nivel de dificultad (`.cbx-card-pill-diff` con código de color semántico).
     - Datos rápidos: categoría, formato de juego (F7, F11) y material requerido.
     - Acciones rápidas en la tarjeta:
       - Botón `[Ver demostración]` (`.cbx-card-btn-demo`): Abre el visor de ejercicio completo con sus 17 secciones y reproductor.
       - Botón `[+ Añadir a sesión]` (`.cbx-card-btn-add`): Abre el diálogo modal `#add-session-dialog` para incorporar el ejercicio a una sesión existente o planificar una nueva en un clic.
  2. **Filtros Multidimensionales F7:**
     - Barra de chips de dimensiones tácticas (`.cbx-dim-chip`): `Todas`, `⚽ Táctica`, `⚡ Técnica / Tecnificación`, `💪 Física`, `🎮 Lúdico / Juegos`, `🎯 Finalización`, `🔥 Calentamiento`, `🧤 Porteros`.
     - Buscador por texto en tiempo real (`#cbx-filter-search`).
     - Selectores específicos: Formato (F7, F11, Todos), Dificultad, Rango de Jugadores, Material y Duración.
     - Conmutadores rápidos: `[★ Solo favoritos]` (`#cbx-filter-fav`) y `[▶ Solo con vídeo]` (`#cbx-filter-video`).
     - Contador dinámico de resultados (`#cbx-exercise-count`) y botón para restablecer filtros (`#cbx-clear-exercise-filters`).
  3. **Pestañas de Biblioteca:**
     - Conmutador entre `«Biblioteca»` (catálogo global) y `«Mis ejercicios»` (ejercicios diseñados por el entrenador).

---

## 2. Requisitos Funcionales

- **RF-1 (Tarjeta de Rejilla Claude):** Cada ejercicio en la biblioteca se presenta con `.cbx-exercise-card` conteniendo la miniatura, badges de vídeo, botón favorito, título clicable, metadatos y la botonera inferior de dos acciones: `[Ver demostración]` y `[+ Añadir a sesión]`.
- **RF-2 (Integración con el Selector de Sesión):** Al hacer clic en `[+ Añadir a sesión]`, si el builder de sesión está abierto en segundo plano, añade el ejercicio de inmediato con feedback toast; si no, abre el modal `#add-session-dialog` preseleccionando el ejercicio.
- **RF-3 (Filtro por Dimensión Táctica F7):** Al seleccionar un chip `.cbx-dim-chip`, la función `filterExercises` en `js/training-domain.js` evalúa la dimensión en categorías, contenidos y etiquetas tácticas sin excluir ejercicios válidos.
- **RF-4 (Rendimiento Local-First):** El filtrado y ordenación de más de 1000 ejercicios se ejecuta en memoria y de forma síncrona en menos de 15ms sin peticiones bloqueantes de red.
- **RF-5 (Impresión Individual):** Dentro del visor de ejercicio abierto por `[Ver demostración]`, el botón `[🖨️ Imprimir Ficha]` ejecuta la exportación Claude A4 de 1 página con campo y notas pautadas.

---

## 3. Criterios de Aceptación

1. En la pestaña `#ejercicios`, cada tarjeta muestra nítidamente sus píldoras métricas (`jug.`, `′`, `dificultad`) y sus dos botones inferiores `[Ver demostración]` y `[+ Añadir a sesión]`.
2. Al pulsar `[+ Añadir a sesión]` desde cualquier tarjeta de la rejilla, el diálogo `#add-session-dialog` se abre inmediatamente permitiendo elegir sesión existente o crear una nueva.
3. Al pulsar cualquier chip de dimensión (ej. `⚡ Técnica`), las tarjetas se actualizan al instante y el contador `#cbx-exercise-count` refleja el número exacto.
4. Al pulsar `★`, el ejercicio se marca como favorito, se persiste en IndexedDB y el filtro `Solo favoritos` lo incluye fielmente.
5. Los 603 tests de la suite pasan al 100% en verde y `npm run check` permanece limpio.
