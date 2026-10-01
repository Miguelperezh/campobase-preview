# Especificación SDD 010: Finalización de Partido, Puntuaciones 1–5 y Resumen para Familias

## 1. Contexto y Objetivos
Siguiendo las secciones **AK** (*Finalización del partido*) y **AL** (*Puntuaciones 1–5*) de la Especificación Maestra (`01_ESPECIFICACION_TOTAL_NO_RESUMIDA.md`) y el diseño canónico de Claude (`CampoBase App.dc.html`), tras dar por concluido un partido el cuerpo técnico necesita:
1. **Cierre de flujo correcto e intuitivo**: No expulsar al usuario a una pantalla vacía, sino presentar la vista post-partido con resultado oficial, actas y opciones operativas.
2. **Resumen para las familias y WhatsApp**:
   - Tarjeta destacada con gradiente esmeralda Claude (`Resumen para las familias`).
   - Marcador final oficial (`Unión Viera X – Y Rival`).
   - Lista clara de goleadores del equipo.
   - Lista formativa de minutos disputados por cada convocado ordenados por dorsal.
   - Botón directo para enviar el resumen por WhatsApp a las familias (con formato limpio y sin ningún dato técnico interno ni puntuaciones).
3. **Puntuaciones 1–5 de convocados**:
   - Tarjeta enmarcada en ámbar Claude para calificar del 1 al 5 a los jugadores convocados.
   - Opcional y no bloqueante (permite calificar en el acto o hacerlo más tarde desde el detalle del partido).
   - Privacidad estricta: Solo el entrenador (Migue) puede asignar, editar o guardar puntuaciones. El delegado solo tiene permiso de lectura o no ve el panel de puntuación.
   - Impacto inmediato en la ficha individual de los jugadores y en la media de la liga/temporada.
4. **Reversibilidad y no doble conteo**:
   - Posibilidad de reabrir el partido si se finalizó por error o se necesita ajustar el cronómetro/acta.
   - Las estadísticas de minutos y goles se acumulan una sola vez por partido finalizado, previniendo duplicidades.

---

## 2. Requisitos Funcionales

### R1. Vista Post-Partido Inmediata en Vivo (`#partido`)
- Al pulsar «Final del partido» en el 2.º tiempo:
  - Se consolida el resultado final (`goalsFor`, `goalsAgainst`).
  - Se guardan los minutos disputados acumulados en `match.minuteTotals`.
  - Se registra la asistencia automática en el módulo correspondiente.
  - En lugar de dejar la pantalla de partido en blanco con un mensaje genérico, se renderiza la pantalla de finalización que incluye:
    - Cabecera con resultado final definitivo y fecha.
    - Tarjeta de **Resumen para las familias**.
    - Tarjeta de **Puntuar convocados** (si el usuario es el entrenador).
    - Botones de acción: `🖨️ Imprimir plan y acta`, `📅 Ver en Calendario`, `🔄 Reabrir partido en vivo`.

### R2. Resumen para las Familias y Generador WhatsApp
- Tarjeta visual Claude con fondo `linear-gradient(160deg, var(--hero), #1e523d)` y texto blanco nítido.
- Contenido:
  - Marcador: `${equipo} ${gf} – ${ga} ${rival}`.
  - Goleadores a favor agrupados por nombre y número de goles.
  - Minutos jugados de todos los convocados ordenados por dorsal (`${nombre} ${minutos}′`).
- Botón verde `📲 Enviar resumen por WhatsApp`:
  - Dispara `buildWhatsAppMatchFamilySummary({ match, players, callup, teamName })`.
  - Abre WhatsApp con el texto pre-redactado y copia al portapapeles.
  - **Filtro de privacidad:** No incluye notas 1–5, ni incidencias disciplinarias internas, ni notas tácticas privadas.

### R3. Panel de Puntuaciones 1–5
- Visible para el entrenador (`roleCanUseOwnerFeatures(state.role)`).
- Bloqueado o ausente para el delegado (`delegate-mode`).
- Para cada jugador convocado:
  - Fila con dorsal, nombre y 5 botones interactivos de nota (`1`, `2`, `3`, `4`, `5`).
  - Al pulsar una nota, queda marcada visualmente en dorado/ámbar activo.
- Botón `Guardar puntuaciones`:
  - Valida las notas, actualiza `match.ratings`, añade la entrada en `player.ratingHistory` y recalcula la media de cada jugador.
  - Notificación toast: *«Puntuaciones guardadas en el partido y en cada ficha»*.
- Botón `Puntuar más tarde`:
  - Cierra el panel de calificación sin exigir puntuar en ese instante.

### R4. Reabrir Partido y Prevención de Doble Conteo
- Botón `🔄 Reabrir partido`:
  - Restaura `state.timer` con el estado y cronómetro del partido finalizado (`phase: 'second_half'`, pausado).
  - Permite corregir incidencias, minutos o goles.
  - Al volver a finalizar, reemplaza los registros en IndexedDB de forma atómica sin duplicar asistencias ni duplicar minutos en la temporada.

---

## 3. Criterios de Aceptación
1. Al finalizar el 2.º tiempo, se muestra la pantalla de post-partido con el resumen para familias y las puntuaciones.
2. El resumen para familias muestra los goles y minutos correctos de los convocados.
3. El generador de WhatsApp produce un mensaje limpio para padres sin datos privados ni notas.
4. El entrenador puede puntuar del 1 al 5 y las notas se reflejan en la ficha y media de los jugadores.
5. El delegado no puede calificar ni modificar notas.
6. Se puede reabrir el partido y corregir incidencias sin duplicar estadísticas.
7. Los tests existentes (627) y nuevos tests automatizados pasan al 100%.
