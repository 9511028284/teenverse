export const SESSION_DASHBOARD_ROLES = {
  CLIENT: 'client',
  FREELANCER: 'freelancer',
};

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

