// Pizarra táctica en vivo (Fase A): asigna jugadores REALES de la plantilla a las
// posiciones de una formación F7, con rival enfrentado en la mitad superior,
// porterías, intercambio de jugador (nunca dos posiciones), suplentes abajo,
// no convocados fuera, portero solo Migue, selector de táctica que conserva
// asignados, pizarra ampliada interactiva y GIF/MP4 según la formación.
//
// Este módulo expone funciones PURAS (testables) y el estado de la pizarra en
// vivo. El wiring al DOM (render, eventos de puntero, lightbox) vive en app.js.
// No toca el motor de cambios automáticos (renderLive/renderDelegate/applySubstitution).

import { defaultTactic, FORMATION_NAMES } from './tactics.js';

// Formaciones F7 disponibles en la pizarra en vivo (las que tienen MP4 asociado).
export const LIVE_FORMATIONS = Object.freeze(['1-3-2-1', '1-2-3-1', '1-2-2-2', '1-2-1-3', '1-1-3-2', '1-3-3', '1-3-1-2', '1-1-3-1-1', '1-1-4-1', '1-4-1-1', '1-2-2-1-1']);

// MP4 de cada formación (el GIF/MP4 debe seguir la táctica seleccionada).
export const TACTICA_MP4 = Object.freeze({
  '1-3-2-1': 'assets/tacticas/CAMPOBASE-TACTICA-01-1-3-2-1/CampoBase_Tactica_01_Sistema_Base_1-3-2-1.mp4',
  '1-2-3-1': 'assets/tacticas/CAMPOBASE-TACTICA-03-1-2-3-1/CampoBase_Tactica_03_Variante_1-2-3-1.mp4',
  '1-2-2-2': 'assets/tacticas/CAMPOBASE-TACTICA-04-1-2-2-2/CampoBase_Tactica_04_Variante_1-2-2-2.mp4',
  '1-2-1-3': 'assets/tacticas/CAMPOBASE-TACTICA-1213/CampoBase_Tactica_1-2-1-3.mp4',
  '1-1-3-2': 'assets/tacticas/CAMPOBASE-TACTICA-1132-GUIA-COMPLETA/CampoBase_Tactica_1-1-3-2.mp4',
  '1-3-3': 'assets/tacticas/CAMPOBASE-TACTICA-133/CampoBase_Tactica_1-3-3.mp4',
  '1-3-1-2': 'assets/tacticas/CAMPOBASE-TACTICA-1312/CampoBase_Tactica_1-3-1-2.mp4',
  '1-1-3-1-1': 'assets/tacticas/CAMPOBASE-TACTICA-11311/CampoBase_Tactica_1-1-3-1-1.mp4',
  '1-1-4-1': 'assets/tacticas/CAMPOBASE-TACTICA-1141/CampoBase_Tactica_1-1-4-1.mp4',
  '1-4-1-1': 'assets/tacticas/CAMPOBASE-TACTICA-1411/CampoBase_Tactica_1-4-1-1.mp4',
  '1-2-2-1-1': 'assets/tacticas/CAMPOBASE-TACTICA-12211/CampoBase_Tactica_1-2-2-1-1.mp4',
});

// Nombre corto: primer token + inicial del primer apellido (p. ej. "Alejandro P.").
export function nombreCorto(name) {
  const parts = String(name ?? '').trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  // Detectar nombres compuestos comunes en español (ej. Juan Carlos, José Antonio, Miguel Ángel)
  const compoundFirsts = new Set(['juan', 'jose', 'josé', 'miguel', 'francisco', 'victor', 'víctor', 'luis', 'carlos', 'angel', 'ángel', 'maria', 'maría']);
  let firstName = parts[0];
  let surname = parts[1];
  if (parts.length >= 3 && compoundFirsts.has(parts[0].toLowerCase())) {
    firstName = `${parts[0]} ${parts[1]}`;
    surname = parts[2];
  }
  return surname ? `${firstName} ${surname[0].toUpperCase()}.` : firstName;
}

// Detecta si un jugador es portero por su posición.
export function isKeeper(player) {
  return Array.isArray(player?.positions) && player.positions.map((p) => String(p).trim()).includes('Portero');
}

// Busca un jugador por id (null si no existe).
export function playerById(players, id) {
  return players.find((p) => p.id === id) ?? null;
}

// Rival en la mitad superior (enfrentado, no encima): todas las Y < 50.
export const LIVE_OPPONENT = Object.freeze([
  { n: '1', x: 50, y: 10 },
  { n: '2', x: 30, y: 24 },
  { n: '3', x: 50, y: 20 },
  { n: '4', x: 70, y: 24 },
  { n: '5', x: 30, y: 40 },
  { n: '6', x: 70, y: 40 },
  { n: '7', x: 50, y: 44 },
]);

// Formaciones F7 en vivo: mi equipo en la mitad inferior (enfrentado al rival
// de la mitad superior). Coordenadas aprobadas en la preview de referencia.
const LIVE_FORMATION_TEAMS = Object.freeze({
  '1-3-2-1': [
    { n: '1', pos: 'Portero', x: 50, y: 90 },
    { n: '3', pos: 'Defensa izq.', x: 25, y: 74 },
    { n: '4', pos: 'Central', x: 50, y: 78 },
    { n: '2', pos: 'Defensa der.', x: 75, y: 74 },
    { n: '11', pos: 'Medio/banda izq.', x: 30, y: 58 },
    { n: '7', pos: 'Medio/banda der.', x: 70, y: 58 },
    { n: '9', pos: 'Delantero', x: 50, y: 46 },
  ],
  '1-2-3-1': [
    { n: '1', pos: 'Portero', x: 50, y: 90 },
    { n: '3', pos: 'Defensa izq.', x: 30, y: 76 },
    { n: '2', pos: 'Defensa der.', x: 70, y: 76 },
    { n: '4', pos: 'Mediocentro', x: 50, y: 62 },
    { n: '11', pos: 'Medio/banda izq.', x: 30, y: 50 },
    { n: '7', pos: 'Medio/banda der.', x: 70, y: 50 },
    { n: '9', pos: 'Delantero', x: 50, y: 40 },
  ],
  '1-2-2-2': [
    { n: '1', pos: 'Portero', x: 50, y: 90 },
    { n: '3', pos: 'Defensa izq.', x: 30, y: 76 },
    { n: '2', pos: 'Defensa der.', x: 70, y: 76 },
    { n: '4', pos: 'Medio', x: 40, y: 60 },
    { n: '7', pos: 'Medio', x: 60, y: 60 },
    { n: '11', pos: 'Delantero izq.', x: 35, y: 42 },
    { n: '9', pos: 'Delantero der.', x: 65, y: 42 },
  ],
  '1-2-1-3': [
    { n: '1', pos: 'Portero', x: 50, y: 90 },
    { n: '3', pos: 'Defensa izq.', x: 30, y: 76 },
    { n: '2', pos: 'Defensa der.', x: 70, y: 76 },
    { n: '4', pos: 'Mediocentro', x: 50, y: 60 },
    { n: '7', pos: 'Delantero izq.', x: 25, y: 42 },
    { n: '9', pos: 'Delantero centro', x: 50, y: 38 },
    { n: '11', pos: 'Delantero der.', x: 75, y: 42 },
  ],
  '1-1-3-2': [
    { n: '1', pos: 'Portero', x: 50, y: 90 },
    { n: '5', pos: 'Defensa', x: 50, y: 74 },
    { n: '11', pos: 'Medio izq.', x: 28, y: 58 },
    { n: '8', pos: 'Mediocentro', x: 50, y: 60 },
    { n: '7', pos: 'Medio der.', x: 72, y: 58 },
    { n: '9', pos: 'Delantero izq.', x: 36, y: 40 },
    { n: '10', pos: 'Delantero der.', x: 64, y: 40 },
  ],
  '1-3-3': [
    { n: '1', pos: 'Portero', x: 50, y: 90 },
    { n: '3', pos: 'Defensa izq.', x: 24, y: 72 },
    { n: '4', pos: 'Defensa central', x: 50, y: 76 },
    { n: '2', pos: 'Defensa der.', x: 76, y: 72 },
    { n: '7', pos: 'Extremo izq.', x: 22, y: 36 },
    { n: '9', pos: 'Delantero centro', x: 50, y: 30 },
    { n: '11', pos: 'Extremo der.', x: 78, y: 36 },
  ],
  '1-3-1-2': [
    { n: '1', pos: 'Portero', x: 50, y: 90 },
    { n: '2', pos: 'Defensa izq.', x: 24, y: 72 },
    { n: '4', pos: 'Defensa central', x: 50, y: 75 },
    { n: '3', pos: 'Defensa der.', x: 76, y: 72 },
    { n: '7', pos: 'Mediocentro', x: 50, y: 55 },
    { n: '11', pos: 'Delantero izq.', x: 34, y: 34 },
    { n: '9', pos: 'Delantero der.', x: 66, y: 34 },
  ],
  '1-1-3-1-1': [
    { n: '1', pos: 'Portero', x: 50, y: 90 },
    { n: '4', pos: 'Defensa', x: 50, y: 76 },
    { n: '2', pos: 'Medio izq.', x: 30, y: 55 },
    { n: '3', pos: 'Medio central', x: 50, y: 58 },
    { n: '7', pos: 'Medio der.', x: 70, y: 55 },
    { n: '11', pos: 'Mediapunta', x: 50, y: 40 },
    { n: '9', pos: 'Delantero', x: 50, y: 30 },
  ],
  '1-1-4-1': [
    { n: '1', pos: 'Portero', x: 50, y: 90 },
    { n: '4', pos: 'Defensa', x: 50, y: 76 },
    { n: '2', pos: 'Medio izq.', x: 25, y: 55 },
    { n: '3', pos: 'Medio interior izq.', x: 40, y: 58 },
    { n: '7', pos: 'Medio interior der.', x: 60, y: 58 },
    { n: '11', pos: 'Medio der.', x: 75, y: 55 },
    { n: '9', pos: 'Delantero', x: 50, y: 30 },
  ],
  '1-4-1-1': [
    { n: '1', pos: 'Portero', x: 50, y: 90 },
    { n: '2', pos: 'Defensa izq.', x: 20, y: 76 },
    { n: '3', pos: 'Central izq.', x: 40, y: 78 },
    { n: '4', pos: 'Central der.', x: 60, y: 78 },
    { n: '5', pos: 'Defensa der.', x: 80, y: 76 },
    { n: '7', pos: 'Medio', x: 50, y: 55 },
    { n: '9', pos: 'Delantero', x: 50, y: 30 },
  ],
  '1-2-2-1-1': [
    { n: '1', pos: 'Portero', x: 50, y: 90 },
    { n: '3', pos: 'Defensa izq.', x: 30, y: 74 },
    { n: '2', pos: 'Defensa der.', x: 70, y: 74 },
    { n: '4', pos: 'Medio izq.', x: 40, y: 58 },
    { n: '7', pos: 'Medio der.', x: 60, y: 58 },
    { n: '11', pos: 'Mediapunta', x: 50, y: 44 },
    { n: '9', pos: 'Delantero', x: 50, y: 30 },
  ],
});

// Construye el estado inicial de la pizarra en vivo: la formación por defecto
// con TODAS las posiciones vacías (todos suplentes). Migue crea la alineación
// inicial asignando jugadores desde la pizarra. El portero va aparte (primer y
// segundo tiempo, en el flujo de preparar partido) y no se auto-asigna aquí.
export function buildLiveState(players, availableIds, formation = '1-3-2-1', format = 'F7', keeperId = '') {
  const base = defaultTactic(format, formation);
  const team = (LIVE_FORMATION_TEAMS[formation] || LIVE_FORMATION_TEAMS['1-3-2-1'])
    .map((p) => ({ ...p, playerId: p.pos === 'Portero' && availableIds.includes(keeperId) ? keeperId : '' }));
  return {
    formacion: formation,
    team,
    opponent: LIVE_OPPONENT.map((p) => ({ ...p })),
    ball: { ...base.ball },
    moves: [],
    tool: 'select',
  };
}

export function applyLineupToLiveTeam(team, onFieldIds, keeperId) {
  const fieldIds = onFieldIds.filter((id) => id !== keeperId);
  let fieldIndex = 0;
  return team.map((position) => ({
    ...position,
    playerId: position.pos === 'Portero' ? keeperId : (fieldIds[fieldIndex++] ?? ''),
  }));
}

export function buildReadyTimerFromPreparation({
  matchId,
  team,
  availableIds,
  firstKeeper,
  secondKeeper,
  delegateShown = false,
}) {
  const safeFirstKeeper = availableIds.includes(firstKeeper)
    ? firstKeeper
    : (availableIds[0] || '');
  const safeSecondKeeper = availableIds.includes(secondKeeper)
    ? secondKeeper
    : safeFirstKeeper;

  const assigned = new Set();
  if (safeFirstKeeper) assigned.add(safeFirstKeeper);
  for (const pos of team) {
    if (pos.playerId && availableIds.includes(pos.playerId) && pos.playerId !== safeFirstKeeper) {
      assigned.add(pos.playerId);
    }
  }

  const unassigned = availableIds.filter((id) => !assigned.has(id) && id !== safeFirstKeeper);
  const onField = [];
  if (safeFirstKeeper) onField.push(safeFirstKeeper);

  for (const pos of team) {
    if (pos.pos === 'Portero') continue;
    let pid = pos.playerId;
    if (!pid || !availableIds.includes(pid) || pid === safeFirstKeeper || onField.includes(pid)) {
      pid = unassigned.shift() || '';
    }
    if (pid && !onField.includes(pid)) {
      onField.push(pid);
    }
  }

  while (onField.length < 7 && unassigned.length > 0) {
    const extra = unassigned.shift();
    if (extra && !onField.includes(extra)) onField.push(extra);
  }

  return {
    matchId,
    elapsed: 0,
    runningSince: null,
    phase: 'ready',
    initialOnField: [...onField],
    onField: [...onField],
    events: [],
    firstKeeper: safeFirstKeeper,
    secondKeeper: safeSecondKeeper,
    autoPaused: false,
    delegateUnlocked: Boolean(delegateShown),
    details: {
      goalsFor: 0,
      goalsAgainst: 0,
      goals: [],
      cards: [],
      injuries: [],
      incidents: [],
      comments: '',
      minuteReasons: {},
    },
  };
}

export function canAssignPlayerToSlot(players, role, position, playerId) {
  if (!playerId) return true;
  const keeper = isKeeper(playerById(players, playerId));
  // Migue y el delegado pueden tocar la portería (causa mayor, p. ej. lesión).
  if (position === 'Portero') return role === 'owner' || role === 'delegate';
  return !keeper;
}

// Asigna un jugador a una posición. Si ya está en otra posición, INTERCAMBIA
// (nunca puede jugar en dos posiciones a la vez). Devuelve un nuevo array.
export function asignarJugador(team, idx, playerId) {
  const otra = team.findIndex((p, i) => i !== idx && p.playerId === playerId);
  const next = team.map((p) => ({ ...p }));
  if (otra !== -1) {
    const jugadorEnIdx = next[idx].playerId;
    next[idx].playerId = playerId;
    next[otra].playerId = jugadorEnIdx;
  } else {
    next[idx].playerId = playerId;
  }
  return next;
}

// Cambia de formación conservando los jugadores ya asignados (no borra a nadie):
// se reasignan en orden a las posiciones de la nueva formación. No auto-asigna
// el portero (va aparte, en el flujo de preparar partido).
export function cargarFormacion(team, players, availableIds, formation, format = 'F7') {
  const base = LIVE_FORMATION_TEAMS[formation] || LIVE_FORMATION_TEAMS['1-3-2-1'];
  const asignados = team.map((p) => p.playerId).filter(Boolean);
  let restoIdx = 0;
  return base.map((p) => {
    const id = asignados[restoIdx] || '';
    if (id) restoIdx++;
    return { ...p, playerId: id };
  });
}

// Opciones de asignación para una posición: titulares primero (arriba), suplentes
// después (abajo), solo convocados. Los no convocados quedan fuera.
export function opcionesPosicion(players, availableIds, team, pos, currentId = '') {
  const titulares = new Set(team.map((p) => p.playerId).filter(Boolean));
  const convocados = players.filter((pl) => availableIds.includes(pl.id) && (pos === 'Portero' ? true : !isKeeper(pl)));
  const orden = [...convocados].sort((a, b) => {
    const aMatch = Array.isArray(a.positions) && a.positions.includes(pos) ? 0 : 1;
    const bMatch = Array.isArray(b.positions) && b.positions.includes(pos) ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return Number(a.number) - Number(b.number);
  });
  return {
    titulares: orden.filter((pl) => titulares.has(pl.id)),
    suplentes: orden.filter((pl) => !titulares.has(pl.id)),
  };
}

// Suplentes: convocados que no están en el campo.
export function suplentes(players, availableIds, team) {
  const titulares = new Set(team.map((p) => p.playerId).filter(Boolean));
  return players.filter((pl) => availableIds.includes(pl.id) && !titulares.has(pl.id));
}

