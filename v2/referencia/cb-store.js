// CampoBase · prueba aislada de diseño. Estado compartido en memoria (no toca la app real ni Supabase).
(function () {
  if (window.CB) return;
  const FORMATS = { F7: { players: 7, duration: 70, half: 35 }, F11: { players: 11, duration: 90, half: 45 } };
  const PLAYERS = [
    { id: 'p1', n: 1, name: 'Hugo Martín', pos: ['Portero'], foot: 'Derecha', father: 'Carlos Martín', fatherPhone: '600 111 222', mother: 'Elena Suárez', motherPhone: '600 333 444' },
    { id: 'p13', n: 13, name: 'Nico Falcón', pos: ['Portero'], foot: 'Izquierda', father: 'Juan Falcón', fatherPhone: '611 222 333' },
    { id: 'p2', n: 2, name: 'Leo Santana', pos: ['Lateral derecho'], foot: 'Derecha', mother: 'Rosa Pérez', motherPhone: '622 444 555' },
    { id: 'p3', n: 3, name: 'Dani Cabrera', pos: ['Central'], foot: 'Derecha', father: 'Luis Cabrera', fatherPhone: '633 555 666' },
    { id: 'p4', n: 4, name: 'Marco Afonso', pos: ['Lateral izquierdo'], foot: 'Izquierda' },
    { id: 'p5', n: 5, name: 'Adrián Luis', pos: ['Central'], foot: 'Derecha' },
    { id: 'p6', n: 6, name: 'Pablo Ramos', pos: ['Pivote/Mediocentro defensivo'], foot: 'Derecha' },
    { id: 'p7', n: 7, name: 'Enzo Déniz', pos: ['Extremo'], foot: 'Izquierda' },
    { id: 'p8', n: 8, name: 'Izan Quintana', pos: ['Interior'], foot: 'Ambas' },
    { id: 'p9', n: 9, name: 'Mateo Rivero', pos: ['Delantero centro'], foot: 'Derecha' },
    { id: 'p10', n: 10, name: 'Samuel Vega', pos: ['Mediapunta'], foot: 'Izquierda' },
    { id: 'p11', n: 11, name: 'Álex Mesa', pos: ['Extremo'], foot: 'Derecha' },
    { id: 'p12', n: 12, name: 'Iker Suárez', pos: ['Carrilero'], foot: 'Derecha' },
    { id: 'p14', n: 14, name: 'Unai Perdomo', pos: ['Interior'], foot: 'Derecha' },
    { id: 'p15', n: 15, name: 'Ayoze Cruz', pos: ['Central'], foot: 'Izquierda' },
    { id: 'p16', n: 16, name: 'Bruno Toledo', pos: ['Segundo delantero'], foot: 'Derecha' },
  ];
  // [min liga, goles, asist, amarillas, rojas, convocatorias, rotaciones, media, tarde, ausente, lesiones]
  const SEASON = {
    p1: [210, 0, 0, 0, 0, 3, 0, 4.1, 0, 0, 0], p13: [70, 0, 0, 0, 0, 2, 1, 3.6, 1, 0, 0],
    p2: [105, 1, 2, 0, 0, 3, 0, 3.8, 0, 0, 0], p3: [98, 0, 0, 1, 0, 3, 0, 3.5, 2, 0, 0],
    p4: [110, 0, 1, 1, 0, 3, 0, 3.7, 0, 1, 0], p5: [70, 0, 0, 0, 0, 2, 1, 3.4, 3, 0, 1],
    p6: [112, 2, 1, 0, 0, 3, 0, 4.0, 0, 0, 0], p7: [95, 2, 3, 0, 0, 3, 0, 3.8, 0, 0, 0],
    p8: [100, 1, 1, 0, 0, 3, 0, 3.9, 1, 0, 0], p9: [115, 5, 0, 1, 0, 3, 0, 4.3, 0, 0, 0],
    p10: [85, 3, 2, 0, 0, 3, 0, 3.9, 0, 0, 0], p11: [80, 1, 1, 0, 0, 3, 0, 3.5, 0, 2, 0],
    p12: [60, 0, 0, 0, 0, 2, 1, 3.3, 0, 1, 0], p14: [78, 0, 2, 0, 0, 3, 0, 3.6, 0, 0, 0],
    p15: [55, 0, 0, 1, 0, 2, 1, 3.2, 1, 0, 0], p16: [72, 2, 0, 0, 0, 3, 0, 3.7, 0, 0, 0],
  };
  const FORMATIONS = {
    '1-3-2-1': [[18, 70], [50, 74], [82, 70], [32, 47], [68, 47], [50, 22]],
    '1-2-3-1': [[30, 72], [70, 72], [16, 48], [50, 50], [84, 48], [50, 22]],
    '1-2-2-2': [[30, 72], [70, 72], [30, 50], [70, 50], [32, 24], [68, 24]],
    '1-3-1-2': [[18, 70], [50, 74], [82, 70], [50, 50], [32, 24], [68, 24]],
    '1-1-3-2': [[50, 74], [18, 52], [50, 54], [82, 52], [32, 26], [68, 26]],
    '1-3-3': [[18, 70], [50, 74], [82, 70], [16, 34], [50, 26], [84, 34]],
    '1-4-1-1': [[12, 68], [38, 72], [62, 72], [88, 68], [50, 46], [50, 22]],
    '1-2-1-3': [[30, 72], [70, 72], [50, 52], [16, 30], [50, 24], [84, 30]],
    '1-1-3-1-1': [[50, 76], [18, 56], [50, 58], [82, 56], [50, 40], [50, 20]],
    '1-1-4-1': [[50, 76], [12, 52], [38, 54], [62, 54], [88, 52], [50, 24]],
    '1-2-2-1-1': [[30, 74], [70, 74], [30, 54], [70, 54], [50, 38], [50, 18]],
  };
  const F11_POS = [[12, 68], [37, 73], [63, 73], [88, 68], [26, 48], [50, 52], [74, 48], [18, 25], [50, 20], [82, 25]];
  const EXCLUSION_REASONS = { sick: 'Enfermo', injured: 'Lesionado', suspended: 'Sancionado', missed_training: 'No fue a entrenar', discipline: 'Disciplina (notas/padres)', coach_decision: 'Decisión del entrenador', other: 'Otro motivo', rotation: 'Rotación equitativa' };

  const S = {
    speed: 1,
    settings: {
      theme: 'default', accent: '#10b981', font: 'system', scale: 'normal', weight: 'bold', textColor: 'dark-slate', fontColor: '#0f172a',
      sem: { gk: '#f59e0b', def: '#2563eb', mid: '#10b981', fw: '#e02444', win: '#10b981', draw: '#94a3b8', loss: '#c8102e' }, fontTitle: 'auto',
      presets: [{ name: 'Campo Esmeralda', theme: 'default', accent: '#10b981', font: 'system', fontTitle: 'auto', scale: 'normal' }, { name: 'Sol directo', theme: 'high-vis', accent: '#f59e0b', font: 'readable', fontTitle: 'sport', scale: 'large' }], matchPreset: -1,
      crest: 'icons/escudo.png', teamName: 'Unión Viera Alevín D', format: 'F7',
      kits: { primary: '1.ª Oficial (Roja y Negra)', secondary: '2.ª Alternativa (Blanca y Negra)', training: 'Equipación oficial de entrenamiento', bibs: 'Petos verdes y amarillos' },
      opts: { seasonBalance: false, planMode: 'tramos', alert10: true, alertGap: 10, discreet: true, sunMode: false, haptic: true, delegPlan: true, delegBoard: true, waTemplate: true, autoHalftimeLineup: true },
    },
    callup: { ids: ['p1', 'p13', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p14', 'p16'], excluded: { p12: 'sick', p15: 'rotation' } },
    match: { opponent: 'UD Lomo Verde', short: 'LV', date: 'Sáb 27 sep', time: '10:30', venue: 'home', round: '4', type: 'Liga', location: 'Campo Municipal' },
    delegateVisible: true, prepared: true, formation: '1-3-2-1',
    manual: { changes: [] }, prep: null, callupNotes: {}, photos: {},
    confirm: { p1: 'yes', p13: 'yes', p2: 'yes', p3: 'yes', p4: 'pending', p5: 'yes', p6: 'yes', p7: 'yes', p8: 'pending', p9: 'yes', p10: 'yes', p11: 'no', p14: 'yes', p16: 'pending' },
    live: null,
  };

  const subs = new Set();
  const notify = () => subs.forEach((fn) => { try { fn(); } catch (e) {} });
  const byId = Object.fromEntries(PLAYERS.map((p) => [p.id, p]));
  const isGk = (id) => (byId[id]?.pos || []).includes('Portero');
  const fmt = () => FORMATS[S.settings.format] || FORMATS.F7;

  // Reparto: porteros por un lado y jugadores de campo por otro.
  // Campo: (jugadores en campo − 1) × duración repartido a partes iguales entre los convocados de campo,
  // con rotación circular exacta (cada tramo continuo por puesto, cambios en pocos momentos).
  let planKey = '', planCache = null, mKey = '', mCache = null;
  function plan() {
    const auto = autoPlan();
    if (S.settings.opts.planMode !== 'manual') return auto;
    const key = planKey + '|' + JSON.stringify(S.manual) + JSON.stringify(S.prep);
    if (key === mKey) return mCache;
    mCache = manualPlan(auto); mKey = key; return mCache;
  }
  function startLineup(auto) {
    const l0 = auto.lineupAt(0);
    if (S.prep && S.prep.slots && S.prep.slots.length === auto.slots) return { gk: S.prep.gk || l0.gk, slots: S.prep.slots.slice() };
    return { gk: l0.gk, slots: l0.slots.slice() };
  }
  function manualPlan(auto) {
    const D = auto.D, start = startLineup(auto);
    const cur = { gk: start.gk, slots: start.slots.slice() };
    const open = {}; const segs = {}; const perSlot = Array.from({ length: auto.slots }, () => []); const gkPlan = [];
    const openAt = (id, slot, t) => { open[id] = { slot, from: t }; };
    const close = (id, t) => { const o = open[id]; if (!o) return; if (t > o.from) { (segs[id] = segs[id] || []).push({ from: o.from, to: t, slot: o.slot }); if (o.slot === 'gk') gkPlan.push({ id, from: o.from, to: t }); else perSlot[o.slot].push({ id, from: o.from, to: t }); } delete open[id]; };
    if (cur.gk) openAt(cur.gk, 'gk', 0);
    cur.slots.forEach((id, i) => id && openAt(id, i, 0));
    const list = (S.manual.changes || []).slice().sort((a, b) => a.m - b.m);
    const changes = [];
    list.forEach((c) => {
      const m = Math.max(0, Math.min(D, c.m));
      const onF = [cur.gk, ...cur.slots];
      const ok = c.out && c.inn && onF.includes(c.out) && !onF.includes(c.inn);
      changes.push({ ...c, m, ok, slot: ok ? (cur.gk === c.out ? 'gk' : cur.slots.indexOf(c.out)) : null });
      if (!ok) return;
      const slot = cur.gk === c.out ? 'gk' : cur.slots.indexOf(c.out);
      close(c.out, m); openAt(c.inn, slot, m);
      if (slot === 'gk') cur.gk = c.inn; else cur.slots[slot] = c.inn;
    });
    Object.keys(open).forEach((id) => close(id, D));
    perSlot.forEach((l) => l.sort((a, b) => a.from - b.from));
    gkPlan.sort((a, b) => a.from - b.from);
    const groups = {};
    changes.filter((c) => c.ok).forEach((c) => { (groups[c.m] = groups[c.m] || []).push(c); });
    const planned = {};
    Object.keys(segs).forEach((id) => { planned[id] = segs[id].reduce((a, g) => a + g.to - g.from, 0); });
    const lineupAt = (t) => {
      const l = { gk: start.gk, slots: start.slots.slice() };
      list.forEach((c) => { if (c.m <= t) { if (l.gk === c.out) l.gk = c.inn; else { const i = l.slots.indexOf(c.out); if (i >= 0 && ![l.gk, ...l.slots].includes(c.inn)) l.slots[i] = c.inn; } } });
      return l;
    };
    return { ...auto, manual: true, segs, perSlot, gkPlan: gkPlan.length ? gkPlan : auto.gkPlan, changes, groups: Object.keys(groups).map(Number).sort((a, b) => a - b).map((m) => ({ m, list: groups[m] })), lineupAt, planned };
  }
  function autoPlan() {
    const f = fmt(), slots = f.players - 1, D = f.duration, H = f.half;
    const key = [S.settings.format, S.settings.opts.planMode === 'partes' ? 'partes' : 'tramos', S.callup.ids.join(','), S.settings.opts.seasonBalance ? 'sb' : ''].join('|');
    if (key === planKey) return planCache;
    const gks = S.callup.ids.filter(isGk).sort((a, b) => byId[a].n - byId[b].n);
    const field = S.callup.ids.filter((id) => !isGk(id)).sort((a, b) => byId[a].n - byId[b].n);
    const gkPlan = gks.length === 0 ? [] : gks.length === 1 ? [{ id: gks[0], from: 0, to: D }]
      : gks.length === 2 ? [{ id: gks[0], from: 0, to: H }, { id: gks[1], from: H, to: D }]
      : gks.map((id, i) => ({ id, from: (D / gks.length) * i, to: (D / gks.length) * (i + 1) }));
    const N = field.length, total = slots * D;
    const T = N <= slots ? D : total / N;
    const off = N <= slots || S.settings.opts.planMode === 'partes' ? 0 : T / 2;
    // Compensación de temporada: quien acumula menos minutos recibe algo más (máx. ±5′), la suma no cambia.
    const len = field.map(() => T);
    const seasonAdj = {};
    if (S.settings.opts.seasonBalance && N > slots) {
      const sm = field.map((id) => SEASON[id] ? SEASON[id][0] / Math.max(1, SEASON[id][5]) : 0);
      const avg = sm.reduce((a, b) => a + b, 0) / N;
      let adj = sm.map((v) => Math.max(-5, Math.min(5, (avg - v) * 0.25)));
      const mean = adj.reduce((a, b) => a + b, 0) / N; adj = adj.map((a) => a - mean);
      adj.forEach((a, i) => { len[i] = Math.min(D, Math.max(1, T + a)); seasonAdj[field[i]] = a; });
      const fix = total - len.reduce((a, b) => a + b, 0); len[0] += fix;
    }
    // (manual parte de este plan como base)
    const perSlot = Array.from({ length: slots }, () => []);
    const segs = {};
    field.forEach((id, i) => {
      if (N <= slots) { perSlot[i].push({ id, from: 0, to: D }); segs[id] = [{ from: 0, to: D, slot: i }]; return; }
      let a = (off + len.slice(0, i).reduce((x, y) => x + y, 0)) % total, left = len[i]; segs[id] = [];
      while (left > 1e-6) {
        const slot = Math.floor(a / D) % slots, sEnd = (slot + 1) * D, take = Math.min(left, sEnd - a);
        const from = a - slot * D, to = from + take;
        perSlot[slot].push({ id, from, to }); segs[id].push({ from, to, slot });
        left -= take; a = (a + take) % total;
      }
    });
    perSlot.forEach((l) => l.sort((x, y) => x.from - y.from));
    const changes = [];
    perSlot.forEach((l, slot) => { for (let j = 0; j < l.length - 1; j++) changes.push({ m: Math.round(l[j].to), out: l[j].id, inn: l[j + 1].id, slot }); });
    gkPlan.forEach((g, j) => { if (j < gkPlan.length - 1) changes.push({ m: Math.round(g.to), out: g.id, inn: gkPlan[j + 1].id, slot: 'gk' }); });
    const groups = {};
    changes.forEach((c) => { (groups[c.m] = groups[c.m] || []).push(c); });
    const targets = {};
    field.forEach((id, i) => { targets[id] = len[i]; });
    gkPlan.forEach((g) => { targets[g.id] = (targets[g.id] || 0) + (g.to - g.from); });
    const lineupAt = (t) => ({ gk: (gkPlan.find((g) => t >= g.from && t < g.to) || gkPlan[0] || {}).id, slots: perSlot.map((l) => (l.find((p) => t >= p.from - 1e-6 && t < p.to - 1e-6) || l[l.length - 1] || {}).id) });
    const planned = {}; Object.keys(segs).forEach((id) => { planned[id] = segs[id].reduce((a, g) => a + g.to - g.from, 0); }); gkPlan.forEach((g) => { planned[g.id] = (planned[g.id] || 0) + g.to - g.from; });
    planCache = { seasonAdj, planned, gks, field, gkPlan, perSlot, segs, targets, T, D, H, slots, changes, groups: Object.keys(groups).map(Number).sort((a, b) => a - b).map((m) => ({ m, list: groups[m] })), lineupAt, fieldTarget: T, gkTarget: gks.length ? D / gks.length : 0 };
    planKey = key;
    return planCache;
  }

  function initLive(startSec = 990) {
    const p = plan(), L = p.lineupAt(0);
    const played = {};
    S.callup.ids.forEach((id) => { played[id] = 0; });
    [L.gk, ...L.slots].forEach((id) => { if (id) played[id] = startSec; });
    S.live = {
      phase: 'first_half', sec: startSec, running: true, gf: 1, ga: 0,
      gk: L.gk, slots: L.slots.slice(), played,
      events: [
        { id: 'e2', m: 9, k: 'goal', how: 'jugada', t: 'Gol de jugada', d: 'Mateo Rivero · asist. Enzo Déniz', who: 'p9' },
        { id: 'e1', m: 4, k: 'yellow', t: 'Amarilla', d: 'Dani Cabrera', who: 'p3' },
        { id: 'e0', m: 1, k: 'phase', t: 'Comienzo', d: 'Unión Viera 0 – 0 UD Lomo Verde' },
      ],
      dismissed: {}, done: {}, comment: '', ratings: {}, alertDismissed: {}, injured: {}, injuryKeep: {},
    };
  }
  initLive();

  let acc = 0;
  setInterval(() => {
    const L = S.live;
    if (!L || !L.running) return;
    const f = fmt();
    acc += S.speed;
    const step = Math.floor(acc); acc -= step;
    if (!step) return;
    for (let i = 0; i < step; i++) {
      L.sec += 1;
      [L.gk, ...L.slots].forEach((id) => { if (id) L.played[id] = (L.played[id] || 0) + 1; });
      if (L.phase === 'first_half' && L.sec >= (f.half + 3) * 60) { L.running = false; break; }
      if (L.phase === 'second_half' && L.sec >= (f.duration + 4) * 60) { L.running = false; break; }
    }
    notify();
  }, 1000);

  let eid = 10;
  const minute = () => Math.floor(S.live.sec / 60) + 1;
  const name = (id) => (id === 'pp' ? 'Gol en propia puerta (P.P.)' : byId[id]?.name || 'Jugador eliminado');
  const scoreText = () => `Unión Viera ${S.live.gf} – ${S.live.ga} ${S.match.opponent}`;
  const push = (ev) => { S.live.events.unshift({ id: 'e' + eid++, m: minute(), ...ev }); };

  const A = {
    nextPhase(role) {
      const L = S.live, f = fmt();
      if (L.phase === 'ready') { L.phase = 'first_half'; L.sec = 0; L.running = true; push({ k: 'phase', t: 'Comienzo', d: scoreText() }); }
      else if (L.phase === 'first_half') { L.phase = 'halftime'; L.running = false; L.sec = f.half * 60; push({ k: 'phase', t: 'Descanso', d: scoreText() }); }
      else if (L.phase === 'halftime') {
        L.phase = 'second_half'; L.running = true;
        if (S.settings.opts.autoHalftimeLineup) {
          const nx = plan().lineupAt(f.half);
          const onF = [L.gk, ...L.slots];
          nx.slots.forEach((id, i) => { if (id && !onF.includes(id)) { L.done[f.half + ':' + i] = 1; } });
          L.gk = nx.gk || L.gk; L.slots = nx.slots.map((id, i) => id || L.slots[i]);
          L.dismissed[f.half] = 1;
        }
        push({ k: 'phase', t: 'Segundo tiempo', d: 'Alineación del 2.º tiempo aplicada · puedes ajustarla' });
      } else if (L.phase === 'second_half') {
        L.running = false;
        if (role === 'delegado') { L.delegateFlag = true; push({ k: 'phase', t: 'Final (pendiente de Migue)', d: 'El delegado ha pausado al final y avisado a Migue' }); }
        else { L.phase = 'finished'; push({ k: 'phase', t: 'Final del partido', d: scoreText() }); }
      }
      notify();
    },
    togglePause() { const L = S.live; if (L.phase === 'first_half' || L.phase === 'second_half') { L.running = !L.running; notify(); } },
    applySubs(outs, ins) {
      const L = S.live;
      outs.forEach((o, i) => {
        const inn = ins[i]; if (!inn) return;
        if (L.gk === o) L.gk = inn; else L.slots = L.slots.map((x) => (x === o ? inn : x));
        const inj = L.injured && L.injured[o];
        push({ k: 'sub', t: inj ? 'Cambio por lesión' : 'Cambio', d: `Entra ${name(inn)} · Sale ${name(o)}`, who: inn });
      });
      notify();
    },
    applyGroup(m) { const g = plan().groups.find((x) => x.m === m); if (!g) return; const L = S.live; const onF = [L.gk, ...L.slots]; const list = g.list.filter((c) => onF.includes(c.out) && !onF.includes(c.inn)); A.applySubs(list.map((c) => c.out), list.map((c) => c.inn)); L.dismissed[m] = 1; notify(); },
    dismiss(m) { S.live.dismissed[m] = 1; notify(); },
    dismissAlert(id) { S.live.alertDismissed[id] = 1; notify(); },
    keepInjured(id) { S.live.injuryKeep[id] = 1; notify(); },
    recovered(id) { delete S.live.injured[id]; notify(); },
    addGoal(scorer, assist) {
      S.live.gf += 1;
      push({ k: 'goal', how: 'jugada', t: 'Gol', d: name(scorer) + (assist ? ' · asist. ' + name(assist) : ''), who: scorer });
      notify();
    },
    // Registro completo de goles y penaltis.
    score(type, who, extra) {
      const L = S.live;
      const T = {
        for_jugada: ['goal', 'jugada', 'Gol de jugada'], for_penalti: ['goal', 'penalti', 'Gol de penalti'], for_falta: ['goal', 'falta', 'Gol de falta directa'], for_pp: ['goal', 'pp', 'Gol en propia puerta del rival'],
        ag_jugada: ['against', 'jugada', 'Gol rival'], ag_penalti: ['against', 'penalti', 'Gol rival de penalti'], ag_falta: ['against', 'falta', 'Gol rival de falta'], ag_pp: ['against', 'pp', 'Gol en propia puerta nuestro'],
        miss_for: ['pen', 'miss_for', 'Penalti fallado'], miss_ag: ['pen', 'miss_ag', 'Penalti rival'],
      }[type];
      if (!T) return;
      const [k, how, t] = T;
      if (k === 'goal') L.gf += 1;
      if (k === 'against') L.ga += 1;
      let d = '';
      if (type === 'for_jugada') d = name(who) + (extra ? ' · asist. ' + name(extra) : '');
      else if (type === 'for_penalti' || type === 'for_falta') d = name(who);
      else if (type === 'for_pp') d = 'A favor · ' + S.match.opponent;
      else if (type === 'ag_pp') d = name(who) + ' (en contra)';
      else if (type === 'miss_for') d = name(who) + (extra ? ' · ' + extra : '');
      else if (type === 'miss_ag') d = who ? 'Parado por ' + name(who) : 'Fallado por ' + S.match.opponent + (extra ? ' · ' + extra : '');
      else d = S.match.opponent;
      push({ k, how, t: type === 'miss_ag' && who ? 'Penalti parado' : t, d, who, side: k });
      notify();
      return L.events[0].id;
    },
    rivalGoal() { S.live.ga += 1; push({ k: 'against', t: 'Gol rival', d: S.match.opponent }); notify(); },
    adjust(side, d) { const L = S.live; if (side === 'gf') L.gf = Math.max(0, L.gf + d); else L.ga = Math.max(0, L.ga + d); notify(); },
    incident(k, who, note) {
      const labels = { yellow: 'Amarilla', red: 'Roja', injury: 'Lesión', incident: 'Incidencia' };
      if (k === 'injury') { S.live.injured[who] = 1; delete S.live.injuryKeep[who]; }
      push({ k, t: labels[k], d: name(who) + (note ? ' · ' + note : ''), who }); notify();
    },
    removeEvent(id) {
      const L = S.live, ev = L.events.find((e) => e.id === id); if (!ev) return;
      if (ev.k === 'goal') L.gf = Math.max(0, L.gf - 1);
      if (ev.k === 'against') L.ga = Math.max(0, L.ga - 1);
      if (ev.k === 'injury' && ev.who) delete L.injured[ev.who];
      L.events = L.events.filter((e) => e.id !== id); notify();
    },
    setComment(t) { S.live.comment = t; notify(); },
    rate(id, v) { S.live.ratings[id] = v; notify(); },
    reset(sec) { initLive(sec ?? 990); notify(); },
    // Demo: saltar a un minuto simulando los minutos jugados según el plan.
    jump(min) {
      const p = plan(), f = fmt(), L = S.live, t = Math.min(min, f.duration);
      const lu = p.lineupAt(t);
      S.callup.ids.forEach((id) => {
        const segs = isGk(id) ? p.gkPlan.filter((g) => g.id === id) : (p.segs[id] || []);
        L.played[id] = Math.round(segs.reduce((s, g) => s + Math.max(0, Math.min(g.to, t) - g.from), 0) * 60);
      });
      L.gk = lu.gk; L.slots = lu.slots.slice(); L.sec = Math.round(t * 60);
      L.phase = t < f.half ? 'first_half' : 'second_half'; L.running = true;
      L.dismissed = {}; p.groups.forEach((g) => { if (g.m < t) L.dismissed[g.m] = 1; });
      if (t >= f.duration - 10) {
        const onF = [L.gk, ...L.slots];
        const b = S.callup.ids.find((id) => !isGk(id) && !onF.includes(id));
        if (b) L.played[b] = Math.max(0, L.played[b] - 12 * 60);
        L.alertDismissed = {};
      }
      notify();
    },
    setFormation(f) { S.formation = f; notify(); },
    toggleDelegate() { S.delegateVisible = !S.delegateVisible; notify(); },
    toggleExcluded(id, reason) {
      const c = S.callup;
      if (c.ids.includes(id)) { c.ids = c.ids.filter((x) => x !== id); c.excluded[id] = reason || 'coach_decision'; }
      else { c.ids = [...c.ids, id]; delete c.excluded[id]; }
      notify();
    },
    setSetting(k, v) { S.settings[k] = v; if (k === 'format') { planKey = ''; } notify(); },
    setOpt(k, v) { S.settings.opts[k] = v; planKey = ''; notify(); },
    setSpeed(v) { S.speed = v || 1; },
    setPhoto(id, url) { S.photos[id] = url; notify(); },
    setSem(k, v) { S.settings.sem = { ...S.settings.sem, [k]: v }; notify(); },
    savePreset() { const st = S.settings; st.presets = [...st.presets, { name: 'Tema ' + (st.presets.length + 1), theme: st.theme, accent: st.accent, font: st.font, fontTitle: st.fontTitle, scale: st.scale }]; notify(); },
    applyPreset(i) { const p = S.settings.presets[i]; if (!p) return; Object.assign(S.settings, { theme: p.theme, accent: p.accent, font: p.font, fontTitle: p.fontTitle, scale: p.scale }); notify(); },
    delPreset(i) { S.settings.presets = S.settings.presets.filter((_, j) => j !== i); if (S.settings.matchPreset === i) S.settings.matchPreset = -1; notify(); },
    setMatchPreset(i) { S.settings.matchPreset = S.settings.matchPreset === i ? -1 : i; notify(); },
    snap() { return JSON.stringify(S.live); },
    restore(j) { if (j) { S.live = JSON.parse(j); notify(); } },
    cycleConfirm(id) { const o = ['pending', 'yes', 'no']; S.confirm[id] = o[(o.indexOf(S.confirm[id] || 'pending') + 1) % 3]; notify(); },
    setCallupStatus(id, reason, note) {
      const c = S.callup;
      if (!reason) { if (!c.ids.includes(id)) { if (c.ids.length >= 14) return false; c.ids = [...c.ids, id]; } delete c.excluded[id]; delete S.callupNotes[id]; }
      else { c.ids = c.ids.filter((x) => x !== id); c.excluded[id] = reason; if (note != null) S.callupNotes[id] = note; }
      if (S.prep) S.prep = null;
      notify(); return true;
    },
    setCallupNote(id, note) { S.callupNotes[id] = note; notify(); },
    ensurePrep() { if (!S.prep) { const a = autoPlan(); const l = a.lineupAt(0); S.prep = { gk: l.gk, slots: l.slots.slice(), gk2: a.gkPlan[1] ? a.gkPlan[1].id : l.gk }; } return S.prep; },
    setPrepSlot(slot, id) {
      const p = A.ensurePrep();
      const put = (s, v) => { if (s === 'gk') p.gk = v; else p.slots[s] = v; };
      const where = p.gk === id ? 'gk' : p.slots.indexOf(id);
      const prev = slot === 'gk' ? p.gk : p.slots[slot];
      if (where !== -1 && where !== slot) put(where, prev);
      put(slot, id); notify();
    },
    setPrepGk2(id) { A.ensurePrep().gk2 = id; notify(); },
    resetPrep() { S.prep = null; notify(); },
    applyPrepToLive() { const p = A.ensurePrep(); const L = S.live; if (L.phase === 'ready' || L.sec < 60) { L.gk = p.gk; L.slots = p.slots.slice(); } notify(); },
    swapLive(a, b) { const L = S.live; const pos = (id) => (L.gk === id ? 'gk' : L.slots.indexOf(id)); const pa = pos(a), pb = pos(b); const put = (p, v) => { if (p === 'gk') L.gk = v; else L.slots[p] = v; }; if (pa === -1 || pb === -1) return; put(pa, b); put(pb, a); push({ k: 'phase', t: 'Cambio de posición', d: name(a) + ' ↔ ' + name(b) }); notify(); },
    manualInit() { const a = autoPlan(); if (!S.manual.changes.length) S.manual.changes = a.changes.map((c, i) => ({ id: 'mc' + i + Date.now(), m: c.m, out: c.out, inn: c.inn })); S.settings.opts.planMode = 'manual'; notify(); },
    manualAdd() { const a = plan(); const m = Math.min(a.D - 1, Math.round((S.live?.sec || 0) / 60) + 5); S.manual.changes = [...S.manual.changes, { id: 'mc' + Date.now(), m, out: null, inn: null }]; notify(); },
    manualSet(id, k, v) { S.manual.changes = S.manual.changes.map((c) => (c.id === id ? { ...c, [k]: v } : c)); notify(); },
    manualDel(id) { S.manual.changes = S.manual.changes.filter((c) => c.id !== id); notify(); },
    manualReset() { S.manual.changes = []; A.manualInit(); },
  };

  window.CB = {
    FORMATS, PLAYERS, SEASON, FORMATIONS, F11_POS, EXCLUSION_REASONS, byId, isGk,
    get: () => S, fmt, plan, name, minute, A,
    sub(fn) { subs.add(fn); return () => subs.delete(fn); },
    notify,
  };
})();
