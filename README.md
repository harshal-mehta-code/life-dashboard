# Tend — your life, tended to

A personal life dashboard built to handle the stuff that generic task trackers
(Things, Reminders, calendars) don't: staying in touch with people, recurring
household chores, errands and calls, and a running grocery list — all in one
calm, opinionated view.

## Why not just use Things 3 / Reminders?

Most task trackers treat everything as an undifferentiated to-do. Tend treats
different kinds of "things to keep track of" differently:

- **People** aren't tasks — they're relationships with a cadence. Tend tracks
  when you last connected with someone and how often you *want* to, and
  surfaces a gentle nudge (not guilt) when it's been a while. Logging a
  call/text/hangout resets the clock.
- **Chores** recur from the day you *finish* them, not from a fixed calendar
  slot. Miss a week of watering the plants? The next reminder doesn't pile up
  or guilt-trip you — it just reschedules from whenever you actually did it.
- **Tasks** (errands, calls, one-offs) are tagged by context (phone, out and
  about, at the computer) so you can batch similar things together.
- **Today** pulls a small, bounded list across all of the above — not
  everything you've ever added — so it never turns into a wall of anxiety.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (Radix)
- Zustand with `localStorage` persistence (client-only for now — see below)
- Deployed on Vercel

## Data & sync

v1 stores everything in your browser's `localStorage`. It works fully offline
and can be installed to your phone's home screen (it's a PWA), but data does
**not** yet sync across devices. That's the natural next step once you want
it — it needs a small database and a lightweight auth gate, which needs your
sign-off before wiring up (an account, a database provider, etc.).

## Local development

```bash
npm install
npm run dev
```
