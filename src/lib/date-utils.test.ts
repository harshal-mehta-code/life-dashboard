import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  addDaysISO,
  daysSince,
  daysUntilAnnual,
  formatAnnualDate,
  formatCadence,
  gentleDueLabel,
  isPastOrToday,
  isToday,
  relativeDueLabel,
  relativeSinceLabel,
  todayDateISO,
} from "./date-utils";

const FIXED_NOW = new Date("2026-07-20T12:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("todayDateISO", () => {
  it("returns today's date in yyyy-MM-dd", () => {
    expect(todayDateISO()).toBe("2026-07-20");
  });
});

describe("addDaysISO", () => {
  it("adds positive days", () => {
    expect(addDaysISO("2026-07-20", 5)).toBe("2026-07-25");
  });

  it("subtracts with negative days", () => {
    expect(addDaysISO("2026-07-20", -1)).toBe("2026-07-19");
  });

  it("crosses a month boundary", () => {
    expect(addDaysISO("2026-07-31", 1)).toBe("2026-08-01");
  });
});

describe("daysSince", () => {
  it("is 0 for today", () => {
    expect(daysSince("2026-07-20")).toBe(0);
  });

  it("is positive for a past date", () => {
    expect(daysSince("2026-07-10")).toBe(10);
  });

  it("is negative for a future date", () => {
    expect(daysSince("2026-07-25")).toBe(-5);
  });
});

describe("isPastOrToday", () => {
  it("is true for today", () => {
    expect(isPastOrToday("2026-07-20")).toBe(true);
  });

  it("is true for a past date", () => {
    expect(isPastOrToday("2026-07-01")).toBe(true);
  });

  it("is false for a future date", () => {
    expect(isPastOrToday("2026-07-21")).toBe(false);
  });
});

describe("isToday", () => {
  it("matches today's date", () => {
    expect(isToday("2026-07-20")).toBe(true);
    expect(isToday("2026-07-19")).toBe(false);
  });
});

describe("relativeDueLabel", () => {
  it.each([
    ["2026-07-20", "today"],
    ["2026-07-21", "tomorrow"],
    ["2026-07-25", "in 5 days"],
    ["2026-07-19", "yesterday"],
    ["2026-07-15", "5 days overdue"],
  ])("formats %s as %s", (date, expected) => {
    expect(relativeDueLabel(date)).toBe(expected);
  });
});

describe("gentleDueLabel", () => {
  it("never blames — overdue collapses to a soft phrase", () => {
    expect(gentleDueLabel("2026-07-01")).toBe("when you can");
  });

  it.each([
    ["2026-07-20", "today"],
    ["2026-07-21", "tomorrow"],
    ["2026-07-25", "in 5 days"],
  ])("formats %s as %s", (date, expected) => {
    expect(gentleDueLabel(date)).toBe(expected);
  });
});

describe("relativeSinceLabel", () => {
  it("is 'never' for undefined", () => {
    expect(relativeSinceLabel(undefined)).toBe("never");
  });

  it.each([
    ["2026-07-20T00:00:00Z", "today"],
    ["2026-07-19T00:00:00Z", "yesterday"],
    ["2026-07-13T00:00:00Z", "7 days ago"],
    ["2026-06-20T00:00:00Z", "4 weeks ago"],
    ["2026-04-20T00:00:00Z", "3 months ago"],
  ])("formats %s as %s", (date, expected) => {
    expect(relativeSinceLabel(date)).toBe(expected);
  });
});

describe("daysUntilAnnual", () => {
  it("returns null for a malformed string", () => {
    expect(daysUntilAnnual("not-a-date")).toBeNull();
    expect(daysUntilAnnual("2026-07-20")).toBeNull();
  });

  it("returns 0 for today's date", () => {
    expect(daysUntilAnnual("07-20")).toBe(0);
  });

  it("counts days forward within the same year", () => {
    expect(daysUntilAnnual("07-25")).toBe(5);
  });

  it("wraps to next year once the date has passed", () => {
    // Fixed "now" is 2026-07-20, so 07-01 already passed this year.
    const days = daysUntilAnnual("07-01");
    expect(days).toBe(346); // 2027-07-01 is 346 days after 2026-07-20
  });
});

describe("formatAnnualDate", () => {
  it("formats MM-DD as a short month/day", () => {
    expect(formatAnnualDate("06-15")).toBe("Jun 15");
  });
});

describe("formatCadence", () => {
  it.each([
    [1, "daily"],
    [7, "weekly"],
    [14, "every 2 weeks"],
    [30, "monthly"],
    [90, "every 3 months"],
    [21, "every 3 weeks"],
    [5, "every 5 days"],
  ])("formats %i days as %s", (days, expected) => {
    expect(formatCadence(days)).toBe(expected);
  });
});
