import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_KEY;

// Add some debug logging
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials are missing!', { 
        url: supabaseUrl ? 'Set' : 'Missing', 
        key: supabaseAnonKey ? 'Set' : 'Missing' 
    });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add a listener for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session ? 'User is logged in' : 'No user');
});

// Test the connection
supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
        console.error('Supabase connection error:', error);
    } else {
        console.log('Supabase connected successfully');
    }
}); 