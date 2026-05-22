// src/services/logger.js
import { supabase } from '../supabase';

export const logAction = async (role, action, details) => {
  try {
    // 1. Decide which table to use based on the Role
    const table = role === 'ADMIN' ? 'admin_audit_logs' : 'audit_logs';
    
    // 2. Prepare the data payload (Schema keys match your SQL)
    const payload = role === 'ADMIN' 
      ? { 
          // For admin_audit_logs
          action_type: action,
          metadata: details,
          admin_id: (await supabase.auth.getUser()).data.user?.id 
        }
      : { 
          // For standard audit_logs
          action: action,
          details: details,
          actor_id: (await supabase.auth.getUser()).data.user?.id 
        };

    // 3. Write to Supabase
    const { error } = await supabase.from(table).insert([payload]);
    
    if (error) console.error("Logger Error:", error);
    
  } catch (err) {
    console.error("Logger Exception:", err);
  }
};