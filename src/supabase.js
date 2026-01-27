import { createClient } from '@supabase/supabase-js';

// REPLACE WITH YOUR SUPABASE KEYS
const supabaseUrl = 'https://bjxmxihjcbgieaohqipw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqeG14aWhqY2JnaWVhb2hxaXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTM5NzUsImV4cCI6MjA3OTIyOTk3NX0.O6EYhfmdk4EIgyStolIZ1lQwqD6W45KBxeoLqa-Laa8';

export const supabase = createClient(supabaseUrl, supabaseKey);