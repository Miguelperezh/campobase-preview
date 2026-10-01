# Especificación: 001 - Leyenda Táctica Autocontenida e Impresión Dossier A4 Claude

- **Identificador:** `001-tacticas-leyenda-impresion-a4`
- **Estado:** Validado / Implementado
- **Fecha:** 01/10/2026
- **Módulo:** Tácticas (`#tacticas`) y Entreno / Impresión A4 (`#sesiones`, `#ejercicios`)

---

## 1. Contexto y Problema

1. **Problema de la Leyenda en la Pizarra Táctica (`#tacticas`):**
   - En la vista de tácticas y aspectos del manual F7, al mostrarse la pizarra interactiva, los iconos de la leyenda inferior («Pase», «Conducción», «Movimiento», «Disparo», «Sprint») se renderizaban a un tamaño colosal (más de 400px de ancho) rompiendo completamente la maquetación.
   - **Causa Raíz:** El selector CSS `.tactic-board svg` en `styles.css` aplicaba `display: block; width: 100%; aspect-ratio: 1;` a **todos** los elementos `<svg>` descendientes de `<figure class="tactic-board">`. Dado que la leyenda `<p class="board-legend">` está dentro de dicha figura y utilizaba `<svg>` con markers escalables, los iconos heredaban el 100% del ancho del contenedor.

2. **Requerimiento del Usuario:**
   - Probar **otra forma** radicalmente distinta sin repetir la inyección de markers SVG dinámicos en la leyenda.
   - La leyenda debe ser totalmente autocontenida, compacta, con iconos de flecha nítidos de `28×14px` fijos, directos e inmunes a estilos heredados.
   - El sistema de impresión de ejercicios individuales y dossiers de sesión en formato Claude A4 está **validado** y debe permanecer protegido de cualquier regresión.

---

## 2. Requisitos Funcionales

- **RF-1:** Los iconos de flecha en la leyenda de la pizarra táctica deben ser elementos SVG compactos de `28×14px`, alineados horizontalmente (`display: inline-block`) con su texto descriptivo («Pase», «Movimiento sin balón», «Conducción», «Disparo», «Sprint»).
- **RF-2:** La punta de flecha en la leyenda debe dibujarse mediante un `<polygon points="18,3.5 26,7 18,10.5" fill="...">` directo sin depender de `<defs>` ni `<marker>`.
- **RF-3:** El selector CSS general `.tactic-board svg` no debe afectar a los SVG de la leyenda ni a elementos secundarios (`.tactic-board > svg:first-child`).
- **RF-4:** Las reglas CSS en `styles.css` y `css/claude-entreno.css` deben blindar `.board-legend svg` y `svg.tactic-legend-arrow` con `width: 28px !important; height: 14px !important; aspect-ratio: auto !important;` y `max-width: 28px !important`.
- **RF-5:** Mantener intacto el dossier de impresión Claude A4 (portada de sesión + hojas individuales de ejercicios con grid a 2 columnas y notas pautadas).

---

## 3. Criterios de Aceptación

1. **Criterio 1:** En `#tacticas` y cualquier pizarra táctica con leyenda, ninguna flecha de leyenda excede los 28px de ancho ni los 14px de alto bajo ninguna resolución de pantalla.
2. **Criterio 2:** En la leyenda, las puntas de flecha son polígonos limpios, nítidos y del color exacto correspondiente (Pase `#2563eb`, Movimiento `#4b5563`, Conducción `#8b5cf6`, Disparo `#dc2626`, Sprint `#f59e0b`).
3. **Criterio 3:** Las herramientas de dibujo de la barra táctica (`renderTacticToolIcon`) continúan funcionando al 100% para dibujar y seleccionar en la pizarra interactiva.
4. **Criterio 4:** El 100% de la suite de tests (`603 pass, 0 fail`) pasa limpiamente y `npm run check` no arroja errores.
