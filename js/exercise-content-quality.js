import { findValidatedExercise } from './ejercicios-validados.js';

const hasBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

const clean = (value = '') => String(value ?? '').replace(/^--\s*/, '').replace(/\s+/g, ' ').trim();
const norm = (value = '') => clean(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');

export function normalizeSpanishFootballText(value = '') {
  return String(value ?? '')
    .replace(/\bpase\s+de\s+chip\b/gi, 'pase picado')
    .replace(/\bpase\s+chip\b/gi, 'pase picado')
    .replace(/\btiro\s+de\s+chip\b/gi, 'remate picado')
    .replace(/\btiro\s+chip\b/gi, 'remate picado')
    .replace(/\bhacer\s+un\s+chip\b/gi, 'picar el balón')
    .replace(/\bchips\b/gi, 'balones picados')
    .replace(/\bchip\b/gi, 'balón picado');
}

function flatten(value, output = []) {
  if (value === null || value === undefined) return output;
  if (typeof value === 'string' || typeof value === 'number') {
    output.push(String(value));
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => flatten(item, output));
    return output;
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((item) => flatten(item, output));
  }
  return output;
}

// Fuente de verdad para «Qué se trabaja»: la mecánica real del ejercicio.
// Se excluyen deliberadamente objetivo_principal y que_se_trabaja para evitar
// que una redacción antigua o duplicada contamine la clasificación.
function corpusForExercise(exercise = {}) {
  return norm(flatten({
    nombre: exercise.nombre,
    categoria: exercise.categoria,
    etiquetas: exercise.etiquetas,
    secundarios: exercise.objetivos_secundarios,
    vistaRapida: exercise.vista_rapida,
    detalle: exercise.detalle,
    montaje: exercise.montaje,
    comoSeHace: exercise.como_se_hace,
    fases: exercise.fases,
    observar: exercise.que_observar,
    errores: exercise.errores_frecuentes,
    variantes: exercise.variantes,
  }).join(' '));
}

function addUnique(items, label) {
  const key = norm(label);
  if (!key || items.some((item) => norm(item) === key)) return;
  items.push(label);
}

export function deriveTrainingFocus(exercise = {}) {
  const text = corpusForExercise(exercise);
  const category = norm(exercise.categoria || exercise.vista_rapida?.tipo_principal || '');
  const items = [];
  const has = (pattern) => pattern.test(text);

  const oneVOne = has(/\b1\s*(?:v|x|contra)\s*1\b|\buno contra uno\b|\bduelo\b/);
  const defensive = has(/defens|temporiz|replieg|cobertura|bascul|marcaje|intercept|orientar al atacante|cerrar.*centro|proteger.*zona|sombreado/);
  const attacking = has(/atac|regate|desbord|superar al defensor|finaliz|remate|tiro|progres|profund|amplitud/);

  // Coordinación y capacidades físicas específicas.
  if (has(/reaccion|reacción|reactiv|estimulo|estímulo|señal|color|numero|número|voz del entrenador|psicocinet/)) {
    addUnique(items, 'Percepción y reacción ante estímulos.');
  }
  if (has(/frenad|deceler|cambio de direccion|cambio de dirección|giro|reaceler|salida explosiva/)) {
    addUnique(items, 'Frenada, cambio de dirección y reaceleración.');
  }
  if (has(/coordin|agilidad|escalera|apoyos.*pies|ritmo de pies|motric|multisalto|comba/)) {
    addUnique(items, 'Coordinación, agilidad y calidad de apoyos.');
  }
  if (has(/velocidad|aceleracion|aceleración|sprint|explosiv/)) {
    addUnique(items, 'Aceleración y velocidad específica.');
  }
  if (has(/equilibr|estabil|propiocep|postur/)) {
    addUnique(items, 'Equilibrio, estabilidad y control corporal.');
  }
  if (has(/resistencia|intermitente|aerob|anaerob/)) {
    addUnique(items, 'Resistencia específica para acciones de fútbol.');
  }
  if (has(/fuerza|salto|potencia/)) {
    addUnique(items, 'Fuerza y potencia aplicadas al gesto futbolístico.');
  }

  // Duelos y comportamiento defensivo/ofensivo.
  if (oneVOne && defensive) {
    addUnique(items, 'Desplazamientos defensivos, temporización y control de distancia.');
    if (has(/central|banda|orient|fuera|zona menos peligrosa|perfil/)) addUnique(items, 'Orientación corporal y dirección del atacante.');
  } else if (oneVOne && attacking) {
    addUnique(items, 'Regate, protección y superación del defensor en 1v1.');
  } else if (oneVOne) {
    addUnique(items, 'Lectura del rival y resolución del duelo 1v1.');
  }

  if (has(/entrada|intercept|anticip|marcaje|cobertura|permuta|bascul|replieg/)) {
    addUnique(items, 'Marcaje, anticipación, cobertura y ayudas defensivas.');
  }
  if (has(/presion|presión|robo|recuperacion|recuperación/)) {
    addUnique(items, 'Presión y recuperación del balón.');
  }

  // Técnica con balón.
  if (has(/pase|pared|triangul|circulacion|circulación|recepcion|recepción|control orientado|primer toque/)) {
    addUnique(items, 'Pase, recepción y control orientado.');
  }
  if (has(/regate|drib|conduccion|conducción|slalom/)) {
    addUnique(items, 'Conducción, regate y dominio del balón.');
  }
  if (has(/finaliz|remate|tiro|definicion|definición|golpear a porteria|golpear a portería/)) {
    addUnique(items, 'Finalización y ejecución del remate.');
  }
  if (has(/cabece|juego aereo|juego aéreo|balon aereo|balón aéreo/)) {
    addUnique(items, 'Juego aéreo, timing y contacto con el balón.');
  }

  // Principios tácticos ofensivos.
  if (has(/posesion|posesión|conservar|conservacion|conservación|lineas de pase|líneas de pase|apoyo|tercer hombre/)) {
    addUnique(items, 'Conservación, apoyos y líneas de pase.');
  }
  if (has(/amplitud|profundidad|ocupacion de espacios|ocupación de espacios|juego posicional|fijar|progresion|progresión/)) {
    addUnique(items, 'Ocupación de espacios, amplitud y progresión.');
  }
  if (has(/desmarque|ruptura|apoyo y ruptura|movilidad sin balon|movilidad sin balón/)) {
    addUnique(items, 'Desmarques, movilidad y coordinación sin balón.');
  }
  if (has(/superioridad|inferioridad|hombre libre|jugador libre/)) {
    addUnique(items, 'Identificación y aprovechamiento de superioridades.');
  }

  // Transiciones y decisión.
  if (has(/transicion|transición|tras perdida|tras pérdida|tras recuper|cambio de rol|contraataque/)) {
    addUnique(items, 'Transición y cambio rápido de rol.');
  }
  if (has(/toma de decision|toma de decisión|decidir|decision|decisión|elegir|lectura del juego|leer.*juego|escaneo|perfil corporal/)) {
    addUnique(items, 'Percepción, lectura del juego y toma de decisiones.');
  }

  // Porteros: se concreta el gesto cuando la propia tarea lo indica.
  if (has(/portero|blocaje|estirada|salida.*porter|juego de pies.*porter|achique/)) {
    if (has(/blocaje|estirada|caida|caída|desvio|desvío/)) addUnique(items, 'Técnica de blocaje, caída y estirada del portero.');
    if (has(/salida|achique|uno contra uno|1v1/)) addUnique(items, 'Colocación, salida y achique del portero.');
    if (has(/juego de pies|pase|saque|distribucion|distribución/)) addUnique(items, 'Juego de pies y distribución del portero.');
    if (!items.some((item) => /portero/i.test(item))) addUnique(items, 'Colocación e intervención específica del portero.');
  }

  // Fallback por categoría: solo se usa cuando la mecánica no aporta suficiente información.
  if (!items.length) {
    if (/calent|activ/.test(category)) addUnique(items, 'Movilidad, activación y preparación motriz.');
    else if (/pase|posesion/.test(category)) addUnique(items, 'Pase, control y conservación del balón.');
    else if (/finaliz/.test(category)) addUnique(items, 'Golpeo y finalización.');
    else if (/defens|duelo/.test(category)) addUnique(items, 'Comportamientos defensivos y resolución de duelos.');
    else if (/transicion/.test(category)) addUnique(items, 'Cambio de rol y respuesta tras cambio de posesión.');
    else if (/portero/.test(category)) addUnique(items, 'Fundamentos técnicos y tácticos del portero.');
    else if (/tactic/.test(category)) addUnique(items, 'Principios tácticos y ocupación racional del espacio.');
    else if (/tecn/.test(category)) addUnique(items, 'Calidad de ejecución técnica con balón.');
    else if (/coord|agil/.test(category)) addUnique(items, 'Coordinación, agilidad y control corporal.');
    else if (/fisic/.test(category)) addUnique(items, 'Capacidad física integrada en acciones de fútbol.');
    else addUnique(items, 'Ejecución técnica y comprensión de la situación de juego.');
  }

  const objective = norm(exerciseObjective(exercise));
  const distinct = items.filter((item) => norm(item) !== objective);
  return (distinct.length ? distinct : items).slice(0, 4).map(normalizeSpanishFootballText);
}

export function exerciseObjective(exercise = {}) {
  const candidates = [
    exercise.objetivo_principal,
    ...(Array.isArray(exercise.detalle?.objetivos) ? exercise.detalle.objetivos : []),
    ...(Array.isArray(exercise.detalle?.que_buscamos) ? exercise.detalle.que_buscamos : []),
    exercise.vista_rapida?.explicacion_breve,
  ];
  return normalizeSpanishFootballText(clean(candidates.find((item) => clean(item)) || ''));
}

function replaceTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const next = normalizeSpanishFootballText(node.nodeValue || '');
    if (next !== node.nodeValue) node.nodeValue = next;
  });
}

function applyExerciseQuality(exerciseId) {
  const body = document.getElementById('exercise-detail-body');
  if (!body || !exerciseId) return;
  const exercise = findValidatedExercise(exerciseId);
  if (!exercise) return;

  replaceTextNodes(body);

  const focus = deriveTrainingFocus(exercise);
  const section = body.querySelector('#section-que-se-trabaja');
  if (section) {
    let container = section.querySelector('.pills-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'pills-container';
      section.appendChild(container);
    }
    container.innerHTML = focus.map((item) => `<span class="pill-tag">${item.replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char])}</span>`).join('');
  }

  const objective = exerciseObjective(exercise);
  const objectiveBox = body.querySelector('#section-objetivo .main-objective-box');
  if (objectiveBox && objective) objectiveBox.textContent = objective;

  body.dataset.exerciseQualityId = exerciseId;
}

function install() {
  let currentExerciseId = '';
  let queued = false;
  const schedule = () => {
    if (!currentExerciseId || queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      applyExerciseQuality(currentExerciseId);
    });
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-exercise-id]');
    if (!trigger?.dataset.exerciseId) return;
    currentExerciseId = trigger.dataset.exerciseId;
    const body = document.getElementById('exercise-detail-body');
    if (body) body.dataset.exerciseQualityId = '';
    schedule();
  }, true);

  const body = document.getElementById('exercise-detail-body');
  if (body) {
    const observer = new MutationObserver(() => {
      if (!currentExerciseId) return;
      if (body.dataset.exerciseQualityId === currentExerciseId) {
        replaceTextNodes(body);
        return;
      }
      schedule();
    });
    observer.observe(body, { childList: true, subtree: true });
  }
}

if (hasBrowser) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
