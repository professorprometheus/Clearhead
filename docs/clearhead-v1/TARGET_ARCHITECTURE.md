# Clearhead V1 Target Architecture

This document translates the Product Bible into an implementation architecture for the supplied monorepo. Product behaviour is authoritative; suggested file names may be adapted to repository conventions when the same boundaries and invariants are preserved.

## 1. Architectural goals

1. Separate Space, Stack, Focus Session, event and plan concepts.
2. Make every tab-closing operation recoverable.
3. Make Focus enforcement explicit by mode.
4. Survive Manifest V3 service-worker suspension and browser restart.
5. Keep local operation independent from account, network and sync.
6. Use one state mutation path and one browser-operation layer.
7. Make workflows testable without rendering the full UI.
8. Preserve the existing visual component system.

## 2. Recommended extension module boundaries

Refactor the current monolithic background file into orchestration plus services.

```text
apps/extension/src/
  domain/
    models.ts
    entitlements.ts
    selectors.ts
    validation.ts
  storage/
    state-store.ts
    migrations.ts
    export-import.ts
  background/
    index.ts
    message-router.ts
    tab-service.ts
    stack-service.ts
    space-service.ts
    focus-engine.ts
    rule-engine.ts
    schedule-engine.ts
    event-service.ts
    stats-service.ts
    sync-service.ts
    auth-handoff.ts
  features/
    popup/
    focus/
    restore/
    spaces/
    stacks/
    dashboard/
    settings/
  pages/
    blocked-strict.tsx
    checkin.tsx
    blocked-standard.tsx
```

The Plasmo entry file may remain `src/background.ts`, but it should only register listeners and delegate to services.

## 3. Local schema V3

Use one serialised root in `chrome.storage.local` for atomic local mutations, but treat its children as canonical entities with stable IDs and timestamps.

```ts
type ClearheadStateV3 = {
  schemaVersion: 3
  deviceId: string
  spaces: Space[]
  stacks: Stack[]
  focusSessions: FocusSessionRecord[]
  focusRuntime: FocusRuntime
  activeSpace: ActiveSpaceState | null
  events: ClearheadEvent[]
  dailyStats: Record<string, DailyStats>
  legacyStats?: LegacyStats
  settings: Settings
  sync: SyncState
  migrationNotices: MigrationNotice[]
}
```

### 3.1 Space

```ts
type Space = {
  id: string
  name: string
  isDefault: boolean
  blocklistEntries: BlocklistEntry[]
  schedule: SpaceSchedule | null
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}
```

Invariants:

- exactly one non-deleted Space has `isDefault=true`;
- Default cannot be deleted;
- names are non-empty and unique case-insensitively among non-deleted Spaces;
- blocklist data may be preserved on Default for legacy safety but is never enforceable there;
- `deletedAt` is a sync tombstone, not immediate array removal for synced entities.

### 3.2 Blocklist entry

```ts
type BlocklistEntry = {
  id: string
  target: string
  site: string
  path: string | null
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}
```

`target` is the normalised export/display value, for example `youtube.com/shorts`.

### 3.3 Stack

```ts
type StackSource = "focus" | "focus_cleanup" | "swap" | "manual" | "legacy"

type Stack = {
  id: string
  spaceId: string | null
  name: string
  tabs: SavedTab[]
  source: StackSource
  outcome: string | null
  focusSessionId: string | null
  createdAt: number
  updatedAt: number
  lastRestoredAt: number | null
  archivedAt: number | null
  deletedAt: number | null
}
```

`SavedTab` may preserve current title, URL, favicon, pinned/index and group metadata. Runtime browser tab IDs must never be persisted as restore identity.

### 3.4 Focus Session history

```ts
type FocusMode = "strict" | "checkin" | "standard"

type FocusSessionRecord = {
  id: string
  spaceId: string
  outcome: string
  mode: FocusMode
  startedAt: number
  endedAt: number | null
  plannedDurationSeconds: number
  actualDurationSeconds: number | null
  endedBy: "timer" | "user" | "migration" | null
  distractionsBlocked: number
  endTabs: SavedTab[] | null
  savedStackId: string | null
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}
```

History exists independently from whether the user saves a Stack.

### 3.5 Focus runtime

```ts
type FocusRuntime =
  | { status: "inactive" }
  | {
      status: "active"
      sessionId: string
      windowId: number
      spaceId: string
      outcome: string
      mode: FocusMode
      startedAt: number
      endsAt: number
      originalTabIds: number[]
      allowedSiteKeys: string[]
      trustedSiteKeys: string[]
      declinedSiteKeys: string[]
      lastAllowedByTab: Record<string, { url: string; siteKey: string | null }>
      distractionsBlocked: number
      cleanupStackId: string | null
      ruleRevision: number
    }
  | {
      status: "completion_pending"
      sessionId: string
      spaceId: string
      outcome: string
      endedAt: number
      durationSeconds: number
      endTabs: SavedTab[]
      endedBy: "timer" | "user" | "migration"
    }
```

Runtime browser IDs are local-only and excluded from sync/export where they would be meaningless. Import of active runtime must downgrade safely to completion-pending or inactive.

### 3.6 Active Space

```ts
type ActiveSpaceState = {
  spaceId: string
  source: "focus" | "schedule" | "manual"
  activatedAt: number
  scheduleWindowId: string | null
  pausedForBreak: boolean
}
```

Focus owns rule priority while active. Schedule reconciliation resumes after Focus.

### 3.7 Events

At minimum retain the approved types:

```ts
type EventType =
  | "space_activated"
  | "space_deactivated"
  | "stack_parked"
  | "stack_restored"
  | "stack_archived"
  | "block_triggered"
  | "checkin_declined"
```

```ts
type ClearheadEvent = {
  id: string
  type: EventType
  timestamp: number
  spaceId: string | null
  stackId: string | null
  focusSessionId: string | null
  site: string | null
  route: string | null
  metadata: Record<string, string | number | boolean | null>
  updatedAt: number
  deletedAt: number | null
}
```

Events are append-only in normal operation. `metadata` must not contain full page content or sensitive form data.

### 3.8 Daily stats

```ts
type DailyStats = {
  date: string // local YYYY-MM-DD at time of event
  focusSeconds: number
  distractionsBlocked: number
  qualifyingFocusDay: boolean
  updatedAt: number
}
```

Focus history/events remain the source of truth. Daily stats are a rebuildable cache.

### 3.9 Settings

```ts
type Settings = {
  theme: "light" | "dark" | "system"
  defaultFocusDuration: number
  defaultFocusMode: FocusMode
  defaultRestoreMode: "add" | "swap"
  notificationsEnabled: boolean
}
```

Initial defaults:

- theme `system` for new users;
- duration 25;
- mode `checkin`;
- restore `add`;
- notifications true.

On downgrade or invalid Space selection, unavailable `standard` defaults fall back to `checkin` at execution time and may be normalised in Settings.

### 3.10 Sync state

```ts
type SyncState = {
  enabled: boolean
  status: "disabled" | "idle" | "syncing" | "offline" | "error" | "grace"
  lastPulledAt: number | null
  lastPushedAt: number | null
  cursor: string | null
  pendingChanges: SyncChange[]
  deletionAt: number | null
  lastError: string | null
}
```

Credentials are stored separately and never exported.

## 4. Storage and mutation model

### 4.1 Single mutation queue

Retain the existing serial write queue, but require all writes to pass through named domain commands rather than arbitrary component mutations.

Bad:

```ts
updateState(current => { current.stacks.push(...) })
```

Required:

```ts
stackService.create(...)
spaceService.rename(...)
focusEngine.start(...)
settingsService.update(...)
```

UI components send typed commands. Services validate invariants and write state.

### 4.2 Idempotency

Every destructive or multi-step browser operation carries an `operationId`.

The state stores a short bounded operation ledger:

```ts
type OperationRecord = {
  id: string
  kind: "park" | "restore_add" | "restore_swap" | "focus_start" | "focus_end"
  status: "started" | "committed" | "failed"
  resultIds: string[]
  updatedAt: number
}
```

Duplicate messages return the committed result instead of repeating tab changes.

### 4.3 No arbitrary UI writes

The current popup and side panel directly call `updateState`. V1 should prohibit direct state mutation from UI except through service/message APIs. This is necessary for sync, events, validation and failure recovery.

## 5. Typed message protocol

Replace Session/Workspace messages with commands such as:

```ts
GET_APP_STATE
GET_CURRENT_TABS
OPEN_SIDE_PANEL_SECTION
START_FOCUS
STOP_FOCUS
RESOLVE_FOCUS_COMPLETION
TRUST_CHECKIN_SITE
DECLINE_CHECKIN_SITE
CREATE_STACK
PARK_TABS
RESTORE_STACK
FOCUS_STACK_NOW
CREATE_SPACE
UPDATE_SPACE
DELETE_SPACE
SET_ACTIVE_SPACE
UPDATE_SETTINGS
EXPORT_DATA
IMPORT_DATA
RESET_LOCAL_DATA
SYNC_NOW
```

Every mutating request includes `operationId`.

Responses use stable error codes plus human copy:

```ts
type ErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "PLAN_REQUIRED"
  | "PERSIST_FAILED"
  | "TAB_CLOSE_FAILED"
  | "RESTORE_FAILED"
  | "FOCUS_ALREADY_ACTIVE"
  | "MODE_UNAVAILABLE"
  | "SYNC_UNAVAILABLE"
```

Tests assert codes; UI displays copy.

## 6. Tab operation architecture

All tab changes go through `tab-service.ts`.

Required operations:

- `captureEligibleTabs(windowId)`;
- `openSavedTabs(windowId, tabs, options)`;
- `closeTabs(tabIds)`;
- `safeSwap(windowId, currentTabs, targetTabs)`;
- `siteKeyForUrl(url)`;
- `isProtectedInternalUrl(url)`;
- `lastAllowedTabState` tracking.

### 6.1 Safe park transaction

```text
capture tabs
→ create Stack in local state
→ verify Stack read-back
→ close requested tabs
→ record close result
→ emit stack_parked
```

If persistence fails, close zero tabs.

If some close calls fail after persistence, return a partial-close error with the recoverable Stack ID. Do not delete the Stack.

### 6.2 Safe Swap

Preconditions:

- target Stack exists;
- target has at least one restorable URL;
- no active conflicting operation.

Algorithm:

1. Capture current eligible tabs and exact browser tab IDs.
2. Persist an auto Stack with `source="swap"`.
3. Read back and verify.
4. Create the first restorable target tab in the current window as an inactive anchor, or use a temporary Clearhead internal anchor if required.
5. Close old captured tabs.
6. If closure is incomplete, stop. Close the newly created anchor when safe, do not open remaining target tabs, and report the parked Stack ID.
7. Open remaining target tabs in saved order.
8. Activate the intended target tab.
9. Update `lastRestoredAt`, emit events and commit operation.

This prevents the current window from disappearing when replacing all tabs.

Exact duplicate behaviour:

- Add skips exact normalised URLs already open.
- Swap restores the target Stack as saved; duplicates within the Stack should be preserved unless they are exact accidental duplicates introduced by the implementation.

## 7. Site-key implementation

Use a public-suffix-list-aware dependency such as `tldts` rather than hand-written last-two-label parsing.

```ts
siteKey("https://docs.google.com/a") // google.com
siteKey("https://foo.github.io")    // foo.github.io
siteKey("http://127.0.0.1:3000")    // 127.0.0.1
```

Store the key, not the full target URL, for Strict/Check-In trust.

Route normalization for Standard can adapt the existing `normaliseDomain`, `splitBlockTarget`, `blockTargetRegex` and `urlMatchesBlockTarget` helpers.

## 8. Rule engine

Use explicit non-overlapping rule ranges:

```text
42,000–42,999 Standard
43,000–43,999 Strict
44,000–44,999 Check-In
45,000–45,999 Schedule Standard
```

The rule engine owns all Clearhead dynamic rules and can clear by range.

### 8.1 Ownership

Only one foreground Focus policy can own Focus ranges. Scheduled rules use their own range and are suspended while Focus is active.

### 8.2 Standard

Reuse current DNR whole-site and regex route rules plus SPA history handling.

Only apply when entitlement and Space rules allow Standard.

### 8.3 Strict

Required layers:

1. **Navigation policy** — a catch-all main-frame DNR redirect for HTTP/HTTPS destinations, excluding initial allowed site keys and Clearhead internal pages.
2. **New-tab guard** — `chrome.tabs.onCreated` closes any tab not in `originalTabIds` while Strict is active in the protected window.
3. **New-window guard** — close new windows created after Strict starts, excluding browser-controlled windows that cannot be safely managed; record observable failures.
4. **Committed-state tracker** — update last allowed URL for original tabs only after an allowed commit.
5. **Blocked attempt counter** — de-duplicate redirect and navigation events for the same attempt.

DNR domain exclusions must be generated from allowed site keys. Prove exact Chromium matching semantics in a focused E2E spike before relying on them.

### 8.4 Check-In

Use a catch-all main-frame redirect excluding initial/trusted site keys.

Recommended redirect approach:

- a regex rule captures the intended URL;
- redirect to a Clearhead `checkin.html` page using the fragment to carry the intended URL;
- the page asks Continue/Go Back;
- Continue sends target URL/site key to background;
- background validates the target, adds the site key, rebuilds rules, then navigates the tab;
- Go Back sends a decline command and background restores `lastAllowedByTab`.

Do not trust a site merely because the interrupt page asks for it. The background must derive and validate the site key from the target.

The first implementation phase for Check-In must include a technical spike proving:

- full URL recovery when query strings/fragments are present;
- typed URL interception;
- server redirect interception;
- new-tab interception;
- no infinite redirect after Continue;
- service-worker restart reconstruction.

If Chromium DNR cannot safely preserve the original URL using the selected mechanism, Codex must report the limitation before changing product behaviour. It must not silently substitute a weaker flow.

## 9. Focus engine

### 9.1 Start command

Input:

```ts
type StartFocusInput = {
  operationId: string
  windowId: number
  spaceId: string
  outcome: string
  mode: FocusMode
  durationMinutes: number
  tabIdsToPark: number[]
}
```

Sequence:

1. Validate no active/completion-pending conflict.
2. Validate mode against Space and entitlement.
3. Validate outcome and duration.
4. Capture current tabs.
5. If tabs selected for closure, park them using `source="focus_cleanup"`.
6. Require at least one eligible kept tab for Strict.
7. If any selected tab remains unexpectedly, abort before rule activation.
8. Reconcile/deactivate previous Active Space.
9. Create FocusSessionRecord.
10. Set active runtime with final remaining tab/site baseline.
11. Activate selected Space and event.
12. Apply rules/listeners.
13. Create end alarm.
14. Commit operation.

If rule application fails, revert active runtime, clear rules/alarm, deactivate Focus-owned Space and retain any already parked cleanup Stack.

### 9.2 Stop/timeout

Use one idempotent `finishFocus(sessionId, endedBy)` implementation.

1. Guard against duplicate finish.
2. Capture tabs from protected window.
3. Calculate exact seconds, bounded by planned end for timer completion and actual stop for manual stop.
4. Clear Focus rules and alarm.
5. Update FocusSessionRecord and daily stats.
6. Deactivate Focus-owned Space and event.
7. Set `completion_pending` with immutable tab snapshot.
8. Reconcile schedule rules.
9. Send one neutral completion notification when enabled and ended by timer.

### 9.3 Resolve completion

Save:

- validate name;
- create Stack from stored snapshot with source `focus`;
- update FocusSessionRecord `savedStackId`;
- set runtime inactive.

Discard:

- set runtime inactive;
- retain FocusSessionRecord/stats/events.

## 10. Schedule engine

### 10.1 Schedule model

```ts
type SpaceSchedule = {
  enabled: boolean
  timezone: string
  days: number[] // 0–6
  start: string  // HH:mm
  end: string
  breaks: Array<{ id: string; start: string; end: string }>
  updatedAt: number
}
```

Validate:

- at least one day;
- valid local times;
- break contained inside window;
- breaks do not overlap;
- enabled schedules across Spaces do not overlap;
- define and test overnight windows explicitly. Recommended V1: support overnight by treating end earlier than start as next day.

### 10.2 Reconciliation

On install, startup, schedule change, alarm, time-zone change and Focus end:

1. Determine whether an enabled schedule currently applies.
2. Determine break status.
3. If explicit Focus active, schedule owns no rules.
4. Otherwise activate/deactivate Space and schedule DNR range as required.
5. Schedule next boundary alarm.

Use one alarm such as `clearhead-schedule-reconcile`, not one alarm per rule.

## 11. Statistics

### 11.1 Focus time

Store exact seconds. Display whole minutes using a documented rounding rule. Recommended: floor for live/today display, preserve seconds internally.

### 11.2 Streak

A local date qualifies at 60 seconds. Calculate from `dailyStats` as defined in Product Bible.

### 11.3 Distractions blocked

Increment for:

- Standard `block_triggered`;
- Check-In `checkin_declined`;
- Strict blocked navigation or prohibited new-tab/window attempt.

Continue in Check-In does not increment.

### 11.4 Deduplication

Use an in-memory and persisted short-lived attempt key:

```text
focusSessionId + tabId + targetSite/route + 2-second window
```

This avoids DNR redirect plus committed-page double counts while allowing deliberate repeated attempts later.

## 12. UI architecture

### 12.1 Shared feature components

Use one component for each workflow:

- `FocusSetup`;
- `ActiveFocusSummary`;
- `FocusCompletion`;
- `RestorePanel`;
- `SettingsView`;
- `SpaceDetail`;
- `StackList`.

Popup and side panel may host the same RestorePanel. Side panel and options page must host the same SettingsView.

### 12.2 Side-panel deep linking

Before opening the side panel, store a short-lived intent in `chrome.storage.session`:

```ts
{ section: "dashboard" | "spaces" | "stacks" | "settings", entityId?: string }
```

The side panel consumes the intent on mount and clears it. Do not rely on DOM-query clicks between views.

### 12.3 UI state selectors

Derive:

- first popup;
- active Focus popup;
- completion popup;
- returning popup;
- available modes;
- recent Stacks;
- locked plan sections;
- grace notice.

Do not scatter entitlement and state logic across components.

## 13. Entitlement contract

Replace the current limit-oriented shape with explicit V1 capabilities.

```ts
type EntitlementSnapshot = {
  plan: "free" | "trial" | "pro"
  status: SubscriptionStatus
  trialEndsAt: string | null
  trialDaysRemaining: number
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  syncDeletionAt: string | null
  capabilities: {
    additionalSpaces: boolean
    standardMode: boolean
    routeAwareBlocking: boolean
    scheduledFocus: boolean
    historicalStatistics: boolean
    reopenInsights: boolean
    cloudSync: boolean
  }
}
```

Rules:

- Free: all false.
- Trial: all true except `cloudSync`.
- Pro: all true.
- Strict, Check-In, unlimited Stacks, durations, search, export/import and today stats are base product behaviour and should not require capability flags.

Existing extra Spaces on downgrade are handled by state selectors, not an artificial count that hides/deletes records.

## 14. V2 → V3 migration

Migration must be pure and fixture-tested. Browser-dependent cleanup is a separate coordinator.

### 14.1 Workspace to Space

For each Workspace:

- preserve ID, name and timestamps;
- first/current default record becomes `isDefault=true`;
- preserve blocklist entries with generated IDs;
- preserve all entries even when currently Free;
- set schedule null.

If multiple or no defaults emerge, deterministically select the oldest Space and record a migration notice.

Rename `Default Workspace` to `Default` only when the name exactly matches the generated legacy default. Never overwrite a user-custom name.

### 14.2 Session to Stack

For each Session:

- preserve ID, name, tabs, timestamps and last restored;
- map `workspaceId` to `spaceId`;
- source `legacy`, or `focus` when `checkpoint=true` and `focusMinutes` exists;
- map objective to outcome when present;
- set archive/delete null;
- do not preserve invented next-step copy as canonical outcome; store it only in optional migration metadata/export if necessary.

### 14.3 Legacy Focus

A V2 active Focus has no reliable mode contract.

On first V3 background startup:

- clear old DNR rules/alarm;
- capture current eligible tabs;
- create a FocusSessionRecord ended by `migration` using known timestamps;
- enter `completion_pending` so the user may save or discard the captured context;
- do not silently continue with an invented Strict/Check-In mode;
- show one neutral migration notice.

### 14.4 Stats

Preserve cumulative/weekly values under `legacyStats`. Do not fabricate daily dates or a streak from weekly totals. New daily stats begin from verifiable Focus records after migration.

### 14.5 Settings

- preserve explicit theme, duration and notifications;
- default mode Check-In;
- default restore Add;
- preserve existing dark preference instead of forcing new default System.

### 14.6 Migration rollback

Before the first V3 write, store a bounded V2 backup under a migration-specific key. Remove it only after V3 validation and a successful startup reconciliation. Never include the backup in normal sync.

## 15. Server schema

Retain Better Auth and Stripe tables. Add canonical product tables.

### 15.1 Spaces

```text
spaces
- id UUID/text PK
- user_id FK
- name
- is_default
- created_at
- updated_at
- deleted_at nullable
```

### 15.2 Blocklist entries

```text
blocklist_entries
- id PK
- space_id FK
- target
- site
- path nullable
- created_at
- updated_at
- deleted_at nullable
```

### 15.3 Stacks

```text
stacks
- id PK
- user_id FK
- space_id nullable FK
- name
- tabs JSONB
- source
- outcome nullable
- focus_session_id nullable
- created_at
- updated_at
- last_restored_at nullable
- archived_at nullable
- deleted_at nullable
```

### 15.4 Focus Sessions

```text
focus_sessions
- id PK
- user_id FK
- space_id nullable FK
- outcome
- mode
- started_at
- ended_at nullable
- planned_duration_seconds
- actual_duration_seconds nullable
- ended_by nullable
- distractions_blocked
- saved_stack_id nullable
- created_at
- updated_at
- deleted_at nullable
```

### 15.5 Events

Use the approved event fields plus `focus_session_id`, `route`, metadata and sync timestamps where necessary.

### 15.6 Sync devices/cursors

```text
sync_devices
- user_id
- device_id
- last_cursor
- last_seen_at
```

### 15.7 User sync lifecycle

Add to profile or a dedicated table:

```text
sync_status
sync_data_delete_at nullable
sync_data_deleted_at nullable
```

### 15.8 Extension auth handoffs

```text
extension_auth_handoffs
- id
- device_id
- secret_hash/challenge
- user_id nullable
- one_time_code_hash nullable
- expires_at
- consumed_at nullable
```

Store hashes, not raw handoff secrets.

## 16. Sync API

Recommended endpoints:

```text
POST /api/extension/sync/push
GET  /api/extension/sync/pull?cursor=...
POST /api/extension/sync/ack
```

Push payload contains typed changes, not the full browser runtime state.

```ts
type SyncChange = {
  changeId: string
  entity: "space" | "blocklist" | "stack" | "focus_session" | "event"
  entityId: string
  updatedAt: number
  deletedAt: number | null
  payload: unknown
}
```

Server validates ownership and shape. Last-write-wins by `updatedAt`; equal timestamps use deterministic `deviceId` order.

Never sync:

- active browser tab IDs;
- active Focus runtime;
- auth credentials;
- transient operation ledger;
- migration backups.

## 17. Downgrade cleanup

A scheduled server job:

1. selects users with `sync_data_delete_at <= now` and no Pro entitlement;
2. deletes/tombstones synced Stack payloads and Space/blocklist data according to the approved retention policy;
3. retains Focus Sessions/events/stat history;
4. sets `sync_data_deleted_at`;
5. is idempotent;
6. sends or surfaces completion state without touching extension local data.

Resubscription clears `sync_data_delete_at` before cleanup.

## 18. Auth handoff sequence

Recommended polling flow:

1. Extension generates `handoffId`, device ID and random secret/challenge.
2. Extension creates handoff through API and opens web `/extension-connect/{handoffId}`.
3. User signs in or creates account.
4. Web marks handoff authorised and creates a one-time code.
5. Extension polls using the original secret/challenge.
6. API returns a bearer session credential once and marks handoff consumed.
7. Extension stores credential outside exportable state.
8. Replay returns failure.
9. Sign-out revokes credential and clears local account cache.

This fits the approved “message or polling” contract and avoids dependence on third-party cookies.

## 19. Testing architecture

### Unit

- pure migrations;
- entitlement matrix;
- mode availability;
- site-key and route matching;
- schedule calculations;
- streak calculations;
- recency/archive selectors;
- sync conflict resolution;
- state command invariants.

### Integration

Mock Chrome APIs for:

- park transaction;
- safe Swap;
- Focus start/end;
- operation idempotency;
- alarm reconciliation;
- sync queue.

### Extension E2E

Use the current Playwright real-extension harness and replace obsolete personas with Product Bible scenarios.

### Web/API

- auth handoff;
- entitlements;
- Trial sync rejection;
- push/pull conflict;
- grace countdown;
- purge/resubscribe;
- pricing/account content.

## 20. Failure contracts

### Local persistence failure

- close nothing;
- show neutral error;
- keep UI state recoverable.

### Partial tab close failure

- keep persisted Stack;
- do not continue Swap/Focus when exact environment is required;
- identify count and allow retry.

### Rule application failure

- do not leave Focus active;
- clear partial rules/alarm;
- retain any parked Stack;
- report failure.

### Sync failure

- keep local changes queued;
- do not block local workflows;
- show last sync status in Settings.

### Auth expiry

- switch to local mode;
- never remove local data;
- require reconnect only for account features.

### Import failure

- restore prior state and rule ownership;
- do not leave imported partial state.

## 21. Observability

Development logs should use structured categories without collecting browsing content:

```text
focus.start
focus.finish
rules.apply
rules.clear
stack.park
stack.restore
schedule.reconcile
sync.push
sync.pull
auth.handoff
migration.v2_v3
```

Do not log full URLs in production unless necessary for a user-visible local error. Server event data should store site/route only when required by the approved event contract.

## 22. Definition of architectural completion

The architecture is considered implemented only when:

- no active product workflow depends on Workspace/Session/checkpoint semantics;
- all destructive tab operations use the central safety transaction;
- Focus mode is explicit and persisted;
- startup can reconstruct enforcement;
- completion pending survives restart;
- entitlements match the Product Bible;
- UI does not mutate canonical state directly;
- sync is granular and Trial-disabled;
- downgrade cleanup is test-covered;
- the original visual system remains recognisably intact.
