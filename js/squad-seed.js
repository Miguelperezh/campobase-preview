// CampoBase ya no precarga nombres, dorsales, posiciones ni contactos de jugadores.
// Cada cuenta empieza con su propia plantilla y estos datos solo los introduce el usuario.
export const OFFICIAL_SQUAD_DATA = [];

export function planSquadSeed(currentPlayers, createdAt = Date.now()) {
  return {
    players: [],
    settings: currentPlayers.length ? [] : [{
      id: 'squad-empty-initialized',
      recordType: 'migration',
      version: 2,
      createdAt,
    }],
  };
}
