"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ContactCard } from "@/components/contact-card";
import { ContactDialog } from "@/components/contact-dialog";
import { EmptyState } from "@/components/empty-state";
import { Plus, Users } from "lucide-react";
import { contactNudges } from "@/lib/selectors";

export default function PeoplePage() {
  const contacts = useAppStore((s) => s.contacts);
  const [addOpen, setAddOpen] = useState(false);

  const overdueIds = useMemo(
    () => new Set(contactNudges(contacts).map((n) => n.contact.id)),
    [contacts]
  );

  const needsAttention = contacts.filter((c) => overdueIds.has(c.id));
  const onTrack = contacts.filter((c) => !overdueIds.has(c.id));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="People"
        subtitle="The relationships you want to keep warm — family, friends, anyone."
        action={
          <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add person
          </Button>
        }
      />

      <div className="space-y-6 px-4 pb-8 sm:px-8">
        {contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No one here yet"
            description="Add the people you want to make sure you keep in touch with, and set how often you'd like to connect."
          />
        ) : (
          <>
            {needsAttention.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-people">
                  Needs attention ({needsAttention.length})
                </h2>
                <div className="space-y-2">
                  {needsAttention.map((c) => (
                    <ContactCard key={c.id} contact={c} overdue />
                  ))}
                </div>
              </div>
            )}
            {onTrack.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                  On track ({onTrack.length})
                </h2>
                <div className="space-y-2">
                  {onTrack.map((c) => (
                    <ContactCard key={c.id} contact={c} overdue={false} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ContactDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
