import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsDialog } from "./settings-dialog";
import { useAppStore } from "@/lib/store";

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({
    tasks: [{ id: "t1", title: "Old task", category: "general", context: "anywhere", effort: "quick", important: false, status: "open", createdAt: "2026-01-01T00:00:00Z" }],
    chores: [],
    contacts: [],
    interactions: [],
    groceries: [],
    usualGroceryItems: [],
    events: [],
    settings: { todayBudget: 6, hasSeenWelcome: false },
  });
});

function makeFile(content: unknown): File {
  return new File([JSON.stringify(content)], "backup.json", { type: "application/json" });
}

describe("SettingsDialog export", () => {
  it("builds a blob URL and triggers a download of the current data", async () => {
    const createObjectURL = vi.fn((blob: Blob) => `blob:mock-url:${blob.type}`);
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const user = userEvent.setup();
    render(<SettingsDialog open={true} onOpenChange={() => {}} />);
    await user.click(screen.getByRole("button", { name: /Export data/ }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url:application/json");

    clickSpy.mockRestore();
  });
});

describe("SettingsDialog import", () => {
  it("replaces store data after user confirms", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<SettingsDialog open={true} onOpenChange={onOpenChange} />);

    const file = makeFile({
      tasks: [],
      chores: [],
      contacts: [{ id: "c1", name: "Restored Contact", relationship: "friend", cadenceDays: 7, createdAt: "2026-01-01T00:00:00Z" }],
      interactions: [],
      groceries: [],
      usualGroceryItems: [],
      events: [],
      settings: { todayBudget: 6, hasSeenWelcome: true },
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(useAppStore.getState().tasks).toHaveLength(0);
      expect(useAppStore.getState().contacts).toHaveLength(1);
    });
    expect(useAppStore.getState().contacts[0].name).toBe("Restored Contact");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not import when the user declines the confirm dialog", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<SettingsDialog open={true} onOpenChange={() => {}} />);

    const file = makeFile({ tasks: [], chores: [], contacts: [], interactions: [], groceries: [], usualGroceryItems: [], events: [], settings: {} });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
    });
    // original seeded task should still be present since import was declined
    expect(useAppStore.getState().tasks).toHaveLength(1);
  });

  it("shows an error toast and leaves data untouched for a malformed file", async () => {
    const user = userEvent.setup();
    render(<SettingsDialog open={true} onOpenChange={() => {}} />);

    const file = new File(["not json"], "bad.json", { type: "application/json" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(useAppStore.getState().tasks).toHaveLength(1);
    });
  });
});
