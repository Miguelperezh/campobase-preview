// Ajuste aislado de la tarjeta resumida del cuerpo técnico en Plantilla.
// No cambia datos, navegación ni estilos globales: solo evita que cargo,
// nombre y botones se monten cuando el usuario aumenta tipografía/tamaño.

const STYLE_ID = 'cb-staff-card-layout-fix';

function installStaffCardLayoutFix() {
  document.getElementById(STYLE_ID)?.remove();

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    html body.cb-redesign-active #plantilla-staff-top .plantilla-staff-card {
      display: grid !important;
      grid-template-columns: auto minmax(0, 1fr) !important;
      grid-template-areas:
        "avatar info"
        "actions actions" !important;
      align-items: center !important;
      column-gap: .8rem !important;
      row-gap: .55rem !important;
      overflow: hidden !important;
    }

    html body.cb-redesign-active #plantilla-staff-top .plantilla-staff-avatar-box {
      grid-area: avatar !important;
      align-self: center !important;
    }

    html body.cb-redesign-active #plantilla-staff-top .plantilla-staff-info {
      grid-area: info !important;
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) !important;
      gap: .35rem !important;
      min-width: 0 !important;
      max-width: 100% !important;
      overflow: hidden !important;
    }

    html body.cb-redesign-active #plantilla-staff-top .plantilla-staff-role-badge {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      justify-self: start !important;
      width: fit-content !important;
      max-width: 100% !important;
      min-width: 0 !important;
      margin: 0 !important;
      overflow: hidden !important;
      text-overflow: clip !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: normal !important;
      line-height: 1.08 !important;
      text-align: center !important;
    }

    html body.cb-redesign-active #plantilla-staff-top .plantilla-staff-name {
      display: block !important;
      min-width: 0 !important;
      max-width: 100% !important;
      margin: 0 !important;
      line-height: 1.15 !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: normal !important;
    }

    html body.cb-redesign-active #plantilla-staff-top .plantilla-staff-actions {
      grid-area: actions !important;
      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;
      flex-wrap: wrap !important;
      gap: .4rem !important;
      width: 100% !important;
      min-width: 0 !important;
      margin: .1rem 0 0 !important;
      padding-top: .5rem !important;
      border-top: 1px dashed var(--cb-slate-200, #e2e8f0) !important;
    }

    html body.cb-redesign-active #plantilla-staff-top .staff-quick-btn {
      flex: 0 0 auto !important;
      margin: 0 !important;
    }

    @media (max-width: 520px) {
      html body.cb-redesign-active #plantilla-staff-top .plantilla-staff-card {
        grid-template-columns: auto minmax(0, 1fr) !important;
        padding: .65rem !important;
      }

      html body.cb-redesign-active #plantilla-staff-top .plantilla-staff-actions {
        justify-content: stretch !important;
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      }

      html body.cb-redesign-active #plantilla-staff-top .staff-quick-btn {
        width: 100% !important;
        min-width: 0 !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function scheduleInstall() {
  // Se inserta al final del ciclo para ganar a los overrides antiguos que
  // todavía se cargan desde Modo Campo y que forzaban overflow: visible.
  window.setTimeout(installStaffCardLayoutFix, 0);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInstall, { once: true });
  } else {
    scheduleInstall();
  }
}
