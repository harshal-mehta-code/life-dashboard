"use client";

import { useState } from "react";
import { Task } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { relativeDueLabel } from "@/lib/date-utils";
import { Phone, MapPin, Laptop, Star, Trash2, Home as HomeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TaskDialog } from "@/components/task-dialog";

const contextIcon = {
  home: HomeIcon,
  phone: Phone,
  out: MapPin,
  computer: Laptop,
  anywhere: null,
};

export function TaskRow({ task, showDelete = true }: { task: Task; showDelete?: boolean }) {
  const toggleTaskDone = useAppStore((s) => s.toggleTaskDone);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const Icon = contextIcon[task.context];
  const isDone = task.status === "done";
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm">
      <Checkbox
        checked={isDone}
        onCheckedChange={() => {
          toggleTaskDone(task.id);
          if (!isDone) toast.success("Nice work", { description: task.title });
        }}
        className="h-5 w-5 shrink-0 data-[state=checked]:bg-tasks data-[state=checked]:border-tasks"
      />
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="min-w-0 flex-1 text-left"
      >
        <p
          className={cn(
            "truncate text-sm font-medium",
            isDone && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {Icon && (
            <span className="flex items-center gap-1">
              <Icon className="h-3 w-3" />
            </span>
          )}
          {task.important && (
            <span className="flex items-center gap-1 text-primary">
              <Star className="h-3 w-3 fill-current" /> important
            </span>
          )}
          {task.dueDate && !isDone && (
            <span
              className={cn(
                task.dueDate < new Date().toISOString().slice(0, 10) && "text-destructive"
              )}
            >
              {relativeDueLabel(task.dueDate)}
            </span>
          )}
        </div>
      </button>
      {showDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => deleteTask(task.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <TaskDialog open={editOpen} onOpenChange={setEditOpen} task={task} />
    </div>
  );
}
