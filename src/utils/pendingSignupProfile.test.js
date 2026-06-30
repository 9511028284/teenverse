import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getPendingSignupProfileForUser,
  PENDING_SIGNUP_PROFILE_KEY,
  setPendingSignupProfile,
  SIGNUP_PROFILE_METADATA_KEY,
} from './pendingSignupProfile.js';

const createStorage = () => {
  const values = new Map();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
};

const setupWindow = () => {
  globalThis.window = {
    localStorage: createStorage(),
    sessionStorage: createStorage(),
  };
};

test('uses the same-tab pending profile for the authenticated user', () => {
  setupWindow();
  const profile = { email: 'teen@example.com', phone: '+919876543210', source: 'Friend' };

  setPendingSignupProfile(profile);

  assert.deepEqual(
    getPendingSignupProfileForUser({ email: 'TEEN@example.com', user_metadata: {} }),
    profile,
  );
});

test('restores signup data from auth metadata in a fresh email-verification tab', () => {
  setupWindow();
  const profile = { email: 'teen@example.com', phone: '+919876543210', source: 'Friend' };

  const restored = getPendingSignupProfileForUser({
    email: 'teen@example.com',
    user_metadata: { [SIGNUP_PROFILE_METADATA_KEY]: profile },
  });

  assert.deepEqual(restored, profile);
  assert.equal(window.sessionStorage.getItem(PENDING_SIGNUP_PROFILE_KEY), null);
});

test('rejects signup metadata belonging to a different email address', () => {
  setupWindow();

  assert.equal(getPendingSignupProfileForUser({
    email: 'current@example.com',
    user_metadata: {
      [SIGNUP_PROFILE_METADATA_KEY]: {
        email: 'different@example.com',
        phone: '+919876543210',
      },
    },
  }), null);
});
