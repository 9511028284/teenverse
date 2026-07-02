import assert from 'node:assert/strict';
import test from 'node:test';

import { hasCompletedAppOnboarding } from './accountOnboarding.js';

test('blocks a Google auth user that has no completed application profile', () => {
  assert.equal(hasCompletedAppOnboarding({
    profile: { role: 'student', onboarding_completed: false },
    legacy: {},
  }), false);
});

test('requires verified application credentials for regular accounts', () => {
  assert.equal(hasCompletedAppOnboarding({
    profile: { role: 'student', onboarding_completed: true },
    legacy: {},
  }), false);
});

test('allows completed and pre-marker freelancer and client profiles', () => {
  assert.equal(hasCompletedAppOnboarding({
    profile: { role: 'student', onboarding_completed: true },
    legacy: { freelancer: { phone: '+919876543210' } },
  }), true);

  assert.equal(hasCompletedAppOnboarding({
    profile: { role: 'business', onboarding_completed: false },
    legacy: { client: { phone: '+919876543210' } },
  }), true);
});

test('does not block admin and parent identities', () => {
  assert.equal(hasCompletedAppOnboarding({ legacy: { admin: { id: 'admin-1' } } }), true);
  assert.equal(hasCompletedAppOnboarding({ profile: { role: 'guardian' } }), true);
  assert.equal(hasCompletedAppOnboarding({ parentMatch: { user_id: 'child-1' } }), true);
});
