import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskDialog } from "./task-dialog";
import { useAppStore } from "@/lib/store";
import { Task } from "@/lib/types";

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
});

describe("TaskDialog — add mode", () => {
  it("adds a new task with defaults, freshly mounted already open", async () => {
    const user = userEvent.setup();
    render(<TaskDialog open={true} onOpenChange={() => {}} />);

    expect(screen.getByLabelText("What is it")).toHaveValue("");
    await user.type(screen.getByLabelText("What is it"), "Call the vet");
    await user.click(screen.getByRole("button", { name: "Add" }));

    const tasks = useAppStore.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({ title: "Call the vet", category: "general" });
  });

  it("applies defaultCategory on a fresh open mount", () => {
    render(<TaskDialog open={true} onOpenChange={() => {}} defaultCategory="errand" />);
    expect(screen.getByText("Errand")).toBeInTheDocument();
  });

  it("discards unsaved edits and starts fresh the next time it's opened", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TaskDialog open={true} onOpenChange={() => {}} />);

    await user.type(screen.getByLabelText("What is it"), "unsaved garbage");
    rerender(<TaskDialog open={false} onOpenChange={() => {}} />);
    rerender(<TaskDialog open={true} onOpenChange={() => {}} />);

    expect(screen.getByLabelText("What is it")).toHaveValue("");
  });
});

describe("TaskDialog — edit mode", () => {
  const task: Task = {
    id: "t1",
    title: "Buy stamps",
    notes: "Get the forever kind",
    category: "errand",
    context: "out",
    effort: "quick",
    important: true,
    status: "open",
    createdAt: "2026-01-01T00:00:00Z",
  };

  it("pre-fills from the existing task on a fresh mount, and updates in place", async () => {
    useAppStore.setState({ tasks: [task] });
    const user = userEvent.setup();
    render(<TaskDialog open={true} onOpenChange={() => {}} task={task} />);

    expect(screen.getByLabelText("What is it")).toHaveValue("Buy stamps");
    expect(screen.getByLabelText("Notes")).toHaveValue("Get the forever kind");

    await user.clear(screen.getByLabelText("What is it"));
    await user.type(screen.getByLabelText("What is it"), "Buy more stamps");
    await user.click(screen.getByRole("button", { name: "Save" }));

    const state = useAppStore.getState();
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].title).toBe("Buy more stamps");
    expect(state.tasks[0].id).toBe("t1");
  });

  it("reverts unsaved edits back to the task's real values on reopen", async () => {
    useAppStore.setState({ tasks: [task] });
    const user = userEvent.setup();
    const { rerender } = render(<TaskDialog open={true} onOpenChange={() => {}} task={task} />);

    await user.clear(screen.getByLabelText("What is it"));
    await user.type(screen.getByLabelText("What is it"), "unsaved garbage");

    rerender(<TaskDialog open={false} onOpenChange={() => {}} task={task} />);
    rerender(<TaskDialog open={true} onOpenChange={() => {}} task={task} />);

    expect(screen.getByLabelText("What is it")).toHaveValue("Buy stamps");
  });
});
