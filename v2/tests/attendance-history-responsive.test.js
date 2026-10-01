import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('el historial de Asistencia queda contenido dentro de cada ficha y permite envolver texto', async () => {
  const source = await projectFile('js/attendance-history-responsive.js');
  assert.match(source, /\.attendance-player\s*\{[\s\S]*min-width:\s*0/);
  assert.match(source, /\.attendance-player \.minute-table\s*\{[\s\S]*table-layout:\s*fixed/);
  assert.match(source, /overflow-wrap:\s*anywhere/);
  assert.match(source, /\.attendance-player \.minute-table th:last-child,[\s\S]*text-align:\s*left/);
});

test('abrir el historial de un jugador no estira las demás fichas de su fila', async () => {
  const source = await projectFile('js/attendance-history-responsive.js');
  assert.match(source, /\.attendance-grid\s*\{[\s\S]*align-items:\s*start/);
  assert.match(source, /\.attendance-player\s*\{[\s\S]*align-self:\s*start/);
  assert.match(source, /\.attendance-player\s*\{[\s\S]*height:\s*max-content/);
});

test('la corrección responsive se carga en app y PWA sin tocar la lógica de Asistencia', async () => {
  const [demo, sw] = await Promise.all([projectFile('js/demo-session.js'), projectFile('sw.js')]);
  assert.match(demo, /attendance-history-responsive\.js\?v=2455/);
  assert.match(sw, /attendance-history-responsive\.js\?v=2455/);
  assert.match(sw, /campobase-v2\.44\.0-player-sync-attendance-2453-responsive-2455/);
});
