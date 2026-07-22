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

  /** Resets the visible conversation only — nothing is deleted server-side. */
  function clear() {
    if (loading) return;
    setMessages([]);
    setInput("");
  }

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
      const reply = json.reply ?? json.error ?? "Algo deu errado. Tente novamente.";
      setMessages([...next, { role: "assistant", content: reply }]);
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
    <section className="card flex flex-col" style={{ height: "100%", minHeight: "32rem" }}>
      <div className="px-6 pt-6 pb-3 flex items-center gap-3">
        <span className="icon-badge" aria-hidden>💬</span>
        <div>
          <h2 className="serif text-2xl leading-tight">Assistente</h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Planeje, agende, revise
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost ml-auto flex items-center gap-1.5"
          onClick={clear}
          disabled={loading || messages.length === 0}
          title="Apaga apenas esta conversa — tarefas e agenda não são alteradas"
        >
          <span aria-hidden>↺</span> Limpar
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p style={{ color: "var(--muted)" }} className="text-sm">
              Peça para planejar, agendar, reorganizar ou revisar o seu tempo.
            </p>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>
                  <span style={{ color: "var(--muted-soft)" }}>›</span>&nbsp;{s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm"
            style={{
              marginLeft: m.role === "user" ? "auto" : 0,
              background: m.role === "user" ? "var(--dark)" : "var(--panel-2)",
              color: m.role === "user" ? "#f7f2e8" : "var(--text)",
              border: m.role === "user" ? "none" : "1px solid var(--border)",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
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
            className="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm"
            style={{ background: "var(--panel-2)", color: "var(--muted)", border: "1px solid var(--border)" }}
          >
            Trabalhando nisso…
          </div>
        )}
      </div>

      <form
        className="p-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
          placeholder="Mensagem para o assistente"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button className="btn btn-dark flex items-center gap-1.5" disabled={loading || !input.trim()}>
          Enviar <span aria-hidden>➤</span>
        </button>
      </form>
    </section>
  );
}
