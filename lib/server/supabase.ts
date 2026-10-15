import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { HttpError } from "./http";

export type SupabaseConfig = { url: string; key: string };

function failConfig(): never {
  throw new HttpError(500, "Internal server error");
}

export function supabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key || /\s/.test(url) || /\s/.test(key)) failConfig();
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    failConfig();
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    !parsed.hostname
  ) {
    failConfig();
  }
  return { url: parsed.origin, key };
}

const authOptions = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false
} as const;

export function createAuthClient(config: SupabaseConfig): SupabaseClient {
  return createClient(config.url, config.key, { auth: authOptions });
}

export function createDataClient(config: SupabaseConfig, token: string) {
  return createClient(config.url, config.key, {
    accessToken: async () => token,
    auth: authOptions,
    db: { schema: "shiftpatch", timeout: 10_000, retry: false }
  });
}
