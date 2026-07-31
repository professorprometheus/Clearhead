# Clearhead V1 Implementation Pack

This pack converts the approved Clearhead V1 workflow and the latest stripped-down repository into a code-aware implementation system for Codex.

## Authority order

1. The founder's latest explicit decision.
2. `PRODUCT_BIBLE.md`.
3. The approved `clearhead-workflow-spec.md` source material.
4. `TARGET_ARCHITECTURE.md` for implementation details.
5. Existing repository behaviour.

The existing code is evidence of the current implementation. It is not the product specification.

## Files

- `PRODUCT_BIBLE.md` — canonical product definition and workflows.
- `CURRENT_STATE_AUDIT.md` — what the supplied repository currently implements.
- `GAP_MATRIX.md` — requirement-by-requirement implementation gaps.
- `TARGET_ARCHITECTURE.md` — target state, services, browser enforcement, migrations and sync design.
- `ACCEPTANCE_TEST_CATALOGUE.md` — executable and manual criteria for V1.
- `IMPLEMENTATION_ROADMAP.md` — safe implementation phases and review gates.
- `CODEX_TASK_01_FOUNDATION.md` — first bounded Codex implementation task.
- `agents/AGENTS.root.md` — content to place at repository root as `AGENTS.md`.
- `agents/AGENTS.extension.md` — content to place in `apps/extension/AGENTS.md`.
- `agents/AGENTS.web.md` — content to place in `apps/web/AGENTS.md`.
- `agents/AGENTS.database.md` — content to place in `packages/database/AGENTS.md`.

## How to use this pack

1. Add the files to the original repository under a documentation directory such as `docs/clearhead-v1/`.
2. Copy the AGENTS files to the locations listed above.
3. Give Codex `CODEX_TASK_01_FOUNDATION.md` as its first task.
4. Require one reviewed pull request per phase in `IMPLEMENTATION_ROADMAP.md`.
5. Do not ask Codex to implement all of V1 in one task.

## Visual preservation rule

Preserve the current visual system, spacing, typography, colour treatment, components and brand assets by default. Change layout or component structure only when the canonical workflow requires it. Do not redesign for novelty.

## Verification note

The supplied repository was inspected statically. `npm ci` could not complete in the analysis environment because the configured package mirror did not contain a locked `zod@3.25.76` artifact. This is an environment registry failure, not proof of a repository defect. All build, lint, type-check and test claims must therefore be re-run in the original development environment before implementation begins.

## Source material

`SOURCE_WORKFLOW_SPEC.md` is the founder-approved workflow source supplied for this work. The Product Bible resolves it into the canonical, code-aware specification.
