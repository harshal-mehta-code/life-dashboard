"use client";

import { Contact } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { relativeSinceLabel, formatCadence } from "@/lib/date-utils";
import { Phone, MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";

export function ContactNudgeRow({ contact }: { contact: Contact }) {
  const logContact = useAppStore((s) => s.logContact);

  const log = (type: "call" | "text" | "in-person", label: string) => {
    logContact(contact.id, type);
    toast.success(`Logged ${label.toLowerCase()} with ${contact.name}`, {
      description: `You'll hear from us again in ${formatCadence(contact.cadenceDays)}.`,
    });
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-people-soft font-heading text-sm font-semibold text-people">
        {contact.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{contact.name}</p>
        <p className="text-xs text-muted-foreground">
          Last touched base {relativeSinceLabel(contact.lastContactAt)} ·{" "}
          {formatCadence(contact.cadenceDays)} goal
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-people/30 text-people hover:bg-people-soft hover:text-people"
          title="Log a call"
          onClick={() => log("call", "a call")}
        >
          <Phone className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-people/30 text-people hover:bg-people-soft hover:text-people"
          title="Log a text"
          onClick={() => log("text", "a text")}
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-people/30 text-people hover:bg-people-soft hover:text-people"
          title="Log time together"
          onClick={() => log("in-person", "time together")}
        >
          <Users className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
