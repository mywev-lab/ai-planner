"use client";

import { createBrowserClient } from "@supabase/ssr";
import { config } from "@/lib/config";

/**
 * Browser-side Supabase client, used only for authentication (login, sign-up,
 * password recovery). It carries the public anon key — never the service role.
 */
type AuthClient = ReturnType<typeof createBrowserClient>;

let browserClient: AuthClient | null = null;

export function getAuthClient(): AuthClient {
  if (!browserClient) {
    browserClient = createBrowserClient(config.supabase.url, config.supabase.anonKey);
  }
  return browserClient;
}
