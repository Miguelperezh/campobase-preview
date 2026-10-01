import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateBackup } from '../js/domain.js';
import { planSquadSeed } from '../js/squad-seed.js';

test('una cuenta nueva no precarga nombres, dorsales, posiciones ni contactos de ningún jugador', () => {
  const plan = planSquadSeed([], 1_788_268_816_000);
  assert.deepEqual(plan.players, []);
  assert.deepEqual(plan.settings, [{
    id: 'squad-empty-initialized',
    recordType: 'migration',
    version: 2,
    createdAt: 1_788_268_816_000,
  }]);
});

test('si ya hay jugadores no modifica ni completa automáticamente ninguna ficha', () => {
  const existing = [{ id: 'propio', name: 'Jugador existente', number: '7', fatherPhone: '600000000' }];
  const plan = planSquadSeed(existing, 1_788_268_816_000);
  assert.deepEqual(plan.players, []);
  assert.deepEqual(plan.settings, []);
});

test('la plantilla JSON incluida es una copia importable por CampoBase', async () => {
  const file = await readFile(new URL('../plantilla-jugadores-union-viera.json', import.meta.url), 'utf8');
  const backup = JSON.parse(file);

  assert.equal(validateBackup(backup), backup);
});
