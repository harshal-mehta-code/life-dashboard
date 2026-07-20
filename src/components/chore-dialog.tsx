"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { Chore } from "@/lib/types";
import { toast } from "sonner";

const recurrencePresets = [
  { value: 1, label: "Daily" },
  { value: 3, label: "Every 3 days" },
  { value: 7, label: "Weekly" },
  { value: 14, label: "Every 2 weeks" },
  { value: 30, label: "Monthly" },
  { value: 60, label: "Every 2 months" },
  { value: 90, label: "Every 3 months" },
  { value: 180, label: "Every 6 months" },
  { value: 365, label: "Yearly" },
];

export function ChoreDialog({
  open,
  onOpenChange,
  chore,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chore?: Chore;
}) {
  const addChore = useAppStore((s) => s.addChore);
  const updateChore = useAppStore((s) => s.updateChore);

  const [title, setTitle] = useState("");
  const [recurrenceDays, setRecurrenceDays] = useState(30);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(chore?.title ?? "");
      setRecurrenceDays(chore?.recurrenceDays ?? 30);
      setNotes(chore?.notes ?? "");
    }
  }, [open, chore]);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    if (chore) {
      updateChore(chore.id, { title: trimmed, recurrenceDays, notes: notes.trim() || undefined });
      toast.success("Updated", { description: trimmed });
    } else {
      addChore({ title: trimmed, recurrenceDays, notes: notes.trim() || undefined });
      toast.success("Added to your chores", { description: trimmed });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{chore ? "Edit chore" : "Add a recurring chore"}</DialogTitle>
          <DialogDescription>
            It reschedules itself from the day you mark it done — miss it, and it just picks up from there.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="chore-title">What needs doing</Label>
            <Input
              id="chore-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Clean the windows, water the plants…"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>How often</Label>
            <Select
              value={String(recurrenceDays)}
              onValueChange={(v) => setRecurrenceDays(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recurrencePresets.map((p) => (
                  <SelectItem key={p.value} value={String(p.value)}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="chore-notes">Notes</Label>
            <Textarea
              id="chore-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Supplies needed, how you like it done…"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!title.trim()}>
            {chore ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
