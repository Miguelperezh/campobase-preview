import { getAll, put, remove, syncFromCloud } from './db.js';

const CATEGORY = 'Mis ejercicios';
const OPEN_AFTER_SAVE_KEY = 'campobase.openMyExercises';
const FRAME_TITLE = 'Creador de ejercicios CampoBase';
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const escapeMultiline = (value = '') => escapeHtml(value).replace(/\n/g, '<br>');

function toBoardExercise(record = {}) {
  return {
    id: record.id,
    name: record.name || 'Ejercicio',
    objective: record.objective || '',
    description: record.description || '',
    players: record.players || '',
    material: record.material || '',
    duration: Number(record.duration) || 0,
    reps: Number(record.reps ?? record.boardReps) || 1,
    pause: Number(record.pause ?? record.boardPause) || 0,
    intensity: record.intensity || record.difficulty || '',
    saveMode: record.saveMode || record.boardSaveMode || (record.boardAnimation ? 'both' : 'static'),
    staticBoard: record.staticBoard ?? record.boardStatic ?? null,
    animatedBoard: record.animatedBoard ?? record.boardAnimation ?? null,
    preview: record.preview || record.boardPreview || '',
    coverSourceType: record.coverSourceType || record.boardCoverSourceType || 'phase',
    coverPhaseId: record.coverPhaseId || record.boardCoverPhaseId || '',
    coverPhaseName: record.coverPhaseName || record.boardCoverPhaseName || '',
    coverFrameProgress: Number(record.coverFrameProgress ?? record.boardCoverFrameProgress) || 0,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function normalizedRecord(exercise, existing = null) {
  const now = Date.now();
  const duration = Number(exercise.duration);
  const reps = Number(exercise.reps);
  const pause = Number(exercise.pause);
  return {
    ...(existing || {}),
    id: exercise.id || crypto.randomUUID(),
    recordType: 'exercise',
    example: false,
    customBoard: true,
    name: String(exercise.name || 'Ejercicio').trim(),
    category: CATEGORY,
    difficulty: String(exercise.intensity || '').trim(),
    players: String(exercise.players || '').trim(),
    duration: Number.isFinite(duration) && duration > 0 ? duration : 0,
    material: String(exercise.material || '').trim(),
    space: 'Pizarra táctica',
    description: String(exercise.description || '').trim(),
    variants: '',
    objective: String(exercise.objective || '').trim(),
    intensity: String(exercise.intensity || '').trim(),
    favorite: Boolean(existing?.favorite),
    boardSaveMode: exercise.saveMode || 'static',
    boardStatic: exercise.staticBoard ?? null,
    boardAnimation: exercise.animatedBoard || null,
    boardPreview: exercise.preview || '',
    boardCoverSourceType: exercise.coverSourceType || 'phase',
    boardCoverPhaseId: exercise.coverPhaseId || '',
    boardCoverPhaseName: exercise.coverPhaseName || '',
    boardCoverFrameProgress: Number(exercise.coverFrameProgress) || 0,
    boardReps: Number.isFinite(reps) && reps > 0 ? reps : 0,
    boardPause: Number.isFinite(pause) && pause >= 0 ? pause : 0,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

async function customExerciseRecords({ sync = false } = {}) {
  if (sync) {
    try {
      await syncFromCloud();
    } catch { /* no bloquea lectura local */ }
  }
  const settings = await getAll('settings');
  return settings.filter((record) => record.recordType === 'exercise' && record.customBoard === true);
}

async function persistExercise(exercise) {
  const settings = await getAll('settings');
  const existing = settings.find((record) => record.id === exercise.id) || null;
  const record = normalizedRecord(exercise, existing);

  // Primero se confirma el guardado local. No se pierde un ejercicio por una
  // latencia o un pending ajeno del sincronizador.
  await put('settings', record);
  const verifiedLocal = (await getAll('settings')).find((item) => item.id === record.id && item.customBoard === true);
  if (!verifiedLocal) throw new Error('No se pudo confirmar el ejercicio guardado en el dispositivo.');

  let cloudReady = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const syncResult = await syncFromCloud().catch(() => null);
    if (syncResult?.online === true) {
      cloudReady = true;
      break;
    }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }

  if (!cloudReady) {
    // El registro ya está guardado y la cola normal de CampoBase volverá a
    // intentar sincronizarlo. No se marca como fallo ni se fuerza una recarga.
    setTimeout(() => { syncFromCloud().catch(() => null); }, 1500);
  }

  return { ...verifiedLocal, _cloudSyncConfirmed: cloudReady };
}

async function deleteExercise(exerciseId) {
  if (!exerciseId) throw new Error('Selecciona un ejercicio para borrar.');
  const settings = await getAll('settings');
  const existing = settings.find((record) => record.id === exerciseId && record.customBoard === true);
  if (!existing) throw new Error('El ejercicio ya no está disponible.');
  await remove('settings', exerciseId);
  try {
    await syncFromCloud();
  } catch (syncErr) {
    console.warn('Sincronización cloud de borrado pospuesta:', syncErr);
  }
  const remains = (await getAll('settings')).some((record) => record.id === exerciseId && record.customBoard === true);
  if (remains) throw new Error('El ejercicio sigue presente después del borrado.');
}

function closeEmbeddedBoard(frame) {
  const overlay = frame?.closest('.exercise-board-overlay');
  if (!overlay) return;
  overlay.classList.remove('open', 'viewer-mode');
  overlay.setAttribute('aria-hidden', 'true');
  frame.src = 'about:blank';
}

function activateEmbeddedBoard(doc) {
  if (doc.body.classList.contains('embedded-create') || doc.body.classList.contains('embedded-view')) return;
  if (doc.getElementById('campobase-embedded-runtime-fix')) return;
  const original = [...doc.scripts].reverse().find((script) => (
    script.textContent.includes('new URLSearchParams(location.search)')
    && script.textContent.includes('campobase:exercise-board-ready')
  ));
  if (!original) return;
  const patched = doc.createElement('script');
  patched.id = 'campobase-embedded-runtime-fix';
  patched.textContent = original.textContent.replace(
    'new URLSearchParams(location.search)',
    'new URLSearchParams(location.search || location.hash.slice(1))',
  );
  doc.body.append(patched);
}

function creatorCardMarkup(record) {
  const hasMovement = Boolean(record.boardAnimation?.phases?.length > 1);
  const preview = record.boardPreview || '<div class="cb-creator-no-preview">Sin plano guardado</div>';
  const duration = Number(record.duration) > 0 ? `${Number(record.duration)} min` : '—';
  const reps = Number(record.boardReps) > 0 ? `${Number(record.boardReps)} rep.` : '—';
  const pause = Number(record.boardPause) > 0 ? `${Number(record.boardPause)} s pausa` : '—';
  return `
    <article class="cb-creator-card" data-creator-card-id="${escapeHtml(record.id)}">
      <div class="cb-creator-preview">${preview}${hasMovement ? '<span class="cb-creator-motion">▶ Movimiento</span>' : ''}</div>
      <div class="cb-creator-body">
        <div class="cb-creator-title-row"><h4>${escapeHtml(record.name || 'Ejercicio')}</h4><span>Mis ejercicios</span></div>
        <div class="cb-creator-chips"><b>${escapeHtml(duration)}</b><b>${escapeHtml(record.intensity || '—')}</b><b>${escapeHtml(reps)}</b><b>${escapeHtml(pause)}</b>${record.players ? `<b>${escapeHtml(record.players)} jugadores</b>` : ''}</div>
        <div class="cb-creator-data">
          <p><strong>Material:</strong> ${escapeHtml(record.material || '—')}</p>
          <p><strong>Objetivo:</strong> ${escapeHtml(record.objective || '—')}</p>
          <p><strong>Explicación / observaciones:</strong> ${escapeMultiline(record.description || '—')}</p>
        </div>
        <div class="cb-creator-actions">
          <button type="button" data-creator-action="ficha" data-id="${escapeHtml(record.id)}">Editar ficha</button>
          <button type="button" data-creator-action="static" data-id="${escapeHtml(record.id)}">Editar plano fijo</button>
          <button type="button" data-creator-action="motion" data-id="${escapeHtml(record.id)}">Editar movimientos</button>
          <button type="button" class="danger" data-creator-action="delete" data-id="${escapeHtml(record.id)}">Borrar</button>
        </div>
      </div>
    </article>`;
}

function creatorManagerStyle(doc) {
  if (doc.getElementById('campobase-creator-manager-style')) return;
  const style = doc.createElement('style');
  style.id = 'campobase-creator-manager-style';
  style.textContent = `
    body.embedded-create .creator-manage{display:block!important;padding:14px!important;background:#fff!important;border:1px solid #e3e0d8!important;border-radius:18px!important;box-shadow:0 8px 24px rgba(26,26,26,.06)!important}
    body.embedded-create .creator-manage>strong,body.embedded-create .creator-manage>select,body.embedded-create .creator-manage>button{display:none!important}
    body.embedded-create .catalog-panel,body.embedded-create .demo-session-panel{display:none!important}
    .cb-creator-manager-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:12px}
    .cb-creator-manager-head h3{margin:0;font-size:18px;color:#1a1a1a}.cb-creator-manager-head p{margin:4px 0 0;color:#6b6b6b;font-size:11px;line-height:1.4}
    .cb-creator-manager-count{border-radius:999px;background:#f7f5f0;border:1px solid #e3e0d8;padding:6px 9px;font-size:10px;font-weight:900;color:#1a1a1a;white-space:nowrap}
    .cb-creator-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px}
    .cb-creator-card{border:1px solid #e3e0d8;border-radius:16px;background:#fff;overflow:hidden;box-shadow:0 6px 18px rgba(26,26,26,.06);min-width:0}
    .cb-creator-preview{position:relative;background:#15533a;aspect-ratio:16/9;overflow:hidden}.cb-creator-preview svg{width:100%;height:100%;display:block}.cb-creator-no-preview{height:100%;display:grid;place-items:center;color:#fff;font-size:12px;font-weight:800}
    .cb-creator-motion{position:absolute;right:9px;top:9px;background:#fff4b8;border:1px solid #e4c31b;color:#4d4100;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:950}
    .cb-creator-body{padding:12px}.cb-creator-title-row{display:flex;align-items:start;justify-content:space-between;gap:8px}.cb-creator-title-row h4{margin:0;font-size:16px;color:#1a1a1a}.cb-creator-title-row span{background:#f3eee5;border:1px solid #ddd4c6;color:#5c564d;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:900;white-space:nowrap}
    .cb-creator-chips{display:flex;gap:5px;flex-wrap:wrap;margin:9px 0}.cb-creator-chips b{font-size:9px;border-radius:999px;background:#f7f5f0;border:1px solid #e3e0d8;padding:4px 7px;color:#47433c}
    .cb-creator-data{display:grid;gap:5px;margin:8px 0 10px}.cb-creator-data p{margin:0;font-size:11px;line-height:1.4;color:#3f3b35}.cb-creator-data strong{color:#1a1a1a}
    .cb-creator-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;border-top:1px solid #eee9df;padding-top:10px}.cb-creator-actions button{min-height:38px!important;height:auto!important;border-radius:10px!important;border:1px solid #d8d3c8!important;background:#fff!important;padding:7px 8px!important;font-size:10px!important;font-weight:850!important;color:#1a1a1a!important}.cb-creator-actions button[data-creator-action="motion"]{background:#f5fff7!important;border-color:#8db69a!important}.cb-creator-actions button[data-creator-action="static"]{background:#fffdf2!important;border-color:#d6bd3b!important}.cb-creator-actions button.danger{color:#c8102e!important;border-color:#c8102e!important;background:#fff!important}
    .cb-creator-empty{padding:18px;border:1px dashed #d8d3c8;border-radius:13px;color:#6b6b6b;text-align:center;font-size:11px}
    @media(max-width:700px){.cb-creator-manager-head{align-items:start;flex-direction:column}.cb-creator-grid{grid-template-columns:1fr}.cb-creator-actions{grid-template-columns:1fr}}
  `;
  doc.head.append(style);
}

async function renderCreatorManager(frame, doc, suppliedRecords = null) {
  if (!doc.body.classList.contains('embedded-create')) return;
  const manage = doc.querySelector('.creator-manage');
  const select = doc.getElementById('creatorExerciseSelect');
  if (!manage || !select) return;
  creatorManagerStyle(doc);

  let root = doc.getElementById('campobaseCreatorManager');
  if (!root) {
    root = doc.createElement('section');
    root.id = 'campobaseCreatorManager';
    root.innerHTML = '<div class="cb-creator-manager-head"><div><h3>Tus ejercicios guardados</h3><p>Edita o borra aquí. En la biblioteca de Ejercicios solo se consultan y se añaden a sesiones.</p></div><span class="cb-creator-manager-count"></span></div><div class="cb-creator-grid"></div>';
    manage.append(root);

    root.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-creator-action][data-id]');
      if (!button) return;
      const id = button.dataset.id;
      const action = button.dataset.creatorAction;
      select.value = id;
      if (action === 'ficha') { doc.getElementById('creatorEditFicha')?.click(); return; }
      if (action === 'static') { doc.getElementById('creatorEditStatic')?.click(); return; }
      if (action === 'motion') { doc.getElementById('creatorEditMotion')?.click(); return; }
      if (action !== 'delete') return;
      if (!window.confirm(`¿Borrar "${customExerciseName(id)}" de Mis ejercicios?`)) return;
      button.disabled = true;
      const previous = button.textContent;
      button.textContent = 'Borrando…';
      try {
        await deleteExercise(id);
        const exercises = await customExerciseRecords({ sync: true });
        frame.contentWindow?.postMessage({ type: 'campobase:init-editor', exercises: exercises.map(toBoardExercise) }, '*');
        await renderCreatorManager(frame, doc, exercises);
      } catch (error) {
        console.error('No se pudo borrar el ejercicio:', error);
        alert(error?.message || String(error));
        button.disabled = false;
        button.textContent = previous;
      }
    });
  }

  const records = suppliedRecords || await customExerciseRecords({ sync: true }).catch(() => customExerciseRecords());
  root.querySelector('.cb-creator-manager-count').textContent = `${records.length} ${records.length === 1 ? 'ejercicio' : 'ejercicios'}`;
  root.querySelector('.cb-creator-grid').innerHTML = records.length
    ? records.map(creatorCardMarkup).join('')
    : '<div class="cb-creator-empty">Todavía no tienes ejercicios guardados. Crea uno y aparecerá aquí con su plano.</div>';
}

function customExerciseName(id) {
  return document.querySelector(`iframe[title="${FRAME_TITLE}"]`)?.contentDocument?.querySelector(`[data-creator-card-id="${CSS.escape(id)}"] h4`)?.textContent || 'este ejercicio';
}

function applyReadOnlyViewer(doc) {
  if (!doc.body.classList.contains('embedded-view')) return;
  const closeView = doc.getElementById('closeBoardView');
  if (closeView) { closeView.disabled = true; closeView.hidden = true; closeView.tabIndex = -1; }
  if (doc.getElementById('campobase-readonly-view-style')) return;
  const style = doc.createElement('style');
  style.id = 'campobase-readonly-view-style';
  style.textContent = `
    body.embedded-view #closeBoardView{display:none!important}
    body.embedded-view .material-panel,body.embedded-view .inspector-panel,body.embedded-view .board-toolbar,body.embedded-view .phase3-shell,body.embedded-view .phase2-shell,body.embedded-view .board-help,body.embedded-view .bottom-note,body.embedded-view .board-edit-banner{display:none!important}
    body.embedded-view .editor-shell{grid-template-columns:minmax(0,1fr)!important;max-width:1180px!important;margin:0 auto!important;width:100%!important}
    body.embedded-view .center{grid-column:1!important;width:100%!important;max-width:none!important}
    body.embedded-view .board-view-banner{margin:8px 10px!important;padding:10px 12px!important;font-size:12px!important;border-radius:12px!important}
    body.embedded-view .board-view-actions .view-play{height:40px!important;padding:0 14px!important;border-radius:10px!important;font-size:11px!important}
    body.embedded-view .board-card{margin:0 10px 14px!important}
  `;
  doc.head.append(style);
}

function patchEmbeddedFrame(frame) {
  if (!frame || frame.dataset.persistencePatched === '1') return;
  frame.dataset.persistencePatched = '1';
  frame.addEventListener('load', () => {
    if (!frame.src || frame.src === 'about:blank') return;
    let doc;
    try { doc = frame.contentDocument; } catch { return; }
    if (!doc) return;

    try { activateEmbeddedBoard(doc); }
    catch (error) { console.error('No se pudo activar la integración de la pizarra:', error); }

    if (!doc.getElementById('campobase-back-fix-style')) {
      const style = doc.createElement('style');
      style.id = 'campobase-back-fix-style';
      style.textContent = `
        #embeddedBack{
          display:inline-flex!important;align-items:center!important;justify-content:center!important;
          min-height:44px!important;padding:.72rem 1rem!important;border:0!important;border-radius:12px!important;
          background:#c8102e!important;color:#fff!important;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;
          font-size:14px!important;line-height:1.15!important;font-weight:700!important;white-space:nowrap!important;
          box-shadow:none!important;position:relative!important;z-index:60!important
        }
        @media(max-width:860px){
          .topbar{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important}
          #embeddedBack{display:inline-flex!important;flex:0 0 auto!important}
        }
      `;
      doc.head.append(style);
    }

    const back = doc.getElementById('embeddedBack');
    if (back && back.dataset.campobaseBackFixed !== '1') {
      back.dataset.campobaseBackFixed = '1';
      back.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeEmbeddedBoard(frame);
      }, true);
    }

    setTimeout(() => {
      applyReadOnlyViewer(doc);
      renderCreatorManager(frame, doc).catch((error) => console.warn('No se pudieron mostrar las fichas del Creador:', error.message));
    }, 0);
  });
}

function discoverFrames() {
  document.querySelectorAll(`iframe[title="${FRAME_TITLE}"]`).forEach(patchEmbeddedFrame);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', discoverFrames, { once: true });
  else discoverFrames();
  new MutationObserver(discoverFrames).observe(document.documentElement, { childList: true, subtree: true });
}

function replyToBoard(event, payload) {
  try { event.source?.postMessage(payload, '*'); }
  catch (error) { console.warn('No se pudo responder a la pizarra:', error); }
}

async function handlePersistRequest(event, data) {
  const requestId = data.requestId || '';
  try {
    const record = await persistExercise(data.exercise);
    replyToBoard(event, { type: 'campobase:exercise-persisted', requestId, exercise: toBoardExercise(record) });
    if (!data.stayOpen) {
      try { sessionStorage.setItem(OPEN_AFTER_SAVE_KEY, '1'); } catch { /* no bloquea */ }
      const host = window.__campobase;
      if (host?.refresh) await host.refresh().catch(() => null);
      host?.showView?.('ejercicios');
      host?.setExerciseLibraryMode?.('mine');
      const sourceFrame = [...document.querySelectorAll('iframe')].find((item) => item.contentWindow === event.source);
      if (sourceFrame) closeEmbeddedBoard(sourceFrame);
    }
  } catch (error) {
    console.error('No se pudo persistir el ejercicio:', error);
    replyToBoard(event, { type: 'campobase:exercise-persist-failed', requestId, message: error?.message || String(error) });
    const msg = error?.message || String(error);
    const toastElem = document.getElementById('toast');
    if (toastElem) {
      toastElem.textContent = `No se pudo guardar el ejercicio: ${msg}`;
      toastElem.classList.add('show');
      setTimeout(() => toastElem.classList.remove('show'), 3500);
    }
  }
}

if (typeof window !== 'undefined') window.addEventListener('message', async (event) => {
  const data = event.data || {};
  if ((data.type === 'campobase:persist-exercise' || data.type === 'campobase:exercise-saved') && data.exercise) {
    event.stopImmediatePropagation();
    await handlePersistRequest(event, data);
  }
}, true);
