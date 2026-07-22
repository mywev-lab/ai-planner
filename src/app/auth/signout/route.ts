import { NextRequest, NextResponse } from "next/server";
import { getServerAuthClient } from "@/lib/auth/server";
import { isAuthConfigured } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ends the session and returns to the login screen. POST-only, so a stray
 *  link preview or prefetch can't sign the user out. */
export async function POST(req: NextRequest) {
  if (isAuthConfigured()) {
    const supabase = await getServerAuthClient();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/login", req.nextUrl.origin), {
    status: 303,
  });
}
