import { findValidatedExercise } from './ejercicios-validados.js';

const clean = (value) => String(value ?? '').trim();
const xml = (value) => clean(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);

const categoryCode = (category) => {
  if (category === 'Calentamiento') return 'C';
  if (category === 'Partido condicionado / Small-sided games') return 'P';
  if (category === 'Táctica') return 'T';
  return 'E';
};

const sentenceSteps = (item) => clean(item.description)
  .split(/(?<=[.!?])\s+/)
  .map((step) => step.trim())
  .filter(Boolean);

const intensityText = (item) => {
  if (item.intensity) return clean(item.intensity);
  const level = clean(item.difficulty) || 'Media';
  const explanations = {
    Baja: 'Baja: ritmo cómodo para entender el recorrido y corregir la técnica.',
    Media: 'Media: ritmo continuo con pausas breves para corregir.',
    Alta: 'Alta: acciones rápidas y concentradas, con recuperación suficiente para mantener calidad.',
  };
  return explanations[level] ?? `${level}: aumenta el ritmo solo cuando todos entiendan la tarea.`;
};

const genericMontage = (item) => [
  `Delimita ${clean(item.space) || 'el espacio indicado'} antes de llamar a los jugadores.`,
  `Prepara ${clean(item.material) || 'el material indicado'} y deja los balones accesibles fuera del recorrido.`,
  `Distribuye ${clean(item.players) || 'a los jugadores'} sin filas largas y señala claramente el punto de inicio.`,
  'Coloca al primer jugador en cada posición y entrega el balón únicamente a quien inicia la acción.',
];

const genericSteps = (item) => {
  const described = sentenceSteps(item);
  if (described.length >= 2) return described;
  const action = described[0] || `Los jugadores realizan ${clean(item.name).toLocaleLowerCase('es')}.`;
  return [
    'El entrenador muestra una repetición lenta y señala dónde empieza y termina la acción.',
    action,
    'Al terminar, el jugador sale del recorrido para no chocar con quien empieza.',
    'El siguiente jugador comienza cuando la zona de trabajo queda libre.',
  ];
};

export function completeExercise(item = {}) {
  const code = clean(item.code) || `${categoryCode(item.category)}-${clean(item.id).toUpperCase() || 'NUEVO'}`;
  const montage = Array.isArray(item.montage) && item.montage.length ? item.montage : genericMontage(item);
  const steps = Array.isArray(item.steps) && item.steps.length ? item.steps : genericSteps(item);
  const works = Array.isArray(item.works) && item.works.length
    ? item.works
    : [clean(item.category) || 'Técnica individual', clean(item.objective) || clean(item.description) || 'Comprensión de la tarea'];
  const observe = Array.isArray(item.observe) && item.observe.length
    ? item.observe
    : ['Que todos respeten el orden y el espacio.', 'Que la ejecución sea controlada antes de subir el ritmo.', 'Que el jugador mire antes de actuar.'];
  const corrections = Array.isArray(item.corrections) && item.corrections.length
    ? item.corrections
    : ['Balón cerca.', 'Mira antes.', 'Perfila el cuerpo.', 'Hazlo con calma.'];
  return {
    ...item,
    code,
    intensity: intensityText(item),
    objective: clean(item.objective) || clean(item.description) || `Aprender y repetir ${clean(item.name).toLocaleLowerCase('es')}.`,
    montage,
    steps,
    rotation: clean(item.rotation) || 'Después de ejecutar, el jugador avanza a la siguiente posición. El último vuelve al inicio por fuera del espacio, sin cruzar la acción.',
    works,
    lookFor: clean(item.lookFor) || 'Que cada jugador entienda su siguiente acción antes de aumentar la velocidad.',
    observe,
    corrections,
    ifBad: clean(item.ifBad) || 'Reduce la distancia, permite más tiempo y repite la demostración sin oposición.',
    ifGood: clean(item.ifGood) || clean(item.variants) || 'Reduce un toque o aumenta ligeramente el ritmo sin cambiar el recorrido.',
  };
}

const marker = (id) => `<defs><marker id="${id}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6z"/></marker></defs>`;

const boundary = (space) => {
  const value = clean(space).toLocaleLowerCase('es');
  if (/triángulo|triangulo/.test(value)) return '<path class="board-boundary board-triangle" d="M50 6 L94 92 L6 92 Z"/>';
  if (/círculo|circulo|rondo/.test(value)) return '<circle class="board-boundary board-circle" cx="50" cy="50" r="44"/>';
  if (/cuadrado/.test(value)) return '<rect class="board-boundary board-square" x="6" y="6" width="88" height="88"/>';
  return '<rect class="board-boundary board-rectangle" x="4" y="16" width="92" height="68"/>';
};

const goal = (item) => {
  if (item.dir === 'left') return `<rect class="board-goal" x="1" y="${item.y - 10}" width="6" height="20"/>`;
  if (item.dir === 'top') return `<rect class="board-goal" x="${item.x - 10}" y="1" width="20" height="6"/>`;
  if (item.dir === 'bottom') return `<rect class="board-goal" x="${item.x - 10}" y="93" width="20" height="6"/>`;
  return `<rect class="board-goal" x="93" y="${item.y - 10}" width="6" height="20"/>`;
};

const arrowClass = (kind) => ({ move: 'board-move', dribble: 'board-dribble', shot: 'board-shot', pass: 'board-pass' }[kind] || 'board-pass');
const actionLabel = (kind) => ({ move: '- - - → = movimiento sin balón', dribble: '════→ = conducción', shot: '━━━━→ = disparo', pass: '────→ = pase' }[kind] || '────→ = pase');

function boardSvg(item, arrows, title, index) {
  const rawDiagram = item.diagram || {};
  const playerPositions = [[20, 20], [50, 14], [80, 20], [80, 80], [50, 86], [20, 80], [50, 50]];
  const conePositions = [[10, 10], [90, 10], [90, 90], [10, 90]];
  const diagram = {
    ...rawDiagram,
    players: Array.isArray(rawDiagram.players) ? rawDiagram.players : playerPositions.slice(0, Math.min(Number(rawDiagram.players) || 4, playerPositions.length)).map(([x, y], playerIndex) => ({ x, y, n: String.fromCharCode(65 + playerIndex) })),
    defenders: Array.isArray(rawDiagram.defenders) ? rawDiagram.defenders : [],
    cones: Array.isArray(rawDiagram.cones) ? rawDiagram.cones : conePositions.slice(0, Math.min(Number(rawDiagram.cones) || 0, conePositions.length)).map(([x, y]) => ({ x, y })),
    goals: Array.isArray(rawDiagram.goals) ? rawDiagram.goals : Array.from({ length: Math.min(Number(rawDiagram.goals) || 0, 2) }, (_, goalIndex) => ({ x: goalIndex ? 4 : 96, y: 50, dir: goalIndex ? 'left' : 'right' })),
    ball: rawDiagram.ball || (/bal[oó]n/i.test(item.material || '') ? { x: 24, y: 20 } : null),
  };
  const markerId = `board-arrow-${clean(item.id).replace(/[^a-z0-9-]/gi, '')}-${index}`;
  const usedKinds = [...new Set(arrows.map(({ kind }) => kind || 'pass'))];
  const parts = [boundary(item.space)];
  for (const itemGoal of (diagram.goals || [])) parts.push(goal(itemGoal));
  for (const cone of (diagram.cones || [])) parts.push(`<path class="board-cone" d="M${cone.x - 3} ${cone.y + 3} L${cone.x} ${cone.y - 4} L${cone.x + 3} ${cone.y + 3} Z"/>`);
  for (const arrow of arrows) parts.push(`<path class="board-arrow ${arrowClass(arrow.kind)}" d="M${arrow.x1} ${arrow.y1} L${arrow.x2} ${arrow.y2}" marker-end="url(#${markerId})"/>`);
  for (const player of (diagram.players || [])) parts.push(`<g class="board-player"><circle cx="${player.x}" cy="${player.y}" r="5"/><text x="${player.x}" y="${player.y + 1.8}">${xml(player.n)}</text></g>`);
  for (const defender of (diagram.defenders || [])) parts.push(`<g class="board-player board-defender"><circle cx="${defender.x}" cy="${defender.y}" r="5"/><text x="${defender.x}" y="${defender.y + 1.8}">${xml(defender.n)}</text></g>`);
  if (diagram.ball) parts.push(`<text class="board-ball" x="${diagram.ball.x + 4}" y="${diagram.ball.y + 3}">⚽</text>`);
  const labels = [];
  if ((diagram.cones || []).length) labels.push('▲ = cono');
  if (diagram.ball) labels.push('⚽ = balón');
  if ((diagram.players || []).length || (diagram.defenders || []).length) labels.push('A/B/C = jugadores');
  if ((diagram.goals || []).length) labels.push('▭ = portería');
  labels.push(...usedKinds.map(actionLabel));
  return `<figure class="exercise-board"><figcaption>${xml(title)}</figcaption><svg viewBox="0 0 100 100" role="img" aria-label="${xml(title)} de ${xml(item.name)}">${marker(markerId)}${parts.join('')}</svg><p class="board-legend"><strong>Leyenda:</strong> ${labels.join(' · ')}</p></figure>`;
}

export function renderBoardDiagrams(rawItem = {}) {
  const item = completeExercise(rawItem);
  const arrows = item.diagram?.arrows || [];
  if (!arrows.length) return boardSvg(item, [], 'Gráfico 1 · Posición y espacio', 1);
  const chunks = arrows.length > 4 ? [arrows.slice(0, Math.ceil(arrows.length / 2)), arrows.slice(Math.ceil(arrows.length / 2))] : [arrows];
  const figures = [boardSvg(item, [], 'Gráfico 1 · Posición inicial', 1)];
  chunks.slice(0, 2).forEach((chunk, index) => figures.push(boardSvg(item, chunk, `Gráfico ${index + 2} · Acción ${index + 1}`, index + 2)));
  return `<div class="exercise-board-sequence">${figures.join('')}</div>`;
}

export function sessionBlockType(category) {
  const value = String(category || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');

  if (value.includes('calentamiento') || value.includes('activacion')) return 'warmup';
  if (
    value.includes('juego reducido')
    || value.includes('partido condicionado')
    || value.includes('small-sided')
  ) return 'final';
  return 'main';
}

export function addExerciseToSession(session = {}, exercise = {}) {
  const block = {
    type: sessionBlockType(exercise.category),
    exerciseId: exercise.id,
    duration: Number(exercise.duration) || 1,
    notes: '',
  };
  const blocks = [...(session.blocks || []), block];
  return { ...session, blocks, totalDuration: blocks.reduce((sum, item) => sum + Number(item.duration || 0), 0) };
}

export function moveSessionBlock(blocks, index, direction) {
  const copy = (blocks || []).map((block) => ({ ...block }));
  const target = index + direction;
  if (index < 0 || index >= copy.length || target < 0 || target >= copy.length) return copy;
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

export function removeSessionBlock(blocks, index) {
  return (blocks || []).filter((_, blockIndex) => blockIndex !== index).map((block) => ({ ...block }));
}

export function sessionDurationStatus(blocks = [], target = 60) {
  const goal = Number(target) > 0 ? Number(target) : 60;
  const total = blocks.reduce((sum, block) => sum + (Number(block.duration) || 0), 0);
  const difference = goal - total;
  const exact = difference === 0;
  const message = exact
    ? `Sesión completa: ${goal} min exactos.`
    : difference > 0 ? `Faltan ${difference} min para llegar a ${goal}.` : `Sobran ${Math.abs(difference)} min: ajusta los bloques hasta ${goal}.`;
  return { total, difference, exact, message };
}

export function formatSessionDurationInfo(totalOrBlocks, targetDuration, pitch = '') {
  let target = Number(targetDuration) > 0 ? Number(targetDuration) : 0;
  if (!target) {
    target = (pitch && String(pitch).toLowerCase().includes('pilar')) ? 75 : 60;
  }
  const total = Array.isArray(totalOrBlocks)
    ? totalOrBlocks.reduce((sum, block) => sum + (Number(block?.duration) || 0), 0)
    : (Number(totalOrBlocks) || 0);

  const diff = target - total;
  if (diff === 0) {
    return {
      total,
      target,
      diff: 0,
      metaText: `⏱️ ${total} / ${target} min (sesión lista para empezar)`,
      pillText: `${total} / ${target} min`,
      badgeText: 'Sesión lista para empezar',
      planText: `⏱️ ${total} / ${target} min programados (sesión lista para empezar)`,
      status: 'complete',
    };
  }
  if (diff > 0) {
    return {
      total,
      target,
      diff,
      metaText: `⏱️ ${total} / ${target} min (quedan ${diff} min para completar entreno)`,
      pillText: `${total} / ${target} min`,
      badgeText: `Quedan ${diff} min`,
      planText: `⏱️ ${total} de ${target} min programados (quedan ${diff} min para completar entreno)`,
      status: 'remaining',
    };
  }

  const surplus = Math.abs(diff);
  return {
    total,
    target,
    diff,
    metaText: `⏱️ ${total} / ${target} min (sobran ${surplus} min)`,
    pillText: `${total} / ${target} min`,
    badgeText: `Sobran ${surplus} min`,
    planText: `⏱️ ${total} de ${target} min programados (sobran ${surplus} min)`,
    status: 'exceeded',
  };
}

export function normalizeMaterialKey(rawName) {
  let text = clean(rawName).toLowerCase();
  text = text.replace(/\s*\([^)]*\)/g, '').trim();
  if (text.includes('balón') || text.includes('balon')) {
    if (text.includes('medicinal')) return 'balón medicinal';
    return 'balón de fútbol';
  }
  if (text.includes('miniportería') || text.includes('mini-portería') || text.includes('miniporteria')) return 'miniportería';
  if (text.includes('portería') || text.includes('porteria')) return 'portería';
  if (text.includes('cono')) return 'cono';
  if (text.includes('pica')) return 'pica';
  if (text.includes('valla')) return 'valla';
  if (text.includes('aro')) return 'aro';
  if (text.includes('escalera')) return 'escalera de agilidad';
  if (text.includes('peto')) return 'peto';
  if (text.includes('tenis')) return 'pelota de tenis';
  if (text.includes('elástica') || text.includes('elastica') || text.includes('goma')) return 'banda elástica';
  if (text.includes('colchoneta')) return 'colchoneta';
  if (text.includes('step')) return 'step';
  return text;
}

export function formatMaterialQuantity(key, count) {
  if (count === 1) {
    if (key === 'balón de fútbol') return '1 balón de fútbol';
    if (key === 'balón medicinal') return '1 balón medicinal';
    if (key === 'escalera de agilidad') return '1 escalera de agilidad';
    if (key === 'pelota de tenis') return '1 pelota de tenis';
    if (key === 'banda elástica') return '1 banda elástica';
    return `1 ${key}`;
  }
  if (key === 'balón de fútbol') return `${count} balones de fútbol`;
  if (key === 'balón medicinal') return `${count} balones medicinales`;
  if (key === 'escalera de agilidad') return `${count} escaleras de agilidad`;
  if (key === 'pelota de tenis') return `${count} pelotas de tenis`;
  if (key === 'banda elástica') return `${count} bandas elásticas`;
  if (key.endsWith('a') || key.endsWith('o') || key.endsWith('e')) return `${count} ${key}s`;
  if (key.endsWith('ón') || key.endsWith('on')) return `${count} ${key.replace(/ó?n$/i, 'ones')}`;
  return `${count} ${key}s`;
}

export function calculateSessionTotalMaterial(blocks = [], exercisesLookup = null) {
  if (!Array.isArray(blocks) || !blocks.length) return '';
  const totals = new Map();
  for (const block of blocks) {
    const exerciseId = block?.exerciseId;
    if (!exerciseId) continue;
    let exercise = null;
    if (typeof exercisesLookup === 'function') exercise = exercisesLookup(exerciseId);
    else if (exercisesLookup instanceof Map) exercise = exercisesLookup.get(exerciseId);
    else if (Array.isArray(exercisesLookup)) exercise = exercisesLookup.find((e) => e?.id === exerciseId);
    if (!exercise && typeof findValidatedExercise === 'function') exercise = findValidatedExercise(exerciseId);
    if (!exercise) continue;

    if (Array.isArray(exercise.materiales) && exercise.materiales.length) {
      for (const item of exercise.materiales) {
        const key = normalizeMaterialKey(item?.nombre);
        if (!key) continue;
        const qty = Math.max(1, Number(item?.cantidad) || 1);
        totals.set(key, (totals.get(key) || 0) + qty);
      }
    } else if (exercise.material || exercise.vista_rapida?.material) {
      const text = String(exercise.vista_rapida?.material || exercise.material || '').trim();
      const parts = text.split(/[,;\n+]+/).map((part) => part.trim()).filter(Boolean);
      for (const part of parts) {
        const match = part.match(/^(\d+)\s*(.+)$/);
        if (match) {
          const qty = Math.max(1, Number(match[1]) || 1);
          const key = normalizeMaterialKey(match[2]);
          if (key) totals.set(key, (totals.get(key) || 0) + qty);
        } else {
          const key = normalizeMaterialKey(part);
          if (key) totals.set(key, (totals.get(key) || 0) + 1);
        }
      }
    }
  }
  if (totals.size === 0) return '';
  const order = ['balón de fútbol', 'cono', 'peto', 'portería', 'miniportería', 'valla', 'escalera de agilidad', 'pica', 'aro', 'colchoneta', 'step', 'banda elástica', 'balón medicinal', 'pelota de tenis'];
  const sorted = [...totals.entries()].sort((a, b) => {
    const iA = order.indexOf(a[0]);
    const iB = order.indexOf(b[0]);
    if (iA !== -1 && iB !== -1) return iA - iB;
    if (iA !== -1) return -1;
    if (iB !== -1) return 1;
    return b[1] - a[1];
  });
  return sorted.map(([key, count]) => formatMaterialQuantity(key, count)).join(', ');
}

export function buildFlexibleTrainingSession(values = {}, metadata = {}) {
  const date = clean(values.date);
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const parsedDate = dateMatch ? new Date(`${date}T12:00:00`) : null;
  const validDate = Boolean(
    dateMatch
    && parsedDate
    && Number.isFinite(parsedDate.getTime())
    && parsedDate.getFullYear() === Number(dateMatch[1])
    && parsedDate.getMonth() + 1 === Number(dateMatch[2])
    && parsedDate.getDate() === Number(dateMatch[3])
  );
  if (!validDate) throw new TypeError('Selecciona una fecha válida para la sesión.');
  const available = new Set(metadata.availableExerciseIds || []);
  const blocks = (values.blocks || []).map((block) => {
    if (!available.has(block.exerciseId)) throw new TypeError('La sesión contiene un ejercicio que ya no está disponible.');
    const rawDuration = Number(block.duration);
    const duration = Math.max(1, Math.min(240, Number.isInteger(rawDuration) ? rawDuration : (Math.round(rawDuration) || 10)));
    return { type: block.type, exerciseId: block.exerciseId, duration, notes: clean(block.notes) };
  });
  const target = Number(values.targetDuration) > 0 ? Number(values.targetDuration) : 60;
  const status = sessionDurationStatus(blocks, target);
  const autoMaterial = calculateSessionTotalMaterial(blocks, metadata.exercises || metadata.exercisesLookup || metadata.availableExerciseIds);
  const material = clean(values.material) || autoMaterial;
  return {
    id: metadata.id,
    recordType: 'trainingSession',
    date,
    time: clean(values.time),
    name: clean(values.name) || 'Sesión de entrenamiento',
    pitch: clean(values.pitch),
    targetDuration: target,
    sessionKind: clean(values.sessionKind) || 'training',
    material,
    notes: clean(values.notes),
    blocks,
    totalDuration: status.total,
    createdAt: metadata.createdAt,
    updatedAt: metadata.now,
  };
}
