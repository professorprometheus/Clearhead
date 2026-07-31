# Clearhead V1 Acceptance Test Catalogue

A phase is not complete until its relevant acceptance tests pass. “Looks correct” is not evidence.

## Test levels

- **U** — unit test.
- **I** — integration test with mocked browser/server boundaries.
- **E** — real extension Playwright E2E.
- **W** — web/API integration or browser test.
- **M** — manual visual/accessibility review.

## A. Installation, migration and state

### CH-STATE-001 — Fresh local state
Level: U/E

Given no Clearhead storage, startup creates:

- schema version 3;
- one Default Space;
- zero Stacks;
- inactive Focus;
- default mode Check-In;
- default restore Add;
- no account requirement.

### CH-STATE-002 — V2 Workspace migration
Level: U

A V2 fixture with multiple Workspaces migrates every record to a Space with stable IDs, names, timestamps and blocklist data.

### CH-STATE-003 — V2 Session migration
Level: U

V2 Sessions migrate to Stacks without losing URLs, titles, pinned state, tab-group metadata, creation time or last-restored time.

### CH-STATE-004 — Legacy active Focus
Level: U/E

An active V2 Focus is not silently continued under an invented mode. Startup clears old rules, captures current context and creates a completion-pending migrated record.

### CH-STATE-005 — Migration rollback
Level: I

If V3 validation/startup reconciliation fails, the V2 backup remains recoverable and the invalid V3 state is not committed as successful.

### CH-STATE-006 — Legacy stats honesty
Level: U

Weekly/cumulative legacy stats are preserved as legacy totals and are not fabricated into daily streak data.

### CH-STATE-007 — Import rollback
Level: I/E

Invalid or rule-incompatible import leaves the previous state and active rule ownership unchanged.

### CH-STATE-008 — Export excludes credentials
Level: U/E

Export contains canonical product data but no bearer tokens, auth cookies, handoff secrets or migration backup.

## B. Entitlements

### CH-PLAN-001 — Free contract
Level: U

Free has one creatable Space, unlimited Stacks, Strict, Check-In, all durations, today stats and export/import. It does not have Standard, schedules, historical charts, insights or sync.

### CH-PLAN-002 — Trial contract
Level: U

Trial has every Pro capability except cloud sync.

### CH-PLAN-003 — Pro contract
Level: U

Pro has all capabilities.

### CH-PLAN-004 — Sixth/100th Stack on Free
Level: I/E

A Free user can create, rename, restore and archive more than five local Stacks.

### CH-PLAN-005 — Free second Space gate
Level: E

The second Space action opens the contextual trial/upgrade state; it does not create a Space before entitlement changes.

### CH-PLAN-006 — Default Standard unavailable
Level: U/E

Standard is absent for Default even for Pro and even when legacy blocklist entries exist.

### CH-PLAN-007 — Trial sync rejected
Level: W/I

Server sync endpoints return a plan error for Trial. The extension keeps local data queued/disabled without data loss.

### CH-PLAN-008 — Downgrade preserves local data
Level: I/E

Changing entitlement from Pro to Free does not remove or rewrite local Spaces, Stacks, Focus history or stats.

## C. Popup states

### CH-POP-001 — First popup
Level: E/M

Fresh profile popup shows only Start Focus and persistent Spaces/Dashboard footer navigation. No settings icon, plan badge, counts, Workspace selector or empty-state copy.

### CH-POP-002 — Footer Spaces deep link
Level: E

Spaces opens the side panel directly to Spaces.

### CH-POP-003 — Footer Dashboard deep link
Level: E

Dashboard opens the side panel directly to Dashboard.

### CH-POP-004 — Active Focus popup
Level: E/M

Popup shows outcome, remaining time and Stop Focus only, plus footer.

### CH-POP-005 — Completion popup
Level: E/M

Popup shows exact completion summary, editable Stack name and Save Stack/Discard. It shows after timer completion and manual stop.

### CH-POP-006 — Completion survives closure
Level: E

Close popup after Focus ends, reopen it, and the same completion state remains.

### CH-POP-007 — Completion survives browser restart
Level: E

Restart extension/browser context after Focus ends; completion prompt remains with immutable end snapshot.

### CH-POP-008 — Returning popup
Level: E/M

With Stacks, popup shows Start Focus, 2–3 Recent Stacks, Focus Now, View all Stacks and footer.

### CH-POP-009 — Recent ordering
Level: U/E

Rows order by most recent `lastRestoredAt`, falling back to creation/update as specified, and exclude archived/deleted Stacks.

## D. Focus setup and orchestration

### CH-FOCUS-001 — Field order
Level: E/M

Focus setup order is Space, outcome, mode, duration, Close unrelated tabs, Start Focus.

### CH-FOCUS-002 — Outcome required
Level: U/E

Blank/whitespace outcome cannot start. Maximum length is enforced.

### CH-FOCUS-003 — Mode availability matrix
Level: U/E

- Strict/Check-In always shown.
- Standard shown only for Trial/Pro, non-Default Space, non-empty blocklist.

### CH-FOCUS-004 — Custom duration Free
Level: E

Free can start an allowed custom duration within 1–1,440 minutes.

### CH-FOCUS-005 — Tab-close initial selection
Level: E

Opening Close unrelated tabs lists eligible current-window tabs and initially marks all for parking/closure.

### CH-FOCUS-006 — Strict requires kept tab
Level: U/E

Strict cannot start when no eligible tab would remain. No tabs close and no Focus state is written.

### CH-FOCUS-007 — Cleanup Stack before close
Level: I/E

Selected tabs are persisted as a `focus_cleanup` Stack before any close call. The Stack is assigned according to the Product Bible rule.

### CH-FOCUS-008 — Cleanup persistence failure
Level: I

Inject storage failure. Zero selected tabs close, Focus does not start and no activation event is written.

### CH-FOCUS-009 — Cleanup partial close failure
Level: I/E

If one selected tab cannot close, the Stack remains, Focus does not start, no rules remain active and the error reports the failure.

### CH-FOCUS-010 — Space switch does not touch tabs
Level: I/E

Starting Focus in a different Space deactivates/activates events and rules but only user-selected cleanup tabs change.

### CH-FOCUS-011 — Rule application rollback
Level: I

If applying mode rules fails, Focus returns inactive, alarm/rules clear, activation is reconciled and already parked tabs remain safely in their Stack.

### CH-FOCUS-012 — Duplicate Start operation
Level: I

Sending the same operation ID twice creates one Focus Session, one cleanup Stack and one alarm.

## E. Strict mode

### CH-STRICT-001 — Same-site navigation
Level: E

A protected original tab may navigate between paths/pages on an initially allowed site.

### CH-STRICT-002 — Typed new site
Level: E

Typing `tiktok.com` into an original tab is blocked and the last allowed state remains recoverable.

### CH-STRICT-003 — Link to new site
Level: E

Clicking a same-tab link to a new site is blocked.

### CH-STRICT-004 — Redirect to new site
Level: E

An allowed site redirecting to an unapproved site is blocked.

### CH-STRICT-005 — New blank tab
Level: E

Keyboard/menu-created new tab is closed immediately.

### CH-STRICT-006 — Target blank
Level: E

A link opening a new tab is closed even when its destination site was initially allowed.

### CH-STRICT-007 — Duplicate tab
Level: E

Duplicating an original tab creates a new tab and is blocked.

### CH-STRICT-008 — New window
Level: E

A script/user-created new window is closed where Chromium exposes control.

### CH-STRICT-009 — Closed original not replaceable
Level: E

After closing an original tab, opening a new tab does not inherit permission.

### CH-STRICT-010 — Site key semantics
Level: U/E

`docs.google.com` and `drive.google.com` share `google.com`; separate public-suffix sites do not collapse incorrectly.

### CH-STRICT-011 — Count once per attempt
Level: I/E

One blocked redirect cycle increments distractions once despite multiple browser events.

### CH-STRICT-012 — Restart reconstruction
Level: E

Restarting the service worker/browser during Strict restores the same allowed tab/site policy and end alarm.

### CH-STRICT-013 — End cleanup
Level: E

After Focus ends, Strict rule ranges are empty and new tabs/sites are normal.

## F. Check-In mode

### CH-CHECKIN-001 — Initial sites trusted
Level: E

Sites open when Focus starts do not prompt.

### CH-CHECKIN-002 — First new site prompts
Level: E/M

New site shows exact outcome and site with Continue/Go Back.

### CH-CHECKIN-003 — Continue trusts session only
Level: E

Continue navigates successfully and subsequent pages/subdomains with the same site key do not prompt in that session.

### CH-CHECKIN-004 — Continue does not count
Level: I/E

Continue writes no `checkin_declined` and does not increment distractions.

### CH-CHECKIN-005 — Go Back restores
Level: E

Go Back returns the tab to its last allowed URL/state where possible.

### CH-CHECKIN-006 — Go Back counts
Level: I/E

Go Back writes one `checkin_declined` and increments today's/session distractions once.

### CH-CHECKIN-007 — Different new site prompts
Level: E

After trusting one site, a different site prompts.

### CH-CHECKIN-008 — Trust resets next session
Level: E

A site trusted in one Focus prompts again in a later Focus unless initially open.

### CH-CHECKIN-009 — New tab trusted site
Level: E

New tabs are permitted; a trusted destination opens without prompt.

### CH-CHECKIN-010 — New tab untrusted site
Level: E

New tab remains available but displays Check-In before target navigation is allowed.

### CH-CHECKIN-011 — Target URL integrity
Level: E

Continue preserves path, query and fragment of the intended URL.

### CH-CHECKIN-012 — Redirect prompt
Level: E

A redirect from trusted to untrusted site prompts and does not loop after Continue.

### CH-CHECKIN-013 — Restart reconstruction
Level: E

Trusted sites, last allowed URLs and timer survive service-worker/browser restart.

## G. Standard mode

### CH-STANDARD-001 — Whole-site block
Level: E

A whole-site target blocks main-frame navigation and records `block_triggered`.

### CH-STANDARD-002 — Route-only block
Level: E

`youtube.com/shorts` blocks Shorts and descendants but not `/watch`.

### CH-STANDARD-003 — SPA route change
Level: E

A `history.pushState` transition into a blocked route is redirected.

### CH-STANDARD-004 — Default Space cannot use Standard
Level: E

Default never exposes or starts Standard.

### CH-STANDARD-005 — Downgrade clears rules
Level: I/E

If entitlement becomes Free, active scheduled/standard rules stop and do not resume until entitlement allows them.

## H. Focus end and statistics

### CH-END-001 — Timer completion once
Level: E

Alarm finishes exactly once, produces one Focus history record, one completion state and one notification.

### CH-END-002 — Manual Stop
Level: E

Stop ends immediately and opens the same completion workflow without native prompts.

### CH-END-003 — End snapshot immutable
Level: E

Tabs opened after the session ends are not added to the saved Stack.

### CH-END-004 — Save Stack
Level: E

Save creates one Stack with edited name, end tabs, Focus reference, outcome and selected Space.

### CH-END-005 — Discard
Level: E

Discard creates no Stack but retains history, duration and events.

### CH-END-006 — Duplicate resolution
Level: I

Repeated Save/Discard operation ID cannot create duplicate Stacks or erase the selected resolution.

### CH-STATS-001 — Today focus seconds
Level: U/E

Actual duration is recorded accurately and displayed as documented minutes.

### CH-STATS-002 — Qualifying streak day
Level: U

59 seconds does not qualify; 60 seconds qualifies.

### CH-STATS-003 — Streak continuity
Level: U

Consecutive dates calculate correctly, including no focus yet today but focus yesterday.

### CH-STATS-004 — Check-In/Standard/Strict counts
Level: U/E

Only declined/blocked attempts count; Continue does not.

### CH-STATS-005 — Local date/time-zone
Level: U

Day assignment and future streak calculations use local calendar dates without rewriting historical timestamps.

## I. Stacks and restoration

### CH-STACK-001 — Add restores alongside
Level: E

Current tabs stay open and missing target URLs open.

### CH-STACK-002 — Add exact duplicate skip
Level: E

Exact normalised URLs already open are not duplicated; distinct paths/queries follow documented URL-key behaviour.

### CH-STACK-003 — Swap persists first
Level: I/E

The auto Stack is verifiably persisted before any current tab closes.

### CH-STACK-004 — Swap keeps window alive
Level: E

Replacing all current tabs does not destroy the target browser window.

### CH-STACK-005 — Swap failure does not mix
Level: I/E

When a current tab cannot close, target Stack tabs are not fully opened; auto Stack remains recoverable.

### CH-STACK-006 — Restore preference
Level: E

Last Add/Swap choice is selected the next time and persists across restart.

### CH-STACK-007 — Conditional Space switch
Level: U/E

Checkbox appears only for cross-Space Swap. Checked switch changes Active Space without additional tab actions.

### CH-STACK-008 — Reassign Space
Level: E

Stack assignment changes without changing tabs or history.

### CH-STACK-009 — Archive/unarchive
Level: E

Archived Stack leaves Recent list, remains searchable in archived view and can be restored/unarchived.

### CH-STACK-010 — Delete confirmation
Level: E

Delete removes/tombstones the Stack only after confirmation and never closes browser tabs.

### CH-STACK-011 — Focus Now defaults
Level: E

Focus Now uses saved restore mode, default duration/mode and Stack Space/outcome.

### CH-STACK-012 — Focus Now fallback
Level: E

Unavailable Standard default falls back to Check-In and communicates the fallback.

### CH-STACK-013 — Focus Now failure boundary
Level: I/E

Failed Swap parking means no restore/focus. Successful restore followed by Focus start failure leaves restored tabs open and reports the failure.

## J. Spaces and schedules

### CH-SPACE-001 — Default protected
Level: U/E

Default remains after other Spaces are created and cannot be deleted.

### CH-SPACE-002 — Rename Default
Level: E

Default is renameable and remains `isDefault=true`.

### CH-SPACE-003 — Space delete preserves Stacks
Level: E

Deleting a non-Default Space requires reassign/unassign handling and never deletes its Stacks.

### CH-SPACE-004 — Start Focus shortcut
Level: E

Space detail Start Focus opens shared flow with that Space selected.

### CH-SPACE-005 — Downgraded extra Spaces
Level: E

Extra Spaces remain visible/usable for local Strict/Check-In and Stack access; Pro settings lock; creation is blocked.

### CH-SCHED-001 — Schedule validation
Level: U/E

Invalid times, out-of-window breaks and overlaps are rejected.

### CH-SCHED-002 — Start/end activation
Level: U/I/E

Boundary activates/deactivates the intended Space, events and Standard rules once.

### CH-SCHED-003 — Break pause/resume
Level: U/I/E

Blocking pauses during each break and resumes automatically without deleting schedule state.

### CH-SCHED-004 — Restart reconciliation
Level: E

Startup inside a schedule or break reconstructs the correct state and next alarm.

### CH-SCHED-005 — Focus override
Level: I/E

Scheduled Space A is suspended by explicit Focus Space B; when Focus ends inside A's active window, A resumes.

### CH-SCHED-006 — DST/overnight
Level: U

Configured time-zone, daylight-saving transition and overnight windows calculate deterministically.

## K. Dashboard and settings

### CH-DASH-001 — Core Free stats
Level: E/M

Today's focus time, current streak and distractions today are visible on Free.

### CH-DASH-002 — Dropped metrics absent
Level: E

Outcomes and Tabs now do not appear.

### CH-DASH-003 — Historical lock
Level: E/M

Free shows historical/insight areas locked with real available values; Trial/Pro unlock them.

### CH-DASH-004 — Archive suggestion threshold
Level: U/E

Only non-archived Stacks at least 14 days old and not restored for 14 days qualify; max three shown.

### CH-SET-001 — Shared Settings implementation
Level: I

Side panel and options host the same Settings component/service logic.

### CH-SET-002 — Focus defaults
Level: E

Duration, mode and Add/Swap defaults persist and are used by Focus Now/setup.

### CH-SET-003 — Notifications
Level: E

Disabled means no completion notification; enabled means exactly one neutral notification.

### CH-SET-004 — Theme
Level: E/M

Light/dark/system persist and preserve current visual quality.

### CH-SET-005 — Reset local data
Level: E

Reset requires confirmation, clears local product state and does not delete account/server data.

### CH-SET-006 — Delete account
Level: W/E

Delete account is a separate action, respects active-subscription guards and leaves local data unless the user separately resets it.

## L. Authentication and sync

### CH-AUTH-001 — One-time handoff
Level: W/I

Successful web sign-in authorises exactly one extension handoff and returns a revocable credential.

### CH-AUTH-002 — Handoff expiry
Level: W

Expired handoff cannot issue a token.

### CH-AUTH-003 — Replay protection
Level: W

Consumed code/secret cannot be reused.

### CH-AUTH-004 — Sign-out
Level: W/E

Sign-out revokes/clears account credential and leaves local product data intact.

### CH-SYNC-001 — Pro initial merge
Level: W/I

Local and remote entities merge by ID/timestamp; neither side is blindly replaced.

### CH-SYNC-002 — Offline local operation
Level: I/E

Parking, Focus and restore work offline; changes queue.

### CH-SYNC-003 — Reconnect push/pull
Level: W/I

Queued changes push, remote changes pull and cursor advances.

### CH-SYNC-004 — Last-write-wins
Level: U/W

Newer timestamp wins; equal timestamp uses deterministic device tie-break.

### CH-SYNC-005 — Delete tombstone
Level: W/I

Deletion on one device does not resurrect from another device's stale record.

### CH-SYNC-006 — Runtime excluded
Level: U/W

Active tab IDs, active Focus runtime and credentials are never sent.

### CH-SYNC-007 — Sync failure isolation
Level: I/E

Sync error appears in Settings but never rolls back valid local operation.

## M. Downgrade lifecycle

### CH-GRACE-001 — Immediate sync stop
Level: W/I

At downgrade, push/pull is rejected/disabled immediately.

### CH-GRACE-002 — Exact deadline
Level: W/E

If synced Stack data exists, API returns 14-day deletion timestamp and extension/web show the same date/countdown.

### CH-GRACE-003 — No-data downgrade
Level: W/E

Trial expiry with no server Stack data does not claim data will be deleted.

### CH-GRACE-004 — Resubscribe cancellation
Level: W

Pro restoration before deadline clears deletion timestamp and preserves server data.

### CH-GRACE-005 — Purge scope
Level: W

After deadline, server Stack payloads/product sync rows are removed according to policy; events/stat history remains.

### CH-GRACE-006 — Purge idempotency
Level: W

Running cleanup repeatedly produces the same safe result.

### CH-GRACE-007 — Local untouched
Level: E/W

Extension local Spaces/Stacks remain before and after server purge.

## N. Website

### CH-WEB-001 — Landing hero
Level: W/M

Hero and subheading match the Product Bible; CTA says Add to Chrome — free and does not route to signup.

### CH-WEB-002 — How it works
Level: W/M

Park, Focus, Block, Restore appear with concrete one-line descriptions.

### CH-WEB-003 — No pricing section on landing
Level: W

Pricing is linked but not embedded.

### CH-WEB-004 — Pricing structure
Level: W/M

Two columns only: Free and Pro. No annual toggle or separate Trial card.

### CH-WEB-005 — Exact features
Level: W

Pricing reflects the entitlement contract, including Trial no sync.

### CH-WEB-006 — Trial CTA
Level: W

Start free trial leads through account creation/sign-in and activates the no-card Trial flow.

### CH-WEB-007 — Account grace notice
Level: W/M

Account/Billing shows sync status and exact deletion deadline during grace.

### CH-WEB-008 — Payment management
Level: W

Pro user can reach the configured Stripe billing/payment method management flow.

## O. Copy, accessibility and release

### CH-COPY-001 — Prohibited term scan
Level: I

Visible source strings contain no obsolete Workspace, Session or checkpoint terminology except migration/admin contexts.

### CH-COPY-002 — Prohibited tone scan
Level: I/M

In-app visible strings contain no rejected motivational/metaphorical phrases.

### CH-A11Y-001 — Keyboard popup/focus
Level: M/E

All popup and Focus actions are keyboard reachable with visible focus and logical order.

### CH-A11Y-002 — Interrupt focus management
Level: M/E

Check-In/blocked pages announce outcome/site and place focus on the primary decision safely.

### CH-A11Y-003 — Dialog/inline restore
Level: M/E

Restore panel has semantic labels, mutually exclusive choices and correct escape/back behaviour.

### CH-REL-001 — Repository verification
Level: CI

`npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` and extension E2E pass in the original environment.

### CH-REL-002 — No console/service-worker errors
Level: E

All core E2E journeys finish with no unhandled page or service-worker errors.

### CH-REL-003 — Visual preservation
Level: M

Founder review confirms the existing visual language remains recognisable and polished while workflow/copy match V1.
