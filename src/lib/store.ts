import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AppEvent,
  AppSettings,
  Chore,
  Contact,
  Context,
  Effort,
  GroceryItem,
  InteractionLog,
  InteractionType,
  Task,
  TaskCategory,
} from "./types";
import { nowISO } from "./date-utils";
import { seedData } from "./seed";

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

interface AppState {
  tasks: Task[];
  chores: Chore[];
  contacts: Contact[];
  interactions: InteractionLog[];
  groceries: GroceryItem[];
  events: AppEvent[];
  settings: AppSettings;

  // tasks
  addTask: (input: {
    title: string;
    notes?: string;
    category?: TaskCategory;
    context?: Context;
    effort?: Effort;
    important?: boolean;
    dueDate?: string;
  }) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTaskDone: (id: string) => void;
  snoozeTask: (id: string, untilDateISO: string) => void;
  deleteTask: (id: string) => void;

  // chores
  addChore: (input: {
    title: string;
    notes?: string;
    recurrenceDays: number;
  }) => void;
  updateChore: (id: string, patch: Partial<Chore>) => void;
  completeChore: (id: string) => void;
  deleteChore: (id: string) => void;

  // contacts
  addContact: (input: {
    name: string;
    relationship: Contact["relationship"];
    cadenceDays: number;
    notes?: string;
  }) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  logContact: (id: string, type: InteractionType, note?: string) => void;
  deleteContact: (id: string) => void;

  // groceries
  addGroceryItem: (name: string) => void;
  toggleGroceryItem: (id: string) => void;
  deleteGroceryItem: (id: string) => void;
  clearCheckedGroceries: () => void;

  // settings
  updateSettings: (patch: Partial<AppSettings>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      tasks: seedData.tasks,
      chores: seedData.chores,
      contacts: seedData.contacts,
      interactions: seedData.interactions,
      groceries: seedData.groceries,
      events: [],
      settings: { todayBudget: 6, hasSeenWelcome: false },

      addTask: (input) =>
        set((state) => ({
          tasks: [
            {
              id: uid(),
              title: input.title,
              notes: input.notes,
              category: input.category ?? "general",
              context: input.context ?? "anywhere",
              effort: input.effort ?? "medium",
              important: input.important ?? false,
              dueDate: input.dueDate,
              status: "open",
              createdAt: nowISO(),
            },
            ...state.tasks,
          ],
        })),

      updateTask: (id, patch) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      toggleTaskDone: (id) =>
        set((state) => {
          const target = state.tasks.find((t) => t.id === id);
          const completing = target?.status === "open";
          return {
            tasks: state.tasks.map((t) =>
              t.id === id
                ? t.status === "open"
                  ? { ...t, status: "done", completedAt: nowISO() }
                  : { ...t, status: "open", completedAt: undefined }
                : t
            ),
            events:
              completing && target
                ? [
                    { id: uid(), kind: "task-done", refId: id, label: target.title, at: nowISO() },
                    ...state.events,
                  ]
                : state.events,
          };
        }),

      snoozeTask: (id, untilDateISO) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, snoozedUntil: untilDateISO } : t
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

      addChore: (input) =>
        set((state) => ({
          chores: [
            {
              id: uid(),
              title: input.title,
              notes: input.notes,
              recurrenceDays: input.recurrenceDays,
              createdAt: nowISO(),
            },
            ...state.chores,
          ],
        })),

      updateChore: (id, patch) =>
        set((state) => ({
          chores: state.chores.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      completeChore: (id) =>
        set((state) => {
          const target = state.chores.find((c) => c.id === id);
          return {
            chores: state.chores.map((c) =>
              c.id === id ? { ...c, lastDoneAt: nowISO() } : c
            ),
            events: target
              ? [
                  { id: uid(), kind: "chore-done", refId: id, label: target.title, at: nowISO() },
                  ...state.events,
                ]
              : state.events,
          };
        }),

      deleteChore: (id) =>
        set((state) => ({ chores: state.chores.filter((c) => c.id !== id) })),

      addContact: (input) =>
        set((state) => ({
          contacts: [
            {
              id: uid(),
              name: input.name,
              relationship: input.relationship,
              cadenceDays: input.cadenceDays,
              notes: input.notes,
              createdAt: nowISO(),
            },
            ...state.contacts,
          ],
        })),

      updateContact: (id, patch) =>
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),

      logContact: (id, type, note) =>
        set((state) => {
          const date = nowISO();
          const target = state.contacts.find((c) => c.id === id);
          return {
            contacts: state.contacts.map((c) =>
              c.id === id ? { ...c, lastContactAt: date } : c
            ),
            interactions: [
              { id: uid(), contactId: id, date, type, note },
              ...state.interactions,
            ],
            events: target
              ? [
                  { id: uid(), kind: "contact-logged", refId: id, label: target.name, at: date },
                  ...state.events,
                ]
              : state.events,
          };
        }),

      deleteContact: (id) =>
        set((state) => ({
          contacts: state.contacts.filter((c) => c.id !== id),
          interactions: state.interactions.filter((i) => i.contactId !== id),
        })),

      addGroceryItem: (name) =>
        set((state) => ({
          groceries: [
            { id: uid(), name, checked: false, createdAt: nowISO() },
            ...state.groceries,
          ],
        })),

      toggleGroceryItem: (id) =>
        set((state) => ({
          groceries: state.groceries.map((g) =>
            g.id === id ? { ...g, checked: !g.checked } : g
          ),
        })),

      deleteGroceryItem: (id) =>
        set((state) => ({
          groceries: state.groceries.filter((g) => g.id !== id),
        })),

      clearCheckedGroceries: () =>
        set((state) => ({
          groceries: state.groceries.filter((g) => !g.checked),
        })),

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),
    }),
    {
      name: "life-dashboard-storage-v1",
    }
  )
);
