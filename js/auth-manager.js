import { hashPin } from './domain.js';

export const SAAS_USER_STORAGE_KEY = 'campobase.saasUserId';
export const REMEMBERED_ACCOUNT_STORAGE_KEY = 'campobase.rememberedAccount.v1';
export const LEGACY_DATABASE_NAME = 'campobase';
export const DATABASE_VERSION = 2;
export const DATABASE_STORES = ['players', 'callups', 'matches', 'trainings', 'settings', 'syncQueue'];
export const PRODUCTION_APP_URL = 'https://miguelperezh.github.io/campobase/';

export function normalizeUsername(raw = '') {
  return String(raw).trim().toLocaleLowerCase('es').replace(/^@/, '').replace(/\s+/g, '_');
}

export function classifyIdentifier(identifier = '') {
  const clean = String(identifier).trim();
  if (clean.startsWith('@')) return 'username';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) ? 'email' : 'username';
}

export function getBoundSaasUserId() {
  try { return String(localStorage.getItem(SAAS_USER_STORAGE_KEY) || ''); } catch { return ''; }
}

export function setBoundSaasUserId(userId) {
  if (!userId) throw new TypeError('Falta el identificador del usuario.');
  try { localStorage.setItem(SAAS_USER_STORAGE_KEY, String(userId)); } catch { /* La sesión de Supabase seguirá siendo la autoridad. */ }
}

export function clearBoundSaasUserId() {
  try { localStorage.removeItem(SAAS_USER_STORAGE_KEY); } catch { /* Sin almacenamiento local que limpiar. */ }
}

export function getRememberedSaasAccount() {
  try {
    const raw = localStorage.getItem(REMEMBERED_ACCOUNT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const id = parsed?.id || parsed?.userId || '';
    if (!id) return null;
    return { ...parsed, id: String(id) };
  } catch {
    return null;
  }
}

export function rememberSaasAccount(user, profile = {}) {
  if (!user?.id) throw new TypeError('Falta el usuario que se quiere recordar.');
  const account = {
    id: String(user.id),
    email: String(profile?.email || user.email || '').trim(),
    username: String(profile?.username || user?.user_metadata?.username || '').trim(),
    fullName: String(profile?.full_name || user?.user_metadata?.full_name || '').trim(),
    clubName: String(profile?.club_name || user?.user_metadata?.club_name || '').trim(),
    rememberedAt: Date.now(),
  };
  try { localStorage.setItem(REMEMBERED_ACCOUNT_STORAGE_KEY, JSON.stringify(account)); } catch { /* El acceso seguirá funcionando sin recordar cuenta. */ }
  return account;
}

export function clearRememberedSaasAccount() {
  try { localStorage.removeItem(REMEMBERED_ACCOUNT_STORAGE_KEY); } catch { /* Sin almacenamiento local que limpiar. */ }
}

export function userDatabaseName(userId) {
  if (!userId) throw new TypeError('Falta el usuario para aislar la base local.');
  return `campobase_${String(userId)}`;
}

export async function getCurrentSession(client) {
  if (!client?.auth) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data?.session || null;
}

export async function getCurrentProfile(client, userId = '') {
  const id = userId || (await getCurrentSession(client))?.user?.id || '';
  if (!id) return null;
  const { data, error } = await client
    .from('perfiles')
    .select('id,username,email,full_name,club_name,role,avatar_url')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function resolveUsernameEmail(client, username) {
  const clean = normalizeUsername(username);
  if (!clean) throw new Error('Introduce tu correo o nombre de usuario.');
  const { data, error } = await client.rpc('resolve_login_email', { p_username: clean });
  if (error) throw error;
  const email = typeof data === 'string' ? data : data?.email || '';
  if (!email) throw new Error(`No existe ningún usuario registrado como @${clean}.`);
  return email;
}

async function legacyOwnerPasswordFromPin(pin) {
  const cleanPin = String(pin || '').trim();
  if (!/^\d{4,8}$/.test(cleanPin) || typeof indexedDB === 'undefined') return '';
  let db;
  try {
    db = await openRawDatabase(LEGACY_DATABASE_NAME);
    const transaction = db.transaction('settings', 'readonly');
    const main = await requestResult(transaction.objectStore('settings').get('main'));
    await transactionDone(transaction);
    if (!main?.pinSalt || !main?.ownerPinHash) return '';
    const digest = await hashPin(cleanPin, main.pinSalt);
    return digest === main.ownerPinHash ? digest : '';
  } catch {
    return '';
  } finally {
    try { db?.close(); } catch { /* noop */ }
  }
}

async function edgeFunctionErrorMessage(error, fallback = 'No se pudo iniciar la sesión con PIN.') {
  try {
    const response = error?.context;
    if (response && typeof response.clone === 'function') {
      const payload = await response.clone().json();
      if (payload?.message) return String(payload.message);
    }
  } catch { /* Usar mensaje genérico. */ }
  return error?.message || fallback;
}

export async function signInWithCampoBasePin(client, userIdOrIdentifier, pin) {
  if (!client?.auth || !client?.functions) throw new Error('No se ha podido abrir el acceso por PIN.');
  const cleanInput = String(userIdOrIdentifier || '').trim();
  const cleanPin = String(pin || '').trim();
  if (!/^\d{4,8}$/.test(cleanPin)) throw new Error('El PIN debe tener entre 4 y 8 cifras.');

  const isUuid = /^[0-9a-f-]{36}$/i.test(cleanInput);
  const cleanUserId = isUuid ? cleanInput : '';
  const cleanIdentifier = !isUuid ? cleanInput : '';

  const current = await getCurrentSession(client).catch(() => null);
  if (cleanUserId && current?.user?.id === cleanUserId) {
    setBoundSaasUserId(cleanUserId);
    return current;
  }

  const payload = { pin: cleanPin };
  if (cleanUserId) payload.user_id = cleanUserId;
  if (cleanIdentifier) payload.identifier = cleanIdentifier;

  const { data, error } = await client.functions.invoke('pin-login', {
    body: payload,
  });
  if (error) throw new Error(await edgeFunctionErrorMessage(error));
  if (!data?.token_hash) throw new Error(data?.message || 'No se pudo crear la sesión segura.');

  const { data: verified, error: verifyError } = await client.auth.verifyOtp({
    token_hash: data.token_hash,
    type: data.type || 'email',
  });
  if (verifyError || !verified?.session?.user) throw verifyError || new Error('No se pudo crear la sesión segura.');

  const authenticatedUserId = verified.session.user.id;
  if (cleanUserId && authenticatedUserId !== cleanUserId) {
    await client.auth.signOut().catch(() => {});
    throw new Error('La sesión creada no corresponde a esta cuenta.');
  }

  setBoundSaasUserId(authenticatedUserId);
  return verified.session;
}

export async function loginWithEmailOrUsername(client, identifier, password) {
  if (!client?.auth) throw new Error('No se ha podido iniciar el acceso.');
  const cleanId = String(identifier).trim();
  if (!cleanId) throw new Error('Introduce tu correo o nombre de usuario.');
  if (!password) throw new Error('Introduce tu contraseña o PIN.');

  const targetEmail = classifyIdentifier(cleanId) === 'email'
    ? cleanId.toLocaleLowerCase('es')
    : await resolveUsernameEmail(client, cleanId);

  let result = await client.auth.signInWithPassword({ email: targetEmail, password: String(password) });

  if (result.error && /invalid login credentials/i.test(result.error.message || '') && /^\d{4,8}$/.test(String(password).trim())) {
    const derivedPassword = await legacyOwnerPasswordFromPin(password);
    if (derivedPassword) {
      result = await client.auth.signInWithPassword({ email: targetEmail, password: derivedPassword });
    }
    if (result.error) {
      try {
        const pinSession = await signInWithCampoBasePin(client, targetEmail, password);
        if (pinSession?.user) {
          result = { data: { session: pinSession, user: pinSession.user }, error: null };
        }
      } catch {
        // Mantener error original si el acceso por PIN tampoco prospera
      }
    }
  }

  if (result.error) {
    if (/invalid login credentials/i.test(result.error.message || '')) throw new Error('Correo, usuario, contraseña o PIN incorrectos.');
    throw result.error;
  }
  return result.data;
}

export async function registerCoachAccount(client, { email, username, password, fullName = '', clubName = '' }) {
  if (!client?.auth) throw new Error('No se ha podido abrir el registro.');
  const cleanEmail = String(email).trim().toLocaleLowerCase('es');
  const cleanUsername = normalizeUsername(username);
  const cleanFullName = String(fullName).trim();
  const cleanClubName = String(clubName).trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Introduce un correo electrónico válido.');
  if (!/^[a-z0-9._-]{3,30}$/.test(cleanUsername)) throw new Error('El usuario debe tener entre 3 y 30 caracteres: letras, números, punto, guion o guion bajo.');
  if (String(password).length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
  if (!cleanFullName) throw new Error('Introduce tu nombre y apellidos.');

  const { data: available, error: availabilityError } = await client.rpc('username_available', { p_username: cleanUsername });
  if (availabilityError) throw availabilityError;
  if (available === false) throw new Error(`El usuario @${cleanUsername} ya existe. Elige otro nombre.`);

  const { data, error } = await client.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      emailRedirectTo: PRODUCTION_APP_URL,
      data: {
        username: cleanUsername,
        full_name: cleanFullName,
        club_name: cleanClubName || 'Mi equipo',
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function sendPasswordResetEmail(client, emailOrUser) {
  if (!client?.auth) throw new Error('No se ha podido iniciar la recuperación.');
  const clean = String(emailOrUser).trim();
  if (!clean) throw new Error('Introduce tu correo o usuario primero.');
  const email = classifyIdentifier(clean) === 'email'
    ? clean.toLocaleLowerCase('es')
    : await resolveUsernameEmail(client, clean);

  const redirectTo = PRODUCTION_APP_URL;
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
  return { success: true };
}

export async function updatePassword(client, password) {
  if (!client?.auth) throw new Error('No se ha podido actualizar la contraseña.');
  if (String(password).length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
  const { data: userData } = await client.auth.getUser();
  const metadata = { ...(userData?.user?.user_metadata || {}) };
  delete metadata.must_set_password;
  const { error } = await client.auth.updateUser({ password: String(password), data: metadata });
  if (error) throw error;
  return { success: true };
}

export async function legacyOwnerClaimAvailable(client) {
  const { data, error } = await client.rpc('legacy_owner_claim_available');
  if (error) throw error;
  return Boolean(data);
}

export async function claimLegacyOwner(client, pin) {
  const cleanPin = String(pin || '').trim();
  if (!/^\d{4,8}$/.test(cleanPin)) throw new Error('Introduce el PIN actual de Migue.');
  const { data, error } = await client.rpc('claim_legacy_owner', { p_pin: cleanPin });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.message || 'No se pudieron vincular los datos actuales.');
  return data;
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
    transaction.onabort = () => reject(transaction.error || new Error('La operación local se canceló.'));
  });
}

export function openRawDatabase(name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      for (const store of DATABASE_STORES) {
        if (!request.result.objectStoreNames.contains(store)) request.result.createObjectStore(store, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Cierra otras pestañas de la aplicación y vuelve a intentarlo.'));
  });
}

export async function bootstrapUserDatabase(userId, profile = {}) {
  if (typeof indexedDB === 'undefined') return;
  const db = await openRawDatabase(userDatabaseName(userId));
  try {
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    const [main, seeded] = await Promise.all([
      requestResult(store.get('main')),
      requestResult(store.get('squad-26-27-seeded')),
    ]);
    if (!main) {
      store.put({
        id: 'main',
        teamName: String(profile?.club_name || '').trim() || 'Mi equipo',
        format: 'F7',
        createdAt: Date.now(),
      });
    }
    if (!seeded) {
      store.put({ id: 'squad-26-27-seeded', recordType: 'migration', version: 1, createdAt: Date.now() });
    }
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}

async function readDatabaseSnapshot(name) {
  const db = await openRawDatabase(name);
  try {
    const snapshot = {};
    for (const storeName of DATABASE_STORES) {
      const transaction = db.transaction(storeName, 'readonly');
      snapshot[storeName] = await requestResult(transaction.objectStore(storeName).getAll());
      await transactionDone(transaction);
    }
    return snapshot;
  } finally {
    db.close();
  }
}

export async function migrateLegacyDatabaseToUser(userId) {
  if (typeof indexedDB === 'undefined') return;
  const snapshot = await readDatabaseSnapshot(LEGACY_DATABASE_NAME);
  const target = await openRawDatabase(userDatabaseName(userId));
  try {
    for (const storeName of DATABASE_STORES) {
      const records = snapshot[storeName] || [];
      if (!records.length) continue;
      const transaction = target.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      for (const record of records) store.put(record);
      await transactionDone(transaction);
    }
  } finally {
    target.close();
  }
}
