import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getServerAuthClient } from "@/lib/auth/server";
import { isAuthConfigured, isEmailAllowed } from "@/lib/config";
import { NEXT_COOKIE } from "@/lib/auth/nextCookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lands every Supabase Auth redirect: Google OAuth, e-mail confirmation and
 * password-recovery links. Exchanges the one-time code for a session cookie.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;

  const cookieNext = req.cookies.get(NEXT_COOKIE)?.value;
  const next = cookieNext?.startsWith("/") ? cookieNext : "/";

  const fail = (reason: string, detail?: string | null) => {
    const to = new URL("/login", url.origin);
    to.searchParams.set("error", reason);
    if (detail) to.searchParams.set("detail", detail.slice(0, 160));
    // Surface the real cause in the server log too.
    console.error(`[auth/callback] ${reason}${detail ? `: ${detail}` : ""}`);
    const res = NextResponse.redirect(to);
    res.cookies.delete(NEXT_COOKIE);
    return res;
  };

  if (!isAuthConfigured()) return fail("not_configured");

  // The provider or Supabase itself rejected the request.
  const providerError = url.searchParams.get("error");
  if (providerError) {
    return fail(
      "oauth",
      url.searchParams.get("error_description") ?? providerError
    );
  }

  const supabase = await getServerAuthClient();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  let authError: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error?.message ?? null;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    authError = error?.message ?? null;
  } else {
    // No `code` at all: usually the Redirect URL is not on Supabase's
    // allow-list, or the project is on the implicit flow (tokens arrive in the
    // URL fragment, which never reaches the server).
    return fail("missing_code");
  }

  if (authError) return fail("exchange", authError);

  // Enforce the allow-list here too: a stranger who completes Google sign-in
  // must not end up with a valid session cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isEmailAllowed(user?.email)) {
    await supabase.auth.signOut();
    return fail("not_allowed", user?.email ?? null);
  }

  const res = NextResponse.redirect(new URL(next, url.origin));
  res.cookies.delete(NEXT_COOKIE);
  return res;
}
