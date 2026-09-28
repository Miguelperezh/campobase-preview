import { buildMutation, mergeCloudRecord, mergeLocalRecordForWrite, reconcileCloudSnapshot } from './sync-core.js';
import { demoDatabaseName, isDemoSessionActive } from './demo-session.js';
import { getBoundSaasUserId, setBoundSaasUserId, getRememberedSaasAccount, userDatabaseName } from './auth-manager.js';

var REAL_DB_NAME = 'campobase';
const DB_VERSION = 2;
const isReadOnlyPreview = () => globalThis.__CAMPOBASE_READONLY_PREVIEW === true;
export const STORES = ['players', 'callups', 'matches', 'trainings', 'settings'];
const SYNC_QUEUE = 'syncQueue';
const PLAYER_PROFILE_FIELDS = Object.freeze([
  'name', 'number', 'positions', 'foot', 'notes',
  'fatherName', 'fatherPhone', 'motherName', 'motherPhone',
  'photo', 'createdAt', 'profileUpdatedAt',
]);

function preservePlayerProfileFields(current, incoming) {
  if (!current || !incoming) return structuredClone(incoming);
  const next = structuredClone(incoming);
  for (const field of PLAYER_PROFILE_FIELDS) {
    if (Object.hasOwn(current, field)) next[field] = structuredClone(current[field]);
    else delete next[field];
  }
  return next;
}

function boundDatabaseName() {
  const userId = typeof getBoundSaasUserId === 'function' ? getBoundSaasUserId() : '';
  return userId ? userDatabaseName(userId) : (REAL_DB_NAME || 'campobase');
}

var databasePromises = new Map();
var activeDatabaseName = null;
var demoSession = null;
var demoStores = null;
var cloudStore = null;
var syncPromise = null;

function notifyDataChanged(stores, operation = 'write') {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  const uniqueStores = [...new Set((Array.isArray(stores) ? stores : [stores]).filter(Boolean))];
  if (!uniqueStores.length) return;
  window.dispatchEvent(new CustomEvent('campobase:data-changed', {
    detail: { stores: uniqueStores, operation, at: Date.now() },
  }));
}

export function currentDatabaseName() {
  return activeDatabaseName;
}

export function isDemoDatabase() {
  return Boolean(demoSession);
}

export function configureDemoDatabase(session, now = Date.now()) {
  if (!isDemoSessionActive(session, now)) throw new TypeError('La sesión demo está caducada o no es válida.');
  if (demoSession?.id !== session.id) demoStores = Object.fromEntries(STORES.map((store) => [store, new Map()]));
  demoSession = structuredClone(session);
  activeDatabaseName = demoDatabaseName(session);
}

export function configureUserDatabase(userId) {
  demoSession = null;
  activeDatabaseName = userDatabaseName(userId);
}

export function configureRealDatabase() {
  demoSession = null;
  activeDatabaseName = boundDatabaseName();
}

export async function deleteDemoDatabase(session) {
  demoDatabaseName(session);
  if (demoSession?.id === session.id) demoStores = Object.fromEntries(STORES.map((store) => [store, new Map()]));
}

function openDatabaseByName(name) {
  if (!databasePromises.has(name)) databasePromises.set(name, new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DB_VERSION);
    request.onupgradeneeded = () => {
      for (const store of [...STORES, SYNC_QUEUE]) {
        if (!request.result.objectStoreNames.contains(store)) {
          request.result.createObjectStore(store, { keyPath: 'id' });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Cierra otras pestañas de CampoBase para actualizar la base de datos.'));
  }));
  return databasePromises.get(name);
}

export function openDatabase() {
  // La base real se resuelve en cada apertura. Si una sesión Supabase válida
  // acaba de recuperar campobase.saasUserId durante el arranque, no debemos
  // seguir usando la base legado "campobase" por haberla calculado antes.
  if (!demoSession) activeDatabaseName = boundDatabaseName();
  return openDatabaseByName(activeDatabaseName);
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error('La operación local se canceló.'));
  });
}

async function localGetAll(store) {
  if (isDemoDatabase()) return [...demoStores[store].values()].map((value) => structuredClone(value));
  const db = await openDatabase();
  return requestResult(db.transaction(store, 'readonly').objectStore(store).getAll());
}

async function localGetOne(store, id) {
  if (isDemoDatabase()) return structuredClone(demoStores[store].get(id));
  const db = await openDatabase();
  return requestResult(db.transaction(store, 'readonly').objectStore(store).get(id));
}

async function removeQueuedMutation(id) {
  const db = await openDatabase();
  const transaction = db.transaction(SYNC_QUEUE, 'readwrite');
  transaction.objectStore(SYNC_QUEUE).delete(id);
  await transactionDone(transaction);
}

function canUseCloud() {
  return Boolean(cloudStore) && (typeof navigator === 'undefined' || navigator.onLine);
}

async function prepareStorageBindingForWrite() {
  if (isDemoDatabase() || getBoundSaasUserId() || typeof cloudStore?.prepare !== 'function') return;
  try {
    // getSession() es local y puede reconstruir el user_id incluso en móvil
    // antes de decidir qué IndexedDB debe recibir el cambio.
    await cloudStore.prepare();
  } catch (error) {
    if (error?.code !== 'CAMPOBASE_AUTH_REQUIRED' && !error?.message?.includes('Inicia sesión')) {
      console.warn('No se pudo preparar el almacenamiento SaaS para escritura:', error);
    }
    // Sin sesión SaaS válida seguimos permitiendo el modo local legado.
  }
}

export function configureCloudStore(store) {
  cloudStore = store;
}

// Storage de vídeos: delega en el cliente Supabase configurado.
export async function uploadVideo(path, file) {
  if (!cloudStore?.uploadVideo) throw new Error('El almacenamiento de vídeos no está disponible.');
  return cloudStore.uploadVideo(path, file);
}

export async function removeVideo(path) {
  if (!cloudStore?.removeVideo) throw new Error('El almacenamiento de vídeos no está disponible.');
  return cloudStore.removeVideo(path);
}

export async function getAll(store) {
  return localGetAll(store);
}

export async function getOne(store, id) {
  return localGetOne(store, id);
}

export async function put(store, value) {
  if (isReadOnlyPreview()) return value;
  if (isDemoDatabase()) {
    demoStores[store].set(value.id, structuredClone(value));
    notifyDataChanged(store, 'upsert');
    return value;
  }
  await prepareStorageBindingForWrite();
  const existing = store === 'players' && value?.id ? await localGetOne(store, value.id) : null;
  const genericRecord = mergeLocalRecordForWrite(store, existing, value);
  const recordToStore = store === 'players' && existing
    ? preservePlayerProfileFields(existing, genericRecord)
    : genericRecord;
  const db = await openDatabase();
  const transaction = db.transaction([store, SYNC_QUEUE], 'readwrite');
  transaction.objectStore(store).put(recordToStore);
  transaction.objectStore(SYNC_QUEUE).put(buildMutation(store, 'upsert', recordToStore));
  await transactionDone(transaction);
  if (canUseCloud()) await flushSyncQueue();
  notifyDataChanged(store, 'upsert');
  return recordToStore;
}

export async function putPlayerProfile(value) {
  if (isReadOnlyPreview()) return value;
  if (!value?.id) throw new TypeError('La ficha del jugador necesita un identificador.');
  const recordToStore = { ...structuredClone(value), profileUpdatedAt: Date.now() };
  if (isDemoDatabase()) {
    demoStores.players.set(recordToStore.id, structuredClone(recordToStore));
    notifyDataChanged('players', 'profile-upsert');
    return recordToStore;
  }
  await prepareStorageBindingForWrite();
  const db = await openDatabase();
  const transaction = db.transaction(['players', SYNC_QUEUE], 'readwrite');
  transaction.objectStore('players').put(recordToStore);
  transaction.objectStore(SYNC_QUEUE).put(buildMutation('players', 'upsert', recordToStore));
  await transactionDone(transaction);
  if (canUseCloud()) await flushSyncQueue();
  notifyDataChanged('players', 'profile-upsert');
  return recordToStore;
}

export async function putBatch(recordsByStore) {
  if (isReadOnlyPreview()) return;
  const storeNames = Object.keys(recordsByStore);
  if (!storeNames.length || storeNames.some((store) => !STORES.includes(store))) {
    throw new TypeError('La operación contiene almacenes no válidos.');
  }
  if (isDemoDatabase()) {
    for (const [storeName, records] of Object.entries(recordsByStore)) {
      if (!Array.isArray(records)) throw new TypeError('Cada lote debe ser una lista.');
      for (const record of records) demoStores[storeName].set(record.id, structuredClone(record));
    }
    notifyDataChanged(storeNames, 'batch');
    return;
  }
  await prepareStorageBindingForWrite();
  const normalizedRecordsByStore = {};
  for (const [storeName, records] of Object.entries(recordsByStore)) {
    if (!Array.isArray(records)) throw new TypeError('Cada lote debe ser una lista.');
    if (storeName !== 'players') {
      normalizedRecordsByStore[storeName] = records;
      continue;
    }
    normalizedRecordsByStore[storeName] = await Promise.all(records.map(async (record) => {
      const existing = record?.id ? await localGetOne('players', record.id) : null;
      const merged = mergeLocalRecordForWrite('players', existing, record);
      return existing ? preservePlayerProfileFields(existing, merged) : merged;
    }));
  }

  const db = await openDatabase();
  const transaction = db.transaction([...storeNames, SYNC_QUEUE], 'readwrite');
  for (const [storeName, records] of Object.entries(normalizedRecordsByStore)) {
    for (const record of records) {
      transaction.objectStore(storeName).put(record);
      transaction.objectStore(SYNC_QUEUE).put(buildMutation(storeName, 'upsert', record));
    }
  }
  await transactionDone(transaction);
  if (canUseCloud()) await flushSyncQueue();
  notifyDataChanged(storeNames, 'batch');
}

export async function remove(store, id) {
  if (isReadOnlyPreview()) return;
  if (isDemoDatabase()) {
    demoStores[store].delete(id);
    notifyDataChanged(store, 'delete');
    return;
  }
  await prepareStorageBindingForWrite();
  const db = await openDatabase();
  const transaction = db.transaction([store, SYNC_QUEUE], 'readwrite');
  transaction.objectStore(store).delete(id);
  transaction.objectStore(SYNC_QUEUE).put(buildMutation(store, 'delete', id));
  await transactionDone(transaction);
  if (canUseCloud()) await flushSyncQueue();
  notifyDataChanged(store, 'delete');
}

export async function flushSyncQueue() {
  if (isDemoDatabase()) return false;
  if (!canUseCloud()) return false;
  // Verifica y vincula primero la sesión remota. Es crítico hacerlo ANTES de
  // abrir/leer syncQueue para que una cola de la base legado nunca pueda
  // subirse accidentalmente a una cuenta SaaS recuperada después.
  if (typeof cloudStore?.prepare === 'function') {
    try {
      await cloudStore.prepare();
    } catch (authError) {
      if (authError?.message?.includes('Inicia sesión') || authError?.code === 'CAMPOBASE_AUTH_REQUIRED' || authError?.name === 'TypeError') {
        return false;
      }
      throw authError;
    }
  }
  const mutations = (await localGetAll(SYNC_QUEUE)).sort((a, b) => a.queuedAt - b.queuedAt);
  for (const mutation of mutations) {
    try {
      const shouldApply = typeof cloudStore?.shouldApplyMutation === 'function'
        ? await cloudStore.shouldApplyMutation(mutation)
        : true;
      if (!shouldApply) {
        // Supabase ya tiene una versión posterior. La cola local está obsoleta:
        // se elimina sin tocar la fila remota y el snapshot cloud la repondrá localmente.
        await removeQueuedMutation(mutation.id);
        continue;
      }
      if (mutation.operation === 'delete') await cloudStore.remove(mutation);
      else await cloudStore.upsert(mutation);
      await removeQueuedMutation(mutation.id);
    } catch (mutationError) {
      if (mutationError?.message?.includes('Inicia sesión') || mutationError?.code === 'CAMPOBASE_AUTH_REQUIRED') {
        return false;
      }
      console.warn('Error aplicando mutación cloud; se reintentará luego:', mutationError);
      return false;
    }
  }
  return true;
}

async function replaceLocalStore(store, cloudRecords) {
  const db = await openDatabase();

  // Safari/iOS puede cerrar una transacción IndexedDB si se cede el control
  // entre las lecturas y las escrituras. Las dos lecturas y el clear/put deben
  // permanecer en la misma transacción atómica y las escrituras se encolan
  // desde el callback onsuccess de la última lectura, mientras sigue activa.
  await new Promise((resolve, reject) => {
    const transaction = db.transaction([store, SYNC_QUEUE], 'readwrite');
    const objectStore = transaction.objectStore(store);
    const queueStore = transaction.objectStore(SYNC_QUEUE);
    const localRequest = objectStore.getAll();
    const pendingRequest = queueStore.getAll();

    let localRecords = [];
    let pendingMutations = [];
    let localReady = false;
    let pendingReady = false;
    let reconciled = false;

    const reconcileAndWrite = () => {
      if (reconciled || !localReady || !pendingReady) return;
      reconciled = true;

      if (store === 'players' && (!cloudRecords || cloudRecords.length === 0) && localRecords.length > 0) {
        console.warn('Protección activa: se omite vaciado local de jugadores sin confirmación explícita del servidor.');
        return;
      }

      const reconciledRecords = reconcileCloudSnapshot(store, localRecords, cloudRecords, pendingMutations);
      objectStore.clear();
      for (const record of reconciledRecords) objectStore.put(record);
    };

    localRequest.onsuccess = () => {
      localRecords = localRequest.result ?? [];
      localReady = true;
      reconcileAndWrite();
    };
    pendingRequest.onsuccess = () => {
      pendingMutations = pendingRequest.result ?? [];
      pendingReady = true;
      reconcileAndWrite();
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo reconciliar la copia local.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('La reconciliación local se canceló.'));
  });
}

async function queueInitialRecords(store, records) {
  if (!records.length) return;
  const db = await openDatabase();
  const transaction = db.transaction(SYNC_QUEUE, 'readwrite');
  const queue = transaction.objectStore(SYNC_QUEUE);
  for (const record of records) queue.put(buildMutation(store, 'upsert', record));
  await transactionDone(transaction);
}

export async function syncFromCloud() {
  if (isReadOnlyPreview()) {
    if (!canUseCloud()) return { online:false, pending:0 };
    // Same adapter and stores. Reconcile remote reads, never flush or add pending writes.
    try {
      let downloaded = 0;
      for (const store of STORES) {
        const snapshot = await cloudStore.getSnapshot(store);
        await replaceLocalStore(store, snapshot.records);
        downloaded += snapshot.records.length;
      }
      return { online:true, pending:0, downloaded, changed:true, readOnly:true };
    } catch (error) {
      if (error?.code === 'CAMPOBASE_AUTH_REQUIRED') return {online:false,pending:0,authRequired:true};
      throw error;
    }
  }

  if (isDemoDatabase()) return { online: false, pending: 0, demo: true };
  if (!canUseCloud()) return { online: false, pending: (await localGetAll(SYNC_QUEUE)).length };
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    try {
      await flushSyncQueue();
      let downloaded = 0;
      let hasChanges = false;
      for (const store of STORES) {
        const snapshot = await cloudStore.getSnapshot(store);
        const localRecords = await localGetAll(store);
        if (snapshot.rowCount === 0 && localRecords.length) {
          await queueInitialRecords(store, localRecords);
          await flushSyncQueue();
          continue;
        }
        if (store === 'players' && localRecords.length && snapshot.records.length) {
          const localById = new Map(localRecords.map((record) => [record.id, record]));
          const repaired = [];
          snapshot.records = snapshot.records.map((cloudRecord) => {
            const merged = mergeCloudRecord('players', localById.get(cloudRecord.id), cloudRecord);
            if (JSON.stringify(merged) !== JSON.stringify(cloudRecord)) repaired.push(merged);
            return merged;
          });
          if (repaired.length) {
            await queueInitialRecords('players', repaired);
            await flushSyncQueue();
          }
        }
        if (store === 'settings') {
          const localMain = localRecords.find(({ id }) => id === 'main');
          const cloudMainIndex = snapshot.records.findIndex(({ id }) => id === 'main');
          if (localMain && cloudMainIndex >= 0) {
            const mergedMain = mergeCloudRecord(store, localMain, snapshot.records[cloudMainIndex]);
            if (JSON.stringify(mergedMain) !== JSON.stringify(snapshot.records[cloudMainIndex])) {
              snapshot.records[cloudMainIndex] = mergedMain;
              await queueInitialRecords(store, [mergedMain]);
              await flushSyncQueue();
            }
          }
        }
        const areEquivalent = (() => {
          if (localRecords.length !== snapshot.records.length) return false;
          if (localRecords.length === 0) return true;
          const sortById = (list) => [...list].sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
          return JSON.stringify(sortById(localRecords)) === JSON.stringify(sortById(snapshot.records));
        })();
        if (!areEquivalent) {
          hasChanges = true;
          await replaceLocalStore(store, snapshot.records);
        }
        downloaded += snapshot.records.length;
      }
      return { online: true, pending: (await localGetAll(SYNC_QUEUE)).length, downloaded, changed: hasChanges };
    } catch (syncError) {
      if (syncError?.message?.includes('Inicia sesión') || syncError?.code === 'CAMPOBASE_AUTH_REQUIRED') {
        return { online: false, pending: (await localGetAll(SYNC_QUEUE)).length, authRequired: true };
      }
      if (isCloudServiceRestricted(syncError)) {
        const recovery = await mergeMissingLegacyRecordsIntoBoundDatabase().catch((error) => {
          console.warn('No se pudo recuperar la base local anterior:', error);
          return { recovered: 0 };
        });
        return {
          online: false,
          pending: (await localGetAll(SYNC_QUEUE)).length,
          cloudRestricted: true,
          localRecovered: recovery.recovered,
          changed: recovery.recovered > 0,
        };
      }
      throw syncError;
    }
  })().finally(() => { syncPromise = null; });
  return syncPromise;
}

async function queueFromDatabaseName(name) {
  const db = await openDatabaseByName(name);
  return requestResult(db.transaction(SYNC_QUEUE, 'readonly').objectStore(SYNC_QUEUE).getAll());
}

function isRecoverableLegacySetting(record) {
  if (!record?.id) return false;
  if (record.id === 'main' || record.id === 'teamName') return true;
  if (['trainingSession', 'preparacion', 'tactic', 'staffMember'].includes(record.recordType)) return true;
  if (record.recordType !== 'exercise') return false;
  return record.userCreated === true
    || record.customBoard === true
    || record.source === 'personal'
    || String(record.id).startsWith('mine-')
    || String(record.id).startsWith('pdf98-user-');
}

async function mergeMissingLegacyRecordsIntoBoundDatabase() {
  const userId = getBoundSaasUserId();
  if (!userId) return { recovered: 0 };
  const targetName = userDatabaseName(userId);
  if (targetName === REAL_DB_NAME) return { recovered: 0 };

  const legacyDb = await openDatabaseByName(REAL_DB_NAME);
  const targetDb = await openDatabaseByName(targetName);
  let recovered = 0;

  for (const storeName of STORES) {
    const [legacyRecords, targetRecords] = await Promise.all([
      requestResult(legacyDb.transaction(storeName, 'readonly').objectStore(storeName).getAll()),
      requestResult(targetDb.transaction(storeName, 'readonly').objectStore(storeName).getAll()),
    ]);
    if (!legacyRecords.length) continue;

    // Nunca mezclar silenciosamente una base histórica con una base actual que
    // ya contiene datos. La recuperación automática solo sirve para el caso
    // de un namespace nuevo/vacío que no puede bajar Supabase por el 402.
    if (storeName !== 'settings' && targetRecords.length > 0) continue;

    let sourceRecords = legacyRecords;
    if (storeName === 'settings') {
      const targetHasUserContent = targetRecords.some((record) => (
        record?.recordType === 'trainingSession'
        || record?.recordType === 'preparacion'
        || record?.recordType === 'tactic'
        || record?.recordType === 'staffMember'
        || (record?.recordType === 'exercise' && isRecoverableLegacySetting(record))
      ));
      if (targetHasUserContent) continue;
      sourceRecords = legacyRecords.filter(isRecoverableLegacySetting);
    }

    const existingIds = new Set(targetRecords.map((record) => record?.id).filter(Boolean));
    const missing = sourceRecords.filter((record) => record?.id && !existingIds.has(record.id));
    if (!missing.length) continue;

    const tx = targetDb.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const record of missing) {
      store.put(structuredClone(record));
      recovered += 1;
    }
    await transactionDone(tx);
  }

  if (recovered > 0) notifyDataChanged(STORES, 'legacy-local-recovery');
  return { recovered };
}

function isCloudServiceRestricted(error) {
  const status = Number(error?.status || error?.statusCode || error?.context?.status || 0);
  const message = String(error?.message || '');
  return status === 402
    || /exceed_(cached_)?egress_quota/i.test(message)
    || /service for this project is restricted/i.test(message);
}

export async function getLocalPinSettingsCandidates() {
  if (isDemoDatabase()) return [];
  const names = [REAL_DB_NAME];
  const userId = getBoundSaasUserId();
  if (userId) names.push(userDatabaseName(userId));
  const remembered = getRememberedSaasAccount();
  if (remembered?.id) names.push(userDatabaseName(remembered.id));

  if (typeof indexedDB !== 'undefined' && typeof indexedDB.databases === 'function') {
    try {
      const dbs = await indexedDB.databases();
      for (const info of dbs) {
        if (info.name && info.name.startsWith('campobase_')) {
          names.push(info.name);
        }
      }
    } catch {
      // Ignorar si el navegador no permite enumerar bases.
    }
  }

  const candidates = [];
  for (const name of [...new Set(names)]) {
    try {
      const database = await openDatabaseByName(name);
      const settings = await requestResult(
        database.transaction('settings', 'readonly').objectStore('settings').get('main')
      );
      if (settings?.pinSalt && (settings.ownerPinHash || settings.delegatePinHash)) {
        const candidateUserId = name.startsWith('campobase_') ? name.slice('campobase_'.length) : '';
        candidates.push({ databaseName: name, userId: candidateUserId, settings: structuredClone(settings) });
      }
    } catch {
      // Una base inexistente o inaccesible no debe bloquear el resto de candidatos.
    }
  }
  return candidates;
}

export async function getSyncDiagnostics() {
  const boundUserId = getBoundSaasUserId();
  const activeName = boundUserId ? userDatabaseName(boundUserId) : REAL_DB_NAME;
  const pending = await queueFromDatabaseName(activeName);
  const legacyPending = activeName === REAL_DB_NAME ? pending : await queueFromDatabaseName(REAL_DB_NAME);
  return {
    boundUserId,
    activeDatabase: activeName,
    pending: pending.length,
    legacyPending: activeName === REAL_DB_NAME ? 0 : legacyPending.length,
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
  };
}

export async function recoverLegacyPendingMutations() {
  const userId = getBoundSaasUserId();
  if (!userId) throw new Error('Inicia sesión en tu cuenta antes de recuperar cambios locales pendientes.');
  const targetName = userDatabaseName(userId);
  if (targetName === REAL_DB_NAME) return { recovered: 0 };

  const legacyDb = await openDatabaseByName(REAL_DB_NAME);
  const legacyMutations = await requestResult(
    legacyDb.transaction(SYNC_QUEUE, 'readonly').objectStore(SYNC_QUEUE).getAll()
  );
  if (!legacyMutations.length) return { recovered: 0 };

  const targetDb = await openDatabaseByName(targetName);
  const writeTx = targetDb.transaction(SYNC_QUEUE, 'readwrite');
  const targetQueue = writeTx.objectStore(SYNC_QUEUE);
  for (const mutation of legacyMutations) targetQueue.put(structuredClone(mutation));
  await transactionDone(writeTx);

  // Solo limpiamos la cola legado después de que Supabase acepte/rechace de forma
  // segura cada mutación mediante las guardas de versión/stale-write.
  await flushSyncQueue();

  const cleanupTx = legacyDb.transaction(SYNC_QUEUE, 'readwrite');
  const legacyQueue = cleanupTx.objectStore(SYNC_QUEUE);
  for (const mutation of legacyMutations) legacyQueue.delete(mutation.id);
  await transactionDone(cleanupTx);

  return { recovered: legacyMutations.length };
}

export async function exportDatabase() {
  const data = {};
  for (const store of STORES) data[store] = await localGetAll(store);
  const userId = typeof getBoundSaasUserId === 'function' ? getBoundSaasUserId() : '';
  try {
    const directCache = {
      players: data.players || [],
      callups: data.callups || [],
      matches: data.matches || [],
      attendance: data.trainings || [],
      settings: data.settings || [],
      at: Date.now(),
    };
    localStorage.setItem('campobase.directFieldCache', JSON.stringify(directCache));
  } catch {}
  return { app: 'CampoBase', version: 1, exportedAt: new Date().toISOString(), saasUserId: userId, data };
}

export async function importDatabase(backup) {
  if (isReadOnlyPreview()) throw new Error('Importación bloqueada en la preview.');
  if (backup.saasUserId && typeof getBoundSaasUserId === 'function' && !getBoundSaasUserId()) {
    try { setBoundSaasUserId(backup.saasUserId); configureRealDatabase(); } catch {}
  }
  const data = backup.data || backup;
  if (isDemoDatabase()) {
    for (const storeName of STORES) {
      demoStores[storeName].clear();
      for (const record of (data[storeName] || [])) demoStores[storeName].set(record.id, structuredClone(record));
    }
    notifyDataChanged(STORES, 'import');
    return;
  }
  const db = await openDatabase();
  const transaction = db.transaction([...STORES, SYNC_QUEUE], 'readwrite');
  for (const storeName of STORES) {
    const store = transaction.objectStore(storeName);
    store.clear();
    for (const record of (data[storeName] || [])) {
      store.put(record);
      transaction.objectStore(SYNC_QUEUE).put(buildMutation(storeName, 'upsert', record));
    }
  }
  await transactionDone(transaction);

  try {
    const directCache = {
      players: data.players || [],
      callups: data.callups || [],
      matches: data.matches || [],
      attendance: data.trainings || data.attendance || [],
      settings: data.settings || [],
      at: Date.now(),
    };
    localStorage.setItem('campobase.directFieldCache', JSON.stringify(directCache));
  } catch {}

  if (canUseCloud()) await flushSyncQueue();
  notifyDataChanged(STORES, 'import');
}