import { AppEvent, Chore, Contact, Task } from "./types";
import {
  addDaysISO,
  daysSince,
  daysUntilAnnual,
  isPastOrToday,
  todayDateISO,
} from "./date-utils";

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

export interface UpcomingBirthday {
  contact: Contact;
  daysUntil: number;
}

/** Contacts with a birthday within `leadDays`, soonest first. */
export function upcomingBirthdays(contacts: Contact[], leadDays = 7): UpcomingBirthday[] {
  return contacts
    .filter((c) => !c.archived && c.birthday)
    .map((contact) => ({ contact, daysUntil: daysUntilAnnual(contact.birthday!) }))
    .filter((b): b is UpcomingBirthday => b.daysUntil !== null && b.daysUntil <= leadDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export type AgendaItem =
  | {
      kind: "contact";
      id: string;
      contact: Contact;
      score: number;
      reason?: "birthday";
      daysUntil?: number;
    }
  | { kind: "chore"; id: string; chore: Chore; score: number }
  | { kind: "task"; id: string; task: Task; score: number };

/**
 * One calm, globally-capped stream for the Today view — merges people nudges,
 * due chores, and tasks into a single prioritized list instead of three
 * separately-uncapped sections. Higher score = surfaces first.
 */
export function todayAgenda(
  contacts: Contact[],
  chores: Chore[],
  tasks: Task[],
  budget: number
): AgendaItem[] {
  const today = todayDateISO();

  const cadenceItems: AgendaItem[] = contactNudges(contacts)
    .filter((n) => !(n.contact.snoozedUntil && n.contact.snoozedUntil > today))
    .map((n) => ({
      kind: "contact" as const,
      id: n.contact.id,
      contact: n.contact,
      score: 150 + Math.min(n.overdueDays, 60),
    }));

  const cadenceIds = new Set(cadenceItems.map((n) => n.id));
  const birthdayItems: AgendaItem[] = upcomingBirthdays(contacts)
    .filter(
      (b) => !cadenceIds.has(b.contact.id) && !(b.contact.snoozedUntil && b.contact.snoozedUntil > today)
    )
    .map((b) => ({
      kind: "contact" as const,
      id: b.contact.id,
      contact: b.contact,
      reason: "birthday" as const,
      daysUntil: b.daysUntil,
      score: 250 + (7 - b.daysUntil) * 10,
    }));

  const contactItems: AgendaItem[] = [...cadenceItems, ...birthdayItems];

  const choreItems: AgendaItem[] = dueChores(chores)
    .filter((d) => !(d.chore.snoozedUntil && d.chore.snoozedUntil > today))
    .map((d) => ({
      kind: "chore" as const,
      id: d.chore.id,
      chore: d.chore,
      score: 140 + Math.min(d.overdueDays, 60),
    }));

  const openTasks = tasks.filter(
    (t) =>
      t.status === "open" &&
      t.category !== "someday" &&
      !(t.snoozedUntil && t.snoozedUntil > today)
  );

  const taskItems: AgendaItem[] = openTasks.map((t) => {
    let score: number;
    if (t.dueDate && t.dueDate <= today) {
      const overdueDays = daysSince(t.dueDate);
      score = 300 + Math.min(overdueDays, 60) * 5;
    } else if (t.important) {
      score = 100;
    } else {
      const ageDays = daysSince(t.createdAt);
      score = 10 + Math.min(ageDays, 30) * 0.2;
    }
    return { kind: "task" as const, id: t.id, task: t, score };
  });

  return [...contactItems, ...choreItems, ...taskItems]
    .sort((a, b) => b.score - a.score)
    .slice(0, budget);
}

const effortMinutes: Record<Task["effort"], number> = { quick: 5, medium: 15, deep: 40 };

/** Rough total minutes for the agenda shown — bounds the day into a finishable commitment. */
export function estimateAgendaMinutes(agenda: AgendaItem[]): number {
  return agenda.reduce((sum, item) => {
    if (item.kind === "task") return sum + effortMinutes[item.task.effort];
    if (item.kind === "chore") return sum + 10;
    return sum + 5; // contact
  }, 0);
}

/** Consecutive days (ending today or yesterday) with at least one tended event. */
export function currentStreak(events: AppEvent[]): number {
  if (events.length === 0) return 0;
  const days = new Set(events.map((e) => e.at.slice(0, 10)));
  let streak = 0;
  let cursor = todayDateISO();
  if (!days.has(cursor)) {
    const yesterday = addDaysISO(cursor, -1);
    if (!days.has(yesterday)) return 0;
    cursor = yesterday;
  }
  while (days.has(cursor)) {
    streak++;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}
