// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://evscodazjgxufyvvsxsw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2c2NvZGF6amd4dWZ5dnZzeHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzODk4NjgsImV4cCI6MjA2MTk2NTg2OH0.kpohlaX3qy_4rOZB16eWwWvonbpgijB3mO_pV2ykLow";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);