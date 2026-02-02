// Initialize Supabase client for the browser.
// This module imports the public Supabase URL and anon key from `modules/config.js`
// and creates a singleton `supabase` client using `createClient`.
// IMPORTANT: Never place `service_role` or other secret keys in a client-side file.

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Create and export the Supabase client instance.
// The anon key is intended for client-side use with RLS enabled on the database.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };
