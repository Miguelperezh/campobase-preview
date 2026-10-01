import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildAttendanceActivities, summarizeAttendance } from '../js/attendance-linked-sources.js';

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('resume presente, tarde y ausente desde la misma fuente de asistencia', () => {
  const summary = summarizeAttendance([
    { attendance: [{ playerId: 'a', status: 'present' }, { playerId: 'b', status: 'late' }] },
    { attendance: [{ playerId: 'a', status: 'absent' }, { playerId: 'b', status: 'present' }] },
  ]);
  assert.deepEqual(summary, { present: 2, late: 1, absent: 1, total: 4 });
});

test('las actividades de Asistencia reutilizan sesiones y partidos sin duplicarlos', () => {
  const rows = buildAttendanceActivities({
    sessions: [{ id: 's1', date: '2026-09-09', name: 'Técnica', blocks: [], totalDuration: 60 }],
    matches: [{ id: 'm1', date: '2026-09-10T18:00', opponent: 'Rival', type: 'league', callupId: 'c1' }],
    callups: [{ id: 'c1', matchId: 'm1', availableIds: ['a'] }],
    trainings: [
      { id: 'as1', sessionId: 's1', kind: 'training', attendance: [{ playerId: 'a', status: 'present' }] },
      { id: 'am1', matchId: 'm1', kind: 'match', attendance: [{ playerId: 'a', status: 'late' }] },
    ],
  });
  assert.equal(rows.length, 2);
  assert.equal(rows.find((row) => row.source === 'session').attendance.id, 'as1');
  assert.equal(rows.find((row) => row.source === 'match').attendance.id, 'am1');
  assert.equal(rows.find((row) => row.source === 'match').ready, true);
});

test('la selección de asistencia distingue liga, amistoso y torneo y exige convocatoria para cada partido', () => {
  const matches = [
    { id: 'liga', date: '2026-09-10', opponent: 'A', type: 'league' },
    { id: 'amistoso', date: '2026-09-11', opponent: 'B', type: 'friendly' },
    { id: 'torneo', date: '2026-09-12', opponent: 'C', type: 'tournament' },
  ];
  const rows = buildAttendanceActivities({ matches, callups: [{ id: 'c1', matchId: 'amistoso', availableIds: ['p1'] }] });
  assert.deepEqual(Object.fromEntries(rows.map((row) => [row.id, [row.subtitle, row.ready]])), {
    liga: ['Liga', false], amistoso: ['Amistoso', true], torneo: ['Torneo', false],
  });
});

test('cada mutación de datos emite el evento transversal que actualiza Plantilla', async () => {
  const db = await projectFile('js/db.js');
  assert.match(db, /campobase:data-changed/);
  assert.match(db, /notifyDataChanged\(store, 'upsert'\)/);
  assert.match(db, /notifyDataChanged\(storeNames, 'batch'\)/);
  assert.match(db, /notifyDataChanged\(store, 'delete'\)/);
  assert.match(db, /notifyDataChanged\(STORES, 'import'\)/);
});

test('Plantilla se recalcula desde partidos, asistencias y convocatorias y conserva el ajuste manual como delta', async () => {
  const sync = await projectFile('js/player-data-sync.js');
  assert.match(sync, /buildPlayerSummary/);
  assert.match(sync, /buildPlayerHistory/);
  assert.match(sync, /derivePlayerMatchStats/);
  assert.match(sync, /campobase:data-changed/);
  assert.match(sync, /playerComments/);
  assert.match(sync, /positionObservations/);
  assert.match(sync, /postgame-performance-form/);
  assert.doesNotMatch(sync, /rebaseScopeAdjustments/);
  assert.doesNotMatch(sync, /migrateManualScopeAdjustments/);
  assert.match(sync, /statAdjustments se conserva tal cual/);
});

test('Asistencia usa controles visuales y un resumen que cambia al marcar Presente, Tarde o Ausente', async () => {
  const source = await projectFile('js/attendance-linked-sources.js');
  assert.match(source, /attendance-status-choices/);
  assert.match(source, /statusChoice\(player\.id, 'present'/);
  assert.match(source, /statusChoice\(player\.id, 'late'/);
  assert.match(source, /statusChoice\(player\.id, 'absent'/);
  assert.match(source, /Todos presentes/);
  assert.match(source, /attendance-editor-summary/);
  assert.match(source, /data-visual-attendance="1"/);
  assert.match(source, /sessionId: session\?\.id \|\| null/);
  assert.match(source, /matchId: match\?\.id \|\| null/);
});

test('la sincronización y Asistencia se cargan en la app y en la PWA', async () => {
  const demo = await projectFile('js/demo-session.js');
  const sw = await projectFile('sw.js');
  assert.match(demo, /attendance-linked-sources\.js\?v=[^'"\s]+/);
  assert.match(demo, /player-data-sync\.js\?v=2453/);
  assert.match(sw, /attendance-linked-sources\.js\?v=2453/);
  assert.match(sw, /player-data-sync\.js\?v=2453/);
  assert.match(sw, /campobase-v2\.44\.0-player-sync-attendance-2453/);
});
