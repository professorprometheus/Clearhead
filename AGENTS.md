# Clearhead Repository Instructions

## Product authority

Before changing product behaviour, read:

1. `docs/clearhead-v1/PRODUCT_BIBLE.md`
2. `docs/clearhead-v1/TARGET_ARCHITECTURE.md`
3. `docs/clearhead-v1/GAP_MATRIX.md`
4. the acceptance IDs referenced by the task

The Product Bible is authoritative over existing code and old tests. Existing code is the current implementation, not the intended product.

## Non-negotiable rules

- Do not invent workflows, features, terminology or copy.
- Do not use Workspace, Session or checkpoint as user-facing substitutes for Space, Stack or Focus Session.
- Preserve the current visual system by default.
- Do not redesign for novelty.
- Do not introduce AI; V1 contains no AI.
- Do not close a user tab until a recoverable Stack has been persisted and verified.
- Do not auto-create a Stack when Focus ends.
- Free has unlimited local Stacks, Strict and Check-In.
- Trial has Pro capabilities except sync.
- Standard is Trial/Pro only and never available on Default.
- Downgrade never deletes local data.
- Sync/account failure must never block local Focus, parking or restore.
- Do not make unrelated refactors inside a product task.

## Work method

1. Inspect all relevant existing files before editing.
2. Map the requested acceptance criteria to files and tests.
3. State the smallest safe implementation plan.
4. Implement the complete bounded task.
5. Add or update tests for every behaviour change.
6. Run the required commands.
7. Review the diff for unrelated changes and obsolete copy.
8. Report evidence and limitations.

Do not stop after changing visible UI. Trace every action through message protocol, domain service, persistence, Chrome APIs, events/stats and failure handling.

## State changes

UI components must not directly mutate canonical state. Use typed commands and domain services.

Every multi-step/destructive browser operation must be idempotent and carry an operation ID.

Migrations must be pure, fixture-tested and lossless. Never reset incompatible user state silently.

## Tests and verification

Run the most specific tests while iterating, then the full required suite before completion.

At minimum for repository-wide changes:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

For extension workflow/browser changes also run:

```bash
npm run test:e2e
```

If a command cannot run because of environment limitations, report the exact command, error and what remains unverified. Do not claim it passed.

## Copy

In-app copy is neutral and functional. Avoid motivational or metaphorical language. Do not reintroduce prohibited terms listed in the Product Bible.

## Completion report

Include:

- files changed;
- behaviour implemented;
- schema/migration changes;
- tests added or changed;
- commands and exact outcomes;
- acceptance IDs verified;
- screenshots where requested;
- limitations and pre-existing failures.
