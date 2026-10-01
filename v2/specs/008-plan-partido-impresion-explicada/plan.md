# Plan de Implementación: Spec 008

## 1. Arquitectura de Módulos

### 1.1 Módulo `js/print-match-plan.js`
- Exportar:
  - `buildMatchPlanHtml(matchOrId, state, options)`: Genera el HTML completo del documento A4 del Plan de Partido (con cabecera, titulares 0′, cronograma didáctico de ventanas con sustituciones/posiciones, tabla de reparto de minutos, pautas para el delegado y acta de campo).
  - `printMatchPlan(matchOrId, state, options)`: Obtiene el HTML y llama a `executePrint(html)` del motor de impresión para desplegar la vista previa, barra de herramientas y permitir la impresión nativa o descarga PDF.
- Lógica de extracción de datos:
  - Resuelve `match`, `callup`, `prep` (o borrador activo si se pasa en `options`).
  - Utiliza `normalizeMoments`, `describeMoment` y `plannedMinutes` de `match-moments.js`.
  - Construye textos explicativos claros: `🟢 Entra: #Dorsal Nombre (Puesto)` y `🔴 Sale: #Dorsal Nombre`.
  - Calcula tramos y porcentajes por jugador para la tabla de minutos.

### 1.2 Conexión en la Interfaz (`js/app.js`)
- En `renderPreparaciones()`:
  - Añadir botón `<button type="button" class="prep-print-plan secondary" data-id="${escapeHtml(match.id)}">🖨️ Imprimir plan</button>` en tarjetas de partidos preparados.
- En `openPreparacionEditor()` / `renderPrepMoments()`:
  - Añadir botón en `#preparacion-editor` junto a `#prep-save`: `<button type="button" id="prep-print-current" class="secondary">🖨️ Imprimir plan</button>`.
  - Añadir botón en `#prep-moments`: `<button type="button" id="prep-print-moments" class="secondary">🖨️ Imprimir plan de partido</button>`.
- En `savedPlanMarkup()` (Partido en Vivo y Delegado):
  - Añadir botón `<button type="button" class="cbx-plan-print secondary" data-match-id="${escapeHtml(prep.matchId)}">🖨️ Imprimir plan</button>` en la cabecera de `.cbx-live-plan`.
- Manejadores de eventos:
  - Conectar clics de `.prep-print-plan`, `#prep-print-current`, `#prep-print-moments` y `.cbx-plan-print` a `printMatchPlan`.

### 1.3 Estilos de Impresión y Pantalla (`css/claude-partido.css` y `css/claude-entreno.css`)
- Clases para la ficha A4 de Plan de Partido:
  - `.cb-print-match-plan`: dimensiones A4, tipografía y espaciados optimizados.
  - `.cbx-print-match-header`: datos oficiales y escudo.
  - `.cbx-print-starters-grid`: cuadrícula de titulares y suplentes.
  - `.cbx-print-moments-timeline`: bloques cronológicos de ventanas de cambio.
  - `.cbx-print-minutes-table`: tabla de minutos equitativos.
  - `.cbx-print-coach-notes`: pautas de banquillo y líneas para bolígrafo.
  - Reglas `@media print` para salto de página limpio y nitidez total.

## 2. Plan de Pruebas y Verificación
- Crear `tests/print-match-plan.test.js`:
  - Validar generación de HTML con datos de partido, titulares, ventanas de cambio explicadas y tabla de minutos.
  - Validar que los botones de impresión se integran en Preparación y Partido en Vivo.
  - Validar que `printMatchPlan` invoca `executePrint`.
- Ejecutar `npm test` (verificar 618+ tests en verde).
- Ejecutar `npm run check`.
- Registrar Entrega v65 en `agente.md` (Sección 25).
- Desplegar a GitHub Pages en `campobase-preview-deploy` y verificar URL activa.
