const CASHFREE_SDK_SRC = 'https://sdk.cashfree.com/js/v3/cashfree.js';

let cashfreeSdkPromise = null;

export const loadCashfreeSdk = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Payment checkout is only available in the browser.'));
  }

  if (typeof window.Cashfree === 'function') {
    return Promise.resolve(window.Cashfree);
  }

  if (!cashfreeSdkPromise) {
    cashfreeSdkPromise = new Promise((resolve, reject) => {
      let script = document.querySelector(`script[src="${CASHFREE_SDK_SRC}"]`);

      const onLoad = () => {
        if (typeof window.Cashfree === 'function') resolve(window.Cashfree);
        else reject(new Error('Payment gateway did not initialize.'));
      };

      const onError = () => reject(new Error('Could not load the payment gateway.'));

      if (!script) {
        script = document.createElement('script');
        script.src = CASHFREE_SDK_SRC;
        script.async = true;
        script.dataset.cashfreeSdk = 'true';
        document.body.appendChild(script);
      }

      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
    }).catch((error) => {
      cashfreeSdkPromise = null;
      throw error;
    });
  }

  return cashfreeSdkPromise;
};

export const createCashfreeCheckout = async () => {
  const Cashfree = await loadCashfreeSdk();
  return new Cashfree({ mode: 'production' });
};
