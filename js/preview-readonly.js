// Deployment boundary only. The application keeps its original Auth, stores and sync.
// Never embed account data or tokens in a preview build.
(() => {
  const enabled = location.hostname === 'miguelperezh.github.io' && location.pathname.startsWith('/campobase-preview/');
  if (!enabled) return;
  window.__CAMPOBASE_READONLY_PREVIEW = true;
  function allowed(url, method) {
    const target = new URL(url, location.href);
    if (!target.hostname.endsWith('.supabase.co')) return true;
    if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) return true;
    // Existing authentication is retained; only the known read-only context RPC is allowed.
    return method.toUpperCase() === 'POST' && (
      /^\/auth\/v1\/(token|logout)$/.test(target.pathname)
      || target.pathname === '/functions/v1/pin-login'
      || /^\/rest\/v1\/rpc\/(mi_equipo_contexto|resolve_login_email|get_delegate_account|legacy_owner_claim_available)$/.test(target.pathname)
    );
  }
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = input instanceof Request ? input.url : String(input);
    const method = init.method || (input instanceof Request ? input.method : 'GET');
    if (!allowed(url, method)) {
      return Promise.resolve(new Response(JSON.stringify({message:'Preview: los cambios no se guardan en producción.',code:'PREVIEW_READ_ONLY'}), {status:403,headers:{'Content-Type':'application/json'}}));
    }
    return nativeFetch(input, init);
  };
  const open = XMLHttpRequest.prototype.open, send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) { this.__previewAllowed = allowed(String(url), method); return open.call(this,method,url,...rest); };
  XMLHttpRequest.prototype.send = function(...args) { if (!this.__previewAllowed) throw new Error('Preview: escritura a producción bloqueada.'); return send.apply(this,args); };
  const beacon = navigator.sendBeacon.bind(navigator);
  navigator.sendBeacon = (url, data) => allowed(url, 'POST') && beacon(url,data);
  document.addEventListener('submit', event => {
    if (/^(auth-|saas-)/.test(event.target.id || '')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    alert('Vista previa: los cambios están bloqueados para proteger los datos reales.');
  }, true);
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button?.id === 'manual-refresh') {
      event.preventDefault(); event.stopImmediatePropagation();
      window.__campobase?.synchronizeCloud?.().then(() => window.__campobase?.refresh?.(true));
      return;
    }
    if (!button || !button.closest('#app')) return;
    const isReadAction = button.matches('[data-today-view], [data-today-match], [class*="open-whatsapp"], .open-whistle-session, .match-detail, .view-exercise, [data-target-view]');
    if (!isReadAction) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  document.addEventListener('DOMContentLoaded', () => {
    const note = document.createElement('p'); note.id = 'cb-preview-readonly-note'; note.textContent = 'Vista previa · No guarda cambios en producción';
    note.style.cssText = 'margin:0;padding:5px 12px;background:#fff8eb;color:#704600;font:600 12px system-ui;text-align:center';
    document.querySelector('.topbar')?.after(note);
  });
})();
