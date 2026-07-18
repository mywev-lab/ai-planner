import { NextRequest, NextResponse } from "next/server";
import { generateBriefing } from "@/lib/briefing";
import { isOpenAIConfigured } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: "OpenAI is not configured. Set OPENAI_API_KEY in .env.local." },
      { status: 503 }
    );
  }
  const range = req.nextUrl.searchParams.get("range") === "week" ? "week" : "day";
  try {
    const briefing = await generateBriefing(range);
    return NextResponse.json(briefing);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to build briefing." },
      { status: 500 }
    );
  }
}
