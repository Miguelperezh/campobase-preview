import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildTodaySummary, localDayKey } from '../js/today-dashboard.js';

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Hoy usa fecha local sin depender de UTC', () => {
  const now = new Date(2026, 8, 10, 23, 30, 0);
  assert.equal(localDayKey(now), '2026-09-10');
});

test('Hoy separa actividades actuales, próximas y tareas pendientes', () => {
  const now = new Date(2026, 8, 10, 12, 0, 0);
  const sessions = [
    { id: 's1', date: '2026-09-10', name: 'Técnica' },
    { id: 's2', date: '2026-09-12', name: 'Prepartido' },
  ];
  const matches = [
    { id: 'm1', date: '2026-09-10T19:00', opponent: 'Rival A', status: 'planned', callupId: 'c1' },
    { id: 'm2', date: '2026-09-13T11:00', opponent: 'Rival B', status: 'planned' },
  ];
  const trainings = [{ id: 'a1', sessionId: 's1', date: '2026-09-10', attendance: [] }];
  const callups = [{ id: 'c1', matchId: 'm1', availableIds: ['p1'] }];

  const summary = buildTodaySummary({ sessions, matches, trainings, callups, now });
  assert.deepEqual(summary.todaySessions.map((item) => item.id), ['s1']);
  assert.deepEqual(summary.todayMatches.map((item) => item.id), ['m1']);
  assert.equal(summary.nextSession.id, 's1');
  assert.equal(summary.nextMatch.id, 'm1');
  assert.deepEqual(summary.attendancePending.map((item) => item.id), ['m1']);
  assert.deepEqual(summary.callupPending.map((item) => item.id), ['m2']);
});

test('el nuevo Inicio se carga desde la app y queda disponible offline', async () => {
  const [demo, sw, pkg, source] = await Promise.all([
    projectFile('js/demo-session.js'),
    projectFile('sw.js'),
    projectFile('package.json'),
    projectFile('js/today-dashboard.js'),
  ]);
  assert.match(demo, /today-dashboard\.js\?v=2457/);
  assert.match(sw, /today-dashboard\.js\?v=2457/);
  assert.match(sw, /today-2457/);
  assert.match(pkg, /node --check js\/today-dashboard\.js/);
  assert.match(source, /section\.id = 'hoy'/);
  assert.match(source, /navButton\.textContent = 'Hoy'/);
  assert.match(source, /today-event-grid/);
  assert.match(source, /Pendiente de hacer/);
});


test('renderizar Hoy nunca cambia por su cuenta la vista activa del usuario', async () => {
  const source = await projectFile('js/today-dashboard.js');
  assert.doesNotMatch(source, /plantilla\.classList\.remove\('active'\)/);
  assert.match(source, /document\.querySelector\('\.view\.active'\) \? 'view' : 'view active'/);
});


test('Hoy ignora fechas imposibles sin bloquear el render ni la sincronización', () => {
  const now = new Date(2026, 8, 27, 12, 0, 0);
  const summary = buildTodaySummary({
    sessions: [
      { id: 'bad-session', date: '2026-09-31', name: 'Fecha imposible' },
      { id: 'good-session', date: '2026-09-28', name: 'Sesión válida' },
    ],
    matches: [
      { id: 'bad-match', date: '2026-02-30T19:00', opponent: 'Fecha imposible' },
    ],
    now,
  });

  assert.equal(summary.nextSession?.id, 'good-session');
  assert.equal(summary.todaySessions.length, 0);
  assert.equal(summary.todayMatches.length, 0);
  assert.ok(!summary.attendancePending.some((item) => item.id === 'bad-session'));
});
