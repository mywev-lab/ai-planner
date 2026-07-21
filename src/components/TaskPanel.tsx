"use client";

import { useCallback, useEffect, useState } from "react";
import type { Task, TaskPriority } from "@/lib/types";

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "baixa",
  medium: "média",
  high: "alta",
  urgent: "urgente",
};

const PRIORITY_STYLE: Record<TaskPriority, { bg: string; color: string }> = {
  low: { bg: "#eee6d6", color: "#877d6d" },
  medium: { bg: "#ece0cb", color: "#9a7c4f" },
  high: { bg: "#f6d9c2", color: "#c1743f" },
  urgent: { bg: "#f2cfc9", color: "#bd524a" },
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
      if (!res.ok) throw new Error(json.error || "Não foi possível carregar as tarefas.");
      setTasks(json.tasks);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar as tarefas.");
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
      if (!res.ok) throw new Error(json.error || "Não foi possível adicionar a tarefa.");
      setTitle("");
      setMinutes("");
      setPriority("medium");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível adicionar a tarefa.");
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
    <section className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="icon-badge" aria-hidden>✅</span>
        <h2 className="serif text-2xl leading-tight">Tarefas</h2>
      </div>

      <form onSubmit={addTask} className="space-y-2 mb-4">
        <input
          className="w-full rounded-full px-4 py-2.5 text-sm outline-none"
          placeholder="Nova tarefa…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <select
            className="rounded-full px-3 py-2.5 text-sm flex-1"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
          <input
            className="rounded-full px-3 py-2.5 text-sm w-20 text-center"
            placeholder="min"
            inputMode="numeric"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
          <button className="btn btn-dark" disabled={loading || !title.trim()}>
            + Add
          </button>
        </div>
      </form>

      {error && <p className="text-sm mb-2" style={{ color: "var(--danger)" }}>{error}</p>}

      <ul className="space-y-2">
        {tasks.length === 0 && !error && (
          <li className="text-sm" style={{ color: "var(--muted)" }}>
            Nenhuma tarefa ainda. Adicione uma, ou peça ao assistente para planejar seu dia.
          </li>
        )}
        {tasks.map((t) => {
          const done = t.status === "done";
          const ps = PRIORITY_STYLE[t.priority];
          return (
            <li
              key={t.id}
              className="group flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: "var(--panel-2)", border: "1px solid var(--border)" }}
            >
              <button
                onClick={() => toggleDone(t)}
                aria-label={done ? "Marcar como pendente" : "Concluir"}
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  border: `1.5px solid ${done ? "var(--accent)" : "var(--border-strong)"}`,
                  background: done ? "var(--accent)" : "transparent",
                  color: "#fff",
                  fontSize: 11,
                  lineHeight: 1,
                }}
              >
                {done ? "✓" : ""}
              </button>

              <span
                className="flex-1 text-sm"
                style={{
                  textDecoration: done ? "line-through" : "none",
                  color: done ? "var(--muted-soft)" : "var(--text)",
                }}
              >
                {t.title}
                {t.estimated_minutes ? (
                  <span style={{ color: "var(--muted)" }}> · {t.estimated_minutes}m</span>
                ) : null}
              </span>

              <span className="badge" style={{ background: ps.bg, color: ps.color }}>
                {PRIORITY_LABEL[t.priority]}
              </span>

              <button
                className="text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--muted)" }}
                onClick={() => remove(t)}
                aria-label="Excluir tarefa"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
