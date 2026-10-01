# Spec 008: Plan de Partido — Impresión Profesional en Ficha A4 y Explicación Detallada de Cambios

## 1. Contexto y Problema Detectado

El entrenador y el cuerpo técnico planifican minuciosamente las alineaciones titulares, las ventanas de cambio por minutos y el reparto formativo de minutos en **Preparación de Partido (`#preparacion`)**, y consultan este plan durante el directo en **Partido en Vivo (`#partido`)** y en la **Vista Delegado (`#delegado`)**.

Sin embargo, el sistema carecía de una vía para **imprimir el Plan de Partido** o exportarlo a PDF para llevarlo en papel a la carpeta con pinza en el campo, compartirlo con el delegado o conservarlo en el histórico físico del cuerpo técnico. Asimismo, el usuario solicita expresamente que el plan impreso esté **"muy bien explicado"**: debe presentar un cronograma didáctico, claro e inequívoco donde se entienda al instante qué ocurre en cada ventana (quién entra, quién sale, qué puesto ocupa, qué movimientos internos se producen y cómo queda el equipo en el césped y en el banquillo).

## 2. Requisitos del Sistema

### R1. Botones de Impresión del Plan en Toda la Plataforma
- **En Preparación (`#preparacion`):**
  - En cada tarjeta de partido con estado `✓ Preparado` dentro del listado `#preparacion-list`: botón secundario `🖨️ Imprimir plan`.
  - En la cabecera de acciones de `#preparacion-editor`: botón `🖨️ Imprimir plan` accesible junto a Guardar.
  - En el panel de cambios `#prep-moments`: botón visible `🖨️ Imprimir plan de partido`.
  - Soporte de borrador activo: si se imprime desde dentro del editor con modificaciones en curso, imprime fielmente el estado actual del borrador (`prepMomentsDraft`).
- **En Partido en Vivo (`#partido`) y Vista Delegado (`#delegado`):**
  - En el bloque `.cbx-live-plan` (Plan de partido): botón directo `🖨️ Imprimir plan de partido`.

### R2. Ficha A4 de Plan de Partido "Muy Bien Explicada"
El documento generado en formato A4 (para papel, PDF o pantalla) debe incluir:

1. **Cabecera Oficial del Encuentro:**
   - Escudo del club y nombre del equipo (`myTeamName()`).
   - Título formal: `PLAN DE PARTIDO OFICIAL · FÚTBOL 7` (o F11 según formato).
   - Ficha del partido: Rival (`vs [Rival]`), Condición (Local / Visitante), Competición / Jornada, Fecha y Hora, Terreno de juego / Campo, y Total de convocados disponibles.
   - Cuerpo técnico responsable (Entrenador y Delegado).

2. **Alineación Inicial (Minuto 0′ - Inicio):**
   - Sistema táctico inicial destacado (ej. `1-3-2-1`).
   - Cuadrícula clara de los 7 Titulares: Posición táctica (POR, LI, DEF, LD, MC, MP, DC), Dorsal destacado y Nombre del jugador.
   - Franja de Suplentes de inicio en banquillo: Dorsal y Nombre de cada jugador esperando su turno.

3. **Cronograma Paso a Paso de Sustituciones (Ventanas de Cambio):**
   - Para cada momento planificado (ej. Minuto 12′, Minuto 25′ Descanso, Minuto 38′...):
     - Minuto exacto y período (`1ª Parte`, `Descanso`, `2ª Parte`).
     - Sistema de juego en esa ventana (`Sistema 1-3-2-1`).
     - **Acciones detalladas e inteligibles:**
       - 🟢 **ENTRA:** Dorsal + Nombre + Puesto en el campo.
       - 🔴 **SALE:** Dorsal + Nombre.
       - 🔄 **MOVIMIENTOS INTERNOS:** Posiciones que intercambian jugadores que ya estaban en el campo.
       - 🧤 **REGLA DEL PORTERO:** Relevo explícito en portería si procede.
     - **Alineación en campo resultante:** Lista completa de los 7 jugadores en el césped tras la ventana.
     - **Jugadores en banquillo:** Quiénes descansan en esa ventana.

4. **Tabla de Reparto de Minutos y Participación Formativa:**
   - Tabla ordenada con todos los convocados:
     - Dorsal, Nombre, Posición habitual, Minutos totales previstos en campo, % del partido y Tramos de participación (ej. `0′ a 25′ y 38′ a 50′`).
   - Resumen de equidad formativa (minutos mínimos garantizados).

5. **Pautas para el Delegado y Acta de Campo para Bolígrafo:**
   - Instrucciones clave: Regla del portero (un tiempo cada uno si hay 2 porteros), pauta ante imprevistos (lesión o indisposición).
   - Casillas pautadas para anotar a mano durante el partido:
     - Resultado final (`___ - ___`).
     - Goleadores y minutos.
     - Tarjetas / Incidencias.
     - Notas técnicas del entrenador post-partido.

### R3. Motor de Impresión Profesional
- Integración con el motor de exportación `#cb-print-root`:
  - Barra de acciones flotante para móvil y escritorio: `🖨️ Imprimir / Guardar PDF`, `📄 Abrir Ficha A4`, `📲 Compartir`, `📥 Descargar`, `✕ Salir`.
  - Estilos de impresión `@media print`: tamaño A4 portrait (`@page { size: A4 portrait; margin: 0; }`), fondo blanco eco-ink de alto contraste, paginación limpia sin saltos huérfanos.

### R4. Calidad, Tests y No Regresión
- Mantener los 618 tests en verde al 100%.
- Batería de pruebas automatizadas en `tests/print-match-plan.test.js`.
- `npm run check` con 0 errores de sintaxis.
