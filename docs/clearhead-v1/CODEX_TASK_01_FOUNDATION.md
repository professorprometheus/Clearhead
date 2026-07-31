# Codex Task 01 — Verify the Original Repository and Lock the V1 Migration Plan

## Objective

Use the complete original Clearhead repository to establish a verified baseline and produce an exact file-level implementation map for the approved V1 migration.

This is deliberately an inspection and evidence task. Do not modify product behaviour in this task. The purpose is to prevent speculative implementation against an incomplete understanding of the original repository.

## Read first

Read these files completely before inspecting code:

1. `AGENTS.md`
2. `docs/clearhead-v1/PRODUCT_BIBLE.md`
3. `docs/clearhead-v1/CURRENT_STATE_AUDIT.md`
4. `docs/clearhead-v1/GAP_MATRIX.md`
5. `docs/clearhead-v1/TARGET_ARCHITECTURE.md`
6. `docs/clearhead-v1/ACCEPTANCE_TEST_CATALOGUE.md`
7. `docs/clearhead-v1/IMPLEMENTATION_ROADMAP.md`

The Product Bible is authoritative. Do not treat existing behaviour or old E2E expectations as intended product behaviour.

## Context

The audit was created from a stripped-down copy that contained project source and lockfiles but intentionally omitted generated/development material such as installed dependencies and possibly other local tooling. You are operating in the complete original repository. Your job is to verify and correct the audit against the actual project.

## In scope

### 1. Repository inventory

Map:

- every workspace/package;
- all extension entry points and generated/config files;
- all web routes and API routes;
- all database schemas/migrations;
- all shared packages;
- all test suites, fixtures and CI workflows;
- all scripts and required environment-variable names;
- all current architecture or agent instruction files.

### 2. Baseline verification

Run, in this order unless repository instructions require a documented variation:

```bash
node --version
npm --version
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

Do not “fix as you go”. Record every failure first.

For every failed command, capture:

- exit code;
- relevant error;
- whether it is environment/configuration, dependency, test expectation or product code;
- the smallest likely repair;
- whether the failure also occurs on the unchanged main branch.

### 3. Verify the current-state audit

For every section of `CURRENT_STATE_AUDIT.md`:

- mark it Confirmed, Corrected or Not present in the original repository;
- add exact file paths and important symbol names;
- identify relevant files that were absent from the stripped copy;
- do not edit the supplied audit yet; write a separate verification report.

### 4. Produce an exact implementation file map

For every P0 and P1 row in `GAP_MATRIX.md`, identify:

- current files/symbols involved;
- new files/modules recommended;
- existing tests to retain, rewrite or delete;
- migrations required;
- dependency or permission changes;
- ordering dependencies on other gap IDs;
- technical uncertainty requiring a spike.

Pay special attention to:

- Strict and Check-In DNR/navigation feasibility;
- safe Swap window behaviour;
- V2→V3 migration;
- options/side-panel Settings duplication;
- extension authentication handoff;
- existing Stripe/Billing capabilities;
- server sync and downgrade cleanup;
- Playwright extension harness.

### 5. Check Product Bible feasibility

Identify only genuine platform or repository constraints. Do not propose product changes merely because the current code differs.

For each constraint:

- state the exact Chromium/Next.js/database limitation;
- provide code or documentation evidence available in the repo/toolchain;
- state the smallest implementation approach consistent with the Product Bible;
- mark whether a technical spike is required.

Do not weaken Strict or Check-In without explicit founder approval.

## Deliverables

Create these two documentation files only:

### `docs/clearhead-v1/ORIGINAL_REPO_BASELINE.md`

Include:

- repository inventory;
- environment and scripts;
- exact command results;
- current test inventory;
- confirmed/corrected audit findings;
- pre-existing failures;
- files absent from the stripped audit source;
- security/configuration observations without printing secret values.

### `docs/clearhead-v1/IMPLEMENTATION_FILE_MAP.md`

Include:

- one section per P0/P1 gap ID;
- exact current symbols/files;
- target modules/files;
- tests and migrations;
- dependency order;
- risk and spike flags;
- proposed pull-request boundaries matching the roadmap.

## Out of scope

Do not:

- change extension, web, database or package product code;
- change copy or UI;
- update dependencies or lockfiles;
- rewrite tests;
- fix baseline errors;
- create the V3 schema;
- implement Focus modes;
- implement sync/auth/schedules;
- alter configuration except creating the two requested Markdown files.

If a command requires a missing secret or external service, report it and continue with all locally possible checks. Never insert fake production secrets.

## Quality requirements

- Use exact paths and symbol names.
- Distinguish observed facts from recommendations.
- Do not repeat the Product Bible as filler.
- Do not propose a greenfield rewrite when current assets can be preserved.
- Treat visual preservation as a requirement.
- Flag any old test that encodes behaviour explicitly rejected by the Product Bible.

## Required final response

Report:

1. The two files created.
2. Commands run and exact outcomes.
3. Confirmed differences between the stripped audit and original repository.
4. P0/P1 gaps with the highest implementation risk.
5. Any platform constraint that requires founder approval.
6. Confirmation that no product code, dependency or lockfile changed.

Show `git status --short` and ensure only the two documentation files are new/modified.
