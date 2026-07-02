export const SESSION_DASHBOARD_ROLES = {
  CLIENT: 'client',
  FREELANCER: 'freelancer',
};

const DASHBOARD_ROLE_KEY_PREFIX = 'teenverse_active_dashboard_role_v2';

export const getDashboardRolePreferenceKey = (userId) => (
  userId ? `${DASHBOARD_ROLE_KEY_PREFIX}:${userId}` : null
);

export const resolveProfileDashboardRole = ({
  profileRole = null,
  hasClient = false,
  hasFreelancer = false,
} = {}) => {
  if (profileRole === 'business' && hasClient) return SESSION_DASHBOARD_ROLES.CLIENT;
  if (profileRole === 'student' && hasFreelancer) return SESSION_DASHBOARD_ROLES.FREELANCER;
  return null;
};

export const resolvePreferredDashboardRole = ({
  profileRole = null,
  savedRole = null,
  hasClient = false,
  hasFreelancer = false,
} = {}) => (
  resolveProfileDashboardRole({ profileRole, hasClient, hasFreelancer }) ||
  resolveSessionDashboardRole({ preferredRole: savedRole, hasClient, hasFreelancer })
);

export const resolveSessionDashboardRole = ({
  preferredRole = null,
  hasClient = false,
  hasFreelancer = false,
} = {}) => {
  if (preferredRole === SESSION_DASHBOARD_ROLES.CLIENT && hasClient) {
    return SESSION_DASHBOARD_ROLES.CLIENT;
  }

  if (preferredRole === SESSION_DASHBOARD_ROLES.FREELANCER && hasFreelancer) {
    return SESSION_DASHBOARD_ROLES.FREELANCER;
  }

  if (hasClient && !hasFreelancer) {
    return SESSION_DASHBOARD_ROLES.CLIENT;
  }

  return SESSION_DASHBOARD_ROLES.FREELANCER;
};
