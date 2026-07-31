# Clearhead V1 Implementation File Map

Date: 31 July 2026  
Authority: `docs/clearhead-v1/PRODUCT_BIBLE.md`  
Scope: every P0/P1 row in `docs/clearhead-v1/GAP_MATRIX.md`

This is a migration map, not an implementation. Target paths follow `docs/clearhead-v1/TARGET_ARCHITECTURE.md` and may be adjusted only to preserve the same boundaries. Existing `apps/extension/src/styles/global.css`, brand/icon components and web visual primitives are retained by default.

Risk flags:

- **Spike**: bounded proof is required before the dependent implementation.
- **Migration**: persisted local/server data changes.
- **Safety**: failure could close tabs or lose recoverability.
- **Cross-surface**: extension, web and/or database contracts must land in order.

## G-001 — Canonical Space, Stack and Focus Session contracts (P0)

- **Current files/symbols:** `apps/extension/src/types/state.ts` — `Workspace`, `Session`, `FocusState`, `ClearheadState`, `createDefaultState`; `apps/extension/src/types/messages.ts` — `Request`; `apps/extension/src/background.ts` — `saveSession`, `restoreSession`, `startFocus`, `finishFocus`, `clearHead`, `handle`; `Popup`, `FocusControl`, `SidePanel`, `Workspaces`, `Sessions`, `SessionDetails`; `packages/shared/src/index.ts` — `EntitlementSnapshot`.
- **Target modules:** add `apps/extension/src/domain/models.ts`, `entitlements.ts`, `selectors.ts`, `validation.ts`; replace the message union with canonical typed commands in `apps/extension/src/types/messages.ts`; retain `SavedTab` metadata while introducing `Space`, `Stack`, `FocusSessionRecord`, `FocusRuntime`, `ActiveSpaceState`, events, daily stats, settings and sync state. Keep legacy types only inside migration fixtures/code.
- **Tests/migrations:** rewrite the legacy-type portions of `apps/extension/tests/logic.test.ts` and `storage.integration.test.ts`; add type/selector tests for CH-STATE-001, CH-COPY-001 and downstream entity invariants. Local V2→V3 migration is G-002; no server migration in this gap.
- **Dependencies/permissions:** none. **Order:** first Phase 1 contract; prerequisite for every other P0/P1 gap. **Risk:** Migration/Cross-surface; ensure visible terminology changes do not replace the visual system.

## G-002 — Pure V2→V3 migration and rollback (P0)

- **Current files/symbols:** `apps/extension/src/lib/storage.ts` — `KEY`, `queue`, `migrateState`, `getState`, `setState`, `updateState`, `validateImport`; `apps/extension/src/types/state.ts` — `SCHEMA_VERSION = 2`; current tests expect corrupt state repair/reset.
- **Target modules:** add `apps/extension/src/storage/state-store.ts`, `migrations.ts`, `export-import.ts`; pure `migrateV2ToV3` plus V2 backup key, migration notices, validation and a browser-dependent startup reconciliation coordinator. Never silently replace incompatible state.
- **Tests/migrations:** add representative V1/V2 fixtures for Workspaces, Sessions, blocklists, active Focus, legacy stats, custom Default name, missing/multiple defaults, orphan/corrupt data and rollback; rewrite `logic.test.ts`/`storage.integration.test.ts` expectations for CH-STATE-002–007. This is the local schema migration; no Drizzle migration.
- **Dependencies/permissions:** none. **Order:** after G-001, before any V3 command/UI. **Risk:** Migration/Spike; fixture coverage must prove every legacy tab and relationship survives.

## G-003 — Central park-before-close transaction (P0)

- **Current files/symbols:** `background.ts` — `captureTabs`, `toSavedTab`, `saveSession` (explicit read-back), `clearHead` (write-before-close but no read-back); `SessionCapture`, `ClearHeadPicker`; process-local `savingOperations`.
- **Target modules:** add `apps/extension/src/background/tab-service.ts`, `stack-service.ts` and an operation ledger in state; implement `captureEligibleTabs`, `parkTabs`, verified read-back, exact close results and idempotent operation IDs. All closing callers delegate here.
- **Tests/migrations:** retain tab metadata/safe ordering intent from `storage.integration.test.ts` and Playwright park scenarios; replace obsolete Clear My Head workflow with CH-FOCUS-007–009, CH-STACK-003/005 and failure-injection integration/E2E tests. Operation ledger is a V3 field from G-002.
- **Dependencies/permissions:** current `tabs`, `tabGroups`, `storage` suffice. **Order:** Phase 2 after G-001/G-002; prerequisite for G-010, G-024 and G-033. **Risk:** Safety; no close on persistence failure.

## G-004 — Unlimited local Stacks on Free (P0)

- **Current files/symbols:** `packages/entitlements/src/index.ts` — `FREE_LIMITS.sessions = 5`, `canCreateSession`; `background.ts` — `saveSession`; `Popup.begin`; `SidePanel`/`Dashboard`/`Sessions`; `Options`/`AccountPlanCard`; `packages/entitlements/src/index.test.ts` explicitly blocks a sixth Session.
- **Target modules:** remove Stack count from the entitlement contract and all count-based creation/edit/read-only gates; Stack commands remain local and plan-independent.
- **Tests/migrations:** replace the sixth-Session assertion with CH-PLAN-001/004 including sixth and 100th Stack; migrate legacy records without truncation. No server migration.
- **Dependencies/permissions:** none. **Order:** Phase 1 with G-001/G-006. **Risk:** low, but grep all obsolete `limits.sessions`/`canCreateSession` consumers.

## G-005 — Strict and Check-In are Free (P0)

- **Current files/symbols:** `EntitlementSnapshot.features.strictMode`; `buildEntitlementSnapshot`; `canUseStrictMode`; `FocusView` presents Strict as Pro; Check-In types/UI/runtime are absent; E2E trial fixture grants Strict.
- **Target modules:** make `strict` and `checkin` base `FocusMode` values in `domain/models.ts`; do not expose capability flags for them; derive availability in `domain/selectors.ts` and the shared Focus setup.
- **Tests/migrations:** replace current entitlement expectations with CH-PLAN-001–003, CH-FOCUS-003 and Free E2E selection. V3 settings default to Check-In.
- **Dependencies/permissions:** runtime work depends on G-011/G-012; no new permission for the contract. **Order:** Phase 1 contract before Phase 3 enforcement/Phase 4 UI. **Risk:** Cross-surface.

## G-006 — Trial excludes sync (P0)

- **Current files/symbols:** `buildEntitlementSnapshot` sets `const pro = plan !== "free"`, so Trial receives `features.cloudSync = true`; `packages/entitlements/src/index.test.ts` requires it; E2E `reset` fixture also sets it true; `/api/extension/sync` trusts that feature.
- **Target modules:** replace the limit-oriented shared entitlement shape with explicit `capabilities`; set Trial capabilities equal to Pro except `cloudSync: false`; update `entitlementForUser`, extension account snapshots and API guards.
- **Tests/migrations:** rewrite entitlements tests and E2E fixtures for CH-PLAN-002/007; add API integration rejection. No schema migration by itself.
- **Dependencies/permissions:** none. **Order:** Phase 1 before G-015/G-016 and any trial copy. **Risk:** Cross-surface/security; server must remain authoritative.

## G-007 — Standard fully gated and never on Default (P0)

- **Current files/symbols:** `Workspace.blockedDomains`; `FREE_LIMITS.blockedDomains = 3`; `canAddBlockedDomain`; `Workspaces`; `applyRules` applies the selected Workspace blocklist for every Focus with no plan/default check.
- **Target modules:** `Space.isDefault`, `BlocklistEntry`, `capabilities.standardMode`/`routeAwareBlocking`; selectors for mode availability; `background/rule-engine.ts` validates entitlement, non-Default Space and non-empty blocklist before applying Standard. Preserve legacy Default entries without enforcement.
- **Tests/migrations:** CH-PLAN-006, CH-FOCUS-003, CH-STANDARD-001–005 and legacy-entry preservation fixture; migrate arrays to stable entry IDs. Server blocklist tables come later with G-015.
- **Dependencies/permissions:** current DNR/webNavigation permissions suffice. **Order:** Phase 1 data/entitlements, Phase 3 rules, Phase 5 management; depends G-001/G-002/G-006/G-014. **Risk:** Migration.

## G-008 — Persistent completion-pending state (P0)

- **Current files/symbols:** `background.ts` — `finishFocus` immediately pushes a checkpoint Session and clears Focus; `END_FOCUS`; `FocusControl.finish`; blocked-page stop action; `FocusState` has only active/inactive.
- **Target modules:** model `FocusRuntime.status = "completion_pending"`; `background/focus-engine.ts` implements idempotent `finishFocus`; commands `STOP_FOCUS` and `RESOLVE_FOCUS_COMPLETION`; shared `features/focus/FocusCompletion.tsx` renders Save Stack/Discard.
- **Tests/migrations:** rewrite automatic-checkpoint E2E; add CH-POP-005–007 and CH-END-001–006. V2 active Focus migration enters completion pending under G-002.
- **Dependencies/permissions:** storage/alarms already present. **Order:** Phase 3 engine before Phase 4 popup; depends G-001/G-002/G-009/G-014. **Risk:** Safety/restart idempotency.

## G-009 — Immutable end-of-Focus snapshot (P0)

- **Current files/symbols:** `finishFocus` captures `liveCheckpointTabs` and immediately saves them; `FocusState.startingTabs` is only a fallback.
- **Target modules:** `focus-engine.finishFocus` captures once into both `FocusSessionRecord.endTabs` and completion runtime; `resolveFocusCompletion` creates a Stack only from that stored snapshot.
- **Tests/migrations:** CH-END-003/004 plus timer/manual/restart cases; no separate schema beyond V3 `endTabs` fields.
- **Dependencies/permissions:** none. **Order:** with G-008 in Phase 3. **Risk:** Safety; duplicate finish must never replace the first snapshot.

## G-010 — Safe transactional Swap (P0)

- **Current files/symbols:** `restoreSession` implements Add only; `saveSession`/`clearHead` contain partial parking patterns; `SessionCapture`/`Sessions` trigger immediate restore.
- **Target modules:** `tab-service.safeSwap`, `stack-service.restoreStack`, operation ledger, shared `features/restore/RestorePanel.tsx`; persist/read-back auto Stack, create same-window anchor, close captured tabs, abort on partial failure, open target in saved order.
- **Tests/migrations:** retain exact-duplicate Add and persistence safety intent from old E2E; add CH-STACK-003–005/013 failure injection. V3 Stack source `swap`; no server migration until G-015.
- **Dependencies/permissions:** current tabs/storage suffice. **Order:** Phase 2 after G-003; prerequisite for G-030/G-032/G-033. **Risk:** Safety/Spike with real built extension.

## G-011 — Strict runtime (P0)

- **Current files/symbols:** `applyRules` is blocklist-only; no `tabs.onCreated`, `windows.onCreated` or Strict site baseline; manifest already has tabs, DNR, webNavigation and HTTP/HTTPS hosts.
- **Target modules:** `background/focus-engine.ts`, `rule-engine.ts`, `tab-service.ts`; persist `windowId`, `originalTabIds`, `allowedSiteKeys`, last allowed state; add Strict DNR range plus tab/window guards and deduplicated event counting; add `pages/blocked-strict.tsx` or mode state in a decomposed page.
- **Tests/migrations:** CH-STRICT-001–013 and CH-STATS-004 in the real extension; replace old Persona C assertions while retaining DNR cleanup/error tracking. V3 runtime fields from G-002.
- **Dependencies/permissions:** add reviewed PSL-aware dependency such as `tldts`; current permissions are adequate, but add web-accessible page entry if split. **Order:** Phase 3 after G-003/G-005/G-007/G-013/G-014. **Risk:** Spike; prove DNR exclusion semantics, redirects and new-window handling.

## G-012 — Check-In interrupt/runtime (P0)

- **Current files/symbols:** no Check-In implementation; `Blocked` is final/blocklist-only; `Request` has no trust/decline messages; `FocusState` has no trusted/declined/last-allowed fields.
- **Target modules:** `background/rule-engine.ts`, `focus-engine.ts`, `tab-service.ts`; `pages/checkin.tsx`; commands `TRUST_CHECKIN_SITE`/`DECLINE_CHECKIN_SITE`; background derives/validates target site and rebuilds rules.
- **Tests/migrations:** all CH-CHECKIN-001–013 plus CH-A11Y-002; target URL path/query/fragment, redirects, new tabs, no loop and restart are mandatory. V3 runtime fields from G-002.
- **Dependencies/permissions:** PSL dependency as G-011; add Check-In page to `web_accessible_resources`. **Order:** Phase 3 after site-key foundation and alongside G-013/G-027/G-028. **Risk:** **mandatory spike**; stop for founder approval if exact URL recovery is impossible—do not weaken the mode.

## G-013 — Restart reconstruction for every mode (P0)

- **Current files/symbols:** `runtime.onStartup` only reloads a Workspace blocklist and `FOCUS_ALARM`; process globals `recentBlockedAttempts`, `restoringSessions`, `savingOperations` disappear with the worker.
- **Target modules:** `focus-engine.reconcileStartup`, `rule-engine.rebuild`, persisted runtime/operation ledger; invoke reconciliation on service-worker evaluation, install/startup and relevant storage/import/reset events, not only `runtime.onStartup`.
- **Tests/migrations:** CH-STRICT-012, CH-CHECKIN-013, CH-SCHED-004 and completion restart tests. Runtime schema/migration belongs to G-002.
- **Dependencies/permissions:** none beyond current storage/alarms. **Order:** Phase 3 with G-011/G-012, before claiming enforcement. **Risk:** Spike due MV3 suspension/alarm persistence.

## G-014 — One explicit Active Space (P0)

- **Current files/symbols:** `currentWorkspaceId` is changed by `Popup`, `Workspaces`, `FocusView` and `startFocus`; UI imports `updateState` directly; no activation events/source ownership.
- **Target modules:** `ActiveSpaceState` in `domain/models.ts`; `background/space-service.ts` commands `SET_ACTIVE_SPACE`, activate/deactivate/reconcile with source `manual|focus|schedule`; UI selection remains derived/local and cannot mutate canonical state.
- **Tests/migrations:** CH-FOCUS-010, CH-STACK-007, CH-SPACE-005 and transition unit tests; V2 current Workspace informs deterministic initial/default selection but must not fabricate enforcement ownership.
- **Dependencies/permissions:** none. **Order:** Phase 1 model/service, used by Phases 2–6; depends G-001/G-002. **Risk:** Cross-workflow rule ownership.

## G-015 — Entity-based local-first sync (P0)

- **Current files/symbols:** `syncedClearheadState`; `/api/extension/sync` `GET`/`PUT`; no extension sync client; `ClearheadState` has no device/cursor/queue/tombstones.
- **Target modules:** new Drizzle tables for spaces, blocklist entries, stacks, focus sessions, events and sync devices/cursors; API routes `api/extension/sync/push`, `pull`, `ack`; `apps/extension/src/background/sync-service.ts`; typed `SyncChange` and deterministic LWW/tombstone merge.
- **Tests/migrations:** new forward Drizzle migration (never edit `0000_clearhead_foundation.sql`); schema ownership/index/cascade tests; CH-SYNC-001–007, CH-PLAN-007 and two-device/offline tests. Retire opaque-state API tests when replacements exist; keep local failure-isolation coverage.
- **Dependencies/permissions:** existing Drizzle/Postgres/HTTP hosts likely suffice. **Order:** Phase 8 after G-001/G-002/G-006/G-017; coordinate G-016. **Risk:** Migration/Cross-surface/Spike; define cursor and deterministic equal-timestamp tie-break before coding.

## G-016 — Downgrade grace deletion (P0)

- **Current files/symbols:** `userProfile` has only trial dates/reminder stage; `EntitlementSnapshot` has no deletion timestamp; `/api/cron/trial-reminders` is the only cron route; account/billing/Settings show no grace state.
- **Target modules:** profile or dedicated sync-lifecycle fields; idempotent cleanup Route Handler/job; entitlement/account APIs return `syncDeletionAt`; extension shared Settings and web Account/Billing render exact date/countdown; resubscribe cancels deadline.
- **Tests/migrations:** new forward migration and indexes for cleanup; CH-GRACE-001–007 and CH-PLAN-008 with time-controlled integration tests proving local data and server events/stats survive.
- **Dependencies/permissions:** deployment scheduler/config is required later; do not use an in-process Next timer. **Order:** Phase 8 after G-006/G-015/G-017. **Risk:** Migration/Safety; retention scope must be explicit.

## G-017 — One-time extension authentication handoff (P0)

- **Current files/symbols:** extension `authClient`, `getExtensionAccount` (`credentials: "include"`), `cachedAccount`, `disconnectAccount`; web `auth` already includes `bearer()`; `extensionSession` reads request headers; no handoff table/page/API.
- **Target modules:** Drizzle `extension_auth_handoffs`; web `/extension-connect/[handoffId]` plus create/poll/consume/revoke APIs; extension `background/auth-handoff.ts` and credential store outside exportable product state; account reconnect/status UI.
- **Tests/migrations:** new forward migration; CH-AUTH-001–004 including expiry, replay, cookie-restricted browser and revocation. Retain Better Auth session/account tests when added.
- **Dependencies/permissions:** polling/tab approach can use current tabs/HTTP(S) hosts; no `identity` permission unless a separately approved design requires it. **Order:** Phase 7 after G-006, before G-015/G-016. **Risk:** Security/Cross-surface/Spike; store only hashes server-side and never long-lived tokens in URLs/exports.

## G-018 — First-popup state (P1)

- **Current files/symbols:** `Popup` always renders plan/settings/Workspace selector/Focus/Clear My Head/Session actions/panel link/counts; `createDefaultState` creates Default Workspace.
- **Target modules:** `features/popup/PopupRoot.tsx` plus `domain/selectors.ts` first-use selector; reuse existing card/button/brand styles; show Start Focus and footer only.
- **Tests/migrations:** replace old first-launch expectations with CH-POP-001 screenshot/component/E2E and CH-REL-003 visual review. No migration beyond G-002.
- **Dependencies/permissions:** none. **Order:** Phase 4 after G-008/G-014/G-021. **Risk:** visual preservation.

## G-019 — Returning-popup state and recency (P1)

- **Current files/symbols:** no popup Stack list; `Dashboard` sorts Sessions by `lastRestoredAt ?? createdAt`; popup only shows per-Workspace checkpoint count.
- **Target modules:** `domain/selectors.ts` `selectRecentStacks`; `features/popup/ReturningPopup.tsx`; shared Stack row/restore trigger.
- **Tests/migrations:** CH-POP-008/009, archived/deleted exclusions and 2–3 item limit. Stack timestamps/archive fields come from G-001/G-035.
- **Dependencies/permissions:** none. **Order:** Phase 4 after G-001/G-030/G-033/G-035. **Risk:** low.

## G-020 — Popup-to-side-panel section intents (P1)

- **Current files/symbols:** `OPEN_SIDE_PANEL` has no section and relies on `sender.tab?.windowId`; `Popup.openSidePanel` directly opens a generic panel; `SidePanel` initialises `view = "Dashboard"`.
- **Target modules:** typed `OPEN_SIDE_PANEL_SECTION`; `background/message-router.ts` or popup gesture helper writes `{section, entityId?}` to `chrome.storage.session`; `SidePanel` consumes/clears it.
- **Tests/migrations:** CH-POP-002/003 plus Stacks deep-link test; no persistent schema migration.
- **Dependencies/permissions:** current `sidePanel`/`storage` permissions suffice. **Order:** Phase 4 before/with G-039. **Risk:** Spike because `sidePanel.open()` must remain in the user-gesture chain.

## G-021 — Canonical Focus setup field order (P1)

- **Current files/symbols:** `FocusControl` renders outcome, optional Session resume, duration and Begin focus; `FocusView` supplies a separate Workspace selector; no mode/cleanup section.
- **Target modules:** shared `features/focus/FocusSetup.tsx` driven by selectors/typed `START_FOCUS`; exact order Space, outcome, mode, duration, Close unrelated tabs, Start Focus.
- **Tests/migrations:** CH-FOCUS-001–006 and keyboard CH-A11Y-001; delete obsolete resume-checkpoint UI assertions only after Focus Now coverage replaces their intent.
- **Dependencies/permissions:** none. **Order:** Phase 4 after G-005/G-007/G-023/G-029. **Risk:** cross-field validation.

## G-022 — All durations on Free (P1)

- **Current files/symbols:** `canUseCustomFocusDuration`; `startFocus` rejects non-25/50 Free values; `FocusControl`, `Options` and upgrade copy gate custom values; `validFocusDuration` already accepts integer 1–1440.
- **Target modules:** delete the entitlement gate and use shared duration validation in Focus/setup/settings services.
- **Tests/migrations:** CH-PLAN-001 and CH-FOCUS-004; replace old Pro-duration assertions/copy. No migration except preserving current saved duration.
- **Dependencies/permissions:** none. **Order:** Phase 1 contract, UI cleanup Phases 4/5. **Risk:** low.

## G-023 — Manual close-unrelated selection, initially all checked (P1)

- **Current files/symbols:** `ClearHeadPicker` defaults active/pinned tabs to keep; `SessionCapture` initially selects all tabs to save; reusable `TabPickerRow`; Focus setup has no picker.
- **Target modules:** `features/focus/FocusCleanupPicker.tsx` reuses `TabPickerRow`; selection semantics are IDs selected to park/close, initially every eligible current-window tab, with Strict kept-tab validation.
- **Tests/migrations:** CH-FOCUS-005/006 and overflow/accessibility coverage retained from old E2E. No schema migration.
- **Dependencies/permissions:** current tabs permission. **Order:** Phase 4 after G-003/G-021. **Risk:** selection-direction errors; name state explicitly.

## G-024 — Cleanup parking before Focus starts (P1)

- **Current files/symbols:** `startFocus` captures tabs but never closes/parks; cleanup exists only in separate `saveSession`/`clearHead` flows.
- **Target modules:** `focus-engine.start` calls `stack-service.parkTabs(source="focus_cleanup")` before activation/rules/alarm; aborts on persistence/partial-close failure and retains the Stack.
- **Tests/migrations:** CH-FOCUS-007–012; V3 `Stack.source` and operation ledger from G-001/G-003.
- **Dependencies/permissions:** none new. **Order:** Phase 4 orchestration on Phase 2 G-003 and Phase 3 Focus engine/G-014. **Risk:** Safety/idempotency.

## G-025 — Active Focus popup (P1)

- **Current files/symbols:** active branch of `FocusControl` renders ring, outcome, Workspace, distraction metric, Mark complete and Save my place.
- **Target modules:** `features/focus/ActiveFocusSummary.tsx` in popup with read-only outcome, remaining time, Stop Focus and persistent footer only.
- **Tests/migrations:** CH-POP-004 and visual/keyboard review; remove obsolete action selectors after replacements land. None.
- **Dependencies/permissions:** none. **Order:** Phase 4 after G-008/G-021. **Risk:** low, preserve timer styling where compatible.

## G-026 — Stop Focus without native prompt/invented metadata (P1)

- **Current files/symbols:** `FocusControl.finish` calls `prompt`; `END_FOCUS` accepts outcome/nextStep; `finishFocus` invents next-step strings; `Blocked` can end Focus with an invented next step.
- **Target modules:** `STOP_FOCUS` only; completion UI and `RESOLVE_FOCUS_COMPLETION`; remove end controls from blocked/interrupt pages; no native prompt.
- **Tests/migrations:** CH-END-002, CH-POP-005 and prohibited prompt/copy scans. Legacy invented `nextStep` may be retained only as migration metadata, never canonical outcome.
- **Dependencies/permissions:** none. **Order:** Phase 4 after G-008/G-009. **Risk:** workflow correctness.

## G-027 — Check-In Continue does not count (P1)

- **Current files/symbols:** absent; current blocked redirect increments stats in `webNavigation.onCommitted` for every block.
- **Target modules:** `focus-engine.trustCheckinSite` updates session trust/rules only; `event-service.ts` emits no decline/block event; `stats-service.ts` remains unchanged.
- **Tests/migrations:** CH-CHECKIN-003/004 and CH-STATS-004. None beyond G-012 runtime.
- **Dependencies/permissions:** none. **Order:** Phase 3 after G-012 event distinction. **Risk:** dedupe/count semantics.

## G-028 — Check-In Go Back restores and counts (P1)

- **Current files/symbols:** absent; `FocusState` has no `lastAllowedByTab`; blocked page only `history.back()` as a generic action.
- **Target modules:** `tab-service` committed-state tracking; `focus-engine.declineCheckinSite`; `event-service` writes one `checkin_declined`; `stats-service` increments once and restores the persisted last allowed URL/state where possible.
- **Tests/migrations:** CH-CHECKIN-005/006/011–013 and CH-STATS-004. V3 runtime fields from G-002.
- **Dependencies/permissions:** tabs/webNavigation already present. **Order:** Phase 3 with G-012/G-013. **Risk:** Spike for redirects/history/closed-tab races.

## G-029 — Standard availability/enforcement choice (P1)

- **Current files/symbols:** `applyRules` automatically applies any selected Workspace blocklist; no mode selector; `FocusView` advertises route blocking separately.
- **Target modules:** `selectAvailableFocusModes`; `FocusSetup` displays Standard only when capability + non-Default + entries; `focus-engine.start` validates again; `rule-engine.applyStandard` owns only the Standard range.
- **Tests/migrations:** CH-FOCUS-003, CH-STANDARD-001–005 and downgrade rule cleanup. Blocklist-entry migration under G-002/G-007.
- **Dependencies/permissions:** existing DNR/webNavigation. **Order:** Phase 3 engine then Phase 4 UI; depends G-005/G-007/G-014. **Risk:** server/local entitlement races; validate at execution.

## G-030 — One shared inline RestorePanel (P1)

- **Current files/symbols:** `Dashboard.restore` and `Sessions.restore` immediately send `RESTORE_SESSION`; popup has no recent Stack restore UI.
- **Target modules:** `apps/extension/src/features/restore/RestorePanel.tsx`, hosted by popup and Stacks views; typed `RESTORE_STACK` with `mode: "add"|"swap"`.
- **Tests/migrations:** CH-A11Y-003 and CH-STACK-001–007; retain duplicate-skip/restore ordering assertions, rewrite immediate-action UI tests. None beyond V3 settings/Stack.
- **Dependencies/permissions:** none. **Order:** Phase 4 popup then Phase 5 side panel, built on G-010/G-031/G-032. **Risk:** shared-component parity.

## G-031 — Remember Add/Swap preference (P1)

- **Current files/symbols:** `Settings` has theme/duration/notifications only; restore has no choice.
- **Target modules:** `Settings.defaultRestoreMode`; settings service/command; `RestorePanel` initial selection and successful-choice persistence.
- **Tests/migrations:** CH-STACK-006 and CH-SET-002; V2→V3 defaults to `add`.
- **Dependencies/permissions:** none. **Order:** model in Phase 1, restore in Phase 2/4, settings UI Phase 5. **Risk:** low.

## G-032 — Conditional cross-Space Swap switch (P1)

- **Current files/symbols:** no restore mode or `ActiveSpaceState`; Sessions have fixed `workspaceId`; selecting a Workspace directly changes `currentWorkspaceId`.
- **Target modules:** `RestorePanel` condition `mode === "swap" && stack.spaceId != null && stack.spaceId !== activeSpace?.spaceId`; `stack-service.restoreStack` delegates checked switch to `space-service` after safe parking.
- **Tests/migrations:** CH-STACK-007 and CH-FOCUS-010. None beyond G-014/G-034.
- **Dependencies/permissions:** none. **Order:** Phase 2 domain command/Phase 4 UI after G-010/G-014/G-031/G-034. **Risk:** do not couple Space switch to extra tab actions.

## G-033 — Focus Now orchestration (P1)

- **Current files/symbols:** `FocusControl` can pass `resumeSessionId`; `startFocus` restores first then starts, but has no Add/Swap preference, mode/default fallback, cleanup safety or specified failure boundary.
- **Target modules:** `background/stack-service.ts`/`focus-engine.ts` orchestration exposed as `FOCUS_STACK_NOW`; use Stack Space/outcome/name and settings defaults; fallback unavailable Standard to Check-In with result metadata.
- **Tests/migrations:** CH-STACK-011–013 for Add/Swap success, fallback and two-stage failures. No separate migration.
- **Dependencies/permissions:** none. **Order:** Phase 4 after G-010/G-021/G-029/G-031/G-032. **Risk:** Safety/idempotency across restore then Focus.

## G-034 — Reassignable, optionally unassigned Stacks (P1)

- **Current files/symbols:** `Session.workspaceId: string`; `Sessions` offers only Workspace filter; background save requires a Workspace ID.
- **Target modules:** `Stack.spaceId: string | null`; `stack-service.reassign`; typed command; `features/stacks/StackList.tsx` assignment dropdown; sync change under G-015.
- **Tests/migrations:** CH-STACK-008 and CH-SPACE-003. V2 maps each Session Workspace; future server `stacks.space_id` nullable with safe FK semantics.
- **Dependencies/permissions:** none. **Order:** model Phase 1, command Phase 2, UI Phase 5, server Phase 8; prerequisite G-037. **Risk:** Migration.

## G-035 — Archive/unarchive Stacks (P1)

- **Current files/symbols:** `Session` has no archive field; `Sessions` directly removes records after `confirm`; Dashboard recent list includes every Session.
- **Target modules:** `Stack.archivedAt`; `stack-service.archive/unarchive`; selectors exclude archived from recent but include them in explicit archived search; tombstone remains separate from archive.
- **Tests/migrations:** CH-STACK-009 and future archive-suggestion boundaries; V2 defaults `archivedAt = null`; server column under G-015.
- **Dependencies/permissions:** none. **Order:** Phase 2 model/command, Phase 5 UI; used by G-019. **Risk:** distinguish archive from delete/tombstone.

## G-036 — Explicit protected Default Space (P1)

- **Current files/symbols:** default identity is array position/name; `Workspaces` uses `editableId = state.workspaces[0]?.id`; delete is disabled only when total count is one.
- **Target modules:** `Space.isDefault`; space-service validates exactly one non-deleted Default, allows rename and rejects delete regardless of count.
- **Tests/migrations:** CH-SPACE-001/002 and CH-PLAN-006; V2 migration deterministically marks one Default and preserves custom name.
- **Dependencies/permissions:** none. **Order:** Phase 1 model/migration before G-007/G-037/Space UI. **Risk:** Migration.

## G-037 — Space deletion preserves Stacks (P1)

- **Current files/symbols:** `Workspaces` delete mutator filters both `current.workspaces` and `current.sessions`; confirmation explicitly says it deletes Sessions.
- **Target modules:** `space-service.delete` requires reassign/unassign handling through Stack commands, protects Default, then tombstones/deletes only the Space; future DB FK must not cascade-delete Stacks.
- **Tests/migrations:** CH-SPACE-003 plus database ownership/cascade test. Local V3 supports nullable Stack Space; server migration under G-015.
- **Dependencies/permissions:** none. **Order:** Phase 2/5 after G-034/G-036; server enforcement Phase 8. **Risk:** Safety/data retention.

## G-038 — Space-detail Start Focus shortcut (P1)

- **Current files/symbols:** `Workspaces` cards have select/rename/delete/blocklist only; `FocusView` has a separate Workspace selector.
- **Target modules:** `features/spaces/SpaceDetail.tsx` invokes shared `FocusSetup` with `spaceId` preselected; no duplicate Focus implementation.
- **Tests/migrations:** CH-SPACE-004. None.
- **Dependencies/permissions:** none. **Order:** Phase 5 after G-021/G-036/G-039. **Risk:** low/shared flow.

## G-039 — Four-section side panel (P1)

- **Current files/symbols:** `View = "Dashboard" | "Workspaces" | "Sessions" | "Focus" | "Settings"`; `views`; `FocusView`; mobile/desktop nav; deep-link-by-DOM clicks in `Dashboard`.
- **Target modules:** side-panel shell routes only `dashboard|spaces|stacks|settings`; remove top-level `FocusView`; consume typed intent from G-020; compose feature modules without changing visual tokens.
- **Tests/migrations:** navigation snapshot/E2E for CH-POP-002/003, CH-SPACE-004, CH-SET-001 and CH-COPY-001. None.
- **Dependencies/permissions:** none. **Order:** Phase 5 after Phase 4 deep-link/shared Focus groundwork. **Risk:** visual/navigation regression.

## G-040 — Default mode and restore settings (P1)

- **Current files/symbols:** `Settings` type and both settings UIs only have theme, `defaultFocusDuration`, `notificationsEnabled`; `FocusControl` ignores mode; restore has no preference.
- **Target modules:** `Settings.defaultFocusMode`/`defaultRestoreMode`; settings service validation and execution-time fallback from unavailable Standard to Check-In; controls in shared `SettingsView`.
- **Tests/migrations:** CH-SET-002 and CH-STACK-011/012; V2 defaults Check-In/Add while preserving existing settings.
- **Dependencies/permissions:** none. **Order:** model Phase 1; UI Phase 5 after G-029/G-031/G-041. **Risk:** downgrade fallback must not delete a user's chosen Space/settings data.

## G-041 — Shared options/side-panel Settings implementation (P1)

- **Current files/symbols:** `Options` and side-panel `Settings` duplicate `save`, import/export/reset, account controls and entitlement checks; side-panel settings nav buttons are inert.
- **Target modules:** `apps/extension/src/features/settings/SettingsView.tsx` plus settings/data/account services; `options.tsx` and side panel become thin hosts/deep links to the same component.
- **Tests/migrations:** CH-SET-001–006 integration/E2E; retain import rollback and theme visual intent, remove duplicated host-specific assertions. None itself.
- **Dependencies/permissions:** none. **Order:** Phase 5 after G-040/G-042 and account status contract. **Risk:** avoid divergence while preserving options-page accessibility from extension management.

## G-042 — Canonical credential-free export/import (P1)

- **Current files/symbols:** `Options` and `Settings` use `JSON.stringify(state)`; `IMPORT` calls `validateImport`; account cache is separately in `chrome.storage.session`, but no explicit export schema or credential denylist exists.
- **Target modules:** `storage/export-import.ts` with versioned export schema, canonical validation, approved legacy migrations, credential/runtime/backup exclusion and rollback coordinator; UI calls typed `EXPORT_DATA`/`IMPORT_DATA`.
- **Tests/migrations:** CH-STATE-007/008 and V2/V3 round-trip fixtures; retain current invalid-import rollback intent, replace opaque-state expectations. Export schema is versioned with local V3; no Drizzle migration.
- **Dependencies/permissions:** none. **Order:** Phase 1 schema/service, Phase 5 shared settings host; after G-001/G-002 and before sync credentials G-017. **Risk:** Security/Migration.

## G-043 — Neutral canonical V1 copy (P1)

- **Current files/symbols:** rejected strings are spread through `Popup`, `FocusControl`, `ClearHeadPicker`, `SessionCapture`, `Blocked`, `SidePanel`, `Options`; obsolete schema/message names also surface in UI. `global.css`, `Brand`, `ClearheadMark`, buttons/cards/fields are visual assets to preserve.
- **Target modules:** copy changes only in canonical feature components as their workflows land; add a visible-string scan with a legacy migration/admin allowlist. Do not use a global redesign or greenfield CSS rewrite.
- **Tests/migrations:** CH-COPY-001/002 and CH-REL-003; rewrite stale E2E selectors to canonical accessible names. Legacy imported strings may remain as user data/migration metadata, not authored UI copy.
- **Dependencies/permissions:** none. **Order:** Phase 4 popup/Focus copy, Phase 5 management copy; website copy remains P2/Phase 9. **Risk:** Cross-surface visual regression and accidental invented copy.

## Proposed pull-request boundaries

These boundaries match `IMPLEMENTATION_ROADMAP.md`; no phase should be combined without founder approval.

| PR/phase | Primary P0/P1 gap work | Required entry gate / stop condition |
|---|---|---|
| Phase 0 — baseline/evidence | This task only; no V1 gap implementation | Preserve this command/failure record and working-tree limitation |
| Phase 1 — contracts and V2→V3 | G-001, G-002, G-004–G-007, G-014, model portions of G-022/G-031/G-034–G-036/G-040/G-042 | Pure migration fixtures retain all data; entitlement tests match Product Bible |
| Phase 2 — browser safety | G-003, G-010, command portions of G-030–G-035/G-037 | Add closes nothing; Swap/park failure injection proves no loss; operations idempotent |
| Phase 3 — Focus engine/enforcement spike | G-008, G-009, G-011–G-013, G-027–G-029 | **Stop** if Check-In cannot preserve/resume the exact target URL; Strict/Check-In/Standard real-extension suite and restart cleanup required |
| Phase 4 — canonical popup/Focus | G-018–G-026, popup parts of G-019/G-020/G-030/G-032/G-033/G-043 | Production popup dimensions, first-use-to-protection path, visual founder review |
| Phase 5 — side-panel management | G-034–G-043 management/UI completion, shared Settings/RestorePanel | Four-section nav, shared components, no obsolete visible terminology |
| Phase 6 — schedules | No P0/P1 gap row is schedule-only; build on G-007/G-013/G-014 (P2 G-047/G-048) | DST/overnight/restart/override suite |
| Phase 7 — account handoff | G-017 | Expiry/replay/sign-out/cookie-restriction suite; Free remains offline-capable |
| Phase 8 — sync/downgrade | G-015, G-016 and server completion of G-034–G-037/G-042 | Two-device merge/tombstone and grace/purge retention proof |
| Phase 9 — website/commercial | P2 website rows; reuse G-006/G-016/G-017 contracts | Pricing/entitlements agree; monthly-only; Free CTA does not imply signup |
| Phase 10 — hardening | Cross-gap CH-A11Y/CH-COPY/CH-REL catalogue | No P0/P1 remains; package smoke/security/privacy/founder visual review |

## Highest-risk dependency chain

```text
G-001 contracts
  → G-002 lossless local migration
  → G-003 central browser safety
      → G-010 safe Swap
      → G-024 cleanup-before-Focus
  → G-014 Active Space ownership
  → G-011/G-012/G-013 enforcement and restart reconstruction
      → G-008/G-009 completion integrity
      → G-018–G-033 canonical popup/Focus workflows

G-006 Trial-no-sync
  → G-017 one-time auth handoff
  → G-015 entity sync
  → G-016 grace deletion and retention
```

The highest implementation risks are G-002, G-003/G-010, G-011–G-013, G-015–G-017 and the orchestration boundary in G-033. G-012 is the only current mandatory founder-approval stop condition if the Chromium spike cannot satisfy exact Check-In semantics.
