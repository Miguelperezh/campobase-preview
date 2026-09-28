export const PLAN_PRICES = Object.freeze({
  monthly: { label: 'Plan Mensual', price: '9,99 € / mes', shortPrice: '9,99 €' },
  annual: { label: 'Plan Anual', price: '79 € / año', shortPrice: '79 €' },
});

export const APP_PLAN_FEATURE_GROUPS = Object.freeze([
  {
    index: '01',
    title: 'Equipo y jugadores',
    features: [
      'Resumen del día',
      'Plantilla y fichas de jugadores',
      'Estadísticas individuales',
      'Cuerpo técnico',
      'Asistencia',
      'Cuenta de delegado con permisos configurables',
    ],
  },
  {
    index: '02',
    title: 'Partidos',
    features: [
      'Convocatorias',
      'Preparación y alineaciones',
      'Reparto de minutos',
      'Partido en vivo',
      'Cronómetro y cambios',
      'Goles, tarjetas, lesiones e incidencias',
      'Puntuaciones de jugadores',
      'Calendario y resultados',
      'Liga y pretemporada',
    ],
  },
  {
    index: '03',
    title: 'Entrenamientos',
    features: [
      'Sesiones de entrenamiento',
      'Asistencia por sesión',
      'Biblioteca de ejercicios',
      'Búsqueda, filtros y favoritos',
      'Vídeos y demostraciones',
      'Planificación por bloques',
      'Material de la sesión',
      'Pizarra táctica',
    ],
  },
  {
    index: '04',
    title: 'Cuenta y personalización',
    features: [
      'Acceso desde varios dispositivos',
      'Aplicación instalable',
      'Exportar e importar datos',
      'Personalización del equipo y club',
      'Escudo, colores y tema',
      'PIN de dispositivo',
      'Códigos de regalo y descuento',
    ],
  },
]);

export const APP_PLAN_FEATURES = Object.freeze(
  APP_PLAN_FEATURE_GROUPS.flatMap((group) => group.features),
);

export function planFeaturesHTML() {
  return `<div class="cb-feature-groups">${APP_PLAN_FEATURE_GROUPS.map((group) => `
    <article class="cb-feature-group">
      <div class="cb-feature-group-head">
        <span class="cb-feature-index" aria-hidden="true">${group.index}</span>
        <h4>${group.title}</h4>
      </div>
      <ul class="cb-plan-features">
        ${group.features.map((feature) => `<li><span aria-hidden="true">✓</span><span>${feature}</span></li>`).join('')}
      </ul>
    </article>
  `).join('')}</div>`;
}
