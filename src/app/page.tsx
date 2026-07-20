"use client";

import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { contactNudges, dueChores, todayTasks } from "@/lib/selectors";
import { QuickCapture } from "@/components/quick-capture";
import { Section } from "@/components/section";
import { ContactNudgeRow } from "@/components/contact-nudge-row";
import { ChoreRow } from "@/components/chore-row";
import { TaskRow } from "@/components/task-row";
import { EmptyState } from "@/components/empty-state";
import { Users, Repeat, ListChecks, ShoppingBasket, PartyPopper } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
  const budget = useAppStore((s) => s.settings.todayBudget);

  const nudges = useMemo(() => contactNudges(contacts), [contacts]);
  const due = useMemo(() => dueChores(chores), [chores]);
  const picks = useMemo(() => todayTasks(tasks, budget), [tasks, budget]);
  const groceriesLeft = groceries.filter((g) => !g.checked).length;

  const nothingDue = mounted && nudges.length === 0 && due.length === 0 && picks.length === 0;

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8 pb-4 sm:px-8">
      <div className="mb-5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {greeting()}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{todayLabel}</p>
      </div>

      <div className="mb-6">
        <QuickCapture />
      </div>

      {!mounted ? null : nothingDue ? (
        <EmptyState
          icon={PartyPopper}
          title="You're all caught up"
          description="Nothing urgent today. A good day to get ahead on something from Someday, or just rest."
          className="mb-6"
        />
      ) : (
        <>
          {nudges.length > 0 && (
            <Section
              title="People to reach out to"
              icon={Users}
              accent="people"
              count={nudges.length}
            >
              {nudges.map((n) => (
                <ContactNudgeRow key={n.contact.id} contact={n.contact} />
              ))}
            </Section>
          )}

          {due.length > 0 && (
            <Section
              title="Around the house"
              icon={Repeat}
              accent="chores"
              count={due.length}
            >
              {due.map((d) => (
                <ChoreRow key={d.chore.id} chore={d.chore} />
              ))}
            </Section>
          )}

          {picks.length > 0 && (
            <Section
              title="On your list today"
              icon={ListChecks}
              accent="tasks"
              count={picks.length}
              action={
                <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                  <Link href="/tasks">See all →</Link>
                </Button>
              }
            >
              {picks.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </Section>
          )}
        </>
      )}

      {mounted && groceriesLeft > 0 && (
        <Link
          href="/groceries"
          className="flex items-center gap-3 rounded-xl border border-groceries/25 bg-groceries-soft px-4 py-3 text-sm font-medium text-groceries transition-transform hover:scale-[1.01]"
        >
          <ShoppingBasket className="h-4 w-4" />
          {groceriesLeft} item{groceriesLeft === 1 ? "" : "s"} on your grocery list
          <span className="ml-auto text-xs opacity-70">Open →</span>
        </Link>
      )}
    </div>
  );
}
