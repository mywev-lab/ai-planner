"use client";

import { useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { renderMarkdown } from "@/lib/markdown";

const SUGGESTIONS = [
  "Organize minha semana.",
  "Tenho tempo para estudar amanhã?",
  "Agende almoço com o João amanhã às 13h.",
  "Reserve duas horas na sexta à tarde para a apresentação.",
  "Encontre um horário livre para o dentista.",
];

export default function ChatPanel({ onAction }: { onAction?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const json = await res.json();
      const reply =
        json.reply ?? json.error ?? "Algo deu errado. Tente novamente.";
      setMessages([...next, { role: "assistant", content: reply }]);
      // If the agent changed calendar/tasks, let the dashboard refresh.
      if (json.toolCalls?.length && onAction) onAction();
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Erro de rede. Tente novamente." },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      });
    }
  }

  return (
    <section className="panel flex flex-col" style={{ height: "72vh" }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-lg font-bold">💬 Assistente</h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p style={{ color: "var(--muted)" }} className="text-sm">
              Peça para planejar, agendar, reorganizar ou revisar o seu tempo.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="btn btn-ghost text-xs"
                  onClick={() => send(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className="max-w-[85%] rounded-xl px-3 py-2 text-sm"
            style={{
              marginLeft: m.role === "user" ? "auto" : 0,
              background: m.role === "user" ? "var(--accent)" : "var(--panel-2)",
              color: m.role === "user" ? "white" : "var(--text)",
            }}
          >
            {m.role === "assistant" ? (
              <div
                className="prose-briefing"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
              />
            ) : (
              m.content
            )}
          </div>
        ))}

        {loading && (
          <div
            className="max-w-[85%] rounded-xl px-3 py-2 text-sm"
            style={{ background: "var(--panel-2)", color: "var(--muted)" }}
          >
            Trabalhando nisso…
          </div>
        )}
      </div>

      <form
        className="p-3 border-t flex gap-2"
        style={{ borderColor: "var(--border)" }}
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text)" }}
          placeholder="Converse com seu assistente…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button className="btn btn-primary" disabled={loading || !input.trim()}>
          Enviar
        </button>
      </form>
    </section>
  );
}
