"use client";

import { useEffect, useState } from "react";

interface Status {
  openai: boolean;
  supabase: boolean;
  googleOAuthConfigured: boolean;
  calendarConnected: boolean;
}

function Dot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="badge inline-flex items-center gap-1.5">
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: ok ? "var(--ok)" : "var(--danger)",
          display: "inline-block",
        }}
      />
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
    <div className="panel p-4 flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Dot ok={status.openai} label="OpenAI" />
        <Dot ok={status.supabase} label="Supabase" />
        <Dot ok={status.calendarConnected} label="Google Calendar" />
      </div>

      {!status.calendarConnected && (
        <div className="flex items-center gap-2">
          {status.googleOAuthConfigured ? (
            <a className="btn btn-primary" href="/api/auth/google">
              Connect Google Calendar
            </a>
          ) : (
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              Add GOOGLE_CLIENT_ID / SECRET to .env.local to enable Calendar
            </span>
          )}
        </div>
      )}
    </div>
  );
}
