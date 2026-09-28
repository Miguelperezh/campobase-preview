// ==========================================================================
// SUITE DE COMUNICACIONES WHATSAPP — CAMPOBASE
// Generadores de mensajes para partidos, entrenos y planificación semanal.
// Funciones puras y desacopladas para pruebas unitarias e integración en UI.
// ==========================================================================

export function cleanPlayerNumber(num) {
  if (num === null || num === undefined) return '';
  return String(num).replace(/[#\s]/g, '').trim();
}

/**
 * Normaliza y añade prefijo internacional a teléfonos de España (9 dígitos que empiezan por 6 o 7).
 */
export function formatWhatsAppPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) {
    return `34${digits}`;
  }
  return digits;
}

/**
 * Fórmulas verbales en 1.ª persona del singular ("yo como único entrenador").
 * Permite adaptar el tratamiento (Canarias: Les/Te, Peninsular: Os/Te, Formal: Les/Le).
 */
export function getToneVerbs({ tone = 'canary', parentType = 'both', recipientType = 'parent' } = {}) {
  const isPlural = recipientType === 'group' || parentType === 'both';

  if (isPlural) {
    if (tone === 'peninsular_plural') {
      return {
        comparto: 'Os compartimos',
        comunico: 'Os comunicamos',
        recuerdo: 'Os recordamos',
      };
    }
    if (tone === 'canary_plural') {
      return {
        comparto: 'Les compartimos',
        comunico: 'Les comunicamos',
        recuerdo: 'Les recordamos',
      };
    }
    if (tone === 'peninsular') {
      return {
        comparto: 'Os comparto',
        comunico: 'Os comunico',
        recuerdo: 'Os recuerdo',
      };
    }
    // 'canary' y 'formal' usan 'Les'
    return {
      comparto: 'Les comparto',
      comunico: 'Les comunico',
      recuerdo: 'Les recuerdo',
    };
  }

  // Destinatario singular (padre o madre)
  if (tone === 'formal') {
    return {
      comparto: 'Le comparto',
      comunico: 'Le comunico',
      recuerdo: 'Le recuerdo',
    };
  }
  if (tone === 'peninsular_plural' || tone === 'canary_plural') {
    return {
      comparto: 'Te compartimos',
      comunico: 'Te comunicamos',
      recuerdo: 'Te recordamos',
    };
  }
  return {
    comparto: 'Te comparto',
    comunico: 'Te comunico',
    recuerdo: 'Te recuerdo',
  };
}

/**
 * Formatea el motivo de no convocatoria (rotación, lesión, tarjetas, no haber venido a entrenar, etc.).
 */
export function formatExclusionReasonText(reason = '', note = '') {
  const r = String(reason || '').trim().toLowerCase();
  const n = String(note || '').trim();

  if (!r || r === 'none') return '';
  if (r === 'rotation') return 'por *rotación*';
  if (r === 'injured') return n ? `por *lesión* (${n})` : 'por *lesión*';
  if (r === 'cards' || r === 'suspended') return n ? `por *sanción de tarjetas* (${n})` : 'por *sanción de tarjetas*';
  if (r === 'training' || r === 'missed_training') return 'por *no haber venido a entrenar*';
  if (r === 'sick') return n ? `por *enfermedad* (${n})` : 'por *encontrarse indispuesto/a*';
  if (r === 'coach_decision' || r === 'technical') return n ? `por *decisión técnica* (${n})` : 'por *decisión técnica*';
  if (r === 'discipline') return n ? `por *motivos disciplinarios* (${n})` : 'por *motivos disciplinarios*';
  if (r === 'personal') return n ? `por *motivos personales* (${n})` : 'por *motivos personales*';
  if (r === 'custom' || r === 'other') return n ? (n.toLowerCase().startsWith('por ') ? `*${n}*` : `por *${n}*`) : '';
  return r.startsWith('por ') ? `*${r}*` : `por *${r}*`;
}

export function getExclusionEncouragement(reason = '') {
  const r = String(reason || '').trim().toLowerCase();
  if (r === 'injured' || r === 'sick') {
    return '¡Mucho ánimo y pronta recuperación para volver a tope con el equipo!';
  }
  if (r === 'training' || r === 'missed_training') {
    return '¡Mucho ánimo y a tope en las próximas sesiones de entrenamiento!';
  }
  return '¡Mucho ánimo y a seguir trabajando duro en los entrenamientos!';
}

export function getGreetingByHour(dateOrHour = new Date()) {
  let hour = 12;
  if (typeof dateOrHour === 'number') {
    hour = dateOrHour;
  } else if (dateOrHour instanceof Date) {
    hour = dateOrHour.getHours();
  }
  if (hour >= 6 && hour < 14) return 'Buenos días';
  if (hour >= 14 && hour < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

export function getAutoMapsUrl(fieldName, locality = 'Las Palmas') {
  const query = `${(fieldName || '').trim()} ${locality}`.trim();
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
}

export function formatLongDate(dateStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = String(dateStr).slice(0, 10).split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${dayNames[d.getDay()]}, ${day} de ${monthNames[month - 1]} de ${year}`;
  } catch {
    return dateStr;
  }
}

export function buildWhatsAppMatchConvocatoria({
  teamName = 'C.F. Unión Viera Alevín D',
  match = {},
  callup = null,
  players = [],
  kit = '1.ª Oficial (Roja y Negra)',
  competition = '',
  callTime = '08:15',
  gameTime = '09:00',
  fieldName = 'Campo Alfonso Silva (La Ballena)',
  mapsUrl = '',
  includeBibs = false,
  bibsConfig = 'Verdes y Amarillos',
  customNote = '',
  targetPlayerId = null,
  recipientType = 'group', // 'group' | 'parent'
  parentType = 'both', // 'both' | 'father' | 'mother'
  callupStatus = 'auto', // 'auto' | 'called' | 'excluded'
  exclusionReason = '',
  exclusionNote = '',
  tone = 'canary', // 'canary' | 'peninsular' | 'formal'
  now = new Date(),
} = {}) {
  const greeting = getGreetingByHour(now);
  const opponent = match.opponent || 'Rival';
  const rawDate = match.date || callup?.date || '';
  const dateFormatted = formatLongDate(rawDate) || 'Próximo partido';
  const resolvedMapsUrl = mapsUrl || getAutoMapsUrl(fieldName);
  const verbs = getToneVerbs({ tone, parentType, recipientType });
  const matchType = match?.type || callup?.matchType || 'league';
  const isLeague = matchType === 'league';
  const competitionLabel = competition || ({
    league: 'Liga',
    friendly: 'Amistoso',
    tournament: 'Torneo',
  }[matchType] || 'Liga');
  const nonLeagueDescriptor = matchType === 'friendly' ? 'partido amistoso' : 'torneo';

  // Solo Liga usa convocatorias. En amistosos y torneos va toda la plantilla.
  const effectiveCallup = isLeague ? callup : null;
  const availableSet = new Set(effectiveCallup?.availableIds || []);
  const excludedSet = new Set(effectiveCallup?.excludedIds || []);
  const exclusionMap = new Map();
  if (effectiveCallup?.exclusions && Array.isArray(effectiveCallup.exclusions)) {
    effectiveCallup.exclusions.forEach(e => {
      const pid = typeof e === 'object' && e ? (e.playerId || e.id) : e;
      if (pid) {
        excludedSet.add(pid);
        if (typeof e === 'object' && e) exclusionMap.set(pid, e);
      }
    });
  }
  
  // Si no hay callup específico, todos los jugadores recibidos se asumen convocados
  const calledPlayers = effectiveCallup
    ? players.filter(p => availableSet.has(p.id))
    : players;

  // CASO 1: Mensaje individual a progenitores
  if (recipientType === 'parent' && targetPlayerId) {
    const targetPlayer = players.find(p => p.id === targetPlayerId);
    if (targetPlayer) {
      // Determinar si está convocado o no. Esta lógica solo existe en Liga:
      // en amistosos y torneos va toda la plantilla.
      let isExcluded = false;
      if (isLeague) {
        if (callupStatus === 'excluded') {
          isExcluded = true;
        } else if (callupStatus === 'called') {
          isExcluded = false;
        } else if (effectiveCallup) {
          if (excludedSet.has(targetPlayer.id)) {
            isExcluded = true;
          } else if (availableSet.has(targetPlayer.id)) {
            isExcluded = false;
          } else if (availableSet.size > 0) {
            // Si hay convocados oficiales y el jugador no está entre ellos, NO está convocado
            isExcluded = true;
          }
        }
      }

      const father = (targetPlayer.fatherName || '').trim();
      const mother = (targetPlayer.motherName || '').trim();
      const playerName = (targetPlayer.name || '').trim().split(/\s+/)[0] || targetPlayer.name;
      const closing = '¡Muchas gracias!';

      let salutation = '';
      if (parentType === 'mother') {
        salutation = mother ? `${greeting} ${mother}:` : `${greeting} a la familia de ${playerName}:`;
      } else if (parentType === 'father') {
        salutation = father ? `${greeting} ${father}:` : `${greeting} a la familia de ${playerName}:`;
      } else {
        // 'both': Padre y Madre
        if (father && mother) {
          salutation = `${greeting} ${father} y ${mother}:`;
        } else if (father) {
          salutation = `${greeting} ${father}:`;
        } else if (mother) {
          salutation = `${greeting} ${mother}:`;
        } else {
          salutation = `${greeting} a la familia de ${playerName}:`;
        }
      }

      // NO es necesario poner el dorsal del jugador a sus propios padres
      const dorsalText = '';

      // SI ESTÁ MARCADO COMO NO CONVOCADO:
      if (isExcluded) {
        const autoEx = exclusionMap.get(targetPlayer.id);
        const resolvedReason = exclusionReason || autoEx?.reason || 'rotation';
        let resolvedNote = '';
        if (typeof exclusionNote === 'string') {
          resolvedNote = exclusionNote.trim();
        } else if (!exclusionReason && autoEx?.note) {
          resolvedNote = autoEx.note.trim();
        }
        const reasonPhrase = formatExclusionReasonText(resolvedReason, resolvedNote);
        const reasonSuffix = reasonPhrase ? ` ${reasonPhrase}` : '';
        const encouragement = getExclusionEncouragement(resolvedReason);

        return `${salutation}

${verbs.comunico} que *${playerName}* *NO está CONVOCADO* para el partido *${competitionLabel} (vs ${opponent})* del *${dateFormatted}*${reasonSuffix}.

${encouragement}

${closing}`.trim();
      }

      // En Liga se comunica convocatoria. En amistosos/torneos se avisa del
      // partido a toda la plantilla, sin lenguaje de convocados/no convocados.
      const intro = isLeague
        ? `${verbs.comparto} la información de la convocatoria para *${playerName}*:`
        : `${verbs.comparto} la información del *${nonLeagueDescriptor}* para *${playerName}*:`;

      return `${salutation}

${intro}

🏆 *Competición:* *${competitionLabel} (vs ${opponent})*
📅 *Fecha:* *${dateFormatted}*
⏰ *Hora de citación:* *${callTime} h*
⏱️ *Inicio de partido:* *${gameTime} h*
🏟️ *Campo:* *${fieldName}*
📍 *Ubicación en Google Maps:* ${resolvedMapsUrl}
👕 *Equipación:* *${kit}*
🛡️ *Obligatorio:* *Botella de agua individual y espinilleras*${includeBibs ? `\n🎽 *Petos:* *${bibsConfig}*` : ''}
${customNote ? `\n⚠️ *Nota:* *${customNote}*` : ''}
• *Rogamos máxima puntualidad* en la hora de citación para realizar un buen calentamiento.
• Ante cualquier contratiempo o molestia física, por favor avisad con antelación.

${closing}`.trim();
    }
  }

  // CASO 2: Mensaje al Grupo General de Familias
  const playerListLines = calledPlayers.length
    ? calledPlayers.map((p, idx) => `${idx + 1}. ${cleanPlayerNumber(p.number)} ${p.name}`.trim()).join('\n')
    : 'Todos los jugadores de la plantilla convocados.';

  let materialBlock = `• 👕 *Equipación:* ${kit}\n• 🛡️ *Obligatorio:* Botella de agua individual y espinilleras`;
  if (includeBibs) {
    materialBlock += `\n• 🎽 *Petos:* Se llevarán petos de juego (${bibsConfig})`;
  }

  if (!isLeague) {
    const header = matchType === 'friendly'
      ? `⚽ *PARTIDO AMISTOSO — ${teamName.toUpperCase()}* ⚽`
      : `🏆 *TORNEO — ${teamName.toUpperCase()}* 🏆`;
    return `${header}

${greeting} a todos/as,

${verbs.comparto} la información del próximo ${nonLeagueDescriptor}:

🏆 *Competición:* ${competitionLabel} (vs ${opponent})
📅 *Fecha:* ${dateFormatted}
⏰ *Hora de citación:* ${callTime} h
⏱️ *Inicio de partido:* ${gameTime} h
🏟️ *Campo:* ${fieldName}
📍 *Ubicación en Google Maps:* ${resolvedMapsUrl}

🎒 *Material y equipación:*
${materialBlock}
${customNote ? `\n⚠️ *Nota importante:* ${customNote}` : ''}
• Rogamos puntualidad en la hora de citación para realizar un buen calentamiento.
• Ante cualquier contratiempo o molestia física, por favor avisad con antelación.

¡Muchas gracias a todos/as!`.trim();
  }

  return `⚽ *CONVOCATORIA — ${teamName.toUpperCase()}* ⚽

${greeting} a todos/as,

${verbs.comparto} la convocatoria para el próximo encuentro:

🏆 *Competición:* ${competitionLabel} (vs ${opponent})
📅 *Fecha:* ${dateFormatted}
⏰ *Hora de citación:* ${callTime} h
⏱️ *Inicio de partido:* ${gameTime} h
🏟️ *Campo:* ${fieldName}
📍 *Ubicación en Google Maps:* ${resolvedMapsUrl}

📋 *JUGADORES CONVOCADOS (${calledPlayers.length}):*
${playerListLines}

🎒 *Material y equipación:*
${materialBlock}
${customNote ? `\n⚠️ *Nota importante:* ${customNote}` : ''}
• Rogamos puntualidad en la hora de citación para realizar un buen calentamiento.
• Ante cualquier contratiempo o molestia física, por favor avisad con antelación.

¡Muchas gracias a todos/as!`.trim();
}

export function buildWhatsAppTrainingDay({
  teamName = 'C.F. Unión Viera Alevín D',
  session = {},
  fieldName = 'Campo Alfonso Silva (La Ballena)',
  mapsUrl = '',
  kitTraining = 'Equipación oficial de entrenamiento (camiseta técnica y pantalón corto)',
  targetPlayer = null,
  parentType = 'father',
  customNote = '',
  tone = 'canary',
  now = new Date(),
} = {}) {
  const greeting = getGreetingByHour(now);
  const rawDate = session.date || '';
  const dateFormatted = formatLongDate(rawDate) || 'Hoy';
  const timeStr = session.time || '16:30';
  const duration = session.duration || 60;
  const resolvedMapsUrl = mapsUrl || getAutoMapsUrl(fieldName);
  const recipientType = targetPlayer ? 'parent' : 'group';
  const verbs = getToneVerbs({ tone, parentType, recipientType });

  const playerName = targetPlayer ? ((targetPlayer.name || '').trim().split(/\s+/)[0] || targetPlayer.name) : '';
  const durationMin = Number(session.duration) >= 45 ? Number(session.duration) : 75;
  const closing = targetPlayer ? '¡Muchas gracias!' : '¡Muchas gracias a todos/as!';

  let salutation = `${greeting} a todos/as,`;
  if (targetPlayer) {
    const father = (targetPlayer.fatherName || '').trim();
    const mother = (targetPlayer.motherName || '').trim();
    if (parentType === 'mother') {
      salutation = mother ? `${greeting} ${mother}:` : `${greeting} a la familia de ${playerName}:`;
    } else if (parentType === 'father') {
      salutation = father ? `${greeting} ${father}:` : `${greeting} a la familia de ${playerName}:`;
    } else {
      // 'both'
      if (father && mother) {
        salutation = `${greeting} ${father} y ${mother}:`;
      } else if (father) {
        salutation = `${greeting} ${father}:`;
      } else if (mother) {
        salutation = `${greeting} ${mother}:`;
      } else {
        salutation = `${greeting} a la familia de ${playerName}:`;
      }
    }
  }

  return `⚽ *SESIÓN DE ENTRENAMIENTO — ${teamName.toUpperCase()}* ⚽

${salutation}

${verbs.recuerdo} los detalles de la sesión de entrenamiento:

📅 *Fecha:* *${dateFormatted}*
⏰ *Hora:* *${timeStr} h* *(duración: ${durationMin} min)*
🏟️ *Campo:* *${fieldName}*
📍 *Ubicación:* ${resolvedMapsUrl}

🎒 *Material necesario:*
• 👕 *Equipación:* *${kitTraining}*
• 💧 *Botella de agua individual* con su nombre
• ⚽ *Balón de fútbol T4* con la presión adecuada
${customNote ? `\n⚠️ *Nota:* *${customNote}*` : ''}
• *Rogamos puntualidad* para comenzar la sesión a la hora prevista.

${closing}`.trim();
}

export function buildWhatsAppTrainingWeek({
  teamName = 'C.F. Unión Viera Alevín D',
  sessions = [],
  matches = [],
  match = null,
  tacticalGoal = '',
  includeTacticalGoal = true,
  weekRangeLabel = 'esta semana',
  tone = 'canary',
  now = new Date(),
} = {}) {
  const greeting = getGreetingByHour(now);
  const verbs = getToneVerbs({ tone, recipientType: 'group' });
  let goalBlock = '';
  if (includeTacticalGoal && tacticalGoal) {
    goalBlock = `🎯 *Objetivo formativo de la semana:*\n"${tacticalGoal.trim()}"\n\n`;
  }

  // Ordenar de más próximos a más lejanos (arriba los más próximos)
  const sortedSessions = [...sessions].sort((a, b) => {
    const cmp = String(a.date || '').localeCompare(String(b.date || ''));
    if (cmp !== 0) return cmp;
    return String(a.time || '').localeCompare(String(b.time || ''));
  });

  let scheduleLines = '';
  if (sortedSessions.length) {
    scheduleLines = sortedSessions.map(s => {
      const d = formatLongDate(s.date) || s.date;
      const f = s.field || s.venue || 'Campo habitual';
      const t = s.time || '16:30';
      const rawDur = Number(s.duration) || 0;
      let durStr = '';
      if (rawDur >= 65) {
        durStr = ' *(75 min)*';
      } else if (rawDur >= 45) {
        durStr = ' *(60 min)*';
      } else if (rawDur > 0) {
        // En fútbol base infantil/alevin los entrenamientos son de 60 o 75 min (nunca 15 min de un ejercicio individual)
        durStr = ' *(75 min)*';
      }
      return `• *${d}:* *${t} h* · ${f}${durStr}`;
    }).join('\n');
  } else {
    scheduleLines = '• *Lunes y Martes 16:30 h* · Alfonso Silva *(75 min)*\n• *Jueves 16:30 h* · Campo del Pilar *(75 min)*';
  }

  // Partidos (soporta 1, 2 o más partidos en la misma semana)
  const allMatches = [];
  if (Array.isArray(matches) && matches.length) {
    allMatches.push(...matches);
  } else if (match) {
    allMatches.push(match);
  }

  const sortedMatches = allMatches.filter(Boolean).sort((a, b) => {
    const cmp = String(a.date || '').localeCompare(String(b.date || ''));
    if (cmp !== 0) return cmp;
    return String(a.time || '').localeCompare(String(b.time || ''));
  });

  let matchLines = '';
  if (sortedMatches.length) {
    matchLines = '\n' + sortedMatches.map((m) => {
      const rawDate = m.date || '';
      let dayUpper = 'DOMINGO';
      if (rawDate) {
        try {
          const d = new Date(rawDate.slice(0, 10) + 'T12:00:00');
          const dayNames = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
          dayUpper = dayNames[d.getDay()] || 'DOMINGO';
        } catch {}
      }
      const mt = m.time || '09:00';
      const mf = m.field || (m.venue === 'away' ? 'Campo rival' : 'Alfonso Silva');
      return `• *${dayUpper}:* *${mt} h* · *PARTIDO* vs *${m.opponent || 'Rival'}* (${mf})`;
    }).join('\n');
  }

  return `📅 *PLANIFICACIÓN SEMANAL (${weekRangeLabel.toUpperCase()}) — ${teamName.toUpperCase()}* ⚽

${greeting} a todos/as,

${verbs.comparto} la planificación de entrenamientos para organizar la semana:

${goalBlock}${scheduleLines}${matchLines}

🎒 *Recordatorio para todos los entrenamientos:*
Llevar camiseta oficial de entreno, botella de agua individual y balón reglamentario T4.

¡Muchas gracias a todos/as!`.trim();
}

/**
 * Calcula el rango de fechas (lunes a domingo) de la semana correspondiente a una fecha.
 */
export function getWeekDateRange(dateOrStr = new Date()) {
  const d = new Date(typeof dateOrStr === 'string' && !dateOrStr.includes('T') ? `${dateOrStr}T12:00:00` : dateOrStr);
  const day = d.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMonday);
  mon.setHours(0, 0, 0, 0);

  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);

  const toKey = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  return { start: toKey(mon), end: toKey(sun) };
}

/**
 * Calcula el rango de fechas (lunes a domingo) de la semana siguiente a una fecha dada.
 */
export function getNextWeekDateRange(dateOrStr = new Date()) {
  const cur = getWeekDateRange(dateOrStr);
  const mon = new Date(`${cur.start}T12:00:00`);
  mon.setDate(mon.getDate() + 7);
  return getWeekDateRange(mon);
}

/**
 * Determina si una fecha corresponde a fin de semana (sábado = 6 o domingo = 0).
 */
export function isWeekend(dateOrStr = new Date()) {
  const d = new Date(typeof dateOrStr === 'string' && !dateOrStr.includes('T') ? `${dateOrStr}T12:00:00` : dateOrStr);
  const day = d.getDay();
  return day === 0 || day === 6;
}

const MONTH_NAMES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/**
 * Formatea un rango YYYY-MM-DD en texto legible en español.
 * Ej: '2026-09-21', '2026-09-27' -> 'del 21 al 27 de septiembre'
 */
export function formatWeekSpanLabel(startKey, endKey) {
  if (!startKey || !endKey) return 'esta semana';
  const [, m1, d1] = String(startKey).slice(0, 10).split('-').map(Number);
  const [, m2, d2] = String(endKey).slice(0, 10).split('-').map(Number);
  if (!m1 || !d1 || !m2 || !d2) return 'esta semana';
  if (m1 === m2) {
    return `del ${d1} al ${d2} de ${MONTH_NAMES_ES[m1 - 1] || 'este mes'}`;
  }
  return `del ${d1} de ${MONTH_NAMES_ES[m1 - 1] || ''} al ${d2} de ${MONTH_NAMES_ES[m2 - 1] || ''}`;
}

