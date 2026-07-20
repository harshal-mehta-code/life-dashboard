import { Chore, Contact, Task } from "./types";
import { addDaysISO, daysSince, isPastOrToday, todayDateISO } from "./date-utils";

export interface ContactNudge {
  contact: Contact;
  overdueDays: number; // positive = overdue, 0 = due today, negative = not due yet
}

export function contactNudges(contacts: Contact[]): ContactNudge[] {
  return contacts
    .filter((c) => !c.archived)
    .map((contact) => {
      const anchor = contact.lastContactAt ?? contact.createdAt;
      const since = daysSince(anchor);
      return { contact, overdueDays: since - contact.cadenceDays };
    })
    .filter((n) => n.overdueDays >= 0)
    .sort((a, b) => b.overdueDays - a.overdueDays);
}

export interface DueChore {
  chore: Chore;
  nextDueISO: string;
  overdueDays: number;
}

export function dueChores(chores: Chore[]): DueChore[] {
  return chores
    .filter((c) => !c.archived)
    .map((chore) => {
      const anchor = chore.lastDoneAt ?? chore.createdAt;
      const nextDueISO = addDaysISO(anchor.slice(0, 10), chore.recurrenceDays);
      return {
        chore,
        nextDueISO,
        overdueDays: daysSince(nextDueISO),
      };
    })
    .filter((d) => isPastOrToday(d.nextDueISO))
    .sort((a, b) => b.overdueDays - a.overdueDays);
}

export function upcomingChores(chores: Chore[], withinDays = 7): DueChore[] {
  const today = todayDateISO();
  const dueIds = new Set(dueChores(chores).map((d) => d.chore.id));
  return chores
    .filter((c) => !c.archived && !dueIds.has(c.id))
    .map((chore) => {
      const anchor = chore.lastDoneAt ?? chore.createdAt;
      const nextDueISO = addDaysISO(anchor.slice(0, 10), chore.recurrenceDays);
      return { chore, nextDueISO, overdueDays: daysSince(nextDueISO) };
    })
    .filter((d) => {
      const diff = -d.overdueDays;
      return diff >= 0 && diff <= withinDays;
    })
    .sort((a, b) => a.overdueDays - b.overdueDays)
    .map((d) => d);
}

/** Pick a bounded, prioritized set of one-off tasks for the Today view. */
export function todayTasks(tasks: Task[], budget: number): Task[] {
  const open = tasks.filter((t) => t.status === "open" && t.category !== "someday");
  const today = todayDateISO();

  const overdueOrToday = open.filter((t) => t.dueDate && t.dueDate <= today);
  const important = open.filter((t) => t.important && !(t.dueDate && t.dueDate <= today));
  const rest = open.filter(
    (t) => !t.important && !(t.dueDate && t.dueDate <= today)
  );

  overdueOrToday.sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1));
  important.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  rest.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return [...overdueOrToday, ...important, ...rest].slice(0, budget);
}
