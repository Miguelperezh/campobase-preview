# Especificación SDD 009: Partido en Vivo — Goles, Penaltis, Asistencias, Celebraciones y Cronología

## 1. Contexto y Objetivos
En el flujo de partido en vivo de CampoBase, el cuerpo técnico necesita una experiencia ágil, táctil y visualmente impecable para registrar los sucesos del encuentro sin perder la atención del juego.
Siguiendo los principios de la Constitución del proyecto y la doctrina formativa del documento de Sistemas de Fútbol 7, esta especificación define:
1. **Goles por tipo**: Diferenciación precisa entre jugada, penalti, falta directa y propia puerta (del rival o nuestra con selección de jugador infractor).
2. **Asistencias de gol**: Registro opcional del asistente para alimentar las estadísticas de la plantilla.
3. **Penaltis con doctrina táctica y especialistas**: Sugerencia prominente de los lanzadores de penaltis configurados en `setPieces` (`🎯 Especialista 1.º / 2.º`) y asignación automática del portero activo en penaltis en contra. Opciones de resultado (Gol, Parado, Fuera, Al palo/larguero) sin sumar al marcador si se falla.
4. **Celebraciones inmersivas**: Animación en pantalla de `¡GOOOL!` con goleador, minuto y marcador, y `¡PARADÓN!` en dorado/ámbar si el portero detiene un penalti.
5. **Cronología visual completa y marcha atrás**: Línea temporal enriquecida con iconos representativos, minutos formateados y anulación limpia ("✕ Anular") que descuenta goles y revierte estadísticas de forma inmediata.

---

## 2. Requisitos Funcionales

### R1. Registro Guiado de Goles Propios
- Al pulsar «Gol nuestro»:
  - Paso 1: Elegir tipo de gol: `De jugada` (`us-play`), `De penalti` (`us-penalty`), `De falta directa` (`us-free`) o `En propia puerta del rival` (`us-own`). Si es falta directa o penalti, destacar a los especialistas asignados en Ajustes.
  - Paso 2: Selección del goleador con dorsal, nombre y distintivo de puesto táctico según el sistema F7 activo. En `us-own` se asigna automáticamente como gol en propia meta sin requerir jugador propio.
  - Paso 3: Selector de asistencia opcional (excluyendo al goleador) y campo de detalle/observación.
  - Confirmación: Incrementa el marcador local/visitante según la condición de juego de CampoBase, crea el evento en la cronología y dispara la celebración `¡GOOOL!`.

### R2. Registro Guiado de Goles Rivales
- Al pulsar «Gol rival»:
  - Paso 1: Tipo de gol rival: `De jugada` (`rival-play`), `De penalti` (`rival-penalty`), `De falta` (`rival-free`) o `En propia puerta nuestra` (`rival-own`).
  - Paso 2: Si es `rival-own`, solicitar qué jugador propio cometió el infortunio para trazabilidad en acta. En los demás tipos, no requiere jugador propio.
  - Confirmación: Incrementa el marcador del rival y añade el evento correspondiente a la cronología.

### R3. Penaltis con Especialistas y Regla del Portero
- Al pulsar «Penalti»:
  - Paso 1: Selección entre `A favor` (`penalty-us`) o `En contra` (`penalty-rival`).
  - Paso 2 (A favor):
    - Muestra a los lanzadores con prioridad: los especialistas de penalti (`state.settings.setPieces?.penalties`) encabezan la lista con insignia visual `🎯 Especialista (1.º)` y `🎯 Especialista (2.º)`.
    - Permite elegir a cualquier otro jugador convocado/en campo.
  - Paso 2 (En contra):
    - Identifica y asigna automáticamente al portero que se encuentra en el césped en ese minuto según el sistema y rotaciones tácticas.
  - Paso 3: Selección del desenlace:
    - `Gol`: Suma gol al marcador y registra gol de penalti.
    - `Parado`: En penalti a favor registra penalti detenido por el meta rival (no suma); en penalti en contra registra parada del portero propio y dispara la celebración `¡PARADÓN!`.
    - `Fuera` / `Al palo`: No suman al marcador y quedan registrados como incidencia con su detalle exacto.

### R4. Celebraciones en Pantalla Completa
- Celebración `¡GOOOL!`: Pantalla superpuesta momentánea con tipografía heroica, nombre del goleador, minuto y marcador actualizado.
- Celebración `¡PARADÓN!`: Superpuesta con estilo dorado/ámbar reconociendo la intervención decisiva del portero.
- Temporización de 2,6 segundos con desvanecimiento suave o cierre táctil para no interrumpir el manejo del partido.

### R5. Cronología Ordenada y Marcha Atrás (Deshacer)
- Los eventos se muestran ordenados por minuto/segundo de juego con etiquetas e iconos específicos:
  - ⚽ Gol de jugada
  - 🎯⚽ Gol de penalti
  - ⚡⚽ Gol de falta directa
  - 🥅 Gol en propia puerta
  - ❌🎯 Penalti fallado (Fuera / Al palo)
  - 🧤🚫 Penalti parado (por el portero)
  - 🧤⚽ Penalti encajado
  - 🟨 Tarjeta amarilla / 🟥 Tarjeta roja
  - 🩹 Lesión / 📋 Incidencia
- Cada evento cuenta con un botón directo `✕ Anular` que:
  - Si es gol propio o rival, descuenta exactamente 1 tanto del marcador.
  - Si tiene asistencias o estadísticas vinculadas, las retira de las estadísticas derivadas.
  - Elimina el evento de `state.timer.details` y persiste el estado en IndexedDB (`put('timers', state.timer)`).
  - Repinta de inmediato el marcador, cronología y vista del delegado.

---

## 3. Criterios de Aceptación
1. Registro de gol propio suma al marcador y permite asistente opcional.
2. Gol en propia meta del rival suma a CampoBase como `Gol P.P.`.
3. Gol rival suma al casillero rival correctamente.
4. En penalti a favor, los especialistas designados en `setPieces.penalties` aparecen en primera posición y resaltados.
5. En penalti detenido por nuestro portero, se dispara la celebración `¡PARADÓN!` y suma a las intervenciones del portero.
6. Penalti fallado (fuera o al palo) no incrementa el marcador.
7. Pulsar `✕ Anular` en cualquier gol descuenta el marcador inmediatamente.
8. La suite completa de tests automatizados pasa al 100% (624 tests existentes + nuevos tests).
