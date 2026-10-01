# Spec 006: Pizarra Hero de 640px en Pantallas Estándar y Desplegables de Puestos Siempre Visibles

## 1. Contexto y Problema Detectado

Tras la entrega v62, la validación del usuario en entorno real con pantalla portátil (resolución viewport 1024×886px, MacBook) reveló dos impedimentos visuales y operativos críticos:

1. **Pizarra reducida a ~330px:** La cuadrícula `.cbx-prep-editor-layout` utilizaba `grid-template-columns: minmax(300px, 360px) minmax(0, 1fr)` con breakpoint a `max-width: 900px`. En pantallas de 1024px, la columna izquierda de controles consumía 360px, dejando a la columna de la pizarra apenas ~330-380px de ancho disponible, impidiendo que el campo alcanzara su potencial hero de 640px.
2. **Desplegables de puestos no visibles («los desplegables ya no salen»):** Los 7 selectores de puesto (`#prep-slots`) estaban envueltos en un elemento `<details class="cbx-prep-slots-details">` con `details.open = prepDraft.some(pos => !pos.playerId)`. Como el sistema auto-asigna a los 7 titulares de inicio, `details.open` evaluaba a `false`, quedando la sección completamente plegada por defecto. El usuario solo veía un resumen de texto y ningún selector.

## 2. Requisitos del Sistema

### R1. Pizarra Hero Prioritaria de 640px en Pantallas Estándar (1024px)
- La pizarra táctica `#prep-board` debe mostrarse en primer orden visual (`pitch` primero en DOM y en layout), alcanzando hasta 640px de ancho en pantallas portátiles (1024px-1150px) y tablets.
- En pantallas ultra-anchas (>=1280px), la cuadrícula mantiene 2 columnas donde la pizarra táctica nunca baja de 560px-640px (`minmax(560px, 640px) minmax(360px, 1fr)`).

### R2. Desplegables de Puestos Permanentemente Visibles
- Eliminar el contenedor `<details>` plegable para los 7 puestos.
- Utilizar un contenedor abierto permanente `<section class="cbx-prep-slots-details cbx-prep-slots-panel panel">` con encabezado descriptivo claro y los 7 selectores siempre presentes y accesibles.
- Anteponer (`prepend`) el panel de puestos en `controls`, de modo que en 1 columna quede directamente debajo de la pizarra y en 2 columnas se alinee en la parte superior junto a la pizarra.

### R3. Organización Adaptativa de Desplegables sin Nombres Cortados
- Organizar `.live-tactics-slots` con `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` y separación de 10px.
- En el contenedor centrado de 640px, genera 2 columnas de ~300px cada una, ofreciendo amplitud para leer dorsales y nombres completos sin recortes.
- En pantallas móviles (<580px) o columnas estrechas, se adapta limpiamente a 1 columna.
- Los suplentes (`.suplentes`) ocupan el ancho total con `grid-column: 1 / -1`.

### R4. Calidad, Tests y No Regresión
- Mantener en verde el 100% de la suite de tests (614/614).
- Verificar sintaxis con `npm run check`.
