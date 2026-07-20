import { Chore, Contact, GroceryItem, InteractionLog, Task } from "./types";
import { addDaysISO, nowISO, todayDateISO } from "./date-utils";

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

const ago = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

export const seedData: {
  tasks: Task[];
  chores: Chore[];
  contacts: Contact[];
  interactions: InteractionLog[];
  groceries: GroceryItem[];
} = {
  contacts: [
    {
      id: uid("contact"),
      name: "Mom",
      relationship: "family",
      cadenceDays: 7,
      lastContactAt: ago(9),
      createdAt: ago(400),
    },
    {
      id: uid("contact"),
      name: "Dad",
      relationship: "family",
      cadenceDays: 14,
      lastContactAt: ago(6),
      createdAt: ago(400),
    },
    {
      id: uid("contact"),
      name: "Sam",
      relationship: "friend",
      cadenceDays: 21,
      lastContactAt: ago(28),
      notes: "Owes me a text back about the trip",
      createdAt: ago(200),
    },
    {
      id: uid("contact"),
      name: "Priya",
      relationship: "friend",
      cadenceDays: 30,
      lastContactAt: ago(12),
      createdAt: ago(300),
    },
    {
      id: uid("contact"),
      name: "Uncle Raj",
      relationship: "family",
      cadenceDays: 60,
      lastContactAt: ago(70),
      createdAt: ago(500),
    },
  ],
  interactions: [],
  chores: [
    {
      id: uid("chore"),
      title: "Clean the windows",
      recurrenceDays: 90,
      lastDoneAt: ago(95),
      createdAt: ago(200),
    },
    {
      id: uid("chore"),
      title: "Water the plants",
      recurrenceDays: 7,
      lastDoneAt: ago(8),
      createdAt: ago(200),
    },
    {
      id: uid("chore"),
      title: "Change bed sheets",
      recurrenceDays: 14,
      lastDoneAt: ago(10),
      createdAt: ago(200),
    },
    {
      id: uid("chore"),
      title: "Vacuum the living room",
      recurrenceDays: 7,
      lastDoneAt: ago(4),
      createdAt: ago(200),
    },
    {
      id: uid("chore"),
      title: "Deep clean the fridge",
      recurrenceDays: 60,
      lastDoneAt: ago(50),
      createdAt: ago(200),
    },
    {
      id: uid("chore"),
      title: "Change HVAC filter",
      recurrenceDays: 90,
      lastDoneAt: ago(100),
      createdAt: ago(200),
    },
  ],
  tasks: [
    {
      id: uid("task"),
      title: "Call the dentist to reschedule cleaning",
      category: "call",
      context: "phone",
      effort: "quick",
      important: true,
      dueDate: todayDateISO(),
      status: "open",
      createdAt: ago(2),
    },
    {
      id: uid("task"),
      title: "Return library books",
      category: "errand",
      context: "out",
      effort: "quick",
      important: false,
      dueDate: addDaysISO(todayDateISO(), 1),
      status: "open",
      createdAt: ago(3),
    },
    {
      id: uid("task"),
      title: "Call the plumber about the leaky faucet",
      category: "call",
      context: "phone",
      effort: "quick",
      important: true,
      status: "open",
      createdAt: ago(1),
    },
    {
      id: uid("task"),
      title: "Drop off dry cleaning",
      category: "errand",
      context: "out",
      effort: "quick",
      important: false,
      status: "open",
      createdAt: ago(5),
    },
    {
      id: uid("task"),
      title: "Look into a weekend trip for the fall",
      category: "someday",
      context: "computer",
      effort: "deep",
      important: false,
      status: "open",
      createdAt: ago(20),
    },
  ],
  groceries: [
    { id: uid("g"), name: "Milk", checked: false, createdAt: nowISO() },
    { id: uid("g"), name: "Eggs", checked: false, createdAt: nowISO() },
    { id: uid("g"), name: "Paper towels", checked: false, createdAt: nowISO() },
    { id: uid("g"), name: "Coffee", checked: false, createdAt: nowISO() },
  ],
};
