export type TaskStatus = "pending" | "scheduled" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_minutes: number | null;
  deadline: string | null; // ISO timestamp
  scheduled_event_id: string | null; // linked Google Calendar event id
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string | null;
  start: string; // ISO
  end: string; // ISO
  location?: string | null;
  htmlLink?: string | null;
}

export interface FreeSlot {
  start: string; // ISO
  end: string; // ISO
  minutes: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface BriefingItem {
  title: string;
  note?: string;
}

export interface FocusBlockItem {
  time: string;
  note?: string;
}

export interface BriefingContent {
  priorities: BriefingItem[];
  meetings: BriefingItem[];
  focusBlocks: FocusBlockItem[];
  tasksAtRisk: BriefingItem[];
  productivityTip: BriefingItem | null;
}
