const GOOGLE_IDENTITY_SDK_SRC = 'https://accounts.google.com/gsi/client';

let googleIdentitySdkPromise = null;

export const loadGoogleIdentitySdk = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google sign-in is only available in the browser.'));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id);
  }

  if (!googleIdentitySdkPromise) {
    googleIdentitySdkPromise = new Promise((resolve, reject) => {
      let script = document.querySelector(`script[src="${GOOGLE_IDENTITY_SDK_SRC}"]`);

      const onLoad = () => {
        if (window.google?.accounts?.id) resolve(window.google.accounts.id);
        else reject(new Error('Google sign-in did not initialize.'));
      };

      const onError = () => reject(new Error('Could not load Google sign-in.'));

      if (!script) {
        script = document.createElement('script');
        script.src = GOOGLE_IDENTITY_SDK_SRC;
        script.async = true;
        script.defer = true;
        script.dataset.googleIdentitySdk = 'true';
        document.head.appendChild(script);
      }

      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
    }).catch((error) => {
      googleIdentitySdkPromise = null;
      throw error;
    });
  }

  return googleIdentitySdkPromise;
};

export const generateGoogleNonce = async () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const rawNonce = btoa(String.fromCharCode(...bytes));
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawNonce));
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return { rawNonce, hashedNonce };
};
