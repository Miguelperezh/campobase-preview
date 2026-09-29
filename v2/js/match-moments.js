// A moment stores the whole lineup after its minute, so a substitution and a
// positional swap can be planned together without guessing intermediate states.
export function lineupIds(team = []) {
  return team.map((slot) => slot.playerId).filter(Boolean);
}

export function validLineup(team, availableIds, size = 7) {
  const ids = lineupIds(team);
  return Array.isArray(team) && team.length === size && ids.length === size
    && new Set(ids).size === size && ids.every((id) => availableIds.includes(id));
}

export function describeMoment(before, after) {
  const oldIds = new Set(lineupIds(before.team));
  const newIds = new Set(lineupIds(after.team));
  const outIds = [...oldIds].filter((id) => !newIds.has(id));
  const inIds = [...newIds].filter((id) => !oldIds.has(id));
  const moved = after.team.filter((slot) => oldIds.has(slot.playerId)
    && before.team.find((old) => old.playerId === slot.playerId)?.pos !== slot.pos)
    .map((slot) => ({ playerId: slot.playerId, position: slot.pos }));
  const oldKeeper = before.team.find((slot) => slot.pos === 'Portero')?.playerId || '';
  const newKeeper = after.team.find((slot) => slot.pos === 'Portero')?.playerId || '';
  return { outIds, inIds, moved, keeperId: oldKeeper !== newKeeper ? newKeeper : '',
    formation: before.formation !== after.formation ? after.formation : '' };
}

export function plannedMinutes(moments, duration = 70) {
  const minutes = {};
  const ordered = [...moments].sort((a, b) => a.minute - b.minute);
  for (let index = 0; index < ordered.length; index += 1) {
    const current = ordered[index];
    const end = Math.min(duration, ordered[index + 1]?.minute ?? duration);
    const span = Math.max(0, end - current.minute);
    lineupIds(current.team).forEach((id) => { minutes[id] = (minutes[id] || 0) + span; });
  }
  return minutes;
}

export function normalizeMoments(prep) {
  const initial = { id: 'inicio', minute: 0, formation: prep.formacion || '1-3-2-1',
    team: (prep.team || []).map((slot) => ({ ...slot })) };
  const later = Array.isArray(prep.moments) ? prep.moments.filter((moment) => Number(moment.minute) > 0)
    .map((moment) => ({ id: moment.id, minute: Number(moment.minute),
      formation: moment.formation || initial.formation,
      team: (moment.team || []).map((slot) => ({ ...slot })) })) : [];
  return [initial, ...later.sort((a, b) => a.minute - b.minute)];
}
