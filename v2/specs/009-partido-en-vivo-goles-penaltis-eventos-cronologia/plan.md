# Plan de Arquitectura SDD 009: Partido en Vivo — Goles, Penaltis, Asistencias, Celebraciones y Cronología

## 1. Arquitectura Técnica y Módulos Afectados

### Archivos Involucrados:
- `js/app.js`:
  - `openClaudeLiveAction(mode)` y `renderClaudeLiveAction()`:
    - Integración de especialistas `setPieces.penalties` (primario y secundario) y `setPieces.freeKicks` con ordenamiento prioritario y distintivo `🎯 Especialista` en paso 2.
    - Detección precisa del portero activo en campo para penaltis en contra.
    - Refuerzo de la selección de goleador y asistente con puesto táctico del sistema F7 activo (`liveTactic` o `prep`).
  - `confirmClaudeLiveAction()`:
    - Asignación correcta de tipos de evento (`goal`, `penalty_goal`, `penalty_miss`, `penalty_saved`, `penalty_conceded`, `opponent_goal`, `own_goal`).
    - Actualización automática del marcador en `state.timer` (`homeScore` / `awayScore`).
    - Activación de celebración enriquecida (`showLiveCelebration`) con datos de marcador y minuto.
  - `showLiveCelebration(title, name, isSave, scoreText, minuteText)`:
    - Presentación visual de la celebración con tipografía y datos del tanto/parada.
  - `liveDetailsMarkup()` y eventos en cronología:
    - Renderizado con iconos enriquecidos para goles de falta, goles de penalti y paradas.
    - Manejador de evento delegado para `.remove-live-event-btn` asegurando que la reversión del marcador descuente según el tipo de gol eliminado y guarde `state.timer`.
- `css/claude-partido.css`:
  - Estilos para insignias de especialista en el diálogo modal de acciones (`.cbx-la-specialist-badge`).
  - Estilos de celebración enriquecida (`.cbx-live-celebration-meta`, `.cbx-live-celebration-score`).
  - Estilos para la lista cronológica de eventos (`.live-event-row`, botón `.remove-live-event-btn`).
- `tests/partido-en-vivo-eventos.test.js`:
  - Suite de pruebas de integración y unitarias para validar las funciones de registro de goles, penaltis, anulación y reversión de marcador.

## 2. Estrategia de Cero Regresiones
- No modificar la estructura de datos guardada en `state.timer.details` (se conservan arrays `goals`, `cards`, `injuries`, `incidents`).
- Mantener la compatibilidad del motor de eventos tradicional para garantizar que la vista del delegado y reportes previos no se alteren.
- Respetar los 624 tests existentes.
