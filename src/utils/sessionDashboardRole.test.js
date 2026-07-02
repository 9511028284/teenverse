import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getDashboardRolePreferenceKey,
  resolvePreferredDashboardRole,
  resolveProfileDashboardRole,
  resolveSessionDashboardRole,
  SESSION_DASHBOARD_ROLES,
} from './sessionDashboardRole.js';

test('scopes a saved dashboard role to one authenticated user', () => {
  assert.equal(
    getDashboardRolePreferenceKey('user-a'),
    'teenverse_active_dashboard_role_v2:user-a',
  );
  assert.notEqual(
    getDashboardRolePreferenceKey('user-a'),
    getDashboardRolePreferenceKey('user-b'),
  );
});

test('routes a client-only account to the client dashboard', () => {
  assert.equal(resolveSessionDashboardRole({ hasClient: true }), SESSION_DASHBOARD_ROLES.CLIENT);
});

test('routes a freelancer-only account to the freelancer dashboard', () => {
  assert.equal(resolveSessionDashboardRole({ hasFreelancer: true }), SESSION_DASHBOARD_ROLES.FREELANCER);
});

test('honors a valid saved preference for a dual-role account', () => {
  assert.equal(resolveSessionDashboardRole({
    preferredRole: SESSION_DASHBOARD_ROLES.CLIENT,
    hasClient: true,
    hasFreelancer: true,
  }), SESSION_DASHBOARD_ROLES.CLIENT);
});

test('keeps freelancer as the default for a dual-role account without a preference', () => {
  assert.equal(resolveSessionDashboardRole({
    hasClient: true,
    hasFreelancer: true,
  }), SESSION_DASHBOARD_ROLES.FREELANCER);
});

test('restores a persisted client role on a new browser', () => {
  assert.equal(resolveProfileDashboardRole({
    profileRole: 'business',
    hasClient: true,
    hasFreelancer: true,
  }), SESSION_DASHBOARD_ROLES.CLIENT);
});

test('ignores a persisted role when that dashboard profile is unavailable', () => {
  assert.equal(resolveProfileDashboardRole({
    profileRole: 'business',
    hasFreelancer: true,
  }), null);
});

test('uses the persisted database profile before a stale browser preference', () => {
  assert.equal(resolvePreferredDashboardRole({
    profileRole: 'business',
    savedRole: SESSION_DASHBOARD_ROLES.FREELANCER,
    hasClient: true,
    hasFreelancer: true,
  }), SESSION_DASHBOARD_ROLES.CLIENT);

  assert.equal(resolvePreferredDashboardRole({
    profileRole: 'student',
    savedRole: SESSION_DASHBOARD_ROLES.CLIENT,
    hasClient: true,
    hasFreelancer: true,
  }), SESSION_DASHBOARD_ROLES.FREELANCER);
});
