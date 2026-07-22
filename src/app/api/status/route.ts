import { NextResponse } from "next/server";
import {
  isAuthConfigured,
  isGoogleOAuthConfigured,
  isOpenAIConfigured,
} from "@/lib/config";
import { isCalendarConnected } from "@/lib/google/client";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reports which integrations are configured/connected, for the dashboard. */
export async function GET() {
  const user = await getCurrentUser().catch(() => null);
  return NextResponse.json({
    openai: isOpenAIConfigured(),
    supabase: isSupabaseConfigured(),
    googleOAuthConfigured: isGoogleOAuthConfigured(),
    calendarConnected: await isCalendarConnected().catch(() => false),
    authConfigured: isAuthConfigured(),
    userEmail: user?.email ?? null,
  });
}
