export type Context = "home" | "phone" | "out" | "computer" | "anywhere";

export type Effort = "quick" | "medium" | "deep";

export type TaskCategory = "errand" | "call" | "someday" | "general";

export type Relationship = "family" | "friend" | "work" | "other";

export type InteractionType = "call" | "text" | "in-person" | "email" | "other";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  category: TaskCategory;
  context: Context;
  effort: Effort;
  important: boolean;
  dueDate?: string; // ISO date (yyyy-MM-dd), optional
  status: "open" | "done";
  completedAt?: string;
  createdAt: string;
  snoozedUntil?: string; // ISO date (yyyy-MM-dd); hidden from Today until this date passes
}

export interface Chore {
  id: string;
  title: string;
  notes?: string;
  recurrenceDays: number;
  lastDoneAt?: string; // ISO datetime
  createdAt: string;
  archived?: boolean;
  snoozedUntil?: string; // ISO date (yyyy-MM-dd); hidden from Today until this date passes
}

export interface Contact {
  id: string;
  name: string;
  relationship: Relationship;
  cadenceDays: number;
  lastContactAt?: string; // ISO datetime
  notes?: string;
  createdAt: string;
  archived?: boolean;
  snoozedUntil?: string; // ISO date (yyyy-MM-dd); hidden from Today until this date passes
  birthday?: string; // "MM-DD", no year — just enough to nudge ahead of it each year
}

export interface InteractionLog {
  id: string;
  contactId: string;
  date: string; // ISO datetime
  type: InteractionType;
  note?: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
  createdAt: string;
}

export interface AppSettings {
  todayBudget: number;
  hasSeenWelcome: boolean;
}

export type AppEventKind = "task-done" | "chore-done" | "contact-logged";

/** Append-only log of things tended. Powers streaks, momentum, and weekly review — never mutated or trimmed. */
export interface AppEvent {
  id: string;
  kind: AppEventKind;
  refId: string;
  label: string;
  at: string; // ISO datetime
}
