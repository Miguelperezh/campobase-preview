import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';

const chrome = process.env.CHROME_BIN;
if (!chrome) throw new Error('CHROME_BIN no está definido.');

const server = spawn('python3', ['-m', 'http.server', '4173', '--bind', '127.0.0.1'], {
  stdio: ['ignore', 'ignore', 'inherit'],
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const response = await fetch('http://127.0.0.1:4173/index.html', { cache: 'no-store' });
      if (response.ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error('El servidor de prueba no arrancó.');
}

const browserErrors = [];
let browser;

async function enterDemo(page) {
  await page.goto('http://127.0.0.1:4173/index.html?browserSmoke=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__campobase?.state), null, { timeout: 20000 });

  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const location = message.location();
    const messageText = message.text();
    const knownExternalSimpleIconBlock = messageText.includes('ERR_BLOCKED_BY_RESPONSE.NotSameOrigin')
      && location?.url?.startsWith('https://cdn.simpleicons.org/');
    if (knownExternalSimpleIconBlock) return;
    browserErrors.push('console: ' + messageText + (location?.url ? ' @ ' + location.url : ''));
  });
  page.on('dialog', async (dialog) => {
    browserErrors.push('dialog: ' + dialog.message());
    await dialog.dismiss();
  });

  const isDemo = await page.evaluate(() => window.__campobase?.state?.role === 'demo');
  if (!isDemo) {
    await page.evaluate(() => document.getElementById('auth-demo-btn')?.click());
    await page.waitForFunction(() => window.__campobase?.state?.role === 'demo', null, { timeout: 20000 });
  }
}

async function testDesktop(page) {
  await enterDemo(page);
  await page.waitForTimeout(600);

  // 1) Equipo: la vista elegida no puede ser robada por el repintado de Hoy.
  await page.evaluate(() => window.__campobase.showView('plantilla'));
  await page.evaluate(() => window.__campobase.renderAll());
  await page.waitForTimeout(250);
  await page.waitForFunction(() => {
    const sub = document.getElementById('cb-sub-nav');
    const players = document.getElementById('players-list');
    return document.querySelector('.view.active')?.id === 'plantilla'
      && sub && getComputedStyle(sub).display !== 'none'
      && Boolean(players?.textContent?.trim());
  }, null, { timeout: 10000 });

  await page.click('#cb-sub-nav [data-target-view="cuerpo-tecnico"]');
  await page.waitForFunction(() => document.querySelector('.view.active')?.id === 'cuerpo-tecnico');
  await page.click('#cb-sub-nav [data-target-view="asistencia"]');
  await page.waitForFunction(() => document.querySelector('.view.active')?.id === 'asistencia');

  // 2) Preparación: cambiar un titular, guardar, repintar y reabrir conserva exactamente el orden.
  await page.evaluate(async () => {
    const app = window.__campobase;
    const db = await import('./js/db.js');
    const ids = Array.from({ length: 9 }, (_, index) => 'smoke-player-' + (index + 1));
    const players = ids.map((id, index) => ({
      id,
      name: 'Jugador Smoke ' + (index + 1),
      number: String(index + 1),
      positions: index < 2 ? ['Portero'] : ['MC'],
      active: true,
    }));
    const match = {
      id: 'smoke-match',
      opponent: 'Rival Smoke',
      date: '2099-01-01T09:00:00',
      venue: 'home',
      status: 'scheduled',
      type: 'friendly',
      format: 'F7',
      callupId: 'smoke-callup',
    };
    const callup = {
      id: 'smoke-callup',
      matchId: 'smoke-match',
      availableIds: ids,
      selectedIds: ids,
      format: 'F7',
      exclusions: [],
    };
    for (const player of players) await db.put('players', player);
    await db.put('matches', match);
    await db.put('callups', callup);
    await app.refresh();
    app.state.preparaciones = [];
    app.state.timer = null;
    app.renderAll();
    app.showView('preparacion');
  });

  await page.waitForSelector('.prep-open[data-id="smoke-match"]');
  await page.click('.prep-open[data-id="smoke-match"]');
  await page.waitForSelector('#prep-slots select');

  const assigned = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('#prep-slots select'));
    let outfieldIndex = 3;
    for (const select of selects) {
      const target = select.getAttribute('aria-label') === 'Portero'
        ? 'smoke-player-1'
        : 'smoke-player-' + outfieldIndex++;
      const option = Array.from(select.options).find((item) => item.value === target);
      if (!option) return false;
      select.value = target;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  });
  if (!assigned) throw new Error('No se pudo construir la alineación temporal válida.');

  const prepBefore = await page.$$eval('#prep-slots select', (nodes) => nodes.map((node) => node.value));
  if (prepBefore.length !== 7 || new Set(prepBefore.filter(Boolean)).size !== 7) {
    throw new Error('La preparación de prueba no contiene 7 titulares únicos.');
  }

  await page.click('#prep-save');
  await page.waitForFunction(() => document.getElementById('preparacion-editor')?.classList.contains('hidden'));
  await page.evaluate(() => window.__campobase.renderAll());
  await page.waitForFunction(() => document.querySelector('.view.active')?.id === 'preparacion');
  await page.click('.prep-open[data-id="smoke-match"]');
  await page.waitForSelector('#prep-slots select');
  const prepAfter = await page.$$eval('#prep-slots select', (nodes) => nodes.map((node) => node.value));
  if (JSON.stringify(prepAfter) !== JSON.stringify(prepBefore)) {
    throw new Error('La alineación guardada cambió al repintar y volver a entrar.');
  }
  await page.click('#prep-back');

  // 3) Preparar partido (flujo real): cambiar un titular en la pizarra debe
  // escribir preparación + live y reconstruirse desde almacenamiento.
  await page.evaluate(async () => {
    const app = window.__campobase;
    const db = await import('./js/db.js');
    const settings = await db.getAll('settings');
    for (const item of settings) {
      if (item.id === 'live' || (item.recordType === 'preparacion' && item.matchId === 'smoke-match')) {
        await db.remove('settings', item.id);
      }
    }
    app.state.preparaciones = [];
    app.state.timer = null;
    await app.refresh();
    app.renderAll();
    app.showView('partido');
  });

  await page.waitForSelector('#live-select');
  await page.selectOption('#live-select', 'smoke-match');
  await page.waitForFunction(() => !document.getElementById('first-keeper')?.disabled);
  await page.selectOption('#first-keeper', 'smoke-player-1');
  await page.selectOption('#second-keeper', 'smoke-player-1');
  await page.click('#prepare-live');
  await page.waitForSelector('#live-tactics-slots select');

  const changedLiveLineup = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('#live-tactics-slots select'));
    const target = selects.find((select) =>
      select.getAttribute('aria-label') !== 'Portero'
      && select.value !== 'smoke-player-9'
      && Array.from(select.options).some((option) => option.value === 'smoke-player-9')
    );
    if (!target) return false;
    target.value = 'smoke-player-9';
    target.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  });
  if (!changedLiveLineup) throw new Error('No se pudo cambiar un titular desde Preparar partido.');

  await page.waitForTimeout(500);
  const persistedLive = await page.evaluate(async () => {
    const db = await import('./js/db.js');
    const settings = await db.getAll('settings');
    const prep = settings.find((item) => item.recordType === 'preparacion' && item.matchId === 'smoke-match');
    const live = settings.find((item) => item.id === 'live');
    return {
      prepIds: prep?.team?.map((position) => position.playerId).filter(Boolean) ?? [],
      prepFormation: prep?.formacion ?? '',
      liveIds: live?.timer?.onField ?? [],
      initialIds: live?.timer?.initialOnField ?? [],
    };
  });
  if (persistedLive.prepIds.length !== 7 || new Set(persistedLive.prepIds).size !== 7 || !persistedLive.prepIds.includes('smoke-player-9')) {
    throw new Error('Preparar partido no persistió la alineación como preparación.');
  }
  if (JSON.stringify(persistedLive.liveIds) !== JSON.stringify(persistedLive.prepIds)
    || JSON.stringify(persistedLive.initialIds) !== JSON.stringify(persistedLive.prepIds)) {
    throw new Error('Preparar partido no persistió el mismo orden de posiciones en settings/live.');
  }

  await page.evaluate(async () => {
    const app = window.__campobase;
    app.state.timer = null;
    app.state.preparaciones = [];
    await app.refresh();
    app.renderAll();
    app.showView('partido');
  });
  await page.waitForSelector('#live-tactics-slots select');
  const restoredLiveIds = await page.$$eval('#live-tactics-slots select', (nodes) => nodes.map((node) => node.value).filter(Boolean));
  if (JSON.stringify(restoredLiveIds) !== JSON.stringify(persistedLive.prepIds)) {
    throw new Error('La alineación de Preparar partido cambió de posición al reconstruirse desde el guardado.');
  }

  // 4) Simular una actualización llegada desde otro dispositivo: con una
  // pizarra ya montada en memoria, una preparación remota más nueva debe
  // sustituir exactamente sus posiciones al refrescar.
  const remoteState = await page.evaluate(async () => {
    const app = window.__campobase;
    const db = await import('./js/db.js');
    const settings = await db.getAll('settings');
    const prep = settings.find((item) => item.recordType === 'preparacion' && item.matchId === 'smoke-match');
    const live = settings.find((item) => item.id === 'live');
    if (!prep?.team?.length || !live?.timer) return { expected: [], formation: '' };
    const team = prep.team.map((position) => ({ ...position }));
    const tmp = team[1].playerId;
    team[1].playerId = team[2].playerId;
    team[2].playerId = tmp;
    const expected = team.map((position) => position.playerId).filter(Boolean);
    const formation = prep.formacion === '1-2-3-1' ? '1-3-2-1' : '1-2-3-1';
    const updatedAt = Date.now() + 5000;
    await db.put('settings', { ...prep, team, formacion: formation, savedAt: updatedAt });
    const timer = {
      ...live.timer,
      onField: [...expected],
      initialOnField: [...expected],
      updatedAt,
    };
    await db.put('settings', { id: 'live', timer, updatedAt });
    app.state.timer = timer;
    app.state.liveUpdatedAt = updatedAt;
    await app.refresh(true);
    return { expected, formation };
  });
  if (remoteState.expected.length !== 7) throw new Error('No se pudo construir la alineación remota simulada.');
  const remoteRendered = await page.$$eval('#live-tactics-slots select', (nodes) => nodes.map((node) => node.value).filter(Boolean));
  if (JSON.stringify(remoteRendered) !== JSON.stringify(remoteState.expected)) {
    throw new Error('Una alineación llegada desde otro dispositivo no sustituyó la pizarra anterior.');
  }
  const remoteFormation = await page.$eval('#live-tactics-formacion', (node) => node.value);
  if (remoteFormation !== remoteState.formation) {
    throw new Error('La formación llegada desde otro dispositivo no sustituyó la formación anterior.');
  }

  // 5) + Ejercicio abre realmente.
  await page.evaluate(() => window.__campobase.showView('ejercicios'));
  await page.waitForSelector('#new-exercise');
  await page.click('#new-exercise');
  await page.waitForFunction(() => {
    const overlay = document.querySelector('.exercise-board-overlay');
    const dialog = document.getElementById('exercise-dialog');
    return Boolean(overlay?.classList.contains('open') || dialog?.open);
  }, null, { timeout: 10000 });

  // 4) Guardado real por el mismo canal de mensajes del creador.
  const saved = await page.evaluate(() => new Promise((resolve, reject) => {
    const requestId = 'browser-smoke-save';
    const timeout = setTimeout(() => {
      window.removeEventListener('message', onMessage);
      reject(new Error('No llegó confirmación de guardado del ejercicio.'));
    }, 10000);
    function onMessage(event) {
      if (event.data?.type !== 'campobase:exercise-persisted' || event.data?.requestId !== requestId) return;
      clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
      resolve(event.data.exercise?.id || '');
    }
    window.addEventListener('message', onMessage);
    window.postMessage({
      type: 'campobase:persist-exercise',
      requestId,
      exercise: {
        id: 'browser-smoke-exercise',
        name: 'Ejercicio Smoke Browser',
        objective: 'Validar persistencia',
        description: 'Prueba temporal',
        players: '7',
        material: 'Balones',
        duration: 10,
        reps: 2,
        pause: 30,
        intensity: 'Media',
        saveMode: 'static',
        staticBoard: { players: [], objects: [] },
        preview: '',
      },
    }, '*');
  }));

  if (saved !== 'browser-smoke-exercise') throw new Error('El ejercicio guardado no devolvió el id esperado.');

  await page.waitForFunction(() => window.__campobase.state.exercises.some((item) => item.id === 'browser-smoke-exercise'), null, { timeout: 10000 });
  await page.evaluate(() => {
    window.__campobase.showView('ejercicios');
    window.__campobase.setExerciseLibraryMode('mine');
  });
  await page.waitForFunction(() => document.body.innerText.includes('Ejercicio Smoke Browser'), null, { timeout: 10000 });
}

async function testMobile(page) {
  await enterDemo(page);
  await page.evaluate(() => window.__campobase.showView('ejercicios'));
  await page.waitForSelector('#new-exercise');
  await page.click('#new-exercise');
  await page.waitForFunction(() => {
    const overlay = document.querySelector('.exercise-board-overlay');
    const dialog = document.getElementById('exercise-dialog');
    return Boolean(overlay?.classList.contains('open') || dialog?.open);
  }, null, { timeout: 10000 });
}

try {
  await waitServer();
  browser = await chromium.launch({ headless: true, executablePath: chrome, args: ['--no-sandbox'] });

  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    serviceWorkers: 'block',
  });
  const desktop = await desktopContext.newPage();
  await testDesktop(desktop);
  await desktopContext.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    serviceWorkers: 'block',
  });
  const mobile = await mobileContext.newPage();
  await testMobile(mobile);
  await mobileContext.close();

  if (browserErrors.length) {
    throw new Error('Errores de navegador detectados:\n' + browserErrors.join('\n'));
  }

  console.log('Browser smoke v19 OK: subpestañas, Preparación, Preparar partido persistente, + Ejercicio y guardado.');
} finally {
  if (browser) await browser.close().catch(() => {});
  server.kill('SIGTERM');
}
