// Capa visual de Fase 2 sobre la interfaz validada.
// No modifica la lógica de negocio ni concede ventajas localmente.

const STYLE_ID = 'cb-promo-ui-v2-styles';
let applied = false;

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #cb-promo-admin-section,
    #cb-coach-redeem-panel{
      grid-column:1 / -1!important;
      min-width:0;
      width:100%;
    }

    #cb-promo-admin-section *,
    #cb-coach-redeem-panel *{box-sizing:border-box}

    #cb-promo-admin-section .panel-head,
    #cb-coach-redeem-panel .panel-head{min-width:0}

    #cb-promo-admin-section h3,
    #cb-coach-redeem-panel h3,
    #cb-promo-admin-section p,
    #cb-coach-redeem-panel p,
    #cb-promo-admin-section label,
    #cb-coach-redeem-panel label{
      overflow-wrap:anywhere;
      word-break:normal;
    }

    #cb-promo-admin-section .cb-promo-note{
      max-width:none;
      width:100%;
      line-height:1.4;
    }

    #cb-create-promo-form{display:grid;gap:.9rem}
    #cb-create-promo-form > .form-row{
      display:grid!important;
      grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
      gap:.8rem!important;
      align-items:end;
      width:100%;
      min-width:0;
    }

    #cb-create-promo-form > .form-row:first-of-type{
      grid-template-columns:minmax(0,1fr)!important;
    }

    #cb-create-promo-form label,
    #cb-coach-redeem-form{
      min-width:0;
      width:100%;
    }

    #cb-create-promo-form input,
    #cb-create-promo-form select,
    #cb-coach-redeem-form input,
    #cb-coach-redeem-form button{
      min-width:0;
      width:100%;
      max-width:100%;
    }

    #cb-promo-new-code + button{width:auto;white-space:nowrap;flex:0 0 auto}
    #cb-create-promo-form .button-row{min-width:0;align-items:stretch;flex-wrap:nowrap}
    #cb-create-promo-form .button-row > input{flex:1 1 auto}

    .cb-promo-benefit-legacy{display:none!important}
    .cb-promo-benefit-fieldset{
      border:0;
      padding:0;
      margin:0;
      min-width:0;
    }
    .cb-promo-benefit-fieldset legend{
      font:inherit;
      font-weight:800;
      margin:0 0 .5rem;
      padding:0;
    }
    .cb-promo-benefit-picker{
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:.65rem;
    }
    .cb-promo-benefit-choice{
      display:flex;
      align-items:center;
      gap:.65rem;
      min-height:76px!important;
      padding:.85rem .9rem!important;
      border:1px solid var(--line,#dbe3ea)!important;
      border-radius:14px!important;
      background:var(--card,#fff)!important;
      color:inherit!important;
      box-shadow:none!important;
      text-align:left;
      white-space:normal;
      width:100%;
    }
    .cb-promo-benefit-choice:hover{
      border-color:color-mix(in srgb,var(--cb-brand,var(--brand,#173f35)) 45%,var(--line,#dbe3ea))!important;
    }
    .cb-promo-benefit-choice.active{
      border-color:var(--cb-brand,var(--brand,#173f35))!important;
      background:color-mix(in srgb,var(--card,#fff) 90%,var(--cb-brand,var(--brand,#173f35)) 10%)!important;
      box-shadow:0 0 0 2px color-mix(in srgb,var(--cb-brand,var(--brand,#173f35)) 18%,transparent)!important;
    }
    .cb-promo-benefit-icon{
      width:38px;
      height:38px;
      border-radius:11px;
      display:grid;
      place-items:center;
      flex:0 0 38px;
      background:color-mix(in srgb,var(--card,#fff) 84%,var(--cb-brand,var(--brand,#173f35)) 16%);
      font-size:1.15rem;
    }
    .cb-promo-benefit-copy{min-width:0;display:grid;gap:.14rem}
    .cb-promo-benefit-copy strong{font-size:.92rem;line-height:1.15;overflow-wrap:anywhere}
    .cb-promo-benefit-copy small{font-size:.75rem;line-height:1.25;color:var(--muted,#64748b);font-weight:600;overflow-wrap:anywhere}

    #cb-promo-discount-input{font-weight:800}
    #cb-promo-discount-field::after{
      content:'Elige cualquier porcentaje entre 1% y 100%.';
      display:block;
      margin-top:.3rem;
      color:var(--muted,#64748b);
      font-size:.74rem;
      line-height:1.3;
    }

    #cb-promo-admin-section .cb-promo-list-header{
      border-top:1px solid var(--line,#e2e8f0);
      padding-top:.9rem;
    }

    #cb-coach-redeem-panel{
      padding-top:1rem;
      padding-bottom:1rem;
    }
    #cb-coach-redeem-panel h3{margin-bottom:.35rem}
    #cb-coach-redeem-form .form-row{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) auto;
      gap:.65rem!important;
      align-items:stretch;
      width:100%;
    }
    #cb-coach-redeem-form button{width:auto;white-space:nowrap;min-width:150px}

    @media(max-width:820px){
      .cb-promo-benefit-picker{grid-template-columns:1fr}
      .cb-promo-benefit-choice{min-height:64px!important}
      #cb-create-promo-form > .form-row{grid-template-columns:1fr!important}
      #cb-coach-redeem-form .form-row{grid-template-columns:1fr!important}
      #cb-coach-redeem-form button{width:100%;min-width:0}
      #cb-create-promo-form .button-row{flex-wrap:wrap}
      #cb-promo-new-code + button{width:100%}
    }
  `;
  document.head.appendChild(style);
}

function buildDiscountOptions(select) {
  const current = Math.min(100, Math.max(1, Number(select.value) || 50));
  const options = Array.from({ length: 100 }, (_, index) => {
    const value = index + 1;
    return `<option value="${value}"${value === current ? ' selected' : ''}>${value}%</option>`;
  }).join('');
  const replacement = document.createElement('select');
  replacement.id = select.id;
  replacement.name = select.name || 'discount';
  replacement.innerHTML = options;
  replacement.setAttribute('aria-label', 'Porcentaje de descuento del 1 al 100');
  select.replaceWith(replacement);
  return replacement;
}

function syncBenefitPicker(select, picker) {
  const value = select.value || 'vitalicio_regalo';
  picker.querySelectorAll('[data-benefit]').forEach((button) => {
    const active = button.dataset.benefit === value;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function buildBenefitPicker(select) {
  const legacyLabel = select.closest('label');
  if (legacyLabel) legacyLabel.classList.add('cb-promo-benefit-legacy');

  const fieldset = document.createElement('fieldset');
  fieldset.className = 'cb-promo-benefit-fieldset';
  fieldset.innerHTML = `
    <legend>Tipo de promoción</legend>
    <div class="cb-promo-benefit-picker" role="group" aria-label="Tipo de promoción">
      <button type="button" class="cb-promo-benefit-choice" data-benefit="vitalicio_regalo" aria-pressed="false">
        <span class="cb-promo-benefit-icon" aria-hidden="true">👑</span>
        <span class="cb-promo-benefit-copy"><strong>Regalo vitalicio</strong><small>Acceso Pro sin fecha de fin.</small></span>
      </button>
      <button type="button" class="cb-promo-benefit-choice" data-benefit="meses_gratis" aria-pressed="false">
        <span class="cb-promo-benefit-icon" aria-hidden="true">🗓️</span>
        <span class="cb-promo-benefit-copy"><strong>Meses gratis</strong><small>Regala 1, 2, 3, 6 o 12 meses.</small></span>
      </button>
      <button type="button" class="cb-promo-benefit-choice" data-benefit="descuento_porcentaje" aria-pressed="false">
        <span class="cb-promo-benefit-icon" aria-hidden="true">%</span>
        <span class="cb-promo-benefit-copy"><strong>Descuento</strong><small>Desde 1% hasta 100%.</small></span>
      </button>
    </div>`;

  const firstRow = select.closest('.form-row');
  firstRow?.insertAdjacentElement('afterend', fieldset);

  fieldset.addEventListener('click', (event) => {
    const button = event.target.closest('[data-benefit]');
    if (!button) return;
    select.value = button.dataset.benefit;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    syncBenefitPicker(select, fieldset);
  });

  select.addEventListener('change', () => syncBenefitPicker(select, fieldset));
  syncBenefitPicker(select, fieldset);
  return fieldset;
}

function improvePromoUI() {
  if (applied) return true;
  const admin = document.getElementById('cb-promo-admin-section');
  const redeem = document.getElementById('cb-coach-redeem-panel');
  const benefitSelect = document.getElementById('cb-promo-benefit-type');
  const discountInput = document.getElementById('cb-promo-discount-input');
  const form = document.getElementById('cb-create-promo-form');
  if (!admin || !redeem || !benefitSelect || !discountInput || !form) return false;

  addStyles();
  const picker = buildBenefitPicker(benefitSelect);
  buildDiscountOptions(discountInput);

  form.addEventListener('reset', () => {
    setTimeout(() => syncBenefitPicker(benefitSelect, picker), 0);
  });

  applied = true;
  return true;
}

function start() {
  addStyles();
  if (improvePromoUI()) return;
  const observer = new MutationObserver(() => {
    if (improvePromoUI()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
