import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_PROJECT_URL;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !anonKey) {
  throw new Error(
    'VITE_SUPABASE_PROJECT_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set (client/.env).'
  );
}

export const supabase = createClient(url, anonKey);
