// js/print-match-plan.js
// Exportación e impresión profesional de Plan de Partido en formato Ficha A4.
// Diseñado para entrenadores (Migue) y delegados: cronograma paso a paso
// didáctico ("muy bien explicado"), titulares, quién entra por quién con dorsales
// y puestos, regla del portero, tabla de minutos equitativos y acta de campo.

import { describeMoment, lineupIds, normalizeMoments, plannedMinutes } from './match-moments.js';
import { buildAutoPlan } from './reparto-plan.js';
import { executePrint } from './print-session-export.js';

const esc = (val = '') => String(val ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);

function playerById(players = [], id) {
  if (!id) return null;
  return players.find((p) => String(p.id) === String(id)) || null;
}

function playerName(players = [], id) {
  if (!id) return 'Sin asignar';
  const pl = playerById(players, id);
  return pl?.name || 'Jugador no encontrado';
}

function playerDorsal(players = [], id) {
  if (!id) return '';
  const pl = playerById(players, id);
  return pl?.number != null && pl?.number !== '' ? String(pl.number) : '';
}

function formatMatchDate(dateStr) {
  if (!dateStr) return 'Fecha por determinar';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      .replace(/^\w/, (c) => c.toUpperCase());
  } catch {
    return dateStr;
  }
}

/**
 * Calcula los tramos de minutos en que cada jugador participa en el césped.
 * Ejemplo: [{ from: 0, to: 12 }, { from: 25, to: 50 }] => "0′–12′, 25′–50′"
 */
function calculatePlayerSpans(playerId, moments, totalDuration) {
  const spans = [];
  for (let i = 0; i < moments.length; i += 1) {
    const cur = moments[i];
    const nextMin = moments[i + 1] ? moments[i + 1].minute : totalDuration;
    const isPlaying = cur.team.some((slot) => String(slot.playerId) === String(playerId));
    if (isPlaying && nextMin > cur.minute) {
      if (spans.length && spans[spans.length - 1].to === cur.minute) {
        spans[spans.length - 1].to = nextMin;
      } else {
        spans.push({ from: cur.minute, to: nextMin });
      }
    }
  }
  if (!spans.length) return 'Banquillo completo';
  return spans.map((s) => `${s.from}′–${s.to}′`).join(', ');
}

function renderMomentCardHtml(moment, prevMoment, halfDuration, players, availableIds) {
  const diff = describeMoment(prevMoment, moment);
  const isHalftime = moment.minute === halfDuration;
  const periodLabel = isHalftime ? 'Descanso' : moment.minute < halfDuration ? '1ª Parte' : '2ª Parte';
  
  const changeItems = [];

  // Sustituciones pares (Entra X por Y)
  diff.pairs.forEach(({ inId, outId }) => {
    const inPl = playerById(players, inId);
    const outPl = playerById(players, outId);
    const inNum = inPl?.number ? `${inPl.number} · ` : '';
    const outNum = outPl?.number ? `${outPl.number} · ` : '';
    const targetSlot = moment.team.find((s) => s.playerId === inId);
    const posText = targetSlot?.pos ? ` (${targetSlot.pos})` : '';

    changeItems.push(`
      <div class="cbx-pmp-change-row">
        <span class="cbx-pmp-tag-in">🟢 ENTRA</span>
        <strong class="cbx-pmp-in-name">${esc(inNum)}${esc(inPl?.name || inId)}</strong>
        <span class="cbx-pmp-pos-badge">${esc(posText)}</span>
        <span class="cbx-pmp-tag-arrow">⟵</span>
        <span class="cbx-pmp-tag-out">🔴 SALE</span>
        <span class="cbx-pmp-out-name">${esc(outNum)}${esc(outPl?.name || outId)}</span>
      </div>
    `);
  });

  // Salidas sin par directo
  diff.outIds.filter((id) => !diff.pairs.some((p) => p.outId === id)).forEach((id) => {
    const outPl = playerById(players, id);
    const num = outPl?.number ? `${outPl.number} · ` : '';
    changeItems.push(`
      <div class="cbx-pmp-change-row">
        <span class="cbx-pmp-tag-out">🔴 SALE</span>
        <span class="cbx-pmp-out-name">${esc(num)}${esc(outPl?.name || id)}</span>
      </div>
    `);
  });

  // Reubicaciones en el campo
  diff.moved.forEach(({ playerId, position }) => {
    const pl = playerById(players, playerId);
    const num = pl?.number ? `${pl.number} · ` : '';
    changeItems.push(`
      <div class="cbx-pmp-change-row is-move">
        <span class="cbx-pmp-tag-move">🔄 REUBICACIÓN</span>
        <strong>${esc(num)}${esc(pl?.name || playerId)}</strong>
        <span>pasa a jugar de <b>${esc(position)}</b></span>
      </div>
    `);
  });

  // Relevo de portero explícito
  if (diff.keeperId) {
    const kPl = playerById(players, diff.keeperId);
    const kNum = kPl?.number ? `${kPl.number} · ` : '';
    changeItems.push(`
      <div class="cbx-pmp-change-row is-keeper">
        <span class="cbx-pmp-tag-gk">🧤 PORTERÍA</span>
        <span>Relevo bajo palos: Entra <strong>${esc(kNum)}${esc(kPl?.name || diff.keeperId)}</strong></span>
      </div>
    `);
  }

  // Si no hubo diferencias detectadas
  if (!changeItems.length) {
    changeItems.push('<div class="cbx-pmp-change-row"><span>Sin sustituciones registradas para esta ventana.</span></div>');
  }

  // Quién queda en el campo y en el banquillo tras esta ventana
  const momentOnField = moment.team.map((slot) => {
    const pl = playerById(players, slot.playerId);
    const num = pl?.number ? `${pl.number}·` : '';
    return `${num}${pl?.name ? pl.name.split(' ')[0] : 'Jugador'} (${slot.pos})`;
  }).join(' · ');

  const momentBench = availableIds.filter((id) => !moment.team.some((s) => s.playerId === id)).map((id) => {
    const pl = playerById(players, id);
    const num = pl?.number ? `${pl.number}·` : '';
    return `${num}${pl?.name ? pl.name.split(' ')[0] : 'Jugador'}`;
  }).join(' · ');

  return `
    <div class="cbx-pmp-moment-card">
      <div class="cbx-pmp-moment-header">
        <div class="cbx-pmp-moment-badge">
          <span class="cbx-pmp-min-pill">MINUTO ${moment.minute}′</span>
          <span class="cbx-pmp-period-pill">${esc(periodLabel)}</span>
        </div>
        <div class="cbx-pmp-moment-sys">Sistema: <strong>${esc(moment.formation)}</strong></div>
      </div>
      <div class="cbx-pmp-moment-changes ${changeItems.length >= 4 ? 'is-multi-changes' : ''}">
        ${changeItems.join('')}
      </div>
      <div class="cbx-pmp-moment-snapshot">
        <div class="cbx-pmp-snap-col"><strong>Campo (${moment.team.length}):</strong> ${esc(momentOnField)}</div>
        ${momentBench ? `<div class="cbx-pmp-snap-col is-bench"><strong>Banquillo:</strong> ${esc(momentBench)}</div>` : ''}
      </div>
    </div>
  `;
}

/**
 * Genera el documento HTML completo para impresión A4 del Plan de Partido.
 */
export function buildMatchPlanHtml(matchOrId, state = {}, options = {}) {
  let match = null;
  let effectiveState = state || {};
  let effectiveOptions = options || {};

  if (typeof matchOrId === 'object' && matchOrId !== null && ('prep' in matchOrId || 'players' in matchOrId || 'callup' in matchOrId)) {
    match = matchOrId.match || matchOrId;
    effectiveState = {
      players: matchOrId.players || effectiveState.players || [],
      callups: matchOrId.callup ? [matchOrId.callup] : (effectiveState.callups || []),
      preparaciones: matchOrId.prep ? [matchOrId.prep] : (effectiveState.preparaciones || []),
      settings: matchOrId.settings || effectiveState.settings || {},
      ...effectiveState,
    };
    effectiveOptions = {
      prep: matchOrId.prep || effectiveOptions.prep,
      availableIds: matchOrId.availableIds || matchOrId.callup?.availableIds || effectiveOptions.availableIds,
      ...effectiveOptions,
    };
  } else {
    match = typeof matchOrId === 'object' && matchOrId !== null
      ? matchOrId
      : effectiveState?.matches?.find((m) => String(m.id) === String(matchOrId));
  }
  if (!match) return '';

  const prep = effectiveOptions.prep || effectiveState?.preparaciones?.find((p) => String(p.matchId) === String(match.id)) || null;
  const callup = effectiveState?.callups?.find((c) => c.matchId === match.id || c.id === match.callupId || String(c.id) === String(match.id)) || null;
  const players = effectiveState?.players || [];
  const squadIds = players.map((p) => p.id);
  const availableIds = (effectiveOptions.availableIds && effectiveOptions.availableIds.length)
    ? effectiveOptions.availableIds
    : (callup?.availableIds && callup.availableIds.length)
      ? callup.availableIds
      : (prep?.team && prep.team.length)
        ? prep.team.map((s) => s.playerId).filter(Boolean)
        : squadIds;

  const format = String(callup?.format || match?.format || effectiveState?.format || 'F7').toUpperCase();
  const isF11 = format === 'F11';

  // Normalizar momentos planificados
  let moments = [];
  if (options.momentsDraft && options.momentsDraft.length) {
    moments = normalizeMoments({
      team: options.momentsDraft.find(moment=>Number(moment.minute)===0)?.team || options.teamDraft || prep?.team,
      formacion: options.momentsDraft.find(moment=>Number(moment.minute)===0)?.formation || options.formacionDraft || prep?.formacion || (isF11 ? '1-4-3-3' : '1-3-2-1'),
      moments: options.momentsDraft,
    });
  } else if (prep) {
    moments = normalizeMoments(prep);
  } else {
    const basePositions = isF11
      ? ['Portero', 'Lateral derecho', 'Central derecho', 'Central izquierdo', 'Lateral izquierdo', 'Pivote', 'Interior derecho', 'Interior izquierdo', 'Extremo derecho', 'Delantero', 'Extremo izquierdo']
      : ['Portero', 'Lateral derecho', 'Central', 'Lateral izquierdo', 'Medio centro', 'Medio centro', 'Delantero'];
    moments = [{
      id: 'inicio',
      minute: 0,
      formation: isF11 ? '1-4-3-3' : '1-3-2-1',
      team: (availableIds.slice(0, isF11 ? 11 : 7)).map((id, idx) => ({ pos: basePositions[idx] || `P${idx + 1}`, playerId: id })),
    }];
  }

  // Duración oficial y tiempo de descanso según formato y tramos
  let totalDuration = isF11 ? 90 : 70;
  let halfDuration = isF11 ? 45 : 35;

  if (options.totalDuration) {
    totalDuration = options.totalDuration;
    halfDuration = options.halfDuration || Math.round(totalDuration / 2);
  } else if (match?.totalDuration || match?.duration) {
    totalDuration = match.totalDuration || match.duration;
    halfDuration = match.halfDuration || match.half || Math.round(totalDuration / 2);
  } else if (!isF11) {
    const positiveMinutes = moments.map((m) => Number(m.minute) || 0).filter((m) => m > 0);
    const maxMin = Math.max(0, ...positiveMinutes);
    if (positiveMinutes.includes(25) && maxMin === 25) {
      totalDuration = 50;
      halfDuration = 25;
    } else if (positiveMinutes.includes(30) && maxMin === 30) {
      totalDuration = 60;
      halfDuration = 30;
    } else {
      totalDuration = 70;
      halfDuration = 35;
    }
  }

  // Generación automática de rotación equitativa cuando se imprime sin preparación guardada pero hay suplentes
  if (!prep && moments.length <= 1 && availableIds.length > (isF11 ? 11 : 7)) {
    const keeperIds = availableIds.filter((id) => {
      const pl = playerById(players, id);
      return pl?.positions?.includes('Portero') || pl?.position === 'Portero';
    });
    if (!keeperIds.length && moments[0]?.team) {
      const initGk = moments[0].team.find((s) => s.pos?.toLowerCase().includes('portero') || s.pos === 'POR')?.playerId;
      if (initGk) keeperIds.push(initGk);
    }
    try {
      const auto = buildAutoPlan({
        format: isF11 ? 'F11' : 'F7',
        playerIds: availableIds,
        keeperIds,
        planMode: 'escalonado',
        customDuration: totalDuration,
      });
      if (auto?.groups && auto.groups.length) {
        const autoMoments = [moments[0]];
        for (const group of auto.groups) {
          let team = autoMoments.at(-1).team.map((slot) => ({ ...slot }));
          for (const change of group.list) {
            const index = team.findIndex((slot) => slot.playerId === change.out);
            if (index >= 0 && availableIds.includes(change.inn)) {
              team[index] = { ...team[index], playerId: change.inn };
            }
          }
          autoMoments.push({
            id: `auto-${group.m}`,
            minute: group.m,
            formation: autoMoments.at(-1).formation,
            team,
          });
        }
        moments = autoMoments;
      }
    } catch {
      // Fallback a los momentos base
    }
  }

  const initialMoment = moments[0] || { minute: 0, formation: isF11 ? '1-4-3-3' : '1-3-2-1', team: [] };
  const initialFieldIds = lineupIds(initialMoment.team);
  const initialBenchIds = availableIds.filter((id) => !initialFieldIds.includes(id));

  // Minutos calculados
  const minutesMap = plannedMinutes(moments, totalDuration);

  // Datos del club y staff
  const teamName = state?.settings?.teamName?.trim() || 'Unión Viera';
  const crestUrl = state?.clubCrest || state?.settings?.crest || 'icons/escudo.png';
  const opponentName = match.opponent || match.rival || 'Rival';
  const formattedDate = formatMatchDate(match.date);
  const matchTime = match.time ? `${match.time} h` : '';
  const matchPitch = match.pitch || match.location || 'Campo de juego';
  const venueText = match.venue === 'away' ? 'Visitante' : 'Local';
  const roundText = match.round ? `Jornada ${match.round}` : (match.competition || 'Competición oficial');

  // Staff del equipo
  const coachName = state?.settings?.coachName || 'Miguel Pérez (Migue)';
  const delegateName = state?.settings?.delegateName || 'Delegado de equipo';

  // --- 1. RENDER TITULARES INICIALES (0′) ---
  const startersCardsHtml = initialMoment.team.map((slot) => {
    const pl = playerById(players, slot.playerId);
    const num = pl?.number != null && pl?.number !== '' ? pl.number : '—';
    const name = pl?.name || 'Por asignar';
    const pos = slot.pos || 'Campo';
    const isGk = pos.toLowerCase().includes('portero') || pos === 'POR';
    return `
      <div class="cbx-pmp-starter-card ${isGk ? 'is-gk' : ''}">
        <div class="cbx-pmp-starter-pos">${esc(pos)}</div>
        <div class="cbx-pmp-starter-body">
          <span class="cbx-pmp-starter-dorsal">${esc(num)}</span>
          <strong class="cbx-pmp-starter-name">${esc(name)}</strong>
        </div>
      </div>
    `;
  }).join('');

  const benchPillsHtml = initialBenchIds.length
    ? initialBenchIds.map((id) => {
        const pl = playerById(players, id);
        const num = pl?.number != null && pl?.number !== '' ? `${pl.number} · ` : '';
        return `<span class="cbx-pmp-bench-pill"><b>${esc(num)}</b>${esc(pl?.name || playerName(players, id))}</span>`;
      }).join('')
    : '<span class="cbx-pmp-empty-text">Sin suplentes de inicio (plantilla justa)</span>';

  // --- 2. RENDER CRONOGRAMA DE SUSTITUCIONES EXPLICADAS (DINÁMICO) ---
  const laterMoments = moments.slice(1);
  const totalPages = laterMoments.length > 3 ? 3 : 2;
  const page1Moments = laterMoments.length > 3 ? laterMoments.slice(0, 2) : laterMoments;
  const page2Moments = laterMoments.length > 3 ? laterMoments.slice(2) : [];

  const getPrevMoment = (m) => {
    const mIdx = moments.indexOf(m);
    return mIdx > 0 ? moments[mIdx - 1] : moments[0];
  };

  const page1MomentsHtml = page1Moments.length
    ? page1Moments.map((moment) => renderMomentCardHtml(moment, getPrevMoment(moment), halfDuration, players, availableIds)).join('')
    : '<div class="cbx-pmp-no-moments"><p>No se han configurado ventanas de cambio intermedias. Los 7 titulares disputarán el partido completo según este borrador.</p></div>';

  const page2MomentsHtml = page2Moments.length
    ? page2Moments.map((moment) => renderMomentCardHtml(moment, getPrevMoment(moment), halfDuration, players, availableIds)).join('')
    : '';

  // --- 3. RENDER TABLA DE REPARTO DE MINUTOS ---
  // Ordenar convocados: primero por minutos descendente o por dorsal
  const sortedSquad = [...availableIds].sort((a, b) => {
    const plA = playerById(players, a);
    const plB = playerById(players, b);
    const numA = Number(plA?.number) || 999;
    const numB = Number(plB?.number) || 999;
    return numA - numB;
  });

  const minutesRowsHtml = sortedSquad.map((id) => {
    const pl = playerById(players, id);
    const dorsal = pl?.number != null && pl?.number !== '' ? pl.number : '—';
    const name = pl?.name || playerName(players, id);
    const naturalPos = pl?.positions && Array.isArray(pl.positions) && pl.positions.length ? pl.positions.join(', ') : 'Jugador';
    const isInitialStarter = initialFieldIds.includes(id);
    const roleText = isInitialStarter ? 'Titular 0′' : 'Suplente inicio';
    const mins = minutesMap[id] || 0;
    const pct = Math.min(100, Math.round((mins / totalDuration) * 100));
    const spansText = calculatePlayerSpans(id, moments, totalDuration);

    return `
      <tr>
        <td class="cbx-pmp-td-num">${esc(dorsal)}</td>
        <td class="cbx-pmp-td-name"><strong>${esc(name)}</strong></td>
        <td class="cbx-pmp-td-pos">${esc(naturalPos)}</td>
        <td class="cbx-pmp-td-role"><span class="cbx-pmp-role-pill ${isInitialStarter ? 'is-start' : 'is-sub'}">${esc(roleText)}</span></td>
        <td class="cbx-pmp-td-time"><strong>${mins}′</strong> <small>/ ${totalDuration}′</small></td>
        <td class="cbx-pmp-td-pct">
          <div class="cbx-pmp-pct-bar-wrap">
            <div class="cbx-pmp-pct-bar-fill" style="width: ${pct}%;"></div>
            <span>${pct}%</span>
          </div>
        </td>
        <td class="cbx-pmp-td-spans">${esc(spansText)}</td>
      </tr>
    `;
  }).join('');

  // Minutos mínimos calculados en el reparto
  const allMins = Object.values(minutesMap);
  const minMins = allMins.length ? Math.min(...allMins) : 0;
  const maxMins = allMins.length ? Math.max(...allMins) : totalDuration;

  const nowPrintDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return `
    <div id="cb-print-root" class="cb-print-root cb-print-match-plan-root">
      
      <!-- ================= HOJA 1: TITULARES Y CRONOGRAMA ================= -->
      <div class="cb-print-sheet cbx-pmp-sheet cb-print-page cbx-pmp-page-1">
        
        <!-- Cabecera Oficial -->
        <header class="cbx-pmp-header">
          <div class="cbx-pmp-head-left">
            <div class="cbx-pmp-crest-box">
              <img src="${esc(crestUrl)}" class="cbx-pmp-crest-img" alt="Escudo" onerror="this.style.display='none'">
            </div>
            <div class="cbx-pmp-head-meta">
              <span class="cbx-pmp-kicker">${esc(teamName)} · ${esc(format)}</span>
              <h1 class="cbx-pmp-title">HOJA DE PARTIDO Y PLAN DE CAMBIOS</h1>
              <div class="cbx-pmp-match-banner">
                <span class="cbx-pmp-rival">vs <strong>${esc(opponentName)}</strong> (${esc(venueText)})</span>
                <span class="cbx-pmp-dot">·</span>
                <span>${esc(roundText)}</span>
              </div>
            </div>
          </div>
          <div class="cbx-pmp-head-right">
            <div class="cbx-pmp-info-tile">
              <span>📅 <strong>${esc(formattedDate)}</strong></span>
              ${matchTime ? `<span>⏰ <strong>${esc(matchTime)}</strong></span>` : ''}
              <span>🏟️ <strong>${esc(matchPitch)}</strong></span>
            </div>
          </div>
        </header>

        <!-- Bloque 1: Planteamiento y Alineación Inicial (0′) -->
        <section class="cbx-pmp-section">
          <div class="cbx-pmp-sec-head">
            <div class="cbx-pmp-sec-title">
              <span class="cbx-pmp-badge-accent">INICIO · 0′</span>
              <h3>TITULARES Y SISTEMA INICIAL</h3>
            </div>
            <span class="cbx-pmp-badge-sys">Sistema: <strong>${esc(initialMoment.formation)}</strong></span>
          </div>

          <div class="cbx-pmp-starters-grid">
            ${startersCardsHtml}
          </div>

          <div class="cbx-pmp-bench-banner">
            <strong>SUPLENTES DE INICIO (${initialBenchIds.length}):</strong>
            <div class="cbx-pmp-bench-chips">
              ${benchPillsHtml}
            </div>
          </div>
        </section>

        <!-- Bloque 2: Cronograma Detallado y Explicado de Sustituciones -->
        <section class="cbx-pmp-section">
          <div class="cbx-pmp-sec-head">
            <div class="cbx-pmp-sec-title">
              <span class="cbx-pmp-badge-accent">CRONOGRAMA</span>
              <h3>VENTANAS DE SUSTITUCIÓN EXPLICADAS</h3>
            </div>
            <span class="cbx-pmp-sec-desc">${laterMoments.length} ${laterMoments.length === 1 ? 'momento de cambio previsto' : 'momentos de cambio previstos'}</span>
          </div>

          <div class="cbx-pmp-moments-list">
            ${page1MomentsHtml}
          </div>
        </section>

        <!-- Pie de página Hoja 1 -->
        <footer class="cbx-pmp-footer">
          <span>CampoBase · Hoja Oficial de Banquillo y Plan de Partido (Página 1 de ${totalPages})</span>
          <span>Impreso el ${esc(nowPrintDate)} · Entrenador: ${esc(coachName)} · Delegado: ${esc(delegateName)}</span>
        </footer>

      </div>

      ${totalPages === 3 ? `
      <!-- ================= HOJA 2: CONTINUACIÓN DE CRONOGRAMA ================= -->
      <div class="cb-print-sheet cbx-pmp-sheet cb-print-page cbx-pmp-page-1b">
        
        <header class="cbx-pmp-header cbx-pmp-header-compact">
          <div class="cbx-pmp-head-left">
            <div class="cbx-pmp-crest-box">
              <img src="${esc(crestUrl)}" class="cbx-pmp-crest-img" alt="Escudo" onerror="this.style.display='none'">
            </div>
            <div class="cbx-pmp-head-meta">
              <span class="cbx-pmp-kicker">${esc(teamName)} · ${esc(format)}</span>
              <h2 class="cbx-pmp-title" style="font-size: 16px; margin: 0;">VENTANAS DE SUSTITUCIÓN (CONTINUACIÓN)</h2>
              <div class="cbx-pmp-match-banner">
                <span class="cbx-pmp-rival">vs <strong>${esc(opponentName)}</strong> (${esc(venueText)})</span>
                <span class="cbx-pmp-dot">·</span>
                <span>${esc(formattedDate)}</span>
              </div>
            </div>
          </div>
          <div class="cbx-pmp-head-right">
            <span class="cbx-pmp-badge-accent">PÁGINA 2 DE 3</span>
          </div>
        </header>

        <section class="cbx-pmp-section">
          <div class="cbx-pmp-sec-head">
            <div class="cbx-pmp-sec-title">
              <span class="cbx-pmp-badge-accent">CRONOGRAMA</span>
              <h3>VENTANAS FINALES</h3>
            </div>
            <span class="cbx-pmp-sec-desc">${page2Moments.length} ventanas adicionales</span>
          </div>

          <div class="cbx-pmp-moments-list">
            ${page2MomentsHtml}
          </div>
        </section>

        <footer class="cbx-pmp-footer">
          <span>CampoBase · Hoja Oficial de Banquillo y Plan de Partido (Página 2 de 3)</span>
          <span>Impreso el ${esc(nowPrintDate)} · Entrenador: ${esc(coachName)} · Delegado: ${esc(delegateName)}</span>
        </footer>

      </div>
      ` : ''}

      <!-- ================= HOJA FINAL: REPARTO DE MINUTOS Y ACTA ================= -->
      <div class="cb-print-sheet cbx-pmp-sheet cb-print-page cbx-pmp-page-2">
        
        <!-- Cabecera Compacta Hoja Final -->
        <header class="cbx-pmp-header cbx-pmp-header-compact">
          <div class="cbx-pmp-head-left">
            <div class="cbx-pmp-crest-box">
              <img src="${esc(crestUrl)}" class="cbx-pmp-crest-img" alt="Escudo" onerror="this.style.display='none'">
            </div>
            <div class="cbx-pmp-head-meta">
              <span class="cbx-pmp-kicker">${esc(teamName)} · ${esc(format)}</span>
              <h2 class="cbx-pmp-title" style="font-size: 16px; margin: 0;">REPARTO DE MINUTOS Y ACTA DE CAMPO</h2>
              <div class="cbx-pmp-match-banner">
                <span class="cbx-pmp-rival">vs <strong>${esc(opponentName)}</strong> (${esc(venueText)})</span>
                <span class="cbx-pmp-dot">·</span>
                <span>${esc(formattedDate)}</span>
              </div>
            </div>
          </div>
          <div class="cbx-pmp-head-right">
            <span class="cbx-pmp-badge-accent">PÁGINA ${totalPages} DE ${totalPages}</span>
          </div>
        </header>

        <!-- Bloque 3: Tabla de Reparto de Minutos Formativos -->
        <section class="cbx-pmp-section">
          <div class="cbx-pmp-sec-head">
            <div class="cbx-pmp-sec-title">
              <span class="cbx-pmp-badge-accent">REPARTO</span>
              <h3>MINUTOS PREVISTOS POR JUGADOR</h3>
            </div>
            <span class="cbx-pmp-sec-desc">${availableIds.length} convocados · Rango: ${minMins}′ a ${maxMins}′ min</span>
          </div>

          <div class="cbx-pmp-table-container">
            <table class="cbx-pmp-table">
              <thead>
                <tr>
                  <th style="width:36px">#</th>
                  <th>Jugador</th>
                  <th>Posición habitual</th>
                  <th>Rol 0′</th>
                  <th>Minutos previstos</th>
                  <th style="width:110px">% Partido</th>
                  <th>Tramos en el césped</th>
                </tr>
              </thead>
              <tbody>
                ${minutesRowsHtml}
              </tbody>
            </table>
          </div>
        </section>

        <!-- Bloque 4: Pautas de Banquillo y Acta para Bolígrafo -->
        <section class="cbx-pmp-section is-footer-section">
          <div class="cbx-pmp-footer-grid">
            <div class="cbx-pmp-rules-col">
              <h4>PAUTAS CLAVE PARA EL CUERPO TÉCNICO</h4>
              <ul class="cbx-pmp-rules-list">
                <li><strong>Regla del portero:</strong> Un tiempo cada uno si hay 2 porteros (relevo en descanso a los ${halfDuration}′).</li>
                <li><strong>Imprevistos (golpe o lesión):</strong> Reemplazo hombre por hombre en la misma posición.</li>
                <li><strong>Auto-pausa:</strong> A los 38:00 y 74:00 el reloj se detiene automáticamente.</li>
              </ul>
            </div>
            <div class="cbx-pmp-pen-col">
              <h4>ACTA DE CAMPO (Anotaciones a mano)</h4>
              <div class="cbx-pmp-pen-boxes">
                <div class="cbx-pmp-result-row">
                  <span>RESULTADO:</span>
                  <span class="cbx-pmp-box-slot"></span> - <span class="cbx-pmp-box-slot"></span>
                </div>
                <div class="cbx-pmp-pen-line"><span>Goles / Asist.:</span> <div class="cbx-pmp-dots"></div></div>
                <div class="cbx-pmp-pen-line"><span>Incidencias:</span> <div class="cbx-pmp-dots"></div></div>
                <div class="cbx-pmp-pen-line"><span>Notas Migue:</span> <div class="cbx-pmp-dots"></div></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Pie de página Hoja 2 -->
        <footer class="cbx-pmp-footer">
          <span>CampoBase · Hoja Oficial de Banquillo y Plan de Partido (Página ${totalPages} de ${totalPages})</span>
          <span>Impreso el ${esc(nowPrintDate)} · Entrenador: ${esc(coachName)} · Delegado: ${esc(delegateName)}</span>
        </footer>

      </div>

    </div>
  `;
}

/**
 * Dispara la visualización y el diálogo de impresión nativa / PDF.
 */
export function printMatchPlan(matchOrId, state, options = {}) {
  const html = buildMatchPlanHtml(matchOrId, state, options);
  if (!html) return;
  executePrint(html);
}
