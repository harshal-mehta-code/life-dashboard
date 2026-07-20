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
import { Contact, Relationship } from "@/lib/types";
import { toast } from "sonner";

const cadencePresets = [
  { value: 3, label: "Every few days" },
  { value: 7, label: "Weekly" },
  { value: 14, label: "Every 2 weeks" },
  { value: 30, label: "Monthly" },
  { value: 60, label: "Every 2 months" },
  { value: 90, label: "Every 3 months" },
];

export function ContactDialog({
  open,
  onOpenChange,
  contact,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
}) {
  const addContact = useAppStore((s) => s.addContact);
  const updateContact = useAppStore((s) => s.updateContact);

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("friend");
  const [cadenceDays, setCadenceDays] = useState(14);
  const [notes, setNotes] = useState("");
  const [birthday, setBirthday] = useState("");

  useEffect(() => {
    if (open) {
      setName(contact?.name ?? "");
      setRelationship(contact?.relationship ?? "friend");
      setCadenceDays(contact?.cadenceDays ?? 14);
      setNotes(contact?.notes ?? "");
      setBirthday(contact?.birthday ?? "");
    }
  }, [open, contact]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const validBirthday = /^\d{2}-\d{2}$/.test(birthday) ? birthday : undefined;
    if (contact) {
      updateContact(contact.id, {
        name: trimmed,
        relationship,
        cadenceDays,
        notes: notes.trim() || undefined,
        birthday: validBirthday,
      });
      toast.success("Updated", { description: trimmed });
    } else {
      addContact({
        name: trimmed,
        relationship,
        cadenceDays,
        notes: notes.trim() || undefined,
        birthday: validBirthday,
      });
      toast.success("Added to your people", { description: trimmed });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit person" : "Add a person"}</DialogTitle>
          <DialogDescription>
            Someone you want to stay in touch with — family, a friend, anyone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="contact-name">Name</Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mom, Sam, Uncle Raj…"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Relationship</Label>
              <Select value={relationship} onValueChange={(v) => setRelationship(v as Relationship)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Stay in touch</Label>
              <Select
                value={String(cadenceDays)}
                onValueChange={(v) => setCadenceDays(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cadencePresets.map((p) => (
                    <SelectItem key={p.value} value={String(p.value)}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-birthday">Birthday (optional)</Label>
            <Input
              id="contact-birthday"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              placeholder="MM-DD, e.g. 06-15"
              maxLength={5}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-notes">Notes</Label>
            <Textarea
              id="contact-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything you want to remember — gift ideas, what's going on with them…"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim()}>
            {contact ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
