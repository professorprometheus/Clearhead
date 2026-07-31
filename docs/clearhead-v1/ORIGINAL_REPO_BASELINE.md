# Original Repository Baseline

Date: 31 July 2026  
Repository: `C:\Users\obaag\OneDrive\Documents\Clearhead`  
Task: `docs/clearhead-v1/CODEX_TASK_01_FOUNDATION.md`

## 1. Scope and evidence rules

This report verifies the complete repository as supplied. `docs/clearhead-v1/PRODUCT_BIBLE.md` is the product authority; current code and old tests are evidence of the prototype only.

No product behaviour was changed. The required commands were run without repairing failures. Generated and dependency directories were necessarily read or refreshed by `npm ci`, builds and Playwright, but they are ignored by `.gitignore`. The only authored files for this task are this report and `docs/clearhead-v1/IMPLEMENTATION_FILE_MAP.md`.

### Git baseline limitation

Before any command or documentation write, `git status --short` reported every supplied repository path as untracked, beginning with:

```text
?? .gitignore
?? AGENTS.md
?? apps/
?? docs/
?? package-lock.json
?? package.json
?? packages/
?? tsconfig.base.json
```

`git branch --show-current` returned `master`, but `git rev-parse --verify HEAD` failed with `fatal: Needed a single revision`; `git branch --list main` and `git branch --list master` showed no committed branch. This is an unborn repository with no `HEAD` or `main`. Consequently:

- a comparison against unchanged `main` is impossible;
- default `git status --short` cannot show only the two deliverables, because all supplied files were already untracked;
- command failures below did occur on the supplied, otherwise unchanged working copy before either deliverable existed.

Before baseline commands, a broad 131-file snapshot outside `node_modules`, `.git`, `.next`, `build`, `dist`, `.plasmo`, `playwright-report` and `test-results` produced aggregate SHA-256 `6D0B8AF5FE293D6788D3EB2AD786B6A25A21BA9C097F3A8A6AF8EA8582F1F43F`. That broad set still included ignored `test-artifacts`, which the required E2E run refreshes, so it is recorded as provenance rather than used as the final protected-source comparison.

## 2. Repository inventory

### 2.1 Workspace root

`package.json` defines npm workspaces `apps/*` and `packages/*` and requires Node `>=20.9.0`.

| Workspace | Manifest | Purpose | Direct internal dependencies |
|---|---|---|---|
| `@clearhead/extension` | `apps/extension/package.json` | Plasmo React Manifest V3 extension | `@clearhead/entitlements`, `@clearhead/shared` |
| `@clearhead/web` | `apps/web/package.json` | Next.js marketing, authentication, account, billing and extension APIs | `@clearhead/database`, `@clearhead/entitlements`, `@clearhead/shared` |
| `@clearhead/database` | `packages/database/package.json` | Drizzle/Postgres schema, client and migrations | none of the other local packages |
| `@clearhead/entitlements` | `packages/entitlements/package.json` | Plan calculation and gates | `@clearhead/shared` |
| `@clearhead/shared` | `packages/shared/package.json` | Shared account/entitlement types and runtime validators | none |

Root configuration is `package.json`, `package-lock.json`, `tsconfig.base.json` and `.gitignore`. No `pnpm-workspace.yaml`, `turbo.json`, `npm-shrinkwrap.json` or `.github` directory is present.

### 2.2 Extension entry points and configuration

Plasmo convention maps these source entry points:

| Surface | Source entry | Important symbols |
|---|---|---|
| Service worker | `apps/extension/src/background.ts` | `captureTabs`, `clearRules`, `applyRules`, `finishFocus`, `saveSession`, `restoreSession`, `startFocus`, `clearHead`, `handle`; runtime/install/startup/alarm/web-navigation listeners |
| Toolbar popup | `apps/extension/src/popup.tsx` | `Popup`, `OpenTabCount` |
| Side panel | `apps/extension/src/sidepanel.tsx` | `SidePanel`, `Dashboard`, `Workspaces`, `Sessions`, `SessionDetails`, `FocusView`, `Settings`, `AccountPlanCard` |
| Options page | `apps/extension/src/options.tsx` | `Options` |
| Blocked tab | `apps/extension/src/tabs/blocked.tsx` | `Blocked` |

Supporting source is:

- state/protocol: `apps/extension/src/types/state.ts` (`SCHEMA_VERSION`, `Workspace`, `SavedTab`, `Session`, `FocusState`, `ClearheadState`, `createDefaultState`) and `apps/extension/src/types/messages.ts` (`Request`, `Response`, `send`);
- storage/domain helpers: `apps/extension/src/lib/storage.ts`, `domains.ts`, `time.ts`, `validation.ts`, `account.ts`;
- account client: `apps/extension/src/auth/auth-client.ts`, `apps/extension/src/hooks/useAccount.ts`;
- UI state/theme: `apps/extension/src/hooks/useClearhead.ts`;
- reusable visual/workflow components: `apps/extension/src/components/Brand.tsx`, `ClearheadMark.tsx`, `ClearHeadPicker.tsx`, `FocusControl.tsx`, `PlanBadge.tsx`, `SessionCapture.tsx`, `TabPickerRow.tsx`, `UpgradePrompt.tsx`;
- visual system: `apps/extension/src/styles/global.css`, `apps/extension/assets/icon.png`, `apps/extension/assets/icon.svg`.

Extension configuration files are `apps/extension/package.json` (including the source manifest), `.env.example`, `.eslintrc.cjs`, `playwright.config.ts`, `vitest.config.ts`, `postcss.config.js`, `tailwind.config.js` and `tsconfig.json`.

The generated Plasmo contract is visible in `apps/extension/.plasmo/chrome-mv3.plasmo.manifest.json` and `apps/extension/.plasmo/index.d.ts`; generated hosts include `popup.html`, `sidepanel.html`, `options.html` and `tabs/blocked.html`. The production output is `apps/extension/build/chrome-mv3-prod/manifest.json` plus hashed bundles and generated icons. The built manifest confirms:

- Manifest V3 service worker `static/background/index.js`;
- action popup `popup.html`;
- side panel `sidepanel.html`;
- full-tab options page `options.html`;
- permissions `sidePanel`, `tabs`, `tabGroups`, `storage`, `alarms`, `notifications`, `declarativeNetRequest`, `webNavigation`;
- host permissions `http://*/*` and `https://*/*`;
- web-accessible `tabs/blocked.html`.

There is no `minimum_chrome_version` and no content-script entry.

### 2.3 Web routes and supporting modules

The successful Next.js build reported these routes:

| Kind | Route | Source |
|---|---|---|
| Static page | `/` | `apps/web/src/app/page.tsx` (`Home`) |
| Static page | `/_not-found` | generated Next.js fallback |
| Dynamic page | `/account` | `apps/web/src/app/account/page.tsx` (`AccountPage`) |
| Dynamic page | `/account/billing` | `apps/web/src/app/account/billing/page.tsx` (`BillingPage`) |
| Dynamic page | `/account/security` | `apps/web/src/app/account/security/page.tsx` (`SecurityPage`) |
| Dynamic API | `/api/auth/[...all]` | `apps/web/src/app/api/auth/[...all]/route.ts` |
| Dynamic API | `/api/cron/trial-reminders` | `apps/web/src/app/api/cron/trial-reminders/route.ts` (`POST`) |
| Dynamic API | `/api/extension/entitlements` | `apps/web/src/app/api/extension/entitlements/route.ts` (`GET`, `OPTIONS`) |
| Dynamic API | `/api/extension/sync` | `apps/web/src/app/api/extension/sync/route.ts` (`GET`, `PUT`, `OPTIONS`) |
| Static page | `/checkout/cancelled` | `apps/web/src/app/checkout/cancelled/page.tsx` |
| Static page | `/checkout/success` | `apps/web/src/app/checkout/success/page.tsx` |
| Static page | `/forgot-password` | `apps/web/src/app/forgot-password/page.tsx` |
| Static page | `/pricing` | `apps/web/src/app/pricing/page.tsx` (`PricingPage`) |
| Static page | `/reset-password` | `apps/web/src/app/reset-password/page.tsx` |
| Static page | `/sign-in` | `apps/web/src/app/sign-in/page.tsx` |
| Static page | `/sign-up` | `apps/web/src/app/sign-up/page.tsx` |
| Static page | `/verify-email` | `apps/web/src/app/verify-email/page.tsx` |
| Static assets | `/icon.svg`, `/apple-icon.png` | `apps/web/src/app/icon.svg`, `apps/web/src/app/apple-icon.png` |

`apps/web/src/app/layout.tsx` and `apps/web/src/app/globals.css` provide the root shell and visual system. `apps/web/src/components/SiteHeader.tsx`, `Logo.tsx`, `ClearheadMark.tsx`, `PricingCards.tsx`, `AuthForm.tsx`, `AuthShell.tsx`, `AccountActions.tsx` and the password/email components supply reusable UI.

Server modules are:

- `apps/web/src/lib/auth.ts`: `auth`, Better Auth Drizzle adapter, bearer and cookie plugins, optional Google OAuth, email/password verification, account deletion guard, Stripe subscription integration and `userProfile` trial creation;
- `apps/web/src/lib/entitlements.ts`: `entitlementForUser`;
- `apps/web/src/lib/extension-api.ts`: `extensionSession`, `extensionCors`, `optionsResponse`;
- `apps/web/src/lib/server-db.ts`: `db`;
- `apps/web/src/lib/session.ts`: `currentSession`, `requireSession`;
- `apps/web/src/lib/emails.ts`: `sendClearheadEmail` and the existing reminder/billing email catalogue;
- `apps/web/src/lib/auth-client.ts`: browser Better Auth client.

Web configuration is `apps/web/.env.example`, `eslint.config.mjs`, `next.config.ts`, `postcss.config.js`, `tailwind.config.ts`, `tsconfig.json` and generated `next-env.d.ts`. `apps/web/tsconfig.tsbuildinfo` and `apps/web/.next/**` are generated material.

### 2.4 Database and migrations

`packages/database/src/schema.ts` exports these current tables:

| Symbol | SQL table | Purpose/current shape |
|---|---|---|
| `user` | `user` | Better Auth user plus `stripeCustomerId` |
| `session` | `session` | Better Auth sessions |
| `account` | `account` | Better Auth provider/credential accounts and encrypted OAuth token fields |
| `verification` | `verification` | verification/reset tokens |
| `subscription` | `subscription` | Better Auth Stripe subscription, monthly/year interval and lifecycle fields |
| `userProfile` | `user_profile` | 30-day trial dates and reminder stage |
| `processedStripeWebhook` | `processed_stripe_webhook` | webhook idempotency record |
| `syncedClearheadState` | `synced_clearhead_state` | opaque JSON state per `(userId, deviceId)` with integer revision |

`schema` exports all eight tables. `packages/database/src/index.ts` exports `createDatabase` and the schema. `packages/database/drizzle/0000_clearhead_foundation.sql` is the sole migration, recorded by `packages/database/drizzle/meta/_journal.json`. `packages/database/drizzle.config.ts` points Drizzle Kit at `src/schema.ts`, output `drizzle`, and `DATABASE_URL`.

There are no canonical server `spaces`, `blocklist_entries`, `stacks`, `focus_sessions`, `events`, sync cursor/device, handoff or downgrade-lifecycle tables.

### 2.5 Shared packages

- `packages/shared/src/index.ts` defines `SubscriptionStatus`, `BillingInterval`, `PlanName`, `EntitlementSnapshot`, `AccountSnapshot`, `isEntitlementSnapshot`, `isAccountSnapshot` and `parseAccountSnapshot`.
- `packages/entitlements/src/index.ts` defines `FREE_LIMITS`, `PRO_LIMITS`, `PlanSource`, `buildEntitlementSnapshot`, `localFreeEntitlement` and the current `can*` gates.

The current shared contract has count limits and obsolete capability flags. `buildEntitlementSnapshot` uses `const pro = plan !== "free"`, which grants Trial every feature including `cloudSync`.

### 2.6 Tests, fixtures, screenshots and CI

| Suite | Configuration | Inventory | Baseline result |
|---|---|---|---|
| Extension unit | `apps/extension/vitest.config.ts` | `apps/extension/tests/logic.test.ts`: 14 tests | 14 passed |
| Extension storage integration | same | `apps/extension/tests/storage.integration.test.ts`: 3 tests with an in-memory stub of `chrome.storage.local` | 3 passed |
| Entitlements unit | workspace default Vitest | `packages/entitlements/src/index.test.ts`: 3 tests | 3 passed, but assertions conflict with the Product Bible |
| Shared unit | `vitest run --passWithNoTests` | no test files | exit 0, no tests |
| Extension E2E | `apps/extension/playwright.config.ts` | `apps/extension/e2e/extension.spec.ts`: 9 serial scenarios | 5 passed, 4 failed |
| Web/API | none | no test script or test files | not present |
| Database | none | no test script or test files | not present |

The E2E harness launches `build/chrome-mv3-prod` using `chromium.launchPersistentContext`, discovers the MV3 service worker, records page/service-worker errors, uses an inline `node:http` fixture server, and writes screenshots/traces under ignored `test-artifacts/**`. It contains no separate fixture files.

Existing versioned-looking baseline images are present under `apps/extension/screenshots/`: `options-dark.png`, `popup-default.png`, `popup-save.png`, `side-dashboard.png`. The E2E source names eleven additional generated screenshots under `test-artifacts/screenshots`.

No `.github` directory or other CI workflow is present. `CH-REL-001` therefore has no repository CI implementation.

### 2.7 Instructions and architecture documents

Applicable instructions are:

- `AGENTS.md`;
- `apps/extension/AGENTS.md`;
- `apps/web/AGENTS.md`;
- `packages/database/AGENTS.md`.

Product/architecture material is `docs/clearhead-v1/PRODUCT_BIBLE.md`, `CURRENT_STATE_AUDIT.md`, `GAP_MATRIX.md`, `TARGET_ARCHITECTURE.md`, `ACCEPTANCE_TEST_CATALOGUE.md`, `IMPLEMENTATION_ROADMAP.md`, `SOURCE_WORKFLOW_SPEC.md`, `README.md` and `CODEX_TASK_01_FOUNDATION.md`.

## 3. Scripts and environment

### 3.1 Scripts

| Scope | Script | Exact command |
|---|---|---|
| Root | `dev` | `npm run dev --workspace=@clearhead/web` |
| Root | `dev:extension` | `npm run dev --workspace=@clearhead/extension` |
| Root | `build` | `npm run build --workspaces --if-present` |
| Root | `build:web` | `npm run build --workspace=@clearhead/web` |
| Root | `build:extension` | `npm run build --workspace=@clearhead/extension` |
| Root | `typecheck` | `npm run typecheck --workspaces --if-present` |
| Root | `lint` | `npm run lint --workspaces --if-present` |
| Root | `test` | `npm run test --workspaces --if-present` |
| Root | `test:e2e` | `npm run test:e2e --workspace=@clearhead/extension` |
| Root | `db:generate` | `npm run db:generate --workspace=@clearhead/database` |
| Root | `db:migrate` | `npm run db:migrate --workspace=@clearhead/database` |
| Root | `verify` | `npm run typecheck && npm run lint && npm run test && npm run build` |
| Extension | `dev`, `build` | `plasmo dev`, `plasmo build` |
| Extension | `typecheck`, `lint`, `test` | `tsc --noEmit`; `eslint . --ext .ts,.tsx --max-warnings 0`; `vitest run` |
| Extension | `test:e2e`, `test:e2e:headed` | build then `playwright test` or `playwright test --headed` |
| Web | `dev`, `build`, `start` | `next dev`, `next build`, `next start` |
| Web | `typecheck`, `lint` | `tsc --noEmit`, `eslint . --max-warnings 0` |
| Database | `typecheck`, `db:generate`, `db:migrate` | `tsc --noEmit`, `drizzle-kit generate`, `drizzle-kit migrate` |
| Entitlements | `typecheck`, `test` | `tsc --noEmit`, `vitest run` |
| Shared | `typecheck`, `test` | `tsc --noEmit`, `vitest run --passWithNoTests` |

### 3.2 Environment-variable names

No secret values were read or printed. Only `.env.example` files are present.

| Area | Names |
|---|---|
| Extension | `PLASMO_PUBLIC_API_URL`, `PLASMO_PUBLIC_WEB_URL` |
| Database/auth | `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |
| OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Email | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_ANNUAL_PRICE_ID` |
| Public URLs/CORS | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_EXTENSION_URL` |
| Cron | `CRON_SECRET` |

## 4. Exact command results

Commands were run in the task's required order. Later diagnostic/recheck commands are explicitly separated.

| Order | Command | Exit | Wall time | Exact outcome |
|---:|---|---:|---:|---|
| 1 | `node --version` | 0 | 0.6 s | `v24.18.0` |
| 2 | `npm --version` | 0 | 2.1 s | `11.16.0` |
| 3 | `npm ci` | 124 | 604.1 s | Command timeout after 604074 ms; no stdout/stderr package error. It did not reproduce the stripped audit's `zod@3.25.76` mirror 404. |
| 4 | `npm run typecheck` | 1 | 13.9 s | All five applicable workspaces attempted `tsc --noEmit`; `tsc` was then unavailable in `PATH` for each because the timed-out install had not exposed the binary yet. |
| 5 | `npm run lint` | 1 | 16.4 s | Extension and web attempted ESLint; `eslint` was then unavailable in `PATH`. |
| 6 | `npm run test` | 0 | 35.2 s | Extension 17/17 passed; entitlements 3/3 passed; shared reported no test files and exited 0. |
| 7 | `npm run build` | 0 | 140.7 s | Plasmo build passed in 30196 ms. Next.js compiled in 27.4 s, TypeScript in 27.1 s and generated 16 static-page slots. Four non-fatal warnings said `svgo` is required for htmlnano `minifySvg`. |
| 8 | `npm run test:e2e` | 1 | 486.4 s | Extension rebuilt in 29363 ms. Playwright ran 9 tests with one worker: 5 passed, 4 failed in 7.4 min. |

Supplemental diagnostics, without edits:

| Command | Exit | Outcome |
|---|---:|---|
| `npm ls --depth=0` | 0 | Locked top-level workspace tree resolved; notably `zod@3.25.76`, TypeScript `5.9.3`, ESLint and all workspace links were present. |
| `npm run typecheck` (recheck) | 0 | All five applicable workspaces passed after the binaries became available. |
| `npm run lint` (recheck) | 0 | Extension and web passed with `--max-warnings 0`. |
| `npm ls tldts --all` / `npm ls psl --all` | 1 | Both trees were empty; there is no public-suffix-list dependency. |

### 4.1 Failure register

| Failure | Classification | Relevant error/evidence | Smallest likely repair | On unchanged `main`? |
|---|---|---|---|---|
| `npm ci` timeout | Environment/I/O | Exit 124 after 604.1 s, no npm resolution error; repository is on OneDrive and the dependency tree later resolved | Re-run `npm ci` with a longer bound in a non-synchronised local path; inspect registry/cache only if it emits a real resolution error. Do not change the lockfile merely for this timeout. | Not testable: no `HEAD`/`main`. It occurred on the supplied working copy. |
| First `npm run typecheck` | Dependency-install timing | `'tsc' is not recognized`; supplemental recheck passed | Complete/wait for the locked install; no source repair indicated | Not testable; supplemental supplied-copy recheck passed. |
| First `npm run lint` | Dependency-install timing | `'eslint' is not recognized`; supplemental recheck passed | Complete/wait for the locked install; no source repair indicated | Not testable; supplemental supplied-copy recheck passed. |
| E2E Persona C Focus | Stale test expectation | 90 s timeout. Test uses selectors/copy absent from `FocusControl`: `Custom minutes`, `Current objective`, `Enter Focus`, `You are in focus`, `This is not what you chose`, `Pause and save my place`, `I finished it`. Current symbols render `Minutes`, `Outcome`, `Begin focus`, `Save my place`, etc. | For baseline only, align test selectors with the current build. For V1, replace obsolete assertions with CH-FOCUS/CH-STANDARD/CH-END cases; do not preserve rejected workflow. | Not testable; failed on supplied working copy. |
| E2E Clear My Head | Stale test expectation | `getByRole('heading', { name: 'Keep what matters open' })` not found; error snapshot shows actual `ClearHeadPicker` heading `What belongs with you now?` | Same baseline-only selector update; V1 should remove this obsolete product workflow and migrate safety coverage to parking/Focus cleanup tests. | Not testable; failed on supplied working copy. |
| E2E Focus alarm | Stale test expectation | 100 s timeout; same obsolete Focus selectors are used before the 70 s alarm poll | Rewrite against canonical Start/Stop/completion-pending flow and CH-END-001; retain exactly-once alarm/stat intent | Not testable; failed on supplied working copy. |
| E2E route-specific block | Stale test expectation | 90 s timeout; same obsolete Focus selectors precede otherwise useful DNR route assertions | Retain DNR route matching and cleanup assertions under CH-STANDARD-002/003, but drive canonical Standard mode | Not testable; failed on supplied working copy. |

The failing E2E artefacts are under ignored `apps/extension/test-artifacts/results/**`. No failure was fixed.

## 5. Current-state audit verification

Status meanings: **Confirmed** means the supplied audit matches the original source; **Corrected** means this repository adds or changes evidence; **Not present** means an audited implementation claim is absent. Absence findings (for example, no schedule engine) are marked Confirmed because the audit correctly reports the absence.

| Audit section | Status | Original-repository evidence and correction |
|---|---|---|
| 1. Repository shape | Confirmed | Workspaces and root scripts match `package.json` and the five workspace manifests. |
| 1. Verification status | Corrected | The original environment did not reproduce the mirror 404. `npm ci` timed out, but tests/build ran; supplemental typecheck/lint passed. E2E was 5/9, not verified green. |
| 2. Extension manifest/capabilities | Confirmed | `apps/extension/package.json` and generated `.plasmo/chrome-mv3.plasmo.manifest.json`/build manifest contain the listed MV3 permissions. Strict, Check-In, schedules, sync and handoff runtimes are absent. |
| 3. Current local product model | Confirmed | `SCHEMA_VERSION = 2`; exact symbols are `Workspace`, `Session`, `FocusState`, `WeeklyStats`, `Stats`, `Settings`, `ClearheadState`. |
| 3. Current entities | Confirmed | All canonical local data is currently embedded in the single `ClearheadState` object in `apps/extension/src/types/state.ts`. |
| 3. Workspace | Confirmed | `Workspace` has `id`, `name`, timestamps, `blockedDomains` and optional `defaultFocusDuration`; `createDefaultState` creates `Default Workspace`. |
| 3. Session | Confirmed | `Session` combines saved/parked/checkpoint meanings and has `objective`, `nextStep`, `checkpoint`, `outcome` and `focusMinutes`. |
| 3. FocusState | Confirmed | The active union stores ID, Workspace, objective, times, distraction count, optional resumed Session and starting tabs, but none of the canonical mode/window/site/completion fields. |
| 3. Statistics | Confirmed | `Stats` contains global counters and `weekly: WeeklyStats[]`; there is no daily Focus/event source or streak model. |
| 3. Settings | Confirmed | `Settings` contains theme, default duration and notifications only. |
| 4. Storage/migration | Confirmed | `migrateState`, `getState`, `setState`, `updateState`, `resetState`, `validateImport` use key `clearheadState` and a promise `queue`. Invalid owned state is replaced by `createDefaultState`. |
| 5. Background concentration | Confirmed | `apps/extension/src/background.ts` is 456 lines and contains tab, rules, Focus, save/restore/park, stats, alarms and routing. |
| 5.1 Tab capture | Confirmed | `captureTabs` and `toSavedTab` preserve title, URL, favicon, pin, index and group metadata and call `isEligibleTabUrl`. |
| 5.2 Current blocklist | Confirmed | `RULE_BASE`, `RULE_LIMIT`, `clearRules`, `applyRules`, the `onCommitted` counter and `blockClientSideNavigation` implement current Standard-like DNR/SPA behaviour with no mode/plan/Default restriction. |
| 5.3 Focus start | Confirmed | `startFocus` restores an optional Session, captures starting tabs, mutates `currentWorkspaceId`, creates `FOCUS_ALARM` and calls `applyRules`. No explicit mode, window/tab/site baseline, cleanup parking or events exist. |
| 5.4 Focus end | Confirmed | `finishFocus` captures live tabs, floors minutes, mutates weekly/global stats, auto-creates a checkpoint `Session`, invents `nextStep`, clears rules/alarm and emits motivational notification copy. |
| 5.5 Manual stop | Confirmed | `FocusControl.finish` offers `Mark complete`/`Save my place` and uses native `prompt`; `END_FOCUS` auto-saves. |
| 5.6 Save and park | Corrected | `saveSession` explicitly reads the state back before closing and leaves one browser tab. `clearHead` awaits `updateState` before closes but does **not** perform the explicit read-back verification used by `saveSession`. Both preserve a useful persist-before-close ordering, but only one verifies it. |
| 5.7 Restore | Confirmed | `restoreSession` is Add-only, strips fragments for duplicate keys, updates `lastRestoredAt`, and has no Swap/Space switch/operation ledger. |
| 5.8 Clear My Head | Confirmed | `clearHead` auto-creates a checkpoint with invented `objective`/`nextStep` then closes non-kept tabs. |
| 6. Current browser pages | Confirmed | The only custom browser tab entry is `apps/extension/src/tabs/blocked.tsx`; no separate Strict or Check-In page exists. |
| 6. Blocked page | Confirmed | `Blocked` is polished but mode-agnostic and includes rejected copy/action. |
| 7. Popup | Confirmed | `Popup` contains `PlanBadge`, settings, direct `updateState`, Workspace selector, Focus, Clear My Head, Session capture, counts and a generic side-panel action. |
| 8. Focus UI | Confirmed | `FocusControl` has objective/resume/duration, Pro custom-duration gating and obsolete active/end controls; it has no Space/mode/cleanup fields. |
| 9. Side panel | Confirmed | `View` and `views` contain Dashboard, Workspaces, Sessions, Focus, Settings. |
| 9.1 Dashboard | Confirmed | `Dashboard` duplicates Focus/actions and shows Outcomes, Focused, Deflected and Tabs now via `Stat`. |
| 9.2 Workspaces | Confirmed | `Workspaces` directly mutates state, gates with `canCreateWorkspace`/`canAddBlockedDomain`, allows Default blocklists and deletes Sessions when deleting a Workspace. |
| 9.3 Sessions | Confirmed | `Sessions`/`SessionDetails` implement search, filter, immediate restore, rename and delete with Free edit limits; no assignment/archive/Add-Swap/Focus Now. |
| 9.4 Focus view | Confirmed | `FocusView` duplicates `FocusControl`; `Feature` presents Strict as `entitlement.features.strictMode`. |
| 9.5 Settings | Confirmed | Side-panel `Settings` has theme/duration/notifications/account/export/import/reset; nav buttons are inert. Default mode/restore, grace, sync status and extension delete-account are absent. |
| 10. Options page | Confirmed | `Options` independently implements the same settings/account/data concerns and directly calls `updateState`. |
| 11. Entitlement model | Confirmed | `FREE_LIMITS`, `PRO_LIMITS`, `buildEntitlementSnapshot`, `canCreateSession`, `canUseCustomFocusDuration` and `canUseStrictMode` encode the audited conflicts. Tests explicitly require Trial sync and block the sixth Free Session. |
| 12. Current account/auth behaviour | Confirmed | Account handling is split between extension Better Auth/cookie access and the Next.js Better Auth/Stripe implementation; the approved handoff is absent. |
| 12. Extension account/auth | Confirmed | `authClient`, `getExtensionAccount`, `cachedAccount` and `disconnectAccount` depend on web session/cookie behaviour and session-cache `clearheadAccountCache`; no handoff or sync client exists. |
| 12. Web account/auth | Corrected | The audit is right, and the original shows more exact retained capability: Better Auth `bearer()` and `nextCookies()`, email/password + optional Google, account-delete subscription guard, Stripe checkout/cancel/restore/billing portal through `BillingActions`, webhook deduplication through `processedStripeWebhook`, and automatic `userProfile` trial creation. |
| 13. Current web product surface | Confirmed | Landing, pricing, auth, account and billing pages all exist under `apps/web/src/app`; their visual system is reusable while workflows/copy remain non-authoritative. |
| 13. Landing | Confirmed | `Home` and `SiteHeader` preserve a polished system but use rejected copy, obsolete mock concepts and signup CTAs. |
| 13. Pricing | Confirmed | `PricingCards` has `annual` state, three cards, annual discount, signup Free CTA and obsolete features. |
| 13. Account/billing | Corrected | Sync/grace are absent as audited. Existing `BillingActions` already provides Stripe billing portal/payment-method access, cancel and restore, so G-054 is partly implemented rather than wholly absent. |
| 14. Server/database | Confirmed | `syncedClearheadState` and `/api/extension/sync` are opaque device snapshots; canonical entities/tombstones/grace/cleanup and an extension sync client are absent. |
| 15. Schedules | Confirmed | No schedule model, UI or engine exists. Only `FOCUS_ALARM` supplies a reusable pattern. |
| 16. Tests | Corrected | Inventory is correct, but actual E2E is 5 passed/4 failed. The harness is valuable; stale expectations encode old copy, Default blocklists, automatic checkpoints, Clear My Head and old Session/Workspace flows. |
| 17. Reusable assets | Confirmed | Exact reusable symbols include `Brand`, `ClearheadMark`, `TabPickerRow`, `captureTabs`, storage `queue`, import rollback in `handle`, `normaliseDomain`/`blockTargetRegex`/`urlMatchesBlockTarget`, DNR range cleanup and Playwright error collectors. Preserve `global.css` and the web visual components. |
| 18. Highest risks | Confirmed | Strict/Check-In, Swap, V2→V3, schedule ownership, sync/tombstones, grace purge, auth handoff and workflow replacement remain the principal risks. |
| 19. Audit conclusion | Confirmed | The code is a strong prototype whose central `Workspace`/`Session`/Focus semantics conflict with the canonical model. |

No audited product subsystem was discovered in the original repository that makes a reported major gap “Not present”; the corrections above add exact original-repository evidence and baseline outcomes.

## 6. Material absent from or unverifiable in the stripped audit source

The stripped-audit note explicitly said generated/development material was omitted. The complete checkout contains or produced the following material not enumerated by that audit:

- installed workspace dependency trees under root/workspace `node_modules`;
- generated Plasmo scaffolding and manifest under `apps/extension/.plasmo/**`;
- production extension package under `apps/extension/build/chrome-mv3-prod/**`;
- Next.js output under `apps/web/.next/**` and `apps/web/tsconfig.tsbuildinfo`;
- four baseline images under `apps/extension/screenshots/**`;
- Playwright HTML/results/screenshots/traces under ignored `apps/extension/playwright-report/**` and `apps/extension/test-artifacts/**`;
- hidden `apps/extension/.eslintrc.cjs`, which must be included in the extension configuration inventory;
- the exact locked dependency resolution, including working local availability of `zod@3.25.76` after the timed-out install.

Some generated directories were refreshed by the mandated build/test commands, so their pre-command byte-for-byte provenance cannot be separated in this uncommitted checkout. No generated artefact is a task deliverable.

## 7. Security and configuration observations

- `apps/web/src/lib/auth.ts` has a build-only fallback Better Auth secret. Production must require `BETTER_AUTH_SECRET`; the fallback must never be accepted as a deployment secret.
- `apps/web/src/lib/server-db.ts` has a non-production fallback Postgres URL so builds can initialise modules. Runtime database work requires `DATABASE_URL`.
- `stripeConfigured` currently requires both monthly and annual Stripe IDs, and `PricingCards` exposes annual billing. V1 monthly-only work must remove that requirement in a later product phase, not this baseline task.
- Extension CORS accepts exactly `NEXT_PUBLIC_EXTENSION_URL` and uses credentialed requests. This is narrow, but the current extension still depends on web cookies; it is not the approved one-time handoff.
- Better Auth's bearer plugin is already installed server-side, but no extension credential issuance/revocation protocol exists.
- `syncedClearheadState.state` accepts any object up to 5 MB after only shallow envelope validation. It is plan-gated, user-scoped and CORS-scoped, but not canonical entity validation.
- `CRON_SECRET` protects trial reminders. No repository scheduler/CI invokes the route.
- Email functions fail when Resend is unconfigured. Builds do not send mail and did not require email secrets.
- No real `.env` or `.env.local` file is present; only examples were observed.
- Full `http://*/*` and `https://*/*` host access plus `tabs`, DNR and web-navigation permissions are powerful and user-visible. They are functionally consistent with V1 enforcement but require privacy/security review before release.

## 8. Product Bible feasibility constraints

These are implementation constraints, not proposals to weaken the product.

| Constraint | Repository/toolchain evidence | Smallest Product-Bible-consistent approach | Spike/approval |
|---|---|---|---|
| Chromium cannot cover browser-internal schemes through ordinary host match patterns. | The manifest requests only HTTP/HTTPS. Chrome's [match-pattern documentation](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns) lists valid schemes as HTTP, HTTPS, wildcard (HTTP/HTTPS) and file; current `isEligibleTabUrl` also excludes non-restorable internal URLs. | Document protected-page exceptions; enforce all exposed HTTP/HTTPS navigation and tab/window creation. Do not claim universal interception. | No founder approval: already allowed by Product Bible §7.3. Add E2E/manual coverage. |
| MV3 service-worker memory is ephemeral. | `recentBlockedAttempts`, `restoringSessions` and `savingOperations` are process globals. Chrome documents termination after inactivity and loss of globals in the [service-worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle). | Persist Focus runtime, operation ledger and dedupe state needed for correctness; reconstruct listeners/rules/alarms on worker start. | Required technical/E2E spike for G-013; no product change. |
| Alarms can be delayed and historically may not survive restart consistently. | Current `FOCUS_ALARM` is recreated only in `runtime.onStartup`. Chrome's [alarms reference](https://developer.chrome.com/docs/extensions/reference/api/alarms) says alarms can be delayed and recommends checking important alarms whenever the worker starts; explicit cross-session control is only new in Chrome 150. | Store authoritative deadlines, make finish/reconcile idempotent, inspect/recreate alarms on every relevant worker startup/event, and derive missed boundaries from time. | Required schedule/restart testing; no founder approval. Consider a declared minimum Chrome version only after compatibility review. |
| DNR is network-request based and rule matching/substitution has exact semantics that must be proven for Check-In URL recovery. | Current `applyRules` proves static URL redirect and route regex only. Chrome's [DNR reference](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest) documents one selected rule per request and `regexSubstitution` capture groups; `webNavigation` separately reports fragment/history events. | Run the mandatory Check-In spike using a web-accessible interrupt page, background-validated target, rule rebuild, and last-allowed state. Test typed URLs, redirects, new tabs, paths, queries, fragments and restart before committing the mechanism. | **Mandatory spike.** If exact intended URL cannot be preserved safely, stop for founder approval; do not weaken Check-In. |
| Strict site semantics require a public suffix list; hand-written last-two-label parsing is wrong for `github.io`, `co.uk`, etc. | No `tldts` or `psl` package is installed. Current `normaliseDomain` normalises block targets but does not compute registrable domains. | Add one reviewed PSL-aware dependency (target architecture recommends `tldts`) in Phase 3, centralise `siteKeyForUrl`, and fixture-test public suffix, IP and IDN cases. | Small dependency spike/benchmark; no product approval. |
| `sidePanel.open()` must follow a user interaction. | Current popup calls it directly from `openSidePanel`; the background `OPEN_SIDE_PANEL` handler requires `sender.tab?.windowId`, which is unreliable for an extension popup. Chrome's [side-panel reference](https://developer.chrome.com/docs/extensions/reference/api/sidePanel) requires a user gesture. | In each footer click, persist a short-lived section intent and call `chrome.sidePanel.open` in the same click chain; side panel consumes/clears the intent. | Focused E2E spike for both deep links; no product approval. |
| Safe Swap cannot assume bulk-close will leave a usable target window. | Current `saveSession` deliberately limits closes to `liveTabs.length - 1`; `restoreSession` never closes. The target architecture requires an anchor before replacing all tabs. | Persist/read-back an auto Stack, create a target/internal anchor in the same window, close captured tabs, abort on partial failure, then open the remainder and commit idempotently. | Required real-extension failure-injection spike; no product approval. |
| SPA route changes do not necessarily create a main-frame network request. | Current code explicitly supplements DNR with `webNavigation.onHistoryStateUpdated`; Chrome documents this separate event in the [webNavigation reference](https://developer.chrome.com/docs/extensions/reference/api/webNavigation). | Retain the existing `blockClientSideNavigation` pattern inside the new rule engine and deduplicate it with DNR events. | No founder approval; retain and expand E2E coverage. |
| Next.js Route Handlers do not create an autonomous scheduler. | The repository contains `POST /api/cron/trial-reminders` but no deployment scheduler. Next build reports it as an on-demand dynamic route. | Keep cleanup/reminder logic idempotent behind authenticated Route Handlers and configure the deployment platform to invoke them; do not rely on in-process timers. | Deployment/config spike required for downgrade purge; no product approval. |
| Opaque per-device JSON cannot provide entity ownership, LWW merge or tombstone semantics. | `syncedClearheadState` has only `(userId, deviceId)`, `revision`, `state`, `updatedAt`; GET returns all device blobs and PUT overwrites one device blob. | Add canonical tables/cursors/tombstones in new migrations, validate typed changes, use deterministic timestamp/device tie-breaks, and retain local-first queues. | Schema/API spike required. No product change; founder approval only if a retention-policy ambiguity arises. |
| Space deletion and grace cleanup need explicit foreign-key scope. | Current local `Workspaces` deletion filters Sessions. Existing Better Auth tables cascade by user; no product entity FKs exist yet. | Make Stack `spaceId` nullable or explicitly reassign before deletion; make cleanup queries target sync payload tables only and prove events/stats remain. | Migration rehearsal required; no founder approval if Product Bible retention is followed. |

No discovered platform constraint currently requires weakening Strict, Check-In, parking, Swap, local-first operation or the entitlement model. The only founder-approval stop condition is a failed Check-In URL-integrity spike (or a newly discovered equivalent Chromium impossibility).

## 9. Baseline conclusion

The original repository confirms the audit's architectural diagnosis and adds useful complete-repository assets: a working locked dependency tree after delayed installation, buildable extension/web applications, real built-extension Playwright infrastructure, existing Stripe billing controls, generated manifests and visual baselines. It also establishes pre-existing E2E/test-expectation drift.

V1 implementation must begin with the contracts/migration boundary in the roadmap. Current green unit tests and successful builds do not verify the Product Bible; several passing tests explicitly assert rejected behaviour. `CH-REL-001` is not satisfied because E2E fails and this checkout has no CI/main baseline.

### Final protected-file integrity evidence

At final verification, 118 source/configuration/test/asset files—excluding the two deliverables and generated/dependency paths including `apps/web/tsconfig.tsbuildinfo`—produced aggregate SHA-256 `7092F68779CDBBE9F333E5D7D014473CE746E52A559A1DBA887E470C077F689F`. `package-lock.json` SHA-256 is `BB5F56E579504F5759431DC1A34219960C1255321FE2491A2FCB737ABA11D24E`. A targeted last-write audit across root manifests/configuration, application source/tests/E2E and all package files found no protected file dated on or after 15:00, before the first baseline command; only the two reports were authored during the task. Git cannot supply a content diff because the checkout has no `HEAD`.
