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
          "You are an executive assistant writing a concise morning briefing in " +
          "Markdown. Use these sections as headings: **Today's priorities**, " +
          "**Upcoming meetings**, **Suggested focus blocks**, **Tasks at risk**, " +
          "**Productivity tip**. Base everything strictly on the provided data. " +
          "Reference specific times. If a data source is empty, say so briefly and " +
          "give a helpful suggestion. Keep it skimmable.",
      },
      {
        role: "user",
        content:
          `Here is my ${range === "week" ? "week" : "day"} data as JSON:\n\n` +
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
