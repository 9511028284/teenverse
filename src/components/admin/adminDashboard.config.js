const ALL = ['founder', 'admin', 'finance', 'marketing', 'operations', 'support', 'developer', 'viewer'];
const LEADERS = ['founder', 'admin'];
const FINANCE = ['founder', 'admin', 'finance'];
const GROWTH = ['founder', 'admin', 'marketing'];
const OPS = ['founder', 'admin', 'operations'];
const SUPPORT = ['founder', 'admin', 'support', 'operations'];
const TECH = ['founder', 'admin', 'developer'];
const READ_BUSINESS = ['founder', 'admin', 'finance', 'operations', 'viewer'];

const module = (id, label, group, roles, model = id) => ({ id, label, group, roles, model });

export const DASHBOARDS = [
  module('founder', 'Founder Dashboard', 'Overview', LEADERS),
  module('executive', 'Executive Dashboard', 'Overview', ['founder', 'admin', 'finance', 'viewer']),
  module('live', 'Live Activity Center', 'Overview', ALL),

  module('social-analytics', 'Social Analytics', 'Marketing', GROWTH, 'marketing'),
  module('campaign-analytics', 'Campaign Analytics', 'Marketing', GROWTH, 'marketing'),
  module('website-analytics', 'Website Analytics', 'Marketing', GROWTH, 'marketing'),
  module('conversion-funnel', 'Conversion Funnel', 'Marketing', GROWTH, 'founder'),

  module('users', 'Users', 'Marketplace', READ_BUSINESS, 'user-growth'),
  module('jobs', 'Jobs', 'Marketplace', READ_BUSINESS, 'marketplace'),
  module('applications', 'Applications', 'Marketplace', READ_BUSINESS, 'marketplace'),
  module('orders', 'Orders', 'Marketplace', READ_BUSINESS, 'marketplace'),
  module('freelancers', 'Freelancers', 'Marketplace', READ_BUSINESS, 'user-growth'),
  module('clients', 'Clients', 'Marketplace', READ_BUSINESS, 'user-growth'),

  module('revenue', 'Revenue', 'Finance', FINANCE),
  module('payments', 'Payments', 'Finance', FINANCE),
  module('escrow', 'Escrow', 'Finance', FINANCE, 'payments'),
  module('payouts', 'Payouts', 'Finance', FINANCE, 'payments'),
  module('refunds', 'Refunds', 'Finance', FINANCE, 'payments'),

  module('kyc', 'KYC', 'Operations', OPS, 'operations'),
  module('reports', 'Reports', 'Operations', OPS, 'operations'),
  module('moderation', 'Moderation', 'Operations', OPS, 'operations'),
  module('fraud-detection', 'Fraud Detection', 'Operations', OPS, 'operations'),
  module('verification-queue', 'Verification Queue', 'Operations', OPS, 'operations'),

  module('feature-usage', 'Feature Usage', 'Product Analytics', ['founder', 'admin', 'developer', 'marketing', 'viewer'], 'product'),
  module('user-journey', 'User Journey', 'Product Analytics', ['founder', 'admin', 'developer', 'marketing', 'viewer'], 'product'),
  module('retention', 'Retention', 'Product Analytics', ['founder', 'admin', 'developer', 'marketing', 'viewer'], 'user-growth'),
  module('churn', 'Churn', 'Product Analytics', ['founder', 'admin', 'developer', 'marketing', 'viewer'], 'user-growth'),
  module('search-analytics', 'Search Analytics', 'Product Analytics', ['founder', 'admin', 'developer', 'marketing', 'viewer'], 'product'),

  module('ai-usage', 'AI Usage', 'AI', TECH, 'ai'),
  module('token-consumption', 'Token Consumption', 'AI', TECH, 'ai'),
  module('ai-costs', 'AI Costs', 'AI', TECH, 'ai'),
  module('model-performance', 'Model Performance', 'AI', TECH, 'ai'),
  module('ai-insights', 'AI Insights', 'AI', LEADERS, 'founder'),

  module('api-health', 'API Health', 'Infrastructure', TECH, 'infrastructure'),
  module('database-health', 'Database Health', 'Infrastructure', TECH, 'infrastructure'),
  module('storage', 'Storage', 'Infrastructure', TECH, 'infrastructure'),
  module('edge-functions', 'Edge Functions', 'Infrastructure', TECH, 'infrastructure'),
  module('performance', 'Performance', 'Infrastructure', TECH, 'infrastructure'),
  module('error-monitoring', 'Error Monitoring', 'Infrastructure', TECH, 'infrastructure'),

  module('login-activity', 'Login Activity', 'Security', ['founder', 'admin', 'developer', 'operations'], 'security'),
  module('otp-monitoring', 'OTP Monitoring', 'Security', ['founder', 'admin', 'developer', 'operations'], 'security'),
  module('suspicious-activity', 'Suspicious Activity', 'Security', ['founder', 'admin', 'developer', 'operations'], 'security'),
  module('devices', 'Devices', 'Security', ['founder', 'admin', 'developer', 'operations'], 'security'),
  module('sessions', 'Sessions', 'Security', ['founder', 'admin', 'developer', 'operations'], 'security'),
  module('security-alerts', 'Security Alerts', 'Security', ['founder', 'admin', 'developer', 'operations'], 'security'),

  module('tickets', 'Tickets', 'Support', SUPPORT, 'support'),
  module('live-chat-metrics', 'Live Chat Metrics', 'Support', SUPPORT, 'support'),
  module('sla', 'SLA', 'Support', SUPPORT, 'support'),
  module('customer-satisfaction', 'Customer Satisfaction', 'Support', SUPPORT, 'support'),

  module('tasks', 'Tasks', 'Team', LEADERS, 'team'),
  module('sprint-progress', 'Sprint Progress', 'Team', LEADERS, 'team'),
  module('productivity', 'Productivity', 'Team', LEADERS, 'team'),
  module('deployments', 'Deployments', 'Team', [...LEADERS, 'developer'], 'team'),

  module('api-connections', 'API Connections', 'Settings', LEADERS, 'connectors'),
  module('team-members', 'Team Members', 'Settings', LEADERS, 'team'),
  module('permissions', 'Permissions', 'Settings', LEADERS, 'permissions'),
  module('notification-preferences', 'Notification Preferences', 'Settings', ALL, 'notifications'),
  module('audit-logs', 'Audit Logs', 'Settings', [...LEADERS, 'developer', 'operations'], 'audit'),
];

export const DATE_PRESETS = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['7d', 'Last 7 Days'],
  ['30d', 'Last 30 Days'],
  ['90d', 'Last 90 Days'],
  ['this-month', 'This Month'],
  ['last-month', 'Last Month'],
  ['this-year', 'This Year'],
  ['custom', 'Custom Range'],
];

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

export const resolveDateRange = (preset, custom = {}) => {
  const now = new Date();
  let from = startOfDay(now);
  let to = endOfDay(now);

  if (preset === 'yesterday') {
    from.setDate(from.getDate() - 1);
    to = endOfDay(from);
  } else if (['7d', '30d', '90d'].includes(preset)) {
    from.setDate(from.getDate() - (Number(preset.replace('d', '')) - 1));
  } else if (preset === 'this-month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (preset === 'last-month') {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    to = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
  } else if (preset === 'this-year') {
    from = new Date(now.getFullYear(), 0, 1);
  } else if (preset === 'custom' && custom.from && custom.to) {
    from = startOfDay(new Date(`${custom.from}T00:00:00`));
    to = endOfDay(new Date(`${custom.to}T00:00:00`));
  }

  return { from: from.toISOString(), to: to.toISOString() };
};

export const getAdminRole = (user) => {
  const role = user?.app_metadata?.admin_role || user?.profile?.staff_role || user?.adminRole || 'admin';
  return String(role).trim().toLowerCase();
};

export const getVisibleDashboards = (role) => DASHBOARDS.filter((dashboard) => dashboard.roles.includes(role));
