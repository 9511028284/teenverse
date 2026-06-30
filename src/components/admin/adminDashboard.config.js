const ALL = ['founder', 'admin', 'finance', 'marketing', 'operations', 'support', 'developer', 'viewer'];
const LEADERS = ['founder', 'admin'];
const FINANCE = ['founder', 'admin', 'finance'];
const GROWTH = ['founder', 'admin', 'marketing'];
const OPS = ['founder', 'admin', 'operations'];
const SUPPORT = ['founder', 'admin', 'support', 'operations'];
const TECH = ['founder', 'admin', 'developer'];
const READ_BUSINESS = ['founder', 'admin', 'finance', 'operations', 'viewer'];

const module = (id, label, group, roles, model = id, dateScoped = true) => ({ id, label, group, roles, model, dateScoped });

export const DASHBOARDS = [
  module('overview', 'Overview', 'Overview', ALL, 'founder'),
  module('marketplace', 'Marketplace', 'Marketplace', READ_BUSINESS),
  module('marketing', 'Marketing', 'Marketing', GROWTH),
  module('users', 'Users', 'Users', ALL, 'user-growth'),
  module('revenue', 'Revenue', 'Revenue', FINANCE),
  module('payments', 'Payments', 'Payments', FINANCE),
  module('operations', 'Operations', 'Operations', OPS),
  module('support', 'Support', 'Support', SUPPORT),
  module('product', 'Product Analytics', 'Product Analytics', ['founder', 'admin', 'developer', 'marketing', 'viewer']),
  module('ai', 'AI Analytics', 'AI Analytics', TECH),
  module('infrastructure', 'Infrastructure', 'Infrastructure', TECH),
  module('security', 'Security', 'Security', ['founder', 'admin', 'developer', 'operations']),
  module('team', 'Team', 'Team', [...LEADERS, 'developer']),
  module('reports', 'Reports', 'Reports', FINANCE, 'notifications', false),
  module('settings', 'Settings', 'Settings', ALL, 'settings', false),
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
