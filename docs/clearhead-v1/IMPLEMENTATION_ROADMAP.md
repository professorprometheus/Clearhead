# Clearhead V1 Implementation Roadmap

Do not implement V1 as one Codex task. Each phase must land as a reviewable pull request with a green verification report and no unrelated redesign.

## Phase 0 — Baseline and evidence

Objective: establish a trustworthy starting point in the original repository.

Tasks:

- run `npm ci` in the original development environment;
- run root type-check, lint, unit tests, build and extension E2E;
- record existing failures without changing product behaviour;
- confirm environment-variable names, not values;
- preserve baseline screenshots from current popup, side panel, options, blocked page, landing, pricing and account pages;
- add Product Bible, architecture, gap matrix, test catalogue and AGENTS instructions to the repository;
- create a branch dedicated to V1 migration.

Exit gate:

- every baseline command and failure is documented;
- no product code change is mixed with baseline repair;
- any required dependency/lock repair is isolated and reviewed.

## Phase 1 — Canonical contracts and V2→V3 migration

Objective: make the code speak the correct product language before rebuilding workflows.

Tasks:

- replace entitlement contract with Free/Trial/Pro capabilities;
- remove five-Session, three-blocklist and custom-duration gates;
- set Trial sync false;
- introduce canonical Space, Stack, Focus Session, event, daily stats and Settings models;
- implement pure V2→V3 migration fixtures and rollback backup;
- implement canonical typed messages/error codes;
- migrate visible terminology enough to avoid new code depending on Workspace/Session semantics;
- add selectors for first popup, recent Stacks, mode availability and locked states;
- keep current visual components compiling, but do not yet implement final Focus enforcement.

Exit gate:

- migration and entitlement unit tests pass;
- existing data fixtures retain every tab and Space/Stack relationship;
- no new UI code imports legacy Workspace/Session types;
- root verification passes or remaining baseline failures are unchanged and documented.

## Phase 2 — Browser-operation safety foundation

Objective: centralise all tab capture, parking, Add and Swap operations.

Tasks:

- extract tab service and Stack service;
- add operation IDs and idempotency ledger;
- implement park-before-close transaction;
- implement Add restore;
- implement safe Swap and conditional Space switch domain command;
- implement Stack archive, delete and Space reassignment;
- replace direct UI `updateState` writes for these operations;
- migrate existing park/restore E2E helpers to canonical terms.

Exit gate:

- persistence-failure and partial-close tests pass;
- Add closes nothing;
- Swap cannot lose tabs or destroy the window;
- Free can create unlimited Stacks.

## Phase 3 — Focus engine and technical enforcement spike

Objective: prove reliable Strict and Check-In mechanics before building all final UI.

Tasks:

- split rule engine from Focus engine;
- implement explicit Focus runtime and history;
- implement mode rule ownership ranges;
- run a focused DNR spike for Check-In target URL preservation;
- implement Strict navigation/new-tab/new-window policy;
- implement Check-In interrupt, Continue and Go Back;
- retain/adapt Standard route-aware blocking;
- implement startup/service-worker reconstruction;
- implement idempotent finish and completion-pending state;
- add exact stats/event mutations.

Mandatory stop condition:

If Chromium cannot preserve and safely resume the intended Check-In URL using the selected DNR mechanism, Codex must stop and report evidence. It must not silently weaken Check-In.

Exit gate:

- all Strict, Check-In and Standard acceptance tests in sections E–G pass;
- rule ranges are empty after end/reset/import failure;
- completion pending survives restart;
- no UI auto-saves a Stack.

## Phase 4 — Canonical popup and Focus workflow

Objective: replace the incorrect user journey while preserving visual quality.

Tasks:

- implement explicit first-use, setup, active, completion and returning popup states;
- implement exact Focus setup field order;
- integrate cleanup tab parking;
- implement Start/Stop/Save/Discard copy;
- implement Recent Stacks, Focus Now and inline RestorePanel;
- implement Spaces/Dashboard side-panel deep links;
- remove settings icon, counts, current Workspace selector and old popup actions;
- remove native prompts and invented next steps.

Exit gate:

- popup acceptance tests pass at production popup dimensions;
- first-use path reaches active protection without Space/Stack/account setup;
- founder visual review confirms style preservation.

## Phase 5 — Side panel restructuring

Objective: make the side panel the coherent management centre.

Tasks:

- reduce primary navigation to Dashboard, Spaces, Stacks, Settings;
- remove duplicated top-level Focus view;
- rebuild Dashboard around today stats and locked/unlocked Pro sections;
- rename and rebuild Spaces; protect Default and preserve Stacks on deletion;
- rebuild Stacks list with search, assignment, restore, archive and delete;
- use shared RestorePanel;
- extract shared SettingsView for side panel/options;
- implement default mode/restore controls;
- replace old copy.

Exit gate:

- side-panel deep links and all management tests pass;
- no product workflow uses checkpoint terminology;
- options and side panel share one Settings implementation.

## Phase 6 — Scheduled Focus

Objective: deliver Pro schedule activation with break windows and deterministic rule reconciliation.

Tasks:

- add schedule model and validation;
- add overlap prevention;
- add schedule alarms and startup reconciliation;
- add break pause/resume;
- add Focus override/resume behaviour;
- add Trial/Pro gates and downgrade clearing;
- add DST/overnight tests.

Exit gate:

- schedule acceptance suite passes under fake time and real extension alarms;
- no overlap can cause ambiguous Active Space ownership;
- explicit Focus always takes foreground rule ownership.

## Phase 7 — Extension account handoff and entitlement refresh

Objective: make account connection reliable without depending on cross-origin cookie behaviour.

Tasks:

- add handoff table/API/web completion page;
- add extension handoff initiation/polling/consumption;
- store revocable credential separately from product export;
- update entitlement refresh/cache and sign-out;
- implement contextual trial prompts;
- add plan/grace status to Settings.

Exit gate:

- expiry/replay/sign-out tests pass;
- Free remains fully usable without account/network;
- Trial correctly excludes sync.

## Phase 8 — Entity sync and downgrade lifecycle

Objective: implement Pro local-first sync and safe server data deletion.

Tasks:

- add canonical server tables and migrations;
- implement typed push/pull/cursor API;
- add extension queue, initial merge and tombstones;
- implement deterministic last-write-wins;
- add sync status UI;
- add downgrade deadline and cleanup job;
- add resubscribe cancellation;
- retain events/stats and local data.

Exit gate:

- two-device merge/deletion tests pass;
- Trial/Free sync requests are rejected;
- local workflows work offline;
- grace/purge tests prove local data and server stats remain.

## Phase 9 — Website and commercial flow

Objective: align the website with the V1 product and plan model.

Tasks:

- replace landing copy and CTA while preserving visual system;
- update product mock-up to Spaces/Stacks/Focus;
- implement Park/Focus/Block/Restore section;
- change pricing to two columns and monthly only;
- remove annual toggle and separate Trial card;
- link Free CTA to configured Chrome listing;
- make Pro CTA start account/trial flow;
- update Account/Billing with sync/grace/payment management;
- update emails and trial reminders.

Exit gate:

- web content tests pass;
- pricing and entitlements cannot disagree;
- no signup is implied by Free CTA.

## Phase 10 — Release hardening

Objective: prove V1 as one coherent product.

Tasks:

- run complete acceptance catalogue;
- data migration test from representative V2 exports;
- service-worker suspension/restart soak tests;
- network-offline and API failure tests;
- accessibility/keyboard review;
- visual regression founder review;
- Chrome package smoke test;
- privacy/security review of URLs, events, tokens and exports;
- production database migration rehearsal and rollback plan.

Exit gate:

- root verification and all E2E/API suites pass;
- no P0/P1 gaps remain;
- every known platform limitation is documented;
- founder approves canonical workflows and visual preservation.

## Codex task format for every phase

Each task must include:

1. Objective.
2. Product Bible sections.
3. Current files and behaviour.
4. Exact in-scope files/packages.
5. Explicit out-of-scope work.
6. Required invariants.
7. Acceptance test IDs.
8. Commands to run.
9. Required completion report.

Codex must not combine phases unless the founder explicitly approves it after reviewing the earlier phase.

## Required Codex completion report

Every implementation response must state:

- files changed;
- schema/API changes;
- behaviour implemented;
- migrations added;
- tests added/updated;
- commands run and exact outcomes;
- screenshots/artifacts produced;
- acceptance IDs verified;
- remaining limitations;
- unrelated pre-existing failures.

A statement such as “implemented successfully” without evidence is not acceptable.
