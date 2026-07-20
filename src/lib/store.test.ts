import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useAppStore } from "./store";

const EMPTY_BASELINE = {
  tasks: [],
  chores: [],
  contacts: [],
  interactions: [],
  groceries: [],
  usualGroceryItems: [],
  events: [],
  settings: { todayBudget: 6, hasSeenWelcome: false },
};

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState(EMPTY_BASELINE);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-20T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("tasks", () => {
  it("addTask prepends a new open task with defaults", () => {
    useAppStore.getState().addTask({ title: "Buy stamps" });
    const { tasks } = useAppStore.getState();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      title: "Buy stamps",
      status: "open",
      category: "general",
      context: "anywhere",
      effort: "medium",
      important: false,
    });
    expect(tasks[0].id).toBeTruthy();
    expect(tasks[0].createdAt).toBeTruthy();
  });

  it("toggleTaskDone marks a task done, stamps completedAt, and logs an event", () => {
    useAppStore.getState().addTask({ title: "Buy stamps" });
    const id = useAppStore.getState().tasks[0].id;
    useAppStore.getState().toggleTaskDone(id);

    const state = useAppStore.getState();
    expect(state.tasks[0].status).toBe("done");
    expect(state.tasks[0].completedAt).toBeTruthy();
    expect(state.events).toHaveLength(1);
    expect(state.events[0]).toMatchObject({ kind: "task-done", refId: id, label: "Buy stamps" });
  });

  it("toggleTaskDone back to open clears completedAt and does not add a second event", () => {
    useAppStore.getState().addTask({ title: "Buy stamps" });
    const id = useAppStore.getState().tasks[0].id;
    useAppStore.getState().toggleTaskDone(id);
    useAppStore.getState().toggleTaskDone(id);

    const state = useAppStore.getState();
    expect(state.tasks[0].status).toBe("open");
    expect(state.tasks[0].completedAt).toBeUndefined();
    expect(state.events).toHaveLength(1); // no event added for un-completing
  });

  it("snoozeTask sets snoozedUntil", () => {
    useAppStore.getState().addTask({ title: "Buy stamps" });
    const id = useAppStore.getState().tasks[0].id;
    useAppStore.getState().snoozeTask(id, "2026-07-25");
    expect(useAppStore.getState().tasks[0].snoozedUntil).toBe("2026-07-25");
  });

  it("deleteTask removes the task", () => {
    useAppStore.getState().addTask({ title: "Buy stamps" });
    const id = useAppStore.getState().tasks[0].id;
    useAppStore.getState().deleteTask(id);
    expect(useAppStore.getState().tasks).toHaveLength(0);
  });
});

describe("chores", () => {
  it("completeChore stamps lastDoneAt and logs an event", () => {
    useAppStore.getState().addChore({ title: "Water plants", recurrenceDays: 7 });
    const id = useAppStore.getState().chores[0].id;
    useAppStore.getState().completeChore(id);

    const state = useAppStore.getState();
    expect(state.chores[0].lastDoneAt).toBeTruthy();
    expect(state.events).toHaveLength(1);
    expect(state.events[0]).toMatchObject({ kind: "chore-done", refId: id, label: "Water plants" });
  });

  it("snoozeChore sets snoozedUntil", () => {
    useAppStore.getState().addChore({ title: "Water plants", recurrenceDays: 7 });
    const id = useAppStore.getState().chores[0].id;
    useAppStore.getState().snoozeChore(id, "2026-07-25");
    expect(useAppStore.getState().chores[0].snoozedUntil).toBe("2026-07-25");
  });
});

describe("contacts", () => {
  it("addContact carries through an optional birthday", () => {
    useAppStore.getState().addContact({
      name: "Sam",
      relationship: "friend",
      cadenceDays: 21,
      birthday: "06-15",
    });
    expect(useAppStore.getState().contacts[0].birthday).toBe("06-15");
  });

  it("logContact updates lastContactAt, records an interaction, and logs an event", () => {
    useAppStore.getState().addContact({ name: "Sam", relationship: "friend", cadenceDays: 21 });
    const id = useAppStore.getState().contacts[0].id;
    useAppStore.getState().logContact(id, "call", "caught up");

    const state = useAppStore.getState();
    expect(state.contacts[0].lastContactAt).toBeTruthy();
    expect(state.interactions).toHaveLength(1);
    expect(state.interactions[0]).toMatchObject({ contactId: id, type: "call", note: "caught up" });
    expect(state.events).toHaveLength(1);
    expect(state.events[0]).toMatchObject({ kind: "contact-logged", refId: id, label: "Sam" });
  });

  it("deleteContact also removes that contact's interactions", () => {
    useAppStore.getState().addContact({ name: "Sam", relationship: "friend", cadenceDays: 21 });
    const id = useAppStore.getState().contacts[0].id;
    useAppStore.getState().logContact(id, "call");
    useAppStore.getState().deleteContact(id);

    const state = useAppStore.getState();
    expect(state.contacts).toHaveLength(0);
    expect(state.interactions).toHaveLength(0);
  });
});

describe("groceries", () => {
  it("addGroceryItem prepends an unchecked item", () => {
    useAppStore.getState().addGroceryItem("Milk");
    expect(useAppStore.getState().groceries[0]).toMatchObject({ name: "Milk", checked: false });
  });

  it("toggleGroceryItem flips checked state", () => {
    useAppStore.getState().addGroceryItem("Milk");
    const id = useAppStore.getState().groceries[0].id;
    useAppStore.getState().toggleGroceryItem(id);
    expect(useAppStore.getState().groceries[0].checked).toBe(true);
    useAppStore.getState().toggleGroceryItem(id);
    expect(useAppStore.getState().groceries[0].checked).toBe(false);
  });

  it("clearCheckedGroceries only removes checked items", () => {
    useAppStore.getState().addGroceryItem("Milk");
    useAppStore.getState().addGroceryItem("Eggs");
    const [eggsId] = [useAppStore.getState().groceries[0].id];
    useAppStore.getState().toggleGroceryItem(eggsId);
    useAppStore.getState().clearCheckedGroceries();
    const { groceries } = useAppStore.getState();
    expect(groceries).toHaveLength(1);
    expect(groceries[0].name).toBe("Milk");
  });

  it("toggleUsualGroceryItem adds and removes case-insensitively", () => {
    useAppStore.getState().toggleUsualGroceryItem("Milk");
    expect(useAppStore.getState().usualGroceryItems).toEqual(["Milk"]);
    useAppStore.getState().toggleUsualGroceryItem("milk");
    expect(useAppStore.getState().usualGroceryItems).toEqual([]);
  });

  it("addUsualToList creates a new item when nothing matches", () => {
    useAppStore.getState().addUsualToList("Coffee");
    const { groceries } = useAppStore.getState();
    expect(groceries).toHaveLength(1);
    expect(groceries[0]).toMatchObject({ name: "Coffee", checked: false });
  });

  it("addUsualToList is a no-op when an unchecked match already exists", () => {
    useAppStore.getState().addGroceryItem("Coffee");
    useAppStore.getState().addUsualToList("coffee");
    expect(useAppStore.getState().groceries).toHaveLength(1);
  });

  it("addUsualToList un-checks an existing checked match instead of duplicating", () => {
    useAppStore.getState().addGroceryItem("Coffee");
    const id = useAppStore.getState().groceries[0].id;
    useAppStore.getState().toggleGroceryItem(id);
    useAppStore.getState().addUsualToList("Coffee");

    const { groceries } = useAppStore.getState();
    expect(groceries).toHaveLength(1);
    expect(groceries[0].checked).toBe(false);
  });
});

describe("importData / export shape", () => {
  it("importData replaces the persistable slice wholesale", () => {
    useAppStore.getState().addTask({ title: "Old task" });
    useAppStore.getState().importData({
      tasks: [],
      chores: [],
      contacts: [],
      interactions: [],
      groceries: [{ id: "g1", name: "Bread", checked: false, createdAt: "2026-01-01T00:00:00Z" }],
      usualGroceryItems: ["Bread"],
      events: [],
      settings: { todayBudget: 4, hasSeenWelcome: true },
    });

    const state = useAppStore.getState();
    expect(state.tasks).toHaveLength(0);
    expect(state.groceries).toHaveLength(1);
    expect(state.usualGroceryItems).toEqual(["Bread"]);
    expect(state.settings).toEqual({ todayBudget: 4, hasSeenWelcome: true });
  });

  it("importData preserves store actions (not just data)", () => {
    useAppStore.getState().importData(EMPTY_BASELINE);
    expect(typeof useAppStore.getState().addTask).toBe("function");
  });
});
