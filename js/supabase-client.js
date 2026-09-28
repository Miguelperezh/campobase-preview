import './match-postgame-editor.js';
import './plantilla-stats-sync.js';
import './player-data-sync.js?v=1';
import './match-calendar-sync.js';
import './player-roster-guard.js?v=1';
import './attendance-session-manual-state.js?v=3';
import './exercise-board-persistence.js?v=20260927-v66-real-calendar-dates';
import './runtime-refresh.js?v=20260927-v66-real-calendar-dates';
import './exercise-viewer-controls.js?v=2475';
import './exercise-viewer-layout.js?v=2475';
import './exercise-view-mode-ui.js?v=20260927-v66-real-calendar-dates';
import { CLOUD_TABLES } from './sync-core.js';
import { getBoundSaasUserId, setBoundSaasUserId } from './auth-manager.js';

const PLAYER_PROFILE_FIELDS = Object.freeze([
  'name', 'number', 'positions', 'foot', 'notes',
  'fatherName', 'fatherPhone', 'motherName', 'motherPhone',
  'photo', 'createdAt', 'profileUpdatedAt',
]);

export const CAMPOBASE_REALTIME_TABLES = Object.freeze(Object.values(CLOUD_TABLES));

export const SUPABASE_URL = 'https://mdzpygfwugawlmknywxa.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_j7duh_i5pNnMZMtT0YT-fg_l76UA_gH';
export const VIDEO_BUCKET = 'ejercicio-videos';

function checkResult(result) {
  if (result.error) throw result.error;
  return result.data;
}

function installIndexedDbUserNamespace() {
  if (typeof indexedDB === 'undefined' || globalThis.__cbIndexedDbNamespaceInstalled) return;
  globalThis.__cbIndexedDbNamespaceInstalled = true;
  const factory = indexedDB;
  const nativeOpen = factory.open.bind(factory);
  try {
    factory.open = (name, version) => {
      const boundUserId = getBoundSaasUserId();
      const mappedName = name === 'campobase' && boundUserId ? `campobase_${boundUserId}` : name;
      return version === undefined ? nativeOpen(mappedName) : nativeOpen(mappedName, version);
    };
  } catch {
    // El aislamiento cloud sigue estando protegido por RLS incluso si un navegador
    // impide sustituir el método de IndexedDB.
  }
}

installIndexedDbUserNamespace();

export function getCampoBaseSupabaseClient() {
  if (!globalThis.supabase?.createClient) {
    throw new Error('No se ha podido cargar el cliente oficial de Supabase.');
  }
  if (!globalThis.__cbSupabaseClient) {
    globalThis.__cbSupabaseClient = globalThis.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      realtime: { params: { eventsPerSecond: 2 } },
    });
  }
  return globalThis.__cbSupabaseClient;
}

export const getSupabaseAuthClient = getCampoBaseSupabaseClient;

export async function getRemoteMainSettings() {
  const client = getCampoBaseSupabaseClient();
  const { dataOwnerUserId } = await requireBoundUser(client);
  const rows = checkResult(await client
    .from(CLOUD_TABLES.settings)
    .select('payload,updated_at,deleted_at')
    .eq('user_id', dataOwnerUserId)
    .eq('id', 'main')
    .limit(1)) ?? [];
  const row = rows[0];
  if (!row || row.deleted_at) return null;
  return row.payload || null;
}

async function requireBoundUser(client) {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  const user = data?.session?.user;
  let boundUserId = getBoundSaasUserId();

  // Si Supabase conserva una sesión válida pero se perdió únicamente el
  // enlace local de la cuenta, reconstruimos ese enlace desde la sesión
  // autenticada. Así se recupera la base local del usuario y sus datos sin
  // crear una cuenta vacía ni pedir que borre almacenamiento.
  if (user?.id && !boundUserId) {
    setBoundSaasUserId(user.id);
    boundUserId = user.id;
  }

  if (!user || !boundUserId || user.id !== boundUserId) {
    const authError = new Error('Inicia sesión para sincronizar esta cuenta.');
    authError.code = 'CAMPOBASE_AUTH_REQUIRED';
    throw authError;
  }

  let dataOwnerUserId = user.id;
  let teamContext = null;
  try {
    const { data, error: teamError } = await client.rpc('mi_equipo_contexto');
    if (!teamError && data) {
      teamContext = data;
      if (teamContext.data_owner_user_id) dataOwnerUserId = teamContext.data_owner_user_id;
    }
  } catch (err) {
    console.warn('No se pudo resolver el contexto de equipo, usando usuario principal:', err);
  }
  return { user, teamContext, dataOwnerUserId };
}

export function createCampoBaseCloudStore() {
  const client = getCampoBaseSupabaseClient();
  let realtimeChannel = null;
  let realtimeOwnerUserId = '';
  let realtimeChangeHandler = null;
  let realtimeStatusHandler = null;

  async function stopRealtimeChanges() {
    const channel = realtimeChannel;
    realtimeChannel = null;
    realtimeOwnerUserId = '';
    realtimeChangeHandler = null;
    realtimeStatusHandler = null;
    if (channel) await client.removeChannel(channel).catch(() => null);
  }

  async function subscribeToChanges(onChange, onStatus) {
    if (typeof onChange !== 'function') {
      throw new TypeError('La sincronización Realtime necesita un manejador de cambios.');
    }

    realtimeChangeHandler = onChange;
    realtimeStatusHandler = typeof onStatus === 'function' ? onStatus : null;

    const { dataOwnerUserId } = await requireBoundUser(client);
    if (realtimeChannel && realtimeOwnerUserId === dataOwnerUserId) {
      return { ownerUserId: dataOwnerUserId, reused: true };
    }

    await stopRealtimeChanges();
    realtimeChangeHandler = onChange;
    realtimeStatusHandler = typeof onStatus === 'function' ? onStatus : null;

    const channel = client.channel(`campobase-db:${dataOwnerUserId}`);
    for (const table of CAMPOBASE_REALTIME_TABLES) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          const nextRow = payload?.new && Object.keys(payload.new).length ? payload.new : null;
          const previousRow = payload?.old && Object.keys(payload.old).length ? payload.old : null;
          const row = nextRow ?? previousRow;
          // Postgres Changes respeta RLS. Esta comprobación adicional evita
          // procesar una fila ajena si el payload incluye user_id.
          if (row?.user_id && row.user_id !== dataOwnerUserId) return;
          realtimeChangeHandler?.({
            table,
            eventType: payload?.eventType ?? '',
            id: row?.id ?? null,
          });
        },
      );
    }

    realtimeChannel = channel;
    realtimeOwnerUserId = dataOwnerUserId;

    channel.subscribe((status, error) => {
      realtimeStatusHandler?.(status, error ?? null);
      if (!['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) return;
      if (realtimeChannel !== channel) return;
      realtimeChannel = null;
      realtimeOwnerUserId = '';
      void client.removeChannel(channel).catch(() => null);
    });

    return { ownerUserId: dataOwnerUserId, reused: false };
  }

  void import('./saas-session-guard.js?v=1')
    .then(({ guardSaasSession }) => guardSaasSession(client))
    .then(() => import('./saas-auth-ui-v2.js?v=20260927-v66-real-calendar-dates'))
    .then(({ initSaasAuth }) => initSaasAuth(client))
    .then(() => import('./legacy-data-link-guard.js?v=1'))
    .then(({ initLegacyDataLinkGuard }) => initLegacyDataLinkGuard())
    .catch((error) => {
      console.warn('No se pudo cargar el acceso de usuario:', error);
      // Fallback de emergencia: un fallo del acceso SaaS nunca puede dejar
      // CampoBase abierto y vacío sin ofrecer el PIN local validado.
      document.body?.classList.add('auth-locked');
      const dialog = document.getElementById('auth-dialog');
      const localForm = document.getElementById('auth-form');
      const saasShell = document.getElementById('saas-auth-shell');
      saasShell?.classList.add('hidden');
      localForm?.classList.remove('hidden');
      if (dialog && !dialog.open) dialog.showModal();
    });

  void import('./promo-codes-admin.js?v=4')
    .then(() => import('./promo-codes-ui-v2.js?v=2'))
    .catch((error) => {
      console.warn('No se pudo cargar el módulo de promociones:', error);
    });

  void import('./billing-manager.js?v=1')
    .then(({ initBillingManager }) => initBillingManager(client))
    .catch((error) => {
      console.warn('No se pudo cargar el estado de la cuenta:', error);
    });

  void import('./team-access.js?v=20260927-v66-real-calendar-dates')
    .then(({ initTeamAccess }) => initTeamAccess(client))
    .catch((error) => {
      console.warn('No se pudo cargar el acceso del equipo:', error);
    });

  return {
    subscribeToChanges,
    stopRealtimeChanges,

    async prepare() {
      const { user } = await requireBoundUser(client);
      return { userId: user.id };
    },

    async shouldApplyMutation(mutation) {
      const { dataOwnerUserId } = await requireBoundUser(client);
      const table = CLOUD_TABLES[mutation.store];
      const query = client
        .from(table)
        .select('updated_at,deleted_at')
        .eq('user_id', dataOwnerUserId)
        .eq('id', mutation.recordId)
        .limit(1);
      if (typeof query.abortSignal === 'function' && typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        query.abortSignal(AbortSignal.timeout(6000));
      }
      const rows = checkResult(await query) ?? [];
      const remote = rows[0];
      if (!remote) return true;
      const remoteUpdatedAt = Number(remote.updated_at || remote.deleted_at || 0);
      const localQueuedAt = Number(mutation.queuedAt || 0);
      return localQueuedAt >= remoteUpdatedAt;
    },

    async getSnapshot(store) {
      const { dataOwnerUserId } = await requireBoundUser(client);
      const table = CLOUD_TABLES[store];
      const query = client
        .from(table)
        .select('id,payload,updated_at,deleted_at,user_id')
        .eq('user_id', dataOwnerUserId);
      if (typeof query.abortSignal === 'function' && typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        query.abortSignal(AbortSignal.timeout(7000));
      }
      const rows = checkResult(await query) ?? [];
      return {
        records: rows.filter(({ deleted_at: deletedAt }) => !deletedAt).map(({ payload }) => payload),
        deletedIds: rows.filter(({ deleted_at: deletedAt }) => Boolean(deletedAt)).map(({ id }) => id),
        rowCount: rows.length,
      };
    },

    async upsert(mutation) {
      const { user, dataOwnerUserId } = await requireBoundUser(client);
      const table = CLOUD_TABLES[mutation.store];
      let payload = mutation.payload;

      if (mutation.store === 'players' && payload) {
        const rows = checkResult(await client
          .from(table)
          .select('payload')
          .eq('user_id', dataOwnerUserId)
          .eq('id', mutation.recordId)
          .limit(1)) ?? [];
        const remotePayload = rows[0]?.payload;
        if (remotePayload) {
          const remoteProfileUpdatedAt = Number(remotePayload.profileUpdatedAt || 0);
          const localProfileUpdatedAt = Number(payload.profileUpdatedAt || 0);
          if (remoteProfileUpdatedAt >= localProfileUpdatedAt) {
            payload = structuredClone(payload);
            for (const field of PLAYER_PROFILE_FIELDS) {
              if (Object.hasOwn(remotePayload, field)) payload[field] = structuredClone(remotePayload[field]);
              else delete payload[field];
            }
          }
        }
      }

      checkResult(await client.from(table).upsert({
        user_id: dataOwnerUserId,
        id: mutation.recordId,
        payload,
        updated_at: mutation.queuedAt,
        deleted_at: null,
      }, { onConflict: 'user_id,id' }));
    },

    async remove(mutation) {
      const { dataOwnerUserId } = await requireBoundUser(client);
      const table = CLOUD_TABLES[mutation.store];
      checkResult(await client.from(table).upsert({
        user_id: dataOwnerUserId,
        id: mutation.recordId,
        payload: null,
        updated_at: mutation.queuedAt,
        deleted_at: mutation.queuedAt,
      }, { onConflict: 'user_id,id' }));
    },

    async uploadVideo(path, file) {
      await requireBoundUser(client);
      const { data, error } = await client.storage.from(VIDEO_BUCKET).upload(path, file, {
        cacheControl: '3600',
        contentType: file.type || 'video/mp4',
        upsert: true,
      });
      if (error) throw error;
      return data;
    },

    async removeVideo(path) {
      await requireBoundUser(client);
      const { data, error } = await client.storage.from(VIDEO_BUCKET).remove([path]);
      if (error) throw error;
      return data;
    },
  };
}