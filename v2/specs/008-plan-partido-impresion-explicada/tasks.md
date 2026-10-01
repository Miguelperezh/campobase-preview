# Tareas: Spec 008 — Plan de Partido: Impresión Profesional y Explicación Detallada

- [x] **T1: Creación del generador de impresión `js/print-match-plan.js`**
  - [x] Implementar `buildMatchPlanHtml(matchOrId, state, options)`.
  - [x] Construir cabecera oficial con escudo, rival, fecha, hora, campo y staff.
  - [x] Construir alineación inicial (0′) con formación, 7 titulares en cuadrícula y suplentes de salida.
  - [x] Construir cronograma cronológico detallado de cambios con 🟢 ENTRA, 🔴 SALE, puestos, reubicaciones y alineación resultante.
  - [x] Construir tabla de minutos previstos por jugador con porcentajes y tramos.
  - [x] Añadir pautas para el delegado y acta de campo con líneas para bolígrafo.
  - [x] Implementar `printMatchPlan(matchOrId, state, options)` conectado a `executePrint`.

- [x] **T2: Integración de botones y eventos de impresión en `js/app.js`**
  - [x] Añadir botón `🖨️ Imprimir plan` en tarjetas de `#preparacion-list`.
  - [x] Añadir botón `🖨️ Imprimir plan` en `#preparacion-editor` junto a Guardar.
  - [x] Añadir botón `🖨️ Imprimir plan de partido` en panel `#prep-moments`.
  - [x] Añadir botón `🖨️ Imprimir plan` en `.cbx-live-plan` de Partido en Vivo y Delegado.
  - [x] Conectar manejadores de eventos delegados para invocar `printMatchPlan`.

- [x] **T3: Estilos de impresión y pantalla en CSS**
  - [x] Añadir estilos para `.cb-print-match-plan` en `css/claude-partido.css` (o complementario).
  - [x] Configurar maquetación para A4, cuadrículas de titulares, cronograma de momentos y acta de campo.
  - [x] Asegurar `@media print` con fondo blanco eco-ink y saltos de página limpios.

- [x] **T4: Pruebas automatizadas y verificación**
  - [x] Crear `tests/print-match-plan.test.js`.
  - [x] Ejecutar `npm test` verificando que todos los tests pasen (622/622).
  - [x] Actualizar `package.json` con `js/print-match-plan.js` y ejecutar `npm run check`.

- [x] **T5: Documentación en `agente.md` (Sección 25)**
  - [x] Registrar la entrega v65 preservando secciones 1 a 24 intactas.

- [x] **T6: Sincronización y despliegue a GitHub Pages**
  - [x] Commit y push en `campobase` (rama `implement/claude-hoy-real`).
  - [x] Sincronizar directorio `campobase-preview-deploy/v2/`.
  - [x] Commit y push en `campobase-preview-deploy` (rama `main`).
  - [x] Proveer URL al usuario: `https://miguelperezh.github.io/campobase-preview/v2/`.
