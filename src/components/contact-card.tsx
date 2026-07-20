"use client";

import { useState } from "react";
import { Contact } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { relativeSinceLabel, formatCadence } from "@/lib/date-utils";
import { Phone, MessageCircle, Users, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ContactDialog } from "@/components/contact-dialog";
import { cn } from "@/lib/utils";

const relationshipLabel: Record<Contact["relationship"], string> = {
  family: "Family",
  friend: "Friend",
  work: "Work",
  other: "Other",
};

export function ContactCard({ contact, overdue }: { contact: Contact; overdue: boolean }) {
  const [editOpen, setEditOpen] = useState(false);
  const logContact = useAppStore((s) => s.logContact);
  const deleteContact = useAppStore((s) => s.deleteContact);

  const log = (type: "call" | "text" | "in-person", label: string) => {
    logContact(contact.id, type);
    toast.success(`Logged ${label.toLowerCase()} with ${contact.name}`);
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-people-soft font-heading text-sm font-semibold text-people">
        {contact.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{contact.name}</p>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
            {relationshipLabel[contact.relationship]}
          </Badge>
        </div>
        <p className={cn("text-xs text-muted-foreground", overdue && "text-people font-medium")}>
          Last touched base {relativeSinceLabel(contact.lastContactAt)} · {formatCadence(contact.cadenceDays)} goal
        </p>
        {contact.notes && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground/80 italic">{contact.notes}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => deleteContact(contact.id)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ContactDialog open={editOpen} onOpenChange={setEditOpen} contact={contact} />
    </div>
  );
}
