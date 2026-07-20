import {
  differenceInCalendarDays,
  addDays as fnsAddDays,
  formatISO,
  isToday as fnsIsToday,
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

export function formatCadence(days: number): string {
  if (days === 1) return "daily";
  if (days === 7) return "weekly";
  if (days === 14) return "every 2 weeks";
  if (days === 30) return "monthly";
  if (days === 90) return "every 3 months";
  if (days % 7 === 0) return `every ${days / 7} weeks`;
  return `every ${days} days`;
}
