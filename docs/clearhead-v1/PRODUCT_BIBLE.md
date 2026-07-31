# Clearhead Product Bible — V1

Status: Canonical V1 specification  
Product: Clearhead  
Platform: Desktop Chromium browser extension with a Next.js marketing, account and billing application  
AI in V1: None

---

## 1. Product thesis

Clearhead is the productivity layer for the desktop browser.

The browser is where modern work happens, but it is not designed around deliberate work. It treats the task a user chose, an unfinished project, an interesting link and an impulse to open TikTok as equally available actions. Tabs preserve pages but not intention. Blockers restrict sites but do not preserve working context. Timers measure time but do not intervene. Task managers sit outside the environment where the work actually happens.

Clearhead connects focus protection, working-context preservation, tab transitions and browser organisation into one coherent system.

Clearhead should help anyone who performs meaningful work in a browser:

- decide what matters now;
- prepare the browser for that decision;
- prevent impulsive changes of direction;
- preserve work before it is moved out of the way;
- switch between projects without reconstructing context;
- return to previous work quickly and confidently.

The long-term ambition is that opening a browser without Clearhead feels like working without tabs, search or a task manager: possible, but unnecessarily difficult.

## 2. Product promise

Clearhead makes deliberate work the browser's default behaviour.

Using Clearhead should make the user feel:

- clear about what they are doing;
- confident that nothing important has been lost;
- protected from automatic distraction;
- able to change tasks without creating chaos;
- in control of the browser rather than controlled by it.

## 3. Positioning

Clearhead is not merely:

- a tab manager;
- a website blocker;
- a Pomodoro timer;
- a bookmark manager;
- a workspace organiser;
- a generic task manager.

It combines the useful parts of those categories around one job: helping the user begin, protect, pause and resume browser-based work.

## 4. Product principles

### 4.1 Value before organisation

A new user must be able to start Focus immediately. They must not be forced to create a Space, Stack or account first.

### 4.2 Active protection, not passive measurement

A Focus timer without intervention is not enough. Every Focus mode must change browser behaviour.

### 4.3 Nothing closes without recovery

Any Clearhead action that closes a user tab must first persist a recoverable Stack containing that tab. If persistence fails, the tab must remain open.

### 4.4 Organisation follows real work

Stacks should emerge from actual work: parked tabs, swapped contexts or a completed Focus session. The product must not require elaborate setup before value.

### 4.5 One concept, one meaning

- A Space is a reusable behavioural environment.
- A Stack is a saved group of tabs.
- A Focus Session is a timed period of active attention protection.

These terms must not be used interchangeably.

### 4.6 The popup is for action

The popup answers: “What can I do in five seconds?” It is not a settings or management surface.

### 4.7 The side panel is the management centre

The side panel manages Spaces, Stacks, statistics and settings. It must not duplicate the popup without a clear reason.

### 4.8 Preserve the user's control

Clearhead does not use AI in V1. It does not guess which tabs matter, decide whether a site is relevant, or invent objectives and next steps.

### 4.9 Safety before speed

Tab closure, Swap restore, import, reset, sync and downgrade flows must be designed so partial failure cannot silently destroy user data.

### 4.10 Neutral, functional copy

In-app language is terse, concrete and non-motivational. The website may persuade, but it still uses specific language rather than metaphor.

## 5. Target users

Clearhead is designed broadly for people who do productive work in a desktop browser, including students, researchers, founders, developers, writers, designers, analysts and professionals.

The initial high-intent user is someone who experiences at least one of these moments:

- They have many open tabs and cannot see what belongs to the task at hand.
- They want to change projects without losing the current browser context.
- They begin a task but automatically open unrelated sites.
- They use a timer but still drift because the browser does not intervene.
- They return to work later and cannot remember which tabs mattered or what they were doing.
- They want different browsing rules for different kinds of work.

## 6. Canonical terminology

### 6.1 Space

A Space is a reusable behavioural environment.

A Space contains:

- a name;
- optional Pro blocklist entries;
- an optional Pro schedule;
- associated Stacks.

Examples of suitable Space names:

- Default
- School Revision
- Business
- Deep Work
- Distraction-free Focus

Spaces should represent working modes or broad contexts, not narrow one-off tasks.

Rules:

- Every user has a Default Space.
- The Default Space is renameable but cannot be deleted.
- Free supports one Space: the Default Space.
- Trial and Pro support additional Spaces.
- Only one Space can be active at a time.
- Activating or switching a Space never closes tabs by itself.
- A Space can be used for Focus even when it has no Stacks.
- Standard mode is never available on the Default Space.

### 6.2 Stack

A Stack is a recoverable saved group of browser tabs.

A Stack contains:

- a stable ID;
- a name;
- an optional Space assignment;
- a tab list with title, URL and restorable tab metadata;
- creation and update timestamps;
- last-restored timestamp;
- archive state;
- source information;
- optional Focus outcome and Focus Session reference.

A Stack may be created by:

- saving at the end of a Focus Session;
- automatically parking tabs before a Swap restore;
- automatically parking tabs selected for closure before Focus begins;
- any later explicit parking action approved for the product.

Rules:

- Free, Trial and Pro all support unlimited local Stacks.
- Restoring a Stack does not consume or delete it.
- A Stack can be reassigned to any Space.
- A Stack can be archived or deleted.
- Archived Stacks remain recoverable until deleted.
- Clearhead must never close tabs for parking unless the Stack has been persisted successfully.

### 6.3 Focus Session

A Focus Session is a timed period during which Clearhead actively protects the user's stated outcome.

A Focus Session contains:

- the selected Space;
- the user's outcome;
- one Focus mode;
- start and end times;
- the browser window being protected;
- the tabs and site keys allowed at the start;
- session-specific trusted and declined sites where applicable;
- distractions blocked;
- a snapshot of tabs at session end;
- completion state.

A Focus Session is not automatically a Stack. When it ends, the user chooses whether to save the end-state tabs as a Stack or discard that save opportunity.

### 6.4 Active Space

The Active Space is the single Space whose environmental rules currently apply.

A Focus Session may activate its selected Space. A Pro schedule may also activate a Space. Starting Focus in another Space deactivates the previous Space first. Tab state is never changed merely by a Space switch.

### 6.5 Parking

Parking means:

1. capture tabs into a recoverable Stack;
2. verify the Stack was persisted;
3. close those tabs;
4. report any tabs that could not be closed.

Closing without saving is not parking and must not be performed by Clearhead.

### 6.6 Restore modes

- **Add to current tabs**: open the Stack's restorable tabs alongside current tabs. Close nothing.
- **Swap in**: persist the current tabs as a new auto-named Stack, safely close them, then open the selected Stack.

### 6.7 Focus modes

- **Strict**: confine the user to the tabs and sites present when Focus begins.
- **Check-In**: interrupt visits to a site not yet trusted for the current session and ask the user to decide.
- **Standard**: enforce the selected Space's Pro blocklist.

## 7. Site and route semantics

Clearhead distinguishes a site from a route.

### 7.1 Site key

For Strict and Check-In, a site is the registrable domain, calculated using the public suffix list where possible.

Examples:

- `docs.google.com` and `drive.google.com` share the site key `google.com`.
- `www.youtube.com/watch` and `youtube.com/shorts` share `youtube.com`.
- `tiktok.com` is a different site.
- IP addresses use the full host as the site key.

URL paths, query strings and fragments do not create a new site for Strict or Check-In.

### 7.2 Standard blocklist target

Standard mode may target either:

- a whole site, such as `reddit.com`; or
- a route, such as `youtube.com/shorts`.

A route target matches that path and its descendants, not unrelated paths on the same site.

### 7.3 Browser limitations

Clearhead protects web navigation that Chromium extensions are permitted to observe and control. Browser-protected pages such as some `chrome://` pages and the Chrome Web Store may be outside extension control. New-tab and new-window restrictions still apply where Chromium exposes the relevant event.

This limitation must be documented in engineering and QA. It must not be hidden by a false claim of universal interception.

## 8. Plan and entitlement model

### 8.1 Free

Free requires no account and includes:

- Quick Focus;
- Strict mode;
- Check-In mode;
- one Default Space;
- unlimited local Stacks;
- today's focus time;
- current streak;
- distractions blocked today;
- local-only storage;
- JSON export and import;
- all standard Focus durations and Focus defaults.

Free does not include:

- additional Spaces;
- Standard mode or blocklists;
- route-aware blocking;
- scheduled Focus;
- cross-device sync;
- historical trend charts;
- reopen-rate insights and archive suggestions.

### 8.2 Trial

Trial lasts 30 days and includes every Pro feature except sync.

Rules:

- Trial does not begin at extension installation.
- No account is required to use Free.
- The first contextual attempt to use a Pro feature offers account creation and a trial.
- A user may also begin the trial from the website pricing page.
- Trial data remains local because sync is disabled.
- The product must not claim that Trial includes sync.

### 8.3 Pro

Pro is a paid monthly subscription and includes:

- unlimited Spaces;
- Standard mode;
- whole-site and route-aware blocklists;
- scheduled Focus with break windows;
- cross-device sync;
- weekly and historical trend charts;
- reopen-rate insights and archive suggestions.

The displayed price is deployment configuration and must match the active monthly Stripe price. V1 has no annual plan or annual billing toggle.

### 8.4 Downgrade

When Trial ends or Pro access ends:

- local Spaces and Stacks are never deleted;
- local focus history and statistics are never deleted;
- sync stops immediately;
- Pro-only blocklists and schedules stop enforcing;
- additional existing Spaces remain visible and their local Stacks remain accessible;
- the user cannot create additional Spaces while Free;
- server-side synced Stack content receives a 14-day deletion deadline if such data exists;
- the extension and account page show the exact deletion date/countdown;
- resubscribing before deletion cancels the pending deletion;
- server-side event/stat history is retained indefinitely;
- JSON export remains available.

Existing additional Spaces after downgrade are preserved. They may be selected for local Strict or Check-In Focus and used to access their Stacks, but Pro-only settings are locked and new additional Spaces cannot be created.

## 9. Information architecture

### 9.1 Popup

The popup contains quick actions only.

Persistent footer navigation in every popup state:

- **Spaces** — opens the side panel directly to Spaces.
- **Dashboard** — opens the side panel directly to Dashboard.

The popup must not contain:

- a settings icon;
- a plan badge unless a contextual upgrade state requires it;
- live tab counts;
- checkpoint counts;
- workspace selectors outside the Focus flow;
- “Open side panel” or “Open focus home” wording.

### 9.2 Side panel

The side panel has four primary sections:

1. Dashboard
2. Spaces
3. Stacks
4. Settings

There is no separate top-level Focus section. Focus is started from the popup or a Space detail action.

### 9.3 Web app

The web app contains:

- landing page;
- separate pricing page;
- sign-in and account creation;
- account page;
- billing page;
- extension authentication handoff;
- API routes for entitlements, sync and downgrade lifecycle.

## 10. Canonical workflows

### 10.1 Installation and first popup

Preconditions:

- Default Space exists locally.
- No Stacks exist.
- No account is required.

Popup content:

- **Start Focus**
- footer: **Spaces**, **Dashboard**

No empty-state explanation is shown.

### 10.2 Start Focus setup

The Start Focus flow contains these fields in this order:

1. **Space**
   - defaults to Default;
   - may select any available Space.
2. **What are you working on?**
   - required free text;
   - maximum 120 characters.
3. **Mode**
   - Strict: always available;
   - Check-In: always available;
   - Standard: shown only when the selected non-Default Space has at least one blocklist entry and the user is Trial or Pro.
4. **Duration**
   - default 25 minutes;
   - uses the saved default;
   - valid range 1–1,440 minutes.
5. **Close unrelated tabs**
   - optional collapsible section;
   - contains eligible tabs in the current window;
   - every tab is initially selected for closure;
   - the user unselects tabs that should remain;
   - selected tabs are automatically parked into a recoverable Stack before closure;
   - Focus cannot start if persistence of that parking Stack fails;
   - at least one eligible tab must remain open when Strict is selected.
6. **Start Focus**

On Start Focus:

1. Validate plan, Space, mode, duration and kept-tab requirements.
2. Persist selected-to-close tabs as an auto-named Stack assigned to the previously Active Space, or Default if none.
3. Close only after persistence succeeds.
4. If any requested closure fails, do not begin Focus; report the remaining tabs. The Stack remains available.
5. Deactivate a different Active Space if necessary.
6. Activate the selected Space and log `space_activated`.
7. Record the remaining tab IDs and site keys.
8. Apply mode-specific protection.
9. Start the timer.

No AI chooses unrelated tabs.

### 10.3 Strict mode

At the moment protection begins, Clearhead records:

- the protected window;
- every existing eligible tab ID in that window;
- the site key currently loaded in each tab;
- the union of initial allowed site keys.

During Strict:

- existing tabs remain usable;
- same-site navigation is allowed;
- navigation to a site not in the initial allowed-site set is blocked;
- typing a new site into an existing tab is blocked;
- redirects to a new site are blocked;
- every newly created tab is closed;
- duplicated tabs are closed because they are new tabs;
- links using `target=_blank` are blocked by closing the new tab;
- newly created windows are closed;
- closing an original tab does not grant permission to create a replacement;
- Strict cannot be overridden with a Continue button.

Example:

If `docs.google.com` and `bbc.co.uk` are open at start, Google and BBC remain available. Navigating an existing tab to `tiktok.com` is blocked. Opening a new Google tab is also blocked because it is a new tab.

A blocked attempt increments distractions blocked and records the relevant event without double-counting the same redirect cycle.

### 10.4 Check-In mode

At start, sites already open in the protected window are trusted for the session.

When a tab attempts to visit an untrusted site, Clearhead shows an interrupt:

> You're focusing on: [outcome]. Is [site] related?
>
> Continue  
> Go Back

**Continue**:

- trusts the site for the rest of this Focus Session;
- resumes the intended navigation;
- does not increment distractions blocked;
- does not trust the site in later sessions.

**Go Back**:

- cancels the intended navigation;
- restores the last allowed URL/state for that tab where possible;
- records `checkin_declined`;
- increments distractions blocked.

New tabs are permitted in Check-In. An untrusted destination in a new tab still triggers the interrupt. Blank browser tabs do not create a trusted site.

### 10.5 Standard mode

Standard is available only when:

- the selected Space is not Default;
- the selected Space contains at least one blocklist entry;
- the user is Trial or Pro.

During Standard:

- matching whole sites or routes are redirected to the blocked state;
- unrelated sites remain available;
- SPA route changes are checked as well as full document requests;
- each real blocked attempt records `block_triggered` and increments distractions blocked;
- duplicate browser events from one attempt are de-duplicated.

### 10.6 During Focus popup

When the popup is reopened during an active session, it shows only:

- outcome text, read-only;
- time remaining;
- **Stop Focus**;
- persistent footer navigation.

It must not offer “Mark complete”, “Save my place”, invented next-step prompts or duplicate management actions.

### 10.7 Session end

A session ends when:

- the timer completes; or
- the user selects Stop Focus.

At end:

1. Stop mode-specific enforcement.
2. Capture the eligible tabs open in the protected window at that moment.
3. Record ended time and duration.
4. Add duration to today's focus time.
5. Update streak eligibility.
6. Log `space_deactivated` and deactivate the Focus-owned Space.
7. If a scheduled Space should currently be active, reconcile and resume its rules after the Focus completion state is recorded.
8. Enter a persistent completion-pending state.

Popup completion state:

> Session complete. [X] minutes focused.
>
> Save as Stack?
>
> [text field prefilled with outcome]
>
> Save Stack  
> Discard

**Save Stack**:

- creates a Stack from the captured end-of-session tabs, not tabs opened later;
- preserves outcome and Focus Session reference;
- assigns it to the Focus Space;
- returns to the normal popup.

**Discard**:

- creates no Stack;
- retains the Focus Session history and statistics;
- returns to the normal popup.

The completion prompt survives popup closure, browser restart and service-worker suspension until the user resolves it.

### 10.8 Returning popup

When at least one non-archived Stack exists, the popup shows:

- **Start Focus** as the primary action;
- **Recent Stacks**, the 2–3 most recent by restore or creation activity;
- each Stack's name and a **Focus Now** action;
- **View all Stacks**;
- footer: **Spaces**, **Dashboard**.

Tapping a Stack opens the inline restore panel.

### 10.9 Focus Now

Focus Now is a one-action continuation path.

It:

1. restores the Stack using the user's saved default restore behaviour;
2. uses the Stack's assigned Space, or Default when unassigned;
3. uses the saved default Focus mode and duration;
4. pre-fills the outcome from the Stack's outcome or name;
5. activates the Stack's Space;
6. starts protection after restoration succeeds.

If the saved default mode is unavailable for that Space or plan, use Check-In and tell the user in the result state. If Swap parking fails, restoration and Focus do not continue. If restoration succeeds but Focus cannot begin, restored tabs remain open and a clear error is shown.

### 10.10 Manual restore panel

The panel is inline and contains:

- mutually exclusive **Add to current tabs** and **Swap in** choices;
- the user's last choice selected by default;
- conditional **Switch to [Space name]?** only when Swap is selected and the Stack belongs to a different Space from the Active Space;
- **Restore**.

Add:

- opens restorable Stack tabs alongside current tabs;
- avoids duplicate exact URLs already open in the current window;
- closes nothing;
- updates last-restored time and logs `stack_restored`.

Swap:

1. capture all eligible current-window tabs;
2. persist an auto-named Stack such as `Unsorted – 31 Jul 2026`;
3. verify persistence;
4. safely replace current tabs without allowing the window to disappear;
5. open the selected Stack;
6. optionally switch the Active Space when the conditional checkbox is checked;
7. update both Stack records and log events.

If any current tab cannot be safely parked or closed, do not open the target Stack in Swap mode. Report the exact failure and leave the auto-parked Stack recoverable.

### 10.11 Dashboard

Always visible on Free:

- today's focus time;
- current streak;
- distractions blocked today.

Trial and Pro:

- weekly and historical focus-time chart;
- reopen-rate insights;
- archive suggestions.

Free and downgraded users see the Pro sections locked with their real locally available values where data exists. Today's three core statistics remain visible and usable.

Dropped metrics:

- Outcomes count;
- Tabs now.

### 10.12 Streak definition

A day qualifies when at least 60 seconds of Focus time is recorded in the user's local calendar day.

Current streak is the number of consecutive qualifying calendar days ending today, or ending yesterday when the user has not yet focused today. Time-zone changes recalculate future day boundaries without rewriting historical event timestamps.

### 10.13 Reopen insights

A Stack is eligible for an archive suggestion when:

- it is not archived;
- it was created at least 14 days ago;
- it has not been restored in the last 14 days.

The Dashboard may show up to three deterministic suggestions. The user chooses whether to archive. Clearhead does not auto-archive.

### 10.14 Spaces section

The Spaces list shows:

- Default Space;
- additional Spaces for Trial/Pro or preserved downgraded data;
- **New Space** when permitted.

Space detail contains:

- editable name;
- Pro blocklist section;
- Pro scheduled Focus section;
- **Start Focus** pre-scoped to that Space.

Blocklist:

- locked on Free;
- unavailable for enforcement on Default even during Trial/Pro;
- supports whole-site and route entries;
- add/remove operations are validated and de-duplicated.

Scheduled Focus:

- Trial/Pro only;
- days of week, start time and end time;
- one or more break windows;
- overlaps with another Space's enabled schedule are rejected;
- start/end activate and deactivate the Space using the same events as manual activation;
- breaks pause blocking and resume automatically;
- scheduled enforcement does not itself add Focus minutes because no timed user outcome was started;
- an explicit Focus Session temporarily overrides scheduled rules;
- the schedule engine reconciles after that Focus ends.

### 10.15 Stacks section

The Stacks section provides:

- searchable full list;
- name;
- Space assignment dropdown;
- tab count;
- last-restored date;
- Restore;
- Archive/Unarchive;
- Delete.

Search is local and available on all plans. Advanced search is not a V1 entitlement or marketing claim.

### 10.16 Settings

Settings contains:

- Account: sign in, create account, signed-in identity, sign out;
- Data: export JSON, import JSON, reset local data;
- Focus defaults: default duration, default mode, default Add/Swap behaviour;
- Notifications: completion notifications;
- Theme: light, dark, system;
- Plan: Free, Trial or Pro; upgrade/manage billing; trial and grace countdowns;
- Danger zone: delete account.

Reset local data and delete account are separate operations.

Default settings:

- duration: 25 minutes;
- mode: Check-In;
- restore behaviour: Add to current tabs;
- completion notifications: enabled;
- theme: system unless an existing installation already has a preference.

### 10.17 Data export and import

Export is available on every plan and contains:

- schema version;
- Spaces;
- blocklist entries;
- Stacks and tab lists;
- Focus Session history;
- events and statistics;
- settings;
- archive state;
- sync metadata necessary for safe re-import, excluding credentials and tokens.

Import:

- validates before replacing local state;
- never imports authentication tokens;
- supports the current schema and approved legacy migrations;
- leaves existing state untouched if validation or rule restoration fails.

### 10.18 Authentication handoff

The extension opens the web sign-in flow in a browser tab. After successful sign-in, a short-lived one-time handoff gives the extension a revocable bearer credential. The extension must not rely on cross-origin browser cookies being available indefinitely.

The handoff must:

- expire quickly;
- be single use;
- be tied to the initiating extension/device request;
- avoid placing a long-lived token in a URL;
- support sign-out and revocation.

### 10.19 Sync

Sync is Pro only and disabled during Trial.

Rules:

- local state remains authoritative for offline work;
- local entity changes are pushed immediately or lightly batched;
- startup and reconnection pull remote changes;
- IDs are stable UUIDs;
- conflicts use last-write-wins by entity update timestamp, with a deterministic tie-break;
- deletions use tombstones so deletion syncs instead of resurrecting data;
- initial Pro sync merges local and remote records instead of blindly replacing one side;
- sync failures never block local parking, restoration or Focus;
- tokens and browser-only runtime state are never synced.

### 10.20 Downgrade grace deletion

When paid sync access ends and server-side Stack data exists:

- set a deletion deadline 14 days later;
- return the deadline in account/entitlement APIs;
- show it in extension Settings and web Account/Billing;
- block further pushes and pulls immediately;
- retain server data until the deadline;
- cancel deletion if Pro resumes;
- delete server Stack payloads and related tombstones after the deadline;
- retain event/stat history;
- never delete local data.

## 11. Website

### 11.1 Landing page

Hero:

- **Turn open tabs into finished work.**
- **Park distracting tabs. Block distracting sites. Restore where you left off.**
- **Add to Chrome — free**

The CTA must not imply signup.

How it works:

1. Park
2. Focus
3. Block
4. Restore

Each step uses one blunt sentence. Pricing is not embedded in the landing page.

### 11.2 Pricing page

Two columns only:

- Free
- Pro

Use the exact plan split in this Bible.

CTAs:

- Free: **Add to Chrome — free**
- Pro: **Start free trial**

No annual billing toggle in V1.

### 11.3 Account and billing

Show:

- current plan;
- trial countdown;
- upgrade, downgrade and cancel actions;
- payment method management;
- sync status;
- 14-day deletion deadline when active.

## 12. Copy rules

### 12.1 In-app

Use:

- Start Focus
- Stop Focus
- Save Stack
- Discard
- Recent Stacks
- View all Stacks
- Add to current tabs
- Swap in
- Restore
- Focus complete
- Distractions blocked

Avoid:

- Ready to crush your goals?
- Momentum saved
- Clear My Head
- Stay with what matters
- Open focus home
- Make room for the work
- Your browser is ready
- Magic workspace
- Your productivity journey
- Checkpoint
- Session, when referring to a Stack
- Workspace, when referring to a Space

No emojis, artificial enthusiasm, motivational filler or invented next steps.

### 12.2 Website

Website copy may persuade but must remain concrete. Avoid abstract momentum, train-of-thought, calm-system and “one uninterrupted loop” language.

## 13. Visual preservation

The current implementation's visual quality is an asset.

Preserve by default:

- brand mark and logo treatment;
- colour palette and gradients;
- typography scale;
- card, field, button and navigation styling;
- spacing rhythm;
- light/dark theme treatment;
- polished empty, loading and error states;
- responsive behaviour.

Change:

- screen hierarchy;
- navigation labels;
- component composition;
- copy;
- controls required by canonical workflows;
- duplicated surfaces;
- locked-state presentation where the entitlement model changed.

Do not reproduce the old workflow merely to preserve a layout.

## 14. Non-goals for V1

- AI classification or recommendations;
- AI-generated outcomes, task names or next steps;
- mobile browsers;
- native desktop applications;
- a general task manager;
- collaborative shared Spaces or Stacks;
- team administration;
- annual billing;
- automatic tab relevance guessing;
- silent automatic archiving;
- new generic productivity features without a direct connection to focus, context preservation or transitions.

## 15. Product invariants

These must remain true across all implementations:

1. No account is required for Free.
2. Free has unlimited local Stacks.
3. Strict and Check-In are Free.
4. Trial has Pro features except sync.
5. Standard is Pro/Trial and never available on Default.
6. Every Clearhead-initiated tab closure is preceded by successful persistence.
7. Focus does not auto-create a Stack.
8. Check-In trust lasts only for the current Focus Session.
9. Strict blocks new tabs and new sites.
10. Add closes nothing.
11. Swap parks before closing.
12. Local data is never deleted by downgrade.
13. Sync failure never prevents local work.
14. Popup and side panel have distinct responsibilities.
15. V1 contains no AI.
16. Existing visual quality is preserved unless workflow correctness requires change.
