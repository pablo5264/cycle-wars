import type { SupabaseClient } from "@supabase/supabase-js";

type CreateClientOptions = {
  auth: {
    autoRefreshToken: boolean;
    persistSession: boolean;
    detectSessionInUrl: boolean;
  };
};

type SupabaseModule = {
  createClient: (url: string, anonKey: string, options: CreateClientOptions) => SupabaseClient;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createSupabaseClient(supabaseUrl, supabaseAnonKey) : null;

export const edgeFunctionsUrl = supabaseUrl ? `${supabaseUrl}/functions/v1` : null;

function createSupabaseClient(url: string, anonKey: string): SupabaseClient {
  const { createClient } = require("@supabase/supabase-js") as SupabaseModule;

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  });
}
