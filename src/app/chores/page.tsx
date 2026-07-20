"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ChoreRow } from "@/components/chore-row";
import { ChoreDialog } from "@/components/chore-dialog";
import { EmptyState } from "@/components/empty-state";
import { Plus, Repeat } from "lucide-react";
import { dueChores } from "@/lib/selectors";
import { addDaysISO } from "@/lib/date-utils";

export default function ChoresPage() {
  const chores = useAppStore((s) => s.chores);
  const [addOpen, setAddOpen] = useState(false);

  const due = useMemo(() => dueChores(chores), [chores]);
  const dueIds = useMemo(() => new Set(due.map((d) => d.chore.id)), [due]);

  const upcoming = useMemo(
    () =>
      chores
        .filter((c) => !dueIds.has(c.id))
        .map((chore) => {
          const anchor = (chore.lastDoneAt ?? chore.createdAt).slice(0, 10);
          const nextDueISO = addDaysISO(anchor, chore.recurrenceDays);
          return { chore, nextDueISO };
        })
        .sort((a, b) => (a.nextDueISO < b.nextDueISO ? -1 : 1)),
    [chores, dueIds]
  );

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Chores"
        subtitle="Recurring things around the house. Each one reschedules itself from the day you finish it."
        action={
          <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add chore
          </Button>
        }
      />

      <div className="space-y-6 px-4 pb-8 sm:px-8">
        {chores.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="No chores yet"
            description="Add the recurring things you need to keep up with — cleaning windows, watering plants, changing filters."
          />
        ) : (
          <>
            {due.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-chores">
                  Due now ({due.length})
                </h2>
                <div className="space-y-2">
                  {due.map((d) => (
                    <ChoreRow key={d.chore.id} chore={d.chore} />
                  ))}
                </div>
              </div>
            )}
            {upcoming.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                  Upcoming ({upcoming.length})
                </h2>
                <div className="space-y-2">
                  {upcoming.map((u) => (
                    <ChoreRow key={u.chore.id} chore={u.chore} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ChoreDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
