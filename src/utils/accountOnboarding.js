const hasVerifiedApplicationPhone = (record) => (
  String(record?.phone || '').replace(/\D/g, '').length >= 10
);

const hasOfficialTeenVerseBadge = (record) => (
  Array.isArray(record?.badges) && record.badges.includes('official_teenversehub')
);

export const hasCompletedAppOnboarding = ({ profile, legacy = {}, parentMatch = null } = {}) => {
  const role = profile?.role;

  if (role === 'admin' || role === 'guardian' || role === 'parent') return true;
  if (legacy.admin || parentMatch) return true;

  // A verified legacy role profile is authoritative for accounts created
  // before profiles.onboarding_completed was introduced. New social accounts
  // have no role row yet, so they still continue through onboarding.
  return hasVerifiedApplicationPhone(legacy.freelancer) ||
    hasVerifiedApplicationPhone(legacy.client) ||
    hasOfficialTeenVerseBadge(legacy.client);
};
