import { createClient } from "@supabase/supabase-js";

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

/**
 * Service-role Supabase client for server-side trusted operations.
 * IMPORTANT: Only use on the server (Route Handlers / Server Actions).
 */
export function createSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");

  // Required for server-side payment updates / webhook handling.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (required for Razorpay server routes)");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
