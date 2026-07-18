import { NextResponse } from "next/server";
import { isGoogleOAuthConfigured, isOpenAIConfigured } from "@/lib/config";
import { isCalendarConnected } from "@/lib/google/client";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reports which integrations are configured/connected, for the dashboard. */
export async function GET() {
  return NextResponse.json({
    openai: isOpenAIConfigured(),
    supabase: isSupabaseConfigured(),
    googleOAuthConfigured: isGoogleOAuthConfigured(),
    calendarConnected: await isCalendarConnected().catch(() => false),
  });
}
