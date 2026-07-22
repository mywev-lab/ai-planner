/**
 * Declared usage policy served at /ai.txt and /llms.txt.
 *
 * These files are a convention, not an enforcement mechanism — a crawler that
 * ignores robots.txt will ignore this too. The real protection for this app is
 * that every page sits behind authentication; this simply removes any ambiguity
 * about consent for the well-behaved crawlers.
 */
export const AI_POLICY_TEXT = `# AI Planner — política de uso automatizado / automated use policy
#
# Este é um aplicativo privado. Todo o conteúdo está atrás de autenticação.
# This is a private application. All content sits behind authentication.

User-agent: *
Disallow: /

# Nenhuma permissão é concedida para:
# No permission is granted for:
#   - treinamento de modelos / model training
#   - geração aumentada por recuperação (RAG) / retrieval-augmented generation
#   - indexação em mecanismos de busca ou de resposta / search or answer-engine indexing
#   - citação, resumo ou menção em respostas de IA / citation, summarisation or mention in AI output
#   - coleta de dados para conjuntos de dados / dataset collection

Train: no
Search: no
Index: no
Summarize: no
Cite: no
`;

export function aiPolicyResponse(body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag":
        "noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
