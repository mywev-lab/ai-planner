"use client";

import { useCallback, useEffect, useState } from "react";
import type { CalendarEvent } from "@/lib/types";

export default function AgendaPanel({ refreshKey }: { refreshKey: number }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [connected, setConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const now = new Date();
      const end = new Date(now);
      end.setDate(now.getDate() + 1);
      const res = await fetch(
        `/api/calendar/events?timeMin=${now.toISOString()}&timeMax=${end.toISOString()}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível carregar os eventos.");
      setEvents(json.events);
      setConnected(json.connected);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar os eventos.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const timeLabel = (iso: string): string => {
    if (!iso || iso.length <= 10) return "DIA TODO";
    const d = new Date(iso);
    const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const today = new Date();
    const isTomorrow = d.getDate() !== today.getDate() || d.getMonth() !== today.getMonth();
    return isTomorrow ? `AMANHÃ ${time}` : time;
  };

  return (
    <section className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="icon-badge" aria-hidden>📅</span>
        <h2 className="serif text-2xl leading-tight">Próximas 24 horas</h2>
      </div>

      {!connected && (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          O Google Calendar ainda não está conectado.
        </p>
      )}
      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

      <ul>
        {connected && events.length === 0 && !error && (
          <li className="text-sm" style={{ color: "var(--muted)" }}>
            Nada agendado. Caminho livre 🎉
          </li>
        )}
        {events.map((e, i) => (
          <li
            key={e.id || i}
            className="flex items-center gap-4 py-3"
            style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
          >
            <span
              className="text-xs font-mono uppercase tracking-wide"
              style={{ color: "var(--muted)", minWidth: 92 }}
            >
              {timeLabel(e.start)}
            </span>
            <span className="text-sm flex-1" style={{ color: "var(--text)" }}>
              {e.summary}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
