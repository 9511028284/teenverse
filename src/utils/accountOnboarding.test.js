import assert from 'node:assert/strict';
import test from 'node:test';

import { hasCompletedAppOnboarding } from './accountOnboarding.js';

test('blocks a Google auth user that has no completed application profile', () => {
  assert.equal(hasCompletedAppOnboarding({
    profile: { role: 'student', onboarding_completed: false },
    legacy: {},
  }), false);
});

test('requires both the completion marker and verified application credentials', () => {
  assert.equal(hasCompletedAppOnboarding({
    profile: { role: 'student', onboarding_completed: true },
    legacy: {},
  }), false);

  assert.equal(hasCompletedAppOnboarding({
    profile: { role: 'student', onboarding_completed: false },
    legacy: { freelancer: { phone: '+919876543210' } },
  }), false);
});

test('allows completed freelancer and client profiles', () => {
  assert.equal(hasCompletedAppOnboarding({
    profile: { role: 'student', onboarding_completed: true },
    legacy: { freelancer: { phone: '+919876543210' } },
  }), true);

  assert.equal(hasCompletedAppOnboarding({
    profile: { role: 'business', onboarding_completed: true },
    legacy: { client: { phone: '+919876543210' } },
  }), true);
});

test('does not block admin and parent identities', () => {
  assert.equal(hasCompletedAppOnboarding({ legacy: { admin: { id: 'admin-1' } } }), true);
  assert.equal(hasCompletedAppOnboarding({ profile: { role: 'guardian' } }), true);
  assert.equal(hasCompletedAppOnboarding({ parentMatch: { user_id: 'child-1' } }), true);
});

