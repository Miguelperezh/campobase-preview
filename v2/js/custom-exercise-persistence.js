import './exercise-content-quality.js?v=1';
import './exercise-vocabulary-ui.js?v=1';
import { getOne, put } from './db.js';
import { buildExercise } from './training-domain.js';

const hasBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
const USER_EXERCISE_PREFIX = 'pdf98-user-';

function formValues(form) {
  return Object.fromEntries(new FormData(form));
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2600);
}

async function saveCustomExercise(form) {
  const values = formValues(form);
  const existingId = String(values.id || '');
  const isExistingCustom = existingId.startsWith(USER_EXERCISE_PREFIX);
  const existing = isExistingCustom ? await getOne('settings', existingId) : null;
  const id = existing?.id || `${USER_EXERCISE_PREFIX}${crypto.randomUUID()}`;
  const now = Date.now();
  const saved = buildExercise(values, {
    id,
    favorite: existing?.favorite ?? false,
    createdAt: existing?.createdAt ?? now,
    now,
    diagram: existing?.diagram,
    formato_juego: values.formato_juego,
  });

  await put('settings', {
    ...existing,
    ...saved,
    id,
    recordType: 'exercise',
    example: false,
    userCreated: true,
    source: 'personal',
    createdAt: existing?.createdAt ?? saved.createdAt ?? now,
    updatedAt: now,
  });

  document.getElementById('exercise-dialog')?.close();
  form.reset();
  if (window.__campobase?.refresh) await window.__campobase.refresh(true);
  window.__campobase?.showView?.('ejercicios');
  window.__campobase?.setExerciseLibraryMode?.('mine');
  showToast(existing ? 'Ejercicio actualizado en Mis ejercicios.' : 'Ejercicio creado y guardado en Mis ejercicios.');
}

function install() {
  document.addEventListener('submit', (event) => {
    const form = event.target?.closest?.('#exercise-form');
    if (!form) return;
    const id = String(form.elements.id?.value || '');

    // Los ejercicios oficiales existentes siguen usando el motor original.
    // Las altas nuevas y los ejercicios personales usan un ID persistente
    // compatible con la limpieza histórica de ejercicios antiguos.
    if (id && !id.startsWith(USER_EXERCISE_PREFIX)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    saveCustomExercise(form).catch((error) => {
      console.error('No se pudo guardar el ejercicio personal:', error);
      showToast(error?.message || 'No se pudo guardar el ejercicio.');
    });
  }, true);
}

if (hasBrowser) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
