const hasVerifiedApplicationPhone = (record) => (
  String(record?.phone || '').replace(/\D/g, '').length >= 10
);

export const hasCompletedAppOnboarding = ({ profile, legacy = {}, parentMatch = null } = {}) => {
  const role = profile?.role;

  if (role === 'admin' || role === 'guardian' || role === 'parent') return true;
  if (legacy.admin || parentMatch) return true;

  return profile?.onboarding_completed === true && (
    hasVerifiedApplicationPhone(legacy.freelancer) ||
    hasVerifiedApplicationPhone(legacy.client)
  );
};

