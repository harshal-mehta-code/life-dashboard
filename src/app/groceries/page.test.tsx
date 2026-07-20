import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroceriesPage from "./page";
import { useAppStore } from "@/lib/store";

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

describe("GroceriesPage", () => {
  it("shows empty state with no items", () => {
    render(<GroceriesPage />);
    expect(screen.getByText("Your list is empty")).toBeInTheDocument();
  });

  it("adds an item via the input form", async () => {
    const user = userEvent.setup();
    render(<GroceriesPage />);
    await user.type(screen.getByPlaceholderText("Add an item…"), "Milk");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("Milk")).toBeInTheDocument();
    expect(useAppStore.getState().groceries).toHaveLength(1);
  });

  it("stars an item, revealing it in the Usuals tray once checked off", async () => {
    const user = userEvent.setup();
    render(<GroceriesPage />);
    await user.type(screen.getByPlaceholderText("Add an item…"), "Milk");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await user.click(screen.getByTitle("Save as a usual"));
    expect(useAppStore.getState().usualGroceryItems).toEqual(["Milk"]);

    // Usuals tray only surfaces a starred item once it's no longer on the
    // active unchecked list (otherwise it'd be an odd duplicate suggestion).
    expect(screen.queryByText("Usuals:")).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByText("Usuals:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Milk/ })).toBeInTheDocument();
  });

  it("re-adds a usual to the list in one click from the chip tray", async () => {
    useAppStore.setState({
      groceries: [{ id: "g1", name: "Milk", checked: true, createdAt: "2026-01-01T00:00:00Z" }],
      usualGroceryItems: ["Milk"],
    });
    const user = userEvent.setup();
    render(<GroceriesPage />);

    await user.click(screen.getByRole("button", { name: /Milk/ }));

    const state = useAppStore.getState();
    expect(state.groceries.filter((g) => !g.checked)).toHaveLength(1);
  });

  it("clears only checked items", async () => {
    useAppStore.setState({
      groceries: [
        { id: "g1", name: "Milk", checked: true, createdAt: "2026-01-01T00:00:00Z" },
        { id: "g2", name: "Eggs", checked: false, createdAt: "2026-01-01T00:00:00Z" },
      ],
    });
    const user = userEvent.setup();
    render(<GroceriesPage />);

    const cartSection = screen.getByText(/In your cart/).closest("div")!.parentElement!;
    await user.click(within(cartSection).getByRole("button", { name: /Clear/ }));

    expect(useAppStore.getState().groceries).toHaveLength(1);
    expect(useAppStore.getState().groceries[0].name).toBe("Eggs");
  });
});
