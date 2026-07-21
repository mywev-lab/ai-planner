"use client";

import { useCallback, useEffect, useState } from "react";
import type { BriefingContent } from "@/lib/types";

interface BriefingData {
  generatedAt: string;
  content: BriefingContent;
  connected: { calendar: boolean; tasks: boolean };
}

function dateLabel(iso: string): string {
  const d = iso ? new Date(iso) : new Date();
  const wdLong = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const wd = wdLong.replace(/-feira$/, "");
  const rest = d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)}, ${rest}`;
}

function SectionLabel({ icon, children }: { icon: string; children: string }) {
  return (
    <div className="section-label mt-5 mb-2">
      <span aria-hidden>{icon}</span>
      {children}
    </div>
  );
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
      if (!res.ok) throw new Error(json.error || "Falha ao carregar o resumo.");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar o resumo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  const c = data?.content;

  return (
    <section className="card p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="icon-badge" aria-hidden>🌅</span>
          <div>
            <h2 className="serif text-2xl leading-tight">
              Resumo {range === "day" ? "do Dia" : "da Semana"}
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {dateLabel(data?.generatedAt ?? "")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`btn ${range === "day" ? "btn-dark" : "btn-ghost"}`}
            onClick={() => setRange("day")}
          >
            Dia
          </button>
          <button
            className={`btn ${range === "week" ? "btn-dark" : "btn-ghost"}`}
            onClick={() => setRange("week")}
          >
            Semana
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => load(range)}
            disabled={loading}
            aria-label="Atualizar"
          >
            ↻
          </button>
        </div>
      </div>

      {loading && (
        <p className="mt-5 text-sm" style={{ color: "var(--muted)" }}>
          Analisando sua agenda…
        </p>
      )}
      {error && (
        <p className="mt-5 text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      {c && !loading && (
        <>
          <SectionLabel icon="🎯">PRIORIDADES DE HOJE</SectionLabel>
          {c.priorities.length ? (
            <div className="space-y-2">
              {c.priorities.map((p, i) => (
                <div key={i} className="inset inset-accent">
                  <div className="inset-title">{p.title}</div>
                  {p.note && <div className="inset-note">{p.note}</div>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Nenhuma prioridade definida. Adicione tarefas para o assistente priorizar.
            </p>
          )}

          <SectionLabel icon="📅">PRÓXIMOS COMPROMISSOS</SectionLabel>
          {c.meetings.length ? (
            <div className="space-y-2">
              {c.meetings.map((m, i) => (
                <div key={i} className="inset">
                  <div className="inset-title">{m.title}</div>
                  {m.note && <div className="inset-note">{m.note}</div>}
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Nenhuma reunião agendada para hoje.
              </p>
              <p className="text-sm italic mt-1" style={{ color: "var(--muted-soft)" }}>
                Sugestão: use este espaço para desenvolvimento pessoal ou tarefas pendentes.
              </p>
            </>
          )}

          <SectionLabel icon="🕐">BLOCOS DE FOCO SUGERIDOS</SectionLabel>
          {c.focusBlocks.length ? (
            <div className="space-y-2">
              {c.focusBlocks.map((f, i) => (
                <div key={i} className="inset">
                  <div className="inset-title">{f.time}</div>
                  {f.note && <div className="inset-note">{f.note}</div>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Sem janelas de foco no período — sua agenda está cheia.
            </p>
          )}

          <SectionLabel icon="⚠️">TAREFAS EM RISCO</SectionLabel>
          {c.tasksAtRisk.length ? (
            <div className="space-y-2">
              {c.tasksAtRisk.map((t, i) => (
                <div
                  key={i}
                  className="inset"
                  style={{ borderLeft: "3px solid var(--border-strong)" }}
                >
                  <div className="inset-title">{t.title}</div>
                  {t.note && <div className="inset-note">{t.note}</div>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Nada em risco. Tudo sob controle ✨
            </p>
          )}

          {c.productivityTip && (
            <>
              <SectionLabel icon="💡">DICA DE PRODUTIVIDADE</SectionLabel>
              <div className="inset">
                <div className="inset-title">{c.productivityTip.title}</div>
                {c.productivityTip.note && (
                  <div className="inset-note">{c.productivityTip.note}</div>
                )}
              </div>
            </>
          )}

          <div
            className="mt-5 pt-4 flex gap-2 flex-wrap"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span className="pill">
              <span
                className="dot"
                style={{ background: data.connected.calendar ? "var(--ok)" : "var(--muted-soft)" }}
              />
              {data.connected.calendar ? "Calendário conectado" : "Calendário desligado"}
            </span>
            <span className="pill">
              <span
                className="dot"
                style={{ background: data.connected.tasks ? "var(--ok)" : "var(--muted-soft)" }}
              />
              {data.connected.tasks ? "Tarefas sincronizadas" : "Tarefas desligadas"}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
