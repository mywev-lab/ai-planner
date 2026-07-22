"use client";

import { useEffect, useState } from "react";
import { getAuthClient } from "@/lib/auth/client";
import { isAuthConfigured } from "@/lib/config";

const inputClass = "w-full rounded-2xl px-4 py-2.5 text-sm outline-none";

export default function ResetPasswordForm() {
  const configured = isAuthConfigured();
  const [ready, setReady] = useState(!configured);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // The recovery link must have produced a session before we can change the
  // password; without one, send the user back to request a fresh link.
  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getAuthClient().auth.getSession();
        if (!cancelled) setValid(Boolean(data.session));
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setError(null);
    setLoading(true);
    const { error } = await getAuthClient().auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => window.location.assign("/"), 1500);
  }

  if (!ready) return null;

  if (!configured || !valid) {
    return (
      <section className="card px-6 py-7 md:px-8">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {configured
            ? "Este link de redefinição expirou ou já foi usado. Peça um novo na tela de login."
            : "Autenticação ainda não configurada neste ambiente."}
        </p>
        <a className="btn btn-dark inline-block mt-5" href="/login">
          Ir para o login
        </a>
      </section>
    );
  }

  return (
    <section className="card px-6 py-7 md:px-8">
      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="section-label mb-1.5">Nova senha</span>
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || done}
          />
        </label>

        <label className="block">
          <span className="section-label mb-1.5">Confirmar senha</span>
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading || done}
          />
        </label>

        {error && (
          <p className="text-sm" style={{ color: "var(--danger)" }} role="alert">
            {error}
          </p>
        )}
        {done && (
          <p className="text-sm" style={{ color: "var(--ok)" }} role="status">
            Senha atualizada. Redirecionando…
          </p>
        )}

        <button className="btn btn-dark w-full mt-1" disabled={loading || done}>
          {loading ? "Salvando…" : "Salvar nova senha"}
        </button>
      </form>
    </section>
  );
}
