# Clearhead Current-State Audit

Source reviewed: latest stripped-down `Clearhead (2).zip` supplied by the founder.  
Purpose: document what the repository currently implements, without treating it as product authority.

## 1. Repository shape

The repository is an npm workspace monorepo:

- `apps/extension` — Plasmo/React Chromium extension.
- `apps/web` — Next.js marketing, authentication, account and billing application.
- `packages/database` — Drizzle/Postgres schema and migrations.
- `packages/entitlements` — plan calculation and feature gates.
- `packages/shared` — shared entitlement/account types and validators.

Root scripts include build, type-check, lint, test, extension E2E and database commands.

### Verification status

Static inspection completed.

`npm ci` could not complete in the analysis environment because the configured package mirror returned 404 for the locked nested artifact `zod@3.25.76`. This does not establish a code failure. The original environment must run:

```bash
npm ci
npm run verify
npm run test:e2e
```

before implementation begins.

## 2. Extension manifest and capabilities

`apps/extension/package.json` declares Manifest V3 and permissions for:

- tabs;
- tab groups;
- local/session storage;
- side panel;
- alarms;
- notifications;
- Declarative Net Request;
- web navigation;
- HTTP/HTTPS host access.

The current extension has enough baseline permissions for tab capture, DNR blocklists, timers and navigation observation. It does not yet contain the runtime systems needed for Strict, Check-In, schedules, entity sync or auth handoff.

## 3. Current local product model

Primary files:

- `apps/extension/src/types/state.ts`
- `apps/extension/src/lib/storage.ts`

Current schema version: `2`.

### Current entities

#### Workspace

Fields:

- ID and name;
- timestamps;
- `blockedDomains` array;
- optional default Focus duration.

A `Default Workspace` is automatically created. `currentWorkspaceId` combines current selection and environmental context.

#### Session

A Session is currently used for multiple meanings:

- manually saved tab group;
- parked tabs;
- automatic Focus checkpoint;
- Clear My Head checkpoint.

It includes optional objective, next step, checkpoint flag, outcome and focus minutes. This is the central conceptual collision that must be removed.

#### FocusState

The active Focus state currently stores:

- ID;
- Workspace ID;
- objective;
- start/end times;
- distraction count;
- optional resumed Session;
- starting tabs.

It does not store:

- Focus mode;
- protected window ID;
- original tab IDs;
- allowed sites;
- trusted Check-In sites;
- declined sites;
- last allowed URL per tab;
- completion-pending snapshot;
- Space activation source;
- schedule ownership.

#### Statistics

Current statistics are global cumulative totals plus weekly buckets:

- completed Focus Sessions;
- total Focus minutes;
- distractions blocked;
- Sessions saved.

There is no reliable daily history or streak source model.

#### Settings

Current settings include:

- theme;
- default Focus duration;
- completion notifications.

They do not include default mode or default Add/Swap restore behaviour.

## 4. Current storage and migration behaviour

`apps/extension/src/lib/storage.ts` stores one opaque `ClearheadState` object in `chrome.storage.local` under `clearheadState`.

Strengths:

- writes are serialised through a promise queue;
- import validates structure;
- a failed import does not immediately overwrite valid state;
- state reset and migration helpers exist.

Gaps:

- migration supports only schema versions 1 and 2;
- invalid or incomplete state is replaced with a new Default Workspace, which can hide migration errors;
- validation requires at least one Workspace and maps all saved context to Sessions;
- no tombstones or per-entity revision metadata exist;
- no local focus-history records exist;
- no schedule or active-Space state exists;
- no completion-pending Focus state exists.

## 5. Current background behaviour

Primary file: `apps/extension/src/background.ts`.

The 456-line background file combines:

- tab capture;
- DNR rule management;
- Focus lifecycle;
- Session saving;
- Session restoration;
- Clear My Head parking;
- stats mutation;
- alarms;
- message routing;
- blocked-attempt counting;
- SPA route blocking.

This concentration makes behaviour difficult to evolve safely.

### 5.1 Tab capture

Current capture:

- queries the current window;
- preserves title, URL, icon, pinned state, index and tab-group metadata;
- excludes unsupported/extension URLs.

This is reusable.

### 5.2 Current blocklist enforcement

Current Focus applies the selected Workspace's `blockedDomains` as dynamic DNR rules.

Strengths:

- supports whole domains;
- supports route targets;
- uses a dedicated rule-ID range;
- handles SPA `history.pushState` route changes;
- redirects to an extension blocked page;
- de-duplicates some repeated blocked events.

Gaps:

- this is only Standard/blocklist behaviour;
- it is applied to every Focus Session regardless of mode because no mode exists;
- Default Workspace can contain and enforce blocklists;
- no plan check is performed when applying previously stored blocklists;
- no schedule engine exists.

### 5.3 Current Focus start

`startFocus`:

- validates duration;
- Pro-gates custom durations;
- optionally restores a Session;
- captures starting tabs;
- sets the current Workspace;
- writes active Focus state;
- creates an alarm;
- applies Workspace blocklist rules.

It does not:

- present or persist Strict/Check-In/Standard mode;
- close or safely park unrelated tabs as part of setup;
- record initial allowed sites/tab IDs;
- log Space events;
- distinguish selected Space from Active Space;
- enforce no-new-tab or no-new-site rules.

### 5.4 Current Focus end

`finishFocus`:

- captures live tabs;
- calculates elapsed whole minutes;
- updates totals and weekly stats;
- automatically creates a checkpoint Session when tabs exist;
- invents a next step when one is not provided;
- clears rules and alarm;
- emits a motivational notification.

This directly conflicts with V1, which requires a persistent completion prompt and explicit Save Stack/Discard choice.

### 5.5 Current manual stop

The current UI offers:

- Mark complete;
- Save my place.

“Save my place” opens a native prompt asking for a next step. Both end paths automatically create a checkpoint.

V1 requires only Stop Focus during the session and Save Stack/Discard after completion.

### 5.6 Current save and park

`saveSession`:

- validates name and selected tabs;
- enforces a five-Session Free limit;
- persists before closing when parking;
- leaves at least one tab open;
- reports close failures.

The persistence-before-close safety pattern is valuable and should be retained.

Conflicts:

- Free must have unlimited Stacks;
- terminology is Session rather than Stack;
- no source/archive/Focus reference exists;
- direct UI flows are based on checkpoint management rather than the canonical workflow.

### 5.7 Current restore

`restoreSession`:

- opens missing restorable URLs in the current window;
- skips exact duplicates;
- updates last-restored time.

It implements only Add-like behaviour.

Missing:

- inline Add/Swap selection;
- last-choice preference;
- safe auto-park before Swap;
- conditional Space switch;
- Focus Now;
- operation-level transactional/idempotent handling.

### 5.8 Current Clear My Head

`clearHead`:

- keeps selected/current/pinned tabs;
- creates an auto-named checkpoint Session;
- invents objective and next-step text;
- closes other tabs.

The underlying park-before-close pattern is useful. The marketed feature, copy and invented metadata conflict with V1.

## 6. Current browser pages

### Blocked page

`apps/extension/src/tabs/blocked.tsx` is a visually polished blocked state for Standard rules.

Conflicts:

- motivational/metaphorical copy;
- offers “Save my place and pause”;
- assumes every block is final rather than a Check-In decision;
- no separate Strict and Check-In state;
- no Continue action for Check-In;
- no exact last-allowed-state restoration contract.

A visual shell may be reused, but the page must be decomposed into mode-specific behaviour.

## 7. Current popup

Primary file: `apps/extension/src/popup.tsx`.

The popup currently contains:

- plan badge;
- settings icon;
- Workspace selector labelled “Working in”;
- FocusControl;
- Clear My Head;
- Save checkpoint;
- Park selected tabs;
- “Open focus home”;
- checkpoint count;
- live tab count;
- upgrade modal.

This is a management-heavy popup and conflicts with both first-use and returning-use V1 layouts.

Missing:

- first-use single Start Focus state;
- persistent Spaces/Dashboard footer;
- Recent Stacks;
- inline restore panel;
- Focus Now;
- completion-pending state;
- mode selection and close-unrelated-tabs setup.

## 8. Current Focus UI

Primary file: `apps/extension/src/components/FocusControl.tsx`.

Current setup includes:

- objective;
- optional latest-checkpoint resume;
- duration;
- Pro custom duration;
- Begin focus.

Current active state includes:

- timer ring;
- objective;
- Workspace;
- distraction count;
- Mark complete;
- Save my place.

Conflicts:

- no Space selector inside canonical flow;
- no mode selector;
- no unrelated-tab step;
- uses checkpoint resume rather than Focus Now/restore contract;
- custom duration is incorrectly Pro-gated;
- active controls are wrong;
- copy violates the neutral style.

## 9. Current side panel

Primary file: `apps/extension/src/sidepanel.tsx`.

Current top-level views:

1. Dashboard
2. Workspaces
3. Sessions
4. Focus
5. Settings

V1 requires Dashboard, Spaces, Stacks and Settings only.

### 9.1 Dashboard

Current Dashboard includes:

- current Workspace/Focus welcome card;
- recent checkpoint resume;
- Clear My Head;
- Save checkpoint;
- choose objective;
- recent checkpoints;
- duplicated FocusControl;
- Outcomes, Focused, Deflected and Tabs now metrics.

Conflicts:

- duplicates popup/Focus UI;
- uses obsolete concepts;
- includes dropped Outcomes and Tabs now metrics;
- lacks today's streak model;
- lacks locked historical charts and reopen insights.

### 9.2 Workspaces

Current Workspaces supports:

- create/select/rename/delete;
- blocklist entry management;
- route normalization;
- Free limits and read-only extra Workspaces.

Reusable aspects:

- card styling;
- input and validation patterns;
- route-aware target helpers.

Conflicts:

- term must be Space;
- Free blocklists are currently allowed up to three, but Standard/blocklist must be entirely gated;
- Default can enforce blocklists;
- no schedules or break windows;
- no Start Focus shortcut per Space;
- selecting current Workspace conflates management selection and active rules;
- deletion currently cascades and permanently deletes Sessions, which is unsafe for Stack reassignment.

### 9.3 Sessions

Current Sessions supports:

- text search;
- Workspace filter;
- restore;
- delete;
- details dialog;
- rename;
- read-only records beyond the Free limit.

Conflicts:

- term must be Stack;
- Free limit must be removed;
- no Space reassignment;
- no archive/unarchive;
- no Add/Swap restore panel;
- no last-restored presentation logic required by V1;
- no Focus Now.

### 9.4 Focus view

Current top-level Focus duplicates FocusControl and presents feature cards. It should be removed from primary navigation.

It also claims Strict is Pro and does not implement it.

### 9.5 Settings

Current side-panel Settings implements:

- theme;
- default duration;
- notifications;
- account actions;
- export/import/reset.

Missing:

- default mode;
- default Add/Swap;
- exact plan and grace states;
- delete-account action in extension;
- contextual trial behaviour;
- sync status/countdown;
- canonical copy.

The side panel also renders inactive settings sub-navigation buttons that do not switch panels.

## 10. Current options page

`apps/extension/src/options.tsx` duplicates much of side-panel Settings with a second implementation.

Risks:

- divergent copy and behaviour;
- duplicate entitlement checks;
- duplicate import/export/reset implementations;
- additional maintenance burden.

V1 should use one shared Settings implementation. The options page may remain only as a deep-linked host for that same component if Chrome exposes it from extension management.

## 11. Current entitlement model

Primary files:

- `packages/entitlements/src/index.ts`
- `packages/shared/src/index.ts`

Current Free limits:

- one Workspace;
- five Sessions;
- three blocked domains;
- seven statistics days.

Current feature gates:

- custom Focus duration: Pro/Trial;
- Strict: Pro/Trial;
- scheduled Focus: Pro/Trial;
- full statistics: Pro/Trial;
- cloud sync: Pro/Trial;
- advanced search, tags and recently deleted: Pro/Trial.

Conflicts:

- Free must have unlimited Stacks;
- Strict and Check-In must be Free;
- duration must not be Pro-gated;
- blocklist/Standard must be entirely unavailable on Free rather than limited to three;
- Trial must not include sync;
- advanced search, tags and recently deleted are not V1 entitlements;
- route-aware blocking and reopen insights are not represented;
- no grace-deletion deadline/status exists.

Existing entitlement tests explicitly assert that Trial includes cloud sync and that Free cannot create a sixth Session. These tests must be replaced.

## 12. Current account and auth behaviour

### Extension

The extension:

- opens web sign-in/sign-up pages;
- uses a Better Auth browser client;
- calls a CORS entitlement endpoint with credentials;
- caches account snapshots in `chrome.storage.session`.

Missing:

- explicit short-lived auth handoff;
- durable revocable bearer credential storage;
- handoff status/retry UI;
- sync client;
- account-delete action from extension.

Relying on cross-origin cookies from an extension context is not the approved V1 handoff model and may be unreliable across browser privacy configurations.

### Web

The web app has:

- email/password auth;
- optional Google OAuth;
- email verification/reset;
- Better Auth bearer plugin;
- Stripe integration;
- account deletion guard;
- account and billing pages.

A 30-day trial profile is currently created after every account creation. This broadly supports contextual trial signup but must be aligned with the V1 entry paths and no-sync rule.

## 13. Current web product surface

### Landing page

The current page is visually polished but uses rejected language such as:

- momentum;
- train of thought;
- one uninterrupted loop;
- calm system;
- starting again feels effortless.

The primary CTA opens sign-up and promotes a 30-day trial. V1 requires Add to Chrome — free without signup.

The page includes a product mock-up built around Focus home, Workspaces and Checkpoints, which must be updated to the canonical model.

### Pricing page

Current pricing has:

- three cards: Free, Pro trial, Pro;
- monthly/annual toggle;
- annual discount;
- Free CTA to sign-up;
- old feature limits.

V1 requires two columns, monthly Pro only and exact Free/Pro features.

### Account and billing

Current pages show account identity, plan and Stripe subscription details.

Missing:

- sync-data status;
- deletion grace countdown;
- resubscribe-to-cancel-deletion state;
- payment-method management surface if not supplied by a portal action;
- V1 plan copy.

## 14. Current server and database

Primary schema: `packages/database/src/schema.ts`.

Current tables include Better Auth, Stripe subscription, user trial profile, processed webhook and one `synced_clearhead_state` table.

`apps/web/src/app/api/extension/sync/route.ts` stores one opaque JSON state per user/device with a revision.

Gaps:

- no `spaces` entity table;
- no `blocklist_entries` table;
- no `stacks` table;
- no `events` table;
- no Focus Session history table;
- no entity tombstones;
- no deletion deadline;
- no server cleanup job for synced Stack content;
- no conflict merge beyond replacing each device's opaque state;
- no extension sync client;
- Trial currently passes the cloud-sync entitlement check.

## 15. Current schedules

No schedule data model, UI, alarm reconciliation or break-window logic exists.

The existing Focus alarm can be reused as a pattern, but schedule alarms require their own namespace and deterministic reconciliation on startup, install, time-zone change and Focus override.

## 16. Current tests

`apps/extension/e2e/extension.spec.ts` contains nine broad Playwright scenarios covering:

- first launch and Workspace lifecycle;
- Session save;
- park and restore;
- blocklist Focus persistence;
- Clear My Head;
- truncation;
- alarm completion;
- route-specific blocking;
- settings/import/export/reset.

Strengths:

- launches the real built extension;
- checks service-worker/page errors;
- verifies DNR cleanup;
- captures screenshots;
- tests no-duplicate restoration and safe persistence paths.

Conflicts:

- selectors and expectations encode the obsolete product model;
- automatic checkpoints are treated as correct;
- Strict and Check-In are absent;
- Add/Swap, Focus Now, completion pending, schedules, plan/downgrade and auth/sync are absent.

The existing suite should be migrated, not discarded wholesale. Helper infrastructure and safety tests are valuable.

## 17. Reusable implementation assets

Preserve or adapt:

- existing visual CSS and components;
- Brand and mark components;
- tab capture metadata;
- tab picker row;
- storage write queue;
- import rollback pattern;
- persist-before-close pattern;
- URL normalization and route matching helpers;
- DNR rule ownership range pattern;
- Focus alarm startup reconciliation pattern;
- page/service-worker error collection in E2E;
- authentication, email and Stripe foundations;
- database package and migration setup.

## 18. Highest-risk implementation areas

1. Strict and Check-In enforcement across typed navigation, links, redirects, new tabs and service-worker restarts.
2. Safe Swap without closing the browser window or losing tabs.
3. V2-to-V3 state migration without fabricating data.
4. Schedule/Focus rule ownership and override reconciliation.
5. Cross-device entity sync with deletion tombstones.
6. 14-day downgrade deletion without touching local data or retained stats.
7. Extension auth handoff across browser privacy settings.
8. Replacing the workflow while preserving visual quality.

## 19. Audit conclusion

The repository is a strong visual and technical prototype, not a near-complete implementation of the approved V1.

The central mismatch is architectural:

- Workspace is being used as Space and current selection.
- Session is being used as Stack, checkpoint and Focus history.
- Focus is implemented as a timer plus one permanent blocklist.

A successful implementation must first separate those concepts and establish the new state/protocol contracts. Rearranging the current screens without that migration would reproduce the same workflow problems under new labels.
