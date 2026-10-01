# Constitución de CampoBase (`docs/constitution.md`)

Este documento define los principios fundacionales, inmutables y no negociables del proyecto **CampoBase**. Cualquier desarrollo, refactorización o ampliación técnica debe someterse a esta constitución.

---

## 1. Principios Fundacionales No Negociables

### I. Local-First Estricto
- La aplicación **debe funcionar de forma instantánea y completa offline**.
- La base de datos primaria en cliente es **IndexedDB** (`js/db.js`). 
- Nunca se bloqueará la interfaz de usuario ni la renderización esperando peticiones de red o servicios en la nube.
- Toda escritura se persiste localmente primero y se despacha a la cola de sincronización asíncrona en segundo plano sin interrumpir la experiencia táctil.

### II. Cero (0 €) Coste de Almacenamiento y Operación
- Ninguna funcionalidad añadida debe incrementar costes fijos o variables de infraestructura.
- Los recursos estáticos multimedia (vídeos demostrativos, esquemas o assets) se consumen directamente o se integran de manera ligera y desacoplada sin requerir hosting de pago.

### III. Cero Dependencias Runtime Pesadas
- CampoBase se fundamenta en **Vanilla JavaScript nativo (ES Modules)**, HTML5 semántico y CSS3 puro con Custom Properties.
- No se admiten frameworks pesados (React, Angular, Vue) ni librerías de componentes que degraden el rendimiento en terminales móviles o tabletas a pie de campo.

### IV. Suite de Tests Automatizados al 100% en Verde
- Ningún commit, cambio ni despliegue puede romper la suite de tests existente (`npm test`).
- Todo cambio estructural, de dominio o de interfaz crítica debe acompañarse de sus tests unitarios y de integración correspondientes ejecutados sobre Node.js nativo (`node:test`).
- La ejecución de `npm run check` (sintaxis y referencias) debe mantenerse limpia de advertencias y errores.

### V. Fidelidad Absoluta al Diseño Validado de Claude y Metodología Oficial
- Los formatos de exportación, fichas de trabajo, pizarras tácticas y dossiers A4 para entrenadores deben replicar con exactitud milimétrica las especificaciones validadas.
- La experiencia visual en pantalla (vista previa) debe ser idéntica al resultado físico impreso (`Vista Previa === Impresión`).
- La taxonomía, códigos de rol (Portero, Defensa, Atacante, Neutro, Entrenador), tipografías, jerarquía y espaciados son canónicos.

---

## 2. Flujo de Desarrollo Dirigido por Especificaciones (Spec-Driven Development — SDD)

A partir de la versión v60, todo nuevo requerimiento o corrección debe seguir el ciclo formal:

1. **Constitución (`docs/constitution.md`):** Validación de encaje con los principios fundamentales.
2. **Especificación (`specs/<id>/spec.md`):** Definición detallada del requerimiento, contexto, criterios de aceptación y casos límite.
3. **Plan de Arquitectura (`specs/<id>/plan.md`):** Diseño técnico, análisis de impacto, archivos afectados y estrategia de regresión cero.
4. **Lista de Tareas (`specs/<id>/tasks.md`):** Desglose atómico de tareas con checkboxes de verificación y trazabilidad directa con tests.
5. **Implementación y Verificación:** Ejecución de código, paso de linter (`npm run check`) y suite de tests completa (`npm test`).
6. **Registro en Agente (`agente.md`):** Documentación técnica concisa de la entrega preservando el historial previo.
