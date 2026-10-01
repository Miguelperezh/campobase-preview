import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { signInWithCampoBasePin, loginWithEmailOrUsername } from '../js/auth-manager.js';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const authManager = await readFile(new URL('../js/auth-manager.js', import.meta.url), 'utf8');

test('signInWithCampoBasePin permite autenticar con PIN sin requerir userId previo', async () => {
  const fakeSession = {
    user: { id: '11111111-2222-3333-4444-555555555555', email: 'migue@test.com' },
  };

  let invokedPayload = null;
  const mockClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      verifyOtp: async ({ token_hash, type }) => {
        assert.equal(token_hash, 'hash_abc');
        assert.equal(type, 'email');
        return { data: { session: fakeSession }, error: null };
      },
      signOut: async () => ({ error: null }),
    },
    functions: {
      invoke: async (fnName, { body }) => {
        assert.equal(fnName, 'pin-login');
        invokedPayload = body;
        return { data: { token_hash: 'hash_abc', type: 'email', user_id: fakeSession.user.id }, error: null };
      },
    },
  };

  const session = await signInWithCampoBasePin(mockClient, '', '1234');
  assert.equal(session.user.id, fakeSession.user.id);
  assert.deepEqual(invokedPayload, { pin: '1234' });
});

test('loginWithEmailOrUsername intenta login con PIN en Supabase si la contraseña falla', async () => {
  const fakeSession = {
    user: { id: '99999999-8888-7777-6666-555555555555', email: 'migue@test.com' },
  };

  const mockClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({
        data: null,
        error: new Error('Invalid login credentials'),
      }),
      verifyOtp: async () => ({ data: { session: fakeSession }, error: null }),
      signOut: async () => ({ error: null }),
    },
    functions: {
      invoke: async () => ({
        data: { token_hash: 'tok_123', type: 'email', user_id: fakeSession.user.id },
        error: null,
      }),
    },
  };

  const res = await loginWithEmailOrUsername(mockClient, 'migue@test.com', '1234');
  assert.equal(res.session.user.id, fakeSession.user.id);
});

test('submitAuth en app.js llama a signInWithCampoBasePin y sincroniza con la nube cuando no hay PIN local', () => {
  assert.match(app, /signInWithCampoBasePin\(client,\s*userId\s*\|\|\s*'',\s*pin\)/);
  assert.match(app, /configureRealDatabase\(\)/);
  assert.match(app, /setBoundSaasUserId\(session\.user\.id\)/);
  assert.match(app, /await synchronizeCloud\(\)/);
});
