"use client";

import { useCallback, useState } from "react";
import Briefing from "@/components/Briefing";
import ChatPanel from "@/components/ChatPanel";
import TaskPanel from "@/components/TaskPanel";
import AgendaPanel from "@/components/AgendaPanel";
import ConnectBar from "@/components/ConnectBar";

export default function Home() {
  // Bumped whenever the assistant takes an action, to refresh data panels.
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">AI Planner</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Your executive assistant for time.
          </p>
        </div>
      </header>

      <ConnectBar />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <Briefing />
          <AgendaPanel refreshKey={refreshKey} />
          <TaskPanel refreshKey={refreshKey} />
        </div>
        <ChatPanel onAction={refresh} />
      </div>
    </main>
  );
}
