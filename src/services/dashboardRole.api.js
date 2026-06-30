import { supabase } from '../supabase';

export const DASHBOARD_ROLES = {
  CLIENT: 'client',
  FREELANCER: 'freelancer',
};

const DASHBOARD_ROLE_KEY = 'teenverse_active_dashboard_role_v1';

export const getDashboardRolePreference = () => {
  if (typeof window === 'undefined') return null;

  const value = window.localStorage.getItem(DASHBOARD_ROLE_KEY);
  return value === DASHBOARD_ROLES.CLIENT || value === DASHBOARD_ROLES.FREELANCER ? value : null;
};

export const setDashboardRolePreference = (role) => {
  if (typeof window === 'undefined') return;

  if (role === DASHBOARD_ROLES.CLIENT || role === DASHBOARD_ROLES.FREELANCER) {
    window.localStorage.setItem(DASHBOARD_ROLE_KEY, role);
    return;
  }

  window.localStorage.removeItem(DASHBOARD_ROLE_KEY);
};

export const getOppositeDashboardRole = (role) => (
  role === DASHBOARD_ROLES.CLIENT ? DASHBOARD_ROLES.FREELANCER : DASHBOARD_ROLES.CLIENT
);

export const ensureDashboardRole = async (targetRole) => {
  if (targetRole !== DASHBOARD_ROLES.CLIENT && targetRole !== DASHBOARD_ROLES.FREELANCER) {
    throw new Error('Choose client or freelancer.');
  }

  const { data, error } = await supabase.functions.invoke('switch-dashboard-role', {
    body: { target_role: targetRole },
  });

  if (error || !data?.success) {
    throw new Error(data?.error || error?.message || 'Could not switch dashboard right now.');
  }

  setDashboardRolePreference(targetRole);
  return data;
};
