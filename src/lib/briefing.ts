import { getOpenAI, OPENAI_MODEL } from "./openai";
import { config } from "./config";
import { findFreeSlots, listEvents } from "./google/calendar";
import { isCalendarConnected } from "./google/client";
import { listTasks } from "./store/tasks";
import { isSupabaseConfigured } from "./supabase";
import type { BriefingContent } from "./types";

export interface Briefing {
  generatedAt: string;
  content: BriefingContent;
  connected: { calendar: boolean; tasks: boolean };
}

const EMPTY: BriefingContent = {
  priorities: [],
  meetings: [],
  focusBlocks: [],
  tasksAtRisk: [],
  productivityTip: null,
};

/**
 * Builds a proactive daily/weekly briefing as STRUCTURED sections
 * (priorities, meetings, focus blocks, tasks at risk, productivity tip),
 * so the UI can render the editorial layout. Degrades gracefully when
 * Calendar or the tasks DB isn't wired up yet.
 */
export async function generateBriefing(range: "day" | "week" = "day"): Promise<Briefing> {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + (range === "week" ? 7 : 1));

  const calendarOn = await isCalendarConnected();
  const tasksOn = isSupabaseConfigured();

  const events = calendarOn
    ? await listEvents(now.toISOString(), end.toISOString()).catch(() => [])
    : [];
  const tasks = tasksOn ? await listTasks().catch(() => []) : [];
  const freeSlots = calendarOn
    ? await findFreeSlots({
        timeMin: now.toISOString(),
        timeMax: end.toISOString(),
        minMinutes: 60,
      }).catch(() => [])
    : [];

  const context = {
    now: now.toISOString(),
    range,
    timezone: config.app.timezone,
    workingHours: `${config.app.workDayStart}-${config.app.workDayEnd}`,
    events,
    tasks,
    freeSlots: freeSlots.slice(0, 12),
  };

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Você é um assistente executivo que escreve um resumo matinal, SEMPRE em " +
          "português do Brasil (pt-BR). Responda APENAS com um objeto JSON válido com " +
          "exatamente estas chaves:\n" +
          "{\n" +
          '  "priorities":   [{"title": string, "note": string}],   // prioridades de hoje\n' +
          '  "meetings":     [{"title": string, "note": string}],   // próximos compromissos (vazio se não houver)\n' +
          '  "focusBlocks":  [{"time": string, "note": string}],    // blocos de foco sugeridos, time no formato "13:30 — 15:00"\n' +
          '  "tasksAtRisk":  [{"title": string, "note": string}],   // tarefas em risco\n' +
          '  "productivityTip": {"title": string, "note": string}   // uma dica de produtividade\n' +
          "}\n" +
          "Baseie tudo estritamente nos dados fornecidos. Cite horários específicos. " +
          "Use no máximo 3 itens por lista. 'note' deve ser uma frase curta. Se uma " +
          "lista não tiver dados, retorne uma lista vazia []. Não inclua texto fora do JSON.",
      },
      {
        role: "user",
        content:
          `Dados ${range === "week" ? "da minha semana" : "do meu dia"} em JSON:\n\n` +
          "```json\n" +
          JSON.stringify(context, null, 2) +
          "\n```",
      },
    ],
  });

  let content: BriefingContent = EMPTY;
  try {
    const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
    content = {
      priorities: Array.isArray(parsed.priorities) ? parsed.priorities : [],
      meetings: Array.isArray(parsed.meetings) ? parsed.meetings : [],
      focusBlocks: Array.isArray(parsed.focusBlocks) ? parsed.focusBlocks : [],
      tasksAtRisk: Array.isArray(parsed.tasksAtRisk) ? parsed.tasksAtRisk : [],
      productivityTip:
        parsed.productivityTip && parsed.productivityTip.title
          ? parsed.productivityTip
          : null,
    };
  } catch {
    content = EMPTY;
  }

  return {
    generatedAt: now.toISOString(),
    content,
    connected: { calendar: calendarOn, tasks: tasksOn },
  };
}
