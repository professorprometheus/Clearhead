# Extension-Specific Instructions

Read the root `AGENTS.md` and Clearhead V1 Product Bible first.

## Browser safety

- All tab/window operations go through the central tab service.
- Persist and verify a Stack before any Clearhead-initiated close.
- Add closes nothing.
- Swap must keep the current browser window alive and must not continue after partial close failure.
- Rule changes must use Clearhead-owned ID ranges and clean up on stop, timeout, reset, import rollback and startup reconciliation.
- Manifest V3 service-worker suspension is normal. Persist enough state to reconstruct Focus and schedules.
- Do not rely only on React component state for active operations.

## Focus

- Focus mode is explicit: `strict`, `checkin` or `standard`.
- Strict blocks new tabs/windows and new sites.
- Check-In trust is session-only; Continue does not count; Go Back counts.
- Standard is blocklist enforcement only.
- End Focus enters completion pending; it does not save a Stack.

## UI boundaries

- Popup: quick actions and current Focus/completion only.
- Side panel: Dashboard, Spaces, Stacks, Settings.
- Use shared Focus, Restore and Settings feature components.
- Do not use native `prompt()` for product workflows.
- Preserve existing design tokens/classes unless workflow requirements force a change.

## Chrome API tests

Browser enforcement changes require real built-extension Playwright tests for typed navigation, links, redirects, new tabs, new windows, alarms and restart reconstruction. Mock-only tests are insufficient.
