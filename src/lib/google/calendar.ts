import { google } from "googleapis";
import { getAuthorizedClient } from "./client";
import { config } from "../config";
import type { CalendarEvent, FreeSlot } from "../types";

const CALENDAR_ID = "primary";

async function calendarApi() {
  const auth = await getAuthorizedClient();
  return google.calendar({ version: "v3", auth });
}

function toEvent(e: {
  id?: string | null;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  htmlLink?: string | null;
  start?: { dateTime?: string | null; date?: string | null } | null;
  end?: { dateTime?: string | null; date?: string | null } | null;
}): CalendarEvent {
  return {
    id: e.id ?? "",
    summary: e.summary ?? "(no title)",
    description: e.description ?? null,
    location: e.location ?? null,
    htmlLink: e.htmlLink ?? null,
    start: e.start?.dateTime ?? e.start?.date ?? "",
    end: e.end?.dateTime ?? e.end?.date ?? "",
  };
}

export async function listEvents(
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const calendar = await calendarApi();
  const res = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });
  return (res.data.items ?? []).map(toEvent);
}

export async function createEvent(input: {
  summary: string;
  start: string; // ISO
  end: string; // ISO
  description?: string;
  location?: string;
}): Promise<CalendarEvent> {
  const calendar = await calendarApi();
  const res = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: { dateTime: input.start, timeZone: config.app.timezone },
      end: { dateTime: input.end, timeZone: config.app.timezone },
    },
  });
  return toEvent(res.data);
}

export async function updateEvent(
  eventId: string,
  changes: {
    summary?: string;
    start?: string;
    end?: string;
    description?: string;
    location?: string;
  }
): Promise<CalendarEvent> {
  const calendar = await calendarApi();
  const patch: Record<string, unknown> = {};
  if (changes.summary !== undefined) patch.summary = changes.summary;
  if (changes.description !== undefined) patch.description = changes.description;
  if (changes.location !== undefined) patch.location = changes.location;
  if (changes.start !== undefined)
    patch.start = { dateTime: changes.start, timeZone: config.app.timezone };
  if (changes.end !== undefined)
    patch.end = { dateTime: changes.end, timeZone: config.app.timezone };

  const res = await calendar.events.patch({
    calendarId: CALENDAR_ID,
    eventId,
    requestBody: patch,
  });
  return toEvent(res.data);
}

export async function deleteEvent(eventId: string): Promise<void> {
  const calendar = await calendarApi();
  await calendar.events.delete({ calendarId: CALENDAR_ID, eventId });
}

/**
 * Find free slots of at least `minMinutes` within [timeMin, timeMax],
 * constrained to daily working hours (HH:mm local strings). Uses the
 * Calendar freebusy API so it accounts for all existing events.
 */
export async function findFreeSlots(input: {
  timeMin: string;
  timeMax: string;
  minMinutes: number;
  workDayStart?: string;
  workDayEnd?: string;
}): Promise<FreeSlot[]> {
  const calendar = await calendarApi();
  const fb = await calendar.freebusy.query({
    requestBody: {
      timeMin: input.timeMin,
      timeMax: input.timeMax,
      timeZone: config.app.timezone,
      items: [{ id: CALENDAR_ID }],
    },
  });

  const busy = (fb.data.calendars?.[CALENDAR_ID]?.busy ?? []).map((b) => ({
    start: new Date(b.start ?? "").getTime(),
    end: new Date(b.end ?? "").getTime(),
  }));

  const dayStart = input.workDayStart || config.app.workDayStart;
  const dayEnd = input.workDayEnd || config.app.workDayEnd;
  const [dsH, dsM] = dayStart.split(":").map(Number);
  const [deH, deM] = dayEnd.split(":").map(Number);

  const rangeStart = new Date(input.timeMin);
  const rangeEnd = new Date(input.timeMax);
  const slots: FreeSlot[] = [];
  const minMs = input.minMinutes * 60_000;

  // Walk day by day, subtract busy intervals from the working window.
  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= rangeEnd) {
    const windowStart = new Date(cursor);
    windowStart.setHours(dsH, dsM, 0, 0);
    const windowEnd = new Date(cursor);
    windowEnd.setHours(deH, deM, 0, 0);

    let ws = Math.max(windowStart.getTime(), rangeStart.getTime());
    const we = Math.min(windowEnd.getTime(), rangeEnd.getTime());

    if (ws < we) {
      const dayBusy = busy
        .filter((b) => b.end > ws && b.start < we)
        .sort((a, b) => a.start - b.start);

      let pointer = ws;
      for (const b of dayBusy) {
        if (b.start - pointer >= minMs) {
          slots.push(makeSlot(pointer, b.start));
        }
        pointer = Math.max(pointer, b.end);
      }
      if (we - pointer >= minMs) {
        slots.push(makeSlot(pointer, we));
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return slots;
}

function makeSlot(startMs: number, endMs: number): FreeSlot {
  return {
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString(),
    minutes: Math.round((endMs - startMs) / 60_000),
  };
}
