# Proposal: bug review + the voice‑to‑task flagship

_Author: engineering review · Date: 2026‑07‑22 · Status: draft for review_

This document triages the six open issues and lays out a concrete plan for
each, with a deep design for the flagship one — **voice‑to‑task (#6)**.
Nothing here is committed to code yet; it's a plan for you to react to before
we build.

---

## 0. The north star (why this matters)

Everything below is judged against one goal:

> **People should _want_ to open Tend, and capturing life should feel so
> effortless that it becomes second nature.**

Tend already wins on the _philosophy_ (calm, guilt‑free, relationship‑first,
completion‑anchored chores). The thing that decides whether it becomes a daily
habit is **capture friction** and **trust**:

1. **Friction** — the moment between "I just thought of something" and "it's
   safely in Tend" has to be near‑zero. Typing a task, picking a category, and
   setting a date is four decisions. Speaking a sentence is zero. Voice is the
   single highest‑leverage feature for making Tend a habit, which is why #6 is
   the flagship and the rest of this doc builds toward it.
2. **Trust** — capture is only effortless if you _believe_ the thing landed
   somewhere you'll see it again. Issue #4 ("where did my errand go?") is the
   same problem in miniature: today you can add something and it silently
   vanishes from view. If voice adds five things at once, that trust problem
   multiplies by five. **So the bug fixes below aren't a separate track from
   voice — several of them are prerequisites for voice feeling trustworthy.**

---

## 1. TL;DR recommendation

- Ship the **five small bug/UX fixes (#1–#5) first** as one focused pass. They
  are low‑risk, high‑ratio, and two of them (#4 capture feedback, and the
  reschedule affordance in #1) are groundwork the voice feature reuses.
- Build voice‑to‑task in **three phases**, and — importantly — **the parser,
  not the microphone, is the hard part.** Voice = _speech‑to‑text_ +
  _text‑to‑structured‑items_ + _review/confirm_. The middle step is a small,
  **pure, on‑device, dependency‑light parser** we own. It runs with zero
  network and zero cost, works even when typed (not just spoken), and survives
  the eventual native rewrite. AI models are an _optional confidence booster_
  layered on top, never a hard dependency.
- **Recommended intelligence stack:** on‑device speech‑to‑text (free, already
  in the browser) → our deterministic parser (free, private, offline) → an
  _optional_ on‑device / cheap‑cloud LLM assist only for low‑confidence
  fragments. This keeps cost at ~$0 for the common case and honors the "cheapest
  way possible" ask in the issue.

---

## 2. Issue triage at a glance

| # | Title | Type | Severity | Effort | Root cause (from code) | Prereq for voice? |
|---|-------|------|----------|--------|------------------------|-------------------|
| 2 | `+` icon vs submit button confusion | UX bug | Low | XS | `quick-capture.tsx` renders a decorative `Plus` on the left; real submit is the "Add" button | — |
| 3 | Grocery title looks different from home link | UI bug | Low | XS | Likely already unified on `PageHeader`; needs repro | — |
| 1 | Can't reschedule a scheduled task from the list | UX gap | Med | S | `AgendaRow` task overflow only has "Add to calendar" + "Not today" | ✅ reused by voice review UI |
| 4 | Unclear where a quick‑added "Errand" goes | UX gap | **High** | S | Errands score ~10 in `todayAgenda`; below the budget cut, so they never appear on Today and there's no "it went to Tasks → Errands" feedback | ✅ same trust problem voice must solve |
| 5 | People tab is a long, overwhelming list | Enhancement | Med | M | `people/page.tsx` only splits "Needs attention / On track"; no relationship filter or search | — |
| 6 | Voice → tasks with auto‑categorization | **Flagship** | — | L | New capability; builds on existing P2 NL‑parse + P3 voice backlog items | — |

Effort key: XS < S < M < L (roughly: hours / half‑day / 1–2 days / multi‑day).

---

## 3. The small fixes (#1–#5)

### #2 — Remove the leading `+` icon in Quick Capture (XS)

**Where:** `src/components/quick-capture.tsx:46`.

Today the row is `[ + ]  input …………  [ Add ]`. The `Plus` is purely decorative
but reads like a second, competing button. The real submit is the "Add"
button (the confusing _arrow_ the issue mentions has already been replaced with
a text label in a prior version).

**Fix:** delete the leading `Plus` icon. One obvious submit, no ambiguity.
Optionally move a small mic icon into that spot later (see #6) so the left slot
earns its keep instead of being decoration.

### #3 — Grocery header consistency (XS, needs repro)

**Where:** `src/app/groceries/page.tsx` uses the shared `PageHeader`; the
Today page's grocery _link_ (`src/app/page.tsx`) routes to that same page.

Reading the current code, `/groceries` already renders the same `PageHeader`
(`text-2xl … sm:text-3xl`) whether reached from the nav or the home link, so
this looks **already resolved by the v3 header unification.** Before spending
effort: reproduce on the deployed build. If it's genuinely fixed, close the
issue with a note and add a lightweight snapshot/regression test so it can't
regress. If it still repros, it's almost certainly a client‑nav layout shift
worth a real look — but let's not fix a ghost.

### #1 — Reschedule a scheduled task directly from the Today list (S)

**Where:** `src/components/agenda-row.tsx` (task branch, ~line 183). The
overflow menu only offers **Add to calendar** (when `dueDate` exists) and
**Not today** (which snoozes to tomorrow via `snoozeTask`). There is no way to
move a task to a _chosen_ date without opening the full editor on the Tasks
page.

**Fix:** add a **Reschedule** group to the task overflow menu with quick
presets and a date picker:

- Today · Tomorrow · This weekend · Next week · **Pick a date…**
- Each calls `updateTask(id, { dueDate })` (the store action already exists).

This is small, and it doubles as a building block: the **voice review UI reuses
the exact same date‑preset control** for adjusting a parsed item's date, so
building it now pays for itself twice. Consider factoring it into a shared
`<DatePresetMenu onPick={…} />`.

### #4 — Make it obvious where a quick‑added item went (S) — _high value_

**The real bug:** a quick‑added **Errand** (or plain Task) with no due date and
not marked important gets a `todayAgenda` score of ~10 (`selectors.ts`), far
below contacts (150+), chores (140+), and dated tasks (300+). With a Today
budget of 6, it **never appears on Today.** It lands silently in
**Tasks → Errands**, a screen the user may not think to check. From the user's
seat: "I added it and it disappeared." That's the trust leak that makes people
stop relying on the app.

**Fix (two parts):**

1. **Actionable confirmation.** The current toast just says "Added". Make it say
   where it went and let the user jump there:
   `Added to Tasks → Errands` with a **View** action that deep‑links to
   `/tasks?filter=errand`. (The Tasks page already has category tabs; wire the
   filter to a query param.)
2. **Optional "surface it sooner" nudge.** For items captured with no date, offer
   a one‑tap "Do today?" in the confirmation that sets `dueDate = today` so it
   joins the Today stream. Keeps the calm default (don't auto‑cram Today) while
   giving fast escape velocity when the user _does_ want it front‑and‑center.

This directly de‑risks voice: the voice review screen (below) is the same idea
scaled up — always show the user _exactly_ where each captured thing is going.

### #5 — Organize the People tab (M)

**Where:** `src/app/people/page.tsx` currently renders two flat buckets
("Needs attention" / "On track"). With more than a handful of contacts it
becomes a wall.

**Proposed, in order of value:**

1. **Relationship filter chips** — All · Family · Friends · Work · Other
   (the `relationship` field already exists on `Contact`). Same visual language
   as the Tasks category tabs, so it feels native.
2. **Search box** — filter by name; trivial and high‑relief once the list is long.
3. **Keep the "Needs attention" group pinned to the top** within whatever filter
   is active — the relationship‑health signal is Tend's differentiator and
   shouldn't be filtered away.
4. _(Later, ties to backlog)_ a sort toggle (most‑overdue / alphabetical / by
   cadence) and the garden "wilt/perk" per‑contact health state already in
   IDEAS.md.

Keep it to filter + search for v1; don't over‑build a CRM.

---

## 4. The flagship: voice‑to‑task (#6)

### 4.1 What the issue is really asking for

From the issue, the target interaction is: the user speaks one natural sentence
containing **several different kinds of things**, and Tend files each one in the
right place automatically. The worked example:

> _"I need to call back John sometime this week, pickup more onions, do window
> cleaning on Thursday, and attend Jessi's graduation at 5pm on Wednesday."_

Should become **four items, correctly routed:**

| Fragment | → Kind | → Fields |
|----------|--------|----------|
| "call back John sometime this week" | **Task · Call** | title "Call back John", context `phone`, dueDate = end of this week |
| "pickup more onions" | **Grocery** | item "onions" |
| "do window cleaning on Thursday" | **Task** (offer: make recurring **Chore**) | title "Window cleaning", dueDate = this Thursday |
| "attend Jessi's graduation at 5pm on Wednesday" | **Calendar event** | title "Jessi's graduation", dueDate = Wednesday, **time 17:00** |

Two structural facts fall out of that example:

- We need a **clear, shared category taxonomy** the parser targets (the issue
  says this explicitly). See 4.2.
- The current data model has a **gap**: tasks have a `dueDate` (date only) but
  **no time‑of‑day**, so "at 5pm" has nowhere to live. See 4.5.

### 4.2 The category taxonomy (the routing target)

Map every captured fragment to exactly one of these, reusing existing entities
wherever possible so we don't fragment the model:

| Category | Existing entity | Trigger cues (examples) |
|----------|-----------------|-------------------------|
| **Grocery** | `GroceryItem` | "buy", "pick up / pickup", "get more", "we're out of", "add … to the list" |
| **Call / text** | `Task{category:"call"}` (+ link to `Contact` if name matches) | "call", "text", "ring", "reach out to", "get back to \<name\>" |
| **Chore (recurring)** | `Chore` | "every / each \<interval\>", or a known recurring‑household verb ("water the plants", "take out trash", "vacuum") without a one‑off date |
| **Calendar event (timed)** | `Task` + new `dueTime` | has an explicit clock time ("at 5pm", "9:30"), or event verbs ("attend", "meeting", "appointment", "graduation", "dinner with") |
| **Task / errand (default)** | `Task{category: errand \| general}` | everything else; "out & about" verbs ("return", "drop off", "pick up \<non‑food\>") → `errand` |
| **Someday** | `Task{category:"someday"}` | "someday", "eventually", "at some point", no date |

Design rule: **when unsure, degrade to a plain dated Task** (the safest,
most‑visible bucket) and let the review UI fix it — never silently drop a
fragment.

### 4.3 Architecture — a four‑stage pipeline

```
 ┌───────────┐   ┌──────────────┐   ┌─────────────────┐   ┌──────────────┐   ┌──────────┐
 │  Capture  │→ │  Transcribe   │→ │  Parse           │→ │  Review /     │→ │  Commit   │
 │  (mic /    │   │ speech→text  │   │ text→items[]     │   │  confirm UI   │   │ to store  │
 │  typed)    │   │ on‑device    │   │ pure module      │   │  (edit/route) │   │ batch add │
 └───────────┘   └──────────────┘   └─────────────────┘   └──────────────┘   └──────────┘
```

The important insight: **only stage 3 is novel work we own, and it's pure
logic.** Stage 2 is a platform API. Stages 1/4/5 are thin UI + existing store
actions. Keeping the parser a **pure, framework‑agnostic module**
(`src/lib/nl-parse.ts`) matches the existing IDEAS.md P2 constraint and the
project's stated iOS‑native ambition — the same parser runs verbatim in a
Capacitor/React‑Native shell later. This is also why the feature works
**typed, not just spoken**: the parser is the product; the mic is one input to
it.

### 4.4 On‑device intelligence — options, cost, privacy

The issue asks for on‑device intelligence "if possible, else the cheapest way."
Split the question into the two model‑ish stages:

**Stage 2 — Speech → text**

| Option | On‑device? | Cost | Notes |
|--------|-----------|------|-------|
| **Web Speech API** (`SpeechRecognition`) | Platform‑dependent | Free | Built into the browser. **iOS/Safari uses Apple's on‑device dictation.** Desktop Chrome historically streams audio to Google servers — so "fully on‑device" is _not_ guaranteed on every platform. Be honest about this in the mic UI. |
| **Native speech (Capacitor/Apple Speech, Android SpeechRecognizer)** | ✅ Yes | Free | The real on‑device answer; available once wrapped natively (already on the roadmap). |
| Cloud STT (Whisper API, Deepgram, etc.) | ❌ No | ~$ | Only if we ever need higher accuracy; not recommended for v1. |

**Recommendation:** use the **Web Speech API** now (free, zero infra, already
on the P3 backlog) and upgrade to **native on‑device speech** when the iOS wrap
happens. No cloud STT.

**Stage 3 — Text → structured items**

| Option | On‑device? | Cost | Recommendation |
|--------|-----------|------|----------------|
| **Our deterministic parser** (regex/keyword + date math) | ✅ 100% | $0 | **Primary.** Handles the vast majority of real utterances; fully offline & private. |
| **Browser built‑in LLM** — Chrome Prompt API (`window.ai` / Gemini Nano), Apple Intelligence via native | ✅ Yes (where available) | $0 | **Optional booster** for low‑confidence fragments; feature‑detect and fall back gracefully. Availability is still uneven, so never depend on it. |
| **Cheap cloud LLM** (one small‑model call, e.g. Haiku‑class, structured‑output) | ❌ No | ~fractions of a ¢ / capture | **Opt‑in fallback only**, behind a clearly labeled toggle, used _only_ when the on‑device parser flags low confidence. Requires the backend the app doesn't yet have — so it's explicitly a later phase, not v1. |

**Net:** the common path is **$0 and fully private**. Intelligence models are a
graceful enhancement for the messy 10–20%, not the foundation. This is both the
cheapest and the most privacy‑respecting design, and it degrades safely when a
fancier model isn't available.

### 4.5 Data‑model changes required

Small and additive — no migration pain (Zustand `persist`, optional fields):

1. **`Task.dueTime?: string`** (`"HH:mm"`) — lets "at 5pm" survive. `ics.ts`
   already builds calendar events; extend it to emit a timed `VEVENT` when
   `dueTime` is present (today chores/tasks export as all‑day). This is what
   turns "Jessi's graduation at 5pm" into a real, exportable calendar entry —
   satisfying the "calendar event" category without inventing a whole new
   entity.
2. **Optional `Task.source?: "voice" | "quick" | "manual"`** — lightweight
   provenance so we can later measure how much capture voice actually drives
   (see success metrics).
3. **A batch store action `addMany(items)`** (or reuse existing per‑entity adds
   in a loop inside one `set`) so a single confirmed voice capture commits all
   items atomically and produces one undo.

Deliberately _not_ adding a separate "Event" entity — a timed `Task` covers it
and keeps the Today stream and Tasks page unified.

### 4.6 The parser design (`src/lib/nl-parse.ts`, pure)

```ts
export interface ParsedItem {
  kind: "task" | "chore" | "grocery" | "call" | "event";
  title: string;
  category?: TaskCategory;
  context?: Context;
  dueDate?: string;      // yyyy-MM-dd
  dueTime?: string;      // HH:mm
  recurrenceDays?: number;
  contactId?: string;    // if a known contact name matched
  confidence: number;    // 0..1 — drives whether we ask for confirmation / AI assist
  rawFragment: string;   // always kept, so nothing is silently lost
}

export function parseCapture(
  text: string,
  ctx: { contacts: Contact[]; usualGroceryItems: string[]; today: Date }
): ParsedItem[];
```

Pipeline inside the parser:

1. **Segment** the utterance into fragments — split on ", " / " and " /
   sentence boundaries, then re‑split on imperative verb boundaries so
   "pickup onions do window cleaning" becomes two items. This is the trickiest
   part; keep a solid unit‑test corpus of real dictations.
2. **Classify** each fragment against the 4.2 cue table (keyword + light regex).
   Grocery and call cues are strong; default to Task when weak.
3. **Extract date/time/recurrence** with a small, dependency‑light date grammar
   (leaning on the already‑present `date-fns`): "today / tomorrow /
   this week / Thursday / next Monday", "at 5pm / 5:30 / noon", "every
   Sunday / weekly". _Consider `chrono-node` only if hand‑rolling proves
   fragile — but weigh its bundle size against the "no heavy deps / portable"
   constraint; a targeted hand‑rolled grammar is preferred._
4. **Resolve entities** — match names against existing `contacts` (link the
   call to John if John exists) and food words against `usualGroceryItems`.
5. **Score confidence** per item; low‑confidence items are visually flagged in
   review and are the _only_ ones we'd optionally route to an AI assist.

Every fragment always yields an item (possibly a low‑confidence plain Task) —
**the parser never drops input.**

### 4.7 The review/confirm UI (the trust layer)

**Never auto‑commit voice output.** After parsing, show a compact confirmation
sheet — a list of proposed items, each a small card:

- Icon + kind badge (Grocery / Call / Chore / Task / Event) with a one‑tap
  dropdown to **re‑route** if the parser guessed wrong.
- Editable title, plus the **same date‑preset control built for #1**.
- Low‑confidence items gently highlighted ("Double‑check this one").
- A dismiss ✕ per item; the raw transcript stays visible so nothing feels lost.
- One **"Add all"** button → `addMany` → a single toast ("Added 4 things") with
  **Undo**.

This screen is where voice earns trust: the user _sees_ everything land in the
right place and can fix a mistake in one tap. It's issue #4's "show me where it
went" promise, scaled to a batch — which is exactly why #4 should be fixed
first, as the single‑item warm‑up.

### 4.8 Phased rollout

- **Phase 1 — Typed natural‑language quick‑add (no mic yet).** Build
  `nl-parse.ts` + the review sheet, wired to the existing Quick Capture box.
  Ship the parser and the trust UI first, fully testable, zero platform risk,
  zero cost. This alone is a real feature (IDEAS.md P2) and de‑risks everything
  downstream.
- **Phase 2 — Add the microphone.** Web Speech API feeds its transcript into
  the exact same parser + review sheet. A mic button (natural home: the left
  slot in Quick Capture vacated by removing the `+` in #2). Feature‑detect;
  degrade to typing where unsupported. Honest mic‑privacy note per platform.
- **Phase 3 — Intelligence assist + native.** Feature‑detect an on‑device LLM
  (`window.ai` / Apple Intelligence) for low‑confidence fragments; optionally a
  cheap opt‑in cloud fallback once/if a backend exists. In the Capacitor/native
  wrap, swap Web Speech for native on‑device speech for accuracy and true
  on‑device privacy.

Each phase is independently shippable and independently valuable.

### 4.9 Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Parser mis‑routes items | Review‑before‑commit + one‑tap re‑route; never auto‑commit |
| "On‑device" over‑promised (Chrome STT streams to Google) | Be explicit in the mic UI; reserve the strong on‑device claim for iOS/native |
| Date/recurrence parsing is where NL parsers rot | Big unit‑test corpus of real dictations; hand‑rolled grammar over a heavy dep; low‑confidence → flag, don't guess silently |
| Web Speech API browser support is uneven | Feature‑detect; typing is always the fallback (Phase 1 works with no mic at all) |
| Scope creep into a general assistant | Hard‑scope to the 4.2 taxonomy; "when unsure, make a Task" |
| Bundle bloat fighting the portability goal | Keep parser dependency‑light; measure bundle before adding `chrono-node` et al. |

### 4.10 How we'll know it worked (success metrics)

- **Capture share:** % of new items created via voice/NL vs. manual forms
  (enabled by the `source` field). Rising = friction is dropping.
- **Correction rate:** % of parsed items edited/re‑routed before commit. Should
  fall over time as the parser improves; a low rate = trust is earned.
- **Multi‑item captures:** average items per voice capture > 1 means people are
  using it the way the issue envisions (brain‑dump, not single reminder).
- **Retention proxy:** days/week with ≥1 capture — the real "second nature" signal.

---

## 5. Suggested sequencing

1. **Fix pass (½–1 day):** #2 (`+` icon), #3 (repro/close), #1 (reschedule menu
   → build the shared `DatePresetMenu`), #4 (capture feedback + deep‑link),
   #5 (People filter + search).
   _Why first:_ each is small, and #1's date control and #4's "show where it
   went" pattern are literal building blocks for voice.
2. **Voice Phase 1 (typed NL + review sheet):** the parser and the trust UI.
3. **Voice Phase 2 (mic):** Web Speech API into the same pipeline.
4. **Voice Phase 3 (AI assist + native on‑device speech):** as the native wrap
   and/or a backend land.

---

## 6. Open questions for you

1. **Chore vs. one‑off ambiguity** — for "do window cleaning on Thursday",
   default to a one‑off Task and _offer_ "make it recurring?", or try to detect
   recurring‑household verbs and default to a Chore? (Proposed: default Task,
   offer recurring — safer.)
2. **Calls & the People tab** — when a captured call names a known contact,
   should it also (or instead) create a nudge/interaction against that Contact,
   or just a Call task? (Proposed: Call task now, with an optional link; deeper
   contact integration later.)
3. **AI assist appetite** — are you comfortable with an _opt‑in_ cheap cloud
   fallback for messy captures (needs a small backend), or should we stay
   strictly on‑device / free until the native wrap unlocks a real on‑device
   model?
4. **Where voice lives in the UI** — reuse the Today Quick Capture box (mic in
   the vacated left slot), or a dedicated floating mic button? (Proposed: reuse
   Quick Capture — one capture surface, less to learn.)
```
