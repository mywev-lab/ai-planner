import type { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Nova senha — AI Planner",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <h1 className="serif text-4xl mt-3">Definir nova senha</h1>
          <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
            Escolha uma senha nova para a sua conta.
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
