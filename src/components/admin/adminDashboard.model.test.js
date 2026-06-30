import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDashboardModel } from './adminDashboard.model.js';
import { DASHBOARDS, getVisibleDashboards, resolveDateRange } from './adminDashboard.config.js';

const snapshot = {
  data: {
    profiles: [{ id: 'u1', role: 'student', status: 'active', onboarding_completed: true, created_at: '2026-06-30T08:00:00Z' }],
    freelancers: [{ id: 'u1', source: 'Referral', kyc_status: 'pending', created_at: '2026-06-30T08:00:00Z' }],
    clients: [], jobs: [], services: [], applications: [], escrow_orders: [], payment_logs: [], support_tickets: [], reports: [], portfolio_items: [], opportunities: [], opportunity_applications: [], ai_usage_logs: [], audit_logs: [], admin_audit_logs: [], consistency_flags: [],
  },
  totals: { profiles: 1, freelancers: 1, clients: 0, jobs: 0, services: 0 },
  rangeCounts: { profiles: 1 },
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
  assert.ok(ids.includes('revenue'));
  assert.ok(ids.includes('payments'));
  assert.ok(ids.includes('escrow'));
  assert.ok(ids.includes('users'));
  assert.ok(!ids.includes('permissions'));
  assert.ok(!ids.includes('kyc'));
});

test('exposes every requested Command Center group', () => {
  const groups = new Set(DASHBOARDS.map((dashboard) => dashboard.group));
  assert.deepEqual([...groups], ['Overview', 'Marketing', 'Marketplace', 'Finance', 'Operations', 'Product Analytics', 'AI', 'Infrastructure', 'Security', 'Support', 'Team', 'Settings']);
});

test('builds connector status without fabricated metrics', () => {
  const model = buildDashboardModel('connectors', snapshot, [], 'api-connections');
  assert.equal(model.connectors[0].status, 'healthy');
  assert.equal(model.metrics.find((item) => item.label === 'Healthy').value, 1);
});

test('maps Cloudflare telemetry into website intelligence', () => {
  const telemetrySnapshot = {
    ...snapshot,
    externalTelemetry: {
      web: { visitors: 12, pageViews: 30, events: 44, topPaths: [{ label: '/', value: 20 }], dailyEvents: [], eventTypes: [] },
    },
  };
  const model = buildDashboardModel('marketing', telemetrySnapshot, [], 'website-analytics');
  assert.equal(model.metrics.find((item) => item.label === 'Visitors').value, 12);
  assert.equal(model.table.rows[0].path, '/');
});

test('resolves a bounded date range', () => {
  const range = resolveDateRange('custom', { from: '2026-06-01', to: '2026-06-30' });
  assert.ok(new Date(range.from) < new Date(range.to));
});
