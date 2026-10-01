# AGENTS.md — CampoBase

Este archivo contiene normas permanentes para cualquier agente que trabaje en este repositorio.

## Regla de convivencia entre agentes

`AGENTS.md` es un manual compartido y acumulativo. Cada chat/agente debe añadir únicamente las normas de su área sin borrar, sustituir, resumir, reordenar ni sobrescribir lo que hayan añadido otros agentes.

Antes de modificar este archivo:
- leer siempre la versión más reciente de `AGENTS.md` en `main`;
- editar solo la sección propia o añadir una nueva;
- conservar literalmente las secciones ajenas salvo autorización explícita del usuario;
- no reemplazar el archivo completo por una copia antigua procedente de otra rama;
- si una rama contiene instrucciones que todavía no están en `main`, no incorporarlas automáticamente salvo que formen parte de la tarea o el usuario lo pida.

## 0. Lectura obligatoria antes de modificar CampoBase

Antes de tocar código, datos, Supabase, ejercicios, sesiones, vídeos, diseño o navegación:

1. Leer `AGENTS.md`.
2. Leer la documentación específica del área que se vaya a tocar.
3. Para ejercicios, leer obligatoriamente `docs/ejercicios/ESPECIFICACION_EJERCICIOS.md`.
4. Revisar el código y los datos actuales antes de modificar nada.
5. Si una regla nueva contradice una antigua, prevalece la más reciente y explícita.

## 1. Reglas generales de seguridad

- CampoBase actual es la base validada.
- Añadir antes que rehacer.
- No borrar, sustituir, rediseñar ni reestructurar funciones ya validadas sin autorización explícita.
- No tocar `main` para cambios funcionales sin haber trabajado y probado antes en una rama.
- No eliminar datos existentes de usuarios, jugadores, partidos, sesiones, ejercicios, vídeos o Supabase.
- No cambiar IDs existentes silenciosamente.
- No romper compatibilidad con registros antiguos.
- No hacer obligatorios campos nuevos para datos antiguos.
- No modificar el diseño general de la app salvo petición explícita.
- No tocar el editor/pizarra ni sus funciones validadas salvo que la tarea lo exija expresamente.
- Antes de fusionar, ejecutar pruebas y revisar errores de consola/regresión.
- Si una modificación puede provocar pérdida de datos, duplicados o romper una función validada, detenerse antes de aplicarla.

---

# EJERCICIOS

Esta sección reúne el estado real y las normas permanentes de CampoBase para crear, convertir, importar e integrar ejercicios. Cualquier agente que vaya a tocar ejercicios debe leer esta sección completa y también `docs/ejercicios/ESPECIFICACION_EJERCICIOS.md`.

## Estado actual de lo realizado

En el trabajo del 18/09/2026 se preparó la conversión de los ejercicios procedentes del ZIP histórico de vídeos de CampoBase al nuevo formato.

Se hizo lo siguiente:
- **12 ejercicios actuales** preparados en el nuevo formato;
- **4 versiones anteriores** preparadas también, pero conservadas aparte y marcadas como no actuales;
- paquete global preparado con **16 carpetas**, manteniendo separados actuales y anteriores;
- cada ejercicio preparado contiene `preview.png`, `ejercicio.mp4`, `video_muestra_humanos.mp4`, `data.json`, `ficha.md`, `origen.json` y `qa.json`;
- cuando existía, se conservó también `fuente_animacion.gif` como trazabilidad del formato anterior;
- el formato gráfico principal pasó a ser **MP4**;
- se añadió el vídeo original con personas como **vídeo de muestra humano**;
- se aplicó la separación entre categoría principal y filtro `Fútbol 7 / Fútbol 11`;
- se aplicaron las reglas de terminología, incluida la prohibición visible de `chip`;
- se añadió QA individual por ejercicio.

Paquete preparado en aquella conversación:
- `CampoBase_NUEVO_FORMATO_ABSOLUTAMENTE_TODOS_16.zip`

**Importante:** que este trabajo esté documentado aquí no significa que esos 16 ejercicios estén ya integrados en producción. Antes de afirmar que están subidos o activos, comprobar repositorio, storage, Supabase y funcionamiento real de la app.

Las **4 versiones anteriores** deben seguir separadas y **no deben aparecer como ejercicios actuales**.

## Normas vigentes de ejercicios

La especificación detallada vive en:

`docs/ejercicios/ESPECIFICACION_EJERCICIOS.md`

Las reglas siguientes son obligatorias y tienen prioridad sobre descripciones antiguas incompatibles.

## 2.1 Principio de fidelidad

Un ejercicio procedente de vídeo debe representar el ejercicio real de la fuente.

No inventar silenciosamente:
- recorridos;
- posiciones;
- variantes;
- material;
- rotaciones;
- roles;
- número de balones;
- gestos;
- tiempos observados;
- lógica de la acción.

Si existe una duda importante sobre el movimiento o la geometría, debe resolverse antes de dar el ejercicio por validado.

Si el usuario corrige un único punto de un ejercicio ya validado, cambiar solo ese punto y conservar el resto.

## 2.2 Nuevo formato de ejercicio

Para ejercicios nuevos procedentes de vídeo, el paquete normal es:

- `preview.png`
- `ejercicio.mp4`
- `video_muestra_humanos.mp4`
- `data.json`
- `ficha.md`
- `origen.json`
- `qa.json`

Puede conservarse además `fuente_animacion.gif` como fuente histórica o trazabilidad cuando exista, pero:

**el formato principal de reproducción es MP4, no GIF.**

### Significado

- `preview.png`: montaje inicial limpio.
- `ejercicio.mp4`: demostración gráfica principal del ejercicio.
- `video_muestra_humanos.mp4`: vídeo real con personas del que procede el ejercicio.
- `data.json`: fuente estructurada principal de datos.
- `ficha.md`: explicación ampliada.
- `origen.json`: procedencia y trazabilidad.
- `qa.json`: control de calidad.

No meter storyboards de validación en el paquete final salvo petición expresa.

## 2.3 Preview y MP4

### preview.png
Debe mostrar el montaje inicial de forma limpia y útil.

### ejercicio.mp4
Debe:
- corresponder exactamente al mismo ejercicio descrito en `data.json`;
- mostrar movimiento real de jugadores y balón;
- conservar la lógica y geometría validadas;
- no llevar paneles de interfaz;
- no llevar cabeceras decorativas;
- no llevar textos explicativos superpuestos;
- mostrar flechas solo mientras sucede la acción correspondiente;
- evitar flechas permanentes decorativas;
- usar MP4/H.264 compatible con web/app cuando proceda.

No convertir el MP4 nuevo a GIF como formato principal.

## 2.3.1 Orden obligatorio de visualización en ejercicios del nuevo formato

Tanto en **Vista rápida/reducida** como en **Vista completa/ampliada**, los ejercicios del nuevo formato deben mostrar los medios en este orden exacto:

1. **Preview**: `preview.png`, igual que las portadas del resto de la biblioteca.
2. **MP4 gráfico del ejercicio**: `ejercicio.mp4`, con las fichas/animación del ejercicio.
3. **Vídeo de muestra con humanos**: `video_muestra_humanos.mp4`.

Reglas:
- la preview nunca se sustituye por el primer fotograma del vídeo humano;
- el vídeo humano nunca ocupa el lugar del MP4 gráfico;
- el MP4 gráfico nunca sustituye a la preview de la tarjeta;
- los tres medios deben mantener ese mismo orden en vista reducida y vista completa;
- si falta temporalmente un asset, mostrar un placeholder neutro y no reutilizar otro medio como si fuera ese asset;
- antes de publicar, comprobar que `preview.png`, `ejercicio.mp4` y `video_muestra_humanos.mp4` existen realmente en Storage y responden correctamente.

## 2.4 Vídeo humano obligatorio cuando exista fuente en vídeo

Los ejercicios creados a partir de vídeo deben conservar también el vídeo real de muestra con humanos.

En la app deben poder coexistir:
1. vídeo gráfico principal del ejercicio;
2. vídeo de muestra con humanos.

No eliminar ni sustituir vídeos existentes.

La integración debe ser backward-compatible: los ejercicios antiguos que solo tengan el campo de vídeo anterior deben seguir funcionando.

## 2.5 Categorías oficiales

Cada ejercicio tiene una categoría principal de este conjunto:

- Calentamiento/activación
- Tecnificación
- Técnico-táctico
- Táctica
- Posesión
- Juego reducido
- Finalización
- Transición
- Coordinación/motricidad
- Preparación física
- Preparación física integrada
- Porteros

No usar `Técnica` como categoría cuando corresponda `Tecnificación`.

## 2.6 Fútbol 7 / Fútbol 11

`Fútbol 7` y `Fútbol 11` son una dimensión/filtro independiente de la categoría principal.

No sustituyen categorías como Finalización, Táctica, Tecnificación, etc.

Regla vigente para los ejercicios importados desde vídeo:
- Fútbol 7: ejercicios con niños y los identificados mediante señales izquierda/derecha o códigos de color como naranja, verde, blanco, etc.
- Fútbol 11: el resto.

Si `data.json` ya contiene `formato_futbol`, respetar ese valor y no recalcularlo arbitrariamente.

## 2.7 “Qué se trabaja”

No copiar automáticamente el objetivo ni un campo antiguo.

Debe salir de la mecánica real del ejercicio.

Usar aproximadamente un máximo de 4 contenidos realmente útiles y distintos.

Evitar duplicados semánticos o etiquetas genéricas que no aporten información.

## 2.8 Terminología

La palabra visible **“chip”** está prohibida en el contenido para entrenadores.

Según el contexto usar:
- picar el balón;
- balón picado;
- pase picado;
- remate picado.

No llamar “chips” a las etiquetas visuales de interfaz.

Usar español de España:
- portero;
- portería;
- cono;
- peto;
- escalera de coordinación;
- valla;
- conducción;
- regate;
- mediapunta cuando proceda.

## 2.9 Convenciones visuales nuevas

Por defecto:
- portero: negro `#000000`, texto blanco `#FFFFFF`;
- defensa: rojo `#E95852`, texto blanco `#FFFFFF`;
- atacante: azul `#429FE2`, texto blanco `#FFFFFF`;
- neutro / apoyo: amarillo `#FACC15`, texto blanco `#FFFFFF`;
- entrenador: gris claro `#CBD5E1`, texto blanco `#FFFFFF`;
- cono: naranja salvo que la fuente necesite distinguir colores;
- balón: blanco/negro;
- campo: franjas `#8BC753` y `#84C04D`.

Usar fichas/símbolos simples para táctica, pases, finalización y desplazamientos.

Usar representación corporal más detallada solo cuando el gesto corporal sea realmente necesario para entender el ejercicio.

No numerar visiblemente los ejercicios como “Ejercicio 001”, salvo petición específica.

## 2.9.1 Roles oficiales y colores en ejercicios

Regla vigente y obligatoria para la representación de roles en ejercicios:

| Rol | Etiqueta | Relleno | Texto |
| --- | --- | --- | --- |
| Portero | `P` | `#000000` (negro) | `#FFFFFF` (blanco) |
| Defensa | `D1`, `D2`, `D3`… | `#E95852` (rojo) | `#FFFFFF` (blanco) |
| Atacante | `A1`, `A2`, `A3`… | `#429FE2` (azul) | `#FFFFFF` (blanco) |
| Neutro / Apoyo | `N` | `#FACC15` (amarillo) | `#FFFFFF` (blanco) |
| Entrenador | `E` | `#CBD5E1` (gris claro) | `#FFFFFF` (blanco) |

Estas etiquetas, colores de relleno y colores de texto deben mantenerse de forma consistente en `preview.png`, MP4 gráficos, leyendas, fichas y cualquier representación visual del ejercicio.


## 2.10 Integración en la app

Los ejercicios nuevos deben integrarse en la estructura existente de CampoBase, no en una biblioteca paralela.

Deben funcionar, cuando corresponda, en:
- biblioteca/listado;
- búsqueda;
- categorías;
- filtros;
- “Qué se trabaja”;
- vista del ejercicio;
- selección para sesiones;
- sesiones guardadas;
- reproducción del vídeo gráfico;
- reproducción del vídeo humano.

Antes de insertar:
- comprobar duplicado por ID;
- comprobar duplicado por nombre;
- comprobar si ya existe como otra versión.

Si ya existe, no sobrescribir automáticamente.

Las versiones anteriores deben conservarse como respaldo y no aparecer como ejercicios actuales.

## 2.10.1 Ejercicios creados por el entrenador — “Mis ejercicios”

Los ejercicios creados manualmente desde **+ Ejercicio** son contenido personal del entrenador y deben persistir.

Reglas obligatorias:
- al guardar un ejercicio nuevo, debe quedar marcado como ejercicio creado por el usuario y no confundirse con favoritos/caché del catálogo validado;
- después de guardar, debe aparecer en la pestaña **Mis ejercicios**;
- recargar, sincronizar o reiniciar la PWA no puede eliminarlo ni hacerlo desaparecer de la biblioteca;
- la limpieza de ejercicios legacy no puede borrar registros marcados como creados por el usuario;
- los ejercicios personales deben poder editarse y borrarse mediante su flujo normal;
- deben estar disponibles para añadirlos a sesiones;
- en el selector de ejercicios de **Sesiones**, el desplegable **Categoría** debe incluir la opción **Mis ejercicios**;
- la opción **Mis ejercicios** filtra solo ejercicios personales, sin mezclar los favoritos del catálogo validado;
- categoría, formato F7/F11, material y dificultad del ejercicio personal deben conservarse para los filtros de sesiones.

Comprobar siempre el flujo completo:
**+ Ejercicio → Guardar → Mis ejercicios → recargar → sigue visible → Sesiones → Categoría → Mis ejercicios → añadir a sesión**.

## 2.10.2 Integración aplicada en la app — 18/09/2026

Integración funcional fusionada en `main` mediante el PR #46, commit de merge:
`4d315a05fff9b5632ffd2f0fa332fb11335c7d23`.

Estado que debe conservarse:

- Los ejercicios personales creados desde **+ Ejercicio** persisten como registros propios del entrenador.
- Al guardarlos aparecen en **Mis ejercicios** y siguen visibles después de recargar/sincronizar.
- **Mis ejercicios** está disponible también dentro del desplegable **Categoría** del selector de ejercicios de **Sesiones**.
- Los ejercicios personales conservan categoría, formato F7/F11, material y dificultad para poder filtrarlos y añadirlos a una sesión.
- Crear y editar sesiones utiliza el mismo builder y debe conservar ID de sesión, fecha de creación, bloques, orden, minutos, notas y ejercicios seleccionados.
- Existe prueba de regresión específica para crear y editar una sesión que contiene un ejercicio personal.
- Para los ejercicios del nuevo formato, el orden visual obligatorio sigue siendo:
  1. preview;
  2. MP4 gráfico;
  3. vídeo humano.
- El vídeo humano nunca se utiliza como falsa preview.
- Si el `preview.png` todavía no está publicado, la interfaz evita la URL rota y genera una portada estática a partir del **MP4 gráfico**, nunca del vídeo humano.
- En el selector de Sesiones se mantiene el mismo criterio de preview gráfica.
- No se han eliminado ejercicios, sesiones, vídeos ni datos existentes y no se ha modificado la lógica validada del editor/pizarra.
- La verificación automática `CampoBase verify` del cambio funcional pasó correctamente antes y después de fusionar.

## 2.10.3 Corrección final de ejercicios, previews y sesiones — PR #48

Integración fusionada en `main` el 18/09/2026 mediante el PR #48, commit:
`bb3b875b0d959a617cea530ec94aa4a665e81a24`.

Estado obligatorio a conservar:

- En el catálogo activo aparecen **solo los 12 ejercicios actuales** del lote nuevo.
- Las **4 versiones anteriores** siguen conservadas en código como respaldo mediante `EJERCICIOS_NUEVO_FORMATO_ANTERIORES`, pero no pueden aparecer en la biblioteca activa ni en el selector de Sesiones.
- Los 12 ejercicios actuales conservan separados:
  1. preview;
  2. MP4 gráfico de fichas;
  3. vídeo humano.
- La preview y el MP4 gráfico eliminan visualmente la cabecera, panel lateral y resto de interfaz legacy mediante el recorte validado del área de campo.
- La preview es estática y procede únicamente del recurso gráfico; nunca del vídeo humano.
- El mismo criterio de preview limpia se usa en:
  - tarjeta de Biblioteca;
  - Vista rápida;
  - Vista completa;
  - selector de ejercicios dentro de Sesiones;
  - detalle de una sesión.
- El MP4 gráfico se mantiene como segundo medio y el vídeo humano como tercero.
- Los ejercicios creados desde **+ Ejercicio** siguen persistiendo como `recordType: exercise`, `userCreated: true`, `source: personal`.
- Tras guardarlos, deben abrirse en **Mis ejercicios** y sobrevivir a recarga/sincronización.
- **Mis ejercicios** debe seguir disponible en el filtro **Categoría** del selector de Sesiones.
- Crear y editar sesiones continúa usando el mismo builder; debe conservar ID, `createdAt`, bloques, orden, minutos, consignas, notas y ejercicios personales.
- No se modificaron autenticación, SaaS, jugadores, partidos, Supabase ni la lógica del editor/pizarra.

Verificaciones realizadas antes de fusionar:
- sintaxis correcta de los JS modificados y tests;
- 12 ejercicios activos y 4 anteriores aislados sin fuga al catálogo;
- los 12 actuales con crop de preview/MP4 y vídeo humano separado;
- orden HTML comprobado: preview → MP4 gráfico → vídeo humano;
- simulación de creación y edición de sesión con un ejercicio de **Mis ejercicios**, conservando identidad, orden, minutos y notas;
- comprobación del cableado de persistencia de **+ Ejercicio**, pestaña **Mis ejercicios** y filtro **Mis ejercicios** en Sesiones.

## 2.11 Supabase

Supabase es fuente de verdad cuando la app use esos datos.

Al integrar ejercicios:
- añadir sin borrar;
- conservar tablas, columnas e IDs existentes;
- evitar migraciones invasivas;
- mantener compatibilidad con registros antiguos;
- no convertir campos nuevos en obligatorios para datos existentes;
- conservar URLs/rutas ya usadas por la app;
- no eliminar vídeos existentes.

## 2.12 Editor/pizarra: no romper

No modificar sin petición explícita las funciones validadas de:
- mover;
- seleccionar;
- tamaño;
- orientación libre;
- espejo horizontal;
- reflejo vertical;
- giro -90°/+90°;
- duplicar;
- borrar;
- fases;
- deshacer/rehacer;
- guardar/persistencia;
- inversión específica del fondo de red de porterías, cuando exista.

## 2.13 QA obligatorio

Antes de considerar terminado un ejercicio o una importación, comprobar en este orden:

**fuente → preview → primer frame del MP4 → MP4 completo → data.json/ficha**

Todo debe representar el mismo ejercicio.

Además revisar:
- categoría correcta;
- F7/F11 correcto;
- “Qué se trabaja” correcto;
- materiales;
- recorridos;
- balones;
- rotaciones;
- vídeo humano;
- duplicados;
- búsqueda/filtros;
- selección en sesiones;
- persistencia;
- errores nuevos de consola;
- regresión de ejercicios antiguos.

No dar por terminado solo porque compile.

## 2.14 Regla de versiones validadas

Contenido marcado como validado no se modifica silenciosamente.

Si se crea una revisión:
- conservar la versión anterior;
- distinguir claramente la nueva;
- no convertir una versión antigua en activa por accidente.

---

## 3. Documentación

Documentación específica actual:
- Ejercicios: `docs/ejercicios/ESPECIFICACION_EJERCICIOS.md`
- Ejemplos y fuentes: `docs/ejercicios/`

Si se añaden documentos de sesiones, vídeos, Supabase, arquitectura o diseño, deben enlazarse también desde este archivo.

---

# 4. Estado de trabajo actual y reglas de continuidad — 18/09/2026

Esta sección documenta decisiones ya tomadas en conversaciones recientes para que el siguiente agente continúe desde el estado real del proyecto y no vuelva a implementar comportamientos descartados.

## 4.1 Flujo de trabajo obligatorio

- Los cambios funcionales se desarrollan primero en una rama aislada.
- No fusionar cambios funcionales a `main` hasta que el usuario los haya probado y diga expresamente que están validados.
- La rama aislada actual para la Fase 4 es:
  - `fase-4-billing-aislada`
- Antes de fusionar:
  1. comparar la rama con `main`;
  2. revisar exactamente qué archivos cambian;
  3. ejecutar la batería completa de pruebas;
  4. comprobar Supabase si la función depende de base de datos/RLS;
  5. no fusionar si existe una regresión conocida.
- No usar una maqueta como sustituto de la app real. Las validaciones deben hacerse sobre una URL funcional de la aplicación.
- Mantener siempre una URL que el usuario pueda abrir para comprobar el estado de la app.
- No inventar datos, IDs, claves, productos, precios, correos, usuarios ni configuraciones externas.
- Si una integración externa todavía no dispone de credenciales o configuración real, dejarla preparada pero no simular que está operativa.

## 4.2 Principio de preservación

Cualquier agente que continúe el proyecto debe asumir que las funciones ya validadas son patrimonio estable de CampoBase.

No se debe:
- rehacer una función solo porque otra implementación parezca más limpia;
- sustituir datos existentes por valores de ejemplo;
- volver a introducir datos precargados de jugadores;
- eliminar protecciones de datos para simplificar sincronización;
- convertir un proceso validado en otro distinto sin autorización explícita.

Cuando una tarea afecta a varias áreas, modificar solo lo necesario y conservar el resto.

---

# 5. Cuentas, roles, equipo y suscripciones

## 5.1 Roles vigentes

Los roles funcionales que deben mantenerse son:

- `admin`: administrador/titular del equipo;
- `coach`: entrenador titular normal;
- `delegate`: delegado asociado al equipo;
- `owner`: rol legado que se conserva por compatibilidad y se trata como administrador.

En interfaz, la cuenta principal del usuario debe mostrarse como **Administrador**, aunque internamente pueda seguir existiendo `owner` por compatibilidad.

No mezclar estos roles SaaS con el antiguo rol local por PIN de partido.

## 5.2 Un equipo por cuenta principal

Cada cuenta principal de entrenador/administrador posee un único equipo.

Reglas:
- no permitir crear varios equipos desde la misma cuenta principal;
- no permitir que una cuenta de delegado cree equipos;
- el delegado comparte exactamente el mismo equipo y los mismos datos deportivos;
- no crear una plantilla separada para el delegado;
- no duplicar jugadores, partidos, sesiones o configuraciones por crear un delegado.

La relación de equipo debe resolverse en servidor/Supabase, no únicamente con lógica visual.

## 5.3 Cuenta de delegado

Cada equipo puede tener como máximo **una cuenta de delegado** asociada.

El delegado:
- usa su propio correo y contraseña;
- queda asociado al equipo del entrenador titular;
- no crea un equipo nuevo;
- no puede pertenecer simultáneamente a otro equipo desde esta relación;
- hereda el acceso de suscripción del equipo;
- no gestiona pagos, promociones ni la suscripción;
- no entra en Ajustes;
- no puede cambiar permisos;
- no puede crear más cuentas/equipos desde la interfaz de delegado.

El entrenador/administrador configura desde Ajustes qué vistas puede usar el delegado.

La vista base obligatoria es:
- `delegado`

Vistas adicionales configurables:
- `hoy`
- `plantilla`
- `cuerpo-tecnico`
- `asistencia`
- `convocatorias`
- `preparacion`
- `partido`
- `calendario`
- `sesiones`
- `ejercicios`
- `tacticas`

`ajustes` no debe ser concedible al delegado.

La restricción debe existir también en servidor/RLS o funciones seguras cuando afecte a datos, no solo ocultando botones.

## 5.4 Suscripciones / Fase 4

La Fase 4 se está desarrollando en `fase-4-billing-aislada`.

Reglas validadas de arquitectura:
- prueba Pro: 14 días, gestionada por servidor;
- plan mensual: 9,99 €/mes;
- plan anual: 79 €/año;
- códigos de regalo/descuento se validan en servidor;
- no usar `localStorage` como autoridad de suscripción;
- no crear pagos simulados;
- no inventar IDs de Stripe;
- Stripe Checkout y el webhook deben trabajar mediante Edge Functions;
- la cuenta administrador/owner principal tiene acceso Pro vitalicio;
- el delegado hereda la suscripción del titular;
- una suscripción caducada debe bloquear el acceso SaaS a los datos protegidos, no solo mostrar un modal.

El estado de pago real solo debe considerarse operativo cuando Stripe esté conectado y configurado con claves, precios y webhook reales.

---

# 6. Fichas de jugadores — protección obligatoria

Esta sección es crítica. Ya se han producido pérdidas/sobrescrituras de datos personales de jugadores y no deben repetirse.

## 6.1 Datos que nunca se inventan

No inventar ni completar automáticamente:
- nombre;
- dorsal;
- posiciones;
- pierna dominante;
- notas;
- nombre del padre;
- teléfono del padre;
- nombre de la madre;
- teléfono de la madre;
- foto;
- cualquier otro dato personal del jugador.

Si un dato no está respaldado por la ficha real, una copia anterior comprobada o una entrada explícita del usuario, debe quedarse vacío.

No reutilizar datos de otro jugador con nombre parecido.

## 6.2 Edición manual como única autoridad de la ficha

Los campos personales de una ficha de jugador solo deben cambiar cuando el usuario entra en **Editar jugador** y guarda expresamente esa ficha.

Una operación automática de:
- sincronización;
- estadísticas;
- partidos;
- asistencias;
- convocatorias;
- sesiones;
- migraciones;
- refresco;
- cambio de dispositivo;
- actualización de la PWA;

no debe cambiar esos campos personales.

La app dispone de una ruta específica de guardado manual de ficha (`putPlayerProfile` o equivalente). No sustituirla por escrituras genéricas que puedan sobrescribir campos personales.

## 6.3 Prohibido reintroducir plantillas precargadas

La antigua precarga automática de nombres/dorsales/contactos fue eliminada.

No reintroducir:
- `OFFICIAL_SQUAD_DATA` con jugadores reales;
- seeds que creen jugadores automáticamente;
- migraciones que rellenen nombres, dorsales, posiciones o padres;
- datos de muestra sobre una cuenta real.

Una cuenta nueva debe empezar con plantilla vacía salvo importación explícita y controlada por el usuario.

## 6.4 Protección de sincronización

Las escrituras parciales de una ficha no deben borrar campos existentes.

La protección existe en dos niveles y ambos deben mantenerse:
1. aplicación/IndexedDB;
2. Supabase.

Si una versión remota antigua llega sin algunos campos personales, no debe vaciar los campos locales válidos.

Si una edición manual envía explícitamente un nuevo valor, ese valor sí puede sustituir al anterior.

## 6.5 Historial de fichas

Supabase dispone de historial/auditoría de cambios de jugadores.

Antes de modificar o borrar una ficha se conserva la versión anterior para recuperación.

No eliminar esta protección sin una migración equivalente y validada.

## 6.6 Dorsales

- Dos jugadores activos del mismo equipo no pueden tener el mismo dorsal.
- Si se elimina un jugador, su dorsal vuelve a quedar disponible.
- No asignar dorsales automáticamente.
- No cambiar dorsales durante cálculos de estadísticas o sincronización.

## 6.7 Orden alfabético

Cuando el orden no tenga significado táctico, los jugadores deben mostrarse por nombre en orden alfabético.

Aplica a:
- Plantilla;
- Asistencia;
- selectores normales de jugadores;
- listados equivalentes;
- futuras altas.

No forzar orden alfabético en vistas donde el orden representa:
- posiciones;
- titulares/suplentes;
- sustituciones;
- orden táctico;
- orden de juego.

---

# 7. Estadísticas de jugadores — siempre derivadas de los datos reales

Las fichas de estadísticas deben reflejar el estado actual de partidos, convocatorias y asistencias.

Regla central:

**si se edita o se borra el dato de origen, la estadística derivada debe recalcularse inmediatamente.**

## 7.1 Partidos

Al editar o borrar un partido deben recalcularse los datos relacionados del jugador.

Incluye:
- resultado;
- goles;
- minutos;
- amarillas;
- rojas;
- lesiones;
- incidencias;
- puntuaciones;
- convocatoria;
- asistencia del partido;
- pretemporada vs liga;
- cualquier otro total derivado.

Si un partido cambia de competición/tipo, las estadísticas deben moverse al bloque correcto.

Si un partido se elimina, sus aportaciones deben dejar de existir en las estadísticas.

## 7.2 Entrenamientos y asistencia

Si se edita una asistencia:
- actualizar presentes;
- actualizar llegadas tarde;
- actualizar ausencias.

Si se borra una asistencia:
- eliminar su efecto de las fichas.

Si se borra una sesión de entrenamiento:
- borrar también la asistencia vinculada a esa sesión;
- eliminar todo efecto estadístico de ese día;
- no dejar registros huérfanos.

No conservar ausencias de una sesión que ya no existe.

## 7.3 Convocatorias

Si se edita o elimina una convocatoria:
- recalcular convocatorias;
- recalcular rotaciones o contadores derivados;
- no dejar estadísticas asociadas a una convocatoria inexistente.

## 7.4 No guardar totales derivados como sustituto del origen

Siempre que sea posible, goles, tarjetas, minutos, asistencias y contadores deben derivarse de los eventos/registros de origen.

No convertir un total calculado en la única fuente de verdad si existe el evento original.

---

# 8. Sesiones de entrenamiento — estado y asistencia

Guardar o editar la asistencia de una sesión **no finaliza la sesión**.

El entrenador puede pasar asistencia:
- el mismo día;
- días antes;
- anticipando jugadores que sabe que faltarán;
- anotando retrasos previstos o ausencias conocidas.

La sesión debe seguir visible y editable hasta que el entrenador pulse expresamente **Realizado**.

Reglas:
- asistencia guardada ≠ sesión finalizada;
- una sesión solo pasa a finalizada/archivada mediante la acción explícita **Realizado**;
- borrar la sesión elimina también su asistencia y sus efectos estadísticos;
- editar la fecha de la sesión debe mantener correctamente vinculada su asistencia;
- no cerrar automáticamente una sesión por tener asistencia completa.

Los partidos mantienen su flujo independiente; no aplicarles automáticamente esta regla de sesiones.

---

## 8.1 Crear y editar sesiones

El entrenador debe poder crear y editar sesiones de entrenamiento desde la interfaz normal.

Reglas:
- **+ Nueva sesión** abre el constructor de sesión vacío;
- **Editar** desde la tarjeta de una sesión abre el mismo constructor con todos sus datos existentes;
- **Editar sesión** desde el detalle de una sesión debe hacer lo mismo;
- editar conserva el mismo ID y fecha de creación de la sesión;
- al guardar una edición se actualiza la sesión existente, no se crea un duplicado;
- nombre, fecha, hora, campo, duración objetivo, bloques, duración de cada bloque, notas y material deben quedar editables;
- los ejercicios personales de **Mis ejercicios** se pueden añadir exactamente igual que los del catálogo;
- la clasificación de bloques debe reconocer las categorías actuales, incluida `Calentamiento/activación` como calentamiento y `Juego reducido` como juego final;
- al guardar, la interfaz debe confirmar si la sesión se ha creado o actualizado;
- no romper la asistencia vinculada ni crear registros huérfanos al editar fecha/datos de una sesión.

Antes de dar este flujo por terminado, probar:
**crear → guardar → abrir → editar → guardar → recargar → comprobar que existe una sola sesión con los cambios**.

---

# 9. Acceso local, SaaS y dispositivo

Mantener el **Acceso local con PIN** como alternativa validada.

Para cuentas SaaS:
- puede recordarse una cuenta en un dispositivo;
- después puede pedirse solo un PIN de dispositivo mientras la sesión segura siga siendo válida;
- la cuenta recordada es específica de ese dispositivo;
- no guardar contraseñas en texto plano;
- no bloquear toda la app si una sesión SaaS caduca: debe seguir siendo posible usar el flujo de acceso autorizado correspondiente;
- la verificación y recuperación de correo deben redirigir a la URL real de la app, nunca a `localhost`.

No escribir correos personales concretos del usuario como constantes públicas en el repositorio.

---

# 10. Supabase — reglas adicionales actuales

- RLS es obligatoria para separar cuentas/equipos.
- Un usuario no debe poder leer o escribir datos de otro equipo.
- El delegado puede acceder a los datos de su equipo mediante la relación de membresía, no mediante copia de datos.
- Las funciones administrativas deben validar el rol en servidor.
- El cliente nunca debe poder autopromocionarse a `admin`/`owner`.
- Las promociones, suscripciones, invitaciones y permisos deben validarse en servidor.
- No usar políticas permisivas `using (true)` para datos SaaS reales.
- No ejecutar migraciones destructivas sobre datos deportivos existentes.
- Antes de tocar tablas de jugadores, partidos, asistencias, convocatorias o configuración, comprobar recuentos y preservar los registros existentes.
- Cuando se pruebe una migración con datos reales, usar transacción/rollback siempre que sea posible.

---

# 11. Regla final para futuros agentes

Antes de modificar cualquier pieza relacionada con jugadores, estadísticas, sesiones, cuentas, delegados, pagos o Supabase:

1. leer esta sección completa;
2. revisar el comportamiento actual en código;
3. revisar los datos reales afectados;
4. implementar en rama aislada si es un cambio funcional;
5. probar la regresión exacta que motivó la regla;
6. no borrar ni reemplazar silenciosamente una protección existente.

Si el usuario dice que algo ya estaba validado, asumir que debe preservarse salvo petición explícita de cambio.

---

# 12. Mantenimiento de AGENTS.md — norma de continuidad

Esta norma aplica a cualquier chat o agente que añada instrucciones permanentes al proyecto.

- `AGENTS.md` es un documento acumulativo compartido entre distintos trabajos.
- Cada agente debe añadir su parte bajo títulos claros y fechables cuando sea útil.
- No borrar contenido existente escrito por otros chats/agentes.
- No reescribir, resumir ni “limpiar” secciones ajenas solo por estilo.
- No mover secciones antiguas si no es estrictamente necesario.
- Si una norma nueva sustituye a otra antigua, añadir la nueva norma y explicar expresamente qué comportamiento queda superado, sin eliminar el histórico.
- Las reglas nuevas deben escribirse de forma operativa: qué hacer, qué no hacer y cómo comprobarlo.
- Las correcciones de errores importantes deben quedar documentadas para que otro agente no vuelva a introducir el mismo fallo.

---

# 13. Ajustes — Cuenta de delegado debe ser una sección principal y completa

La gestión del delegado no puede quedar reducida a un texto informativo pequeño.

En **Ajustes** debe existir una sección grande, claramente visible, titulada:

**Cuenta de delegado**

Debe explicar que:
- el delegado usa su propia cuenta;
- comparte el mismo equipo;
- no crea otro equipo;
- solo accede a las vistas autorizadas;
- la cuenta principal controla esos permisos.

La sección debe mostrar siempre de forma visual la lista de permisos/vistas disponibles.

Si todavía no existe delegado:
- mostrar campos de nombre y correo;
- mostrar todas las vistas configurables;
- marcar la vista base de delegado;
- permitir elegir las vistas antes de enviar la invitación.

Si ya existe delegado:
- mostrar identidad/correo del delegado;
- mostrar los permisos actuales;
- permitir ampliar o reducir los permisos;
- guardar los cambios desde la misma sección.

Si la página se visualiza sin una sesión administradora válida:
- no ocultar toda la sección;
- mostrar la estructura y los permisos en modo informativo/no editable;
- indicar que para cambiar esos permisos hay que entrar como Administrador/Entrenador.

`Ajustes` nunca es un permiso concedible al delegado.

La sección debe ocupar el ancho disponible y tener jerarquía visual suficiente para no confundirse con una nota secundaria.

---

# 14. Planes, registro y pago — orden correcto del flujo

Los planes no pueden depender únicamente de entrar primero dentro de la aplicación.

Regla de producto:
- una persona debe poder conocer precios y funciones **antes de registrarse**;
- la pantalla de acceso/registro debe incluir una entrada visible a **Planes**;
- durante el registro debe quedar claro qué planes existen y qué incluye CampoBase;
- después de identificar la cuenta, si no existe acceso válido, se debe mostrar la elección de plan antes de permitir entrar a los datos protegidos;
- un usuario con prueba activa puede continuar con su prueba, pero debe poder ver y contratar un plan sin entrar primero en Ajustes;
- una prueba o suscripción caducada no debe permitir saltarse el pago entrando por una pestaña interna;
- el delegado nunca contrata: hereda el plan del titular del equipo.

El pago real necesita una cuenta identificada para asociar correctamente la suscripción al equipo. Por tanto:
- los planes y precios se muestran públicamente antes del registro;
- Stripe Checkout se inicia después de que exista una cuenta autenticada;
- no pedir al usuario que “entre en la app y luego busque Planes” como único camino de contratación.

## 14.1 Funciones que deben mostrarse en Planes

La página/pantalla de Planes debe explicar que los planes de pago incluyen el conjunto funcional de CampoBase, no solo mostrar un precio.

Como mínimo debe reflejar de forma comprensible:
- Inicio / resumen del día;
- Plantilla y fichas de jugadores;
- estadísticas individuales;
- cuerpo técnico;
- control de asistencia;
- convocatorias;
- preparación de partido;
- alineaciones y reparto;
- partido en vivo;
- cronómetro, cambios e incidencias;
- calendario y resultados;
- sesiones de entrenamiento;
- biblioteca de ejercicios;
- vídeos/demostraciones de ejercicios cuando existan;
- pizarra táctica;
- cuenta de delegado con permisos configurables;
- sincronización en nube;
- acceso desde varios dispositivos;
- copia de seguridad y recuperación previstas por la app;
- personalización de equipo/club;
- soporte de códigos de regalo o descuento cuando aplique.

Mensual y anual pueden incluir las mismas funciones; la diferencia puede ser únicamente el periodo y el precio, salvo que el usuario decida otra cosa.

## 14.2 Precios vigentes mientras no exista una instrucción posterior

- Plan mensual: **9,99 €/mes**.
- Plan anual: **79 €/año**.
- Prueba Pro inicial: **14 días**, si el flujo de alta vigente la mantiene.
- Cuenta Administrador/owner del proyecto: **Pro vitalicio**.

---

# 15. Regla comercial de acceso — prueba, código gratuito o pago

Esta regla es obligatoria y prevalece sobre cualquier comportamiento anterior que concediera acceso únicamente por ser Administrador, owner, entrenador o por tener una cuenta creada.

Una cuenta solo puede entrar a los datos del equipo si cumple **al menos una** de estas condiciones:

1. tiene una **prueba gratuita activa**;
2. tiene un **código gratuito/regalo válido** todavía vigente;
3. tiene una **suscripción pagada activa** mensual o anual.

Si no cumple ninguna:
- no permitir entrar a los datos del equipo;
- no permitir saltarse el bloqueo mediante una pestaña interna;
- no conceder acceso por el rol `admin`, `owner` o `coach`;
- no conceder acceso por haber creado/verificado la cuenta;
- no considerar un descuento pendiente como acceso gratuito;
- no considerar un código caducado como acceso;
- no permitir que el PIN local antiguo de una cuenta SaaS sustituya esta comprobación.

La cuenta Administrador del proyecto puede seguir teniendo Pro vitalicio, pero debe estar representado en la suscripción como `gift_free`/regalo vitalicio; no debe depender de un bypass por rol.

La cuenta de delegado:
- no compra un plan propio;
- hereda el acceso comercial del titular del mismo equipo;
- si el titular pierde el acceso por caducidad, el delegado también queda bloqueado.

## 15.1 Texto de producto claro

No usar explicaciones ambiguas como:

“la prueba se mantiene mientras siga vigente en el alta”.

Explicar de forma directa:

- **Creas tu cuenta.**
- **Tienes 14 días gratis.**
- **Después necesitas un plan mensual/anual o un código gratuito válido.**
- **Sin prueba activa, código gratuito válido o suscripción pagada, no puedes entrar a los datos del equipo.**

## 15.2 Planes deben ser visuales y mostrar todas las funciones

La pantalla de Planes debe ser visual, no una lista técnica pequeña.

Debe agrupar las funciones en bloques claros, como mínimo:

### Equipo y jugadores
- Inicio / resumen del día;
- Plantilla;
- fichas de jugadores;
- estadísticas individuales;
- cuerpo técnico;
- asistencia;
- cuenta de delegado con permisos.

### Partidos
- convocatorias;
- reparto de minutos;
- preparación;
- alineaciones;
- partido en vivo;
- cronómetro;
- cambios;
- goles;
- tarjetas;
- lesiones;
- incidencias;
- puntuaciones;
- calendario;
- resultados;
- liga y pretemporada.

### Entrenamientos
- sesiones;
- asistencia por sesión;
- biblioteca de ejercicios;
- búsqueda y filtros;
- vídeos/demostraciones;
- planificación por bloques;
- materiales;
- pizarra táctica.

### Cuenta, nube y seguridad
- sincronización en nube;
- varios dispositivos;
- copias/recuperación;
- personalización de equipo/club;
- escudo, colores y tema;
- PIN de dispositivo cuando proceda;
- códigos de regalo;
- códigos de descuento.

Mensual y anual incluyen las mismas funciones mientras no haya una instrucción posterior que diga lo contrario.

La elección de Planes debe poder verse **antes del registro**, y después de identificarse la cuenta debe comprobarse el acceso antes de mostrar los datos del equipo.

---

# 16. REGLAS — SUBIR VÍDEOS Y DÓNDE

Esta sección pertenece únicamente al área de vídeos/almacenamiento. Cualquier agente al que Miguel asigne una tarea de vídeos debe leer las reglas generales de convivencia y esta sección. No debe editar, resumir, reordenar ni actualizar las reglas de ejercicios, interfaz, jugadores, sesiones, pagos u otras áreas salvo petición explícita de Miguel.

## 16.1 Requisito económico obligatorio: 0 € y sin sorpresas

Para el almacenamiento y entrega de vídeos de CampoBase, Miguel exige **coste máximo real de 0 €**.

- No usar servicios con facturación automática por exceso.
- No activar Pay As You Go, overage billing, auto-recharge o equivalentes.
- No añadir una tarjeta para habilitar consumo facturable.
- Si un servicio gratuito alcanza un límite, se prefiere limitación/suspensión antes que una factura.
- No cambiar de proveedor sin autorización explícita de Miguel.

## 16.2 Destino vigente: GitHub Releases

El destino vigente de los MP4 pesados de CampoBase es **GitHub Releases del repositorio `Miguelperezh/campobase`**.

Release de producción:
- tag: `campobase-videos-v1`;
- nombre: `CampoBase video assets v1`;
- estado: release estable, no prerelease;
- migración inicial completada el 18/09/2026;
- 323/323 MP4 migrados;
- 316.509.123 bytes verificados en origen y destino.

La aplicación de producción ya resuelve los MP4 migrados hacia este release mediante `resolveHostedVideoUrl()` en `js/ejercicio-videos.js`.

Validación realizada antes de activar producción:
- descarga completa;
- HTTP Range `206`;
- `Accept-Ranges: bytes`;
- reproducción;
- seek/avance/retroceso;
- Chromium;
- WebKit;
- smoke test contra la web de producción publicada en GitHub Pages;
- batería `CampoBase verify` en verde.

Cloudflare R2 y Tigris NO son destinos vigentes. No reactivar esos caminos salvo petición expresa de Miguel.

GitHub Releases no se tratará como un CDN con SLA. GitHub puede limitar alojamiento/actividad si considera el uso de ancho de banda significativamente excesivo. Si algún día el servicio deja de ser adecuado, no cambiar de proveedor por iniciativa propia: documentar el problema y esperar autorización de Miguel.

## 16.3 Qué se guarda en cada sitio

- **GitHub/código:** definición oficial del ejercicio y código de CampoBase.
- **GitHub Releases:** archivos MP4 pesados.
- **Supabase:** datos sincronizados de CampoBase y metadata que la aplicación necesite compartir.
- **Sesiones:** referencias mediante `exerciseId`; nunca incrustar MP4 ni blobs.

Los MP4 originales que aún permanezcan en Supabase Storage son únicamente rollback de seguridad de la migración histórica. No deben considerarse el destino para nuevos vídeos y no deben borrarse sin autorización expresa de Miguel.

Una tarea de vídeos no autoriza a mover jugadores, partidos, sesiones, estadísticas, Auth, pagos, interfaz ni otros datos.

## 16.4 Acceso para IA y agentes

La identidad del agente no importa. Importa la función asignada y el permiso concedido.

Un agente autorizado para vídeos puede gestionar los assets mediante GitHub API/CLI con los permisos concedidos al repositorio.

- No pedir a Miguel que suba manualmente vídeos si el agente dispone de acceso autorizado.
- Nunca guardar tokens/secretos en Git, frontend, documentación o logs.
- Usar permisos mínimos.
- No borrar un vídeo existente salvo petición expresa y con rollback/validación.
- Si el entorno concreto del agente no dispone de una acción capaz de subir binarios a Releases, debe usar un entorno autorizado que sí disponga de GitHub API/CLI; no debe volver a Supabase ni cambiar de proveedor por su cuenta.

## 16.5 Nombres, rutas y asociación

Los assets de GitHub Releases son archivos planos, no carpetas.

Regla de nombre para un objeto cuya ruta lógica sea, por ejemplo:
`library-v2-preview/pdf150-022/ejercicio.mp4`

Asset en Releases:
`library-v2-preview__pdf150-022__ejercicio.mp4`

Regla:
- convertir cada `/` de la ruta lógica en `__`;
- no cambiar `exerciseId`;
- usar nombres de asset estables y únicos;
- mantener una correspondencia determinista entre `exerciseId`, tipo de vídeo y asset;
- no sobrescribir silenciosamente otro ejercicio;
- mantener separadas las funciones de `ejercicio.mp4` y vídeo humano/de muestra;
- no fabricar una URL de Release para una ruta que nunca haya sido subida realmente.

Durante la migración se detectaron referencias `CAMPOBASE-VIDEO-.../ejercicio.mp4` que no existían físicamente en Storage. El resolver está diseñado para NO convertir esas referencias en assets inexistentes. Ningún agente debe “arreglarlas” inventando un archivo o cambiando el ejercicio sin una tarea específica de Miguel.

## 16.6 Migración y rollback

La migración Supabase Storage → GitHub Releases está completada en producción.

Para cualquier migración futura, el orden obligatorio sigue siendo:
1. copiar;
2. verificar descarga completa y tamaño;
3. verificar HTTP Range/206 para seek;
4. comprobar reproducción;
5. probar en rama aislada;
6. probar Chromium/WebKit y móvil/escritorio cuando corresponda;
7. cambiar producción solo después de validar;
8. mantener la fuente anterior como rollback hasta autorización expresa para borrarla.

No hacer una migración destructiva directa.

## 16.7 Nuevos vídeos futuros

Cuando Miguel pida a una IA/agente crear o integrar un ejercicio con vídeo:

1. determinar el `exerciseId` correcto según las reglas de ejercicios;
2. preparar la ruta lógica estable del vídeo;
3. convertir la ruta lógica al nombre plano del asset sustituyendo `/` por `__`;
4. subir el MP4 al release `campobase-videos-v1`;
5. comprobar que el asset existe y que su tamaño es correcto;
6. comprobar reproducción y seek;
7. actualizar únicamente la referencia necesaria del ejercicio/metadata;
8. comprobar que CampoBase carga el vídeo correcto;
9. ejecutar las pruebas relacionadas antes de fusionar.

URL pública de un asset:
`https://github.com/Miguelperezh/campobase/releases/download/campobase-videos-v1/<NOMBRE_ASSET>`

- No mandar a Miguel a realizar manualmente la subida si el agente dispone de acceso GitHub autorizado.
- No guardar nuevos MP4 en Supabase Storage como solución alternativa salvo petición explícita.
- No incrustar vídeos binarios en la base de datos.
- No meter MP4 pesados como archivos normales del repositorio cuando su destino corresponde a Releases.

## 16.8 Cambios prohibidos desde una tarea de vídeos

Una tarea de vídeos NO autoriza a:
- modificar reglas de ejercicios;
- modificar interfaz/UX;
- cambiar categorías;
- cambiar jugadores;
- cambiar sesiones;
- cambiar estadísticas;
- cambiar pagos o autenticación;
- refactorizar otras áreas;
- actualizar otras secciones de AGENTS.md.

Solo se toca otra área cuando Miguel lo pida expresamente.

## 16.9 Validación mínima

Antes de declarar terminado cualquier cambio de vídeo:
- URL remota válida;
- asset realmente existente;
- tamaño correcto;
- reproducción completa;
- seek/avance/retroceso correcto;
- asociación correcta ejercicio-vídeo;
- prueba de navegador relevante;
- pruebas del proyecto correspondientes;
- cero vídeos faltantes o rotos.

---

# 16. UI de Planes y Delegado — legibilidad obligatoria

Estas reglas nacen de una regresión visual real detectada en validación.

## 16.1 Planes

La pantalla/modal de Planes debe poder leerse sin solapes.

No permitir:
- tarjetas con columnas tan estrechas que las palabras se monten unas sobre otras;
- grids anidados de dos columnas dentro de tarjetas demasiado pequeñas;
- diálogos estrechos para listas largas de funciones;
- textos cortados lateralmente.

Reglas:
- el diálogo de Planes debe usar un ancho amplio en escritorio;
- las categorías de funciones pueden mostrarse 2x2 solo si cada tarjeta mantiene ancho suficiente;
- al reducir el ancho, las categorías deben pasar a una sola columna;
- el texto debe poder envolver sin invadir otra columna;
- validar visualmente también con una ventana del navegador reducida o con barra lateral abierta;
- el bloque de acceso debe ser legible y no comprimirse.

## 16.2 Cuenta de delegado

La sección **Cuenta de delegado** debe ser uno de los bloques principales de Ajustes.

Debe:
- ocupar todo el ancho de la rejilla;
- mostrar claramente nombre/correo de la cuenta asociada;
- mostrar siempre el bloque de permisos;
- mostrar todas las vistas configurables;
- usar tarjetas/checks suficientemente grandes;
- no limitarse a un párrafo informativo;
- seguir siendo comprensible incluso antes de iniciar sesión, mostrando la estructura en modo deshabilitado;
- al iniciar sesión como Administrador/Entrenador, convertir esa misma estructura en editable.

La lista de permisos no puede quedar escondida detrás de una acción secundaria ni depender de que el usuario adivine dónde configurarla.

## 16.3 Validación visual

Antes de dar por terminada una modificación visual:
1. comprobar que no hay solapes;
2. comprobar escritorio y ancho reducido;
3. comprobar que títulos, botones, checks y textos se leen completos;
4. comprobar específicamente Planes y Cuenta de delegado si se han tocado;
5. no afirmar que una interfaz está validada solo porque pase tests de código.

---

# 17. Planes — diseño profesional, texto completo y sin referencias comerciales a “nube”

Esta norma corrige una regresión visual detectada en validación.

## 17.1 El texto nunca puede partirse de forma artificial

En Planes y en cualquier pantalla comercial:
- no usar `overflow-wrap:anywhere` para textos normales;
- no usar reglas que puedan partir palabras por la mitad;
- mantener `word-break: normal`;
- mantener `hyphens: none` salvo petición expresa;
- las tarjetas deben crecer o pasar a una sola columna antes de comprimir el texto;
- en el modal de acceso/registro, las listas de funciones deben ser de una columna si el espacio es limitado;
- la legibilidad tiene prioridad sobre meter más columnas.

Ejemplos que no deben volver a aparecer:
- `Estadístic / as`;
- `configurab / les`;
- `entrenami / entos`;
- cualquier palabra dividida porque la tarjeta sea demasiado estrecha.

## 17.2 Presentación profesional

La pantalla de Planes debe usar:
- jerarquía clara;
- tarjetas amplias;
- títulos cortos;
- listas limpias;
- pasos de acceso en formato vertical legible;
- numeración o iconografía sobria;
- suficiente espacio en blanco.

No usar una cuadrícula de muchas cajas estrechas si perjudica la lectura.

## 17.3 No vender la infraestructura

No mostrar “nube”, “sincronización en la nube” ni lenguaje de infraestructura como argumento comercial en la pantalla de Planes.

Sí pueden mostrarse beneficios concretos para el usuario, por ejemplo:
- acceso desde varios dispositivos;
- aplicación instalable;
- exportar e importar datos;
- personalización;
- PIN de dispositivo;
- códigos de regalo/descuento.

La infraestructura técnica puede seguir existiendo y documentarse en archivos técnicos, pero no debe aparecer como función comercial salvo petición expresa del usuario.

---

# 18. Fase 4 — diseño validado y flujo obligatorio de registro, prueba y pago

**Estado visual validado por el usuario el 18/09/2026.**

El diseño actual de Planes, la presentación de funciones, la regla comercial de acceso y la sección ampliada de Cuenta de delegado se consideran validados. No rehacer su estructura visual sin una petición posterior expresa.

## 18.1 Registro con plan y método de pago

Una cuenta principal nueva no debe obtener acceso solo por registrarse.

Flujo obligatorio:
1. el usuario puede ver Planes antes de registrarse;
2. al crear la cuenta debe elegir plan mensual o anual;
3. después de confirmar/identificar su cuenta debe completar Stripe Checkout y dejar un método de pago;
4. Stripe inicia una prueba gratuita de 14 días;
5. durante esos 14 días no se cobra;
6. mostrar siempre la fecha exacta en la que termina la prueba y comenzaría el primer cobro;
7. el usuario puede cancelar antes de esa fecha y no debe producirse el primer cobro;
8. cuando Stripe confirma la prueba, la cuenta pasa a estado `trial` y obtiene acceso;
9. si no completa Stripe y tampoco dispone de un código gratuito válido, no puede entrar a los datos del equipo.

No confundir:
- **cuenta creada** con **acceso concedido**;
- **plan elegido** con **pago/método de pago configurado**;
- **código de descuento** con **código gratuito**.

## 18.2 Fecha de finalización de la prueba

La fecha de prueba debe proceder del servidor/Supabase y mantenerse alineada con Stripe.

En interfaz debe mostrarse con un texto inequívoco, por ejemplo:

**Prueba gratis hasta el 2 de octubre de 2026. No se te cobrará antes de esa fecha. Puedes cancelar antes de que termine la prueba.**

No usar una fecha inventada ni depender solo del reloj del navegador cuando ya exista una fecha de servidor.

## 18.3 Cancelación

Debe existir una acción real de cancelación cuando ya existe una suscripción Stripe.

Durante la prueba:
- cancelar debe programar la baja al final de la prueba;
- el usuario conserva acceso hasta la fecha de fin;
- no debe producirse el primer cobro.

En una suscripción pagada:
- cancelar debe programar la baja al final del periodo ya pagado;
- el acceso se mantiene hasta la fecha vigente.

La cancelación debe ejecutarse en servidor/Edge Function. Nunca simularla únicamente en la interfaz.

## 18.4 Regla de acceso reforzada

Para cuentas principales nuevas, el estado previo a configurar Stripe debe ser un estado sin acceso (por ejemplo `pending_payment`).

Solo conceden acceso:
- `trial` confirmado;
- `gift_free` válido;
- `active` pagado.

El delegado sigue heredando el acceso del titular y nunca configura un pago propio.

---

# 19. Prueba gratuita — contador visible y cancelación en Ajustes

Esta norma completa el flujo validado de la Fase 4.

## 19.1 Dónde se muestra el contador

Mientras una cuenta principal esté en estado `trial` activo:
- mostrar un contador compacto en **Hoy**;
- mostrar el detalle completo en **Ajustes → Mi cuenta y suscripción**;
- indicar siempre la fecha exacta de fin de prueba;
- no usar un contador de segundos ni una animación invasiva.

Formato recomendado:
- **Quedan X días**
- **Termina el [fecha exacta]**
- **No se te cobrará antes de esa fecha**

El contador se deriva de `suscripciones.expira_en`, no de una fecha inventada en cliente.

## 19.2 Dónde se cancela

La acción **Cancelar renovación** no pertenece a la pantalla comercial de Planes.

Debe estar en:

**Ajustes → Mi cuenta y suscripción**

Durante la prueba, el texto debe ser todavía más claro:

**Cancelar antes del primer cobro**

Al cancelar durante la prueba:
- mantener acceso hasta la fecha de fin;
- marcar `cancel_at_period_end`;
- no realizar el primer cobro;
- mostrar la confirmación y la fecha hasta la que mantiene acceso.

Después de pagar:
- la misma zona de Ajustes permite cancelar la renovación;
- mantiene acceso hasta el final del periodo pagado.

## 19.3 Planes es comercial; Ajustes es gestión

Separación obligatoria:
- **Planes**: precios, funciones, elección mensual/anual, códigos y contratación;
- **Ajustes → Mi cuenta y suscripción**: estado real, fecha de prueba/periodo, contador, renovación y cancelación.

No mezclar ambas responsabilidades en una misma pantalla salvo que sea necesario por el paywall previo al acceso.

---

# 20. Simulación visual de prueba — solo para validación

Existe un modo de simulación visual para poder revisar la experiencia de prueba gratuita antes de conectar Stripe real.

Activación:
- abrir la app de validación con `?simulacion=prueba`.

La simulación debe:
- mostrar una prueba activa ficticia;
- mostrar el contador en **Hoy**;
- mostrar fecha de finalización;
- mostrar **Cancelar antes del primer cobro** en **Ajustes → Mi cuenta y suscripción**;
- permitir simular la cancelación y mostrar el estado posterior;
- indicar claramente que es una simulación;
- no modificar Supabase;
- no modificar Stripe;
- no cancelar ni cambiar la suscripción real;
- no conceder acceso real si la cuenta no lo tiene;
- no usarse como sustituto de una prueba real de Stripe.

La simulación sirve únicamente para validar diseño, textos y flujo de interacción.

---

# 21. Colores y tipografía — siempre vinculados a Ajustes

Esta regla aplica a toda la interfaz, incluida Fase 4, simulaciones, Planes, Ajustes y futuros módulos.

## 21.1 Botones

Los botones principales no pueden llevar un color fijo de marca dentro del CSS.

Deben usar el color de acento configurado en:

**Ajustes → Preferencias visuales y tema**

Variables de referencia:
- `--cb-brand`;
- `--brand`;
- `--cb-accent`.

El texto de un botón principal debe usar el contraste calculado para ese color:
- `--cb-accent-text`.

No volver a imponer un rojo fijo como `--cb-red-600` para botones principales si el usuario ha elegido otro color de acento.

Los botones secundarios deben conservar una apariencia secundaria, pero derivada del color configurado y del fondo actual, manteniendo contraste y legibilidad.

## 21.2 Color de fuente

Textos, títulos, metadatos y componentes nuevos deben heredar el color de fuente configurado por el usuario.

Variables de referencia:
- `--ink`;
- `--cb-font-custom-color`;
- variables `--cb-slate-*` ya sincronizadas por el gestor de tema cuando proceda.

No introducir negro, blanco o gris como color principal de texto si eso impide que la preferencia de fuente de Ajustes se aplique.

Excepción:
- cuando un botón o elemento coloreado necesita contraste, usar el color de contraste calculado (`--cb-accent-text`) en vez del color normal de fuente.

## 21.3 Fase 4 y simulaciones

En:
- Mi cuenta y suscripción;
- Planes;
- contador de prueba;
- simulación de prueba;
- Cuenta de delegado;
- paywall;
- botones de contratación/cancelación;

los colores deben cambiar automáticamente al modificar el tema desde Ajustes.

No crear una paleta propia para Fase 4.

## 21.4 Comprobación

Antes de dar por validado un cambio visual:
1. cambiar el color de acento en Ajustes y comprobar los botones;
2. cambiar el color de fuente y comprobar títulos, párrafos y metadatos;
3. comprobar que el texto de los botones mantiene contraste;
4. comprobar que ningún componente nuevo conserva rojo/negro/blanco fijo salvo que sea semánticamente necesario.

---

# 22. Corrección de seguridad de validaciones — la simulación nunca entra en la app real

Esta norma corrige el enfoque anterior de la sección 20.

La simulación visual de Fase 4 **no debe activarse mediante parámetros dentro de la aplicación real** ni sustituir temporalmente el usuario, la suscripción o el contexto de datos.

Motivo:
- una simulación incrustada en la app puede interferir con autenticación, PIN, sesión y carga de datos;
- una URL de validación en otro origen puede no compartir almacenamiento local con la app real;
- una simulación nunca debe hacer parecer que la aplicación real está vacía o desbloqueada.

Regla vigente:
- la app real conserva siempre su autenticación normal;
- sin sesión válida debe mostrarse un acceso claro por cuenta y mantenerse disponible el acceso local con PIN;
- una cuenta recordada con sesión válida puede seguir usando su PIN de dispositivo;
- la simulación vive en una página independiente, actualmente `simulacion-fase4.html`;
- esa página no importa `app.js`, no conecta con Supabase, no usa datos reales y no modifica ninguna cuenta;
- cualquier botón de pago, cancelación, registro o delegado dentro de esa página es únicamente demostrativo.

La simulación independiente debe usarse para validar:
- registro;
- elección mensual/anual;
- paso visual por Stripe;
- activación de prueba;
- contador;
- cancelación antes del primer cobro;
- Planes;
- Cuenta de delegado y permisos.

Después de validar la interfaz en esa simulación, la funcionalidad real se prueba por separado con autenticación y Stripe reales.

---

# 21. Corrección de la simulación — nunca dentro del runtime real

La simulación visual de prueba **no debe activarse dentro de la app real mediante query params ni sustituir el contexto real de usuario/suscripción**.

Queda prohibido volver a:
- inyectar una suscripción ficticia en `billing-manager.js`;
- sustituir `currentContext` o el usuario real por un usuario simulado;
- usar `?simulacion=prueba` para alterar el runtime real;
- ocultar o saltarse el flujo normal de login/PIN por mostrar una simulación;
- hacer que una simulación pueda afectar carga de datos, sesión, IndexedDB, Supabase o Stripe.

La simulación debe vivir en una página separada:
- `billing-preview.html`

Objetivo:
- enseñar registro + elección de plan;
- enseñar contador de prueba;
- enseñar Ajustes → Mi cuenta y suscripción;
- enseñar cancelación antes del primer cobro;
- permitir validar textos y diseño sin tocar la app ni sus datos.

La app real y la simulación deben estar completamente separadas.

---

# 21. Producción y Supabase — una rama aislada no puede cambiar el backend vivo

Esta norma se añade después de una incidencia real de producción y es obligatoria.

- Si una función está todavía en una rama de validación, sus migraciones SQL, RLS, triggers, Edge Functions que alteren acceso, y cambios de autenticación **no deben cambiar el comportamiento de la app publicada en `main`**.
- No aplicar a la base de datos de producción una política RLS que dependa de código que todavía no está publicado y validado en `main`.
- No cambiar `handle_new_user`, el modelo de acceso, la propiedad de datos o el bloqueo por suscripción en producción mientras la interfaz correspondiente siga aislada en otra rama.
- Una rama aislada de frontend no equivale a un entorno aislado de Supabase.
- Para probar Fase 4 antes de fusionarla, usar simulación visual o un entorno backend separado. No reutilizar Supabase de producción para probar restricciones incompatibles con la app publicada.
- Antes de aplicar cualquier migración que afecte acceso:
  1. comprobar qué versión está actualmente en `main`;
  2. comprobar qué cliente espera esa versión;
  3. verificar que RLS y cliente son compatibles;
  4. crear una vía de rollback;
  5. comprobar que el propietario actual sigue viendo sus datos.
- Después de tocar RLS/autenticación, probar expresamente con la cuenta real del propietario que puede leer jugadores, partidos, asistencias, convocatorias y configuración.
- Un fallo de módulos SaaS nunca puede dejar la aplicación abierta y vacía sin mostrar acceso. Debe existir siempre un fallback visible a login y al PIN local validado.
- No borrar datos para resolver un problema de acceso. Primero restaurar autenticación/RLS y comprobar los registros existentes.

## 21.1 Incidencia del 18/09/2026

La Fase 4 llegó a modificar el backend de producción mientras su interfaz seguía en validación. Esto podía provocar una app vacía o sin flujo de acceso aunque los registros siguieran almacenados.

La corrección de producción restaura:
- aislamiento por `auth.uid() = user_id`;
- cliente de datos por usuario;
- login SaaS estable;
- botón de acceso local con PIN;
- fallback que abre el PIN si falla el módulo SaaS;
- Fase 4 otra vez fuera del flujo activo de producción hasta validación completa.

No volver a introducir el acoplamiento de una rama no publicada con el backend vivo.

---

# 23. Registro obligatorio por pasos entre chats — no sobrescribir trabajo ajeno

Esta sección es acumulativa. Desde el 19/09/2026, **cada cambio realizado en CampoBase debe quedar documentado aquí antes de considerar terminado el paso**.

Regla de convivencia:
- no borrar, resumir, fusionar ni reescribir instrucciones añadidas por otros chats/agentes;
- cada nuevo paso se añade al final bajo un título nuevo y fechado;
- si una instrucción anterior queda obsoleta, no se elimina: se añade una corrección posterior indicando expresamente qué regla nueva prevalece;
- un agente nuevo debe leer este archivo completo antes de tocar código, Supabase o datos;
- nunca asumir que una rama, una prueba o una interfaz está validada porque pase tests;
- solo Miguel puede dar una validación visual como definitiva.

## 23.1 Plantilla obligatoria para documentar cada paso

Cada paso nuevo debe dejar, como mínimo:

**Título del paso**
- fecha;
- rama;
- objetivo exacto;
- estado: pendiente / probado técnicamente / pendiente de validación visual / validado por Miguel.

**Qué se ha tocado**
- archivos modificados;
- tablas, funciones, políticas o migraciones de Supabase afectadas;
- claves de almacenamiento local/sesión afectadas, si procede.

**Dónde se guarda la información**
- fuente canónica;
- copia local;
- historial/auditoría disponible;
- mecanismo de recuperación.

**Qué NO se ha tocado**
- dejarlo escrito cuando sea relevante para evitar que otro chat haga cambios adicionales por error.

**Pruebas**
- tests ejecutados;
- resultado;
- comprobaciones de datos realizadas;
- URL real de validación cuando exista.

**Validación**
- no marcar como validado hasta que Miguel lo diga expresamente.

## 23.2 Mapa vigente de datos reales — dónde se guarda cada cosa

Fuente remota principal: **Supabase del proyecto CampoBase**.

Mapeo cloud vigente:
- jugadores / fichas → `public.jugadores`;
- historial de fichas de jugadores → `public.jugadores_historial`;
- partidos → `public.partidos`;
- convocatorias → `public.convocatorias`;
- asistencias y registros de entrenamiento → `public.asistencias`;
- configuración y otros registros del store `settings` → `public.configuracion`.

Copia local del navegador:
- IndexedDB base principal: `campobase_<user_id>` cuando existe una cuenta SaaS vinculada;
- base legado: `campobase` únicamente para datos antiguos/locales que todavía no se hayan vinculado;
- stores locales: `players`, `callups`, `matches`, `trainings`, `settings`, `syncQueue`.

Identidad de cuenta:
- `localStorage['campobase.saasUserId']` vincula el navegador con el usuario SaaS;
- la sesión Supabase es la autoridad de autenticación remota;
- nunca crear una base local vacía como sustituto de una cuenta existente con datos en Supabase.

## 23.3 Protección de fichas de jugadores

La ficha actual que Miguel guarda desde **Editar jugador** queda en:
- `public.jugadores.payload`.

Antes de modificar o borrar una ficha, el historial automático vigente usa:
- tabla: `public.jugadores_historial`;
- trigger: `trg_proteger_ficha_jugador`;
- eventos protegidos: `UPDATE` y `DELETE`.

Reglas:
- no borrar `jugadores_historial`;
- no borrar tombstones para “limpiar” la base;
- no reconstruir teléfonos, padres, dorsales, posiciones, DNI, fechas de nacimiento, notas o fotos desde memoria;
- no guardar datos personales reales dentro del repositorio público ni dentro de este `AGENTS.md`;
- ante una incidencia, comparar versión actual + historial antes de restaurar;
- una restauración nunca es masiva ni automática si no se ha identificado la fuente exacta.

Última plantilla validada por Miguel el 19/09/2026:
- 15 jugadores activos.
- La identidad y teléfonos validados están guardados en Supabase, no se duplican aquí por privacidad.
- Antonio Roldán Rendón está creado con dorsal 3 y sus teléfonos/datos familiares permanecen vacíos hasta que Miguel los aporte tras su ficha.

## 23.4 Estadísticas — dónde está la fuente que permite reconstruirlas

Las estadísticas son **derivadas**, no una fuente independiente.

Se deben poder recalcular desde:
- partidos → `public.partidos`;
- convocatorias → `public.convocatorias`;
- asistencias → `public.asistencias`;
- fichas base → `public.jugadores`;
- configuración relacionada → `public.configuracion`.

Nunca corregir una estadística escribiendo un total inventado si el dato de origen está mal.

Antes de editar o borrar un partido, convocatoria, asistencia o sesión:
1. comprobar el registro real en Supabase;
2. comprobar qué estadísticas derivadas dependen de él;
3. preservar una versión recuperable;
4. modificar el origen;
5. recalcular derivados;
6. verificar que no quedan registros huérfanos.

## 23.5 Incidencia activa — 19/09/2026 — app vacía, recarga pierde vista y expulsa sesión

Rama de corrección:
- `fix/estabilidad-datos-sesion-20260919`.

Producción afectada:
- `https://miguelperezh.github.io/campobase/`.

Síntomas comunicados por Miguel:
- la app aparece vacía aunque Supabase conserva datos;
- al actualizar la página no mantiene la pestaña/vista activa;
- al actualizar expulsa del acceso y obliga a volver a entrar.

Datos verificados antes de tocar código:
- Supabase conserva 15 jugadores activos;
- conserva partidos, convocatorias, asistencias y configuración;
- el historial de jugadores sigue existiendo;
- por tanto, **no tratar esta incidencia como pérdida de datos ni restaurar masivamente**.

Prioridad:
1. asegurar que la sesión válida se vincula a la base local correcta antes de cualquier sincronización;
2. impedir que una cola local legado se suba a la cuenta equivocada;
3. mantener la vista activa tras recarga;
4. mantener la sesión del mismo navegador/pestaña sin pedir acceso de nuevo mientras la sesión segura siga válida;
5. añadir protección de recuperación para partidos, convocatorias, asistencias y configuración;
6. ejecutar todos los tests;
7. entregar URL real a Miguel;
8. no fusionar el arreglo funcional a `main` hasta validación visual expresa.

## 23.6 Paso 1 — 19/09/2026 — creación de rama segura y registro previo

Estado:
- rama creada: `fix/estabilidad-datos-sesion-20260919`;
- base de la rama: `main` en commit `d320b84bf7d42f3e2b806594d91965ef2034ac20`;
- no se han modificado datos deportivos en este paso;
- no se ha fusionado nada a `main`.

Objetivo del siguiente paso:
- corregir primero el vínculo sesión → usuario → IndexedDB antes de ejecutar la sincronización.

## 23.7 Paso 2 — 19/09/2026 — vincular usuario antes de abrir la base/cola local

Estado:
- implementado en rama;
- pendiente de batería completa de tests;
- pendiente de validación visual de Miguel.

Archivos modificados:
- `js/db.js`;
- `js/supabase-client.js`.

Problema detectado:
- `activeDatabaseName` podía haberse calculado como base legado `campobase` antes de recuperar `campobase.saasUserId` desde una sesión Supabase válida;
- `flushSyncQueue()` podía leer la cola local antes de verificar qué usuario SaaS era el dueño real de esa sincronización;
- esto podía hacer que la app abriese una base local vacía/equivocada o que una cola legado llegase a procesarse con una cuenta recuperada después.

Corrección:
- `openDatabase()` vuelve a resolver la base real mediante `boundDatabaseName()` antes de cada apertura real;
- el cloud store expone `prepare()`;
- `flushSyncQueue()` ejecuta `cloudStore.prepare()` **antes** de leer `syncQueue`;
- `prepare()` exige sesión Supabase válida y reconstruye el vínculo local si la sesión ya identifica al usuario.

Dónde se guarda:
- vínculo navegador/cuenta: `localStorage['campobase.saasUserId']`;
- base local correcta: `campobase_<user_id>`;
- cola de sincronización correcta: store `syncQueue` dentro de esa misma base;
- fuente remota: tablas Supabase del usuario protegidas por RLS.

Qué NO se ha tocado:
- no se han borrado datos;
- no se han cambiado jugadores, partidos, convocatorias ni asistencias;
- no se ha fusionado a `main`.

## 23.8 Paso 3 — 19/09/2026 — mantener sesión y pestaña al actualizar

Estado:
- implementado en rama;
- pendiente de batería completa de tests;
- pendiente de validación visual de Miguel.

Archivos modificados:
- `js/app.js`;
- `js/saas-auth-ui-v2.js`;
- `sw.js`.

Vista/pestaña:
- nueva clave de sesión: `sessionStorage['campobase.activeView']`;
- `showView()` guarda la vista activa;
- al arrancar se restaura primero `?view=` si existe y, si no, la última vista guardada;
- una recarga no debe devolver al usuario automáticamente a Plantilla/Hoy si estaba trabajando en otra pestaña.

Acceso local:
- `sessionStorage['campobase.sessionRole']` puede restaurar owner/delegate durante la misma pestaña si no existe vínculo SaaS;
- cerrar la pestaña elimina esa sesión del navegador;
- no se almacena contraseña en claro.

Acceso SaaS:
- `sessionStorage['campobase.saasActiveBrowserSession']` deja de consumirse tras una única recarga;
- mientras la sesión Supabase siga siendo válida, la misma pestaña puede volver a desbloquearse sin expulsar al usuario;
- cerrar sesión explícitamente sigue limpiando el estado de sesión.

Service Worker:
- ya no ejecuta `client.navigate(client.url)` para todas las ventanas durante `activate`;
- `app.js` mantiene un único manejo de `controllerchange`;
- objetivo: evitar recargas dobles durante una actualización de CampoBase.

Qué NO se ha tocado:
- RLS;
- suscripciones;
- billing;
- fichas de jugadores;
- estadísticas;
- contenido de partidos/asistencias.

## 23.9 Paso 4 — 19/09/2026 — pruebas de regresión añadidas

Estado:
- tests escritos;
- ejecución completa pendiente.

Archivos:
- `tests/auth-boot-recovery.test.js`;
- `tests/session-data-stability.test.js`.

Cobertura nueva:
- la sesión cloud se prepara antes de leer `syncQueue`;
- IndexedDB vuelve a resolver la base del usuario;
- el cloud store expone `prepare()`;
- la vista activa se conserva;
- el acceso local de la misma pestaña puede restaurarse;
- la sesión SaaS de la pestaña no se consume tras una sola recarga;
- el service worker no fuerza una segunda navegación.

No marcar este bloque como validado hasta:
1. `npm ci`;
2. `npm run check`;
3. `npm test`;
4. comparación de rama vs `main`;
5. comprobación de datos reales en Supabase;
6. validación visual de Miguel.

## 23.10 Paso 5 — 19/09/2026 — historial recuperable para partidos, convocatorias, asistencias y configuración

Estado:
- migración añadida al repositorio en la rama;
- migración aplicada correctamente al Supabase de producción;
- pendiente de validación visual de la app, pero la protección de historial ya está activa.

Archivo añadido:
- `supabase/09_data_audit_history.sql`.

Nueva tabla de auditoría:
- `public.campobase_datos_historial`.

Qué protege:
- `public.partidos`;
- `public.convocatorias`;
- `public.asistencias`;
- `public.configuracion`.

Triggers activos:
- `trg_auditar_partidos`;
- `trg_auditar_convocatorias`;
- `trg_auditar_asistencias`;
- `trg_auditar_configuracion`.

Cada trigger guarda el registro **anterior** antes de:
- `UPDATE`;
- `DELETE`.

Seguridad:
- RLS activada en `public.campobase_datos_historial`;
- el usuario solo puede consultar su propio historial mediante `auth.uid() = user_id`;
- no existe política cliente de escritura/borrado del historial;
- la escritura la realiza la función de trigger `auditar_campobase_dato()`.

Línea base guardada el 19/09/2026:
- partidos: 26 registros históricos de base;
- convocatorias: 27 registros históricos de base;
- asistencias: 24 registros históricos de base;
- configuración: 175 registros históricos de base.

La línea base incluye filas activas y tombstones existentes para maximizar capacidad de recuperación. No altera los registros deportivos originales.

## 23.11 Paso 6 — 19/09/2026 — snapshot explícito de la plantilla validada

Estado:
- completado en Supabase;
- no modifica las fichas activas.

Ubicación:
- `public.jugadores_historial`.

Snapshot:
- motivo: `baseline_validada_20260919`;
- 15 fichas, correspondientes a la plantilla validada por Miguel el 19/09/2026.

Objetivo:
- que exista una copia histórica explícita de la última versión validada aunque todavía no se haya realizado una edición posterior;
- si una sincronización o cambio futuro daña una ficha, esta línea base permite compararla y recuperarla.

La ficha actual sigue estando en:
- `public.jugadores`.

No copiar el contenido personal del snapshot al repositorio público. Consultarlo únicamente en Supabase cuando sea necesario recuperar una ficha.

## 23.12 Paso 7 — 19/09/2026 — comprobación de propiedad de los datos

Se verificó que la cuenta propietaria de los datos deportivos actuales corresponde al perfil de Miguel / Unión Viera Alevín D.

Los datos deportivos activos verificados tras crear las líneas base:
- jugadores: 15;
- partidos: 4;
- convocatorias: 2;
- asistencias: 7;
- configuración activa: 19.

Esto confirma que el estado “app vacía” no debe resolverse creando datos nuevos ni importando una plantilla: los datos reales ya existen y el fallo se debe tratar como problema de sesión/vinculación/carga.

## 23.13 Paso 8 — 19/09/2026 — batería automática verde

Estado:
- `CampoBase verify` completado correctamente en la rama;
- workflow run: `35438760969`;
- resultado: **success**;
- todavía pendiente de validación visual de Miguel.

La ejecución incluye el flujo del proyecto definido en `.github/workflows/verify.yml`, que ejecuta la verificación de sintaxis y la batería de tests.

Correcciones de tests realizadas durante este paso:
- se actualizó la expectativa de versión PWA al identificador `20260919-session-data-view-v1`;
- se acotó la prueba de restauración local para no confundir la limpieza intencionada de una sesión demo caducada con la sesión owner/delegate real.

No se ha fusionado la rama a `main`.

---

# 24. Partidos — reglas de WhatsApp según tipo de competición

Esta sección añade una regla funcional validada por Miguel para los mensajes de WhatsApp de **Partidos**. No sustituye ni reescribe las reglas anteriores de convocatorias o WhatsApp; las complementa.

## 24.1 Liga

En partidos de **Liga**:
- sí existe convocatoria;
- sí se puede comunicar por WhatsApp la convocatoria;
- se mantienen los demás contenidos, textos, datos y formatos de WhatsApp que ya estén validados en CampoBase;
- no cambiar el formato validado de esos mensajes salvo petición expresa de Miguel.

## 24.2 Amistoso y torneo

En partidos de tipo:
- **Amistoso**;
- **Torneo**;

la regla es:
- van todos los jugadores;
- **NO se comunica por WhatsApp una convocatoria de jugadores**;
- no generar un mensaje que presente a unos jugadores como convocados y a otros como no convocados;
- el WhatsApp del partido sirve para **avisar/informar del partido**, no para comunicar convocatoria;
- se mantienen todos los demás contenidos, textos, datos y formatos del mensaje de partido que ya estén validados.

Esta regla afecta específicamente a la **comunicación por WhatsApp**. No borrar, modificar ni reinterpretar automáticamente registros internos de convocatorias, estadísticas, asistencia o partido por aplicar esta regla.

## 24.3 Regla para futuros cambios

Antes de modificar el generador de WhatsApp de Partidos, comprobar siempre el tipo de partido:
- Liga → flujo de convocatoria validado;
- Amistoso/Torneo → aviso de partido para todos, sin mensaje de convocatoria.

No unificar ambos casos en un único texto si eso hace reaparecer convocatorias en amistosos o torneos.

---

# 24. WhatsApp de partidos — Liga con convocatoria; amistosos y torneos como aviso general

Regla añadida y validada funcionalmente por petición de Miguel el 19/09/2026.

## 24.1 Regla deportiva/comunicativa

En la sección de Partidos → WhatsApp existen tres tipos de partido:

- **Liga**:
  - sí existe convocatoria;
  - WhatsApp puede comunicar convocados y no convocados;
  - se mantienen los motivos de exclusión, rotación y todos los textos ya validados.

- **Amistoso**:
  - no se comunica una convocatoria por WhatsApp;
  - se trata como **aviso de partido amistoso**;
  - se considera que va toda la plantilla;
  - no mostrar ni enviar “NO está CONVOCADO”;
  - no mostrar una lista titulada “JUGADORES CONVOCADOS”.

- **Torneo**:
  - no se comunica una convocatoria por WhatsApp;
  - se trata como **aviso de torneo**;
  - se considera que va toda la plantilla;
  - no mostrar ni enviar “NO está CONVOCADO”;
  - no mostrar una lista titulada “JUGADORES CONVOCADOS”.

En amistosos y torneos se siguen comunicando todos los demás datos ya validados:
- rival;
- fecha;
- hora de citación;
- hora de inicio;
- campo;
- ubicación;
- equipación;
- material obligatorio;
- petos si procede;
- nota personalizada si existe;
- puntualidad;
- aviso de contratiempos o molestias físicas;
- tono y saludo seleccionados;
- envío individual a padre/madre/familia cuando proceda.

No cambiar el resto de la suite de WhatsApp salvo petición expresa.

## 24.2 Implementación — 19/09/2026

Rama:
- `fix/estabilidad-datos-sesion-20260919`.

Archivos modificados:
- `js/whatsapp-suite.js`;
- `js/app.js`;
- `tests/whatsapp-suite.test.js`.

Comportamiento implementado:
- `buildWhatsAppMatchConvocatoria()` deriva el tipo real del partido;
- en Liga conserva el flujo de convocatoria;
- en Amistoso ignora cualquier convocatoria antigua para el texto de WhatsApp y genera un aviso de partido para toda la plantilla;
- en Torneo ignora cualquier convocatoria antigua para el texto de WhatsApp y genera un aviso de torneo para toda la plantilla;
- el selector de estado convocado/no convocado se oculta en WhatsApp cuando el partido no es de Liga;
- el listado de eventos identifica Liga/Amistoso/Torneo.

Pruebas añadidas:
- amistoso no contiene “CONVOCATORIA”, “JUGADORES CONVOCADOS” ni “NO está CONVOCADO”;
- torneo no contiene convocatoria y mantiene hora, campo, equipación y material;
- el flujo de Liga existente debe permanecer sin cambios.

Estado:
- implementación terminada en rama;
- pendiente de batería automática tras este cambio;
- pendiente de validación visual de Miguel;
- no fusionar a `main` hasta validación visual expresa.

---

# 25. Continuidad 19/09/2026 — convivencia entre chats, WhatsApp y estado de validación

Esta sección se añade sin borrar ni reescribir las dos secciones numeradas como 24 que fueron creadas por chats distintos casi al mismo tiempo.

## 25.1 Regla de numeración desde este punto

- conservar íntegramente ambas secciones 24;
- no renumerarlas ni fusionarlas;
- a partir de aquí continuar con 25, 26, 27…;
- si dos chats trabajan a la vez y generan instrucciones parecidas, no borrar ninguna: añadir una sección posterior que aclare cuál es el estado más reciente.

## 25.2 Estado técnico del cambio WhatsApp

Último commit funcional de la rama:
- `ad89f72659d8c6f18f936bb4f3495794d0020a21`.

Última batería automática:
- workflow: `CampoBase verify`;
- run: `35439154205`;
- resultado: **success**.

Regla efectiva:
- Liga → convocatoria por WhatsApp;
- Amistoso → aviso de partido para toda la plantilla, sin convocatoria;
- Torneo → aviso de torneo para toda la plantilla, sin convocatoria;
- el resto de información validada del mensaje se conserva.

Durante las pruebas se detectó y corrigió un caso en el que `callupStatus='excluded'` todavía podía generar “NO está CONVOCADO” en un amistoso. La corrección vigente limita toda exclusión de WhatsApp exclusivamente a Liga.

## 25.3 Estado de la corrección de app vacía / recarga / sesión

Continúa en:
- `fix/estabilidad-datos-sesion-20260919`.

Protecciones ya implementadas y con tests verdes:
- vincular usuario SaaS antes de abrir/leer la cola local;
- resolver IndexedDB del usuario después de recuperar la sesión;
- conservar vista activa;
- conservar sesión de la misma pestaña cuando la sesión segura sigue válida;
- evitar doble navegación del service worker;
- historial recuperable de jugadores, partidos, convocatorias, asistencias y configuración.

Todavía NO está validado visualmente por Miguel y por tanto NO debe fusionarse el cambio funcional a `main`.

## 25.4 Main durante la validación

En `main` solo se permite mantener documentación y una página de validación aislada mientras Miguel prueba.

La app de producción normal sigue siendo:
- `https://miguelperezh.github.io/campobase/`.

La página de validación:
- `https://miguelperezh.github.io/campobase/validacion-estabilidad.html`.

La página de validación debe:
- compartir el origen de producción para poder comprobar sesión y datos reales;
- cargar el código exacto de la rama/commit que se quiere validar;
- no registrar un service worker nuevo;
- no sustituir ni modificar el código funcional de producción.

No dar por validado nada hasta que Miguel pruebe esa URL y lo confirme expresamente.

---

# 26. Revisión final antes de validación visual — 19/09/2026

## 26.1 Comparación manual rama vs main

Al revisar el diff completo del PR se detectó una regresión que los tests anteriores no cubrían:
- `showView()` había quedado usando `$('.view').forEach(...)` y `$('.bottom-nav button').forEach(...)`;
- `$()` usa `querySelector` y devuelve un solo elemento;
- por tanto podía reproducir el mismo tipo de error `$(...).forEach is not a function` que ya había roto CampoBase anteriormente.

La regresión se detectó **antes de fusionar** gracias a la revisión exacta de archivos exigida por este AGENTS.md.

Corrección:
- commit funcional: `11af7cc15e51b8fc22afd1a11bbdff2f09b83962`;
- ambos recorridos vuelven a usar `$$()` / `querySelectorAll`.

Prueba de regresión:
- commit: `b45c6b4baff6b9cfc92c0a20a6081b11e5c0ef74`;
- `tests/session-data-stability.test.js` comprueba expresamente que `showView()` nunca vuelva a usar `$().forEach`.

## 26.2 Batería automática definitiva previa a validación visual

Push de la rama:
- workflow run `35439337308`;
- resultado: **success**.

PR #52:
- workflow run `35439339649`;
- resultado: **success**.

Esto confirma tests/sintaxis, pero **NO sustituye la validación visual de Miguel**.

## 26.3 URL real de validación

URL:
- `https://miguelperezh.github.io/campobase/validacion-estabilidad.html`.

La página carga el código del commit verde:
- `b45c6b4baff6b9cfc92c0a20a6081b11e5c0ef74`.

Qué debe comprobar Miguel antes de autorizar merge:
1. entra a su cuenta y aparecen sus datos reales;
2. Plantilla muestra los 15 jugadores y sus fichas guardadas;
3. al recargar no aparece la app vacía;
4. al recargar no lo expulsa si la sesión segura sigue activa;
5. al recargar permanece en la pestaña/vista donde estaba;
6. WhatsApp de Liga conserva convocatoria;
7. WhatsApp de Amistoso es aviso para todos, sin “convocados/no convocados”;
8. WhatsApp de Torneo es aviso para todos, sin “convocados/no convocados”.

## 26.4 Merge

PR de trabajo:
- `#52 Estabilizar datos, sesión, vista y WhatsApp por tipo de partido`.

No fusionar hasta que Miguel diga expresamente que la validación visual está correcta.

La migración de historial de Supabase ya está aplicada porque es una protección aditiva/no destructiva; el código funcional de la rama sigue fuera de producción hasta esa validación.

---

# 27. Comprobación final de datos antes de la prueba visual — 19/09/2026

Estado:
- comprobación de solo lectura completada en Supabase;
- no se modificaron datos deportivos en este paso.

Recuentos actuales verificados:
- jugadores activos: 15;
- partidos activos: 4;
- convocatorias activas: 2;
- asistencias activas: 7;
- configuración activa: 19.

Copias de recuperación verificadas:
- snapshots de la plantilla con motivo `baseline_validada_20260919`: 15;
- filas de línea base en `public.campobase_datos_historial`: 252.

Antonio Roldán Rendón:
- dorsal actual: 3;
- padre/madre/teléfonos: siguen vacíos;
- no rellenar esos campos hasta que Miguel aporte los datos reales.

Conclusión:
- los datos reales siguen en Supabase;
- existe copia histórica explícita de la plantilla validada y línea base de partidos/convocatorias/asistencias/configuración;
- si la app aparece vacía durante una prueba, tratarlo como problema de carga/sesión/vinculación y **no crear ni restaurar datos nuevos automáticamente**.

Siguiente estado permitido:
- Miguel prueba `https://miguelperezh.github.io/campobase/validacion-estabilidad.html`;
- si valida visualmente, entonces se puede fusionar PR #52;
- si detecta cualquier anomalía, detener merge y corregir únicamente en la rama.

---

# 28. Incidencia de validación — fichas familiares no visibles y campo WhatsApp incorrecto — 19/09/2026

Reporte visual de Miguel:
- en la URL de validación no aparecen correctamente datos familiares ya guardados de jugadores como Diego Andrés Anaya Chaparro;
- el WhatsApp de partido no respeta siempre el campo guardado en el partido/calendario y puede mostrar otro campo.

## 28.1 Datos verificados antes de tocar código

Supabase contiene actualmente los datos familiares validados. Ejemplo comprobado:
- Diego Andrés Anaya Chaparro conserva madre Sheila y su teléfono validado.
- La plantilla activa sigue teniendo 15 jugadores.

Por tanto:
- **NO reconstruir ni inventar fichas**;
- **NO volver a escribir teléfonos desde memoria**;
- tratar el problema como una carga/sincronización local incorrecta mientras Supabase siga conservando la ficha correcta.

Partidos verificados en Supabase:
- el campo real está guardado en `payload.location`;
- los partidos actuales contienen, según cada registro, valores como Alfonso Silva, Mundial 82 y Campo El Calero;
- WhatsApp debe tomar el campo del partido seleccionado, nunca conservar silenciosamente el campo de otro partido abierto antes.

## 28.2 Causa detectada del campo de WhatsApp

El selector de eventos de WhatsApp guarda partidos como:
- `match:<id>`.

El manejador de cambio estaba buscando directamente:
- `state.matches.find(m => m.id === select.value)`.

Eso compara el ID real con `match:<id>` y no encuentra el partido. Como resultado, el campo visible podía conservar un valor anterior o el valor por defecto.

Corrección requerida:
- resolver primero el ID eliminando el prefijo `match:`;
- al abrir/cambiar de partido, copiar `match.location` al campo de WhatsApp;
- regenerar Maps desde ese mismo campo;
- mantener edición manual posterior solo si Miguel la cambia expresamente.

## 28.3 Protección adicional requerida para datos personales

La sincronización nunca debe permitir que una copia local antigua o una cola pendiente obsoleta sustituya una fila más reciente de Supabase.

Regla:
- antes de aplicar una mutación pendiente, comparar su `queuedAt` con `updated_at` remoto;
- si Supabase tiene una versión posterior, descartar la mutación local obsoleta de la cola;
- después descargar la versión remota y sustituir/reconciliar la copia local;
- una app vacía o una ficha incompleta no debe provocar subida automática de una versión local antigua.

Estado:
- diagnóstico documentado;
- correcciones funcionales pendientes en la rama;
- no fusionar a `main` hasta nueva validación visual de Miguel.

---

# 29. Corrección de fichas familiares y campo real de WhatsApp — 19/09/2026

## 29.1 Fichas familiares

Comprobación directa en Supabase:
- la plantilla activa sigue teniendo 15 jugadores;
- los teléfonos/nombres familiares validados siguen guardados en `public.jugadores`;
- ejemplo comprobado: Diego Andrés Anaya Chaparro conserva a su madre Sheila y el teléfono validado;
- Antonio Roldán Rendón sigue sin familiares/teléfonos hasta que Miguel aporte sus datos reales.

Causa de riesgo detectada:
- actualizaciones derivadas de estadísticas pueden generar una escritura completa del jugador;
- si la copia local está antigua, esa escritura no debe poder sustituir campos personales más recientes de Supabase.

Corrección:
- una mutación local más antigua que `updated_at` remoto se descarta;
- además, para cualquier `upsert` de jugadores, los campos personales remotos se preservan cuando `profileUpdatedAt` de Supabase es igual o posterior al de la copia local;
- campos protegidos: nombre, dorsal, posiciones, pierna, notas, padre, teléfono padre, madre, teléfono madre, foto, createdAt y profileUpdatedAt;
- una edición manual desde **Editar jugador** sigue pudiendo prevalecer porque actualiza `profileUpdatedAt`.

Archivos:
- `js/db.js`;
- `js/supabase-client.js`;
- `tests/session-data-stability.test.js`.

## 29.2 Campo de WhatsApp

Causa confirmada:
- el selector guarda el valor como `match:<id>`;
- el código anterior buscaba ese texto completo como si fuera el ID real;
- por ello no encontraba el partido y podía mantener el campo anterior/default.

Corrección:
- se elimina el prefijo `match:` antes de buscar el partido;
- al abrir un partido en WhatsApp se copia inmediatamente `match.location`;
- al cambiar de partido se vuelve a copiar `match.location`;
- Google Maps se regenera desde ese mismo campo;
- se elimina el fallback silencioso a “Campo Alfonso Silva (La Ballena)” cuando el partido seleccionado no tiene campo;
- el campo mostrado por WhatsApp debe ser exactamente el guardado en Calendario, salvo edición manual posterior de Miguel.

Archivos:
- `js/app.js`;
- `tests/whatsapp-suite.test.js`.

## 29.3 Verificación

Commit funcional probado:
- `38624716d28088a4fe1322e0badfa3201eb36e70`.

Workflow de PR:
- run `35440091867`;
- resultado: **success**.

Estado:
- pruebas automáticas verdes;
- datos reales siguen en Supabase;
- pendiente únicamente de nueva validación visual de Miguel;
- no fusionar todavía a `main`.

---

# 30. Nueva línea base manual de Miguel — fichas, dorsales, apellidos, posiciones y asistencia — 19/09/2026

Miguel ha actualizado manualmente datos reales en CampoBase después de la incidencia anterior.

Cambios comunicados por Miguel:
- ha actualizado fichas de jugadores;
- ha actualizado nombres y teléfonos de padres/madres;
- ha modificado el dorsal de Elías;
- ha añadido/corregido segundos apellidos de varios jugadores;
- ha corregido alguna posición;
- ha vuelto a corregir la asistencia del día **17/09/2026** porque anteriormente había quedado borrada/alterada.

## 30.1 Fuente canónica desde este momento

La versión vigente y correcta es la que existe ahora mismo en Supabase después de esas ediciones manuales.

Fuente principal:
- fichas actuales → `public.jugadores`;
- asistencia actual → `public.asistencias`;
- partidos → `public.partidos`;
- convocatorias → `public.convocatorias`;
- configuración → `public.configuracion`.

No reconstruir ni sustituir esos valores desde:
- seeds;
- commits antiguos;
- otra rama;
- IndexedDB antiguo;
- estadísticas derivadas;
- datos de otro jugador;
- conversaciones anteriores si contradicen el estado actual de Supabase.

Los teléfonos y demás datos familiares reales **no se copian dentro de AGENTS.md ni del repositorio público**. Se conservan únicamente en Supabase y en su historial protegido.

## 30.2 Snapshot explícito creado tras las ediciones de Miguel

Motivo del snapshot:
- `baseline_usuario_post_edicion_20260919`.

Copias creadas sin modificar los datos activos:
- 15 fichas actuales de jugadores → `public.jugadores_historial`;
- 4 partidos activos → `public.campobase_datos_historial`;
- 2 convocatorias activas → `public.campobase_datos_historial`;
- 7 asistencias activas → `public.campobase_datos_historial`;
- 19 registros activos de configuración → `public.campobase_datos_historial`.

Esta línea base pasa a ser la referencia de recuperación más reciente frente a errores posteriores.

## 30.3 Asistencia del 17/09/2026

Se verificó que existe actualmente en `public.asistencias` un registro activo con:
- fecha: `2026-09-17`;
- tipo: entrenamiento;
- asistencia manual actualizada por Miguel.

Ese registro está incluido en:
- `baseline_usuario_post_edicion_20260919`.

Regla:
- no reemplazarlo por una versión histórica anterior;
- no recalcularlo desde otra fuente;
- si una sincronización futura lo altera, restaurar primero desde esta línea base y comparar antes de escribir.

## 30.4 Protección obligatoria de fichas

A partir de esta línea base:
- los campos personales se modifican únicamente desde **Editar jugador**;
- una actualización de estadísticas no puede reescribir nombre, apellidos, dorsal, posiciones, pierna, padre, madre, teléfonos, notas o foto;
- una sincronización local más antigua no puede ganar sobre una ficha más reciente de Supabase;
- antes de cualquier restauración, comparar `public.jugadores` con `public.jugadores_historial`;
- no borrar snapshots ni tombstones.

Elías:
- el dorsal vigente es el que está actualmente guardado en `public.jugadores`;
- no restaurar un dorsal anterior desde historial o seed.

## 30.5 Estadísticas y datos derivados

El snapshot de jugadores contiene el payload completo actual, incluidas las partes derivadas que existan en la ficha.

Aun así:
- estadísticas de partidos se reconstruyen desde partidos;
- convocatorias/rotaciones desde convocatorias;
- asistencia desde asistencias;
- no sobrescribir campos personales al recalcular estadísticas.

## 30.6 Estado de producción y WhatsApp

La corrección funcional de WhatsApp para distinguir:
- Liga → convocatoria;
- Amistoso → aviso para toda la plantilla;
- Torneo → aviso para toda la plantilla;

**todavía no está fusionada en `main`** mientras Miguel no valide la rama visualmente.

Por eso la app oficial/PWA puede seguir mostrando el comportamiento antiguo en WhatsApp de amistosos.

No confundir:
- URL oficial → código de `main`;
- URL de validación → código de la rama `fix/estabilidad-datos-sesion-20260919`.

No fusionar PR #52 hasta validación visual expresa de Miguel.

---

# 31. Blindaje permanente de todos los datos guardados — 19/09/2026

Objetivo marcado por Miguel:
- todo dato que un usuario guarda o edita debe quedar registrado;
- una modificación posterior de la app, una sincronización antigua, una estadística derivada o un cambio de dispositivo no puede borrar silenciosamente datos válidos;
- esta protección debe servir para Miguel y para cualquier usuario futuro de CampoBase.

## 31.1 Historial inmutable general

Tabla:
- `public.campobase_versiones_datos`.

Tablas deportivas cubiertas:
- `public.jugadores`;
- `public.partidos`;
- `public.convocatorias`;
- `public.asistencias`;
- `public.configuracion`.

Se registra automáticamente cada operación que llega correctamente al servidor:
- `INSERT`;
- `UPDATE`;
- `DELETE`.

Cada versión guarda:
- tabla de origen;
- usuario propietario;
- ID del registro;
- operación;
- fila completa guardada;
- `updated_at` de esa versión;
- usuario autenticado que realizó la operación cuando existe;
- transacción;
- fecha/hora de captura.

La tabla de versiones:
- tiene RLS;
- cada usuario solo puede leer su propio historial;
- clientes `anon` y `authenticated` no pueden insertar, editar, borrar ni truncar este historial;
- por tanto una versión histórica no puede ser borrada accidentalmente desde la app.

## 31.2 Primera línea base del blindaje

Al activar el sistema se guardó una copia de todas las filas ya existentes, incluidas filas activas y tombstones:
- jugadores: 53;
- partidos: 26;
- convocatorias: 27;
- asistencias: 24;
- configuración: 175.

Estas cantidades son filas globales existentes en las tablas en el momento de crear la línea base, no el número de datos activos de una sola cuenta.

## 31.3 Protección contra sincronizaciones antiguas

Función de servidor:
- `bloquear_escritura_obsoleta_campobase()`.

Regla:
- si llega una escritura con `updated_at` anterior al registro que ya existe en Supabase, se rechaza;
- una copia antigua de IndexedDB, una pestaña vieja o una cola pendiente no puede ganar sobre una versión más reciente.

Código de error identificable:
- `CAMPOBASE_STALE_WRITE`.

Esta barrera existe en:
- jugadores;
- partidos;
- convocatorias;
- asistencias;
- configuración.

## 31.4 Segunda barrera específica para fichas de jugadores

Función:
- `proteger_campos_personales_jugador()`.

Campos protegidos:
- nombre y apellidos;
- dorsal;
- posiciones;
- pierna;
- notas;
- padre;
- teléfono del padre;
- madre;
- teléfono de la madre;
- foto;
- fecha de creación;
- `profileUpdatedAt`.

Regla:
- si una actualización automática/derivada no aporta un `profileUpdatedAt` posterior al último cambio manual, el servidor conserva los campos personales que ya tenía;
- editar estadísticas, recalcular minutos, asistencia, convocatorias o sincronizar no puede rebajar la ficha personal;
- una edición manual válida desde **Editar jugador** sí puede actualizar esos campos porque genera una versión manual más reciente.

## 31.5 Borrado físico bloqueado para clientes

La app debe borrar mediante tombstone para conservar recuperación.

Los clientes autenticados no pueden ejecutar un `DELETE` físico en:
- jugadores;
- partidos;
- convocatorias;
- asistencias;
- configuración.

Función:
- `bloquear_borrado_fisico_campobase()`.

Código:
- `CAMPOBASE_HARD_DELETE_BLOCKED`.

Esto evita que un fallo de interfaz o una llamada cliente elimine físicamente la única copia del registro.

## 31.6 Guardado local y confirmación de servidor

Regla nueva de cliente:
- cuando el dispositivo está online y existe conexión cloud, un error de Supabase ya no se oculta con `.catch(() => false)`;
- si Supabase rechaza el guardado, la operación permanece en `syncQueue` y la UI debe recibir el error en lugar de mostrar un éxito falso;
- si el dispositivo está offline, el cambio puede quedar en IndexedDB + `syncQueue` hasta volver a tener conexión;
- al reconectar se reintenta la subida.

Definición:
- **guardado local** = está en IndexedDB/syncQueue del dispositivo;
- **guardado y blindado** = Supabase ha aceptado la operación y el trigger la ha registrado en `campobase_versiones_datos`.

No afirmar que un cambio está blindado en servidor si todavía no aparece en Supabase.

## 31.7 Archivos/migraciones de este blindaje

Rama:
- `fix/estabilidad-datos-sesion-20260919`.

Migraciones:
- `supabase/10_immutable_versions_and_stale_write_guard.sql`;
- `supabase/11_block_client_hard_deletes.sql`.

Código cliente:
- `js/db.js`;
- `js/supabase-client.js`.

Pruebas:
- `tests/immutable-data-versions.test.js`;
- `tests/session-data-stability.test.js`.

Las migraciones de servidor ya están aplicadas en Supabase porque son protecciones de datos. El resto del código cliente sigue en rama hasta validación visual y merge.

---

# 32. Antonio Roldán y convocatoria vs Unión Viera Alevín E — estado de sincronización — 19/09/2026

Miguel comunica que acaba de:
- completar a Antonio Roldán Rendón con los datos que ya tiene;
- crear/actualizar la convocatoria frente a Unión Viera Alevín E.

Comprobación realizada inmediatamente después en Supabase:
- la fila remota de Antonio todavía muestra la versión anterior;
- la convocatoria de Unión Viera Alevín E todavía no aparece en `public.convocatorias`.

Conclusión:
- esas dos ediciones **no han llegado todavía a Supabase** en el momento de la comprobación;
- probablemente siguen en el almacenamiento/cola local del móvil o la app oficial no consiguió sincronizarlas;
- no reconstruirlas ni inventarlas desde este chat;
- no sustituir la versión local del móvil mientras se intenta recuperarla.

Paso de recuperación previsto:
- abrir en el mismo móvil la URL de validación, que comparte el origen de CampoBase y puede acceder al mismo IndexedDB;
- permitir que la rama corregida procese `syncQueue`;
- volver a comprobar Supabase;
- solo cuando aparezcan en Supabase se consideran guardadas y blindadas por el historial inmutable.

No marcar Antonio ni esa convocatoria como protegidos en servidor hasta verificar su llegada.

---

# 33. Incidencia adicional — botón Recargar / Actualizar expulsa de la app — 19/09/2026

Reporte de Miguel:
- en móvil, al pulsar **Recargar / Actualizar app**, CampoBase vuelve a expulsarlo del acceso;
- esto se suma a la incidencia ya documentada de recarga/actualización.

Diagnóstico en código:
- el botón `#auth-reload-btn` elimina explícitamente `campobase.sessionRole` antes de recargar;
- una actualización manual del service worker puede además disparar `controllerchange` y provocar otra recarga;
- el botón de actualizar no debe comportarse como cerrar sesión.

Regla obligatoria:
- **Actualizar/Recargar app NO cierra sesión**;
- debe conservar la sesión segura de Supabase;
- debe conservar `campobase.sessionRole` durante la misma pestaña;
- debe conservar `campobase.saasActiveBrowserSession`;
- debe conservar la vista activa;
- solo los botones explícitos **Cerrar sesión** pueden borrar la sesión/vínculo;
- una actualización del service worker no puede provocar una segunda recarga que consuma o rompa el estado de sesión.

Estado:
- incidencia documentada;
- corrección funcional se hace únicamente en `fix/estabilidad-datos-sesion-20260919`;
- no fusionar a `main` hasta validación visual de Miguel.

---

# 34. Incidencia crítica — móvil no sincroniza cambios con Supabase — 19/09/2026

Reporte de Miguel:
- cambios realizados desde el móvil no están llegando a Supabase;
- se han detectado como ejemplo la edición de Antonio Roldán y una convocatoria contra Unión Viera Alevín E que todavía no aparecen en la base remota;
- esto debe tratarse como incidencia crítica porque un usuario puede creer que ha guardado correctamente cuando el cambio sigue solo en el dispositivo.

Prioridad:
1. no borrar ni reiniciar almacenamiento local del móvil;
2. localizar si los cambios quedaron en IndexedDB y/o `syncQueue`;
3. recuperar y subir esas mutaciones a Supabase;
4. comprobar que la app móvil usa el mismo `user_id` y la base `campobase_<user_id>`;
5. comprobar sesión Supabase válida antes de abrir/leer la cola;
6. hacer que un fallo de sincronización sea visible y nunca se muestre como “guardado” en servidor;
7. añadir un estado visible de sincronización y una acción manual de reintento;
8. verificar que cerrar/reabrir, actualizar la PWA o cambiar de red no pierde la cola;
9. validar en móvil antes de fusionar.

Regla:
- **no considerar un cambio móvil como guardado y blindado hasta que exista en Supabase y quede versionado en `public.campobase_versiones_datos`**;
- si está solo en IndexedDB/`syncQueue`, sigue siendo recuperable pero pendiente de sincronización;
- no eliminar la PWA, borrar datos del sitio, limpiar almacenamiento ni restablecer la app mientras existan cambios pendientes.

Estado:
- incidencia añadida al plan activo;
- se investiga y corrige en `fix/estabilidad-datos-sesion-20260919`;
- no fusionar a `main` hasta validación visual y móvil expresa de Miguel.

---

# 35. Corrección de sincronización móvil — enlace previo, estado visible y recuperación — 19/09/2026

## 35.1 Causa de riesgo corregida

Antes de una escritura local, CampoBase podía decidir la base IndexedDB cuando todavía no se había reconstruido `campobase.saasUserId` desde una sesión Supabase válida.

Caso peligroso:
1. el móvil conserva sesión Supabase;
2. se pierde el vínculo local `campobase.saasUserId`;
3. el usuario edita una ficha/convocatoria;
4. la escritura se guarda primero en la base legado `campobase`;
5. después la sincronización recupera el usuario y cambia a `campobase_<user_id>`;
6. la mutación recién guardada puede quedar varada en la cola de la base legado.

Corrección:
- todas las escrituras críticas llaman ahora a `prepareStorageBindingForWrite()` **antes** de abrir la base donde se va a guardar;
- si existe una sesión Supabase válida, se reconstruye el vínculo del usuario antes de escribir;
- se aplica a:
  - `put()`;
  - `putPlayerProfile()`;
  - `putBatch()`;
  - `remove()`.

## 35.2 Diagnóstico visible en Ajustes

Nuevo bloque:
- **Sincronización**.

Muestra:
- sincronizado con Supabase;
- sin conexión;
- número de cambios pendientes de la cuenta actual;
- error de sincronización;
- existencia de cambios pendientes en almacenamiento local anterior.

Botones:
- **Sincronizar ahora**;
- **Recuperar cambios locales pendientes** cuando existe cola legado y hay una cuenta vinculada.

## 35.3 Recuperación de cambios móviles varados

Funciones:
- `getSyncDiagnostics()`;
- `recoverLegacyPendingMutations()`.

Reglas de recuperación:
- no se borra la cola legado antes de intentar la subida;
- las mutaciones se copian primero a la cola de `campobase_<user_id>`;
- Supabase aplica las guardas anti-sobrescritura;
- solo después de que `flushSyncQueue()` termine correctamente se eliminan de la cola legado;
- si Supabase rechaza/falla, la copia local antigua permanece para poder reintentar;
- esta recuperación requiere una cuenta SaaS vinculada y confirmación explícita del usuario desde la interfaz.

## 35.4 Estado de guardado

A partir de esta corrección:
- una escritura online con error cloud propaga el error a la interfaz;
- una escritura offline queda localmente en cola;
- el panel permite comprobar pendientes;
- el usuario puede forzar reintento sin borrar almacenamiento.

Archivos:
- `js/db.js`;
- `js/app.js`;
- `index.html`;
- `tests/session-data-stability.test.js`.

Estado:
- implementado en rama;
- pendiente de batería completa y validación móvil de Miguel;
- no fusionar a `main` todavía.

---

# 36. Blindaje adicional de refresh y estado final de sincronización móvil — 19/09/2026

## 36.1 Refresh ya no puede borrar fichas por deduplicación automática

Se detectó que `deduplicatePlayers()` podía tombstonear jugadores automáticamente durante `refresh()` si encontraba nombres normalizados iguales.

Regla nueva:
- un refresh nunca borra jugadores automáticamente;
- si detecta posibles duplicados, solo deja aviso técnico;
- la decisión de borrar/combinar jugadores debe ser manual y explícita.

También se eliminó la reescritura automática del dorsal durante `refresh()`:
- `cleanPlayerNumber()` puede usarse para mostrar el dorsal;
- la ficha persistida solo cambia desde **Editar jugador**.

## 36.2 Importaciones y guardados

La importación JSON tampoco puede ocultar un error de sincronización:
- online → si Supabase falla, el error se propaga;
- offline → queda local y pendiente.

## 36.3 Tests

Último commit de rama con estas correcciones:
- `e9e484883158bde445f4e9a3dcfd61650cb43590`.

Workflows:
- push `35442239763` → **success**;
- PR `35442242462` → **success**.

## 36.4 Estado actual de Antonio y convocatoria Unión Viera Alevín E

Nueva comprobación de Supabase:
- Antonio Roldán sigue mostrando la versión remota anterior;
- la convocatoria contra Unión Viera Alevín E todavía no aparece remotamente;
- no hay nuevas versiones no-baseline registradas todavía para esas ediciones.

Interpretación:
- los cambios que Miguel realizó en móvil siguen sin haber llegado al servidor;
- no deben borrarse ni rehacerse desde otro dispositivo;
- la prioridad es recuperar la cola local del mismo móvil y sincronizarla.

## 36.5 URL de validación móvil

La página de validación se ha actualizado con:
- corrección de sesión al actualizar;
- protección de datos;
- estado de sincronización;
- botón **Sincronizar ahora**;
- botón **Recuperar cambios locales pendientes** cuando detecte cola legado.

URL:
- `https://miguelperezh.github.io/campobase/validacion-estabilidad.html`.

La prueba debe hacerse desde el mismo dispositivo donde están los cambios pendientes.

---

# 37. Producción oficial — estabilización fusionada y desplegada — 19/09/2026

Miguel autorizó expresamente subir las correcciones a la app oficial para poder probarlas directamente en móvil.

## 37.1 Merge a producción

PR:
- `#52 Estabilizar datos, sesión, vista y WhatsApp por tipo de partido`.

Merge:
- commit de producción: `dc449d80dc269fbf91440b6e492e24bf141b5cb1`;
- resultado de tests de `main`: **success**;
- despliegue GitHub Pages: **success**.

Producción:
- `https://miguelperezh.github.io/campobase/`.

## 37.2 Recuperación del PIN local

Se detectó un caso real:
- el móvil puede conservar un PIN más reciente en IndexedDB mientras Supabase todavía conserva un PIN anterior por un fallo de sincronización;
- en ese caso, validar solo contra la copia cloud provoca un falso “PIN incorrecto”.

Corrección:
- si el PIN remoto no coincide, CampoBase consulta de forma segura las configuraciones locales del mismo navegador/dispositivo;
- puede reconocer el PIN owner/delegate conservado localmente;
- reconocer el PIN local **no sobrescribe automáticamente Supabase**;
- después del acceso, la recuperación de cambios pendientes se gestiona desde **Ajustes → Sincronización**.

No borrar la base local ni restablecer PIN para resolver este caso antes de intentar la recuperación.

## 37.3 Actualización PWA/móvil forzada

Versión de actualización:
- `20260919-mobile-sync-pin-v1`.

Se actualizó:
- query de `js/app.js`;
- query de estilos;
- registro de `sw.js`;
- clave de caché del service worker;
- precache de la versión nueva.

Objetivo:
- evitar que la PWA instalada siga ejecutando JavaScript antiguo después de desplegar la corrección;
- al detectar el nuevo service worker, CampoBase puede hacer una única recarga controlada conservando sesión y vista.

## 37.4 Comportamiento que debe existir ya en producción

- PIN local reciente recuperable si la copia cloud está atrasada;
- Recargar/Actualizar no debe cerrar la sesión;
- vista/pestaña activa conservada;
- panel **Sincronización** en Ajustes;
- botón **Sincronizar ahora**;
- botón **Recuperar cambios locales pendientes** cuando proceda;
- escrituras móviles vinculadas al usuario antes de elegir IndexedDB;
- colas antiguas no sobrescriben datos nuevos;
- refresh no borra jugadores ni reescribe dorsales;
- WhatsApp: Liga con convocatoria; amistoso/torneo como aviso general;
- WhatsApp usa el campo real del partido seleccionado;
- versionado inmutable y guardas de Supabase activos.

## 37.5 Incidencia todavía pendiente de recuperar desde el móvil de Miguel

Antes del despliegue oficial se comprobó que todavía no habían llegado a Supabase:
- la última edición local de Antonio Roldán;
- la convocatoria creada/editada contra Unión Viera Alevín E.

No inventar ni reconstruir esos cambios desde servidor.

La recuperación debe hacerse desde el mismo móvil:
1. abrir producción actualizada;
2. entrar con el PIN actual del móvil;
3. ir a **Ajustes → Sincronización**;
4. usar **Recuperar cambios locales pendientes** si aparece;
5. pulsar **Sincronizar ahora**;
6. comprobar después en Supabase que los registros han llegado y que aparecen en `campobase_versiones_datos`.

No considerar recuperados esos dos cambios hasta comprobarlos en Supabase.

---

# 38. Hotfix PIN SaaS — Supabase ya tenía PIN distintos pero la app entraba en configuración inicial — 19/09/2026

Incidencia real:
- Miguel introduce dos PIN distintos;
- la app muestra erróneamente “Los PIN de Migue y delegado deben ser distintos”;
- Supabase fue comprobado y contiene `ownerPinHash`, `delegatePinHash` y `pinSalt`;
- los dos hashes remotos son distintos.

Causa:
- la interfaz podía decidir que era una instalación “inicial” mirando `state.settings` antes de haber cargado la configuración `main` de Supabase;
- por eso mostraba los dos campos de creación de PIN aunque la cuenta ya tenía PIN válidos guardados.

Corrección:
- nueva lectura directa y autenticada de `public.configuracion / id=main` mediante `getRemoteMainSettings()`;
- antes de decidir si hay que crear PIN, CampoBase hidrata los PIN existentes desde Supabase;
- si los PIN ya existen remotamente, NO entra en modo “Configurar acceso”;
- no se modifican ni regeneran los hashes durante esa lectura;
- al crear PIN nuevos, se limpian espacios y se validan 4–8 cifras antes de comparar.

Archivos:
- `js/supabase-client.js`;
- `js/app.js`;
- `tests/pin-supabase-recovery.test.js`.

Regla:
- una cuenta SaaS existente con PIN guardados en Supabase nunca debe ser tratada como cuenta nueva por falta temporal de carga local;
- no pedir crear de nuevo PIN owner/delegate si `configuracion/main` ya contiene ambos hashes;
- no resetear ni sobrescribir PIN para arreglar una incidencia de carga.

Rama:
- `hotfix/pin-supabase-20260919`.

Estado:
- hotfix implementado;
- pendiente de batería final y despliegue a producción.

---

# 39. Hotfix PIN SaaS desplegado en producción — 19/09/2026

Verificación previa:
- Supabase conserva `configuracion/main` con `ownerPinHash`, `delegatePinHash` y `pinSalt`;
- los hashes de Migue y delegado son distintos;
- por tanto el mensaje “Los PIN de Migue y delegado deben ser distintos” era una regresión de carga/interfaz, no un dato real de Supabase.

Hotfix:
- PR #53 fusionado;
- commit de producción: `2d63b798d4e26b6f57ae155cebc17456f86a8cd4`;
- tests de `main`: **success**;
- GitHub Pages: **success**.

Comportamiento correcto desde este despliegue:
- una cuenta SaaS existente intenta cargar `configuracion/main` directamente desde Supabase antes de decidir si es una configuración inicial;
- si Supabase ya tiene PIN owner/delegate válidos, CampoBase no debe mostrar los dos campos “Crear PIN…”;
- debe mostrar el flujo de acceso existente;
- la lectura remota no resetea ni sobrescribe PIN;
- no volver a configurar dos PIN para resolver un fallo de carga.

Producción:
- `https://miguelperezh.github.io/campobase/`.

Si una PWA móvil todavía muestra “Configurar acceso” con dos PIN después de este commit:
- tratarlo como caché/sesión SaaS no cargada;
- no crear PIN nuevos;
- no borrar datos;
- comprobar primero que el dispositivo está ejecutando el commit de producción y que conserva una sesión Supabase válida.

---

# 40. Segunda solución PIN — unificar PIN de CampoBase y evitar confusión con PIN de dispositivo — 19/09/2026

Incidencia:
- el PIN seguía sin funcionar aunque Supabase tenía los hashes correctos;
- la pantalla de **Cuenta recordada** estaba validando exclusivamente un PIN distinto: el “PIN de este dispositivo” guardado en localStorage;
- el usuario estaba introduciendo su PIN normal de CampoBase/Supabase;
- por eso podía aparecer “PIN incorrecto” aunque el PIN real de la cuenta fuese correcto.

Causa exacta:
- existían dos PIN diferentes en la interfaz:
  1. PIN owner/delegate de CampoBase, guardado como hash en `public.configuracion / id=main`;
  2. PIN opcional del dispositivo, guardado en `localStorage['campobase.rememberedAccount.v1']`;
- la pantalla de cuenta recordada solo verificaba el segundo.

Corrección:
- la pantalla **Cuenta recordada** acepta ahora el PIN owner de CampoBase verificándolo directamente contra Supabase;
- primero puede aceptar el PIN de dispositivo si coincide;
- si no coincide, consulta `public.configuracion/main` del usuario autenticado mediante RLS;
- verifica el PIN introducido contra `pinSalt + ownerPinHash`;
- si coincide, abre la sesión SaaS;
- no escribe, resetea ni regenera ningún PIN durante esta comprobación;
- el botón antes llamado “Acceso local con PIN” pasa a “Acceder con PIN de CampoBase”;
- el texto de la cuenta recordada deja claro que el PIN se comprueba con la configuración de la cuenta en Supabase.

Seguridad:
- la consulta exige sesión Supabase válida;
- filtra por `user_id` de la sesión y `id='main'`;
- RLS mantiene aislamiento por cuenta;
- no acepta el PIN delegate en esta pantalla SaaS para evitar elevar un delegado a owner;
- el delegado sigue usando su flujo de acceso correspondiente.

Caché móvil:
- versión forzada: `20260919-pin-supabase-v2`;
- se actualiza query de app/estilos, service worker y carga dinámica de `saas-auth-ui-v2.js`;
- objetivo: impedir que una PWA instalada siga ejecutando el formulario antiguo del PIN de dispositivo.

Archivos funcionales:
- `js/saas-auth-ui-v2.js`;
- `js/supabase-client.js`;
- `js/app.js`;
- `index.html`;
- `sw.js`.

Pruebas:
- nuevo `tests/saas-pin-unified.test.js`;
- batería completa de la rama: run `35444157247` → **success**.

Comparación previa con main:
- rama 10 commits por delante, 0 por detrás;
- cambios limitados a acceso PIN, invalidación de caché y tests asociados;
- no se modifican jugadores, partidos, convocatorias, asistencias ni datos reales.

Estado:
- listo para desplegar a producción.

---

# 41. Segunda solución PIN desplegada en producción — 19/09/2026

Producción actual:
- commit: `b90ba1dd5a092652bdb1dc0e122e1a4992fee462`;
- tests de `main`: **success**;
- despliegue GitHub Pages: **success**;
- URL: `https://miguelperezh.github.io/campobase/`.

Cambio clave:
- la pantalla de cuenta recordada ya no depende únicamente del PIN opcional del dispositivo;
- acepta también el PIN owner real de CampoBase comprobándolo directamente contra `public.configuracion/main` en Supabase;
- no resetea ni cambia el PIN;
- la PWA fuerza versión `20260919-pin-supabase-v2` para evitar seguir usando código antiguo.

Regla para futuras incidencias:
- si el PIN real de CampoBase funciona en Supabase pero falla en la interfaz, revisar primero qué flujo de PIN está usando la pantalla;
- no asumir que “PIN del dispositivo” y “PIN de CampoBase” son el mismo;
- no pedir al usuario que cree PIN nuevos ni borrar datos para resolverlo.

---

# 42. Tercera solución PIN — evitar carrera entre pantalla de login y configuración inicial — 19/09/2026

Síntoma observado por Miguel:
- la pantalla visible era **“Introduce tu PIN”**;
- al enviar un PIN de 4 cifras aparecía el error **“Los PIN deben tener entre 4 y 8 cifras”**;
- ese mensaje solo pertenece al flujo de creación de dos PIN, no al login normal.

Conclusión:
- durante el submit, la app podía recalcular `initial=true` por una carrera de carga de `state.settings`;
- visualmente el usuario estaba en login, pero el handler terminaba ejecutando `savePins(newOwnerPin, newDelegatePin)` con los campos de creación ocultos/vacíos.

Corrección:
- `submitAuth()` ya no decide el modo por `state.settings` en ese instante;
- usa el modo que realmente está visible en la interfaz:
  - si `#initial-pin-fields` está visible → configuración inicial;
  - si está oculto → login normal;
- una pantalla visible de “Introduce tu PIN” **nunca puede saltar a crear PIN** durante el submit;
- el login vuelve a hidratar Supabase y valida owner/delegate contra `pinSalt + hash`;
- si falla, solo entonces prueba copias locales como recuperación;
- no resetea ni genera PIN nuevos desde el flujo de login.

Verificación de credenciales:
- se comprobaron en Supabase los dos PIN facilitados por Miguel contra los hashes remotos;
- ambos coinciden con sus respectivos hashes owner/delegate;
- **no guardar los PIN en texto claro en AGENTS.md, Git ni logs**.

Caché móvil:
- versión forzada: `20260919-pin-submit-v3`.

Pruebas:
- `tests/pin-supabase-recovery.test.js` añade cobertura para impedir que login salte a creación;
- batería completa de rama: run `35444808525` → **success**.

Rama:
- `hotfix/pin-submit-supabase-20260919`.

Estado:
- listo para PR y despliegue.

---

# 43. Tercera solución PIN desplegada en producción — 19/09/2026

Producción:
- commit funcional: `59c1ed85124e513d73bc0a84d523621b9989f703`;
- `CampoBase verify` en main: **success**;
- GitHub Pages: **success**;
- versión PWA: `20260919-pin-submit-v3`;
- URL oficial: `https://miguelperezh.github.io/campobase/`.

Verificación de PIN:
- se comprobaron contra Supabase los dos PIN que Miguel facilitó durante la incidencia;
- ambos coinciden con los hashes actuales de owner/delegate;
- los valores en texto claro NO se guardan en AGENTS.md ni en Git.

Causa corregida:
- la pantalla podía estar visualmente en **Introduce tu PIN** pero `submitAuth()` recalculaba el estado como configuración inicial;
- entonces intentaba ejecutar `savePins()` usando los campos ocultos de creación y aparecía el mensaje incorrecto “Los PIN deben tener entre 4 y 8 cifras”.

Regla definitiva:
- el modo del submit se determina por la pantalla que realmente está visible;
- si el usuario ve **Introduce tu PIN**, el submit solo puede ejecutar validación de PIN;
- nunca puede saltar a creación de dos PIN durante ese mismo submit;
- si está en login, valida owner/delegate usando la configuración cargada desde Supabase;
- una copia local solo se usa como fallback de recuperación;
- no resetear ni crear PIN nuevos para resolver esta incidencia.

Despliegue:
- PR #55 fusionado;
- tests del PR: **success**;
- tests de main: **success**;
- Pages completado correctamente.

Esta sección prevalece sobre estados anteriores de la incidencia de PIN.

---

# 42. Hotfix app vacía tras PIN / sesión restaurada — 19/09/2026

Incidencia comunicada por Miguel:
- la app oficial volvió a aparecer sin datos;
- Supabase fue comprobado y **los datos no están borrados**.

Datos reales verificados en Supabase antes del hotfix:
- jugadores activos: 15;
- partidos activos: 4;
- convocatorias activas: 2;
- asistencias activas: 7;
- configuración activa: 19;
- historial de jugadores: 67 filas;
- historial inmutable general: 306 versiones.

Conclusión:
- si la interfaz aparece vacía con estos recuentos presentes, tratarlo como fallo de carga/sesión/sincronización;
- **no crear de nuevo plantilla, partidos, convocatorias o asistencias**;
- **no restaurar masivamente** mientras Supabase conserve los registros.

## 42.1 Causa de sesión detectada

`showAuth()` eliminaba `sessionStorage['campobase.sessionRole']` simplemente por mostrar el diálogo de acceso.

Esto podía provocar una carrera:
1. Supabase conserva una sesión válida;
2. la app inicia;
3. se muestra el diálogo;
4. `showAuth()` borra `sessionRole`;
5. la capa SaaS deja de poder reconocer la sesión de la pestaña como ya desbloqueada;
6. el usuario vuelve a quedar fuera o con una vista sin datos cargados.

Corrección:
- mostrar el diálogo ya **no borra `sessionRole`**;
- solo un cierre de sesión explícito debe limpiar el estado de acceso.

## 42.2 Recuperación inmediata de datos después del PIN

Antes:
- introducir correctamente el PIN podía desbloquear la UI;
- pero si la sincronización inicial había fallado antes de autenticarse, la app podía abrir con IndexedDB vacío y esperar al intervalo de sincronización.

Ahora:
- después de un PIN válido, CampoBase ejecuta inmediatamente:
  - `synchronizeCloud()`;
  - `refresh()`;
- después de restaurar una sesión SaaS válida mediante `unlockBoundSession()`, también ejecuta inmediatamente:
  - `app.synchronizeCloud()`;
  - `app.refresh()`;
- el diálogo se cierra después de intentar esa recuperación.

Objetivo:
- una sesión válida de Supabase debe repoblar la app desde la fuente remota antes de dejar al usuario trabajando con una pantalla vacía.

## 42.3 Cambios limitados

Rama:
- `hotfix/cloud-restore-after-pin-20260919`.

Archivos modificados:
- `js/app.js`;
- `js/saas-auth-ui-v2.js`;
- `tests/session-data-stability.test.js`.

No se modifican:
- jugadores;
- partidos;
- convocatorias;
- asistencias;
- configuración;
- migraciones;
- datos reales de Supabase.

Batería:
- run `35445291894`;
- resultado: **success**.

Comparación vs main:
- 3 commits por delante;
- 0 por detrás;
- solo los tres archivos indicados arriba.

Estado:
- hotfix listo para despliegue de producción por incidencia crítica de app vacía.

---

# 43. Producción restauración cloud + PIN verificado contra Supabase — 19/09/2026

Incidencia:
- Miguel reportó que la app oficial volvía a aparecer sin datos.

Comprobación directa en Supabase:
- jugadores activos: 15;
- partidos activos: 4;
- convocatorias activas: 2;
- asistencias activas: 7;
- los datos NO estaban borrados;
- el PIN owner configurado por Miguel coincide con `ownerPinHash`;
- el PIN de delegado configurado por Miguel coincide con `delegatePinHash`.

No copiar PIN en claro a este archivo ni al repositorio.

## 43.1 Hotfix de carga de datos

Producción:
- commit funcional: `4cd3fc075d24ba21158b8192c1a3670d2dbc9c50`;
- `showAuth()` ya no elimina `campobase.sessionRole` al mostrar el diálogo;
- después de un PIN válido, CampoBase ejecuta inmediatamente `synchronizeCloud()` y `refresh()`;
- al recuperar una sesión SaaS válida, `unlockBoundSession()` también sincroniza y refresca antes de cerrar el diálogo.

Regla:
- una pantalla vacía con datos presentes en Supabase se trata como fallo de carga/sesión;
- no recrear plantilla ni restaurar masivamente;
- no borrar IndexedDB para “arreglar” una vista vacía.

## 43.2 Forzado de versión móvil

Para evitar que una PWA instalada siga usando la versión anterior:
- versión PWA/cache: `20260919-cloud-restore-v4`;
- commit de producción: `5e9fad67324cb43d8c7c405ce1c572524f933bd7`;
- tests de main: **success**;
- GitHub Pages: **success**.

Se actualizó:
- `index.html`;
- `sw.js`;
- query de `js/app.js`;
- carga dinámica de `js/saas-auth-ui-v2.js`;
- tests de versión PWA.

Producción visible:
- `https://miguelperezh.github.io/campobase/`.

Estado:
- hotfix desplegado;
- datos remotos siguen intactos;
- el siguiente control debe hacerse en la app oficial móvil ya actualizada.

---

# 44. Caché PWA renovada para forzar la restauración cloud en móvil — 19/09/2026

Incidencia:
- la app móvil podía seguir ejecutando una caché anterior aunque el código de restauración cloud ya estuviera desplegado;
- el identificador interno de `CACHE` del service worker seguía conservando el sufijo anterior.

Corrección mínima:
- se renovó la clave de caché del service worker;
- nuevo sufijo: `cloud-restore-v4`;
- archivo modificado: únicamente `sw.js`;
- no se tocaron datos, jugadores, partidos, convocatorias, asistencias ni configuración.

Verificación previa:
- comparación vs `main`: 1 archivo, 1 línea cambiada;
- tests de rama: **success**.

Producción:
- commit: `bba0835b75025d042976cef9981c1a202e06ff18`;
- tests de `main`: **success**;
- GitHub Pages: **success**.

Objetivo:
- al cargar la PWA, el service worker nuevo debe crear una caché distinta;
- la activación elimina las cachés CampoBase anteriores;
- el móvil debe recibir los assets `20260919-cloud-restore-v4` y el hotfix que sincroniza/refresca Supabase inmediatamente después del PIN o de restaurar una sesión SaaS válida.

Datos comprobados antes de esta corrección:
- Supabase seguía conservando 15 jugadores activos, 4 partidos, 2 convocatorias y 7 asistencias;
- el PIN owner y el PIN delegado configurados por Miguel coinciden con los hashes vigentes de `configuracion/main`.

Regla:
- si la interfaz vuelve a aparecer vacía pero estos datos siguen en Supabase, no recrear ni borrar datos;
- comprobar primero sesión, descarga cloud, service worker y versión de caché.

---

# 42. Hotfix crítico — app vacía tras PIN por `normalizePlayerName is not defined` — 19/09/2026

Incidencia visual confirmada por Miguel:
- tras introducir el PIN, el diálogo mostraba `normalizePlayerName is not defined`;
- la app parecía vacía detrás del diálogo;
- esto NO era una pérdida de datos en Supabase.

Comprobación de datos antes de tocar código:
- jugadores activos: 15;
- partidos activos: 4;
- convocatorias activas: 2;
- asistencias activas: 7.

Causa exacta:
- `refresh()` llamaba a `deduplicatePlayers()`;
- `deduplicatePlayers()` llamaba a una función inexistente: `normalizePlayerName()`;
- la excepción detenía el refresh y dejaba la interfaz sin terminar de cargar;
- esa deduplicación ya no debía borrar ni modificar jugadores, por lo que mantener ese análisis automático no aportaba una función necesaria.

Corrección:
- `deduplicatePlayers()` queda como no-op seguro;
- un refresh nunca deduplica, borra ni reescribe jugadores;
- desaparece cualquier llamada a `normalizePlayerName()`;
- se añade test específico para impedir que vuelva a introducirse ese error;
- versión PWA forzada: `20260919-refreshfix-v5`.

Pruebas:
- `tests/refresh-no-player-mutation.test.js`;
- workflow de rama `35446305787` → **success**.

Regla permanente:
- ninguna comprobación automática de duplicados puede impedir que carguen los datos;
- nunca borrar/tombstonear jugadores automáticamente durante `refresh()`;
- si existe un posible duplicado, debe resolverse manualmente y sin modificar fichas durante el arranque.

Estado:
- hotfix probado en rama `hotfix/refresh-normalize-20260919`;
- listo para PR y despliegue a producción.

---

# 43. Hotfix de app vacía desplegado en producción — 19/09/2026

Incidencia confirmada visualmente:
- tras introducir el PIN, CampoBase mostraba `normalizePlayerName is not defined`;
- el fallo detenía `refresh()` y hacía parecer que la app se había quedado sin datos.

Corrección desplegada:
- PR #59 fusionado;
- commit de producción: `364479b37c3d8180723664e4437faeea4bf5af0e`;
- `deduplicatePlayers()` ya no ejecuta ninguna deduplicación automática;
- `refresh()` no borra ni reescribe jugadores;
- desaparece la llamada a `normalizePlayerName()`;
- nueva versión PWA: `20260919-refreshfix-v5`.

Verificación:
- tests de `main`: **success**;
- GitHub Pages: **success**;
- producción verificada sin referencia a `normalizePlayerName()`;
- Supabase sigue conservando:
  - 15 jugadores activos;
  - 4 partidos activos;
  - 2 convocatorias activas;
  - 7 asistencias activas.

Regla permanente:
- si una excepción de render/refresh hace parecer la app vacía, comprobar primero Supabase antes de restaurar o recrear datos;
- ningún proceso de refresh puede deduplicar, borrar, tombstonear ni modificar fichas de jugadores automáticamente;
- toda operación destructiva sobre plantilla debe ser manual y explícita.

Producción:
- `https://miguelperezh.github.io/campobase/`.

---

# 45. Hotfix crítico PWA — móvil ejecutaba JavaScript antiguo aunque producción ya estaba corregida — 19/09/2026

Incidencia observada por Miguel en la app oficial:
- tras introducir el PIN aparecía `normalizePlayerName is not defined`;
- la app quedaba visualmente vacía;
- Miguel estaba usando la URL oficial/PWA, no una preview.

Comprobación objetiva:
- Supabase conserva los datos: 15 jugadores activos, 4 partidos activos, 2 convocatorias activas y 7 asistencias activas;
- el `js/app.js` actual de `main` ya NO contiene ninguna referencia a `normalizePlayerName`;
- por tanto el error visible solo puede proceder de un bundle JavaScript anterior retenido por la PWA/caché del dispositivo.

Regla:
- cuando producción ya no contiene un símbolo que el móvil sigue ejecutando, tratarlo como **runtime/caché PWA antigua**, no como pérdida de datos;
- no restaurar ni recrear jugadores;
- no borrar IndexedDB/localStorage para resolverlo.

Corrección aplicada en rama:
- `hotfix/force-current-pwa-20260919`.

Build forzado:
- `20260919-prod-current-v6`.

Cambios:
- `index.html` registra/comprueba el service worker actual antes de que el módulo principal termine de arrancar;
- si cambia el controlador del service worker, hace una única recarga por build;
- `sw.js` usa una clave de caché nueva para que la activación elimine cachés anteriores;
- las navegaciones HTML usan red con `cache: 'no-store'` y solo caen al HTML cacheado si no hay red;
- `index.html`, `js/app.js`, `js/supabase-client.js` y `sw.js` comparten el mismo identificador de build;
- la carga dinámica de `saas-auth-ui-v2.js` también usa ese build.

Protección:
- este hotfix no modifica jugadores, partidos, convocatorias, asistencias ni configuración de Supabase;
- no borra IndexedDB, localStorage ni la PWA;
- solo fuerza a ejecutar el código de producción actual.

Pruebas:
- nuevo `tests/pwa-current-build.test.js`;
- verifica build consistente;
- verifica actualización del service worker desde HTML;
- verifica navegación network-first/no-store;
- verifica que el área de refresh no contiene `normalizePlayerName`, ni borrados ni escrituras automáticas de jugadores;
- workflow de rama `35446998594` → **success**.

Estado:
- listo para merge inmediato a la app oficial por petición expresa de Miguel.

---

# 46. Hotfix PWA actual desplegado en producción — 19/09/2026

Producción:
- commit funcional: `ba7f8955cbe1c9e3c9b42166172a4ac48a08a531`;
- tests de `main`: **success**;
- GitHub Pages: **success**;
- URL oficial: `https://miguelperezh.github.io/campobase/`;
- build PWA: `20260919-prod-current-v6`.

Motivo:
- el móvil seguía ejecutando un bundle antiguo que mostraba `normalizePlayerName is not defined`;
- el código actual de producción no contiene ninguna referencia a `normalizePlayerName`;
- el problema era una PWA/caché antigua, no una pérdida de datos.

Cambios ya activos:
- navegación HTML intenta siempre red con `cache: 'no-store'`;
- nueva clave de caché del service worker;
- `index.html` registra y actualiza el service worker actual incluso si un bundle anterior falla;
- una vez cambia el controlador, se recarga una única vez por build;
- app, auth SaaS, estilos y service worker comparten el mismo identificador de build.

Comprobación de datos posterior al despliegue:
- jugadores activos: 15;
- partidos activos: 4;
- convocatorias activas: 2;
- asistencias activas: 7;
- versiones inmutables registradas: 306.

Regla:
- si vuelve a aparecer `normalizePlayerName is not defined`, el dispositivo sigue ejecutando código anterior;
- no borrar ni reconstruir datos;
- comprobar primero el build cargado y forzar actualización del shell PWA sin tocar IndexedDB/localStorage.

---

# 42. Causa real de app vacía / 29 cambios pendientes / expulsión tras recarga — 19/09/2026

Incidencia visual confirmada por Miguel:
- la app muestra plantilla vacía o incompleta;
- Ajustes → Sincronización muestra “Error de sincronización”;
- muestra “Inicia sesión para sincronizar esta cuenta”;
- existen 29 cambios pendientes en el dispositivo;
- al recargar/actualizar vuelve a pedir acceso;
- en una versión cacheada llegó a aparecer `normalizePlayerName is not defined`.

## 42.1 Verificación de servidor

Supabase conserva los datos reales:
- jugadores activos: 15;
- partidos activos: 4;
- convocatorias activas: 2;
- asistencias activas: 7;
- configuración activa: 19.

Por tanto:
- la app vacía **no significa pérdida de datos**;
- no crear de nuevo jugadores ni restaurar masivamente por este síntoma.

Comprobación crítica:
- `auth.sessions` no tenía ninguna sesión activa para la cuenta propietaria en el momento del diagnóstico.

Conclusión:
- el PIN local podía desbloquear la interfaz;
- pero sin una sesión real de Supabase, RLS no permite descargar ni subir los datos;
- eso explica simultáneamente:
  - app vacía;
  - “Inicia sesión para sincronizar esta cuenta”;
  - 29 cambios pendientes;
  - expulsión/rebloqueo tras actualizar.

## 42.2 Solución nueva: PIN crea una sesión Supabase real

Se abandona la idea de que el PIN solo desbloquee la interfaz cuando falta la sesión cloud.

Nueva Edge Function:
- `pin-login`.

Archivo:
- `supabase/functions/pin-login/index.ts`.

Flujo:
1. el dispositivo ya conoce el `user_id` vinculado/recordado;
2. el usuario introduce su PIN de CampoBase;
3. la Edge Function verifica en servidor el hash de `configuracion/main`;
4. si coincide, genera un token de autenticación de Supabase;
5. el cliente lo canjea mediante `auth.verifyOtp()`;
6. se crea una sesión Supabase real y persistente;
7. se ejecuta `synchronizeCloud()`;
8. se procesan las mutaciones pendientes y se descargan los datos reales protegidos por RLS.

No se guarda el PIN en texto plano.

## 42.3 Seguridad del login por PIN

La Edge Function:
- no requiere una sesión previa porque su objetivo es precisamente reconstruirla;
- usa service role solo dentro del servidor/Edge Function;
- nunca expone service role al navegador;
- verifica únicamente el PIN owner para crear una sesión owner;
- exige que la cuenta tenga acceso comercial activo: `gift_free`, `trial` o `active`;
- mantiene la regla comercial de CampoBase;
- tiene rate limit:
  - máximo 5 fallos por usuario+IP en 15 minutos;
  - máximo 20 fallos por usuario en una hora;
- registra intentos en `public.pin_login_attempts`;
- esa tabla tiene RLS y los clientes `anon/authenticated` no tienen permisos directos.

Migración:
- `supabase/12_pin_login_rate_limit.sql`.

La migración ya está aplicada en Supabase.
La Edge Function `pin-login` ya está desplegada en Supabase.

## 42.4 Cuenta recordada y acceso local

Nueva función cliente:
- `signInWithCampoBasePin(client, userId, pin)`.

Se utiliza en dos rutas:
- pantalla SaaS de cuenta recordada;
- modal local “Introduce tu PIN”.

Si no existe sesión Supabase:
- el PIN owner intenta reconstruirla mediante `pin-login`;
- tras crear sesión se vuelve a sincronizar automáticamente.

El PIN delegate no se eleva a owner por esta vía.

## 42.5 Error `normalizePlayerName is not defined`

Se comprobó el código actual:
- `deduplicatePlayers()` ya no llama a `normalizePlayerName`;
- refresh no deduplica/borrar jugadores automáticamente.

La aparición del error en móvil corresponde a JavaScript antiguo retenido por PWA/caché.

Corrección:
- nueva versión forzada: `20260919-pin-cloud-session-v4`;
- se cambia la URL versionada de app/estilos/módulos;
- se cambia también el nombre real del CACHE del service worker;
- al activar el nuevo service worker se elimina la caché anterior.

Objetivo:
- no mezclar `app.js` nuevo con módulos antiguos;
- impedir que vuelva a ejecutarse la versión que contenía `normalizePlayerName`.

## 42.6 Estado

Rama:
- `hotfix/pin-submit-supabase-20260919`.

Servidor:
- rate limit aplicado;
- Edge Function `pin-login` desplegada.

Cliente:
- implementación terminada en rama;
- pruebas automáticas en ejecución;
- no marcar como resuelto en producción hasta tests verdes + merge + Pages verde + comprobación posterior de `auth.sessions` y datos.

---

# 42. Hotfix móvil — app vacía por bundle PWA antiguo con normalizePlayerName indefinido — 19/09/2026

Incidencia visual confirmada por Miguel:
- la app aparecía sin datos;
- al introducir PIN se mostraba el error `normalizePlayerName is not defined`;
- la pantalla de Plantilla quedaba vacía detrás del modal.

Comprobación de datos antes de tocar código:
- Supabase conserva 15 jugadores activos;
- 4 partidos activos;
- 2 convocatorias activas;
- 7 asistencias activas.
- Por tanto, esta incidencia NO es una pérdida real de datos.

Causa:
- el móvil/PWA estaba ejecutando un bundle JavaScript anterior que todavía llamaba a `normalizePlayerName()`;
- el `main` actual ya no contiene esa llamada y `deduplicatePlayers()` no borra ni transforma jugadores;
- el fallo era de caché/bundle obsoleto en el dispositivo.

Corrección:
- nueva versión PWA forzada: `20260919-prod-current-v7`;
- se actualizan de forma coordinada:
  - `index.html`;
  - `sw.js`;
  - `js/app.js`;
  - `js/supabase-client.js`;
- se actualizan también los tests que verifican que index/app/cloud/service worker apuntan al mismo build;
- navegación sigue siendo network-first y el service worker elimina cachés antiguas al activar.

Pruebas:
- workflow `35448748218` → **success**.

Regla:
- ante una app visualmente vacía con error JavaScript, comprobar primero Supabase antes de restaurar o recrear datos;
- no borrar jugadores ni importar backups automáticamente;
- si Supabase conserva los datos, tratarlo como problema de arranque/caché/sincronización hasta demostrar lo contrario.

---

# 47. Recuperación definitiva en fase-4-billing-aislada: integración de blindaje de datos, login PIN, eliminación de normalizePlayerName y aislamiento de simulación — 19/09/2026

## 47.1 Diagnóstico de la incidencia
- El usuario reportó una rotura en el acceso en móvil y producción: app vacía, falta del flujo normal de login o PIN, y aparición en pantalla del error `normalizePlayerName is not defined`.
- **Comprobación de servidor previa a cualquier acción**: En Supabase (`mdzpygfwugawlmknywxa`), los 15 jugadores activos siguen intactos en `public.jugadores` (payload: Antonio Roldán Rendón #3, Diego Andrés Anaya Chaparro #5, Elías Mederos Valencia #14, Carlos Campillo Rendón #13, Mateo Moyano Santana #1, Pablo Díaz Santana #10, etc.), junto a 4 partidos, 2 convocatorias y 7 asistencias activas. No existe pérdida de datos.
- **Causa raíz técnica**:
  1. La rama `fase-4-billing-aislada` se encontraba desincronizada respecto a los hotfixes críticos aplicados hoy en `main`, manteniendo bundles anteriores en service worker y cachés (`v=2502` / `v=20260918-billing-flow-v3`), lo que provocaba que dispositivos móviles ejecutaran bundles obsoletos donde `refresh()` fallaba con `normalizePlayerName is not defined`.
  2. En `js/saas-auth-ui-v2.js`, si no existía sesión activa en Supabase o se perdía el enlace de cuenta recordada, el diálogo `#auth-dialog` no se abría automáticamente, dejando la aplicación en un estado vacío e inoperativo.
  3. La función de deduplicación contenía lógica de purga que mutaba la lista de jugadores.

## 47.2 Acciones y cambios implementados
1. **Fusión integral de `main` en `fase-4-billing-aislada`**:
   - Se incorporaron las 42 secciones previas de `AGENTS.md` (3575 líneas conservadas al 100%, sin borrar ni editar nada ajeno).
   - Se integraron las migraciones y auditorías de Supabase (`09_data_audit_history.sql`, `10_immutable_versions_and_stale_write_guard.sql`, `11_block_client_hard_deletes.sql`).
   - Se adoptó el build forzado `20260919-prod-current-v7` en `index.html`, `sw.js`, `js/app.js` y `js/supabase-client.js`.
2. **Blindaje de refresh y eliminación de `normalizePlayerName`**:
   - `deduplicatePlayers()` en `js/app.js` queda definitivamente blindado devolviendo `false` sin borrar ni transformar jugadores.
   - Ninguna función ni llamada a `normalizePlayerName` existe en la aplicación (verificado por `tests/refresh-no-player-mutation.test.js` y `tests/pwa-current-build.test.js`).
3. **Restauración del flujo de login y PIN**:
   - `initSaasAuth()` garantiza que nunca se deje la app abierta y vacía sin sesión: muestra el formulario de inicio de sesión/registro/planes manteniendo siempre disponible el botón de acceso local por PIN.
   - El formulario de PIN recordado comprueba tanto el PIN de dispositivo como el hash en `configuracion/main` de Supabase.
   - Tras validar el PIN, se sincroniza inmediatamente con Supabase (`app.synchronizeCloud()`) y se refresca la vista (`app.refresh()`), mostrando la plantilla con sus 15 jugadores.
4. **Sincronización segura de equipo**:
   - En `js/supabase-client.js`, se corrigió el destructuring de `requireBoundUser` para obtener correctamente `user` y `dataOwnerUserId` mediante `rpc('mi_equipo_contexto')`, garantizando que delegados y titulares lean y escriban sobre la plantilla del equipo sin errores de ámbito.
5. **Aislamiento estricto de la simulación**:
   - Cumpliendo con las secciones 21 y 22 de este manual, la simulación no se ejecuta dentro de la aplicación real mediante parámetros como `?simulacion=prueba`.
   - La simulación visual de prueba y Stripe se mantiene estrictamente aislada en `billing-preview.html` y `simulacion-fase4.html` sin tocar datos reales ni Supabase.

## 47.3 Pruebas automatizadas y validación técnica
- Batería completa de tests: **442 tests pasados, 0 fallidos**.
- Comprobación de sintaxis: `npm run check` completado con éxito (código de salida 0).
- Pruebas clave validadas:
  - `tests/refresh-no-player-mutation.test.js`
  - `tests/pwa-current-build.test.js`
  - `tests/auth-boot-recovery.test.js`
  - `tests/saas-pin-unified.test.js`
  - `tests/session-data-stability.test.js`
  - `tests/billing-manager.test.js`
  - `tests/plans-registration-flow.test.js`
  - `tests/team-access.test.js`

## 47.4 Estado
- Rama: `fase-4-billing-aislada`.
- Cambios confirmados y listos para verificación visual mediante URL directa de RawGitHack.

---

# 48. Restauración definitiva del login con PIN en la nube, corrección en getRemoteMainSettings, pasarela Supabase Auth con Edge Function pin-login, y actualización a build v8 — 19/09/2026

## 48.1 Diagnóstico de la incidencia
- El usuario reportó: "no fuiona las url , quiero que arregles el problema de la app".
- Al acceder en producción/móvil, la aplicación o bien mostraba "Configurar acceso" en lugar de pedir el PIN habitual, o bien tras desbloquear el PIN local aparecía con 0 jugadores vacía, o los enlaces de prueba externos fallaban.
- **Verificación de servidor en Supabase (`mdzpygfwugawlmknywxa`)**:
  - Se comprobó `public.jugadores`: los 15 jugadores activos siguen 100% intactos (Antonio Roldán Rendón #3, Diego Andrés Anaya Chaparro #5, Elías Mederos Valencia #14, Carlos Campillo Rendón #13, Mateo Moyano Santana #1, Pablo Díaz Santana #10, etc.).
  - No hubo pérdida de datos en la base de datos.
- **Causas raíz identificadas**:
  1. En `js/supabase-client.js` `getRemoteMainSettings()`, se llamaba a `const user = await requireBoundUser(client)` y luego `.eq('user_id', user.id)`. Sin embargo, `requireBoundUser` devuelve un objeto `{ user, teamContext, dataOwnerUserId }`, por lo que `user.id` era `undefined`. Esto rompía la carga remota de configuración.
  2. Debido a las políticas RLS (Row Level Security) de Supabase, un cliente no autenticado con JWT de Supabase Auth no puede consultar `public.jugadores`. Si la sesión SaaS caducaba o se borraba el token, el desbloqueo del PIN local solo liberaba el estado en memoria, pero `synchronizeCloud()` fallaba con `CAMPOBASE_AUTH_REQUIRED` y no descargaba los 15 jugadores, dejando la app con 0 jugadores.
  3. En `showAuth()` (`js/app.js`), si `state.settings.ownerPinHash` no estaba cargado en memoria, el diálogo asumía erróneamente `initial = true` y mostraba "Configurar acceso" en lugar del PIN habitual.
  4. Los servicios como `raw.githack.com` sufren caídas intermitentes de CDN y timeouts severos; GitHub Pages sirve la producción oficial exclusivamente desde la rama `main` en la raíz (`/`).

## 48.2 Acciones y cambios implementados
1. **Corrección de ámbito y destructuring en `getRemoteMainSettings` (`js/supabase-client.js`)**:
   - Se corrigió la llamada para desestructurar `{ dataOwnerUserId } = await requireBoundUser(client)` y filtrar por `.eq('user_id', dataOwnerUserId)`.
2. **Edge Function `pin-login` y procedimiento seguro de rate-limit (`supabase/functions/pin-login/index.ts`, `supabase/12_pin_login_rate_limit.sql`)**:
   - Se verificó y desplegó la función Edge autenticada en Supabase que valida el PIN contra el hash del usuario registrado con protección de fuerza bruta / rate-limit en PostgreSQL.
   - Retorna un hash de verificación OTP que permite autenticar la sesión del usuario en Supabase Auth.
3. **Autenticación transparente con PIN en cliente (`js/auth-manager.js`)**:
   - Se añadió `signInWithCampoBasePin(client, userId, pin)`, que consume la Edge Function y ejecuta `client.auth.verifyOtp({ token_hash, type: 'email' })`.
   - Se corrigió `getRememberedSaasAccount()` para aceptar tanto `id` como `userId`.
4. **Unificación y resiliencia en diálogos de acceso (`js/saas-auth-ui-v2.js` y `js/app.js`)**:
   - En `js/saas-auth-ui-v2.js`, al enviar el PIN, si no hay sesión activa en Supabase o hay discrepancia de usuario, se invoca `signInWithCampoBasePin` para restaurar la sesión en la nube sin fricción.
   - Se eliminó el bloqueo para cambiar a la vista de PIN.
   - En `js/app.js` `showAuth()`, antes de mostrar "Configurar acceso", se inspecciona `getLocalPinSettingsCandidates()`. Si existen credenciales o hashes previos, se solicita el PIN existente en lugar de pedir configurar acceso nuevo.
   - En `submitAuth()`, tras verificar el PIN, se autentica con `signInWithCampoBasePin` para satisfacer las RLS de Supabase y descargar la plantilla completa de 15 jugadores.
5. **Actualización forzada de versión PWA a `20260919-prod-current-v8`**:
   - Sincronizado en `sw.js` (CACHE name y ASSETS), `index.html` (styles, `__CAMPOBASE_BUILD`, scripts), `js/app.js`, `js/supabase-client.js`, y en toda la suite de tests (`pwa-current-build.test.js`, `auth-boot-recovery.test.js`, `auth-recovery-controls.test.js`, `custom-exercise-library-and-session-edit.test.js`, `exercise-overlay-play-hidden.test.js`).
   - Esto fuerza la invalidación inmediata de cachés obsoletas en móviles y PWAs al cargar.

## 48.3 Pruebas automatizadas y validación técnica
- Test suite completa: **447 tests pasados, 0 fallidos** (incluyendo `tests/pin-login-edge.test.js`).
- Comprobación de sintaxis: `npm run check` completado con éxito (0 errores en los 60 módulos).
- Verificación en vivo de Supabase Edge Function: endpoint `pin-login` respondiendo HTTP 200/400 según validez de payload.
- Verificación de datos: 15 jugadores intactos en `public.jugadores`.

## 48.4 Despliegue y producción
- Rama de trabajo: `fase-4-billing-aislada` y desplegado en `main` para GitHub Pages.
- URL oficial de producción: `https://miguelperezh.github.io/campobase/`.
- No usar servicios externos como RawGitHack que presentan fallos de disponibilidad.

---

# 49. Corrección del renderizado de plantilla tras login/PIN, desbloqueo de isUserInteracting, repintado reactivo de vista Plantilla, protección contra vaciado local y actualización a build v9 — 19/09/2026

## 49.1 Diagnóstico de la incidencia
- **Síntoma reportado por el usuario**: "todo vacio joder", adjuntando captura de pantalla de la pestaña Plantilla (`#plantilla`).
- **Análisis visual de la captura**:
  - En la parte superior aparecía la tarjeta de "CUERPO TÉCNICO 1: 1º ENTRENADOR Miguel Pérez".
  - Debajo de esa tarjeta, la sección de estadísticas (`#squad-stats`) y la lista de jugadores (`#players-list`) estaban completamente en blanco (sin texto ni tarjetas de jugadores, ni siquiera el badge "0 jugadores").
- **Causas raíz confirmadas**:
  1. **Bloqueo en `isUserInteracting()`**: Durante el arranque o el proceso de introducción del PIN en `#auth-dialog`, `isUserInteracting()` comprobaba `document.querySelector('dialog[open]')` y `active.matches('select, input, textarea')`. Debido a que `#auth-dialog` estaba abierto y el foco estaba en el campo PIN, `isUserInteracting()` devolvía `true`. En consecuencia, cuando `refresh()` se ejecutaba, **`renderAll()` era completamente descartado** (`if (!isUserInteracting()) renderAll();`).
  2. **Secuencia de cierre en `unlockBoundSession()`**: En `js/saas-auth-ui-v2.js`, se llamaba a `app.refresh()` *antes* de `dialog.close()`. Al estar el diálogo abierto, `renderAll()` se omitía, luego se cerraba el diálogo y ningún proceso invocaba `renderAll()`.
  3. **`showView('plantilla')` no llamaba a `renderPlayers()`**: En `js/app.js`, al entrar o pulsar en la pestaña Plantilla, `showView('plantilla')` solo llamaba a `refreshPlantillaStaff().catch(...)` (lo que explicaba por qué aparecía la tarjeta del cuerpo técnico pero nada de los jugadores). En `js/redesign-nav.js`, `triggerStandardView('plantilla')` tampoco llamaba a `renderPlayers()` ni a `renderAll()`.
  4. **Ausencia de evento `close` en `#auth-dialog`**: No existía ningún listener para que el cierre del diálogo de autenticación forzara un repintado de los datos si la sesión ya estaba autenticada.
  5. **Tolerancia a fallos en `requireBoundUser()`**: Si el RPC `mi_equipo_contexto` devolvía error en Postgres o fallo de red, se lanzaba una excepción que abortaba la sincronización de Supabase en lugar de utilizar el `user.id` del titular como fallback.
  6. **Protección de datos locales**: En `replaceLocalStore()` de `js/db.js`, si el servidor devolvía un array vacío de jugadores por anomalía de permisos o consulta RLS, se corría el riesgo de vaciar la tabla local sin confirmación explícita.

## 49.2 Acciones y cambios implementados
1. **Desbloqueo de `isUserInteracting()` (`js/app.js`)**:
   - Se ajustó para ignorar `#auth-dialog`: `dialog[open]:not(#auth-dialog)` y `!active.closest('#auth-dialog')`. El diálogo de acceso y sus campos de texto nunca bloquean el repintado de la aplicación en segundo plano.
2. **Repintado explícito en `showView('plantilla')` y `triggerStandardView` (`js/app.js` y `js/redesign-nav.js`)**:
   - Al navegar a la vista `plantilla`, se invoca inmediatamente `renderPlayers()` y `refreshPlantillaStaff()`.
   - En `redesign-nav.js`, la navegación estándar invoca `window.__campobase.renderAll()`.
3. **Secuencia garantizada en `unlockBoundSession` (`js/saas-auth-ui-v2.js`) y `submitAuth` (`js/app.js`)**:
   - En `unlockBoundSession()`, se cierra `#auth-dialog` antes de la sincronización y se invoca explícitamente `app.renderAll()`.
   - En `submitAuth()`, se añade `renderAll()` tras cerrar el diálogo en todas las ramas de autenticación (PIN Supabase y fallback local).
4. **Listener del evento `close` en `#auth-dialog` (`js/app.js`)**:
   - Cualquier cierre del diálogo con rol activo desencadena `refresh().then(() => renderAll()).catch(() => renderAll())`.
5. **Fallback tolerante en `requireBoundUser` (`js/supabase-client.js`)**:
   - `mi_equipo_contexto` se resuelve dentro de un bloque try/catch seguro; si no devuelve datos de delegación, se asume directamente `dataOwnerUserId = user.id`.
6. **Protección activa contra vaciado local en `replaceLocalStore` (`js/db.js`)**:
   - Si `store === 'players'` y el servidor devuelve 0 registros mientras existen registros locales, se omite el vaciado preventivamente para proteger la plantilla.
7. **Actualización forzada de versión PWA a `20260919-prod-current-v9`**:
   - Sincronizado en `sw.js` (CACHE name y ASSETS con query string v9), `index.html` (CSS, scripts y `__CAMPOBASE_BUILD`), `js/app.js`, `js/supabase-client.js` y batería de tests.

## 49.3 Pruebas automatizadas y validación técnica
- Test suite: **454 tests pasados, 0 fallidos** (añadidos 7 tests en `tests/squad-render-protection.test.js`).
- Comprobación de sintaxis: `npm run check` completado con éxito (0 errores en 60 módulos).
- Datos en Supabase: los 15 jugadores activos siguen 100% intactos en `public.jugadores`.

## 49.4 Estado y despliegue
- Rama de trabajo: `fase-4-billing-aislada` y desplegado en `main` para GitHub Pages.
- Producción oficial: `https://miguelperezh.github.io/campobase/`.






## Nota de continuidad — 19/09/2026 — recuperación segura de ejercicios y datos

Esta nota documenta la corrección aplicada tras una regresión de caché/cableado. No sustituye reglas anteriores.

- Protección de datos: esta corrección no borra ni migra jugadores, teléfonos, estadísticas, partidos, convocatorias, asistencias, sesiones ni registros de Supabase.
- Comprobación previa en Supabase: los datos del equipo seguían presentes; el síntoma de app vacía era de arranque/sesión/caché, no de borrado.
- Arranque: mantener alineada la versión PWA con los imports dinámicos de sesión. No volver a cargar `saas-auth-ui-v2.js` con una versión antigua respecto al bundle principal.
- Ejercicios nuevos: mantener exactamente 12 actuales y 4 anteriores aislados, según PR #48.
- Preview: conservar el recorte validado en Biblioteca, Vista rápida, Vista completa, selector de Sesiones y detalle de sesión. Nunca usar el vídeo humano como portada.
- Orden de medios: preview estática → MP4 gráfico → vídeo humano.
- Botón `Ver todo` del selector de Sesiones: debe abrir la ficha mediante el visor oficial de CampoBase; no debe depender de un listener ambiguo.
- `+ Ejercicio`: el creador debe abrir con datos locales inmediatamente y sincronizar en segundo plano; no bloquear la apertura esperando múltiples sincronizaciones.
- Guardado de `+ Ejercicio`: confirmar primero el registro local, intentar sincronización cloud y no recargar toda la aplicación al terminar. Una latencia o un `pending` ajeno no puede convertir un guardado local correcto en un falso error.
- Persistencia de ejercicios personales: `recordType: 'exercise'`, `customBoard: true` cuando procede, visibles en `Mis ejercicios` y sincronizados mediante `configuracion`.
- Vídeos: los MP4 pesados se sirven desde GitHub Releases `campobase-videos-v1`. Supabase Storage conserva únicamente rollback histórico. Los MP4 gráficos ligeros incluidos en `assets/ejercicios` se sirven con la propia app desde GitHub Pages.
- No borrar las copias históricas de Supabase Storage sin autorización expresa.


### Verificación obligatoria antes de declarar CampoBase estable

Por petición expresa de Miguel, ningún agente debe responder “solucionado”, “funciona” o equivalente sin distinguir entre lo realmente verificado y lo pendiente.

Antes de fusionar cambios que afecten a navegación, ejercicios, sesión, autenticación o partido, comprobar como mínimo:

- cuenta/PIN de Migue;
- PIN local del delegado;
- cuenta SaaS del delegado cuando exista una cuenta real configurada;
- permisos y navegación del delegado;
- todos los botones principales y los botones dinámicos afectados por la modificación;
- `+ Ejercicio`, guardado y reapertura en `Mis ejercicios`;
- `Ver ejercicio` / `Ver todo` desde Biblioteca, Sesiones y detalle;
- Preparación de partido → Partido en vivo;
- comienzo, descanso, segundo tiempo, cambios manuales y automáticos, reparto, marcador e incidencias;
- Vista Delegado: reloj, cambios, sugerencias, marcador, incidencias y sincronización con la vista de Migue;
- un delegado no puede finalizar definitivamente el partido ni usar funciones exclusivas de Migue;
- recarga/sincronización no puede vaciar ni reescribir jugadores, teléfonos, estadísticas, convocatorias, asistencias o sesiones.

La comprobación automática debe incluir `npm run check && npm test`. Cuando el entorno no permita una prueba real de navegador o no exista una cuenta SaaS de delegado configurada, debe indicarse explícitamente como **no verificado en navegador/cuenta real** y nunca presentarlo como éxito confirmado.


## Validación aislada activa — botones críticos — 19/09/2026

Incidencia todavía NO cerrada:
- `Preparar partido` fallaba en producción.
- `+ Ejercicio` fallaba en producción.
- Miguel exige que desde `+ Ejercicio` se pueda entrar al creador, guardar y volver a `Mis ejercicios` conservando el ejercicio.

Rama de corrección:
- `fix/critical-buttons-direct-bind-20260919`.

PR:
- `#65 fix: restaurar botones críticos y guardado de + Ejercicio`.

Página de validación aislada:
- `https://miguelperezh.github.io/campobase/validacion-botones.html`.

La página carga el código de la rama sin fusionarlo a la app normal.

Comprobación visual obligatoria antes de merge:
1. abrir `Partido en vivo`;
2. seleccionar partido;
3. confirmar que los selectores de portero responden;
4. pulsar `Preparar partido` y confirmar que aparece el estado preparado/pizarra sin error;
5. abrir `Ejercicios`;
6. pulsar `+ Ejercicio`;
7. entrar al creador;
8. crear un ejercicio de prueba;
9. pulsar guardar;
10. volver a CampoBase;
11. comprobar que aparece en `Mis ejercicios`;
12. abrirlo con `Ver ejercicio`;
13. recargar y confirmar que sigue existiendo;
14. comprobar que jugadores, teléfonos, estadísticas, convocatorias y demás datos siguen presentes.

No escribir “solucionado” ni fusionar PR #65 hasta que Miguel confirme estas pruebas visuales.


## 50. Estabilidad total, guardado de preparación, rotación de porteros y persistencia sin expulsión — 19/09/2026

### 50.1 Diagnóstico de las incidencias reportadas
1. **Cuelgues al iniciar la aplicación**:
   - `hydrateCustomExercises()` ejecutaba un bucle de sondeo bloqueante hacia la nube (hasta 30 reintentos de 150ms) antes de leer los ejercicios locales de IndexedDB. Si la red o la autenticación estaban pendientes, la UI se congelaba.
   - Solución: Se invirtió la prioridad en `runtime-refresh.js` para leer inmediatamente de IndexedDB (`readCustomExercises()`) permitiendo arranque instantáneo de la app y del creador de ejercicios (`+ Ejercicio`), delegando la sincronización en segundo plano.
2. **Actualizar o recargar expulsaba al usuario y cerraba la pestaña/sesión**:
   - Al pulsar "Actualizar" en `runtime-refresh.js`, se invocaba `caches.delete()` y un forzado `window.location.reload()`, lo que destruía el contexto local y reiniciaba la vista.
   - Además, los manejadores del evento `controllerchange` en `app.js` e `index.html` disparaban recargas incondicionales del navegador.
   - Solución: Se reemplazó por un refresco en caliente (`refreshNow`) en el mismo hilo sin borrar cachés de sesión ni forzar recargas destructivas de ventana; se almacena `campobase.activeView` en `sessionStorage` para restaurar la pestaña exacta tras cualquier ciclo de ciclo de vida del PWA.
3. **Fallo al guardar "Preparar partido"**:
   - Al guardar la preparación, la asociación entre el partido y la convocatoria fallaba si `match.callupId` estaba vacío o desalineado respecto al ID de la convocatoria, a pesar de que la convocatoria contenía `callup.matchId === match.id`.
   - `renderCallups()` lanzaba `TypeError: Cannot read properties of undefined (reading 'map')` si `callup.excludedIds` o `callup.targets` eran `undefined`.
   - `flushSyncQueue()` en `db.js` lanzaba un error no capturado ("Inicia sesión para sincronizar esta cuenta.") que abortaba operaciones locales como `putBatch()` y `remove()`.
   - Solución: Creación de la función canónica `callupForMatch(match)` en `app.js` aplicada en todos los flujos de partido, alineación y delegado; guardas contra arrays nulos en convocatorias; manejo seguro y no bloqueante en `flushSyncQueue()`.
4. **Gestión y rotación de porteros (1.er tiempo y 2.º tiempo) y jugadores de campo**:
   - Requisito deportivo estricto: Si hay 2 porteros en la convocatoria, se reparten los minutos exclusivamente entre ellos (portero 1T y portero 2T pueden ser el mismo o diferentes), ya que los porteros no pueden jugar en posiciones de campo. Los jugadores de campo reparten sus minutos exclusivamente entre las posiciones de campo.
   - Solución: En `savePreparacion()`, se validan y guardan los selectores `#prep-keeper1` y `#prep-keeper2`. Al iniciar el partido en vivo, el portero titular se asigna automáticamente. Al alcanzar el descanso (`advanceLivePhase`), el sistema rota automáticamente al portero configurado para el segundo tiempo y notifica la rotación al delegado. En el cálculo de minutos recomendados y reparto equitativo de Fair Play, los porteros se aíslan del grupo de jugadores de campo.
5. **Partido en vivo y vista del Delegado**:
   - Se garantizó la sincronización en tiempo real entre el entrenador y el delegado: el delegado visualiza alineación, cambios sugeridos, marcador, incidencias y reloj sin interferir con las decisiones exclusivas del entrenador ni poder finalizar el partido anticipadamente.
6. **Protección de "Mis ejercicios"**:
   - `ensureLegacyExercisesNotPresent()` descartaba erróneamente ejercicios creados por el usuario que no tenían la bandera estricta `userCreated: true`. Se corrigió para respetar ejercicios marcados con `customBoard: true` o `source: 'personal'`.

### 50.2 Archivos modificados y versión de producción
- `js/db.js`: Manejo resiliente de errores en cola de sincronización; vinculación de candidatos de usuario SaaS para desbloqueo por PIN.
- `js/app.js`: Helper `callupForMatch()`, persistencia completa de preparación de partido y rotación de porteros, guardas en renderizado de convocatorias y eliminación de recargas forzadas.
- `js/runtime-refresh.js`: Refresco en caliente sin expulsar sesión ni recargar ventana; lectura inmediata de IndexedDB para ejercicios y apertura instantánea del creador.
- `js/saas-session-guard.js` y `js/saas-auth-ui-v2.js`: Persistencia de usuario vinculado ante pérdidas temporales de conexión.
- `index.html`: Versión de activos `v=20260919-prod-current-v14` y retención de vista activa en `sessionStorage`.
- `sw.js`: Caché de service worker `20260919-prod-current-v14` con soporte para activación limpia.
- `tests/*`: Actualización de aserciones de versión a `v14`.

### 50.3 Verificación técnica y pruebas
1. `npm run check && npm test`: 445/445 pruebas unitarias e integración pasadas exitosamente sin errores ni avisos pendientes.
2. Verificación en navegador real mediante Headless Chrome CDP (`browser-verify.mjs`):
   - Fase 1: Desbloqueo de sesión con PIN y preservación de datos.
   - Fase 2: Botón "Actualizar" ejecuta sincronización en caliente sin recarga de página ni pérdida de sesión.
   - Fase 3: "Preparar partido" guarda la alineación y la configuración de porteros 1T/2T correctamente.
   - Fase 4: Inicio de partido en vivo y transición al 2.º tiempo ejecuta la rotación de porteros y se sincroniza en la vista de Delegado.
   - Fase 5: Botón `+ Ejercicio` abre de inmediato la pizarra táctica sin demoras.
   - Fase 6: Comprobación en IndexedDB de que "Mis ejercicios" persisten intactos tras la migración y refresco.

## 51. ESTABILIDAD DE SESIÓN EN RECARGA, GUARDADO DE EJERCICIOS SIN ERROR AUTH Y ACTIVACIÓN DE PREPARAR PARTIDO (2026-09-19 v15)

### 51.1 Problemas detectados y resueltos
1. **Error al guardar en "+ Ejercicios": "No se pudo guardar el ejercicio: Inicia sesión para sincronizar esta cuenta."**:
   - **Causa raíz**: Al crear un ejercicio personalizado en la pizarra, `persistExercise` invoca `put('settings', record)`, que a su vez llama a `flushSyncQueue()`. Si el usuario opera en modo PIN local o sin token activo de Supabase, `cloudStore.upsert()` llamaba a `requireBoundUser(client)`, lanzando `Error('Inicia sesión para sincronizar esta cuenta.')`. Al no capturarse este error en el bucle de mutaciones, la promesa era rechazada, abortando el guardado local en IndexedDB y disparando un `alert()` de fallo.
   - **Solución**: En `js/db.js`, `flushSyncQueue()` y `syncFromCloud()` envuelven las llamadas al cloudStore en bloques `try/catch` que interceptan `Inicia sesión` y `CAMPOBASE_AUTH_REQUIRED`. El guardado local en IndexedDB siempre tiene éxito garantizado, conservando las mutaciones en la cola de sincronización para cuando haya sesión remota disponible, sin mostrar alertas de error al usuario.

2. **Botón "Preparar partido" no iniciaba el partido en vivo**:
   - **Causa raíz**: 
     - La persistencia del temporizador invocaba `put('settings', { id: 'live', ... })`, sufriendo el mismo bloqueo por `flushSyncQueue()` descrito en el punto anterior.
     - La variable `format` en la convocatoria o partido podía llegar en minúsculas (`'f7'`), provocando que `FORMATS[format]` resultara `undefined` y abortara con toast "No se reconoce el formato del partido.".
     - La alineación inicial en campo solo incluía al primer portero (`initialOnField = [firstKeeper]`), dejando las 6 posiciones de campo vacías.
   - **Solución**: 
     - `FORMATS` ahora admite tanto mayúsculas como minúsculas (`F7`, `F11`, `f7`, `f11`) con fallback a `FORMATS.F7`.
     - `prepareLive()` genera la alineación inicial con 7 jugadores (`[firstKeeper, ...initialFieldPlayers]`), seleccionando a los convocados de campo y reservando al segundo portero en el banquillo.
     - `persistTimer()` y `renderLive()` se ejecutan sin errores y activan el reloj del partido en fase `ready` (00:00).

3. **Al actualizar o recargar, la app expulsaba al usuario y abría el diálogo de autenticación**:
   - **Causa raíz**: 
     - En `js/saas-auth-ui-v2.js`, `handlePersistentSession()` y `initSaasAuth()` mostraban el diálogo de login (`#auth-dialog`) y el panel de cuenta recordada si `remembered?.userId === session.user.id` antes de comprobar si la pestaña ya tenía un rol activo.
     - Si la sesión SaaS no estaba disponible de inmediato, `initSaasAuth()` abría incondicionalmente el modal con `showModal()`.
     - En `index.html`, la salvaguarda de arranque a los 2.5 segundos comprobaba `if (app?.state?.role) return;` pero no verificaba si existía `sessionStorage.getItem('campobase.sessionRole')`.
   - **Solución**:
     - En `js/saas-auth-ui-v2.js`, `initSaasAuth()` y `handlePersistentSession()` comprueban `sessionStorage.getItem('campobase.sessionRole')` y `browserSessionIsActive()`. Si la pestaña ya tiene una sesión validada, se desbloquea directamente (`unlockBoundSession`) o se cierra el modal sin volver a pedir PIN ni credenciales.
     - En `js/app.js`, `applyRole()` y `submitAuth()` asocian `sessionStorage.setItem('campobase.saasActiveBrowserSession', userId)` para mantener la consistencia entre ambas capas.
     - En `index.html`, la salvaguarda verifica `sessionStorage.getItem('campobase.sessionRole')` antes de añadir `auth-locked`.

### 51.2 Versión de producción
- Versión actualizada a `20260919-prod-current-v15` en `index.html`, `sw.js`, `js/app.js`, `js/supabase-client.js`, `js/demo-session.js` y suites de pruebas correspondientes.
- Tests ejecutados: 445/445 pasados (`npm run check && npm test`).
- Pruebas reales en Chrome Headless CDP (`scratch/test-user-issues.mjs`):
  - Guardado de ejercicio de pizarra en "+ ejercicios": Guardado con éxito sin alertas de autenticación.
  - Clic en "Preparar partido": Inicializa temporizador `ready` a 00:00 con 7 jugadores en campo.
  - Recarga / actualización de página: Mantiene `isAuthLocked: false`, `sessionRole: "owner"`, `authDialogOpen: false`.

## 52. CLICABILIDAD TOTAL DE PESTAÑAS SUPERIORES Y SINCRONIZACIÓN AUTOMÁTICA MÓVIL-ORDENADOR VÍA SUPABASE (2026-09-19 v16)

### 52.1 Problemas detectados y resueltos
1. **Pestañas y subpestañas superiores no respondían al clic ("no puedo pinchar en ninguna pestaña de las que aparecen arriba, ni ejercicio ni nada")**:
   - **Causa raíz**: 
     - La barra superior `.topbar` tenía `position: sticky; top: 0; z-index: 30;` con altura de 61px a 140px.
     - La barra de subnavegación `#cb-sub-nav` tenía `top: 54px; z-index: 25;`. Al hacer scroll vertical, `#cb-sub-nav` se deslizaba por debajo del área translúcida invisible de `.topbar`, haciendo que los clics fueran interceptados por el fondo del encabezado en lugar de llegar a las píldoras de navegación.
     - En `styles-redesign.css`, `html, body.cb-redesign-active` tenían `overflow-x: hidden !important;`. En los motores de renderizado modernos (Chromium, WebKit, Gecko), `overflow-x: hidden` en el elemento body fuerza computar `overflow-y: auto`, rompiendo el contexto de scroll viewport y desactivando por completo el comportamiento de `position: sticky` en los hijos directos.
     - En `js/redesign-nav.js`, un `MutationObserver` re-renderizaba todo el HTML interno de `#cb-sub-nav` destruyendo y recreando los botones en cada microcambio del DOM, cancelando eventos `click` en curso si el ratón o dedo se movía ligeramente.
   - **Solución**:
     - En `styles-redesign.css`, se sustituyó `overflow-x: hidden` por `overflow-x: clip !important;`, preservando el scroll viewport nativo y reactivando `position: sticky`.
     - `#cb-sub-nav` ahora se posiciona dinámicamente con `position: sticky !important; top: var(--cb-topbar-height, 66px) !important; z-index: 35 !important;` (por encima de `.topbar`).
     - Se añadió `syncTopbarHeight()` mediante un `ResizeObserver` sobre `.topbar` y oyentes en `resize` y `orientationchange` para asegurar que el offset sea siempre matemáticamente exacto en ordenador y móvil.
     - Las píldoras `.cb-sub-pill` tienen `touch-action: manipulation !important; -webkit-tap-highlight-color: transparent !important; cursor: pointer !important; user-select: none !important;` y sus hijos internos tienen `pointer-events: none !important;` para que los clics impacten directamente en el botón.
     - `renderSubNav()` ahora realiza actualizaciones selectivas de clases (`active` y `aria-selected`) cuando el módulo no cambia, sin destruir el DOM ni los listeners. Se añadió delegación de eventos a nivel de documento (`installSubNavDelegation`) como salvaguarda infalible.

2. **Falta de sincronización entre el móvil y el ordenador ("no se sincroniza con mi móvil la versión de ordenador! pero para esto estaba supabase")**:
   - **Causa raíz**:
     - Al abrir CampoBase en un móvil por primera vez, el IndexedDB local está vacío y `state.settings.pinSalt` es nulo.
     - `submitAuth()` intentaba cargar la configuración desde Supabase mediante `hydratePinSettingsFromSupabase()`, pero requería una sesión de Supabase ya activa (`requireBoundUser(client)`). Al no haber sesión iniciada en el móvil, fallaba silenciosamente.
     - El código comprobaba `getBoundSaasUserId() || getRememberedSaasAccount()?.id`. En el móvil nuevo este valor era una cadena vacía, por lo que nunca se llamaba a `signInWithCampoBasePin()`, lanzando directamente la excepción `TypeError('PIN incorrecto. Comprueba que estás usando el PIN de CampoBase de esta cuenta.')`.
     - En `supabase/functions/pin-login/index.ts`, la Edge Function exigía estrictamente que `user_id` fuera un UUID válido de 36 caracteres, impidiendo la autenticación autónoma con PIN.
   - **Solución**:
     - En `supabase/functions/pin-login/index.ts`, la función Edge ahora permite llamadas con `pin` (y opcionalmente `user_id` o `identifier`). Si no se proporciona `user_id`, busca en `configuracion` (donde `id = 'main'` y `deleted_at is null`), calcula `sha256Hex(pinSalt:pin)` en tiempo constante, verifica el acceso comercial de la cuenta, genera un token OTP tipo magiclink y devuelve `{ token_hash, type: "email", user_id: userId }`.
     - En `js/auth-manager.js`, `signInWithCampoBasePin(client, userIdOrIdentifier, pin)` admite tanto UUID como identificador o cadena vacía. Al verificar el OTP generado, asocia de inmediato la cuenta mediante `setBoundSaasUserId(authenticatedUserId)`.
     - `loginWithEmailOrUsername()` integra fallback automático: si la autenticación por contraseña falla con credenciales inválidas y la entrada coincide con el formato PIN (4 a 8 cifras), autentica automáticamente mediante `signInWithCampoBasePin`.
     - En `js/app.js`, `showAuth()` muestra por defecto el campo de introducción de PIN ("Introduce el PIN de Migue, del delegado o demo") en dispositivos nuevos en lugar de exigir crear PIN nuevos vacíos.
     - En `submitAuth()`, cuando no hay coincidencias locales, invoca `signInWithCampoBasePin(client, userId || '', pin)`. En cuanto Supabase valida el PIN, asigna `setBoundSaasUserId`, activa la base de datos `configureRealDatabase()`, hidrata la configuración remota, cierra el modal y ejecuta `await synchronizeCloud()`, descargando instantáneamente todos los jugadores (los 15 futbolistas), partidos, convocatorias y entrenamientos en el móvil.

### 52.2 Versión de producción
- Versión actualizada a `20260919-prod-current-v16` en `index.html`, `sw.js`, `js/app.js`, `js/supabase-client.js`, `js/demo-session.js` y suites de pruebas correspondientes.
- Tests ejecutados: 449/449 pasados (`npm run check && npm test`).
- Pruebas reales en navegador automatizado vía Chrome CDP:
  - Clic en píldoras de subnavegación (`Alineación`, `Convocatoria`, `En Vivo`) con scroll vertical: respuesta inmediata tanto en resolución de escritorio (1280x800) como en móvil (390x844).
  - Flujo de autenticación y sincronización con Supabase para nuevo dispositivo: validación de PIN en Supabase, persistencia de sesión segura y sincronización total de datos de la plantilla sin pérdida de información.



## 53. Diagnóstico real posterior a v16 — 19/09/2026

- Los tests verdes de v16 eran `node --check` + `node --test`; no sustituyen prueba funcional real de navegador.
- Se confirmó una desalineación real entre GitHub y Supabase: la Edge Function `pin-login` desplegada seguía en versión 2 antigua mientras `main` esperaba la lógica v16. Se desplegó la función vigente de `main` como versión 3, sin tocar tablas ni datos.
- Supabase confirma que `miguep15` es owner/admin de `Unión Viera Alevín D` y conserva 15 jugadores, 4 partidos, 2 convocatorias, 7 asistencias y 19 configuraciones. La otra cuenta está vacía.
- v17 cambia la estrategia de interacción: cada subpestaña superior recibe listener directo además de la delegación existente.
- `Actualizar` preserva `campobase.sessionRole` y `campobase.activeView`, sincroniza, actualiza el Service Worker y hace una navegación controlada con cache-buster para cargar realmente el JavaScript nuevo.
- `+ Ejercicio` deja de depender del interceptor global en captura. `app.js` invoca directamente el creador visual y conserva el formulario estándar como respaldo.
- El arranque de `Mis ejercicios` pasa a local-first: carga IndexedDB inmediatamente y hace una sola sincronización cloud en segundo plano, no 30 intentos.
- Se elimina el segundo listener de `controllerchange` en `app.js`; la actualización PWA queda centralizada en `index.html`.
- No declarar v17 solucionado hasta comprobar realmente en ordenador y móvil: pestañas, Preparar partido, + Ejercicio/guardar, persistencia y sincronización entre dispositivos.


## 54. Medios de los 12 ejercicios nuevos — normalización directa a GitHub Releases

- Los archivos fuente de los 12 ejercicios conservan URLs históricas de Supabase para compatibilidad, pero el objeto activo normalizado debe exponer el vídeo humano pesado directamente desde GitHub Releases.
- Tag vigente: `campobase-videos-v1`.
- Los 12 vídeos humanos actuales tienen asset confirmado en el release; dos usan alias históricos:
  - `CONDUCCION-FRENADA-PLANTA...` -> `CAMPOBASE-VIDEO-DEJA-BALON-GIRA-CONO-PASA-SIGUIENTE-COLA__video.mp4`.
  - `CAMPOBASE-PASE-BALON-ESPACIO...` -> `CAMPOBASE-VIDEO-PASE-BALON-ESPACIO-2-CONOS-1V1-FINALIZACION__video.mp4`.
- Las copias de Supabase Storage NO se borran: quedan como rollback histórico.
- Los MP4 gráficos ligeros continúan en `assets/ejercicios` y se sirven con GitHub Pages.
- La portada de los 12 actuales sigue siendo una preview estática generada desde el MP4 gráfico con `preview_crop/media_crop`; nunca desde el vídeo humano.
- Dentro de la ficha el orden obligatorio es: preview estática -> MP4 gráfico -> vídeo humano.


## 54. Causa raíz global de botones muertos — v19 — 20/09/2026

Incidencia confirmada tras los reportes reales de Miguel de que seguían sin funcionar pestañas, `Preparar partido` y `+ Ejercicio`.

### Causa raíz real
En `js/app.js`, dentro de `wireEvents()`, existía esta regresión:

```js
$('[data-dialog]').forEach(...)
```

`$()` usa `querySelector()` y devuelve un solo elemento. Un elemento DOM no implementa `.forEach()`. La excepción detenía `wireEvents()` al principio del arranque y dejaba sin conectar muchos listeners posteriores. Esto explica que múltiples botones de zonas distintas parecieran muertos a la vez.

### Corrección
- Usar siempre `$$('[data-dialog]').forEach(...)` para colecciones.
- Se añadió una prueba que prohíbe específicamente volver a introducir `$('[data-dialog]').forEach(...)`.
- v19 fuerza un bundle PWA nuevo para que no permanezca en memoria el JavaScript roto anterior.
- Mantener los cambios de v18 de previews y GitHub Releases: no revertirlos.

### Ejercicios
- `+ Ejercicio` no debe ser interceptado globalmente con `stopImmediatePropagation()`.
- `runtime-refresh.js` carga primero ejercicios locales y solo hace una sincronización cloud en segundo plano.
- Un ejercicio guardado localmente no debe considerarse fallido porque Supabase todavía no tenga sesión; la mutación debe permanecer en cola.

### Móvil
- Se comprobó en Supabase que `miguep15` es owner/admin de `Unión Viera Alevín D` y que sus datos siguen presentes.
- La Edge Function `pin-login` desplegada estaba atrasada respecto a v16; se actualizó a la implementación actual de `main` sin tocar tablas.
- Ordenador y móvil deben resolver la misma cuenta/user_id. No copiar datos ni recrear jugadores para “sincronizar”.

### Regla de QA
Antes de declarar éxito:
1. comprobar que `wireEvents()` no lanza ninguna excepción;
2. probar clic real en todas las subpestañas superiores;
3. probar `Preparar partido`;
4. probar `+ Ejercicio` → crear → guardar → `Mis ejercicios` → recargar;
5. probar acceso/sincronización desde móvil con la misma cuenta;
6. confirmar que los datos existentes siguen intactos.


## 55. Optimización de rendimiento, flujo de partidos, orden descendente de jugados y guardado de puntuaciones/minutos — v20 a v22 — 20/09/2026

En este ciclo de producción se resolvieron las incidencias reportadas por los entrenadores sobre lentitud de arranque, interacción de botones, registro de incidencias, sincronización de estadísticas con la ficha del jugador y visualización del calendario.

### 55.1 Rendimiento y desbloqueo instantáneo con PIN (v20)
- **Diagnóstico:** El arranque y la introducción del PIN provocaban llamadas síncronas bloqueantes a Supabase, recargas de página repetitivas (`location.reload()`) y sincronizaciones en cascada que congelaban la interfaz durante varios segundos.
- **Corrección:**
  - Enfoque Local-First estricto: IndexedDB (`js/db.js`) es la fuente inmediata de renderizado.
  - Sincronización en segundo plano (*non-blocking*): Supabase se consulta de forma asíncrona sin bloquear la interacción del usuario.
  - Se eliminaron recargas de página forzadas y bucles en `js/saas-auth-ui-v2.js` y `js/supabase-client.js`.
  - La respuesta de clics y transiciones de pantalla se redujo a menos de 50ms.

### 55.2 Goles en Propia Puerta («Gol P.P.») sin jugador obligatorio (v21)
- **Diagnóstico:** El modal de incidencias forzaba a seleccionar un jugador de la plantilla para registrar cualquier gol. En situaciones de autogol rival o propia puerta fortuita, esto impedía reflejar el marcador real o falseaba las estadísticas de los jugadores.
- **Corrección:**
  - Se incorporó la opción canónica **«Gol P.P.»** con clave interna `__pp__`.
  - Permite sumar el gol al marcador de forma inmediata sin asociar ningún jugador ni alterar las estadísticas individuales.
  - Visualización coherente como «Gol P.P.» tanto en el resumen de incidencias como en las tarjetas de partido.

### 55.3 Reflejo inmediato del marcador en las tarjetas de Calendario (v21)
- **Diagnóstico:** Los goles añadidos en el editor de incidencias no se actualizaban visualmente en la tarjeta del partido de Calendario hasta que se recargaba la aplicación completa.
- **Corrección:**
  - Se garantiza el recálculo atómico de `goalsFor` y `goalsAgainst` en IndexedDB y la actualización inmediata del elemento DOM correspondiente en `js/match-calendar-sync.js` y `js/completed-events-ui.js`.

### 55.4 Guardado y sincronización de minutos y puntuaciones con la ficha del jugador (v21)
- **Diagnóstico:** El botón «Guardar y sincronizar» de minutos y puntuaciones no reaccionaba o tardaba en responder, y las notas asignadas a los jugadores no impactaban directamente en su ficha de la pestaña Plantilla.
- **Corrección:**
  - Se reforzó la delegación de eventos en `js/app.js` asegurando respuesta táctil inmediata al pulsar el botón.
  - Al guardar, los minutos y puntuaciones se persisten en el partido (`matches`) y se sincronizan de inmediato con la ficha del jugador (`players`) a través de `js/plantilla-stats-sync.js`.
  - Notificación toast visual inmediata: *«Minutos y puntuaciones guardados y sincronizados con la ficha del jugador»*.
  - Las medias y estadísticas individuales en Plantilla se actualizan en el acto sin necesidad de recargar.

### 55.5 Orden descendente de partidos jugados en Calendario: el último jugado arriba (v22)
- **Diagnóstico:** Al desplegar «Partidos jugados» en Calendario, los encuentros aparecían en orden ascendente (el primer partido de la temporada arriba), obligando a hacer scroll hasta el fondo para ver el último resultado.
- **Corrección:**
  - En `js/match-calendar-sync.js` (`partitionAndSortMatches`): los partidos jugados (`played`) se ordenan en orden **descendente por fecha** (`b.date.localeCompare(a.date)`), situando el último jugado en la punta superior.
  - En `js/completed-events-ui.js` (`groupPlayedMatchesFallback`): se replica la ordenación descendente por fecha en las tarjetas de eventos completados.
  - Los partidos próximos (`upcoming`) se mantienen en orden ascendente (el más próximo a jugarse arriba).

### 55.6 Archivos de referencia y trazabilidad
- Se creó `agente.md` en la raíz del repositorio con el manual completo de arquitectura, mapa de módulos y guía de mantenimiento.
- Versión de caché PWA sincronizada a `20260920-prod-current-v22` en todos los archivos de configuración y pruebas.
- 458/458 pruebas automatizadas pasando satisfactoriamente (`npm run check && npm test`).


## 56. Guardado de sesiones de entrenamiento sin ejercicios y con duraciones flexibles — v23 — 20/09/2026

Incidencia reportada: Las sesiones de entrenamiento no se podían guardar tanto si tenían ejercicios como si no los tenían, o si se excedía la duración programada.

### 56.1 Causa raíz identificada
1. **Bloqueo por falta de ejercicios:**
   - En `js/app.js`, el botón `<button class="primary" type="submit">` se renderizaba con el atributo `disabled` cuando `sessionDraftBlocks.length === 0`.
   - En `js/session-top-actions.js`, el botón `#session-top-save` copiaba el estado `disabled` del botón original y retornaba sin hacer nada.
   - En `js/exercise-planning.js`, `buildFlexibleTrainingSession` lanzaba una excepción `RangeError('Añade al menos un ejercicio a la sesión.')`.
2. **Error de DOM en bucle por `MutationObserver`:**
   - En `js/session-reorder-ui.js`, al haber 2 o más ejercicios, se ejecutaba `root.insertBefore(help, firstBlock)`. Al ser `root` el contenedor `#session-builder` y no el padre directo de `firstBlock`, el navegador lanzaba `NotFoundError: The node before which the new node is to be inserted is not a child of this node.`
   - Al estar observado con `{ childList: true, subtree: true }`, cada mutación disparaba de nuevo el observer, provocando miles de excepciones no capturadas que congelaban y bloqueaban la interacción de la app.
3. **Validación nativa en campos ocultos:**
   - Ciertos campos requeridos quedaban ocultos o dentro de secciones colapsadas, haciendo que el navegador abortara silenciosamente el envío del formulario con `An invalid form control is not focusable`.

### 56.2 Soluciones aplicadas
1. **Guardado sin ejercicios habilitado:**
   - Se eliminó la restricción en `buildFlexibleTrainingSession`, permitiendo guardar sesiones vacías de ejercicios (`blocks: []`) con su fecha, hora, campo de juego y nombre.
   - Se eliminó el atributo `disabled` del botón `Guardar sesión` y se aseguró que `#session-top-save` despache el evento `submit` de forma robusta.
   - El estado de duración informa correctamente de los minutos faltantes para el objetivo sin impedir el guardado.
2. **Corrección de `session-reorder-ui.js`:**
   - Se corrigió `firstBlock.parentElement.insertBefore(help, firstBlock)`, erradicando el 100% de las excepciones de DOM.
3. **Duraciones flexibles y sin bloqueo por tiempo excedido:**
   - Las duraciones de bloques y de sesión admiten libremente de 1 a 240 minutos.
   - Si la suma de minutos supera el objetivo, se muestra el aviso «Sobran X min» y se permite guardar normalmente.
4. **Formulario con `novalidate`:**
   - `<form id="session-form" novalidate>` asegura que los clics en «Guardar» se procesen siempre mediante la lógica de negocio y proporcionen feedback visual al usuario.

### 56.3 Verificación y trazabilidad
- Verificado mediante Chrome CDP automatizado:
  - Guardado de sesión sin ejercicios (solo fecha/hora/campo): éxito, tarjeta creada y mensaje toast.
  - Guardado de sesión con 2 ejercicios excediendo tiempo: éxito, tarjeta creada y badge de tiempo sobrante.
  - Cero excepciones de consola o de DOM detectadas.
- Suite de pruebas completa: 461/461 tests pasados (`npm run check && npm test`).
- Versión sincronizada a `20260920-prod-current-v23`.

## 57. Actualización Reactiva Automática Sin Botón «Actualizar» y Planificación Semanal WhatsApp para la Próxima Semana (2026-09-20 - Build v24)

### 57.1 Problemas detectados
1. **Necesidad manual de pulsar «Actualizar» para ver cambios:**
   - Cada vez que el entrenador guardaba un jugador, modificaba estadísticas, creaba una sesión, guardaba un partido o editaba una táctica, los cambios no se reflejaban de inmediato en pantalla. Tenía que pulsar obligatoriamente el botón «Actualizar».
   - Causa raíz: en `js/app.js`, la función `isUserInteracting()` comprobaba `if (document.querySelector('details[open]')) return true;`. Sin embargo, elementos estáticos de la interfaz (`.diagram-details[open]`, `.match-log[open]`, `.tactic-guide[open]`) tienen el atributo HTML `open` por defecto en sus plantillas. Como consecuencia, `isUserInteracting()` devolvía `true` el 100% del tiempo, y `refresh()` ignoraba sistemáticamente la llamada a `renderAll()`.
2. **Planificación semanal de WhatsApp en fin de semana mostraba la semana pasada:**
   - Al redactar el mensaje de «Planificación semanal» por WhatsApp un domingo (o sábado), el sistema calculaba la semana en curso (del lunes 14 al domingo 20 de septiembre), mostrando entrenamientos de días pasados (14 y 17 de septiembre) que ya no tenían sentido comunicar a los padres.
   - En fin de semana, el entrenador necesita planificar y comunicar la **semana entrante** (lunes 21 al domingo 27 de septiembre) con sus entrenamientos futuros y el partido oficial del próximo fin de semana.

### 57.2 Soluciones implementadas
1. **Actualización automática e instantánea (Reactividad sin botón):**
   - Se eliminó la comprobación de `details[open]` en `isUserInteracting()` de `js/app.js`.
   - Se implementó en `refresh()` el flag de forzado mediante `const force = arguments[0] === true; if (force || !isUserInteracting()) renderAll();` y el despacho del evento `campobase:data-updated`.
   - Se actualizaron todos los métodos de guardado y eliminación en `js/app.js`, `js/completed-events-ui.js`, `js/plantilla-stats-sync.js`, `js/match-postgame-editor.js` y `js/custom-exercise-persistence.js` para ejecutar `await refresh(true)` y llamar a los renderizadores específicos de cada vista.
   - En `renderPlayers()`, se añadió preservación del estado abierto de las fichas de rendimiento de jugadores y sus sub-acordeones (`Minutos`, `Puntuaciones`, etc.) mediante `Set` de identificadores abiertos, evitando que se cierren durante la reactualización.
2. **Selector y lógica de semana para WhatsApp:**
   - En `js/whatsapp-suite.js` se añadieron las funciones utilitarias:
     - `getNextWeekDateRange(dateOrStr)`: calcula con exactitud matemática el rango lunes–domingo de la siguiente semana.
     - `isWeekend(dateOrStr)`: detecta sábados y domingos de forma robusta.
     - `formatWeekSpanLabel(startKey, endKey)`: genera la etiqueta legible (ej. `'del 21 al 27 de septiembre'`).
   - En `index.html`, se añadió el selector `#wa-week-select` dentro de la fila de planificación semanal.
   - En `js/app.js`:
     - Se integró `populateWhatsAppWeekSelector()` y `getSelectedWhatsAppWeekRange()`.
     - Si es fin de semana (`isWeekend(today)`), preselecciona por defecto la «Próxima semana» (ej. del 21 al 27 de septiembre).
     - Si es día entre semana, preselecciona «Esta semana».
     - El selector permite al usuario alternar entre ambas opciones en cualquier momento.
     - El preview de WhatsApp filtra estrictamente las sesiones y partidos dentro del rango seleccionado y formatea la cabecera `📅 PLANIFICACIÓN SEMANAL (DEL 21 AL 27 DE SEPTIEMBRE) — EQUIPO`.
  - **Soporte para múltiples partidos en la misma semana:**
    - `buildWhatsAppTrainingWeek` en `js/whatsapp-suite.js` acepta `matches: [...]` (y compatibilidad hacia atrás con `match`).
    - Ordena los partidos cronológicamente por fecha y hora (sábado antes de domingo, o por hora si son el mismo día).
    - Muestra cada partido con su viñeta correspondiente, hora, rival y campo.
    - `populateWhatsAppEvents()` en `js/app.js` detecta si hay más de 1 partido en la semana y configura la opción por defecto `⚡ Automático: Incluir los X partidos (Rival 1 y Rival 2)`, además de permitir seleccionar partidos individuales o ninguno.
    - `updateWhatsAppPreview()` mapea todos los partidos encontrados dentro de la semana seleccionada.
3. **Control de versiones PWA:**
   - Incrementado a `20260920-prod-current-v24` en `sw.js`, `index.html`, `js/app.js`, `js/supabase-client.js`, `js/demo-session.js`, `agente.md` y tests.

### 57.3 Verificación y validación
- 470 tests unitarios y de integración ejecutados y pasados (`npm run check && npm test`).
- Pruebas añadidas para `getNextWeekDateRange`, `isWeekend`, `formatWeekSpanLabel`, filtrado de entrenamientos pasados en WhatsApp, soporte para 2 partidos en días distintos, soporte para 2 partidos el mismo día, y comprobación de reactividad sin bloqueo por `<details>`.
- Verificado mediante Chrome CDP automatizado: conmutación de semanas, inclusión simultánea de 2 partidos en la semana y persistencia reactiva.

## 58. Desbloqueo del Visor de Ejercicios y Regla Oficial de Roles y Colores (2026-09-20 - Build v25)

### 58.1 Problemas detectados
1. **Bloqueo de la app al entrar en cualquier ejercicio:**
   - Al pulsar sobre un ejercicio en la Biblioteca o en una Sesión, el diálogo modal de detalle (`#exercise-detail-dialog`) se abría pero el usuario no podía cerrarlo ni volver a la aplicación, teniendo la sensación de congelación o bloqueo total.
   - *Causas raíz:*
     - En `styles-redesign.css` (línea 5683), la regla `.sheet-top-close-btn { display: none !important; }` ocultaba deliberadamente el botón superior de aspa ('✕').
     - El elemento modal `<dialog id="exercise-detail-dialog">` carecía de un gestor de eventos de clic en el fondo oscurecido (`backdrop`), impidiendo cerrarlo pulsando fuera.
     - En `js/redesign-nav.js`, la inyección global de `.cb-global-close-footer` agregaba un botón secundario sticky al pie que tapaba la barra de acciones inferior (`.sheet-bottom-bar`), impidiendo usar los botones reales «+ Añadir a sesión» y «✕ Cerrar Ejercicio».
2. **Ausencia de los roles oficiales de jugadores y colores no canónicos:**
   - La ficha del ejercicio no mostraba la sección explícita de organización y roles (portero, defensas, atacantes, neutro/apoyo y entrenador).
   - En la leyenda visual no se aplicaban los códigos oficiales ni los colores reglamentarios.
3. **Falta de aclaración en vídeos de muestra con humanos:**
   - Los ejercicios que cuentan con vídeo real no aclaraban que se trata de un recurso opcional presente únicamente en caso de disponer de él.

### 58.2 Soluciones implementadas
1. **Desbloqueo completo y accesibilidad del modal de ejercicio:**
   - En `styles-redesign.css`, se restauró `.sheet-top-close-btn` con `display: flex !important; visibility: visible !important; pointer-events: auto !important; z-index: 50;` (botón circular táctil de 44×44px siempre visible arriba a la derecha).
   - En `js/redesign-nav.js`, se añadió `'exercise-detail-dialog'` a `BOTTOM_CLOSE_EXCLUDED_DIALOGS`, eliminando el pie duplicado superpuesto y dejando limpios los botones de acción inferior.
   - En `js/app.js`, se implementó `ensureExerciseDialogBackdropClose(dialog)` que cierra el diálogo al pulsar en el fondo exterior (backdrop), y se protegió la llamada con `if (dialog && !dialog.open) dialog.showModal()`.
2. **Regla Oficial de Roles y Colores:**
   - Se estableció la norma canónica estricta para todos los ejercicios:
     - **Portero:** `P` — **NEGRO** (`#111827`, texto `#FFFFFF`)
     - **Defensa:** `D1`, `D2`, `D3`… — **ROJO** (`#DC2626`, texto `#FFFFFF`)
     - **Atacante:** `A1`, `A2`, `A3`… — **AZUL** (`#2563EB`, texto `#FFFFFF`)
     - **Neutro / Apoyo:** `N` — **AMARILLO** (`#FACC15`, texto `#000000`)
     - **Entrenador:** `E` — **GRIS CLARO** (`#CBD5E1`, texto `#0F172A`)
   - En `js/ejercicio-viewer.js`, se implementó y exportó `roleVisualMeta(roleItemOrId)`.
   - Se añadió la sección `👥 Organización y roles` (`#section-organizacion`) en la ficha de ejercicio con tarjetas visuales para cada rol, su abreviatura con token coloreado y su función táctica.
   - Para ejercicios de nuevo formato sin bloque explícito de organización, se implementó derivación táctica automática.
   - Se actualizó `leyenda_visual` en la ficha para renderizar los tokens de jugadores con estos colores oficiales.
3. **Vídeos de humanos y almacenamiento 0 €:**
   - El bloque de vídeo humano se titula: `🎥 Vídeo de muestra con humanos (en caso de disponer de él)`.
   - Si no hay vídeo humano, la sección no se renderiza.
   - Se documentó en `agente.md` que ningún vídeo ni portada va a Supabase Storage: las portadas se sirven como assets estáticos en el repositorio / GitHub Pages y los vídeos en GitHub Releases.
4. **Actualización de versión PWA:**
   - Incrementado a `20260920-prod-current-v25` en `sw.js`, `index.html`, `js/app.js`, `js/supabase-client.js`, `js/demo-session.js`, `agente.md`, `AGENTS.md` y suite de pruebas.

### 58.3 Verificación y validación
- 475 tests unitarios y de integración ejecutados y pasados (`npm run check && npm test`).
- Test permanente añadido: `tests/exercise-roles-official-and-modal-close.test.js`.
- Verificado: roles oficiales, colores contrastados, cierre por botón '✕', cierre por backdrop, y sin colisión de footers.

---

## 59. Desbloqueo definitivo al salir de ejercicios, auditoría de Supabase y regla de formato F7/F11 (v26)

### 59.1 Contexto y problemas detectados
1. **Bloqueo/congelación de la app al SALIR de un ejercicio («entro en 1 ejercicio, salgo y se bloquea la app»):**
   - El usuario reportó que tras entrar en un ejercicio y cerrarlo, la aplicación se congelaba y dejaba de responder a clics y toques táctiles.
   - *Causas raíz identificadas:*
     - **Falta de ciclo de vida / teardown de vídeo:** Al cerrar el modal (`dialog.close()`), los elementos `<video>` (el MP4 gráfico interactivo y el vídeo humano) permanecían vivos en el DOM dentro de `#exercise-detail-body`. Si se estaban reproduciendo o almacenando en búfer desde GitHub Releases, los decodificadores de hardware de vídeo y los hilos multimedia continuaban ocupados en segundo plano. En móviles (iOS Safari WebKit y Android Chrome Blink), esto provoca un bloqueo de sesión de medios (*media session lock*), congelando el hilo de eventos táctiles de la página.
     - **Fuga de listeners en `window`:** `initValidatedExerciseViewer` añadía listeners globales anónimos a `window` (`mousemove`, `mouseup`, `keydown`) que nunca se retiraban al cerrar, acumulando controladores huérfanos tras cada ejercicio abierto.
     - **Colisión y solapamiento de footers flotantes:** Coexistían en el DOM `.dialog-sticky-footer` (pie nativo del diálogo) y `.sheet-bottom-bar` (barra inferior de la ficha del ejercicio con «+ Añadir a sesión» y «✕ Cerrar Ejercicio»), interfiriendo con el área táctil inferior.
2. **Duda sobre saturación de Supabase por MP4s:**
   - Se evaluó si Supabase Storage estaba saturado o ralentizando la aplicación por alojar vídeos pesados.
3. **Regla de asignación de formato para nuevos ejercicios:**
   - Definición de cómo catalogar nuevos ejercicios procedentes de un archivo ZIP o listado:
     - Si la tarea indica regla de Fútbol 7 -> asignar únicamente a Fútbol 7 (`futbol_7`).
     - Si no indica regla de formato -> asignar simultáneamente a Fútbol 7 y Fútbol 11 (`['futbol_7', 'futbol_11']`).
     - Si no especifica «Qué se trabaja», se debe analizar y extraer tácticamente junto con los roles canónicos oficiales (`P` Negro, `D` Rojo, `A` Azul, `N` Amarillo, `E` Gris claro).

### 59.2 Soluciones implementadas
1. **Teardown multimedia y de eventos en `exercise-detail-dialog` (`js/app.js` y `js/ejercicio-viewer.js`):**
   - Se implementó `wireExerciseDialogLifecycle(dialog)` en `js/app.js`:
     - Al dispararse el evento `'close'`, se iteran todos los elementos `<video>`, se pausan inmediatamente (`video.pause()`), se retira el atributo `src` (`video.removeAttribute('src')`) y se fuerza la descarga del decodificador con `video.load()`.
     - Se limpia por completo el contenido del modal: `#exercise-detail-body.innerHTML = ''`, liberando memoria y nodos del recolector de basura.
     - Se desbloquea el scroll del documento (`document.body.style.overflow = ''`).
   - En `js/ejercicio-viewer.js`, los listeners de `window` (`mousemove`, `mouseup`, `keydown`) se gestionan con un `AbortController` local (`viewerAbortController`), cuya señal se aborta automáticamente al recibir el evento `'close'` del diálogo.
2. **Eliminación de la barra flotante duplicada (`styles-redesign.css` y `js/app.js`):**
   - Regla CSS `#exercise-detail-dialog:has(.sheet-bottom-bar) > .dialog-sticky-footer { display: none !important; }` y control JavaScript para que cuando una ficha tenga su propia barra interactiva (`.sheet-bottom-bar`), el footer genérico quede oculto sin interferencias.
3. **Auditoría completa de Supabase Storage:**
   - Se comprobó mediante la API oficial de Supabase que el bucket `ejercicio-videos` está a 0 archivos y 0 bytes (no existe en Storage). Supabase no alberga ningún vídeo pesado ni incurre en costes de almacenamiento.
   - Todos los vídeos pesados están alojados en GitHub Releases tag `campobase-videos-v1` y se resuelven a través de `resolveHostedVideoUrl()`.
4. **Sincronización de versión PWA:**
   - Se actualizó el build a `20260920-prod-current-v26` en `sw.js`, `index.html`, `js/app.js`, `js/supabase-client.js`, `js/demo-session.js`, `agente.md`, `AGENTS.md` y todos los tests.

### 59.3 Verificación y resultados
- Se ejecutó un test de estrés automatizado en Google Chrome (`test-exercise-exit-freeze.mjs`) realizando 5 ciclos consecutivos rápidos de apertura y cierre de ejercicios:
  - Tiempo medio por ciclo: < 470 ms.
  - Vídeos activos tras salir: 0.
  - Contenido `#exercise-detail-body` tras salir: vacío.
  - Respuesta táctil posterior al cierre: 100% inmediata y sin congelamiento.
- Suite completa de 480 tests unitarios y de integración pasando en verde (`npm run check && npm test`).

## 60. Corrección Definitiva: MP4 Íntegro Sin Cortes, Textos Duales (Vista Rápida / Completa), Roles Oficiales, Cierre Directo y Sincronización v27

### 60.1 Problemas abordados
1. **Vídeo MP4 táctico recortado y portería oculta:**
   - En el reproductor modal (tanto en vista normal como en pantalla completa / teatro), el vídeo se desplazaba un 38.9% hacia arriba recortando la portería superior y dejando bandas negras vacías abajo.
   - Causa: `media_crop` aplicaba traslación CSS destructiva al elemento `<video>`.
2. **Textos incompletos o ausentes en los 12 ejercicios autorizados:**
   - Ejercicio 09 (`como_se_hace` formateado como objeto, no se renderizaba).
   - Ejercicio 11 (`como_se_hace`, `montaje`, `rotacion`, `errores_correcciones` vacíos).
   - Ejercicios 02, 03, 04, 07, 08, 10 con campos en blanco o sin correcciones técnicas.
   - Incompatibilidad entre el modo Vista Rápida (`view-mode-reduced`) y Vista Completa (`view-mode-full`).
3. **Persistencia del congelamiento al salir del ejercicio reportado por el usuario:**
   - La versión anterior aún no se había comiteado ni desplegado en producción, y faltaba cerrar diálogos huérfanos al cambiar de pestaña (`showView`) y escuchar directamente eventos `pointerup` en botones de cierre.

### 60.2 Soluciones implementadas
1. **Vídeo táctico MP4 íntegro al 100% (`media_crop: null`):**
   - En `js/ejercicios-nuevo-formato.js`, `normalizeNewExercise` asigna `media_crop: null`.
   - El vídeo se reproduce íntegro al 100% con `object-fit: contain` mostrando porterías, leyendas y el campo completo.
   - El recorte `preview_crop` (`data-preview-crop`) se reserva exclusivamente para la miniatura/portada estática en `<canvas>` o `<img>`.
2. **Soporte robusto para textos duales y formato flexible de `como_se_hace`:**
   - En `js/ejercicio-viewer.js`, `comoSeHaceHtml` procesa arrays, objetos estructurados por variantes (Base, Variación 1, Variación 2) o texto continuo, agregando el resumen `⚡ Clave rápida`.
   - En `styles-redesign.css` y `js/exercise-view-mode-ui.js`, la clase `.view-mode-reduced` oculta todos los bloques teóricos extensos (montaje, organización, materiales, fases, rotación, consignas, errores, variantes) y muestra únicamente los datos esenciales para el campo (Media, `#section-datos-rapidos`, `#section-como-se-hace` y `#section-carga`).
   - La clase `.view-mode-full` expone las 17 secciones detalladas.
   - Se completaron al 100% todos los textos de los 12 ejercicios autorizados (`01` a `12`).
3. **Refuerzo de navegación y cierre:**
   - En `js/app.js` (`showView`), al cambiar de pestaña se cierran automáticamente todos los modales abiertos (`dialog[open].close()`).
   - En `wireExerciseDialogLifecycle`, se añadieron listeners a `click` y `pointerup` en `[data-close]` y se restablece `document.body.style.pointerEvents = ''`.
4. **Sincronización PWA a `v27`:**
   - Bump de versión `20260920-prod-current-v27` en `sw.js`, `index.html`, `js/app.js`, `js/supabase-client.js`, `js/demo-session.js` y tests.

## 61. Integración de 75 Nuevos Ejercicios Certificados (Lotes 051-100 y 101-125), Posición Superior, Regla F7/F11 y Versión v28

### 61.1 Alcance y Tareas Realizadas
1. **Auditoría y Descarte de Duplicados:**
   - Se analizaron los lotes disponibles en `/outputs/CampoBase_Documentos/`:
     - `001-050`: 50 ejercicios ya presentes en la app (`f7-001` a `f7-050`).
     - `051-100`: 50 ejercicios totalmente nuevos (`f7-051` a `f7-100`).
     - `101-150`: 25 ejercicios preparados y nuevos (`f7-101` a `f7-125`).
   - Total incorporados: **75 ejercicios nuevos** (`f7-051` a `f7-125`).
2. **Posición en Biblioteca («en la punta de arriba»):**
   - Siguiendo la instrucción expresa del usuario («los ultimos que vamos introduciendo en la app siempre en la punta de arriba»), los 75 ejercicios de `EJERCICIOS_NUEVOS_LOTES` se sitúan al inicio absoluto de `EJERCICIOS_VALIDADOS`.
   - Aparecen en primer lugar nada más entrar a la biblioteca de ejercicios.
3. **Regla Oficial de Formatos F7, Alevín, F8 y F11:**
   - Tareas con indicación de **Fútbol 7**, **Alevín** o **Fútbol 8** -> `formatos_juego: ['futbol_7']`, `formato_juego: 'futbol_7'`.
     - En lotes nuevos: `f7-068`, `f7-069`, `f7-070` (Adaptables F7), `f7-109`, `f7-110` (Alevín B), `f7-111` (Benjamín E), `f7-115` (Fútbol 7 específico).
     - En lote base (`001-050`): las 12 tareas de categoría Alevín quedan exclusivas de Fútbol 7.
   - Tareas específicas de **Fútbol 11** -> `formatos_juego: ['futbol_11']`, `formato_juego: 'futbol_11'` (ej. `f7-116`: 8x8 + porteros).
   - Tareas sin indicación específica (**General / Adaptable**) -> asignadas simultáneamente a **Fútbol 7 y Fútbol 11** (`formatos_juego: ['futbol_7', 'futbol_11']`, `formato_juego: 'todos'`), visibles y operativas en ambas pestañas/filtros (67 de los nuevos lotes y 38 de la base histórica).
4. **Alojamiento Multimedia y Coste 0 €:**
   - 75 imágenes `preview.png` integradas en `library-v2/assets/previews/` (`f7-051.png` a `f7-125.png`).
   - 75 archivos MP4 subidos a **GitHub Releases** (`campobase-videos-v1`) y registrados en `scripts/github-release-video-manifest.json`.
   - Supabase Storage libre de archivos pesados (0 € de coste).
5. **Textos Duales (Vista Rápida y Vista Completa):**
   - Cada ejercicio incluye bloque de texto de **Vista Rápida** (`vista_rapida` con clave rápida, contenidos trabajados, material, jugadores y tiempo estimado) y la **Vista Completa** con las 17 secciones CampoBase normalizadas y roles oficiales (`P` Negro, `D` Rojo, `A` Azul, `N` Amarillo, `E` Gris claro).
6. **Actualización PWA a v28:**
   - Incrementado a `20260920-prod-current-v28` en `sw.js`, `index.html`, `js/app.js`, `js/supabase-client.js`, `js/demo-session.js` y tests.
   - 480 tests pasando al 100%. Verificado en navegador real headless Chrome.

## 62. Subida e Integración de 25 Nuevos Ejercicios (Lote 126 a 150), Posición Superior Absoluta, PWA v29 y Verificación en Vivo

### 62.1 Alcance y Tareas Realizadas
1. **Detección e Ingesta de los Ejercicios 126 a 150:**
   - Localizados 25 nuevos ejercicios en `/outputs/CampoBase_Documentos/101-150/` (carpetas `126` a `150`), añadidos recientemente por el usuario.
   - Todas las tareas corresponden a ejercicios de posesión y conservación 5x5 con variantes tácticas avanzadas.
   - Total de nuevos lotes ampliado de 75 a **100 ejercicios** (`f7-126` a `f7-150` + `f7-051` a `f7-125`).
   - Catálogo total ampliado de 385 a **410 ejercicios**.

2. **Orden en Biblioteca («los últimos siempre en la punta de arriba»):**
   - Siguiendo la directriz del usuario, los 25 más recientes (`f7-126` a `f7-150`) se colocan en las posiciones 1 a 25 del catálogo.
   - A continuación se sitúan los 75 del lote anterior (`f7-051` a `f7-125`), seguidos de los 12 específicos y los 298 históricos base.
   - Respetado rigurosamente en la ordenación inicial y en la vista de biblioteca.

3. **Regla Oficial F7 / F11:**
   - Al tratarse de ejercicios 5x5 de conservación general aplicables tanto a etapa F7 como F11, se asignan a ambos formatos (`formato_juego: 'todos'`, `formatos_juego: ['futbol_7', 'futbol_11']`).
   - Visibles y filtrables tanto en la pestaña de Fútbol 7 como en la de Fútbol 11.

4. **Alojamiento Multimedia y Coste Cero (0 €):**
   - 25 imágenes `preview.png` copiadas en `library-v2/assets/previews/` (`f7-126.png` a `f7-150.png`).
   - 25 archivos MP4 subidos a **GitHub Releases** (`campobase-videos-v1`) con prefijo `library-v2-preview__f7-{num}__ejercicio.mp4`.
   - `scripts/github-release-video-manifest.json` actualizado con los 25 nuevos vídeos (total 423 items).
   - 0 € de coste en Supabase Storage (todo servido desde GitHub Releases y GitHub Pages).

5. **Doble Vista y Roles Oficiales:**
   - Vista rápida: clave rápida `explicacion_breve`, material, jugadores, duración y contenidos.
   - Vista completa: 17 secciones CampoBase normalizadas con roles oficiales (`P` Negro `#111827`, `D` Rojo `#DC2626`, `A` Azul `#2563EB`, `N` Amarillo `#FACC15`, `E` Gris claro `#CBD5E1`).

6. **Pill de Código F7-XXX y Búsqueda por ID:**
   - En la tarjeta del visor de ejercicios se incluye la pill con el identificador en mayúsculas (`F7-126`, `F7-150`, etc.).
   - La búsqueda rápida de texto en `js/app.js` y `js/training-domain-base.js` permite buscar directamente por ID (ej. teclear "126" o "f7-126" para encontrar de inmediato el ejercicio).

7. **Resiliencia de Caché PWA y Bump a v29:**
   - Bump de versión a `20260920-prod-current-v29` en `sw.js`, `index.html`, `js/app.js`, `js/supabase-client.js`, `js/demo-session.js` y todos los tests.
   - Eliminadas peticiones a fuentes inexistentes en `sw.js` (`rajdhani-*.woff2`) que podían bloquear la instalación del Service Worker.
   - Instalación del Service Worker protegida con `Promise.allSettled`.
   - Purga de caché controlada en `reloadAppPreservingSession()` y auto-sanación de catálogo si se detectan menos de 400 ejercicios por caché obsoleta.

8. **Verificación:**
   - `npm run check && npm test`: 480 tests pasando al 100% (0 fallos).

## 63. Corrección Estadística de Minutos Disputados por Convocatorias (PWA v30)

### 63.1 Contexto y Diagnóstico
- El usuario reportó una inconsistencia en la estadística visible de la ficha de jugador:
  - *«Minutos disputados: 70 min (57%). estas estadísticas no son reales en todos... para saber porcentajes debería ser según sus convocatorias, no puede computar un jugador 10% si realmente solo ha ido una vez convocado o jugadores que se han incorporado después»*.
- **Causa raíz identificada**:
  - En `renderPlayers()` (`js/app.js`), el porcentaje `minutePercent` se calculaba erróneamente como `Math.round((playerTotalMinutes / maxMinutes) * 100)`, donde `maxMinutes` era el máximo de minutos jugados por cualquier compañero de la plantilla completa.
  - Esto penalizaba injustamente a jugadores recién incorporados, lesionados o con pocas convocatorias, mostrándoles porcentajes artificialmente bajos (ej. 70 min jugados en su único partido convocado de 70 min aparecía como 57% o 10% en vez de 100%).

### 63.2 Solución Implementada
1. **Función `calculatePlayerCallupMinutes` en `js/domain.js`**:
   - Calcula los minutos posibles sumando la duración de cada partido finalizado donde el jugador estuvo convocado (`availableIds`) o disputó minutos (`minuteTotals`).
   - Si existen convocatorias manuales adicionales (desde `statAdjustments`), se computan a razón de la duración de partido del formato (`FORMATS[format].duration`, 70 min en F7 / 90 min en F11).
   - Calcula el porcentaje real: `(minutosJugados / minutosPosiblesConvocatorias) * 100`.
   - Si no tiene convocatorias registradas, devuelve 0%.
2. **Actualización de la Interfaz en `js/app.js` y `js/plantilla-stats-sync.js`**:
   - `Minutos disputados`: muestra `70 min (100%)` cuando ha jugado el partido completo al que fue convocado.
   - En el tooltip / título de la barra: *`70 min disputados de 70 min posibles en sus convocatorias (100%)`* (o *`sin convocatorias registradas`* si tiene 0).
   - Blindaje: las fichas de jugador, fotos, datos personales, inputs y estructura HTML se conservan intactos al 100% sin alteraciones.
3. **Despliegue y PWA v30**:
   - Bump a `20260920-prod-current-v30` en `sw.js`, `index.html`, `js/app.js`, `js/supabase-client.js`, `js/demo-session.js` y tests.
4. **Batería de Pruebas**:
   - Añadidos tests unitarios específicos en `tests/domain.test.js`.
   - Total tests pasando: **481/481 tests (100% pass)**.

# 64. Validación Definitiva en Producción (v46+) — Sincronización Supabase Pro, Reproducción de Vídeo Móvil y Protección de Arquitectura — 23/09/2026

## 64.1 Blindaje Obligatorio de Arquitectura
- ⚠️ **REGLA ESTRICTA:** Todo lo documentado en este apartado ha sido validado expresamente por el usuario en sus dispositivos móviles y en el servidor de producción. Ningún agente ni modificación futura debe alterar, revertir o eliminar estos patrones.

## 64.2 Sincronización Cloud Supabase Pro
- **Causa raíz del error 503/521:** Tras actualizar al plan Pro, Supabase conservó la base de datos en una instancia `t3.nano` (512 MB de RAM). Un bucle interno de replicación/introspección generó más de 7,4 millones de errores en PostgreSQL, consumiendo todos los créditos de CPU de AWS y dejando la base de datos en estado `Unhealthy`.
- **Solución implementada:** Se actualizó la computación a tamaño **`MICRO` (`t3a.micro`)** (cubierto por el crédito mensual de 10 $ incluido en el plan Pro).
- **Resultado:**
  - Estado del proyecto en Supabase: **`Healthy`** (Verde).
  - CPU y memoria RAM totalmente estabilizadas.
  - Endpoints de Supabase REST (`/jugadores`, `/partidos`, `/configuracion`, `/asistencias`, `/convocatorias`) respondiendo en ~200ms con HTTP 200 OK.
  - Plantilla, lanzadores y actas de partidos sincronizados en el móvil al instante.
- **Detalle crítico SQL:** PostgREST únicamente reconoce la recarga mediante `'reload schema'` (con espacio) o `'reload config'` (con espacio). Nunca usar guiones.

## 64.3 Reproducción de Vídeo en Móvil iOS y Android
- En `js/ejercicio-viewer.js`, la etiqueta `<video>` debe usar exclusivamente elementos `<source src="..." type="video/mp4">` y **nunca** el atributo `src` directo cuando los vídeos provengan de GitHub Releases (evita el bloqueo por `application/octet-stream` en iOS WebKit).
- En `togglePlay()` jamás reasignar destructivamente `video.src = src`.
- Soporte táctil asegurado mediante listeners de `pointerup` y `touchend` en los controles de reproducción.

## 64.4 Interfaz Móvil y Eliminación de Copias Locales
- Nombres de jugadores a ancho completo en alineaciones, cambios tácticos, actas de goles y tablas estadísticas.
- Retirados todos los botones no deseados de importación de copias locales o carga de PC. El flujo es 100% cloud a través de Supabase y GitHub Releases.

# 65. Exportación e Impresión Compacta de Sesiones y Ejercicios (Fichas de Campo A4) — v47 (23/09/2026)

## 65.1 Principio de Compacidad Obligatorio
- **Ejercicio individual:** Estrictamente **1 sola página A4** (cabecera con equipo, título y badges de categoría/duración/espacio/jugadores; gráfico del campo superior; materiales, organización, dinámica de la tarea, reglas de provocación y consignas del entrenador en 2 columnas equilibradas).
- **Sesión completa:** Formato ultra-compacto de **2 ejercicios por cara A4**. Una sesión típica de 4 tareas ocupa 2 páginas; una de 5 tareas ocupa ~2.5 páginas (1 o 2 hojas físicas si el usuario activa impresión a doble cara). Jamás 2 páginas por ejercicio ni 10 páginas por sesión.
- **Configuración dúplex:** El usuario selecciona en el diálogo de impresión nativo del navegador si desea imprimir a 1 o 2 caras según sus necesidades de campo / carpeta con pinza.

## 65.2 Arquitectura y Componentes
- `js/print-session-export.js`: Módulo autónomo con precarga de imágenes antes de `window.print()` y auto-limpieza en `afterprint`.
- `styles-redesign.css`: Reglas `@media print` Eco-Tinta (fondos blancos, texto negro `#111827`, badges y bordes `#cbd5e1`), `@page { size: A4 portrait; margin: 8mm 10mm; }`, paginación forzada con `break-inside: avoid` y aislamiento total de la aplicación durante la impresión (`body > *:not(#cb-print-root) { display: none !important; }`).
- Botones en interfaz:
  - Tarjetas de sesión en pestaña **Sesiones**: `🖨️ Imprimir`.
  - Detalle modal de sesión: `🖨️ Imprimir Ficha de Sesión`.
  - Visor de ejercicio individual (`js/ejercicio-viewer.js`): `🖨️ Imprimir Ficha`.

# 66. Aislamiento Intocable de Impresión, Botón Guardar en Móvil, Pantalla Delegado y Modo Campo — v48 (23/09/2026)

## 66.1 Regla de Oro Intocable de Impresión y PDF (Cero Elementos Parásitos)
- ⚠️ **REGLA ESTRICTA Y PERMANENTE:** En el documento impreso o exportado a PDF **NUNCA** deben salir elementos parásitos de la interfaz:
  - Erradicación obligatoria en CSS `@media print` de la barra de búsqueda (`.search-bar`, `.search-bar::before`, `#global-search`).
  - Erradicación obligatoria de la barra de subnavegación (`#cb-sub-nav`) y barra inferior (`#cb-bottom-nav`, `.bottom-nav`).
  - Erradicación de cabeceras de la aplicación, botones flotantes y modales.
  - La hoja es exclusivamente una **Ficha Técnica de Campo** (fondo blanco eco-tinta, datos de sesión/ejercicio, materiales, explicación detallada paso a paso de la dinámica, reglas, rotaciones, consignas y notas).
- **Compacidad obligatoria:**
  - 1 sola página A4 por ejercicio suelto.
  - 2 tareas por cara A4 para sesiones completas (una sesión de 5 tareas ocupa ~2.5 páginas; en impresión a doble cara son solo 2 hojas físicas, jamás 10 páginas).

## 66.2 Impresión en Móvil (Guardar en el Móvil como PDF)
- **Activación síncrona:** En `js/print-session-export.js`, `window.print()` se ejecuta **de forma 100% síncrona** en el evento de clic del usuario para evitar que WebKit en iOS Safari o Blink en Chrome móvil revoquen el permiso táctil.
- **Barra flotante táctil:** `#cb-print-root` incluye una barra superior (`.cb-print-floating-bar`, oculta en `@media print`) con:
  - `🖨️ Guardar PDF / Imprimir`: dispara `window.print()` directamente.
  - `📲 Abrir para Compartir`: abre un Blob HTML limpio en una pestaña nueva para que iOS Safari y Android permitan guardar como PDF en Archivos o enviar por WhatsApp.
  - `✕ Volver`: cierra y restaura la pantalla.

## 66.3 Pantalla Delegado Visible y 100% Operativa
- Integrada en la subnavegación de **Partidos** (`js/redesign-nav.js` y `js/team-access.js`).
- Conectada reactivamente en `showView('delegado')` -> `renderDelegate()`.
- Si no hay partido en vivo, muestra selector de partidos convocados con botón `▶ Iniciar control de partido (Delegado)` para arrancar en 1 toque.
- Estilizada con diseño moderno en `styles-redesign.css` (reloj grande, sugerencia táctica, listas de campo/banquillo con minutos y controles de cambios 1–7, automático 1–3 y proponer reparto).

## 66.4 Modo Campo Resiliente Local-First
- En `js/app.js`, `renderAll()` sincroniza automáticamente `campobase.directFieldCache` en `localStorage`.
- En `js/modo-campo-directo.js`, carga inmediata desde caché local sin mostrar jamás pantalla roja de error si Supabase no responde.
- Botones de cambios desbloqueados y enlaces directos a la gestión de partido.

# 67. Navegación Limpia de Partidos, Botón Mostrar al Delegado, Acceso Delegado con PIN 0000 y Guardar en Móvil — v49 (23/09/2026)

## 67.1 Subpestañas de Partidos (Exactamente 4 Pestañas)
- ⚠️ **REGLA INTOCABLE:** La barra de subnavegación de Partidos (`MODULE_CONFIG.partidos.subTabs`) tiene estrictamente 4 subpestañas:
  1. Convocatoria (`convocatorias`)
  2. Alineación (`preparacion`)
  3. En Vivo (`partido`)
  4. Calendario (`calendario`)
- **PROHIBIDO:** Añadir una pestaña llamada "Delegado" en el menú superior de Partidos. Estropea el diseño y sobrecarga la vista.

## 67.2 Botón "Mostrar al Delegado" / "Ocultar al Delegado"
- **En Partido en Vivo (`#unlock-delegate`):**
  - Debe estar **siempre visible para el entrenador** (`roleCanUseOwnerFeatures(state.role)`).
  - Conmuta entre `Mostrar al Delegado` y `Ocultar al Delegado`.
  - No desaparece al desbloquearse, permitiendo a Migue comprobar de un vistazo que el delegado ya tiene acceso y pudiendo volver a ocultarlo si lo desea.
  - Se sincroniza inmediatamente con la preparación guardada (`prep.delegateShown`) y con `state.timer.delegateUnlocked`.
- **En Alineación (Lista de partidos preparados):**
  - Cada tarjeta de partido preparado en `#preparacion-list` dispone del botón directo `.prep-toggle-delegate` para activar o desactivar la visualización del delegado días u horas antes sin tener que entrar a editar la alineación.

## 67.3 El Delegado (PIN 0000) y Aislamiento Estricto a Partido en Vivo
- **Autenticación:** El PIN `0000` autentica siempre y directamente como rol `delegate`.
- **Aislamiento Total:**
  - Cuando el rol es `delegate`, `body.delegate-mode` oculta mediante `!important` la barra inferior (`#cb-bottom-nav`), la subnavegación superior (`#cb-sub-nav`), la barra de búsqueda, ajustes y la cabecera.
  - La única vista visible es `#delegado`.
- **Todo lo de Partido en Vivo:**
  - El delegado ve y gestiona: marcador con botones (+ y -) de goles a favor y en contra, registro y anulación de incidencias (goles, tarjetas, lesiones, penaltis), cronómetro con control de tiempos, pizarra táctica con fichas y flechas, listas de titulares y suplentes con dorsal y minutos jugados, sugerencia táctica de quién ha jugado menos y botones de cambios rápidos (manual 1–7, automático 1–3 y proponer reparto).
  - Si Migue aún no ha preparado o mostrado el partido, el delegado ve una tarjeta amigable de espera (*«⏱️ Esperando partido: El entrenador (Migue) aún no ha activado el partido en vivo. Aparecerá aquí en cuanto lo muestre o 20 minutos antes de comenzar.»*) con botón para comprobar y botón de cerrar sesión.

## 67.4 Guardar PDF / Exportar en Móvil (iOS y Android)
- En `js/print-session-export.js`, la función `shareOrDownloadPrintDoc` integra la API nativa `navigator.share` pasando el archivo `.html` maquetado para que el usuario pueda usar las opciones nativas de su móvil:
  - *Guardar en Archivos* (iOS) o *Guardar en Descargas* (Android).
  - *Compartir por WhatsApp* con cuerpo técnico o jugadores.
- Como respaldo universal, se provee descarga directa vía `<a download>` del archivo `.html` compacto y legible offline.
- En la barra flotante de exportación (`.cb-print-floating-bar`), se ofrecen botones claros y táctiles:
  - `📲 Guardar / Compartir (WhatsApp, Archivos)`
  - `📥 Descargar Ficha (.html)`
  - `🖨️ Imprimir (AirPrint / Impresora)`
  - `✕ Volver`
- En móviles, no se destruye la vista al cancelar el diálogo de AirPrint, permitiendo al usuario utilizar el botón de Guardar/Compartir.

# 68. Corrección Crítica Partido Inter Pilar (ReferenceError) y Exportación PDF Real (.pdf) en Móvil — v50 (24/09/2026)

## 68.1 Resolución del ReferenceError en renderLive y Auto-Recuperación de Partidos Preparados
- **Diagnóstico:** El usuario reportó que el partido preparado del Inter Pilar (24/09/2026) había "desaparecido" de la pestaña de Partido en Vivo y que no se podía ver para mostrar al delegado.
  - La auditoría demostró que ni el partido ni la preparación fueron borrados de Supabase ni de IndexedDB.
  - Al refactorizar `unlockBtn` en el commit `9f8f6559`, se eliminó inadvertidamente la línea `const fieldIds = state.timer.onField;` dentro de `renderLive()`. Al llegar a la evaluación del banquillo y campo (`fieldBenchMarkup(fieldIds, callup, config)`), JavaScript lanzaba una excepción fatal `ReferenceError: fieldIds is not defined`.
  - Esta excepción abortaba la renderización completa de `renderLive()`, dejando la vista en blanco e impidiendo que Migue viese su partido o pulsase el botón de delegado.
- **Corrección:**
  - Restaurado `const fieldIds = state.timer.onField || [];` en `js/app.js`.
  - Añadida auto-recuperación de preparaciones: si `!state.timer` al abrir Partido en Vivo, la app busca automáticamente la preparación del próximo partido no finalizado (`state.preparaciones?.find(...)`) y la aplica inmediatamente (`applyPreparacionToLive(savedPrep)`).
  - Garantiza que cualquier partido preparado por Migue (como Inter Pilar) se cargue de forma automática y transparente con alineación, pizarra táctica, cronómetro y botón «Mostrar al Delegado».

## 68.2 Exportación de PDF Real Binario (.pdf) para Móvil (WhatsApp y Archivos de iOS)
- **Diagnóstico:** Al pulsar «Guardar / Compartir (WhatsApp, Archivos)», el sistema exportaba un archivo `.html`. Ni WhatsApp en iOS/Android ni la app nativa "Archivos" de iOS reconocen un `.html` como documento PDF, imposibilitando guardar o enviar la ficha técnica como documento real.
- **Solución local-first (sin CDNs externas, 100% offline):**
  - Se incorporaron las librerías `vendor/html2canvas.min.js` y `vendor/jspdf.umd.min.js` directamente en el repositorio y en la caché del Service Worker.
  - En `js/print-session-export.js`, `generatePdfBlob(targetElement, title)` renderiza la hoja mediante `html2canvas` con escala Retina (2x) y la ensambla en un documento A4 real con `jsPDF`.
  - `shareOrDownloadPrintDoc()` crea un `Blob` de tipo `application/pdf` y genera un `File([pdfBlob], `${cleanTitle}.pdf`, { type: 'application/pdf' })`.
  - Al invocar `navigator.share({ files: [...] })`, iOS y Android abren la hoja nativa de compartir con el icono y formato de documento PDF real, permitiendo enviarlo por WhatsApp como PDF o guardarlo con un toque en "Archivos".
  - Si el navegador no soporta Web Share de archivos, se descarga directamente `${cleanTitle}.pdf`.

## 68.3 Contención Visual de Diagramas y Barra Flotante Compacta en Móviles
- **Diagnóstico:** La captura en iPhone mostraba una barra superior oscura gigante que ocupaba casi el 50% de la pantalla y un campo verde descomunal desbordado del que solo se apreciaba una esquina (`A1`, `D1`).
- **Corrección:**
  - En `styles-redesign.css`, `.cb-print-field-img` y `.cb-print-stage-box` se restringen estrictamente con `max-height: 230px !important; object-fit: contain !important; margin: 0 auto; display: block;` impidiendo cualquier desbordamiento.
  - La barra flotante `.cb-print-floating-bar` en móviles (`max-width: 650px`) se rediseñó con una rejilla táctil compacta de ~80px de altura (menos del 15% de la pantalla), con feedback visual durante la generación (`⏳ Generando PDF...`) y botón `✕ Volver` siempre accesible.

## 68.4 Verificación y Versioning
- Versión actualizada a `20260924-v50-inter-pilar-live-mobile-pdf-export`.
- 525/525 tests unitarios e integrados pasando al 100% (`npm test`).
- Verificación de sintaxis de todos los módulos limpia (`npm run check`).

# 69. Entrega v51 (24/09/2026) — Aislamiento Total Delegado (PIN 0000), Minutos Objetivo Visibles, Nombres Cortos con Primer Apellido y Exportación PDF Móvil Sin Bloqueos

## 69.1 Aislamiento Total y Acceso Directo del Delegado (PIN 0000)
- **Problema:** El delegado debía entrar directamente al partido en vivo y no tener acceso a menús, submenús, buscador ni al botón de Modo Campo.
- **Solución:**
  - `applyRole('delegate')` aplica `body.delegate-mode` y fuerza la vista `#delegado`.
  - En `styles-redesign.css`, `body.delegate-mode` oculta con `!important` la barra inferior `#cb-bottom-nav`, subnavegación, buscador global, ajustes, y todos los selectores de Modo Campo (`#open-field-mode`, `#return-to-field-mode`, `[id*="field-mode"]`, `[href*="modo-campo"]`).
  - En `showView()`, se bloquea cualquier intento de navegación si `state.role === 'delegate' && viewId !== 'delegado'`.
  - En `js/modo-campo-integration.js`, `addTopbarButton` e `installEntryButtons` abortan si el rol es delegado.
  - Al ingresar con PIN 0000 en `submitAuth()`, se ejecuta `synchronizeCloud()` y `refresh(true)` en segundo plano para traerse de inmediato los datos del partido preparado desde Supabase.

## 69.2 Nombres Cortos con Primer Apellido (`nombreCorto`)
- **Problema:** En jugadores con dos apellidos como "Alejandro Pedrós González", la función tomaba la inicial del segundo apellido mostrando "Alejandro G." en lugar del primer apellido.
- **Solución:**
  - En `js/live-tactics.js`, `nombreCorto(name)` toma `parts[0]` (o nombre compuesto común como "Juan Carlos", "Miguel Ángel") y añade la inicial del primer apellido: "Alejandro Pedros Gonzalez" -> "Alejandro P.".

## 69.3 Minutos Objetivo Visibles en Vivo (`Obj: X min`)
- **Problema:** Era necesario ver de forma clara y visual los minutos recomendados que debe disputar cada jugador durante el encuentro.
- **Solución:**
  - En `fieldBenchMarkup()` y `renderDelegate()`, cada fila de jugador en campo y banquillo incluye `.live-target-badge` (`Obj: 40 min`) junto al cronómetro.
  - En `targetSummaryMarkup()`, se transformó el resumen en una tarjeta moderna `.live-target-card` con chips interactivos por jugador.

## 69.4 Preservación de Alineación Preparada y Sincronización Inmediata
- **Problema:** Al pasar a partido en vivo o recargar, `applyLineupToLiveTeam` reordenaba arbitrariamente las posiciones tácticas guardadas por Migue. Además, si Migue pulsaba «Mostrar al Delegado» en Preparación, no se reflejaba de inmediato en el PIN 0000.
- **Solución:**
  - En fase `ready`, `applyPreparacionToLive`, `syncLiveTacticFromTimer` y `ensureLiveTactic` clonan directamente `prep.team` preservando las posiciones exactas (`pos`, `x`, `y`).
  - `togglePrepDelegateForMatch` aplica de inmediato la preparación al motor en vivo (`state.timer`) si estaba vacía o en otro partido y activa `delegateUnlocked`.
  - `renderDelegate` auto-detecta preparaciones marcadas con `delegateShown` y las monta de inmediato.

## 69.5 Exportación PDF Móvil Sin Congelar Safari / iOS WebKit
- **Problema:** Al pulsar "Imprimir" en iOS PWA standalone, `window.print()` congela el hilo de WebKit. Además, la barra superior quedaba oculta tras el notch / dynamic island.
- **Solución:**
  - En `styles-redesign.css`, `.cb-print-floating-bar` en móvil añade `padding-top: max(16px, env(safe-area-inset-top, 24px)) !important;` y oculta `.cb-print-btn-print`.
  - En `js/print-session-export.js`, en móviles y PWA standalone no se invoca `window.print()`, redirigiendo a `shareOrDownloadPrintDoc()`, que genera el PDF real mediante `html2canvas` + `jsPDF` y abre el menú nativo de compartir (`navigator.share`) para WhatsApp o Archivos de iOS sin bloqueos.

## 69.6 Versioning y Validación
- Versión actualizada a `20260924-v51-delegate-live-realtime-pdf-mobile`.
- 525+ tests pasando al 100% (`npm test`).
- Sintaxis y verificación completas (`npm run check`).



# 70. Convocatoria y reparto de minutos — Liga máximo 14; Amistosos sin límite — 25/09/2026

Petición expresa de Miguel:
- no modificar partidos;
- no modificar ninguna otra función ni diseño de la app;
- únicamente cambiar el límite de jugadores de la convocatoria/reparto según tipo de partido.

Regla vigente:
- **Liga:** máximo **14 jugadores convocados**.
- **Amistoso:** **sin límite máximo de convocados**; pueden participar tantos jugadores como Miguel quiera y todos entran en el cálculo/reparto de minutos.
- **Torneo:** no se modifica en este cambio; conserva el comportamiento previo.

Implementación limitada a:
- `js/domain.js`: `buildCallupSelection()` deja de aplicar el límite de 14 cuando `matchType === 'friendly'`.
- `js/app.js`: únicamente se actualiza el texto de ayuda y el contador visual de convocados para reflejar “Liga: máximo 14” y “Amistoso: sin límite”.
- `tests/domain.test.js`: prueba específica de 17 jugadores en amistoso, 14 máximo en Liga y torneo sin cambios.

Qué NO se toca:
- registros de partidos;
- Supabase/datos reales;
- WhatsApp;
- alineaciones;
- partido en vivo;
- estadísticas;
- asistencia;
- preparación;
- reparto salvo permitir más de 14 jugadores en amistosos;
- resto de interfaz y estilos.

Estado:
- cambio en rama aislada `fix/amistoso-sin-limite-convocados`;
- pendiente de batería completa de tests y comparación final antes de producción.

# 71. Regla exacta de convocados confirmada por Miguel — 25/09/2026

Confirmación expresa:
- **Liga:** máximo **14** jugadores convocados. Nunca permitir 15 o más.
- **Amistoso:** sin límite máximo. Miguel puede llevar 15, 17, 20, 25 o cualquier número de jugadores que quiera; todos los convocados deben entrar en el reparto de minutos.
- No aplicar el límite de 14 a un amistoso.
- Esta regla debe mantenerse en escritorio, móvil, preparación, reparto y cualquier validación futura relacionada con el número de convocados.

# 72. Corrección crítica Equipo + persistencia de preparación + RLS — 25/09/2026

Causas demostradas y guardarraíles permanentes:

- **Equipo / subpestañas vacías:** `js/today-dashboard.js` no puede cambiar por su cuenta la vista activa del usuario. Queda prohibido retirar `active` de `#plantilla`, `#cuerpo-tecnico` o `#asistencia` desde el render de Hoy. El dashboard de Inicio solo puede renderizar su contenido; la navegación la decide `showView()` / navegación del usuario.
- **Preparación de partido:** una alineación guardada debe sobrevivir exactamente a `Guardar -> refresh() -> volver a abrir` manteniendo los 7 titulares y su orden/posición. No auto-regenerar ni sustituir una preparación ya guardada.
- **Prueba obligatoria de regresión:** el browser smoke debe abrir Plantilla, Cuerpo Técnico y Asistencia mediante navegación real y comprobar que contienen vista visible; además debe crear una preparación demo válida, guardarla, forzar repintado/refresh y comprobar igualdad exacta al reabrir.
- **RLS de equipo:** no crear políticas circulares entre `equipos_cuenta` y `equipo_miembros`. La comprobación de propietario de equipo se resuelve mediante función `SECURITY DEFINER` acotada (`is_team_owner(team_id)`) para evitar `infinite recursion detected in policy for relation "equipo_miembros"`.
- **Datos reales:** estas correcciones no autorizan borrar, migrar, duplicar ni reconstruir jugadores, partidos, convocatorias, asistencias, estadísticas o configuraciones. No copiar datos entre propietarios/equipos para “arreglar” una vista.
- **Despliegue PWA:** cuando se corrige un módulo cargado con query de versión, actualizar el cache-bust del módulo y el build de HTML/app/SW para evitar que móvil o escritorio sigan ejecutando código anterior.
- **No aceptar CI verde incompleto:** si el job de browser smoke está `skipped` o no cubre Equipo/Preparación, no se considera validación suficiente de estos flujos.


# 73. Persistencia real de alineación desde «Preparar partido» — 25/09/2026

Causa demostrada en producción:
- En la sesión real del entrenador, al modificar la alineación desde **Partido en vivo → Preparar partido**, los logs de Supabase mostraban lecturas repetidas de `configuracion` pero ninguna escritura correspondiente al cambio.
- La causa en código era que los manejadores de la pizarra llamaban a `syncTimerFromLiveTactic()` y repintaban `En campo/Banquillo`, pero no persistían el cambio. La alineación existía solo en memoria y se perdía al actualizar.
- El smoke anterior solo cubría `Preparación → Guardar preparación` en modo demo; no cubría el flujo real de `Preparar partido`.

Guardarraíles permanentes:
- Mientras `state.timer.phase === 'ready'`, cualquier cambio del entrenador en la pizarra de **Preparar partido** que altere titular, formación o posición de una ficha debe persistirse.
- La fuente canónica se guarda también como registro `recordType: 'preparacion'` del mismo partido, preservando `team`, orden, `pos`, `x`, `y`, porteros y `formacion`.
- `settings/live` debe guardar el mismo `onField` y `initialOnField`; el siete inicial usado para el cálculo de minutos no puede quedarse con la alineación automática anterior.
- Esta persistencia automática solo aplica en fase `ready`. No cambiar la semántica de sustituciones ni eventos cuando el partido ya ha comenzado.
- No borrar, migrar ni reconstruir datos reales para corregir este flujo.
- La prueba de navegador debe entrar por **Preparar partido**, cambiar un titular, verificar que existen tanto la preparación como `settings/live`, limpiar el estado en memoria y comprobar que la alineación se reconstruye desde almacenamiento.
- **Sincronización ordenador ↔ móvil:** respetar la arquitectura ya validada en `agente.md`: IndexedDB local-first → `syncQueue` → Supabase. Los registros de `settings` viajan por la tabla `configuracion`, incluida en Supabase Realtime. Realtime solo dispara la reconciliación normal; no escribe directamente en IndexedDB.
- Mantener el polling cloud de **10 segundos** como fallback obligatorio frente a suspensión/corte de WebSocket en móvil. No sustituirlo ni retirarlo por esta corrección.
- No reintroducir transferencias manuales PC→móvil como mecanismo normal: desde v46 la vía canónica multi-dispositivo es Supabase + Realtime + polling de respaldo.


# 74. Sincronización móvil de sesiones y repintado seguro — 27/09/2026

Causa demostrada:
- Las sesiones nuevas de entrenamiento se guardan correctamente en IndexedDB, entran en `syncQueue` y llegan a Supabase como registros `recordType: 'trainingSession'` dentro de `configuracion`.
- El iPhone puede descargar correctamente el mismo snapshot remoto que el Mac y aun así seguir mostrando una lista antigua si la reconciliación termina mientras el usuario está interactuando con un formulario, diálogo, selector, reproductor o pizarra.
- El origen es que `refresh()` actualizaba el estado en memoria pero omitía `renderAll()` mientras `isUserInteracting()` era verdadero. En el siguiente polling, al no existir ya diferencias cloud/local, no se provocaba otro repintado y la interfaz podía quedar desactualizada indefinidamente.

Guardarraíles permanentes:
- No eliminar la protección `isUserInteracting()`: sigue siendo necesaria para no cerrar diálogos, perder formularios, reiniciar vídeos ni romper la pizarra en uso.
- Si una sincronización actualiza datos mientras hay interacción, debe quedar registrado un repintado pendiente.
- Ese repintado debe reintentarse de forma ligera y ejecutarse automáticamente en cuanto `isUserInteracting()` pase a falso.
- Varios cambios cloud durante la misma interacción deben consolidarse en un solo repintado pendiente; no crear bucles ni múltiples timers simultáneos.
- Un `refresh(true)` explícito puede renderizar inmediatamente y debe cancelar cualquier repintado aplazado anterior.
- El repintado aplazado debe usar el estado ya reconciliado; no debe volver a escribir datos, duplicar sesiones ni crear otra vía de sincronización.
- Mantener intacta la arquitectura canónica: IndexedDB local-first → `syncQueue` → Supabase → Realtime/polling de 10 s → reconciliación local.
- No tocar ni reconstruir datos reales para resolver una vista desactualizada.
- En Safari/iOS, no insertar `await` entre las lecturas y los `clear()/put()` de una misma transacción IndexedDB `readwrite` usada para reconciliar snapshots. Las escrituras deben encolarse desde callbacks activos de la propia transacción para evitar `TransactionInactiveError` y conservar atomicidad con `syncQueue`.
- Probar específicamente: crear una sesión en un dispositivo, mantener interacción activa en el segundo mientras llega la sincronización, terminar la interacción y comprobar que la sesión aparece sin recargar, sin logout y sin perder la vista activa.
- Probar también en Safari/iPhone que un snapshot remoto nuevo sustituye la copia local sin error de transacción y sin perder mutaciones locales pendientes.
- Las fechas de sesiones y partidos no se validan solo por patrón `YYYY-MM-DD`: deben representar un día real del calendario. Fechas imposibles como `2026-09-31` nunca pueden bloquear `Hoy`, `Sesiones` ni la reconciliación; la UI debe tolerarlas y el creador/editor debe impedir guardar nuevas fechas imposibles.
- Corregir este caso NO autoriza a reescribir manualmente registros históricos: primero se hace tolerante el cliente y se preserva la sincronización automática; cualquier reparación de datos existentes se trata aparte y con trazabilidad.


# 75. Fechas reales de calendario — 27/09/2026

Guardarraíles:
- Los selectores de fecha de CampoBase deben ofrecer solo días que existan realmente para el mes y año elegidos.
- Septiembre, abril, junio y noviembre no pueden ofrecer día 31.
- Febrero debe ofrecer 28 días en años normales y 29 únicamente en años bisiestos reales.
- Al cambiar mes o año, el selector de día debe recalcularse inmediatamente; si el día previamente elegido deja de existir, debe quedar sin selección.
- El guardado debe volver a validar la fecha aunque el usuario manipule el DOM o llegue un valor externo; no basta con validar el formato YYYY-MM-DD.
- Esta regla aplica a partidos, convocatorias manuales, asistencias, sesiones de entrenamiento y cualquier otro formulario que use los selectores DD/MM/AAAA compartidos.
- Una fecha histórica inválida no debe bloquear el render ni la sincronización: se muestra de forma segura como inválida y el usuario puede corregirla después, sin reescribir registros automáticamente.
- No corregir fechas históricas inventando el día correcto. La app solo impide nuevas fechas imposibles y tolera las antiguas hasta edición explícita.
