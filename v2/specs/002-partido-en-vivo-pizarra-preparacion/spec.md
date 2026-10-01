# Especificación: 002 - Pizarra Táctica en Partido en Vivo y Preparación

- **Identificador:** `002-partido-en-vivo-pizarra-preparacion`
- **Estado:** Validado / Implementado
- **Fecha:** 01/10/2026
- **Módulo:** Partido en Vivo (`#partido`) y Preparación de Partido (`#preparacion`)

---

## 1. Contexto y Objetivos

- **Objetivo:** Garantizar que la pizarra táctica interactiva validada en Tácticas se aplique con total coherencia y sin duplicidades en **Partido en Vivo** y **Preparación de Partido**.
- **Regla del Usuario:**
  - No generar una pizarra nueva por cada táctica o sistema; es **la misma pizarra**.
  - Al cambiar de formación táctica (1-3-2-1, 1-2-3-1, etc.) o fase, las fichas y posiciones cambian dinámicamente en el mismo lienzo.
  - El usuario debe poder elegir si quiere o no rival en todas las pizarras mediante un botón conmutable explícito («Mostrar rival / Ocultar rival»).
  - Las flechas y leyendas deben heredar el blindaje contra deformaciones (SVG directo, dimensiones fijas `28×14px`).

---

## 2. Requisitos Funcionales

- **RF-1 (Pizarra Única Dinámica):** En `#partido` y `#preparacion`, la pizarra se renderiza en un único elemento SVG (`#live-tactics-board` o `#prep-board`). Al cambiar el selector o los chips de formación (`.cbx-live-formation-chips`), la pizarra actualiza las posiciones de los 7 jugadores en el mismo contenedor.
- **RF-2 (Conmutador de Rival):**
  - Botón conmutable `#live-rival-toggle-btn` en Partido en Vivo y `#prep-toggle-rival-btn` en Preparación.
  - Estado inicial: Rival oculto por defecto (`liveTacticsShowOpponent = false`, `prepShowRival = false`).
  - Al pulsar, conmuta el estado, repinta la pizarra inmediatamente y muestra confirmación visual (toast).
- **RF-3 (Leyenda Blindada):** Las leyendas de Partido en Vivo (`.live-tactics-legend`) y Preparación respetan el aislamiento de estilos CSS de `.board-legend svg` y `.tactic-board > svg:first-child`, manteniendo los puntos y flechas compactos e inline.
- **RF-4 (Sincronización de Alineación y Convocatoria):** Los cambios de puestos y minutos en vivo se persisten de manera local-first en IndexedDB y sincronizan el cronómetro (`syncTimerFromLiveTactic`).

---

## 3. Criterios de Aceptación

1. Al abrir la pestaña Partido en Vivo (`#partido`), la pizarra táctica aparece con las 7 posiciones del sistema activo sin duplicar elementos en el DOM.
2. Al pulsar los chips de sistema táctico (ej. 1-2-3-1), las posiciones de los jugadores se recalculan en la misma pizarra sin parpadeos.
3. El botón «Mostrar rival / Ocultar rival» conmuta la presencia de los 7 oponentes de forma instantánea.
4. El 100% de la suite de tests (`603 pass, 0 fail`) pasa en verde y `npm run check` permanece limpio.
