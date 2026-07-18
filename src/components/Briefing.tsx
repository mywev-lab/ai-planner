"use client";

import { useCallback, useEffect, useState } from "react";
import { renderMarkdown } from "@/lib/markdown";

interface BriefingData {
  generatedAt: string;
  markdown: string;
  connected: { calendar: boolean; tasks: boolean };
}

export default function Briefing() {
  const [range, setRange] = useState<"day" | "week">("day");
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (r: "day" | "week") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/briefing?range=${r}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load briefing.");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load briefing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">🌅 {range === "day" ? "Daily" : "Weekly"} Briefing</h2>
        <div className="flex gap-2">
          <button
            className={`btn ${range === "day" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setRange("day")}
          >
            Day
          </button>
          <button
            className={`btn ${range === "week" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setRange("week")}
          >
            Week
          </button>
          <button className="btn btn-ghost" onClick={() => load(range)} disabled={loading}>
            ↻
          </button>
        </div>
      </div>

      {loading && <p style={{ color: "var(--muted)" }}>Thinking through your schedule…</p>}
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      {data && !loading && (
        <>
          <div
            className="prose-briefing text-sm"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(data.markdown) }}
          />
          <div className="mt-3 flex gap-2 flex-wrap">
            <span className="badge" style={{ color: data.connected.calendar ? "var(--ok)" : "var(--muted)" }}>
              Calendar {data.connected.calendar ? "connected" : "off"}
            </span>
            <span className="badge" style={{ color: data.connected.tasks ? "var(--ok)" : "var(--muted)" }}>
              Tasks {data.connected.tasks ? "on" : "off"}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
