"use client";

import { useState } from "react";
import { Chore } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { formatCadence, relativeDueLabel } from "@/lib/date-utils";
import { addDaysISO } from "@/lib/date-utils";
import { Check, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChoreDialog } from "@/components/chore-dialog";

export function ChoreRow({ chore, showMenu = true }: { chore: Chore; showMenu?: boolean }) {
  const completeChore = useAppStore((s) => s.completeChore);
  const deleteChore = useAppStore((s) => s.deleteChore);
  const [editOpen, setEditOpen] = useState(false);

  const anchor = (chore.lastDoneAt ?? chore.createdAt).slice(0, 10);
  const nextDueISO = addDaysISO(anchor, chore.recurrenceDays);
  const overdue = new Date(nextDueISO) < new Date(new Date().toDateString());

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{chore.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{formatCadence(chore.recurrenceDays)}</span>
          <span className={cn(overdue && "text-destructive")}>
            {relativeDueLabel(nextDueISO)}
          </span>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-8 shrink-0 gap-1.5 border-chores text-chores hover:bg-chores-soft hover:text-chores"
        onClick={() => {
          completeChore(chore.id);
          toast.success("Done", {
            description: `Next up ${relativeDueLabel(
              addDaysISO(new Date().toISOString().slice(0, 10), chore.recurrenceDays)
            )}`,
          });
        }}
      >
        <Check className="h-3.5 w-3.5" />
        Done
      </Button>
      {showMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => deleteChore(chore.id)}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <ChoreDialog open={editOpen} onOpenChange={setEditOpen} chore={chore} />
    </div>
  );
}
