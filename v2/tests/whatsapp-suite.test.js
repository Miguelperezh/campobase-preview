import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  cleanPlayerNumber,
  formatWhatsAppPhone,
  getGreetingByHour,
  getAutoMapsUrl,
  formatLongDate,
  getToneVerbs,
  formatExclusionReasonText,
  getExclusionEncouragement,
  getWeekDateRange,
  getNextWeekDateRange,
  isWeekend,
  formatWeekSpanLabel,
  buildWhatsAppMatchConvocatoria,
  buildWhatsAppTrainingDay,
  buildWhatsAppTrainingWeek,
} from '../js/whatsapp-suite.js';

test('cleanPlayerNumber elimina almohadillas y espacios', () => {
  assert.equal(cleanPlayerNumber('#4'), '4');
  assert.equal(cleanPlayerNumber('# 10'), '10');
  assert.equal(cleanPlayerNumber(' 7 '), '7');
  assert.equal(cleanPlayerNumber(9), '9');
  assert.equal(cleanPlayerNumber(null), '');
  assert.equal(cleanPlayerNumber(undefined), '');
});

test('getGreetingByHour devuelve el saludo correcto según la franja horaria', () => {
  assert.equal(getGreetingByHour(7), 'Buenos días');
  assert.equal(getGreetingByHour(13), 'Buenos días');
  assert.equal(getGreetingByHour(14), 'Buenas tardes');
  assert.equal(getGreetingByHour(20), 'Buenas tardes');
  assert.equal(getGreetingByHour(21), 'Buenas noches');
  assert.equal(getGreetingByHour(3), 'Buenas noches');
});

test('getAutoMapsUrl genera la URL de Google Maps para el campo', () => {
  const url = getAutoMapsUrl('Campo Alfonso Silva');
  assert.ok(url.startsWith('https://maps.google.com/?q='));
  assert.ok(url.includes('Alfonso'));
});

test('formatLongDate formatea correctamente fechas simples e ISO', () => {
  const formatted = formatLongDate('2026-09-20T09:00:00');
  assert.ok(formatted.includes('20 de Septiembre de 2026') || formatted.includes('20 de septiembre de 2026'));
});

test('buildWhatsAppMatchConvocatoria para grupo: sin firma personal, con espinilleras y sin #', () => {
  const match = { opponent: 'Barriche', date: '2026-09-20' };
  const players = [
    { id: 'p1', name: 'Thiago Hernández', number: '#4' },
    { id: 'p2', name: 'Mateo González', number: '7' },
  ];
  const callup = { availableIds: ['p1', 'p2'], excludedIds: [] };

  const msg = buildWhatsAppMatchConvocatoria({
    teamName: 'C.F. Unión Viera Alevín D',
    match,
    callup,
    players,
    now: new Date('2026-09-20T10:00:00'),
  });

  assert.ok(msg.includes('Buenos días a todos/as,'));
  assert.ok(msg.includes('Barriche'));
  assert.ok(msg.includes('Thiago Hernández'));
  assert.ok(msg.includes('Mateo González'));
  assert.ok(!msg.includes('#4'), 'No debe tener almohadilla en los dorsales');
  assert.ok(msg.includes('espinilleras'), 'Los partidos obligan a llevar espinilleras');
  assert.ok(!msg.includes('¡Aúpa Viera!'), 'No debe incluir ¡Aúpa Viera!');
  assert.ok(msg.includes('¡Muchas gracias a todos/as!'), 'Debe incluir agradecimiento limpio');
  assert.ok(!msg.includes('Miguel'), 'No debe incluir firma de Miguel');
  assert.ok(!msg.includes('un saludo cordial'), 'No debe incluir un saludo cordial');
});

test('buildWhatsAppMatchConvocatoria individual: NO convocado omite campo, hora y material', () => {
  const match = { opponent: 'Guiniguada', date: '2026-09-20' };
  const players = [
    { id: 'p1', name: 'Thiago Hernández', number: '4', fatherName: 'Carlos', fatherPhone: '600111222' },
  ];
  const callup = { availableIds: [], excludedIds: ['p1'] };

  const msg = buildWhatsAppMatchConvocatoria({
    match,
    callup,
    players,
    targetPlayerId: 'p1',
    recipientType: 'parent',
    parentType: 'father',
    now: new Date('2026-09-20T15:00:00'),
  });

  assert.ok(msg.includes('Buenas tardes Carlos:'));
  assert.ok(msg.includes('*Thiago* *NO está CONVOCADO*'), 'Debe omitir apellido y dorsal para mensajes a padres y destacar con negrita');
  assert.ok(!msg.includes('Dorsal'), 'No debe incluir dorsal en mensaje a padres');
  assert.ok(!msg.includes('Hora de citación:'), 'No convocado NO debe tener hora de citación');
  assert.ok(!msg.includes('Campo:'), 'No convocado NO debe tener campo');
  assert.ok(!msg.includes('espinilleras'), 'No convocado NO debe tener material');
  assert.ok(msg.includes('¡Mucho ánimo'));
  assert.ok(!msg.includes('¡Aúpa Viera!'), 'No debe incluir ¡Aúpa Viera!');
  assert.ok(msg.includes('¡Muchas gracias!'), 'Debe cerrar con ¡Muchas gracias!');
  assert.ok(!msg.includes('¡Muchas gracias a todos/as!'), 'No debe decir a todos/as en mensajes a padres');
});

test('buildWhatsAppMatchConvocatoria individual: SI convocado incluye citación, campo y espinilleras', () => {
  const match = { opponent: 'Guiniguada', date: '2026-09-20' };
  const players = [
    { id: 'p1', name: 'Thiago Hernández', number: '4', motherName: 'Elena', motherPhone: '600333444' },
  ];
  const callup = { availableIds: ['p1'], excludedIds: [] };

  const msg = buildWhatsAppMatchConvocatoria({
    match,
    callup,
    players,
    targetPlayerId: 'p1',
    recipientType: 'parent',
    parentType: 'mother',
    fieldName: 'Campo Alfonso Silva',
    now: new Date('2026-09-20T21:30:00'),
  });

  assert.ok(msg.includes('Buenas noches Elena:'));
  assert.ok(msg.includes('convocatoria para *Thiago*:'), 'Omite apellido y dorsal en mensaje individual');
  assert.ok(!msg.includes('Dorsal 4'), 'No debe incluir dorsal para los padres');
  assert.ok(msg.includes('Hora de citación:'));
  assert.ok(msg.includes('Alfonso Silva'));
  assert.ok(msg.includes('espinilleras'));
  assert.ok(!msg.includes('¡Aúpa Viera!'), 'No debe incluir ¡Aúpa Viera!');
  assert.ok(msg.includes('¡Muchas gracias!'), 'Debe cerrar con ¡Muchas gracias!');
});

test('buildWhatsAppTrainingDay: NO requiere espinilleras, incluye balón y agua', () => {
  const session = { date: '2026-09-15', time: '16:30', duration: 75 };
  const msg = buildWhatsAppTrainingDay({
    session,
    fieldName: 'Campo Alfonso Silva',
    now: new Date('2026-09-15T10:00:00'),
  });

  assert.ok(msg.includes('Buenos días a todos/as,'));
  assert.ok(msg.includes('16:30 h'));
  assert.ok(msg.includes('Alfonso Silva'));
  assert.ok(msg.includes('Botella de agua individual'));
  assert.ok(msg.includes('Balón de fútbol T4'));
  assert.ok(!msg.includes('espinilleras'), 'En entrenamientos NO es necesario espinilleras');
  assert.ok(!msg.includes('Miguel'));
  assert.ok(!msg.includes('¡Aúpa Viera!'), 'No debe incluir ¡Aúpa Viera!');
  assert.ok(msg.includes('¡Muchas gracias a todos/as!'));
});

test('formatWhatsAppPhone normaliza números españoles con prefijo 34', () => {
  assert.equal(formatWhatsAppPhone('600111222'), '34600111222');
  assert.equal(formatWhatsAppPhone('712 345 678'), '34712345678');
  assert.equal(formatWhatsAppPhone('+34 600 111 222'), '34600111222');
  assert.equal(formatWhatsAppPhone('34600111222'), '34600111222');
  assert.equal(formatWhatsAppPhone(''), '');
  assert.equal(formatWhatsAppPhone(null), '');
});

test('buildWhatsAppMatchConvocatoria individual a Padre y Madre (ambos) usa primera persona singular', () => {
  const match = { opponent: 'Guiniguada', date: '2026-09-20' };
  const players = [
    { id: 'p1', name: 'Thiago Hernández', number: '4', fatherName: 'Carlos', motherName: 'Elena' },
  ];
  const callup = { availableIds: ['p1'], excludedIds: [] };

  // Tratamiento canario por defecto (Les comparto)
  const msgCanary = buildWhatsAppMatchConvocatoria({
    match,
    callup,
    players,
    targetPlayerId: 'p1',
    recipientType: 'parent',
    parentType: 'both',
    callupStatus: 'called',
    tone: 'canary',
    now: new Date('2026-09-20T10:00:00'),
  });

  assert.ok(msgCanary.includes('Buenos días Carlos y Elena:'), 'Debe saludar a padre y madre juntos');
  assert.ok(msgCanary.includes('Les comparto la información de la convocatoria para *Thiago*:'), '1.ª persona singular en canario con nombre de pila y sin dorsal');
  assert.ok(!msgCanary.includes('compartimos'), 'Nunca debe usar primera persona del plural (compartimos)');
  assert.ok(msgCanary.includes('espinilleras'));
  assert.ok(msgCanary.includes('¡Muchas gracias!'), 'Cierre individual sin a todos/as');
  assert.ok(!msgCanary.includes('¡Muchas gracias a todos/as!'));

  // Tratamiento peninsular (Os comparto)
  const msgPeninsular = buildWhatsAppMatchConvocatoria({
    match,
    callup,
    players,
    targetPlayerId: 'p1',
    recipientType: 'parent',
    parentType: 'both',
    callupStatus: 'called',
    tone: 'peninsular',
    now: new Date('2026-09-20T10:00:00'),
  });
  assert.ok(msgPeninsular.includes('Os comparto la información de la convocatoria para *Thiago*:'), '1.ª persona singular en peninsular con nombre de pila');
  assert.ok(!msgPeninsular.includes('compartimos'), 'Nunca debe usar primera persona del plural (compartimos)');

  // Individual a un solo progenitor (Te comparto)
  const msgSoloPadre = buildWhatsAppMatchConvocatoria({
    match,
    callup,
    players,
    targetPlayerId: 'p1',
    recipientType: 'parent',
    parentType: 'father',
    callupStatus: 'called',
    tone: 'canary',
    now: new Date('2026-09-20T10:00:00'),
  });
  assert.ok(msgSoloPadre.includes('Te comparto la información de la convocatoria para *Thiago*:'));

  // Individual formal (Le comparto)
  const msgFormal = buildWhatsAppMatchConvocatoria({
    match,
    callup,
    players,
    targetPlayerId: 'p1',
    recipientType: 'parent',
    parentType: 'father',
    callupStatus: 'called',
    tone: 'formal',
    now: new Date('2026-09-20T10:00:00'),
  });
  assert.ok(msgFormal.includes('Le comparto la información de la convocatoria para *Thiago*:'));
});

test('buildWhatsAppMatchConvocatoria forzado a NO Convocado incluye motivo (rotación por defecto)', () => {
  const match = { opponent: 'Guiniguada', date: '2026-09-20' };
  const players = [
    { id: 'p1', name: 'Thiago Hernández', number: '4', fatherName: 'Carlos', motherName: 'Elena' },
  ];
  const callup = { availableIds: ['p1'], excludedIds: [] };

  const msg = buildWhatsAppMatchConvocatoria({
    match,
    callup,
    players,
    targetPlayerId: 'p1',
    recipientType: 'parent',
    parentType: 'both',
    callupStatus: 'excluded',
    tone: 'canary',
    now: new Date('2026-09-20T10:00:00'),
  });

  assert.ok(msg.includes('Buenos días Carlos y Elena:'));
  assert.ok(msg.includes('Les comunico que *Thiago* *NO está CONVOCADO*'));
  assert.ok(!msg.includes('Dorsal 4'), 'No debe incluir dorsal');
  assert.ok(msg.includes('por *rotación*'), 'Debe incluir por *rotación*');
  assert.ok(!msg.includes('comunicamos'), 'Nunca debe decir comunicamos');
  assert.ok(!msg.includes('Hora de citación:'));
  assert.ok(!msg.includes('espinilleras'));
  assert.ok(msg.includes('¡Mucho ánimo'));
});

test('buildWhatsAppMatchConvocatoria incluye motivos específicos: tarjetas, lesión, entreno, etc.', () => {
  const match = { opponent: 'Guiniguada', date: '2026-09-20' };
  const players = [
    { id: 'p1', name: 'Thiago Hernández', number: '4', fatherName: 'Carlos' },
  ];

  // 1. Por sanción de tarjetas
  const msgCards = buildWhatsAppMatchConvocatoria({
    match,
    players,
    targetPlayerId: 'p1',
    recipientType: 'parent',
    parentType: 'father',
    callupStatus: 'excluded',
    exclusionReason: 'cards',
    now: new Date('2026-09-20T10:00:00'),
  });
  assert.ok(msgCards.includes('Te comunico que *Thiago* *NO está CONVOCADO*'));
  assert.ok(msgCards.includes('por *sanción de tarjetas*'));

  // 2. Por lesión (con nota opcional)
  const msgInjured = buildWhatsAppMatchConvocatoria({
    match,
    players,
    targetPlayerId: 'p1',
    recipientType: 'parent',
    parentType: 'father',
    callupStatus: 'excluded',
    exclusionReason: 'injured',
    exclusionNote: 'esguince de tobillo',
    now: new Date('2026-09-20T10:00:00'),
  });
  assert.ok(msgInjured.includes('por *lesión* (esguince de tobillo)'));
  assert.ok(msgInjured.includes('pronta recuperación'));

  // 3. Por no haber venido a entrenar
  const msgTraining = buildWhatsAppMatchConvocatoria({
    match,
    players,
    targetPlayerId: 'p1',
    recipientType: 'parent',
    parentType: 'father',
    callupStatus: 'excluded',
    exclusionReason: 'training',
    now: new Date('2026-09-20T10:00:00'),
  });
  assert.ok(msgTraining.includes('por *no haber venido a entrenar*'));
  assert.ok(msgTraining.includes('próximas sesiones de entrenamiento'));

  // 4. Por decisión técnica
  const msgCoach = buildWhatsAppMatchConvocatoria({
    match,
    players,
    targetPlayerId: 'p1',
    recipientType: 'parent',
    parentType: 'father',
    callupStatus: 'excluded',
    exclusionReason: 'coach_decision',
    now: new Date('2026-09-20T10:00:00'),
  });
  assert.ok(msgCoach.includes('por *decisión técnica*'));

  // 5. Motivo personalizado
  const msgCustom = buildWhatsAppMatchConvocatoria({
    match,
    players,
    targetPlayerId: 'p1',
    recipientType: 'parent',
    parentType: 'father',
    callupStatus: 'excluded',
    exclusionReason: 'custom',
    exclusionNote: 'viaje familiar',
    now: new Date('2026-09-20T10:00:00'),
  });
  assert.ok(msgCustom.includes('por *viaje familiar*') || msgCustom.includes('*viaje familiar*'));
});

test('getToneVerbs y formatExclusionReasonText cubren todas las combinaciones', () => {
  // Verbos de tratamiento
  const canaryBoth = getToneVerbs({ tone: 'canary', parentType: 'both', recipientType: 'parent' });
  assert.equal(canaryBoth.comparto, 'Les comparto');
  assert.equal(canaryBoth.comunico, 'Les comunico');
  assert.equal(canaryBoth.recuerdo, 'Les recuerdo');

  const canarySingle = getToneVerbs({ tone: 'canary', parentType: 'father', recipientType: 'parent' });
  assert.equal(canarySingle.comparto, 'Te comparto');
  assert.equal(canarySingle.comunico, 'Te comunico');
  assert.equal(canarySingle.recuerdo, 'Te recuerdo');

  const peninsularBoth = getToneVerbs({ tone: 'peninsular', parentType: 'both', recipientType: 'parent' });
  assert.equal(peninsularBoth.comparto, 'Os comparto');
  assert.equal(peninsularBoth.comunico, 'Os comunico');
  assert.equal(peninsularBoth.recuerdo, 'Os recuerdo');

  const formalSingle = getToneVerbs({ tone: 'formal', parentType: 'father', recipientType: 'parent' });
  assert.equal(formalSingle.comparto, 'Le comparto');
  assert.equal(formalSingle.comunico, 'Le comunico');
  assert.equal(formalSingle.recuerdo, 'Le recuerdo');

  // Formatos de motivos con negritas
  assert.equal(formatExclusionReasonText('rotation'), 'por *rotación*');
  assert.equal(formatExclusionReasonText('injured'), 'por *lesión*');
  assert.equal(formatExclusionReasonText('cards'), 'por *sanción de tarjetas*');
  assert.equal(formatExclusionReasonText('suspended'), 'por *sanción de tarjetas*');
  assert.equal(formatExclusionReasonText('training'), 'por *no haber venido a entrenar*');
  assert.equal(formatExclusionReasonText('missed_training'), 'por *no haber venido a entrenar*');
  assert.equal(formatExclusionReasonText('sick'), 'por *encontrarse indispuesto/a*');
  assert.equal(formatExclusionReasonText('coach_decision'), 'por *decisión técnica*');
  assert.equal(formatExclusionReasonText('personal'), 'por *motivos personales*');
  assert.equal(formatExclusionReasonText('none'), '');
});

test('buildWhatsAppTrainingDay a Padre y Madre (ambos) usa 1.ª persona singular (Les recuerdo / Os recuerdo)', () => {
  const session = { date: '2026-09-15', time: '16:30', duration: 75 };
  const targetPlayer = { id: 'p1', name: 'Thiago Hernández', fatherName: 'Carlos', motherName: 'Elena' };

  // Canario
  const msgCanary = buildWhatsAppTrainingDay({
    session,
    targetPlayer,
    parentType: 'both',
    fieldName: 'Campo Alfonso Silva',
    tone: 'canary',
    now: new Date('2026-09-15T10:00:00'),
  });
  assert.ok(msgCanary.includes('Buenos días Carlos y Elena:'));
  assert.ok(msgCanary.includes('Les recuerdo los detalles de la sesión de entrenamiento:'));
  assert.ok(!msgCanary.includes('recordamos'), 'No debe usar recordamos');
  assert.ok(msgCanary.includes('Botella de agua individual'));
  assert.ok(!msgCanary.includes('espinilleras'));

  // Peninsular
  const msgPeninsular = buildWhatsAppTrainingDay({
    session,
    targetPlayer,
    parentType: 'both',
    fieldName: 'Campo Alfonso Silva',
    tone: 'peninsular',
    now: new Date('2026-09-15T10:00:00'),
  });
  assert.ok(msgPeninsular.includes('Os recuerdo los detalles de la sesión de entrenamiento:'));

  // Singular
  const msgSingle = buildWhatsAppTrainingDay({
    session,
    targetPlayer,
    parentType: 'father',
    fieldName: 'Campo Alfonso Silva',
    now: new Date('2026-09-15T10:00:00'),
  });
  assert.ok(msgSingle.includes('Te recuerdo los detalles de la sesión de entrenamiento:'));
});

test('buildWhatsAppTrainingWeek ordena sesiones de más próxima a más lejana (más próximas arriba)', () => {
  const unorderedSessions = [
    { date: '2026-09-18', time: '17:00', field: 'Campo del Pilar' },
    { date: '2026-09-15', time: '16:30', field: 'Alfonso Silva' },
    { date: '2026-09-16', time: '16:30', field: 'Alfonso Silva' },
  ];

  const msg = buildWhatsAppTrainingWeek({
    sessions: unorderedSessions,
    tacticalGoal: 'Objetivo de prueba',
    now: new Date('2026-09-14T10:00:00'),
  });

  const idx15 = msg.indexOf('15 de Septiembre') !== -1 ? msg.indexOf('15 de Septiembre') : msg.indexOf('15 de septiembre');
  const idx16 = msg.indexOf('16 de Septiembre') !== -1 ? msg.indexOf('16 de Septiembre') : msg.indexOf('16 de septiembre');
  const idx18 = msg.indexOf('18 de Septiembre') !== -1 ? msg.indexOf('18 de Septiembre') : msg.indexOf('18 de septiembre');

  assert.ok(idx15 < idx16, 'La sesión del día 15 debe aparecer antes que la del 16');
  assert.ok(idx16 < idx18, 'La sesión del día 16 debe aparecer antes que la del 18');
  assert.ok(msg.includes('Les comparto la planificación') || msg.includes('Os comparto la planificación'));
  assert.ok(!msg.includes('compartimos'), 'No debe usar compartimos');
});

test('getWeekDateRange calcula lunes a domingo de forma precisa', () => {
  const rangeMidweek = getWeekDateRange('2026-09-16');
  assert.equal(rangeMidweek.start, '2026-09-14');
  assert.equal(rangeMidweek.end, '2026-09-20');

  const rangeSunday = getWeekDateRange('2026-09-20');
  assert.equal(rangeSunday.start, '2026-09-14');
  assert.equal(rangeSunday.end, '2026-09-20');

  const rangeMonday = getWeekDateRange('2026-09-14');
  assert.equal(rangeMonday.start, '2026-09-14');
  assert.equal(rangeMonday.end, '2026-09-20');
});

test('getNextWeekDateRange calcula correctamente el rango lunes-domingo de la siguiente semana', () => {
  // Desde un domingo (ej. 2026-09-20), la próxima semana debe ser del lunes 21 al domingo 27
  const fromSunday = getNextWeekDateRange('2026-09-20');
  assert.equal(fromSunday.start, '2026-09-21');
  assert.equal(fromSunday.end, '2026-09-27');

  // Desde un sábado (ej. 2026-09-19), la próxima semana debe ser del lunes 21 al domingo 27
  const fromSaturday = getNextWeekDateRange('2026-09-19');
  assert.equal(fromSaturday.start, '2026-09-21');
  assert.equal(fromSaturday.end, '2026-09-27');

  // Desde mitad de semana (ej. miércoles 2026-09-16), la próxima semana es 21 al 27
  const fromWednesday = getNextWeekDateRange('2026-09-16');
  assert.equal(fromWednesday.start, '2026-09-21');
  assert.equal(fromWednesday.end, '2026-09-27');
});

test('isWeekend detecta correctamente sábados y domingos', () => {
  assert.equal(isWeekend('2026-09-19'), true, 'Sábado 19 debe ser fin de semana');
  assert.equal(isWeekend('2026-09-20'), true, 'Domingo 20 debe ser fin de semana');
  assert.equal(isWeekend('2026-09-21'), false, 'Lunes 21 no es fin de semana');
  assert.equal(isWeekend('2026-09-18'), false, 'Viernes 18 no es fin de semana');
});

test('formatWeekSpanLabel genera la etiqueta legible del rango de semana', () => {
  const label = formatWeekSpanLabel('2026-09-21', '2026-09-27');
  assert.ok(label.toLowerCase().includes('del 21 al 27 de septiembre'), `Esperaba "del 21 al 27 de septiembre", obtuvo: ${label}`);
});

test('buildWhatsAppTrainingWeek con rango de próxima semana omite días pasados de la semana anterior', () => {
  const nextWeekRange = getNextWeekDateRange('2026-09-20');
  assert.equal(nextWeekRange.start, '2026-09-21');
  assert.equal(nextWeekRange.end, '2026-09-27');

  const upcomingSessions = [
    { date: '2026-09-22', time: '17:00', field: 'Alfonso Silva' },
    { date: '2026-09-24', time: '17:00', field: 'Alfonso Silva' },
  ];

  const msg = buildWhatsAppTrainingWeek({
    sessions: upcomingSessions,
    match: { date: '2026-09-26', time: '10:00', opponent: 'Arucas' },
    weekRangeLabel: formatWeekSpanLabel(nextWeekRange.start, nextWeekRange.end),
    tacticalGoal: 'Presión tras pérdida',
    now: new Date('2026-09-20T11:00:00'),
  });

  assert.ok(msg.includes('22 de Septiembre') || msg.includes('22 de septiembre'), 'Debe incluir entreno del 22');
  assert.ok(msg.includes('24 de Septiembre') || msg.includes('24 de septiembre'), 'Debe incluir entreno del 24');
  assert.ok(msg.includes('SÁBADO') && msg.includes('Arucas'), 'Debe incluir partido del sábado vs Arucas');
  assert.ok(!msg.includes('14 de Septiembre') && !msg.includes('14 de septiembre'), 'No debe incluir el 14 de septiembre pasado');
  assert.ok(!msg.includes('17 de Septiembre') && !msg.includes('17 de septiembre'), 'No debe incluir el 17 de septiembre pasado');
  assert.ok(msg.includes('21 AL 27') || msg.includes('21 al 27'), 'Debe mencionar el rango del 21 al 27');
});

test('buildWhatsAppTrainingWeek incluye dos partidos si se juegan en la misma semana (días distintos)', () => {
  const sessions = [
    { date: '2026-09-22', time: '17:00', field: 'Alfonso Silva' },
    { date: '2026-09-24', time: '17:00', field: 'Alfonso Silva' },
  ];

  const matches = [
    { date: '2026-09-26', time: '10:00', opponent: 'Barriche', field: 'Campo Municipal' },
    { date: '2026-09-27', time: '11:30', opponent: 'Arucas C.F.', field: 'Alfonso Silva' },
  ];

  const msg = buildWhatsAppTrainingWeek({
    sessions,
    matches,
    weekRangeLabel: 'del 21 al 27 de septiembre',
    tacticalGoal: 'Transición ofensiva rápida',
    now: new Date('2026-09-20T12:00:00'),
  });

  assert.ok(msg.includes('SÁBADO') && msg.includes('Barriche'), 'Debe incluir el partido del sábado vs Barriche');
  assert.ok(msg.includes('10:00 h'), 'Debe incluir la hora del partido del sábado');
  assert.ok(msg.includes('Campo Municipal'), 'Debe incluir el campo del sábado');

  assert.ok(msg.includes('DOMINGO') && msg.includes('Arucas C.F.'), 'Debe incluir el partido del domingo vs Arucas');
  assert.ok(msg.includes('11:30 h'), 'Debe incluir la hora del partido del domingo');
  assert.ok(msg.includes('Alfonso Silva'), 'Debe incluir el campo del domingo');

  const idxBarriche = msg.indexOf('Barriche');
  const idxArucas = msg.indexOf('Arucas C.F.');
  assert.ok(idxBarriche < idxArucas, 'El partido del sábado debe aparecer antes que el del domingo');
});

test('buildWhatsAppTrainingWeek incluye dos partidos si se juegan el mismo día', () => {
  const matches = [
    { date: '2026-09-26', time: '09:30', opponent: 'Barriche', field: 'Alfonso Silva' },
    { date: '2026-09-26', time: '12:00', opponent: 'Veteranos', field: 'Alfonso Silva' },
  ];

  const msg = buildWhatsAppTrainingWeek({
    matches,
    weekRangeLabel: 'del 21 al 27 de septiembre',
    now: new Date('2026-09-20T12:00:00'),
  });

  assert.ok(msg.includes('09:30 h') && msg.includes('Barriche'), 'Debe incluir primer partido');
  assert.ok(msg.includes('12:00 h') && msg.includes('Veteranos'), 'Debe incluir segundo partido');
  assert.ok(msg.indexOf('Barriche') < msg.indexOf('Veteranos'), 'El partido de las 09:30 debe ir antes que el de las 12:00');
});

test('tono peninsular_plural usa Os comunicamos / Os compartimos y omite apellidos y dorsal', () => {
  const match = { opponent: 'Gran Canaria Alevín', date: '2026-09-20' };
  const players = [
    { id: 'p1', name: 'Aitor Navarro', number: '11', fatherName: 'Carlos', motherName: 'Elena' },
  ];

  const msgExcluded = buildWhatsAppMatchConvocatoria({
    match,
    players,
    targetPlayerId: 'p1',
    recipientType: 'parent',
    parentType: 'both',
    callupStatus: 'excluded',
    exclusionReason: 'rotation',
    tone: 'peninsular_plural',
    now: new Date('2026-09-20T10:00:00'),
  });

  assert.ok(msgExcluded.includes('Os comunicamos que *Aitor* *NO está CONVOCADO*'));
  assert.ok(!msgExcluded.includes('Navarro'), 'No debe contener el apellido del jugador');
  assert.ok(!msgExcluded.includes('Dorsal 11'), 'No debe contener el dorsal');
  assert.ok(msgExcluded.includes('por *rotación*'));
  assert.ok(msgExcluded.includes('¡Muchas gracias!'));

  const verbs = getToneVerbs({ tone: 'peninsular_plural', recipientType: 'group' });
  assert.equal(verbs.comunico, 'Os comunicamos');
  assert.equal(verbs.comparto, 'Os compartimos');
  assert.equal(verbs.recuerdo, 'Os recordamos');
});

test('saludo individual usa a la familia de [Jugador] si no hay nombre de progenitor (nunca Buenos días: a secas)', () => {
  const match = { opponent: 'Guiniguada', date: '2026-09-20' };
  const players = [
    { id: 'p1', name: 'Aitor Navarro', number: '11' }, // Sin fatherName ni motherName
  ];

  const msgFather = buildWhatsAppMatchConvocatoria({
    match,
    players,
    targetPlayerId: 'p1',
    recipientType: 'parent',
    parentType: 'father',
    callupStatus: 'excluded',
    exclusionReason: 'cards',
    now: new Date('2026-09-20T10:00:00'),
  });

  assert.ok(msgFather.includes('Buenos días a la familia de Aitor:'), 'Debe saludar a la familia si no hay nombre');
  assert.ok(!msgFather.startsWith('Buenos días:\n\n'), 'Nunca debe dejar Buenos días: a secas');
  assert.ok(msgFather.includes('por *sanción de tarjetas*'));
});

test('exclusionNote vacío NO resucita notas anteriores como (No vino)', () => {
  const match = { opponent: 'Gran Canaria Alevín', date: '2026-09-20' };
  const players = [
    { id: 'p1', name: 'Aitor Navarro', number: '11', fatherName: 'Carlos' },
  ];
  // Convocatoria con nota antigua "No vino" en la base de datos
  const callup = {
    availableIds: [],
    excludedIds: ['p1'],
    exclusions: [{ playerId: 'p1', reason: 'training', note: 'No vino' }],
  };

  const msg = buildWhatsAppMatchConvocatoria({
    match,
    callup,
    players,
    targetPlayerId: 'p1',
    recipientType: 'parent',
    parentType: 'father',
    callupStatus: 'excluded',
    exclusionReason: 'cards',
    exclusionNote: '', // El usuario vació la aclaración
    now: new Date('2026-09-20T10:00:00'),
  });

  assert.ok(!msg.includes('No vino'), 'No debe resucitar la nota antigua No vino');
  assert.ok(msg.includes('por *sanción de tarjetas*'));
});

test('buildWhatsAppTrainingWeek formatea duraciones como 60 min o 75 min (nunca 15 min)', () => {
  const sessions = [
    { date: '2026-09-14', time: '16:30', field: 'Alfonso Silva', duration: 15 },
    { date: '2026-09-15', time: '16:30', field: 'Alfonso Silva', duration: 60 },
    { date: '2026-09-17', time: '16:30', field: 'Campo del Pilar', duration: 75 },
  ];

  const msg = buildWhatsAppTrainingWeek({
    sessions,
    weekendMatch: { opponent: 'El Calero', date: '2026-09-20', time: '10:00', field: 'El Calero' },
    now: new Date('2026-09-14T10:00:00'),
  });

  assert.ok(!msg.includes('(15 min)'), 'No debe mostrar 15 min');
  assert.ok(msg.includes('*(75 min)*') || msg.includes('*(60 min)*'), 'Debe mostrar 75 min o 60 min con negrita');
});

test('WhatsApp de amistoso avisa del partido sin comunicar convocatoria porque va toda la plantilla', () => {
  const match = { opponent: 'Guiniguada', date: '2026-09-21', type: 'friendly' };
  const players = [
    { id: 'p1', name: 'Aitor Navarro', number: '11', fatherName: 'Carlos' },
    { id: 'p2', name: 'Mateo Moyano', number: '1' },
  ];
  const callup = { availableIds: ['p1'], excludedIds: ['p2'] };

  const group = buildWhatsAppMatchConvocatoria({
    match,
    callup,
    players,
    now: new Date('2026-09-20T10:00:00'),
  });

  assert.ok(group.includes('PARTIDO AMISTOSO'));
  assert.ok(group.includes('Amistoso (vs Guiniguada)'));
  assert.ok(!group.includes('CONVOCATORIA'), 'Un amistoso no debe anunciar convocatoria');
  assert.ok(!group.includes('JUGADORES CONVOCADOS'), 'No debe listar convocados en amistosos');
  assert.ok(!group.includes('NO está CONVOCADO'), 'No debe excluir jugadores en amistosos');
  assert.ok(group.includes('Hora de citación:'));
  assert.ok(group.includes('espinilleras'));

  const individual = buildWhatsAppMatchConvocatoria({
    match,
    callup,
    players,
    targetPlayerId: 'p2',
    recipientType: 'parent',
    parentType: 'father',
    callupStatus: 'excluded',
    now: new Date('2026-09-20T10:00:00'),
  });

  assert.ok(individual.includes('información del *partido amistoso* para *Mateo*'));
  assert.ok(!individual.includes('NO está CONVOCADO'));
  assert.ok(!individual.includes('información de la convocatoria'));
  assert.ok(individual.includes('Hora de citación:'));
});

test('WhatsApp de torneo avisa del torneo sin convocatoria y conserva los datos validados del partido', () => {
  const match = { opponent: 'Arucas', date: '2026-09-27', type: 'tournament' };
  const players = [{ id: 'p1', name: 'Aitor Navarro', number: '11' }];

  const msg = buildWhatsAppMatchConvocatoria({
    match,
    players,
    fieldName: 'Campo Municipal',
    callTime: '08:30',
    gameTime: '09:15',
    kit: '1.ª Oficial',
    now: new Date('2026-09-26T18:00:00'),
  });

  assert.ok(msg.includes('TORNEO'));
  assert.ok(msg.includes('Torneo (vs Arucas)'));
  assert.ok(!msg.includes('CONVOCATORIA'));
  assert.ok(!msg.includes('JUGADORES CONVOCADOS'));
  assert.ok(msg.includes('08:30 h'));
  assert.ok(msg.includes('09:15 h'));
  assert.ok(msg.includes('Campo Municipal'));
  assert.ok(msg.includes('1.ª Oficial'));
  assert.ok(msg.includes('espinilleras'));
});

test('el controlador de WhatsApp usa el location real del partido seleccionado', async () => {
  const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  assert.match(app, /eventValue\.startsWith\('match:'\)/);
  assert.match(app, /eventValue\.slice\('match:'\.length\)/);
  assert.match(app, /const fieldName = String\(match\.location \|\| ''\)\.trim\(\)/);
  assert.match(app, /populateWhatsAppEvents\(matchId, callupId, sessionId\);\s*if \(waCurrentMode === 'callup'\) syncWhatsAppMatchLocation\(\)/);
  assert.doesNotMatch(app, /match\.location \|\| 'Campo Alfonso Silva \(La Ballena\)'/);
});

test('index.html y app.js integran selector de semana para WhatsApp con proxima semana por defecto en fin de semana', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.match(html, /id="wa-week-select"/, 'index.html debe contener el selector #wa-week-select');
  assert.match(app, /populateWhatsAppWeekSelector/, 'app.js debe tener función para poblar el selector de semana');
  assert.match(app, /getSelectedWhatsAppWeekRange/, 'app.js debe calcular el rango de semana seleccionado');
  assert.match(app, /isWeekend\(today\)/, 'app.js debe comprobar si hoy es fin de semana para preseleccionar la próxima semana');
});

test('isUserInteracting no bloquea por details[open] y refresh fuerza o aplaza el render de forma segura', async () => {
  const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const isInteractingFn = app.slice(app.indexOf('function isUserInteracting()'), app.indexOf('function scheduleDeferredRender()'));
  const renderOrDeferFn = app.slice(app.indexOf('function renderOrDefer(force = false)'), app.indexOf('async function deduplicatePlayers()'));

  assert.doesNotMatch(isInteractingFn, /document\.querySelector\(['"]details\[open\]['"]\)/, 'isUserInteracting no debe considerar details[open] como interacción bloqueante');
  assert.match(app, /const force = arguments\[0\] === true;/, 'refresh debe leer el flag force');
  assert.match(app, /renderOrDefer\(force\);/, 'refresh debe delegar el render seguro con el flag force');
  assert.match(renderOrDeferFn, /if \(force \|\| !isUserInteracting\(\)\)/, 'renderOrDefer debe renderizar inmediatamente si force es true o si no hay interacción');
  assert.match(renderOrDeferFn, /renderAll\(\);/, 'renderOrDefer debe ejecutar renderAll en la ruta inmediata');
  assert.match(renderOrDeferFn, /scheduleDeferredRender\(\);/, 'renderOrDefer debe aplazar el render si la interacción sigue activa');
});

test('app.js permite incluir múltiples partidos en la planificación semanal de WhatsApp', async () => {
  const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  // Comprueba que updateWhatsAppPreview mapea targetMatches como array de matches
  assert.match(app, /matches:\s*targetMatches\.map/, 'updateWhatsAppPreview debe enviar todos los partidos de la semana a buildWhatsAppTrainingWeek');
  // Comprueba que populateWhatsAppEvents maneja matchesThisWeek.length > 1
  assert.match(app, /matchesThisWeek\.length > 1/, 'populateWhatsAppEvents debe detectar cuando hay más de un partido en la semana');
  assert.match(app, /Incluir los \$\{matchesThisWeek\.length\} partidos/, 'Debe ofrecer la opción automática de incluir todos los partidos');
});



