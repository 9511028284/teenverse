import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDashboardModel } from './adminDashboard.model.js';
import { DASHBOARDS, getVisibleDashboards, resolveDateRange } from './adminDashboard.config.js';

const snapshot = {
  data: {
    users: [{ id: 'u1', email: 'member@example.com', full_name: 'Member', created_at: '2026-06-30T08:00:00Z' }],
    profiles: [{ id: 'u1', role: 'student', status: 'active', onboarding_completed: true, created_at: '2026-06-30T08:00:00Z' }],
    freelancers: [{ id: 'u1', source: 'Referral', kyc_status: 'pending', created_at: '2026-06-30T08:00:00Z' }],
    clients: [], jobs: [], services: [], applications: [], escrow_orders: [], payment_logs: [], support_tickets: [], reports: [], portfolio_items: [], opportunities: [], opportunity_applications: [], ai_usage_logs: [], audit_logs: [], admin_audit_logs: [], consistency_flags: [], auth_rate_limits: [], phone_otp_verifications: [],
  },
  totals: { users: 1, profiles: 1, freelancers: 1, clients: 0, jobs: 0, services: 0 },
  rangeCounts: { users: 1, profiles: 1 },
  previousRangeCounts: {},
  operationalCounts: {},
  issues: [],
  apiLatencyMs: 42,
  measuredAt: '2026-06-30T08:01:00Z',
  connectorHealth: [{ id: 'supabase', name: 'Supabase', status: 'healthy' }],
};

test('builds every configured dashboard without mock fallbacks', () => {
  DASHBOARDS.forEach((dashboard) => {
    const model = buildDashboardModel(dashboard.model || dashboard.id, snapshot, [], dashboard.id);
    assert.equal(typeof model.description, 'string');
    assert.ok(Array.isArray(model.metrics));
  });
});

test('limits finance staff to permitted dashboards', () => {
  const ids = getVisibleDashboards('finance').map((dashboard) => dashboard.id);
  assert.ok(ids.includes('overview'));
  assert.ok(ids.includes('marketplace'));
  assert.ok(ids.includes('revenue'));
  assert.ok(ids.includes('payments'));
  assert.ok(ids.includes('reports'));
  assert.ok(ids.includes('settings'));
  assert.ok(!ids.includes('operations'));
  assert.ok(!ids.includes('security'));
});

test('exposes every requested Command Center group', () => {
  const groups = new Set(DASHBOARDS.map((dashboard) => dashboard.group));
  assert.deepEqual([...groups], ['Overview', 'Marketplace', 'Marketing', 'Users', 'Revenue', 'Payments', 'Operations', 'Support', 'Product Analytics', 'AI Analytics', 'Infrastructure', 'Security', 'Team', 'Reports', 'Settings']);
});

test('builds connector status without fabricated metrics', () => {
  const model = buildDashboardModel('connectors', snapshot, [], 'api-connections');
  assert.equal(model.connectors[0].status, 'healthy');
  assert.equal(model.metrics.find((item) => item.label === 'Healthy').value, 1);
});

test('maps Cloudflare telemetry into the consolidated marketing view', () => {
  const telemetrySnapshot = {
    ...snapshot,
    externalTelemetry: {
      web: { visitors: 12, pageViews: 30, events: 44, topPaths: [{ label: '/', value: 20 }], dailyEvents: [], eventTypes: [] },
    },
  };
  const model = buildDashboardModel('marketing', telemetrySnapshot, [], 'marketing');
  assert.equal(model.metrics.find((item) => item.label === 'Visitors').value, 12);
  assert.ok(model.charts.some((chart) => chart.title === 'Top Website Paths'));
});

test('maps Meta Graph telemetry into the consolidated marketing view', () => {
  const telemetrySnapshot = {
    ...snapshot,
    externalTelemetry: {
      meta: {
        status: 'healthy',
        facebook: { followers: 80 },
        instagram: {
          followers: 120,
          latestDailyReach: 45,
          daily: [{ label: '2026-06-30', value: 45 }],
        },
      },
    },
  };
  const model = buildDashboardModel('marketing', telemetrySnapshot, [], 'marketing');
  assert.equal(model.metrics.find((item) => item.label === 'Meta Followers').value, 200);
  assert.equal(model.metrics.find((item) => item.label === 'IG Daily Reach').value, 45);
  assert.ok(model.charts.some((chart) => chart.title === 'Social Audience'));
  assert.ok(model.charts.some((chart) => chart.title === 'Instagram Reach'));
});

test('keeps navigation concise and non-duplicative', () => {
  assert.equal(DASHBOARDS.length, 15);
  assert.equal(new Set(DASHBOARDS.map((dashboard) => dashboard.id)).size, 15);
});

test('builds explainable founder health scores from connected signals', () => {
  const model = buildDashboardModel('founder', snapshot, [], 'overview');
  assert.equal(model.health.length, 6);
  assert.ok(model.health.every((item) => typeof item.basis === 'string' && typeof item.action === 'string'));
  assert.equal(model.metrics.find((item) => item.label === 'Total Users').value, 1);
});

test('resolves a bounded date range', () => {
  const range = resolveDateRange('custom', { from: '2026-06-01', to: '2026-06-30' });
  assert.ok(new Date(range.from) < new Date(range.to));
});
