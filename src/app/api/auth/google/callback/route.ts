import { NextRequest, NextResponse } from "next/server";
import { createOAuthClient } from "@/lib/google/client";
import { getStoredGoogleTokens, storeGoogleTokens } from "@/lib/store/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Handles the OAuth redirect: exchanges the code and persists tokens. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const error = url.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(new URL(`/?connected=error`, url.origin));
  }
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL(`/?connected=error`, url.origin));
  }

  try {
    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);

    // Google only returns a refresh_token on first consent; preserve an
    // existing one if this is a re-auth that omitted it.
    const existing = await getStoredGoogleTokens().catch(() => null);
    await storeGoogleTokens({
      ...existing,
      ...tokens,
      refresh_token: tokens.refresh_token ?? existing?.refresh_token ?? null,
    });

    return NextResponse.redirect(new URL(`/?connected=1`, url.origin));
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    return NextResponse.redirect(new URL(`/?connected=error`, url.origin));
  }
}
