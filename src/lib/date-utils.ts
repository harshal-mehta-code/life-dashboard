import {
  differenceInCalendarDays,
  addDays as fnsAddDays,
  formatISO,
  isToday as fnsIsToday,
  nextSaturday,
  parseISO,
} from "date-fns";

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayDateISO(): string {
  return formatISO(new Date(), { representation: "date" });
}

export function addDaysISO(dateISO: string, days: number): string {
  return formatISO(fnsAddDays(parseISO(dateISO), days), {
    representation: "date",
  });
}

export function daysSince(dateISO: string): number {
  return differenceInCalendarDays(new Date(), parseISO(dateISO));
}

export function isPastOrToday(dateISO: string): boolean {
  return differenceInCalendarDays(parseISO(dateISO), new Date()) <= 0;
}

export function isToday(dateISO: string): boolean {
  return fnsIsToday(parseISO(dateISO));
}

/** Human relative label for a due/anchor date, e.g. "3 days overdue", "due today", "in 5 days" */
export function relativeDueLabel(dateISO: string): string {
  const diff = differenceInCalendarDays(parseISO(dateISO), new Date());
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff > 1) return `in ${diff} days`;
  if (diff === -1) return "yesterday";
  return `${Math.abs(diff)} days overdue`;
}

/** For relationship cadence: "3 days ago", "today", "2 weeks ago" */
export function relativeSinceLabel(dateISO: string | undefined): string {
  if (!dateISO) return "never";
  const d = daysSince(dateISO);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 14) return `${d} days ago`;
  if (d < 60) return `${Math.round(d / 7)} weeks ago`;
  return `${Math.round(d / 30)} months ago`;
}

/** Calm, guilt-free phrasing for a due/anchor date — used on the Today view instead of "N days overdue". */
export function gentleDueLabel(dateISO: string): string {
  const diff = differenceInCalendarDays(parseISO(dateISO), new Date());
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff > 1) return `in ${diff} days`;
  return "when you can";
}

/** Days from today until the next occurrence of an annual "MM-DD" date (birthdays, etc). 0 = today. */
export function daysUntilAnnual(mmdd: string): number | null {
  const match = /^(\d{2})-(\d{2})$/.exec(mmdd);
  if (!match) return null;
  const [, mm, dd] = match;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(today.getFullYear(), Number(mm) - 1, Number(dd));
  if (next < today) {
    next = new Date(today.getFullYear() + 1, Number(mm) - 1, Number(dd));
  }
  return differenceInCalendarDays(next, today);
}

/** "Jun 15" from an "MM-DD" string, for display. */
export function formatAnnualDate(mmdd: string): string {
  const [mm, dd] = mmdd.split("-").map(Number);
  return new Date(2000, mm - 1, dd).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** The coming Saturday — today itself if today is already Sat/Sun. Used by the "This weekend" reschedule preset. */
export function thisWeekendISO(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 6 = Sat
  if (day === 6 || day === 0) return todayDateISO();
  return formatISO(nextSaturday(now), { representation: "date" });
}

export function formatCadence(days: number): string {
  if (days === 1) return "daily";
  if (days === 7) return "weekly";
  if (days === 14) return "every 2 weeks";
  if (days === 30) return "monthly";
  if (days === 90) return "every 3 months";
  if (days % 7 === 0) return `every ${days / 7} weeks`;
  return `every ${days} days`;
}
