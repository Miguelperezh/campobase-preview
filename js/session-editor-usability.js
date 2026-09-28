const hasBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

function installStyles() {
  if (document.getElementById('cb-session-editor-usability-style')) return;
  const style = document.createElement('style');
  style.id = 'cb-session-editor-usability-style';
  style.textContent = `
    #session-plan-strip.sp-strip {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) !important;
      gap: .55rem !important;
      overflow: visible !important;
      padding: .55rem 0 .15rem !important;
    }
    #session-plan-strip .sp-chip {
      width: 100% !important;
      min-width: 0 !important;
      display: grid !important;
      grid-template-columns: minmax(180px, 1fr) minmax(92px, 118px) auto auto auto !important;
      gap: .45rem !important;
      align-items: center !important;
      padding: .6rem .7rem !important;
    }
    #session-plan-strip .sp-chip > strong {
      min-width: 0 !important;
      white-space: normal !important;
      overflow: visible !important;
      text-overflow: clip !important;
      overflow-wrap: anywhere !important;
      font-size: .82rem !important;
      line-height: 1.25 !important;
    }
    #session-plan-strip .sp-chip label {
      min-width: 0 !important;
    }
    #session-plan-strip .sp-chip input[data-sp-time] {
      width: 100% !important;
      min-width: 64px !important;
    }
    #session-plan-strip .cb-sp-order {
      display: flex !important;
      gap: .3rem !important;
      align-items: stretch !important;
    }
    #session-plan-strip .cb-sp-order button {
      min-height: 36px !important;
      padding: .35rem .55rem !important;
      white-space: nowrap !important;
      font-size: .72rem !important;
      font-weight: 800 !important;
    }
    @media (max-width: 700px) {
      #session-plan-strip .sp-chip {
        grid-template-columns: minmax(0, 1fr) auto auto !important;
      }
      #session-plan-strip .sp-chip > strong {
        grid-column: 1 / -1 !important;
        font-size: .88rem !important;
      }
      #session-plan-strip .sp-chip > label {
        grid-column: 1 !important;
      }
      #session-plan-strip .cb-sp-order {
        grid-column: 1 / -1 !important;
        width: 100% !important;
      }
      #session-plan-strip .cb-sp-order button {
        flex: 1 1 0 !important;
        min-height: 42px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function enhancePlan() {
  const strip = document.getElementById('session-plan-strip');
  if (!strip) return;
  const chips = [...strip.querySelectorAll('.sp-chip')];
  chips.forEach((chip, index) => {
    if (chip.querySelector('.cb-sp-order')) return;
    const order = document.createElement('div');
    order.className = 'cb-sp-order';
    order.innerHTML = `
      <button type="button" class="secondary compact" data-cb-sp-move="${index}" data-direction="-1" ${index === 0 ? 'disabled' : ''}>↑ Subir</button>
      <button type="button" class="secondary compact" data-cb-sp-move="${index}" data-direction="1" ${index === chips.length - 1 ? 'disabled' : ''}>↓ Bajar</button>
    `;
    chip.appendChild(order);
  });
}

function clickUnderlyingMove(index, direction) {
  const button = document.querySelector(`#session-form .move-session-block[data-index="${index}"][data-direction="${direction}"]`);
  if (!button || button.disabled) return;
  button.click();
}

function restoreFocusAfterRender(target) {
  const wasFocused = document.activeElement === target;
  if (!wasFocused) return;
  const isSearch = target.id === 'sp-search';
  const isDuration = target.matches('[data-sp-time]');
  if (!isSearch && !isDuration) return;

  const selector = isSearch ? '#sp-search' : `[data-sp-time="${target.dataset.spTime}"]`;
  const selectionStart = typeof target.selectionStart === 'number' ? target.selectionStart : null;
  const selectionEnd = typeof target.selectionEnd === 'number' ? target.selectionEnd : selectionStart;

  queueMicrotask(() => {
    const next = document.querySelector(selector);
    if (!next) return;
    try { next.focus({ preventScroll: true }); } catch { next.focus(); }
    if (isSearch && selectionStart !== null && typeof next.setSelectionRange === 'function') {
      try { next.setSelectionRange(selectionStart, selectionEnd); } catch {}
    }
  });
}

function install() {
  installStyles();
  const builder = document.getElementById('session-builder');
  if (builder) {
    enhancePlan();
    const observer = new MutationObserver(() => enhancePlan());
    observer.observe(builder, { childList: true, subtree: true });
  }

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id === 'sp-search' || target.matches('[data-sp-time]')) restoreFocusAfterRender(target);
  }, true);

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cb-sp-move][data-direction]');
    if (!button) return;
    event.preventDefault();
    clickUnderlyingMove(Number(button.dataset.cbSpMove), Number(button.dataset.direction));
  });
}

if (hasBrowser) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
