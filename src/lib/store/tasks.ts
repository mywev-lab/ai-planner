import { getSupabase } from "../supabase";
import type { Task, TaskPriority, TaskStatus } from "../types";

const TABLE = "tasks";

export async function listTasks(status?: TaskStatus): Promise<Task[]> {
  const supabase = getSupabase();
  let query = supabase.from(TABLE).select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(`listTasks: ${error.message}`);
  return (data ?? []) as Task[];
}

export async function createTask(input: {
  title: string;
  notes?: string;
  priority?: TaskPriority;
  estimated_minutes?: number;
  deadline?: string;
}): Promise<Task> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      title: input.title,
      notes: input.notes ?? null,
      priority: input.priority ?? "medium",
      estimated_minutes: input.estimated_minutes ?? null,
      deadline: input.deadline ?? null,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw new Error(`createTask: ${error.message}`);
  return data as Task;
}

export async function updateTask(
  id: string,
  changes: Partial<
    Pick<
      Task,
      | "title"
      | "notes"
      | "priority"
      | "estimated_minutes"
      | "deadline"
      | "status"
      | "scheduled_event_id"
    >
  >
): Promise<Task> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`updateTask: ${error.message}`);
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(`deleteTask: ${error.message}`);
}

export async function getTask(id: string): Promise<Task | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`getTask: ${error.message}`);
  return (data as Task) ?? null;
}
