import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChoreDialog } from "./chore-dialog";
import { useAppStore } from "@/lib/store";
import { Chore } from "@/lib/types";

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

describe("ChoreDialog — add mode", () => {
  it("adds a new chore", async () => {
    const user = userEvent.setup();
    render(<ChoreDialog open={true} onOpenChange={() => {}} />);

    await user.type(screen.getByLabelText("What needs doing"), "Water plants");
    await user.click(screen.getByRole("button", { name: "Add" }));

    const chores = useAppStore.getState().chores;
    expect(chores).toHaveLength(1);
    expect(chores[0].title).toBe("Water plants");
  });

  it("discards unsaved edits and starts fresh the next time it's opened", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ChoreDialog open={true} onOpenChange={() => {}} />);

    await user.type(screen.getByLabelText("What needs doing"), "some unsaved garbage");

    // Simulate the parent closing (Cancel/Escape) then reopening the same instance.
    rerender(<ChoreDialog open={false} onOpenChange={() => {}} />);
    rerender(<ChoreDialog open={true} onOpenChange={() => {}} />);

    expect(screen.getByLabelText("What needs doing")).toHaveValue("");
  });
});

describe("ChoreDialog — edit mode", () => {
  const chore: Chore = {
    id: "ch1",
    title: "Water plants",
    recurrenceDays: 14,
    notes: "Use the blue can",
    createdAt: "2026-01-01T00:00:00Z",
  };

  it("pre-fills from the existing chore and updates in place", async () => {
    useAppStore.setState({ chores: [chore] });
    const user = userEvent.setup();
    render(<ChoreDialog open={true} onOpenChange={() => {}} chore={chore} />);

    expect(screen.getByLabelText("What needs doing")).toHaveValue("Water plants");
    expect(screen.getByLabelText("Notes")).toHaveValue("Use the blue can");

    await user.clear(screen.getByLabelText("What needs doing"));
    await user.type(screen.getByLabelText("What needs doing"), "Water all the plants");
    await user.click(screen.getByRole("button", { name: "Save" }));

    const state = useAppStore.getState();
    expect(state.chores).toHaveLength(1);
    expect(state.chores[0].title).toBe("Water all the plants");
    expect(state.chores[0].id).toBe("ch1");
  });

  it("reverts unsaved edits back to the chore's real values on reopen", async () => {
    useAppStore.setState({ chores: [chore] });
    const user = userEvent.setup();
    const { rerender } = render(<ChoreDialog open={true} onOpenChange={() => {}} chore={chore} />);

    await user.clear(screen.getByLabelText("What needs doing"));
    await user.type(screen.getByLabelText("What needs doing"), "unsaved garbage");

    rerender(<ChoreDialog open={false} onOpenChange={() => {}} chore={chore} />);
    rerender(<ChoreDialog open={true} onOpenChange={() => {}} chore={chore} />);

    expect(screen.getByLabelText("What needs doing")).toHaveValue("Water plants");
  });
});
