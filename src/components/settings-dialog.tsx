"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importData = useAppStore((s) => s.importData);

  const exportData = () => {
    const state = useAppStore.getState();
    const payload = {
      tasks: state.tasks,
      chores: state.chores,
      contacts: state.contacts,
      interactions: state.interactions,
      groceries: state.groceries,
      usualGroceryItems: state.usualGroceryItems,
      events: state.events,
      settings: state.settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tend-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Exported", { description: "Saved as a .json file." });
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.tasks)) {
          throw new Error("invalid");
        }
        const confirmed = window.confirm(
          "This replaces everything currently in Tend with this backup. Continue?"
        );
        if (!confirmed) return;
        importData({
          tasks: parsed.tasks ?? [],
          chores: parsed.chores ?? [],
          contacts: parsed.contacts ?? [],
          interactions: parsed.interactions ?? [],
          groceries: parsed.groceries ?? [],
          usualGroceryItems: parsed.usualGroceryItems ?? [],
          events: parsed.events ?? [],
          settings: parsed.settings ?? { todayBudget: 6, hasSeenWelcome: false },
        });
        toast.success("Restored", { description: "Your data has been imported." });
        onOpenChange(false);
      } catch {
        toast.error("Couldn't read that file", {
          description: "Make sure it's a Tend export .json file.",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Your data</DialogTitle>
          <DialogDescription>
            Everything lives on this device only, for now. Export a backup, or
            restore one on a new device.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={exportData}
          >
            <Download className="h-4 w-4" /> Export data (.json)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" /> Import data (.json)
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
