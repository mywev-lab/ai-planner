import { getOpenAI, OPENAI_MODEL } from "./openai";
import { config } from "./config";
import { findFreeSlots, listEvents } from "./google/calendar";
import { isCalendarConnected } from "./google/client";
import { listTasks } from "./store/tasks";
import { isSupabaseConfigured } from "./supabase";

export interface Briefing {
  generatedAt: string;
  markdown: string;
  connected: { calendar: boolean; tasks: boolean };
}

/**
 * Builds a proactive daily/weekly briefing: today's priorities, upcoming
 * meetings, suggested focus blocks, tasks at risk, and a productivity tip.
 * Degrades gracefully when Calendar or the tasks DB isn't wired up yet.
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
    messages: [
      {
        role: "system",
        content:
          "Você é um assistente executivo escrevendo um resumo matinal conciso em " +
          "Markdown, SEMPRE em português do Brasil (pt-BR). Use estas seções como " +
          "títulos: **Prioridades de hoje**, **Próximos compromissos**, " +
          "**Blocos de foco sugeridos**, **Tarefas em risco**, **Dica de " +
          "produtividade**. Baseie tudo estritamente nos dados fornecidos. " +
          "Cite horários específicos. Se alguma fonte de dados estiver vazia, diga " +
          "isso brevemente e dê uma sugestão útil. Mantenha o texto fácil de escanear.",
      },
      {
        role: "user",
        content:
          `Aqui estão os dados ${range === "week" ? "da minha semana" : "do meu dia"} em JSON:\n\n` +
          "```json\n" +
          JSON.stringify(context, null, 2) +
          "\n```",
      },
    ],
  });

  return {
    generatedAt: now.toISOString(),
    markdown: completion.choices[0].message.content ?? "",
    connected: { calendar: calendarOn, tasks: tasksOn },
  };
}
