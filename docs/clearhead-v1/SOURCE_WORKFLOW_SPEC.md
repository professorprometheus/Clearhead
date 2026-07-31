# Clearhead — Full Workflow Spec (v1)

## Purpose
This document specifies every screen, transition, data model, and piece of copy needed to build Clearhead v1. It exists so an AI coding tool (Codex) has zero ambiguity to fill in on its own.

## Structure
1. Popup — quick actions, opened via extension icon
2. Side Panel — fuller in-browser view (Dashboard, Spaces, Stacks, Settings)
3. Web app (Next.js) — marketing/landing site, pricing page, auth, account/billing
4. Server / data layer — schema, auth flow, sync mechanics, downgrade handling

Voice for ALL copy (landing page and in-app): **blunt/utilitarian**. Short, concrete sentences. No metaphor, no abstract "attention/momentum" language. In-app copy is strictly neutral and functional — no personality, no marketing tone. Landing page can be slightly more persuasive but stays concrete (no "one uninterrupted loop" style phrasing).

## Free vs Pro — feature split (reference for all sections below)
**Free:**
- Quick Focus (no account required)
- Strict mode, Check-In mode
- 1 Space (the default one)
- Unlimited Stacks
- Today's stats: focus time, streak, distractions blocked
- Local-only storage, no sync
- Data export (JSON) — free regardless of plan

**Pro (paid monthly subscription):**
- Unlimited Spaces
- Standard/blocklist mode (entirely gated — not available on the free Space at all)
- Route-aware blocking (e.g. block youtube.com/shorts without blocking all of YouTube)
- Scheduled Focus (auto-activate a Space on a schedule, with optional break windows)
- Cross-device sync
- Weekly/historical trend charts
- Reopen-rate insights + archive suggestions

**Trial:** 30 days, full Pro feature set EXCEPT sync (sync stays off during trial to avoid orphaned server data on downgrade). No account/signup required at install — the trial/signup prompt only appears contextually, the first time a free user hits a Pro-gated action (creating a 2nd Space, enabling blocklist mode, etc).

**On downgrade (trial ends or subscription cancelled):**
- Stats (streak, focus time, distractions blocked) are kept forever, shown locked with real numbers ("Your 12-day streak — upgrade to keep tracking").
- Synced Stack content stops syncing immediately.
- Server-side synced Stack data is deleted after a 14-day grace period. This is an ACTIVE nudge, not silent — shown both in the extension and in the web app's account page ("Your synced data will be deleted in 14 days — resubscribe to keep it").
- Local device data is never touched — Stacks/Spaces continue working locally regardless of plan.

---

## 1. POPUP

### 1.1 First-ever open (no Stacks exist yet)
Single primary action:
- **Start Focus** — launches the Focus flow (see 1.2)

Persistent footer nav (always visible, all popup states):
- **Spaces** → opens Side Panel to Spaces section
- **Dashboard** → opens Side Panel to Dashboard section

No empty-state messaging beyond this. Nothing else is shown on first open.

### 1.2 Start Focus flow
One flow handles both Quick Focus and Space-based focus — the only difference is which Space is selected.

Screen fields, in order:
1. **Space** — selector, defaults to "Default" (Quick Focus behavior). Tapping lets the user pick any existing Space instead.
2. **Outcome** — free text field. Label: "What are you working on?"
3. **Mode** — options shown depend on the selected Space:
   - **Strict** — always available. Only currently open tabs usable; no new tabs or domains.
   - **Check-In** — always available. New domains trigger an interrupt asking if the site is related.
   - **Standard (blocklist)** — only available if the selected Space has a blocklist AND the user is Pro. Never available on the Default Space.
4. **Duration** — dropdown, default 25 minutes.
5. **Close unrelated tabs** (optional, collapsible) — list of currently open tabs, all pre-checked (marked to close). User unchecks any tab they want to keep open. Manual only — no AI guessing, no AI functionality anywhere in v1.
6. **[Start Focus]** button.

On start:
- Selected-to-close tabs close.
- `space_activated` logged (for whichever Space was selected — Default or named).
- If a different Space was already active, it deactivates automatically first (single active Space at a time); open tabs are never touched by this switch.
- Mode-specific enforcement begins.
- Timer starts.

### 1.3 During Focus (popup view when reopened mid-session)
Shows:
- Outcome text (read-only)
- Time remaining
- **[Stop Focus]** button

### 1.4 Check-In mode interrupt
Triggered when a new domain is visited during an active Check-In session.

> "You're focusing on: [outcome]. Is [domain] related?"
> [Continue] [Go Back]

- Continue → domain trusted for remainder of session, no further interrupts for that domain. No event logged toward distractions blocked (it wasn't blocked).
- Go Back → navigation cancelled, previous tab/state restored. Logs a `checkin_declined` event, which COUNTS toward the "distractions blocked" stat.

### 1.5 Focus session ends (timer completes or user stops)
> "Session complete. [X] minutes focused."

Prompt:
- **Save as Stack?** — text field pre-filled with the outcome text, editable.
- **[Save Stack]** / **[Discard]**

If saved: Stack created containing the tabs open at end of session + outcome text + session history reference, assigned to whichever Space was active during the session.

`space_deactivated` logged. Session duration added to today's focus time total.

### 1.6 Return visit (Stacks now exist)
Popup shows:
- **Recent Stacks** (most recent 2–3, list) — each: name, **[Focus Now]** (restores + starts focus), tap opens restore options (see 1.7)
- **View all Stacks** → opens Side Panel directly to the Stacks section (contextual link, only shown here)
- **Start Focus** still available as primary action
- Persistent footer nav (Spaces, Dashboard) still present

### 1.7 Restore a Stack (inline in popup, single panel)
Triggered by tapping a Stack (from Recent Stacks or the Side Panel's Stacks list).

Single panel, shown inline — no separate screens:
- **Add to current tabs** / **Swap in** — checkbox, pre-checked to the user's last choice.
  - Add: restored Stack's tabs open alongside current tabs. Nothing closes.
  - Swap: current tabs are first auto-parked into a new Stack (auto-named, e.g. "Unsorted – [date]"), then closed, then the restored Stack's tabs open.
- **Switch to [Space name]?** — checkbox, ONLY shown if Swap is selected AND the restored Stack belongs to a different Space than the currently active one. If shown and checked, the current Space deactivates and the Stack's Space activates (tabs are never affected by this, only blocking rules).
- **[Restore]** button.

---

## 2. SIDE PANEL

### 2.1 Dashboard
Free (always visible):
- Today's focus time
- Current streak
- Distractions blocked today (includes both blocklist blocks and Check-In "Go Back" events)

Pro (visible to Pro users; visible-but-locked with real numbers to free/downgraded users, per the downgrade behavior above):
- Weekly/historical trend chart (focus time per day)
- Reopen-rate insights ("You haven't reopened 'Client X' in 2 weeks — archive it?")

Dropped from the original Codex build: "Outcomes" count and "Tabs now" live counter — neither maps to a defined metric; not included in v1.

### 2.2 Spaces
List of Spaces. Free: 1 (the Default Space, renameable). Pro: unlimited, with a "+ New Space" action once on Pro.

Each Space's detail view:
- Name (editable)
- **Blocklist** — list of blocked domains/routes, add/remove. Pro-only; free users see this section locked with an upgrade prompt. Supports route-aware entries (e.g. `youtube.com/shorts` without blocking all of `youtube.com`) — Pro-only.
- **Scheduled Focus** — Pro-only. Optional schedule: days of week + start/end time, auto-activates/deactivates the Space at those times using the same `space_activated`/`space_deactivated` events as manual activation. Supports one or more break windows within the schedule (e.g. a lunch break) during which blocking pauses automatically, then resumes without user action.
- **Start Focus** button — shortcut, pre-scoped to this Space, jumps straight to mode/duration selection (same underlying flow as 1.2, Space pre-filled). Works with zero Stacks — a Space can be focused on standalone.

### 2.3 Stacks
Full list, searchable. Each Stack: name, which Space it belongs to (dropdown, reassignable — user can move a Stack to any Space at any time), tab count, last restored date, restore action (opens the same panel as popup 1.7), archive/delete.

### 2.4 Settings
- **Account** — sign in / create account (routes to web app auth), currently signed in as, sign out
- **Data** — export data (JSON: Spaces, Stacks with tab lists, blocklists — free for all plans), import data, reset local data
- **Focus defaults** — default duration, default mode, default Add-vs-Swap behavior
- **Notifications** — completion notifications toggle
- **Theme** — dark / light
- **Plan** — current plan (Free / Trial / Pro), upgrade link (routes to web app billing/checkout), if on Pro: manage billing link. If downgrading/grace-period active: shows the same 14-day countdown notice as the extension.
- **Danger zone** — delete account (separate from "reset local data," which only clears the local device)

---

## 3. WEB APP (Next.js)

### 3.1 Landing page
- **Hero**: "Turn open tabs into finished work." Subheading: "Park distracting tabs. Block distracting sites. Restore where you left off." Primary CTA: **"Add to Chrome — free"** (no signup implied or required).
- **How it works**: 3–4 short steps (Park → Focus → Block → Restore), blunt one-line descriptions each, no metaphor.
- **Pricing** is its own separate page (linked from nav), not a landing page section.
- **Footer**: standard links.

### 3.2 Pricing page (separate page)
Two columns, Free vs Pro, listing the exact feature split from the "Free vs Pro" reference section above. CTA on Free column: "Add to Chrome — free". CTA on Pro column: "Start free trial" (this is where account creation actually happens, for users who want to go Pro immediately rather than trying free first).

### 3.3 Auth pages
Sign in / Create account. Standard email or OAuth. Reached both directly from pricing page and from the extension's Settings → Account.

### 3.4 Account / Billing page
- Current plan, trial countdown (if applicable)
- Upgrade / downgrade / cancel
- Payment method management
- Sync data status, including the 14-day grace-period countdown notice on downgrade (mirrors the extension's notice)

---

## 4. SERVER / DATA LAYER

### 4.1 Stack
Postgres via a managed host (e.g. Supabase or Neon). Server itself: Next.js API routes talking to Postgres — no separate backend service.

### 4.2 Schema
- `users` — id, email, plan (free/trial/pro), trial_ends_at
- `spaces` — id, user_id, name, created_at
- `blocklist_entries` — id, space_id, domain (supports route-level entries e.g. `youtube.com/shorts`)
- `stacks` — id, user_id, space_id (nullable, reassignable), name, tabs (JSONB array of {title, url}), created_at
- `events` — id, user_id, type (space_activated | space_deactivated | stack_parked | stack_restored | stack_archived | block_triggered | checkin_declined), space_id (nullable), stack_id (nullable), domain (nullable), timestamp

### 4.3 Auth flow
Extension opens the web app's sign-in page in a new tab → user signs in (email or OAuth) → web app issues a token → extension picks it up via a short-lived handoff (message back to extension, or polling a "check session" endpoint) → extension stores the token locally, uses it on subsequent API calls.

### 4.4 Sync mechanics (Pro only, not available during trial)
- On any local change (Space created, Stack parked, blocklist edited), Pro clients push the change to the server (immediate or lightly batched).
- On extension startup, pull latest state from server.
- Conflict handling: last-write-wins by timestamp.

### 4.5 Downgrade handling
- Event log / stats: kept indefinitely (cheap to store, needed for the locked-stats loss-aversion display).
- Synced Stack content: sync stops immediately on downgrade; server-side copies deleted after 14 days; active nudge shown in both extension and web app account page during the grace period.
- Local device data: never affected, regardless of plan or sync status.

### 4.6 Cost principle
Target: total app expenditure under 10% of revenue. Free-tier users cost ~$0 in server terms (no sync, no server-stored Stack data — only a minimal auth record). Server costs scale with paying users, not total installs.
