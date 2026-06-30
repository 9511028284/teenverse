export const PENDING_SIGNUP_PROFILE_KEY = 'teenverse_pending_signup_profile';
export const SIGNUP_PROFILE_METADATA_KEY = 'signup_profile';

const getBrowserStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
};

export const getPendingSignupProfile = () => {
  if (typeof window === 'undefined') return null;

  window.localStorage.removeItem(PENDING_SIGNUP_PROFILE_KEY);

  const storage = getBrowserStorage();
  const raw = storage?.getItem(PENDING_SIGNUP_PROFILE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    storage.removeItem(PENDING_SIGNUP_PROFILE_KEY);
    return null;
  }
};

const getMetadataSignupProfile = (user) => {
  const profile = user?.user_metadata?.[SIGNUP_PROFILE_METADATA_KEY];
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return null;

  const userEmail = String(user?.email || '').trim().toLowerCase();
  const profileEmail = String(profile.email || '').trim().toLowerCase();

  if (userEmail && profileEmail && userEmail !== profileEmail) return null;

  return {
    ...profile,
    email: userEmail || profileEmail,
  };
};

export const getPendingSignupProfileForUser = (user) => {
  const storedProfile = getPendingSignupProfile();
  const userEmail = String(user?.email || '').trim().toLowerCase();
  const storedEmail = String(storedProfile?.email || '').trim().toLowerCase();

  if (storedProfile && (!userEmail || storedEmail === userEmail)) {
    return storedProfile;
  }

  return getMetadataSignupProfile(user);
};

export const setPendingSignupProfile = (profile) => {
  const storage = getBrowserStorage();
  if (!storage) return;
  storage.setItem(PENDING_SIGNUP_PROFILE_KEY, JSON.stringify(profile));
};

export const removePendingSignupProfile = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(PENDING_SIGNUP_PROFILE_KEY);
  window.localStorage.removeItem(PENDING_SIGNUP_PROFILE_KEY);
};
