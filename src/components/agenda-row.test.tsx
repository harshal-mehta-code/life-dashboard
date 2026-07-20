import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgendaRow } from "./agenda-row";
import { useAppStore } from "@/lib/store";
import { Chore, Contact, Task } from "@/lib/types";

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({
    tasks: [],
    chores: [],
    contacts: [],
    interactions: [],
    groceries: [],
    usualGroceryItems: [],
    events: [],
    settings: { todayBudget: 6, hasSeenWelcome: false },
  });
  vi.setSystemTime(new Date("2026-07-20T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AgendaRow — contact", () => {
  const contact: Contact = {
    id: "c1",
    name: "Sam",
    relationship: "friend",
    cadenceDays: 21,
    createdAt: "2026-01-01T00:00:00Z",
  };

  it("logs a generic interaction via the primary 'Reached out' action", async () => {
    useAppStore.setState({ contacts: [contact] });
    const user = userEvent.setup();
    render(<AgendaRow item={{ kind: "contact", id: contact.id, contact, score: 1 }} />);

    await user.click(screen.getByRole("button", { name: /Reached out/ }));

    const state = useAppStore.getState();
    expect(state.interactions).toHaveLength(1);
    expect(state.interactions[0].type).toBe("other");
    expect(state.contacts[0].lastContactAt).toBeTruthy();
  });

  it("shows birthday framing instead of last-touched-base when reason is birthday", () => {
    render(
      <AgendaRow
        item={{ kind: "contact", id: contact.id, contact, score: 1, reason: "birthday", daysUntil: 3 }}
      />
    );
    expect(screen.getByText(/Birthday in 3 days/)).toBeInTheDocument();
  });
});

describe("AgendaRow — chore", () => {
  const chore: Chore = {
    id: "ch1",
    title: "Water plants",
    recurrenceDays: 7,
    createdAt: "2026-01-01T00:00:00Z",
  };

  it("completes the chore via the primary 'Done' action", async () => {
    useAppStore.setState({ chores: [chore] });
    const user = userEvent.setup();
    render(<AgendaRow item={{ kind: "chore", id: chore.id, chore, score: 1 }} />);

    await user.click(screen.getByRole("button", { name: /Done/ }));

    const state = useAppStore.getState();
    expect(state.chores[0].lastDoneAt).toBeTruthy();
    expect(state.events).toHaveLength(1);
  });
});

describe("AgendaRow — task", () => {
  const task: Task = {
    id: "t1",
    title: "Buy stamps",
    category: "errand",
    context: "anywhere",
    effort: "quick",
    important: false,
    status: "open",
    createdAt: "2026-01-01T00:00:00Z",
  };

  it("toggles the task done via the checkbox", async () => {
    useAppStore.setState({ tasks: [task] });
    const user = userEvent.setup();
    render(<AgendaRow item={{ kind: "task", id: task.id, task, score: 1 }} />);

    await user.click(screen.getByRole("checkbox"));

    expect(useAppStore.getState().tasks[0].status).toBe("done");
  });

  it("shows a gentle due label instead of a due date when overdue", () => {
    const overdue: Task = { ...task, dueDate: "2026-07-01" };
    render(<AgendaRow item={{ kind: "task", id: overdue.id, task: overdue, score: 1 }} />);
    expect(screen.getByText("when you can")).toBeInTheDocument();
  });
});
