import { supabase } from '../supabase';

// 🔒 SECURITY: Immutable Audit Log
export const logAction = async (userId, action, details, level = 'info') => {
  try {
    const { error } = await supabase.from('audit_logs').insert([{
      user_id: userId,
      action: action.toUpperCase(), // e.g., 'PAYMENT_RELEASE', 'USER_BAN'
      details: details, // JSON object
      level: level,
      ip_address: 'client-side', // In a real app, use Edge Functions to capture true IP
      user_agent: navigator.userAgent
    }]);
    if (error) console.error("Audit Log Failed:", error);
  } catch (err) {
    console.error("Logger Error:", err);
  }
};