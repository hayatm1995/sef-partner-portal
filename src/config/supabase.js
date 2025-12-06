import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if we have valid Supabase credentials
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'MOCK_SUPABASE_URL' && 
  supabaseAnonKey !== 'MOCK_SUPABASE_ANON_KEY' &&
  supabaseUrl.startsWith('http');

// Create client only if credentials are provided, otherwise create a mock client
let supabase;

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client initialized successfully');
} else {
  // Mock Supabase client for development when credentials aren't set
  console.warn('⚠️ Supabase credentials not found. Using mock client. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env');
  supabase = {
    auth: {
      getSession: async () => {
        console.log('Mock: getSession called - returning no session');
        return Promise.resolve({ data: { session: null }, error: null });
      },
      onAuthStateChange: (callback) => {
        // Immediately call callback with no session to unblock loading
        setTimeout(() => {
          if (callback) callback('SIGNED_OUT', null);
        }, 0);
        return { 
          data: { 
            subscription: { 
              unsubscribe: () => {
                console.log('Mock: Unsubscribed from auth state changes');
              }
            } 
          } 
        };
      },
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
      update: () => ({ data: null, error: { message: 'Supabase not configured' } }),
      delete: () => ({ error: { message: 'Supabase not configured' } }),
    }),
  };
}

export { supabase, isSupabaseConfigured };

