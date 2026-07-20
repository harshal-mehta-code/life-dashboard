"use client";

import { AgendaItem } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Phone,
  MessageCircle,
  Users,
  Check,
  CalendarPlus,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  addDaysISO,
  formatCadence,
  gentleDueLabel,
  relativeSinceLabel,
  todayDateISO,
} from "@/lib/date-utils";
import {
  buildICS,
  choreToCalendarConfig,
  contactToCalendarConfig,
  downloadICS,
  taskToCalendarConfig,
} from "@/lib/ics";

function AddToCalendarButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
      title={label}
      onClick={onClick}
    >
      <CalendarPlus className="h-3.5 w-3.5" />
    </Button>
  );
}

export function AgendaRow({ item }: { item: AgendaItem }) {
  const logContact = useAppStore((s) => s.logContact);
  const completeChore = useAppStore((s) => s.completeChore);
  const toggleTaskDone = useAppStore((s) => s.toggleTaskDone);
  const snoozeTask = useAppStore((s) => s.snoozeTask);

  if (item.kind === "contact") {
    const { contact } = item;
    const log = (type: "call" | "text" | "in-person", label: string) => {
      logContact(contact.id, type);
      toast.success(`Logged ${label.toLowerCase()} with ${contact.name}`, {
        description: `You'll hear from us again in ${formatCadence(contact.cadenceDays)}.`,
      });
    };
    return (
      <div className="group flex items-center gap-3 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-xs font-semibold text-foreground/70">
          {contact.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{contact.name}</p>
          <p className="text-xs text-muted-foreground">
            Last touched base {relativeSinceLabel(contact.lastContactAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <AddToCalendarButton
            label="Add recurring reminder to calendar"
            onClick={() =>
              downloadICS(`reach-out-${contact.name}`, buildICS(contactToCalendarConfig(contact)))
            }
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            title="Log a call"
            onClick={() => log("call", "a call")}
          >
            <Phone className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            title="Log a text"
            onClick={() => log("text", "a text")}
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            title="Log time together"
            onClick={() => log("in-person", "time together")}
          >
            <Users className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  if (item.kind === "chore") {
    const { chore } = item;
    const anchor = (chore.lastDoneAt ?? chore.createdAt).slice(0, 10);
    const nextDueISO = addDaysISO(anchor, chore.recurrenceDays);
    return (
      <div className="group flex items-center gap-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{chore.title}</p>
          <p className="text-xs text-muted-foreground">{formatCadence(chore.recurrenceDays)}</p>
        </div>
        <AddToCalendarButton
          label="Add reminder to calendar"
          onClick={() =>
            downloadICS(chore.title, buildICS(choreToCalendarConfig(chore, nextDueISO)))
          }
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-8 shrink-0 gap-1.5 text-primary hover:bg-primary/10 hover:text-primary"
          onClick={() => {
            completeChore(chore.id);
            toast.success("Done", {
              description: `Next up ${gentleDueLabel(
                addDaysISO(todayDateISO(), chore.recurrenceDays)
              )}`,
            });
          }}
        >
          <Check className="h-3.5 w-3.5" />
          Done
        </Button>
      </div>
    );
  }

  const { task } = item;
  const isDone = task.status === "done";
  return (
    <div className="group flex items-center gap-3 py-3">
      <Checkbox
        checked={isDone}
        onCheckedChange={() => {
          toggleTaskDone(task.id);
          if (!isDone) toast.success("Nice work", { description: task.title });
        }}
        className="h-5 w-5 shrink-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{task.title}</p>
        {task.dueDate && (
          <p className="text-xs text-muted-foreground">{gentleDueLabel(task.dueDate)}</p>
        )}
      </div>
      {task.dueDate && (
        <AddToCalendarButton
          label="Add to calendar"
          onClick={() => downloadICS(task.title, buildICS(taskToCalendarConfig(task)))}
        />
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        title="Not today — snooze to tomorrow"
        onClick={() => {
          snoozeTask(task.id, addDaysISO(todayDateISO(), 1));
          toast("Snoozed to tomorrow", { description: task.title });
        }}
      >
        <Clock className="h-4 w-4" />
      </Button>
    </div>
  );
}
