# Documentación de ejercicios — CampoBase

Esta carpeta contiene la especificación canónica de cómo se representan los ejercicios de fútbol en CampoBase.

## Archivos

| Archivo | Qué es |
|---|---|
| `ESPECIFICACION_EJERCICIOS.md` | **La especificación completa**: reglas obligatorias, sistema de coordenadas, estructura de datos (`vista_rapida` + `detalle`), vocabulario de acciones y árbol de la biblioteca. Es la fuente de verdad. |
| `Conduccion_Cambios_Direccion_Hermes_VALIDADO.json` | **JSON maestro del primer ejercicio validado** (Circuito de conducción con cambios de dirección). Es la plantilla de referencia para todos los ejercicios siguientes. |
| `ejemplo-TEC-CON-001.json` | Ejemplo antiguo (Conducción en zig-zag) con el formato previo. **Obsoleto** — usar el JSON maestro como referencia. |

## Principio rector

> El ejercicio es el **dato** (JSON). La pizarra, la ficha visual, el PDF o cualquier animación se **renderizan a partir de esos datos**. Nunca al revés.

## Estructura definitiva (validada con Migue, 2026-09-03)

Cada ejercicio se divide en **dos bloques de presentación** sobre una misma fuente de datos:

- **`vista_rapida`** — lo que se ve mientras se entrena: nombre, tipo principal, qué se trabaja, tiempo estimado (15 jugadores), jugadores/organización, material, series, explicación breve, animación (GIF) y leyenda. Sin muro de texto.
- **`detalle`** — lo que se consulta solo si hace falta (botón «Ver detalles»): objetivos, claves del entrenador, montaje, desarrollo, qué buscar, qué observar, correcciones, reglas, si sale mal/bien, variantes y fuente.

El **GIF/pizarra es la vista rápida animada**, el **JSON contiene toda la lógica y los datos**, y el **PDF queda como ficha completa/referencia**.

## Reglas fijas

- No numerar los ejercicios.
- Tiempo estimado siempre calculado para 15 jugadores.
- No añadir texto explicativo dentro de la pizarra salvo elementos funcionales (SALIDA / LLEGADA).
- Si se pide cambiar una cosa de un ejercicio validado, cambiar únicamente esa cosa.
- No inventar movimientos en la animación.
- Las series forman parte de los datos y también se ven claramente en la animación.

## Origen

Especificación acordada con Migue a partir de la propuesta de ChatGPT (2026-09-03). Ver `ESPECIFICACION_EJERCICIOS.md` para el detalle completo y el estado de adopción.
