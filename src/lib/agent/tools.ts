import type OpenAI from "openai";
import {
  createEvent,
  deleteEvent,
  findFreeSlots,
  listEvents,
  updateEvent,
} from "../google/calendar";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from "../store/tasks";
import { config } from "../config";
import type { TaskPriority, TaskStatus } from "../types";

/**
 * Tool (function) definitions exposed to the OpenAI model, plus their
 * server-side executors. Executors always resolve — errors are returned as
 * `{ error }` so the model can explain the problem to the user in plain
 * language instead of the request failing.
 */

export const toolDefinitions: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_current_datetime",
      description:
        "Get the current date and time and the user's timezone/working hours. " +
        "Call this first when a request involves relative dates like 'tomorrow' or 'Friday'.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_calendar_events",
      description: "List calendar events between two ISO 8601 timestamps.",
      parameters: {
        type: "object",
        properties: {
          timeMin: { type: "string", description: "Start of range, ISO 8601." },
          timeMax: { type: "string", description: "End of range, ISO 8601." },
        },
        required: ["timeMin", "timeMax"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_free_slots",
      description:
        "Find open time slots of at least `minMinutes`, within working hours, " +
        "accounting for existing events. Use before scheduling anything.",
      parameters: {
        type: "object",
        properties: {
          timeMin: { type: "string", description: "Search from, ISO 8601." },
          timeMax: { type: "string", description: "Search until, ISO 8601." },
          minMinutes: { type: "number", description: "Minimum slot length in minutes." },
          workDayStart: { type: "string", description: "Optional HH:mm override." },
          workDayEnd: { type: "string", description: "Optional HH:mm override." },
        },
        required: ["timeMin", "timeMax", "minMinutes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description: "Create a calendar event.",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string" },
          start: { type: "string", description: "ISO 8601 start." },
          end: { type: "string", description: "ISO 8601 end." },
          description: { type: "string" },
          location: { type: "string" },
        },
        required: ["summary", "start", "end"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_calendar_event",
      description: "Update/reschedule an existing event by id.",
      parameters: {
        type: "object",
        properties: {
          eventId: { type: "string" },
          summary: { type: "string" },
          start: { type: "string" },
          end: { type: "string" },
          description: { type: "string" },
          location: { type: "string" },
        },
        required: ["eventId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_calendar_event",
      description: "Delete an event by id.",
      parameters: {
        type: "object",
        properties: { eventId: { type: "string" } },
        required: ["eventId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: "List the user's tasks, optionally filtered by status.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["pending", "scheduled", "done", "cancelled"],
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description:
        "Create a task. Estimate `estimated_minutes` yourself if the user didn't give one.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          notes: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          estimated_minutes: { type: "number" },
          deadline: { type: "string", description: "ISO 8601 deadline." },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Update a task's fields (status, priority, estimate, deadline, etc.).",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          notes: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          estimated_minutes: { type: "number" },
          deadline: { type: "string" },
          status: {
            type: "string",
            enum: ["pending", "scheduled", "done", "cancelled"],
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_task",
      description:
        "Block time on the calendar for a task: creates an event and marks the " +
        "task 'scheduled', linking them. Pick the slot with find_free_slots first.",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string" },
          start: { type: "string", description: "ISO 8601 start." },
          end: { type: "string", description: "ISO 8601 end." },
        },
        required: ["taskId", "start", "end"],
      },
    },
  },
];

type Args = Record<string, unknown>;

export async function executeTool(name: string, args: Args): Promise<unknown> {
  try {
    switch (name) {
      case "get_current_datetime":
        return {
          now: new Date().toISOString(),
          timezone: config.app.timezone,
          workDayStart: config.app.workDayStart,
          workDayEnd: config.app.workDayEnd,
        };

      case "list_calendar_events":
        return await listEvents(String(args.timeMin), String(args.timeMax));

      case "find_free_slots":
        return await findFreeSlots({
          timeMin: String(args.timeMin),
          timeMax: String(args.timeMax),
          minMinutes: Number(args.minMinutes),
          workDayStart: args.workDayStart ? String(args.workDayStart) : undefined,
          workDayEnd: args.workDayEnd ? String(args.workDayEnd) : undefined,
        });

      case "create_calendar_event":
        return await createEvent({
          summary: String(args.summary),
          start: String(args.start),
          end: String(args.end),
          description: args.description ? String(args.description) : undefined,
          location: args.location ? String(args.location) : undefined,
        });

      case "update_calendar_event":
        return await updateEvent(String(args.eventId), {
          summary: args.summary ? String(args.summary) : undefined,
          start: args.start ? String(args.start) : undefined,
          end: args.end ? String(args.end) : undefined,
          description: args.description ? String(args.description) : undefined,
          location: args.location ? String(args.location) : undefined,
        });

      case "delete_calendar_event":
        await deleteEvent(String(args.eventId));
        return { deleted: true };

      case "list_tasks":
        return await listTasks(args.status as TaskStatus | undefined);

      case "create_task":
        return await createTask({
          title: String(args.title),
          notes: args.notes ? String(args.notes) : undefined,
          priority: args.priority as TaskPriority | undefined,
          estimated_minutes: args.estimated_minutes
            ? Number(args.estimated_minutes)
            : undefined,
          deadline: args.deadline ? String(args.deadline) : undefined,
        });

      case "update_task":
        return await updateTask(String(args.id), {
          title: args.title ? String(args.title) : undefined,
          notes: args.notes !== undefined ? String(args.notes) : undefined,
          priority: args.priority as TaskPriority | undefined,
          estimated_minutes:
            args.estimated_minutes !== undefined
              ? Number(args.estimated_minutes)
              : undefined,
          deadline: args.deadline ? String(args.deadline) : undefined,
          status: args.status as TaskStatus | undefined,
        });

      case "schedule_task": {
        const task = await getTask(String(args.taskId));
        if (!task) return { error: "Task not found." };
        const event = await createEvent({
          summary: task.title,
          start: String(args.start),
          end: String(args.end),
          description: task.notes ?? `Focus block for task: ${task.title}`,
        });
        const updated = await updateTask(task.id, {
          status: "scheduled",
          scheduled_event_id: event.id,
        });
        return { task: updated, event };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
