# Ideas backlog

A running list of where Tend could go next. Organized by theme, roughly
prioritized (P1 = next, P2 = soon, P3 = later / needs more infra). Nothing
here is committed — it's raw material to pull from as the app earns its
keep.

## Shipped in v2 (for reference)

- Unified `todayAgenda()` — one calm, globally-capped stream instead of three
  separately-uncapped sections.
- Flat, de-chromed Today rows; single accent color; neutral, guilt-free
  overdue language ("when you can" instead of "3 days overdue").
- Append-only `events[]` log + a quiet streak indicator.
- Guilt-free "not today" snooze on tasks.
- `.ics` calendar export (single-occurrence for completion-anchored chores,
  recurring `RRULE` for people cadences) + Google Calendar quick-add links.
  No backend or OAuth required.

## Theme: Calm & Focus

- **P2** Single-focus mode — show exactly one card at a time; completing it
  slides in the next. The strongest lever for someone who feels overwhelmed.
- **P2** "Not today" / snooze extended to chores and contact nudges, not just
  tasks.
- **P2** Time-to-clear estimate at the top of Today, derived from each
  task's `effort` field ("about 40 minutes today").
- **P3** Adaptive daily budget — learn how much actually gets cleared most
  days and stop overfilling automatically.
- **P3** "Quiet day" mode — deliberately surface only 2-3 things on days that
  need it (manual toggle first, smart detection later).

## Theme: Momentum & the garden metaphor

The app is called *Tend* — lean into it as the emotional throughline.

- **P2** Garden/plant visualization that grows with consistency; a
  relationship that's overdue could visually "wilt" and perk back up the
  moment you reach out, replacing a scary red number with something kinder.
- **P3** Momentum heatmap ("tending calendar", GitHub-contribution-graph
  style) built from `events[]`.
- **P3** Gentle milestones ("kept up with Mom for 3 months straight").
- **P3** Streak freeze / grace day so one missed day doesn't erase momentum —
  the kind version of streak mechanics.

## Theme: Frictionless capture

- **P2** Natural-language quick-add — "call mom tomorrow at 5", "water
  plants every sunday" — parsed into date/recurrence/category. Should be a
  small, pure, portable parser (no heavy deps) so it survives a future
  native rewrite.
- **P3** Voice capture (Web Speech API today; native mic once wrapped).
- **P3** iOS/Android Share Target — share a phone number, address, or link
  straight into Tend. Works as a PWA `share_target` now; native share sheet
  once wrapped in Capacitor/native shell.

## Theme: People / relationships (the strongest differentiator — go deeper)

- **P2** Birthdays & key dates with lead-time nudges.
- **P2** Per-contact interaction history/timeline (already logged in
  `interactions[]` — just needs a surface).
- **P2** "Things to remember" notes per person (kid's names, the trip they
  mentioned) so a catch-up call has something to open with.
- **P3** Relationship health shown as a plant/garden state instead of a
  red overdue number.
- **P3** Tap-to-act — deep-link `tel:` / `sms:` from a contact row so
  logging a call and *making* it are the same tap.

## Theme: Chores — context-aware

- **P2** Weather-aware surfacing (don't suggest window-cleaning or outdoor
  chores on a rainy day; nudge toward indoor ones instead).
- **P3** Seasonal / low-frequency bucket for things like "change smoke alarm
  batteries" or "flip the mattress" that don't fit a tight recurrence.
- **P3** "While you're at it" batching — finishing one kitchen chore gently
  offers the next kitchen chore.
- **P3** Chores that consume supplies (e.g. "replace filter") can drop the
  replacement item straight onto the grocery list.

## Theme: Errands & location

- **P3** Batch errands by area ("3 errands, all downtown — good time to
  run them together").
- **P3** Geofenced reminders ("you're near the pharmacy") — realistically
  only possible once wrapped as a native app with location permissions.

## Theme: Time & calendar

- **P2** Embed `VALARM` reminders more richly in exported events.
- **P3** Native local notifications via a Capacitor/iOS wrap — this is the
  *real* long-term reminder channel (no backend needed at all) since PWA
  push notifications are unreliable on iOS Safari. Calendar export is the
  stopgap; local notifications are the destination.
- **P3** Energy/effort-aware scheduling suggestions ("deep" tasks in the
  morning, "quick" ones for dead time between things).
- **V3 — needs infra** True two-way Google Calendar sync via OAuth. Requires
  a backend, a database (to store tokens), and a Google Cloud OAuth client,
  which means the user has to create a Google Cloud project first — a
  credential step that can't be done autonomously.
- **V3 — needs infra** A subscribable/auto-updating `webcal://` feed. Sounds
  like a lighter middle ground than OAuth but actually needs the same
  server-side data storage, so it's gated on the same infra.

## Theme: Groceries (currently the flattest surface — most upside)

- **P2** Recurring "usuals" — re-add common staples in one tap.
- **P3** Aisle/category grouping for an actual shopping run.
- **P3** Pantry / running-low tracking that feeds the list automatically.
- **P3** Meal → ingredients — plan a couple of meals, auto-populate the
  grocery list.

## Theme: Reflection rituals

- **P2** Weekly review ("Sunday tend") — a 2-minute guided look back at what
  got tended, who got reached out to, what to carry into next week. Powered
  entirely by `events[]`.
- **P3** End-of-day wind-down — pick tomorrow's one intention before closing
  the day.
- **P3** Monthly "looking back" summary — gentle stats, not productivity
  guilt.

## Theme: Notifications & digest

- **P2** Morning digest — a single sentence summarizing the day, in-app
  first, push once wrapped natively.
- **P2** Quiet hours / do-not-disturb windows.
- **P3** Smart snooze — suggest a sensible re-surface time based on item
  type instead of always "tomorrow".

## Theme: Household / shared

- **P3 — needs infra** Shared household mode — assign chores, see who did
  what. Needs real sync (backend + auth), so it's gated behind the same
  infrastructure decision as calendar OAuth. Worth designing the `events`
  and future ownership fields with this in mind now, so it doesn't require
  a repaint later.

## Theme: Data, portability & the iOS path

The user plans to eventually wrap this as a native iOS app once the web
version "hits the right spot" — keep that in mind for every decision below.

- **P2** Manual export/import (JSON) for backup and device migration —
  cheap insurance while there's no backend at all.
- **P2** Keep all business logic (`selectors.ts`, `store.ts`, `date-utils.ts`,
  `ics.ts`) as pure, framework-agnostic functions so a Capacitor or React
  Native shell can reuse them verbatim without a rewrite. This boundary is
  worth protecting deliberately as new features get added.
- **P3** Capacitor shell wrapping the existing PWA — unlocks local
  notifications, the native share sheet, geofencing, and native calendar
  write access, without needing a backend.

## Theme: Personalization & delight

- **P3** Learn rhythms ("you usually do laundry on Sundays") and anchor
  suggestions there instead of a fixed recurrence.
- **P3** Seasonal / time-of-day theming layered on the existing warm
  palette.
