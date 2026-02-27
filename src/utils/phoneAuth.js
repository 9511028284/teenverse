// src/utils/phoneAuth.js

/**
 * Dynamically loads the MSG91 script with fallbacks and opens the OTP Widget
 * @param {string} phone - The formatted phone number to pre-fill
 * @param {string} widgetId - Your MSG91 Widget ID (e.g., "3662416d3163393332393134")
 * @param {string} tokenAuth - Your MSG91 Token Auth (optional, if your widget requires it)
 * @returns {Promise<any>} - Resolves with verification data, rejects on failure
 */
export const openMsg91Widget = (phone, widgetId, tokenAuth) => {
  return new Promise((resolve, reject) => {
    
    // 1. Define the exact configuration object from your snippet
    const configuration = {
      widgetId: widgetId,
      tokenAuth: tokenAuth || "", // Pass empty string if not using a token
      identifier: phone, // Pre-fills the user's mobile number
      exposeMethods: false, 
      success: (data) => {
          // get verified token in response
          resolve(data);
      },
      failure: (error) => {
          // handle error (e.g., user closes the modal or verification fails)
          reject(new Error(error?.message || 'OTP Verification Failed or Cancelled.'));
      },
    };

    // 2. If the script was already loaded in a previous step, just trigger it immediately
    if (typeof window.initSendOTP === 'function') {
        window.initSendOTP(configuration);
        return;
    }

    // 3. Fallback Script Loader (Adapted directly from your snippet)
    const urls = [
        'https://verify.msg91.com/otp-provider.js',
        'https://verify.phone91.com/otp-provider.js'
    ];
    let i = 0;

    function attemptLoad() {
        const s = document.createElement('script');
        s.src = urls[i];
        s.async = true;
        
        s.onload = () => {
            if (typeof window.initSendOTP === 'function') {
                window.initSendOTP(configuration);
            } else {
                reject(new Error('Widget loaded but initSendOTP function was not found.'));
            }
        };
        
        s.onerror = () => {
            i++;
            if (i < urls.length) {
                // Try the next fallback URL
                attemptLoad();
            } else {
                reject(new Error('Failed to load MSG91 widget scripts from all fallback sources. Check your network.'));
            }
        };
        
        document.head.appendChild(s);
    }

    // Start the loading process
    attemptLoad();
  });
};