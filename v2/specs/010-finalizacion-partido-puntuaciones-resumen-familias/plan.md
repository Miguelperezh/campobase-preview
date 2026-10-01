# Plan Técnico SDD 010: Arquitectura de Finalización, Resumen Familias y Puntuaciones

## 1. Módulos y Responsabilidades

### 1.1 `js/whatsapp-suite.js`
- Exportar `buildWhatsAppMatchFamilySummary({ match, players, callup, teamName })`:
  - Recibe el partido completado, la lista de jugadores y la convocatoria.
  - Genera el texto con emojis formativos, marcador, desglose de goles propios y lista de minutos de juego.
  - Garantiza omisión absoluta de valoraciones (1–5), notas disciplinarias o comentarios técnicos internos.

### 1.2 `js/app.js`
- Modificar el flujo de `finishMatch()`:
  - Cuando se finaliza el partido, persistir el partido como finalizado y registrar asistencia de forma atómica en IndexedDB.
  - Establecer `state.recentFinishedMatchId = match.id`.
  - En `renderLive()`, si `state.recentFinishedMatchId` está presente (y no hay un partido activo nuevo en `state.timer`), renderizar la vista de finalización (`renderPostMatchSummary(match)`).
  - Incluir el generador de la tarjeta de familias, el panel de puntuación 1–5 con selección visual de estrellas/números y las acciones de WhatsApp, impresión y reapertura.
  - Exponer `reopenMatch(matchId)` para restaurar el temporizador si el entrenador necesita ajustar el resultado o las incidencias.

### 1.3 `css/claude-partido.css`
- Maquetar las tarjetas de post-partido al estilo Claude:
  - `.cbx-postmatch-card`: Contenedor principal centrado (hasta 720px) con marcador hero.
  - `.cbx-family-summary-card`: Tarjeta con gradiente verde profundo (`linear-gradient(160deg, #063d27, #134e38)`), texto blanco puro y botón verde WhatsApp.
  - `.cbx-ratings-card`: Tarjeta con borde ámbar `#f59e0b`, encabezado y lista de convocados con botones circulares 1–5 interactivos (`.cbx-rating-btn`).
  - `.cbx-postmatch-actions`: Fila de botones para imprimir acta, ver calendario y reabrir partido.

### 1.4 `tests/partido-finalizacion-resumen-puntuaciones.test.js`
- Nueva suite de tests para:
  1. `buildWhatsAppMatchFamilySummary`: Verifica estructura, goles, minutos y exclusión de datos privados.
  2. Aislamiento de permisos: Verifica que el delegado no pueda acceder a calificar jugadores.
  3. Guardado de puntuaciones: Verifica que las notas 1–5 impacten en `player.ratingHistory` y recalculen la media sin romper historial.
  4. Reapertura de partido y no doble conteo de asistencias/minutos.

---

## 2. Aislamiento y No Regresión
- No alterar la base de datos IndexedDB ni estructuras existentes.
- Mantener intacto el cálculo de minutos acumulados en `accumulateSeasonMinutes`.
- Las 627 pruebas existentes de la suite continuarán pasando.
