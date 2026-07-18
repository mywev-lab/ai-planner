import OpenAI from "openai";
import { config, isOpenAIConfigured } from "./config";

/**
 * Shared server-side OpenAI client.
 * NOTE: this module must only ever be imported from server code
 * (API routes / server components). The key must never reach the browser.
 */
let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!isOpenAIConfigured()) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local to enable the AI assistant."
    );
  }
  if (!client) {
    client = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return client;
}

export const OPENAI_MODEL = config.openai.model;
