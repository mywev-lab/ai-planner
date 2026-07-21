import type OpenAI from "openai";
import { getOpenAI, OPENAI_MODEL } from "../openai";
import { config } from "../config";
import { executeTool, toolDefinitions } from "./tools";
import type { ChatMessage } from "../types";

const MAX_TOOL_ROUNDS = 8;

export function systemPrompt(): string {
  return [
    "You are an AI Executive Assistant that proactively manages the user's time.",
    "You can read and write their Google Calendar and manage a task list.",
    "",
    `The user's timezone is ${config.app.timezone}. Their default working hours are ` +
      `${config.app.workDayStart}–${config.app.workDayEnd}.`,
    "",
    "Operating principles:",
    "- Always resolve relative dates ('tomorrow', 'Friday afternoon') using " +
      "get_current_datetime before creating or querying events.",
    "- Produce ISO 8601 timestamps WITH timezone offset for the user's timezone.",
    "- Before scheduling tasks or appointments, use find_free_slots so you never " +
      "double-book. Respect priorities, deadlines, estimated duration, and focus time.",
    "- When time-blocking a to-do list, order by priority and deadline, and place " +
      "demanding work in the user's likely focus windows.",
    "- For rescheduling, propose an optimized plan (what moves where and why), not " +
      "just a blind move.",
    "- Confirm concrete actions you took with specifics (title, day, time).",
    "- If Google Calendar isn't connected or a tool returns an error, explain it " +
      "plainly and tell the user how to fix it (e.g. connect Calendar from the dashboard).",
    "- Be concise and action-oriented.",
    "- ALWAYS reply to the user in Brazilian Portuguese (pt-BR), regardless of the " +
      "language of this prompt. Use a natural, friendly, professional tone.",
  ].join("\n");
}

export interface AgentResult {
  reply: string;
  toolCalls: { name: string; args: unknown; result: unknown }[];
}

/**
 * Runs an OpenAI tool-calling loop until the model produces a final answer
 * (or MAX_TOOL_ROUNDS is hit). Returns the assistant reply plus a trace of the
 * tool calls made (useful for the UI to reflect actions taken).
 */
export async function runAgent(
  history: ChatMessage[],
  extraSystem?: string
): Promise<AgentResult> {
  const openai = getOpenAI();

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt() },
    ...(extraSystem ? [{ role: "system" as const, content: extraSystem }] : []),
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const trace: AgentResult["toolCalls"] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      tools: toolDefinitions,
      tool_choice: "auto",
      temperature: 0.3,
    });

    const choice = completion.choices[0].message;
    messages.push(choice);

    if (!choice.tool_calls || choice.tool_calls.length === 0) {
      return { reply: choice.content ?? "", toolCalls: trace };
    }

    for (const call of choice.tool_calls) {
      if (call.type !== "function") continue;
      let args: Record<string, unknown> = {};
      try {
        args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
      } catch {
        args = {};
      }
      const result = await executeTool(call.function.name, args);
      trace.push({ name: call.function.name, args, result });
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  // Ran out of tool rounds — ask the model for a final summary without tools.
  const finalCompletion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      ...messages,
      {
        role: "system",
        content:
          "Wrap up now: summarize what you did and any next step, without calling tools.",
      },
    ],
    temperature: 0.3,
  });

  return {
    reply: finalCompletion.choices[0].message.content ?? "",
    toolCalls: trace,
  };
}
