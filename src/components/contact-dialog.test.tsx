import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactDialog } from "./contact-dialog";
import { useAppStore } from "@/lib/store";
import { Contact } from "@/lib/types";

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

describe("ContactDialog — add mode", () => {
  it("adds a new contact with a valid birthday", async () => {
    const user = userEvent.setup();
    render(<ContactDialog open={true} onOpenChange={() => {}} />);

    await user.type(screen.getByLabelText("Name"), "Priya");
    await user.type(screen.getByLabelText("Birthday (optional)"), "06-15");
    await user.click(screen.getByRole("button", { name: "Add" }));

    const contacts = useAppStore.getState().contacts;
    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject({ name: "Priya", birthday: "06-15" });
  });

  it("drops a malformed birthday instead of saving garbage", async () => {
    const user = userEvent.setup();
    render(<ContactDialog open={true} onOpenChange={() => {}} />);

    await user.type(screen.getByLabelText("Name"), "Priya");
    await user.type(screen.getByLabelText("Birthday (optional)"), "June");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(useAppStore.getState().contacts[0].birthday).toBeUndefined();
  });

  it("disables the submit button until a name is entered", () => {
    render(<ContactDialog open={true} onOpenChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });
});

describe("ContactDialog — edit mode", () => {
  const contact: Contact = {
    id: "c1",
    name: "Sam",
    relationship: "friend",
    cadenceDays: 21,
    birthday: "03-02",
    createdAt: "2026-01-01T00:00:00Z",
  };

  it("pre-fills fields from the existing contact and updates in place", async () => {
    useAppStore.setState({ contacts: [contact] });
    const user = userEvent.setup();
    render(<ContactDialog open={true} onOpenChange={() => {}} contact={contact} />);

    expect(screen.getByLabelText("Name")).toHaveValue("Sam");
    expect(screen.getByLabelText("Birthday (optional)")).toHaveValue("03-02");

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Samantha");
    await user.click(screen.getByRole("button", { name: "Save" }));

    const state = useAppStore.getState();
    expect(state.contacts).toHaveLength(1);
    expect(state.contacts[0].name).toBe("Samantha");
    expect(state.contacts[0].id).toBe("c1");
  });

  it("reverts unsaved edits back to the contact's real values on reopen", async () => {
    useAppStore.setState({ contacts: [contact] });
    const user = userEvent.setup();
    const { rerender } = render(<ContactDialog open={true} onOpenChange={() => {}} contact={contact} />);

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "unsaved garbage");

    rerender(<ContactDialog open={false} onOpenChange={() => {}} contact={contact} />);
    rerender(<ContactDialog open={true} onOpenChange={() => {}} contact={contact} />);

    expect(screen.getByLabelText("Name")).toHaveValue("Sam");
  });
});
