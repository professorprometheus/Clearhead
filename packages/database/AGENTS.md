# Database-Specific Instructions

Read the root `AGENTS.md`, Product Bible and Target Architecture first.

## Migration rules

- Never edit an applied migration in place.
- Generate a new migration for every schema change.
- Preserve Better Auth and Stripe compatibility.
- Use stable IDs and timestamps required for last-write-wins sync.
- Use tombstones where a deletion must sync.
- Add indexes for user/entity pull queries, updated timestamps and grace cleanup.
- Rehearse forward migration and rollback/restore procedure.

## Data retention

- Local data is outside the database and must never be assumed deleted on downgrade.
- Server Stack/sync payloads may be deleted only after the 14-day deadline and only when Pro has not resumed.
- Events/stat history is retained.
- Cleanup jobs must be idempotent.

## Tests

Add schema/integration tests for ownership, cascade behaviour, tombstones, resubscribe cancellation and cleanup scope. A Space deletion must not accidentally cascade-delete Stacks that should be preserved/reassigned.
