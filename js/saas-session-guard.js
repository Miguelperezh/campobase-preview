import { clearBoundSaasUserId, getBoundSaasUserId, getCurrentSession } from './auth-manager.js';

function waitForApp(timeoutMs = 12000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (window.__campobase?.state || Date.now() - started > timeoutMs) {
        clearInterval(timer);
        resolve(window.__campobase || null);
      }
    }, 60);
  });
}

function forceLockedUi() {
  document.body?.classList.add('auth-locked');
  document.body?.classList.remove('delegate-mode', 'demo-mode');
  const roleLabel = document.getElementById('role-label');
  if (roleLabel) roleLabel.textContent = '';
  const app = window.__campobase;
  if (app?.state) {
    app.state.role = null;
    app.state.delegateMode = false;
  }
  try {
    sessionStorage.removeItem('campobase.sessionRole');
    sessionStorage.removeItem('campobase.demoSession');
  } catch { /* Sin sesión local que limpiar. */ }
  const dialog = document.getElementById('auth-dialog');
  if (dialog && !dialog.open) dialog.showModal();
}

export async function guardSaasSession(client) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return true;
  const boundUserId = getBoundSaasUserId();
  if (!boundUserId) return true;

  // Si hay una sesión activa con otro usuario diferente, actualizamos/limpiamos el enlace.
  // Si la sesión ha expirado o el móvil está desconectado, conservamos el vínculo
  // para que el PIN local pueda renovar la sesión en Supabase con signInWithCampoBasePin.
  const session = await getCurrentSession(client).catch(() => null);
  if (session?.user?.id && session.user.id !== boundUserId) {
    clearBoundSaasUserId();
  }
  return true;
}
