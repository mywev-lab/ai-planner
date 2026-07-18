/**
 * Centralised runtime configuration.
 * Reads from environment; provides sane defaults and `isConfigured` guards
 * so the app degrades gracefully when a credential is still missing.
 */

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.OPENAI_MODEL || "gpt-4o",
  },
  google: {
    apiKey: process.env.GOOGLE_CALENDAR_API ?? "",
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:3000/api/auth/google/callback",
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  },
  app: {
    timezone: process.env.APP_TIMEZONE || "UTC",
    workDayStart: process.env.WORK_DAY_START || "09:00",
    workDayEnd: process.env.WORK_DAY_END || "18:00",
  },
} as const;

export const isOpenAIConfigured = () => Boolean(config.openai.apiKey);

export const isGoogleOAuthConfigured = () =>
  Boolean(config.google.clientId && config.google.clientSecret);

export const isSupabaseConfigured = () =>
  Boolean(config.supabase.url && config.supabase.serviceRoleKey);
