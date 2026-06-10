// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Vérification des variables d'environnement
if (!supabaseUrl) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL is missing. ' +
    'Make sure .env.local exists with NEXT_PUBLIC_SUPABASE_URL defined.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. ' +
    'Make sure .env.local exists with NEXT_PUBLIC_SUPABASE_ANON_KEY defined.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
