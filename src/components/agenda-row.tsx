"use client";

import { ReactNode } from "react";
import { AgendaItem } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Phone, MessageCircle, Users, Check, CalendarPlus, Clock, MoreHorizontal } from "lucide-react";
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

function Overflow({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 data-[state=open]:opacity-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AgendaRow({ item }: { item: AgendaItem }) {
  const logContact = useAppStore((s) => s.logContact);
  const completeChore = useAppStore((s) => s.completeChore);
  const toggleTaskDone = useAppStore((s) => s.toggleTaskDone);
  const snoozeTask = useAppStore((s) => s.snoozeTask);
  const snoozeChore = useAppStore((s) => s.snoozeChore);
  const snoozeContact = useAppStore((s) => s.snoozeContact);

  if (item.kind === "contact") {
    const { contact } = item;
    const log = (type: "call" | "text" | "in-person" | "other", label: string) => {
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
            {item.reason === "birthday"
              ? `🎂 Birthday ${item.daysUntil === 0 ? "today" : `in ${item.daysUntil} days`}`
              : `Last touched base ${relativeSinceLabel(contact.lastContactAt)}`}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 shrink-0 gap-1.5 text-primary hover:bg-primary/10 hover:text-primary"
          onClick={() => log("other", "reaching out")}
        >
          <Check className="h-3.5 w-3.5" />
          Reached out
        </Button>
        <Overflow>
          <DropdownMenuItem onClick={() => log("call", "a call")}>
            <Phone className="h-3.5 w-3.5" /> Log a call
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => log("text", "a text")}>
            <MessageCircle className="h-3.5 w-3.5" /> Log a text
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => log("in-person", "time together")}>
            <Users className="h-3.5 w-3.5" /> Log time together
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              downloadICS(`reach-out-${contact.name}`, buildICS(contactToCalendarConfig(contact)))
            }
          >
            <CalendarPlus className="h-3.5 w-3.5" /> Add recurring reminder
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              snoozeContact(contact.id, addDaysISO(todayDateISO(), 1));
              toast("Snoozed to tomorrow", { description: contact.name });
            }}
          >
            <Clock className="h-3.5 w-3.5" /> Not today
          </DropdownMenuItem>
        </Overflow>
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
        <Overflow>
          <DropdownMenuItem
            onClick={() =>
              downloadICS(chore.title, buildICS(choreToCalendarConfig(chore, nextDueISO)))
            }
          >
            <CalendarPlus className="h-3.5 w-3.5" /> Add reminder to calendar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              snoozeChore(chore.id, addDaysISO(todayDateISO(), 1));
              toast("Snoozed to tomorrow", { description: chore.title });
            }}
          >
            <Clock className="h-3.5 w-3.5" /> Not today
          </DropdownMenuItem>
        </Overflow>
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
      <Overflow>
        {task.dueDate && (
          <DropdownMenuItem
            onClick={() => downloadICS(task.title, buildICS(taskToCalendarConfig(task)))}
          >
            <CalendarPlus className="h-3.5 w-3.5" /> Add to calendar
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => {
            snoozeTask(task.id, addDaysISO(todayDateISO(), 1));
            toast("Snoozed to tomorrow", { description: task.title });
          }}
        >
          <Clock className="h-3.5 w-3.5" /> Not today
        </DropdownMenuItem>
      </Overflow>
    </div>
  );
}
