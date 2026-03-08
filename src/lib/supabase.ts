import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';

type SupabaseCredentials = {
  url?: string;
  anon_key?: string;
  service_key?: string;
};

const credentialsPath = '/root/.openclaw/credentials/supabase.json';

function loadSupabaseCredentials(): SupabaseCredentials {
  const envCredentials: SupabaseCredentials = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    service_key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  };

  if (envCredentials.url && (envCredentials.anon_key || envCredentials.service_key)) {
    return envCredentials;
  }

  if (existsSync(credentialsPath)) {
    return JSON.parse(readFileSync(credentialsPath, 'utf-8')) as SupabaseCredentials;
  }

  return envCredentials;
}

export function getSupabase() {
  const { url, anon_key } = loadSupabaseCredentials();
  if (!url || !anon_key) {
    throw new Error(
      'Missing Supabase client credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or provide /root/.openclaw/credentials/supabase.json on self-hosted deployments.'
    );
  }
  return createClient(url, anon_key);
}

export function getSupabaseAdmin() {
  const { url, service_key } = loadSupabaseCredentials();
  if (!url || !service_key) {
    throw new Error(
      'Missing Supabase admin credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY), or provide /root/.openclaw/credentials/supabase.json on self-hosted deployments.'
    );
  }
  return createClient(url, service_key);
}
