import { isPreseasonMatch } from './domain.js';

/**
 * CampoBase · Reparto de minutos y plan de partido por tramos (Fase 1).
 * Funciones puras de lógica para reparto equitativo, rotación circular por tramos,
 * plan manual editable, compensación de liga, avisos discretos, eventos completos y motivos.
 */

export const FORMATS = {
  F7: { players: 7, duration: 70, half: 35 },
  F11: { players: 11, duration: 90, half: 45 },
};

export const ATTENDANCE_STATUSES = {
  PRESENT: 'present',
  LATE: 'late',
  ABSENT: 'absent',
};

export const ATTENDANCE_ABSENCE_REASONS = {
  illness: 'Enfermedad',
  injury: 'Lesión',
  coach_decision: 'Decisión del entrenador',
  discipline: 'Disciplina',
  studies: 'Estudios / colegio',
  family: 'Motivo familiar',
  no_notice: 'Sin avisar',
  other: 'Otro motivo',
};

export const CALLUP_STATUSES = {
  CALLED: 'called',
  EXCLUDED: 'excluded',
};

export const CALLUP_EXCLUSION_REASONS = {
  sick: 'Enfermo',
  injured: 'Lesionado',
  suspended: 'Sancionado',
  missed_training: 'No fue a entrenar',
  discipline: 'Disciplina (notas/padres)',
  coach_decision: 'Decisión del entrenador',
  rotation: 'Rotación equitativa',
  other: 'Otro motivo',
};

export const EXTENDED_EVENT_TYPES = {
  FOR_JUGADA: 'for_jugada',
  FOR_PENALTI: 'for_penalti',
  FOR_FALTA: 'for_falta',
  FOR_PP: 'for_pp',
  AG_JUGADA: 'ag_jugada',
  AG_PENALTI: 'ag_penalti',
  AG_FALTA: 'ag_falta',
  AG_PP: 'ag_pp',
  MISS_FOR: 'miss_for',
  MISS_AG: 'miss_ag',
};

export const PENALTY_RESULTS = {
  SAVED: 'parado',
  WIDE: 'fuera',
  POST: 'poste',
  CROSSBAR: 'larguero',
};

/* ==========================================================================
   1.1 REPARTO DE MINUTOS: PORTEROS APARTE
   ========================================================================== */

/**
 * Calcula los objetivos de minutos según la modalidad y la convocatoria:
 * - Campo: objetivo = (jugadores en campo - 1) × duración ÷ nº convocados de campo.
 * - Porteros: 1 portero -> juega toda la duración; 2 porteros -> un tiempo cada uno (D/2);
 *   más de 2 -> duración ÷ nº porteros; 0 porteros -> 0.
 */
export function calculateRepartoTargets({
  format = 'F7',
  playerIds = [],
  keeperIds = [],
  customDuration = null,
  customPlayersOnField = null,
} = {}) {
  if (!Array.isArray(playerIds)) {
    throw new TypeError('La lista de jugadores convocados debe ser un array.');
  }

  const fmtConfig = FORMATS[format] || FORMATS.F7;
  const duration = Number.isInteger(customDuration) && customDuration > 0
    ? customDuration
    : fmtConfig.duration;
  const playersOnField = Number.isInteger(customPlayersOnField) && customPlayersOnField > 0
    ? customPlayersOnField
    : fmtConfig.players;
  const half = Math.round(duration / 2);
  const slots = Math.max(0, playersOnField - 1);

  const keeperSet = new Set(Array.isArray(keeperIds) ? keeperIds : []);
  const gks = playerIds.filter((id) => keeperSet.has(id));
  const field = playerIds.filter((id) => !keeperSet.has(id));

  // Cómputo de porteros
  let gkTarget = 0;
  if (gks.length === 1) {
    gkTarget = duration;
  } else if (gks.length === 2) {
    gkTarget = duration / 2;
  } else if (gks.length > 2) {
    gkTarget = duration / gks.length;
  }

  // Cómputo de jugadores de campo
  const N = field.length;
  const totalFieldMinutes = slots * duration;
  let fieldTarget = 0;
  if (N > 0) {
    fieldTarget = N <= slots ? duration : totalFieldMinutes / N;
  }

  const targets = {};
  gks.forEach((id) => {
    targets[id] = gkTarget;
  });
  field.forEach((id) => {
    targets[id] = fieldTarget;
  });

  return {
    format,
    duration,
    half,
    playersOnField,
    slots,
    fieldTarget,
    gkTarget,
    targets,
    fieldPlayerIds: field,
    keeperPlayerIds: gks,
    totalFieldMinutes,
  };
}

/* ==========================================================================
   1.4 COMPENSACIÓN DE TEMPORADA (LIGA)
   ========================================================================== */

/**
 * Calcula los ajustes de temporada para jugadores de campo según partidos de Liga:
 * ajuste = (media de minutos por convocatoria - los suyos) × 0.25, limitado a ±5',
 * normalizado para que la suma total no cambie.
 */
export function calculateSeasonBalanceAdjustments(fieldPlayerIds, seasonLeagueStats = {}, targetMinutes = 0, totalDuration = 0) {
  const N = fieldPlayerIds.length;
  if (N === 0) return { adjustments: {}, adjustedLengths: [] };

  const sm = fieldPlayerIds.map((id) => {
    const stats = seasonLeagueStats[id];
    if (!stats) return 0;
    const mins = Number(stats.minutes ?? stats[0] ?? 0);
    const calls = Number(stats.callups ?? stats[5] ?? 0);
    return mins / Math.max(1, calls);
  });

  const avg = sm.reduce((a, b) => a + b, 0) / N;
  let adj = sm.map((v) => Math.max(-5, Math.min(5, (avg - v) * 0.25)));
  const mean = adj.reduce((a, b) => a + b, 0) / N;
  adj = adj.map((a) => a - mean);

  const len = fieldPlayerIds.map(() => targetMinutes);
  const adjustments = {};
  adj.forEach((a, i) => {
    len[i] = Math.min(totalDuration, Math.max(1, targetMinutes + a));
    adjustments[fieldPlayerIds[i]] = a;
  });

  const total = targetMinutes * N;
  const currentSum = len.reduce((a, b) => a + b, 0);
  const fix = total - currentSum;
  len[0] += fix;

  return {
    adjustments,
    adjustedLengths: len,
  };
}

/* ==========================================================================
   1.2 PLAN POR TRAMOS (ROTACIÓN CIRCULAR EXACTA)
   ========================================================================== */

/**
 * Construye el plan automático por rotación circular exacta.
 * Modos: 'escalonado' (desfase medio tramo T/2) o 'partes' (cambios al descanso, off = 0).
 */
export function buildAutoPlan({
  format = 'F7',
  playerIds = [],
  keeperIds = [],
  planMode = 'escalonado',
  seasonBalance = false,
  seasonStats = {},
  customDuration = null,
  customPlayersOnField = null,
  playerNumbers = {},
} = {}) {
  const baseReparto = calculateRepartoTargets({
    format,
    playerIds,
    keeperIds,
    customDuration,
    customPlayersOnField,
  });

  const { duration: D, half: H, slots, targets } = baseReparto;

  // Ordenar porteros y campo por dorsal si se proporciona
  const sortByNumber = (a, b) => {
    const na = playerNumbers[a];
    const nb = playerNumbers[b];
    if (na !== undefined && nb !== undefined) {
      return Number(na) - Number(nb);
    }
    return String(a).localeCompare(String(b));
  };

  const gks = [...baseReparto.keeperPlayerIds].sort(sortByNumber);
  const field = [...baseReparto.fieldPlayerIds].sort(sortByNumber);

  // Plan para porteros
  const gkPlan = gks.length === 0 ? []
    : gks.length === 1 ? [{ id: gks[0], from: 0, to: D }]
    : gks.length === 2 ? [{ id: gks[0], from: 0, to: H }, { id: gks[1], from: H, to: D }]
    : gks.map((id, i) => ({ id, from: (D / gks.length) * i, to: (D / gks.length) * (i + 1) }));

  const N = field.length;
  const total = slots * D;
  const T = baseReparto.fieldTarget;
  const off = (N <= slots || planMode === 'partes') ? 0 : T / 2;

  let len = field.map(() => T);
  let seasonAdj = {};

  if (seasonBalance && N > slots) {
    const balanceResult = calculateSeasonBalanceAdjustments(field, seasonStats, T, D);
    len = balanceResult.adjustedLengths;
    seasonAdj = balanceResult.adjustments;
  }

  const perSlot = Array.from({ length: slots }, () => []);
  const segs = {};

  field.forEach((id, i) => {
    if (N <= slots) {
      if (i < slots) {
        perSlot[i].push({ id, from: 0, to: D });
        segs[id] = [{ from: 0, to: D, slot: i }];
      } else {
        segs[id] = [];
      }
      return;
    }

    let a = (off + len.slice(0, i).reduce((x, y) => x + y, 0)) % total;
    let left = len[i];
    segs[id] = [];

    while (left > 1e-6) {
      const slot = Math.floor(a / D) % slots;
      const sEnd = (slot + 1) * D;
      const take = Math.min(left, sEnd - a);
      const from = a - slot * D;
      const to = from + take;

      perSlot[slot].push({ id, from, to });
      segs[id].push({ from, to, slot });

      left -= take;
      a = (a + take) % total;
    }
  });

  perSlot.forEach((l) => l.sort((x, y) => x.from - y.from));

  const changes = [];
  perSlot.forEach((l, slot) => {
    for (let j = 0; j < l.length - 1; j++) {
      const m = Math.round(l[j].to);
      changes.push({
        m,
        out: l[j].id,
        inn: l[j + 1].id,
        slot,
        sale: l[j].id,
        entra: l[j + 1].id,
        puesto: slot,
      });
    }
  });

  gkPlan.forEach((g, j) => {
    if (j < gkPlan.length - 1) {
      const m = Math.round(g.to);
      changes.push({
        m,
        out: g.id,
        inn: gkPlan[j + 1].id,
        slot: 'gk',
        sale: g.id,
        entra: gkPlan[j + 1].id,
        puesto: 'gk',
      });
    }
  });

  changes.sort((a, b) => a.m - b.m || String(a.slot).localeCompare(String(b.slot)));

  const groupsMap = {};
  changes.forEach((c) => {
    (groupsMap[c.m] = groupsMap[c.m] || []).push(c);
  });
  const groups = Object.keys(groupsMap)
    .map(Number)
    .sort((a, b) => a - b)
    .map((m) => ({ m, list: groupsMap[m] }));

  const computedTargets = {};
  field.forEach((id, i) => {
    computedTargets[id] = len[i];
  });
  gkPlan.forEach((g) => {
    computedTargets[g.id] = (computedTargets[g.id] || 0) + (g.to - g.from);
  });

  const lineupAt = (t) => {
    const time = Math.max(0, Math.min(D, t));
    const gkFound = gkPlan.find((g) => time >= g.from && time < g.to) || gkPlan.at(-1) || null;
    const gk = gkFound?.id ?? null;

    const currentSlots = perSlot.map((l) => {
      if (!l.length) return null;
      const found = l.find((p) => time >= p.from - 1e-6 && time < p.to - 1e-6);
      return (found || l[l.length - 1])?.id ?? null;
    });

    return { gk, slots: currentSlots };
  };

  const planned = {};
  Object.keys(segs).forEach((id) => {
    planned[id] = segs[id].reduce((sum, g) => sum + (g.to - g.from), 0);
  });
  gkPlan.forEach((g) => {
    planned[g.id] = (planned[g.id] || 0) + (g.to - g.from);
  });

  return {
    format,
    D,
    H,
    slots,
    planMode,
    seasonBalance,
    seasonAdj,
    gks,
    field,
    gkPlan,
    perSlot,
    segs,
    targets: computedTargets,
    planned,
    fieldTarget: T,
    gkTarget: baseReparto.gkTarget,
    changes,
    groups,
    lineupAt,
  };
}

/* ==========================================================================
   1.3 PLAN MANUAL EDITABLE Y DOCUMENTO TIPADO
   ========================================================================== */

/**
 * Construye el plan manual partiendo de un plan base y una lista de cambios manuales.
 * Valida cada cambio: si el jugador que sale no está en el campo o el que entra ya juega,
 * se marca como ok: false con un mensaje descriptivo.
 */
export function buildManualPlan({
  autoPlan,
  manualChanges = [],
  startLineup = null,
} = {}) {
  if (!autoPlan) throw new TypeError('Se requiere un plan automático como base.');

  const D = autoPlan.D;
  const initial = startLineup && Array.isArray(startLineup.slots) && startLineup.slots.length === autoPlan.slots
    ? { gk: startLineup.gk, slots: [...startLineup.slots] }
    : autoPlan.lineupAt(0);

  const cur = { gk: initial.gk, slots: [...initial.slots] };
  const open = {};
  const segs = {};
  const perSlot = Array.from({ length: autoPlan.slots }, () => []);
  const gkPlan = [];

  const openAt = (id, slot, t) => {
    if (!id) return;
    open[id] = { slot, from: t };
  };

  const close = (id, t) => {
    const o = open[id];
    if (!o) return;
    if (t > o.from) {
      const segment = { from: o.from, to: t, slot: o.slot };
      segs[id] = segs[id] || [];
      segs[id].push(segment);
      if (o.slot === 'gk') {
        gkPlan.push({ id, from: o.from, to: t });
      } else if (typeof o.slot === 'number') {
        perSlot[o.slot].push({ id, from: o.from, to: t });
      }
    }
    delete open[id];
  };

  if (cur.gk) openAt(cur.gk, 'gk', 0);
  cur.slots.forEach((id, i) => {
    if (id) openAt(id, i, 0);
  });

  const list = [...manualChanges].sort((a, b) => (a.m ?? 0) - (b.m ?? 0));
  const validatedChanges = [];

  list.forEach((c) => {
    const m = Math.max(0, Math.min(D, Number(c.m ?? 0)));
    const out = c.sale || c.out;
    const inn = c.entra || c.inn;
    const onField = [cur.gk, ...cur.slots].filter(Boolean);

    let ok = true;
    let error = null;

    if (!out || !inn) {
      ok = false;
      error = 'Falta especificar jugador que sale o que entra.';
    } else if (!onField.includes(out)) {
      ok = false;
      error = `El jugador que sale (${out}) no está en el campo en el minuto ${m}.`;
    } else if (onField.includes(inn)) {
      ok = false;
      error = `El jugador que entra (${inn}) ya está en el campo en el minuto ${m}.`;
    }

    const slot = ok ? (cur.gk === out ? 'gk' : cur.slots.indexOf(out)) : null;

    validatedChanges.push({
      ...c,
      id: c.id || `mc-${Math.random().toString(36).slice(2, 9)}`,
      m,
      out,
      inn,
      sale: out,
      entra: inn,
      ok,
      error,
      slot,
      puesto: slot,
    });

    if (!ok) return;

    close(out, m);
    openAt(inn, slot, m);
    if (slot === 'gk') {
      cur.gk = inn;
    } else {
      cur.slots[slot] = inn;
    }
  });

  Object.keys(open).forEach((id) => close(id, D));

  perSlot.forEach((l) => l.sort((a, b) => a.from - b.from));
  gkPlan.sort((a, b) => a.from - b.from);

  const groupsMap = {};
  validatedChanges.filter((c) => c.ok).forEach((c) => {
    (groupsMap[c.m] = groupsMap[c.m] || []).push(c);
  });
  const groups = Object.keys(groupsMap)
    .map(Number)
    .sort((a, b) => a - b)
    .map((m) => ({ m, list: groupsMap[m] }));

  const planned = {};
  Object.keys(segs).forEach((id) => {
    planned[id] = segs[id].reduce((sum, g) => sum + (g.to - g.from), 0);
  });

  // Asegurar que todos los convocados tengan entrada en planned
  const allPlayerIds = [...new Set([...(autoPlan.field || []), ...(autoPlan.gks || [])])];
  allPlayerIds.forEach((id) => {
    if (planned[id] === undefined) planned[id] = 0;
  });

  // Cálculo de diferencias respecto al objetivo
  const diffs = {};
  const status = {};
  allPlayerIds.forEach((id) => {
    const target = autoPlan.targets[id] ?? 0;
    const actual = planned[id] ?? 0;
    const diff = actual - target;
    diffs[id] = diff;
    if (diff > 1) {
      status[id] = 'over';
    } else if (diff < -1) {
      status[id] = 'under';
    } else {
      status[id] = 'ok';
    }
  });

  const lineupAt = (t) => {
    const time = Math.max(0, Math.min(D, t));
    const l = { gk: initial.gk, slots: [...initial.slots] };
    validatedChanges.forEach((c) => {
      if (!c.ok) return;
      if (c.m <= time) {
        if (l.gk === c.out) {
          l.gk = c.inn;
        } else {
          const idx = l.slots.indexOf(c.out);
          if (idx >= 0 && ![l.gk, ...l.slots].includes(c.inn)) {
            l.slots[idx] = c.inn;
          }
        }
      }
    });
    return l;
  };

  return {
    ...autoPlan,
    manual: true,
    initialLineup: initial,
    segs,
    perSlot,
    gkPlan: gkPlan.length ? gkPlan : autoPlan.gkPlan,
    changes: validatedChanges,
    groups,
    lineupAt,
    planned,
    diffs,
    status,
  };
}

/**
 * Genera la lista inicial de cambios manuales copiando del plan automático.
 */
export function copyChangesFromAutoPlan(autoPlan) {
  if (!autoPlan || !Array.isArray(autoPlan.changes)) return [];
  return autoPlan.changes.map((c, i) => ({
    id: `mc-${i}-${c.m}-${c.out}-${c.inn}`,
    m: c.m,
    out: c.out,
    inn: c.inn,
    sale: c.sale ?? c.out,
    entra: c.entra ?? c.inn,
  }));
}

/**
 * Crea o valida un documento de persistencia tipado para el plan de minutos ligado a un partido.
 */
export function buildMinutePlanRecord({
  matchId,
  planMode = 'manual',
  changes = [],
  startLineup = null,
  createdAt = Date.now(),
} = {}) {
  if (!matchId) throw new TypeError('El plan de minutos debe estar ligado a un matchId.');
  return {
    recordType: 'minutePlan',
    matchId,
    planMode,
    changes: Array.isArray(changes) ? changes : [],
    startLineup: startLineup ? { gk: startLineup.gk, slots: [...(startLineup.slots || [])] } : null,
    createdAt,
    updatedAt: Date.now(),
  };
}

export function validateMinutePlanRecord(record) {
  if (!record || typeof record !== 'object') return false;
  return record.recordType === 'minutePlan'
    && typeof record.matchId === 'string'
    && record.matchId.trim().length > 0
    && Array.isArray(record.changes);
}

/* ==========================================================================
   1.5 AVISOS DURANTE EL PARTIDO (DISCRETOS, NUNCA APLICAN SOLOS)
   ========================================================================== */

/**
 * Comprueba cambios programados según el plan en el minuto actual y el próximo cambio pendiente.
 */
export function checkScheduledChangeAlert({
  plan,
  currentSec,
  dismissedMinutes = {},
} = {}) {
  if (!plan || !Array.isArray(plan.groups)) {
    return { activeGroup: null, nextGroup: null, countdownSec: null, formattedCountdown: null };
  }

  const currentMin = Math.floor(currentSec / 60) + 1;
  const currentSecTotal = currentSec;

  // Grupo activo en el minuto actual
  let activeGroup = null;
  const currentScheduled = plan.groups.find((g) => g.m === currentMin);
  if (currentScheduled && !dismissedMinutes[currentScheduled.m]) {
    activeGroup = currentScheduled;
  }

  // Próximo cambio pendiente en el futuro
  let nextGroup = null;
  let countdownSec = null;
  let formattedCountdown = null;

  for (const g of plan.groups) {
    const groupSec = g.m * 60;
    if (groupSec > currentSecTotal) {
      nextGroup = g;
      countdownSec = groupSec - currentSecTotal;
      const minLeft = Math.floor(countdownSec / 60);
      const secLeft = countdownSec % 60;
      formattedCountdown = `${minLeft}:${String(secLeft).padStart(2, '0')}`;
      break;
    }
  }

  return {
    activeGroup,
    nextGroup,
    countdownSec,
    formattedCountdown,
  };
}

/**
 * Aviso a falta de 10 minutos (o umbral configurado):
 * Si un jugador de campo en el banquillo lleva >= 10' menos que la media de campo,
 * se avisa: "debería entrar para jugar lo mismo que el resto".
 */
export function checkBenchGapAlert({
  currentSec,
  durationSec = 70 * 60,
  playedSeconds = {},
  onFieldIds = [],
  fieldPlayerIds = [],
  thresholdGapMinutes = 10,
  dismissedAlerts = {},
} = {}) {
  const remainingSec = durationSec - currentSec;
  if (remainingSec > 10 * 60 || remainingSec <= 0) {
    return { shouldAlert: false, candidates: [] };
  }

  const N = fieldPlayerIds.length;
  if (N === 0) return { shouldAlert: false, candidates: [] };

  const onFieldSet = new Set(onFieldIds);
  const benchFieldIds = fieldPlayerIds.filter((id) => !onFieldSet.has(id));
  if (benchFieldIds.length === 0) return { shouldAlert: false, candidates: [] };

  const totalFieldSeconds = fieldPlayerIds.reduce((sum, id) => sum + (playedSeconds[id] ?? 0), 0);
  const avgFieldMinutes = (totalFieldSeconds / N) / 60;

  const candidates = [];
  benchFieldIds.forEach((id) => {
    if (dismissedAlerts[id]) return;
    const playerMinutes = (playedSeconds[id] ?? 0) / 60;
    const gap = avgFieldMinutes - playerMinutes;
    if (gap >= thresholdGapMinutes) {
      candidates.push({
        playerId: id,
        gapMinutes: Math.round(gap),
        playedMinutes: Math.round(playerMinutes),
        avgFieldMinutes: Math.round(avgFieldMinutes),
        message: 'debería entrar para jugar lo mismo que el resto',
      });
    }
  });

  return {
    shouldAlert: candidates.length > 0,
    candidates,
  };
}

/**
 * Propuesta de sustitución por lesión:
 * Al lesionarse un jugador en el campo:
 * - Si es portero -> proponer el otro portero en el banquillo.
 * - Si es de campo -> suplente con mayor déficit respecto a su objetivo.
 *   En caso de empate en déficit, suplente que comparta posición con el lesionado.
 */
export function suggestInjurySubstitution({
  injuredPlayerId,
  onFieldIds = [],
  fieldPlayerIds = [],
  keeperIds = [],
  targets = {},
  playedSeconds = {},
  playerPositions = {},
} = {}) {
  if (!onFieldIds.includes(injuredPlayerId)) {
    return null;
  }

  const keeperSet = new Set(keeperIds);
  const onFieldSet = new Set(onFieldIds);

  if (keeperSet.has(injuredPlayerId)) {
    const benchKeeper = keeperIds.find((id) => id !== injuredPlayerId && !onFieldSet.has(id));
    return benchKeeper ? {
      injuredPlayerId,
      replacementId: benchKeeper,
      isKeeper: true,
      reason: 'gk',
    } : null;
  }

  const benchField = fieldPlayerIds.filter((id) => !onFieldSet.has(id));
  if (benchField.length === 0) return null;

  const injuredPosList = Array.isArray(playerPositions[injuredPlayerId])
    ? playerPositions[injuredPlayerId]
    : [playerPositions[injuredPlayerId]].filter(Boolean);

  const scored = benchField.map((id) => {
    const targetSec = (targets[id] ?? 0) * 60;
    const playedSec = playedSeconds[id] ?? 0;
    const deficitSec = targetSec - playedSec;

    const candPosList = Array.isArray(playerPositions[id])
      ? playerPositions[id]
      : [playerPositions[id]].filter(Boolean);
    const sharesPosition = candPosList.some((pos) => injuredPosList.includes(pos));

    return { id, deficitSec, sharesPosition };
  });

  scored.sort((a, b) => {
    const diff = b.deficitSec - a.deficitSec;
    if (Math.abs(diff) > 60) return diff; // más de 1 minuto de diferencia en déficit
    if (a.sharesPosition !== b.sharesPosition) return a.sharesPosition ? -1 : 1;
    return diff || String(a.id).localeCompare(String(b.id));
  });

  return {
    injuredPlayerId,
    replacementId: scored[0].id,
    isKeeper: false,
    reason: scored[0].sharesPosition ? 'position' : 'deficit',
  };
}

/**
 * Propuesta de alineación para el segundo tiempo según el plan.
 */
export function getHalftimeLineup(plan, halfMinute = null) {
  if (!plan || typeof plan.lineupAt !== 'function') throw new TypeError('Plan no válido.');
  const t = halfMinute !== null ? halfMinute : (plan.H || 35);
  return plan.lineupAt(t);
}

/* ==========================================================================
   1.6 REGISTRO COMPLETO DE GOLES Y PENALTIS
   ========================================================================== */

/**
 * Devuelve el impacto en el marcador para cada tipo de evento.
 */
export function calculateEventScoreDelta(eventType) {
  switch (eventType) {
    case EXTENDED_EVENT_TYPES.FOR_JUGADA:
    case EXTENDED_EVENT_TYPES.FOR_PENALTI:
    case EXTENDED_EVENT_TYPES.FOR_FALTA:
    case EXTENDED_EVENT_TYPES.FOR_PP:
      return { deltaFor: 1, deltaAgainst: 0 };
    case EXTENDED_EVENT_TYPES.AG_JUGADA:
    case EXTENDED_EVENT_TYPES.AG_PENALTI:
    case EXTENDED_EVENT_TYPES.AG_FALTA:
    case EXTENDED_EVENT_TYPES.AG_PP:
      return { deltaFor: 0, deltaAgainst: 1 };
    case EXTENDED_EVENT_TYPES.MISS_FOR:
    case EXTENDED_EVENT_TYPES.MISS_AG:
    default:
      return { deltaFor: 0, deltaAgainst: 0 };
  }
}

/**
 * Construye y valida un evento extendido de partido.
 */
export function buildExtendedMatchEvent({
  id = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  minute = 1,
  type,
  playerId = null,
  assistId = null,
  result = null,
  note = '',
  createdAt = Date.now(),
} = {}) {
  const allowed = Object.values(EXTENDED_EVENT_TYPES);
  if (!allowed.includes(type)) {
    throw new TypeError(`Tipo de evento no válido: ${type}`);
  }

  // Validaciones según el tipo
  if ([EXTENDED_EVENT_TYPES.FOR_JUGADA, EXTENDED_EVENT_TYPES.FOR_PENALTI, EXTENDED_EVENT_TYPES.FOR_FALTA].includes(type)) {
    if (!playerId) throw new TypeError(`El evento ${type} requiere un jugador que anote el gol.`);
  }

  if (type === EXTENDED_EVENT_TYPES.AG_PP) {
    if (!playerId) throw new TypeError('El gol en propia puerta nuestro requiere indicar qué jugador nuestro la metió.');
  }

  if (type === EXTENDED_EVENT_TYPES.MISS_FOR) {
    if (!playerId) throw new TypeError('El penalti a favor fallado requiere indicar el lanzador.');
    const allowedResults = Object.values(PENALTY_RESULTS);
    if (!result || !allowedResults.includes(result)) {
      throw new TypeError(`El resultado del penalti fallado debe ser uno de: ${allowedResults.join(', ')}`);
    }
  }

  const { deltaFor, deltaAgainst } = calculateEventScoreDelta(type);

  return {
    id,
    minute: Number(minute) || 1,
    type,
    playerId: playerId ? String(playerId) : null,
    assistId: assistId ? String(assistId) : null,
    result: result || null,
    note: String(note ?? '').trim(),
    deltaFor,
    deltaAgainst,
    createdAt,
  };
}

/**
 * Formato del goleador bajo el equipo en el marcador:
 * - Gol de jugada: "Mateo 9′"
 * - Gol de penalti: "Samuel 23′ (p)"
 * - Gol de falta directa: "Álex 15′ (f)"
 * - Gol en propia puerta: "(pp) 18′" o "Hugo 18′ (pp)"
 */
export function formatScorerDisplay(event, playerName = '') {
  if (!event) return '';
  const m = event.minute ? `${event.minute}′` : '';

  switch (event.type) {
    case EXTENDED_EVENT_TYPES.FOR_JUGADA:
      return `${playerName} ${m}`.trim();
    case EXTENDED_EVENT_TYPES.FOR_PENALTI:
      return `${playerName} ${m} (p)`.trim();
    case EXTENDED_EVENT_TYPES.FOR_FALTA:
      return `${playerName} ${m} (f)`.trim();
    case EXTENDED_EVENT_TYPES.FOR_PP:
      return `(pp) ${m}`.trim();
    case EXTENDED_EVENT_TYPES.AG_PP:
      return `${playerName} ${m} (pp)`.trim();
    default:
      return `${playerName} ${m}`.trim();
  }
}

/**
 * Calcula estadísticas ampliadas para un jugador (goles por tipo, penaltis parados, etc.),
 * garantizando que si scope === 'league', nunca cuenten partidos de pretemporada.
 */
export function calculateExtendedPlayerStats(matches = [], playerId, scope = 'league') {
  if (!Array.isArray(matches)) throw new TypeError('Matches debe ser un array.');
  if (!playerId) throw new TypeError('Se requiere el ID del jugador.');

  const matchesInScope = matches.filter((match) => {
    if (scope === 'all') return true;
    const isPre = isPreseasonMatch(match);
    return scope === 'preseason' ? isPre : !isPre;
  });

  let goalsRegular = 0;
  let goalsPenalty = 0;
  let goalsFreekick = 0;
  let goalsOwnAgainst = 0;
  let assists = 0;
  let penaltiesTaken = 0;
  let penaltiesScored = 0;
  let penaltiesMissed = 0;
  let penaltiesSaved = 0;
  let goalsConcededAsKeeper = 0;
  let keeperMinutesPlayed = 0;
  let keeperMatchesPlayed = 0;

  matchesInScope.forEach((match) => {
    const events = match.extendedEvents || match.events || [];
    let playedInMatchAsKeeper = false;

    events.forEach((ev) => {
      if (ev.type === EXTENDED_EVENT_TYPES.FOR_JUGADA && ev.playerId === playerId) {
        goalsRegular += 1;
      }
      if (ev.type === EXTENDED_EVENT_TYPES.FOR_PENALTI && ev.playerId === playerId) {
        goalsPenalty += 1;
        penaltiesTaken += 1;
        penaltiesScored += 1;
      }
      if (ev.type === EXTENDED_EVENT_TYPES.FOR_FALTA && ev.playerId === playerId) {
        goalsFreekick += 1;
      }
      if (ev.type === EXTENDED_EVENT_TYPES.AG_PP && ev.playerId === playerId) {
        goalsOwnAgainst += 1;
      }
      if (ev.assistId === playerId) {
        assists += 1;
      }
      if (ev.type === EXTENDED_EVENT_TYPES.MISS_FOR && ev.playerId === playerId) {
        penaltiesTaken += 1;
        penaltiesMissed += 1;
      }
      if (ev.type === EXTENDED_EVENT_TYPES.MISS_AG && ev.playerId === playerId && ev.result === PENALTY_RESULTS.SAVED) {
        penaltiesSaved += 1;
      }
    });

    // Zamora y goles encajados si es portero
    if (match.keeperIds && match.keeperIds.includes(playerId)) {
      playedInMatchAsKeeper = true;
      const playedSec = match.minuteTotals?.[playerId] ?? 0;
      if (playedSec > 0) {
        keeperMinutesPlayed += Math.round(playedSec / 60);
        keeperMatchesPlayed += 1;
        goalsConcededAsKeeper += Number(match.goalsAgainst ?? 0);
      }
    }
  });

  const totalGoals = goalsRegular + goalsPenalty + goalsFreekick;
  const zamoraRatio = keeperMatchesPlayed > 0
    ? Number((goalsConcededAsKeeper / keeperMatchesPlayed).toFixed(2))
    : null;

  return {
    playerId,
    scope,
    totalGoals,
    goalsRegular,
    goalsPenalty,
    goalsFreekick,
    goalsOwnAgainst,
    assists,
    penaltiesTaken,
    penaltiesScored,
    penaltiesMissed,
    penaltiesSaved,
    keeperMatchesPlayed,
    keeperMinutesPlayed,
    goalsConcededAsKeeper,
    zamoraRatio,
  };
}

/* ==========================================================================
   1.7 MOTIVOS COMPLETOS DE ASISTENCIA Y CONVOCATORIA
   ========================================================================== */

/**
 * Calcula los minutos de retraso dada la hora de llegada y la hora programada en formato 24h (HH:MM).
 */
export function calculateLateMinutes(arrivalTime, scheduledTime) {
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!timeRegex.test(arrivalTime) || !timeRegex.test(scheduledTime)) {
    throw new TypeError('Las horas deben tener formato 24 horas (HH:MM).');
  }

  const [arrH, arrM] = arrivalTime.split(':').map(Number);
  const [schH, schM] = scheduledTime.split(':').map(Number);

  const arrTotal = arrH * 60 + arrM;
  const schTotal = schH * 60 + schM;

  return Math.max(0, arrTotal - schTotal);
}

/**
 * Valida un registro de asistencia por jugador con los motivos completos.
 */
export function validateAttendanceEntry(entry) {
  if (!entry || typeof entry !== 'object') throw new TypeError('La entrada de asistencia no es válida.');
  if (!entry.playerId) throw new TypeError('Se requiere el ID del jugador.');

  const allowedStatuses = Object.values(ATTENDANCE_STATUSES);
  if (!allowedStatuses.includes(entry.status)) {
    throw new TypeError(`Estado de asistencia no válido: ${entry.status}`);
  }

  if (entry.status === ATTENDANCE_STATUSES.LATE) {
    if (!entry.arrivalTime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.arrivalTime)) {
      throw new TypeError('Para un retraso es obligatoria una hora de llegada válida (HH:MM).');
    }
  }

  if (entry.status === ATTENDANCE_STATUSES.ABSENT) {
    const allowedReasons = Object.keys(ATTENDANCE_ABSENCE_REASONS);
    if (!entry.reason || !allowedReasons.includes(entry.reason)) {
      throw new TypeError(`El motivo de ausencia debe ser uno de: ${allowedReasons.join(', ')}`);
    }
    if (entry.reason === 'other' && (!entry.note || !entry.note.trim())) {
      throw new TypeError('Si el motivo es "Otro motivo", la explicación es obligatoria.');
    }
  }

  return true;
}

/**
 * Valida una exclusión de convocatoria con los motivos completos.
 */
export function validateCallupExclusion(exclusion) {
  if (!exclusion || typeof exclusion !== 'object') throw new TypeError('La exclusión no es válida.');
  if (!exclusion.playerId) throw new TypeError('Se requiere el ID del jugador.');

  const allowedReasons = Object.keys(CALLUP_EXCLUSION_REASONS);
  if (!exclusion.reason || !allowedReasons.includes(exclusion.reason)) {
    throw new TypeError(`El motivo de exclusión debe ser uno de: ${allowedReasons.join(', ')}`);
  }

  if (exclusion.reason === 'other' && (!exclusion.note || !exclusion.note.trim())) {
    throw new TypeError('Si el motivo de exclusión es "Otro motivo", la explicación es obligatoria.');
  }

  return true;
}

/**
 * Valida una convocatoria completa: máximo 14 jugadores únicos y sin duplicidad entre convocados y excluidos.
 */
export function validateCallupList(availableIds = [], exclusions = [], limit = 14) {
  if (!Array.isArray(availableIds) || !Array.isArray(exclusions)) {
    throw new TypeError('Convocados y exclusiones deben ser arrays.');
  }

  const calledSet = new Set(availableIds);
  if (calledSet.size !== availableIds.length) {
    throw new RangeError('Hay jugadores repetidos en la convocatoria.');
  }

  if (calledSet.size > limit) {
    throw new RangeError(`La convocatoria no puede superar el máximo de ${limit} jugadores.`);
  }

  const excludedIds = exclusions.map((e) => e.playerId);
  const excludedSet = new Set(excludedIds);

  for (const id of calledSet) {
    if (excludedSet.has(id)) {
      throw new RangeError(`El jugador ${id} no puede estar convocado y excluido a la vez.`);
    }
  }

  exclusions.forEach(validateCallupExclusion);

  return true;
}
