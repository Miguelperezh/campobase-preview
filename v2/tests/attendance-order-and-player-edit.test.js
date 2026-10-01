import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sortAttendanceActivities, buildAttendanceActivities } from '../js/attendance-linked-sources.js';
import { buildPlayerRecord } from '../js/domain.js';
import { OFFICIAL_SQUAD_DATA } from '../js/squad-seed.js';

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('sortAttendanceActivities ordena lo más próximo arriba por orden ascendente y los pasados descendente', () => {
  const activities = [
    { date: '2026-09-20', title: 'Sesión futura' },
    { date: '2026-09-14', title: 'Sesión de hoy' },
    { date: '2026-09-16', title: 'Partido próximo' },
    { date: '2026-09-10', title: 'Sesión pasada reciente' },
    { date: '2026-09-01', title: 'Sesión pasada antigua' },
  ];
  const sorted = sortAttendanceActivities(activities, '2026-09-14');
  assert.deepEqual(
    sorted.map((item) => item.title),
    [
      'Sesión de hoy',
      'Partido próximo',
      'Sesión futura',
      'Sesión pasada reciente',
      'Sesión pasada antigua',
    ]
  );
});

test('buildPlayerRecord permite eliminar madre y no fuerza datos previos si el formulario envía campo vacío', () => {
  const existing = {
    id: 'p04',
    name: 'Eidan Asensio',
    number: '3',
    fatherName: 'Cristian',
    fatherPhone: '643970968',
    motherName: 'Madre',
    motherPhone: '622 030 003',
  };

  const formValues = {
    id: 'p04',
    name: 'Eidan Asensio',
    number: '',
    fatherName: 'Cristian',
    fatherPhone: '643970968',
    motherName: '',
    motherPhone: '',
    foot: 'Derecha',
    notes: '',
  };

  const updated = buildPlayerRecord(formValues, ['Defensa'], existing);
  assert.equal(updated.motherName, '');
  assert.equal(updated.motherPhone, '');
  assert.equal(updated.number, '');
  assert.equal(updated.fatherName, 'Cristian');
});

test('OFFICIAL_SQUAD_DATA no contiene dorsales ni teléfonos ficticios inventados', () => {
  for (const p of OFFICIAL_SQUAD_DATA) {
    if (p.name !== 'Ramiro Casati' && p.positions[0] !== 'Entrenador') {
      assert.equal(p.number, '', `El jugador ${p.name} no debe tener dorsal inventado`);
    }
    assert.doesNotMatch(p.fatherPhone || '', /^611/, `Teléfono ficticio en ${p.name}`);
    assert.doesNotMatch(p.motherPhone || '', /^622/, `Teléfono ficticio en ${p.name}`);
    assert.notEqual(p.fatherName, 'Padre', `Nombre ficticio Padre en ${p.name}`);
    assert.notEqual(p.motherName, 'Madre', `Nombre ficticio Madre en ${p.name}`);
  }
  assert.equal(OFFICIAL_SQUAD_DATA.some((p) => p.name === 'Pablo Montesdeoca'), false, 'Pablo Montesdeoca no debe existir');
});

test('attendance-linked-sources renderiza desplegable cerrado para asistencias registradas', async () => {
  const source = await projectFile('js/attendance-linked-sources.js');
  assert.match(source, /attendance-completed-group/);
  assert.match(source, /attendance-completed-summary/);
  assert.match(source, /Asistencias registradas y finalizadas/);
});

test('app.js no reinyecta datos oficiales sobreescribiendo las fichas de plantilla en refresh', async () => {
  const app = await projectFile('js/app.js');
  assert.doesNotMatch(app, /!p.motherName && official?.motherName/);
  assert.doesNotMatch(app, /!p.fatherPhone && official?.fatherPhone/);
  assert.doesNotMatch(app, /!p.number && official?.number/);
  assert.match(app, /attendance-history-details/);
});

test('session-visual-planner.js renderiza los ejercicios de la sesión en acordeón cerrado que abre solo uno', async () => {
  const code = await projectFile('js/session-visual-planner.js');
  assert.match(code, /session-visual-accordion/);
  assert.match(code, /session-block-accordion/);
  assert.match(code, /session-block-accordion-summary/);
  assert.match(code, /name="session-visual-accordion"/);
});

