import { createClient } from "@supabase/supabase-js";

function requireAuthConfiguration(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(`Missing required authentication configuration: ${name}`);
  }
  return value;
}

const supabaseUrl = requireAuthConfiguration(
  "VITE_SUPABASE_URL",
  import.meta.env.VITE_SUPABASE_URL,
);
const supabaseAnonKey = requireAuthConfiguration(
  "VITE_SUPABASE_ANON_KEY",
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
