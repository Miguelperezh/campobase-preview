// Acciones y organización visual del editor de Sesiones.
// Mantiene la lógica original: solo acerca Guardar/Cancelar y ordena los mismos campos.

let renderQueued = false;

function sessionElements() {
  const section = document.querySelector('#sesiones');
  const builder = section?.querySelector('#session-builder');
  const form = builder?.querySelector('#session-form');
  const actions = section?.querySelector('.section-head .button-row');
  const newSession = section?.querySelector('#new-session');
  return { section, builder, form, actions, newSession };
}

function organizeSessionBuilder(form) {
  if (!form || form.dataset.sessionVisualLayout === '1') return;

  const formRows = [...form.children].filter((child) => child.classList?.contains('form-row')).slice(0, 2);
  const duration = form.querySelector('.session-duration');
  const materialLabel = form.elements.material?.closest('label');
  const notesLabel = form.elements.notes?.closest('label');
  const blocks = form.querySelector('fieldset');
  const picker = form.querySelector('.session-exercise-picker');

  const overview = document.createElement('section');
  overview.className = 'session-editor-overview';
  overview.innerHTML = `
    <div class="session-editor-overview-head">
      <div>
        <p class="eyebrow">Preparación</p>
        <h3>Datos de la sesión</h3>
      </div>
      <span class="pill accent">Todo lo importante arriba</span>
    </div>
    <div class="session-editor-basics"></div>
    <div class="session-editor-notes-grid"></div>`;

  form.insertBefore(overview, form.firstChild);
  const basics = overview.querySelector('.session-editor-basics');
  const notesGrid = overview.querySelector('.session-editor-notes-grid');
  formRows.forEach((row) => basics.append(row));
  if (materialLabel) notesGrid.append(materialLabel);
  if (notesLabel) notesGrid.append(notesLabel);
  if (duration) overview.append(duration);

  if (blocks) {
    blocks.classList.add('session-selected-blocks');
    const legend = blocks.querySelector('legend');
    if (legend) legend.textContent = 'Ejercicios seleccionados';
    if (!blocks.querySelector('.session-selected-help')) {
      const help = document.createElement('p');
      help.className = 'meta session-selected-help';
      help.textContent = 'Ordena los ejercicios y ajusta aquí los minutos de cada uno.';
      blocks.insertBefore(help, blocks.children[1] || null);
    }
  }

  if (picker) picker.classList.add('session-exercise-library');
  form.dataset.sessionVisualLayout = '1';
}

export function syncSessionTopActions() {
  if (typeof document === 'undefined') return;
  const { builder, form, actions, newSession } = sessionElements();
  if (!builder || !actions || !newSession) return;

  const open = !builder.classList.contains('hidden') && Boolean(form);
  let save = document.querySelector('#session-top-save');
  let cancel = document.querySelector('#session-top-cancel');

  if (!open) {
    save?.remove();
    cancel?.remove();
    actions.removeAttribute('data-session-editing');
    return;
  }

  organizeSessionBuilder(form);
  actions.dataset.sessionEditing = '1';

  if (!save) {
    save = document.createElement('button');
    save.id = 'session-top-save';
    save.type = 'button';
    save.className = 'primary session-top-action';
    save.textContent = 'Guardar';
    save.addEventListener('click', () => {
      const currentForm = document.querySelector('#session-builder #session-form');
      const submit = currentForm?.querySelector('button[type="submit"]');
      if (!currentForm) return;
      if (submit && submit.disabled) return;
      if (typeof currentForm.requestSubmit === 'function') {
        try {
          currentForm.requestSubmit(submit || undefined);
        } catch {
          if (submit) submit.click();
          else currentForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      } else if (submit) {
        submit.click();
      } else {
        currentForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    });
    newSession.insertAdjacentElement('afterend', save);
  }

  if (!cancel) {
    cancel = document.createElement('button');
    cancel.id = 'session-top-cancel';
    cancel.type = 'button';
    cancel.className = 'secondary session-top-action';
    cancel.textContent = 'Cancelar';
    cancel.addEventListener('click', () => {
      const original = document.querySelector('#session-builder .cancel-session');
      if (original) original.click();
      else document.querySelector('#session-builder')?.classList.add('hidden');
      queueSync();
    });
    save.insertAdjacentElement('afterend', cancel);
  }

  const submit = form?.querySelector('button[type="submit"]');
  const disabled = !submit || submit.disabled;
  if (save.disabled !== disabled) save.disabled = disabled;
}

function queueSync() {
  if (renderQueued || typeof window === 'undefined') return;
  renderQueued = true;
  window.requestAnimationFrame(() => {
    renderQueued = false;
    syncSessionTopActions();
  });
}

function installStyles() {
  if (document.querySelector('#session-top-actions-style')) return;
  const style = document.createElement('style');
  style.id = 'session-top-actions-style';
  style.textContent = `
    #sesiones > .section-head { flex-wrap: wrap; }
    #sesiones > .section-head > .button-row { margin-top: 0; }

    #session-builder {
      padding: 0;
      border: 0;
      background: transparent;
      box-shadow: none;
    }
    #session-form {
      display: grid;
      gap: 1rem;
    }
    .session-editor-overview,
    .session-selected-blocks,
    .session-exercise-library {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 18px;
      box-shadow: var(--shadow);
    }
    .session-editor-overview {
      padding: 1rem;
      border-top: 5px solid var(--brand);
    }
    .session-editor-overview-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .8rem;
      margin-bottom: .9rem;
    }
    .session-editor-overview-head h3,
    .session-editor-overview-head p { margin-bottom: 0; }
    .session-editor-basics {
      display: grid;
      gap: .8rem;
    }
    .session-editor-notes-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: .8rem;
      margin-top: .8rem;
      padding-top: .8rem;
      border-top: 1px solid var(--line);
    }
    .session-editor-notes-grid textarea { min-height: 72px; }
    .session-editor-overview .session-duration {
      margin-top: .8rem;
      padding: .8rem 1rem;
      border-radius: 14px;
      background: #f7f9f7;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .7rem;
      flex-wrap: wrap;
    }
    .session-selected-blocks {
      margin: 0;
      padding: 1rem;
    }
    .session-selected-blocks legend {
      padding: 0 .4rem;
      font-size: 1rem;
      font-weight: 800;
      color: var(--ink);
    }
    .session-selected-help { margin: 0 0 .8rem; }
    .session-selected-blocks .session-block {
      background: #f7f9f7;
      border-radius: 14px;
    }
    .session-exercise-library {
      padding: 1rem;
    }

    @media (max-width: 650px) {
      #sesiones > .section-head > .button-row[data-session-editing="1"] {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      #sesiones > .section-head > .button-row[data-session-editing="1"] > button {
        min-width: 0;
        padding-left: .45rem;
        padding-right: .45rem;
      }
      .session-editor-overview-head {
        align-items: flex-start;
        flex-direction: column;
      }
      .session-editor-notes-grid { grid-template-columns: 1fr; }
      .session-editor-overview .session-duration {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `;
  document.head.append(style);
}

function install() {
  const section = document.querySelector('#sesiones');
  if (!section) return;
  installStyles();
  syncSessionTopActions();
  const observer = new MutationObserver(queueSync);
  observer.observe(section, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'disabled'] });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
