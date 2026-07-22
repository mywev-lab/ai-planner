"use client";

import { useEffect, useState } from "react";

interface Status {
  openai: boolean;
  supabase: boolean;
  googleOAuthConfigured: boolean;
  calendarConnected: boolean;
  authConfigured: boolean;
  userEmail: string | null;
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="pill">
      <span className="dot" style={{ background: ok ? "var(--ok)" : "var(--muted-soft)" }} />
      {label}
    </span>
  );
}

export default function ConnectBar() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  if (!status) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      {status.calendarConnected ? (
        <StatusPill ok label="Calendário conectado" />
      ) : status.googleOAuthConfigured ? (
        <a className="btn btn-dark" href="/api/auth/google">
          Conectar Google Calendar
        </a>
      ) : (
        <StatusPill ok={false} label="Calendário desligado" />
      )}
      <StatusPill ok={status.supabase} label="Tarefas sincronizadas" />

      {status.authConfigured &&
        (status.userEmail ? (
          <form action="/auth/signout" method="post">
            <button className="btn btn-ghost" title={status.userEmail}>
              Sair
            </button>
          </form>
        ) : (
          <a className="btn btn-ghost" href="/login">
            Entrar
          </a>
        ))}
    </div>
  );
}
