"use client";

import { useState } from "react";
import { getAuthClient } from "@/lib/auth/client";
import { rememberNext } from "@/lib/auth/nextCookie";

type Mode = "signin" | "signup" | "forgot";

const COPY: Record<Mode, { title: string; hint: string; submit: string }> = {
  signin: {
    title: "Entrar",
    hint: "Use o seu Google ou e-mail e senha.",
    submit: "Entrar",
  },
  signup: {
    title: "Criar conta",
    hint: "Escolha uma senha de pelo menos 8 caracteres.",
    submit: "Criar conta",
  },
  forgot: {
    title: "Recuperar senha",
    hint: "Enviaremos um link de redefinição para o seu e-mail.",
    submit: "Enviar link",
  },
};

const inputClass = "w-full rounded-2xl px-4 py-2.5 text-sm outline-none";

/** Distinct causes get distinct messages — a single "tente novamente" makes
 *  a misconfiguration indistinguishable from a wrong password. */
const CALLBACK_ERRORS: Record<string, string> = {
  not_allowed: "Esta conta não está na lista de e-mails autorizados (ALLOWED_EMAILS).",
  not_configured:
    "O servidor está sem NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Confira as variáveis no deploy e refaça o build.",
  oauth: "O Google ou o Supabase recusou o acesso.",
  missing_code:
    "O Supabase não devolveu o código de autorização. Normalmente a URL de callback não está na lista de Redirect URLs do Supabase.",
  exchange:
    "O código de autorização não pôde ser trocado por uma sessão. Verifique se a URL de callback do Supabase está registrada no Google Cloud Console.",
};

export default function LoginForm({
  configured,
  next,
  initialError,
  errorDetail,
}: {
  configured: boolean;
  next?: string;
  initialError?: string;
  errorDetail?: string;
}) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError
      ? [
          CALLBACK_ERRORS[initialError] ??
            `Não foi possível concluir o acesso (${initialError}).`,
          errorDetail && `Detalhe: ${errorDetail}`,
        ]
          .filter(Boolean)
          .join(" ")
      : null
  );
  const [notice, setNotice] = useState<string | null>(null);

  const target = next && next.startsWith("/") ? next : "/";

  function translate(message: string): string {
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
    if (m.includes("email not confirmed"))
      return "Confirme o seu e-mail antes de entrar — verifique a caixa de entrada.";
    if (m.includes("user already registered"))
      return "Já existe uma conta com este e-mail. Tente entrar.";
    if (m.includes("password should be at least"))
      return "A senha é muito curta — use pelo menos 8 caracteres.";
    if (m.includes("rate limit") || m.includes("too many"))
      return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
    return message;
  }

  async function signInWithGoogle() {
    if (!configured || loading) return;
    setError(null);
    setLoading(true);
    rememberNext(target);
    const { error } = await getAuthClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(translate(error.message));
      setLoading(false);
    }
    // On success the browser navigates away to Google.
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured || loading) return;
    setError(null);
    setNotice(null);
    setLoading(true);

    const supabase = getAuthClient();
    const origin = window.location.origin;

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.assign(target);
        return;
      }

      if (mode === "signup") {
        rememberNext(target);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${origin}/auth/callback` },
        });
        if (error) throw error;
        // With e-mail confirmation on, no session comes back yet.
        if (data.session) {
          window.location.assign(target);
          return;
        }
        setNotice(
          "Conta criada. Enviamos um link de confirmação para o seu e-mail."
        );
        setPassword("");
      }

      if (mode === "forgot") {
        rememberNext("/auth/reset-password", 3600);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/auth/callback`,
        });
        if (error) throw error;
        setNotice(
          "Se existir uma conta com este e-mail, o link de redefinição já está a caminho."
        );
      }
    } catch (err) {
      setError(translate(err instanceof Error ? err.message : "Algo deu errado."));
    } finally {
      setLoading(false);
    }
  }

  const copy = COPY[mode];

  return (
    <section className="card px-6 py-7 md:px-8">
      <h2 className="serif text-2xl">{copy.title}</h2>
      <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
        {copy.hint}
      </p>

      {!configured && (
        <div className="inset inset-accent mt-5">
          <p className="inset-title">Autenticação ainda não configurada</p>
          <p className="inset-note">
            Defina <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no ambiente e ative o
            provedor Google no painel do Supabase.
          </p>
        </div>
      )}

      {mode !== "forgot" && (
        <>
          <button
            type="button"
            className="btn btn-ghost w-full mt-5 flex items-center justify-center gap-2"
            onClick={signInWithGoogle}
            disabled={!configured || loading}
          >
            <GoogleMark />
            Continuar com o Google
          </button>

          <div className="flex items-center gap-3 my-5" aria-hidden>
            <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--muted-soft)" }}>
              ou
            </span>
            <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>
        </>
      )}

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="section-label mb-1.5">E-mail</span>
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            required
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!configured || loading}
          />
        </label>

        {mode !== "forgot" && (
          <label className="block">
            <span className="section-label mb-1.5">Senha</span>
            <input
              className={inputClass}
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!configured || loading}
            />
          </label>
        )}

        {error && (
          <p className="text-sm" style={{ color: "var(--danger)" }} role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-sm" style={{ color: "var(--ok)" }} role="status">
            {notice}
          </p>
        )}

        <button
          className="btn btn-dark w-full mt-1"
          disabled={!configured || loading}
        >
          {loading ? "Um momento…" : copy.submit}
        </button>
      </form>

      <div
        className="mt-5 pt-4 text-sm flex flex-wrap items-center justify-between gap-2"
        style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}
      >
        {mode === "signin" ? (
          <>
            <LinkButton onClick={() => switchTo("signup")}>
              Criar uma conta
            </LinkButton>
            <LinkButton onClick={() => switchTo("forgot")}>
              Esqueci minha senha
            </LinkButton>
          </>
        ) : (
          <LinkButton onClick={() => switchTo("signin")}>
            ‹ Voltar para o login
          </LinkButton>
        )}
      </div>
    </section>
  );

  function switchTo(m: Mode) {
    setMode(m);
    setError(null);
    setNotice(null);
  }
}

function LinkButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="underline underline-offset-2 font-semibold"
      style={{ color: "var(--accent-strong)" }}
    >
      {children}
    </button>
  );
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.8 2.6 13.6l7.8 6c1.9-5.7 7.2-10.1 13.6-10.1z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.15-3.2-.43-4.7H24v9h12.7c-.55 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.4z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.4A14.5 14.5 0 0 1 9.6 24c0-1.5.27-3 .74-4.4l-7.8-6A23.5 23.5 0 0 0 .5 24c0 3.8.9 7.4 2.5 10.5l7.4-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 47.5c6.2 0 11.5-2 15.3-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.7 2.3-6.4 0-11.7-4.3-13.6-10.1l-7.5 6.1C6.4 42.2 14.5 47.5 24 47.5z"
      />
    </svg>
  );
}
