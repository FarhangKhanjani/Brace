import { createClient } from '@supabase/supabase-js';
import config from './config';

// Use values from config instead of direct env variables
const supabaseUrl = config.SUPABASE_URL;
const supabaseKey = config.SUPABASE_KEY;

// Add more detailed logging
console.log('Environment check:', {
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseKey: !!supabaseKey,
    nodeEnv: process.env.NODE_ENV
});

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection
supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
        console.error('Supabase connection error:', error);
    } else {
        console.log('Supabase connected successfully');
    }
}); 