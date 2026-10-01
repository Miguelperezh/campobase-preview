import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('la auditoría final se carga después de la normalización de vocabulario', async () => {
  const vocabulary = await read('js/exercise-vocabulary-ui.js');
  assert.match(vocabulary, /exercise-content-audit\.js\?v=1/);
});

test('solo reescribe objetivos realmente genéricos y los deriva de la tarea', async () => {
  const audit = await read('js/exercise-content-audit.js');
  assert.match(audit, /function objectiveIsGeneric/);
  assert.match(audit, /control\|pase\|conduccion\|regate\|temporizacion/);
  assert.match(audit, /entrada por banda\|progresar en el campo/);
  assert.match(audit, /Mejorar el control orientado para iniciar el 1v1 con ventaja/);
  assert.match(audit, /Progresar con balón superando oposición mediante conducción, regate y cambios de ritmo/);
  assert.match(audit, /Utilizar la amplitud y los cambios de orientación/);
  assert.match(audit, /Mejorar la conducción con ambas piernas, especialmente con la menos hábil/);
});

test('Qué se trabaja prioriza el contenido principal antes de los secundarios', async () => {
  const audit = await read('js/exercise-content-audit.js');
  assert.match(audit, /Pase, recepción y control orientado/);
  assert.match(audit, /Conservación, apoyos y líneas de pase/);
  assert.match(audit, /Finalización y ejecución del remate/);
  assert.match(audit, /Transición y cambio rápido de rol/);
  assert.match(audit, /Desplazamientos defensivos, temporización y control de distancia/);
  assert.match(audit, /Colocación, salida y achique del portero/);
  assert.match(audit, /return \(distinct\.length \? distinct : items\)\.slice\(0, 4\)/);
});

test('la auditoría final mantiene sintaxis válida', () => {
  execFileSync(process.execPath, ['--check', fileURLToPath(new URL('js/exercise-content-audit.js', root))], { stdio: 'pipe' });
});
