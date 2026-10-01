import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const start = source.indexOf('function daysInMonth');
const end = source.indexOf('function askConfirmation');
assert.ok(start >= 0 && end > start, 'No se encontró el bloque de calendario en app.js');

const context = {};
vm.createContext(context);
vm.runInContext(`${source.slice(start, end)}
globalThis.__daysInMonth = daysInMonth;
globalThis.__isRealCalendarDate = isRealCalendarDate;
globalThis.__dayOptions = dayOptions;
globalThis.__composeDate = composeDate;`, context);

const daysInMonth = context.__daysInMonth;
const isRealCalendarDate = context.__isRealCalendarDate;
const dayOptions = context.__dayOptions;
const composeDate = context.__composeDate;

test('el calendario ofrece el número real de días de cada mes y año', () => {
  assert.equal(daysInMonth('09', '2026'), 30);
  assert.equal(daysInMonth('04', '2027'), 30);
  assert.equal(daysInMonth('01', '2027'), 31);
  assert.equal(daysInMonth('02', '2027'), 28);
  assert.equal(daysInMonth('02', '2028'), 29);
  assert.equal(daysInMonth('02', '2100'), 28);
  assert.equal(daysInMonth('02', '2000'), 29);
});

test('el selector no ofrece días imposibles', () => {
  assert.doesNotMatch(dayOptions('', '09', '2026'), /value="31"/);
  assert.match(dayOptions('', '08', '2026'), /value="31"/);
  assert.doesNotMatch(dayOptions('', '02', '2027'), /value="29"/);
  assert.match(dayOptions('', '02', '2028'), /value="29"/);
});

test('la validación rechaza días imposibles y admite bisiestos reales', () => {
  assert.equal(isRealCalendarDate('31', '09', '2026'), false);
  assert.equal(isRealCalendarDate('30', '09', '2026'), true);
  assert.equal(isRealCalendarDate('29', '02', '2027'), false);
  assert.equal(isRealCalendarDate('29', '02', '2028'), true);
  assert.throws(() => composeDate('31', '09', '2026'), /fecha real/i);
  assert.equal(composeDate('29', '02', '2028'), '2028-02-29');
});

test('cambiar mes o año recalcula los días del formulario', () => {
  assert.match(source, /document\.addEventListener\('change'/);
  assert.match(source, /\^\(\.\*\)\(Month\|Year\)\$/);
  assert.match(source, /refreshDateDayOptions\(form, name\)/);
});
