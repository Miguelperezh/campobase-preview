# Plan Técnico SDD 011: Arquitectura de Calendario y Filtros

## 1. Módulos y Responsabilidades

### 1.1 `js/app.js`
- **Variables de Estado del Calendario**:
  - `claudeCalendarMonth`: Mes activo en la cuadrícula mensual (persiste entre navegaciones).
  - `claudeCalendarFilter`: Filtro activo (`'all'`, `'league'`, `'friendly'`, `'tournament'`, `'training'`).
  - `claudeCalendarSelectedDay`: Día seleccionado en formato `YYYY-MM-DD` (o `null`).
- **Función `renderClaudeCalendar()`**:
  - Generación de celdas del mes.
  - Generación del contenedor `.cbx-cal-dots` con soporte para `<i class="has-match"></i>` y `<i class="has-training"></i>` simultáneos.
  - Marcado de `.is-today` y `.is-selected`.
- **Función `renderCalendarFilterBar()`**:
  - Renderiza los chips de filtro con indicador de conteo o estado activo (`aria-pressed="true"`).
- **Función `renderTrainingCalendarCard(trainingOrSession)`**:
  - Renderiza la tarjeta formateada de entrenamiento para el calendario.
- **Función `renderMatches()`**:
  - Integra la cabecera, la cuadrícula mensual, la barra de filtros y la lista particionada.
  - Filtra los partidos y entrenamientos según `claudeCalendarFilter` y `claudeCalendarSelectedDay`.
  - Muestra partidos en juego en primer lugar.
  - Ordena próximos cronológicamente ascendente y jugados cronológicamente descendente.

### 1.2 `css/claude-partido.css`
- Estilos de `.cbx-calendar-filter-bar` y botones de filtro con pills interactivos.
- Estilos para `.cbx-cal-dots`: contenedor flexible horizontal centrado con puntos de 5px (`#c8102e` para partido, `#10b981` para entreno).
- Estilos para `.cbx-calendar-live-badge`: indicador animado de partido en juego.
- Estilos para `.cbx-calendar-training`: tarjeta de entrenamiento adaptada a la estética del calendario Claude.

### 1.3 `tests/calendario-filtros-vista-mensual.test.js`
- Pruebas automatizadas para:
  1. Renderizado de puntos dobles cuando coinciden partido y entrenamiento en la misma fecha.
  2. Filtrado correcto por liga, amistosos, torneos y entrenamientos.
  3. Ordenación de partidos próximos (ascendente) y jugados (descendente).
  4. Respeto de permisos del delegado.

---

## 2. Aislamiento y Control de Regresión
- No modificar el esquema de base de datos ni los identificadores de eventos.
- Asegurar que `partitionAndSortMatches` y las sincronizaciones con IndexedDB continúen operando al 100%.
