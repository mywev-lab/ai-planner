import { NextRequest, NextResponse } from "next/server";
import { deleteTask, updateTask } from "@/lib/store/tasks";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function guard() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = guard();
  if (blocked) return blocked;
  const { id } = await params;
  try {
    const changes = await req.json();
    const task = await updateTask(id, changes);
    return NextResponse.json({ task });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update task." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = guard();
  if (blocked) return blocked;
  const { id } = await params;
  try {
    await deleteTask(id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete task." },
      { status: 500 }
    );
  }
}
