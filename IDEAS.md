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

## Shipped in v3 (for reference)

The overwhelm had moved from Today into the app's total surface area — five
peer nav destinations, each with its own brand color, plus 3-4 visible
buttons per row. v3 addressed that directly:

- Collapsed all four domain accent colors (people/chores/tasks/groceries)
  into the single warm terracotta palette — domain identity now lives on the
  icon, not a competing hue, so the whole app reads as one product again.
- Homogenized every Today row to one shared skeleton: title + subtext, one
  obvious primary action, one kebab overflow menu holding everything else
  (log type, calendar export, snooze). A contact row went from 4 always-
  visible buttons down to 1 primary + overflow.
- Extended "not today" snooze to chores and contacts, not just tasks (all
  three now live in that same overflow menu).
- Added a quiet time-to-clear estimate under the date ("about 35 minutes
  today"), derived from each task's `effort` field, to bound the day into a
  finishable commitment instead of an open-ended list.
- Added a Focus/List toggle — Focus mode shows exactly one card at a time
  with quiet progress dots for what's left, reusing `todayAgenda()`'s order
  verbatim.
- Replaced the streak flame with a growth-stage icon (seedling → flower →
  tree as the streak grows), tying momentum back to the "Tend" name instead
  of a generic gamification badge.
- Nav: demoted People/Chores/Tasks/Groceries beneath a quiet "Manage" label
  so Today reads as home base and the rest read as drawers, not peer tabs.

## Shipped in v4 (for reference)

- Fixed Focus mode's progress indicator — the dots looked like clickable
  carousel navigation but did nothing; replaced with a plain, honest line
  ("Just this — 3 more after it").
- Manual JSON export/import via a small gear icon on Today (opens a dialog,
  not a new nav destination) — cheap backup/portability insurance while
  there's no backend.
- Birthdays on contacts (optional "MM-DD"): shown on the People page, and
  surfaced as a gentle Today nudge in the days leading up to it — reusing
  the existing contact row/agenda-item shape rather than adding a new kind.
- Groceries "usuals" — star an item to save it; a quiet chip tray re-adds
  common staples in one tap instead of retyping them each week.

## Shipped in v5 (for reference)

- Fixed a real bug, not just a UX one: every hover-reveal action button (star
  a grocery item, the chore/task/agenda-row overflow menu, task/chore row
  delete) was invisible on touch devices — `opacity-0` with no fallback for
  screens that can't hover. This is very likely why the grocery star felt
  broken. Scoped the hide-until-hover behavior to `@media (hover: hover)` so
  touch always shows these controls, desktop keeps the decluttered hover
  reveal.
- Added a real automated test suite (Vitest + React Testing Library):
  111 tests across the pure `lib/` layer (date-utils, selectors, ics), the
  Zustand store's actions, and the key interactive components (agenda row
  primary actions, groceries page incl. the star/usuals flow, contact/chore/
  task dialogs, settings import/export). `npm test` runs it; a GitHub
  Actions workflow (`.github/workflows/ci.yml`) now runs typecheck + tests +
  build on every push/PR.
- While adding tests, replaced the "populate form fields in a `useEffect`
  when a dialog opens" pattern (contact/chore/task dialogs) with React's
  documented effect-free alternative — adjusting state during render instead
  of in an effect. Caught and fixed a real bug this introduced along the way
  (a dialog mounted already-open skipped its initial pre-fill) before it
  shipped, specifically because the new tests exercised that path.

## Theme: Calm & Focus

- **P3** Adaptive daily budget — learn how much actually gets cleared most
  days and stop overfilling automatically.
- **P3** "Quiet day" mode — deliberately surface only 2-3 things on days that
  need it (manual toggle first, smart detection later).

## Theme: Momentum & the garden metaphor

The app is called *Tend* — lean into it as the emotional throughline.

- **P3** Momentum heatmap ("tending calendar", GitHub-contribution-graph
  style) built from `events[]`.
- **P3** Gentle milestones ("kept up with Mom for 3 months straight").
- **P3** Streak freeze / grace day so one missed day doesn't erase momentum —
  the kind version of streak mechanics.
- **P3** Relationship health shown as a wilt/perk garden state per contact
  instead of a red overdue number (deepens the growth-icon idea shipped in
  v3 down to the individual person level).

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

- **P2** Per-contact interaction history/timeline (already logged in
  `interactions[]` — just needs a surface).
- **P2** "Things to remember" notes per person (kid's names, the trip they
  mentioned) so a catch-up call has something to open with.
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

## Theme: Groceries

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
