import { NextRequest, NextResponse } from "next/server";
import { createTask, listTasks } from "@/lib/store/tasks";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { TaskStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function guard() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
          "SUPABASE_SERVICE_ROLE_KEY in .env.local, then run the migration.",
      },
      { status: 503 }
    );
  }
  return null;
}

export async function GET(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;
  const status = req.nextUrl.searchParams.get("status") as TaskStatus | null;
  try {
    const tasks = await listTasks(status ?? undefined);
    return NextResponse.json({ tasks });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list tasks." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;
  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ error: "`title` is required." }, { status: 400 });
    }
    const task = await createTask(body);
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create task." },
      { status: 500 }
    );
  }
}
