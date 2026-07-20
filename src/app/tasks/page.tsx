"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { TaskRow } from "@/components/task-row";
import { TaskDialog } from "@/components/task-dialog";
import { EmptyState } from "@/components/empty-state";
import { Plus, ListChecks } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCategory } from "@/lib/types";

const filters: { value: TaskCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "call", label: "Calls" },
  { value: "errand", label: "Errands" },
  { value: "general", label: "Tasks" },
  { value: "someday", label: "Someday" },
];

export default function TasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState<TaskCategory | "all">("all");
  const [showDone, setShowDone] = useState(false);

  const filtered = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((t) => t.category === filter)),
    [tasks, filter]
  );

  const open = filtered
    .filter((t) => t.status === "open")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const done = filtered
    .filter((t) => t.status === "done")
    .sort(
      (a, b) =>
        new Date(b.completedAt ?? b.createdAt).getTime() -
        new Date(a.completedAt ?? a.createdAt).getTime()
    );

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Tasks"
        subtitle="Errands, calls, and everything else that isn't a person or a recurring chore."
        action={
          <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add task
          </Button>
        }
      />

      <div className="px-4 sm:px-8">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as TaskCategory | "all")}>
          <TabsList>
            {filters.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-6 px-4 pb-8 pt-4 sm:px-8">
        {open.length === 0 && done.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Nothing here"
            description="Add a task, or capture one quickly from the Today page."
          />
        ) : (
          <>
            {open.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing open in this list.
              </p>
            ) : (
              <div className="space-y-2">
                {open.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            )}

            {done.length > 0 && (
              <div>
                <button
                  onClick={() => setShowDone((v) => !v)}
                  className="mb-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {showDone ? "Hide" : "Show"} completed ({done.length})
                </button>
                {showDone && (
                  <div className="space-y-2">
                    {done.map((t) => (
                      <TaskRow key={t.id} task={t} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <TaskDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
