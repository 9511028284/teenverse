import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const rememberPreferenceKey = 'teenverse_remember_me';

const getAuthStorage = () => {
  if (typeof window === 'undefined') return undefined;

  const shouldRemember = () => window.localStorage.getItem(rememberPreferenceKey) !== 'false';

  return {
    getItem: (key) => shouldRemember()
      ? window.localStorage.getItem(key)
      : window.sessionStorage.getItem(key),
    setItem: (key, value) => {
      if (shouldRemember()) {
        window.localStorage.setItem(key, value);
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, value);
        window.localStorage.removeItem(key);
      }
    },
    removeItem: (key) => {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    },
  };
};

export const setRememberedSessionPreference = (remember) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(rememberPreferenceKey, remember ? 'true' : 'false');
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: getAuthStorage(),
  },
});
