# Especificación SDD 011: Calendario — Vista Mensual, Puntos Múltiples, Filtros y Lista Integrada

## 1. Contexto y Objetivos
Siguiendo la sección **AM** (*Calendario*) de la Especificación Maestra (`01_ESPECIFICACION_TOTAL_NO_RESUMIDA.md`) y el diseño canónico de Claude (`CampoBase App.dc.html`), la pestaña Calendario es el eje temporal de la temporada del equipo.
Esta especificación define:
1. **Vista mensual interactiva**:
   - Cuadrícula mensual con navegación (Mes anterior, Hoy, Mes siguiente).
   - Indicadores de puntos diferenciados para partidos (rojo `#c8102e`) y entrenamientos (verde `#10b981`).
   - Soporte para **puntos simultáneos** cuando coinciden partido y entrenamiento en el mismo día.
   - Resaltado distintivo de **Hoy** y selección interactiva de día para filtrar o desplazarse a los eventos de esa fecha.
2. **Barra de filtros de competición y tipo**:
   - Filtros inmediatos: `Todos`, `Liga`, `Amistosos / Pretemporada`, `Torneos`, `Entrenamientos`.
   - Filtrado reactivo en tiempo real sin recargar página y manteniendo la memoria del mes visible.
3. **Lista de eventos cronológica y particionada**:
   - **Partido en juego**: Si hay un partido en disputa, se destaca en la parte superior con distintivo en vivo `🔴 EN JUEGO` y marcador en tiempo real.
   - **Próximos eventos**: Partidos y entrenamientos futuros ordenados cronológicamente (el más cercano primero).
   - **Eventos jugados / completados**:
     - Agrupados en acordeón plegable con recuento.
     - Ordenados en orden **descendente por fecha** (el último jugado en la parte superior).
     - Marcador formateado con estilo y color formativo: victoria (verde), empate (neutro) o derrota (rojo tenue).
4. **Acciones completas en tarjetas**:
   - Botón `+ Partido` en la cabecera.
   - En partidos: `Convocar`, `Preparar`, `🖨️ Imprimir plan`, `📱 WhatsApp`, `Ver detalle`, `Editar` y `Borrar`.
   - En partidos jugados: `Editar minutos y puntuaciones` y `Ver detalle`.
   - En entrenamientos: `🖨️ Imprimir sesión` y `📱 WhatsApp`.
5. **Aislamiento de permisos de Delegado**:
   - El delegado visualiza el calendario solo si dispone de permiso activado por Migue.
   - Los botones de edición, borrado y creación de partidos se reservan al entrenador salvo permiso explícito.

---

## 2. Requisitos Funcionales

### R1. Vista Mensual y Puntos Simultáneos
- En el calendario mensual:
  - Cada celda de día muestra el número y un contenedor `.cbx-cal-dots`.
  - Si hay partido ese día: punto rojo `.has-match`.
  - Si hay entrenamiento ese día: punto verde `.has-training`.
  - Si hay ambos el mismo día: se renderizan ambos puntos en paralelo, sin solaparse ni anularse.
  - Al hacer clic en un día del mes:
    - Marca la celda con `.is-selected`.
    - Filtra la lista inferior para mostrar los eventos de esa fecha específica, o desplaza suavemente la vista hasta la tarjeta correspondiente.
    - Si se pulsa de nuevo el día seleccionado, deselecciona y muestra todos los eventos del filtro activo.

### R2. Barra de Filtros por Competición y Tipo
- Se incorpora una barra de chips de filtro (`.cbx-calendar-filter-bar`):
  - `Todos` (muestra partidos y entrenos).
  - `Liga` (partidos oficiales de liga).
  - `Amistosos` (partidos amistosos / pretemporada).
  - `Torneos` (partidos de torneo).
  - `Entrenos` (sesiones y entrenamientos programados).
- La selección de filtro es instantánea, actualiza la lista inferior y no altera el mes que se está explorando en el calendario.

### R3. Organización de la Lista de Eventos
- **En Juego:** Si un partido tiene `status === 'in_progress'` o coincide con `state.timer?.matchId`, encabeza la lista con tarjeta destacada y badge `🔴 EN DIRECTO`.
- **Próximos:**
  - Partidos con `status !== 'finished'` ordenados de más cercano a más lejano en el tiempo.
  - Entrenamientos próximos de la semana o mes.
- **Jugados:**
  - Partidos con `status === 'finished'` agrupados bajo acordeón `<details class="played-matches-accordion">`.
  - Ordenados cronológicamente descendente (el más reciente arriba).
  - Marcador coloreado con clases `.win` (verde), `.draw` (neutro), `.loss` (rojo tenue).

### R4. Tarjetas de Entrenamientos Integradas en Calendario
- En el filtro `Todos` o `Entrenos`, las sesiones de entrenamiento de `state.trainingSessions` o entrenamientos de `state.trainings` se presentan como tarjetas estructuradas (`.cbx-calendar-training`):
  - Fecha, día de la semana y mes.
  - Hora y campo de juego (ej. `17:00 · Campo 1`).
  - Nombre del bloque / objetivo (ej. `Finalización y centros`).
  - Botón directo `🖨️ Imprimir sesión` y `📱 WhatsApp`.

### R5. Privacidad y Permisos del Delegado
- El delegado solo accede a Calendario si `state.settings.delegatePermissions?.calendario === true`.
- Si `state.role === 'delegate'`, se ocultan los botones de borrar y editar partidos, manteniendo accesibles las acciones de consulta y visualización.

---

## 3. Criterios de Aceptación
1. El calendario mensual renderiza ambos puntos (rojo y verde) cuando coinciden partido y entrenamiento el mismo día.
2. Los botones de filtro (`Todos`, `Liga`, `Amistosos`, `Torneos`, `Entrenos`) filtran la lista de forma reactiva sin recargas.
3. Al tocar un día con evento, se selecciona y resalta la fecha.
4. Partidos próximos aparecen ordenados con el más cercano arriba; partidos jugados aparecen con el más reciente arriba.
5. El marcador de partidos jugados refleja las clases cromáticas de resultado (`win`, `draw`, `loss`).
6. Si un partido está en juego, se destaca prioritariamente.
7. Las sesiones de entrenamiento aparecen formateadas con acceso a imprimir y WhatsApp.
8. Los tests automatizados (631 existentes + nuevos) pasan al 100% y `npm run check` limpio.
