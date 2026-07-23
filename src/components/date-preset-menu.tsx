"use client";

import { useState } from "react";
import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { CalendarClock } from "lucide-react";
import { addDaysISO, thisWeekendISO, todayDateISO } from "@/lib/date-utils";
import { formatISO } from "date-fns";

const presets: { label: string; get: () => string }[] = [
  { label: "Today", get: () => todayDateISO() },
  { label: "Tomorrow", get: () => addDaysISO(todayDateISO(), 1) },
  { label: "This weekend", get: () => thisWeekendISO() },
  { label: "Next week", get: () => addDaysISO(todayDateISO(), 7) },
];

/** Shared "Reschedule" submenu — quick date presets plus a full calendar picker. */
export function DatePresetMenu({ onPick }: { onPick: (dateISO: string) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <CalendarClock className="h-3.5 w-3.5" /> Reschedule
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            {presets.map((p) => (
              <DropdownMenuItem key={p.label} onClick={() => onPick(p.get())}>
                {p.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={() => setPickerOpen(true)}>Pick a date…</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="w-auto">
          <DialogHeader>
            <DialogTitle>Pick a date</DialogTitle>
          </DialogHeader>
          <Calendar
            mode="single"
            onSelect={(date) => {
              if (!date) return;
              onPick(formatISO(date, { representation: "date" }));
              setPickerOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
