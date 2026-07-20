"use client";

import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { todayAgenda, currentStreak } from "@/lib/selectors";
import { QuickCapture } from "@/components/quick-capture";
import { AgendaRow } from "@/components/agenda-row";
import { EmptyState } from "@/components/empty-state";
import { ShoppingBasket, Sprout, Flame } from "lucide-react";
import Link from "next/link";

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
          <p className="mt-1 text-sm text-muted-foreground">{todayLabel}</p>
        </div>
        {mounted && streak >= 2 && (
          <div className="mt-1 flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <Flame className="h-3.5 w-3.5" />
            {streak} days
          </div>
        )}
      </div>

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
        <div className="mb-6 rounded-2xl border border-border/60 bg-card/60 px-4 divide-y divide-border/60">
          {agenda.map((item) => (
            <AgendaRow key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
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
