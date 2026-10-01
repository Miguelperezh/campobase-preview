import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FORMATS,
  ATTENDANCE_STATUSES,
  ATTENDANCE_ABSENCE_REASONS,
  CALLUP_STATUSES,
  CALLUP_EXCLUSION_REASONS,
  EXTENDED_EVENT_TYPES,
  PENALTY_RESULTS,
  calculateRepartoTargets,
  calculateSeasonBalanceAdjustments,
  buildAutoPlan,
  buildManualPlan,
  copyChangesFromAutoPlan,
  buildMinutePlanRecord,
  validateMinutePlanRecord,
  checkScheduledChangeAlert,
  checkBenchGapAlert,
  suggestInjurySubstitution,
  getHalftimeLineup,
  calculateEventScoreDelta,
  buildExtendedMatchEvent,
  formatScorerDisplay,
  calculateExtendedPlayerStats,
  calculateLateMinutes,
  validateAttendanceEntry,
  validateCallupExclusion,
  validateCallupList,
} from '../js/reparto-plan.js';

/* ==========================================================================
   1.1 REPARTO DE MINUTOS: PORTEROS APARTE
   ========================================================================== */

test('1.1 Reparto F7: 12 jugadores de campo y 2 porteros reparten 35 minutos cada uno', () => {
  const gks = ['p1', 'p13'];
  const field = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p14', 'p16'];
  const all = [...gks, ...field];

  const reparto = calculateRepartoTargets({
    format: 'F7',
    playerIds: all,
    keeperIds: gks,
  });

  assert.equal(reparto.duration, 70);
  assert.equal(reparto.slots, 6);
  assert.equal(reparto.half, 35);
  assert.equal(reparto.fieldTarget, 35); // 6 * 70 / 12 = 35
  assert.equal(reparto.gkTarget, 35); // 2 porteros -> 35 cada uno
  assert.equal(reparto.targets.p1, 35);
  assert.equal(reparto.targets.p13, 35);
  assert.equal(reparto.targets.p2, 35);
  assert.equal(reparto.targets.p9, 35);
});

test('1.1 Reparto F7: 1 solo portero juega los 70 minutos completos', () => {
  const gks = ['p1'];
  const field = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11']; // 10 de campo
  const all = [...gks, ...field];

  const reparto = calculateRepartoTargets({
    format: 'F7',
    playerIds: all,
    keeperIds: gks,
  });

  assert.equal(reparto.gkTarget, 70);
  assert.equal(reparto.targets.p1, 70);
  assert.equal(reparto.fieldTarget, 42); // 6 * 70 / 10 = 42
  assert.equal(reparto.targets.p2, 42);
});

test('1.1 Reparto F7: 3 porteros se reparten la duración equitativamente', () => {
  const gks = ['p1', 'p13', 'p99'];
  const field = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
  const all = [...gks, ...field];

  const reparto = calculateRepartoTargets({
    format: 'F7',
    playerIds: all,
    keeperIds: gks,
  });

  assert.equal(Number(reparto.gkTarget.toFixed(2)), Number((70 / 3).toFixed(2)));
});

test('1.1 Reparto F11: 90 minutos, 10 de campo en el once, respeta la modalidad', () => {
  const gks = ['p1', 'p13'];
  const field = Array.from({ length: 15 }, (_, i) => `f${i + 1}`);
  const all = [...gks, ...field];

  const reparto = calculateRepartoTargets({
    format: 'F11',
    playerIds: all,
    keeperIds: gks,
  });

  assert.equal(reparto.duration, 90);
  assert.equal(reparto.slots, 10);
  assert.equal(reparto.half, 45);
  assert.equal(reparto.gkTarget, 45);
  assert.equal(reparto.fieldTarget, (10 * 90) / 15); // 60 minutos
});

test('1.1 Recálculo dinámico: excluir o convocar a un jugador actualiza los objetivos al instante', () => {
  const gks = ['p1', 'p13'];
  const fieldInitial = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p14', 'p16']; // 12

  const rep1 = calculateRepartoTargets({ format: 'F7', playerIds: [...gks, ...fieldInitial], keeperIds: gks });
  assert.equal(rep1.fieldTarget, 35);

  // Se lesiona p16 antes del partido y queda fuera -> 11 de campo
  const fieldReduced = fieldInitial.filter((id) => id !== 'p16');
  const rep2 = calculateRepartoTargets({ format: 'F7', playerIds: [...gks, ...fieldReduced], keeperIds: gks });
  assert.equal(Number(rep2.fieldTarget.toFixed(2)), Number(((6 * 70) / 11).toFixed(2))); // 38.18'
});

/* ==========================================================================
   1.2 PLAN POR TRAMOS (ROTACIÓN CIRCULAR EXACTA)
   ========================================================================== */

test('1.2 Plan automático modo escalonado: genera cambios en pocos momentos (p. ej. 18′ y 53′)', () => {
  const gks = ['p1', 'p13'];
  const field = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p14', 'p16'];
  const playerNumbers = { p1: 1, p13: 13, p2: 2, p3: 3, p4: 4, p5: 5, p6: 6, p7: 7, p8: 8, p9: 9, p10: 10, p11: 11, p14: 14, p16: 16 };

  const plan = buildAutoPlan({
    format: 'F7',
    playerIds: [...gks, ...field],
    keeperIds: gks,
    planMode: 'escalonado',
    playerNumbers,
  });

  assert.equal(plan.changes.length > 0, true);
  // Con 12 de campo y T = 35, el desfase off = 17.5. Los cambios de campo se producen en minutos 18 y 53, y el portero al 35.
  const minutes = plan.groups.map((g) => g.m);
  assert.ok(minutes.includes(18));
  assert.ok(minutes.includes(35));
  assert.ok(minutes.includes(53));

  // Comprobar minutos previstos de cada jugador
  field.forEach((id) => {
    assert.equal(Math.round(plan.planned[id]), 35);
  });
  assert.equal(plan.planned.p1, 35);
  assert.equal(plan.planned.p13, 35);

  // LineupAt en minuto 0 contiene 1 portero y 6 de campo sin duplicados
  const l0 = plan.lineupAt(0);
  assert.equal(l0.gk, 'p1');
  assert.equal(l0.slots.length, 6);
  assert.equal(new Set([l0.gk, ...l0.slots]).size, 7);

  // LineupAt en minuto 36 (tras el descanso) tiene a p13 de portero
  const l36 = plan.lineupAt(36);
  assert.equal(l36.gk, 'p13');
});

test('1.2 Plan automático modo por partes: cambios de campo agrupados en el descanso', () => {
  const gks = ['p1', 'p13'];
  const field = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p14', 'p16'];

  const plan = buildAutoPlan({
    format: 'F7',
    playerIds: [...gks, ...field],
    keeperIds: gks,
    planMode: 'partes',
  });

  // Con modo partes off = 0, el tramo T = 35 coincide exactamente con el descanso (35')
  const minutes = plan.groups.map((g) => g.m);
  assert.ok(minutes.includes(35));
  const descansoGroup = plan.groups.find((g) => g.m === 35);
  assert.ok(descansoGroup.list.length >= 6); // Se cambian los puestos de campo y portero
});

/* ==========================================================================
   1.3 PLAN MANUAL EDITABLE Y DOCUMENTO TIPADO
   ========================================================================== */

test('1.3 Plan manual: copia del automático y permite añadir o mover cambios', () => {
  const gks = ['p1', 'p13'];
  const field = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p14', 'p16'];
  const auto = buildAutoPlan({
    format: 'F7',
    playerIds: [...gks, ...field],
    keeperIds: gks,
    planMode: 'escalonado',
  });

  const manualChanges = copyChangesFromAutoPlan(auto);
  assert.equal(manualChanges.length, auto.changes.length);

  const manual = buildManualPlan({
    autoPlan: auto,
    manualChanges,
  });

  assert.equal(manual.manual, true);
  assert.equal(manual.changes.every((c) => c.ok), true);
});

test('1.3 Plan manual: valida cambios inválidos si el que sale no está en campo o el que entra ya juega', () => {
  const gks = ['p1', 'p13'];
  const field = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p14', 'p16'];
  const auto = buildAutoPlan({
    format: 'F7',
    playerIds: [...gks, ...field],
    keeperIds: gks,
    planMode: 'escalonado',
  });

  const l0 = auto.lineupAt(0);
  const onField = [l0.gk, ...l0.slots];
  const bench = field.filter((id) => !onField.includes(id));

  // Intento 1: sacar a alguien que está en el banquillo
  const badChange1 = { m: 10, out: bench[0], inn: bench[1] };
  const manual1 = buildManualPlan({
    autoPlan: auto,
    manualChanges: [badChange1],
  });
  assert.equal(manual1.changes[0].ok, false);
  assert.match(manual1.changes[0].error, /no está en el campo/i);

  // Intento 2: meter a alguien que ya está en el campo
  const badChange2 = { m: 10, out: onField[1], inn: onField[2] };
  const manual2 = buildManualPlan({
    autoPlan: auto,
    manualChanges: [badChange2],
  });
  assert.equal(manual2.changes[0].ok, false);
  assert.match(manual2.changes[0].error, /ya está en el campo/i);
});

test('1.3 Plan manual: calcula diferencias frente al objetivo y clasifica en ok, over o under', () => {
  const gks = ['p1'];
  const field = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']; // 7 jugadores de campo, 6 juegan los 70'
  const auto = buildAutoPlan({
    format: 'F7',
    playerIds: [...gks, ...field],
    keeperIds: gks,
  });

  const l0 = auto.lineupAt(0);
  const benchPlayer = field.find((id) => !l0.slots.includes(id));
  const starter = l0.slots[0];
  const changes = [
    { m: 10, out: starter, inn: benchPlayer },
    { m: 20, out: benchPlayer, inn: starter },
  ];

  const manual = buildManualPlan({
    autoPlan: auto,
    manualChanges: changes,
  });

  assert.equal(manual.planned[benchPlayer], 10);
  // El objetivo para 7 de campo era 6 * 70 / 7 = 60 minutos
  assert.equal(manual.status[benchPlayer], 'under'); // 10 < 60 - 1
  assert.equal(manual.diffs[benchPlayer], 10 - 60);
});

test('1.3 Documento tipado minutePlan: construcción y validación', () => {
  const record = buildMinutePlanRecord({
    matchId: 'match-123',
    planMode: 'manual',
    changes: [{ m: 35, out: 'p1', inn: 'p13' }],
    startLineup: { gk: 'p1', slots: ['p2', 'p3', 'p4', 'p5', 'p6', 'p7'] },
  });

  assert.equal(record.recordType, 'minutePlan');
  assert.equal(record.matchId, 'match-123');
  assert.equal(validateMinutePlanRecord(record), true);
  assert.equal(validateMinutePlanRecord({ recordType: 'other' }), false);
  assert.equal(validateMinutePlanRecord(null), false);
});

/* ==========================================================================
   1.4 COMPENSACIÓN DE TEMPORADA (LIGA)
   ========================================================================== */

test('1.4 Compensación de temporada: ajusta minutos de liga en ±5′ y conserva la suma total', () => {
  const field = ['p2', 'p3', 'p4', 'p5'];
  // Medias por convocatoria:
  // p2 ha jugado mucho (60 min/conv), p3 ha jugado poco (20 min/conv), p4 y p5 en la media (40 min/conv)
  const seasonStats = {
    p2: { minutes: 180, callups: 3 }, // 60
    p3: { minutes: 60, callups: 3 },  // 20
    p4: { minutes: 120, callups: 3 }, // 40
    p5: { minutes: 120, callups: 3 }, // 40
  };

  const targetMinutes = 40;
  const totalDuration = 70;
  const res = calculateSeasonBalanceAdjustments(field, seasonStats, targetMinutes, totalDuration);

  // La media de convocatorias es 40
  // p3 está por debajo (20 vs 40 -> déficit de 20 -> 20 * 0.25 = 5 minutos extra)
  // p2 está por encima (60 vs 40 -> exceso de 20 -> -20 * 0.25 = -5 minutos)
  assert.ok(res.adjustments.p3 > 0);
  assert.ok(res.adjustments.p2 < 0);
  assert.ok(Math.abs(res.adjustments.p3) <= 5);
  assert.ok(Math.abs(res.adjustments.p2) <= 5);

  // Comprobar que la suma total ajustada es igual al total original
  const sumOriginal = targetMinutes * field.length;
  const sumAdjusted = res.adjustedLengths.reduce((a, b) => a + b, 0);
  assert.equal(Math.round(sumAdjusted), sumOriginal);
});

/* ==========================================================================
   1.5 AVISOS DURANTE EL PARTIDO
   ========================================================================== */

test('1.5 Avisos: cambio previsto en el minuto exacto y cuenta atrás formateada', () => {
  const plan = {
    groups: [
      { m: 18, list: [{ out: 'p2', inn: 'p8' }] },
      { m: 35, list: [{ out: 'p1', inn: 'p13' }] },
    ],
  };

  // En el segundo 1050 (minuto 18 exacto: 18*60 = 1080, en sec = 1050 estamos en el min 18)
  const alertAt18 = checkScheduledChangeAlert({
    plan,
    currentSec: 17 * 60 + 30, // 17:30 -> minuto 18
  });
  assert.ok(alertAt18.activeGroup);
  assert.equal(alertAt18.activeGroup.m, 18);

  // Cuenta atrás hacia el minuto 35 estando en el segundo 32:30 (1950 seg)
  const countdown = checkScheduledChangeAlert({
    plan,
    currentSec: 32 * 60 + 30,
    dismissedMinutes: { 18: true },
  });
  assert.equal(countdown.activeGroup, null);
  assert.equal(countdown.nextGroup.m, 35);
  assert.equal(countdown.countdownSec, 150); // 35:00 - 32:30 = 2 min 30 seg
  assert.equal(countdown.formattedCountdown, '2:30');
});

test('1.5 Aviso a falta de 10 minutos: alerta si un suplente de campo lleva ≥10′ menos que la media', () => {
  const fieldPlayerIds = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']; // 8 jugadores
  const onFieldIds = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
  // p8 está en el banquillo y solo ha jugado 15 minutos (900 seg), mientras el resto lleva 50 min (3000 seg)
  const playedSeconds = {
    p2: 50 * 60, p3: 50 * 60, p4: 50 * 60, p5: 50 * 60, p6: 50 * 60, p7: 50 * 60,
    p8: 15 * 60, p9: 45 * 60,
  };

  // Minuto 62 de un partido de 70 (quedan 8 minutos <= 10)
  const check = checkBenchGapAlert({
    currentSec: 62 * 60,
    durationSec: 70 * 60,
    playedSeconds,
    onFieldIds,
    fieldPlayerIds,
    thresholdGapMinutes: 10,
  });

  assert.equal(check.shouldAlert, true);
  assert.equal(check.candidates.some((c) => c.playerId === 'p8'), true);
  assert.match(check.candidates[0].message, /debería entrar para jugar lo mismo que el resto/i);

  // Si quedan más de 10 minutos (p. ej. minuto 50), no debe alertar
  const checkEarly = checkBenchGapAlert({
    currentSec: 50 * 60,
    durationSec: 70 * 60,
    playedSeconds,
    onFieldIds,
    fieldPlayerIds,
  });
  assert.equal(checkEarly.shouldAlert, false);
});

test('1.5 Lesión en juego: propone al suplente con mayor déficit o posición afín', () => {
  const onFieldIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
  const fieldPlayerIds = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'];
  const keeperIds = ['p1', 'p13'];

  // Caso 1: Se lesiona el portero p1 -> debe proponer a p13
  const subGk = suggestInjurySubstitution({
    injuredPlayerId: 'p1',
    onFieldIds,
    fieldPlayerIds,
    keeperIds,
  });
  assert.equal(subGk.replacementId, 'p13');
  assert.equal(subGk.isKeeper, true);

  // Caso 2: Se lesiona p2 (campo). Suplentes disponibles: p8 y p9.
  // p8 tiene objetivo 35 y lleva 10' jugados (déficit 25'). p9 tiene objetivo 35 y lleva 20' (déficit 15').
  const subField = suggestInjurySubstitution({
    injuredPlayerId: 'p2',
    onFieldIds,
    fieldPlayerIds,
    keeperIds,
    targets: { p8: 35, p9: 35 },
    playedSeconds: { p8: 10 * 60, p9: 20 * 60 },
    playerPositions: { p2: ['Defensa'], p8: ['Delantero'], p9: ['Defensa'] },
  });
  assert.equal(subField.replacementId, 'p8'); // Mayor déficit manda
});

test('1.5 Alineación de segundo tiempo según el plan: obtiene la disposición del minuto 35', () => {
  const gks = ['p1', 'p13'];
  const field = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p14', 'p16'];
  const plan = buildAutoPlan({
    format: 'F7',
    playerIds: [...gks, ...field],
    keeperIds: gks,
    planMode: 'escalonado',
  });

  const lineup = getHalftimeLineup(plan);
  assert.ok(lineup.gk);
  assert.equal(lineup.slots.length, 6);
  assert.equal(lineup.gk, 'p13'); // El segundo portero entra al descanso
});

/* ==========================================================================
   1.6 REGISTRO COMPLETO DE GOLES Y PENALTIS
   ========================================================================== */

test('1.6 Eventos extendidos: deltas de marcador y validaciones obligatorias', () => {
  // Gol de jugada (+1 a favor)
  const g1 = buildExtendedMatchEvent({
    type: EXTENDED_EVENT_TYPES.FOR_JUGADA,
    minute: 9,
    playerId: 'p9',
    assistId: 'p7',
  });
  assert.equal(g1.deltaFor, 1);
  assert.equal(g1.deltaAgainst, 0);

  // Gol en propia puerta nuestro (+1 en contra) requiere especificar jugador nuestro
  assert.throws(() => {
    buildExtendedMatchEvent({ type: EXTENDED_EVENT_TYPES.AG_PP });
  }, /requiere indicar qué jugador nuestro/);

  const gpp = buildExtendedMatchEvent({
    type: EXTENDED_EVENT_TYPES.AG_PP,
    minute: 18,
    playerId: 'p3',
  });
  assert.equal(gpp.deltaFor, 0);
  assert.equal(gpp.deltaAgainst, 1);

  // Penalti fallado nuestro no altera marcador y exige lanzador y resultado válido
  assert.throws(() => {
    buildExtendedMatchEvent({ type: EXTENDED_EVENT_TYPES.MISS_FOR, playerId: 'p9', result: 'inventado' });
  }, /resultado del penalti fallado debe ser uno de/);

  const penMiss = buildExtendedMatchEvent({
    type: EXTENDED_EVENT_TYPES.MISS_FOR,
    minute: 24,
    playerId: 'p9',
    result: PENALTY_RESULTS.CROSSBAR,
  });
  assert.equal(penMiss.deltaFor, 0);
  assert.equal(penMiss.deltaAgainst, 0);
});

test('1.6 Formato de goleador para el marcador en vivo', () => {
  assert.equal(formatScorerDisplay({ type: EXTENDED_EVENT_TYPES.FOR_JUGADA, minute: 9 }, 'Mateo'), 'Mateo 9′');
  assert.equal(formatScorerDisplay({ type: EXTENDED_EVENT_TYPES.FOR_PENALTI, minute: 23 }, 'Samuel'), 'Samuel 23′ (p)');
  assert.equal(formatScorerDisplay({ type: EXTENDED_EVENT_TYPES.FOR_FALTA, minute: 15 }, 'Álex'), 'Álex 15′ (f)');
  assert.equal(formatScorerDisplay({ type: EXTENDED_EVENT_TYPES.FOR_PP, minute: 31 }, ''), '(pp) 31′');
  assert.equal(formatScorerDisplay({ type: EXTENDED_EVENT_TYPES.AG_PP, minute: 18 }, 'Hugo'), 'Hugo 18′ (pp)');
});

test('1.6 Estadísticas extendidas: goles por tipo, penaltis parados y Zamora (nunca cuenta pretemporada en Liga)', () => {
  const matches = [
    {
      id: 'm-liga-1',
      type: 'league',
      date: '2026-10-10',
      goalsAgainst: 1,
      keeperIds: ['p1'],
      minuteTotals: { p1: 70 * 60, p9: 50 * 60 },
      extendedEvents: [
        { type: EXTENDED_EVENT_TYPES.FOR_JUGADA, playerId: 'p9', minute: 10 },
        { type: EXTENDED_EVENT_TYPES.FOR_PENALTI, playerId: 'p9', minute: 20 },
        { type: EXTENDED_EVENT_TYPES.MISS_AG, playerId: 'p1', result: PENALTY_RESULTS.SAVED, minute: 30 },
      ],
    },
    // Partido de pretemporada: goles y datos NO deben sumarse al scope 'league'
    {
      id: 'm-amistoso-1',
      type: 'friendly',
      date: '2026-09-15',
      goalsAgainst: 3,
      keeperIds: ['p1'],
      minuteTotals: { p1: 70 * 60, p9: 70 * 60 },
      extendedEvents: [
        { type: EXTENDED_EVENT_TYPES.FOR_JUGADA, playerId: 'p9', minute: 5 },
        { type: EXTENDED_EVENT_TYPES.MISS_AG, playerId: 'p1', result: PENALTY_RESULTS.SAVED, minute: 12 },
      ],
    },
  ];

  // Estadísticas del delantero p9 en Liga
  const p9Stats = calculateExtendedPlayerStats(matches, 'p9', 'league');
  assert.equal(p9Stats.totalGoals, 2); // 1 jugada + 1 penalti (el del amistoso no cuenta)
  assert.equal(p9Stats.goalsRegular, 1);
  assert.equal(p9Stats.goalsPenalty, 1);
  assert.equal(p9Stats.penaltiesScored, 1);

  // Estadísticas del portero p1 en Liga
  const p1Stats = calculateExtendedPlayerStats(matches, 'p1', 'league');
  assert.equal(p1Stats.penaltiesSaved, 1); // 1 en liga (el del amistoso no cuenta)
  assert.equal(p1Stats.keeperMatchesPlayed, 1);
  assert.equal(p1Stats.goalsConcededAsKeeper, 1);
  assert.equal(p1Stats.zamoraRatio, 1.0);

  // Estadísticas con scope 'preseason' solo toman el amistoso
  const p9Pre = calculateExtendedPlayerStats(matches, 'p9', 'preseason');
  assert.equal(p9Pre.totalGoals, 1);
});

/* ==========================================================================
   1.7 MOTIVOS COMPLETOS DE ASISTENCIA Y CONVOCATORIA
   ========================================================================== */

test('1.7 Asistencia: minutos de retraso con horas 24h', () => {
  assert.equal(calculateLateMinutes('10:45', '10:30'), 15);
  assert.equal(calculateLateMinutes('11:00', '10:30'), 30);
  assert.equal(calculateLateMinutes('10:25', '10:30'), 0); // Llegó antes de la hora
  assert.throws(() => calculateLateMinutes('10-30', '10:30'), /formato 24 horas/);
});

test('1.7 Asistencia: valida motivos de ausencia y exige nota si es "Otro motivo"', () => {
  // Motivos válidos
  assert.equal(validateAttendanceEntry({ playerId: 'p1', status: ATTENDANCE_STATUSES.PRESENT }), true);
  assert.equal(validateAttendanceEntry({ playerId: 'p1', status: ATTENDANCE_STATUSES.LATE, arrivalTime: '10:40' }), true);
  assert.equal(validateAttendanceEntry({ playerId: 'p1', status: ATTENDANCE_STATUSES.ABSENT, reason: 'illness' }), true);
  assert.equal(validateAttendanceEntry({ playerId: 'p1', status: ATTENDANCE_STATUSES.ABSENT, reason: 'other', note: 'Viaje familiar urgente' }), true);

  // Fallo si es 'other' sin nota
  assert.throws(() => {
    validateAttendanceEntry({ playerId: 'p1', status: ATTENDANCE_STATUSES.ABSENT, reason: 'other', note: '   ' });
  }, /explicación es obligatoria/);

  // Fallo si el motivo no existe
  assert.throws(() => {
    validateAttendanceEntry({ playerId: 'p1', status: ATTENDANCE_STATUSES.ABSENT, reason: 'inventado' });
  }, /motivo de ausencia debe ser uno de/);
});

test('1.7 Convocatoria: valida motivos completos y límite de 14 convocados sin duplicados', () => {
  // Motivos válidos de exclusión
  assert.equal(validateCallupExclusion({ playerId: 'p12', reason: 'sick' }), true);
  assert.equal(validateCallupExclusion({ playerId: 'p15', reason: 'rotation' }), true);
  assert.equal(validateCallupExclusion({ playerId: 'p16', reason: 'other', note: 'Examen de música' }), true);

  // Exclusión 'other' sin nota falla
  assert.throws(() => {
    validateCallupExclusion({ playerId: 'p16', reason: 'other', note: '' });
  }, /explicación es obligatoria/);

  // Convocatoria válida: 14 convocados
  const availableIds = Array.from({ length: 14 }, (_, i) => `p${i + 1}`);
  const exclusions = [{ playerId: 'p15', reason: 'rotation' }];
  assert.equal(validateCallupList(availableIds, exclusions, 14), true);

  // Falla si supera los 14 convocados
  const tooMany = Array.from({ length: 15 }, (_, i) => `p${i + 1}`);
  assert.throws(() => {
    validateCallupList(tooMany, exclusions, 14);
  }, /no puede superar el máximo de 14/);

  // Falla si un jugador está convocado y excluido a la vez
  assert.throws(() => {
    validateCallupList(['p1', 'p2'], [{ playerId: 'p1', reason: 'sick' }], 14);
  }, /no puede estar convocado y excluido a la vez/);
});
