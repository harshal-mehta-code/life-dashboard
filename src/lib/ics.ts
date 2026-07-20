import { Chore, Contact, Task } from "./types";
import { addDaysISO, formatCadence } from "./date-utils";

export interface CalendarEventConfig {
  uid: string;
  title: string;
  description?: string;
  /** yyyy-MM-dd */
  dateISO: string;
  /** 24h "HH:mm", defaults to a gentle 9am */
  time?: string;
  durationMinutes?: number;
  /** e.g. "FREQ=DAILY;INTERVAL=7" — omitted for one-off events */
  rrule?: string;
  alarmMinutesBefore?: number;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toICSDateTime(dateISO: string, time: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`;
}

function addMinutes(dateISO: string, time: string, minutes: number): { dateISO: string; time: string } {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh, mm + minutes);
  return {
    dateISO: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
    time: `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
  };
}

function escapeICS(text: string): string {
  return text.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
}

/** Builds a single-event .ics file (RFC 5545). Timestamps are in the device's local time, floating (no TZID) for simplicity. */
export function buildICS(config: CalendarEventConfig): string {
  const time = config.time ?? "09:00";
  const duration = config.durationMinutes ?? 30;
  const start = toICSDateTime(config.dateISO, time);
  const endParts = addMinutes(config.dateISO, time, duration);
  const end = toICSDateTime(endParts.dateISO, endParts.time);
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(
    now.getUTCHours()
  )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tend//tend.app//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${config.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICS(config.title)}`,
  ];
  if (config.description) {
    lines.push(`DESCRIPTION:${escapeICS(config.description)}`);
  }
  if (config.rrule) {
    lines.push(`RRULE:${config.rrule}`);
  }
  if (config.alarmMinutesBefore != null) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeICS(config.title)}`,
      `TRIGGER:-PT${config.alarmMinutesBefore}M`,
      "END:VALARM"
    );
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

/** Triggers a client-side download of the .ics file — tapping it on iOS/Android opens the native "add to calendar" sheet. */
export function downloadICS(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** One-tap "Add to Google Calendar" link — no OAuth needed, handy on desktop/Android. */
export function googleCalendarUrl(config: CalendarEventConfig): string {
  const time = config.time ?? "09:00";
  const duration = config.durationMinutes ?? 30;
  const start = toICSDateTime(config.dateISO, time);
  const endParts = addMinutes(config.dateISO, time, duration);
  const end = toICSDateTime(endParts.dateISO, endParts.time);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: config.title,
    dates: `${start}/${end}`,
  });
  if (config.description) params.set("details", config.description);
  if (config.rrule) params.set("recur", `RRULE:${config.rrule}`);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function taskToCalendarConfig(task: Task): CalendarEventConfig {
  return {
    uid: `tend-task-${task.id}@tend.app`,
    title: task.title,
    description: task.notes,
    dateISO: task.dueDate ?? new Date().toISOString().slice(0, 10),
    alarmMinutesBefore: 30,
  };
}

/**
 * Chores are completion-anchored (they reschedule from whenever you actually
 * finish them), not calendar-fixed — so we export only the next single
 * occurrence rather than an RRULE, which would drift from the app the moment
 * you do it early or late.
 */
export function choreToCalendarConfig(chore: Chore, nextDueISO: string): CalendarEventConfig {
  return {
    uid: `tend-chore-${chore.id}-${nextDueISO}@tend.app`,
    title: chore.title,
    description: `Reschedules automatically in Tend when you mark it done — this is just the next reminder.`,
    dateISO: nextDueISO,
    alarmMinutesBefore: 60,
  };
}

/** Relationship cadences are genuinely periodic, so a recurring RRULE reminder is appropriate. */
export function contactToCalendarConfig(contact: Contact): CalendarEventConfig {
  return {
    uid: `tend-contact-${contact.id}@tend.app`,
    title: `Reach out to ${contact.name}`,
    description: `A ${formatCadence(contact.cadenceDays)} nudge from Tend to stay in touch.`,
    dateISO: addDaysISO(new Date().toISOString().slice(0, 10), 1),
    rrule: `FREQ=DAILY;INTERVAL=${contact.cadenceDays}`,
    alarmMinutesBefore: 30,
  };
}
