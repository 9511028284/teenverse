import { supabase } from '../supabase';

export const openMsg91Widget = (phone, widgetId, tokenAuth) => {
  return new Promise((resolve, reject) => {
    const configuration = {
      widgetId: widgetId,
      tokenAuth: tokenAuth, 
      identifier: phone, 
      exposeMethods: false, 
      success: (data) => {
          // MSG91 returns the token in data.message
          resolve(data.message);
      },
      failure: (error) => {
          reject(new Error(error?.message || 'OTP Verification Failed or Cancelled.'));
      },
    };

    if (typeof window.initSendOTP === 'function') {
        window.initSendOTP(configuration);
        return;
    }

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
            if (typeof window.initSendOTP === 'function') window.initSendOTP(configuration);
            else reject(new Error('Widget init function not found.'));
        };
        s.onerror = () => {
            i++;
            if (i < urls.length) attemptLoad();
            else reject(new Error('Failed to load MSG91 widget scripts.'));
        };
        document.head.appendChild(s);
    }
    attemptLoad();
  });
};

export const verifyMsg91Token = async (accessToken) => {
  const { data, error } = await supabase.functions.invoke('msg91-verify-token', {
    body: { accessToken }
  });

  if (error || !data?.success) {
    throw new Error(data?.error || "Server rejected the OTP token.");
  }
  return true;
};