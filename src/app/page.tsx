"use client";

import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { todayAgenda, currentStreak, estimateAgendaMinutes } from "@/lib/selectors";
import { QuickCapture } from "@/components/quick-capture";
import { AgendaRow } from "@/components/agenda-row";
import { EmptyState } from "@/components/empty-state";
import { SettingsDialog } from "@/components/settings-dialog";
import { Button } from "@/components/ui/button";
import { ShoppingBasket, Sprout, Flower2, TreeDeciduous, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function TodayPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [focusMode, setFocusMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const contacts = useAppStore((s) => s.contacts);
  const chores = useAppStore((s) => s.chores);
  const tasks = useAppStore((s) => s.tasks);
  const groceries = useAppStore((s) => s.groceries);
  const events = useAppStore((s) => s.events);
  const budget = useAppStore((s) => s.settings.todayBudget);

  const agenda = useMemo(
    () => todayAgenda(contacts, chores, tasks, budget),
    [contacts, chores, tasks, budget]
  );
  const streak = useMemo(() => currentStreak(events), [events]);
  const minutes = useMemo(() => estimateAgendaMinutes(agenda), [agenda]);
  const groceriesLeft = groceries.filter((g) => !g.checked).length;

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8 pb-4 sm:px-8">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting()}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {todayLabel}
            {mounted && agenda.length > 0 && ` · about ${minutes} minutes today`}
          </p>
        </div>
        <div className="mt-1 flex shrink-0 items-center gap-1.5">
          {mounted && streak >= 2 && (
            <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {streak >= 10 ? (
                <TreeDeciduous className="h-3.5 w-3.5" />
              ) : streak >= 5 ? (
                <Flower2 className="h-3.5 w-3.5" />
              ) : (
                <Sprout className="h-3.5 w-3.5" />
              )}
              {streak} days
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            title="Your data"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      <div className="mb-6">
        <QuickCapture />
      </div>

      {!mounted ? null : agenda.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="You've tended everything"
          description="Nothing needs you right now. A good moment to get ahead on Someday, or just rest."
          className="mb-6"
        />
      ) : (
        <>
          {agenda.length > 1 && (
            <div className="mb-2 flex items-center justify-end gap-1">
              <button
                onClick={() => setFocusMode(false)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  !focusMode ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                List
              </button>
              <button
                onClick={() => setFocusMode(true)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  focusMode ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                Focus
              </button>
            </div>
          )}

          {focusMode && agenda.length > 1 ? (
            <div className="mb-6 flex flex-col items-center gap-3">
              <div className="w-full rounded-2xl border border-border/60 bg-card/60 px-4">
                <AgendaRow item={agenda[0]} />
              </div>
              <p className="text-xs text-muted-foreground">
                Just this — {agenda.length - 1} more after it
              </p>
            </div>
          ) : (
            <div className="mb-6 rounded-2xl border border-border/60 bg-card/60 px-4 divide-y divide-border/60">
              {agenda.map((item) => (
                <AgendaRow key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </>
      )}

      {mounted && groceriesLeft > 0 && (
        <Link
          href="/groceries"
          className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
        >
          <ShoppingBasket className="h-4 w-4" />
          {groceriesLeft} item{groceriesLeft === 1 ? "" : "s"} on your grocery list
          <span className="ml-auto text-xs opacity-70">Open →</span>
        </Link>
      )}
    </div>
  );
}
