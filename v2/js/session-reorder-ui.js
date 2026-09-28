import './detail-badge-runtime-fix.js?v=4';
import './staff-card-layout-fix.js?v=1';

const hasBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

function installStyles() {
  if (document.getElementById('cb-session-reorder-style')) return;
  const style = document.createElement('style');
  style.id = 'cb-session-reorder-style';
  style.textContent = `
    #session-builder .cb-session-order-help{
      display:flex;align-items:center;gap:.5rem;margin:.65rem 0;padding:.7rem .85rem;
      border:1px solid var(--line,#e2e8f0);border-radius:12px;background:var(--card,#fff);
      font-size:.86rem;font-weight:700;color:var(--muted,#64748b)
    }
    #session-builder .move-session-block.cb-session-order-button{
      min-height:40px!important;padding:.45rem .7rem!important;border-radius:10px!important;
      white-space:nowrap!important;font-weight:800!important
    }
    @media(max-width:650px){
      #session-builder .move-session-block.cb-session-order-button{
        min-height:46px!important;padding:.55rem .72rem!important;font-size:.82rem!important
      }
      #session-builder .cb-session-order-help{font-size:.8rem}
    }
  `;
  document.head.appendChild(style);
}

function enhanceBuilder(root) {
  if (!root) return;
  const buttons = [...root.querySelectorAll('.move-session-block')];
  for (const button of buttons) {
    if (button.dataset.cbSessionOrderEnhanced === '1') continue;
    const direction = Number(button.dataset.direction);
    button.dataset.cbSessionOrderEnhanced = '1';
    button.classList.add('cb-session-order-button');
    button.textContent = direction < 0 ? '↑ Subir' : '↓ Bajar';
    button.title = direction < 0 ? 'Mover este ejercicio una posición hacia arriba' : 'Mover este ejercicio una posición hacia abajo';
    button.setAttribute('aria-label', button.title);
  }
  if (buttons.length > 1 && !root.querySelector('.cb-session-order-help')) {
    const help = document.createElement('div');
    help.className = 'cb-session-order-help';
    help.textContent = '↕ Orden manual: usa Subir y Bajar para colocar los ejercicios en el orden que quieras.';
    const firstBlock = root.querySelector('.session-block');
    if (firstBlock && firstBlock.parentElement) firstBlock.parentElement.insertBefore(help, firstBlock);
    else root.prepend(help);
  }
}

function install() {
  installStyles();
  const root = document.getElementById('session-builder');
  if (!root) return;
  enhanceBuilder(root);
  const observer = new MutationObserver(() => enhanceBuilder(root));
  observer.observe(root, { childList:true, subtree:true });
}

if (hasBrowser) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
}
