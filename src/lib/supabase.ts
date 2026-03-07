import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const credentialsPath = '/root/.openclaw/credentials/supabase.json';
const { url: supabaseUrl, anon_key: supabaseAnonKey, service_key: supabaseServiceKey } = JSON.parse(
  readFileSync(credentialsPath, 'utf-8')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
