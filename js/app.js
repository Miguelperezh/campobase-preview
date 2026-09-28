import { configureCloudStore, configureDemoDatabase, configureRealDatabase, deleteDemoDatabase, getAll, getOne, put, putBatch, putPlayerProfile, remove, exportDatabase, importDatabase, isDemoDatabase, syncFromCloud, getSyncDiagnostics, getLocalPinSettingsCandidates, recoverLegacyPendingMutations, uploadVideo, removeVideo } from './db.js';
import { createCampoBaseCloudStore, getRemoteMainSettings, getSupabaseAuthClient } from './supabase-client.js';
import { getBoundSaasUserId, getRememberedSaasAccount, signInWithCampoBasePin } from './auth-manager.js';
import { calculateMinuteTargets, buildCallupSelection, buildAttendanceRecord, calculateAttendanceStats, applySubstitution, normalizePositions, calculatePlayedSeconds, validateBackup, formatMatchClock, buildPlayerHistory, sortAttendanceRecords, suggestDelegateSubstitution, suggestRepartoSubstitutions, summarizeMinuteTargets, shouldSuggestUrgentSubstitution, accumulateSeasonMinutes, seasonKey, isPreseasonMatch, shouldAutoPause, hashPin, verifyPin, buildPlayerRatings, replacePlayerRatings, sortPlayersByName, sortPlayersBySquadNumber, updateRotationCounters, calledPlayerOptions, adjustLiveScore, addPlayerMatchEvent, removePlayerMatchEvent, buildPlayerSummary, applyPlayerStatAdjustments, setPlayerStatTotals, removeMatchFromPlayerStats, derivePlayerMatchStats, buildPlayerRecord, calculatePlayerCallupMinutes, getPlayerSetPieceRoles, buildSquadLeaderboards } from './domain.js';
import { CANONICAL_V2_CATEGORIES, CANONICAL_MATERIALS, PLAYER_COUNT_OPTIONS, FORMAT_OPTIONS, FORMATO_JUEGO_OPTIONS, EXERCISE_CATEGORIES, INITIAL_EXERCISES, WARMUP_TEMPLATES, PHASE2_V3_EXERCISES, buildExercise, filterExercises, planPhase2V2Seed, planPhase2V3Seed, renderExerciseDiagram, buildTrainingSession, sortTrainingSessions } from './training-domain.js';
import { REAL_EXERCISES, SLIDESHARE_EXERCISES, renderRealDiagram } from './real-exercises.js';
import { addExerciseToSession, buildFlexibleTrainingSession, calculateSessionTotalMaterial, completeExercise, formatSessionDurationInfo, moveSessionBlock, removeSessionBlock, renderBoardDiagrams, sessionBlockType, sessionDurationStatus } from './exercise-planning.js';
import { EJERCICIOS_VALIDADOS, toCampoBaseExercise, findValidatedExercise } from './ejercicios-validados.js';
import { renderValidatedExerciseHTML, renderExerciseGridCard, initValidatedExerciseViewer, attachLightbox } from './ejercicio-viewer.js?v=20260924-v54-delegate-permissions-speed-fix';
import { buildVideoRecord, initVideoSection, videoPath } from './ejercicio-videos.js';
import { TACTIC_FORMATS, FORMATION_NAMES, FORMATION_GUIDES, TACTIC_TOOLS, buildTactic, createTacticMove, defaultTactic, moveTacticPiece, renderTacticBoard, renderTacticToolIcon, renderTacticArrow, renderTacticArrowDefs, sortTactics } from './tactics.js';
import { LIVE_FORMATIONS, TACTICA_MP4, nombreCorto, playerById, buildLiveState, buildReadyTimerFromPreparation, asignarJugador, cargarFormacion, applyLineupToLiveTeam, opcionesPosicion, suplentes, canAssignPlayerToSlot } from './live-tactics.js';
import { TACTICAS_INTERACTIVAS, findTacticaInteractiva } from './tacticas-interactivas.js';
import { renderTacticaInteractivaHTML, initTacticaViewer, attachTacticaLightbox } from './tactica-viewer.js';
import { renderTacticaGuiaHTML, initTacticaGuia } from './tactica-guia-viewer.js';
import { printSingleExercise, printTrainingSession } from './print-session-export.js?v=20260924-v54-delegate-permissions-speed-fix';

import { DEMO_DURATION_MS, createDemoSession, isDemoSessionActive, roleCanUseOwnerFeatures } from './demo-session.js';
import { refreshPlantillaStaff, refreshStaffView } from './staff-management.js';
import { renderTodayDashboard } from './today-dashboard.js?v=2457';
import { compressAndCropImage, wirePhotoCropperField, optimizeCrestImage } from './image-crop-utils.js';
import { partitionAndSortMatches } from './match-calendar-sync.js';
import {
  cleanPlayerNumber,
  formatWhatsAppPhone,
  getGreetingByHour,
  getAutoMapsUrl,
  formatLongDate,
  buildWhatsAppMatchConvocatoria,
  buildWhatsAppTrainingDay,
  buildWhatsAppTrainingWeek,
  getWeekDateRange,
  getNextWeekDateRange,
  isWeekend,
  formatWeekSpanLabel,
} from './whatsapp-suite.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const uid = () => crypto.randomUUID();
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const safePhoto = (value) => /^data:image\/(png|jpeg|webp|gif);base64,/i.test(value ?? '') ? value : '';
const localDate = (value) => {
  if (!value) return 'Sin fecha';
  const raw = String(value).trim();
  if (!raw) return 'Sin fecha';

  const hasTime = raw.includes('T');
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  const parsed = new Date(hasTime ? raw : `${raw}T12:00:00`);

  if (!Number.isFinite(parsed.getTime())) return 'Fecha inválida';

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    if (
      parsed.getFullYear() !== year
      || parsed.getMonth() + 1 !== month
      || parsed.getDate() !== day
    ) return 'Fecha inválida';
  }

  try {
    return new Intl.DateTimeFormat('es-ES', hasTime
      ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parsed);
  } catch {
    return 'Fecha inválida';
  }
};
const localDateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const empty = (text) => `<div class="panel empty">${escapeHtml(text)}</div>`;
const FORMATS = { F7: { players: 7, duration: 70, half: 35 }, F11: { players: 11, duration: 90, half: 45 }, f7: { players: 7, duration: 70, half: 35 }, f11: { players: 11, duration: 90, half: 45 } };
const MATCH_TYPES = { league: 'Liga', friendly: 'Amistoso', tournament: 'Torneo' };
const EXCLUSION_REASONS = { sick: 'Enfermo', injured: 'Lesionado', suspended: 'Sancionado', missed_training: 'No fue a entrenar', discipline: 'Disciplina (notas/padres)', coach_decision: 'Decisión del entrenador', other: 'Otro motivo', rotation: 'Rotación equitativa' };
const MINUTE_REASONS = { discipline: 'Disciplina', absence: 'Falta', illness: 'Enfermedad', goalkeeper_rotation: 'Rotación de porteros', sin_indicar: 'Sin indicar' };

const state = { players: [], callups: [], matches: [], trainings: [], exercises: [], trainingSessions: [], tactics: [], videos: [], preparaciones: [], settings: {}, format: 'F7', timer: null, liveUpdatedAt: 0, tick: null, role: null, demoSession: null, delegateMode: false, urgentAlertKey: '', repartoAlertKey: '', finishing: false, ratingMatchId: null, cloudConnected: false, cloudError: '' };
const SESSION_ROLE_KEY = 'campobase.sessionRole';
const ACTIVE_VIEW_KEY = 'campobase.activeView';
const DEMO_SESSION_KEY = 'campobase.demoSession';
const USER_EXERCISE_PREFIX = 'pdf98-user-';
let toastTimer;
let sessionDraftBlocks = [];
let sessionDraftMeta = null;
let pendingExerciseId = '';
let exerciseLibraryMode = 'all';
let tacticTool = 'select';
let tacticDraft = null;
let liveTactic = null; // estado de la pizarra táctica en vivo (Fase A)
let liveTacticsDocBound = false; // evita acumular el listener global de cierre de popup
let prepDraft = null; // borrador de la pizarra de preparación de partido
let prepMatchId = null; // partido que se está preparando
let playerCropper = null;
let realtimeCloudStore = null;
let realtimeSubscriptionStarting = false;
let realtimeSubscriptionActive = false;
let realtimeSyncTimer = null;
let deferredRenderTimer = null;
let deferredRenderRequested = false;
let lastCloudSyncTimestamp = 0;
let readyLineupPersistChain = Promise.resolve();

function selectOptions(max, step = 1, selected = '', includeEmpty = false) {
  const options = includeEmpty ? '<option value="">—</option>' : '';
  return options + Array.from({ length: Math.ceil(max / step) }, (_, index) => String(index * step).padStart(2, '0'))
    .map((value) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${value}</option>`).join('');
}

function splitTime24(value = '') {
  const match = /^(?:\d{4}-\d{2}-\d{2}T)?([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return { hour: match?.[1] ?? '', minute: match?.[2] ?? '' };
}

function time24Markup(name, value = '', label = 'Hora') {
  const { hour, minute } = splitTime24(value);
  return `<div class="time-24"><select name="${name}Hour" aria-label="${escapeHtml(label)}, hora de 00 a 23">${selectOptions(24, 1, hour, true)}</select><span aria-hidden="true">:</span><select name="${name}Minute" aria-label="${escapeHtml(label)}, minuto">${selectOptions(60, 1, minute, true)}</select></div>`;
}

function composeTime24(hour, minute, required = false) {
  if (!hour && !minute && !required) return '';
  const value = `${hour}:${minute}`;
  if (!/^([01]\d|2[0-3]):(?:[0-5]\d)$/.test(value)) throw new TypeError('Selecciona una hora válida en formato 24 h.');
  return value;
}

function composeDateTime24(day, hour, minute) {
  const { year, month, day: dayNum } = splitDate(day);
  const validDay = composeDate(dayNum, month, year);
  return `${validDay}T${composeTime24(hour, minute, true)}`;
}

function setDateTimeFields(form, name, value = '') {
  const [day = '', time = ''] = String(value || '').split('T');
  const { hour, minute } = splitTime24(time);
  const { year, month, day: dayNum } = splitDate(day);
  form.elements[`${name}Month`].value = month;
  form.elements[`${name}Year`].value = year;
  refreshDateDayOptions(form, name, dayNum);
  form.elements[`${name}Hour`].value = hour || '00';
  form.elements[`${name}Minute`].value = minute || '00';
}

// Fecha en formato España DD/MM/AAAA con selectores propios (independiente del locale del navegador).
function splitDate(value = '') {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  return { year: match?.[1] ?? '', month: match?.[2] ?? '', day: match?.[3] ?? '' };
}

function daysInMonth(month = '', year = '') {
  if (!/^\d{2}$/.test(month) || !/^\d{4}$/.test(year)) return 31;
  const monthNumber = Number(month);
  const yearNumber = Number(year);
  if (monthNumber < 1 || monthNumber > 12) return 31;
  return new Date(yearNumber, monthNumber, 0).getDate();
}

function isRealCalendarDate(day = '', month = '', year = '') {
  if (!/^\d{2}$/.test(day) || !/^\d{2}$/.test(month) || !/^\d{4}$/.test(year)) return false;
  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);
  return monthNumber >= 1
    && monthNumber <= 12
    && dayNumber >= 1
    && dayNumber <= daysInMonth(month, year)
    && new Date(yearNumber, monthNumber - 1, dayNumber).getFullYear() === yearNumber;
}

function dayOptions(selected = '', month = '', year = '') {
  const maxDays = daysInMonth(month, year);
  const safeSelected = Number(selected) >= 1 && Number(selected) <= maxDays ? selected : '';
  return '<option value="">Día</option>' + Array.from({ length: maxDays }, (_, i) => String(i + 1).padStart(2, '0')).map((v) => `<option value="${v}" ${v === safeSelected ? 'selected' : ''}>${v}</option>`).join('');
}
function monthOptions(selected = '') {
  return '<option value="">Mes</option>' + Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((v) => `<option value="${v}" ${v === selected ? 'selected' : ''}>${v}</option>`).join('');
}
function yearOptions(selected = '') {
  const current = new Date().getFullYear();
  return '<option value="">Año</option>' + Array.from({ length: 6 }, (_, i) => String(current - 1 + i)).map((v) => `<option value="${v}" ${v === selected ? 'selected' : ''}>${v}</option>`).join('');
}

function dateMarkup(name, value = '', label = 'Fecha') {
  const { year, month, day } = splitDate(value);
  return `<div class="date-24"><select name="${name}Day" required aria-label="${escapeHtml(label)}, día">${dayOptions(day, month, year)}</select><span>/</span><select name="${name}Month" required aria-label="${escapeHtml(label)}, mes">${monthOptions(month)}</select><span>/</span><select name="${name}Year" required aria-label="${escapeHtml(label)}, año">${yearOptions(year)}</select></div>`;
}

function refreshDateDayOptions(form, name = 'date', preferredDay = '') {
  const daySelect = form?.elements?.[`${name}Day`];
  const monthSelect = form?.elements?.[`${name}Month`];
  const yearSelect = form?.elements?.[`${name}Year`];
  if (!daySelect || !monthSelect || !yearSelect) return;
  const currentDay = preferredDay || daySelect.value;
  daySelect.innerHTML = dayOptions(currentDay, monthSelect.value, yearSelect.value);
}

function composeDate(day, month, year) {
  if (!isRealCalendarDate(day ?? '', month ?? '', year ?? '')) {
    throw new TypeError('Selecciona una fecha real del calendario.');
  }
  return `${year}-${month}-${day}`;
}

function askConfirmation({ title = 'Confirmar acción', message, acceptLabel = 'Confirmar', danger = false }) {
  const dialog = $('#confirmation-dialog');
  if (dialog.open) return Promise.resolve(false);
  $('#confirmation-title').textContent = title;
  $('#confirmation-message').textContent = message;
  const accept = $('#confirmation-accept');
  const cancel = $('#confirmation-cancel');
  accept.textContent = acceptLabel;
  accept.className = danger ? 'danger' : 'primary';
  return new Promise((resolve) => {
    const finish = (result) => {
      accept.removeEventListener('click', onAccept);
      cancel.removeEventListener('click', onCancel);
      dialog.removeEventListener('cancel', onCancel);
      dialog.close();
      resolve(result);
    };
    const onAccept = () => finish(true);
    const onCancel = (event) => { event?.preventDefault(); finish(false); };
    accept.addEventListener('click', onAccept);
    cancel.addEventListener('click', onCancel);
    dialog.addEventListener('cancel', onCancel);
    dialog.showModal();
  });
}

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2600);
}

function formObject(form) { return Object.fromEntries(new FormData(form)); }
function checkedValues(name, root = document) { return $$(`input[name="${name}"]:checked`, root).map((input) => input.value); }
function playerName(id) {
  if (id === '__pp__' || id === 'pp' || id === '__own_goal__') return 'Gol P.P.';
  return state.players.find((player) => player.id === id)?.name ?? 'Jugador eliminado';
}
function matchTypeLabel(type) { return MATCH_TYPES[type] ?? MATCH_TYPES.league; }
function myTeamName() { return state.settings.teamName?.trim() || 'Mi equipo'; }
function matchTeams(match) {
  const away = match?.venue === 'away';
  return { home: away ? match.opponent : myTeamName(), away: away ? myTeamName() : match.opponent, mySide: away ? 'away' : 'home' };
}
function playerPositions(player) { return normalizePositions(player).join(', ') || 'Sin posición'; }
function keeperIdsFromCallup(callup) {
  const ids = callup?.availableIds ?? [];
  return ids.filter((id) => normalizePositions(state.players.find((player) => player.id === id)).includes('Portero'));
}
function playerCardPhoto(player) { return safePhoto(player.photo) ? `<img class="avatar" src="${safePhoto(player.photo)}" alt="Foto de ${escapeHtml(player.name)}">` : `<div class="avatar" aria-hidden="true">${escapeHtml(player.name.slice(0, 2).toUpperCase())}</div>`; }
function storedActiveView() {
  try { return String(sessionStorage.getItem(ACTIVE_VIEW_KEY) || ''); }
  catch { return ''; }
}

function getDelegatePermissions() {
  const perms = state.settings?.delegatePermissions;
  if (Array.isArray(perms) && perms.length) return perms;
  try {
    const cached = JSON.parse(localStorage.getItem('campobase.delegatePermissions') || 'null');
    if (Array.isArray(cached) && cached.length) return cached;
  } catch {}
  return ['partido'];
}

function delegateHasPermission(permission) {
  if (state.role !== 'delegate') return true;
  const perms = getDelegatePermissions();
  if (permission === 'partido' || permission === 'delegado') {
    return perms.includes('partido') || perms.includes('delegado');
  }
  return perms.includes(permission);
}

function buildDelegateInviteMessage() {
  const teamName = myTeamName() || 'nuestro equipo';
  const pin = state.settings?.delegatePin || '0000';
  const teamId = getBoundSaasUserId() || getRememberedSaasAccount()?.id || '';
  const perms = getDelegatePermissions();
  const permLabelsMap = {
    'partido': 'Partido en vivo (control de cambios y minutos)',
    'plantilla': 'Plantilla de jugadores',
    'modo-campo': 'Modo Campo',
    'convocatorias': 'Convocatorias',
    'asistencia': 'Asistencia a entrenamientos',
    'calendario': 'Calendario y resultados',
    'cuerpo-tecnico': 'Cuerpo técnico',
    'preparacion': 'Preparación y alineación previa',
    'sesiones': 'Sesiones de entrenamiento',
    'ejercicios': 'Biblioteca de ejercicios tácticos',
    'tacticas': 'Pizarra táctica',
    'hoy': 'Inicio / Resumen del día',
  };
  const permLabels = [];
  perms.forEach((p) => {
    if (permLabelsMap[p]) permLabels.push(permLabelsMap[p]);
  });
  if (!permLabels.length && perms.includes('partido')) {
    permLabels.push('Partido en vivo (control de cambios y minutos)');
  }
  const permText = permLabels.map((l) => `• ${l}`).join('\n');
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://campobase.app';
  const teamParam = teamId ? `&team=${encodeURIComponent(teamId)}` : '';
  const permsParam = `&perms=${encodeURIComponent(perms.join(','))}`;
  const directUrl = `${baseUrl}?role=delegate&pin=${encodeURIComponent(pin)}${teamParam}${permsParam}`;

  return {
    teamName,
    teamId,
    pin,
    directUrl,
    text: `¡Hola! Te comparto tu acceso como Delegado de ${teamName} en CampoBase.\n\n🔑 Tu PIN de acceso: ${pin}\n📱 Acceso directo a tu equipo: ${directUrl}\n\n⚽ Pestañas y funciones activadas:\n${permText}\n\n¡Nos vemos en el campo!`,
  };
}

function syncDelegateModeDom() {
  const perms = getDelegatePermissions();
  const onlyPartido = perms.length === 1 && (perms[0] === 'partido' || perms[0] === 'delegado');
  if (onlyPartido) {
    document.body.classList.add('delegate-single-view');
    document.body.classList.remove('delegate-multi-view');
  } else {
    document.body.classList.remove('delegate-single-view');
    document.body.classList.add('delegate-multi-view');
  }
  if (perms.includes('modo-campo')) {
    document.body.classList.add('delegate-allow-modo-campo');
  } else {
    document.body.classList.remove('delegate-allow-modo-campo');
  }
  applyDelegateNavFilters(perms);
}

function applyDelegateNavFilters(perms) {
  $('#cb-nav-tab-convocatorias')?.remove();
  $('#cb-nav-tab-modo-campo')?.remove();
  if (state.role !== 'delegate' && !state.delegateMode) {
    return;
  }
  const onlyPartido = perms.length === 1 && (perms[0] === 'partido' || perms[0] === 'delegado');
  $$('.bottom-nav button').forEach((btn) => {
    const view = btn.dataset.view;
    const allowed = !onlyPartido && (
      (view === 'partido' && perms.includes('partido'))
      || (view === 'plantilla' && perms.includes('plantilla'))
      || (view === 'convocatorias' && perms.includes('convocatorias'))
      || perms.includes(view)
    );
    btn.classList.toggle('delegate-tab-hidden', !allowed);
    btn.classList.toggle('delegate-allowed-tab', allowed);
  });
  $$('#cb-bottom-nav .cb-nav-tab').forEach((tab) => {
    const mod = tab.dataset.module;
    let allowed = false;
    if (!onlyPartido) {
      if (mod === 'partidos') {
        allowed = perms.includes('partido') || perms.includes('delegado') || perms.includes('convocatorias') || perms.includes('preparacion') || perms.includes('calendario');
      } else if (mod === 'equipo') {
        allowed = perms.includes('plantilla') || perms.includes('cuerpo-tecnico') || perms.includes('asistencia');
      } else if (mod === 'inicio') {
        allowed = perms.includes('hoy') || perms.includes('inicio');
      } else if (mod === 'entrenos') {
        allowed = perms.includes('sesiones') || perms.includes('ejercicios') || perms.includes('tacticas');
      } else if (mod === 'mas' || mod === 'tacticas') {
        allowed = perms.includes('tacticas');
      }
    }
    tab.classList.toggle('delegate-tab-hidden', !allowed);
    tab.classList.toggle('delegate-allowed-tab', allowed);
    if (mod === 'partidos') {
      const lbl = tab.querySelector('.cb-nav-label-wrap span:first-child');
      if (lbl) lbl.textContent = (perms.includes('partido') || perms.includes('delegado')) && !perms.includes('convocatorias') && !perms.includes('calendario') ? 'Partido' : 'Partidos';
    }
    if (mod === 'equipo') {
      const lbl = tab.querySelector('.cb-nav-label-wrap span:first-child');
      if (lbl) lbl.textContent = perms.includes('plantilla') && !perms.includes('asistencia') && !perms.includes('cuerpo-tecnico') ? 'Plantilla' : 'Equipo';
    }
  });
}

function restoreNormalNavUi() {
  $$('.bottom-nav button').forEach((btn) => {
    btn.classList.remove('delegate-tab-hidden', 'delegate-allowed-tab');
  });
  $$('#cb-bottom-nav .cb-nav-tab').forEach((tab) => {
    tab.classList.remove('delegate-tab-hidden', 'delegate-allowed-tab');
    const mod = tab.dataset.module;
    if (mod === 'partidos') {
      const lbl = tab.querySelector('.cb-nav-label-wrap span:first-child');
      if (lbl) lbl.textContent = 'Partido';
    }
    if (mod === 'equipo') {
      const lbl = tab.querySelector('.cb-nav-label-wrap span:first-child');
      if (lbl) lbl.textContent = 'Equipo';
    }
  });
  const convTab = $('#cb-nav-tab-convocatorias');
  if (convTab) convTab.remove();
  const fieldTab = $('#cb-nav-tab-modo-campo');
  if (fieldTab) fieldTab.remove();
}

function showView(viewId) {
  if (state.role === 'demo' && viewId === 'ajustes') return;
  if (state.role === 'delegate' || state.delegateMode) {
    const perms = getDelegatePermissions();
    const onlyPartido = perms.length === 1 && (perms[0] === 'partido' || perms[0] === 'delegado');
    if (onlyPartido && viewId !== 'delegado' && viewId !== 'partido') return;
    if (!delegateHasPermission(viewId) && viewId !== 'delegado' && viewId !== 'partido') return;
    if (viewId === 'partido') viewId = 'delegado';
  }
  if (Array.isArray(window.__campobaseAllowedViews)) {
    const allowed = window.__campobaseAllowedViews.includes(viewId)
      || (viewId === 'delegado' && window.__campobaseAllowedViews.includes('partido'))
      || (viewId === 'partido' && window.__campobaseAllowedViews.includes('delegado'));
    if (!allowed) return;
  }
  const target = document.getElementById(viewId);
  if (!target?.classList.contains('view')) return;
  // Cerrar modales abiertos al cambiar de vista para evitar estados huérfanos o bloqueos
  try {
    const openModals = document.querySelectorAll('dialog[open]:not(#auth-dialog)');
    openModals.forEach((d) => d.close());
  } catch {}
  $$('.view').forEach((view) => view.classList.toggle('active', view.id === viewId));
  $$('.bottom-nav button').forEach((item) => item.classList.toggle('active', item.dataset.view === viewId));
  try { sessionStorage.setItem(ACTIVE_VIEW_KEY, viewId); } catch { /* La vista seguirá funcionando sin persistencia. */ }
  $('#app').focus();
  applyGlobalSearch();
  if (viewId === 'plantilla') {
    renderPlayers();
    refreshPlantillaStaff().catch(() => {});
  } else if (viewId === 'cuerpo-tecnico') {
    refreshStaffView().catch(() => {});
  } else if (viewId === 'partido') {
    if (state.role === 'delegate' || state.delegateMode) {
      renderDelegate();
    } else {
      renderLive();
    }
  } else if (viewId === 'calendario' || viewId === 'partidos') {
    renderMatches();
  } else if (viewId === 'preparacion') {
    renderPreparaciones();
  } else if (viewId === 'hoy') {
    renderTodayDashboard().catch(() => {});
  } else if (viewId === 'asistencia') {
    renderTrainings();
  } else if (viewId === 'sesiones') {
    renderTrainingSessions();
  } else if (viewId === 'convocatorias') {
    renderCallups();
  } else if (viewId === 'ejercicios') {
    renderExercises();
  } else if (viewId === 'tacticas') {
    renderTactics();
  } else if (viewId === 'delegado') {
    renderDelegate();
  } else if (viewId === 'ajustes') {
    populateDelegateAccountForm();
    populateKitSettingsForm();
  }
}

// Buscador global: filtra los elementos de la vista activa por nombre o palabra.
function applyGlobalSearch() {
  const input = $('#global-search');
  const query = (input?.value ?? '').trim().toLocaleLowerCase('es');
  const view = document.querySelector('.view.active');
  if (!view) return;
  const containers = view.querySelectorAll('.stack, .card-grid, .exercise-grid, .attendance-grid, .selection-grid');
  containers.forEach((container) => {
    [...container.children].forEach((child) => {
      const text = (child.textContent || '').toLocaleLowerCase('es');
      const idText = (child.dataset?.exerciseId || child.getAttribute?.('data-exercise-id') || '').toLocaleLowerCase('es');
      const matches = !query || text.includes(query) || idText.includes(query);
      child.style.display = matches ? '' : 'none';
    });
  });
}

function isUserInteracting() {
  if (document.querySelector('dialog[open]:not(#auth-dialog)')) return true;
  const active = document.activeElement;
  if (active && !active.closest('#auth-dialog') && active.matches('select, input, textarea')) return true;
  if (document.querySelector('input[name="sub-out"]:checked, input[name="sub-in"]:checked, input[name="delegate-out"]:checked, input[name="delegate-in"]:checked')) return true;
  // Si hay un reproductor de ejercicio en marcha, no re-renderizar (se reiniciaría).
  if ((window.__viewersPlaying || 0) > 0) return true;
  // Si la pizarra táctica en vivo está ampliada (lightbox abierto), no re-renderizar
  // (se cerraría sola y perdería el estado de la pizarra ampliada).
  if (document.querySelector('.live-tactics-lightbox.open')) return true;
  // Si el desplegable de asignación de la pizarra está abierto, no re-renderizar
  // (se cerraría solo y el usuario perdería la selección).
  if (document.querySelector('.live-tactics-popup.open')) return true;
  return false;
}

function scheduleDeferredRender() {
  deferredRenderRequested = true;
  if (deferredRenderTimer) return;

  const tryRender = () => {
    deferredRenderTimer = null;
    if (!deferredRenderRequested) return;
    if (isUserInteracting()) {
      deferredRenderTimer = window.setTimeout(tryRender, 250);
      return;
    }
    deferredRenderRequested = false;
    renderAll();
  };

  deferredRenderTimer = window.setTimeout(tryRender, 250);
}

function renderOrDefer(force = false) {
  if (force || !isUserInteracting()) {
    deferredRenderRequested = false;
    if (deferredRenderTimer) {
      window.clearTimeout(deferredRenderTimer);
      deferredRenderTimer = null;
    }
    renderAll();
    return;
  }
  scheduleDeferredRender();
}


async function deduplicatePlayers() {
  // Protección de datos: refresh nunca deduplica, borra ni reescribe jugadores.
  // Cualquier posible duplicado se resuelve manualmente desde la interfaz.
  return false;
}

async function refresh() {
  const force = arguments[0] === true;
  [state.players, state.callups, state.matches, state.trainings] = await Promise.all(['players', 'callups', 'matches', 'trainings'].map(getAll));
  await deduplicatePlayers();

  // Los dorsales se muestran normalizados con cleanPlayerNumber(), pero nunca
  // se reescriben automáticamente durante refresh. Solo Editar jugador cambia
  // la ficha personal persistida.

  state.players = sortPlayersByName(state.players);
  const settingRecords = await getAll('settings');

  // Catálogo oficial + ejercicios creados por el entrenador.
  // Los favoritos de ejercicios validados también se guardan como recordType=exercise,
  // así que solo es "Mis ejercicios" un registro cuyo ID no pertenece al catálogo validado.
  const validatedIds = new Set(EJERCICIOS_VALIDADOS.map(({ id }) => String(id)));
  const persistedExerciseRecords = settingRecords.filter(({ recordType }) => recordType === 'exercise');
  const persistedById = new Map(persistedExerciseRecords.map((item) => [String(item.id), item]));

  const validatedExercises = EJERCICIOS_VALIDADOS.map(toCampoBaseExercise).map((item) => {
    const persisted = persistedById.get(String(item.id));
    return persisted ? { ...item, favorite: Boolean(persisted.favorite) } : item;
  });

  const myExercises = persistedExerciseRecords
    .filter((item) => !validatedIds.has(String(item.id)))
    .map((item) => ({
      ...item,
      recordType: 'exercise',
      userCreated: true,
      source: 'personal',
      example: false,
      category: item.category || 'Técnico-táctico',
      formato_juego: item.formato_juego || (item.format === 'F7' ? 'futbol_7' : 'futbol_11'),
    }));

  state.exercises = [...validatedExercises, ...myExercises];
  if (state.exercises.length < 400 && typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine) {
    const healKey = 'campobase.auto_catalog_heal_v29';
    try {
      if (!sessionStorage.getItem(healKey)) {
        sessionStorage.setItem(healKey, '1');
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
        window.location.reload();
        return;
      }
    } catch {}
  }
  state.trainingSessions = settingRecords
    .filter(({ recordType }) => recordType === 'trainingSession')
    .map((session) => {
      let target = Number(session.targetDuration);
      if (!target || target <= 0) {
        target = (session.pitch && session.pitch.toLowerCase().includes('pilar')) ? 75 : 60;
      }
      return { ...session, targetDuration: target };
    });
  state.tactics = settingRecords.filter(({ recordType }) => recordType === 'tactic');
  state.videos = settingRecords.filter(({ recordType }) => recordType === 'exerciseVideo');
  state.preparaciones = settingRecords.filter(({ recordType }) => recordType === 'preparacion');
  const settings = settingRecords.find(({ id }) => id === 'main');
  state.settings = settings ?? { id: 'main' };
  if (!state.settings.delegatePermissions || !state.settings.delegatePermissions.length) {
    try {
      const cached = JSON.parse(localStorage.getItem('campobase.delegatePermissions') || 'null');
      if (Array.isArray(cached) && cached.length) {
        state.settings.delegatePermissions = cached;
      }
    } catch {}
  } else {
    try { localStorage.setItem('campobase.delegatePermissions', JSON.stringify(state.settings.delegatePermissions)); } catch {}
  }
  state.format = settings?.format ?? 'F7';
  $('#format').value = state.format;
  $('#team-settings-form').elements.teamName.value = state.settings.teamName ?? '';
  $('#demo-team-form').elements.teamName.value = state.settings.teamName ?? '';
  $('#demo-team-form').elements.format.value = state.format;
  populateDelegateAccountForm();
  applyTeamIdentity();
  applyCustomTheme();
  if (state.role === 'delegate' || state.delegateMode) {
    syncDelegateModeDom();
  } else {
    restoreNormalNavUi();
  }
  renderOrDefer(force);
}

function syncDirectFieldCache() {
  try {
    if (typeof localStorage === 'undefined') return;
    const directCache = {
      players: state.players || [],
      callups: state.callups || [],
      matches: state.matches || [],
      attendance: state.trainings || [],
      settings: [
        ...(state.trainingSessions || []).map((s) => ({ ...s, recordType: 'trainingSession' })),
        ...(state.exercises || []).map((e) => ({ ...e, recordType: 'exercise' })),
        { id: 'main', teamName: state.settings?.teamName || '', format: state.format, ...(state.settings || {}) },
        ...(state.timer ? [{ id: 'live', timer: state.timer }] : [])
      ],
      sessions: state.trainingSessions || [],
      timer: state.timer || null,
      team: { id: 'main', teamName: state.settings?.teamName || '', format: state.format, ...(state.settings || {}) },
      at: Date.now(),
    };
    localStorage.setItem('campobase.directFieldCache', JSON.stringify(directCache));
  } catch {}
}

function renderAll() {
  const config = FORMATS[state.format];
  $('#active-format').textContent = `${state.format} · ${config.players} en campo · ${config.duration} min`;
  renderPlayers(); renderCallups(); renderLive(); renderDelegate(); renderMatches(); renderTrainings(); renderExercises(); renderTrainingSessions(); renderTactics(); renderPreparaciones();
  refreshPlantillaStaff().catch(() => {});
  refreshStaffView().catch(() => {});
  renderTodayDashboard().catch(() => {});
  applyGlobalSearch();
  syncDirectFieldCache();
  try { window.dispatchEvent(new CustomEvent('campobase:data-updated')); } catch {}
}

function renderPlayers() {
  const currentMatchIds = new Set(state.matches.map((match) => match.id));
  const currentCallups = state.callups.filter((callup) => !callup.matchId || currentMatchIds.has(callup.matchId));
  const currentTrainings = state.trainings.filter((record) => !record.matchId || currentMatchIds.has(record.matchId));
  const playerSummaryTotals = new Map(state.players.map((player) => {
    const leagueAutomatic = buildPlayerSummary(player.id, state.matches, currentTrainings, currentCallups, 'league');
    const preseasonAutomatic = buildPlayerSummary(player.id, state.matches, currentTrainings, currentCallups, 'preseason');
    return [player.id, {
      summary: applyPlayerStatAdjustments(leagueAutomatic, player.statAdjustments?.league),
      preseasonSummary: applyPlayerStatAdjustments(preseasonAutomatic, player.statAdjustments?.preseason),
    }];
  }));
  const totalMinutes = state.players.reduce((sum, player) => {
    const totals = playerSummaryTotals.get(player.id);
    return sum + totals.summary.minutes;
  }, 0);
  const totalRotations = state.players.reduce((sum, player) => {
    const totals = playerSummaryTotals.get(player.id);
    return sum + totals.summary.rotations + totals.preseasonSummary.rotations;
  }, 0);
  $('#squad-stats').innerHTML = `<div class="stat"><strong>${state.players.length}</strong><span>jugadores</span></div><div class="stat"><strong>${totalMinutes}</strong><span>minutos acumulados</span></div><div class="stat"><strong>${totalRotations}</strong><span>ausencias por rotación</span></div>`;
  const sorted = sortPlayersBySquadNumber(state.players);
  const openPerfPlayerIds = new Set(
    Array.from(document.querySelectorAll('#players-list .player[data-player-id] details.player-performance[open]'))
      .map((el) => el.closest('.player')?.dataset.playerId)
      .filter(Boolean)
  );
  const openSubSectionKeys = new Set(
    Array.from(document.querySelectorAll('#players-list .player[data-player-id] details.player-performance[open] details[open] > summary'))
      .map((s) => `${s.closest('.player')?.dataset.playerId}::${s.textContent.trim().split(' ')[0]}`)
      .filter(Boolean)
  );
  $('#players-list').innerHTML = sorted.length ? sorted.map((player, index) => {
    const labels = { present: 'Presente', late: 'Tarde', absent: 'Ausente', sick: 'Enfermedad', coach_decision: 'Decisión del entrenador', missed_training: 'No fue a entrenar', discipline: 'Disciplina', rotation: 'Rotación' };
    const history = buildPlayerHistory(player.id, currentTrainings, currentCallups, state.matches);
    const { summary, preseasonSummary } = playerSummaryTotals.get(player.id);
    const derivedMatchStats = derivePlayerMatchStats(player.id, state.matches);
    const seasonRows = Object.entries(derivedMatchStats.seasonMinutes).sort(([a], [b]) => b.localeCompare(a)).map(([season, minutes]) => `<li><strong>${escapeHtml(season)}</strong> · ${minutes} min</li>`).join('');
    const minuteReasonRows = derivedMatchStats.minuteReasons.map((item) => `<li><strong>${escapeHtml(localDate(item.date))}</strong> · ${escapeHtml(MINUTE_REASONS[item.reason] ?? item.reason)}</li>`).join('');
    const ratingRows = derivedMatchStats.ratingHistory.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).map((item) => `<li><strong>${escapeHtml(localDate(item.date))}</strong> · ${escapeHtml(item.opponent || 'Partido')} · ${item.rating}/5</li>`).join('');
    const seasonRatingRows = Object.entries(derivedMatchStats.ratingHistory.reduce((acc, item) => { const s = seasonKey(item.date); (acc[s] ??= []).push(item.rating); return acc; }, {})).sort(([a], [b]) => b.localeCompare(a)).map(([season, ratings]) => `<li><strong>${escapeHtml(season)}</strong> · media ${(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)}/5 (${ratings.length} partidos)</li>`).join('');
    const historyRows = history.map((item) => {
      const typeLabel = item.type === 'callup' ? 'Convocatoria' : item.kind === 'match' ? 'Partido' : 'Entrenamiento';
      const detail = item.type === 'callup' ? (labels[item.detail] ?? item.detail) : item.detail;
      return `<li class="history-row"><span class="history-date">${escapeHtml(localDate(item.date))}</span><span class="history-type">${typeLabel}</span><span class="history-detail">${escapeHtml(detail)}</span></li>`;
    }).join('');
    const incidentRows = playerIncidentRows(player.id).map((item) => `<li><strong>${escapeHtml(localDate(item.date))}</strong> · ${escapeHtml(item.label)}${item.note ? `: ${escapeHtml(item.note)}` : ''} <button type="button" class="icon-button remove-player-incident" data-key="${escapeHtml(item.key)}" aria-label="Borrar incidencia">×</button></li>`).join('');
    const playerTotalMinutes = summary.minutes + preseasonSummary.minutes;
    const playerTotalCallups = (summary.callups ?? 0) + (preseasonSummary.callups ?? 0);
    const defaultDuration = FORMATS[state.format]?.duration || 70;
    const callupMinutesInfo = calculatePlayerCallupMinutes({
      playerId: player.id,
      matches: state.matches,
      callups: currentCallups,
      defaultDuration,
      totalCallups: playerTotalCallups,
      playedMinutes: playerTotalMinutes,
    });
    const minutePercent = callupMinutesInfo.percent;
    const possibleMinutes = callupMinutesInfo.possibleMinutes;
    const avgMinPerCallup = callupMinutesInfo.averageMinutesPerCallup;
    const totalCallupsCount = callupMinutesInfo.totalCallups;
    const minuteBarTitle = possibleMinutes > 0
      ? `${playerTotalMinutes} min disputados de ${possibleMinutes} min posibles en sus convocatorias (${minutePercent}%). Media: ${avgMinPerCallup} min/partido (${totalCallupsCount} conv.)`
      : `${playerTotalMinutes} min disputados (sin convocatorias registradas)`;

    const specialistRoles = getPlayerSetPieceRoles(player.id, state.settings?.setPieces);
    const specialistTags = specialistRoles.length ? `
      <div class="player-specialist-tags">
        ${specialistRoles.map((r) => `<span class="specialist-pill" title="${escapeHtml(r.title)}">${r.icon} ${escapeHtml(r.label)}</span>`).join('')}
      </div>` : '';

    const ratingNum = summary.averageRating ? Number(summary.averageRating) : null;
    const ratingTier = ratingNum >= 4.0 ? 'rating-tier-top' : (ratingNum >= 3.0 ? 'rating-tier-good' : (ratingNum > 0 ? 'rating-tier-fair' : 'rating-tier-none'));
    const ratingDisplay = ratingNum !== null ? ratingNum.toFixed(1) : (summary.averageRating ?? '—');

    return `<article class="card player" data-player-id="${player.id}">
    <div class="player-head">
      <div class="player-identity">
        ${playerCardPhoto(player)}
        <div class="player-name">
          <h3>${escapeHtml(player.name)}</h3>
          <span class="player-subhead-pill">Dorsal ${escapeHtml(cleanPlayerNumber(player.number) || '—')}</span>
        </div>
      </div>
      <div class="player-head-right">
        <div class="liga-media player-rating-badge ${ratingTier}" title="Puntuación media de liga: ${ratingDisplay}">
          <span class="rating-star">★</span>
          <span class="valor">${ratingDisplay}</span>
          <span class="etiqueta">MEDIA LIGA</span>
        </div>
      </div>
    </div>
    <div class="player-body">
      <div class="player-minute-bar" title="${escapeHtml(minuteBarTitle)}">
        <div class="player-minute-meta"><span>Minutos disputados</span><span><strong>${playerTotalMinutes} de ${possibleMinutes} min</strong> (${minutePercent}%)${totalCallupsCount > 0 ? ` · <span class="minute-avg-pill">${totalCallupsCount} ${totalCallupsCount === 1 ? 'partido conv.' : 'partidos conv.'}</span>` : ''}</span></div>
        <div class="player-minute-track"><div class="player-minute-fill" style="width:${minutePercent}%"></div></div>
      </div>
      ${specialistTags}
      <div class="player-data"><span><small>Dorsal</small><strong>${escapeHtml(cleanPlayerNumber(player.number) || 'Sin asignar')}</strong></span><span><small>Posición</small><strong>${escapeHtml(playerPositions(player))}</strong></span><span><small>Pierna</small><strong>${escapeHtml(player.foot || 'Sin indicar')}</strong></span><span><small>Rotaciones</small><strong>${summary.rotations + preseasonSummary.rotations} fuera</strong></span></div>
      ${(player.fatherPhone || player.motherPhone || player.fatherName || player.motherName) ? `
      <div class="player-family-contacts">
        ${player.fatherPhone ? `<a href="https://wa.me/${formatWhatsAppPhone(player.fatherPhone)}" target="_blank" rel="noopener noreferrer" class="contact-pill" title="WhatsApp Padre">👨 ${escapeHtml(player.fatherName || 'Padre')}: ${escapeHtml(player.fatherPhone)}</a>` : (player.fatherName ? `<span class="contact-pill meta">👨 Padre: ${escapeHtml(player.fatherName)}</span>` : '')}
        ${player.motherPhone ? `<a href="https://wa.me/${formatWhatsAppPhone(player.motherPhone)}" target="_blank" rel="noopener noreferrer" class="contact-pill" title="WhatsApp Madre">👩 ${escapeHtml(player.motherName || 'Madre')}: ${escapeHtml(player.motherPhone)}</a>` : (player.motherName ? `<span class="contact-pill meta">👩 Madre: ${escapeHtml(player.motherName)}</span>` : '')}
      </div>` : ''}
      <div class="player-card-actions-bar">
        <button type="button" class="icon-button open-whatsapp-player accent" data-id="${player.id}" aria-label="WhatsApp a familia de ${escapeHtml(player.name)}">📱 WhatsApp</button>
        <button type="button" class="icon-button edit-player" data-id="${player.id}" aria-label="Editar ${escapeHtml(player.name)}">✏️ Editar</button>
        <button type="button" class="icon-button delete-player danger" data-id="${player.id}" aria-label="Eliminar ${escapeHtml(player.name)}">🗑️ Borrar</button>
      </div>
      <details class="player-performance"${openPerfPlayerIds.has(player.id) ? ' open' : ''}><summary class="player-performance-summary"><span class="summary-toggle-icon">📊</span><span>Ver actividad y estadísticas</span></summary><div class="player-stats-expanded"><div class="player-summary"><span><strong>${summary.goals}</strong> goles</span><span><strong>${summary.assists ?? 0}</strong> asist.</span><span><strong>${summary.yellowCards}/${summary.redCards}</strong> amarillas/rojas</span><span><strong>${summary.injuries}</strong> lesiones</span><span><strong>${summary.incidents}</strong> incidencias</span><span><strong>${summary.callups}</strong> convocatorias</span><span><strong>${summary.rotations}</strong> rotaciones</span><span><strong>${summary.late}/${summary.absent}</strong> tarde/ausente</span><span><strong>${summary.minutes}</strong> min</span><span><strong>${summary.averageRating ?? '—'}</strong> media</span></div><button type="button" class="edit-player-stats secondary" data-player-id="${player.id}" data-scope="league">Editar estadísticas de Liga</button><h4 class="player-stats-title">Pretemporada</h4><div class="player-summary"><span><strong>${preseasonSummary.goals}</strong> goles</span><span><strong>${preseasonSummary.assists ?? 0}</strong> asist.</span><span><strong>${preseasonSummary.yellowCards}/${preseasonSummary.redCards}</strong> amarillas/rojas</span><span><strong>${preseasonSummary.injuries}</strong> lesiones</span><span><strong>${preseasonSummary.incidents}</strong> incidencias</span><span><strong>${preseasonSummary.callups}</strong> convocatorias</span><span><strong>${preseasonSummary.rotations}</strong> rotaciones</span><span><strong>${preseasonSummary.late}/${preseasonSummary.absent}</strong> tarde/ausente</span><span><strong>${preseasonSummary.minutes}</strong> min</span><span><strong>${preseasonSummary.averageRating ?? '—'}</strong> media</span></div><button type="button" class="edit-player-stats secondary" data-player-id="${player.id}" data-scope="preseason">Editar estadísticas de Pretemporada</button><p class="meta"><span class="rank">${index + 1}. ${summary.minutes + preseasonSummary.minutes} min acumulados</span>${player.notes ? ` · ${escapeHtml(player.notes)}` : ''}</p>${seasonRows ? `<details${openSubSectionKeys.has(`${player.id}::Minutos`) ? ' open' : ''}><summary>Minutos por temporada</summary><ul class="plain-list">${seasonRows}</ul></details>` : ''}${ratingRows ? `<details${openSubSectionKeys.has(`${player.id}::Puntuaciones`) ? ' open' : ''}><summary>Puntuaciones (${derivedMatchStats.ratingHistory.length})</summary><ul class="plain-list">${ratingRows}</ul></details>` : ''}${seasonRatingRows ? `<details${openSubSectionKeys.has(`${player.id}::Media`) ? ' open' : ''}><summary>Media por temporada</summary><ul class="plain-list">${seasonRatingRows}</ul></details>` : ''}${minuteReasonRows ? `<details${openSubSectionKeys.has(`${player.id}::Motivos`) ? ' open' : ''}><summary>Motivos de menos minutos</summary><ul class="plain-list">${minuteReasonRows}</ul></details>` : ''}${incidentRows ? `<details${openSubSectionKeys.has(`${player.id}::Incidencias`) ? ' open' : ''}><summary>Incidencias y motivos (${playerIncidentRows(player.id).length})</summary><ul class="plain-list">${incidentRows}</ul></details>` : ''}${history.length ? `<details class="player-history"${openSubSectionKeys.has(`${player.id}::Historial`) ? ' open' : ''}><summary>Historial completo (${history.length})</summary><ul class="plain-list">${historyRows}</ul></details>` : '<p class="meta">Sin actividad registrada.</p>'}<button type="button" class="collapse-stats-btn secondary">▲ Replegar estadísticas</button></div></details></div>
    </article>`;
  }).join('') : empty('Añade el primer jugador para empezar.');
  renderSquadSpecialistsBar();
  renderSquadLeaderboards();
}

function renderSquadSpecialistsBar() {
  const container = $('#plantilla-specialists-bar');
  if (!container) return;
  const setPieces = state.settings?.setPieces || {};

  const getPlayerLabel = (id) => {
    if (!id) return null;
    const p = state.players.find((item) => item.id === id);
    if (!p) return null;
    const num = cleanPlayerNumber(p.number) ? `${cleanPlayerNumber(p.number)} · ` : '';
    return num + p.name;
  };

  const penaltyNames = [getPlayerLabel(setPieces.penalties?.primary), getPlayerLabel(setPieces.penalties?.secondary)].filter(Boolean).join(', ');
  const fkLeftNames = [getPlayerLabel(setPieces.freeKicksLeft?.primary), getPlayerLabel(setPieces.freeKicksLeft?.secondary)].filter(Boolean).join(', ');
  const fkRightNames = [getPlayerLabel(setPieces.freeKicksRight?.primary), getPlayerLabel(setPieces.freeKicksRight?.secondary)].filter(Boolean).join(', ');
  const cornerLeftNames = [getPlayerLabel(setPieces.cornersLeft?.primary), getPlayerLabel(setPieces.cornersLeft?.secondary)].filter(Boolean).join(', ');
  const cornerRightNames = [getPlayerLabel(setPieces.cornersRight?.primary), getPlayerLabel(setPieces.cornersRight?.secondary)].filter(Boolean).join(', ');
  const captainNames = [getPlayerLabel(setPieces.captains?.primary), getPlayerLabel(setPieces.captains?.secondary), getPlayerLabel(setPieces.captains?.third)].filter(Boolean).join(', ');

  container.innerHTML = `
    <div class="specialists-summary-card">
      <div class="specialists-summary-head">
        <div>
          <h3>🎯 Lanzadores y Capitanes</h3>
          <p class="meta">Especialistas a balón parado asignados para faltas, córners, penaltis y capitanía</p>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
          <button type="button" class="secondary open-set-pieces-trigger">⚙️ Configurar lanzadores</button>
          <button type="button" class="secondary share-database-mobile-btn" style="display:none;" title="Pasar lanzadores y plantilla a tu móvil por WhatsApp o AirDrop">📲 Pasar al móvil</button>
        </div>
      </div>
      <div class="specialists-quick-grid">
        <div class="specialist-item"><span class="sp-icon">🎯</span><div><small>Penaltis</small><strong>${escapeHtml(penaltyNames || 'Sin asignar')}</strong></div></div>
        <div class="specialist-item"><span class="sp-icon">⚡</span><div><small>Faltas Izq. (diestro)</small><strong>${escapeHtml(fkLeftNames || 'Sin asignar')}</strong></div></div>
        <div class="specialist-item"><span class="sp-icon">⚡</span><div><small>Faltas Der. (zurdo)</small><strong>${escapeHtml(fkRightNames || 'Sin asignar')}</strong></div></div>
        <div class="specialist-item"><span class="sp-icon">📐</span><div><small>Córners Izquierda</small><strong>${escapeHtml(cornerLeftNames || 'Sin asignar')}</strong></div></div>
        <div class="specialist-item"><span class="sp-icon">📐</span><div><small>Córners Derecha</small><strong>${escapeHtml(cornerRightNames || 'Sin asignar')}</strong></div></div>
        <div class="specialist-item"><span class="sp-icon">©️</span><div><small>Capitanes</small><strong>${escapeHtml(captainNames || 'Sin asignar')}</strong></div></div>
      </div>
    </div>
  `;
}

function populateSetPiecesForm() {
  const form = $('#set-pieces-form');
  if (!form) return;
  const setPieces = state.settings?.setPieces || {};
  const sortedPlayers = sortPlayersBySquadNumber(state.players);

  const makeOptions = (selectedId) => {
    let html = '<option value="">Sin asignar</option>';
    for (const p of sortedPlayers) {
      const num = cleanPlayerNumber(p.number) ? `${cleanPlayerNumber(p.number)} · ` : '';
      const foot = p.foot ? ` (${p.foot})` : '';
      const pos = playerPositions(p) ? ` · ${playerPositions(p)}` : '';
      const selected = p.id === selectedId ? ' selected' : '';
      html += `<option value="${p.id}"${selected}>${escapeHtml(num + p.name + foot + pos)}</option>`;
    }
    return html;
  };

  const fields = [
    ['penaltiesPrimary', setPieces.penalties?.primary],
    ['penaltiesSecondary', setPieces.penalties?.secondary],
    ['freeKicksLeftPrimary', setPieces.freeKicksLeft?.primary],
    ['freeKicksLeftSecondary', setPieces.freeKicksLeft?.secondary],
    ['freeKicksRightPrimary', setPieces.freeKicksRight?.primary],
    ['freeKicksRightSecondary', setPieces.freeKicksRight?.secondary],
    ['cornersLeftPrimary', setPieces.cornersLeft?.primary],
    ['cornersLeftSecondary', setPieces.cornersLeft?.secondary],
    ['cornersRightPrimary', setPieces.cornersRight?.primary],
    ['cornersRightSecondary', setPieces.cornersRight?.secondary],
    ['captainsPrimary', setPieces.captains?.primary],
    ['captainsSecondary', setPieces.captains?.secondary],
    ['captainsThird', setPieces.captains?.third],
  ];

  for (const [name, val] of fields) {
    if (form.elements[name]) {
      form.elements[name].innerHTML = makeOptions(val || '');
    }
  }
}

async function saveSetPiecesForm(event) {
  event.preventDefault();
  if (!roleCanUseOwnerFeatures(state.role)) return toast('Solo Migue puede configurar los especialistas.');
  const form = event.currentTarget;
  const val = formObject(form);
  const setPieces = {
    penalties: { primary: val.penaltiesPrimary || '', secondary: val.penaltiesSecondary || '' },
    freeKicksLeft: { primary: val.freeKicksLeftPrimary || '', secondary: val.freeKicksLeftSecondary || '' },
    freeKicksRight: { primary: val.freeKicksRightPrimary || '', secondary: val.freeKicksRightSecondary || '' },
    cornersLeft: { primary: val.cornersLeftPrimary || '', secondary: val.cornersLeftSecondary || '' },
    cornersRight: { primary: val.cornersRightPrimary || '', secondary: val.cornersRightSecondary || '' },
    captains: { primary: val.captainsPrimary || '', secondary: val.captainsSecondary || '', third: val.captainsThird || '' },
  };

  state.settings = { ...state.settings, id: 'main', setPieces };
  await put('settings', state.settings);
  form.closest('dialog')?.close();
  renderPlayers();
  toast('Lanzadores y capitanes guardados.');
}

function renderSquadLeaderboards() {
  const container = $('#squad-leaderboards');
  if (!container) return;
  if (!state.players || state.players.length === 0) {
    container.innerHTML = '';
    return;
  }

  const tab = state.leaderboardTab || 'scorers';
  const scope = state.leaderboardScope || 'all';

  const defaultDuration = FORMATS[state.format]?.duration || 70;
  const currentMatchIds = new Set(state.matches.map((m) => m.id));
  const currentCallups = state.callups.filter((c) => !c.matchId || currentMatchIds.has(c.matchId));
  const currentTrainings = state.trainings.filter((r) => !r.matchId || currentMatchIds.has(r.matchId));

  const leaderboards = buildSquadLeaderboards({
    players: state.players,
    matches: state.matches,
    attendanceRecords: currentTrainings,
    callups: currentCallups,
    scope,
    defaultDuration,
  });

  const scopeLabels = { all: 'Todo el curso', league: 'Liga', preseason: 'Pretemporada' };

  const tabsMarkup = `
    <div class="leaderboard-tabs-bar">
      <div class="leaderboard-nav-tabs">
        <button type="button" class="lb-tab-btn ${tab === 'scorers' ? 'active' : ''}" data-lb-tab="scorers">⚽ Goleadores</button>
        <button type="button" class="lb-tab-btn ${tab === 'assists' ? 'active' : ''}" data-lb-tab="assists">👟 Asistencias</button>
        <button type="button" class="lb-tab-btn ${tab === 'goalkeepers' ? 'active' : ''}" data-lb-tab="goalkeepers">🧤 Zamora (Porteros)</button>
        <button type="button" class="lb-tab-btn ${tab === 'minutes' ? 'active' : ''}" data-lb-tab="minutes">⏱️ Reparto de Minutos</button>
        <button type="button" class="lb-tab-btn ${tab === 'fairplay' ? 'active' : ''}" data-lb-tab="fairplay">🟨 Fair Play</button>
      </div>
      <div class="leaderboard-scope-toggle">
        <button type="button" class="lb-scope-btn ${scope === 'all' ? 'active' : ''}" data-lb-scope="all">Todo</button>
        <button type="button" class="lb-scope-btn ${scope === 'league' ? 'active' : ''}" data-lb-scope="league">Liga</button>
        <button type="button" class="lb-scope-btn ${scope === 'preseason' ? 'active' : ''}" data-lb-scope="preseason">Pretemporada</button>
      </div>
    </div>
  `;

  let tableContent = '';
  const medal = (idx) => idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `${idx + 1}.º`));

  if (tab === 'scorers') {
    const list = leaderboards.topScorers;
    tableContent = `
      <div class="lb-table-wrapper">
        <table class="lb-table">
          <thead>
            <tr>
              <th class="col-rank">Pos.</th>
              <th class="col-player">Jugador</th>
              <th>Posición</th>
              <th class="col-num">Conv.</th>
              <th class="col-num">Min.</th>
              <th class="col-num highlight">Goles</th>
              <th class="col-num">Gol/Partido</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((item, idx) => {
              const perMatch = item.summary.callups > 0 ? (item.summary.goals / item.summary.callups).toFixed(2) : '—';
              const num = cleanPlayerNumber(item.player.number);
              const rankClass = idx === 0 ? 'lb-podium-1' : (idx === 1 ? 'lb-podium-2' : (idx === 2 ? 'lb-podium-3' : ''));
              return `<tr class="${rankClass}">
                <td class="col-rank"><strong>${medal(idx)}</strong></td>
                <td class="col-player">
                  <div class="lb-player-cell">
                    ${item.player.photo ? `<img src="${item.player.photo}" class="avatar-table-mini" alt="">` : '<span class="avatar-table-mini placeholder">👤</span>'}
                    <div><strong>${escapeHtml(item.player.name)}</strong>${num ? ` <span class="lb-dorsal-tag">${escapeHtml(num)}</span>` : ''}</div>
                  </div>
                </td>
                <td class="col-pos">${escapeHtml(playerPositions(item.player))}</td>
                <td class="col-num">${item.summary.callups}</td>
                <td class="col-num">${item.summary.minutes}</td>
                <td class="col-num highlight"><strong>${item.summary.goals}</strong></td>
                <td class="col-num">${perMatch}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (tab === 'assists') {
    const list = leaderboards.topAssists;
    tableContent = `
      <div class="lb-table-wrapper">
        <table class="lb-table">
          <thead>
            <tr>
              <th class="col-rank">Pos.</th>
              <th class="col-player">Jugador</th>
              <th>Posición</th>
              <th class="col-num">Conv.</th>
              <th class="col-num">Min.</th>
              <th class="col-num highlight">Asistencias</th>
              <th class="col-num">Asist./Partido</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((item, idx) => {
              const perMatch = item.summary.callups > 0 ? (item.summary.assists / item.summary.callups).toFixed(2) : '—';
              const num = cleanPlayerNumber(item.player.number);
              const rankClass = idx === 0 ? 'lb-podium-1' : (idx === 1 ? 'lb-podium-2' : (idx === 2 ? 'lb-podium-3' : ''));
              return `<tr class="${rankClass}">
                <td class="col-rank"><strong>${medal(idx)}</strong></td>
                <td class="col-player">
                  <div class="lb-player-cell">
                    ${item.player.photo ? `<img src="${item.player.photo}" class="avatar-table-mini" alt="">` : '<span class="avatar-table-mini placeholder">👤</span>'}
                    <div><strong>${escapeHtml(item.player.name)}</strong>${num ? ` <span class="lb-dorsal-tag">${escapeHtml(num)}</span>` : ''}</div>
                  </div>
                </td>
                <td class="col-pos">${escapeHtml(playerPositions(item.player))}</td>
                <td class="col-num">${item.summary.callups}</td>
                <td class="col-num">${item.summary.minutes}</td>
                <td class="col-num highlight"><strong>${item.summary.assists}</strong></td>
                <td class="col-num">${perMatch}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (tab === 'goalkeepers') {
    const list = leaderboards.goalkeepers;
    tableContent = list.length ? `
      <div class="lb-table-wrapper">
        <table class="lb-table">
          <thead>
            <tr>
              <th class="col-rank">Pos.</th>
              <th class="col-player">Portero</th>
              <th class="col-num">Partidos</th>
              <th class="col-num">Minutos</th>
              <th class="col-num">Goles encajados</th>
              <th class="col-num highlight">Coeficiente</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((item, idx) => {
              const num = cleanPlayerNumber(item.player.number);
              const rankClass = idx === 0 ? 'lb-podium-1' : (idx === 1 ? 'lb-podium-2' : (idx === 2 ? 'lb-podium-3' : ''));
              return `<tr class="${rankClass}">
                <td class="col-rank"><strong>${medal(idx)}</strong></td>
                <td class="col-player">
                  <div class="lb-player-cell">
                    ${item.player.photo ? `<img src="${item.player.photo}" class="avatar-table-mini" alt="">` : '<span class="avatar-table-mini placeholder">🧤</span>'}
                    <div><strong>${escapeHtml(item.player.name)}</strong>${num ? ` <span class="lb-dorsal-tag">${escapeHtml(num)}</span>` : ''}</div>
                  </div>
                </td>
                <td class="col-num">${item.keeperMatches}</td>
                <td class="col-num">${item.summary.minutes}</td>
                <td class="col-num">${item.goalsAgainst}</td>
                <td class="col-num highlight"><strong>${item.coefficient !== null ? item.coefficient : '—'}</strong></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : `<p class="meta" style="padding:1rem;">Sin partidos disputados en portería registrados en este ámbito (${scopeLabels[scope]}).</p>`;
  } else if (tab === 'minutes') {
    const list = leaderboards.minuteDistribution;
    tableContent = `
      <div class="lb-help-box">
        <span class="info-icon">💡</span>
        <span>Ordenado de mayor a menor promedio de minutos por partido convocado en este ámbito (${scopeLabels[scope]}).</span>
      </div>
      <div class="lb-table-wrapper">
        <table class="lb-table">
          <thead>
            <tr>
              <th class="col-rank">Pos.</th>
              <th class="col-player">Jugador</th>
              <th class="col-num">Conv.</th>
              <th class="col-num">Rotación</th>
              <th class="col-num">Min. Jugados</th>
              <th class="col-num">Min. Posibles</th>
              <th class="col-num">% Disp.</th>
              <th class="col-num highlight">Media min/partido</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((item, idx) => {
              const num = cleanPlayerNumber(item.player.number);
              const avg = item.callupInfo.averageMinutesPerCallup;
              const pct = item.callupInfo.percent;
              const badgeClass = avg >= 50 ? 'badge-good' : (avg >= 30 ? 'badge-mid' : 'badge-low');
              const rankClass = idx === 0 ? 'lb-podium-1' : (idx === 1 ? 'lb-podium-2' : (idx === 2 ? 'lb-podium-3' : ''));
              return `<tr class="${rankClass}">
                <td class="col-rank"><strong>${medal(idx)}</strong></td>
                <td class="col-player">
                  <div class="lb-player-cell">
                    ${item.player.photo ? `<img src="${item.player.photo}" class="avatar-table-mini" alt="">` : '<span class="avatar-table-mini placeholder">👤</span>'}
                    <div><strong>${escapeHtml(item.player.name)}</strong>${num ? ` <span class="lb-dorsal-tag">${escapeHtml(num)}</span>` : ''}</div>
                  </div>
                </td>
                <td class="col-num">${item.summary.callups}</td>
                <td class="col-num">${item.summary.rotations}</td>
                <td class="col-num">${item.summary.minutes}</td>
                <td class="col-num">${item.callupInfo.possibleMinutes}</td>
                <td class="col-num">${pct}%</td>
                <td class="col-num highlight"><span class="minute-pill-badge ${badgeClass}">${avg} min/partido</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (tab === 'fairplay') {
    const list = leaderboards.fairPlay;
    tableContent = `
      <div class="lb-table-wrapper">
        <table class="lb-table">
          <thead>
            <tr>
              <th class="col-rank">Pos.</th>
              <th class="col-player">Jugador</th>
              <th class="col-num">Conv.</th>
              <th class="col-num">🟨 Amarillas</th>
              <th class="col-num">🟥 Rojas</th>
              <th class="col-num highlight">Puntos Fair Play</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((item, idx) => {
              const num = cleanPlayerNumber(item.player.number);
              return `<tr>
                <td class="col-rank"><strong>${idx + 1}.º</strong></td>
                <td class="col-player">
                  <div class="lb-player-cell">
                    ${item.player.photo ? `<img src="${item.player.photo}" class="avatar-table-mini" alt="">` : '<span class="avatar-table-mini placeholder">👤</span>'}
                    <div><strong>${escapeHtml(item.player.name)}</strong>${num ? ` <span class="lb-dorsal-tag">${escapeHtml(num)}</span>` : ''}</div>
                  </div>
                </td>
                <td class="col-num">${item.summary.callups}</td>
                <td class="col-num">${item.summary.yellowCards}</td>
                <td class="col-num">${item.summary.redCards}</td>
                <td class="col-num highlight"><strong>${item.points}</strong> pts</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  const isLbOpen = state.isLeaderboardsOpen ?? true;

  container.innerHTML = `
    <details class="squad-leaderboards-card"${isLbOpen ? ' open' : ''}>
      <summary class="squad-leaderboards-summary">
        <div class="lb-summary-left">
          <span class="summary-toggle-icon">📊</span>
          <div>
            <h3>Tablas Clasificatorias de la Plantilla</h3>
            <span class="meta">${scopeLabels[scope]} · ${state.players.length} jugadores</span>
          </div>
        </div>
        <span class="badge secondary lb-toggle-text">${isLbOpen ? 'Cerrar tablas clasificatorias ▴' : 'Desplegar tablas clasificatorias ▾'}</span>
      </summary>
      <div class="squad-leaderboards-body">
        ${tabsMarkup}
        ${tableContent}
      </div>
    </details>
  `;
}

function setPiecesQuickBanner() {
  const setPieces = state.settings?.setPieces;
  if (!setPieces) return '';
  const getP = (id) => {
    if (!id) return null;
    const p = state.players.find((x) => x.id === id);
    return p ? (cleanPlayerNumber(p.number) ? `${p.name} ${cleanPlayerNumber(p.number)}` : p.name) : null;
  };
  const roles = [
    setPieces.penalties?.primary && `🎯 Penalti: <strong>${escapeHtml(getP(setPieces.penalties.primary))}</strong>`,
    setPieces.freeKicksLeft?.primary && `⚡ Falta Izq: <strong>${escapeHtml(getP(setPieces.freeKicksLeft.primary))}</strong>`,
    setPieces.freeKicksRight?.primary && `⚡ Falta Der: <strong>${escapeHtml(getP(setPieces.freeKicksRight.primary))}</strong>`,
    setPieces.cornersLeft?.primary && `📐 Córner Izq: <strong>${escapeHtml(getP(setPieces.cornersLeft.primary))}</strong>`,
    setPieces.cornersRight?.primary && `📐 Córner Der: <strong>${escapeHtml(getP(setPieces.cornersRight.primary))}</strong>`,
    setPieces.captains?.primary && `©️ Capitán: <strong>${escapeHtml(getP(setPieces.captains.primary))}</strong>`,
  ].filter(Boolean);

  if (!roles.length) return '';
  return `<details class="match-set-pieces-quick-card"><summary>🎯 Balón parado y Capitanes del equipo</summary><div class="quick-set-pieces-pills">${roles.map((r) => `<span class="quick-sp-pill">${r}</span>`).join('')}</div></details>`;
}

function playerIncidentRows(playerId) {
  const rows = [];
  for (const match of state.matches) {
    (match.incidents ?? []).forEach((item, i) => {
      if (item.playerId !== playerId) return;
      rows.push({ key: `match:${match.id}:incidents:${i}`, date: match.date, label: 'Incidencia', note: item.note || '' });
    });
  }
  for (const record of state.trainings) {
    const entry = record.attendance?.find((item) => item.playerId === playerId);
    if (entry?.note) {
      const label = entry.status === 'late' ? 'Tardanza' : entry.status === 'absent' ? 'Falta' : 'Nota de asistencia';
      rows.push({ key: `training:${record.id}:note:${playerId}`, date: record.date, label, note: entry.note });
    }
  }
  return rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

async function removePlayerIncident(key) {
  const [type, ...rest] = key.split(':');
  if (type === 'match') {
    const [matchId, field, indexStr] = rest;
    const match = state.matches.find((m) => m.id === matchId);
    if (!match) return;
    const next = { ...match };
    const items = [...(next[field] ?? [])];
    const removed = items.splice(Number(indexStr), 1)[0];
    next[field] = items;
    if (field === 'goals' && removed) next.goalsFor = Math.max(0, (Number(next.goalsFor) || 0) - 1);
    await put('matches', next);
  } else if (type === 'training') {
    const [trainingId, , playerId] = rest;
    const record = state.trainings.find((r) => r.id === trainingId);
    if (!record) return;
    const next = { ...record, attendance: record.attendance.map((item) => item.playerId === playerId ? { ...item, note: '' } : item) };
    await put('trainings', next);
  }
  await refresh();
  renderPlayers();
  renderTrainings();
  toast('Incidencia eliminada.');
}

async function photoToDataUrl(file) {
  if (!file || !file.size) return '';
  if (!file.type.startsWith('image/')) throw new TypeError('El archivo seleccionado no es una imagen.');
  return compressAndCropImage(file, { offsetY: 0.35, size: 300, quality: 0.85 });
}

async function savePlayer(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = formObject(form);
  const existing = values.id ? await getOne('players', values.id) : null;
  const photoRemoved = form.elements.photoRemoved?.value === '1';
  let photo = '';
  if (!photoRemoved) {
    if (form.elements.photo?.files?.[0]) {
      photo = await photoToDataUrl(form.elements.photo.files[0]);
    } else {
      photo = form.elements.existingPhoto?.value || '';
    }
  }
  const positions = checkedValues('positions', form);
  await putPlayerProfile(buildPlayerRecord({ ...values, id: values.id || uid() }, positions, existing, photo));
  form.closest('dialog').close();
  form.reset();
  if (form.elements.photoRemoved) form.elements.photoRemoved.value = '0';
  playerCropper?.setExistingPhoto('');
  await refresh(true);
  renderPlayers();
  toast('Jugador guardado.');
}

function editPlayer(id) {
  const player = state.players.find((item) => item.id === id); if (!player) return;
  const form = $('#player-form');
  for (const key of ['id', 'name', 'number', 'foot', 'notes', 'fatherName', 'fatherPhone', 'motherName', 'motherPhone']) {
    if (form.elements[key]) form.elements[key].value = player[key] ?? '';
  }
  if (form.elements.existingPhoto) form.elements.existingPhoto.value = player.photo || '';
  if (form.elements.photoRemoved) form.elements.photoRemoved.value = '0';
  playerCropper?.setExistingPhoto(player.photo || '');
  const positions = new Set(normalizePositions(player));
  $$('input[name="positions"]', form).forEach((input) => { input.checked = positions.has(input.value); });
  $('#player-dialog').showModal();
}

const EDITABLE_PLAYER_STATS = ['goals', 'assists', 'yellowCards', 'redCards', 'injuries', 'incidents', 'callups', 'rotations', 'late', 'absent', 'minutes', 'averageRating'];

function editPlayerStats(playerId, scope) {
  if (!roleCanUseOwnerFeatures(state.role)) return toast('Solo Migue puede editar las estadísticas.');
  const player = state.players.find((item) => item.id === playerId);
  if (!player || !['league', 'preseason'].includes(scope)) return;
  const automatic = buildPlayerSummary(player.id, state.matches, state.trainings, state.callups, scope);
  const summary = applyPlayerStatAdjustments(automatic, player.statAdjustments?.[scope]);
  const form = $('#player-stats-form');
  form.elements.playerId.value = player.id;
  form.elements.scope.value = scope;
  for (const field of EDITABLE_PLAYER_STATS) form.elements[field].value = summary[field] ?? 0;
  const label = scope === 'preseason' ? 'Pretemporada' : 'Liga';
  $('#player-stats-title').textContent = `Editar ${label} · ${player.name}`;
  $('#player-stats-help').textContent = `Totales de ${label}. Puedes corregir todas las casillas.`;
  $('#player-stats-dialog').showModal();
}

async function savePlayerStats(event) {
  event.preventDefault();
  if (!roleCanUseOwnerFeatures(state.role)) return toast('Solo Migue puede editar las estadísticas.');
  const form = event.currentTarget;
  const values = formObject(form);
  const player = await getOne('players', values.playerId);
  if (!player || !['league', 'preseason'].includes(values.scope)) throw new TypeError('No se encontró la ficha de estadísticas.');
  const automatic = buildPlayerSummary(player.id, state.matches, state.trainings, state.callups, values.scope);
  const totals = Object.fromEntries(EDITABLE_PLAYER_STATS.map((field) => [field, values[field]]));
  await put('players', setPlayerStatTotals(player, values.scope, automatic, totals));
  form.closest('dialog').close();
  await refresh(true);
  renderPlayers();
  toast(`Estadísticas de ${values.scope === 'preseason' ? 'Pretemporada' : 'Liga'} guardadas.`);
}

function callupForMatch(match) {
  if (!match) return null;
  const matchId = typeof match === 'string' ? match : match.id;
  const callupId = typeof match === 'object' ? match.callupId : null;
  return state.callups.find((item) => (callupId && item.id === callupId) || item.matchId === matchId || item.id === matchId) ?? null;
}

function exclusionReasonLabel({ reason, note }) {
  const label = EXCLUSION_REASONS[reason] ?? reason;
  return reason === 'other' && note ? `Otro motivo: ${note}` : label;
}

function callupPlayerCard(player, existing) {
  const manualExclusion = existing?.exclusions?.find((item) => item.playerId === player.id && !item.automatic);
  const selected = existing?.selectedIds?.includes(player.id);
  return `<article class="selection-card" data-player-id="${player.id}">${playerCardPhoto(player)}<div class="selection-card-body"><h4>${escapeHtml(player.name)} <span class="pill">${escapeHtml(player.number ? `Dorsal ${cleanPlayerNumber(player.number)}` : '—')}</span></h4><p class="meta">${escapeHtml(playerPositions(player))}</p><div class="selection-actions"><label><input type="checkbox" name="selected" value="${player.id}" ${selected ? 'checked' : ''}> Convocar manualmente</label><label><input type="checkbox" name="manualExcluded" value="${player.id}" ${manualExclusion ? 'checked' : ''}> Dejar fuera</label><select name="reason-${player.id}" aria-label="Motivo de exclusión de ${escapeHtml(player.name)}" ${manualExclusion ? '' : 'disabled'}><option value="">Motivo…</option>${Object.entries(EXCLUSION_REASONS).filter(([key]) => key !== 'rotation').map(([key, label]) => `<option value="${key}" ${manualExclusion?.reason === key ? 'selected' : ''}>${label}</option>`).join('')}</select><label class="exclusion-other-note ${manualExclusion?.reason === 'other' ? '' : 'hidden'}">Explica el otro motivo<input name="reasonNote-${player.id}" maxlength="200" value="${escapeHtml(manualExclusion?.note ?? '')}" ${manualExclusion?.reason === 'other' ? 'required' : ''} aria-label="Explicación del motivo de exclusión de ${escapeHtml(player.name)}"></label></div></div></article>`;
}

function callupBuilder(preselectedMatchId = '', editId = '') {
  const container = $('#callup-builder');
  const config = FORMATS[state.format];
  const existing = state.callups.find((callup) => callup.id === editId);
  const selectedMatchId = existing?.matchId ?? preselectedMatchId;
  container.classList.remove('hidden');
  const options = state.matches.filter((match) => match.status !== 'finished' || match.id === selectedMatchId).sort((a,b)=>a.date.localeCompare(b.date)).map((match) => `<option value="${match.id}" ${match.id === selectedMatchId ? 'selected' : ''}>${escapeHtml(localDate(match.date))} · ${escapeHtml(matchTypeLabel(match.type))}${match.round ? ` · Jornada ${escapeHtml(match.round)}` : ''} · ${escapeHtml(match.opponent)}</option>`).join('');
  container.innerHTML = `<h3>${existing ? 'Editar' : 'Nueva'} convocatoria · ${existing?.format ?? state.format}</h3><form id="callup-form"><input type="hidden" name="id" value="${existing?.id ?? ''}"><fieldset><legend>Partido</legend><div class="choice-row"><label><input type="radio" name="matchSource" value="calendar" ${existing || preselectedMatchId || options ? 'checked' : ''}> Elegir del calendario</label>${existing ? '' : `<label><input type="radio" name="matchSource" value="manual" ${!preselectedMatchId && !options ? 'checked' : ''}> Crear partido a mano</label>`}</div><div id="calendar-match-fields"><label>Partido del calendario<select name="matchId"><option value="">Selecciona…</option>${options}</select></label></div><div id="manual-match-fields" class="hidden"><fieldset class="datetime-field"><legend>Fecha y hora (24 h)</legend>${dateMarkup('manualDate', '', 'Fecha del partido manual')}${time24Markup('manualDate', '', 'Hora del partido manual')}</fieldset><div class="form-row"><label>Jornada<input name="manualRound" maxlength="30" placeholder="Ej. 8"></label><div class="form-row"><label>Tipo<select name="manualType"><option value="league">Partido de liga</option><option value="friendly">Amistoso</option><option value="tournament">Torneo</option></select></label><label>Local / Visitante<select name="manualVenue"><option value="home">Local (casa)</option><option value="away">Visitante (fuera)</option></select></label></div><label>Rival<input name="manualOpponent" maxlength="100"></label><label>Lugar<input name="manualLocation" maxlength="120"></label></div></fieldset><div class="callup-help panel"><strong>Liga: máximo 14. Amistoso: sin límite de convocados para el reparto de minutos.</strong> Marca solo quienes quieras asegurar en la convocatoria. Para dejar a alguien fuera manualmente, marca “Dejar fuera” e indica el motivo. En liga, CampoBase completa el resto con rotación justa. Si a alguien ya se le excluyó por enfermedad o decisión técnica, te pedirá confirmación antes de dejarle fuera por rotación.</div><div class="selection-grid">${state.players.map((player) => callupPlayerCard(player, existing)).join('')}</div><div id="target-preview"></div><div class="button-row"><button class="primary" type="submit">${existing ? 'Actualizar' : 'Guardar'} convocatoria y reparto</button><button class="secondary cancel-builder" type="button">Cancelar</button></div></form>`;
  updateMatchSource();
  updateTargetPreview();
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function currentCallupMatch(form) {
  if (form.elements.matchSource.value === 'manual') return { type: form.elements.manualType.value };
  return state.matches.find((match) => match.id === form.elements.matchId.value) ?? null;
}

function manualExclusionsFromForm(form) {
  return checkedValues('manualExcluded', form).map((playerId) => {
    const reason = form.elements[`reason-${playerId}`].value;
    const note = form.elements[`reasonNote-${playerId}`].value.trim();
    return { playerId, reason, ...(reason === 'other' ? { note } : {}) };
  });
}

function invalidManualExclusion({ reason, note }) {
  return !reason || (reason === 'other' && !note);
}

function protectedRotationHistories(excludedCallupId = '') {
  const protectedReasons = new Set(['sick', 'coach_decision']);
  const histories = {};
  for (const callup of state.callups.filter(({ id }) => id !== excludedCallupId)) {
    for (const exclusion of callup.exclusions ?? []) {
      if (!exclusion.automatic && protectedReasons.has(exclusion.reason)) {
        (histories[exclusion.playerId] ??= []).push({ reason: exclusion.reason, date: callup.date, callupId: callup.id });
      }
    }
  }
  return histories;
}

function callupSelectionFromForm(form, rotationDecisions = {}) {
  const match = currentCallupMatch(form);
  if (!match) throw new TypeError('Selecciona un partido o créalo a mano.');
  return buildCallupSelection(state.players, {
    matchType: match.type ?? 'league',
    selectedIds: checkedValues('selected', form),
    manualExclusions: manualExclusionsFromForm(form),
    protectedHistories: protectedRotationHistories(form.elements.id.value),
    rotationDecisions,
  });
}

function updateTargetPreview() {
  const form = $('#callup-form'); if (!form) return;
  const preview = $('#target-preview');
  const match = currentCallupMatch(form);
  if (!match) { preview.innerHTML = '<p class="warning panel">Selecciona un partido o créalo a mano.</p>'; return; }
  const manualExclusions = manualExclusionsFromForm(form);
  if (manualExclusions.some(invalidManualExclusion)) { preview.innerHTML = '<p class="warning panel">Indica el motivo de cada jugador que dejas fuera.</p>'; return; }
  try {
    const selection = callupSelectionFromForm(form);
    if (!selection.availableIds.length) { preview.innerHTML = '<p class="warning panel">No hay jugadores convocados.</p>'; return; }
    const keeperIds = selection.availableIds.filter((id) => normalizePositions(state.players.find((player) => player.id === id)).includes('Portero'));
    const targets = calculateMinuteTargets(selection.availableIds, FORMATS[state.format].duration, FORMATS[state.format].players, keeperIds);
    const manual = selection.exclusions.filter(({ automatic }) => !automatic);
    const automatic = selection.exclusions.filter(({ automatic: isAutomatic }) => isAutomatic);
    const exclusionList = (items) => items.length ? `<ul class="plain-list">${items.map((item) => `<li><strong>${escapeHtml(playerName(item.playerId))}</strong> — ${escapeHtml(exclusionReasonLabel(item))}</li>`).join('')}</ul>` : '<p class="meta">Nadie.</p>';
    const pending = selection.pendingRotationDecisions ?? [];
    const callupCountLabel = match.type === 'friendly'
      ? `${selection.availableIds.length} · sin máximo`
      : `${selection.availableIds.length}/14`;
    preview.innerHTML = `${pending.length ? `<p class="warning panel"><strong>Revisión necesaria:</strong> al guardar te preguntaré por ${pending.map(({ playerId }) => escapeHtml(playerName(playerId))).join(', ')} porque ya se quedaron fuera por enfermedad o decisión del entrenador.</p>` : ''}<div class="preview-summary"><h3>Convocados (${callupCountLabel})</h3><p>${selection.availableIds.map(playerName).map(escapeHtml).join(', ')}</p><div class="exclusion-summary"><section><h4>Fuera manualmente (${manual.length})</h4>${exclusionList(manual)}</section><section><h4>Fuera por CampoBase (${automatic.length})</h4>${exclusionList(automatic)}</section></div><p><strong>Total fuera: ${selection.exclusions.length}</strong></p></div><details><summary>Ver minutos objetivo</summary><table class="minute-table"><thead><tr><th>Jugador</th><th>Objetivo</th></tr></thead><tbody>${targets.map((target) => `<tr><td>${escapeHtml(playerName(target.playerId))}</td><td>${target.minutes} min</td></tr>`).join('')}</tbody></table></details>`;
  } catch (error) { preview.innerHTML = `<p class="warning panel">${escapeHtml(error.message)}</p>`; }
}

function updateMatchSource() {
  const form = $('#callup-form'); if (!form) return;
  const manual = form.elements.matchSource.value === 'manual';
  $('#manual-match-fields').classList.toggle('hidden', !manual);
  $('#calendar-match-fields').classList.toggle('hidden', manual);
  for (const name of ['manualDateDay', 'manualDateMonth', 'manualDateYear', 'manualDateHour', 'manualDateMinute', 'manualOpponent']) form.elements[name].required = manual;
  form.elements.matchId.required = !manual;
}

async function saveCallup(event) {
  event.preventDefault(); const form = event.target.closest('form');
  const existing = form.elements.id.value ? state.callups.find(({ id }) => id === form.elements.id.value) : null;
  let match = currentCallupMatch(form);
  if (!match) return toast('Selecciona un partido del calendario.');
  const manualMatch = form.elements.matchSource.value === 'manual';
  if (manualMatch) {
    match = { id: uid(), date: composeDateTime24(composeDate(form.elements.manualDateDay.value, form.elements.manualDateMonth.value, form.elements.manualDateYear.value), form.elements.manualDateHour.value, form.elements.manualDateMinute.value), round: form.elements.manualRound.value.trim(), type: form.elements.manualType.value, venue: form.elements.manualVenue.value, opponent: form.elements.manualOpponent.value.trim(), location: form.elements.manualLocation.value.trim(), goalsFor: null, goalsAgainst: null, status: 'planned', createdAt: Date.now() };
  }
  const manualExclusions = manualExclusionsFromForm(form);
  if (manualExclusions.some(invalidManualExclusion)) return toast('Indica el motivo de cada jugador que dejas fuera.');
  const rotationDecisions = {};
  let selection;
  while (true) {
    selection = callupSelectionFromForm(form, rotationDecisions);
    const pending = selection.pendingRotationDecisions?.find(({ playerId }) => !rotationDecisions[playerId]);
    if (!pending) break;
    const history = pending.history.map(({ reason, date }) => `${localDate(date)}: ${EXCLUSION_REASONS[reason] ?? reason}`).join('\n');
    const include = await askConfirmation({ title: 'Revisar rotación', message: `${playerName(pending.playerId)} ya se quedó fuera por:\n${history}\n\n¿Quieres que ENTRE en esta convocatoria? Si entra, CampoBase dejará fuera al siguiente jugador de la rotación.`, acceptLabel: 'Sí, que entre' });
    rotationDecisions[pending.playerId] = include ? 'include' : 'exclude';
  }
  const { availableIds, exclusions } = selection;
  if (!availableIds.length) return toast('La convocatoria no puede quedar vacía.');
  const excludedIds = exclusions.map(({ playerId }) => playerId);
  const format = existing?.format ?? state.format;
  const config = FORMATS[format];
  const keeperIds = availableIds.filter((id) => normalizePositions(state.players.find((player) => player.id === id)).includes('Portero'));
  const targets = calculateMinuteTargets(availableIds, config.duration, config.players, keeperIds);
  const callup = { id: existing?.id ?? uid(), matchId: match.id, date: match.date, opponent: match.opponent, matchType: match.type ?? 'league', format, availableIds, selectedIds: checkedValues('selected', form), excludedIds, exclusions, targets, rotationDecisions, createdAt: existing?.createdAt ?? Date.now(), updatedAt: Date.now() };
  const nextCallups = [...state.callups.filter(({ id }) => id !== callup.id), callup];
  const matchesToSave = [{ ...match, callupId: callup.id, format }];
  if (existing?.matchId && existing.matchId !== match.id) {
    const oldMatch = state.matches.find(({ id }) => id === existing.matchId);
    if (oldMatch) matchesToSave.push({ ...oldMatch, callupId: null });
  }
  await putBatch({
    callups: [callup],
    matches: matchesToSave,
    players: updateRotationCounters(state.players, nextCallups),
  });

  // Sincronizar preparación y partido en vivo con los nuevos convocados
  const prep = prepForMatch(match.id);
  if (prep?.team?.length) {
    const safeFirstKeeper = availableIds.includes(prep.firstKeeper) ? prep.firstKeeper : (availableIds[0] || '');
    const safeSecondKeeper = availableIds.includes(prep.secondKeeper) ? prep.secondKeeper : safeFirstKeeper;
    const assignedIds = new Set([safeFirstKeeper]);
    for (const slot of prep.team) {
      if (slot.playerId && availableIds.includes(slot.playerId) && slot.playerId !== safeFirstKeeper) {
        assignedIds.add(slot.playerId);
      }
    }
    const unassigned = availableIds.filter((id) => !assignedIds.has(id) && id !== safeFirstKeeper);
    const updatedTeam = prep.team.map((slot) => {
      if (slot.pos === 'Portero') return { ...slot, playerId: safeFirstKeeper };
      if (slot.playerId && availableIds.includes(slot.playerId)) return slot;
      const replacement = unassigned.shift() || '';
      return { ...slot, playerId: replacement };
    });
    const updatedPrep = {
      ...prep,
      firstKeeper: safeFirstKeeper,
      secondKeeper: safeSecondKeeper,
      team: updatedTeam,
      savedAt: Date.now(),
    };
    await put('settings', updatedPrep);
    if (state.timer && state.timer.matchId === match.id && state.timer.phase === 'ready') {
      await applyPreparacionToLive(updatedPrep);
    }
  } else if (state.timer && state.timer.matchId === match.id) {
    if (state.timer.phase === 'ready') {
      const safeFirstKeeper = availableIds.includes(state.timer.firstKeeper) ? state.timer.firstKeeper : (availableIds[0] || '');
      const safeSecondKeeper = availableIds.includes(state.timer.secondKeeper) ? state.timer.secondKeeper : safeFirstKeeper;
      const filteredField = (state.timer.onField || []).filter((id) => availableIds.includes(id));
      if (!filteredField.includes(safeFirstKeeper)) filteredField.unshift(safeFirstKeeper);
      const remainingForField = availableIds.filter((id) => !filteredField.includes(id));
      while (filteredField.length < config.players && remainingForField.length > 0) {
        filteredField.push(remainingForField.shift());
      }
      state.timer.firstKeeper = safeFirstKeeper;
      state.timer.secondKeeper = safeSecondKeeper;
      state.timer.onField = filteredField;
      state.timer.initialOnField = [...filteredField];
      liveTactic = null;
      await persistTimer();
    } else {
      liveTactic = null;
    }
  } else {
    liveTactic = null;
  }

  $('#callup-builder').classList.add('hidden');
  await refresh(true);
  renderCallups();
  renderMatches();
  renderPlayers();
  renderLive();
  renderDelegate();
  renderPreparaciones();
  showView('convocatorias');
  toast(existing ? 'Convocatoria actualizada.' : 'Convocatoria guardada.');
}

async function synchronizeRotationCounters() {
  const [players, callups] = await Promise.all([getAll('players'), getAll('callups')]);
  for (const player of players) {
    const rotations = callups
      .filter((callup) => (callup.exclusions ?? []).some((entry) => entry.playerId === player.id && entry.automatic))
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    await put('players', { ...player, outsideCount: rotations.length, lastExcludedAt: rotations[0]?.createdAt ?? null });
  }
}

function renderCallups() {
  const list = [...state.callups].sort((a,b)=>b.date.localeCompare(a.date));
  $('#callups-list').innerHTML = list.length ? list.map((callup) => {
    const exclusions = callup.exclusions ?? (callup.excludedIds || []).map((playerId) => ({ playerId, reason: 'rotation', automatic: true }));
    const exclusionRows = (automatic) => exclusions.filter((item) => Boolean(item.automatic) === automatic).map((item) => `<li><strong>${escapeHtml(playerName(item.playerId))}</strong> — ${escapeHtml(exclusionReasonLabel(item))}</li>`).join('') || '<li>Nadie</li>';
    const targetRows = (callup.targets || []).map((target) => `<tr><td>${escapeHtml(playerName(target.playerId))}</td><td>${target.minutes} min</td></tr>`).join('');
    return `<article class="panel"><div class="section-head"><div><span class="pill accent">${escapeHtml(callup.format)} · ${escapeHtml(matchTypeLabel(callup.matchType))}</span><h3>${escapeHtml(callup.opponent)}</h3><p class="meta">${escapeHtml(localDate(callup.date))} · ${(callup.availableIds || []).length} convocados · ${exclusions.length} fuera</p></div><div class="button-row"><button type="button" class="open-whatsapp-callup icon-button accent" data-id="${callup.id}">📱 WhatsApp</button><button type="button" class="edit-callup secondary" data-id="${callup.id}">Editar</button><button type="button" class="delete-callup danger" data-id="${callup.id}">Borrar</button></div></div><div class="exclusion-summary"><section><h4>Fuera manualmente</h4><ul class="plain-list">${exclusionRows(false)}</ul></section><h4>Fuera por CampoBase</h4><ul class="plain-list">${exclusionRows(true)}</ul></section></div><details><summary>Ver reparto objetivo</summary><table class="minute-table">${targetRows}</table></details></article>`;
  }).join('') : empty('Todavía no hay convocatorias.');
}

async function deleteCallup(id) {
  const callup = state.callups.find((item) => item.id === id); if (!callup || !await askConfirmation({ title: 'Borrar convocatoria', message: 'Se borrará esta convocatoria y se recalcularán sus contadores de rotación.', acceptLabel: 'Borrar', danger: true })) return;
  const match = state.matches.find((item) => item.callupId === id); if (match) await put('matches', { ...match, callupId: null });
  await remove('callups', id); await synchronizeRotationCounters(); await refresh(true); renderCallups(); renderMatches(); renderPlayers(); toast('Convocatoria borrada.');
}

async function deleteTrainingSession(id) {
  const session = state.trainingSessions.find((item) => item.id === id);
  if (!session || !await askConfirmation({
    title: 'Borrar sesión',
    message: 'Se eliminarán la sesión, su asistencia y todo lo que esa asistencia aporta a las fichas de jugadores.',
    acceptLabel: 'Borrar',
    danger: true,
  })) return;

  const sessionDay = String(session.date || '').slice(0, 10);
  const sessionsSameDay = state.trainingSessions.filter((item) => String(item.date || '').slice(0, 10) === sessionDay);
  const relatedAttendance = state.trainings.filter((record) => {
    if ((record.kind ?? 'training') !== 'training') return false;
    if (record.sessionId === session.id) return true;
    return !record.sessionId && sessionsSameDay.length === 1 && String(record.date || '').slice(0, 10) === sessionDay;
  });

  for (const record of relatedAttendance) await remove('trainings', record.id);
  await remove('settings', session.id);
  await refresh(true);
  renderTrainingSessions();
  renderPlayers();
  renderTrainings();
  toast('Sesión, asistencia y estadísticas relacionadas eliminadas.');
}

async function deleteMatch(id) {
  const match = state.matches.find((item) => item.id === id);
  if (!match || !await askConfirmation({
    title: 'Borrar partido',
    message: 'Se borrarán también su asistencia, convocatoria, minutos, puntuaciones y datos asociados de las fichas de jugadores.',
    acceptLabel: 'Borrar',
    danger: true,
  })) return;
  const updatedPlayers = state.players.map((player) => removeMatchFromPlayerStats(player, match, state.matches));
  for (const record of state.trainings.filter(({ matchId }) => matchId === match.id)) await remove('trainings', record.id);
  const relatedCallups = state.callups.filter((callup) => callup.id === match.callupId || callup.matchId === match.id);
  for (const callup of relatedCallups) await remove('callups', callup.id);
  await remove('matches', match.id);
  if (updatedPlayers.length) await putBatch({ players: updatedPlayers });
  await synchronizeRotationCounters();
  await refresh(true);
  renderMatches();
  renderPlayers();
  renderTrainings();
  toast('Partido y todos sus datos asociados borrados.');
}

function timerSeconds(timer = state.timer) {
  if (!timer) return 0;
  return timer.elapsed + (timer.runningSince ? Math.floor((Date.now() - timer.runningSince) / 1000) : 0);
}

function ensureLiveDetails() {
  const existing = state.timer.details ?? {};
  state.timer.details = {
    goalsFor: Number.isFinite(existing.goalsFor) ? existing.goalsFor : 0,
    goalsAgainst: Number.isFinite(existing.goalsAgainst) ? existing.goalsAgainst : 0,
    goals: existing.goals ?? [],
    cards: existing.cards ?? [],
    injuries: existing.injuries ?? [],
    incidents: existing.incidents ?? [],
    comments: existing.comments ?? '',
    minuteReasons: existing.minuteReasons ?? {},
  };
  ['goals', 'cards', 'injuries', 'incidents'].forEach((k) => {
    (state.timer.details[k] || []).forEach((item) => {
      if (!item.id) item.id = uid();
    });
  });
  return state.timer.details;
}

function liveDetailsMarkup(prefix, availableIds, match) {
  const details = ensureLiveDetails();
  const teams = matchTeams(match);
  const homeScore = teams.mySide === 'home' ? details.goalsFor : details.goalsAgainst;
  const awayScore = teams.mySide === 'away' ? details.goalsFor : details.goalsAgainst;
  const homeTeam = teams.mySide === 'home' ? 'for' : 'against';
  const awayTeam = teams.mySide === 'away' ? 'for' : 'against';
  const options = `<option value="__pp__">⚽ Gol P.P. (Propia puerta)</option>` + availableIds.map((id) => `<option value="${id}">${escapeHtml(playerName(id))}</option>`).join('');
  const assistantOptions = `<option value="">Sin asistencia</option>` + availableIds.map((id) => `<option value="${id}">${escapeHtml(playerName(id))}</option>`).join('');
  const minuteReasons = availableIds.map((id) => `<label>${escapeHtml(playerName(id))}<select data-minute-reason="${id}"><option value="">Sin motivo</option>${Object.entries(MINUTE_REASONS).map(([value, label]) => `<option value="${value}" ${details.minuteReasons[id] === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>`).join('');
  const events = [
    ...details.goals.map((item) => {
      const assist = item.assistantId ? ` (asist. ${playerName(item.assistantId)})` : '';
      const label = item.isPenalty ? '🎯 Gol de penalti' : (item.isOwnGoal ? '🥅 Gol P.P.' : '⚽ Gol');
      return {
        id: item.id,
        second: item.second || 0,
        text: `${formatMatchClock(item.second)} · ${label}: ${playerName(item.playerId)}${assist}${item.note ? ` · ${item.note}` : ''}`,
      };
    }),
    ...details.cards.map((item) => ({
      id: item.id,
      second: item.second || 0,
      text: `${formatMatchClock(item.second)} · Tarjeta ${item.type === 'red' ? '🟥 roja' : '🟨 amarilla'}: ${playerName(item.playerId)}${item.note ? ` · ${item.note}` : ''}`,
    })),
    ...details.injuries.map((item) => ({
      id: item.id,
      second: item.second || 0,
      text: `${formatMatchClock(item.second)} · 🩹 Lesión: ${playerName(item.playerId)}${item.note ? ` · ${item.note}` : ''}`,
    })),
    ...details.incidents.map((item) => {
      let iconLabel = '📋 Incidencia';
      if (item.type === 'penalty_miss') iconLabel = '❌🎯 Penalti fallado';
      else if (item.type === 'penalty_saved') iconLabel = '🧤🚫 Penalti parado';
      else if (item.type === 'penalty_conceded') iconLabel = '🧤⚽ Penalti encajado';
      return {
        id: item.id,
        second: item.second || 0,
        text: `${formatMatchClock(item.second)} · ${iconLabel}: ${playerName(item.playerId)}${item.note ? ` · ${item.note}` : ''}`,
      };
    }),
  ];
  const comments = roleCanUseOwnerFeatures(state.role) ? `<label>Comentarios internos<textarea id="${prefix}-comments" maxlength="2000">${escapeHtml(details.comments)}</textarea></label><button class="save-live-comments secondary" data-prefix="${prefix}">Guardar comentarios</button>` : '';
  const scoreTeam = (name, score, team) => `<section class="score-team"><span>${escapeHtml(name)}</span><strong>${score}</strong><div><button type="button" class="score-step secondary" data-score-team="${team}" data-delta="-1" aria-label="Restar gol a ${escapeHtml(name)}">−</button><button type="button" class="score-step primary" data-score-team="${team}" data-delta="1" aria-label="Sumar gol a ${escapeHtml(name)}">+</button></div></section>`;
  return `<details class="match-log" open><summary>Marcador e incidencias</summary><div class="stadium-score">${scoreTeam(teams.home, homeScore, homeTeam)}<span class="score-separator">—</span>${scoreTeam(teams.away, awayScore, awayTeam)}</div><p class="meta match-venue">${teams.mySide === 'home' ? `${escapeHtml(myTeamName())} juega como local` : `${escapeHtml(myTeamName())} juega como visitante`}</p><div class="event-editor"><label>Jugador<select id="${prefix}-event-player">${options}</select></label><label>Tipo<select id="${prefix}-event-kind"><option value="goal">⚽ Gol (suma al marcador)</option><option value="penalty_goal">🎯⚽ Gol de penalti (suma al marcador)</option><option value="penalty_miss">❌🎯 Penalti fallado</option><option value="penalty_saved">🧤🚫 Penalti parado (portero)</option><option value="penalty_conceded">🧤⚽ Penalti encajado (gol rival)</option><option value="own_goal">🥅 Gol P.P. (suma al marcador)</option><option value="yellow">🟨 Tarjeta amarilla</option><option value="red">🟥 Tarjeta roja</option><option value="injury">🩹 Lesión</option><option value="incident">📋 Incidencia</option></select></label><label>Asistencia<select id="${prefix}-event-assistant">${assistantOptions}</select></label><label>Detalle<input id="${prefix}-event-note" maxlength="200" placeholder="Opcional"></label><button class="add-live-event primary" data-prefix="${prefix}">Registrar</button></div>${events.length ? `<ul class="plain-list event-list">${events.sort((a, b) => (a.second - b.second) || String(a.text).localeCompare(String(b.text))).map((ev) => `<li class="live-event-row"><span>${escapeHtml(ev.text)}</span><button type="button" class="remove-live-event-btn" data-prefix="${prefix}" data-id="${ev.id}" title="Anular esta incidencia">✕ Anular</button></li>`).join('')}</ul>` : '<p class="meta">Sin goles, tarjetas, lesiones ni incidencias.</p>'}${comments}<details><summary>Motivo si alguien juega menos</summary><div class="reason-grid">${minuteReasons}</div></details></details>`;
}

function renderLive() {
  const root = $('#live-match');
  const eligible = state.matches.filter((match) => (match.callupId || callupForMatch(match)) && match.status !== 'finished').sort((a,b)=>a.date.localeCompare(b.date));
  if (!state.timer) {
    // Si hay una preparación guardada para un partido próximo no finalizado, cargarla automáticamente para no perder el trabajo de Migue
    const savedPrep = state.preparaciones?.find((p) => {
      if (!p.team?.length) return false;
      const m = state.matches.find((item) => item.id === p.matchId);
      return m && m.status !== 'finished';
    });
    if (savedPrep) {
      applyPreparacionToLive(savedPrep).catch(() => {});
      return;
    }
    root.innerHTML = eligible.length ? `<label>Partido convocado<select id="live-select"><option value="">Selecciona…</option>${eligible.map((match) => `<option value="${match.id}">${escapeHtml(localDate(match.date))} · ${match.venue === 'away' ? 'Visitante' : 'Local'} · ${escapeHtml(match.opponent)}</option>`).join('')}</select></label><div class="form-row keeper-selectors"><label>Portero primer tiempo<select id="first-keeper" disabled><option value="">Selecciona el partido…</option></select></label><label>Portero segundo tiempo<select id="second-keeper" disabled><option value="">Selecciona el partido…</option></select></label></div><p class="meta">Puedes elegir a cualquier convocado como portero, aunque su ficha tenga otra posición.</p><div class="button-row"><button id="prepare-live" class="primary">Preparar partido</button></div>` : empty('Necesitas un partido con convocatoria para iniciar el control en vivo.');
    const prepBtn = $('#prepare-live');
    if (prepBtn && !prepBtn.dataset.directBound) {
      prepBtn.dataset.directBound = '1';
      prepBtn.addEventListener('click', () => prepareLive().catch(handleError));
    }
    return;
  }
  const match = state.matches.find((item) => item.id === state.timer.matchId);
  const callup = callupForMatch(match);
  if (!match || !callup) { state.timer = null; return renderLive(); }
  const seconds = timerSeconds(); const config = FORMATS[callup.format] || FORMATS.F7;
  state.timer.phase ??= 'ready';

  // Si la convocatoria cambió mientras el partido estaba preparado, limpiar excluidos
  if (state.timer.phase === 'ready') {
    const available = callup.availableIds || [];
    const validOnField = (state.timer.onField || []).filter((id) => available.includes(id));
    if (validOnField.length < config.players) {
      const remaining = available.filter((id) => !validOnField.includes(id));
      while (validOnField.length < config.players && remaining.length > 0) {
        validOnField.push(remaining.shift());
      }
    }
    state.timer.onField = validOnField;
    state.timer.initialOnField = [...validOnField];
    if (!available.includes(state.timer.firstKeeper)) {
      state.timer.firstKeeper = available[0] || '';
    }
    if (!available.includes(state.timer.secondKeeper)) {
      state.timer.secondKeeper = state.timer.firstKeeper;
    }
  }

  // En fase preparada, una preparación persistida es la fuente canónica de
  // posiciones. Esto permite que Realtime/polling reemplacen una pizarra vieja
  // en otro dispositivo antes de volver a sincronizar el timer.
  ensureLiveTactic();
  if (state.timer.phase === 'ready' && liveTactic) {
    syncLiveTacticFromTimer();
    syncTimerFromLiveTactic();
  }
  const phaseLabels = { ready: 'Preparado', first_half: '1.er tiempo', halftime: 'Descanso', second_half: state.timer.autoPaused ? '2.º tiempo pausado' : '2.º tiempo' };
  const actionLabels = { ready: 'Comienzo', first_half: 'Descanso', halftime: 'Segundo tiempo', second_half: 'Final del partido' };
  const fieldIds = state.timer.onField || [];
  const unlockBtn = roleCanUseOwnerFeatures(state.role)
    ? `<button id="unlock-delegate" class="secondary" title="Permite que el delegado vea este partido antes de los 20 min">${state.timer.delegateUnlocked ? 'Ocultar al Delegado' : 'Mostrar al Delegado'}</button>`
    : '';
  root.innerHTML = `${liveDetailsMarkup('owner', callup.availableIds, match)}<div class="live-clock"><span class="pill accent">${escapeHtml(matchTeams(match).home)} — ${escapeHtml(matchTeams(match).away)} · ${escapeHtml(callup.format)}</span><div id="clock" class="clock">${formatMatchClock(seconds)}</div><div id="half" class="half">${phaseLabels[state.timer.phase]} · auto-pausa 38:00/74:00</div><div class="button-row"><button id="advance-live" class="${state.timer.phase === 'second_half' ? 'danger' : 'primary'}">${actionLabels[state.timer.phase]}</button>${unlockBtn}${roleCanUseOwnerFeatures(state.role) ? '<button id="open-delegate" class="secondary">Vista Delegado</button><button id="exit-live" class="danger">Salir sin finalizar</button>' : ''}</div>${targetSummaryMarkup()}</div>
  ${setPiecesQuickBanner()}
  ${renderLiveRepartoDashboard(fieldIds, callup.availableIds.filter((id) => !fieldIds.includes(id)), livePlayedSeconds(), liveTargets(), config, false)}
  <div id="live-tactics"></div>
  ${fieldBenchMarkup(fieldIds, callup, config)}
  <div class="button-row"><button id="make-sub" class="primary">Registrar cambio manual (1–7 jugadores)</button><button id="owner-auto-sub" class="secondary">Automático (1–3)</button><button id="propose-reparto" class="secondary">Proponer reparto</button></div><p class="meta">Selecciona el mismo número de salidas y entradas. El reloj parado conserva los minutos.</p>`;
  renderLiveTactics();
  startTicks();
}

// ===== Pizarra táctica en vivo (Fase A) =====
// Guía de planteamiento para Migue y el delegado: asigna jugadores REALES a las
// posiciones, mueve fichas/balón/flechas y ve el GIF/MP4 de la táctica. NO toca
// el motor de cambios automáticos (renderLive/renderDelegate/applySubstitution).

function liveTacticPlayers() { return state.players; }
function liveTacticAvailableIds() {
  const match = state.matches.find(({ id }) => id === state.timer?.matchId);
  const callup = callupForMatch(match);
  return callup?.availableIds ?? [];
}

// Sincroniza la pizarra con el motor de cambios sin duplicados, manteniendo el
// portero correspondiente en la posición Portero.
function syncLiveTacticFromTimer() {
  if (!state.timer || !liveTactic) return;
  liveTactic.drag = null; // un cambio de alineación da por terminado cualquier arrastre en curso
  if (state.timer.phase === 'ready') {
    const prep = prepForMatch(state.timer.matchId);
    if (prep?.team?.length) {
      liveTactic = {
        ...liveTactic,
        formacion: prep.formacion ?? liveTactic.formacion,
        team: prep.team.map((p) => ({ ...p })),
      };
      return;
    }
  }
  const keeper = state.timer.phase === 'second_half' ? state.timer.secondKeeper : state.timer.firstKeeper;
  liveTactic.team = applyLineupToLiveTeam(
    liveTactic.team,
    state.timer.onField || [],
    keeper,
  );
}

// Sincroniza el motor (state.timer.onField) con la pizarra. En preparación la
// pizarra manda sin eventos; en partido en marcha registra un evento de cambio
// para que los minutos se calculen bien.
function syncTimerFromLiveTactic() {
  if (!state.timer || !liveTactic) return;
  const newField = liveTactic.team.map((p) => p.playerId).filter(Boolean);
  const oldField = state.timer.onField || [];
  const same = newField.length === oldField.length && newField.every((id, i) => id === oldField[i]);
  if (state.timer.phase === 'ready') {
    state.timer.onField = [...newField];
    state.timer.initialOnField = [...newField];
    const keeperSlot = liveTactic.team.find((position) => position.pos === 'Portero' && position.playerId);
    if (keeperSlot?.playerId) state.timer.firstKeeper = keeperSlot.playerId;
    return;
  }
  if (same) return;
  const outIds = oldField.filter((id) => !newField.includes(id));
  const inIds = newField.filter((id) => !oldField.includes(id));
  if (outIds.length || inIds.length) {
    state.timer.events.push({ second: timerSeconds(), outIds, inIds });
    state.timer.onField = newField;
  }
}

// En fase "Preparado", la pizarra del entrenador es estado persistente, no solo
// una representación visual. Cada cambio válido se guarda como preparación
// canónica y también actualiza settings/live para sobrevivir a recargas.
async function persistReadyLineupFromLiveTactic() {
  if (!state.timer || state.timer.phase !== 'ready' || !liveTactic) return false;
  const match = state.matches.find(({ id }) => String(id) === String(state.timer.matchId));
  const callup = callupForMatch(match);
  if (!match || !callup) return false;
  const format = String(callup.format || match.format || state.format || 'F7').toUpperCase();
  const config = FORMATS[format] || FORMATS.F7;
  const team = (liveTactic.team || []).map((position) => ({ ...position }));
  const playerIds = team.map((position) => position.playerId).filter(Boolean);
  if (playerIds.length !== config.players || new Set(playerIds).size !== config.players) return false;
  const availableIds = callup.availableIds || [];
  if (!playerIds.every((id) => availableIds.includes(id))) return false;

  syncTimerFromLiveTactic();
  const existing = prepForMatch(state.timer.matchId);
  const record = {
    ...existing,
    id: existing?.id ?? uid(),
    recordType: 'preparacion',
    matchId: state.timer.matchId,
    firstKeeper: state.timer.firstKeeper,
    secondKeeper: state.timer.secondKeeper || state.timer.firstKeeper,
    formacion: liveTactic.formacion ?? existing?.formacion ?? '1-3-2-1',
    team,
    delegateShown: existing?.delegateShown ?? Boolean(state.timer.delegateUnlocked),
    savedAt: Date.now(),
  };

  const prepIndex = state.preparaciones.findIndex((item) => String(item.matchId) === String(record.matchId));
  if (prepIndex >= 0) state.preparaciones[prepIndex] = record;
  else state.preparaciones.push(record);

  await put('settings', record);
  await persistTimer();
  return true;
}

function queueReadyLineupPersistence() {
  readyLineupPersistChain = readyLineupPersistChain
    .catch(() => {})
    .then(() => persistReadyLineupFromLiveTactic());
  readyLineupPersistChain.catch(handleError);
}

// Garantiza que la pizarra en vivo exista (la construye si aún no está), para
// poder sincronizar "En campo/Banquillo" con ella desde el primer render.
function ensureLiveTactic() {
  if (liveTactic) {
    const available = liveTacticAvailableIds();
    const hasInvalidPlayer = liveTactic.team?.some((p) => p.playerId && !available.includes(p.playerId));
    if (hasInvalidPlayer) {
      liveTactic = null;
    } else {
      return liveTactic;
    }
  }
  if (!state.timer) return null;
  const availableIds = liveTacticAvailableIds();
  if (!availableIds.length) return null;
  const prep = prepForMatch(state.timer.matchId);
  liveTactic = buildLiveState(
    state.players,
    availableIds,
    prep?.formacion ?? '1-3-2-1',
    'F7',
    state.timer.firstKeeper,
  );
  if (prep?.team?.length && state.timer.phase === 'ready') {
    liveTactic.team = prep.team.map((p) => ({ ...p }));
  } else {
    syncLiveTacticFromTimer();
  }
  return liveTactic;
}

// Markup de "En campo" y "Suplentes" (vista owner), ordenados de más a menos jugados.
function fieldBenchMarkup(fieldIds, callup, config) {
  const byPlayed = (a, b) => (livePlayerSeconds(b) ?? 0) - (livePlayerSeconds(a) ?? 0);
  const fieldSorted = [...fieldIds].sort(byPlayed);
  const benchSorted = callup.availableIds.filter((id) => !fieldIds.includes(id)).sort(byPlayed);
  const targets = liveTargets();
  const targetMap = new Map(targets.map((t) => [t.playerId, t.minutes]));
  const defaultTarget = Math.round((config.duration * config.players) / (callup.availableIds.length || 1));

  const row = (id, checkName) => {
    const targetMin = targetMap.get(id) ?? defaultTarget;
    const playedSec = livePlayerSeconds(id) ?? 0;
    const playedMin = Math.round(playedSec / 60);
    const targetSec = (targetMin || 1) * 60;
    const percent = Math.min(100, Math.round((playedSec / targetSec) * 100));
    const fillClass = percent >= 100 ? 'prog-complete' : percent >= 60 ? 'prog-good' : percent >= 30 ? 'prog-mid' : 'prog-low';
    return `
      <div class="check-row live-player-row">
        <div class="live-player-row-top">
          <label>
            <input type="checkbox" name="${checkName}" value="${id}">
            <span class="live-player-name">${escapeHtml(playerName(id))}</span>
          </label>
          <strong data-player-clock="${id}" class="live-clock-badge">${formatMatchClock(playedSec)}</strong>
        </div>
        <div class="live-player-row-bar">
          <div class="live-bar-track">
            <div class="live-bar-fill ${fillClass}" data-player-progress="${id}" style="width: ${percent}%;"></div>
          </div>
          <div class="live-bar-meta">
            <span class="live-target-badge" title="Minutos recomendados para este partido">Obj: <strong>${targetMin} min</strong></span>
            <span><span data-player-min-label="${id}">${playedMin} / ${targetMin} min</span> <span data-player-pct-label="${id}">(${percent}%)</span></span>
          </div>
        </div>
      </div>
    `;
  };

  return `
    <div class="live-grid">
      <div class="panel on-field">
        <h3>En campo (${fieldIds.length}/${config.players})</h3>
        <div class="check-list">
          ${fieldSorted.map((id) => row(id, 'sub-out')).join('')}
        </div>
      </div>
      <div class="panel bench">
        <h3>Suplentes</h3>
        <div class="check-list">
          ${benchSorted.map((id) => row(id, 'sub-in')).join('')}
        </div>
      </div>
    </div>
  `;
}

// Re-renderiza solo "En campo" y "Banquillo" sin reconstruir la pizarra.
function renderFieldBench() {
  const match = state.matches.find((item) => item.id === state.timer?.matchId);
  const callup = callupForMatch(match);
  if (!match || !callup) return;
  const grid = $('#live-match .live-grid');
  if (grid) grid.outerHTML = fieldBenchMarkup(state.timer.onField, callup, FORMATS[callup.format]);
}

// Alcance de la pizarra: 'owner' (vista de Migue) o 'delegate' (vista delegado).
// Ambas comparten la misma lógica y las MISMAS clases CSS (para que el estilo
// aplique a las dos); solo cambian los IDs del DOM (para distinguirlas) y el estado.
function liveScope(which) {
  const d = which === 'delegate';
  const p = d ? 'delegate-tactics' : 'live-tactics';
  return {
    which,
    p,
    state: () => liveTactic,
    setState: (s) => { liveTactic = s; },
    root: () => $(`#${p}`),
    board: () => $(`#${p}-board`),
    boardFull: () => $(`#${p}-board-full`),
    tools: () => $(`#${p}-tools`),
    toolsFull: () => $(`#${p}-tools-full`),
    slots: () => $(`#${p}-slots`),
    popup: () => $(`#${p}-popup`),
    popupSelect: () => $(`#${p}-popup-select`),
    popupTitle: () => $(`#${p}-popup-title`),
    lightbox: () => $(`#${p}-lightbox`),
    fullBtn: () => $(`#${p}-full`),
    gifBtn: () => $(`#${p}-gif`),
    formacion: () => $(`#${p}-formacion`),
  };
}

function renderLiveTactics() { renderTacticsBoard('owner'); }
function renderDelegateTactics() { renderTacticsBoard('delegate'); }

function renderTacticsBoard(which) {
  const sc = liveScope(which);
  const root = sc.root();
  if (!root) return;
  if (!state.timer) { root.innerHTML = ''; sc.setState(null); return; }
  const availableIds = liveTacticAvailableIds();
  if (!availableIds.length) { root.innerHTML = ''; sc.setState(null); return; }
  const t = sc.state();
  // No reconstruir a mitad de un arrastre (el re-render de 10 s no debe romperlo).
  if (t?.drag) return;
  if (!t) {
    sc.setState(ensureLiveTactic());
  }
  const cur = sc.state();
  const formacionOptions = LIVE_FORMATIONS.map((f) => `<option value="${f}" ${f === cur.formacion ? 'selected' : ''}>${f}</option>`).join('');
  root.innerHTML = `
    <article class="panel live-tactics">
      <div class="section-head"><div><p class="eyebrow">Planteamiento</p><h3>Pizarra táctica en vivo</h3></div><button type="button" class="secondary live-tactics-full" id="${sc.p}-full">⛶ Ampliar</button></div>
      <div class="formacion-row"><label for="${sc.p}-formacion">Táctica:</label><select id="${sc.p}-formacion">${formacionOptions}</select></div>
      <div class="board-wrap"><svg id="${sc.p}-board" viewBox="0 0 100 100" role="img" aria-label="Pizarra táctica en vivo"></svg></div>
      <div class="tactic-tools live-tactics-tools" id="${sc.p}-tools" role="toolbar" aria-label="Herramientas de la pizarra en vivo"></div>
      <div class="live-tactics-slots" id="${sc.p}-slots"></div>
      <div class="keeper-note"><strong>Regla del portero:</strong> 1 portero juega el partido completo; si hay 2 porteros, un tiempo cada uno. Migue y el delegado pueden cambiar al portero a mano en caso de causa mayor.</div>
      <div class="button-row"><button type="button" class="primary live-tactics-gif" id="${sc.p}-gif">▶ Ver táctica (GIF/MP4)</button></div>
      <div class="live-tactics-legend compact"><strong>Leyenda:</strong><span><i class="dot mi"></i>equipo</span><span><i class="dot rival"></i>rival</span><span><i class="dot ball"></i>balón</span><span>arrastrar = mover</span><span>toque = elegir jugador</span></div>
    </article>
    <div class="popup live-tactics-popup" id="${sc.p}-popup"><h4 class="live-tactics-popup-title" id="${sc.p}-popup-title">Posición</h4><select class="live-tactics-popup-select" id="${sc.p}-popup-select"></select></div>
    <div class="lightbox live-tactics-lightbox live-tactics" id="${sc.p}-lightbox"><button type="button" class="lb-close" title="Cerrar">✕</button><div class="lb-board" style="display:none;flex-direction:column;align-items:center;gap:.5rem;width:100%"><svg id="${sc.p}-board-full" viewBox="0 0 100 100" role="img" aria-label="Pizarra táctica ampliada" style="background:#0c3b2e;border-radius:8px;touch-action:none"></svg><div class="tactic-tools live-tactics-tools-full" id="${sc.p}-tools-full" role="toolbar" aria-label="Herramientas de la pizarra ampliada"></div></div><div class="lb-controls"><button type="button" class="lb-play" title="Reproducir / Pausar">▶</button><div class="speed"><button type="button" data-s="2" class="on">1×</button><button type="button" data-s="4">2×</button><button type="button" data-s="8">4×</button></div></div></div>`;
  renderTacticsBoardSvg(sc);
  renderTacticsSlots(sc);
  renderTacticsTools(sc);
  bindTacticsBoard(sc, sc.board());
  bindTacticsBoard(sc, sc.boardFull());
  wireTacticsBoard(sc);
}

function renderTacticsTools(sc) {
  const t = sc.state();
  if (!t) return;
  const markup = TACTIC_TOOLS.map(({ id, label }) => `<button type="button" class="tactic-tool ${id === t.tool ? 'active' : ''}" data-live-tool="${id}" title="${label}">${renderTacticToolIcon(id)}<span class="tactic-tool-label">${label}</span></button>`).join('');
  const normal = sc.tools();
  const full = sc.toolsFull();
  if (normal) normal.innerHTML = markup;
  if (full) full.innerHTML = markup;
}

function renderTacticsBoardSvg(sc, target) {
  const t = sc.state();
  const svg = target || sc.board();
  if (!svg || !t) return;
  const markerId = `arrow-${svg.id}`;
  const parts = [renderTacticArrowDefs(markerId)];
  parts.push('<rect class="tac-field" x="4" y="4" width="92" height="92" rx="3"/>');
  parts.push('<path class="tac-line" d="M50 4v92 M4 50h92"/>');
  parts.push('<circle class="tac-line" cx="50" cy="50" r="9"/>');
  parts.push('<rect class="tac-area" x="4" y="4" width="92" height="16"/>');
  parts.push('<rect class="tac-area" x="4" y="80" width="92" height="16"/>');
  parts.push('<rect class="tac-goal" x="40" y="4" width="20" height="4"/>');
  parts.push('<rect class="tac-goal" x="40" y="92" width="20" height="4"/>');
  t.moves.forEach((m, i) => parts.push(renderTacticArrow(m.from, m.to, m.kind, markerId, i)));
  t.team.forEach((p, i) => {
    const pl = playerById(state.players, p.playerId);
    const dorsal = pl ? pl.number : p.n;
    const label = pl ? nombreCorto(pl.name) : '';
    const labelW = label ? label.length * 1.6 + 1.6 : 0;
    const rectX = p.x - labelW / 2;
    const rectY = p.y + 2.1;
    const rectH = 3.0;
    parts.push(`<g class="tac-player" data-piece="team" data-idx="${i}"><circle cx="${p.x}" cy="${p.y}" r="4.2"/><text x="${p.x}" y="${p.y - 0.4}" class="num">${escapeHtml(dorsal)}</text>${label ? `<rect x="${rectX}" y="${rectY}" width="${labelW}" height="${rectH}" rx="0.6" fill="#000"/><text x="${p.x}" y="${p.y + 3.6}" class="name">${escapeHtml(label)}</text>` : ''}</g>`);
  });
  t.opponent.forEach((p, i) => {
    parts.push(`<g class="tac-opponent" data-piece="opponent" data-idx="${i}"><circle cx="${p.x}" cy="${p.y}" r="4.0"/><text x="${p.x}" y="${p.y + 1.3}" class="tac-opp-num">${escapeHtml(p.n)}</text></g>`);
  });
  parts.push(`<g class="tac-ball" data-piece="ball"><circle cx="${t.ball.x}" cy="${t.ball.y}" r="2.4" fill="#fff" stroke="#111" stroke-width="0.6"/></g>`);
  svg.innerHTML = parts.join('');
}

function renderTacticsSlots(sc) {
  const container = sc.slots();
  const t = sc.state();
  if (!container || !t) return;
  const availableIds = liveTacticAvailableIds();
  const suplentesList = suplentes(state.players, availableIds, t.team);
  const filas = t.team.map((p, i) => {
    const pl = playerById(state.players, p.playerId);
    const { titulares: tt, suplentes: ss } = opcionesPosicion(state.players, availableIds, t.team, p.pos, p.playerId);
    const opts = ['<option value="">— Sin asignar —</option>'];
    for (const x of tt) opts.push(`<option value="${x.id}" ${x.id === p.playerId ? 'selected' : ''}>${escapeHtml(x.number)} ${escapeHtml(x.name)}</option>`);
    if (ss.length) {
      opts.push('<option disabled>— Suplentes —</option>');
      for (const x of ss) opts.push(`<option value="${x.id}" ${x.id === p.playerId ? 'selected' : ''}>${escapeHtml(x.number)} ${escapeHtml(x.name)} (Suplente)</option>`);
    }
    return `<div class="slot"><div class="slot-head"><span class="pos">${escapeHtml(p.pos)}</span><span class="dorsal">${pl ? 'Dorsal ' + escapeHtml(pl.number) : '—'}</span></div><select data-idx="${i}" aria-label="${escapeHtml(p.pos)}">${opts.join('')}</select></div>`;
  }).join('');
  const suplentesHTML = suplentesList.length
    ? `<div class="suplentes"><h4>SUPLENTES</h4><div class="suplente-list">${suplentesList.map((pl) => `<span class="suplente">${escapeHtml(pl.number)} ${escapeHtml(pl.name)}</span>`).join('')}</div></div>`
    : '';
  container.innerHTML = filas + suplentesHTML;
  container.querySelectorAll('select').forEach((sel) => {
    sel.addEventListener('change', () => {
      const slot = sc.state().team[Number(sel.dataset.idx)];
      if (!canAssignPlayerToSlot(state.players, sc.which, slot.pos, sel.value)) return renderTacticsSlots(sc);
      sc.setState({ ...sc.state(), team: asignarJugador(sc.state().team, Number(sel.dataset.idx), sel.value) });
      renderTacticsSlots(sc); renderTacticsBoardSvg(sc); renderTacticsBoardSvg(sc, sc.boardFull());
      if (sc.which === 'owner') {
      syncTimerFromLiveTactic();
      renderFieldBench();
      queueReadyLineupPersistence();
    }
    });
  });
}

function tacticsBoardPoint(svg, e) {
  const rect = svg.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  return { x: Math.max(4, Math.min(96, x)), y: Math.max(4, Math.min(96, y)) };
}

function openTacticsPopup(sc, idx, clientX, clientY) {
  const popup = sc.popup();
  const select = sc.popupSelect();
  const title = sc.popupTitle();
  const t = sc.state();
  if (!popup || !select || !title || !t) return;
  const p = t.team[idx];
  const availableIds = liveTacticAvailableIds();
  const { titulares: tt, suplentes: ss } = opcionesPosicion(state.players, availableIds, t.team, p.pos, p.playerId);
  const opts = ['<option value="">— Sin asignar —</option>'];
  for (const x of tt) opts.push(`<option value="${x.id}">${escapeHtml(x.number)} ${escapeHtml(x.name)}</option>`);
  if (ss.length) {
    opts.push('<option disabled>— Suplentes —</option>');
    for (const x of ss) opts.push(`<option value="${x.id}">${escapeHtml(x.number)} ${escapeHtml(x.name)} (Suplente)</option>`);
  }
  title.textContent = p.pos;
  select.innerHTML = opts.join('');
  select.value = p.playerId;
  popup.dataset.idx = idx;
  popup.classList.add('open');
  const w = 240, h = 120;
  popup.style.left = Math.min(window.innerWidth - w - 10, Math.max(10, clientX - w / 2)) + 'px';
  popup.style.top = Math.min(window.innerHeight - h - 10, Math.max(10, clientY - h - 10)) + 'px';
}

function bindTacticsBoard(sc, svg) {
  if (!svg || svg.dataset._liveBound) return;
  svg.dataset._liveBound = '1';
  svg.addEventListener('pointerdown', (e) => {
    const t = sc.state();
    if (!t) return;
    const target = e.target.closest('[data-piece]');
    const pt = tacticsBoardPoint(svg, e);
    if (t.tool === 'select') {
      if (target && target.dataset.piece === 'team') {
        const idx = Number(target.dataset.idx);
        t.drag = { type: 'team', idx, moved: false };
      } else if (target && target.dataset.piece === 'opponent') {
        t.drag = { type: 'opponent', idx: Number(target.dataset.idx) };
      } else if (target && target.dataset.piece === 'ball') {
        t.drag = { type: 'ball' };
      }
    } else if (t.tool === 'ball') {
      t.ball = pt; renderTacticsBoardSvg(sc); renderTacticsBoardSvg(sc, sc.boardFull());
    } else if (t.tool === 'erase') {
      // Borrar una flecha concreta pinchándola.
      if (target && target.dataset.piece === 'arrow' && target.dataset.idx !== undefined) {
        const idx = Number(target.dataset.idx);
        t.moves = t.moves.filter((_, i) => i !== idx);
        renderTacticsBoardSvg(sc); renderTacticsBoardSvg(sc, sc.boardFull());
      }
    } else if (t.tool === 'clear') {
      // Borrar todas las flechas de golpe.
      t.moves = [];
      renderTacticsBoardSvg(sc); renderTacticsBoardSvg(sc, sc.boardFull());
    } else {
      t.drag = { type: 'arrow', from: pt, kind: t.tool };
    }
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', (e) => {
    const t = sc.state();
    if (!t || !t.drag) return;
    const pt = tacticsBoardPoint(svg, e);
    if (t.drag.type === 'team') { t.team[t.drag.idx].x = pt.x; t.team[t.drag.idx].y = pt.y; t.drag.moved = true; renderTacticsBoardSvg(sc); renderTacticsBoardSvg(sc, sc.boardFull()); }
    else if (t.drag.type === 'opponent') { t.opponent[t.drag.idx].x = pt.x; t.opponent[t.drag.idx].y = pt.y; renderTacticsBoardSvg(sc); renderTacticsBoardSvg(sc, sc.boardFull()); }
    else if (t.drag.type === 'ball') { t.ball = pt; renderTacticsBoardSvg(sc); renderTacticsBoardSvg(sc, sc.boardFull()); }
    else if (t.drag.type === 'arrow') { t.drag.to = pt; }
  });
  svg.addEventListener('pointerup', (e) => {
    const t = sc.state();
    if (!t) return;
    const movedOwnerPlayer = sc.which === 'owner' && t.drag?.type === 'team' && t.drag.moved;
    if (t.drag && t.drag.type === 'team' && !t.drag.moved) {
      openTacticsPopup(sc, t.drag.idx, e.clientX, e.clientY);
    }
    if (t.drag && t.drag.type === 'arrow' && t.drag.to) {
      if (Math.hypot(t.drag.to.x - t.drag.from.x, t.drag.to.y - t.drag.from.y) > 2) {
        t.moves.push({ from: t.drag.from, to: t.drag.to, kind: t.drag.kind });
      }
      renderTacticsBoardSvg(sc); renderTacticsBoardSvg(sc, sc.boardFull());
    }
    t.drag = null;
    if (movedOwnerPlayer) queueReadyLineupPersistence();
  });
}

function wireTacticsBoard(sc) {
  const formacion = sc.formacion();
  if (formacion) formacion.addEventListener('change', (e) => {
    const t = sc.state();
    if (!t) return;
    const team = cargarFormacion(t.team, state.players, liveTacticAvailableIds(), e.target.value, 'F7');
    sc.setState({ ...t, team, formacion: e.target.value, moves: [] });
    renderTacticsSlots(sc); renderTacticsBoardSvg(sc); renderTacticsBoardSvg(sc, sc.boardFull());
    if (sc.which === 'owner') {
      syncTimerFromLiveTactic();
      renderFieldBench();
      queueReadyLineupPersistence();
    }
  });
  const tools = sc.tools();
  const toolsFull = sc.toolsFull();
  const setTool = (id) => {
    const t = sc.state();
    if (!t) return;
    t.tool = id;
    [tools, toolsFull].forEach((bar) => bar && bar.querySelectorAll('[data-live-tool]').forEach((b) => b.classList.toggle('active', b.dataset.liveTool === id)));
  };
  if (tools) tools.addEventListener('click', (e) => { const b = e.target.closest('[data-live-tool]'); if (b) setTool(b.dataset.liveTool); });
  if (toolsFull) toolsFull.addEventListener('click', (e) => { const b = e.target.closest('[data-live-tool]'); if (b) setTool(b.dataset.liveTool); });

  const popup = sc.popup();
  const popupSelect = sc.popupSelect();
  if (popupSelect) popupSelect.addEventListener('change', () => {
    const t = sc.state();
    if (!t) return;
    const idx = Number(popup.dataset.idx);
    popup.classList.remove('open');
    if (!canAssignPlayerToSlot(state.players, sc.which, t.team[idx].pos, popupSelect.value)) return;
    sc.setState({ ...t, team: asignarJugador(t.team, idx, popupSelect.value) });
    renderTacticsSlots(sc); renderTacticsBoardSvg(sc); renderTacticsBoardSvg(sc, sc.boardFull());
    if (sc.which === 'owner') {
      syncTimerFromLiveTactic();
      renderFieldBench();
      queueReadyLineupPersistence();
    }
  });
  if (!liveTacticsDocBound) {
    liveTacticsDocBound = true;
    document.addEventListener('pointerdown', (e) => {
      const currentPopup = document.querySelector('.live-tactics-popup.open, .delegate-tactics-popup.open');
      if (currentPopup && !currentPopup.contains(e.target) && !e.target.closest('[data-piece="team"]')) currentPopup.classList.remove('open');
    });
  }

  // Lightbox compartido: pizarra ampliada (interactiva) o vídeo GIF/MP4.
  const lightbox = sc.lightbox();
  const lbBoard = lightbox?.querySelector('.lb-board');
  const lbControls = lightbox?.querySelector('.lb-controls');
  const fullBtn = sc.fullBtn();
  const gifBtn = sc.gifBtn();
  const closeLb = () => {
    lightbox.classList.remove('open');
    lightbox.querySelectorAll('video').forEach((v) => v.pause());
    if (lbBoard) lbBoard.style.display = 'none';
  };
  if (fullBtn) fullBtn.addEventListener('click', () => {
    if (lbControls) lbControls.style.display = 'none';
    lightbox.querySelectorAll('video').forEach((n) => n.remove());
    if (lbBoard) lbBoard.style.display = 'flex';
    renderTacticsBoardSvg(sc, sc.boardFull());
    lightbox.classList.add('open');
  });
  if (gifBtn) gifBtn.addEventListener('click', () => {
    const t = sc.state();
    if (!t) return;
    lightbox.querySelectorAll('video').forEach((n) => n.remove());
    if (lbBoard) lbBoard.style.display = 'none';
    if (lbControls) lbControls.style.display = 'flex';
    const video = document.createElement('video');
    video.src = TACTICA_MP4[t.formacion] || TACTICA_MP4['1-3-2-1'];
    video.playsInline = true; video.muted = true; video.loop = true;
    lightbox.appendChild(video);
    lightbox.classList.add('open');
    video.play();
  });
  lightbox.querySelector('.lb-close').addEventListener('click', closeLb);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLb(); });
  const lbPlay = lightbox.querySelector('.lb-play');
  if (lbPlay) lbPlay.addEventListener('click', () => {
    const video = lightbox.querySelector('video');
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    if (video.paused) {
      video.play().then(() => { lbPlay.textContent = '⏸'; }).catch(() => { video.controls = true; });
    } else {
      video.pause();
      lbPlay.textContent = '▶';
    }
  });
  lightbox.querySelectorAll('.speed button').forEach((b) => b.addEventListener('click', () => {
    const video = lightbox.querySelector('video');
    if (video) video.playbackRate = parseFloat(b.dataset.s);
    lightbox.querySelectorAll('.speed button').forEach((x) => x.classList.toggle('on', x === b));
  }));
}

function livePlayerSeconds(id) {
  if (!state.timer) return 0;
  const secs = timerSeconds();
  const safeSecs = Number.isFinite(secs) && secs >= 0 ? secs : 0;
  return calculatePlayedSeconds(state.timer.initialOnField || [], state.timer.events || [], safeSecs)[id] ?? 0;
}

function livePlayedSeconds() {
  if (!state.timer) return {};
  const secs = timerSeconds();
  const safeSecs = Number.isFinite(secs) && secs >= 0 ? secs : 0;
  return calculatePlayedSeconds(state.timer.initialOnField || [], state.timer.events || [], safeSecs);
}

function liveCallup() {
  const match = state.matches.find(({ id }) => id === state.timer?.matchId);
  return callupForMatch(match);
}

function liveKeeperIds() {
  const ids = [state.timer?.firstKeeper, state.timer?.secondKeeper].filter(Boolean);
  return [...new Set(ids)];
}

function liveTargets() {
  const callup = liveCallup();
  if (!callup?.availableIds?.length) return [];
  const config = FORMATS[callup.format];
  const keeperIds = keeperIdsFromCallup(callup);
  return calculateMinuteTargets(callup.availableIds, config.duration, config.players, keeperIds);
}

function liveTargetSummary() {
  const keepers = new Set(liveKeeperIds());
  const fieldTargets = liveTargets().filter((target) => !keepers.has(target.playerId));
  return summarizeMinuteTargets(fieldTargets);
}

function targetSummaryMarkup() {
  const callup = liveCallup();
  if (!callup?.availableIds?.length) return '';
  const config = FORMATS[callup.format] || FORMATS.F7;
  const targets = liveTargets();
  const summary = liveTargetSummary();
  const summaryText = summary.map(({ minutes, count }) => `${count} jug. × ${minutes} min`).join(' · ');
  const keepers = new Set(liveKeeperIds());

  const chips = targets.map((t) => {
    const isK = keepers.has(t.playerId);
    const pName = nombreCorto(playerName(t.playerId));
    return `<span class="target-chip ${isK ? 'is-keeper' : ''}"><strong>${escapeHtml(pName)}</strong>: ${t.minutes} min</span>`;
  }).join('');

  return `
    <div class="live-target-card">
      <div class="target-card-header">
        <span class="target-icon">🎯</span>
        <div>
          <strong>Minutos objetivo a disputar en este partido</strong>
          <span class="target-card-meta">${summaryText ? `${summaryText} · ${callup.availableIds.length} convocados` : `${config.duration} min`}</span>
        </div>
      </div>
      <div class="target-chips-container">
        ${chips}
      </div>
    </div>
  `;
}

function renderLiveRepartoDashboard(fieldIds, benchIds, played, targets, config, isDelegate = false) {
  const targetMap = new Map((targets || []).map((t) => [t.playerId, t.minutes]));
  const defaultTarget = Math.round(((config?.duration || 70) * (config?.players || 7)) / (((fieldIds?.length || 0) + (benchIds?.length || 0)) || 1));
  const keepers = new Set(liveKeeperIds());

  // Candidatos a salir: jugadores de campo (sin porteros) con más minutos jugados
  const fieldNonKeepers = (fieldIds || []).filter((id) => !keepers.has(id));
  const sortedField = [...fieldNonKeepers].sort((a, b) => (played[b] ?? 0) - (played[a] ?? 0));
  const topField = sortedField.slice(0, 3);

  // Candidatos a entrar: jugadores del banquillo (sin porteros) con menos minutos jugados
  const benchNonKeepers = (benchIds || []).filter((id) => !keepers.has(id));
  const sortedBench = [...benchNonKeepers].sort((a, b) => (played[a] ?? 0) - (played[b] ?? 0));
  const leastBench = sortedBench.slice(0, 3);

  // Sugerencia de cambio directo (1 a 1) para equilibrar minutos
  const suggestion = suggestDelegateSubstitution(fieldIds || [], benchIds || [], played || {}, 1, liveKeeperIds());
  const inId = suggestion.inIds[0];
  const outId = suggestion.outIds[0];

  const playerItem = (id, type) => {
    const pSec = played[id] ?? 0;
    const pMin = Math.round(pSec / 60);
    const tMin = targetMap.get(id) ?? defaultTarget;
    const pct = Math.min(100, Math.round((pSec / ((tMin || 1) * 60)) * 100));
    const fillClass = pct >= 100 ? 'prog-complete' : pct >= 60 ? 'prog-good' : pct >= 30 ? 'prog-mid' : 'prog-low';
    const shortName = nombreCorto(playerName(id));
    return `
      <div class="reparto-card-item">
        <span class="item-name">${escapeHtml(shortName)}</span>
        <div class="live-bar-track" style="max-width: 65px; height: 6px;">
          <div class="live-bar-fill ${fillClass}" style="width: ${pct}%;"></div>
        </div>
        <span class="item-min">${pMin}m</span>
      </div>
    `;
  };

  let directSubMarkup = '';
  if (inId && outId) {
    const inMin = Math.round((played[inId] ?? 0) / 60);
    const outMin = Math.round((played[outId] ?? 0) / 60);
    const inName = nombreCorto(playerName(inId));
    const outName = nombreCorto(playerName(outId));
    const actionBtnId = isDelegate ? 'apply-delegate-suggestion' : 'apply-coach-quick-sub';

    directSubMarkup = `
      <div class="reparto-direct-sub-box">
        <div class="reparto-direct-sub-header">⚡ Cambio recomendado para equilibrar minutos</div>
        <div class="reparto-direct-sub-players">
          <div class="sub-col">
            <span class="sub-dir in-dir">⬆️ ENTRA</span>
            <span class="sub-name">${escapeHtml(inName)}</span>
            <span class="sub-min">${inMin} min jugados</span>
          </div>
          <div class="sub-swap-icon">⇆</div>
          <div class="sub-col">
            <span class="sub-dir out-dir">⬇️ SALE</span>
            <span class="sub-name">${escapeHtml(outName)}</span>
            <span class="sub-min">${outMin} min jugados</span>
          </div>
        </div>
        <button type="button" class="btn-quick-sub-direct" id="${actionBtnId}" data-in-id="${inId}" data-out-id="${outId}">
          ⚡ Realizar este cambio ahora
        </button>
      </div>
    `;
  } else if (!benchNonKeepers.length) {
    directSubMarkup = `<p class="meta" style="text-align:center;margin:0.5rem 0 0 0;">Todos los jugadores de campo disponibles están jugando.</p>`;
  }

  return `
    <article class="panel live-reparto-visual-dashboard">
      <div class="reparto-dash-header">
        <div class="reparto-dash-title">
          <span>⚖️</span>
          <div>
            <h3>Reparto y balance de minutos</h3>
            <p>Control visual de rotaciones para fútbol base</p>
          </div>
        </div>
        <span class="reparto-target-pill">Obj: ~${defaultTarget} min / jug.</span>
      </div>
      <div class="reparto-balance-grid">
        <div class="reparto-col">
          <div class="reparto-col-header out-header">
            <span>⬇️ Más minutos (Salir)</span>
          </div>
          ${topField.map((id) => playerItem(id, 'out')).join('') || '<p class="meta">Sin jugadores</p>'}
        </div>
        <div class="reparto-col">
          <div class="reparto-col-header in-header">
            <span>⬆️ Menos minutos (Entrar)</span>
          </div>
          ${leastBench.map((id) => playerItem(id, 'in')).join('') || '<p class="meta">Banquillo vacío</p>'}
        </div>
      </div>
      ${directSubMarkup}
    </article>
  `;
}

function renderDelegate() {
  const root = $('#delegate-match');
  if (!root) return;

  const eligibleMatches = preparableMatches();
  const nextMatch = eligibleMatches[0];
  const nextPrep = nextMatch ? prepForMatch(nextMatch.id) : null;
  const shownPrep = (nextPrep && (nextPrep.delegateShown || state.settings?.delegateAllMatches) && nextPrep.team?.length)
    ? nextPrep
    : state.preparaciones?.find((p) => {
        if (!p.team?.length) return false;
        const m = state.matches.find((item) => String(item.id) === String(p.matchId));
        return m && m.status !== 'finished' && (p.delegateShown || state.settings?.delegateAllMatches);
      });

  if (shownPrep && (!state.timer || (state.timer.phase === 'ready' && String(state.timer.matchId) !== String(shownPrep.matchId)))) {
    applyPreparacionToLive(shownPrep).catch(() => {});
    return;
  }

  if (state.timer && shownPrep && String(state.timer.matchId) === String(shownPrep.matchId) && !state.timer.delegateUnlocked) {
    state.timer.delegateUnlocked = true;
  }

  if (!state.timer) {
    if (state.role === 'delegate') {
      root.innerHTML = `
        <div class="delegate-head">
          <div>
            <p class="eyebrow">Vista Delegado</p>
            <h2>Partido en vivo</h2>
          </div>
          <button id="logout" class="secondary">Cerrar sesión</button>
        </div>
        <div class="panel" style="text-align:center;padding:2.5rem 1rem;">
          <p style="font-size:1.15rem;font-weight:700;margin-bottom:0.5rem;">⏱️ Esperando partido</p>
          <p class="meta">El entrenador (Migue) aún no ha activado el partido en vivo. Aparecerá aquí en cuanto lo muestre o 20 minutos antes de comenzar.</p>
          <button type="button" id="delegate-refresh-btn" class="secondary" style="margin-top:1rem;">🔄 Comprobar ahora</button>
        </div>
      `;
      const refBtn = $('#delegate-refresh-btn');
      if (refBtn && !refBtn.dataset.bound) {
        refBtn.dataset.bound = '1';
        refBtn.addEventListener('click', async () => {
          await refresh();
          renderDelegate();
        });
      }
      return;
    }
    const eligible = state.matches.filter((match) => (match.callupId || callupForMatch(match)) && match.status !== 'finished').sort((a,b)=>a.date.localeCompare(b.date));
    if (eligible.length) {
      root.innerHTML = `
        <div class="delegate-head">
          <div>
            <p class="eyebrow">Vista Delegado</p>
            <h2>Control de partido y cambios</h2>
          </div>
          ${roleCanUseOwnerFeatures(state.role) ? '<button id="close-delegate" class="secondary">Volver</button>' : '<button id="logout" class="secondary">Cerrar sesión</button>'}
        </div>
        <div class="delegate-selector-card">
          <h3>Iniciar control de partido</h3>
          <p class="meta">Selecciona el partido convocado para gestionar el cronómetro y los cambios en directo:</p>
          <label style="display:block;margin:1rem 0;">
            <strong>Partido convocado</strong>
            <select id="delegate-match-select" style="width:100%;margin-top:0.4rem;padding:0.6rem;font-size:0.95rem;">
              <option value="">Selecciona un partido…</option>
              ${eligible.map((match) => `<option value="${match.id}">${escapeHtml(localDate(match.date))} · ${match.venue === 'away' ? 'Visitante' : 'Local'} · ${escapeHtml(match.opponent)}</option>`).join('')}
            </select>
          </label>
          <div class="button-row" style="margin-top:1rem;">
            <button id="delegate-start-live" class="primary" style="min-height:44px;font-weight:700;">▶ Iniciar control de partido (Delegado)</button>
          </div>
        </div>
      `;
      const startBtn = $('#delegate-start-live');
      if (startBtn && !startBtn.dataset.bound) {
        startBtn.dataset.bound = '1';
        startBtn.addEventListener('click', async () => {
          const select = $('#delegate-match-select');
          const matchId = select?.value;
          if (!matchId) {
            toast('Por favor, selecciona un partido convocado.');
            return;
          }
          const match = state.matches.find((m) => m.id === matchId);
          const callup = callupForMatch(match);
          if (!match || !callup) {
            toast('No se encontró la convocatoria para este partido.');
            return;
          }
          const available = callup.availableIds || [];
          const config = FORMATS[callup.format] || FORMATS.F7;
          const initialOnField = available.slice(0, config.players);
          const firstKeeper = available[0] || '';
          const secondKeeper = available[1] || firstKeeper;
          state.timer = {
            matchId: match.id,
            phase: 'ready',
            elapsed: 0,
            runningSince: null,
            initialOnField: [...initialOnField],
            onField: [...initialOnField],
            events: [],
            firstKeeper,
            secondKeeper,
            delegateUnlocked: true,
          };
          await persistTimer();
          renderLive();
          renderDelegate();
          toast('Partido preparado para el delegado.');
        });
      }
      return;
    }
    root.innerHTML = `<div class="delegate-head"><div><p class="eyebrow">Vista Delegado</p><h2>Control de partido y cambios</h2></div>${roleCanUseOwnerFeatures(state.role) ? '<button id="close-delegate" class="secondary">Volver</button>' : '<button id="logout" class="secondary">Cerrar sesión</button>'}</div>${empty('No hay partidos convocados disponibles. Prepara una convocatoria primero en la pestaña Convocatorias.')}`;
    return;
  }
  const match = state.matches.find(({ id }) => String(id) === String(state.timer.matchId));
  const callup = callupForMatch(match);
  if (!match || !callup) return;
  // El delegado solo ve el partido 20 min antes de la hora programada, o cuando
  // Migue lo desbloquea antes, o cuando ya ha empezado. Migue (owner) siempre lo ve.
  if (state.role === 'delegate' && !delegateCanSeeLive()) {
    root.innerHTML = `
      <div class="delegate-head">
        <div>
          <p class="eyebrow">Vista Delegado</p>
          <h2>Partido en vivo</h2>
        </div>
        <button id="logout" class="secondary">Cerrar sesión</button>
      </div>
      <div class="panel" style="text-align:center;padding:2.5rem 1rem;">
        <p style="font-size:1.15rem;font-weight:700;margin-bottom:0.5rem;">⏱️ Partido programado</p>
        <p class="meta">El partido en vivo estará disponible en cuanto Migue pulse «Mostrar al Delegado» o 20 minutos antes del inicio del encuentro.</p>
        <button type="button" id="delegate-refresh-btn" class="secondary" style="margin-top:1rem;">🔄 Comprobar ahora</button>
      </div>
    `;
    const refBtn = $('#delegate-refresh-btn');
    if (refBtn && !refBtn.dataset.bound) {
      refBtn.dataset.bound = '1';
      refBtn.addEventListener('click', async () => {
        await refresh();
        renderDelegate();
      });
    }
    return;
  }
  const config = FORMATS[callup.format];
  const seconds = timerSeconds();
  const played = livePlayedSeconds();
  const fieldIds = state.timer.onField;
  const benchIds = callup.availableIds.filter((id) => !fieldIds.includes(id));
  const targets = liveTargets();
  const targetMap = new Map(targets.map((t) => [t.playerId, t.minutes]));
  const defaultTarget = Math.round((config.duration * config.players) / (callup.availableIds.length || 1));
  const suggestion = suggestDelegateSubstitution(fieldIds, benchIds, played, 1, liveKeeperIds());
  const suggestionText = suggestion.inIds.length
    ? `${playerName(suggestion.inIds[0])} ha jugado menos. Mételo y saca a ${playerName(suggestion.outIds[0])}.`
    : 'No hay jugadores disponibles entre los suplentes.';

  const row = (id, name) => {
    const targetMin = targetMap.get(id) ?? defaultTarget;
    const playedSec = played[id] ?? 0;
    const playedMin = Math.round(playedSec / 60);
    const targetSec = (targetMin || 1) * 60;
    const percent = Math.min(100, Math.round((playedSec / targetSec) * 100));
    const fillClass = percent >= 100 ? 'prog-complete' : percent >= 60 ? 'prog-good' : percent >= 30 ? 'prog-mid' : 'prog-low';
    return `
      <div class="check-row live-player-row">
        <div class="live-player-row-top">
          <label>
            <input type="checkbox" name="${name}" value="${id}">
            <span class="live-player-name">${escapeHtml(playerName(id))}</span>
          </label>
          <strong data-player-clock="${id}" class="live-clock-badge">${formatMatchClock(playedSec)}</strong>
        </div>
        <div class="live-player-row-bar">
          <div class="live-bar-track">
            <div class="live-bar-fill ${fillClass}" data-player-progress="${id}" style="width: ${percent}%;"></div>
          </div>
          <div class="live-bar-meta">
            <span class="live-target-badge" title="Minutos recomendados para este partido">Obj: <strong>${targetMin} min</strong></span>
            <span><span data-player-min-label="${id}">${playedMin} / ${targetMin} min</span> <span data-player-pct-label="${id}">(${percent}%)</span></span>
          </div>
        </div>
      </div>
    `;
  };

  const byPlayed = (a, b) => (played[b] ?? 0) - (played[a] ?? 0);
  const delegateFieldIds = [...fieldIds].sort(byPlayed);
  const delegateBenchIds = [...benchIds].sort(byPlayed);
  const actionLabels = { ready: 'Comienzo', first_half: 'Descanso', halftime: 'Segundo tiempo', second_half: 'Pausar al final y avisar a Migue' };
  root.innerHTML = `<div class="delegate-head"><div><p class="eyebrow">Cambios, tiempos e incidencias</p><h2>${escapeHtml(matchTeams(match).home)} — ${escapeHtml(matchTeams(match).away)}</h2></div>${roleCanUseOwnerFeatures(state.role) ? '<button id="close-delegate" class="secondary">Volver</button>' : '<button id="logout" class="secondary">Cerrar sesión</button>'}</div>${liveDetailsMarkup('delegate', callup.availableIds, match)}<div class="live-clock"><div id="delegate-clock" class="clock">${formatMatchClock(seconds)}</div><p>Auto-pausa a 38:00 y 74:00</p><button id="advance-live" class="${state.timer.phase === 'second_half' ? 'danger' : 'primary'}">${actionLabels[state.timer.phase] ?? 'Comienzo'}</button>${targetSummaryMarkup()}</div>${renderLiveRepartoDashboard(fieldIds, benchIds, played, targets, config, true)}${setPiecesQuickBanner()}<div id="delegate-tactics"></div><div class="live-grid"><div class="panel on-field"><h3>Sale del campo</h3>${delegateFieldIds.map((id) => row(id, 'delegate-out')).join('')}</div><div class="panel bench"><h3>Entra al campo</h3>${delegateBenchIds.map((id) => row(id, 'delegate-in')).join('')}</div></div><div class="delegate-actions"><button id="delegate-manual-sub" class="primary">Registrar cambio (1–7)</button><button id="delegate-auto-sub" class="secondary">Automático (1–3)</button><button id="delegate-propose-reparto" class="secondary">Proponer reparto</button></div><p class="meta">El modo automático elige a quienes menos han jugado y saca a quienes más minutos llevan. Siempre pide confirmación.</p>`;
  renderDelegateTactics();
}

function enterDelegateMode() {
  state.delegateMode = true;
  document.body.classList.add('delegate-mode');
  syncDelegateModeDom();
  showView('delegado');
  renderDelegate();
}

// El delegado ve el partido en vivo 20 min antes de la hora programada, o cuando
// Migue lo desbloquea antes (delegateUnlocked), o cuando ya ha empezado.
function delegateCanSeeLive() {
  if (roleCanUseOwnerFeatures(state.role)) return true;
  if (!state.timer) return false;
  if (state.timer.phase !== 'ready') return true; // ya empezado
  if (state.timer.delegateUnlocked) return true;   // Migue lo desbloqueó antes o iniciado directamente
  const prep = prepForMatch(state.timer.matchId);
  if (prep?.delegateShown || state.settings?.delegateAllMatches) return true;
  const match = state.matches.find(({ id }) => String(id) === String(state.timer.matchId));
  if (!match?.date) return true;
  const kickoff = new Date(match.date).getTime();
  if (!Number.isFinite(kickoff)) return true;
  return Date.now() >= kickoff - 20 * 60 * 1000;
}

async function unlockDelegate() {
  if (!state.timer) return;
  state.timer.delegateUnlocked = !state.timer.delegateUnlocked;
  const prep = prepForMatch(state.timer.matchId);
  if (prep) {
    prep.delegateShown = state.timer.delegateUnlocked;
    prep.savedAt = Date.now();
    await put('settings', prep);
  }
  await persistTimer();
  await refresh(true);
  renderLive();
  renderDelegate();
  toast(state.timer.delegateUnlocked ? 'El delegado ya puede ver el partido en vivo.' : 'El delegado ya no ve el partido antes de tiempo.');
}

function closeDelegateMode() {
  state.delegateMode = false;
  document.body.classList.remove('delegate-mode', 'delegate-single-view', 'delegate-multi-view', 'delegate-allow-modo-campo');
  restoreNormalNavUi();
  showView('partido');
}

async function cancelLiveMatch() {
  if (!state.timer || !await askConfirmation({ title: 'Salir del partido en vivo', message: 'Se descartarán el reloj y los cambios registrados, pero no la convocatoria.', acceptLabel: 'Salir y descartar', danger: true })) return;
  state.timer = null;
  liveTactic = null;
  state.urgentAlertKey = '';
  clearInterval(state.tick);
  await put('settings', { id: 'live', timer: null });
  closeDelegateMode();
  renderLive();
  renderDelegate();
  toast('Has salido del partido. Ya puedes preparar otro.');
}

async function executeLiveSubstitution(outIds, inIds, source = '') {
  const match = state.matches.find((item) => item.id === state.timer?.matchId);
  const callup = callupForMatch(match);
  const nextOnField = applySubstitution(state.timer.onField, outIds, inIds, callup?.availableIds ?? [], 7);
  const event = { second: timerSeconds(), outIds, inIds };
  if (source) event.source = source;
  state.timer.events.push(event);
  state.timer.onField = nextOnField;
  syncLiveTacticFromTimer();
  state.urgentAlertKey = '';
  state.repartoAlertKey = '';
  await persistTimer();
  renderLive(); renderDelegate();
  toast(source === 'delegate' ? 'Cambio del delegado registrado.' : 'Cambio registrado.');
}

async function registerDelegateSubstitution(outIds, inIds) {
  return executeLiveSubstitution(outIds, inIds, 'delegate');
}

async function proposeReparto() {
  const callup = liveCallup();
  if (!callup) return toast('No hay partido en vivo.');
  const played = livePlayedSeconds();
  const bench = callup.availableIds.filter((id) => !state.timer.onField.includes(id));
  const suggestion = suggestRepartoSubstitutions(state.timer.onField, bench, played, liveTargets(), liveKeeperIds());
  if (!suggestion.inIds.length) return toast('Todos los convocados ya alcanzan su objetivo de minutos.');
  const lines = suggestion.inIds.map((id, index) => `Entra ${playerName(id)} · sale ${playerName(suggestion.outIds[index])}`).join('\n');
  if (await askConfirmation({ title: `Reparto de minutos (${suggestion.inIds.length} cambios)`, message: lines, acceptLabel: 'Registrar cambios' })) {
    await registerDelegateSubstitution(suggestion.outIds, suggestion.inIds);
  }
}

function updateKeeperOptions(matchId) {
  const match = state.matches.find((item) => item.id === matchId);
  const callup = callupForMatch(match);
  const called = calledPlayerOptions(state.players, callup?.availableIds ?? []);
  const keepers = [...called].sort((a, b) => {
    const aIsKeeper = normalizePositions(state.players.find((player) => player.id === a.id)).includes('Portero');
    const bIsKeeper = normalizePositions(state.players.find((player) => player.id === b.id)).includes('Portero');
    return Number(bIsKeeper) - Number(aIsKeeper);
  });
  const options = keepers.map((player) => `<option value="${player.id}">${escapeHtml(player.name)}</option>`).join('');
  const first = $('#first-keeper');
  const second = $('#second-keeper');
  for (const select of [first, second]) {
    if (!select) continue;
    select.disabled = !keepers.length;
    select.innerHTML = keepers.length ? `<option value="">Selecciona…</option>${options}` : '<option value="">Sin porteros convocados</option>';
  }
  const naturalKeepers = keepers.filter(({ id }) => (
    normalizePositions(state.players.find((player) => player.id === id)).includes('Portero')
  ));
  const defaults = naturalKeepers.length ? naturalKeepers : keepers;
  if (defaults.length === 1) {
    first.value = defaults[0].id;
    second.value = defaults[0].id;
  } else if (defaults.length >= 2) {
    first.value = defaults[0].id;
    second.value = defaults[1].id;
  }
}

// Convierte la preparación guardada en el único estado 'ready' compartido por
// Preparación, Partido en vivo y Delegado. Nunca pisa un partido ya comenzado.
async function applyPreparacionToLive(prep) {
  if (!prep?.team?.length) return false;
  if (state.timer && state.timer.phase !== 'ready') return false;
  const match = state.matches.find(({ id }) => String(id) === String(prep.matchId));
  const callup = callupForMatch(match);
  if (!callup) return false;
  const team = prep.team.map((position) => ({
    ...position,
    playerId: callup.availableIds.includes(position.playerId) ? position.playerId : '',
  }));
  const readyTimer = buildReadyTimerFromPreparation({
    matchId: prep.matchId,
    team,
    availableIds: callup.availableIds,
    firstKeeper: prep.firstKeeper,
    secondKeeper: prep.secondKeeper,
    delegateShown: prep.delegateShown,
  });
  readyTimer.delegateUnlocked = Boolean(prep.delegateShown || state.timer?.delegateUnlocked);
  state.timer = readyTimer;
  // Preservar exactamente las posiciones tácticas configuradas en prep.team por Migue
  const baseLiveState = buildLiveState(
    state.players,
    callup.availableIds,
    prep.formacion ?? '1-3-2-1',
    'F7',
    readyTimer.firstKeeper,
  );
  liveTactic = {
    ...baseLiveState,
    team: team.map((p) => ({ ...p })),
  };
  await persistTimer();
  renderLive();
  renderDelegate();
  return true;
}

async function reapplyPreparacionToTimer() {
  if (!state.timer || state.timer.phase !== 'ready') return;
  await applyPreparacionToLive(prepForMatch(state.timer.matchId));
}

async function prepareLive() {
  const selectedMatchId = $('#live-select')?.value || '';
  const match = state.matches.find((item) => item.id === selectedMatchId);
  if (!match) return toast('Selecciona un partido.');
  const callup = callupForMatch(match);
  if (!callup) return toast('Ese partido no tiene una convocatoria disponible en este dispositivo.');
  const availableIds = Array.isArray(callup.availableIds) ? callup.availableIds : [];
  const format = String(callup.format || match.format || state.format || 'F7').toUpperCase();
  const config = FORMATS[format] || FORMATS.F7;
  if (!config) return toast('No se reconoce el formato del partido.');
  if (availableIds.length < config.players) return toast(`Faltan jugadores: ${format} necesita ${config.players} en campo.`);
  const prep = prepForMatch(match.id);
  if (prep?.team?.length) {
    await applyPreparacionToLive(prep);
    return;
  }
  const firstKeeper = $('#first-keeper')?.value;
  const secondKeeper = $('#second-keeper')?.value;
  if (!firstKeeper || !secondKeeper) return toast('Selecciona el portero de cada tiempo.');
  if (!availableIds.includes(firstKeeper) || !availableIds.includes(secondKeeper)) return toast('Los porteros deben estar convocados.');
  liveTactic = null; // reinicia la pizarra para no arrastrar la alineación del partido anterior
  const fieldCandidates = availableIds.filter((id) => id !== firstKeeper && id !== secondKeeper);
  const remainingCandidates = availableIds.filter((id) => id !== firstKeeper && !fieldCandidates.includes(id));
  const initialFieldPlayers = [...fieldCandidates, ...remainingCandidates].slice(0, config.players - 1);
  const initialOnField = [firstKeeper, ...initialFieldPlayers];
  state.timer = { matchId: match.id, elapsed: 0, runningSince: null, phase: 'ready', initialOnField, onField: [...initialOnField], events: [], firstKeeper, secondKeeper, autoPaused: false, delegateUnlocked: false, details: { goalsFor: 0, goalsAgainst: 0, goals: [], cards: [], injuries: [], incidents: [], comments: '', minuteReasons: {} } };
  await persistTimer(); renderLive();
}

async function persistTimer() {
  state.timer.updatedAt = Date.now();
  state.liveUpdatedAt = state.timer.updatedAt;
  await put('settings', { id: 'live', timer: state.timer, updatedAt: state.timer.updatedAt });
}
function startTicks() {
  clearInterval(state.tick);
  if (!state.timer?.runningSince) return;
  state.tick = setInterval(async () => {
    const seconds = timerSeconds();
    for (const clock of [$('#clock'), $('#delegate-clock')].filter(Boolean)) clock.textContent = formatMatchClock(seconds);
    const played = livePlayedSeconds();
    $$('[data-player-clock]').forEach((element) => { element.textContent = formatMatchClock(played[element.dataset.playerClock] ?? 0); });

    // Actualizar barras de progreso y etiquetas de minutos en tiempo real
    const callup = liveCallup();
    if (callup) {
      const config = FORMATS[callup.format] || FORMATS.F7;
      const targets = liveTargets();
      const targetMap = new Map(targets.map((t) => [t.playerId, t.minutes]));
      const defaultTarget = Math.round((config.duration * config.players) / (callup.availableIds?.length || 1));

      $$('[data-player-progress]').forEach((bar) => {
        const id = bar.dataset.playerProgress;
        const sec = played[id] ?? 0;
        const tMin = targetMap.get(id) ?? defaultTarget;
        const pct = Math.min(100, Math.round((sec / ((tMin || 1) * 60)) * 100));
        bar.style.width = `${pct}%`;
        bar.className = `live-bar-fill ${pct >= 100 ? 'prog-complete' : pct >= 60 ? 'prog-good' : pct >= 30 ? 'prog-mid' : 'prog-low'}`;
      });

      $$('[data-player-min-label]').forEach((lbl) => {
        const id = lbl.dataset.playerMinLabel;
        const sec = played[id] ?? 0;
        const tMin = targetMap.get(id) ?? defaultTarget;
        lbl.textContent = `${Math.round(sec / 60)} / ${tMin} min`;
      });

      $$('[data-player-pct-label]').forEach((lbl) => {
        const id = lbl.dataset.playerPctLabel;
        const sec = played[id] ?? 0;
        const tMin = targetMap.get(id) ?? defaultTarget;
        const pct = Math.min(100, Math.round((sec / ((tMin || 1) * 60)) * 100));
        lbl.textContent = `(${pct}%)`;
      });
    }
    if (shouldAutoPause(state.timer.phase, seconds)) {
      state.timer.elapsed = state.timer.phase === 'first_half' ? 38 * 60 : 74 * 60;
      state.timer.runningSince = null;
      state.timer.autoPaused = true;
      if (state.timer.phase === 'first_half') state.timer.phase = 'halftime';
      await persistTimer();
      renderLive(); renderDelegate();
      return toast(state.timer.phase === 'halftime' ? 'Pausa automática al minuto 38.' : 'Pausa automática al minuto 74. Finaliza el partido cuando corresponda.');
    }
    maybeShowUrgentSubstitution(played, seconds);
    maybeShowMinuteAlert(played, seconds);
    maybeShowRepartoAlert(seconds);
  }, 1000);
}

function maybeShowRepartoAlert(elapsedSeconds) {
  if (!state.timer || state.timer.phase === 'halftime' || state.timer.phase === 'ready') return;
  const callup = liveCallup();
  if (!callup?.availableIds?.length) return;
  const config = FORMATS[callup.format];
  const remainingSeconds = Math.max(0, config.duration * 60 - elapsedSeconds);
  if (remainingSeconds > 10 * 60) return;
  const played = livePlayedSeconds();
  const bench = callup.availableIds.filter((id) => !state.timer.onField.includes(id));
  const suggestion = suggestRepartoSubstitutions(state.timer.onField, bench, played, liveTargets(), liveKeeperIds());
  if (!suggestion.inIds.length) return;
  const key = `${state.timer.events.length}:${suggestion.inIds.join(',')}`;
  if (state.repartoAlertKey === key) return;
  state.repartoAlertKey = key;
  toast(`Quedan ${Math.ceil(remainingSeconds / 60)} min: hay ${suggestion.inIds.length} cambio(s) pendientes para completar el reparto. Pulsa «Proponer reparto».`);
}

function maybeShowMinuteAlert(played, elapsedSeconds) {
  if (!state.timer || state.timer.phase === 'halftime' || state.timer.phase === 'ready') return;
  const minute = Math.floor(elapsedSeconds / 60);
  if (minute < 1 || minute % 5 !== 0) return;
  const alertKey = `min-${minute}`;
  if (state.timer.lastMinuteAlert === alertKey) return;
  state.timer.lastMinuteAlert = alertKey;
  const match = state.matches.find(({ id }) => id === state.timer.matchId);
  const callup = callupForMatch(match);
  if (!callup) return;
  const onField = state.timer.onField;
  const bench = callup.availableIds.filter((id) => !onField.includes(id));
  const least = [...onField, ...bench].sort((a, b) => (played[a] ?? 0) - (played[b] ?? 0));
  const low = least.filter((id) => (played[id] ?? 0) < minute * 60 - 5 * 60).slice(0, 3);
  if (!low.length) return;
  toast(`Minuto ${minute}: ${low.map((id) => `${playerName(id)} (${Math.floor((played[id] ?? 0) / 60)} min)`).join(', ')} ha(n) jugado menos.`);
}

function maybeShowUrgentSubstitution(played, elapsedSeconds) {
  if (!state.delegateMode || !state.timer || state.timer.phase === 'halftime') return;
  const match = state.matches.find(({ id }) => id === state.timer.matchId);
  const callup = callupForMatch(match);
  if (!callup) return;
  const config = FORMATS[callup.format];
  const benchIds = callup.availableIds.filter((id) => !state.timer.onField.includes(id));
  const remainingSeconds = Math.max(0, config.duration * 60 - elapsedSeconds);
  if (!shouldSuggestUrgentSubstitution(benchIds, played, remainingSeconds)) return;
  const suggestion = suggestDelegateSubstitution(state.timer.onField, benchIds, played, 1, liveKeeperIds());
  const key = `${state.timer.events.length}:${suggestion.inIds[0] ?? ''}`;
  if (!suggestion.inIds.length || state.urgentAlertKey === key) return;
  state.urgentAlertKey = key;
  $('#urgent-message').textContent = `${playerName(suggestion.inIds[0])} lleva ${Math.floor((played[suggestion.inIds[0]] ?? 0) / 60)} min y quedan ${Math.ceil(remainingSeconds / 60)}. Puede entrar por ${playerName(suggestion.outIds[0])}.`;
  $('#urgent-dialog').showModal();
}
async function advanceLivePhase() {
  if (state.timer.phase === 'ready') {
    const callup = liveCallup();
    const config = FORMATS[callup.format];
    const lineup = (liveTactic?.team || []).map((p) => p.playerId).filter(Boolean);
    if (lineup.length !== config.players || new Set(lineup).size !== config.players || !lineup.includes(state.timer.firstKeeper)) {
      return toast(`Completa la alineación de ${config.players} jugadores con el portero antes de comenzar.`);
    }
    state.timer.initialOnField = [...lineup];
    state.timer.onField = [...lineup];
    state.timer.phase = 'first_half';
    state.timer.runningSince = Date.now();
    await persistTimer();
    renderLive(); renderDelegate();
    return toast('Partido en marcha.');
  }
  if (state.timer.phase === 'first_half') {
    state.timer.elapsed = timerSeconds();
    state.timer.runningSince = null;
    state.timer.phase = 'halftime';
    state.timer.autoPaused = false;
    await persistTimer();
    renderLive(); renderDelegate();
    return toast('Primer tiempo finalizado. Descanso.');
  }
  if (state.timer.phase === 'halftime') {
    const { firstKeeper, secondKeeper } = state.timer;
    // Fase B: aplica la alineación del 2º tiempo ajustada en la pizarra (quién entra/sale).
    syncTimerFromLiveTactic();
    if (secondKeeper && firstKeeper !== secondKeeper && !state.timer.onField.includes(secondKeeper)) {
      const keeperOut = state.timer.onField.includes(firstKeeper) ? firstKeeper : state.timer.onField.find((id) => normalizePositions(state.players.find((player) => player.id === id)).includes('Portero'));
      if (keeperOut) {
        state.timer.events.push({ second: state.timer.elapsed, outIds: [keeperOut], inIds: [secondKeeper], source: 'goalkeeper_rotation' });
        const matchCallup = liveCallup();
        state.timer.onField = applySubstitution(state.timer.onField, [keeperOut], [secondKeeper], matchCallup?.availableIds ?? [], 7);
        ensureLiveDetails().minuteReasons[keeperOut] = 'goalkeeper_rotation';
        ensureLiveDetails().minuteReasons[secondKeeper] = 'goalkeeper_rotation';
      }
    }
    state.timer.phase = 'second_half';
    state.timer.runningSince = Date.now();
    state.timer.autoPaused = false;
    syncLiveTacticFromTimer();
    await persistTimer();
    renderLive(); renderDelegate();
    return toast('Segundo tiempo en marcha.');
  }
  return finishMatch();
}

async function makeSubstitution() {
  const outIds = checkedValues('sub-out'); const inIds = checkedValues('sub-in');
  const match = state.matches.find((item) => item.id === state.timer.matchId);
  const callup = callupForMatch(match);
  try {
    const nextOnField = applySubstitution(state.timer.onField, outIds, inIds, callup?.availableIds ?? [], 7);
    const second = timerSeconds();
    state.timer.events.push({ second, outIds, inIds });
    state.timer.onField = nextOnField;
    syncLiveTacticFromTimer();
    await persistTimer(); renderLive(); toast('Cambio registrado.');
  } catch (error) { toast(error.message); }
}

async function finishMatch() {
  if (state.finishing || !state.timer) return;
  if (state.timer.runningSince) {
    state.timer.elapsed = timerSeconds();
    state.timer.runningSince = null;
    await persistTimer();
  }
  if (!roleCanUseOwnerFeatures(state.role)) {
    renderLive(); renderDelegate();
    return toast('Partido pausado. Solo Migue puede finalizarlo.');
  }
  state.finishing = true;
  try {
    const totals = calculatePlayedSeconds(state.timer.initialOnField, state.timer.events, state.timer.elapsed);
    const match = state.matches.find((item) => item.id === state.timer.matchId);
    const callup = callupForMatch(match);
    if (!match || !callup) return;
    const details = ensureLiveDetails();
    const maximum = Math.max(...Object.values(totals));
    const missingReason = callup.availableIds.find((id) => (totals[id] ?? 0) < maximum && !details.minuteReasons[id]);
    if (missingReason) details.minuteReasons[missingReason] = 'sin_indicar';
    const players = state.players.filter(({ id }) => callup.availableIds.includes(id));
    const updatedPlayers = players.map((player) => accumulateSeasonMinutes(player, match.date, totals[player.id] ?? 0, { matchId: match.id, reason: details.minuteReasons[player.id], preseason: isPreseasonMatch(match) }));
    const completedMatch = { ...match, status: 'finished', playedSeconds: state.timer.elapsed, minuteTotals: totals, ratings: match.ratings ?? null, substitutionEvents: state.timer.events, goalsFor: details.goalsFor, goalsAgainst: details.goalsAgainst, goals: details.goals, cards: details.cards, injuries: details.injuries, incidents: details.incidents, comments: details.comments, minuteReasons: details.minuteReasons, goalkeeperRotation: { firstKeeper: state.timer.firstKeeper, secondKeeper: state.timer.secondKeeper }, finishedAt: Date.now() };
    const existingAttendance = state.trainings.find((record) => record.kind === 'match' && record.matchId === match.id);
    const trainingRecords = [];
    if (!existingAttendance) {
      const values = { date: match.date.slice(0, 10), notes: 'Registro creado automáticamente al finalizar el partido.' };
      for (const id of callup.availableIds) values[`status-${id}`] = 'present';
      trainingRecords.push(buildAttendanceRecord(
        state.players.filter(({ id }) => callup.availableIds.includes(id)),
        values,
        { id: uid(), kind: 'match', matchId: match.id, createdAt: Date.now() },
      ));
    }
    await putBatch({ players: updatedPlayers, matches: [completedMatch], trainings: trainingRecords, settings: [{ id: 'live', timer: null, updatedAt: Date.now() }] });
    state.timer = null; clearInterval(state.tick); liveTactic = null; await refresh();
    closeDelegateMode(); showView('partido');
    toast('Partido finalizado. Puedes puntuar a los jugadores desde el detalle del partido cuando quieras.');
  } finally {
    state.finishing = false;
  }
}

async function saveMatchRatings(event) {
  event.preventDefault();
  if (state.finishing) return;
  if (state.ratingMatchId) return saveRateMatch(event);
  if (!state.timer) return;
  state.finishing = true;
  try {
  const totals = calculatePlayedSeconds(state.timer.initialOnField, state.timer.events, state.timer.elapsed);
  const match = state.matches.find((item) => item.id === state.timer.matchId);
  const callup = callupForMatch(match);
  if (!match || !callup) return;
  const details = ensureLiveDetails();
  const players = state.players.filter(({ id }) => callup.availableIds.includes(id));
  const values = formObject(event.target.closest('form'));
  const ratingValues = Object.fromEntries(players.map(({ id }) => [id, values[`rating-${id}`]]));
  const rated = buildPlayerRatings(players, ratingValues, { role: state.role, matchId: match.id, date: match.date, opponent: match.opponent });
  const updatedPlayers = rated.players.map((player) => accumulateSeasonMinutes(player, match.date, totals[player.id] ?? 0, { matchId: match.id, reason: details.minuteReasons[player.id], preseason: isPreseasonMatch(match) }));
  const completedMatch = { ...match, status: 'finished', playedSeconds: state.timer.elapsed, minuteTotals: totals, ratings: rated.ratings, substitutionEvents: state.timer.events, goalsFor: details.goalsFor, goalsAgainst: details.goalsAgainst, goals: details.goals, cards: details.cards, injuries: details.injuries, incidents: details.incidents, comments: details.comments, minuteReasons: details.minuteReasons, goalkeeperRotation: { firstKeeper: state.timer.firstKeeper, secondKeeper: state.timer.secondKeeper }, finishedAt: Date.now() };
  const existingAttendance = state.trainings.find((record) => record.kind === 'match' && record.matchId === match.id);
  const trainingRecords = [];
  if (!existingAttendance) {
    const values = { date: match.date.slice(0, 10), notes: 'Registro creado automáticamente al finalizar el partido.' };
    for (const id of callup.availableIds) values[`status-${id}`] = 'present';
    trainingRecords.push(buildAttendanceRecord(
      state.players.filter(({ id }) => callup.availableIds.includes(id)),
      values,
      { id: uid(), kind: 'match', matchId: match.id, createdAt: Date.now() },
    ));
  }
  await putBatch({ players: updatedPlayers, matches: [completedMatch], trainings: trainingRecords, settings: [{ id: 'live', timer: null, updatedAt: Date.now() }] });
  $('#rating-dialog').close();
  state.timer = null; clearInterval(state.tick); await refresh(true);
  renderMatches();
  renderPlayers();
  renderTrainings();
  closeDelegateMode(); showView('partido');
  toast(`Partido y puntuaciones guardados. Temporada ${seasonKey(match.date)} actualizada.`);
  } finally {
    state.finishing = false;
  }
}

function openRateMatch(matchId) {
  const match = state.matches.find((item) => item.id === matchId);
  if (!match) return;
  if (!roleCanUseOwnerFeatures(state.role)) return toast('Solo Migue puede puntuar a los jugadores.');
  const callup = callupForMatch(match);
  const players = state.players.filter(({ id }) => (callup?.availableIds ?? []).includes(id));
  if (!players.length) return toast('Este partido no tiene convocados para puntuar.');
  state.ratingMatchId = matchId;
  $('#rating-match-name').textContent = `Puntuación contra ${match.opponent}`;
  $('#rating-players').innerHTML = players.map((player) => {
    const current = match.ratings?.[player.id];
    return `<label>${escapeHtml(player.name)}<select name="rating-${player.id}" required><option value="">Selecciona…</option>${[1, 2, 3, 4, 5].map((rating) => `<option value="${rating}" ${Number(current) === rating ? 'selected' : ''}>${rating}</option>`).join('')}</select></label>`;
  }).join('');
  $('#match-detail-dialog').close();
  $('#rating-dialog').showModal();
}

async function saveRateMatch(event) {
  event.preventDefault();
  if (state.finishing) return;
  const matchId = state.ratingMatchId;
  const match = state.matches.find((item) => item.id === matchId);
  if (!match) return;
  state.finishing = true;
  try {
    const callup = callupForMatch(match);
    const players = state.players.filter(({ id }) => (callup?.availableIds ?? []).includes(id));
    const values = formObject(event.target.closest('form'));
    const ratingValues = Object.fromEntries(players.map(({ id }) => [id, values[`rating-${id}`]]));
    const rated = replacePlayerRatings(players, ratingValues, { role: state.role, matchId: match.id, date: match.date, opponent: match.opponent });
    const updatedMatch = { ...match, ratings: rated.ratings };
    await putBatch({ players: rated.players, matches: [updatedMatch] });
    $('#rating-dialog').close();
    state.ratingMatchId = null;
    await refresh(true);
    renderMatches();
    renderPlayers();
    toast('Puntuaciones guardadas.');
  } finally {
    state.finishing = false;
  }
}

async function saveMatch(event) {
  event.preventDefault(); const form = event.currentTarget; const values = formObject(form); const existing = values.id ? await getOne('matches', values.id) : null;
  const goalsFor = values.goalsFor === '' ? null : Number(values.goalsFor); const goalsAgainst = values.goalsAgainst === '' ? null : Number(values.goalsAgainst);
  const date = composeDateTime24(composeDate(values.dateDay, values.dateMonth, values.dateYear), values.dateHour, values.dateMinute);
  const savedMatch = { ...existing, id: values.id || uid(), date, round: values.round.trim(), type: values.type, venue: values.venue, opponent: values.opponent.trim(), location: values.location.trim(), goalsFor, goalsAgainst, status: (goalsFor !== null && goalsAgainst !== null) ? 'finished' : (existing?.status ?? 'planned'), createdAt: existing?.createdAt ?? Date.now() };
  await put('matches', savedMatch);
  if (existing) {
    const day = date.slice(0, 10);
    for (const record of state.trainings.filter((item) => item.matchId === savedMatch.id)) {
      if (String(record.date || '').slice(0, 10) !== day) await put('trainings', { ...record, date: day, updatedAt: Date.now() });
    }
    for (const callup of state.callups.filter((item) => item.matchId === savedMatch.id || item.id === savedMatch.callupId)) {
      if (String(callup.date || '').slice(0, 10) !== day) await put('callups', { ...callup, date: day, matchType: savedMatch.type, updatedAt: Date.now() });
    }
  }
  form.closest('dialog').close(); form.reset(); await refresh(true); renderMatches(); renderPlayers(); renderTrainings(); toast('Partido guardado.');
}

function renderMatchCard(match) {
  const teams = matchTeams(match);
  const hasGoalsList = Array.isArray(match.goals) && match.goals.length > 0;
  const hasScore = Number.isFinite(match.goalsFor) || Number.isFinite(match.goalsAgainst) || hasGoalsList;
  const gf = Number.isFinite(match.goalsFor) ? match.goalsFor : (hasGoalsList ? match.goals.length : 0);
  const ga = Number.isFinite(match.goalsAgainst) ? match.goalsAgainst : 0;
  const homeScore = teams.mySide === 'home' ? gf : ga;
  const awayScore = teams.mySide === 'away' ? gf : ga;
  return `<article class="panel match-card" data-match-id="${match.id}"><div class="section-head"><div><span class="pill ${match.status === 'finished' ? 'accent' : ''}">${match.status === 'finished' ? 'Finalizado' : 'Programado'}</span> <span class="pill type-${match.type}">${escapeHtml(matchTypeLabel(match.type))}</span> <span class="pill">${match.venue === 'away' ? 'Visitante' : 'Local'}</span><h3>${escapeHtml(teams.home)} — ${escapeHtml(teams.away)}</h3><p class="meta">${escapeHtml(localDate(match.date))}${match.round ? ` · Jornada ${escapeHtml(match.round)}` : ''}${match.location ? ` · ${escapeHtml(match.location)}` : ''}</p></div><div>${hasScore ? `<strong>${homeScore} — ${awayScore}</strong>` : ''}</div></div>${match.ratings ? `<details><summary>Minutos y puntuaciones</summary><table class="minute-table"><tr><th>Jugador</th><th>Min</th><th>1–5</th></tr>${Object.entries(match.minuteTotals ?? {}).map(([id, seconds]) => `<tr><td>${escapeHtml(playerName(id))}</td><td>${Math.round(seconds/60)}</td><td>${match.ratings[id] ?? '—'}</td></tr>`).join('')}</table></details>` : ''}<div class="button-row">${match.status !== 'finished' && !match.callupId ? `<button class="callup-match primary" data-id="${match.id}">Convocar</button>` : ''}<button type="button" class="open-whatsapp-match icon-button accent" data-id="${match.id}">📱 WhatsApp</button><button class="match-detail secondary" data-id="${match.id}">Ver detalle</button><button class="edit-match secondary" data-id="${match.id}">Editar</button><button class="delete-match danger" data-id="${match.id}">Borrar</button></div></article>`;
}

function renderMatches() {
  if (!state.matches.length) {
    $('#matches-list').innerHTML = empty('Añade el calendario de partidos manualmente.');
    return;
  }
  const { upcoming, played } = partitionAndSortMatches(state.matches);
  const upcomingHtml = upcoming.map(renderMatchCard).join('');
  const emptyUpcomingHtml = !upcoming.length && played.length
    ? '<div class="panel empty-notice"><p class="meta">No hay próximos partidos programados.</p></div>'
    : '';

  const wasOpen = $('#played-matches-collapsible')?.open ?? false;
  const playedHtml = played.length ? `
    <details class="panel played-matches-accordion" id="played-matches-collapsible"${wasOpen ? ' open' : ''}>
      <summary class="played-matches-summary">
        <div class="played-matches-head">
          <span class="pill accent">✓</span>
          <h3 class="played-matches-title">Jugados</h3>
          <span class="meta played-matches-count">(${played.length})</span>
        </div>
        <span class="pill secondary played-toggle-pill"></span>
      </summary>
      <div class="stack played-matches-cards">
        ${played.map(renderMatchCard).join('')}
      </div>
    </details>
  ` : '';

  $('#matches-list').innerHTML = `${upcomingHtml}${emptyUpcomingHtml}${playedHtml}`;
}

function editMatch(id) {
  const match = state.matches.find((item) => item.id === id); if (!match) return;
  const form = $('#match-form');
  for (const key of ['id', 'round', 'type', 'venue', 'opponent', 'location', 'goalsFor', 'goalsAgainst']) form.elements[key].value = match[key] ?? (key === 'type' ? 'league' : key === 'venue' ? 'home' : '');
  setDateTimeFields(form, 'date', match.date);
  $('#match-dialog').showModal();
}

// ===== Preparación de partido (pestaña nueva, solo Migue) =====
// Prepara la alineación de varios partidos días antes. Al guardar queda «Preparado»
// y se puede reeditar. Cuando el partido se finaliza, desaparece de la lista.
// Convocatoria y Partido en vivo NO se tocan: aquí solo se LEE la convocatoria.

function preparableMatches() {
  return state.matches
    .filter((match) => (match.callupId || callupForMatch(match)) && match.status !== 'finished')
    .sort((a, b) => a.date.localeCompare(b.date));
}

function prepForMatch(matchId) {
  return state.preparaciones.find((p) => String(p.matchId) === String(matchId)) ?? null;
}

function renderPreparaciones() {
  const root = $('#preparacion-list');
  if (!root) return;
  const matches = preparableMatches();
  if (!matches.length) {
    root.innerHTML = empty('No hay partidos convocados pendientes. Crea una convocatoria en la pestaña Convocatoria.');
    return;
  }
  root.innerHTML = matches.map((match) => {
    const prep = prepForMatch(match.id);
    const estado = prep
      ? '<span class="pill ok">✓ Preparado</span>'
      : '<span class="pill">Sin preparar</span>';
    return `<article class="panel"><div class="section-head"><div><span class="pill accent">${escapeHtml(match.venue === 'away' ? 'Visitante' : 'Local')}</span><h3>${escapeHtml(match.opponent)}</h3><p class="meta">${escapeHtml(localDate(match.date))} · ${estado}</p></div><div class="button-row"><button type="button" class="prep-open primary" data-id="${match.id}">${prep ? 'Editar' : 'Preparar'}</button>${prep ? `<button type="button" class="prep-toggle-delegate secondary" data-id="${match.id}">${prep.delegateShown ? 'Ocultar al Delegado' : 'Mostrar al Delegado'}</button><button type="button" class="prep-delete secondary danger" data-id="${match.id}">Borrar</button>` : ''}</div></div></article>`;
  }).join('');
}

async function togglePrepDelegateForMatch(matchId) {
  const prep = prepForMatch(matchId);
  if (!prep) return;
  prep.delegateShown = !prep.delegateShown;
  prep.savedAt = Date.now();
  await put('settings', prep);
  if (state.timer && String(state.timer.matchId) === String(matchId)) {
    state.timer.delegateUnlocked = prep.delegateShown;
    await persistTimer();
    renderLive();
  } else if (prep.delegateShown) {
    await applyPreparacionToLive(prep);
  }
  await refresh(true);
  renderPreparaciones();
  renderDelegate();
  toast(prep.delegateShown ? 'El delegado ya puede ver el partido.' : 'El delegado ya no ve el partido antes de tiempo.');
}

function prepAvailableIds(matchId) {
  const match = state.matches.find(({ id }) => id === matchId);
  const callup = callupForMatch(match);
  return callup?.availableIds ?? [];
}

function prepBuildTeam(formation, keeperId) {
  return buildLiveState(state.players, prepAvailableIds(prepMatchId), formation, 'F7', keeperId).team;
}

function prepCargarFormacion(team, formation, keeperId) {
  return cargarFormacion(team, state.players, prepAvailableIds(prepMatchId), formation, 'F7');
}

function openPreparacionEditor(matchId) {
  prepMatchId = matchId;
  const match = state.matches.find(({ id }) => id === matchId);
  const prep = prepForMatch(matchId);
  const availableIds = prepAvailableIds(matchId);
  const keeperOptions = availableIds.map((id) => `<option value="${id}">${escapeHtml(playerName(id))}</option>`).join('');
  const firstKeeper = prep?.firstKeeper ?? availableIds.find((id) => normalizePositions(state.players.find((p) => p.id === id)).includes('Portero')) ?? availableIds[0] ?? '';
  const secondKeeper = prep?.secondKeeper ?? firstKeeper;
  const formacion = prep?.formacion ?? '1-3-2-1';
  prepDraft = prep?.team?.length
    ? prep.team.map((p) => ({ ...p }))
    : prepBuildTeam(formacion, firstKeeper);
  const formacionOptions = LIVE_FORMATIONS.map((f) => `<option value="${f}" ${f === formacion ? 'selected' : ''}>${f}</option>`).join('');
  const convocados = availableIds
    .map((id) => state.players.find((p) => p.id === id))
    .filter(Boolean)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'es', { sensitivity: 'base' }))
    .map((pl) => `<span class="suplente">${escapeHtml(pl.number)} ${escapeHtml(pl.name)}</span>`)
    .join('');
  $('#preparacion-editor').innerHTML = `
    <div class="section-head"><div><p class="eyebrow">Preparando</p><h3>${escapeHtml(match.opponent)} · ${escapeHtml(localDate(match.date))}</h3></div><button type="button" id="prep-back" class="secondary">← Volver</button></div>
    <div class="form-row keeper-selectors"><label>Portero 1er tiempo<select id="prep-keeper1">${keeperOptions}</select></label><label>Portero 2º tiempo<select id="prep-keeper2">${keeperOptions}</select></label></div>
    <p class="meta">Puedes elegir a cualquier convocado como portero, aunque su ficha tenga otra posición.</p>
    <div class="panel live-tactics" style="margin-top:1rem">
      <div class="formacion-row"><label for="prep-formacion">Táctica:</label><select id="prep-formacion">${formacionOptions}</select><button type="button" id="prep-gif" class="secondary">▶ Ver táctica (GIF/MP4)</button></div>
      <div class="board-wrap"><svg id="prep-board" viewBox="0 0 100 100" role="img" aria-label="Pizarra de preparación"></svg></div>
      <div class="live-tactics-slots" id="prep-slots"></div>
      <div class="keeper-note"><strong>Regla del portero:</strong> 1 portero juega el partido completo; si hay 2 porteros, un tiempo cada uno. El portero del 1er tiempo entra en portería automáticamente.</div>
      <div class="live-tactics-legend compact"><strong>Leyenda:</strong><span><i class="dot mi"></i>equipo</span><span><i class="dot rival"></i>rival</span><span><i class="dot ball"></i>balón</span><span>toque = elegir jugador</span></div>
    </div>
    <div class="panel" style="margin-top:1rem"><p class="eyebrow" style="margin-bottom:.4rem">Convocados (desde Convocatoria)</p><div class="suplente-list">${convocados || '<span class="meta">Sin convocados.</span>'}</div></div>
    <div class="button-row"><button type="button" id="prep-save" class="primary">Guardar preparación</button><button type="button" id="prep-delegate" class="secondary">${prep?.delegateShown ? 'Ocultar al Delegado' : 'Mostrar al Delegado'}</button>${prep ? '<button type="button" id="prep-delete" class="secondary danger">Borrar preparación</button>' : ''}</div>
    <p class="meta" id="prep-hint">${prep ? 'Preparación guardada. Puedes editarla y volver a guardar.' : 'Completa los 7 titulares (portero incluido) y guarda.'}</p>
    <div class="popup live-tactics-popup" id="prep-popup"><h4 class="live-tactics-popup-title" id="prep-popup-title">Posición</h4><select class="live-tactics-popup-select" id="prep-popup-select"></select></div>
    <div class="lightbox live-tactics-lightbox" id="prep-lightbox"><button type="button" class="lb-close" title="Cerrar">✕</button><div class="lb-controls"><button type="button" class="lb-play" title="Reproducir / Pausar">▶</button><div class="speed"><button type="button" data-s="2" class="on">1×</button><button type="button" data-s="4">2×</button><button type="button" data-s="8">4×</button></div></div></div>`;
  $('#prep-keeper1').value = firstKeeper;
  $('#prep-keeper2').value = secondKeeper;
  $('#preparacion-list').classList.add('hidden');
  $('#preparacion-editor').classList.remove('hidden');
  renderPrepBoard();
  renderPrepSlots();
  wirePrepEditor();
}

function renderPrepBoard() {
  const svg = $('#prep-board');
  if (!svg || !prepDraft) return;
  const parts = [];
  parts.push('<rect class="tac-field" x="4" y="4" width="92" height="92" rx="3"/>');
  parts.push('<path class="tac-line" d="M50 4v92 M4 50h92"/>');
  parts.push('<circle class="tac-line" cx="50" cy="50" r="9"/>');
  parts.push('<rect class="tac-area" x="4" y="4" width="92" height="16"/>');
  parts.push('<rect class="tac-area" x="4" y="80" width="92" height="16"/>');
  parts.push('<rect class="tac-goal" x="40" y="4" width="20" height="4"/>');
  parts.push('<rect class="tac-goal" x="40" y="92" width="20" height="4"/>');
  prepDraft.forEach((p, i) => {
    const pl = playerById(state.players, p.playerId);
    const dorsal = pl ? pl.number : '';
    const label = pl ? nombreCorto(pl.name) : '';
    const labelW = label ? label.length * 1.6 + 1.6 : 0;
    const rectX = p.x - labelW / 2, rectY = p.y + 2.1, rectH = 3.0;
    parts.push(`<g class="tac-player" data-piece="team" data-idx="${i}"><circle cx="${p.x}" cy="${p.y}" r="4.2"/><text x="${p.x}" y="${p.y - 0.4}" class="num">${escapeHtml(dorsal)}</text>${label ? `<rect x="${rectX}" y="${rectY}" width="${labelW}" height="${rectH}" rx="0.6" fill="#000"/><text x="${p.x}" y="${p.y + 3.6}" class="name">${escapeHtml(label)}</text>` : ''}</g>`);
  });
  // Rival (mitad superior).
  const OPP = [{ n: '1', x: 50, y: 10 }, { n: '2', x: 30, y: 24 }, { n: '3', x: 50, y: 20 }, { n: '4', x: 70, y: 24 }, { n: '5', x: 30, y: 40 }, { n: '6', x: 70, y: 40 }, { n: '7', x: 50, y: 44 }];
  OPP.forEach((p) => parts.push(`<g class="tac-opponent"><circle cx="${p.x}" cy="${p.y}" r="4.0"/><text x="${p.x}" y="${p.y + 1.3}" class="tac-opp-num">${escapeHtml(p.n)}</text></g>`));
  parts.push('<g class="tac-ball"><circle cx="50" cy="50" r="2.4" fill="#fff" stroke="#111" stroke-width="0.6"/></g>');
  svg.innerHTML = parts.join('');
}

function renderPrepSlots() {
  const container = $('#prep-slots');
  if (!container || !prepDraft) return;
  const availableIds = prepAvailableIds(prepMatchId);
  const suplentesList = suplentes(state.players, availableIds, prepDraft);
  const filas = prepDraft.map((p, i) => {
    const pl = playerById(state.players, p.playerId);
    const { titulares: tt, suplentes: ss } = opcionesPosicion(state.players, availableIds, prepDraft, p.pos, p.playerId);
    const opts = ['<option value="">— Sin asignar —</option>'];
    for (const x of tt) opts.push(`<option value="${x.id}" ${x.id === p.playerId ? 'selected' : ''}>${escapeHtml(x.number)} ${escapeHtml(x.name)}</option>`);
    if (ss.length) { opts.push('<option disabled>— Suplentes —</option>'); for (const x of ss) opts.push(`<option value="${x.id}" ${x.id === p.playerId ? 'selected' : ''}>${escapeHtml(x.number)} ${escapeHtml(x.name)} (Suplente)</option>`); }
    return `<div class="slot"><div class="slot-head"><span class="pos">${escapeHtml(p.pos)}</span><span class="dorsal">${pl ? 'Dorsal ' + escapeHtml(pl.number) : '—'}</span></div><select data-idx="${i}" aria-label="${escapeHtml(p.pos)}">${opts.join('')}</select></div>`;
  }).join('');
  const suplentesHTML = suplentesList.length ? `<div class="suplentes"><h4>SUPLENTES</h4><div class="suplente-list">${suplentesList.map((pl) => `<span class="suplente">${escapeHtml(pl.number)} ${escapeHtml(pl.name)}</span>`).join('')}</div></div>` : '';
  container.innerHTML = filas + suplentesHTML;
  container.querySelectorAll('select').forEach((sel) => {
    sel.addEventListener('change', () => {
      const idx = Number(sel.dataset.idx);
      const slot = prepDraft[idx];
      if (!canAssignPlayerToSlot(state.players, 'owner', slot.pos, sel.value)) return renderPrepSlots();
      prepDraft = asignarJugador(prepDraft, idx, sel.value);
      if (slot.pos === 'Portero') $('#prep-keeper1').value = sel.value;
      renderPrepSlots(); renderPrepBoard();
    });
  });
}

function prepOpenPopup(idx, clientX, clientY) {
  const popup = $('#prep-popup');
  const select = $('#prep-popup-select');
  const title = $('#prep-popup-title');
  if (!popup || !select || !title || !prepDraft) return;
  const p = prepDraft[idx];
  const availableIds = prepAvailableIds(prepMatchId);
  const { titulares: tt, suplentes: ss } = opcionesPosicion(state.players, availableIds, prepDraft, p.pos, p.playerId);
  const opts = ['<option value="">— Sin asignar —</option>'];
  for (const x of tt) opts.push(`<option value="${x.id}">${escapeHtml(x.number)} ${escapeHtml(x.name)}</option>`);
  if (ss.length) { opts.push('<option disabled>— Suplentes —</option>'); for (const x of ss) opts.push(`<option value="${x.id}">${escapeHtml(x.number)} ${escapeHtml(x.name)} (Suplente)</option>`); }
  title.textContent = p.pos;
  select.innerHTML = opts.join('');
  select.value = p.playerId;
  popup.dataset.idx = idx;
  popup.classList.add('open');
  const w = 240, h = 120;
  popup.style.left = Math.min(window.innerWidth - w - 10, Math.max(10, clientX - w / 2)) + 'px';
  popup.style.top = Math.min(window.innerHeight - h - 10, Math.max(10, clientY - h - 10)) + 'px';
}

function wirePrepEditor() {
  const svg = $('#prep-board');
  if (svg) {
    svg.addEventListener('pointerdown', (e) => {
      const target = e.target.closest('[data-piece]');
      if (target && target.dataset.piece === 'team') svg.dataset._prepIdx = target.dataset.idx;
    });
    svg.addEventListener('pointerup', (e) => {
      const idx = svg.dataset._prepIdx;
      svg.dataset._prepIdx = '';
      if (idx !== undefined && idx !== '') prepOpenPopup(Number(idx), e.clientX, e.clientY);
    });
  }
  const formacion = $('#prep-formacion');
  if (formacion) formacion.addEventListener('change', () => {
    prepDraft = prepCargarFormacion(prepDraft, formacion.value, $('#prep-keeper1').value);
    renderPrepSlots(); renderPrepBoard();
  });
  const keeper1 = $('#prep-keeper1');
  if (keeper1) keeper1.addEventListener('change', () => {
    const keeperIndex = prepDraft.findIndex((position) => position.pos === 'Portero');
    prepDraft = asignarJugador(prepDraft, keeperIndex, keeper1.value);
    renderPrepSlots(); renderPrepBoard();
  });
  const popupSelect = $('#prep-popup-select');
  if (popupSelect) popupSelect.addEventListener('change', () => {
    const popup = $('#prep-popup');
    const idx = Number(popup.dataset.idx);
    popup.classList.remove('open');
    const slot = prepDraft[idx];
    if (!canAssignPlayerToSlot(state.players, 'owner', slot.pos, popupSelect.value)) return;
    prepDraft = asignarJugador(prepDraft, idx, popupSelect.value);
    if (slot.pos === 'Portero') $('#prep-keeper1').value = popupSelect.value;
    renderPrepSlots(); renderPrepBoard();
  });
  const back = $('#prep-back');
  if (back) back.addEventListener('click', () => {
    $('#preparacion-editor').classList.add('hidden');
    $('#preparacion-list').classList.remove('hidden');
    prepDraft = null; prepMatchId = null;
  });
  const save = $('#prep-save');
  if (save) save.addEventListener('click', () => savePreparacion());
  const delegate = $('#prep-delegate');
  if (delegate) delegate.addEventListener('click', () => togglePrepDelegate());
  const del = $('#prep-delete');
  if (del) del.addEventListener('click', () => deletePreparacion());
  const gifBtn = $('#prep-gif');
  const lightbox = $('#prep-lightbox');
  if (gifBtn && lightbox) {
    const closeLb = () => {
      lightbox.classList.remove('open');
      lightbox.querySelectorAll('video').forEach((v) => v.pause());
    };
    gifBtn.addEventListener('click', () => {
      const formacion = $('#prep-formacion').value;
      lightbox.querySelectorAll('video').forEach((n) => n.remove());
      const video = document.createElement('video');
      video.src = TACTICA_MP4[formacion] || TACTICA_MP4['1-3-2-1'];
      video.playsInline = true; video.muted = true; video.loop = true;
      lightbox.appendChild(video);
      lightbox.classList.add('open');
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.play().catch(() => {});
    });
    lightbox.querySelector('.lb-close').addEventListener('click', closeLb);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLb(); });
    const lbPlay = lightbox.querySelector('.lb-play');
    if (lbPlay) lbPlay.addEventListener('click', () => {
      const video = lightbox.querySelector('video');
      if (!video) return;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      if (video.paused) {
        video.play().then(() => { lbPlay.textContent = '⏸'; }).catch(() => { video.controls = true; });
      } else {
        video.pause();
        lbPlay.textContent = '▶';
      }
    });
    lightbox.querySelectorAll('.speed button').forEach((b) => b.addEventListener('click', () => {
      const video = lightbox.querySelector('video');
      if (video) video.playbackRate = parseFloat(b.dataset.s);
      lightbox.querySelectorAll('.speed button').forEach((x) => x.classList.toggle('on', x === b));
    }));
  }
}

async function savePreparacion() {
  if (!prepDraft || !prepMatchId) return toast('No hay preparación activa para guardar.');
  const keeper1 = $('#prep-keeper1')?.value || '';
  const keeper2 = $('#prep-keeper2')?.value || keeper1;
  const formacion = $('#prep-formacion')?.value || '1-3-2-1';
  const keeperIndex = prepDraft.findIndex((position) => position.pos === 'Portero');
  if (keeperIndex >= 0 && keeper1 && prepDraft[keeperIndex].playerId !== keeper1) {
    prepDraft = asignarJugador(prepDraft, keeperIndex, keeper1);
  }
  const onField = prepDraft.map((p) => p.playerId).filter(Boolean);
  if (onField.length !== 7 || new Set(onField).size !== 7 || !onField.includes(keeper1)) {
    return toast('Completa la alineación de 7 jugadores con el portero antes de guardar.');
  }
  const existing = prepForMatch(prepMatchId);
  const record = {
    ...existing,
    id: existing?.id ?? uid(),
    recordType: 'preparacion',
    matchId: prepMatchId,
    firstKeeper: keeper1,
    secondKeeper: keeper2,
    formacion,
    team: prepDraft.map((p) => ({ ...p })),
    delegateShown: existing?.delegateShown ?? false,
    savedAt: Date.now(),
  };
  await put('settings', record);
  await refresh();
  await applyPreparacionToLive(record);
  $('#preparacion-editor')?.classList.add('hidden');
  $('#preparacion-list')?.classList.remove('hidden');
  prepDraft = null; prepMatchId = null;
  renderPreparaciones();
  toast('Preparación guardada.');
}

async function deletePreparacion() {
  await deletePreparacionById(prepMatchId);
}

async function deletePreparacionById(matchId) {
  const existing = prepForMatch(matchId);
  if (!existing) return;
  if (!await askConfirmation({ title: 'Borrar preparación', message: 'Se borrará la preparación de este partido. La convocatoria y el partido no se tocan.', acceptLabel: 'Borrar', danger: true })) return;
  await remove('settings', existing.id);
  await refresh();
  $('#preparacion-editor').classList.add('hidden');
  $('#preparacion-list').classList.remove('hidden');
  prepDraft = null; prepMatchId = null;
  toast('Preparación borrada.');
}

async function togglePrepDelegate() {
  const existing = prepForMatch(prepMatchId);
  const record = {
    ...existing,
    id: existing?.id ?? uid(),
    recordType: 'preparacion',
    matchId: prepMatchId,
    firstKeeper: $('#prep-keeper1').value,
    secondKeeper: $('#prep-keeper2').value,
    formacion: $('#prep-formacion').value,
    team: prepDraft.map((p) => ({ ...p })),
    delegateShown: !(existing?.delegateShown ?? false),
    savedAt: Date.now(),
  };
  await put('settings', record);
  await refresh();
  const preparedIds = record.team.map(({ playerId }) => playerId).filter(Boolean);
  if (preparedIds.length === 7 && new Set(preparedIds).size === 7 && preparedIds.includes(record.firstKeeper)) {
    await applyPreparacionToLive(record);
  }
  $('#prep-delegate').textContent = record.delegateShown ? 'Ocultar al Delegado' : 'Mostrar al Delegado';
  toast(record.delegateShown ? 'El delegado ya puede ver el partido.' : 'El delegado ya no ve el partido.');
}

function showMatchDetail(id) {
  const match = state.matches.find((item) => item.id === id); if (!match) return;
  const teams = matchTeams(match);
  const hasGoalsList = Array.isArray(match.goals) && match.goals.length > 0;
  const gf = Number.isFinite(match.goalsFor) ? match.goalsFor : (hasGoalsList ? match.goals.length : 0);
  const ga = Number.isFinite(match.goalsAgainst) ? match.goalsAgainst : 0;
  const homeScore = teams.mySide === 'home' ? gf : ga;
  const awayScore = teams.mySide === 'away' ? gf : ga;
  const callup = state.callups.find((item) => item.id === match.callupId || item.matchId === match.id);
  const availableIds = callup?.availableIds ?? state.players.map((p) => p.id);
  const playerOptions = `<option value="__pp__">⚽ Gol P.P. (Propia puerta)</option>` + availableIds.map((pid) => `<option value="${pid}">${escapeHtml(playerName(pid))}</option>`).join('');
  const assistantOptions = `<option value="">Sin asistencia</option>` + availableIds.map((pid) => `<option value="${pid}">${escapeHtml(playerName(pid))}</option>`).join('');
  const eventList = (items, label, kind) => {
    const list = (items ?? []).map((item, i) => {
      let mainText = escapeHtml(playerName(item.playerId));
      if (kind === 'goal') {
        const typePrefix = item.isPenalty ? '🎯 Gol de penalti: ' : (item.isOwnGoal ? '🥅 Gol P.P.: ' : '');
        mainText = typePrefix + mainText;
        if (item.assistantId) mainText += ` · Asistencia: ${escapeHtml(playerName(item.assistantId))}`;
      } else if (kind === 'incident') {
        if (item.type === 'penalty_miss') mainText = `❌🎯 Penalti fallado: ${mainText}`;
        else if (item.type === 'penalty_saved') mainText = `🧤🚫 Penalti parado: ${mainText}`;
        else if (item.type === 'penalty_conceded') mainText = `🧤⚽ Penalti encajado: ${mainText}`;
      }
      return `<li>${mainText}${item.note ? ` · ${escapeHtml(item.note)}` : ''} <button type="button" class="icon-button remove-match-event" data-kind="${kind}" data-index="${i}" aria-label="Quitar">×</button></li>`;
    }).join('');
    return `<section><h4>${label}</h4>${list ? `<ul class="plain-list">${list}</ul>` : '<p class="meta">Sin registros.</p>'}</section>`;
  };
  $('#match-detail-title').textContent = `${teams.home} — ${teams.away}`;
  $('#match-detail-dialog').dataset.matchId = match.id;
  $('#match-detail-body').innerHTML = `
    <p class="meta">${escapeHtml(localDate(match.date))}${match.round ? ` · Jornada ${escapeHtml(match.round)}` : ''} · ${escapeHtml(matchTypeLabel(match.type))} · ${match.venue === 'away' ? 'Visitante' : 'Local'}</p>
    <div class="stadium-score"><section class="score-team"><span>${escapeHtml(teams.home)}</span><strong>${homeScore ?? 0}</strong></section><span class="score-separator">—</span><section class="score-team"><span>${escapeHtml(teams.away)}</span><strong>${awayScore ?? 0}</strong></section></div>
    <div class="event-editor"><label>Jugador<select id="detail-event-player">${playerOptions}</select></label><label>Tipo<select id="detail-event-kind"><option value="goal">⚽ Gol</option><option value="penalty_goal">🎯⚽ Gol de penalti</option><option value="penalty_miss">❌🎯 Penalti fallado</option><option value="penalty_saved">🧤🚫 Penalti parado (portero)</option><option value="penalty_conceded">🧤⚽ Penalti encajado (gol rival)</option><option value="own_goal">🥅 Gol P.P. (Propia puerta)</option><option value="yellow">🟨 Tarjeta amarilla</option><option value="red">🟥 Tarjeta roja</option><option value="injury">🩹 Lesión</option><option value="incident">📋 Incidencia</option></select></label><label>Asistencia<select id="detail-event-assistant">${assistantOptions}</select></label><label>Detalle<input id="detail-event-note" maxlength="200" placeholder="Opcional"></label><button class="add-detail-event primary" data-id="${match.id}">Añadir</button></div>
    ${eventList(match.goals, 'Goles', 'goal')}
    ${eventList(match.cards, 'Tarjetas', 'card')}
    ${eventList(match.injuries, 'Lesiones', 'injury')}
    ${eventList(match.incidents, 'Incidencias', 'incident')}
    ${match.status === 'finished' ? `<div class="button-row"><button class="rate-match secondary" data-id="${match.id}">Puntuar jugadores</button><button class="reopen-match secondary" data-id="${match.id}">Reabrir partido (volver a jugarlo)</button></div>` : ''}
  `;
  $('#match-detail-dialog').showModal();
}

async function reopenMatch(id) {
  const match = state.matches.find((item) => item.id === id); if (!match) return;
  if (!await askConfirmation({ title: 'Reabrir partido', message: 'Se limpiarán los goles, tarjetas, lesiones y puntuaciones de este partido para poder volver a jugarlo. Los minutos y puntuaciones ya acumulados en las fichas de los jugadores no se revierten.', acceptLabel: 'Reabrir', danger: true })) return;
  await put('matches', { ...match, status: 'planned', goalsFor: null, goalsAgainst: null, goals: [], cards: [], injuries: [], incidents: [], ratings: null, minuteTotals: null, substitutionEvents: [], comments: '', minuteReasons: {} });
  await refresh(true);
  renderMatches();
  renderPlayers();
  $('#match-detail-dialog').close();
  toast('Partido reabierto. Ya puedes prepararlo en vivo.');
}

async function addDetailEvent(matchId) {
  const match = state.matches.find((item) => item.id === matchId); if (!match) return;
  let playerId = $('#detail-event-player').value;
  const kind = $('#detail-event-kind').value;
  const assistantId = $('#detail-event-assistant')?.value || '';
  const note = $('#detail-event-note').value.trim();
  if (kind === 'own_goal') playerId = '__pp__';
  if (!playerId) return toast('Selecciona un jugador o Gol P.P.');
  const next = { ...match };
  const isGoal = kind === 'goal' || kind === 'penalty_goal' || kind === 'own_goal' || playerId === '__pp__';
  if (isGoal) {
    const isPp = kind === 'own_goal' || playerId === '__pp__';
    const isPenalty = kind === 'penalty_goal';
    const effectivePlayerId = isPp ? '__pp__' : playerId;
    next.goals = [...(next.goals ?? []), {
      playerId: effectivePlayerId,
      assistantId: isPp ? '' : (assistantId === effectivePlayerId ? '' : assistantId),
      note,
      second: 0,
      isOwnGoal: isPp,
      isPenalty,
    }];
    next.goalsFor = (Number(next.goalsFor) || 0) + 1;
    if (!Number.isFinite(next.goalsAgainst)) next.goalsAgainst = 0;
  } else if (kind === 'penalty_conceded') {
    next.incidents = [...(next.incidents ?? []), { playerId, note: note || 'Penalti encajado', type: 'penalty_conceded' }];
    next.goalsAgainst = (Number(next.goalsAgainst) || 0) + 1;
    if (!Number.isFinite(next.goalsFor)) next.goalsFor = 0;
  } else if (kind === 'penalty_miss') {
    next.incidents = [...(next.incidents ?? []), { playerId, note: note || 'Penalti fallado', type: 'penalty_miss' }];
  } else if (kind === 'penalty_saved') {
    next.incidents = [...(next.incidents ?? []), { playerId, note: note || 'Penalti parado', type: 'penalty_saved' }];
  } else if (kind === 'injury') {
    next.injuries = [...(next.injuries ?? []), { playerId, note }];
  } else if (kind === 'incident') {
    next.incidents = [...(next.incidents ?? []), { playerId, note }];
  } else {
    next.cards = [...(next.cards ?? []), { playerId, note, type: kind }];
  }
  await put('matches', next);
  await refresh(true);
  renderPlayers();
  renderMatches();
  showMatchDetail(matchId);
  const toastMsg = kind === 'penalty_goal' ? 'Gol de penalti añadido.' :
    (kind === 'penalty_miss' ? 'Penalti fallado añadido.' :
    (kind === 'penalty_saved' ? 'Penalti parado añadido.' :
    (kind === 'penalty_conceded' ? 'Penalti encajado añadido (suma gol rival).' :
    (playerId === '__pp__' || kind === 'own_goal' ? 'Gol en propia puerta añadido.' :
    (kind === 'goal' ? 'Gol añadido al marcador.' : 'Incidencia añadida.')))));
  toast(toastMsg);
}

async function removeMatchEvent(matchId, kind, index) {
  const match = state.matches.find((item) => item.id === matchId); if (!match) return;
  const next = { ...match };
  const field = kind === 'goal' ? 'goals' : kind === 'card' ? 'cards' : kind === 'injury' ? 'injuries' : 'incidents';
  const items = [...(next[field] ?? [])];
  const removed = items.splice(index, 1)[0];
  next[field] = items;
  if (kind === 'goal' && removed) next.goalsFor = Math.max(0, (Number(next.goalsFor) || 0) - 1);
  if (kind === 'incident' && removed?.type === 'penalty_conceded') next.goalsAgainst = Math.max(0, (Number(next.goalsAgainst) || 0) - 1);
  await put('matches', next);
  await refresh(true);
  renderPlayers();
  renderMatches();
  showMatchDetail(matchId);
  toast('Incidencia eliminada.');
}

function attendanceBuilder(matchId = '', recordId = '') {
  const root = $('#training-builder');
  const existing = state.trainings.find((record) => record.id === recordId || (matchId && record.kind === 'match' && record.matchId === matchId));
  const kind = existing?.kind ?? (matchId ? 'match' : 'training');
  const selectedMatchId = existing?.matchId ?? matchId;
  const match = state.matches.find((item) => item.id === selectedMatchId);
  const callup = callupForMatch(match);
  const players = kind === 'match' ? state.players.filter(({ id }) => callup?.availableIds.includes(id)) : state.players;
  const today = localDateKey();
  const matchOptions = state.matches.filter((item) => item.callupId || callupForMatch(item)).sort((a, b) => b.date.localeCompare(a.date)).map((item) => `<option value="${item.id}" ${item.id === selectedMatchId ? 'selected' : ''}>${escapeHtml(localDate(item.date))} · ${escapeHtml(item.opponent)}</option>`).join('');
  const attendanceByPlayer = Object.fromEntries((existing?.attendance ?? []).map((item) => [item.playerId, item]));
  const rows = players.map((player) => {
    const entry = attendanceByPlayer[player.id] ?? { status: 'present', note: '' };
    return `<div class="check-row attendance-row"><strong>${escapeHtml(player.name)}</strong><select name="status-${player.id}" aria-label="Estado de ${escapeHtml(player.name)}"><option value="present" ${entry.status === 'present' ? 'selected' : ''}>Presente</option><option value="late" ${entry.status === 'late' ? 'selected' : ''}>Tarde</option><option value="absent" ${entry.status === 'absent' ? 'selected' : ''}>Ausente</option></select><div class="arrival-time ${entry.status === 'late' ? '' : 'hidden'}"><span>Hora de llegada</span>${time24Markup(`arrivalTime-${player.id}`, entry.arrivalTime, `Hora de llegada de ${player.name}`)}</div><input name="note-${player.id}" value="${escapeHtml(entry.note)}" maxlength="200" placeholder="Incidencia o comentario" aria-label="Nota de ${escapeHtml(player.name)}"></div>`;
  }).join('');
  root.classList.remove('hidden');
  root.innerHTML = `<form id="training-form"><input type="hidden" name="id" value="${existing?.id ?? ''}"><div class="form-row"><label>Tipo de registro<select name="kind"><option value="training" ${kind === 'training' ? 'selected' : ''}>Entrenamiento</option><option value="match" ${kind === 'match' ? 'selected' : ''}>Partido</option></select></label></div><label class="date-field-full">Fecha${dateMarkup('date', existing?.date ?? match?.date.slice(0, 10) ?? today, 'Fecha del registro')}</label><label class="${kind === 'match' ? '' : 'hidden'}">Partido<select name="matchId" ${kind === 'match' ? 'required' : ''}><option value="">Selecciona…</option>${matchOptions}</select></label>${kind === 'match' && !callup ? '<p class="warning panel">Selecciona un partido con convocatoria.</p>' : `<div class="check-list">${rows}</div>`}<label>Notas del registro<textarea name="notes" maxlength="1000">${escapeHtml(existing?.notes ?? '')}</textarea></label><div class="button-row"><button class="primary">Guardar asistencia</button><button type="button" class="secondary cancel-training">Cancelar</button></div></form>`;
  root.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveTraining(event) {
  event.preventDefault(); const form = event.target.closest('form'); const values = formObject(form);
  const existing = values.id ? state.trainings.find(({ id }) => id === values.id) : null;
  const match = values.kind === 'match' ? state.matches.find(({ id }) => id === values.matchId) : null;
  const callup = callupForMatch(match);
  if (values.kind === 'match' && !callup) return toast('Selecciona un partido con convocatoria.');
  const players = values.kind === 'match' ? state.players.filter(({ id }) => callup.availableIds.includes(id)) : state.players;
  for (const { id } of players) values[`arrivalTime-${id}`] = composeTime24(values[`arrivalTime-${id}Hour`], values[`arrivalTime-${id}Minute`]);
  values.date = composeDate(values.dateDay, values.dateMonth, values.dateYear);
  const record = buildAttendanceRecord(players, values, { id: existing?.id ?? uid(), kind: values.kind, matchId: values.matchId, createdAt: existing?.createdAt ?? Date.now() });
  await put('trainings', record); $('#training-builder').classList.add('hidden'); await refresh(true); renderPlayers(); renderTrainings(); showView('asistencia'); toast('Asistencia guardada y ordenada por fecha.');
}

function renderTrainings() {
  const labels = { present: 'Presente', late: 'Tarde', absent: 'Ausente' };
  const stats = state.players.map((player) => ({ player, stats: calculateAttendanceStats(player.id, state.trainings) }));
  $('#attendance-stats').innerHTML = stats.length ? `<div class="attendance-grid">${stats.map(({ player, stats: item }) => {
    const history = sortAttendanceRecords(state.trainings).map((record) => ({ record, entry: record.attendance?.find(({ playerId }) => playerId === player.id) })).filter(({ entry }) => entry);
    return `<article class="panel attendance-player"><h3>${escapeHtml(player.name)}</h3><div class="mini-stats"><span><strong>${item.totalAbsences}</strong> ausencias</span><span><strong>${item.currentTrainingAbsenceStreak}</strong> racha actual</span><span><strong>${item.longestTrainingAbsenceStreak}</strong> racha máxima</span><span class="${item.oftenLate ? 'alert' : ''}"><strong>${item.lateCount}</strong> tardanzas${item.oftenLate ? ' · frecuente' : ''}</span></div><details><summary>Historial (${item.totalRecords})</summary><table class="minute-table"><tr><th>Fecha</th><th>Actividad</th><th>Estado</th></tr>${history.map(({ record, entry }) => `<tr><td>${escapeHtml(localDate(record.date))}</td><td>${record.kind === 'match' ? `Partido · ${escapeHtml(state.matches.find(({ id }) => id === record.matchId)?.opponent ?? 'eliminado')}` : 'Entrenamiento'}</td><td>${labels[entry.status]}${entry.arrivalTime ? ` · ${escapeHtml(entry.arrivalTime)}` : ''}${entry.note ? ` · ${escapeHtml(entry.note)}` : ''}</td></tr>`).join('')}</table></details></article>`;
  }).join('')}</div>` : empty('Añade jugadores para calcular estadísticas de asistencia.');
  const list = sortAttendanceRecords(state.trainings);
  const wasAttendanceHistoryOpen = $('#attendance-history-collapsible')?.open ?? false;
  $('#trainings-list').innerHTML = list.length ? `
    <details class="panel attendance-history-details" id="attendance-history-collapsible"${wasAttendanceHistoryOpen ? ' open' : ''}>
      <summary class="history-summary">
        <div class="attendance-completed-title">
          <span class="toggle-icon">▶</span>
          <strong>🗄️ Historial de registros de asistencia (${list.length})</strong>
        </div>
        <span class="pill accent">Desplegar</span>
      </summary>
      <div class="stack" style="margin-top: 1rem;">
        ${list.map((record) => {
          const match = state.matches.find(({ id }) => id === record.matchId);
          return `<article class="panel"><div class="section-head"><div><span class="pill ${record.kind === 'match' ? 'accent' : ''}">${record.kind === 'match' ? 'Partido' : 'Entrenamiento'}</span><h3>${record.kind === 'match' ? escapeHtml(match?.opponent ?? 'Partido eliminado') : escapeHtml(localDate(record.date))}</h3><p class="meta">${escapeHtml(localDate(record.date))} · ${record.attendance.filter((item)=>item.status==='present').length} presentes · ${record.attendance.filter((item)=>item.status==='late').length} tarde · ${record.attendance.filter((item)=>item.status==='absent').length} ausentes</p></div><div class="button-row"><button class="edit-attendance secondary" data-id="${record.id}">Editar</button><button class="delete-training danger" data-id="${record.id}">Borrar</button></div></div><details><summary>Ver detalle</summary><table class="minute-table">${record.attendance.map((item) => `<tr><td>${escapeHtml(playerName(item.playerId))}</td><td>${labels[item.status]}${item.note ? ` · ${escapeHtml(item.note)}` : ''}</td></tr>`).join('')}</table>${record.notes ? `<p>${escapeHtml(record.notes)}</p>` : ''}</details></article>`;
        }).join('')}
      </div>
    </details>
  ` : empty('Todavía no hay registros de asistencia.');
}

function exerciseName(id) {
  return state.exercises.find((item) => item.id === id)?.name ?? 'Ejercicio eliminado';
}

function exerciseCardHTML(rawItem) {
  const item = completeExercise(rawItem);
  const list = (values) => `<ul class="plain-list">${values.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ul>`;
  return `<article class="panel exercise-card">
    <div class="exercise-card-head"><div><span class="pill">${escapeHtml(item.category)}</span>${item.code ? `<span class="pill accent">${escapeHtml(item.code)}</span>` : ''}<h3>${escapeHtml(item.name)}</h3></div><button type="button" class="favorite-exercise ${item.favorite ? 'active' : ''}" data-id="${item.id}" aria-label="${item.favorite ? 'Quitar de' : 'Añadir a'} favoritos">${item.favorite ? '★' : '☆'}</button></div>
    <div class="exercise-highlights"><span class="player-count">👥 ${escapeHtml(item.players)}</span><span class="pill accent">${item.duration} min</span><span class="meta">${escapeHtml(item.space)}</span></div>
    <p><strong>Material:</strong> ${escapeHtml(item.material)}</p>
    <p><strong>Intensidad:</strong> ${escapeHtml(item.intensity)}</p>
    <p><strong>Objetivo:</strong> ${escapeHtml(item.objective)}</p>
    <details class="diagram-details" open><summary>Gráfico tipo pizarra</summary>${renderBoardDiagrams(item)}</details>
    <details open><summary>Montaje · antes de llamar a los jugadores</summary><ol class="plain-list">${item.montage.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol></details>
    <details open><summary>Desarrollo paso a paso</summary><ol class="plain-list">${item.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol></details>
    <p><strong>Rotación:</strong> ${escapeHtml(item.rotation)}</p>
    <details><summary>Qué se trabaja</summary>${list(item.works)}</details>
    <p><strong>Qué busco:</strong> ${escapeHtml(item.lookFor)}</p>
    <details><summary>Qué debo observar</summary>${list(item.observe)}</details>
    <details><summary>Correcciones breves</summary>${list(item.corrections)}</details>
    <p><strong>Si sale mal:</strong> ${escapeHtml(item.ifBad)}</p>
    <p><strong>Si sale bien:</strong> ${escapeHtml(item.ifGood)}</p>
    <div class="button-row"><button type="button" class="view-exercise secondary" data-exercise-id="${item.id}">Ver</button><button type="button" class="add-exercise-to-session primary" data-id="${item.id}">Añadir a sesión</button><button type="button" class="edit-exercise secondary" data-id="${item.id}">Editar</button><button type="button" class="delete-exercise danger" data-id="${item.id}">Borrar</button></div>
  </article>`;
}

function setExerciseLibraryMode(mode = 'all') {
  exerciseLibraryMode = mode === 'mine' ? 'mine' : 'all';
  $$('.exercise-library-tab').forEach((button) => {
    const active = button.dataset.exerciseLibraryMode === exerciseLibraryMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  renderExercises();
}

function renderExercises() {
  const form = $('#exercise-filters');
  if (!form) return;

  const allExerciseCount = state.exercises.length;
  const myExerciseCount = state.exercises.filter((item) => item.userCreated === true).length;
  const allCountEl = $('#all-exercises-count');
  if (allCountEl) allCountEl.textContent = `(${allExerciseCount})`;
  const countEl = $('#my-exercises-count');
  if (countEl) countEl.textContent = `(${myExerciseCount})`;
  $$('.exercise-library-tab').forEach((button) => {
    const active = button.dataset.exerciseLibraryMode === exerciseLibraryMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  const filters = {
    formato_juego: form.elements.formato_juego?.value || form.elements.format?.value || 'todos',
    category: form.elements.category.value,
    players: form.elements.players.value,
    material: form.elements.material.value,
    difficulty: form.elements.difficulty.value,
    favorites: form.elements.favorites.checked,
    video: form.elements.video.checked,
  };
  const mineCategorySelected = filters.category === '__mine__';
  if (mineCategorySelected) filters.category = '';

  const humanVideoExerciseIds = new Set(
    state.videos.map(({ exerciseId }) => String(exerciseId || '')).filter(Boolean)
  );
  const withVideoFlags = humanVideoExerciseIds.size
    ? state.exercises.map((item) => (
        humanVideoExerciseIds.has(String(item.id)) && item.hasHumanVideo !== true
          ? { ...item, hasHumanVideo: true }
          : item
      ))
    : state.exercises;

  const filterableExercises = (exerciseLibraryMode === 'mine' || mineCategorySelected)
    ? withVideoFlags.filter((item) => item.userCreated === true)
    : withVideoFlags;

  const exercises = filterExercises(filterableExercises, filters)
    .sort((a, b) => {
      const aIdx = EJERCICIOS_VALIDADOS.findIndex((e) => e.id === a.id);
      const bIdx = EJERCICIOS_VALIDADOS.findIndex((e) => e.id === b.id);
      const aValid = aIdx !== -1, bValid = bIdx !== -1;
      if (aValid && bValid) return aIdx - bIdx;
      if (aValid) return -1;
      if (bValid) return 1;
      return Number(b.favorite) - Number(a.favorite) || a.category.localeCompare(b.category, 'es') || a.name.localeCompare(b.name, 'es');
    });

  const list = $('#exercises-list');
  list.innerHTML = exercises.length ? exercises.map((rawItem) => {
    const validated = findValidatedExercise(rawItem.id);
    if (validated) return renderExerciseGridCard({ ...validated, favorite: Boolean(rawItem.favorite) });
    return exerciseCardHTML(rawItem);
  }).join('') : empty(exerciseLibraryMode === 'mine'
    ? 'Todavía no has creado ejercicios propios con + Ejercicio.'
    : 'No hay ejercicios que coincidan con estos filtros.');
}
function editExercise(id) {
  const item = state.exercises.find((exerciseItem) => exerciseItem.id === id);
  if (!item) return;
  const form = $('#exercise-form');
  for (const key of ['id', 'name', 'category', 'formato_juego', 'format', 'difficulty', 'players', 'duration', 'material', 'space', 'description', 'variants']) {
    if (form.elements[key]) form.elements[key].value = item[key] ?? '';
  }
  $('#exercise-dialog').showModal();
}

async function saveExercise(event) {
  event.preventDefault();
  const form = event.target.closest('form');
  const values = formObject(form);
  const existing = values.id ? state.exercises.find(({ id }) => id === values.id) : null;
  const saved = buildExercise(values, {
    id: existing?.id ?? `${USER_EXERCISE_PREFIX}${uid()}`, favorite: existing?.favorite ?? false,
    createdAt: existing?.createdAt ?? Date.now(), now: Date.now(), diagram: existing?.diagram,
  });
  await put('settings', {
    ...existing,
    ...saved,
    recordType: 'exercise',
    userCreated: true,
    source: 'personal',
    example: false,
  });
  $('#exercise-dialog').close();
  form.reset();
  exerciseLibraryMode = 'mine';
  await refresh();
  showView('ejercicios');
  setExerciseLibraryMode('mine');
  toast(existing ? 'Ejercicio actualizado en Mis ejercicios.' : 'Ejercicio creado y guardado en Mis ejercicios.');
}

function exerciseOptions(selectedId = '', predicate = () => true) {
  return state.exercises.filter(predicate).sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map((item) => `<option value="${item.id}" ${item.id === selectedId ? 'selected' : ''}>${escapeHtml(item.name)} · 👥 ${escapeHtml(item.players)} jugadores · ${item.duration} min</option>`).join('');
}

function syncSessionDraft() {
  const form = $('#session-form');
  if (!form) return;
  const values = formObject(form);
  if (values.dateDay && values.dateMonth && values.dateYear) {
    values.date = composeDate(values.dateDay, values.dateMonth, values.dateYear);
  }
  try {
    values.time = composeTime24(form.elements.timeHour?.value, form.elements.timeMinute?.value, false);
  } catch {
    values.time = '';
  }
  const pitchInput = form.elements.pitch?.value?.trim() || '';
  values.pitch = pitchInput;
  const planTarget = form.querySelector('#session-plan-target') || document.querySelector('#session-plan-target');
  let targetVal = Number(planTarget?.value);
  if (!targetVal || targetVal <= 0) {
    targetVal = Number(form.elements.targetDuration?.value);
  }
  if (!targetVal && pitchInput.toLowerCase().includes('pilar')) {
    targetVal = 75;
  }
  if (targetVal > 0) {
    values.targetDuration = targetVal;
    if (form.elements.targetDuration) form.elements.targetDuration.value = targetVal;
    if (planTarget && document.activeElement !== planTarget) planTarget.value = targetVal;
  }
  if (!values.name?.trim()) {
    values.name = sessionDraftMeta.name?.trim() || 'Entrenamiento';
  }
  sessionDraftMeta = { ...sessionDraftMeta, ...values };
  sessionDraftBlocks = $$('.session-block', form).map((row) => ({
    type: row.querySelector('[name="blockType"]').value,
    exerciseId: row.querySelector('[name="blockExerciseId"]').value,
    duration: Math.max(1, Math.min(240, Number(row.querySelector('[name="blockDuration"]').value) || 10)),
    notes: row.querySelector('[name="blockNotes"]').value.trim(),
  }));
}

function sessionBlockLabel(type) {
  return type === 'warmup' ? 'Calentamiento' : type === 'final' ? 'Juego final' : 'Parte principal';
}

function refreshSessionDurationStatus() {
  const form = $('#session-form');
  const root = form?.querySelector('.session-duration');
  if (!root) return;
  const target = Number(form.elements.targetDuration?.value) > 0 ? Number(form.elements.targetDuration.value) : 60;
  const blocks = $$('[name="blockDuration"]', form).map(({ value }) => ({ duration: Number(value) || 0 }));
  const status = sessionDurationStatus(blocks, target);
  root.className = `session-duration ${status.exact ? 'exact' : 'warning'}`;
  root.innerHTML = `<strong>${status.total} / ${target} min</strong><span>${status.message}</span>`;
}

function renderSessionDraft() {
  const root = $('#session-builder');
  const target = Number(sessionDraftMeta?.targetDuration) > 0 ? Number(sessionDraftMeta.targetDuration) : 60;
  const status = sessionDurationStatus(sessionDraftBlocks, target);
  root.classList.remove('hidden');
  const autoMaterial = calculateSessionTotalMaterial(sessionDraftBlocks, state.exercises);
  if (!sessionDraftMeta.material || sessionDraftMeta.material === sessionDraftMeta._autoMaterial) {
    sessionDraftMeta.material = autoMaterial;
    sessionDraftMeta._autoMaterial = autoMaterial;
  }
  const picker = `<div class="session-exercise-picker"><h3>Añadir ejercicios</h3><p class="meta">Pulsa <strong>+ Añadir</strong> en cada ejercicio. Entra como calentamiento, parte principal o juego final según su categoría.</p><div class="exercise-grid">${state.exercises.map((rawItem) => {
    const item = completeExercise(rawItem);
    return `<article class="panel exercise-card picker-card"
      data-user-created="${rawItem.userCreated === true ? '1' : '0'}"
      data-category="${escapeHtml(item.category || '')}"
      data-formato-juego="${escapeHtml(rawItem.formato_juego || rawItem.format || '')}"
      data-material="${escapeHtml(item.material || '')}"
      data-difficulty="${escapeHtml(rawItem.difficulty || '')}">
      <div class="exercise-card-head"><div><span class="pill">${escapeHtml(item.category)}</span><h3>${escapeHtml(item.name)}</h3></div></div>
      <div class="exercise-highlights"><span class="player-count">👥 ${escapeHtml(item.players)}</span><span class="pill accent">${item.duration} min</span></div>
      <button type="button" class="add-exercise-to-session primary compact" data-id="${item.id}">+ Añadir</button>
    </article>`;
  }).join('')}</div></div>`;
  root.innerHTML = `<form id="session-form" novalidate><input name="id" type="hidden" value="${escapeHtml(sessionDraftMeta?.id ?? '')}"><div class="form-row session-datetime-row"><label class="date-field-full">Fecha de la sesión${dateMarkup('date', sessionDraftMeta?.date ?? '', 'Fecha de la sesión')}</label><label class="time-field-full">Hora de la sesión${time24Markup('time', sessionDraftMeta?.time ?? '', 'Hora de la sesión')}</label></div><div class="form-row session-details-row"><label>Nombre de la sesión<input name="name" maxlength="120" value="${escapeHtml(sessionDraftMeta?.name || 'Entrenamiento')}" placeholder="Ej. Pase, apoyo y finalización (o Entrenamiento)"></label><label>Campo de entrenamiento<input name="pitch" maxlength="80" value="${escapeHtml(sessionDraftMeta?.pitch ?? '')}" placeholder="Ej. Campo 1, Pepe Gonçalvez, Municipal..."></label><div class="form-row"><label>Tiempo total de la sesión (min)<input name="targetDuration" type="number" min="1" max="240" required value="${target}"></label><label>¿Es calentamiento de partido/amistoso?<select name="sessionKind"><option value="training" ${sessionDraftMeta?.sessionKind === 'training' ? 'selected' : ''}>Entrenamiento</option><option value="match-warmup" ${sessionDraftMeta?.sessionKind === 'match-warmup' ? 'selected' : ''}>Calentamiento de partido/amistoso</option></select></label></div></div><div class="session-duration ${status.exact ? 'exact' : 'warning'}" role="status"><strong>${status.total} / ${target} min</strong><span>${status.message}</span></div><fieldset><legend>Bloques de la sesión</legend>${sessionDraftBlocks.length ? sessionDraftBlocks.map((block, index) => `<div class="session-block" data-index="${index}"><input name="blockType" type="hidden" value="${block.type}"><div><span class="pill">${sessionBlockLabel(block.type)}</span><label>Ejercicio<select name="blockExerciseId" required>${exerciseOptions(block.exerciseId)}</select></label></div><label>Duración (min)<input name="blockDuration" type="number" min="1" max="240" required value="${block.duration}"></label><label>Consignas / observaciones<input name="blockNotes" maxlength="300" value="${escapeHtml(block.notes ?? '')}"></label><div class="session-block-actions"><button type="button" class="move-session-block secondary compact" data-index="${index}" data-direction="-1" aria-label="Subir bloque" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" class="move-session-block secondary compact" data-index="${index}" data-direction="1" aria-label="Bajar bloque" ${index === sessionDraftBlocks.length - 1 ? 'disabled' : ''}>↓</button><button type="button" class="remove-session-block danger compact" data-index="${index}">Quitar</button></div></div>`).join('') : '<p class="warning">Añade ejercicios desde la lista de abajo (o guarda la sesión ahora y añade los ejercicios más tarde).</p>'}</fieldset>${picker}<label>Material total (calculado automáticamente)<input name="material" maxlength="300" value="${escapeHtml(sessionDraftMeta?.material ?? '')}" placeholder="Se calcula automáticamente según los ejercicios seleccionados"></label><label>Observaciones generales<textarea name="notes" maxlength="1000">${escapeHtml(sessionDraftMeta?.notes ?? '')}</textarea></label><div class="button-row"><button class="primary" type="submit">Guardar sesión</button><button class="cancel-session secondary" type="button">Cancelar</button></div></form>`;
}

function sessionBuilder(editId = '', seedExerciseId = '', seedMeta = {}) {
  const existing = state.trainingSessions.find(({ id }) => id === editId);
  const defaultTarget = Number(seedMeta.targetDuration) > 0
    ? Number(seedMeta.targetDuration)
    : ((seedMeta.pitch && seedMeta.pitch.toLowerCase().includes('pilar')) ? 75 : 60);
  sessionDraftMeta = existing ? { ...existing } : { id: '', date: seedMeta.date || localDateKey(), time: seedMeta.time || '', pitch: seedMeta.pitch || '', name: seedMeta.name || 'Entrenamiento', targetDuration: defaultTarget, sessionKind: 'training', material: '', notes: '' };
  sessionDraftBlocks = (existing?.blocks ?? []).map((block) => ({ ...block }));
  if (seedExerciseId) {
    const exercise = state.exercises.find(({ id }) => id === seedExerciseId);
    if (exercise) sessionDraftBlocks = addExerciseToSession({ blocks: sessionDraftBlocks }, exercise).blocks;
  }
  const autoMaterial = calculateSessionTotalMaterial(sessionDraftBlocks, state.exercises);
  if (!sessionDraftMeta.material || sessionDraftMeta.material === sessionDraftMeta._autoMaterial) {
    sessionDraftMeta.material = autoMaterial;
    sessionDraftMeta._autoMaterial = autoMaterial;
  }
  renderSessionDraft();
  $('#session-builder').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openAddToSession(exerciseId) {
  pendingExerciseId = exerciseId;
  const form = $('#add-session-form');
  form.reset();
  const today = new Date();
  form.elements.dateDay.value = String(today.getDate()).padStart(2, '0');
  form.elements.dateMonth.value = String(today.getMonth() + 1).padStart(2, '0');
  form.elements.dateYear.value = String(today.getFullYear());
  if (form.elements.timeHour) form.elements.timeHour.innerHTML = selectOptions(24, 1, '', true);
  if (form.elements.timeMinute) form.elements.timeMinute.innerHTML = selectOptions(60, 1, '', true);
  form.elements.existingSessionId.innerHTML = state.trainingSessions.length
    ? sortTrainingSessions(state.trainingSessions, localDateKey()).map((session) => `<option value="${session.id}">${escapeHtml(session.name)} · ${escapeHtml(localDate(session.date))}${session.time ? ` · ⏰ ${session.time}` : ''} · ${session.totalDuration} min</option>`).join('')
    : '<option value="">No hay sesiones guardadas</option>';
  $('#add-session-dialog').showModal();
}

async function saveAddToSession(event) {
  const form = event.target.closest('form');
  const values = formObject(form);
  const exercise = state.exercises.find(({ id }) => id === pendingExerciseId);
  if (!exercise) throw new TypeError('El ejercicio ya no está disponible.');
  if (values.destination === 'existing') {
    const existing = state.trainingSessions.find(({ id }) => id === values.existingSessionId);
    if (!existing) throw new TypeError('Selecciona una sesión existente.');
    const updated = addExerciseToSession(existing, exercise);
    updated.updatedAt = Date.now();
    await put('settings', updated);
    $('#add-session-dialog').close();
    await refresh();
    toast(sessionDurationStatus(updated.blocks).message);
    return;
  }
  if (!values.name.trim()) throw new TypeError('Escribe el nombre de la nueva sesión.');
  let time = '';
  try {
    time = composeTime24(values.timeHour, values.timeMinute, false);
  } catch {
    time = '';
  }
  const pitch = values.pitch?.trim() || '';
  const targetDuration = Number(values.targetDuration) > 0 ? Number(values.targetDuration) : (pitch.toLowerCase().includes('pilar') ? 75 : 60);
  $('#add-session-dialog').close();
  sessionBuilder('', exercise.id, { date: composeDate(values.dateDay, values.dateMonth, values.dateYear), time, pitch, name: values.name, targetDuration });
}

async function saveTrainingSession(event) {
  const form = event.target.closest('form');
  syncSessionDraft();
  const existing = sessionDraftMeta.id ? state.trainingSessions.find(({ id }) => id === sessionDraftMeta.id) : null;
  if (sessionDraftMeta.id && !existing) throw new TypeError('La sesión que intentas editar ya no está disponible. Recarga antes de guardar.');
  const autoMaterial = calculateSessionTotalMaterial(sessionDraftBlocks, state.exercises);
  if (!sessionDraftMeta.material?.trim()) {
    sessionDraftMeta.material = autoMaterial;
  }
  const session = buildFlexibleTrainingSession({ ...sessionDraftMeta, blocks: sessionDraftBlocks }, {
    id: existing?.id ?? uid(), availableExerciseIds: state.exercises.map(({ id }) => id),
    exercises: state.exercises,
    createdAt: existing?.createdAt ?? Date.now(), now: Date.now(),
  });
  await put('settings', session);
  const legacyCandidates = existing
    ? state.trainings.filter((record) => (record.kind ?? 'training') === 'training'
        && !record.sessionId
        && String(record.date || '').slice(0, 10) === String(existing.date || '').slice(0, 10)
        && state.trainingSessions.filter((item) => String(item.date || '').slice(0, 10) === String(existing.date || '').slice(0, 10)).length === 1)
    : [];
  const linkedAttendance = state.trainings.filter((record) => record.sessionId === session.id).concat(legacyCandidates);
  for (const record of linkedAttendance) {
    const nextDate = String(session.date || '').slice(0, 10);
    if (record.sessionId !== session.id || String(record.date || '').slice(0, 10) !== nextDate) {
      await put('trainings', { ...record, sessionId: session.id, date: nextDate, updatedAt: Date.now() });
    }
  }
  form.closest('#session-builder').classList.add('hidden');
  await refresh(true);
  renderTrainingSessions();
  renderPlayers();
  renderTrainings();
  showView('sesiones');
  const status = sessionDurationStatus(session.blocks, session.targetDuration);
  toast(existing ? 'Sesión actualizada.' : 'Sesión creada.');
}

function videosForExercise(exerciseId) {
  return state.videos.filter((video) => video.exerciseId === exerciseId);
}

async function handleVideoUpload(exerciseId, file) {
  if (state.role !== 'owner') return toast('Solo Migue puede subir vídeos.');
  const id = uid();
  const extension = (file.name.split('.').pop() || 'mp4').toLowerCase();
  const path = videoPath(exerciseId, id, extension);
  try {
    await uploadVideo(path, file);
  } catch (error) {
    console.warn('Subida de vídeo fallida:', error.message);
    return toast('No se pudo subir el vídeo. Comprueba la conexión o el almacenamiento.');
  }
  const record = buildVideoRecord(
    { exerciseId, nombre: file.name, path, mime: file.type, size: file.size, orden: videosForExercise(exerciseId).length },
    { id, createdAt: Date.now(), now: Date.now() },
  );
  await put('settings', record);
  await refresh();
  toast('Vídeo subido.');
}

async function handleVideoDelete(videoId) {
  if (state.role !== 'owner') return toast('Solo Migue puede borrar vídeos.');
  const video = state.videos.find(({ id }) => id === videoId);
  if (!video) return;
  if (!await askConfirmation({ title: 'Borrar vídeo', message: 'Se eliminará el vídeo del almacenamiento y de todos los dispositivos.', acceptLabel: 'Borrar', danger: true })) return;
  try {
    await removeVideo(video.path);
  } catch (error) {
    console.warn('Borrado de vídeo fallido:', error.message);
  }
  await remove('settings', videoId);
  await refresh();
  toast('Vídeo eliminado.');
}

function wireExerciseDialogLifecycle(dialog) {
  if (!dialog || dialog._lifecycleWired) return;
  dialog._lifecycleWired = true;

  // Cierre por clic en el backdrop exterior del modal o en cualquier botón con data-close
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
      return;
    }
    const closeBtn = event.target.closest('[data-close]');
    if (closeBtn) {
      dialog.close();
      event.preventDefault();
      event.stopPropagation();
    }
  });

  dialog.addEventListener('pointerup', (event) => {
    const closeBtn = event.target.closest('[data-close]');
    if (closeBtn) {
      dialog.close();
      event.preventDefault();
      event.stopPropagation();
    }
  });

  // Teardown completo al cerrar: previene bloqueos en móviles, libera decodificadores y memoria
  dialog.addEventListener('close', () => {
    // 1. Pausar y forzar descarga inmediata de todos los vídeos (libera recursos de hardware y de red)
    const videos = dialog.querySelectorAll('video');
    videos.forEach((video) => {
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch {}
    });

    // 2. Desactivar modo teatro si estaba activo
    dialog.classList.remove('is-theater-active');

    // 3. Vaciar el contenido DOM del diálogo para que el recolector de basura libere memoria y nodos
    const body = dialog.querySelector('#exercise-detail-body');
    if (body) body.innerHTML = '';

    // 4. Asegurar scroll y pointer-events desbloqueados en el documento
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.pointerEvents = '';
  });
}

function showExerciseDetail(exerciseId) {
  const dialog = $('#exercise-detail-dialog');
  if (dialog) wireExerciseDialogLifecycle(dialog);

  const validated = findValidatedExercise(exerciseId);
  const stickyFooter = dialog?.querySelector('.dialog-sticky-footer');
  if (stickyFooter) {
    stickyFooter.style.display = validated ? 'none' : '';
  }
  if (dialog) {
    dialog.classList.toggle('has-sheet-bottom-bar', Boolean(validated));
  }

  if (validated) {
    $('#exercise-detail-title').textContent = validated.nombre;
    const body = $('#exercise-detail-body');
    body.innerHTML = renderValidatedExerciseHTML(validated, { videos: videosForExercise(exerciseId), role: state.role });
    const sheet = body.querySelector('.ejercicio-v2-sheet') || body;
    initValidatedExerciseViewer(sheet);
    attachLightbox(body);
    initVideoSection(body.querySelector('.videos'), { onUpload: handleVideoUpload, onDelete: handleVideoDelete });
    if (dialog && !dialog.open) dialog.showModal();
    if (dialog) dialog.scrollTop = 0;
    return;
  }
  const item = state.exercises.find(({ id }) => id === exerciseId);
  if (!item) return toast('El ejercicio ya no está disponible.');
  $('#exercise-detail-title').textContent = item.name;
  $('#exercise-detail-body').innerHTML = exerciseCardHTML(item);
  if (dialog && !dialog.open) dialog.showModal();
  if (dialog) dialog.scrollTop = 0;
}

function renderTrainingSessions() {
  const sessions = sortTrainingSessions(state.trainingSessions, localDateKey());
  $('#sessions-list').innerHTML = sessions.length ? sessions.map((session) => {
    const materialText = session.material || calculateSessionTotalMaterial(session.blocks, state.exercises);
    const durationInfo = formatSessionDurationInfo(session.totalDuration, session.targetDuration, session.pitch);
    const badgeExtra = durationInfo.badgeText
      ? `<span class="pill ${durationInfo.status === 'remaining' || durationInfo.status === 'exceeded' ? 'warning' : 'ok'}">${escapeHtml(durationInfo.badgeText)}</span>`
      : '';
    return `
    <article class="panel session-card" data-session-id="${session.id}">
      <div class="section-head">
        <div>
          <span class="pill accent">${durationInfo.pillText}</span>
          ${badgeExtra}
          <h3><button type="button" class="view-session link-button" data-id="${session.id}" aria-label="Ver sesión ${escapeHtml(session.name)}">${escapeHtml(session.name)}</button></h3>
          <p class="meta">${escapeHtml(localDate(session.date))}${session.time ? ` · ⏰ ${session.time}` : ''}${session.pitch ? ` · 🏟️ ${escapeHtml(session.pitch)}` : ''} · ${durationInfo.metaText} · ${session.blocks.length} ${session.blocks.length === 1 ? 'bloque' : 'bloques'}</p>
        </div>
        <div class="button-row">
          <button type="button" class="print-session icon-button secondary" data-id="${session.id}" title="Imprimir o guardar ficha en PDF">🖨️ Imprimir</button>
          <button type="button" class="open-whistle-session icon-button accent" data-id="${session.id}">⏱️ Silbato</button>
          <button type="button" class="open-whatsapp-session icon-button accent" data-id="${session.id}">📱 WhatsApp</button>
          <button type="button" class="view-session secondary" data-id="${session.id}">Ver</button>
          <button type="button" class="edit-session secondary" data-id="${session.id}">Editar</button>
          <button type="button" class="delete-session danger" data-id="${session.id}">Borrar</button>
        </div>
      </div>
      <div class="session-collapsible-header">
        <button type="button" class="toggle-session-blocks secondary compact" data-session-id="${session.id}" aria-expanded="false">
          <span class="toggle-icon">▼</span> <span class="toggle-text">Desplegar ejercicios (${session.blocks.length})</span>
        </button>
      </div>
      <div class="session-plan-collapsible is-collapsed" id="session-plan-${session.id}">
        <ol class="session-plan">
          ${session.blocks.map((block) => `<li><button type="button" class="session-exercise-link" data-exercise-id="${block.exerciseId}" aria-label="Ver ejercicio ${escapeHtml(exerciseName(block.exerciseId))}"><strong>${block.type === 'warmup' ? 'Calentamiento' : block.type === 'main' ? 'Parte principal' : 'Juego final'} · ${block.duration} min</strong><span>${escapeHtml(exerciseName(block.exerciseId))}</span>${block.notes ? `<small>${escapeHtml(block.notes)}</small>` : ''}</button></li>`).join('')}
        </ol>
        <p class="session-meta-line"><strong>Duración:</strong> ${escapeHtml(durationInfo.planText)}</p>
        ${session.pitch ? `<p class="session-meta-line"><strong>Campo de entrenamiento:</strong> 🏟️ ${escapeHtml(session.pitch)}</p>` : ''}
        ${materialText ? `<p class="session-meta-line"><strong>Material:</strong> ${escapeHtml(materialText)}</p>` : ''}
        ${session.notes ? `<p class="session-meta-line"><strong>Observaciones:</strong> ${escapeHtml(session.notes)}</p>` : ''}
      </div>
    </article>
  `;
  }).join('') : empty('Todavía no hay sesiones de entrenamiento guardadas.');
}

function showSessionDetail(sessionId) {
  const session = state.trainingSessions.find(({ id }) => id === sessionId);
  if (!session) return toast('La sesión ya no está disponible.');
  $('#session-detail-title').textContent = session.name || 'Sesión de entrenamiento';
  const durationInfo = formatSessionDurationInfo(session.blocks, session.targetDuration, session.pitch);
  const materialText = session.material || calculateSessionTotalMaterial(session.blocks, state.exercises);
  $('#session-detail-body').innerHTML = `
    <p class="meta session-detail-meta">${escapeHtml(localDate(session.date))}${session.time ? ` · ⏰ ${session.time}` : ''}${session.pitch ? ` · 🏟️ ${escapeHtml(session.pitch)}` : ''} · ${durationInfo.metaText} · ${session.blocks.length} ${session.blocks.length === 1 ? 'bloque' : 'bloques'}</p>
    <div class="session-detail-blocks-list">
      ${session.blocks.map((block, idx) => {
        const validated = findValidatedExercise(block.exerciseId);
        const name = validated?.nombre || exerciseName(block.exerciseId);
        const previewImg = validated?.media?.preview || validated?.preview || '';
        const graphicPreviewVideo = validated?.preview_video || validated?.video_ejercicio || validated?.media?.video || validated?.media?.mp4 || '';
        const previewCrop = validated?.preview_crop || validated?.media_crop || null;
        const previewCropToken = previewCrop
          ? [previewCrop.x, previewCrop.y, previewCrop.width, previewCrop.height, previewCrop.sourceWidth || 1280, previewCrop.sourceHeight || 820].join(',')
          : '';
        const videoSrc = validated?.media?.video || validated?.video_ejercicio || '';
        const category = validated?.categoria || (block.type === 'warmup' ? 'Calentamiento' : block.type === 'main' ? 'Parte principal' : 'Juego final');
        return `<details name="session-detail-accordion" class="session-block-card session-block-accordion panel" data-block-index="${idx}">
          <summary class="session-block-accordion-summary">
            <div class="session-block-summary-left">
              <span class="session-block-badge">${idx + 1}</span>
              <div class="session-block-summary-info">
                <div class="session-block-summary-tags">
                  <span class="pill compact ${block.type === 'warmup' ? 'warmup' : block.type === 'main' ? 'main' : 'accent'}">${sessionBlockLabel(block.type)}</span>
                  <span class="pill accent compact">${block.duration} min</span>
                  ${videoSrc ? '<span class="pill pill-video compact">🎬 MP4</span>' : ''}
                </div>
                <h4 class="session-block-summary-name">${escapeHtml(name)}</h4>
              </div>
            </div>
            <span class="toggle-icon">▶</span>
          </summary>
          <div class="session-block-accordion-body">
            <div class="session-block-card-main">
              ${previewImg
                ? `<div class="session-block-preview"><img src="${escapeHtml(previewImg)}" alt="${escapeHtml(name)}" loading="lazy" data-preview-image="1" data-preview-video-src="${escapeHtml(graphicPreviewVideo)}" data-preview-crop="${escapeHtml(previewCropToken)}"></div>`
                : graphicPreviewVideo
                  ? `<div class="session-block-preview"><canvas class="session-preview-static-canvas" data-preview-video-src="${escapeHtml(graphicPreviewVideo)}" data-preview-crop="${escapeHtml(previewCropToken)}" aria-label="Vista previa de ${escapeHtml(name)}"></canvas></div>`
                  : ''}
              <div class="session-block-card-info">
                <p class="meta session-block-category">${escapeHtml(category)} · 👥 ${escapeHtml(validated?.jugadores?.total || validated?.players || 'Equipo')}</p>
                ${block.notes ? `<p class="session-block-notes"><strong>Consignas:</strong> ${escapeHtml(block.notes)}</p>` : ''}
              </div>
            </div>
            <div class="session-block-card-action">
              <button type="button" class="view-exercise primary compact" data-exercise-id="${block.exerciseId}" aria-label="Ver ejercicio ${escapeHtml(name)} con animación y vídeo MP4">🎬 Ver ejercicio con MP4 / Pizarra</button>
            </div>
          </div>
        </details>`;
      }).join('')}
    </div>
    ${session.pitch ? `<p class="session-meta-line"><strong>Campo de entrenamiento:</strong> 🏟️ ${escapeHtml(session.pitch)}</p>` : ''}
    ${materialText ? `<p class="session-meta-line"><strong>Material necesario:</strong> ${escapeHtml(materialText)}</p>` : ''}
    ${session.notes ? `<p class="session-meta-line"><strong>Observaciones:</strong> ${escapeHtml(session.notes)}</p>` : ''}
    <div class="button-row" style="margin-top:1rem;">
      <button type="button" class="print-session icon-button secondary" data-id="${session.id}">🖨️ Imprimir Ficha de Sesión</button>
      <button type="button" class="edit-session secondary" data-id="${session.id}">✏️ Editar sesión</button>
      <button type="button" class="open-whistle-session primary" data-id="${session.id}">⏱️ Iniciar cronómetro / Silbato</button>
      <button type="button" class="open-whatsapp-session secondary" data-id="${session.id}">📱 Compartir por WhatsApp</button>
    </div>
    <p class="meta" style="margin-top:.6rem;">Toca cualquier ejercicio de la lista para desplegar solo el que quieras consultar.</p>`;
  $('#session-detail-dialog').showModal();
}

function renderTactics() {
  const tactics = sortTactics(state.tactics);
  $('#tactics-list').innerHTML = tactics.length ? tactics.map((tactic) => {
    return `<article class="panel"><div class="section-head"><div><span class="pill accent">${escapeHtml(tactic.format)}</span><h3>${escapeHtml(tactic.name)}</h3><p class="meta">${tactic.rival ? `vs ${escapeHtml(tactic.rival)}` : 'Sin rival'}${tactic.situation ? ` · ${escapeHtml(tactic.situation)}` : ''}</p></div><div class="button-row"><button type="button" class="view-tactic secondary" data-id="${tactic.id}">Ver</button><button type="button" class="edit-tactic secondary" data-id="${tactic.id}">Editar</button><button type="button" class="delete-tactic danger" data-id="${tactic.id}">Borrar</button></div></div>${renderTacticBoard(tactic)}${tactic.notes ? `<p><strong>Notas:</strong> ${escapeHtml(tactic.notes)}</p>` : ''}</article>`;
  }).join('') : '';
  renderTacticasInteractivas();
}

// Renderiza el manual táctico como un selector desplegable que muestra una
// única ficha completa (guía por bloques) al elegir una táctica.
function renderTacticasInteractivas() {
  const root = $('#tacticas-interactivas');
  const select = $('#tactica-filters')?.elements.formacion;
  if (!root) return;

  // Rellenar el selector de tácticas (por nombre).
  if (select) {
    const actual = select.value;
    select.innerHTML = '<option value="">Elige una táctica…</option>' + TACTICAS_INTERACTIVAS.map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.nombre)}</option>`).join('');
    if (actual) select.value = actual;
  }

  const id = select?.value || '';
  if (!id) {
    root.innerHTML = empty('Elige una táctica del manual para ver su guía completa.');
    return;
  }
  const tactica = findTacticaInteractiva(id);
  if (!tactica) {
    root.innerHTML = empty('La táctica seleccionada ya no está disponible.');
    return;
  }
  root.innerHTML = renderTacticaGuiaHTML(tactica);
  initTacticaGuia(root.querySelector('.tactica-guia'), tactica);
}

// Abre una táctica interactiva a pantalla completa (overlay).
function showTacticaInteractiva(id) {
  const tactica = findTacticaInteractiva(id);
  if (!tactica) return toast('La táctica interactiva ya no está disponible.');
  $('#tactica-interactiva-title').textContent = tactica.nombre || 'Táctica interactiva';
  const body = $('#tactica-interactiva-body');
  body.innerHTML = renderTacticaInteractivaHTML(tactica);
  const root = body.querySelector('.tactica-interactiva');
  initTacticaViewer(root);
  attachTacticaLightbox(root);
  $('#tactica-interactiva-overlay').classList.remove('hidden');
}

function closeTacticaInteractiva() {
  $('#tactica-interactiva-overlay').classList.add('hidden');
  $('#tactica-interactiva-body').innerHTML = '';
}

function tacticBuilder(editId = '', formation = '') {
  const existing = state.tactics.find(({ id }) => id === editId);
  const root = $('#tactic-builder');
  root.classList.remove('hidden');
  const t = existing ? { ...existing } : { ...defaultTactic(state.format || 'F7', formation || '1-3-2-1'), name: '', rival: '', situation: '', notes: '' };
  tacticTool = 'select';
  const toolsHTML = `<div class="tactic-tools" role="toolbar" aria-label="Herramientas de la pizarra">${TACTIC_TOOLS.map((tool) => `<button type="button" class="tactic-tool ${tool.id === tacticTool ? 'active' : ''}" data-tactic-tool="${tool.id}" title="${tool.label}">${renderTacticToolIcon(tool.id)}<span class="tactic-tool-label">${tool.label}</span></button>`).join('')}</div>`;
  root.innerHTML = `<form id="tactic-form" class="live-tactics"><input name="id" type="hidden" value="${escapeHtml(t.id || '')}"><div class="form-row"><label>Nombre<input name="name" required maxlength="120" value="${escapeHtml(t.name || '')}" placeholder="Ej. Salida de balón vs Las Palmas"></label><label>Formato<select name="format" required>${TACTIC_FORMATS.map((f) => `<option value="${f}" ${f === t.format ? 'selected' : ''}>Fútbol ${f === 'F7' ? '7' : '11'}</option>`).join('')}</select></label></div><div class="form-row"><label>Formación<select name="formation" required>${FORMATION_NAMES.map((f) => `<option value="${f}" ${f === t.formation ? 'selected' : ''}>${f}</option>`).join('')}</select></label><label>Situación<input name="situation" maxlength="100" value="${escapeHtml(t.situation || '')}" placeholder="Ej. Saque de esquina"></label></div><div class="form-row"><label>Rival<input name="rival" maxlength="100" value="${escapeHtml(t.rival || '')}" placeholder="Ej. Las Palmas"></label></div>${toolsHTML}<div class="section-head"><button type="button" class="secondary tactic-board-full">⛶ Ampliar</button></div>${renderTacticBoard(t)}<label>Notas<textarea name="notes" maxlength="1000">${escapeHtml(t.notes || '')}</textarea></label><div class="button-row"><button class="primary" type="submit">Guardar táctica</button><button class="cancel-tactic secondary" type="button">Cancelar</button></div></form><div class="lightbox live-tactics-lightbox live-tactics" id="tactic-board-lightbox"><button type="button" class="lb-close" title="Cerrar">✕</button><div class="lb-board" style="display:flex;flex-direction:column;align-items:center;gap:.5rem;width:100%"><svg id="tactic-board-full" viewBox="0 0 100 100" role="img" aria-label="Pizarra táctica ampliada" style="background:#0c3b2e;border-radius:8px;touch-action:none"></svg><div class="tactic-tools live-tactics-tools-full" id="tactic-board-tools-full" role="toolbar" aria-label="Herramientas de la pizarra ampliada">${TACTIC_TOOLS.map((tool) => `<button type="button" class="tactic-tool ${tool.id === tacticTool ? 'active' : ''}" data-tactic-tool="${tool.id}" title="${tool.label}">${renderTacticToolIcon(tool.id)}<span class="tactic-tool-label">${tool.label}</span></button>`).join('')}</div></div></div>`;
  initTacticDraft();
  wireTacticBoardFull();
  root.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveTactic(event) {
  event.preventDefault();
  const form = event.target.closest('form');
  const values = formObject(form);
  const existing = values.id ? state.tactics.find(({ id }) => id === values.id) : null;
  const draft = tacticDraft || syncTacticDraft();
  const saved = buildTactic({
    ...values,
    team: draft?.team,
    opponent: draft?.opponent,
    ball: draft?.ball,
    moves: draft?.moves,
  }, {
    id: existing?.id ?? uid(), createdAt: existing?.createdAt ?? Date.now(), now: Date.now(),
  });
  await put('settings', { ...existing, ...saved, recordType: 'tactic' });
  form.closest('#tactic-builder').classList.add('hidden');
  await refresh(true);
  renderTactics();
  showView('tacticas');
  toast(existing ? 'Táctica actualizada.' : 'Táctica creada.');
}

function showTacticDetail(tacticId) {
  const tactic = state.tactics.find(({ id }) => id === tacticId);
  if (!tactic) return toast('La táctica ya no está disponible.');
  $('#tactic-detail-title').textContent = tactic.name || 'Táctica';
  const guide = FORMATION_GUIDES[tactic.formation] || FORMATION_GUIDES['1-3-2-1'];
  const guideHTML = guide ? `
    <details class="tactic-guide" open><summary>${escapeHtml(guide.name)} · qué busco</summary><p>${escapeHtml(guide.queBusco)}</p></details>
    <details class="tactic-guide"><summary>Con balón</summary><ul class="plain-list">${guide.conBalon.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul></details>
    <details class="tactic-guide"><summary>Sin balón / defensa</summary><ul class="plain-list">${guide.sinBalon.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul></details>
    <details class="tactic-guide"><summary>Al perder el balón</summary><ul class="plain-list">${guide.alPerder.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul></details>` : '';
  $('#tactic-detail-body').innerHTML = `<p class="meta">${escapeHtml(tactic.format)}${tactic.rival ? ` · vs ${escapeHtml(tactic.rival)}` : ''}${tactic.situation ? ` · ${escapeHtml(tactic.situation)}` : ''}</p>${renderTacticBoard(tactic)}${guideHTML}${tactic.notes ? `<p><strong>Notas:</strong> ${escapeHtml(tactic.notes)}</p>` : ''}`;
  $('#tactic-detail-dialog').showModal();
}

// Convierte un evento de puntero a coordenadas del viewBox (0..100) del SVG.
function tacticPoint(event, svg) {
  const rect = svg.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  return { x: Math.max(4, Math.min(96, x)), y: Math.max(4, Math.min(96, y)) };
}

// Sincroniza el borrador de la táctica con el estado actual de la pizarra.
function syncTacticDraft() {
  const form = $('#tactic-form');
  if (!form) return;
  const values = formObject(form);
  const base = defaultTactic(values.format || 'F7', values.formation);
  tacticDraft = {
    ...base,
    id: values.id,
    name: values.name,
    rival: values.rival,
    situation: values.situation,
    formation: values.formation,
    team: tacticDraft?.team || base.team,
    opponent: tacticDraft?.opponent || base.opponent,
    ball: tacticDraft?.ball || base.ball,
    moves: tacticDraft?.moves || [],
    notes: values.notes,
  };
  return tacticDraft;
}

// Re-renderiza la pizarra conservando el borrador actual.
function rerenderTacticBoard() {
  const form = $('#tactic-form');
  if (!form) return;
  const board = form.querySelector('.tactic-board');
  if (!board) return;
  const t = tacticDraft || syncTacticDraft();
  board.outerHTML = renderTacticBoard(t);
}

// Inicializa el borrador al abrir el builder.
function initTacticDraft() {
  const form = $('#tactic-form');
  if (!form) return;
  const values = formObject(form);
  const base = defaultTactic(values.format || 'F7', values.formation);
  tacticDraft = {
    ...base,
    id: values.id,
    name: values.name,
    rival: values.rival,
    situation: values.situation,
    formation: values.formation,
    team: base.team,
    opponent: base.opponent,
    ball: base.ball,
    moves: [],
    notes: values.notes,
  };
}

// Conecta el botón "⛶ Ampliar" del builder de Tácticas: abre la pizarra en un
// lightbox a pantalla completa, interactiva (mover fichas, dibujar flechas),
// reutilizando la misma lógica de la pizarra normal.
function wireTacticBoardFull() {
  const lightbox = $('#tactic-board-lightbox');
  const fullBtn = $('.tactic-board-full');
  const boardFull = $('#tactic-board-full');
  if (!lightbox || !fullBtn || !boardFull) return;

  const renderFull = () => {
    const t = tacticDraft || syncTacticDraft();
    boardFull.innerHTML = renderTacticBoard(t).match(/<svg[^>]*>([\s\S]*?)<\/svg>/)?.[1] || '';
  };

  fullBtn.addEventListener('click', () => {
    renderFull();
    lightbox.classList.add('open');
  });

  const closeLb = () => lightbox.classList.remove('open');
  lightbox.querySelector('.lb-close').addEventListener('click', closeLb);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLb(); });

  // Interactividad en la pizarra ampliada (mover fichas, dibujar flechas, balón).
  boardFull.addEventListener('pointerdown', (e) => {
    const piece = e.target.closest('[data-piece]')?.dataset.piece;
    const point = tacticPoint(e, boardFull);
    if (tacticTool === 'select' && (piece === 'team' || piece === 'opponent')) {
      const idx = Number(e.target.closest('[data-idx]').dataset.idx);
      const side = piece;
      const move = (ev) => {
        const p = tacticPoint(ev, boardFull);
        tacticDraft = moveTacticPiece(tacticDraft, side, idx, p);
        renderFull(); rerenderTacticBoard();
      };
      const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    } else if (tacticTool === 'ball') {
      tacticDraft = moveTacticPiece(tacticDraft, 'ball', 0, point);
      renderFull(); rerenderTacticBoard();
    } else if (tacticTool === 'erase') {
      const arrow = e.target.closest('[data-piece="arrow"]');
      if (arrow?.dataset.idx !== undefined) {
        tacticDraft = { ...tacticDraft, moves: (tacticDraft.moves || []).filter((_, i) => i !== Number(arrow.dataset.idx)) };
        renderFull(); rerenderTacticBoard();
      }
    } else if (tacticTool === 'clear') {
      tacticDraft = { ...tacticDraft, moves: [] };
      renderFull(); rerenderTacticBoard();
    } else if (['pass', 'move', 'dribble', 'shot', 'sprint'].includes(tacticTool)) {
      const start = point;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', start.x); line.setAttribute('y1', start.y); line.setAttribute('x2', start.x); line.setAttribute('y2', start.y);
      line.setAttribute('class', 'tac-arrow');
      boardFull.appendChild(line);
      const move = (ev) => { const p = tacticPoint(ev, boardFull); line.setAttribute('x2', p.x); line.setAttribute('y2', p.y); };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        const to = { x: Number(line.getAttribute('x2')), y: Number(line.getAttribute('y2')) };
        line.remove();
        const created = createTacticMove(start, to, tacticTool);
        if (created) {
          tacticDraft = { ...tacticDraft, moves: [...(tacticDraft.moves || []), created] };
          renderFull(); rerenderTacticBoard();
        }
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    }
  });
}

async function ensurePhase2Seeded() {
  if (await getOne('settings', 'phase2-seeded')) return;
  const current = await getAll('settings');
  const existingIds = new Set(current.filter(({ recordType }) => recordType === 'exercise').map(({ id }) => id));
  const goodExercises = [
    ...REAL_EXERCISES,
    ...SLIDESHARE_EXERCISES,
    ...PHASE2_V3_EXERCISES,
  ].filter(({ id }) => !existingIds.has(id)).map((item) => structuredClone(item));
  await putBatch({ settings: [...goodExercises, { id: 'phase2-seeded', recordType: 'migration', version: 5, createdAt: Date.now() }] });
}

async function ensurePhase2V2Seeded() {
  if (await getOne('settings', 'phase2-v2-seeded')) return;
  const current = await getAll('settings');
  await putBatch({ settings: planPhase2V2Seed(current) });
}

async function ensurePhase2V3Seeded() {
  if (await getOne('settings', 'phase2-v3-seeded')) return;
  const current = await getAll('settings');
  await putBatch({ settings: planPhase2V3Seed(current) });
}

async function ensureRealExercisesSeeded() {
  if (await getOne('settings', 'real-exercises-seeded')) return;
  const current = await getAll('settings');
  const existingIds = new Set(current.filter(({ recordType }) => recordType === 'exercise').map(({ id }) => id));
  const additions = [...REAL_EXERCISES, ...SLIDESHARE_EXERCISES].filter(({ id }) => !existingIds.has(id)).map((item) => structuredClone(item));
  await putBatch({ settings: [...additions, { id: 'real-exercises-seeded', recordType: 'migration', version: 5, createdAt: Date.now() }] });
}

async function ensureSlideshareSeeded() {
  if (await getOne('settings', 'slideshare-seeded')) return;
  const current = await getAll('settings');
  const existingIds = new Set(current.filter(({ recordType }) => recordType === 'exercise').map(({ id }) => id));
  const additions = SLIDESHARE_EXERCISES.filter(({ id }) => !existingIds.has(id)).map((item) => structuredClone(item));
  await putBatch({ settings: [...additions, { id: 'slideshare-seeded', recordType: 'migration', version: 6, createdAt: Date.now() }] });
}

// Elimina de la base todos los ejercicios de la app original. Los 248 ejercicios
// validados oficiales viven en JS (EJERCICIOS_VALIDADOS) y no se guardan en la base.
async function ensureLegacyExercisesNotPresent() {
  const flag = await getOne('settings', 'legacy-exercises-not-present-v2');
  if (flag) return;
  const current = await getAll('settings');
  const toRemove = current.filter(({ id, recordType, example, userCreated, customBoard, source }) =>
    recordType === 'exercise'
    && customBoard !== true
    && source !== 'personal'
    && (
      example === true
      || (
        userCreated !== true
        && !String(id || '').startsWith('pdf150-')
        && !String(id || '').startsWith('pdf98-')
      )
    )
  );
  for (const record of toRemove) await remove('settings', record.id);
  await put('settings', { id: 'legacy-exercises-not-present-v2', recordType: 'migration', version: 10, createdAt: Date.now() });
}

async function exportData() {
  const backup = await exportDatabase(); const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `campobase-copia-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(link.href); toast('Copia exportada.');
}

async function shareDatabaseToMobile() {
  try {
    const backup = await exportDatabase();
    const fileName = `campobase-copia-${new Date().toISOString().slice(0, 10)}.json`;
    const jsonStr = JSON.stringify(backup, null, 2);
    const file = new File([jsonStr], fileName, { type: 'application/json' });

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Copia CampoBase',
        text: `Copia completa de CampoBase (${state.players.length} jugadores, especialistas y partidos)`,
        files: [file],
      });
      toast('Copia enviada correctamente.');
      return;
    }

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
    await askConfirmation({
      title: '📲 Pasar datos al móvil',
      message: `Se ha descargado "${fileName}".\n\n1. Envíatelo a tu móvil (por WhatsApp, AirDrop o email).\n2. En el móvil, abre CampoBase > Ajustes > "Importar JSON".\n\n¡Todos tus jugadores, lanzadores y convocatorias se transferirán de inmediato sin depender de Supabase!`,
      acceptLabel: 'Entendido',
    });
  } catch (err) {
    if (err.name !== 'AbortError') {
      toast(`No se pudo transferir: ${err.message}`);
    }
  }
}

async function importData(event) {
  const file = event.target.files[0]; if (!file) return;
  if (file.size > 20_000_000) return toast('La copia supera el límite de 20 MB.');
  try {
    const backup = validateBackup(JSON.parse(await file.text()));
    if (!await askConfirmation({
      title: 'Importar datos de CampoBase',
      message: 'La importación cargará la plantilla, especialistas/lanzadores, estadísticas y partidos desde la copia seleccionada.',
      acceptLabel: 'Cargar datos',
      danger: false,
    })) return;
    await importDatabase(backup);
    state.timer = null;
    await refresh();
    toast('✅ Datos cargados: plantilla, partidos, estadísticas y lanzadores actualizados.');
  } catch (error) {
    console.error(error);
    toast(`No se pudo importar: ${error.message}`);
  } finally {
    event.target.value = '';
  }
}

function applyTeamIdentity(settings = state.settings) {
  const crestImg = $('#topbar-club-crest');
  const previewThumb = $('#preview-crest-thumb');
  const teamHeading = $('#topbar-team-name');
  const crestSrc = settings?.clubCrest || 'icons/escudo.png';
  if (crestImg) crestImg.src = crestSrc;
  if (previewThumb) previewThumb.src = crestSrc;
  const crestHidden = $('#club-crest-value');
  if (crestHidden) crestHidden.value = crestSrc;
  if (settings?.teamName) {
    if (teamHeading) teamHeading.textContent = settings.teamName;
    const formInput = $('#team-settings-form')?.elements.teamName;
    if (formInput && formInput.value !== settings.teamName) formInput.value = settings.teamName;
    const delegateTeam = $('#cb-delegate-topbar-team');
    if (delegateTeam) delegateTeam.textContent = settings.teamName;
  }
  populateKitSettingsForm(settings);
}

const THEME_PRESETS = {
  'default': {
    bg: '#071711',
    card: '#0e261d',
    nav: 'rgba(10, 31, 23, 0.96)',
    input: '#091c15',
    text: '#f8fafc',
    border: '#1b4d3a',
  },
  'dark': {
    bg: '#040806',
    card: '#0a140e',
    nav: 'rgba(8, 18, 13, 0.96)',
    input: '#060e0a',
    text: '#f8fafc',
    border: '#153023',
  },
  'pitch-vivid': {
    bg: '#021e12',
    card: '#06331f',
    nav: 'rgba(4, 38, 23, 0.96)',
    input: '#032516',
    text: '#f0fdf4',
    border: '#125435',
  },
  'navy': {
    bg: '#061021',
    card: '#0c1b33',
    nav: 'rgba(10, 24, 46, 0.96)',
    input: '#081427',
    text: '#f8fafc',
    border: '#183359',
  },
  'ocean': {
    bg: '#03141f',
    card: '#072436',
    nav: 'rgba(5, 27, 41, 0.96)',
    input: '#041c2b',
    text: '#f0f9ff',
    border: '#0e4161',
  },
  'charcoal': {
    bg: '#0f1113',
    card: '#181b1e',
    nav: 'rgba(19, 22, 25, 0.96)',
    input: '#121417',
    text: '#f8fafc',
    border: '#282d33',
  },
  'steel': {
    bg: '#171d24',
    card: '#222a34',
    nav: 'rgba(28, 36, 46, 0.96)',
    input: '#1a222a',
    text: '#f8fafc',
    border: '#33404f',
  },
  'burgundy': {
    bg: '#170408',
    card: '#260810',
    nav: 'rgba(29, 6, 12, 0.96)',
    input: '#1d050a',
    text: '#fff1f2',
    border: '#45101d',
  },
  'purple': {
    bg: '#110722',
    card: '#1d0e38',
    nav: 'rgba(23, 10, 44, 0.96)',
    input: '#16092b',
    text: '#faf5ff',
    border: '#381c6b',
  },
  'light': {
    bg: '#ffffff',
    card: '#ffffff',
    nav: 'rgba(255, 255, 255, 0.96)',
    input: '#f8fafc',
    text: '#0f172a',
    border: '#e2e8f0',
  },
  'warm': {
    bg: '#f6f3eb',
    card: '#ffffff',
    nav: 'rgba(246, 243, 235, 0.96)',
    input: '#fbf9f4',
    text: '#292524',
    border: '#e5dfd3',
  },
  'sepia': {
    bg: '#eee6d8',
    card: '#faf6ee',
    nav: 'rgba(238, 230, 216, 0.96)',
    input: '#f4ede1',
    text: '#2d241e',
    border: '#d7cbb6',
  },
  'high-vis': {
    bg: '#000000',
    card: '#080808',
    nav: 'rgba(0, 0, 0, 0.98)',
    input: '#000000',
    text: '#ffffff',
    border: '#facc15',
  }
};

const FONT_SCALE_MAP = {
  compact: '14.5px',
  normal: '16px',
  large: '19.2px',
  xlarge: '22.4px',
  huge: '25.6px',
  enormous: '28.8px',
  ultra: '32px'
};

const FONT_FAMILY_MAP = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  sport: '"Barlow Condensed", "Oswald", "DIN Alternate", "Impact", -apple-system, sans-serif',
  readable: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  modern: '"Outfit", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
  technical: '"JetBrains Mono", "SF Mono", "Menlo", "Monaco", "Consolas", monospace',
  classic: '"Merriweather", "Charter", "Georgia", "Cambria", "Times New Roman", serif'
};

const TEXT_COLOR_MAP = {
  'dark-slate': '#0f172a',
  'pure-black': '#000000',
  'high-contrast': '#000000',
  'navy': '#0a1c36',
  'pure-white': '#ffffff',
};

const COLOR_TO_TEXT_MAP = {
  '#0f172a': 'dark-slate',
  '#000000': 'pure-black',
  '#0a1c36': 'navy',
  '#ffffff': 'pure-white',
};

function applyCustomTheme(themeInput) {
  let localTheme = {};
  try {
    localTheme = JSON.parse(localStorage.getItem('campobase.theme') || '{}');
  } catch {}

  const theme = {
    themeBg: 'default',
    accentPreset: 'emerald',
    accentColor: '#10b981',
    fontFamily: 'system',
    fontScale: 'normal',
    fontWeight: 'bold',
    textColor: 'dark-slate',
    ...(state.settings?.theme || {}),
    ...localTheme,
    ...(themeInput || {})
  };

  const root = document.documentElement;
  const body = document.body;
  if (!root || !body) return;

  // 1. Tono de fondo (data-theme-bg y variables CSS)
  const bg = theme.themeBg || 'default';
  if (bg && bg !== 'default') {
    root.setAttribute('data-theme-bg', bg);
    body.setAttribute('data-theme-bg', bg);
  } else {
    root.removeAttribute('data-theme-bg');
    body.removeAttribute('data-theme-bg');
  }

  const preset = THEME_PRESETS[bg] || THEME_PRESETS['default'];
  if (preset) {
    root.style.setProperty('--cb-surface-bg', preset.bg);
    root.style.setProperty('--cb-surface-card', preset.card);
    root.style.setProperty('--cb-surface-nav', preset.nav);
    root.style.setProperty('--cb-surface-input', preset.input);
    root.style.setProperty('--cb-slate-900', preset.text);
    root.style.setProperty('--cb-slate-200', preset.border);
    root.style.setProperty('--paper', preset.bg);
    root.style.setProperty('--card', preset.card);
    root.style.setProperty('--ink', preset.text);
    root.style.setProperty('--line', preset.border);

    body.style.setProperty('--cb-surface-bg', preset.bg);
    body.style.setProperty('--cb-surface-card', preset.card);
    body.style.setProperty('--cb-surface-nav', preset.nav);
    body.style.setProperty('--cb-surface-input', preset.input);
    body.style.setProperty('--cb-slate-900', preset.text);
    body.style.setProperty('--cb-slate-200', preset.border);
    body.style.setProperty('--paper', preset.bg);
    body.style.setProperty('--card', preset.card);
    body.style.setProperty('--ink', preset.text);
    body.style.setProperty('--line', preset.border);
  }

  // 2. Color de acento del club
  if (theme.accentColor) {
    const accent = theme.accentColor;
    const cleanHex = String(accent).replace('#', '');
    let contrastText = '#0f172a';
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      contrastText = yiq >= 135 ? '#0f172a' : '#ffffff';
    }
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--cb-accent', accent);
    root.style.setProperty('--cb-accent-text', contrastText);
    root.style.setProperty('--cb-pitch-600', accent);
    root.style.setProperty('--cb-pitch-700', accent);
    root.style.setProperty('--cb-brand', accent);
    root.style.setProperty('--brand', accent);
    body.style.setProperty('--accent', accent);
    body.style.setProperty('--cb-accent', accent);
    body.style.setProperty('--cb-accent-text', contrastText);
    body.style.setProperty('--cb-pitch-600', accent);
    body.style.setProperty('--cb-pitch-700', accent);
    body.style.setProperty('--cb-brand', accent);
    body.style.setProperty('--brand', accent);
  } else {
    root.style.removeProperty('--accent');
    root.style.removeProperty('--cb-accent');
    root.style.removeProperty('--cb-accent-text');
    root.style.removeProperty('--cb-pitch-600');
    root.style.removeProperty('--cb-pitch-700');
    root.style.removeProperty('--cb-brand');
    root.style.removeProperty('--brand');
    body.style.removeProperty('--accent');
    body.style.removeProperty('--cb-accent');
    body.style.removeProperty('--cb-accent-text');
    body.style.removeProperty('--cb-pitch-600');
    body.style.removeProperty('--cb-pitch-700');
    body.style.removeProperty('--cb-brand');
    body.style.removeProperty('--brand');
  }

  // 3. Familia tipográfica (data-theme-family y variable CSS)
  const family = theme.fontFamily || 'system';
  if (family && family !== 'system') {
    root.setAttribute('data-theme-family', family);
    body.setAttribute('data-theme-family', family);
  } else {
    root.removeAttribute('data-theme-family');
    body.removeAttribute('data-theme-family');
  }
  const fontFamVal = FONT_FAMILY_MAP[family] || FONT_FAMILY_MAP['system'];
  root.style.setProperty('--cb-font-family', fontFamVal);
  body.style.setProperty('--cb-font-family', fontFamVal);

  // 4. Tamaño / Escala de fuentes (data-font-scale y rem base en html)
  const scale = theme.fontScale || 'normal';
  if (scale && scale !== 'normal') {
    root.setAttribute('data-font-scale', scale);
    body.setAttribute('data-font-scale', scale);
  } else {
    root.removeAttribute('data-font-scale');
    body.removeAttribute('data-font-scale');
  }
  const fontSizePx = FONT_SCALE_MAP[scale] || '16px';
  root.style.fontSize = fontSizePx;

  // 5. Grosor / Negritas (data-font-weight)
  const weight = theme.fontWeight || 'bold';
  if (weight && weight !== 'normal') {
    root.setAttribute('data-font-weight', weight);
    body.setAttribute('data-font-weight', weight);
  } else {
    root.removeAttribute('data-font-weight');
    body.removeAttribute('data-font-weight');
  }

  // 6. Color y contraste de textos (data-theme-font)
  const textColor = theme.textColor || 'dark-slate';
  if (textColor && textColor !== 'dark-slate') {
    root.setAttribute('data-theme-font', textColor);
    body.setAttribute('data-theme-font', textColor);
  } else {
    root.removeAttribute('data-theme-font');
    body.removeAttribute('data-theme-font');
  }

  // 7. Color de fuente personalizado (fontColor)
  let fontColor = theme.fontColor;
  if (!fontColor && textColor && TEXT_COLOR_MAP[textColor]) {
    fontColor = TEXT_COLOR_MAP[textColor];
  }
  if (!fontColor && textColor === 'pure-black') fontColor = '#000000';
  if (!fontColor && textColor === 'pure-white') fontColor = '#ffffff';
  if (!fontColor && textColor === 'navy') fontColor = '#0a1c36';

  if (fontColor) {
    root.setAttribute('data-has-custom-font-color', 'true');
    body.setAttribute('data-has-custom-font-color', 'true');
    root.style.setProperty('--cb-font-custom-color', fontColor);
    body.style.setProperty('--cb-font-custom-color', fontColor);
    root.style.setProperty('--ink', fontColor);
    root.style.setProperty('--cb-slate-950', fontColor);
    root.style.setProperty('--cb-slate-900', fontColor);
    root.style.setProperty('--cb-slate-800', fontColor);
    root.style.setProperty('--cb-slate-700', fontColor);
    root.style.setProperty('--cb-slate-600', fontColor);
    root.style.setProperty('--cb-pitch-950', fontColor);
    root.style.setProperty('--cb-pitch-900', fontColor);
    root.style.setProperty('--cb-pitch-800', fontColor);
    root.style.setProperty('--cb-pitch-700', fontColor);
    body.style.setProperty('--ink', fontColor);
    body.style.setProperty('--cb-slate-950', fontColor);
    body.style.setProperty('--cb-slate-900', fontColor);
    body.style.setProperty('--cb-slate-800', fontColor);
    body.style.setProperty('--cb-slate-700', fontColor);
    body.style.setProperty('--cb-slate-600', fontColor);
    body.style.setProperty('--cb-pitch-950', fontColor);
    body.style.setProperty('--cb-pitch-900', fontColor);
    body.style.setProperty('--cb-pitch-800', fontColor);
    body.style.setProperty('--cb-pitch-700', fontColor);
    body.style.color = fontColor;
  } else {
    root.removeAttribute('data-has-custom-font-color');
    body.removeAttribute('data-has-custom-font-color');
    root.style.removeProperty('--cb-font-custom-color');
    body.style.removeProperty('--cb-font-custom-color');
    root.style.removeProperty('--ink');
    root.style.removeProperty('--cb-slate-950');
    root.style.removeProperty('--cb-slate-900');
    root.style.removeProperty('--cb-slate-800');
    root.style.removeProperty('--cb-slate-700');
    root.style.removeProperty('--cb-slate-600');
    root.style.removeProperty('--cb-pitch-950');
    root.style.removeProperty('--cb-pitch-900');
    root.style.removeProperty('--cb-pitch-800');
    root.style.removeProperty('--cb-pitch-700');
    body.style.removeProperty('--ink');
    body.style.removeProperty('--cb-slate-950');
    body.style.removeProperty('--cb-slate-900');
    body.style.removeProperty('--cb-slate-800');
    body.style.removeProperty('--cb-slate-700');
    body.style.removeProperty('--cb-slate-600');
    body.style.removeProperty('--cb-pitch-950');
    body.style.removeProperty('--cb-pitch-900');
    body.style.removeProperty('--cb-pitch-800');
    body.style.removeProperty('--cb-pitch-700');
    body.style.removeProperty('color');
  }

  // Sincronizar controles en el formulario si está en el DOM
  const themeForm = $('#theme-settings-form');
  if (themeForm) {
    if (themeForm.elements.themeBg) themeForm.elements.themeBg.value = bg;
    if (themeForm.elements.accentPreset && theme.accentPreset) themeForm.elements.accentPreset.value = theme.accentPreset;
    if (themeForm.elements.accentColor && theme.accentColor) themeForm.elements.accentColor.value = theme.accentColor;
    if (themeForm.elements.fontFamily && theme.fontFamily) themeForm.elements.fontFamily.value = theme.fontFamily;
    if (themeForm.elements.fontScale && theme.fontScale) themeForm.elements.fontScale.value = theme.fontScale;
    if (themeForm.elements.fontWeight && theme.fontWeight) themeForm.elements.fontWeight.value = theme.fontWeight;
    if (themeForm.elements.textColor && textColor) themeForm.elements.textColor.value = textColor;
    if (themeForm.elements.fontColor && fontColor) themeForm.elements.fontColor.value = fontColor;
    if (themeForm.elements.fontColorPicker && fontColor) themeForm.elements.fontColorPicker.value = fontColor;

    // Actualizar clase activa en chips de fondo
    $$('.theme-bg-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.bg === bg);
    });

    // Actualizar clase activa en swatches de color
    $$('.color-swatch-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.preset === theme.accentPreset || btn.dataset.color === theme.accentColor);
    });

    // Actualizar clase activa en swatches de color de fuente
    $$('.font-color-swatch-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.color?.toLowerCase() === fontColor?.toLowerCase());
    });
  }
}

async function saveTeamSettings(event) {
  event.preventDefault();
  if (!roleCanUseOwnerFeatures(state.role)) return toast('Solo Migue puede cambiar los ajustes del equipo.');
  const values = formObject(event.currentTarget);
  const teamName = values.teamName.trim();
  if (!teamName) return toast('Escribe el nombre de tu equipo.');
  state.format = values.format;
  const clubCrest = $('#club-crest-value')?.value || state.settings?.clubCrest || '';
  state.settings = { ...state.settings, id: 'main', format: state.format, teamName, clubCrest };
  await put('settings', state.settings);
  applyTeamIdentity(state.settings);
  renderAll();
  toast('Identidad y modalidad del equipo guardadas.');
}

async function saveThemeSettings(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = formObject(form);
  let fontColor = values.fontColor || values.fontColorPicker || null;
  let textColor = values.textColor || 'dark-slate';

  if (values.textColor && values.textColor !== 'dark-slate' && (!fontColor || fontColor === '#0f172a')) {
    if (TEXT_COLOR_MAP[values.textColor]) {
      fontColor = TEXT_COLOR_MAP[values.textColor];
    }
  }

  const theme = {
    themeBg: values.themeBg || 'default',
    accentPreset: values.accentPreset || 'emerald',
    accentColor: values.accentColor || '#10b981',
    fontFamily: values.fontFamily || 'system',
    fontScale: values.fontScale || 'normal',
    fontWeight: values.fontWeight || 'bold',
    textColor: textColor,
    fontColor: fontColor,
  };
  try {
    localStorage.setItem('campobase.theme', JSON.stringify(theme));
  } catch {}
  applyCustomTheme(theme);

  if (roleCanUseOwnerFeatures(state.role)) {
    state.settings = { ...state.settings, id: 'main', theme };
    await put('settings', state.settings).catch((err) => console.warn('No se pudo sincronizar el tema con el servidor:', err));
  }
  toast('Preferencias visuales y tema guardados.');
}

function updateThemeProperty(prop, val, extra = {}) {
  let localTheme = {};
  try {
    localTheme = JSON.parse(localStorage.getItem('campobase.theme') || '{}');
  } catch {}
  const currentTheme = {
    themeBg: 'default',
    accentPreset: 'emerald',
    accentColor: '#10b981',
    fontFamily: 'system',
    fontScale: 'normal',
    fontWeight: 'bold',
    textColor: 'dark-slate',
    ...(state.settings?.theme || {}),
    ...localTheme,
    [prop]: val,
    ...extra,
  };
  if (state.settings) state.settings.theme = currentTheme;
  try {
    localStorage.setItem('campobase.theme', JSON.stringify(currentTheme));
  } catch {}
  applyCustomTheme(currentTheme);
}

function initCustomizationListeners() {
  const uploadBtn = $('#upload-crest-btn');
  const fileInput = $('#crest-file-input');
  const saveCrestBtn = $('#save-crest-btn');
  const resetBtn = $('#reset-crest-btn');
  const crestHidden = $('#club-crest-value');
  const previewThumb = $('#preview-crest-thumb');
  const topbarCrest = $('#topbar-club-crest');

  const persistCrest = async (crestDataUrl, successMessage) => {
    if (state.role && !roleCanUseOwnerFeatures(state.role)) {
      return toast('Solo Migue puede cambiar el escudo del equipo.');
    }
    const cleanCrest = crestDataUrl || 'icons/escudo.png';
    if (crestHidden) crestHidden.value = cleanCrest;
    if (previewThumb) previewThumb.src = cleanCrest;
    if (topbarCrest) topbarCrest.src = cleanCrest;

    state.settings = { ...state.settings, id: 'main', clubCrest: cleanCrest };
    try {
      await put('settings', state.settings);
    } catch (err) {
      console.warn('Error guardando escudo en configuración:', err);
    }
    applyTeamIdentity(state.settings);
    toast(successMessage);
  };

  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const optimized = await optimizeCrestImage(file);
        await persistCrest(optimized, 'Escudo actualizado y guardado con éxito.');
      } catch (err) {
        console.error('Error procesando el escudo:', err);
        toast('No se pudo procesar la imagen del escudo.');
      } finally {
        fileInput.value = '';
      }
    });
  }

  if (saveCrestBtn) {
    saveCrestBtn.addEventListener('click', async () => {
      const currentVal = crestHidden?.value || state.settings?.clubCrest || 'icons/escudo.png';
      await persistCrest(currentVal, 'Escudo guardado con éxito.');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      await persistCrest('icons/escudo.png', 'Escudo restaurado por defecto.');
    });
  }

  const themeForm = $('#theme-settings-form');
  if (themeForm) {
    themeForm.addEventListener('submit', (e) => saveThemeSettings(e).catch(handleError));
  }

  // Delegación global para botones de tono de fondo (chips)
  document.addEventListener('click', (e) => {
    const bgBtn = e.target.closest('.theme-bg-btn');
    if (bgBtn) {
      const bgVal = bgBtn.dataset.bg;
      const hiddenInput = $('#theme-bg-select');
      if (hiddenInput) hiddenInput.value = bgVal;
      updateThemeProperty('themeBg', bgVal);
      return;
    }

    const swatchBtn = e.target.closest('.color-swatch-btn');
    if (swatchBtn) {
      const color = swatchBtn.dataset.color;
      const preset = swatchBtn.dataset.preset;
      const presetInput = $('#theme-accent-preset');
      const colorInput = $('#theme-accent-color');
      if (presetInput) presetInput.value = preset;
      if (colorInput) colorInput.value = color;
      updateThemeProperty('accentColor', color, { accentPreset: preset });
      return;
    }

    const fontSwatchBtn = e.target.closest('.font-color-swatch-btn');
    if (fontSwatchBtn) {
      const color = fontSwatchBtn.dataset.color;
      const picker = $('#theme-font-color-picker');
      const hidden = $('#theme-font-color');
      const textColorSelect = $('#theme-text-color');
      if (picker) picker.value = color;
      if (hidden) hidden.value = color;
      const mappedTextColor = COLOR_TO_TEXT_MAP[color.toLowerCase()] || 'custom';
      if (textColorSelect && COLOR_TO_TEXT_MAP[color.toLowerCase()]) {
        textColorSelect.value = mappedTextColor;
      }
      updateThemeProperty('fontColor', color, { textColor: mappedTextColor });
      return;
    }
  });

  // Delegación global para inputs y selects del formulario de tema
  document.addEventListener('input', (e) => {
    if (e.target.id === 'theme-accent-color') {
      updateThemeProperty('accentColor', e.target.value, { accentPreset: 'custom' });
    } else if (e.target.id === 'theme-font-color-picker') {
      const color = e.target.value;
      const hidden = $('#theme-font-color');
      const textColorSelect = $('#theme-text-color');
      if (hidden) hidden.value = color;
      const mappedTextColor = COLOR_TO_TEXT_MAP[color.toLowerCase()] || 'custom';
      if (textColorSelect && COLOR_TO_TEXT_MAP[color.toLowerCase()]) {
        textColorSelect.value = mappedTextColor;
      }
      updateThemeProperty('fontColor', color, { textColor: mappedTextColor });
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'theme-font-family') {
      updateThemeProperty('fontFamily', e.target.value);
    } else if (e.target.id === 'theme-font-scale') {
      updateThemeProperty('fontScale', e.target.value);
    } else if (e.target.id === 'theme-font-weight') {
      updateThemeProperty('fontWeight', e.target.value);
    } else if (e.target.id === 'theme-text-color') {
      const textColorVal = e.target.value;
      const mappedColor = TEXT_COLOR_MAP[textColorVal] || '#0f172a';
      const picker = $('#theme-font-color-picker');
      const hidden = $('#theme-font-color');
      if (picker) picker.value = mappedColor;
      if (hidden) hidden.value = mappedColor;
      updateThemeProperty('fontColor', mappedColor, { textColor: textColorVal });
    }
  });

  // Delegación para replegar estadísticas con el botón al final del desplegable
  document.addEventListener('click', (e) => {
    const collapseBtn = e.target.closest('.collapse-stats-btn');
    if (collapseBtn) {
      const details = collapseBtn.closest('details.player-performance');
      if (details) {
        details.open = false;
        details.closest('.card.player')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  });
}

async function saveDemoTeam(event) {
  event.preventDefault();
  if (state.role !== 'demo' || !isDemoDatabase()) return toast('Este formulario solo está disponible en la demo.');
  const values = formObject(event.currentTarget);
  const teamName = values.teamName.trim();
  if (!teamName) return toast('Escribe el nombre del equipo de prueba.');
  state.format = values.format;
  state.settings = { ...state.settings, id: 'main', format: state.format, teamName };
  await put('settings', state.settings);
  renderAll();
  toast('Equipo de prueba guardado temporalmente.');
}

async function savePins(ownerPin, delegatePin) {
  const cleanOwnerPin = String(ownerPin || '').trim();
  const cleanDelegatePin = String(delegatePin || '').trim();
  if (!/^\d{4,8}$/.test(cleanOwnerPin) || !/^\d{4,8}$/.test(cleanDelegatePin)) {
    throw new TypeError('Los PIN deben tener entre 4 y 8 cifras.');
  }
  if (cleanOwnerPin === cleanDelegatePin) throw new TypeError('Los PIN de Migue y delegado deben ser distintos.');
  const salt = crypto.randomUUID();
  const [ownerPinHash, delegatePinHash] = await Promise.all([hashPin(cleanOwnerPin, salt), hashPin(cleanDelegatePin, salt)]);
  state.settings = { ...state.settings, id: 'main', format: state.format, pinSalt: salt, ownerPinHash, delegatePinHash, delegatePin: cleanDelegatePin };
  await put('settings', state.settings);
}

function applyRole(role) {
  state.role = role;
  try { sessionStorage.setItem(SESSION_ROLE_KEY, role); } catch { /* La app sigue operativa aunque el navegador bloquee el almacenamiento de sesión. */ }
  const userId = getBoundSaasUserId();
  if (userId) {
    try { sessionStorage.setItem('campobase.saasActiveBrowserSession', String(userId)); } catch {}
  }
  document.body.classList.remove('auth-locked');
  $('#role-label').textContent = role === 'owner' ? 'Migue' : role === 'demo' ? 'Demo temporal' : 'Delegado';
  document.body.classList.toggle('demo-mode', role === 'demo');
  $('#settings-nav').hidden = role === 'demo';
  $('#demo-team-panel').classList.toggle('hidden', role !== 'demo');
  if (role === 'delegate') {
    state.delegateMode = true;
    document.body.classList.add('delegate-mode');
    window.__campobaseAllowedViews = getDelegatePermissions();
    syncDelegateModeDom();
    showView('delegado');
    renderDelegate();
  } else {
    state.delegateMode = false;
    window.__campobaseAllowedViews = null;
    document.body.classList.remove('delegate-mode', 'delegate-single-view', 'delegate-multi-view', 'delegate-allow-modo-campo');
    restoreNormalNavUi();
    showView(storedActiveView() || 'plantilla');
  }
  // Re-renderiza el partido en vivo con el rol ya aplicado: el botón "Vista
  // Delegado" (y "Enseñar al delegado") dependen de roleCanUseOwnerFeatures,
  // y si se renderizó antes de restaurar el rol (state.role = null) no aparecen.
  renderLive();
  renderDelegate();
}

async function startDemoSession(session) {
  configureDemoDatabase(session);
  state.demoSession = session;
  try { sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session)); } catch { throw new Error('El navegador debe permitir almacenamiento de sesión para usar la demo.'); }
  await ensurePhase2Seeded();
  await ensurePhase2V2Seeded();
  await ensurePhase2V3Seeded();
  await ensureRealExercisesSeeded();
  await ensureSlideshareSeeded();
  await ensureLegacyExercisesNotPresent();
  await refresh();
  const live = await getOne('settings', 'live');
  state.timer = live?.timer ?? null;
  state.liveUpdatedAt = live?.updatedAt ?? 0;
  applyRole('demo');
  networkStatus();
}

async function endDemoSession(message = '') {
  const session = state.demoSession;
  state.demoSession = null;
  state.timer = null;
  clearInterval(state.tick);
  if (session) await deleteDemoDatabase(session).catch((error) => console.warn('No se pudo eliminar la base demo:', error.message));
  configureRealDatabase();
  try {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    sessionStorage.removeItem(SESSION_ROLE_KEY);
  } catch { /* La base temporal ya no está activa. */ }
  await synchronizeCloud();
  showAuth();
  if (message) $('#auth-error').textContent = message;
}

async function logoutUser() {
  if (state.role === 'demo') {
    await endDemoSession();
    return;
  }
  state.role = null;
  state.delegateMode = false;
  window.__campobaseAllowedViews = null;
  try {
    sessionStorage.removeItem(SESSION_ROLE_KEY);
    sessionStorage.removeItem(DEMO_SESSION_KEY);
  } catch {}
  document.body.classList.remove('delegate-mode', 'delegate-single-view', 'delegate-multi-view', 'delegate-allow-modo-campo');
  restoreNormalNavUi();
  showAuth();
  toast('Sesión cerrada.');
}

async function restoreSessionRole() {
  let role;
  try { role = sessionStorage.getItem(SESSION_ROLE_KEY); } catch { return false; }
  if (role === 'demo') {
    let session;
    try { session = JSON.parse(sessionStorage.getItem(DEMO_SESSION_KEY)); } catch { return false; }
    if (!isDemoSessionActive(session)) {
      if (session?.id) await deleteDemoDatabase(session).catch(() => false);
      configureRealDatabase();
      try { sessionStorage.removeItem(DEMO_SESSION_KEY); sessionStorage.removeItem(SESSION_ROLE_KEY); } catch { /* Sin sesión que limpiar. */ }
      return false;
    }
    await startDemoSession(session);
    return true;
  }
  if (!['owner', 'delegate'].includes(role)) return false;

  // Si existe una cuenta SaaS vinculada, conserva sessionRole para que la capa
  // SaaS pueda verificar la sesión remota y reabrir la app sin expulsar al
  // usuario. No desbloqueamos aquí sin esa verificación.
  let hasSaasBinding = false;
  try { hasSaasBinding = Boolean(localStorage.getItem('campobase.saasUserId')); } catch { /* Acceso local puro. */ }
  if (hasSaasBinding) return false;

  // En acceso local puro, sessionStorage vive solo en esta pestaña y sobrevive
  // a una recarga. Restaurarlo evita pedir el PIN de nuevo al actualizar.
  applyRole(role);
  return true;
}

async function hydratePinSettingsFromSupabase() {
  if (state.settings.ownerPinHash && state.settings.delegatePinHash && state.settings.pinSalt) return true;
  try {
    const remote = await getRemoteMainSettings();
    if (!remote?.ownerPinHash || !remote?.delegatePinHash || !remote?.pinSalt) return false;
    state.settings = {
      ...state.settings,
      ...remote,
      id: 'main',
    };
    return true;
  } catch (error) {
    // Si hay sesión SaaS pero la configuración no carga, no fabricamos PIN nuevos.
    state.cloudError = error?.message || 'No se pudo cargar la configuración de acceso.';
    return false;
  }
}

async function showAuth(forceInitial = false) {
  await hydratePinSettingsFromSupabase();
  if (!state.settings.ownerPinHash || !state.settings.delegatePinHash) {
    const candidates = await getLocalPinSettingsCandidates().catch(() => []);
    for (const candidate of candidates) {
      if (candidate.settings?.ownerPinHash && candidate.settings?.delegatePinHash) {
        state.settings = { ...state.settings, ...candidate.settings, id: 'main' };
        break;
      }
    }
  }
  // Mostrar el diálogo no equivale a cerrar sesión. El sessionRole se conserva
  // para que la capa SaaS pueda verificar y restaurar una sesión válida tras recarga.
  document.body.classList.add('auth-locked');
  document.body.classList.remove('delegate-mode');
  document.body.classList.remove('demo-mode');
  $('#settings-nav').hidden = false;
  $('#demo-team-panel').classList.add('hidden');
  state.role = null;
  const hasLocalPins = Boolean(state.settings.ownerPinHash && state.settings.delegatePinHash);
  const initial = forceInitial && !hasLocalPins;
  $('#auth-title').textContent = initial ? 'Configurar acceso' : 'Acceso a CampoBase';
  $('#auth-help').textContent = initial ? 'Configura tus PIN de acceso para proteger la aplicación.' : 'Introduce tu PIN de acceso.';
  $('#initial-pin-fields').classList.toggle('hidden', !initial);
  $('#login-pin-field').classList.toggle('hidden', initial);
  if ($('#auth-reset-btn')) $('#auth-reset-btn').classList.toggle('hidden', initial);
  const form = $('#auth-form');
  form.elements.newOwnerPin.required = initial;
  form.elements.newDelegatePin.required = initial;
  form.elements.pin.required = !initial;
  form.reset();
  $('#auth-error').textContent = '';
  if (!$('#auth-dialog').open) $('#auth-dialog').showModal();
}

function ensureAuthPromptVisible() {
  if (state.role) return;
  if (sessionStorage.getItem(SESSION_ROLE_KEY)) return;
  if (isDemoDatabase()) return;
  void showAuth();
}

async function submitAuth(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const createModeVisible = !$('#initial-pin-fields')?.classList.contains('hidden');
  try {
    // Si la pantalla ya está en modo "Introduce tu PIN", nunca puede saltar a
    // "crear PIN" durante el submit por una carrera de sincronización.
    if (createModeVisible) {
      const hydrated = await hydratePinSettingsFromSupabase();
      if (hydrated) {
        await showAuth();
        throw new TypeError('La cuenta ya tiene PIN configurados. Introduce tu PIN de CampoBase.');
      }
      const enteredOwnerPin = String(form.elements.newOwnerPin?.value || '').trim();
      if (/^\d{4,8}$/.test(enteredOwnerPin)) {
        try {
          const client = getSupabaseAuthClient();
          const session = await signInWithCampoBasePin(client, '', enteredOwnerPin);
          if (session?.user?.id) {
            setBoundSaasUserId(session.user.id);
            configureRealDatabase();
            try { sessionStorage.setItem('campobase.saasActiveBrowserSession', String(session.user.id)); } catch {}
            await hydratePinSettingsFromSupabase();
            applyRole('owner');
            $('#auth-dialog').close();
            await synchronizeCloud();
            await refresh();
            renderAll();
            toast('Sincronizado con CampoBase en la nube.');
            return;
          }
        } catch {}
      }
      await savePins(form.elements.newOwnerPin.value, form.elements.newDelegatePin.value);
      applyRole('owner');
    } else {
      if (!state.settings.ownerPinHash) await hydratePinSettingsFromSupabase();
      const pin = String(form.elements.pin.value || '').trim();
      if (!/^\d{4,8}$/.test(pin) && pin.toLowerCase() !== 'demo') {
        throw new TypeError('El PIN debe tener entre 4 y 8 cifras.');
      }

      if (pin.toLowerCase() === 'demo') {
        $('#auth-dialog')?.close();
        await startDemoSession(createDemoSession(crypto.randomUUID()));
        return;
      } else if (state.settings.pinSalt && state.settings.ownerPinHash
          && await verifyPin(pin, state.settings.pinSalt, state.settings.ownerPinHash)) {
        $('#auth-dialog')?.close();
        applyRole('owner');
        const userId = getBoundSaasUserId() || getRememberedSaasAccount()?.id || '';
        void (async () => {
          if (userId) {
            try { sessionStorage.setItem('campobase.saasActiveBrowserSession', String(userId)); } catch {}
            try {
              const client = getSupabaseAuthClient();
              await signInWithCampoBasePin(client, userId, pin);
            } catch { /* si ya tiene sesión o falla red, continúa con acceso local */ }
          } else {
            try {
              const client = getSupabaseAuthClient();
              const session = await signInWithCampoBasePin(client, '', pin);
              if (session?.user?.id) {
                setBoundSaasUserId(session.user.id);
                try { sessionStorage.setItem('campobase.saasActiveBrowserSession', String(session.user.id)); } catch {}
              }
            } catch (err) {
              console.warn('Auto-enlace con Supabase fallido:', err);
            }
          }
          if (getBoundSaasUserId()) await synchronizeCloud();
        })();
        return;
      } else if (pin === '0000' || pin === state.settings?.delegatePin || (state.settings.pinSalt && state.settings.delegatePinHash
          && await verifyPin(pin, state.settings.pinSalt, state.settings.delegatePinHash))) {
        $('#auth-dialog')?.close();
        applyRole('delegate');
        void (async () => {
          try {
            await synchronizeCloud();
            await refresh(true);
            renderDelegate();
          } catch {}
        })();
        return;
      } else if (state.settings.demoPinHash && await verifyPin(pin, state.settings.demoPinSalt, state.settings.demoPinHash)) {
        $('#auth-dialog')?.close();
        await startDemoSession(createDemoSession(crypto.randomUUID()));
        return;
      } else {
        // Último recurso: comprobar copias locales del mismo navegador sin
        // modificar Supabase. Nunca crear PIN nuevos desde una pantalla de login.
        const candidates = await getLocalPinSettingsCandidates();
        let recoveredRole = '';
        let recoveredSettings = null;
        for (const candidate of candidates) {
          const local = candidate.settings;
          if (await verifyPin(pin, local.pinSalt, local.ownerPinHash)) {
            recoveredRole = 'owner';
            recoveredSettings = local;
            $('#auth-dialog')?.close();
            applyRole('owner');
            if (candidate.userId) {
              setBoundSaasUserId(candidate.userId);
              try { sessionStorage.setItem('campobase.saasActiveBrowserSession', String(candidate.userId)); } catch {}
              void (async () => {
                try {
                  const client = getSupabaseAuthClient();
                  await signInWithCampoBasePin(client, candidate.userId, pin);
                  await synchronizeCloud();
                } catch {}
              })();
            }
            return;
          }
          if (pin === '0000' || pin === local.delegatePin || (local.delegatePinHash && await verifyPin(pin, local.pinSalt, local.delegatePinHash))) {
            recoveredRole = 'delegate';
            recoveredSettings = local;
            $('#auth-dialog')?.close();
            applyRole('delegate');
            if (candidate.userId) {
              setBoundSaasUserId(candidate.userId);
              try { sessionStorage.setItem('campobase.saasActiveBrowserSession', String(candidate.userId)); } catch {}
            }
            void (async () => {
              try {
                await synchronizeCloud();
                await refresh(true);
                renderDelegate();
              } catch {}
            })();
            return;
          }
        }
        if (!recoveredRole) {
          const userId = getBoundSaasUserId() || getRememberedSaasAccount()?.id || '';
          let supabaseError = null;
          try {
            const client = getSupabaseAuthClient();
            const session = await signInWithCampoBasePin(client, userId || '', pin);
            if (session?.user?.id) {
              setBoundSaasUserId(session.user.id);
              configureRealDatabase();
              try { sessionStorage.setItem('campobase.saasActiveBrowserSession', String(session.user.id)); } catch {}
              await hydratePinSettingsFromSupabase();
              $('#auth-dialog')?.close();
              applyRole('owner');
              toast('Sincronizado con CampoBase en la nube.');
              void (async () => {
                await synchronizeCloud();
                await refresh();
                renderAll();
              })();
              return;
            }
          } catch (err) {
            supabaseError = err;
            console.warn('Fallo al validar PIN en Supabase:', err);
          }
          if (supabaseError?.message && !supabaseError.message.includes('PIN incorrecto')) {
            throw supabaseError;
          }
          throw new TypeError('PIN incorrecto. Comprueba que estás usando el PIN de CampoBase de esta cuenta.');
        }
        state.settings = {
          ...state.settings,
          pinSalt: recoveredSettings.pinSalt,
          ownerPinHash: recoveredSettings.ownerPinHash,
          delegatePinHash: recoveredSettings.delegatePinHash,
        };
        applyRole(recoveredRole);
        toast('PIN reconocido. Revisa Ajustes → Sincronización.');
      }
    }
    if (!isDemoDatabase()) {
      await synchronizeCloud();
      await refresh();
    }
    $('#auth-dialog').close();
    renderAll();
  } catch (error) {
    $('#auth-error').textContent = error.message;
  }
}

async function changePins(event) {
  event.preventDefault();
  if (state.role !== 'owner') return toast('Solo Migue puede cambiar los PIN.');
  const values = formObject(event.currentTarget);
  if (!await verifyPin(values.currentPin, state.settings.pinSalt, state.settings.ownerPinHash)) return toast('El PIN actual de Migue no es correcto.');
  await savePins(values.ownerPin, values.delegatePin);
  event.currentTarget.reset();
  toast('PIN de Migue y delegado actualizados.');
}

async function changeDemoPin(event) {
  event.preventDefault();
  if (state.role !== 'owner') return toast('Solo Migue puede cambiar el PIN de demo.');
  const form = event.currentTarget;
  const values = formObject(form);
  if (!await verifyPin(values.currentPin, state.settings.pinSalt, state.settings.ownerPinHash)) return toast('El PIN actual de Migue no es correcto.');
  if (await verifyPin(values.demoPin, state.settings.pinSalt, state.settings.ownerPinHash)
      || await verifyPin(values.demoPin, state.settings.pinSalt, state.settings.delegatePinHash)) {
    return toast('El PIN de demo debe ser distinto de los PIN de Migue y delegado.');
  }
  const demoPinSalt = crypto.randomUUID();
  const demoPinHash = await hashPin(values.demoPin, demoPinSalt);
  state.settings = { ...state.settings, demoPinSalt, demoPinHash };
  await put('settings', state.settings);
  form.reset();
  toast('PIN de demo guardado.');
}

function populateDelegateAccountForm() {
  const form = $('#delegate-account-form');
  if (!form) return;
  const pin = state.settings?.delegatePin || '0000';
  if (form.elements.delegatePinInput) {
    form.elements.delegatePinInput.value = pin;
  }
  const perms = getDelegatePermissions();
  if (form.elements.delegatePermPlantilla) {
    form.elements.delegatePermPlantilla.checked = perms.includes('plantilla');
  }
  if (form.elements.delegatePermModoCampo) {
    form.elements.delegatePermModoCampo.checked = perms.includes('modo-campo');
  }
  if (form.elements.delegatePermConvocatorias) {
    form.elements.delegatePermConvocatorias.checked = perms.includes('convocatorias');
  }
  form.querySelectorAll('.delegate-perms-list input[type="checkbox"]').forEach((chk) => {
    if (chk.value === 'partido') chk.checked = true;
    else chk.checked = perms.includes(chk.value);
  });
}

async function saveDelegateAccountSettings(event) {
  event.preventDefault();
  if (state.role !== 'owner') return toast('Solo Migue puede configurar la cuenta del delegado.');
  const form = event.currentTarget;
  const pin = String(form.elements.delegatePinInput?.value || '').trim();
  if (!/^\d{4,8}$/.test(pin)) {
    return toast('El PIN del delegado debe tener entre 4 y 8 cifras.');
  }

  const perms = ['partido'];
  if (form.elements.delegatePermPlantilla?.checked) perms.push('plantilla');
  if (form.elements.delegatePermModoCampo?.checked) perms.push('modo-campo');
  if (form.elements.delegatePermConvocatorias?.checked) perms.push('convocatorias');
  form.querySelectorAll('.delegate-perms-list input[type="checkbox"]:checked').forEach((chk) => {
    if (chk.value && !perms.includes(chk.value)) perms.push(chk.value);
  });

  const salt = state.settings.pinSalt || crypto.randomUUID();
  const delegatePinHash = await hashPin(pin, salt);
  const now = Date.now();

  state.settings = {
    ...state.settings,
    id: 'main',
    pinSalt: salt,
    delegatePin: pin,
    delegatePinHash,
    delegatePermissions: perms,
    updatedAt: now,
  };
  try { localStorage.setItem('campobase.delegatePermissions', JSON.stringify(perms)); } catch {}

  await put('settings', state.settings);

  try {
    const { getBoundSupabaseClient } = await import('./supabase-client.js');
    const client = getBoundSupabaseClient?.();
    if (client) {
      await client.rpc('set_delegate_permissions', { p_permissions: perms }).catch(() => {});
    }
  } catch {}

  if (!isDemoDatabase()) {
    await synchronizeCloud().catch(() => {});
  }
  if (state.role === 'delegate' || state.delegateMode) {
    window.__campobaseAllowedViews = perms;
    syncDelegateModeDom();
  }
  populateDelegateAccountForm();
  toast('Cuenta y permisos del delegado guardados correctamente.');
}

async function persistDelegatePermissions(newPerms) {
  const clean = Array.isArray(newPerms) ? [...new Set(newPerms.map(String))] : ['partido'];
  if (!clean.includes('partido') && !clean.includes('delegado')) {
    clean.push('partido');
  }
  const now = Date.now();
  state.settings = {
    ...(state.settings || {}),
    id: 'main',
    delegatePermissions: clean,
    updatedAt: now,
  };
  try {
    localStorage.setItem('campobase.delegatePermissions', JSON.stringify(clean));
  } catch {}
  await put('settings', state.settings);
  if (!isDemoDatabase()) {
    await synchronizeCloud().catch(() => {});
  }
  populateDelegateAccountForm();
  if (state.role === 'delegate' || state.delegateMode) {
    window.__campobaseAllowedViews = clean;
    syncDelegateModeDom();
  }
  return clean;
}

function sendDelegateInviteWhatsApp() {
  const invite = buildDelegateInviteMessage();
  const waUrl = `https://wa.me/?text=${encodeURIComponent(invite.text)}`;
  window.open(waUrl, '_blank');
}

function sendDelegateInviteEmail() {
  const invite = buildDelegateInviteMessage();
  const subject = `Acceso Delegado CampoBase - ${invite.teamName}`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(invite.text)}`;
  window.location.href = mailtoUrl;
}

async function changeLiveScore(team, delta) {
  state.timer.details = adjustLiveScore(ensureLiveDetails(), team, Number(delta));
  await persistTimer();
  renderLive(); renderDelegate(); toast('Marcador actualizado.');
}

async function addLiveEvent(prefix) {
  let playerId = $(`#${prefix}-event-player`).value;
  const kind = $(`#${prefix}-event-kind`).value;
  const assistantId = $(`#${prefix}-event-assistant`)?.value || '';
  const note = $(`#${prefix}-event-note`).value.trim();
  if (kind === 'own_goal') playerId = '__pp__';
  if (!playerId) return toast('Selecciona un jugador o Gol P.P.');
  const isOwnGoal = kind === 'own_goal' || playerId === '__pp__';
  state.timer.details = addPlayerMatchEvent(ensureLiveDetails(), {
    id: uid(),
    kind: isOwnGoal ? 'goal' : kind,
    playerId: isOwnGoal ? '__pp__' : playerId,
    assistantId: isOwnGoal ? '' : (assistantId === playerId ? '' : assistantId),
    second: timerSeconds(),
    note,
    isOwnGoal
  });
  await persistTimer();
  renderLive();
  renderDelegate();
  const toastMsg = kind === 'penalty_goal' ? 'Gol de penalti registrado.' :
    (kind === 'penalty_miss' ? 'Penalti fallado registrado.' :
    (kind === 'penalty_saved' ? 'Penalti parado registrado.' :
    (kind === 'penalty_conceded' ? 'Penalti encajado registrado (suma gol rival).' :
    (isOwnGoal ? 'Gol en propia puerta registrado.' :
    (kind === 'goal' ? 'Gol registrado.' : 'Incidencia registrada.')))));
  toast(toastMsg);
}

async function removeLiveEvent(prefix, eventId) {
  if (!eventId) return;
  state.timer.details = removePlayerMatchEvent(ensureLiveDetails(), eventId);
  await persistTimer();
  renderLive();
  renderDelegate();
  toast('Incidencia anulada.');
}

async function pollLiveState() {
  if (!state.role) return;
  if (state.role === 'demo' && !isDemoSessionActive(state.demoSession)) {
    await endDemoSession('La demostración ha finalizado al cumplirse el límite de dos horas.');
    return;
  }
  const live = await getOne('settings', 'live');
  if ((live?.updatedAt ?? 0) <= state.liveUpdatedAt) return;
  state.liveUpdatedAt = live?.updatedAt ?? 0;
  state.timer = live.timer;
  // Un live remoto nuevo invalida la pizarra en memoria. refresh() cargará
  // primero la preparación sincronizada y renderLive() la reconstruirá exacta.
  liveTactic = null;
  await refresh();
  if (state.role === 'delegate') { enterDelegateMode(); } else { renderLive(); renderDelegate(); }
}

// ==========================================================================
// CONFIGURACIÓN DE EQUIPACIONES Y PETOS
// ==========================================================================
function getKitConfig() {
  return state.settings?.kitConfig || {
    primaryKit: '1.ª Oficial (Roja y Negra)',
    secondaryKit: '2.ª Alternativa (Blanca y Negra)',
    trainingKit: 'Equipación oficial de entrenamiento',
    bibsConfig: 'Petos verdes y amarillos',
  };
}

function populateKitSettingsForm(settings = state.settings) {
  const form = $('#kit-settings-form');
  if (!form) return;
  const kitConfig = settings?.kitConfig || getKitConfig();
  if (form.elements.primaryKit) form.elements.primaryKit.value = kitConfig.primaryKit || '1.ª Oficial (Roja y Negra)';
  if (form.elements.secondaryKit) form.elements.secondaryKit.value = kitConfig.secondaryKit || '2.ª Alternativa (Blanca y Negra)';
  if (form.elements.trainingKit) form.elements.trainingKit.value = kitConfig.trainingKit || 'Equipación oficial de entrenamiento';
  if (form.elements.bibsConfig) form.elements.bibsConfig.value = kitConfig.bibsConfig || 'Petos verdes y amarillos';
}

async function saveKitSettings(event) {
  event.preventDefault();
  if (!roleCanUseOwnerFeatures(state.role)) return toast('Solo Migue puede cambiar los ajustes de equipación.');
  const values = formObject(event.currentTarget);
  const kitConfig = {
    primaryKit: values.primaryKit?.trim() || '1.ª Oficial (Roja y Negra)',
    secondaryKit: values.secondaryKit?.trim() || '2.ª Alternativa (Blanca y Negra)',
    trainingKit: values.trainingKit?.trim() || 'Equipación oficial de entrenamiento',
    bibsConfig: values.bibsConfig?.trim() || 'Petos verdes y amarillos',
  };
  state.settings = { ...state.settings, id: 'main', kitConfig };
  await put('settings', state.settings);
  toast('Equipaciones y petos guardados.');
}

// ==========================================================================
// WHATSAPP DIALOG CONTROLLER
// ==========================================================================
let waCurrentMode = 'callup'; // 'callup' | 'training' | 'week'
let waTargetPlayerId = '';
let waParentType = 'both'; // 'both' | 'father' | 'mother'
let waCallupStatus = 'auto'; // 'auto' | 'called' | 'excluded'
let waLastExclusionPlayerId = null;
let waLastContactPlayerId = null;

function getSelectedWhatsAppWeekRange() {
  const select = $('#wa-week-select');
  const today = localDateKey();
  const currentRange = getWeekDateRange(today);
  const nextRange = getNextWeekDateRange(today);
  const choice = select?.value || (isWeekend(today) ? 'next' : 'current');
  if (choice === 'next') return { ...nextRange, mode: 'next' };
  return { ...currentRange, mode: 'current' };
}

function populateWhatsAppWeekSelector() {
  const select = $('#wa-week-select');
  if (!select) return;
  const today = localDateKey();
  const currentRange = getWeekDateRange(today);
  const nextRange = getNextWeekDateRange(today);
  const weekend = isWeekend(today);

  const prevValue = select.value;
  select.innerHTML = '';

  const optNext = document.createElement('option');
  optNext.value = 'next';
  optNext.textContent = `Próxima semana (${formatWeekSpanLabel(nextRange.start, nextRange.end)})`;

  const optCurrent = document.createElement('option');
  optCurrent.value = 'current';
  optCurrent.textContent = `${weekend ? 'Semana anterior' : 'Esta semana'} (${formatWeekSpanLabel(currentRange.start, currentRange.end)})`;

  if (weekend) {
    select.appendChild(optNext);
    select.appendChild(optCurrent);
    select.value = prevValue || 'next';
  } else {
    select.appendChild(optCurrent);
    select.appendChild(optNext);
    select.value = prevValue || 'current';
  }
}

function openWhatsAppDialog({
  mode = 'callup',
  matchId = null,
  callupId = null,
  sessionId = null,
  playerId = null,
  parentType = 'both',
  callupStatus = 'auto',
} = {}) {
  const dialog = $('#whatsapp-dialog');
  if (!dialog) return;

  waLastExclusionPlayerId = null;
  waLastContactPlayerId = null;
  waCurrentMode = mode;
  waTargetPlayerId = playerId || '';
  waParentType = parentType || 'both';
  waCallupStatus = callupStatus || 'auto';

  // Sincronizar pestañas
  $$('.whatsapp-type-tabs .tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.waType === waCurrentMode);
  });

  // Mostrar / ocultar filas según modo
  $('#wa-match-details-row')?.classList.toggle('hidden', waCurrentMode !== 'callup');
  $('#wa-location-row')?.classList.toggle('hidden', waCurrentMode === 'week');
  $('#wa-times-row')?.classList.toggle('hidden', waCurrentMode === 'week');
  $('#wa-week-tactical-row')?.classList.toggle('hidden', waCurrentMode !== 'week');

  if (waCurrentMode === 'week') populateWhatsAppWeekSelector();
  // Llenar selector de eventos
  populateWhatsAppEvents(matchId, callupId, sessionId);
  if (waCurrentMode === 'callup') syncWhatsAppMatchLocation();
  // Llenar selector de destinatarios
  populateWhatsAppRecipients(playerId);

  if ($('#wa-parent-type-select')) $('#wa-parent-type-select').value = waParentType;
  if ($('#wa-callup-status-select')) $('#wa-callup-status-select').value = waCallupStatus;

  updateWhatsAppPreview();
  dialog.showModal();
}

function selectedWhatsAppMatch() {
  const eventValue = $('#wa-event-select')?.value || '';
  if (eventValue.startsWith('match:')) {
    const matchId = eventValue.slice('match:'.length);
    return state.matches.find((match) => match.id === matchId) || null;
  }
  if (eventValue.startsWith('callup:')) {
    const callupId = eventValue.slice('callup:'.length);
    const callup = state.callups.find((item) => item.id === callupId) || null;
    return state.matches.find((match) => match.id === callup?.matchId || match.callupId === callupId) || null;
  }
  return state.matches.find((match) => match.id === eventValue) || null;
}

function syncWhatsAppMatchLocation() {
  const match = selectedWhatsAppMatch();
  if (!match) return;
  const fieldName = String(match.location || '').trim();
  const fieldInput = $('#wa-field-name');
  const mapsInput = $('#wa-maps-url');
  if (fieldInput) fieldInput.value = fieldName;
  if (mapsInput) mapsInput.value = fieldName ? getAutoMapsUrl(fieldName) : '';
}

function populateWhatsAppEvents(matchId, callupId, sessionId) {
  const select = $('#wa-event-select');
  const label = $('#wa-event-selector-label');
  if (!select) return;
  select.innerHTML = '';

  if (waCurrentMode === 'callup') {
    if (label) label.firstChild.textContent = 'Partido / Convocatoria ';
    const matches = [...state.matches].sort((a, b) => b.date.localeCompare(a.date));
    const processedCallupIds = new Set();
    matches.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = `match:${m.id}`;
      const callup = state.callups.find((c) => c.id === m.callupId || c.matchId === m.id);
      if (callup) processedCallupIds.add(callup.id);
      const isSelected = (matchId && m.id === matchId) || (callupId && callup?.id === callupId);
      const waTypeLabel = matchTypeLabel(m.type || 'league');
      const callupSuffix = (m.type || 'league') === 'league' && callup ? ' (Convocatoria lista)' : '';
      opt.textContent = `${localDate(m.date)} · ${waTypeLabel} vs ${m.opponent}${callupSuffix}`;
      if (isSelected) opt.selected = true;
      select.appendChild(opt);
    });
    // Convocatorias sin partido formal
    state.callups.forEach((c) => {
      if (!processedCallupIds.has(c.id)) {
        const opt = document.createElement('option');
        opt.value = `callup:${c.id}`;
        opt.textContent = `${localDate(c.date)} · Convocatoria vs ${c.opponent}`;
        if (callupId && c.id === callupId) opt.selected = true;
        select.appendChild(opt);
      }
    });
    if (!matches.length && !state.callups.length) {
      select.innerHTML = '<option value="">No hay partidos creados</option>';
    }
  } else if (waCurrentMode === 'training') {
    if (label) label.firstChild.textContent = 'Sesión de entrenamiento ';
    const sessions = sortTrainingSessions(state.trainingSessions, localDateKey());
    sessions.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.id;
      if (sessionId && s.id === sessionId) opt.selected = true;
      opt.textContent = `${localDate(s.date)}${s.time ? ` · ⏰ ${s.time}` : ''} · ${s.name || 'Sesión'}${s.pitch ? ` (${s.pitch})` : ''}`;
      select.appendChild(opt);
    });
    if (!sessions.length) {
      select.innerHTML = '<option value="">No hay sesiones creadas</option>';
    }
  } else if (waCurrentMode === 'week') {
    if (label) label.firstChild.textContent = 'Partidos de la semana (opcional) ';
    const weekRange = getSelectedWhatsAppWeekRange();

    // Encontrar partidos programados estrictamente dentro de la semana seleccionada (lunes a domingo)
    const matchesThisWeek = state.matches.filter((m) => {
      const d = (m.date || '').slice(0, 10);
      return d >= weekRange.start && d <= weekRange.end;
    }).sort((a, b) => a.date.localeCompare(b.date));

    // Otros partidos futuros (semanas siguientes)
    const otherMatches = state.matches.filter((m) => {
      const d = (m.date || '').slice(0, 10);
      return d > weekRange.end && m.status !== 'finished';
    }).sort((a, b) => a.date.localeCompare(b.date));

    const optAuto = document.createElement('option');
    optAuto.value = 'auto';
    if (matchesThisWeek.length > 1) {
      const opps = matchesThisWeek.map((m) => m.opponent).filter(Boolean).join(' y ');
      optAuto.textContent = `⚡ Automático: Incluir los ${matchesThisWeek.length} partidos (${opps})`;
    } else if (matchesThisWeek.length === 1) {
      optAuto.textContent = `⚡ Automático: ${localDate(matchesThisWeek[0].date)} · vs ${matchesThisWeek[0].opponent}`;
    } else {
      optAuto.textContent = '⚡ Automático: Sin partidos esa semana';
    }
    optAuto.selected = true;
    select.appendChild(optAuto);

    if (matchesThisWeek.length > 1) {
      matchesThisWeek.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = `match:${m.id}`;
        opt.textContent = `📅 Solo este partido: ${localDate(m.date)} · vs ${m.opponent}`;
        select.appendChild(opt);
      });
    } else if (matchesThisWeek.length === 1) {
      const opt = document.createElement('option');
      opt.value = `match:${matchesThisWeek[0].id}`;
      opt.textContent = `📅 Partido de esa semana: ${localDate(matchesThisWeek[0].date)} · vs ${matchesThisWeek[0].opponent}`;
      select.appendChild(opt);
    }

    otherMatches.slice(0, 4).forEach((m) => {
      const opt = document.createElement('option');
      opt.value = `match:${m.id}`;
      opt.textContent = `Próximo: ${localDate(m.date)} · vs ${m.opponent}`;
      select.appendChild(opt);
    });

    const optNone = document.createElement('option');
    optNone.value = 'none';
    optNone.textContent = '❌ Sin partidos en la planificación';
    select.appendChild(optNone);
  }
}

function populateWhatsAppRecipients(preselectedPlayerId = '') {
  const select = $('#wa-recipient-select');
  const parentsGroup = $('#wa-parents-group');
  if (!select || !parentsGroup) return;
  parentsGroup.innerHTML = '';

  const sortedPlayers = sortPlayersByName(state.players);
  let preselectVal = 'group';

  sortedPlayers.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = `player:${p.id}`;
    const num = cleanPlayerNumber(p.number);
    const numLabel = num ? `Dorsal ${num} · ` : '';
    const contacts = [];
    if (p.fatherName) contacts.push(`👨 ${p.fatherName}`);
    else if (p.fatherPhone) contacts.push(`👨 ${p.fatherPhone}`);
    if (p.motherName) contacts.push(`👩 ${p.motherName}`);
    else if (p.motherPhone) contacts.push(`👩 ${p.motherPhone}`);
    const contactStr = contacts.length ? ` (${contacts.join(' · ')})` : '';

    opt.textContent = `${numLabel}${p.name}${contactStr}`;
    if (preselectedPlayerId === p.id) {
      preselectVal = opt.value;
    }
    parentsGroup.appendChild(opt);
  });

  select.value = preselectVal;
}

function isDesktopDevice() {
  if (typeof navigator === 'undefined') return false;
  return !/Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent || '');
}

function getWhatsAppUrl(phone, text, forceWeb = false) {
  const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
  const enc = encodeURIComponent(text || '');
  const useWeb = forceWeb || (isDesktopDevice() && forceWeb !== false);
  if (useWeb) {
    return cleanPhone
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${enc}`
      : `https://web.whatsapp.com/send?text=${enc}`;
  }
  return cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${enc}`
    : `https://api.whatsapp.com/send?text=${enc}`;
}

function updateWhatsAppDynamicButtons(targetPlayer, parentType = 'both') {
  const container = $('#wa-dynamic-open-buttons');
  if (!container) return;
  container.innerHTML = '';
  const text = $('#whatsapp-preview-text')?.value ?? '';
  const isDesktop = isDesktopDevice();

  if (!targetPlayer) {
    if (isDesktop) {
      const webBtn = document.createElement('a');
      webBtn.className = 'primary wa-open-action-btn';
      webBtn.style.cssText = 'background:#25D366;border-color:#25D366;color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 0.8rem;border-radius:6px;font-weight:600;font-size:0.875rem;';
      webBtn.textContent = '💻 Abrir WhatsApp Web (Grupo)';
      webBtn.href = getWhatsAppUrl('', text, true);
      webBtn.target = '_blank';
      webBtn.rel = 'noopener noreferrer';
      webBtn.dataset.phone = '';
      webBtn.dataset.forceWeb = 'true';
      container.appendChild(webBtn);

      const appBtn = document.createElement('a');
      appBtn.className = 'secondary wa-open-action-btn';
      appBtn.style.cssText = 'text-decoration:none;display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 0.8rem;border-radius:6px;font-weight:600;font-size:0.875rem;';
      appBtn.textContent = '📱 Abrir en App';
      appBtn.href = getWhatsAppUrl('', text, false);
      appBtn.target = '_blank';
      appBtn.rel = 'noopener noreferrer';
      appBtn.dataset.phone = '';
      appBtn.dataset.forceWeb = 'false';
      container.appendChild(appBtn);
    } else {
      const btn = document.createElement('a');
      btn.className = 'primary wa-open-action-btn';
      btn.style.cssText = 'background:#25D366;border-color:#25D366;color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 0.8rem;border-radius:6px;font-weight:600;font-size:0.875rem;';
      btn.textContent = '📱 Abrir WhatsApp (Grupo)';
      btn.href = getWhatsAppUrl('', text, false);
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.dataset.phone = '';
      btn.dataset.forceWeb = 'false';
      container.appendChild(btn);
    }
    return;
  }

  const fPhone = formatWhatsAppPhone(targetPlayer.fatherPhone);
  const mPhone = formatWhatsAppPhone(targetPlayer.motherPhone);
  const fName = targetPlayer.fatherName?.trim() || 'Padre';
  const mName = targetPlayer.motherName?.trim() || 'Madre';

  const createParentLink = (target, name, phone, rawPhone, isAppOption = false) => {
    const link = document.createElement('a');
    link.className = isAppOption ? 'secondary wa-open-action-btn' : 'primary wa-open-action-btn';
    link.dataset.parentTarget = target;
    link.dataset.parentName = name;
    link.dataset.phone = phone;
    link.dataset.forceWeb = isAppOption ? 'false' : (isDesktop ? 'true' : 'false');
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    if (phone) {
      const displayPhone = rawPhone || phone;
      link.href = getWhatsAppUrl(phone, text, link.dataset.forceWeb === 'true');
      if (isDesktop && !isAppOption) {
        link.style.cssText = 'background:#25D366;border-color:#25D366;color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 0.8rem;border-radius:6px;font-weight:600;font-size:0.875rem;';
        link.textContent = `💻 WhatsApp Web ${name} (${displayPhone})`;
      } else if (isDesktop && isAppOption) {
        link.style.cssText = 'text-decoration:none;display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 0.8rem;border-radius:6px;font-weight:600;font-size:0.875rem;';
        link.textContent = `📱 App ${name}`;
      } else {
        link.style.cssText = 'background:#25D366;border-color:#25D366;color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 0.8rem;border-radius:6px;font-weight:600;font-size:0.875rem;';
        link.textContent = `📱 WhatsApp ${name} (${displayPhone})`;
      }
    } else {
      link.href = '#';
      link.style.cssText = 'background:#475569;border-color:#475569;color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 0.8rem;border-radius:6px;font-weight:600;font-size:0.875rem;cursor:pointer;';
      link.textContent = `⚠️ WhatsApp ${name} (Sin tel)`;
      link.title = `Escribe el teléfono de ${name} arriba para abrir su chat directo`;
    }
    return link;
  };

  if (parentType === 'both' || parentType === 'father') {
    container.appendChild(createParentLink('father', fName, fPhone, targetPlayer.fatherPhone, false));
    if (isDesktop && fPhone) {
      container.appendChild(createParentLink('father', fName, fPhone, targetPlayer.fatherPhone, true));
    }
  }
  if (parentType === 'both' || parentType === 'mother') {
    container.appendChild(createParentLink('mother', mName, mPhone, targetPlayer.motherPhone, false));
    if (isDesktop && mPhone) {
      container.appendChild(createParentLink('mother', mName, mPhone, targetPlayer.motherPhone, true));
    }
  }
}

function updateWhatsAppPreview() {
  const preview = $('#whatsapp-preview-text');
  if (!preview) return;

  const kitConfig = getKitConfig();
  const teamName = state.settings?.teamName || 'C.F. Unión Viera Alevín D';
  const recipientVal = $('#wa-recipient-select')?.value || 'group';
  const tone = $('#wa-tone-select')?.value || 'canary';

  let recipientType = 'group';
  let targetPlayer = null;

  if (recipientVal.startsWith('player:')) {
    recipientType = 'parent';
    const pId = recipientVal.replace('player:', '');
    targetPlayer = state.players.find((p) => p.id === pId) || null;
  }

  // Sincronizar visibilidad de controles de destinatario individual y contactos familiares
  const parentSelectionRow = $('#wa-parent-selection-row');
  const familyContactsRow = $('#wa-family-contacts-row');
  const callupStatusCol = $('#wa-callup-status-col');
  if (parentSelectionRow) {
    parentSelectionRow.classList.toggle('hidden', recipientType === 'group' || !targetPlayer);
  }
  if (familyContactsRow) {
    familyContactsRow.classList.toggle('hidden', recipientType === 'group' || !targetPlayer);
    if (targetPlayer && waLastContactPlayerId !== targetPlayer.id) {
      waLastContactPlayerId = targetPlayer.id;
      if ($('#wa-father-name-input')) $('#wa-father-name-input').value = targetPlayer.fatherName || '';
      if ($('#wa-father-phone-input')) $('#wa-father-phone-input').value = targetPlayer.fatherPhone || '';
      if ($('#wa-mother-name-input')) $('#wa-mother-name-input').value = targetPlayer.motherName || '';
      if ($('#wa-mother-phone-input')) $('#wa-mother-phone-input').value = targetPlayer.motherPhone || '';
    }
  }
  if (callupStatusCol) {
    callupStatusCol.classList.toggle('hidden', waCurrentMode !== 'callup');
  }

  // Leer valores en vivo de contactos familiares (permitiendo edición interactiva)
  const currentFatherName = $('#wa-father-name-input')?.value?.trim() ?? (targetPlayer?.fatherName?.trim() || '');
  const currentFatherPhone = $('#wa-father-phone-input')?.value?.trim() ?? (targetPlayer?.fatherPhone?.trim() || '');
  const currentMotherName = $('#wa-mother-name-input')?.value?.trim() ?? (targetPlayer?.motherName?.trim() || '');
  const currentMotherPhone = $('#wa-mother-phone-input')?.value?.trim() ?? (targetPlayer?.motherPhone?.trim() || '');

  const effectivePlayer = targetPlayer ? {
    ...targetPlayer,
    fatherName: currentFatherName,
    fatherPhone: currentFatherPhone,
    motherName: currentMotherName,
    motherPhone: currentMotherPhone,
  } : null;

  const parentType = $('#wa-parent-type-select')?.value || 'both';
  const callupStatus = $('#wa-callup-status-select')?.value || 'auto';

  // Actualizar textos dinámicos de los progenitores en el select
  if (effectivePlayer && $('#wa-parent-type-select')) {
    const opts = $('#wa-parent-type-select').options;
    if (opts && opts.length >= 3) {
      const fName = effectivePlayer.fatherName?.trim() || '';
      const mName = effectivePlayer.motherName?.trim() || '';
      const fPhone = effectivePlayer.fatherPhone?.trim() || '';
      const mPhone = effectivePlayer.motherPhone?.trim() || '';

      opts[0].textContent = `👨‍👩‍👦 Padre y Madre (ambos)${fName && mName ? ` — ${fName} y ${mName}` : ''}`;
      opts[1].textContent = `👨 Solo Padre${fName ? ` — ${fName}` : ''}${fPhone ? ` (${fPhone})` : ' (Sin tel)'}`;
      opts[2].textContent = `👩 Solo Madre${mName ? ` — ${mName}` : ''}${mPhone ? ` (${mPhone})` : ' (Sin tel)'}`;
    }
  }

  if (waCurrentMode === 'callup') {
    const eventVal = $('#wa-event-select')?.value || '';
    let match = null;
    let callup = null;

    if (eventVal.startsWith('callup:')) {
      const cId = eventVal.replace('callup:', '');
      callup = state.callups.find((c) => c.id === cId) || null;
      match = state.matches.find((m) => m.callupId === cId || m.id === callup?.matchId) || {
        opponent: callup?.opponent || 'Rival',
        date: callup?.date || '',
        location: 'Campo Alfonso Silva (La Ballena)',
        type: callup?.matchType || 'league',
      };
    } else {
      const mId = eventVal.startsWith('match:') ? eventVal.replace('match:', '') : eventVal;
      match = state.matches.find((m) => m.id === mId) || state.matches[0] || {};
      callup = state.callups.find((c) => c.id === match?.callupId || c.matchId === match?.id) || null;
    }

    const selectedMatchType = match?.type || callup?.matchType || 'league';
    const isLeagueMatch = selectedMatchType === 'league';

    // En WhatsApp solo Liga usa convocados/no convocados. Amistosos y torneos
    // son avisos de partido para toda la plantilla.
    if (callupStatusCol) callupStatusCol.classList.toggle('hidden', !isLeagueMatch);

    // Determinar si el jugador está marcado como NO convocado únicamente en Liga.
    const isExcluded = isLeagueMatch && recipientType === 'parent' && effectivePlayer && (
      callupStatus === 'excluded' ||
      (callupStatus === 'auto' && callup && (
        (new Set(callup.excludedIds || [])).has(effectivePlayer.id) ||
        (Array.isArray(callup.exclusions) && callup.exclusions.some((e) => (typeof e === 'object' ? (e.playerId || e.id) : e) === effectivePlayer.id)) ||
        (Array.isArray(callup.availableIds) && callup.availableIds.length > 0 && !callup.availableIds.includes(effectivePlayer.id))
      ))
    );

    // Ocultar detalles de partido si NO va convocado (solo puede ocurrir en Liga).
    $('#wa-match-details-row')?.classList.toggle('hidden', Boolean(isExcluded));
    $('#wa-location-row')?.classList.toggle('hidden', Boolean(isExcluded));
    $('#wa-times-row')?.classList.toggle('hidden', Boolean(isExcluded));
    $('#wa-exclusion-reason-row')?.classList.toggle('hidden', !isExcluded);

    let exclusionReason = 'rotation';
    let exclusionNote = '';

    if (isExcluded) {
      if (waLastExclusionPlayerId !== effectivePlayer.id) {
        waLastExclusionPlayerId = effectivePlayer.id;
        const autoEx = Array.isArray(callup?.exclusions)
          ? callup.exclusions.find((e) => (typeof e === 'object' ? (e.playerId || e.id) : e) === effectivePlayer.id)
          : null;

        let detectedReason = 'rotation';
        let detectedNote = '';
        if (autoEx && typeof autoEx === 'object') {
          const r = autoEx.reason;
          if (r === 'suspended') detectedReason = 'cards';
          else if (r === 'missed_training') detectedReason = 'training';
          else if (['rotation', 'injured', 'cards', 'training', 'sick', 'coach_decision', 'personal'].includes(r)) detectedReason = r;
          else if (r === 'other') detectedReason = 'custom';
          detectedNote = autoEx.note || '';
        }
        if ($('#wa-exclusion-reason-select')) {
          $('#wa-exclusion-reason-select').value = detectedReason;
        }
        if ($('#wa-exclusion-custom-note')) {
          $('#wa-exclusion-custom-note').value = detectedNote;
        }
      }

      exclusionReason = $('#wa-exclusion-reason-select')?.value || 'rotation';
      const showNote = exclusionReason === 'custom' || ['injured', 'cards', 'sick', 'coach_decision', 'personal'].includes(exclusionReason);
      $('#wa-exclusion-note-col')?.classList.toggle('hidden', !showNote);
      exclusionNote = $('#wa-exclusion-custom-note')?.value?.trim() || '';
    }

    const kitOption = $('#wa-kit-select')?.value || 'primary';
    let kitText = kitConfig.primaryKit;
    if (kitOption === 'secondary') kitText = kitConfig.secondaryKit;
    else if (kitOption === 'training') kitText = kitConfig.trainingKit;

    const includeBibs = $('#wa-include-bibs')?.checked || false;
    const fieldInput = $('#wa-field-name');
    let fieldName = fieldInput?.value?.trim();
    if (!fieldName) {
      fieldName = match?.location || '';
      if (fieldInput) fieldInput.value = fieldName;
    }

    const mapsInput = $('#wa-maps-url');
    let mapsUrl = mapsInput?.value?.trim();
    if (!mapsUrl && fieldName) {
      mapsUrl = getAutoMapsUrl(fieldName);
      if (mapsInput) mapsInput.value = mapsUrl;
    }

    const callTime = $('#wa-call-time')?.value?.trim() || '08:15';
    const gameTime = $('#wa-game-time')?.value?.trim() || '09:00';

    const text = buildWhatsAppMatchConvocatoria({
      match,
      callup,
      players: state.players.map((p) => (p.id === effectivePlayer?.id ? effectivePlayer : p)),
      fieldName,
      mapsUrl,
      callTime,
      gameTime,
      kit: kitText,
      includeBibs,
      bibsConfig: kitConfig.bibsConfig,
      targetPlayerId: effectivePlayer?.id || null,
      recipientType,
      parentType,
      callupStatus,
      exclusionReason,
      exclusionNote,
      competition: matchTypeLabel(selectedMatchType),
      tone,
    });
    preview.value = text;
  } else if (waCurrentMode === 'training') {
    $('#wa-exclusion-reason-row')?.classList.add('hidden');
    const sessionId = $('#wa-event-select')?.value;
    const session = state.trainingSessions.find((s) => s.id === sessionId) || state.trainingSessions[0] || {};

    const fieldInput = $('#wa-field-name');
    let fieldName = fieldInput?.value?.trim();
    if (!fieldName) {
      fieldName = session.pitch || 'Campo Alfonso Silva (La Ballena)';
      if (fieldInput) fieldInput.value = fieldName;
    }

    const mapsInput = $('#wa-maps-url');
    let mapsUrl = mapsInput?.value?.trim();
    if (!mapsUrl && fieldName) {
      mapsUrl = getAutoMapsUrl(fieldName);
      if (mapsInput) mapsInput.value = mapsUrl;
    }

    const text = buildWhatsAppTrainingDay({
      teamName,
      session,
      fieldName,
      mapsUrl,
      kitTraining: kitConfig.trainingKit,
      targetPlayer: effectivePlayer,
      parentType,
      tone,
    });
    preview.value = text;
  } else if (waCurrentMode === 'week') {
    $('#wa-exclusion-reason-row')?.classList.add('hidden');
    const tacticalGoal = $('#wa-week-tactical')?.value || '';
    const weekRange = getSelectedWhatsAppWeekRange();
    const weekRangeLabel = formatWeekSpanLabel(weekRange.start, weekRange.end);

    // Obtener sesiones y entrenamientos de la semana seleccionada
    const weekSessionsMap = new Map();

    // 1. Sesiones de entrenamiento planificadas en esa semana
    state.trainingSessions
      .filter((s) => s.date && s.date >= weekRange.start && s.date <= weekRange.end)
      .forEach((s) => {
        let dur = s.totalDuration || s.targetDuration || 75;
        if (dur < 45) dur = 75;
        weekSessionsMap.set(String(s.date).slice(0, 10), {
          date: s.date,
          time: s.time || '16:30',
          field: s.pitch || 'Alfonso Silva',
          duration: dur,
        });
      });

    // 2. Asistencias de tipo entrenamiento registradas para esa semana (si no tenían sesión creada)
    state.trainings
      .filter((t) => (t.kind ?? 'training') === 'training' && t.date && t.date >= weekRange.start && t.date <= weekRange.end)
      .forEach((t) => {
        const dateKey = String(t.date).slice(0, 10);
        if (!weekSessionsMap.has(dateKey)) {
          weekSessionsMap.set(dateKey, {
            date: t.date,
            time: '16:30',
            field: 'Alfonso Silva',
            duration: 75,
          });
        }
      });

    const sessions = Array.from(weekSessionsMap.values()).sort((a, b) => {
      const cmp = String(a.date || '').localeCompare(String(b.date || ''));
      if (cmp !== 0) return cmp;
      return String(a.time || '').localeCompare(String(b.time || ''));
    });

    const eventVal = $('#wa-event-select')?.value || 'auto';
    let targetMatches = [];
    if (eventVal === 'none') {
      targetMatches = [];
    } else if (eventVal.startsWith('match:')) {
      const mId = eventVal.slice('match:'.length);
      const single = state.matches.find((m) => m.id === mId) || null;
      if (single) targetMatches = [single];
    } else {
      // 'auto': Todos los partidos programados dentro de la semana seleccionada
      targetMatches = state.matches.filter((m) => {
        const d = (m.date || '').slice(0, 10);
        return d >= weekRange.start && d <= weekRange.end;
      }).sort((a, b) => a.date.localeCompare(b.date));
    }

    const text = buildWhatsAppTrainingWeek({
      teamName,
      sessions,
      matches: targetMatches.map((m) => ({
        date: m.date,
        time: m.date && m.date.includes('T') ? m.date.split('T')[1].slice(0, 5) : (m.time || '09:00'),
        opponent: m.opponent,
        field: m.location || (m.venue === 'away' ? 'Campo rival' : 'Alfonso Silva'),
        type: m.type,
      })),
      tacticalGoal,
      includeTacticalGoal: Boolean(tacticalGoal),
      weekRangeLabel,
      tone,
    });
    preview.value = text;
  }

  updateWhatsAppDynamicButtons(effectivePlayer, parentType);
}

// ==========================================================================
// MODO SILBATO & CRONÓMETRO DE CAMPO (WEB AUDIO FOX 40 + VIBRACIÓN)
// ==========================================================================
let whistleAudioCtx = null;
let whistleSoundEnabled = true;
let whistleVibrateEnabled = true;
let whistleActiveSession = null;
let whistleBlocks = [];
let whistleCurrentIndex = 0;
let whistleRemainingSeconds = 0;
let whistleTotalBlockSeconds = 0;
let whistleIntervalId = null;
let whistleIsRunning = false;

function getWhistleAudioContext() {
  if (!whistleAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) whistleAudioCtx = new AudioContextClass();
  }
  if (whistleAudioCtx && whistleAudioCtx.state === 'suspended') {
    whistleAudioCtx.resume().catch(() => {});
  }
  return whistleAudioCtx;
}

function synthesizeFox40Blast(ctx, startTime, duration) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = 'triangle';
  osc2.type = 'sawtooth';
  osc1.frequency.setValueAtTime(2920, startTime);
  osc2.frequency.setValueAtTime(3120, startTime);

  const mod = ctx.createOscillator();
  mod.type = 'sine';
  mod.frequency.setValueAtTime(36, startTime);
  const modGain = ctx.createGain();
  modGain.gain.setValueAtTime(140, startTime);
  mod.connect(modGain);
  modGain.connect(osc1.frequency);
  modGain.connect(osc2.frequency);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.02);
  gain.gain.setValueAtTime(0.35, startTime + duration - 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  mod.start(startTime);
  osc1.start(startTime);
  osc2.start(startTime);

  mod.stop(startTime + duration);
  osc1.stop(startTime + duration);
  osc2.stop(startTime + duration);
}

function synthesizeHapticBassPulse(ctx, startTime, duration) {
  const hapticOsc = ctx.createOscillator();
  const hapticGain = ctx.createGain();
  hapticOsc.type = 'sine';
  hapticOsc.frequency.setValueAtTime(55, startTime);
  hapticGain.gain.setValueAtTime(0.9, startTime);
  hapticGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  hapticOsc.connect(hapticGain);
  hapticGain.connect(ctx.destination);
  hapticOsc.start(startTime);
  hapticOsc.stop(startTime + duration + 0.05);
}

function playFox40Whistle(type = 'alarm') {
  const isTriple = type === 'alarm' || type === 'triple';
  const isLong = type === 'long';

  // 1. Vibración háptica en la primera línea de ejecución sincrónica
  if (whistleVibrateEnabled) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        const pattern = isTriple
          ? [180, 80, 180, 80, 520]
          : (isLong ? [350, 100, 450] : [200, 80, 200]);
        const ok = navigator.vibrate(pattern);
        if (!ok) {
          navigator.vibrate(isTriple ? 500 : (isLong ? 600 : 250));
        }
      } catch (_) {
        try { navigator.vibrate(isTriple ? 500 : 250); } catch (__) {}
      }
    }

    // Efecto háptico visual (sacudida de pantalla triple o simple)
    const targets = [$('.whistle-timer-hero'), $('#whistle-dialog')].filter(Boolean);
    targets.forEach((el) => {
      el.classList.remove('whistle-vibrating');
      void el.offsetWidth;
      el.classList.add('whistle-vibrating');
      setTimeout(() => el.classList.remove('whistle-vibrating'), isTriple ? 1150 : 450);
    });
  }

  // 2. Acústica Web Audio
  if (whistleSoundEnabled) {
    try {
      const ctx = getWhistleAudioContext();
      if (ctx) {
        const now = ctx.currentTime;
        if (isTriple) {
          synthesizeFox40Blast(ctx, now, 0.18);
          synthesizeFox40Blast(ctx, now + 0.26, 0.18);
          synthesizeFox40Blast(ctx, now + 0.52, 0.55);

          if (whistleVibrateEnabled) {
            synthesizeHapticBassPulse(ctx, now, 0.18);
            synthesizeHapticBassPulse(ctx, now + 0.26, 0.18);
            synthesizeHapticBassPulse(ctx, now + 0.52, 0.5);
          }
        } else if (isLong) {
          synthesizeFox40Blast(ctx, now, 0.9);
          if (whistleVibrateEnabled) synthesizeHapticBassPulse(ctx, now, 0.45);
        } else {
          synthesizeFox40Blast(ctx, now, 0.35);
          if (whistleVibrateEnabled) synthesizeHapticBassPulse(ctx, now, 0.22);
        }
      }
    } catch (e) {
      console.warn('Silbato Web Audio no disponible:', e);
    }
  }
}

function openWhistleDialog(sessionId) {
  const dialog = $('#whistle-dialog');
  if (!dialog) return;

  const session = state.trainingSessions.find((s) => s.id === sessionId);
  whistleActiveSession = session || null;

  if (session && Array.isArray(session.blocks) && session.blocks.length) {
    whistleBlocks = session.blocks.map((b, idx) => ({
      index: idx,
      name: exerciseName(b.exerciseId) || `Bloque ${idx + 1}`,
      durationMin: Number(b.duration) || 15,
      type: b.type || 'main',
      notes: b.notes || '',
      completed: false,
    }));
  } else {
    // Bloques predeterminados de sesión
    whistleBlocks = [
      { index: 0, name: 'Calentamiento dinámico y movilidad', durationMin: 15, type: 'warmup', notes: '', completed: false },
      { index: 1, name: 'Parte Principal: Tarea técnica/táctica', durationMin: 25, type: 'main', notes: '', completed: false },
      { index: 2, name: 'Juego de aplicación / Partido reducido', durationMin: 20, type: 'scrimmage', notes: '', completed: false },
    ];
  }

  whistleCurrentIndex = 0;
  setupWhistleBlock(0);
  renderWhistleBlocksList();
  dialog.showModal();
}

function setupWhistleBlock(index) {
  if (index < 0 || index >= whistleBlocks.length) return;
  pauseWhistleTimer();
  whistleCurrentIndex = index;
  const block = whistleBlocks[index];
  whistleTotalBlockSeconds = block.durationMin * 60;
  whistleRemainingSeconds = whistleTotalBlockSeconds;
  updateWhistleDisplay();
}

function updateWhistleDisplay() {
  const block = whistleBlocks[whistleCurrentIndex];
  const minutes = Math.floor(whistleRemainingSeconds / 60);
  const seconds = whistleRemainingSeconds % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const display = $('#whistle-time-display');
  if (display) display.textContent = timeStr;

  const title = $('#whistle-block-title');
  if (title) title.textContent = block ? `${block.index + 1}. ${block.name}` : 'Entrenamiento';

  const meta = $('#whistle-block-meta');
  if (meta) meta.textContent = block ? `Fase: ${sessionBlockLabel(block.type)} · Duración programada: ${block.durationMin} min${block.notes ? ` · Consigna: ${block.notes}` : ''}` : '';

  const fill = $('#whistle-progress-fill');
  if (fill) {
    const elapsed = whistleTotalBlockSeconds - whistleRemainingSeconds;
    const pct = whistleTotalBlockSeconds > 0 ? Math.min(100, Math.round((elapsed / whistleTotalBlockSeconds) * 100)) : 0;
    fill.style.width = `${pct}%`;
  }

  const toggleBtn = $('#whistle-toggle-btn');
  if (toggleBtn) {
    toggleBtn.textContent = whistleIsRunning ? '⏸️ Pausar' : '▶️ Iniciar';
  }
}

function renderWhistleBlocksList() {
  const list = $('#whistle-blocks-list');
  if (!list) return;
  list.innerHTML = whistleBlocks.map((b, idx) => `
    <li class="whistle-block-item ${idx === whistleCurrentIndex ? 'current' : ''} ${b.completed ? 'completed' : ''}" data-block-idx="${idx}">
      <span style="display:flex;align-items:center;gap:0.45rem;">
        <input type="checkbox" class="whistle-block-check" data-block-idx="${idx}" ${b.completed ? 'checked' : ''}>
        <strong>${idx + 1}. ${escapeHtml(b.name)}</strong>
      </span>
      <span class="pill compact ${idx === whistleCurrentIndex ? 'accent' : ''}">${b.durationMin} min</span>
    </li>
  `).join('');
}

function startWhistleTimer() {
  if (whistleIsRunning) return;
  whistleIsRunning = true;
  playFox40Whistle('short');
  updateWhistleDisplay();

  whistleIntervalId = window.setInterval(() => {
    if (whistleRemainingSeconds > 0) {
      whistleRemainingSeconds--;
      updateWhistleDisplay();
    } else {
      // Fin del bloque: pitar largo
      pauseWhistleTimer();
      playFox40Whistle('long');
      toast(`¡Tiempo cumplido! Bloque "${whistleBlocks[whistleCurrentIndex]?.name}" finalizado.`);
      if (whistleBlocks[whistleCurrentIndex]) {
        whistleBlocks[whistleCurrentIndex].completed = true;
      }
      renderWhistleBlocksList();

      // Pasar automáticamente al siguiente si existe
      if (whistleCurrentIndex + 1 < whistleBlocks.length) {
        setupWhistleBlock(whistleCurrentIndex + 1);
        renderWhistleBlocksList();
      }
    }
  }, 1000);
}

function pauseWhistleTimer() {
  whistleIsRunning = false;
  if (whistleIntervalId) {
    clearInterval(whistleIntervalId);
    whistleIntervalId = null;
  }
  updateWhistleDisplay();
}

function toggleWhistleTimer() {
  if (whistleIsRunning) {
    pauseWhistleTimer();
    playFox40Whistle('short');
  } else {
    startWhistleTimer();
  }
}

function wireEvents() {
  $$('.bottom-nav button').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
  $('#global-search').addEventListener('input', applyGlobalSearch);
  $$('[data-dialog]').forEach((button) => button.addEventListener('click', async (event) => {
    const form = $(`#${button.dataset.dialog} form`);
    form?.reset();
    if (form?.elements.id) form.elements.id.value = '';
    if (form?.elements.photoRemoved) form.elements.photoRemoved.value = '0';
    if (button.dataset.dialog === 'player-dialog') playerCropper?.setExistingPhoto('');

    if (button.dataset.dialog === 'exercise-dialog') {
      event.preventDefault();
      if (form?.elements.formato_juego) {
        form.elements.formato_juego.value = state.format === 'F7' ? 'futbol_7' : 'futbol_11';
      }
      if (typeof window.__campobaseOpenExerciseCreator === 'function') {
        try {
          await window.__campobaseOpenExerciseCreator();
          return;
        } catch (error) {
          console.error('El creador visual no pudo abrirse; se usa el formulario de respaldo.', error);
          toast('Abriendo formulario de ejercicio de respaldo.');
        }
      }
    }

    $(`#${button.dataset.dialog}`).showModal();
  }));
  $$('.exercise-library-tab').forEach((button) => button.addEventListener('click', () => {
    setExerciseLibraryMode(button.dataset.exerciseLibraryMode);
  }));
  $$('[data-close]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));

  playerCropper = wirePhotoCropperField({
    fileInput: $('#player-form [name="photo"]'),
    previewImg: $('#player-photo-preview'),
    placeholder: $('#player-photo-placeholder'),
    existingInput: $('#player-form [name="existingPhoto"]'),
    controlsGroup: $('#player-photo-controls'),
    cropUpBtn: $('#player-crop-up-btn'),
    cropDownBtn: $('#player-crop-down-btn'),
    removeBtn: $('#player-remove-photo-btn'),
    onPhotoChanged: (val) => {
      const removedInput = $('#player-form [name="photoRemoved"]');
      if (removedInput) removedInput.value = val === '' ? '1' : '0';
    },
  });

  // Comportamiento de acordión: solo un jugador desplegado a la vez y encuadre visual suave
  document.addEventListener('toggle', (event) => {
    const details = event.target;
    if (details.matches?.('details.player-performance') && details.open) {
      document.querySelectorAll('details.player-performance[open]').forEach((other) => {
        if (other !== details) other.open = false;
      });
      details.closest('.card.player')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, true);

  $('#player-form').addEventListener('submit', (event) => savePlayer(event).catch(handleError));
  $('#player-stats-form').addEventListener('submit', (event) => savePlayerStats(event).catch(handleError));
  $('#set-pieces-form')?.addEventListener('submit', (event) => saveSetPiecesForm(event).catch(handleError));
  $('#match-form').addEventListener('submit', (event) => saveMatch(event).catch(handleError));
  $('#kit-settings-form')?.addEventListener('submit', (event) => saveKitSettings(event).catch(handleError));

  document.addEventListener('click', (event) => {
    const openSetPiecesBtn = event.target.closest('#open-set-pieces-btn, .open-set-pieces-trigger');
    if (openSetPiecesBtn) {
      if (!roleCanUseOwnerFeatures(state.role)) {
        toast('Solo Migue puede configurar los especialistas.');
        return;
      }
      populateSetPiecesForm();
      $('#set-pieces-dialog')?.showModal();
      return;
    }

    const shareMobileBtn = event.target.closest('#share-data-mobile, .share-database-mobile-btn');
    if (shareMobileBtn) {
      shareDatabaseToMobile().catch(handleError);
      return;
    }

    const quickImportBtn = event.target.closest('.quick-import-mobile-btn, #btn-quick-import-mobile');
    if (quickImportBtn) {
      $('#import-data')?.click();
      return;
    }

    const lbTabBtn = event.target.closest('.lb-tab-btn[data-lb-tab]');
    if (lbTabBtn) {
      state.leaderboardTab = lbTabBtn.dataset.lbTab;
      renderSquadLeaderboards();
      return;
    }

    const lbScopeBtn = event.target.closest('.lb-scope-btn[data-lb-scope]');
    if (lbScopeBtn) {
      state.leaderboardScope = lbScopeBtn.dataset.lbScope;
      renderSquadLeaderboards();
      return;
    }
  });

  document.addEventListener('toggle', (event) => {
    if (event.target.matches?.('details.squad-leaderboards-card')) {
      state.isLeaderboardsOpen = event.target.open;
      const toggleBadge = event.target.querySelector('.lb-toggle-text');
      if (toggleBadge) {
        toggleBadge.textContent = event.target.open ? 'Cerrar tablas clasificatorias ▴' : 'Desplegar tablas clasificatorias ▾';
      }
    }
  }, true);

  // Pestañas del comunicador WhatsApp
  $$('.whatsapp-type-tabs .tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      waCurrentMode = btn.dataset.waType;
      $$('.whatsapp-type-tabs .tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
      $('#wa-match-details-row')?.classList.toggle('hidden', waCurrentMode !== 'callup');
      $('#wa-location-row')?.classList.toggle('hidden', waCurrentMode === 'week');
      $('#wa-times-row')?.classList.toggle('hidden', waCurrentMode === 'week');
      $('#wa-week-tactical-row')?.classList.toggle('hidden', waCurrentMode !== 'week');
      if (waCurrentMode === 'week') populateWhatsAppWeekSelector();
      populateWhatsAppEvents();
      updateWhatsAppPreview();
    });
  });

  // Modificación de campos en el comunicador WhatsApp
  $('#wa-event-select')?.addEventListener('change', () => {
    if (waCurrentMode === 'callup') {
      syncWhatsAppMatchLocation();
    } else if (waCurrentMode === 'training') {
      const session = state.trainingSessions.find((s) => s.id === $('#wa-event-select').value);
      if (session) {
        if ($('#wa-field-name')) $('#wa-field-name').value = session.pitch || 'Campo Alfonso Silva (La Ballena)';
        if ($('#wa-maps-url')) $('#wa-maps-url').value = getAutoMapsUrl($('#wa-field-name').value);
      }
    }
    updateWhatsAppPreview();
  });

  $('#wa-recipient-select')?.addEventListener('change', () => {
    waLastExclusionPlayerId = null;
    const recipientVal = $('#wa-recipient-select')?.value || 'group';
    if (recipientVal.startsWith('player:') && $('#wa-callup-status-select')) {
      $('#wa-callup-status-select').value = 'auto';
    }
    updateWhatsAppPreview();
  });
  $('#wa-tone-select')?.addEventListener('change', updateWhatsAppPreview);
  $('#wa-parent-type-select')?.addEventListener('change', updateWhatsAppPreview);
  $('#wa-callup-status-select')?.addEventListener('change', () => {
    waLastExclusionPlayerId = null;
    updateWhatsAppPreview();
  });
  $('#wa-exclusion-reason-select')?.addEventListener('change', () => {
    const reason = $('#wa-exclusion-reason-select')?.value;
    const showNote = reason === 'custom' || ['injured', 'cards', 'sick', 'coach_decision', 'personal'].includes(reason);
    $('#wa-exclusion-note-col')?.classList.toggle('hidden', !showNote);
    if (reason === 'custom') {
      $('#wa-exclusion-custom-note')?.focus();
    }
    updateWhatsAppPreview();
  });
  $('#wa-exclusion-custom-note')?.addEventListener('input', updateWhatsAppPreview);
  $('#wa-kit-select')?.addEventListener('change', updateWhatsAppPreview);
  $('#wa-include-bibs')?.addEventListener('change', updateWhatsAppPreview);
  $('#wa-call-time')?.addEventListener('input', updateWhatsAppPreview);
  $('#wa-game-time')?.addEventListener('input', updateWhatsAppPreview);
  $('#wa-week-tactical')?.addEventListener('input', updateWhatsAppPreview);
  $('#wa-week-select')?.addEventListener('change', () => {
    populateWhatsAppEvents();
    updateWhatsAppPreview();
  });
  $('#wa-field-name')?.addEventListener('input', () => {
    const val = $('#wa-field-name').value.trim();
    if (val && $('#wa-maps-url')) {
      $('#wa-maps-url').value = getAutoMapsUrl(val);
    }
    updateWhatsAppPreview();
  });
  $('#wa-maps-url')?.addEventListener('input', updateWhatsAppPreview);

  // Botón probar Google Maps
  $('#wa-test-maps-btn')?.addEventListener('click', () => {
    const url = $('#wa-maps-url')?.value?.trim() || getAutoMapsUrl($('#wa-field-name')?.value?.trim());
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  });

  // Copiar y Enviar WhatsApp
  $('#whatsapp-copy-btn')?.addEventListener('click', async () => {
    const text = $('#whatsapp-preview-text')?.value ?? '';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        $('#whatsapp-preview-text').select();
        document.execCommand('copy');
      }
      toast('Mensaje copiado al portapapeles.');
    } catch {
      toast('Mensaje copiado.');
    }
  });

  function openWhatsAppLink(waUrl) {
    if (!waUrl) return;
    const isWeb = waUrl.includes('web.whatsapp.com');
    toast(isWeb ? 'Abriendo WhatsApp Web...' : 'Abriendo WhatsApp...');
    try {
      const win = window.open(waUrl, '_blank', 'noopener,noreferrer');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        const link = document.createElement('a');
        link.href = waUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => link.remove(), 300);
      }
    } catch {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  }

  // Enviar a WhatsApp mediante botones/enlaces dinámicos (Padre / Madre / Ambos / Grupo)
  $('#wa-dynamic-open-buttons')?.addEventListener('click', (event) => {
    const btn = event.target.closest('.wa-open-action-btn');
    if (!btn) return;
    const parentTarget = btn.dataset.parentTarget;
    const parentName = btn.dataset.parentName;
    const forceWeb = btn.dataset.forceWeb === 'true';
    let phone = btn.dataset.phone || '';

    // Si no tiene teléfono en data-phone, intentar tomarlo de los inputs familiares en vivo
    if (!phone) {
      if (parentTarget === 'father') {
        const inputVal = $('#wa-father-phone-input')?.value?.trim();
        if (inputVal) phone = formatWhatsAppPhone(inputVal);
      } else if (parentTarget === 'mother') {
        const inputVal = $('#wa-mother-phone-input')?.value?.trim();
        if (inputVal) phone = formatWhatsAppPhone(inputVal);
      }
    }

    if (parentTarget && !phone) {
      event.preventDefault();
      toast(`⚠️ Indica el teléfono de ${parentName || 'contacto'} arriba para abrir su chat directo.`, 'warning');
      if (parentTarget === 'father') $('#wa-father-phone-input')?.focus();
      else if (parentTarget === 'mother') $('#wa-mother-phone-input')?.focus();
      return;
    }

    let text = $('#whatsapp-preview-text')?.value ?? '';

    // Si se envía de forma individual a padre o madre cuando se tenían ambos seleccionados,
    // ajustar el saludo de la primera línea para que vaya dirigido solo a ese progenitor
    if (parentTarget && parentName && parentName !== 'Padre' && parentName !== 'Madre') {
      text = text.replace(/^(Buenos días|Buenas tardes|Buenas noches)\s+[^:\n]+:/m, `$1 ${parentName}:`);
    }

    const waUrl = getWhatsAppUrl(phone, text, forceWeb);
    btn.href = waUrl;
    toast(waUrl.includes('web.whatsapp.com') ? 'Abriendo WhatsApp Web...' : 'Abriendo WhatsApp...');
  });

  // Contactos familiares en vivo y guardado en ficha
  $('#wa-father-name-input')?.addEventListener('input', updateWhatsAppPreview);
  $('#wa-father-phone-input')?.addEventListener('input', updateWhatsAppPreview);
  $('#wa-mother-name-input')?.addEventListener('input', updateWhatsAppPreview);
  $('#wa-mother-phone-input')?.addEventListener('input', updateWhatsAppPreview);

  $('#wa-save-family-contacts-btn')?.addEventListener('click', async () => {
    const recipientVal = $('#wa-recipient-select')?.value || '';
    if (!recipientVal.startsWith('player:')) return;
    const pId = recipientVal.replace('player:', '');
    const player = state.players.find((p) => p.id === pId);
    if (!player) return;

    player.fatherName = $('#wa-father-name-input')?.value?.trim() || '';
    player.fatherPhone = $('#wa-father-phone-input')?.value?.trim() || '';
    player.motherName = $('#wa-mother-name-input')?.value?.trim() || '';
    player.motherPhone = $('#wa-mother-phone-input')?.value?.trim() || '';

    await put('players', player);
    toast(`Datos familiares de ${player.name} guardados en su ficha.`);
    updateWhatsAppPreview();
  });

  $('#whatsapp-open-btn')?.addEventListener('click', () => {
    const text = $('#whatsapp-preview-text')?.value ?? '';
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    openWhatsAppLink(waUrl);
  });

  // Controles de Modo Silbato & Cronómetro
  $('#whistle-toggle-btn')?.addEventListener('click', toggleWhistleTimer);
  $('#whistle-prev-btn')?.addEventListener('click', () => {
    if (whistleCurrentIndex > 0) {
      setupWhistleBlock(whistleCurrentIndex - 1);
      renderWhistleBlocksList();
      playFox40Whistle('short');
    }
  });
  $('#whistle-next-btn')?.addEventListener('click', () => {
    if (whistleCurrentIndex + 1 < whistleBlocks.length) {
      setupWhistleBlock(whistleCurrentIndex + 1);
      renderWhistleBlocksList();
      playFox40Whistle('short');
    }
  });
  $('#whistle-complete-btn')?.addEventListener('click', () => {
    if (whistleBlocks[whistleCurrentIndex]) {
      whistleBlocks[whistleCurrentIndex].completed = true;
    }
    renderWhistleBlocksList();
    if (whistleCurrentIndex + 1 < whistleBlocks.length) {
      setupWhistleBlock(whistleCurrentIndex + 1);
      renderWhistleBlocksList();
      playFox40Whistle('short');
    } else {
      pauseWhistleTimer();
      playFox40Whistle('alarm');
      toast('¡Sesión completada!');
    }
  });
  $('#whistle-sound-btn')?.addEventListener('click', () => {
    whistleSoundEnabled = !whistleSoundEnabled;
    const btn = $('#whistle-sound-btn');
    btn?.classList.toggle('active', whistleSoundEnabled);
    if (btn) btn.textContent = whistleSoundEnabled ? '🔊 Silbato Fox 40: Activado' : '🔇 Silbato Fox 40: Silenciado';
  });
  $('#whistle-vibrate-btn')?.addEventListener('click', () => {
    whistleVibrateEnabled = !whistleVibrateEnabled;
    const btn = $('#whistle-vibrate-btn');
    btn?.classList.toggle('active', whistleVibrateEnabled);
    if (btn) btn.textContent = whistleVibrateEnabled ? '📳 Vibración: Activada' : '📴 Vibración: Desactivada';
    if (whistleVibrateEnabled) {
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate([180, 80, 180, 80, 520]);
        }
      } catch (_) {}
      toast('Vibración activada.');
    } else {
      toast('Vibración desactivada.');
    }
  });
  $('#whistle-blow-btn')?.addEventListener('click', () => {
    if (whistleVibrateEnabled && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate([180, 80, 180, 80, 520]); } catch (_) {}
    }
    playFox40Whistle('alarm');
  });
  $('#whistle-dialog')?.addEventListener('close', () => {
    pauseWhistleTimer();
  });
  $('#whistle-blocks-list')?.addEventListener('click', (e) => {
    const check = e.target.closest('.whistle-block-check');
    if (check) {
      const idx = Number(check.dataset.blockIdx);
      if (whistleBlocks[idx]) {
        whistleBlocks[idx].completed = check.checked;
        renderWhistleBlocksList();
      }
      return;
    }
    const item = e.target.closest('.whistle-block-item');
    if (item && item.dataset.blockIdx !== undefined) {
      setupWhistleBlock(Number(item.dataset.blockIdx));
      renderWhistleBlocksList();
    }
  });

  $('#auth-form').addEventListener('submit', (event) => submitAuth(event).catch(handleError));
  $('#auth-dialog').addEventListener('cancel', (event) => {
    if (state.role) return;
    event.preventDefault();
  });
  $('#auth-dialog').addEventListener('close', () => {
    if (state.role) {
      refresh().then(() => renderAll()).catch(() => renderAll());
    }
  });
  $('#auth-demo-btn')?.addEventListener('click', async () => {
    try {
      $('#auth-error').textContent = 'Iniciando modo demo…';
      await startDemoSession(createDemoSession(crypto.randomUUID()));
      $('#auth-dialog').close();
      await refresh();
      renderAll();
    } catch (err) {
      $('#auth-error').textContent = err.message;
    }
  });
  async function reloadAppPreservingSession() {
    try {
      const activeView = document.querySelector('.view.active')?.id || storedActiveView();
      if (activeView) sessionStorage.setItem(ACTIVE_VIEW_KEY, activeView);
      window._swReloading = true;
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((registration) => registration.update().catch(() => null)));
      }
    } catch {
      // La recarga continúa; no se borra ninguna sesión por un fallo de update.
    }
    window.location.reload();
  }

  $('#auth-reload-btn')?.addEventListener('click', async () => {
    await reloadAppPreservingSession();
  });
  let authResetConfirming = false;
  $('#auth-reset-btn')?.addEventListener('click', () => {
    if (!authResetConfirming) {
      authResetConfirming = true;
      $('#auth-error').innerHTML = `
        <span style="display:block;margin-bottom:0.4rem;color:var(--danger,#dc2626);font-weight:600;">
          ¿Restablecer PIN? Podrás crear uno nuevo sin perder datos.
        </span>
        <div style="display:flex;gap:0.4rem;justify-content:center;">
          <button type="button" id="auth-confirm-reset-btn" class="danger compact" style="font-size:0.8rem;">Sí, restablecer</button>
          <button type="button" id="auth-cancel-reset-btn" class="secondary compact" style="font-size:0.8rem;">Cancelar</button>
        </div>
      `;
      $('#auth-confirm-reset-btn')?.addEventListener('click', async () => {
        authResetConfirming = false;
        delete state.settings.ownerPinHash;
        delete state.settings.delegatePinHash;
        delete state.settings.pinSalt;
        await put('settings', state.settings);
        showAuth();
        $('#auth-help').textContent = 'Acceso restablecido. Configura tu nuevo PIN de Migue y del delegado para continuar.';
      }, { once: true });
      $('#auth-cancel-reset-btn')?.addEventListener('click', () => {
        authResetConfirming = false;
        $('#auth-error').textContent = '';
      }, { once: true });
    }
  });
  $('#settings-logout')?.addEventListener('click', async () => {
    await logoutUser();
  });
  $('#settings-reload')?.addEventListener('click', async () => {
    await reloadAppPreservingSession();
  });
  $('#toggle-video-debug')?.addEventListener('click', () => {
    let current = false;
    try { current = localStorage.getItem('campobase.videoDebug') === '1'; } catch {}
    if (current) {
      try { localStorage.removeItem('campobase.videoDebug'); } catch {}
      toast('Diagnóstico de vídeo desactivado.');
    } else {
      try { localStorage.setItem('campobase.videoDebug', '1'); } catch {}
      toast('Diagnóstico de vídeo activado. Abre cualquier ejercicio para verlo.');
    }
  });
  $('#sync-now')?.addEventListener('click', async () => {
    const button = $('#sync-now');
    if (button) button.disabled = true;
    try {
      await synchronizeCloud();
      const info = await getSyncDiagnostics();
      if (info.pending === 0) toast('Sincronización completada.');
      else toast(`Quedan ${info.pending} cambios pendientes.`);
    } catch (error) {
      handleError(error);
    } finally {
      if (button) button.disabled = false;
      await refreshSyncStatusPanel();
    }
  });
  $('#recover-local-pending')?.addEventListener('click', async () => {
    const info = await getSyncDiagnostics();
    if (!info.legacyPending) return refreshSyncStatusPanel();
    const ok = await askConfirmation({
      title: 'Recuperar cambios locales',
      message: `Este dispositivo tiene ${info.legacyPending} cambio${info.legacyPending === 1 ? '' : 's'} pendiente${info.legacyPending === 1 ? '' : 's'} en el almacenamiento anterior. Se intentarán vincular a la cuenta con la que has iniciado sesión, sin borrar la copia local hasta que Supabase responda.`,
      acceptLabel: 'Recuperar y sincronizar',
    });
    if (!ok) return;
    const button = $('#recover-local-pending');
    if (button) button.disabled = true;
    try {
      const result = await recoverLegacyPendingMutations();
      await synchronizeCloud();
      toast(result.recovered
        ? `Recuperados ${result.recovered} cambios locales pendientes.`
        : 'No había cambios locales pendientes que recuperar.');
    } catch (error) {
      handleError(error);
    } finally {
      if (button) button.disabled = false;
      await refreshSyncStatusPanel();
    }
  });
  $('#pin-settings-form').addEventListener('submit', (event) => changePins(event).catch(handleError));
  $('#demo-pin-settings-form').addEventListener('submit', (event) => changeDemoPin(event).catch(handleError));
  $('#delegate-account-form')?.addEventListener('submit', (event) => saveDelegateAccountSettings(event).catch(handleError));
  $('#delegate-invite-whatsapp-btn')?.addEventListener('click', sendDelegateInviteWhatsApp);
  $('#delegate-invite-email-btn')?.addEventListener('click', sendDelegateInviteEmail);
  $('#team-settings-form').addEventListener('submit', (event) => saveTeamSettings(event).catch(handleError));
  $('#demo-team-form').addEventListener('submit', (event) => saveDemoTeam(event).catch(handleError));
  initCustomizationListeners();
  $('#new-callup').addEventListener('click', () => callupBuilder()); $('#new-training').addEventListener('click', () => attendanceBuilder()); $('#new-session').addEventListener('click', () => sessionBuilder()); $('#new-session-exercises').addEventListener('click', () => { showView('sesiones'); sessionBuilder(); }); $('#new-tactic').addEventListener('click', () => tacticBuilder());
  $('#exercise-filters').addEventListener('input', renderExercises);
  $('#exercise-filters').addEventListener('change', renderExercises);
  $('#tactica-filters').addEventListener('change', renderTacticasInteractivas);
  document.addEventListener('input', (event) => {
    if (event.target.matches('#session-form [name="blockDuration"]')) refreshSessionDurationStatus();
  });
  document.addEventListener('change', (event) => {
    if (event.target.matches('#tactic-form [name="formation"]')) {
      const form = event.target.closest('#tactic-form');
      const values = formObject(form);
      const base = defaultTactic(values.format || 'F7', values.formation);
      tacticDraft = { ...base, id: values.id, name: values.name, rival: values.rival, situation: values.situation, formation: values.formation, team: base.team, opponent: base.opponent, ball: base.ball, moves: [], notes: values.notes };
      const t = tacticDraft;
      const board = form.querySelector('.tactic-board');
      if (board) board.outerHTML = renderTacticBoard(t);
    }
  });
  // Interacción de la pizarra táctica: arrastrar jugadores, dibujar flechas, colocar balón.
  document.addEventListener('pointerdown', (event) => {
    const svg = event.target.closest('.tactic-board svg');
    if (!svg) return;
    const form = svg.closest('#tactic-form');
    if (!form) return;
    const piece = event.target.closest('[data-piece]')?.dataset.piece;
    const point = tacticPoint(event, svg);
    if (tacticTool === 'select' && (piece === 'team' || piece === 'opponent')) {
      const idx = Number(event.target.closest('[data-idx]').dataset.idx);
      const side = piece;
      const move = (ev) => {
        const p = tacticPoint(ev, svg);
        tacticDraft = moveTacticPiece(tacticDraft, side, idx, p);
        const el = svg.querySelector(`[data-piece="${side}"][data-idx="${idx}"]`);
        if (el) { el.querySelector('circle').setAttribute('cx', tacticDraft[side][idx].x); el.querySelector('circle').setAttribute('cy', tacticDraft[side][idx].y); el.querySelector('text').setAttribute('x', tacticDraft[side][idx].x); el.querySelector('text').setAttribute('y', tacticDraft[side][idx].y + 1.2); }
      };
      const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    } else if (tacticTool === 'ball') {
      tacticDraft = moveTacticPiece(tacticDraft, 'ball', 0, point);
      const ball = svg.querySelector('[data-piece="ball"]');
      if (ball) { ball.querySelector('circle').setAttribute('cx', tacticDraft.ball.x); ball.querySelector('circle').setAttribute('cy', tacticDraft.ball.y); }
    } else if (tacticTool === 'erase') {
      const arrow = event.target.closest('[data-piece="arrow"]');
      if (arrow && arrow.dataset.idx !== undefined) {
        const idx = Number(arrow.dataset.idx);
        tacticDraft = { ...tacticDraft, moves: (tacticDraft.moves || []).filter((_, i) => i !== idx) };
        rerenderTacticBoard();
      }
    } else if (tacticTool === 'clear') {
      tacticDraft = { ...tacticDraft, moves: [] };
      rerenderTacticBoard();
    } else if (['pass', 'move', 'dribble', 'shot', 'sprint'].includes(tacticTool)) {
      const start = point;
      const cls = { pass: 'tac-pass', move: 'tac-move', dribble: 'tac-dribble', shot: 'tac-shot', sprint: 'tac-sprint' }[tacticTool] || 'tac-pass';
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', start.x); line.setAttribute('y1', start.y); line.setAttribute('x2', start.x); line.setAttribute('y2', start.y);
      line.setAttribute('class', `tac-arrow ${cls}`);
      svg.appendChild(line);
      const move = (ev) => {
        const p = tacticPoint(ev, svg);
        line.setAttribute('x2', p.x); line.setAttribute('y2', p.y);
      };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        const to = { x: Number(line.getAttribute('x2')), y: Number(line.getAttribute('y2')) };
        line.remove();
        const created = createTacticMove(start, to, tacticTool);
        if (created) {
          tacticDraft = { ...tacticDraft, moves: [...(tacticDraft.moves || []), created] };
          rerenderTacticBoard();
        }
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    }
  });
  $('#export-data').addEventListener('click', () => exportData().catch(handleError)); $('#import-data').addEventListener('change', importData);
  $('#format').addEventListener('change', async (event) => {
    state.format = event.target.value;
    state.settings = { ...state.settings, id: 'main', format: state.format };
    await put('settings', state.settings);
    renderAll();
    if (!$('#callup-builder').classList.contains('hidden')) callupBuilder($('#callup-form')?.elements.matchId.value ?? '');
    toast(`Modalidad ${state.format} guardada y aplicada en toda la app.`);
  });
  document.addEventListener('change', (event) => {
    if (event.target.id === 'live-select') return updateKeeperOptions(event.target.value);
    if (event.target.matches('[data-minute-reason]')) {
      ensureLiveDetails().minuteReasons[event.target.dataset.minuteReason] = event.target.value;
      persistTimer().catch(handleError);
      return;
    }
    const attendanceForm = event.target.closest('#training-form');
    if (attendanceForm && event.target.name.startsWith('status-')) {
      const arrival = event.target.closest('.attendance-row').querySelector('.arrival-time');
      arrival.classList.toggle('hidden', event.target.value !== 'late');
      if (event.target.value !== 'late') $$('select', arrival).forEach((select) => { select.value = ''; });
      return;
    }
    if (attendanceForm && event.target.name === 'kind') {
      const firstMatchId = state.matches.find((m) => m.callupId || callupForMatch(m))?.id ?? '';
      return event.target.value === 'match' ? attendanceBuilder(firstMatchId) : attendanceBuilder();
    }
    if (attendanceForm && event.target.name === 'matchId') return attendanceBuilder(event.target.value);
    const sessionForm = event.target.closest('#session-form');
    if (sessionForm && event.target.name === 'blockExerciseId') {
      const exercise = state.exercises.find(({ id }) => id === event.target.value);
      const row = event.target.closest('.session-block');
      if (exercise && row) {
        row.querySelector('[name="blockType"]').value = sessionBlockType(exercise.category);
        row.querySelector('.pill').textContent = sessionBlockLabel(row.querySelector('[name="blockType"]').value);
      }
      syncSessionDraft();
      const newAuto = calculateSessionTotalMaterial(sessionDraftBlocks, state.exercises);
      if (!sessionDraftMeta.material || sessionDraftMeta.material === sessionDraftMeta._autoMaterial) {
        sessionDraftMeta.material = newAuto;
        sessionDraftMeta._autoMaterial = newAuto;
        if (sessionForm.elements.material) sessionForm.elements.material.value = newAuto;
      }
      return;
    }
    if (sessionForm && event.target.name === 'warmupId') {
      const selected = state.exercises.find(({ id }) => id === event.target.value);
      if (selected) sessionForm.elements.warmupDuration.value = selected.duration;
      return;
    }
    const form = event.target.closest('#callup-form'); if (!form) return;
    if (event.target.matches('input[name="matchSource"]')) updateMatchSource();
    if (event.target.matches('input[name="manualExcluded"]')) {
      const card = event.target.closest('[data-player-id]');
      const reason = form.elements[`reason-${event.target.value}`];
      const note = form.elements[`reasonNote-${event.target.value}`];
      reason.disabled = !event.target.checked;
      if (!event.target.checked) {
        reason.value = '';
        note.value = '';
        note.required = false;
        note.closest('.exclusion-other-note').classList.add('hidden');
      }
      const selected = card.querySelector('input[name="selected"]');
      if (event.target.checked) selected.checked = false;
    }
    if (event.target.matches('select[name^="reason-"]')) {
      const playerId = event.target.name.slice('reason-'.length);
      const note = form.elements[`reasonNote-${playerId}`];
      const usesOtherReason = event.target.value === 'other';
      note.required = usesOtherReason;
      note.closest('.exclusion-other-note').classList.toggle('hidden', !usesOtherReason);
      if (!usesOtherReason) note.value = '';
    }
    if (event.target.matches('input[name="selected"]') && event.target.checked) {
      const excluded = event.target.closest('[data-player-id]').querySelector('input[name="manualExcluded"]');
      const note = form.elements[`reasonNote-${event.target.value}`];
      excluded.checked = false;
      form.elements[`reason-${event.target.value}`].disabled = true;
      form.elements[`reason-${event.target.value}`].value = '';
      note.value = '';
      note.required = false;
      note.closest('.exclusion-other-note').classList.add('hidden');
    }
    updateTargetPreview();
  });
  document.addEventListener('submit', (event) => {
    const form = event.target.closest ? event.target.closest('form') : event.target;
    if (!form) return;
    event.preventDefault();
    const formId = form.getAttribute('id');
    if (formId === 'callup-form') saveCallup(event).catch(handleError);
    else if (formId === 'training-form') saveTraining(event).catch(handleError);
    else if (formId === 'rating-form') saveMatchRatings(event).catch(handleError);
    else if (formId === 'exercise-form') saveExercise(event).catch(handleError);
    else if (formId === 'session-form') saveTrainingSession(event).catch(handleError);
    else if (formId === 'add-session-form') saveAddToSession(event).catch(handleError);
    else if (formId === 'tactic-form') saveTactic(event).catch(handleError);
    else if (formId === 'kit-settings-form') saveKitSettings(event).catch(handleError);
  });
  document.addEventListener('click', async (event) => {
    const target = event.target.closest('button, a, input, select, summary, [role="button"], [data-action], .icon-button, [data-tactic-tool], [data-close], [data-id], .view-exercise, .session-exercise-link') || event.target;
    if (target.matches('.open-whatsapp-callup')) openWhatsAppDialog({ mode: 'callup', callupId: target.dataset.id });
    if (target.matches('.open-whatsapp-match')) openWhatsAppDialog({ mode: 'callup', matchId: target.dataset.id });
    if (target.matches('.open-whatsapp-session')) openWhatsAppDialog({ mode: 'training', sessionId: target.dataset.id });
    const waPlayerBtn = target.closest('.open-whatsapp-player');
    if (waPlayerBtn) openWhatsAppDialog({ mode: 'callup', playerId: waPlayerBtn.dataset.id });
    if (target.matches('.open-whistle-session')) openWhistleDialog(target.dataset.id);
    if (target.matches('.cancel-builder')) $('#callup-builder').classList.add('hidden');
    if (target.matches('.cancel-training')) $('#training-builder').classList.add('hidden');
    if (target.matches('.cancel-session')) $('#session-builder').classList.add('hidden');
    if (target.matches('.cancel-tactic')) $('#tactic-builder').classList.add('hidden');
    const tacticToolButton = target.closest('.tactic-tool[data-tactic-tool]');
    if (tacticToolButton) {
      tacticTool = tacticToolButton.dataset.tacticTool;
      $$('.tactic-tool[data-tactic-tool]').forEach((btn) => btn.classList.toggle('active', btn.dataset.tacticTool === tacticTool));
    }
    if (target.matches('.view-tactic')) showTacticDetail(target.dataset.id);
    if (target.matches('.open-tactica-interactiva')) showTacticaInteractiva(target.dataset.id);
    if (target.matches('.edit-tactica-manual')) tacticBuilder('', target.dataset.formacion);
    if (target.matches('#tactica-interactiva-close')) closeTacticaInteractiva();
    if (target.matches('.edit-tactic')) tacticBuilder(target.dataset.id);
    if (target.matches('.delete-tactic') && await askConfirmation({ title: 'Borrar táctica', message: 'Se eliminará esta táctica de la base.', acceptLabel: 'Borrar', danger: true })) { await remove('settings', target.dataset.id); await refresh(true); renderTactics(); }
    const editPlayerBtn = target.closest('.edit-player');
    if (editPlayerBtn) editPlayer(editPlayerBtn.dataset.id);
    const editPlayerStatsBtn = target.closest('.edit-player-stats');
    if (editPlayerStatsBtn) editPlayerStats(editPlayerStatsBtn.dataset.playerId, editPlayerStatsBtn.dataset.scope);
    const deletePlayerBtn = target.closest('.delete-player');
    if (deletePlayerBtn && await askConfirmation({ title: 'Borrar jugador', message: 'Los históricos conservarán su identificador, pero la ficha del jugador se eliminará.', acceptLabel: 'Borrar', danger: true })) { await remove('players', deletePlayerBtn.dataset.id); await refresh(true); renderPlayers(); }
    if (target.matches('.delete-callup')) await deleteCallup(target.dataset.id);
    if (target.matches('.edit-callup')) callupBuilder('', target.dataset.id);
    if (target.matches('.edit-match')) editMatch(target.dataset.id);
    if (target.matches('.match-detail')) showMatchDetail(target.dataset.id);
    if (target.matches('.add-detail-event')) await addDetailEvent(target.dataset.id);
    if (target.matches('.remove-match-event')) await removeMatchEvent($('#match-detail-dialog').dataset.matchId, target.dataset.kind, Number(target.dataset.index));
    if (target.matches('.reopen-match')) await reopenMatch(target.dataset.id);
    if (target.matches('.rate-match')) openRateMatch(target.dataset.id);
    if (target.matches('.remove-player-incident')) await removePlayerIncident(target.dataset.key);
    if (target.matches('.edit-attendance')) attendanceBuilder('', target.dataset.id);
    if (target.matches('.callup-match')) { $$('.bottom-nav button').forEach((item) => item.classList.toggle('active', item.dataset.view === 'convocatorias')); $$('.view').forEach((view) => view.classList.toggle('active', view.id === 'convocatorias')); callupBuilder(target.dataset.id); }
    if (target.matches('.delete-match')) await deleteMatch(target.dataset.id);
    if (target.matches('.prep-open')) openPreparacionEditor(target.dataset.id);
    if (target.matches('.prep-toggle-delegate')) await togglePrepDelegateForMatch(target.dataset.id);
    if (target.matches('.prep-delete')) await deletePreparacionById(target.dataset.id);
    if (target.matches('.delete-training') && await askConfirmation({ title: 'Borrar asistencia', message: 'Se eliminará este registro de asistencia y se recalcularán las fichas de jugadores.', acceptLabel: 'Borrar', danger: true })) { await remove('trainings', target.dataset.id); await refresh(true); renderPlayers(); renderTrainings(); }
    if (target.matches('.edit-exercise')) editExercise(target.dataset.id);
    if (target.matches('.add-exercise-to-session')) {
      if (!$('#session-builder').classList.contains('hidden')) {
        const exercise = state.exercises.find(({ id }) => id === target.dataset.id);
        if (exercise) {
          syncSessionDraft();
          sessionDraftBlocks = addExerciseToSession({ blocks: sessionDraftBlocks }, exercise).blocks;
          const newAuto = calculateSessionTotalMaterial(sessionDraftBlocks, state.exercises);
          if (!sessionDraftMeta.material || sessionDraftMeta.material === sessionDraftMeta._autoMaterial) {
            sessionDraftMeta.material = newAuto;
            sessionDraftMeta._autoMaterial = newAuto;
          }
          renderSessionDraft();
          toast(`${exercise.name} añadido a la sesión.`);
        }
      } else openAddToSession(target.dataset.id);
    }
    if (target.matches('.favorite-exercise')) { const item = state.exercises.find(({ id }) => id === target.dataset.id); if (item) { await put('settings', { ...item, favorite: !item.favorite, updatedAt: Date.now() }); await refresh(true); renderExercises(); } }
    if (target.matches('.delete-exercise') && await askConfirmation({ title: 'Borrar ejercicio', message: 'Se eliminará de la base. Las sesiones antiguas conservarán el bloque como “Ejercicio eliminado”.', acceptLabel: 'Borrar', danger: true })) { await remove('settings', target.dataset.id); await refresh(true); renderExercises(); }
    if (target.matches('.edit-session')) {
      target.closest('dialog')?.close();
      showView('sesiones');
      sessionBuilder(target.dataset.id);
    }
    if (target.matches('.view-session')) showSessionDetail(target.dataset.id);
    const toggleBtn = target.closest('.toggle-session-blocks');
    if (toggleBtn) {
      const sessionId = toggleBtn.dataset.sessionId;
      const content = document.getElementById(`session-plan-${sessionId}`);
      if (content) {
        const isCollapsed = content.classList.contains('is-collapsed');
        content.classList.toggle('is-collapsed', !isCollapsed);
        toggleBtn.setAttribute('aria-expanded', String(isCollapsed));
        const icon = toggleBtn.querySelector('.toggle-icon');
        const text = toggleBtn.querySelector('.toggle-text');
        const session = state.trainingSessions.find((s) => s.id === sessionId);
        const count = session?.blocks?.length || 0;
        if (icon) icon.textContent = isCollapsed ? '▲' : '▼';
        if (text) text.textContent = isCollapsed ? `Replegar ejercicios (${count})` : `Desplegar ejercicios (${count})`;
      }
      return;
    }
    const viewExBtn = target.closest('.session-exercise-link, .view-exercise');
    if (viewExBtn && viewExBtn.dataset.exerciseId) {
      showExerciseDetail(viewExBtn.dataset.exerciseId);
      return;
    }
    const closeBtn = target.closest('[data-close]');
    if (closeBtn) {
      const parentDialog = closeBtn.closest('dialog');
      if (parentDialog) { parentDialog.close(); return; }
    }
    if (target.matches('.move-session-block')) { syncSessionDraft(); sessionDraftBlocks = moveSessionBlock(sessionDraftBlocks, Number(target.dataset.index), Number(target.dataset.direction)); renderSessionDraft(); }
    if (target.matches('.remove-session-block')) {
      syncSessionDraft();
      sessionDraftBlocks = removeSessionBlock(sessionDraftBlocks, Number(target.dataset.index));
      const newAuto = calculateSessionTotalMaterial(sessionDraftBlocks, state.exercises);
      if (!sessionDraftMeta.material || sessionDraftMeta.material === sessionDraftMeta._autoMaterial) {
        sessionDraftMeta.material = newAuto;
        sessionDraftMeta._autoMaterial = newAuto;
      }
      renderSessionDraft();
    }
    if (target.matches('.print-session') || target.closest('.print-session')) {
      const btn = target.closest('.print-session');
      printTrainingSession(btn.dataset.id, state);
      return;
    }
    if (target.matches('.print-exercise-sheet') || target.closest('.print-exercise-sheet')) {
      const btn = target.closest('.print-exercise-sheet');
      printSingleExercise(btn.dataset.id, state);
      return;
    }
    if (target.matches('.delete-session')) await deleteTrainingSession(target.dataset.id);
    if (target.id === 'prepare-live') await prepareLive();
    if (target.id === 'advance-live') await advanceLivePhase();
    if (target.id === 'make-sub') await makeSubstitution();
    if (target.id === 'exit-live') await cancelLiveMatch();
    if (target.id === 'open-delegate') enterDelegateMode();
    if (target.id === 'unlock-delegate') await unlockDelegate();
    if (target.id === 'close-delegate') closeDelegateMode();
    if (target.id === 'delegate-manual-sub') {
      const outIds = checkedValues('delegate-out'); const inIds = checkedValues('delegate-in');
      if (outIds.length < 1 || outIds.length > 7 || outIds.length !== inIds.length) return toast('Selecciona el mismo número de entradas y salidas: de 1 a 7.');
      try { await registerDelegateSubstitution(outIds, inIds); } catch (error) { handleError(error); }
    }
    if (target.id === 'apply-coach-quick-sub') {
      const outId = target.dataset.outId;
      const inId = target.dataset.inId;
      if (outId && inId) {
        try { await executeLiveSubstitution([outId], [inId], 'owner'); } catch (error) { handleError(error); }
      }
    }
    if (target.id === 'apply-delegate-suggestion' || target.id === 'urgent-change') {
      const outId = target.dataset.outId;
      const inId = target.dataset.inId;
      $('#urgent-dialog')?.close();
      if (outId && inId) {
        try { await registerDelegateSubstitution([outId], [inId]); } catch (error) { handleError(error); }
      } else {
        const match = state.matches.find(({ id }) => id === state.timer?.matchId); const callup = callupForMatch(match);
        if (!callup) return;
        const played = livePlayedSeconds(); const bench = callup.availableIds.filter((id) => !state.timer.onField.includes(id));
        const suggestion = suggestDelegateSubstitution(state.timer.onField, bench, played, 1, liveKeeperIds());
        try { await registerDelegateSubstitution(suggestion.outIds, suggestion.inIds); } catch (error) { handleError(error); }
      }
    }
    if (target.id === 'owner-auto-sub' || target.id === 'delegate-auto-sub') {
      const match = state.matches.find(({ id }) => id === state.timer?.matchId); const callup = callupForMatch(match);
      if (!callup) return;
      const bench = callup.availableIds.filter((id) => !state.timer.onField.includes(id));
      const count = Math.min(3, bench.length, state.timer.onField.length);
      if (count < 1) return toast('No hay suficientes jugadores para un cambio automático.');
      const suggestion = suggestDelegateSubstitution(state.timer.onField, bench, livePlayedSeconds(), count, liveKeeperIds());
      if (await askConfirmation({ title: `Cambio automático de ${count}`, message: `Entran ${suggestion.inIds.map(playerName).join(', ')} y salen ${suggestion.outIds.map(playerName).join(', ')}.`, acceptLabel: 'Registrar cambio' })) await registerDelegateSubstitution(suggestion.outIds, suggestion.inIds);
    }
    if (target.id === 'propose-reparto' || target.id === 'delegate-propose-reparto') {
      await proposeReparto();
    }
    if (target.matches('.score-step')) await changeLiveScore(target.dataset.scoreTeam, Number(target.dataset.delta));
    if (target.matches('.add-live-event')) await addLiveEvent(target.dataset.prefix);
    if (target.matches('.remove-live-event-btn')) await removeLiveEvent(target.dataset.prefix, target.dataset.id);
    if (target.matches('.save-live-comments')) {
      if (!roleCanUseOwnerFeatures(state.role)) return toast('Los comentarios son solo de Migue.');
      ensureLiveDetails().comments = $(`#${target.dataset.prefix}-comments`).value.trim();
      await persistTimer(); renderLive(); renderDelegate(); toast('Comentarios guardados.');
    }
    if (target.id === 'logout' || target.closest('#logout') || target.id === 'cb-delegate-logout-btn' || target.closest('#cb-delegate-logout-btn')) {
      await logoutUser();
      return;
    }
  });
}

function handleError(error) { console.error(error); toast(error.message || 'Ha ocurrido un error.'); }
function networkStatus() {
  const label = $('#network-label');
  if (isDemoDatabase()) {
    document.body.classList.remove('offline');
    if (label) {
      label.textContent = `Demo temporal · máximo ${DEMO_DURATION_MS / 3_600_000} h`;
      label.title = 'Datos aislados: sesión de demostración temporal.';
      label.style.display = 'inline';
    }
    return;
  }
  document.body.classList.toggle('offline', !navigator.onLine);
  if (label) {
    label.textContent = !navigator.onLine ? 'Sin conexión' : '';
    label.title = !navigator.onLine
      ? 'Sin conexión: cambios guardados localmente'
      : (state.cloudConnected ? 'En línea' : 'Sincronización pendiente');
    label.style.display = !navigator.onLine ? 'inline' : 'none';
  }
}

async function refreshSyncStatusPanel() {
  const text = $('#sync-status-text');
  const detail = $('#sync-status-detail');
  const recover = $('#recover-local-pending');
  if (!text) return;
  try {
    const info = await getSyncDiagnostics();
    if (!info.online) {
      text.textContent = 'Sin conexión · los cambios quedan pendientes en este dispositivo.';
    } else if (state.cloudError) {
      text.textContent = 'Error de sincronización.';
    } else if (info.pending > 0) {
      text.textContent = `Pendiente de sincronizar: ${info.pending} cambio${info.pending === 1 ? '' : 's'}.`;
    } else {
      text.textContent = 'Sincronizado con Supabase.';
    }
    detail.textContent = info.legacyPending > 0
      ? `Hay ${info.legacyPending} cambio${info.legacyPending === 1 ? '' : 's'} pendiente${info.legacyPending === 1 ? '' : 's'} en el almacenamiento local anterior de este dispositivo.`
      : (state.cloudError || '');
    recover?.classList.toggle('hidden', !(info.boundUserId && info.legacyPending > 0));
  } catch (error) {
    text.textContent = 'No se pudo comprobar el estado de sincronización.';
    if (detail) detail.textContent = error.message || '';
    recover?.classList.add('hidden');
  }
}

function scheduleRealtimeCloudSync() {
  if (isDemoDatabase() || !navigator.onLine) return;
  if (realtimeSyncTimer) window.clearTimeout(realtimeSyncTimer);
  realtimeSyncTimer = window.setTimeout(() => {
    realtimeSyncTimer = null;
    synchronizeCloud().catch(handleError);
  }, 250);
}

async function ensureRealtimeSubscription() {
  if (
    isDemoDatabase()
    || !navigator.onLine
    || realtimeSubscriptionActive
    || realtimeSubscriptionStarting
    || typeof realtimeCloudStore?.subscribeToChanges !== 'function'
  ) return;

  realtimeSubscriptionStarting = true;
  try {
    await realtimeCloudStore.subscribeToChanges(
      scheduleRealtimeCloudSync,
      (status, error) => {
        if (status === 'SUBSCRIBED') {
          realtimeSubscriptionActive = true;
          return;
        }
        if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
          realtimeSubscriptionActive = false;
          if (error) console.warn('Realtime no disponible; se mantiene el polling de seguridad:', error);
        }
      },
    );
  } catch (error) {
    realtimeSubscriptionActive = false;
    console.warn('No se pudo iniciar Realtime; se mantiene el polling de seguridad:', error?.message || error);
  } finally {
    realtimeSubscriptionStarting = false;
  }
}

async function synchronizeCloud() {
  if (isDemoDatabase()) {
    await refresh();
    networkStatus();
    await refreshSyncStatusPanel();
    return;
  }
  if (!navigator.onLine) {
    networkStatus();
    await refreshSyncStatusPanel();
    return;
  }
  try {
    const result = await syncFromCloud();
    state.cloudConnected = result.online;
    state.cloudError = result?.cloudRestricted
      ? 'Supabase está temporalmente restringido por cuota. CampoBase mantiene los datos locales de este dispositivo.'
      : '';
    void ensureRealtimeSubscription();
    if (result?.changed !== false) {
      await refresh();
    }
  } catch (error) {
    state.cloudConnected = false;
    state.cloudError = error.message || 'No se pudo sincronizar en la nube.';
  } finally {
    lastCloudSyncTimestamp = Date.now();
  }
  networkStatus();
  await refreshSyncStatusPanel();
}

async function init() {
  const matchForm = $('#match-form');
  matchForm.elements.dateDay.innerHTML = dayOptions();
  matchForm.elements.dateMonth.innerHTML = monthOptions();
  matchForm.elements.dateYear.innerHTML = yearOptions();
  matchForm.elements.dateHour.innerHTML = selectOptions(24);
  matchForm.elements.dateMinute.innerHTML = selectOptions(60);
  const addSessionForm = $('#add-session-form');
  addSessionForm.elements.dateDay.innerHTML = dayOptions();
  addSessionForm.elements.dateMonth.innerHTML = monthOptions();
  addSessionForm.elements.dateYear.innerHTML = yearOptions();

  document.addEventListener('change', (event) => {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement)) return;
    const match = /^(.*)(Month|Year)$/.exec(select.name || '');
    if (!match) return;
    const name = match[1];
    const form = select.closest('form');
    if (!form) return;
    refreshDateDayOptions(form, name);
  });

  const categoryOptions = CANONICAL_V2_CATEGORIES.map((category) => `<option value="${category}">${category}</option>`).join('');
  $('#exercise-form').elements.category.innerHTML = categoryOptions;
  $('#exercise-filters').elements.category.insertAdjacentHTML(
    'beforeend',
    '<option value="__mine__">Mis ejercicios</option>' + categoryOptions,
  );

  const exFilters = $('#exercise-filters');
  if (exFilters) {
    if (exFilters.elements.formato_juego) {
      exFilters.elements.formato_juego.innerHTML = FORMATO_JUEGO_OPTIONS.map((f) => `<option value="${f.id}">${f.label}</option>`).join('');
      exFilters.elements.formato_juego.value = 'todos';
    } else if (exFilters.elements.format) {
      exFilters.elements.format.insertAdjacentHTML('beforeend', FORMAT_OPTIONS.map((f) => `<option value="${f.id}">${f.label}</option>`).join(''));
    }
    if (exFilters.elements.players) {
      exFilters.elements.players.insertAdjacentHTML('beforeend', PLAYER_COUNT_OPTIONS.map((p) => `<option value="${p.id}">${p.label}</option>`).join(''));
    }
    if (exFilters.elements.material) {
      exFilters.elements.material.insertAdjacentHTML('beforeend', CANONICAL_MATERIALS.map((m) => `<option value="${m.id}">${m.label}</option>`).join(''));
    }
  }

  const exerciseMatHelper = $('#exercise-form-material-helper');
  if (exerciseMatHelper) {
    exerciseMatHelper.insertAdjacentHTML('beforeend', CANONICAL_MATERIALS.map((m) => `<option value="${m.label}">${m.label}</option>`).join(''));
    exerciseMatHelper.addEventListener('change', () => {
      const val = exerciseMatHelper.value;
      if (!val) return;
      const input = $('#exercise-form').elements.material;
      input.value = input.value ? `${input.value}, ${val}` : val;
      exerciseMatHelper.value = '';
    });
  }
  wireEvents(); networkStatus();
  realtimeCloudStore = createCampoBaseCloudStore();
  configureCloudStore(realtimeCloudStore);
  window.addEventListener('online', () => synchronizeCloud().catch(handleError));
  window.addEventListener('offline', networkStatus);
  // En desarrollo local (localhost) NO usamos el service worker: cachea el código
  // y hace que los cambios no se vean. Desregistramos el que ya esté activo y, en
  // producción (GitHub Pages), sí se registra para el modo offline.
  const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(location.hostname)
    || location.hostname.endsWith('.local')
    || location.hostname.startsWith('192.168.')
    || location.hostname.startsWith('10.');
  const isValidationPreview = location.pathname.endsWith('/validacion-estabilidad.html');
  if ('serviceWorker' in navigator && !isValidationPreview && !window.__CAMPOBASE_READONLY_PREVIEW) {
    if (isLocal) {
      const reloadKey = 'campobase.localServiceWorkerReloaded';
      const registrations = await navigator.serviceWorker.getRegistrations().catch(() => []);
      const wasControlled = Boolean(navigator.serviceWorker.controller);
      await Promise.all(registrations.map((registration) => registration.unregister()));
      if (wasControlled && sessionStorage.getItem(reloadKey) !== '1') {
        sessionStorage.setItem(reloadKey, '1');
        location.reload();
        return;
      }
      if (!wasControlled) sessionStorage.removeItem(reloadKey);
    } else {
      // index.html gestiona la activación y la recarga controlada del Service Worker.
      navigator.serviceWorker.register('./sw.js?v=20260927-v66-real-calendar-dates').then((reg) => {
        reg.update().catch(() => {});
      }).catch(handleError);
    }
  }
  await ensureLegacyExercisesNotPresent();
  await refresh();
  const live = await getOne('settings', 'live');
  state.timer = live?.timer ?? null;
  state.liveUpdatedAt = live?.updatedAt ?? 0;
  await reapplyPreparacionToTimer();
  renderLive();
  renderDelegate();
  let autoLoggedInDelegate = false;
  if (typeof window !== 'undefined' && window.location) {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const pinParam = params.get('pin');
    const teamParam = params.get('team');
    const permsParam = params.get('perms');
    if (roleParam === 'delegate') {
      if (teamParam) {
        setBoundSaasUserId(teamParam);
        try { sessionStorage.setItem('campobase.saasActiveBrowserSession', String(teamParam)); } catch {}
        configureRealDatabase();
      }
      if (permsParam) {
        const permsList = permsParam.split(',').map((p) => p.trim()).filter(Boolean);
        if (permsList.length) {
          state.settings = { ...(state.settings || {}), id: 'main', delegatePermissions: permsList };
          try { localStorage.setItem('campobase.delegatePermissions', JSON.stringify(permsList)); } catch {}
          await put('settings', state.settings).catch(() => {});
        }
      }
      if (pinParam) {
        const cleanPin = pinParam.trim();
        const expectedPin = state.settings?.delegatePin || '0000';
        let pinValid = cleanPin === expectedPin || cleanPin === '0000';
        if (!pinValid && state.settings?.pinSalt && state.settings?.delegatePinHash) {
          pinValid = await verifyPin(cleanPin, state.settings.pinSalt, state.settings.delegatePinHash);
        }
        if (pinValid) {
          applyRole('delegate');
          $('#auth-dialog')?.close();
          autoLoggedInDelegate = true;
          void (async () => {
            try {
              await synchronizeCloud();
              await refresh(true);
              renderDelegate();
            } catch {}
          })();
        }
      }
    }
  }
  if (!autoLoggedInDelegate && !await restoreSessionRole()) {
    ensureAuthPromptVisible();
    // Salvaguarda de arranque: si otro módulo de acceso cambia el diálogo
    // durante la inicialización, volvemos a comprobar que siga visible.
    window.setTimeout(() => {
      if (!state.role) ensureAuthPromptVisible();
    }, 900);
  }
  if (typeof window !== 'undefined' && window.location) {
    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get('view') || storedActiveView();
    if (requestedView) showView(requestedView);
  }
  // Sincronización en segundo plano sin bloquear el arranque ni la interacción inmediata
  synchronizeCloud().then(async () => {
    await refreshSyncStatusPanel();
    await refresh();
  }).catch(handleError);
  setInterval(() => pollLiveState().catch(handleError), 1000);
  setInterval(() => synchronizeCloud().catch(handleError), 10000);
}

if (typeof window !== 'undefined') {
  window.__campobase = { refresh, synchronizeCloud, syncDelegateModeDom, renderAll, renderLive, renderDelegate, renderPreparaciones, logoutUser, renderPlayers, renderMatches, renderTrainings, renderTrainingSessions, renderCallups, renderExercises, renderTactics, showView, showMatchDetail, showExerciseDetail, setExerciseLibraryMode, applyRole, openWhatsAppDialog, printSingleExercise, printTrainingSession, getDelegatePermissions, saveDelegatePermissions: persistDelegatePermissions, get state() { return state; } };
  window.__campobaseState = state;
}

init().catch(handleError);
