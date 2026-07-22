import type { MetadataRoute } from "next";

/**
 * Crawlers that identify themselves as AI trainers / answer engines. Listing
 * them explicitly matters because several of them ignore a bare `User-agent: *`
 * disallow, or treat "search" and "training" as separate opt-outs.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "Google-Extended",
  "GoogleOther",
  "Applebot-Extended",
  "PerplexityBot",
  "Perplexity-User",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "FacebookBot",
  "cohere-ai",
  "cohere-training-data-crawler",
  "Diffbot",
  "omgili",
  "omgilibot",
  "ImagesiftBot",
  "YouBot",
  "Timpibot",
  "AI2Bot",
  "Kangaroo Bot",
  "PanguBot",
  "Webzio-Extended",
  "DuckAssistBot",
  "MistralAI-User",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Nothing at all should be indexed — this is a private tool.
      { userAgent: "*", disallow: "/" },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
  };
}
