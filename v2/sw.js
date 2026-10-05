const CACHE = '20261005-plan-sesiones-reproductor-campobase-v2.44.0-player-sync-attendance-2453-responsive-2455-today-2457-sessiontop-2458-sessionplanner-2461-exerciseboard-2475-themev12-v2-248-fullscreen-dates-playfix-duration-2503-whatsapp-web-f7-50-v2528-exercise-content-audit-mirror-materials-orientation-session-audit-copy-hotfix-badge-cleanup-pwa-install-v2-250917-promo-roster-1-saas-auth-v3-attendance-manual-v4-exercises-hotfix-v2-auth-recovery-v1-player-profile-guard-v1-exercise-media-filter-v2-derived-stats-link-v1-manual-player-profile-v1-exercise-cover-humanvideo-hotfix-20260918-force2508-final-preview-own-sessions-emergency-auth-restore-v4-prod-access-recovery-v1-session-rebind-v1-pin-session-preserve-v1-session-data-view-v1-mobile-sync-pin-v1-cloud-restore-v4-20260927-v66-real-calendar-dates-20261001-v69-ajustes-temas-20261002-v70-ajustes-pizarra-sidebar-20261002-v71-ajustes-preview-rico-bg-tacticas-fix-20261002-v72-ajustes-live-preview-completo-20261002-v73-preview-top-hoy-quick-buttons-fix-20261002-v74-mobile-settings-grid-responsive-fix-20261002-v75-remove-dummy-tactics-presets-20261002-v76-mobile-print-pdf-specialists-theme-fix-20261003-v77-match-plan-2pages-70min-callups-theme-fab-fix';
const BOARD_PARTS = [
  './assets/exercise-board/part-1.b64',
  './assets/exercise-board/part-2.b64',
  './assets/exercise-board/part-3.b64',
  './assets/exercise-board/part-4.b64',
];
const ASSETS = [
  './styles-redesign.css?v=color-controls-7',
  './css/claude-shell.css?v=color-controls-7',
  './css/claude-hoy.css?v=color-controls-7',
  './css/claude-plantilla.css?v=color-controls-7',
  './css/claude-partido.css?v=color-controls-7',
  './css/claude-entreno.css?v=color-controls-7',
  './js/theme-component-colors.js', './js/theme-component-colors.js?v=color-controls-7', './css/theme-component-colors.css', './css/theme-component-colors.css?v=color-controls-7', './js/app.js?v=color-controls-7',
  './', './index.html', './styles.css', './styles.css?v=20260927-v66-real-calendar-dates', './styles-redesign.css', './styles-redesign.css?v=20260927-v66-real-calendar-dates', './billing.css', './billing.css?v=1', './manifest.webmanifest', './pwa-install.css', './pwa-install.css?v=2',
  './css/claude-partido.css', './css/claude-partido.css?v=20261001-v65-matchplan',
  './modo-campo-directo.html', './modo-campo-directo.css', './modo-campo-directo.css?v=4', './modo-campo-theme.css', './modo-campo-theme.css?v=3', './modo-campo-flow.css', './modo-campo-flow.css?v=1',
  './js/minute-timeline.js', './js/minute-timeline.js?v=plan-visual-1', './js/session-detail-navigation.js', './js/exercise-preview-image.js', './js/ejercicio-viewer.js?v=plan-visual-1',
  './js/app.js', './js/app.js?v=20260927-v66-real-calendar-dates', './js/db.js', './js/domain.js', './js/whatsapp-suite.js', './js/demo-session.js', './js/training-domain.js', './js/real-exercises.js', './js/exercise-planning.js', './js/ejercicios-validados.js', './js/ejercicios-validados-base.js', './js/ejercicios-nuevo-formato.js', './js/ejercicios-nuevos-lotes.js', './js/ejercicio-viewer.js', './js/ejercicio-videos.js',  './js/print-session-export.js?v=color-controls-7', './js/print-session-export.js', './js/print-session-export.js?v=20260927-v66-real-calendar-dates', './js/print-match-plan.js', './js/print-match-plan.js?v=20261001-v65-matchplan', './js/media-lightbox.js', './js/frame-durations.js', './js/tactics.js', './js/live-tactics.js', './js/tacticas-interactivas.js', './js/tactica-viewer.js', './js/tactica-frame-durations.js', './js/tactica-1231-frames.js', './js/tactica-1213-frames.js', './js/tactica-1321-frames.js', './js/tactica-1222-frames.js', './js/tactica-1132-frames.js', './js/tactica-133-frames.js', './js/tactica-1312-frames.js', './js/tactica-final-frames.js', './js/tactica-11311-frames.js', './js/tactica-1141-frames.js', './js/tactica-1411-frames.js', './js/tactica-12211-frames.js', './js/tactic-board-controller.js', './js/tactica-guia-viewer.js', './js/squad-seed.js', './js/sync-core.js', './js/supabase-client.js', './js/auth-manager.js', './js/saas-session-guard.js', './js/saas-session-guard.js?v=1', './js/saas-auth-ui.js', './js/saas-auth-ui.js?v=1', './js/saas-auth-ui-v2.js?v=color-controls-7', './js/saas-auth-ui-v2.js', './js/saas-auth-ui-v2.js?v=20260927-v66-real-calendar-dates', './js/player-roster-guard.js', './js/player-roster-guard.js?v=1', './js/billing-manager.js', './js/billing-manager.js?v=1', './js/plan-catalog.js', './js/team-access.js', './js/team-access.js?v=1', './js/team-access.js?v=20260927-v66-real-calendar-dates', './js/promo-codes-admin.js', './js/promo-codes-admin.js?v=4', './js/promo-codes-ui-v2.js', './js/promo-codes-ui-v2.js?v=2', './js/plantilla-stats-sync.js', './js/match-calendar-sync.js', './js/completed-events-ui.js', './js/exercise-view-mode-ui.js?v=20260927-v66-real-calendar-dates', './js/match-postgame-editor.js', './js/calendar-substitutions-v2.js', './js/calendar-substitutions-entry.js', './js/session-visual-planner.js?v=plan-visual-1', './js/session-materials.js?v=2452', './js/session-top-actions.js?v=2458', './js/session-picker-compat.js?v=2461', './js/session-planner-ui.js?v=20260927-v66-real-calendar-dates', './js/attendance-linked-sources.js', './js/attendance-linked-sources.js?v=2453', './js/attendance-session-manual-state.js', './js/attendance-session-manual-state.js?v=3', './js/player-data-sync.js?v=2453', './js/player-data-sync.js?v=1', './js/attendance-history-responsive.js?v=2455', './js/today-dashboard.js?v=color-controls-7', './js/exercise-board-persistence.js?v=20260927-v66-real-calendar-dates', './js/runtime-refresh.js?v=plan-visual-1', './js/exercise-viewer-controls.js?v=2475', './js/exercise-viewer-layout.js?v=plan-visual-1', './js/staff-management.js', './js/image-crop-utils.js', './js/redesign-nav.js', './js/redesign-nav.js?v=20260927-v66-real-calendar-dates', './js/pwa-install-manager.js', './js/pwa-install-manager.js?v=1', './js/pwa-install-manager.js?v=2',
  './js/modo-campo-directo.js', './js/modo-campo-directo.js?v=4', './js/modo-campo-identity-exercises.js', './js/modo-campo-identity-exercises.js?v=2', './js/modo-campo-theme-parity.js', './js/modo-campo-theme-parity.js?v=1', './js/modo-campo-actions.js', './js/modo-campo-actions.js?v=2', './js/modo-campo-integration.js', './js/modo-campo-integration.js?v=1', './js/session-reorder-ui.js', './js/session-reorder-ui.js?v=3', './js/detail-badge-runtime-fix.js', './js/detail-badge-runtime-fix.js?v=3', './js/session-editor-usability.js', './js/session-editor-usability.js?v=1', './js/custom-exercise-persistence.js', './js/custom-exercise-persistence.js?v=1', './js/exercise-content-quality.js', './js/exercise-content-quality.js?v=1', './js/exercise-vocabulary-ui.js', './js/exercise-vocabulary-ui.js?v=1', './js/exercise-content-audit.js', './js/exercise-content-audit.js?v=1',
  './library-v2/data/catalog.json', './library-v2/data/catalog-data.js',
  ...BOARD_PARTS,
  './vendor/supabase.js',
  './vendor/html2canvas.min.js',
  './vendor/jspdf.umd.min.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-192.svg', './icons/icon-512.svg', './icons/escudo.png',
];

const REVALIDATE_PATHS = [
  '/index.html',
  '/js/app.js',
  '/js/print-match-plan.js',
  '/css/claude-partido.css',
  '/js/db.js',
  '/js/training-domain.js',
  '/js/ejercicios-validados.js',
  '/js/ejercicios-validados-base.js',
  '/js/ejercicios-nuevo-formato.js',
  '/js/ejercicios-nuevos-lotes.js',
  '/js/supabase-client.js',
  '/js/auth-manager.js',
  '/js/saas-session-guard.js',
  '/js/saas-auth-ui.js',
  '/js/saas-auth-ui-v2.js',
  '/js/player-roster-guard.js',
  '/js/billing-manager.js',
  '/js/plan-catalog.js',
  '/js/team-access.js',
  '/js/promo-codes-admin.js',
  '/js/promo-codes-ui-v2.js',
  '/js/attendance-linked-sources.js',
  '/js/attendance-session-manual-state.js',
  '/js/ejercicio-viewer.js',
  '/js/ejercicio-videos.js',
  '/js/print-session-export.js',
  '/js/session-visual-planner.js',
  '/js/session-planner-ui.js',
  '/js/session-picker-compat.js',
  '/js/exercise-viewer-controls.js',
  '/js/exercise-viewer-layout.js',
  '/js/match-calendar-sync.js',
  '/js/completed-events-ui.js',
  '/js/exercise-view-mode-ui.js',
  '/js/redesign-nav.js',
  '/js/pwa-install-manager.js',
  '/js/modo-campo-directo.js',
  '/js/modo-campo-identity-exercises.js',
  '/js/modo-campo-theme-parity.js',
  '/js/modo-campo-actions.js',
  '/js/modo-campo-integration.js',
  '/js/session-reorder-ui.js',
  '/js/detail-badge-runtime-fix.js',
  '/js/session-editor-usability.js',
  '/js/custom-exercise-persistence.js',
  '/js/exercise-content-quality.js',
  '/js/exercise-vocabulary-ui.js',
  '/js/exercise-content-audit.js',
  '/modo-campo-directo.html',
  '/modo-campo-directo.css',
  '/modo-campo-theme.css',
  '/modo-campo-flow.css',
  '/styles.css',
  '/styles-redesign.css',
  '/billing.css',
  '/pwa-install.css',
];

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await Promise.allSettled(
        ASSETS.map(async (asset) => {
          try {
            const res = await fetch(asset, { cache: 'reload' });
            if (res.ok) await cache.put(asset, res);
          } catch {}
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    // Toma control sin forzar una segunda navegación. app.js ya gestiona
    // controllerchange y conserva sesión/vista en sessionStorage.
    await self.clients.claim();
  })());
});

async function readBoardPart(path) {
  try {
    const response = await fetch(path, { cache: 'no-store' });
    if (response.ok) return response.text();
  } catch { /* usa la copia offline */ }
  const cached = await caches.match(path);
  if (!cached) throw new Error(`No se pudo cargar ${path}`);
  return cached.text();
}

async function buildExerciseBoardResponse() {
  const parts = await Promise.all(BOARD_PARTS.map(readBoardPart));
  const encoded = parts.join('');
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/gzip',
      'Cache-Control': 'no-store',
    },
  });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (url.pathname.endsWith('/assets/exercise-board.html.gz')) {
    event.respondWith(buildExerciseBoardResponse());
    return;
  }

  if (REVALIDATE_PATHS.some((path) => url.pathname.endsWith(path))) {
    event.respondWith(
      fetch(event.request, { cache: 'reload' })
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached ?? caches.match('./index.html')))
  );
});