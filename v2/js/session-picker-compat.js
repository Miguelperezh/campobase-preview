// Compatibilidad entre el selector visual de ejercicios y el planificador de Sesiones.
// Mantiene disponible el catálogo después de añadir un ejercicio, sin tocar la lógica de guardado.

function preparePickerCard(card) {
  if (!(card instanceof Element)) return;
  if (!card.classList.contains('session-picker-card')) return;

  // session-planner-ui reconstruye su catálogo a partir de .picker-card.
  // El selector visual usa .session-picker-card; ambas clases deben coexistir.
  card.classList.add('picker-card');

  // Conserva la duración para ejercicios no validados que no tienen ficha maestra.
  if (!card.querySelector('.exercise-highlights')) {
    const duration = [...card.querySelectorAll('.pill')]
      .find((pill) => /\b\d+\s*min\b/i.test(pill.textContent || ''));
    if (duration) {
      const highlights = document.createElement('div');
      highlights.className = 'exercise-highlights session-picker-compat-meta';
      highlights.hidden = true;
      const copy = document.createElement('span');
      copy.className = 'pill accent';
      copy.textContent = duration.textContent;
      highlights.append(copy);
      card.append(highlights);
    }
  }
}

function preparePickerCards(root = document) {
  if (root instanceof Element && root.matches('.session-picker-card')) preparePickerCard(root);
  root.querySelectorAll?.('.session-picker-card').forEach(preparePickerCard);
}

function install() {
  const builder = document.querySelector('#session-builder');
  if (!builder) return;

  preparePickerCards(builder);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) preparePickerCards(node);
      }
    }
  });
  observer.observe(builder, { childList: true, subtree: true });

  // El editor se vuelve a crear al añadir/quitar/reordenar ejercicios.
  // Este segundo pase garantiza que las tarjetas visuales recién recreadas
  // estén preparadas antes de que session-planner-ui regenere la biblioteca.
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.add-exercise-to-session, .remove-session-block, .move-session-block')) return;
    queueMicrotask(() => preparePickerCards(builder));
    requestAnimationFrame(() => preparePickerCards(builder));
  }, true);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
