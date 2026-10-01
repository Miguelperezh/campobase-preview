# Especificación: 005 - Ampliación de Pizarra Táctica de Cambios y Corrección de Desplegables de Nombres

- **Identificador:** `005-pizarra-cambios-tamano-desplegables`
- **Estado:** Completado
- **Fecha:** 01/10/2026
- **Módulo:** Preparación de partido (`#preparacion`), Partido en vivo (`#partido`) y Sustituciones de calendario (`calendar-substitutions-v2`)

---

## 1. Contexto y Objetivos

- **Feedback del Usuario:**
  *"validado todo. salvo que la pizarra se ve muy pequeña la de los cambios, y en los cambios cuando configuro las ventanas y minutos de cambio en el desplegable se ve nombres cortados, por lo demás todo bien"*
- **Objetivos Principales:**
  1. **Ampliación de la Pizarra Táctica en el Plan de Cambios (`#prep-board`):**
     - La pizarra de cambios estaba confinada en una columna de `0.95fr` y con un tope estricto de `max-width: 420px;`. Esto reducía en exceso las fichas y las etiquetas de los jugadores en pantallas de escritorio y portátiles.
     - Redimensionar el contenedor de la pizarra (`.board-wrap` y `#prep-board`) hasta `640px` (aumento de más del 120% en superficie visual) y reequilibrar la cuadrícula del editor para priorizar la pizarra.
     - Añadir botón de ampliación a pantalla completa / lightbox (`⛶ Ampliar pizarra`) para permitir visualizar la pizarra a resolución completa (`min(92vw, 800px)`).
  2. **Corrección de Nombres Cortados en los Desplegables de Cambios:**
     - En `#preparacion .cbx-prep-slots-details .live-tactics-slots`: La maquetación de 2 columnas forzaba que cada selector de puesto midiera ~180px de ancho, truncando los nombres de jugadores como `"12 Alejandro Pedrós (Suplente)"`. Convertir la lista a 1 columna completa (con más de 580px de ancho disponible), aumentar tipografía a `13.5px` y añadir `text-overflow: ellipsis`.
     - En el popup flotante táctico (`#prep-popup`): Aumentar el ancho mínimo y calculado de `240px` a `340px`, garantizando que todos los nombres y dorsales quepan sin cortes.
     - En el diálogo de cambios de calendario (`#calendar-substitutions-v2-dialog`): Incrementar el ancho de la ventana modal de `560px` a `820px` y estilizar los desplegables de `"Quién sale"`, `"Quién entra"` y cambios de posición para que cada columna ofrezca más de 360px útiles, eliminando cualquier truncamiento de nombres.

---

## 2. Requisitos Funcionales

- **RF-1 (Pizarra de Cambios Generosa y Visible):** En `#preparacion`, `#prep-board` y `.board-wrap` deben alcanzar hasta `640px` de ancho en pantallas de ordenador y tablet, manteniendo una relación de aspecto `1:1` con fichas grandes y textos nítidos.
- **RF-2 (Botón de Ampliación de Pizarra):** Disponer de un botón `⛶ Ampliar pizarra` (`#prep-full-btn`) en la barra táctica de preparación que abra la pizarra en modo ampliado dentro del lightbox existente.
- **RF-3 (Desplegables de Puestos en Preparación sin Cortes):** `#prep-slots` debe maquetar los puestos de la alineación a ancho completo con `grid-template-columns: 1fr`, con fuentes de `13.5px` legibles, padding holgado y formato `${dorsal} · ${nombre}`.
- **RF-4 (Popup Flotante Enriquecido):** `#prep-popup` debe calcular un ancho de al menos `340px` y posicionarse dentro de los márgenes de pantalla, mostrando el selector sin texto truncado.
- **RF-5 (Modal de Cambios de Calendario a 820px):** `#calendar-substitutions-v2-dialog` debe tener `width: min(820px, calc(100% - 2rem))` y sus `.form-row` con `select` deben dar espacio amplio a los nombres completos de los futbolistas convocados.

---

## 3. Criterios de Aceptación

1. En `#preparacion`, la pizarra táctica `#prep-board` mide entre `560px` y `640px` de ancho en resoluciones de escritorio (>1000px), viéndose amplia y cómoda para arrastrar y visualizar.
2. Al pulsar `[⛶ Ampliar pizarra]`, se abre el lightbox con la pizarra táctica ampliada interactiva.
3. En la sección *Ajustar jugadores por puesto* de `#preparacion`, ningún nombre de jugador ni etiqueta de `(Suplente)` aparece cortado ni comprimido.
4. Al hacer clic sobre cualquier jugador en la pizarra de preparación, el popup `#prep-popup` mide al menos 320px de ancho y el desplegable muestra el nombre íntegro.
5. Al abrir el diálogo de *Alineación, cambios y tácticas* desde el calendario, los campos de selección de jugador (*Quién sale*, *Quién entra*) miden al menos 320px cada uno y no cortan ningún apellido.
6. La suite completa de tests de Node.js pasa al 100% y `npm run check` no arroja advertencias ni errores.
