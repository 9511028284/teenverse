// src/utils/phoneAuth.js
import { supabase } from '../supabase';

/**
 * Send SMS OTP via MSG91 (Routed through Supabase Edge Function)
 * @param {string} phoneNumber - Raw input (e.g., "9876543210")
 * @returns {Promise<string>} - The formatted phone number used for verification
 */
export const sendPhoneOtp = async (phoneNumber) => {
  if (!phoneNumber) throw new Error("Phone number is required.");

  // Force India prefix if missing (Standardizes to +91)
  // Adjust this logic if you plan to support international numbers
  const formattedNumber = phoneNumber.startsWith('+') 
    ? phoneNumber 
    : `+91${phoneNumber.replace(/^0+/, '')}`; // Removes any accidental leading zeros

  // Invoke the secure Edge Function
  const { data, error } = await supabase.functions.invoke('msg91-auth', {
    body: { action: 'send', phone: formattedNumber }
  });

  // Handle network or function execution errors
  if (error) {
    throw new Error(error.message || "Network error while contacting the OTP service.");
  }

  // Handle MSG91 API errors returned by the function
  if (!data?.success) {
    throw new Error(data?.error || "Failed to send OTP.");
  }

  // Return the formatted number so the UI state can hold onto it for the verification step
  return formattedNumber; 
};

/**
 * Verify OTP Code via MSG91
 * @param {string} phoneNumber - The formatted number returned from sendPhoneOtp
 * @param {string} otp - User input (usually 4 to 6 digits)
 * @returns {Promise<string>} - The successfully verified phone number
 */
export const verifyPhoneOtp = async (phoneNumber, otp) => {
  if (!otp) throw new Error("OTP code is required.");

  const { data, error } = await supabase.functions.invoke('msg91-auth', {
    body: { action: 'verify', phone: phoneNumber, otp: otp.trim() }
  });

  if (error) {
    throw new Error(error.message || "Network error during verification.");
  }

  if (!data?.success) {
    throw new Error(data?.error || "Invalid or Expired OTP code.");
  }

  return phoneNumber;
};