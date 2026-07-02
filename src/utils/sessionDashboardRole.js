export const SESSION_DASHBOARD_ROLES = {
  CLIENT: 'client',
  FREELANCER: 'freelancer',
};

export const resolveProfileDashboardRole = ({
  profileRole = null,
  hasClient = false,
  hasFreelancer = false,
} = {}) => {
  if (profileRole === 'business' && hasClient) return SESSION_DASHBOARD_ROLES.CLIENT;
  if (profileRole === 'student' && hasFreelancer) return SESSION_DASHBOARD_ROLES.FREELANCER;
  return null;
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
