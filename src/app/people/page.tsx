"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactCard } from "@/components/contact-card";
import { ContactDialog } from "@/components/contact-dialog";
import { EmptyState } from "@/components/empty-state";
import { Plus, Users, Search } from "lucide-react";
import { contactNudges } from "@/lib/selectors";
import { Contact } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const relationshipFilters: { value: Contact["relationship"] | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "family", label: "Family" },
  { value: "friend", label: "Friends" },
  { value: "work", label: "Work" },
  { value: "other", label: "Other" },
];

export default function PeoplePage() {
  const contacts = useAppStore((s) => s.contacts);
  const [addOpen, setAddOpen] = useState(false);
  const [relationship, setRelationship] = useState<Contact["relationship"] | "all">("all");
  const [search, setSearch] = useState("");

  const overdueIds = useMemo(
    () => new Set(contactNudges(contacts).map((n) => n.contact.id)),
    [contacts]
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (relationship !== "all" && c.relationship !== relationship) return false;
      if (query && !c.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [contacts, relationship, search]);

  const needsAttention = visible.filter((c) => overdueIds.has(c.id));
  const onTrack = visible.filter((c) => !overdueIds.has(c.id));

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

      {contacts.length > 0 && (
        <div className="space-y-3 px-4 pb-2 sm:px-8">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people…"
              className="pl-9"
            />
          </div>
          <Tabs
            value={relationship}
            onValueChange={(v) => setRelationship(v as Contact["relationship"] | "all")}
          >
            <TabsList>
              {relationshipFilters.map((f) => (
                <TabsTrigger key={f.value} value={f.value}>
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      <div className="space-y-6 px-4 pb-8 sm:px-8">
        {contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No one here yet"
            description="Add the people you want to make sure you keep in touch with, and set how often you'd like to connect."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matches"
            description="Try a different name or relationship filter."
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
