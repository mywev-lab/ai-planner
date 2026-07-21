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
    <main className="max-w-6xl mx-auto px-5 py-10 md:py-14">
      <header className="flex items-start justify-between gap-4 mb-8">
        <div>
          <span className="pill mb-4">✦ Assistente executivo do tempo</span>
          <h1 className="serif text-5xl md:text-6xl mt-3">AI Planner</h1>
          <p className="mt-3 text-base max-w-xl" style={{ color: "var(--muted)" }}>
            Um dia bem orquestrado, um foco bem protegido. Seu assistente
            executivo, calmo e atento.
          </p>
        </div>
        <div className="pt-1">
          <ConnectBar />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] items-start">
        <div className="space-y-6">
          <Briefing />
          <AgendaPanel refreshKey={refreshKey} />
        </div>
        <div className="space-y-6">
          <ChatPanel onAction={refresh} />
          <TaskPanel refreshKey={refreshKey} />
        </div>
      </div>

      <footer
        className="mt-10 pt-5 flex items-center justify-between text-sm flex-wrap gap-2"
        style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}
      >
        <span>© AI Planner · Um dia por vez, em harmonia.</span>
        <span>⚘ Integrações ativas</span>
      </footer>
    </main>
  );
}
