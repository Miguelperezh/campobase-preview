import { roleCanUseOwnerFeatures } from './demo-session.js';

const BACKUP_STORES = ['players', 'callups', 'matches', 'trainings', 'settings'];

export function normalizePositions(player = {}) {
  const positions = Array.isArray(player.positions) ? player.positions : (player.position ? [player.position] : []);
  return [...new Set(positions.map((position) => String(position).trim()).filter(Boolean))];
}

export function calledPlayerOptions(players, availableIds) {
  if (!Array.isArray(players) || !Array.isArray(availableIds)) throw new TypeError('Jugadores y convocados deben ser listas.');
  const byId = new Map(players.map((player) => [player.id, player]));
  return availableIds.flatMap((id) => {
    const player = byId.get(id);
    return player ? [{ id: player.id, name: String(player.name ?? '') }] : [];
  });
}

export function sortPlayersByName(players) {
  if (!Array.isArray(players)) throw new TypeError('La plantilla debe ser una lista.');
  return [...players].sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''), 'es', {
    sensitivity: 'base',
  }));
}

export function buildPlayerRecord(values, positions, existing = null, photo = undefined, createdAt = Date.now()) {
  if (!values || typeof values !== 'object') throw new TypeError('Los datos del jugador no son válidos.');
  if (!Array.isArray(positions)) throw new TypeError('Las posiciones deben ser una lista.');
  const name = String(values.name ?? '').trim();
  if (!name) throw new TypeError('El nombre del jugador es obligatorio.');
  const foot = String(values.foot ?? '');
  if (!['', 'Derecha', 'Izquierda', 'Ambas'].includes(foot)) throw new TypeError('La pierna dominante no es válida.');
  const resolvedPhoto = photo !== undefined ? (photo || '') : (existing?.photo || '');
  const rawNumber = values.number !== undefined ? values.number : (existing?.number ?? '');
  const cleanNumber = rawNumber !== '' && rawNumber !== null && rawNumber !== undefined
    ? String(rawNumber).trim().replace(/^#\s*/, '')
    : '';
  return {
    ...existing,
    id: values.id,
    name,
    number: cleanNumber,
    positions: [...positions],
    foot,
    notes: String(values.notes ?? '').trim(),
    fatherName: String(values.fatherName !== undefined ? values.fatherName : (existing?.fatherName ?? '')).trim(),
    fatherPhone: String(values.fatherPhone !== undefined ? values.fatherPhone : (existing?.fatherPhone ?? '')).trim(),
    motherName: String(values.motherName !== undefined ? values.motherName : (existing?.motherName ?? '')).trim(),
    motherPhone: String(values.motherPhone !== undefined ? values.motherPhone : (existing?.motherPhone ?? '')).trim(),
    photo: resolvedPhoto,
    outsideCount: existing?.outsideCount ?? 0,
    lastExcludedAt: existing?.lastExcludedAt ?? null,
    totalMinutes: existing?.totalMinutes ?? 0,
    seasonMinutes: existing?.seasonMinutes ?? {},
    minuteReasons: existing?.minuteReasons ?? [],
    createdAt: existing?.createdAt ?? createdAt,
  };
}

export function sortPlayersBySquadNumber(players) {
  if (!Array.isArray(players)) throw new TypeError('La plantilla debe ser una lista.');
  return [...players].sort((a, b) => {
    const aHasNumber = a.number !== '' && a.number !== null && a.number !== undefined;
    const bHasNumber = b.number !== '' && b.number !== null && b.number !== undefined;
    if (aHasNumber !== bHasNumber) return aHasNumber ? -1 : 1;
    if (aHasNumber && Number(a.number) !== Number(b.number)) return Number(a.number) - Number(b.number);
    return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'es', { sensitivity: 'base' });
  });
}

export function updateRotationCounters(players, callups) {
  if (!Array.isArray(players) || !Array.isArray(callups)) throw new TypeError('Jugadores y convocatorias deben ser listas.');
  return players.map((player) => {
    const rotations = callups
      .filter((callup) => (callup.exclusions ?? []).some((entry) => entry.playerId === player.id && entry.automatic))
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return { ...player, outsideCount: rotations.length, lastExcludedAt: rotations[0]?.createdAt ?? null };
  });
}

function positiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${label} debe ser un entero positivo.`);
  }
}

export function calculateMinuteTargets(playerIds, durationMinutes, playersOnField, keeperIds = []) {
  if (!Array.isArray(playerIds) || playerIds.length === 0) {
    throw new TypeError('Debe haber al menos un jugador disponible.');
  }
  positiveInteger(durationMinutes, 'La duración');
  positiveInteger(playersOnField, 'Los jugadores en campo');
  const keepers = new Set(Array.isArray(keeperIds) ? keeperIds : []);
  const totalMinutes = durationMinutes * playersOnField;
  // Los porteros tienen minutos fijos: uno juega el partido completo; dos, un tiempo cada uno.
  const keeperCount = playerIds.filter((id) => keepers.has(id)).length;
  const keeperMinutes = keeperCount === 1 ? durationMinutes : keeperCount >= 2 ? durationMinutes / 2 : 0;
  const keeperTotal = keeperCount * keeperMinutes;
  const fieldIds = playerIds.filter((id) => !keepers.has(id));
  const fieldTotal = totalMinutes - keeperTotal;
  const base = fieldIds.length ? Math.floor(fieldTotal / fieldIds.length) : 0;
  const remainder = fieldIds.length ? fieldTotal % fieldIds.length : 0;
  const fieldTargets = new Map(fieldIds.map((playerId, index) => [playerId, base + (index < remainder ? 1 : 0)]));
  return playerIds.map((playerId) => ({
    playerId,
    minutes: keepers.has(playerId) ? keeperMinutes : (fieldTargets.get(playerId) ?? 0),
  }));
}

export function suggestExcludedPlayers(players, count) {
  if (!Array.isArray(players)) throw new TypeError('La plantilla debe ser una lista.');
  if (!Number.isInteger(count) || count < 0 || count > players.length) {
    throw new RangeError('El número de jugadores fuera no es válido.');
  }
  return [...players]
    .sort((a, b) => {
      const countDifference = (a.outsideCount ?? 0) - (b.outsideCount ?? 0);
      if (countDifference !== 0) return countDifference;
      const aLast = a.lastExcludedAt ?? Number.NEGATIVE_INFINITY;
      const bLast = b.lastExcludedAt ?? Number.NEGATIVE_INFINITY;
      if (aLast !== bLast) return aLast - bLast;
      return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'es');
    })
    .slice(0, count);
}

export function buildCallupSelection(players, options = {}) {
  if (!Array.isArray(players)) throw new TypeError('La plantilla debe ser una lista.');
  const limit = options.limit ?? 14;
  positiveInteger(limit, 'El máximo de convocados');
  const matchType = options.matchType ?? 'league';
  const uniquePlayers = [...new Map(players.map((player) => [player.id, player])).values()];
  const playerIds = new Set(uniquePlayers.map(({ id }) => id));
  const selected = new Set(options.selectedIds ?? []);
  const manualExclusions = options.manualExclusions ?? [];
  const manuallyExcluded = new Set(manualExclusions.map(({ playerId }) => playerId));
  if ([...selected, ...manuallyExcluded].some((id) => !playerIds.has(id))) {
    throw new RangeError('La selección contiene un jugador que no está en la plantilla.');
  }
  if ([...selected].some((id) => manuallyExcluded.has(id))) {
    throw new RangeError('Un jugador no puede estar convocado y fuera a la vez.');
  }
  if (matchType !== 'friendly' && selected.size > limit) {
    throw new RangeError(`La convocatoria no puede superar ${limit} jugadores.`);
  }

  const eligible = uniquePlayers.filter(({ id }) => !manuallyExcluded.has(id));
  const exclusions = manualExclusions.map(({ playerId, reason, note }) => ({
    playerId,
    reason,
    ...(note ? { note } : {}),
    automatic: false,
  }));

  // Amistoso: sin máximo de convocados. Todos los disponibles pueden entrar
  // en el reparto de minutos; las únicas bajas son las exclusiones manuales.
  if (matchType === 'friendly') {
    return { availableIds: eligible.map(({ id }) => id), exclusions };
  }

  // Torneo mantiene el comportamiento anterior y su límite actual.
  if (matchType !== 'league') {
    if (eligible.length > limit) throw new RangeError(`En torneos van todos los disponibles, con un máximo de ${limit}. Marca las bajas manuales necesarias.`);
    return { availableIds: eligible.map(({ id }) => id), exclusions };
  }

  const automaticCount = Math.max(0, eligible.length - limit);
  const candidates = eligible.filter(({ id }) => !selected.has(id));
  if (automaticCount > candidates.length) throw new RangeError(`La convocatoria no puede superar ${limit} jugadores.`);
  const protectedHistories = options.protectedHistories ?? {};
  const rotationDecisions = options.rotationDecisions ?? {};
  const pendingRotationDecisions = [];
  const automatic = [];
  for (const player of suggestExcludedPlayers(candidates, candidates.length)) {
    if (automatic.length >= automaticCount) break;
    const history = protectedHistories[player.id] ?? [];
    if (history.length && !rotationDecisions[player.id]) {
      pendingRotationDecisions.push({ playerId: player.id, history });
      automatic.push(player);
      continue;
    }
    if (rotationDecisions[player.id] === 'include') continue;
    automatic.push(player);
  }
  if (automatic.length < automaticCount) {
    const fallback = suggestExcludedPlayers(candidates, candidates.length)
      .filter(({ id }) => rotationDecisions[id] === 'include' && !automatic.some((player) => player.id === id));
    automatic.push(...fallback.slice(0, automaticCount - automatic.length));
  }
  const automaticIds = new Set(automatic.map(({ id }) => id));
  exclusions.push(...automatic.map(({ id }) => ({ playerId: id, reason: 'rotation', automatic: true })));
  return {
    availableIds: eligible.filter(({ id }) => !automaticIds.has(id)).map(({ id }) => id),
    exclusions,
    pendingRotationDecisions,
  };
}

export function buildAttendanceRecord(players, values, metadata = {}) {
  if (!Array.isArray(players)) throw new TypeError('La plantilla debe ser una lista.');
  const allowedStatuses = new Set(['present', 'late', 'absent']);
  const kind = metadata.kind ?? 'training';
  if (!['training', 'match'].includes(kind)) throw new TypeError('El tipo de asistencia no es válido.');
  if (kind === 'match' && !metadata.matchId) throw new TypeError('La asistencia de partido debe estar vinculada a un partido.');
  const attendance = players.map(({ id }) => {
    const status = values[`status-${id}`];
    if (!allowedStatuses.has(status)) throw new TypeError('El estado de asistencia no es válido.');
    const arrivalTime = status === 'late' ? String(values[`arrivalTime-${id}`] ?? '').trim() : '';
    if (arrivalTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(arrivalTime)) {
      throw new TypeError('La hora de llegada no es válida.');
    }
    return { playerId: id, status, arrivalTime, note: String(values[`note-${id}`] ?? '').trim() };
  });
  return {
    id: metadata.id,
    kind,
    matchId: kind === 'match' ? metadata.matchId : null,
    date: String(values.date ?? ''),
    notes: String(values.notes ?? '').trim(),
    attendance,
    createdAt: metadata.createdAt,
  };
}

export function buildTrainingRecord(players, values, metadata = {}) {
  const { kind, matchId, ...record } = buildAttendanceRecord(players, values, { ...metadata, kind: 'training' });
  return record;
}

export function calculateAttendanceStats(playerId, records) {
  if (!Array.isArray(records)) throw new TypeError('El historial de asistencia debe ser una lista.');
  const history = records
    .map((record) => ({ ...record, entry: record.attendance?.find((item) => item.playerId === playerId) }))
    .filter(({ entry }) => entry)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || (a.createdAt ?? 0) - (b.createdAt ?? 0));
  const trainingHistory = history.filter(({ kind }) => (kind ?? 'training') === 'training');
  let longestTrainingAbsenceStreak = 0;
  let streak = 0;
  for (const { entry } of trainingHistory) {
    streak = entry.status === 'absent' ? streak + 1 : 0;
    longestTrainingAbsenceStreak = Math.max(longestTrainingAbsenceStreak, streak);
  }
  let currentTrainingAbsenceStreak = 0;
  for (const { entry } of [...trainingHistory].reverse()) {
    if (entry.status !== 'absent') break;
    currentTrainingAbsenceStreak += 1;
  }
  const totalAbsences = history.filter(({ entry }) => entry.status === 'absent').length;
  const lateCount = history.filter(({ entry }) => entry.status === 'late').length;
  return {
    totalRecords: history.length,
    totalAbsences,
    trainingAbsences: trainingHistory.filter(({ entry }) => entry.status === 'absent').length,
    matchAbsences: history.filter(({ kind, entry }) => kind === 'match' && entry.status === 'absent').length,
    currentTrainingAbsenceStreak,
    longestTrainingAbsenceStreak,
    lateCount,
    oftenLate: lateCount >= 3,
  };
}

export function sortAttendanceRecords(records) {
  if (!Array.isArray(records)) throw new TypeError('El historial de asistencia debe ser una lista.');
  return [...records].sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')) || (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export function buildPlayerHistory(playerId, attendanceRecords, callups, matches = []) {
  if (!Array.isArray(attendanceRecords) || !Array.isArray(callups) || !Array.isArray(matches)) {
    throw new TypeError('Los históricos deben ser listas.');
  }
  const statusLabels = { present: 'Presente', late: 'Tarde', absent: 'Ausente' };
  const attendance = attendanceRecords.flatMap((record) => {
    const entry = record.attendance?.find((item) => item.playerId === playerId);
    if (!entry) return [];
    const detail = [statusLabels[entry.status] ?? entry.status, entry.arrivalTime ? `Hora ${entry.arrivalTime}` : '', entry.note, record.notes].filter(Boolean).join(' · ');
    return [{ type: 'attendance', id: record.id, date: record.date, kind: record.kind ?? 'training', detail, createdAt: record.createdAt ?? 0 }];
  });
  const exclusions = callups.flatMap((callup) => (callup.exclusions ?? [])
    .filter((entry) => entry.playerId === playerId)
    .map((entry) => ({ type: 'callup', id: callup.id, date: callup.date, kind: 'callup', detail: entry.reason, automatic: Boolean(entry.automatic), createdAt: callup.createdAt ?? 0 })));
  const matchEvents = matches.flatMap((match) => {
    const details = [];
    const goals = (match.goals ?? []).filter((item) => item.playerId === playerId).length;
    if (goals) details.push(`Gol x${goals}`);
    const yellowCards = (match.cards ?? []).filter((item) => item.playerId === playerId && item.type === 'yellow').length;
    const redCards = (match.cards ?? []).filter((item) => item.playerId === playerId && item.type === 'red').length;
    if (yellowCards) details.push(`Amarilla x${yellowCards}`);
    if (redCards) details.push(`Roja x${redCards}`);
    details.push(...(match.injuries ?? []).filter((item) => item.playerId === playerId).map((item) => `Lesión${item.note ? `: ${item.note}` : ''}`));
    details.push(...(match.incidents ?? []).filter((item) => item.playerId === playerId).map((item) => `Incidencia${item.note ? `: ${item.note}` : ''}`));
    const seconds = match.minuteTotals?.[playerId];
    if (Number.isFinite(seconds)) details.push(`${Math.round(seconds / 60)} min`);
    const rating = match.ratings?.[playerId];
    if (Number.isFinite(rating)) details.push(`Puntuación ${rating}/5`);
    return details.length ? [{ type: 'match', id: match.id, date: match.date, kind: 'match', detail: details.join(' · '), createdAt: match.finishedAt ?? match.createdAt ?? 0 }] : [];
  });
  return [...attendance, ...exclusions, ...matchEvents]
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')) || b.createdAt - a.createdAt);
}

export function buildPlayerSummary(playerId, matches, attendanceRecords, callups, scope = 'all') {
  if (![matches, attendanceRecords, callups].every(Array.isArray)) throw new TypeError('Los históricos deben ser listas.');
  if (!['all', 'league', 'preseason'].includes(scope)) throw new TypeError('El ámbito de estadísticas no es válido.');

  const isMatchCompleted = (m) => {
    if (!m) return false;
    if (m.status === 'finished') return true;
    if (m.status === 'planned' || m.status === 'ready') {
      return Boolean(m.minuteTotals && Object.values(m.minuteTotals).some((sec) => Number(sec) > 0));
    }
    return Boolean((m.minuteTotals && Object.values(m.minuteTotals).some((sec) => Number(sec) > 0)) || (m.goals && m.goals.length > 0) || Number.isFinite(m.goalsFor));
  };

  // Desduplicar convocatorias por partido (si hay borradores o duplicados de sync, tomar la más reciente)
  const byMatchCallups = new Map();
  const orphanCallups = [];
  const sortedCallups = [...callups].sort((a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0));
  for (const c of sortedCallups) {
    const rel = matches.find((m) => (c.matchId && m.id === c.matchId) || (m.callupId && m.callupId === c.id) || m.id === c.id);
    if (rel) {
      if (!byMatchCallups.has(rel.id)) byMatchCallups.set(rel.id, c);
    } else if (!c.matchId) {
      orphanCallups.push(c);
    }
  }
  const cleanCallups = [...byMatchCallups.values(), ...orphanCallups];

  const matchesInScope = matches.filter((match) => scope === 'all'
    || (scope === 'preseason' ? isPreseasonMatch(match) : !isPreseasonMatch(match)));
  const callupsInScope = cleanCallups.filter((callup) => {
    const relatedMatch = matches.find((match) => (callup.matchId && match.id === callup.matchId) || (match.callupId && match.callupId === callup.id) || match.id === callup.id);
    if (callup.matchId && !relatedMatch && !matches.some((m) => m.id === callup.matchId)) return false;
    // Si la convocatoria está vinculada a un partido planificado/futuro que aún no se ha jugado, no computa como partido disputado
    if (relatedMatch && !isMatchCompleted(relatedMatch)) return false;
    if (scope === 'all') return true;
    const preseason = relatedMatch ? isPreseasonMatch(relatedMatch) : isPreseasonMatch({ type: callup.matchType });
    return scope === 'preseason' ? preseason : !preseason;
  });
  const playerMatches = matchesInScope.filter((match) => {
    if (match.status === 'planned' && !(match.minuteTotals?.[playerId] > 0)) return false;
    return (match.minuteTotals?.[playerId] ?? 0) > 0
      || (match.minuteTotals?.[playerId] !== undefined && match.status === 'finished')
      || match.ratings?.[playerId] !== undefined
      || [match.goals, match.cards, match.injuries, match.incidents].some((items) => items?.some((item) => item.playerId === playerId || item.assistantId === playerId));
  });
  const ratings = playerMatches
    .filter((match) => (match.minuteTotals?.[playerId] ?? 0) >= 5 * 60 || (match.minuteTotals?.[playerId] === undefined && Number.isFinite(match.ratings?.[playerId])))
    .map((match) => match.ratings?.[playerId])
    .filter(Number.isFinite);
  const attendanceInScope = attendanceRecords.filter((record) => {
    if (scope === 'all') return true;
    if (!record.matchId) return scope === 'league';
    const relatedMatch = matches.find((match) => match.id === record.matchId);
    if (!relatedMatch) return false;
    const preseason = isPreseasonMatch(relatedMatch);
    return scope === 'preseason' ? preseason : !preseason;
  });
  const attendance = attendanceInScope.flatMap((record) => record.attendance?.filter((entry) => entry.playerId === playerId) ?? []);
  const countEvents = (field, predicate = () => true) => playerMatches.reduce((total, match) => total + (match[field] ?? []).filter((item) => item.playerId === playerId && predicate(item)).length, 0);
  const countAssists = () => playerMatches.reduce((total, match) => total + (match.goals ?? []).filter((item) => item.assistantId === playerId).length, 0);

  const explicitCallupCount = callupsInScope.filter((callup) => callup.availableIds?.includes(playerId)).length;
  const playedMatchesWithoutCallup = matchesInScope.filter((match) => {
    if (!isMatchCompleted(match)) return false;
    const hasMinutes = match.minuteTotals && Number.isFinite(match.minuteTotals[playerId]) && match.minuteTotals[playerId] > 0;
    if (!hasMinutes) return false;
    const hasLinkedCallup = callupsInScope.some((c) => (match.callupId && c.id === match.callupId)
      || c.matchId === match.id
      || c.id === match.id
      || (!c.matchId && match.date && c.date && String(match.date).slice(0, 10) === String(c.date).slice(0, 10)));
    return !hasLinkedCallup;
  }).length;
  const orphanAvailableCallups = callupsInScope.filter((c) => c.availableIds?.includes(playerId)
    && (!c.matchId || !matches.some((m) => m.id === c.matchId))
    && !matches.some((m) => m.callupId === c.id || (m.date && c.date && String(m.date).slice(0, 10) === String(c.date).slice(0, 10)))).length;
  const extraCallups = Math.max(0, playedMatchesWithoutCallup - orphanAvailableCallups);
  const totalCallups = explicitCallupCount + extraCallups;

  return {
    goals: countEvents('goals'),
    assists: countAssists(),
    yellowCards: countEvents('cards', (item) => item.type === 'yellow'),
    redCards: countEvents('cards', (item) => item.type === 'red'),
    injuries: countEvents('injuries'),
    incidents: countEvents('incidents'),
    callups: totalCallups,
    notCalled: callupsInScope.filter((callup) => callup.exclusions?.some((item) => item.playerId === playerId)).length,
    rotations: callupsInScope.filter((callup) => callup.exclusions?.some((item) => item.playerId === playerId && item.automatic)).length,
    present: attendance.filter((entry) => entry.status === 'present').length,
    late: attendance.filter((entry) => entry.status === 'late').length,
    absent: attendance.filter((entry) => entry.status === 'absent').length,
    minutes: Math.round(playerMatches.reduce((total, match) => total + (match.minuteTotals?.[playerId] ?? 0), 0) / 60),
    ratings: ratings.length,
    averageRating: ratings.length ? Number((ratings.reduce((total, rating) => total + rating, 0) / ratings.length).toFixed(1)) : null,
  };
}

export function applyPlayerStatAdjustments(summary, adjustments = {}) {
  const result = { ...summary };
  const fields = ['goals', 'assists', 'yellowCards', 'redCards', 'injuries', 'incidents', 'callups', 'rotations', 'late', 'absent', 'minutes', 'averageRating'];
  for (const field of fields) {
    if (!Number.isFinite(adjustments[field])) continue;
    const value = Number(summary[field] ?? 0) + adjustments[field];
    result[field] = field === 'averageRating'
      ? Number(Math.max(0, Math.min(5, value)).toFixed(1))
      : Math.max(0, Math.round(value));
  }
  return result;
}

export function setPlayerStatTotals(player, scope, automaticSummary, values) {
  if (!['league', 'preseason'].includes(scope)) throw new TypeError('El ámbito de estadísticas no es válido.');
  const integerFields = new Set(['goals', 'assists', 'yellowCards', 'redCards', 'injuries', 'incidents', 'callups', 'rotations', 'late', 'absent', 'minutes']);
  const allowedFields = new Set([...integerFields, 'averageRating']);
  const adjustments = { ...(player.statAdjustments?.[scope] ?? {}) };
  for (const [field, rawValue] of Object.entries(values ?? {})) {
    if (!allowedFields.has(field)) continue;
    const target = Number(rawValue);
    if (!Number.isFinite(target) || target < 0 || (integerFields.has(field) && !Number.isInteger(target))) {
      throw new RangeError(`La estadística ${field} debe ser no negativa${integerFields.has(field) ? ' y entera' : ''}.`);
    }
    if (field === 'averageRating' && target > 5) throw new RangeError('La media debe estar entre 0 y 5.');
    const difference = Number((target - Number(automaticSummary[field] ?? 0)).toFixed(1));
    if (difference === 0) delete adjustments[field];
    else adjustments[field] = difference;
  }
  const statAdjustments = { ...(player.statAdjustments ?? {}) };
  if (Object.keys(adjustments).length) statAdjustments[scope] = adjustments;
  else delete statAdjustments[scope];
  return { ...player, statAdjustments };
}

export function derivePlayerMatchStats(playerId, matches) {
  if (!Array.isArray(matches)) throw new TypeError('Los partidos deben ser una lista.');
  const seasonMinutes = {};
  const preseasonMinutes = {};
  const ratingHistory = [];
  const minuteReasons = [];
  let totalMinutes = 0;
  for (const match of matches) {
    const playedSeconds = match.minuteTotals?.[playerId];
    if (Number.isFinite(playedSeconds)) {
      const minutes = Math.round(playedSeconds / 60);
      let season;
      try { season = seasonKey(match.date); } catch { season = '2026-2027'; }
      const bucket = isPreseasonMatch(match) ? preseasonMinutes : seasonMinutes;
      bucket[season] = (bucket[season] ?? 0) + minutes;
      totalMinutes += minutes;
    }
    const rating = match.ratings?.[playerId];
    if (Number.isFinite(rating)) ratingHistory.push({ matchId: match.id, date: match.date, opponent: match.opponent ?? '', rating });
    const reason = match.minuteReasons?.[playerId];
    if (reason) {
      let season;
      try { season = seasonKey(match.date); } catch { season = '2026-2027'; }
      minuteReasons.push({ matchId: match.id, date: match.date, season, reason });
    }
  }
  return { totalMinutes, seasonMinutes, preseasonMinutes, ratingHistory, minuteReasons };
}

export function calculatePlayerCallupMinutes({
  playerId,
  matches = [],
  callups = [],
  defaultDuration = 70,
  totalCallups = null,
  playedMinutes = 0,
}) {
  let possibleMinutes = 0;
  const countedMatchIds = new Set();

  if (Array.isArray(matches)) {
    for (const match of matches) {
      if (!match || match.status === 'planned' || (match.status !== 'finished' && !match.minuteTotals)) {
        continue;
      }
      const relatedCallup = Array.isArray(callups)
        ? callups.find((c) => (match.callupId && c?.id === match.callupId) || c?.matchId === match.id || c?.id === match.id)
        : null;
      const wasCalled = Boolean(
        (relatedCallup?.availableIds && relatedCallup.availableIds.includes(playerId)) ||
        (match.minuteTotals && Number.isFinite(match.minuteTotals[playerId]) && match.minuteTotals[playerId] > 0)
      );

      if (wasCalled) {
        countedMatchIds.add(match.id);
        const matchDuration = match.format === 'F11' ? 90 : (match.format === 'F7' ? 70 : (defaultDuration || 70));
        possibleMinutes += matchDuration;
      }
    }
  }

  if (Number.isFinite(totalCallups) && totalCallups > countedMatchIds.size) {
    const remainingCallups = totalCallups - countedMatchIds.size;
    possibleMinutes += remainingCallups * defaultDuration;
  }

  const safePlayedMinutes = Math.max(0, Math.round(Number(playedMinutes) || 0));
  possibleMinutes = Math.max(possibleMinutes, safePlayedMinutes);

  const percent = possibleMinutes > 0
    ? Math.min(100, Math.round((safePlayedMinutes / possibleMinutes) * 100))
    : 0;

  const effectiveCallups = Number.isFinite(totalCallups) && totalCallups > 0
    ? Math.max(totalCallups, countedMatchIds.size)
    : countedMatchIds.size;
  const averageMinutesPerCallup = effectiveCallups > 0
    ? Math.round(safePlayedMinutes / effectiveCallups)
    : 0;

  return {
    possibleMinutes,
    playedMinutes: safePlayedMinutes,
    percent,
    matchesCounted: countedMatchIds.size,
    totalCallups: effectiveCallups,
    averageMinutesPerCallup,
  };
}

export function removeMatchFromPlayerStats(player, match, matches = null) {
  if (Array.isArray(matches)) {
    return { ...player, ...derivePlayerMatchStats(player.id, matches.filter((item) => item.id !== match.id)) };
  }
  const playedSeconds = match.minuteTotals?.[player.id];
  const seasonMinutes = { ...(player.seasonMinutes ?? {}) };
  const preseasonMinutes = { ...(player.preseasonMinutes ?? {}) };
  let totalMinutes = player.totalMinutes ?? 0;
  if (Number.isFinite(playedSeconds)) {
    const minutes = Math.round(playedSeconds / 60);
    const season = seasonKey(match.date);
    const bucket = isPreseasonMatch(match) ? preseasonMinutes : seasonMinutes;
    bucket[season] = Math.max(0, (bucket[season] ?? 0) - minutes);
    if (bucket[season] === 0) delete bucket[season];
    totalMinutes = Math.max(0, totalMinutes - minutes);
  }
  return {
    ...player,
    totalMinutes,
    seasonMinutes,
    preseasonMinutes,
    ratingHistory: (player.ratingHistory ?? []).filter((item) => item.matchId !== match.id),
    minuteReasons: (player.minuteReasons ?? []).filter((item) => item.matchId !== match.id),
  };
}

export function adjustLiveScore(details, team, delta) {
  if (!['for', 'against'].includes(team) || !Number.isInteger(delta)) throw new TypeError('El ajuste del marcador no es válido.');
  const next = structuredClone(details);
  next.goals ??= [];
  const field = team === 'for' ? 'goalsFor' : 'goalsAgainst';
  next[field] = Math.max(0, (Number(next[field]) || 0) + delta);
  if (team === 'for' && delta < 0) next.goals.splice(Math.max(0, next.goals.length + delta), Math.abs(delta));
  return next;
}

export function addPlayerMatchEvent(details, event) {
  const allowedKinds = ['goal', 'penalty_goal', 'penalty_miss', 'penalty_saved', 'penalty_conceded', 'own_goal', 'yellow', 'red', 'injury', 'incident'];
  if (!event?.playerId || !allowedKinds.includes(event.kind)) throw new TypeError('La incidencia del partido no es válida.');
  const next = structuredClone(details);
  for (const field of ['goals', 'cards', 'injuries', 'incidents']) next[field] ??= [];
  const { kind, ...entry } = event;
  if (kind === 'goal' || kind === 'own_goal') {
    next.goals.push(entry);
    next.goalsFor = (Number(next.goalsFor) || 0) + 1;
  } else if (kind === 'penalty_goal') {
    next.goals.push({ ...entry, isPenalty: true });
    next.goalsFor = (Number(next.goalsFor) || 0) + 1;
  } else if (kind === 'penalty_miss') {
    next.incidents.push({ ...entry, type: 'penalty_miss', note: entry.note || 'Penalti fallado' });
  } else if (kind === 'penalty_saved') {
    next.incidents.push({ ...entry, type: 'penalty_saved', note: entry.note || 'Penalti parado' });
  } else if (kind === 'penalty_conceded') {
    next.incidents.push({ ...entry, type: 'penalty_conceded', note: entry.note || 'Penalti encajado' });
    next.goalsAgainst = (Number(next.goalsAgainst) || 0) + 1;
  } else if (kind === 'injury') next.injuries.push(entry);
  else if (kind === 'incident') next.incidents.push(entry);
  else next.cards.push({ ...entry, type: kind });
  return next;
}

export function removePlayerMatchEvent(details, eventId) {
  if (!details || !eventId) return details;
  const next = structuredClone(details);
  for (const field of ['goals', 'cards', 'injuries', 'incidents']) next[field] ??= [];

  const goalIdx = next.goals.findIndex((g) => g.id === eventId);
  if (goalIdx >= 0) {
    next.goals.splice(goalIdx, 1);
    next.goalsFor = Math.max(0, (Number(next.goalsFor) || 0) - 1);
    return next;
  }

  const incidentIdx = next.incidents.findIndex((i) => i.id === eventId);
  if (incidentIdx >= 0) {
    const item = next.incidents[incidentIdx];
    if (item.type === 'penalty_conceded') {
      next.goalsAgainst = Math.max(0, (Number(next.goalsAgainst) || 0) - 1);
    }
    next.incidents.splice(incidentIdx, 1);
    return next;
  }

  const cardIdx = next.cards.findIndex((c) => c.id === eventId);
  if (cardIdx >= 0) {
    next.cards.splice(cardIdx, 1);
    return next;
  }

  const injuryIdx = next.injuries.findIndex((inj) => inj.id === eventId);
  if (injuryIdx >= 0) {
    next.injuries.splice(injuryIdx, 1);
    return next;
  }

  return next;
}

export function applySubstitution(onFieldIds, outIds, inIds, availableIds, maxChanges = 3) {
  if (outIds.length !== inIds.length) throw new RangeError('Debe salir y entrar el mismo número de jugadores.');
  if (!Number.isInteger(maxChanges) || maxChanges < 1 || outIds.length < 1 || outIds.length > maxChanges) {
    throw new RangeError(`Cada cambio debe incluir entre uno y ${maxChanges} jugadores.`);
  }
  const onField = new Set(onFieldIds);
  const available = new Set(availableIds);
  if (outIds.some((id) => !onField.has(id)) || inIds.some((id) => onField.has(id))) {
    throw new RangeError('La selección de entradas y salidas no coincide con el estado del campo.');
  }
  if ([...outIds, ...inIds].some((id) => !available.has(id))) throw new RangeError('El cambio contiene un jugador no convocado.');
  return onFieldIds.filter((id) => !outIds.includes(id)).concat(inIds);
}

export function suggestDelegateSubstitution(onFieldIds, benchIds, playedSeconds, count = 1, keeperIds = []) {
  if (!Number.isInteger(count) || count < 1) throw new RangeError('El número de cambios debe ser positivo.');
  const keepers = new Set(Array.isArray(keeperIds) ? keeperIds : []);
  const eligibleOnField = onFieldIds.filter((id) => !keepers.has(id));
  const eligibleBench = benchIds.filter((id) => !keepers.has(id));
  const size = Math.min(count, eligibleOnField.length, eligibleBench.length);
  const byMostPlayed = [...eligibleOnField].sort((a, b) => (playedSeconds[b] ?? 0) - (playedSeconds[a] ?? 0) || String(a).localeCompare(String(b)));
  const byLeastPlayed = [...eligibleBench].sort((a, b) => (playedSeconds[a] ?? 0) - (playedSeconds[b] ?? 0) || String(a).localeCompare(String(b)));
  return { outIds: byMostPlayed.slice(0, size), inIds: byLeastPlayed.slice(0, size) };
}

export function summarizeMinuteTargets(targets) {
  if (!Array.isArray(targets)) throw new TypeError('Los objetivos de minutos deben ser una lista.');
  const counts = new Map();
  for (const target of targets) {
    const minutes = Number(target?.minutes);
    if (!Number.isFinite(minutes)) continue;
    counts.set(minutes, (counts.get(minutes) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([minutes, count]) => ({ minutes, count }))
    .sort((a, b) => b.minutes - a.minutes);
}

export function suggestRepartoSubstitutions(onFieldIds, benchIds, playedSeconds, targets, keeperIds = []) {
  if (!Array.isArray(onFieldIds) || !Array.isArray(benchIds) || !Array.isArray(targets)) {
    throw new TypeError('Campo, banquillo y objetivos deben ser listas.');
  }
  const keepers = new Set(Array.isArray(keeperIds) ? keeperIds : []);
  const targetByPlayer = new Map(targets.map((target) => [target.playerId, Number(target.minutes) * 60]));
  const targetOf = (id) => targetByPlayer.get(id) ?? 0;
  // Jugadores del banquillo (sin porteros) que aún no alcanzan su objetivo, ordenados por mayor déficit.
  const benchBelow = benchIds
    .filter((id) => !keepers.has(id) && (playedSeconds[id] ?? 0) < targetOf(id))
    .sort((a, b) => (targetOf(a) - (playedSeconds[a] ?? 0)) - (targetOf(b) - (playedSeconds[b] ?? 0)));
  // Jugadores en campo (sin porteros) que ya superan su objetivo, ordenados por mayor exceso.
  const fieldAbove = onFieldIds
    .filter((id) => !keepers.has(id) && (playedSeconds[id] ?? 0) > targetOf(id))
    .sort((a, b) => (playedSeconds[b] ?? 0) - (playedSeconds[a] ?? 0));
  const size = Math.min(benchBelow.length, fieldAbove.length);
  return { outIds: fieldAbove.slice(0, size), inIds: benchBelow.slice(0, size) };
}

export function shouldSuggestUrgentSubstitution(benchIds, playedSeconds, remainingSeconds) {
  return remainingSeconds <= 10 * 60
    && remainingSeconds >= 0
    && benchIds.some((id) => (playedSeconds[id] ?? 0) <= 8 * 60);
}

export function seasonKey(dateValue) {
  const match = /^(\d{4})-(\d{2})/.exec(String(dateValue ?? ''));
  if (!match) throw new TypeError('La fecha del partido no es válida.');
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) throw new TypeError('La fecha del partido no es válida.');
  const startYear = month >= 7 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

// Un partido es de pretemporada cuando es amistoso o torneo (no liga).
export function isPreseasonMatch(match = {}) {
  return match.type === 'friendly' || match.type === 'tournament';
}

export function accumulateSeasonMinutes(player, matchDate, playedSeconds, context = {}) {
  if (!Number.isFinite(playedSeconds) || playedSeconds < 0) {
    throw new RangeError('Los segundos jugados no son válidos.');
  }
  const allowedReasons = new Set(['discipline', 'absence', 'illness', 'goalkeeper_rotation', 'sin_indicar']);
  if (context.reason && !allowedReasons.has(context.reason)) {
    throw new TypeError('El motivo de menos minutos no es válido.');
  }
  const season = seasonKey(matchDate);
  const minutes = Math.round(playedSeconds / 60);
  const preseason = Boolean(context.preseason);
  const seasonMinutes = { ...(player.seasonMinutes ?? {}) };
  const preseasonMinutes = { ...(player.preseasonMinutes ?? {}) };
  if (preseason) {
    preseasonMinutes[season] = (preseasonMinutes[season] ?? 0) + minutes;
  } else {
    seasonMinutes[season] = (seasonMinutes[season] ?? 0) + minutes;
  }
  const minuteReasons = [...(player.minuteReasons ?? [])];
  if (context.reason) {
    minuteReasons.push({ matchId: context.matchId, date: matchDate, season, reason: context.reason });
  }
  return {
    ...player,
    totalMinutes: (player.totalMinutes ?? 0) + minutes,
    seasonMinutes,
    preseasonMinutes,
    minuteReasons,
  };
}

function latestPlayerRatingHistory(history, entry) {
  const candidates = [...(Array.isArray(history) ? history : []).filter((item) => item?.matchId !== entry.matchId), entry]
    .filter((item) => item?.matchId && item?.date && Number.isFinite(item.rating))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.matchId).localeCompare(String(b.matchId)));
  return candidates.length ? [candidates.at(-1)] : [];
}

export function buildPlayerRatings(players, values, metadata = {}) {
  if (!roleCanUseOwnerFeatures(metadata.role)) throw new TypeError('Solo Migue puede puntuar a los jugadores.');
  if (!Array.isArray(players) || !players.length) throw new TypeError('Debe haber jugadores para puntuar.');
  if (!metadata.matchId || !metadata.date) throw new TypeError('La puntuación debe estar vinculada a un partido.');

  const ratings = {};
  const updatedPlayers = players.map((player) => {
    const rawRating = values[player.id];
    if (rawRating === undefined || rawRating === null || rawRating === '') {
      throw new TypeError('Debes puntuar a todos los jugadores.');
    }
    const rating = Number(rawRating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new RangeError('Cada puntuación debe ser un número entero entre 1 y 5.');
    }
    ratings[player.id] = rating;
    const entry = { matchId: metadata.matchId, date: metadata.date, opponent: metadata.opponent ?? '', rating };
    return { ...player, ratingHistory: latestPlayerRatingHistory(player.ratingHistory, entry) };
  });

  return { ratings, players: updatedPlayers };
}

export function replacePlayerRatings(players, values, metadata = {}) {
  if (!roleCanUseOwnerFeatures(metadata.role)) throw new TypeError('Solo Migue puede puntuar a los jugadores.');
  if (!Array.isArray(players) || !players.length) throw new TypeError('Debe haber jugadores para puntuar.');
  if (!metadata.matchId || !metadata.date) throw new TypeError('La puntuación debe estar vinculada a un partido.');

  const ratings = {};
  const updatedPlayers = players.map((player) => {
    const rawRating = values[player.id];
    if (rawRating === undefined || rawRating === null || rawRating === '') {
      throw new TypeError('Debes puntuar a todos los jugadores.');
    }
    const rating = Number(rawRating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new RangeError('Cada puntuación debe ser un número entero entre 1 y 5.');
    }
    ratings[player.id] = rating;
    const entry = { matchId: metadata.matchId, date: metadata.date, opponent: metadata.opponent ?? '', rating };
    return { ...player, ratingHistory: latestPlayerRatingHistory(player.ratingHistory, entry) };
  });

  return { ratings, players: updatedPlayers };
}

export function shouldAutoPause(phase, elapsedSeconds) {
  if (!Number.isFinite(elapsedSeconds)) return false;
  if (phase === 'first_half') return elapsedSeconds >= 38 * 60;
  if (phase === 'second_half') return elapsedSeconds >= 74 * 60;
  return false;
}

function validatePin(pin) {
  if (!/^\d+$/.test(String(pin))) throw new TypeError('El PIN debe ser numérico.');
  if (String(pin).length < 4 || String(pin).length > 8) throw new RangeError('El PIN debe tener entre 4 y 8 cifras.');
}

// SHA-256 en JavaScript puro (respaldo para entornos sin crypto.subtle, como el
// panel de previsualización del chat). Produce el mismo digest que WebCrypto.
function sha256Pure(bytes) {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const len = bytes.length;
  const bitLen = len * 8;
  const withOne = new Uint8Array(len + 1);
  withOne.set(bytes);
  withOne[len] = 0x80;
  const paddedLen = Math.ceil((len + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(withOne);
  const dv = new DataView(padded.buffer);
  dv.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  dv.setUint32(paddedLen - 4, bitLen >>> 0, false);

  const w = new Uint32Array(64);
  for (let i = 0; i < paddedLen; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4, false);
    for (let t = 16; t < 64; t++) {
      const s0 = (w[t - 15] >>> 7 | w[t - 15] << 25) ^ (w[t - 15] >>> 18 | w[t - 15] << 14) ^ (w[t - 15] >>> 3);
      const s1 = (w[t - 2] >>> 17 | w[t - 2] << 15) ^ (w[t - 2] >>> 19 | w[t - 2] << 13) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
      const S0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  return H.map((x) => x.toString(16).padStart(8, '0')).join('');
}

export async function hashPin(pin, salt) {
  validatePin(pin);
  if (!salt) throw new TypeError('Falta la sal local del PIN.');
  const bytes = new TextEncoder().encode(`${salt}:${pin}`);
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return sha256Pure(bytes);
}

export async function verifyPin(pin, salt, expectedDigest) {
  try {
    const actual = await hashPin(pin, salt);
    if (actual.length !== String(expectedDigest ?? '').length) return false;
    let difference = 0;
    for (let index = 0; index < actual.length; index += 1) {
      difference |= actual.charCodeAt(index) ^ expectedDigest.charCodeAt(index);
    }
    return difference === 0;
  } catch {
    return false;
  }
}

export function calculatePlayedSeconds(initialOnField, events, finalSecond) {
  if (!Number.isFinite(finalSecond) || finalSecond < 0) {
    throw new RangeError('El final del partido no es válido.');
  }
  const onField = new Set(initialOnField);
  const totals = Object.fromEntries(initialOnField.map((id) => [id, 0]));
  let previousSecond = 0;
  const orderedEvents = [...events].sort((a, b) => a.second - b.second);
  for (const event of orderedEvents) {
    if (event.second < previousSecond || event.second > finalSecond) {
      throw new RangeError('Hay un cambio fuera del tiempo de partido.');
    }
    for (const id of onField) totals[id] = (totals[id] ?? 0) + event.second - previousSecond;
    for (const id of event.outIds ?? []) onField.delete(id);
    for (const id of event.inIds ?? []) {
      onField.add(id);
      totals[id] ??= 0;
    }
    previousSecond = event.second;
  }
  for (const id of onField) totals[id] = (totals[id] ?? 0) + finalSecond - previousSecond;
  return totals;
}

export function validateBackup(backup) {
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
    throw new TypeError('La copia no contiene un objeto válido.');
  }
  if (backup.app !== 'CampoBase') throw new TypeError('La copia no pertenece a CampoBase.');
  if (backup.version !== 1) throw new TypeError('La versión de la copia no es compatible.');
  if (!backup.data || BACKUP_STORES.some((store) => !Array.isArray(backup.data[store]))) {
    throw new TypeError('La copia está incompleta.');
  }
  return backup;
}

export function formatMatchClock(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

export function getPlayerSetPieceRoles(playerId, setPieces = {}) {
  if (!playerId || typeof setPieces !== 'object' || setPieces === null) return [];
  const roles = [];
  if (setPieces.penalties?.primary === playerId) roles.push({ id: 'penalty_1', label: '1.er Penalti', icon: '🎯', title: '1.er lanzador de penaltis' });
  else if (setPieces.penalties?.secondary === playerId) roles.push({ id: 'penalty_2', label: '2.º Penalti', icon: '🎯', title: '2.º lanzador de penaltis' });

  if (setPieces.freeKicksLeft?.primary === playerId) roles.push({ id: 'freekick_l_1', label: '1.ª Falta Izq.', icon: '⚡', title: '1.er lanzador de faltas perfil izquierdo (diestro)' });
  else if (setPieces.freeKicksLeft?.secondary === playerId) roles.push({ id: 'freekick_l_2', label: '2.ª Falta Izq.', icon: '⚡', title: '2.º lanzador de faltas perfil izquierdo' });

  if (setPieces.freeKicksRight?.primary === playerId) roles.push({ id: 'freekick_r_1', label: '1.ª Falta Der.', icon: '⚡', title: '1.er lanzador de faltas perfil derecho (zurdo)' });
  else if (setPieces.freeKicksRight?.secondary === playerId) roles.push({ id: 'freekick_r_2', label: '2.ª Falta Der.', icon: '⚡', title: '2.º lanzador de faltas perfil derecho' });

  if (setPieces.cornersLeft?.primary === playerId) roles.push({ id: 'corner_l_1', label: '1.er Córner Izq.', icon: '📐', title: '1.er lanzador de córners banda izquierda' });
  else if (setPieces.cornersLeft?.secondary === playerId) roles.push({ id: 'corner_l_2', label: '2.º Córner Izq.', icon: '📐', title: '2.º lanzador de córners banda izquierda' });

  if (setPieces.cornersRight?.primary === playerId) roles.push({ id: 'corner_r_1', label: '1.er Córner Der.', icon: '📐', title: '1.er lanzador de córners banda derecha' });
  else if (setPieces.cornersRight?.secondary === playerId) roles.push({ id: 'corner_r_2', label: '2.º Córner Der.', icon: '📐', title: '2.º lanzador de córners banda derecha' });

  if (setPieces.captains?.primary === playerId) roles.push({ id: 'captain_1', label: '1.er Capitán', icon: '©️', title: '1.er capitán' });
  else if (setPieces.captains?.secondary === playerId) roles.push({ id: 'captain_2', label: '2.º Capitán', icon: '©️', title: '2.º capitán' });
  else if (setPieces.captains?.third === playerId) roles.push({ id: 'captain_3', label: '3.er Capitán', icon: '©️', title: '3.er capitán' });

  return roles;
}

export function buildSquadLeaderboards({
  players = [],
  matches = [],
  attendanceRecords = [],
  callups = [],
  scope = 'all',
  defaultDuration = 70,
}) {
  if (!Array.isArray(players)) throw new TypeError('Los jugadores deben ser una lista.');
  const currentMatchIds = new Set((matches || []).map((m) => m?.id).filter(Boolean));
  const currentCallups = (callups || []).filter((c) => !c?.matchId || currentMatchIds.has(c.matchId));
  const currentTrainings = (attendanceRecords || []).filter((r) => !r?.matchId || currentMatchIds.has(r.matchId));

  const statsList = players.map((player) => {
    let summary;
    if (scope === 'league') {
      const automatic = buildPlayerSummary(player.id, matches, currentTrainings, currentCallups, 'league');
      summary = applyPlayerStatAdjustments(automatic, player.statAdjustments?.league);
    } else if (scope === 'preseason') {
      const automatic = buildPlayerSummary(player.id, matches, currentTrainings, currentCallups, 'preseason');
      summary = applyPlayerStatAdjustments(automatic, player.statAdjustments?.preseason);
    } else {
      const leagueAuto = buildPlayerSummary(player.id, matches, currentTrainings, currentCallups, 'league');
      const league = applyPlayerStatAdjustments(leagueAuto, player.statAdjustments?.league);
      const preAuto = buildPlayerSummary(player.id, matches, currentTrainings, currentCallups, 'preseason');
      const preseason = applyPlayerStatAdjustments(preAuto, player.statAdjustments?.preseason);
      summary = {
        goals: (league.goals ?? 0) + (preseason.goals ?? 0),
        assists: (league.assists ?? 0) + (preseason.assists ?? 0),
        yellowCards: (league.yellowCards ?? 0) + (preseason.yellowCards ?? 0),
        redCards: (league.redCards ?? 0) + (preseason.redCards ?? 0),
        callups: (league.callups ?? 0) + (preseason.callups ?? 0),
        rotations: (league.rotations ?? 0) + (preseason.rotations ?? 0),
        minutes: (league.minutes ?? 0) + (preseason.minutes ?? 0),
        averageRating: league.averageRating ?? preseason.averageRating ?? null,
      };
    }

    const scopedMatches = scope === 'all'
      ? matches
      : matches.filter((m) => scope === 'preseason' ? isPreseasonMatch(m) : !isPreseasonMatch(m));
    const scopedCallups = scope === 'all'
      ? currentCallups
      : currentCallups.filter((c) => {
          const m = c.matchId ? matches.find((item) => item.id === c.matchId) : null;
          return scope === 'preseason' ? (m ? isPreseasonMatch(m) : isPreseasonMatch({ type: c.matchType })) : (m ? !isPreseasonMatch(m) : !isPreseasonMatch({ type: c.matchType }));
        });

    const callupInfo = calculatePlayerCallupMinutes({
      playerId: player.id,
      matches: scopedMatches,
      callups: scopedCallups,
      defaultDuration,
      totalCallups: summary.callups,
      playedMinutes: summary.minutes,
    });

    const isKeeper = (player.positions ?? []).some((pos) => String(pos).toLowerCase().includes('portero'))
      || String(player.name || '').toLowerCase().includes('ramiro');

    return {
      player,
      summary,
      callupInfo,
      isKeeper,
    };
  });

  // Pichichi
  const topScorers = [...statsList]
    .sort((a, b) => (b.summary.goals - a.summary.goals) || (a.summary.minutes - b.summary.minutes) || String(a.player.name).localeCompare(String(b.player.name)));

  // Asistencias
  const topAssists = [...statsList]
    .sort((a, b) => (b.summary.assists - a.summary.assists) || (a.summary.minutes - b.summary.minutes) || String(a.player.name).localeCompare(String(b.player.name)));

  // Zamora / Porteros
  const candidateMatches = scope === 'all'
    ? matches
    : matches.filter((x) => scope === 'preseason' ? isPreseasonMatch(x) : !isPreseasonMatch(x));

  const goalkeepers = statsList
    .map((item) => {
      let keeperGoalsAgainst = 0;
      let matchesWithKeeper = 0;
      for (const m of candidateMatches) {
        if (!m || (m.status !== 'finished' && !m.minuteTotals)) continue;
        const playedSec = m.minuteTotals?.[item.player.id];
        const isRotatedKeeper = m.goalkeeperRotation && (m.goalkeeperRotation.firstKeeper === item.player.id || m.goalkeeperRotation.secondKeeper === item.player.id);
        const playedInGoal = isRotatedKeeper || (item.isKeeper && Number.isFinite(playedSec) && playedSec > 0);
        if (playedInGoal) {
          matchesWithKeeper++;
          const ga = Number.isFinite(m.goalsAgainst) ? m.goalsAgainst : 0;
          keeperGoalsAgainst += ga;
        }
      }
      const coefficient = matchesWithKeeper > 0 ? Number((keeperGoalsAgainst / matchesWithKeeper).toFixed(2)) : null;
      return {
        ...item,
        keeperMatches: matchesWithKeeper,
        goalsAgainst: keeperGoalsAgainst,
        coefficient,
      };
    })
    .filter((item) => item.isKeeper || item.keeperMatches > 0)
    .sort((a, b) => {
      if (a.coefficient === null && b.coefficient === null) return 0;
      if (a.coefficient === null) return 1;
      if (b.coefficient === null) return -1;
      return (a.coefficient - b.coefficient) || (b.keeperMatches - a.keeperMatches);
    });

  // Reparto equitativo de minutos: ordenado de más a menos promedio min/partido
  const minuteDistribution = [...statsList]
    .sort((a, b) => (b.callupInfo.averageMinutesPerCallup - a.callupInfo.averageMinutesPerCallup)
      || (b.summary.minutes - a.summary.minutes)
      || (b.summary.callups - a.summary.callups)
      || String(a.player.name).localeCompare(String(b.player.name)));

  // Fair Play (tarjetas)
  const fairPlay = [...statsList]
    .map((item) => ({
      ...item,
      totalCards: (item.summary.yellowCards ?? 0) + (item.summary.redCards ?? 0),
      points: ((item.summary.yellowCards ?? 0) * 1) + ((item.summary.redCards ?? 0) * 3),
    }))
    .sort((a, b) => (b.points - a.points) || (b.totalCards - a.totalCards) || String(a.player.name).localeCompare(String(b.player.name)));

  return {
    topScorers,
    topAssists,
    goalkeepers,
    minuteDistribution,
    fairPlay,
  };
}
