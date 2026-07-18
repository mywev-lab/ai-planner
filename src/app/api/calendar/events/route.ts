import { NextRequest, NextResponse } from "next/server";
import { listEvents } from "@/lib/google/calendar";
import { isCalendarConnected } from "@/lib/google/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isCalendarConnected())) {
    return NextResponse.json({ events: [], connected: false });
  }

  const params = req.nextUrl.searchParams;
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + 1);

  const timeMin = params.get("timeMin") ?? now.toISOString();
  const timeMax = params.get("timeMax") ?? end.toISOString();

  try {
    const events = await listEvents(timeMin, timeMax);
    return NextResponse.json({ events, connected: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list events." },
      { status: 500 }
    );
  }
}
