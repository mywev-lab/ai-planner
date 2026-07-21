"use client";

import { useCallback, useEffect, useState } from "react";
import type { Task, TaskPriority } from "@/lib/types";

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: "#64748b",
  medium: "#0e7490",
  high: "#c2620a",
  urgent: "#dc2626",
};

export default function TaskPanel({ refreshKey }: { refreshKey: number }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load tasks.");
      setTasks(json.tasks);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          priority,
          estimated_minutes: minutes ? Number(minutes) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add task.");
      setTitle("");
      setMinutes("");
      setPriority("medium");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add task.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleDone(t: Task) {
    await fetch(`/api/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: t.status === "done" ? "pending" : "done" }),
    });
    load();
  }

  async function remove(t: Task) {
    await fetch(`/api/tasks/${t.id}`, { method: "DELETE" });
    load();
  }

  return (
    <section className="panel p-5">
      <h2 className="text-lg font-bold mb-3">✅ Tasks</h2>

      <form onSubmit={addTask} className="space-y-2 mb-4">
        <input
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text)" }}
          placeholder="New task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <select
            className="rounded-lg px-2 py-2 text-sm flex-1"
            style={{ background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text)" }}
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <input
            className="rounded-lg px-2 py-2 text-sm w-24"
            style={{ background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text)" }}
            placeholder="min"
            inputMode="numeric"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
          <button className="btn btn-primary" disabled={loading || !title.trim()}>
            Add
          </button>
        </div>
      </form>

      {error && <p className="text-sm mb-2" style={{ color: "var(--danger)" }}>{error}</p>}

      <ul className="space-y-2">
        {tasks.length === 0 && !error && (
          <li className="text-sm" style={{ color: "var(--muted)" }}>
            No tasks yet. Add one, or ask the assistant to plan your day.
          </li>
        )}
        {tasks.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: "var(--panel-2)" }}
          >
            <input
              type="checkbox"
              checked={t.status === "done"}
              onChange={() => toggleDone(t)}
            />
            <span
              className="flex-1 text-sm"
              style={{
                textDecoration: t.status === "done" ? "line-through" : "none",
                color: t.status === "done" ? "var(--muted)" : "var(--text)",
              }}
            >
              {t.title}
              {t.estimated_minutes ? (
                <span style={{ color: "var(--muted)" }}> · {t.estimated_minutes}m</span>
              ) : null}
            </span>
            <span className="badge" style={{ color: PRIORITY_COLOR[t.priority] }}>
              {t.priority}
            </span>
            {t.status === "scheduled" && (
              <span className="badge" style={{ color: "var(--accent-2)" }}>
                scheduled
              </span>
            )}
            <button
              className="text-sm"
              style={{ color: "var(--muted)" }}
              onClick={() => remove(t)}
              aria-label="Delete task"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
