let initialized = false;
let observer = null;

const $ = (selector, root = document) => root.querySelector(selector);

function claimIsRequired() {
  const offer = $('#saas-claim-offer');
  const choice = $('#saas-account-choice');
  return Boolean(
    offer
    && choice
    && !offer.classList.contains('hidden')
    && !choice.classList.contains('hidden')
  );
}

function applyGuardState() {
  const offer = $('#saas-claim-offer');
  const enter = $('#saas-enter-account');
  if (!offer || !enter) return;

  const required = claimIsRequired();
  enter.hidden = required;
  enter.disabled = required;
  enter.setAttribute('aria-hidden', required ? 'true' : 'false');

  const paragraph = offer.querySelector('.meta');
  if (required && paragraph) {
    paragraph.textContent = 'Vincula primero esta cuenta con tu PIN actual para conservar todos tus jugadores, partidos, sesiones, asistencias y ajustes.';
  }

  const form = $('#saas-claim-form');
  if (form) form.dataset.requiredBeforeEntry = required ? '1' : '0';
}

function installCaptureGuard() {
  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('#saas-enter-account');
    if (!button || !claimIsRequired()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    const message = $('#saas-claim-message');
    if (message) {
      message.textContent = 'Vincula primero tus datos actuales. No se abrirá una cuenta vacía mientras tus datos anteriores estén pendientes de vincular.';
      message.classList.add('error');
      message.classList.remove('success');
    }
    $('#saas-claim-form input[name="pin"]')?.focus();
  }, true);
}

export function initLegacyDataLinkGuard() {
  if (initialized || typeof document === 'undefined') return;
  initialized = true;
  installCaptureGuard();
  applyGuardState();

  observer = new MutationObserver(applyGuardState);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'hidden'],
  });
}
