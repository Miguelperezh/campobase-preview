# Tareas SDD 009: Partido en Vivo — Goles, Penaltis, Asistencias, Celebraciones y Cronología

- [x] **T1. Especialistas a Balón Parado en Penaltis y Faltas:**
  - Priorizar y destacar a los lanzadores de penaltis primario y secundario en el modal de acción en vivo con insignia `🎯 Especialista`.
  - Priorizar a los lanzadores de faltas directas cuando el tipo de gol sea `us-free`.

- [x] **T2. Regla del Portero y Penaltis en Contra:**
  - Detectar el portero activo en campo según el tramo de minutos y formación táctica del sistema F7.
  - Asignar al portero automáticamente al registrar penaltis en contra.
  - Ofrecer desenlaces: Gol rival, Parado por el portero, Fuera, Al palo.

- [x] **T3. Celebraciones Visuales Enriquecidas:**
  - Extender `showLiveCelebration` para incluir el marcador actualizado, el minuto de juego y el nombre del protagonista.
  - Celebración dorada para `¡PARADÓN!` y verde/esmeralda para `¡GOOOL!`.

- [x] **T4. Cronología Enriquecida y Reversión Inmediata (Deshacer):**
  - Iconos específicos en cada fila de evento (falta directa, penalti, propia meta, tarjetas, incidencias).
  - Asegurar que `.remove-live-event-btn` descuenta el gol correspondiente del marcador en `state.timer` (`homeScore` o `awayScore`) y persiste de inmediato en `timers`.

- [x] **T5. Suite de Tests Automatizados (`tests/partido-en-vivo-eventos.test.js`):**
  - Test de ordenación de especialistas.
  - Test de registro de penalti parado y gol.
  - Test de anulación de gol con reversión de marcador.
  - Test de consistencia con los 624 tests existentes.

- [x] **T6. Sincronización, Documentación en `agente.md` y Despliegue:**
  - Registro de la Entrega v66 en `agente.md`.
  - Despliegue en `campobase-preview-deploy/v2/`.
  - Verificación en GitHub Pages.
