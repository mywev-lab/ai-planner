import { redirect } from "next/navigation";
import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import { isAuthConfigured } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Entrar — AI Planner",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; detail?: string }>;
}) {
  const { next, error, detail } = await searchParams;
  const configured = isAuthConfigured();

  if (configured) {
    const user = await getCurrentUser();
    if (user) redirect(next && next.startsWith("/") ? next : "/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <span className="pill mb-4">✦ Assistente executivo do tempo</span>
          <h1 className="serif text-4xl md:text-5xl mt-3">AI Planner</h1>
          <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
            Entre para acessar a sua agenda e o seu assistente.
          </p>
        </div>

        <LoginForm
          configured={configured}
          next={next}
          initialError={error}
          errorDetail={detail}
        />

        <p className="mt-6 text-center text-xs" style={{ color: "var(--muted-soft)" }}>
          Área privada · Não indexada por mecanismos de busca
        </p>
      </div>
    </main>
  );
}
