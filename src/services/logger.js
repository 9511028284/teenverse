// src/services/logger.js
import { supabase } from '../supabase';

export const logAction = async (...args) => {
  try {
    const [firstArg, secondArg, thirdArg] = args;
    const legacyRole = firstArg === 'ADMIN' ? firstArg : null;
    const action = legacyRole ? secondArg : firstArg;
    const details = legacyRole ? thirdArg : secondArg;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      action,
      details,
      actor_id: user?.id || null,
    };

    const { error } = await supabase.from('audit_logs').insert([payload]);
    
    if (error) console.error("Logger Error:", error);
    
  } catch (err) {
    console.error("Logger Exception:", err);
  }
};
