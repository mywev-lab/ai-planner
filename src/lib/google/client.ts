import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { config, isGoogleOAuthConfigured } from "../config";
import { getStoredGoogleTokens, storeGoogleTokens } from "../store/settings";

/**
 * Google OAuth2 for single-user Calendar access.
 *
 * Flow:
 *   1. /api/auth/google        → redirect user to Google consent
 *   2. /api/auth/google/callback → exchange code, persist refresh token
 *   3. getAuthorizedClient()   → build a client that auto-refreshes access tokens
 *
 * Until GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are set, and the user has
 * connected once, calendar calls throw a friendly "not connected" error that
 * the agent surfaces to the user rather than crashing.
 */

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

export function createOAuthClient(): OAuth2Client {
  if (!isGoogleOAuthConfigured()) {
    throw new GoogleNotConnectedError(
      "Google OAuth is not configured. Add GOOGLE_CLIENT_ID and " +
        "GOOGLE_CLIENT_SECRET to .env.local."
    );
  }
  return new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
}

export function getConsentUrl(): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline", // request a refresh token
    prompt: "consent", // force refresh_token on re-consent
    scope: GOOGLE_SCOPES,
  });
}

/**
 * Build a client authorized for API calls, or throw GoogleNotConnectedError
 * if the user hasn't completed the OAuth flow yet.
 */
export async function getAuthorizedClient(): Promise<OAuth2Client> {
  const client = createOAuthClient();
  const tokens = await getStoredGoogleTokens();
  if (!tokens?.refresh_token) {
    throw new GoogleNotConnectedError(
      "Google Calendar is not connected yet. Connect it from the dashboard."
    );
  }
  client.setCredentials(tokens);

  // Persist refreshed tokens transparently.
  client.on("tokens", (fresh) => {
    void storeGoogleTokens({ ...tokens, ...fresh });
  });

  return client;
}

export async function isCalendarConnected(): Promise<boolean> {
  if (!isGoogleOAuthConfigured()) return false;
  const tokens = await getStoredGoogleTokens().catch(() => null);
  return Boolean(tokens?.refresh_token);
}

export class GoogleNotConnectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleNotConnectedError";
  }
}
