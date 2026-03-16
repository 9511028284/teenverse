import { createClient } from '@supabase/supabase-js';

// REPLACE WITH YOUR SUPABASE KEYS
const supabaseUrl = 'import.meta.env.VITE_SUPABASE_URL';
const supabaseKey = 'import.meta.env.VITE_SUPABASE_Keys';

export const supabase = createClient(supabaseUrl, supabaseKey);