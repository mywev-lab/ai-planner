import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getServerAuthClient } from "@/lib/auth/server";
import { isAuthConfigured, isEmailAllowed } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lands every Supabase Auth redirect: Google OAuth, e-mail confirmation and
 * password-recovery links. Exchanges the one-time code for a session cookie.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const nextParam = url.searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/";

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${reason}`, url.origin));

  if (!isAuthConfigured()) return fail("not_configured");
  if (url.searchParams.get("error")) return fail("oauth");

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
    return fail("missing_code");
  }

  if (authError) return fail("exchange");

  // Enforce the allow-list here too: a stranger who completes Google sign-in
  // must not end up with a valid session cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isEmailAllowed(user?.email)) {
    await supabase.auth.signOut();
    return fail("not_allowed");
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
