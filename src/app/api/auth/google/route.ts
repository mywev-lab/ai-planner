import { NextResponse } from "next/server";
import { getConsentUrl } from "@/lib/google/client";
import { isGoogleOAuthConfigured } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Kicks off the Google OAuth consent flow. */
export async function GET() {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google OAuth is not configured. Add GOOGLE_CLIENT_ID and " +
          "GOOGLE_CLIENT_SECRET to .env.local first.",
      },
      { status: 503 }
    );
  }
  return NextResponse.redirect(getConsentUrl());
}
