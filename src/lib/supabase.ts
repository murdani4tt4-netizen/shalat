import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a dummy client for build time when env vars are not set
let _supabase: SupabaseClient;

if (supabaseUrl && supabaseUrl.startsWith('http')) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Provide a no-op client for build time
  _supabase = createClient('https://placeholder.supabase.co', 'placeholder-key') as any;
}

export const supabase = _supabase;

export const getSupabaseServer = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceRoleKey || !supabaseUrl.startsWith('http')) {
    throw new Error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient(supabaseUrl, serviceRoleKey);
};
