import { createClient } from '@supabase/supabase-js';

// 🛑 REMOVED the single quotes around the environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY; // Note: Usually this is named VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey);