import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jlrslrljvpveaeheetlm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpscnNscmxqdnB2ZWFlaGVldGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzQzNjUsImV4cCI6MjA4OTYxMDM2NX0.jytj6fl3XxrPgiHv7R33YLtf7HzzT-XdEwcBI32n9T8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
