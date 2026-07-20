import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  currentStreak,
  dueChores,
  estimateAgendaMinutes,
  todayAgenda,
  upcomingBirthdays,
  upcomingChores,
} from "./selectors";
import { AppEvent, Chore, Contact, Task } from "./types";

const FIXED_NOW = new Date("2026-07-20T12:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "c1",
    name: "Mom",
    relationship: "family",
    cadenceDays: 7,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeChore(overrides: Partial<Chore> = {}): Chore {
  return {
    id: "ch1",
    title: "Water plants",
    recurrenceDays: 7,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Buy stamps",
    category: "errand",
    context: "anywhere",
    effort: "quick",
    important: false,
    status: "open",
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("dueChores / upcomingChores", () => {
  it("surfaces a chore whose recurrence has elapsed", () => {
    const chore = makeChore({ lastDoneAt: "2026-07-01T00:00:00Z", recurrenceDays: 7 });
    const due = dueChores([chore]);
    expect(due).toHaveLength(1);
    expect(due[0].chore.id).toBe("ch1");
  });

  it("excludes a chore that isn't due yet, and lists it as upcoming instead", () => {
    const chore = makeChore({ lastDoneAt: "2026-07-19T00:00:00Z", recurrenceDays: 7 });
    expect(dueChores([chore])).toHaveLength(0);
    const upcoming = upcomingChores([chore]);
    expect(upcoming).toHaveLength(1);
  });

  it("excludes archived chores", () => {
    const chore = makeChore({ lastDoneAt: "2026-07-01T00:00:00Z", archived: true });
    expect(dueChores([chore])).toHaveLength(0);
  });
});

describe("upcomingBirthdays", () => {
  it("includes a contact with a birthday inside the lead window", () => {
    const contact = makeContact({ birthday: "07-25" });
    const result = upcomingBirthdays([contact], 7);
    expect(result).toHaveLength(1);
    expect(result[0].daysUntil).toBe(5);
  });

  it("excludes a contact whose birthday is outside the lead window", () => {
    const contact = makeContact({ birthday: "09-01" });
    expect(upcomingBirthdays([contact], 7)).toHaveLength(0);
  });

  it("excludes archived contacts and contacts without a birthday", () => {
    const archived = makeContact({ id: "a", birthday: "07-21", archived: true });
    const noBirthday = makeContact({ id: "b" });
    expect(upcomingBirthdays([archived, noBirthday], 7)).toHaveLength(0);
  });
});

describe("todayAgenda", () => {
  it("merges contacts, chores, and tasks and caps to the budget", () => {
    const contact = makeContact({ lastContactAt: "2026-07-01T00:00:00Z", cadenceDays: 7 });
    const chore = makeChore({ lastDoneAt: "2026-07-01T00:00:00Z", recurrenceDays: 7 });
    const task = makeTask({ important: true });
    const agenda = todayAgenda([contact], [chore], [task], 2);
    expect(agenda).toHaveLength(2);
  });

  it("excludes items snoozed into the future", () => {
    const contact = makeContact({
      lastContactAt: "2026-07-01T00:00:00Z",
      cadenceDays: 7,
      snoozedUntil: "2026-07-21",
    });
    const agenda = todayAgenda([contact], [], [], 10);
    expect(agenda).toHaveLength(0);
  });

  it("includes an item snoozed into the past (snooze has expired)", () => {
    const contact = makeContact({
      lastContactAt: "2026-07-01T00:00:00Z",
      cadenceDays: 7,
      snoozedUntil: "2026-07-19",
    });
    const agenda = todayAgenda([contact], [], [], 10);
    expect(agenda).toHaveLength(1);
  });

  it("deduplicates a contact that is both cadence-due and has an upcoming birthday", () => {
    const contact = makeContact({
      lastContactAt: "2026-07-01T00:00:00Z",
      cadenceDays: 7,
      birthday: "07-22",
    });
    const agenda = todayAgenda([contact], [], [], 10);
    expect(agenda).toHaveLength(1);
    expect(agenda[0].kind).toBe("contact");
  });

  it("surfaces an overdue task ahead of a merely-important one", () => {
    const overdue = makeTask({ id: "overdue", dueDate: "2026-07-01", important: false });
    const important = makeTask({ id: "important", important: true });
    const agenda = todayAgenda([], [], [overdue, important], 10);
    expect(agenda[0].id).toBe("overdue");
  });

  it("excludes tasks in the someday category and already-done tasks", () => {
    const someday = makeTask({ id: "someday", category: "someday", important: true });
    const done = makeTask({ id: "done", status: "done", important: true });
    const agenda = todayAgenda([], [], [someday, done], 10);
    expect(agenda).toHaveLength(0);
  });
});

describe("estimateAgendaMinutes", () => {
  it("sums effort-based minutes across item kinds", () => {
    const agenda = [
      { kind: "task" as const, id: "1", task: makeTask({ effort: "deep" }), score: 1 },
      { kind: "chore" as const, id: "2", chore: makeChore(), score: 1 },
      { kind: "contact" as const, id: "3", contact: makeContact(), score: 1 },
    ];
    expect(estimateAgendaMinutes(agenda)).toBe(40 + 10 + 5);
  });
});

describe("currentStreak", () => {
  function event(at: string): AppEvent {
    return { id: at, kind: "task-done", refId: "x", label: "x", at };
  }

  it("is 0 with no events", () => {
    expect(currentStreak([])).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const events = [
      event("2026-07-20T09:00:00Z"),
      event("2026-07-19T09:00:00Z"),
      event("2026-07-18T09:00:00Z"),
    ];
    expect(currentStreak(events)).toBe(3);
  });

  it("still counts a streak that ended yesterday (today not yet tended)", () => {
    const events = [event("2026-07-19T09:00:00Z"), event("2026-07-18T09:00:00Z")];
    expect(currentStreak(events)).toBe(2);
  });

  it("is 0 once the streak has a gap before yesterday", () => {
    const events = [event("2026-07-17T09:00:00Z")];
    expect(currentStreak(events)).toBe(0);
  });
});
