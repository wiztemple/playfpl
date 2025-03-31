import { createClient } from '@supabase/supabase-js';

// Check if required environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Client for browser usage (limited permissions)
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Admin client for server-side operations (full permissions)
// Only create this on the server side
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

// This function should only be called in server components or API routes
export function getSupabaseAdmin() {
  // Check if we're on the server side
  if (typeof window === 'undefined') {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseServiceKey) {
      console.error('Server-side error: Missing SUPABASE_SERVICE_ROLE_KEY');
      throw new Error('Missing required server-side environment variable');
    }
    
    if (!supabaseAdmin) {
      supabaseAdmin = createClient(
        supabaseUrl || '',
        supabaseServiceKey
      );
    }
    
    return supabaseAdmin;
  }
  
  // If called from client side, throw an error
  throw new Error('getSupabaseAdmin can only be called from server-side code');
}