import test from 'node:test';
import assert from 'node:assert/strict';
import { findValidatedExercise } from '../js/ejercicios-validados.js';

const ID = 'CAMPOBASE-VIDEO-PASE-BALON-ESPACIO-2-CONOS-1V1-FINALIZACION';

test('corrige el vídeo como circuito de conos con centro y remate, no como 1v1', () => {
  const exercise = findValidatedExercise(ID);
  assert.ok(exercise, 'se conserva el ejercicio existente');

  const description = [
    exercise.nombre,
    exercise.vista_rapida?.explicacion_breve,
    ...(exercise.detalle?.desarrollo || []),
    ...(exercise.detalle?.reglas || []),
  ].join(' ');

  assert.match(description, /circuito de conos/i);
  assert.match(description, /centro lateral/i);
  assert.match(description, /remat/i);
  assert.doesNotMatch(description, /1v1/i);
  assert.doesNotMatch(description, /defensor/i);
  assert.match(exercise.animacion?.gif || '', /Centro_Remate/i);
  assert.equal(
    exercise.video,
    'https://mdzpygfwugawlmknywxa.supabase.co/storage/v1/object/public/ejercicio-videos/CAMPOBASE-VIDEO-PASE-BALON-ESPACIO-2-CONOS-1V1-FINALIZACION/video.mp4',
  );
});
