# Web-App-Specific Instructions

Read the root `AGENTS.md` and Product Bible first.

## Website contract

- Landing Free CTA is `Add to Chrome — free` and must not require signup.
- Pricing has two columns: Free and Pro.
- V1 is monthly billing only; do not add an annual toggle.
- Pro CTA starts the 30-day account trial.
- Trial has Pro capabilities except sync.
- Account/Billing must show sync status and any exact deletion deadline.

Preserve the current visual system but replace metaphorical/momentum copy with canonical concrete copy.

## Authentication

Implement the approved short-lived extension handoff. Do not assume extension fetches can rely indefinitely on web cookies.

Handoff credentials must be one-time, expiring, revocable and excluded from URLs/exports where possible.

## API behaviour

- Validate entitlement server-side.
- Free and Trial cannot use sync.
- Sync APIs are entity-based, local-first and tombstone-aware.
- Downgrade cleanup is idempotent and never affects local extension data.
- Retain events/stats when synced Stack content is purged.

Add integration tests for auth replay/expiry, plan gates, conflict resolution and grace deletion.
