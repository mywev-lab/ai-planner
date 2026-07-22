import { getSupabase, isSupabaseConfigured } from "../supabase";

/**
 * Simple key/value settings store backed by the `app_settings` table.
 * Used to persist the single user's Google OAuth tokens.
 *
 * Falls back to an in-memory store when Supabase isn't configured yet, so the
 * OAuth flow can be exercised locally before the database exists (tokens are
 * lost on restart in that mode).
 */

// Prefixed: this Supabase project is shared with the New Empire CRM.
const SETTINGS_TABLE = "ai_planner_settings";

const memory = new Map<string, unknown>();

export interface GoogleTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string;
  token_type?: string | null;
  expiry_date?: number | null;
}

const GOOGLE_TOKENS_KEY = "google_tokens";

async function setSetting(key: string, value: unknown): Promise<void> {
  if (!isSupabaseConfigured()) {
    memory.set(key, value);
    return;
  }
  const supabase = getSupabase();
  const { error } = await supabase
    .from(SETTINGS_TABLE)
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Failed to save setting "${key}": ${error.message}`);
}

async function getSetting<T>(key: string): Promise<T | null> {
  if (!isSupabaseConfigured()) {
    return (memory.get(key) as T) ?? null;
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw new Error(`Failed to read setting "${key}": ${error.message}`);
  return (data?.value as T) ?? null;
}

export function storeGoogleTokens(tokens: GoogleTokens): Promise<void> {
  return setSetting(GOOGLE_TOKENS_KEY, tokens);
}

export function getStoredGoogleTokens(): Promise<GoogleTokens | null> {
  return getSetting<GoogleTokens>(GOOGLE_TOKENS_KEY);
}

export async function clearGoogleTokens(): Promise<void> {
  await setSetting(GOOGLE_TOKENS_KEY, null);
}
