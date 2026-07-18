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
      if (!res.ok) throw new Error(json.error || "Failed to load events.");
      setEvents(json.events);
      setConnected(json.connected);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const fmt = (iso: string) =>
    iso.length > 10
      ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "all day";

  return (
    <section className="panel p-5">
      <h2 className="text-lg font-bold mb-3">📅 Next 24 hours</h2>

      {!connected && (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Google Calendar isn&apos;t connected yet.
        </p>
      )}
      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

      <ul className="space-y-2">
        {connected && events.length === 0 && !error && (
          <li className="text-sm" style={{ color: "var(--muted)" }}>
            Nothing scheduled. A clear runway 🎉
          </li>
        )}
        {events.map((e) => (
          <li
            key={e.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2"
            style={{ background: "var(--panel-2)" }}
          >
            <span
              className="text-xs font-mono"
              style={{ color: "var(--accent-2)", minWidth: 64 }}
            >
              {fmt(e.start)}
            </span>
            <span className="text-sm flex-1">{e.summary}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
