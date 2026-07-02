import { supabase } from '../supabase';
import { getDashboardRolePreferenceKey } from '../utils/sessionDashboardRole';

export const DASHBOARD_ROLES = {
  CLIENT: 'client',
  FREELANCER: 'freelancer',
};

const LEGACY_DASHBOARD_ROLE_KEY = 'teenverse_active_dashboard_role_v1';

export const getDashboardRolePreference = (userId) => {
  if (typeof window === 'undefined') return null;

  const key = getDashboardRolePreferenceKey(userId);
  if (!key) return null;

  window.localStorage.removeItem(LEGACY_DASHBOARD_ROLE_KEY);
  const value = window.localStorage.getItem(key);
  return value === DASHBOARD_ROLES.CLIENT || value === DASHBOARD_ROLES.FREELANCER ? value : null;
};

export const setDashboardRolePreference = (role, userId) => {
  if (typeof window === 'undefined') return;

  const key = getDashboardRolePreferenceKey(userId);
  if (!key) return;

  window.localStorage.removeItem(LEGACY_DASHBOARD_ROLE_KEY);
  if (role === DASHBOARD_ROLES.CLIENT || role === DASHBOARD_ROLES.FREELANCER) {
    window.localStorage.setItem(key, role);
    return;
  }

  window.localStorage.removeItem(key);
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

  return data;
};
