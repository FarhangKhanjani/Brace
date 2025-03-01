import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://awrjlkqvnugwbtujdsdd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3cmpsa3F2bnVnd2J0dWpkc2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1NTk4NzYsImV4cCI6MjA1NjEzNTg3Nn0.fO3IQezb29yefgj90AkT9ReJuHpv1cuAlj5AD_MpWiE';

const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, options); 