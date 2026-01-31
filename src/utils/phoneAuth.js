// src/utils/phoneAuth.js
import { RecaptchaVerifier, signInWithPhoneNumber, signOut } from 'firebase/auth';
import { auth } from '../firebase';

/**
 * Initialize Invisible reCAPTCHA
 * @param {string} elementId - DOM ID of the container (e.g., "recaptcha-container")
 */
export const initRecaptcha = (elementId) => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      'size': 'invisible',
      'callback': () => {
        // reCAPTCHA solved - allow signInWithPhoneNumber.
      },
      'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again.
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    });
  }
  return window.recaptchaVerifier;
};

/**
 * Send SMS OTP
 * @param {string} phoneNumber - Raw input (e.g., "9876543210")
 * @returns {Promise<ConfirmationResult>}
 */
export const sendPhoneOtp = async (phoneNumber) => {
  const verifier = window.recaptchaVerifier;
  if (!verifier) throw new Error("Recaptcha not initialized.");

  // Force India prefix if missing (Standardizes +91)
  const formattedNumber = phoneNumber.startsWith('+') 
    ? phoneNumber 
    : `+91${phoneNumber.replace(/^0+/, '')}`; // Remove leading zeros

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, verifier);
    return confirmationResult;
  } catch (error) {
    // Clean up verifier if sending fails so user can try again
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    throw error;
  }
};

/**
 * Verify OTP Code
 * @param {ConfirmationResult} confirmationResult - From sendPhoneOtp
 * @param {string} otp - User input
 * @returns {Promise<string>} - The verified phone number
 */
export const verifyPhoneOtp = async (confirmationResult, otp) => {
  try {
    const result = await confirmationResult.confirm(otp);
    const verifiedNumber = result.user.phoneNumber;
    
    // IMPORTANT: Sign out of Firebase immediately. 
    // We only needed it for verification, not for session management.
    await signOut(auth);
    
    return verifiedNumber;
  } catch (error) {
    throw error;
  }
};