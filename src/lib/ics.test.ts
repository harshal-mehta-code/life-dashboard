import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  buildICS,
  choreToCalendarConfig,
  contactToCalendarConfig,
  googleCalendarUrl,
  taskToCalendarConfig,
} from "./ics";
import { Chore, Contact, Task } from "./types";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-20T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("buildICS", () => {
  it("builds a well-formed single VEVENT block", () => {
    const ics = buildICS({
      uid: "tend-test-1@tend.app",
      title: "Call the dentist",
      dateISO: "2026-08-01",
    });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:tend-test-1@tend.app");
    expect(ics).toContain("DTSTART:20260801T090000");
    expect(ics).toContain("DTEND:20260801T093000");
    expect(ics).toContain("SUMMARY:Call the dentist");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("escapes commas, semicolons, and backslashes in text fields", () => {
    const ics = buildICS({
      uid: "u1",
      title: "Buy milk, eggs; cheese\\bread",
      dateISO: "2026-08-01",
    });
    expect(ics).toContain("SUMMARY:Buy milk\\, eggs\\; cheese\\\\bread");
  });

  it("includes an RRULE line only when provided", () => {
    const withRule = buildICS({ uid: "u1", title: "t", dateISO: "2026-08-01", rrule: "FREQ=DAILY;INTERVAL=7" });
    expect(withRule).toContain("RRULE:FREQ=DAILY;INTERVAL=7");

    const withoutRule = buildICS({ uid: "u2", title: "t", dateISO: "2026-08-01" });
    expect(withoutRule).not.toContain("RRULE");
  });

  it("includes a VALARM block only when alarmMinutesBefore is set", () => {
    const withAlarm = buildICS({ uid: "u1", title: "t", dateISO: "2026-08-01", alarmMinutesBefore: 30 });
    expect(withAlarm).toContain("BEGIN:VALARM");
    expect(withAlarm).toContain("TRIGGER:-PT30M");

    const withoutAlarm = buildICS({ uid: "u2", title: "t", dateISO: "2026-08-01" });
    expect(withoutAlarm).not.toContain("VALARM");
  });

  it("respects a custom duration when computing DTEND", () => {
    const ics = buildICS({ uid: "u1", title: "t", dateISO: "2026-08-01", time: "23:45", durationMinutes: 30 });
    expect(ics).toContain("DTSTART:20260801T234500");
    expect(ics).toContain("DTEND:20260802T001500");
  });
});

describe("googleCalendarUrl", () => {
  it("builds a calendar.google.com render URL with the right dates param", () => {
    const url = googleCalendarUrl({ uid: "u1", title: "Reach out", dateISO: "2026-08-01" });
    expect(url).toContain("https://calendar.google.com/calendar/render?");
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("dates=20260801T090000%2F20260801T093000");
  });
});

describe("taskToCalendarConfig", () => {
  it("uses the task's due date and a 30-minute alarm", () => {
    const task: Task = {
      id: "t1",
      title: "Pay rent",
      category: "general",
      context: "anywhere",
      effort: "quick",
      important: false,
      status: "open",
      dueDate: "2026-08-01",
      createdAt: "2026-01-01T00:00:00Z",
    };
    const config = taskToCalendarConfig(task);
    expect(config.uid).toBe("tend-task-t1@tend.app");
    expect(config.dateISO).toBe("2026-08-01");
    expect(config.alarmMinutesBefore).toBe(30);
  });
});

describe("choreToCalendarConfig", () => {
  it("exports a single next occurrence, not a recurring rule", () => {
    const chore: Chore = {
      id: "ch1",
      title: "Change filter",
      recurrenceDays: 30,
      createdAt: "2026-01-01T00:00:00Z",
    };
    const config = choreToCalendarConfig(chore, "2026-08-15");
    expect(config.dateISO).toBe("2026-08-15");
    expect(config.rrule).toBeUndefined();
  });
});

describe("contactToCalendarConfig", () => {
  it("exports a recurring RRULE anchored to the contact's cadence", () => {
    const contact: Contact = {
      id: "c1",
      name: "Sam",
      relationship: "friend",
      cadenceDays: 21,
      createdAt: "2026-01-01T00:00:00Z",
    };
    const config = contactToCalendarConfig(contact);
    expect(config.rrule).toBe("FREQ=DAILY;INTERVAL=21");
    expect(config.title).toContain("Sam");
  });
});
