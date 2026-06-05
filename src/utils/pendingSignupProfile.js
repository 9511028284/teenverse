export const PENDING_SIGNUP_PROFILE_KEY = 'teenverse_pending_signup_profile';

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
