# CampoBase · Plan Integral de Mejoras (Instrucciones para Antigravity)

Repositorio: `Miguelperezh/campobase` (rama `main`). Versión base validada: 2.44.0 (541 pruebas en verde).

Referencia visual e interactiva: la maqueta aislada `CampoBase Prueba Aislada v2` (ubicada en `referencia/cb-store.js`). **La maqueta es solo de consulta**: no copiar su HTML ni sus estilos en línea. Implementar dentro de la arquitectura actual (`index.html`, `js/app.js`, `js/domain.js`, `js/live-tactics.js`, `styles-redesign.css`, Supabase + IndexedDB).

---

## 0. REGLAS OBLIGATORIAS (leer antes de tocar nada)

1. **No modificar, reescribir ni "mejorar" nada que ya funcione.** Todo lo que está en la app es funcionalidad validada por Migue. Solo se **añade**.
2. **No tocar** estas piezas salvo para enganchar lo nuevo con una llamada mínima: cronómetro y fases (Comienzo, Descanso, Segundo tiempo, Final, autopausa), sustituciones manuales 1–7 y automáticas 1–3, cálculo de minutos jugados, eventos del partido, puntuaciones 1–5, finalización del partido, PIN de Migue, delegado y demo, sincronización Supabase / IndexedDB / `syncQueue`, service worker, exportar e importar JSON, visor de ejercicios y de tácticas, WhatsApp.
3. **Las 541 pruebas actuales deben seguir en verde** tras cada fase (`npm test`, `npm run check`). Si una falla, se revierte ese cambio.
4. **Cada mejora nueva** va detrás de un interruptor en Ajustes (desactivable) y con **pruebas propias nuevas**.
5. **No cambiar el esquema de Supabase.** Todo dato nuevo se guarda como documento tipado en `configuracion` (igual que ejercicios, sesiones y tácticas) o dentro del `payload` existente (jugador, partido, convocatoria).
6. **Ajustes nunca se recortan**: todos los ajustes actuales se quedan exactamente igual; solo se añaden tarjetas nuevas.
7. **Pretemporada nunca cuenta en estadísticas ni medias oficiales.** Oficial = solo Liga. Pretemporada se muestra aparte.
8. **Seguridad y privacidad de PINs**: nunca revelar contraseñas o PINs en pantalla ni en mensajes de ayuda (el texto de acceso es siempre neutro: *"Introduce tu PIN de acceso"*).
9. **Gestión de delegado**: una vez invitado o asociado, el titular debe poder editar y guardar sus permisos en cualquier momento sin bucles de invitación. El delegado siempre dispone de su botón de cerrar sesión en la cabecera.
10. Trabajar **por fases pequeñas**, con un commit por mejora y el número de versión y el CHANGELOG actualizados.
11. Idioma de la interfaz: español. Horas siempre con selectores propios de 24 h (como ya hace la app).
12. No guardar diagnósticos médicos en notas (mantener el aviso actual).

---

## 1. FASE 1 · Lógica pura (sin cambiar pantallas existentes)

Añadir funciones puras nuevas en un módulo nuevo `js/reparto-plan.js` (no editar las existentes de `domain.js`; si hace falta, solo importarlas). Todas con pruebas en `tests/`.

### 1.1 Reparto de minutos: porteros aparte
- Jugadores de campo: `objetivo = (jugadores en campo − 1) × duración ÷ nº convocados de campo`.
  - F7 con 12 de campo: 6 × 70 ÷ 12 = 35′ cada uno.
- Porteros, cómputo aparte: 1 portero → juega los 70′; 2 porteros → un tiempo cada uno (35′ + 35′); más de 2 → duración ÷ nº de porteros.
- Se recalcula al instante al cambiar la convocatoria (convocar o excluir).
- Respetar la modalidad (F7: 7 / 70′ / partes de 35′; F11: 11 / 90′ / partes de 45′).

### 1.2 Plan por tramos (propuesta, nunca automático)
- Algoritmo de referencia: rotación circular exacta (ver `planAuto` en `referencia/cb-store.js`, función `autoPlan`). Cada puesto de campo cubre 0–70′; se reparte el total (6 × 70′) en tramos consecutivos de longitud = objetivo de cada jugador.
- Modos (ajuste nuevo "Momento de los cambios"):
  - **Escalonado** (por defecto): desfase de medio tramo → cambios en pocos momentos (p. ej. 18′ y 53′).
  - **Por partes**: cambios al descanso.
  - **Manual**: ver 1.3.
- Salida: lista de cambios agrupados por minuto `{m, sale, entra, puesto}`, alineación en cualquier minuto `lineupAt(t)` y minutos previstos por jugador.

### 1.3 Plan manual editable
- Parte de una copia del plan automático.
- El usuario puede: mover el minuto de cada cambio (−/+), elegir quién sale y quién entra, añadir y borrar cambios, y "Copiar del automático".
- Validación: marcar como inválido el cambio si en ese minuto el que sale no está en el campo o el que entra ya juega.
- Mostrar minutos previstos frente al objetivo y marcar en color a quien quede por encima o por debajo (más de 1′).
- Persistir como documento `recordType: 'minutePlan'` ligado al partido.

### 1.4 Compensación de temporada (interruptor, desactivado por defecto)
- Ajuste por jugador de campo = `(media de minutos por convocatoria − los suyos) × 0,25`, limitado a ±5′, normalizado para que la suma total no cambie.
- Solo usa minutos de **Liga**.

### 1.5 Avisos durante el partido (discretos, nunca aplican nada solos)
- **Cambio previsto**: cuando llega el minuto de un grupo del plan, tarjeta con los cambios y botones "Hacer cambios" y "Ahora no". Además, una línea discreta con el próximo cambio y la cuenta atrás ("en 2:30").
- **Aviso a falta de 10 minutos** (interruptor): si un jugador de campo en el banquillo lleva ≥10′ menos que la media de los de campo → "debería entrar para jugar lo mismo que el resto", con "Preparar cambio" y "Ahora no".
- **Lesión en juego**: al registrar una lesión de un jugador que está en el campo → tarjeta "está lesionado y sigue en el campo", con el cambio propuesto (suplente con más déficit respecto a su objetivo; con empate, la misma posición; si es el portero, el otro portero) y botones "Hacer cambio" y "Sigue jugando". El jugador lesionado lleva una marca en la pizarra y en las listas.
- Al pulsar "Segundo tiempo" (interruptor "Alineación del 2.º tiempo según el plan"): proponer la alineación del plan en el minuto 35, respetando la regla actual de que se pida siempre la alineación del segundo tiempo (Fase B existente). No sustituir ese flujo; rellenarlo por defecto.

### 1.6 Registro completo de goles y penaltis
Tipos nuevos de evento (se añaden a los existentes; no cambiar los antiguos):

| Tipo | Marcador | Jugador que se pide |
|---|---|---|
| Gol de jugada | +1 a favor | goleador y asistencia opcional |
| Gol de penalti | +1 a favor | quién lo marca (sugerir el 1.er y 2.º lanzador de "Balón parado") |
| Gol de falta directa | +1 a favor | goleador |
| En propia puerta del rival | +1 a favor | — |
| Gol rival de jugada / de penalti / de falta | +1 en contra | — |
| En propia puerta nuestra | +1 en contra | qué jugador nuestro |
| Penalti nuestro fallado | — | quién lo tiró y resultado (parado, fuera, poste, larguero) |
| Penalti rival parado o fallado | — | quién lo paró (portero primero) o "lo falla el rival" |

- Borrar un evento de gol resta del marcador (como ya hace).
- Goleadores bajo cada equipo en el marcador: "Mateo 9′", "Samuel 23′ (p)", "(f)" falta, "(pp)" propia puerta.
- Estadísticas nuevas del jugador: goles por tipo; en porteros, penaltis parados (y en Zamora).

### 1.7 Motivos completos
- **Asistencia**: Presente / Tarde (hora de llegada con selectores 24 h y minutos de retraso) / Ausente con motivo: Enfermedad, Lesión, Decisión del entrenador, Disciplina, Estudios / colegio, Motivo familiar, Sin avisar, Otro motivo (texto obligatorio).
- **Convocatoria**: desplegable por jugador con Convocado + todos los motivos existentes (Enfermo, Lesionado, Sancionado, No fue a entrenar, Disciplina (notas/padres), Decisión del entrenador, Rotación equitativa, Otro motivo con texto obligatorio). Mantener el máximo de 14 únicos.

---

## 2. FASE 2 · Pantallas de partido

### 2.1 Partido en vivo (Migue y delegado)
- Botones grandes bajo el marcador: **Gol nuestro**, **Gol rival**, **Penalti**, **Cambio**, **Tarjeta**, **Lesión**, **Incidencia**.
- **Hojas guiadas por pasos** (tipo → jugador → detalle → confirmar con el marcador resultante). Tras confirmar, aviso con **Deshacer** durante unos segundos (goles, cambios, tarjetas, lesiones e incidencias).
- **Cambio guiado**: 1) quién sale, 2) quién entra (marcar "Recomendado" según el reparto), 3) confirmar. La lista manual de 1 a 7 actual se mantiene.
- **Pizarra en vivo**: al tocar una ficha se abre un desplegable con: Sustituir por (recomendado arriba), Cambiar de posición con, Registrar lesión, tarjeta o incidencia. El desplegable no se debe cortar dentro de la pizarra (centrado y con altura limitada).
- Fichas con anillo de progreso de minutos frente al objetivo y foto del jugador si la tiene.
- Tarjeta "Reparto de minutos" con pestañas "Minutos por jugador" (campo y porteros por separado) y "Plan por tramos" (diagrama de barras 0–70′ con línea del minuto actual).
- **Resumen para las familias** al finalizar: resultado, goleadores y minutos por jugador, con botón de WhatsApp.
- En ordenador: diseño en 3 columnas (pizarra | cambios | reparto y cronología).
- Celebración breve "¡GOOOL!" al marcar (se puede desactivar).

### 2.2 Delegado
Sin cambios en permisos actuales. Ajustes nuevos: "El delegado ve el reparto de minutos" y "El delegado ve la pizarra táctica".
- Panel en Ajustes con detección de delegado invitado/activo y guardado directo de permisos.

### 2.3 Preparación de partido
- Alineación **manual**: al tocar una ficha de la pizarra se abre un desplegable con los convocados; si el elegido ya está en el campo, se intercambian.
- Selectores de portero del 1.er y del 2.º tiempo.
- "Volver al plan" (restablece la alineación del reparto) y "Guardar preparación". Mantener lo que ya hace hoy: crear o actualizar el partido en vivo en fase "Preparado", enviarlo al delegado y respetar "Mostrar u ocultar al delegado".

### 2.4 Convocatoria
- Panel "Reparto previsto" (objetivo de campo y de porteros, fórmula visible) y "Plan por tramos" con modo Escalonado / Por partes / Manual.
- **Avisos por jugador**: entrenos a los que faltó esa semana y veces fuera por rotación.
- **Confirmación de las familias**: estado Confirma / Pendiente / No puede por convocado, contadores arriba y botón "Recordar a pendientes" (WhatsApp).

---

## 3. FASE 3 · Visual y personalización (todo configurable en Ajustes)

Tarjetas **nuevas** en Ajustes (las actuales se quedan igual):
- **Colores con significado**: porteros, defensas, medios, delanteros, victoria, empate, derrota.
- **Temas guardados**: "Guardar tema actual" (fondo, acento, fuente, fuente de títulos, tamaño); aplicar con un toque; opción "Partido" para usar un tema solo en En vivo.
- **Vista previa del tema** en directo.
- **Fuente de títulos y marcadores**, independiente de la fuente del texto.
- **Reparto, avisos y delegado**: compensar minutos de temporada, aviso a falta de 10′, propuestas discretas, alineación del 2.º tiempo según el plan, permisos del delegado (reparto y pizarra), modo sol en el partido, vibración, plantilla propia de WhatsApp, momento de los cambios (Escalonado / Por partes / Manual).

Otras mejoras visuales:
- Cabecera de cada pantalla como banda con el color del tema.
- **Plantilla**: franja superior del cuerpo técnico; fichas con franja de color por línea; foto editable (jugadores y técnicos, igual que el escudo); ficha a pantalla completa al tocar el nombre (foto grande, minutos por jornada, estadísticas, goles por tipo, racha de asistencia, mapa de posiciones, penaltis parados en porteros, "Enviar ficha a la familia").
- Estadísticas de **Pretemporada** en rejilla aparte (nunca sumadas a Liga). Clasificaciones con "Liga · oficial" y "Pretemporada · aparte" (sin opción "Todo").
- **Hoy**: panel "Temporada · Liga" con tira de resultados coloreados y barras de goles a favor y en contra por jornada.
- **Calendario**: vista mensual con puntos (partido, entreno) y hoy destacado.
- **Sesiones**: barra de bloques proporcional (calentamiento, principal, juego final), miniatura de pizarra por bloque y botón de silbato por bloque.
- **Ejercicios**: estado vacío con "Quitar filtros" cuando no hay resultados.
- **Buscador global** (ordenador): jugadores, ejercicios y partidos.
- Cuerpo técnico: el rol se llama **"Primer entrenador"** (no "Entrenador principal").

---

## 4. Criterios de aceptación
- `npm test` y `npm run check` en verde, con las 541 pruebas actuales intactas y pruebas nuevas para cada módulo.
- Probado en móvil (390 px) y en ordenador (1440 px), con Migue, delegado y demo.
- Sin conexión: las acciones nuevas se guardan en IndexedDB y se sincronizan al volver la red (usar el mismo mecanismo actual).
- Cada interruptor nuevo desactivado deja la app exactamente como la versión base.
- CHANGELOG con una entrada por fase y la frase habitual: *"sin cambios en cronómetro, sustituciones, minutos, eventos, puntuaciones ni finalización del partido"*.
