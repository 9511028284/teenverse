const DIGIBOOST_SDK_SRC = 'https://cdn.jsdelivr.net/gh/surepassio/surepass-digiboost-web-sdk@latest/index.min.js';

let digiboostSdkPromise = null;

const waitForDigiboostSdk = (timeoutMs = 8000) => new Promise((resolve, reject) => {
  const startedAt = Date.now();

  const check = () => {
    if (typeof window.DigiboostSdk === 'function') {
      resolve(window.DigiboostSdk);
      return;
    }

    if (Date.now() - startedAt >= timeoutMs) {
      reject(new Error('DigiLocker SDK did not load in time.'));
      return;
    }

    window.setTimeout(check, 100);
  };

  check();
});

export const loadDigiboostSdk = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('DigiLocker SDK can only load in the browser.'));
  }

  if (typeof window.DigiboostSdk === 'function') {
    return Promise.resolve(window.DigiboostSdk);
  }

  if (!digiboostSdkPromise) {
    digiboostSdkPromise = new Promise((resolve, reject) => {
      let script = document.querySelector(`script[src="${DIGIBOOST_SDK_SRC}"]`);

      if (!script) {
        script = document.createElement('script');
        script.src = DIGIBOOST_SDK_SRC;
        script.async = true;
        script.dataset.digiboostSdk = 'true';
        document.body.appendChild(script);
      }

      script.addEventListener('load', () => waitForDigiboostSdk().then(resolve).catch(reject), { once: true });
      script.addEventListener('error', () => reject(new Error('Could not load DigiLocker SDK.')), { once: true });

      waitForDigiboostSdk().then(resolve).catch(reject);
    }).catch((error) => {
      digiboostSdkPromise = null;
      throw error;
    });
  }

  return digiboostSdkPromise;
};

