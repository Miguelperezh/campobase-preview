export const CLOUD_TABLES = Object.freeze({
  players: 'jugadores',
  callups: 'convocatorias',
  matches: 'partidos',
  trainings: 'asistencias',
  settings: 'configuracion',
});

function assertStore(store) {
  if (!Object.hasOwn(CLOUD_TABLES, store)) {
    throw new TypeError('El almacén no es sincronizable.');
  }
}

export function sanitizeRecordForCloud(store, record) {
  assertStore(store);
  return structuredClone(record);
}

export function mergeLocalRecordForWrite(store, currentRecord, incomingRecord) {
  assertStore(store);
  if (!currentRecord || store !== 'players') return structuredClone(incomingRecord);
  // Una escritura parcial de una ficha nunca debe borrar campos ya guardados.
  // Los campos enviados explícitamente (incluidos '', [] o null) sí prevalecen,
  // para que una edición intencionada siga pudiendo vaciarlos.
  return { ...structuredClone(currentRecord), ...structuredClone(incomingRecord) };
}

export function mergeCloudRecord(store, localRecord, cloudRecord) {
  assertStore(store);
  let merged = structuredClone(cloudRecord);
  if (store === 'players' && localRecord) {
    // Si una versión remota antigua llega sin algunos campos de ficha,
    // conserva los valores locales en vez de hacerlos desaparecer.
    merged = { ...structuredClone(localRecord), ...merged };
  }
  if (store === 'settings' && cloudRecord.id === 'main') {
    if (localRecord) {
      const localUpdated = Number(localRecord.updatedAt || 0);
      const cloudUpdated = Number(cloudRecord.updatedAt || 0);
      const preferLocal = localUpdated >= cloudUpdated;

      for (const field of ['pinSalt', 'ownerPinHash', 'delegatePinHash', 'demoPinSalt', 'demoPinHash', 'delegatePin']) {
        if (preferLocal ? (localRecord[field] !== undefined) : !merged[field]) {
          merged[field] = localRecord[field];
        }
      }
      if (Array.isArray(localRecord.delegatePermissions) && localRecord.delegatePermissions.length) {
        if (preferLocal || !merged.delegatePermissions || !merged.delegatePermissions.length) {
          merged.delegatePermissions = structuredClone(localRecord.delegatePermissions);
        }
      }
      if (preferLocal && localRecord.updatedAt) {
        merged.updatedAt = localRecord.updatedAt;
      }
      if ((!merged.setPieces || Object.keys(merged.setPieces).length === 0) && localRecord?.setPieces) {
        merged.setPieces = structuredClone(localRecord.setPieces);
      }
    }
  }
  return merged;
}

export function reconcileCloudSnapshot(store, localRecords, cloudRecords, pendingMutations = []) {
  assertStore(store);
  const localById = new Map(localRecords.map((record) => [record.id, record]));
  const reconciled = new Map(cloudRecords.map((record) => [
    record.id,
    mergeCloudRecord(store, localById.get(record.id), record),
  ]));
  const pendingForStore = pendingMutations.filter((mutation) => mutation.store === store);

  for (const mutation of pendingForStore) {
    if (mutation.operation === 'delete') reconciled.delete(mutation.recordId);
    else reconciled.set(mutation.recordId, structuredClone(mutation.payload));
  }

  const mainDeletePending = pendingForStore.some((mutation) => (
    mutation.operation === 'delete' && mutation.recordId === 'main'
  ));
  const localMain = localById.get('main');
  if (store === 'settings' && localMain && !reconciled.has('main') && !mainDeletePending) {
    reconciled.set('main', structuredClone(localMain));
  }
  return [...reconciled.values()];
}

export function buildMutation(store, operation, recordOrId, queuedAt = Date.now()) {
  assertStore(store);
  if (!['upsert', 'delete'].includes(operation)) throw new TypeError('La operación de sincronización no es válida.');
  const recordId = operation === 'delete' ? recordOrId : recordOrId?.id;
  if (!recordId) throw new TypeError('La mutación necesita un identificador.');
  return {
    id: `${store}:${recordId}`,
    store,
    operation,
    recordId,
    payload: operation === 'upsert' ? sanitizeRecordForCloud(store, recordOrId) : null,
    queuedAt,
  };
}
