import test from 'node:test';
import assert from 'node:assert/strict';
import { TACTICAS_INTERACTIVAS, findTacticaInteractiva, tacticasDeFormacion } from '../js/tacticas-interactivas.js';
import { TACTICA_1231_FRAMES } from '../js/tactica-1231-frames.js';
import { TACTICA_1213_FRAMES } from '../js/tactica-1213-frames.js';
import { TACTICA_1321_FRAMES } from '../js/tactica-1321-frames.js';
import { TACTICA_1222_FRAMES } from '../js/tactica-1222-frames.js';
import { TACTICA_1132_FRAMES } from '../js/tactica-1132-frames.js';
import { TACTICA_133_FRAMES } from '../js/tactica-133-frames.js';
import { TACTICA_1312_FRAMES } from '../js/tactica-1312-frames.js';
import { TACTICA_FINAL_FRAMES } from '../js/tactica-final-frames.js';
import { TACTICA_11311_FRAMES } from '../js/tactica-11311-frames.js';
import { TACTICA_1141_FRAMES } from '../js/tactica-1141-frames.js';
import { TACTICA_1411_FRAMES } from '../js/tactica-1411-frames.js';
import { TACTICA_12211_FRAMES } from '../js/tactica-12211-frames.js';

test('el catálogo del manual expone doce tácticas maestras, incluidas las cinco nuevas', () => {
  assert.equal(TACTICAS_INTERACTIVAS.length, 12);
  const [t1321, t1231, t1213, t1222, t1132, t133, t1312] = TACTICAS_INTERACTIVAS;
  assert.equal(t1321.id, 'CAMPOBASE-TACTICA-1321-GUIA-COMPLETA');
  assert.equal(t1321.formacion, '1-3-2-1');
  assert.equal(t1321.nombre, 'Sistema 1-3-2-1');
  assert.equal(t1321.organizacion, '1 portero · 3 defensas · 2 medios · 1 delantero');
  assert.equal(t1231.id, 'CAMPOBASE-TACTICA-1231-GUIA-COMPLETA');
  assert.equal(t1231.formacion, '1-2-3-1');
  assert.equal(t1231.nombre, 'Sistema 1-2-3-1');
  assert.equal(t1231.organizacion, '1 portero · 2 defensas · 3 medios · 1 delantero');
  assert.equal(t1213.id, 'CAMPOBASE-TACTICA-1213-GUIA-COMPLETA');
  assert.equal(t1213.formacion, '1-2-1-3');
  assert.equal(t1213.nombre, 'Sistema 1-2-1-3');
  assert.equal(t1213.organizacion, '1 portero · 2 defensas · 1 medio · 3 delanteros');
  assert.equal(t1222.id, 'CAMPOBASE-TACTICA-1222-GUIA-COMPLETA');
  assert.equal(t1222.formacion, '1-2-2-2');
  assert.equal(t1222.nombre, 'Sistema 1-2-2-2');
  assert.equal(t1222.organizacion, '1 portero · 2 defensas · 2 medios · 2 delanteros');
  assert.equal(t1132.id, 'CAMPOBASE-TACTICA-1132-GUIA-COMPLETA');
  assert.equal(t1132.formacion, '1-1-3-2');
  assert.equal(t1132.nombre, 'Sistema 1-1-3-2');
  assert.equal(t1132.organizacion, '1 portero · 1 defensa · 3 medios · 2 delanteros');
  assert.equal(t133.id, 'CAMPOBASE-TACTICA-133-GUIA-COMPLETA');
  assert.equal(t133.formacion, '1-3-3');
  assert.equal(t133.nombre, 'Sistema 1-3-3');
  assert.equal(t133.organizacion, '1 portero · 3 defensas · 3 atacantes');
  assert.equal(t1312.id, 'CAMPOBASE-TACTICA-1312-GUIA-COMPLETA');
  assert.equal(t1312.formacion, '1-3-1-2');
  assert.equal(t1312.nombre, 'Sistema 1-3-1-2');
  assert.equal(t1312.organizacion, '1 portero · 3 defensas · 1 medio · 2 delanteros');
});

test('la táctica 1-3-2-1 tiene cuatro bloques ordenados con contenido completo', () => {
  const t = TACTICAS_INTERACTIVAS[0];
  assert.equal(t.bloques.length, 4);
  const cortos = t.bloques.map((b) => b.nombre_corto);
  assert.deepEqual(cortos, ['Funciones', 'Salida', 'Ataque', 'Defensa']);
  for (const b of t.bloques) {
    assert.ok(b.id, 'cada bloque tiene id');
    assert.ok(b.titulo, 'cada bloque tiene título');
    assert.ok(b.objetivo, 'cada bloque tiene objetivo');
    assert.ok(b.idea_clave, 'cada bloque tiene idea clave');
    assert.ok(Array.isArray(b.decisiones) && b.decisiones.length, 'decisiones');
    assert.ok(Array.isArray(b.que_vigilar) && b.que_vigilar.length, 'qué vigilar');
    assert.ok(Array.isArray(b.consignas) && b.consignas.length, 'consignas');
    assert.ok(Array.isArray(b.errores) && b.errores.length, 'errores');
  }
});

test('la táctica 1-2-3-1 tiene cinco bloques ordenados con contenido completo', () => {
  const t = TACTICAS_INTERACTIVAS[1];
  assert.equal(t.bloques.length, 5);
  const cortos = t.bloques.map((b) => b.nombre_corto);
  assert.deepEqual(cortos, ['Funciones', 'Salida', 'Ataque', 'Defensa', 'Transición']);
  for (const b of t.bloques) {
    assert.ok(b.id, 'cada bloque tiene id');
    assert.ok(b.titulo, 'cada bloque tiene título');
    assert.ok(b.objetivo, 'cada bloque tiene objetivo');
    assert.ok(b.idea_clave, 'cada bloque tiene idea clave');
    assert.ok(Array.isArray(b.decisiones) && b.decisiones.length, 'decisiones');
    assert.ok(Array.isArray(b.que_vigilar) && b.que_vigilar.length, 'qué vigilar');
    assert.ok(Array.isArray(b.consignas) && b.consignas.length, 'consignas');
    assert.ok(Array.isArray(b.errores) && b.errores.length, 'errores');
  }
});

test('la táctica 1-2-1-3 tiene tres bloques ordenados con contenido completo', () => {
  const t = TACTICAS_INTERACTIVAS[2];
  assert.equal(t.bloques.length, 3);
  const cortos = t.bloques.map((b) => b.nombre_corto);
  assert.deepEqual(cortos, ['Funciones', 'Defensa', 'Salida']);
  for (const b of t.bloques) {
    assert.ok(b.id, 'cada bloque tiene id');
    assert.ok(b.titulo, 'cada bloque tiene título');
    assert.ok(b.objetivo, 'cada bloque tiene objetivo');
    assert.ok(b.idea_clave, 'cada bloque tiene idea clave');
    assert.ok(Array.isArray(b.decisiones) && b.decisiones.length, 'decisiones');
    assert.ok(Array.isArray(b.que_vigilar) && b.que_vigilar.length, 'qué vigilar');
    assert.ok(Array.isArray(b.consignas) && b.consignas.length, 'consignas');
    assert.ok(Array.isArray(b.errores) && b.errores.length, 'errores');
  }
});

test('la táctica 1-2-2-2 tiene cinco bloques ordenados con contenido completo', () => {
  const t = TACTICAS_INTERACTIVAS[3];
  assert.equal(t.bloques.length, 5);
  const cortos = t.bloques.map((b) => b.nombre_corto);
  assert.deepEqual(cortos, ['Funciones', 'Ataque', 'Defensa', 'Variante 2-4', 'Contraataque']);
  for (const b of t.bloques) {
    assert.ok(b.id, 'cada bloque tiene id');
    assert.ok(b.titulo, 'cada bloque tiene título');
    assert.ok(b.objetivo, 'cada bloque tiene objetivo');
    assert.ok(b.idea_clave, 'cada bloque tiene idea clave');
    assert.ok(Array.isArray(b.decisiones) && b.decisiones.length, 'decisiones');
    assert.ok(Array.isArray(b.que_vigilar) && b.que_vigilar.length, 'qué vigilar');
    assert.ok(Array.isArray(b.consignas) && b.consignas.length, 'consignas');
    assert.ok(Array.isArray(b.errores) && b.errores.length, 'errores');
  }
});

test('la táctica 1-1-3-2 tiene cinco bloques ordenados con contenido completo', () => {
  const t = TACTICAS_INTERACTIVAS[4];
  assert.equal(t.bloques.length, 5);
  const cortos = t.bloques.map((b) => b.nombre_corto);
  assert.deepEqual(cortos, ['Defensa', 'Salida 2A', 'Salida 2B', 'Dos carriles', 'Tras pérdida']);
  for (const b of t.bloques) {
    assert.ok(b.id, 'cada bloque tiene id');
    assert.ok(b.titulo, 'cada bloque tiene título');
    assert.ok(b.objetivo, 'cada bloque tiene objetivo');
    assert.ok(b.idea_clave, 'cada bloque tiene idea clave');
    assert.ok(Array.isArray(b.decisiones) && b.decisiones.length, 'decisiones');
    assert.ok(Array.isArray(b.que_vigilar) && b.que_vigilar.length, 'qué vigilar');
    assert.ok(Array.isArray(b.consignas) && b.consignas.length, 'consignas');
    assert.ok(Array.isArray(b.errores) && b.errores.length, 'errores');
  }
});

test('la 1-3-2-1 usa la numeración clásica del paquete (1, 2, 3, 4, 5, 6, 7)', () => {
  const t = TACTICAS_INTERACTIVAS[0];
  assert.ok(Array.isArray(t.team) && t.team.length === 7, 'team personalizado de 7 jugadores');
  const dorsales = t.team.map((p) => p.n);
  assert.deepEqual(dorsales, ['1', '2', '3', '4', '5', '6', '7']);
});

test('la 1-2-1-3 usa la numeración del paquete (1, 4, 5, 6, 8, 9, 10)', () => {
  const t = TACTICAS_INTERACTIVAS[2];
  assert.ok(Array.isArray(t.team) && t.team.length === 7, 'team personalizado de 7 jugadores');
  const dorsales = t.team.map((p) => p.n);
  assert.deepEqual(dorsales, ['1', '4', '5', '6', '8', '9', '10']);
});

test('la 1-2-2-2 usa la numeración del paquete (1, 4, 5, 6, 8, 9, 10)', () => {
  const t = TACTICAS_INTERACTIVAS[3];
  assert.ok(Array.isArray(t.team) && t.team.length === 7, 'team personalizado de 7 jugadores');
  const dorsales = t.team.map((p) => p.n);
  assert.deepEqual(dorsales, ['1', '4', '5', '6', '8', '9', '10']);
});

test('la 1-1-3-2 usa la numeración del paquete (1, 5, 11, 8, 7, 9, 10)', () => {
  const t = TACTICAS_INTERACTIVAS[4];
  assert.ok(Array.isArray(t.team) && t.team.length === 7, 'team personalizado de 7 jugadores');
  const dorsales = t.team.map((p) => p.n);
  assert.deepEqual(dorsales, ['1', '5', '11', '8', '7', '9', '10']);
});

test('la 1-3-3 usa la numeración del paquete (1, 4, 5, 6, 8, 9, 10)', () => {
  const t = TACTICAS_INTERACTIVAS[5];
  assert.ok(Array.isArray(t.team) && t.team.length === 7, 'team personalizado de 7 jugadores');
  const dorsales = t.team.map((p) => p.n);
  assert.deepEqual(dorsales, ['1', '4', '5', '6', '8', '9', '10']);
});

test('la 1-3-1-2 usa la numeración del paquete (1, 4, 5, 6, 7, 9, 10)', () => {
  const t = TACTICAS_INTERACTIVAS[6];
  assert.ok(Array.isArray(t.team) && t.team.length === 7, 'team personalizado de 7 jugadores');
  const dorsales = t.team.map((p) => p.n);
  assert.deepEqual(dorsales, ['1', '4', '5', '6', '7', '9', '10']);
});

test('la táctica 1-3-3 tiene cinco bloques ordenados con contenido completo', () => {
  const t = TACTICAS_INTERACTIVAS[5];
  assert.equal(t.bloques.length, 5);
  const cortos = t.bloques.map((b) => b.nombre_corto);
  assert.deepEqual(cortos, ['Estructura', 'Salida', 'Ataque 8-9', 'Ataque 4-5', 'Ajuste 4-2-2']);
  for (const b of t.bloques) {
    assert.ok(b.id, 'cada bloque tiene id');
    assert.ok(b.titulo, 'cada bloque tiene título');
    assert.ok(b.objetivo, 'cada bloque tiene objetivo');
    assert.ok(b.idea_clave, 'cada bloque tiene idea clave');
    assert.ok(Array.isArray(b.decisiones) && b.decisiones.length, 'decisiones');
    assert.ok(Array.isArray(b.que_vigilar) && b.que_vigilar.length, 'qué vigilar');
    assert.ok(Array.isArray(b.consignas) && b.consignas.length, 'consignas');
    assert.ok(Array.isArray(b.errores) && b.errores.length, 'errores');
  }
});

test('la táctica 1-3-1-2 tiene seis bloques ordenados con contenido completo', () => {
  const t = TACTICAS_INTERACTIVAS[6];
  assert.equal(t.bloques.length, 6);
  const cortos = t.bloques.map((b) => b.nombre_corto);
  assert.deepEqual(cortos, ['Estructura', 'Salida', 'Progresión', 'Basculaciones', 'Pressing', 'Bloque bajo']);
  for (const b of t.bloques) {
    assert.ok(b.id, 'cada bloque tiene id');
    assert.ok(b.titulo, 'cada bloque tiene título');
    assert.ok(b.objetivo, 'cada bloque tiene objetivo');
    assert.ok(b.idea_clave, 'cada bloque tiene idea clave');
    assert.ok(Array.isArray(b.decisiones) && b.decisiones.length, 'decisiones');
    assert.ok(Array.isArray(b.que_vigilar) && b.que_vigilar.length, 'qué vigilar');
    assert.ok(Array.isArray(b.consignas) && b.consignas.length, 'consignas');
    assert.ok(Array.isArray(b.errores) && b.errores.length, 'errores');
  }
});

test('cada bloque referencia frames reales con duraciones verificadas', () => {
  const t1321 = TACTICAS_INTERACTIVAS[0];
  const totales1321 = { Funciones: 196, Salida: 194, Ataque: 191, Defensa: 193 };
  for (const b of t1321.bloques) {
    const anim = b.animacion;
    assert.ok(anim, `animación de ${b.nombre_corto}`);
    assert.match(anim.frames, /assets\/tacticas\/CAMPOBASE-TACTICA-1321-GUIA-COMPLETA\/bloque-\d\/frames\/f$/);
    assert.equal(anim.total, totales1321[b.nombre_corto], `total de frames de ${b.nombre_corto}`);
    const key = String(t1321.bloques.indexOf(b) + 1);
    assert.equal(TACTICA_1321_FRAMES[key].total, anim.total);
    assert.equal(TACTICA_1321_FRAMES[key].durations.length, anim.total);
  }

  const t1231 = TACTICAS_INTERACTIVAS[1];
  const totales1231 = { Funciones: 189, Salida: 196, Ataque: 196, Defensa: 196, Transición: 196 };
  for (const b of t1231.bloques) {
    const anim = b.animacion;
    assert.ok(anim, `animación de ${b.nombre_corto}`);
    assert.match(anim.frames, /assets\/tacticas\/CAMPOBASE-TACTICA-1231-GUIA-COMPLETA\/bloque-\d\/frames\/f$/);
    assert.equal(anim.total, totales1231[b.nombre_corto], `total de frames de ${b.nombre_corto}`);
    const key = String(t1231.bloques.indexOf(b) + 1);
    assert.equal(TACTICA_1231_FRAMES[key].total, anim.total);
    assert.equal(TACTICA_1231_FRAMES[key].durations.length, anim.total);
  }

  const t1213 = TACTICAS_INTERACTIVAS[2];
  const totales1213 = { Funciones: 196, Defensa: 196, Salida: 196 };
  for (const b of t1213.bloques) {
    const anim = b.animacion;
    assert.ok(anim, `animación de ${b.nombre_corto}`);
    assert.match(anim.frames, /assets\/tacticas\/CAMPOBASE-TACTICA-1213-GUIA-COMPLETA\/bloque-\d\/frames\/f$/);
    assert.equal(anim.total, totales1213[b.nombre_corto], `total de frames de ${b.nombre_corto}`);
    const key = String(t1213.bloques.indexOf(b) + 1);
    assert.equal(TACTICA_1213_FRAMES[key].total, anim.total);
    assert.equal(TACTICA_1213_FRAMES[key].durations.length, anim.total);
  }

  const t1222 = TACTICAS_INTERACTIVAS[3];
  const totales1222 = { Funciones: 195, Ataque: 168, Defensa: 189, 'Variante 2-4': 193, Contraataque: 192 };
  for (const b of t1222.bloques) {
    const anim = b.animacion;
    assert.ok(anim, `animación de ${b.nombre_corto}`);
    assert.match(anim.frames, /assets\/tacticas\/CAMPOBASE-TACTICA-1222-GUIA-COMPLETA\/bloque-\d\/frames\/f$/);
    assert.equal(anim.total, totales1222[b.nombre_corto], `total de frames de ${b.nombre_corto}`);
    const key = String(t1222.bloques.indexOf(b) + 1);
    assert.equal(TACTICA_1222_FRAMES[key].total, anim.total);
    assert.equal(TACTICA_1222_FRAMES[key].durations.length, anim.total);
  }

  const t1132 = TACTICAS_INTERACTIVAS[4];
  const totales1132 = { Defensa: 140, 'Salida 2A': 162, 'Salida 2B': 166, 'Dos carriles': 168, 'Tras pérdida': 196 };
  for (const b of t1132.bloques) {
    const anim = b.animacion;
    assert.ok(anim, `animación de ${b.nombre_corto}`);
    assert.match(anim.frames, /assets\/tacticas\/CAMPOBASE-TACTICA-1132-GUIA-COMPLETA\/bloque-\d\/frames\/f$/);
    assert.equal(anim.total, totales1132[b.nombre_corto], `total de frames de ${b.nombre_corto}`);
    const key = String(t1132.bloques.indexOf(b) + 1);
    assert.equal(TACTICA_1132_FRAMES[key].total, anim.total);
    assert.equal(TACTICA_1132_FRAMES[key].durations.length, anim.total);
  }

  const t133 = TACTICAS_INTERACTIVAS[5];
  const totales133 = { Estructura: 166, Salida: 192, 'Ataque 8-9': 168, 'Ataque 4-5': 165, 'Ajuste 4-2-2': 165 };
  for (const b of t133.bloques) {
    const anim = b.animacion;
    assert.ok(anim, `animación de ${b.nombre_corto}`);
    assert.match(anim.frames, /assets\/tacticas\/CAMPOBASE-TACTICA-133-GUIA-COMPLETA\/bloque-\d\/frames\/f$/);
    assert.equal(anim.total, totales133[b.nombre_corto], `total de frames de ${b.nombre_corto}`);
    const key = String(t133.bloques.indexOf(b) + 1);
    assert.equal(TACTICA_133_FRAMES[key].total, anim.total);
    assert.equal(TACTICA_133_FRAMES[key].durations.length, anim.total);
  }

  const t1312 = TACTICAS_INTERACTIVAS[6];
  const totales1312 = { Estructura: 167, Salida: 167, Progresión: 169, Basculaciones: 166, Pressing: 166, 'Bloque bajo': 169 };
  for (const b of t1312.bloques) {
    const anim = b.animacion;
    assert.ok(anim, `animación de ${b.nombre_corto}`);
    assert.match(anim.frames, /assets\/tacticas\/CAMPOBASE-TACTICA-1312-GUIA-COMPLETA\/bloque-\d\/frames\/f$/);
    assert.equal(anim.total, totales1312[b.nombre_corto], `total de frames de ${b.nombre_corto}`);
    const key = String(t1312.bloques.indexOf(b) + 1);
    assert.equal(TACTICA_1312_FRAMES[key].total, anim.total);
    assert.equal(TACTICA_1312_FRAMES[key].durations.length, anim.total);
  }
});

test('las duraciones de la 1-3-2-1 son las del GIF (200/160/140 ms según bloque)', () => {
  assert.ok(TACTICA_1321_FRAMES['1'].durations.every((d) => d === 200));
  assert.ok(TACTICA_1321_FRAMES['2'].durations.every((d) => d === 200 || d === 400));
  assert.ok(TACTICA_1321_FRAMES['3'].durations.every((d) => d === 160 || d === 320));
  assert.ok(TACTICA_1321_FRAMES['4'].durations.every((d) => d === 140 || d === 280));
});

test('las duraciones de la 1-2-1-3 son 140 ms (bloques 1-2) y 107 ms (bloque 3)', () => {
  assert.ok(TACTICA_1213_FRAMES['1'].durations.every((d) => d === 140));
  assert.ok(TACTICA_1213_FRAMES['2'].durations.every((d) => d === 140));
  assert.ok(TACTICA_1213_FRAMES['3'].durations.every((d) => d === 107));
});

test('las duraciones de la 1-2-2-2 son las del GIF (110/100/90/80 ms según bloque)', () => {
  assert.ok(TACTICA_1222_FRAMES['1'].durations.every((d) => d === 110 || d === 220));
  assert.ok(TACTICA_1222_FRAMES['2'].durations.every((d) => d === 100 || d === 200 || d === 2800));
  assert.ok(TACTICA_1222_FRAMES['3'].durations.every((d) => d === 90 || d === 180 || d === 270));
  assert.ok(TACTICA_1222_FRAMES['4'].durations.every((d) => d === 80 || d === 170));
  assert.ok(TACTICA_1222_FRAMES['5'].durations.every((d) => d === 80 || d === 160));
});

test('las duraciones de la 1-1-3-2 son las reales de sus cinco GIF', () => {
  assert.deepEqual([...new Set(TACTICA_1132_FRAMES['1'].durations)].sort((a, b) => a - b), [90, 180, 2520]);
  assert.deepEqual([...new Set(TACTICA_1132_FRAMES['2'].durations)].sort((a, b) => a - b), [80, 170, 340, 2380]);
  assert.deepEqual([...new Set(TACTICA_1132_FRAMES['3'].durations)].sort((a, b) => a - b), [80, 170, 2380]);
  assert.deepEqual([...new Set(TACTICA_1132_FRAMES['4'].durations)].sort((a, b) => a - b), [80, 170, 2380]);
  assert.deepEqual([...new Set(TACTICA_1132_FRAMES['5'].durations)], [80]);
});

test('las duraciones de la 1-3-3 son las del GIF (80 ms base, con pausas de 170/250/2380 ms)', () => {
  assert.ok(TACTICA_133_FRAMES['1'].durations.every((d) => d === 80 || d === 170 || d === 2380));
  assert.ok(TACTICA_133_FRAMES['2'].durations.every((d) => d === 80 || d === 170 || d === 250));
  assert.ok(TACTICA_133_FRAMES['3'].durations.every((d) => d === 80 || d === 170 || d === 2380));
  assert.ok(TACTICA_133_FRAMES['4'].durations.every((d) => d === 80 || d === 170 || d === 2380));
  assert.ok(TACTICA_133_FRAMES['5'].durations.every((d) => d === 80 || d === 170 || d === 2380));
});

test('las duraciones de la 1-3-1-2 son las del GIF (80 ms base, con pausas de 160/170/240/2240/2380 ms)', () => {
  assert.ok(TACTICA_1312_FRAMES['1'].durations.every((d) => d === 80 || d === 170 || d === 2380));
  assert.ok(TACTICA_1312_FRAMES['2'].durations.every((d) => d === 80 || d === 160 || d === 2240));
  assert.ok(TACTICA_1312_FRAMES['3'].durations.every((d) => d === 80 || d === 2240));
  assert.ok(TACTICA_1312_FRAMES['4'].durations.every((d) => d === 80 || d === 160 || d === 240 || d === 2240));
  assert.ok(TACTICA_1312_FRAMES['5'].durations.every((d) => d === 80 || d === 160 || d === 2240));
  assert.ok(TACTICA_1312_FRAMES['6'].durations.every((d) => d === 80 || d === 2240));
});

test('findTacticaInteractiva y tacticasDeFormacion siguen funcionando', () => {
  assert.equal(findTacticaInteractiva('CAMPOBASE-TACTICA-1321-GUIA-COMPLETA').id, 'CAMPOBASE-TACTICA-1321-GUIA-COMPLETA');
  assert.equal(findTacticaInteractiva('CAMPOBASE-TACTICA-1231-GUIA-COMPLETA').id, 'CAMPOBASE-TACTICA-1231-GUIA-COMPLETA');
  assert.equal(findTacticaInteractiva('CAMPOBASE-TACTICA-1213-GUIA-COMPLETA').id, 'CAMPOBASE-TACTICA-1213-GUIA-COMPLETA');
  assert.equal(findTacticaInteractiva('CAMPOBASE-TACTICA-1222-GUIA-COMPLETA').id, 'CAMPOBASE-TACTICA-1222-GUIA-COMPLETA');
  assert.equal(findTacticaInteractiva('CAMPOBASE-TACTICA-1132-GUIA-COMPLETA').id, 'CAMPOBASE-TACTICA-1132-GUIA-COMPLETA');
  assert.equal(findTacticaInteractiva('CAMPOBASE-TACTICA-133-GUIA-COMPLETA').id, 'CAMPOBASE-TACTICA-133-GUIA-COMPLETA');
  assert.equal(findTacticaInteractiva('CAMPOBASE-TACTICA-1312-GUIA-COMPLETA').id, 'CAMPOBASE-TACTICA-1312-GUIA-COMPLETA');
  assert.equal(findTacticaInteractiva('CAMPOBASE-TACTICA-FINAL-LINEA3-GUIA-COMPLETA').id, 'CAMPOBASE-TACTICA-FINAL-LINEA3-GUIA-COMPLETA');
  assert.equal(findTacticaInteractiva('CAMPOBASE-TACTICA-11311-GUIA-COMPLETA').id, 'CAMPOBASE-TACTICA-11311-GUIA-COMPLETA');
  assert.equal(findTacticaInteractiva('CAMPOBASE-TACTICA-1141-GUIA-COMPLETA').id, 'CAMPOBASE-TACTICA-1141-GUIA-COMPLETA');
  assert.equal(findTacticaInteractiva('CAMPOBASE-TACTICA-1411-GUIA-COMPLETA').id, 'CAMPOBASE-TACTICA-1411-GUIA-COMPLETA');
  assert.equal(findTacticaInteractiva('CAMPOBASE-TACTICA-12211-GUIA-COMPLETA').id, 'CAMPOBASE-TACTICA-12211-GUIA-COMPLETA');
  assert.equal(findTacticaInteractiva('no-existe'), undefined);
  assert.equal(tacticasDeFormacion('1-3-2-1').length, 2);
  assert.equal(tacticasDeFormacion('1-2-3-1').length, 1);
  assert.equal(tacticasDeFormacion('1-2-1-3').length, 1);
  assert.equal(tacticasDeFormacion('1-2-2-2').length, 1);
  assert.equal(tacticasDeFormacion('1-1-3-2').length, 1);
  assert.equal(tacticasDeFormacion('1-3-3').length, 1);
  assert.equal(tacticasDeFormacion('1-3-1-2').length, 1);
  assert.equal(tacticasDeFormacion('1-1-3-1-1').length, 1);
  assert.equal(tacticasDeFormacion('1-1-4-1').length, 1);
  assert.equal(tacticasDeFormacion('1-4-1-1').length, 1);
  assert.equal(tacticasDeFormacion('1-2-2-1-1').length, 1);
});

const NUEVAS_TACTICAS = [
  {
    id: 'CAMPOBASE-TACTICA-FINAL-LINEA3-GUIA-COMPLETA',
    formacion: '1-3-2-1',
    bloques: ['Estructura', 'Bloque bajo'],
    dorsales: ['1', '4', '5', '6', '7', '10', '11'],
    manifest: TACTICA_FINAL_FRAMES,
    totales: [84, 85],
    duraciones: [[60], [60, 840]],
    ruta: 'FINAL-LINEA3',
  },
  {
    id: 'CAMPOBASE-TACTICA-11311-GUIA-COMPLETA',
    formacion: '1-1-3-1-1',
    bloques: ['Estructura', 'Transformación'],
    dorsales: ['1', '2', '5', '6', '8', '9', '10'],
    manifest: TACTICA_11311_FRAMES,
    totales: [85, 85],
    duraciones: [[50, 770], [50, 770]],
    ruta: '11311',
  },
  {
    id: 'CAMPOBASE-TACTICA-1141-GUIA-COMPLETA',
    formacion: '1-1-4-1',
    bloques: ['Estructura', 'Defensa'],
    dorsales: ['1', '2', '4', '5', '6', '8', '9'],
    manifest: TACTICA_1141_FRAMES,
    totales: [84, 85],
    duraciones: [[40, 90, 630], [50, 770]],
    ruta: '1141',
  },
  {
    id: 'CAMPOBASE-TACTICA-1411-GUIA-COMPLETA',
    formacion: '1-4-1-1',
    bloques: ['Estructura', 'Triangulaciones', 'Equilibrio'],
    dorsales: ['1', '2', '4', '5', '6', '8', '9'],
    manifest: TACTICA_1411_FRAMES,
    totales: [81, 85, 85],
    duraciones: [[40], [40, 630], [40, 630]],
    ruta: '1411',
  },
  {
    id: 'CAMPOBASE-TACTICA-12211-GUIA-COMPLETA',
    formacion: '1-2-2-1-1',
    bloques: ['Estructura', 'Basculación', 'Transformaciones'],
    dorsales: ['1', '4', '5', '6', '8', '9', '10'],
    manifest: TACTICA_12211_FRAMES,
    totales: [163, 165, 159],
    duraciones: [[80, 160, 240, 2240], [80, 160, 2240], [80, 160, 240, 2240]],
    ruta: '12211',
  },
];

test('las cinco tácticas nuevas conservan formación, bloques, dorsales y medios reales', () => {
  for (const esperado of NUEVAS_TACTICAS) {
    const tactica = findTacticaInteractiva(esperado.id);
    assert.ok(tactica, `${esperado.id} existe`);
    assert.equal(tactica.formacion, esperado.formacion);
    assert.deepEqual(tactica.bloques.map((b) => b.nombre_corto), esperado.bloques);
    assert.deepEqual(tactica.team.map((p) => p.n), esperado.dorsales);
    tactica.bloques.forEach((bloque, idx) => {
      assert.equal(bloque.animacion.total, esperado.totales[idx]);
      assert.match(bloque.animacion.frames, new RegExp(`assets/tacticas/CAMPOBASE-TACTICA-${esperado.ruta}-GUIA-COMPLETA/bloque-${idx + 1}/frames/f$`));
      const manifiesto = esperado.manifest[String(idx + 1)];
      assert.equal(manifiesto.total, esperado.totales[idx]);
      assert.equal(manifiesto.durations.length, esperado.totales[idx]);
      assert.deepEqual([...new Set(manifiesto.durations)].sort((a, b) => a - b), esperado.duraciones[idx]);
    });
  }
});
