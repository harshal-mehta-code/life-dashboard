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

export interface PersistableData {
  tasks: Task[];
  chores: Chore[];
  contacts: Contact[];
  interactions: InteractionLog[];
  groceries: GroceryItem[];
  usualGroceryItems: string[];
  events: AppEvent[];
  settings: AppSettings;
}

interface AppState extends PersistableData {

  // tasks
  addTask: (input: {
    title: string;
    notes?: string;
    category?: TaskCategory;
    context?: Context;
    effort?: Effort;
    important?: boolean;
    dueDate?: string;
  }) => string;
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
  snoozeChore: (id: string, untilDateISO: string) => void;
  deleteChore: (id: string) => void;

  // contacts
  addContact: (input: {
    name: string;
    relationship: Contact["relationship"];
    cadenceDays: number;
    notes?: string;
    birthday?: string;
  }) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  logContact: (id: string, type: InteractionType, note?: string) => void;
  snoozeContact: (id: string, untilDateISO: string) => void;
  deleteContact: (id: string) => void;

  // groceries
  addGroceryItem: (name: string) => void;
  toggleGroceryItem: (id: string) => void;
  deleteGroceryItem: (id: string) => void;
  clearCheckedGroceries: () => void;
  toggleUsualGroceryItem: (name: string) => void;
  addUsualToList: (name: string) => void;

  // settings
  updateSettings: (patch: Partial<AppSettings>) => void;

  // backup
  importData: (data: PersistableData) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      tasks: seedData.tasks,
      chores: seedData.chores,
      contacts: seedData.contacts,
      interactions: seedData.interactions,
      groceries: seedData.groceries,
      usualGroceryItems: [],
      events: [],
      settings: { todayBudget: 6, hasSeenWelcome: false },

      addTask: (input) => {
        const id = uid();
        set((state) => ({
          tasks: [
            {
              id,
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
        }));
        return id;
      },

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

      snoozeChore: (id, untilDateISO) =>
        set((state) => ({
          chores: state.chores.map((c) =>
            c.id === id ? { ...c, snoozedUntil: untilDateISO } : c
          ),
        })),

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
              birthday: input.birthday,
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

      snoozeContact: (id, untilDateISO) =>
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === id ? { ...c, snoozedUntil: untilDateISO } : c
          ),
        })),

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

      toggleUsualGroceryItem: (name) =>
        set((state) => {
          const key = name.trim().toLowerCase();
          const exists = state.usualGroceryItems.some((u) => u.toLowerCase() === key);
          return {
            usualGroceryItems: exists
              ? state.usualGroceryItems.filter((u) => u.toLowerCase() !== key)
              : [...state.usualGroceryItems, name.trim()],
          };
        }),

      addUsualToList: (name) =>
        set((state) => {
          const key = name.trim().toLowerCase();
          const uncheckedMatch = state.groceries.find(
            (g) => !g.checked && g.name.toLowerCase() === key
          );
          if (uncheckedMatch) return {};
          const checkedMatch = state.groceries.find(
            (g) => g.checked && g.name.toLowerCase() === key
          );
          if (checkedMatch) {
            return {
              groceries: state.groceries.map((g) =>
                g.id === checkedMatch.id ? { ...g, checked: false } : g
              ),
            };
          }
          return {
            groceries: [
              { id: uid(), name: name.trim(), checked: false, createdAt: nowISO() },
              ...state.groceries,
            ],
          };
        }),

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      importData: (data) => set(() => data),
    }),
    {
      name: "life-dashboard-storage-v1",
    }
  )
);
