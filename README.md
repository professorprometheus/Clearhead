# Clearhead

A browser productivity tool designed to help users protect focused work, manage large groups of tabs and return to previous work without losing context.

Clearhead combines a **Chromium browser extension** with a supporting web application and backend infrastructure. Rather than acting only as a timer or tab manager, the project explores how the browser itself can actively reduce distractions while preserving the user's work state.

> **Status:** Active development. The current repository contains a working foundation alongside a documented V1 redesign.

## The Problem

Browser-based work often creates two competing problems:

1. keeping dozens of useful tabs open creates clutter and makes switching tasks difficult;
2. closing those tabs removes the context needed to return to the task later.

Traditional focus timers also measure time without necessarily changing what the browser allows the user to do.

Clearhead explores a different approach: **preserve work context while actively changing browser behaviour during focused work.**

## Current Functionality

### Focus Sessions

Clearhead supports timed focus sessions inside the browser.

A focus session can:

* record a user's objective
* capture the tabs open when the session begins
* run for a selected duration
* apply website blocking rules
* track blocked distraction attempts
* maintain session state using browser storage and alarms
* record focus statistics

The extension uses Chrome's browser APIs rather than functioning as a standalone timer.

### Website and Route Blocking

Clearhead uses Chromium's **Declarative Net Request** and navigation APIs to enforce distraction rules.

Blocking supports:

* entire domains
* individual routes
* navigation changes in single-page applications
* redirects to a dedicated blocked page

This means blocking is not limited to simple URL checks performed when a page initially loads.

### Tab Capture and Parking

Browser tabs can be captured together with information needed to reconstruct the working context, including:

* URL
* page title
* favicon
* pinned state
* tab position
* tab-group information

One of the core safety principles in the implementation is:

**tabs should be persisted before they are closed.**

Parking operations therefore save the recoverable browser state before attempting to remove tabs, reducing the risk of losing a user's working context if an operation fails.

### Saving and Restoring Work

Groups of tabs can be saved and restored later.

Current restoration behaviour:

* reopens stored tabs
* avoids opening exact duplicate URLs already present
* restores them into the current browser window
* records when saved work was last restored

This allows a user to move between different pieces of browser-based work without keeping every context open simultaneously.

### Workspaces

The current implementation groups browser activity into Workspaces.

Workspaces support:

* creation
* renaming
* deletion
* switching between contexts
* associated blocking rules
* saved browser sessions

The V1 architecture is evolving this model into **Spaces** and **Stacks**, separating reusable working environments from recoverable groups of tabs.

### Dashboard and Statistics

The extension includes a side-panel interface for managing work and viewing activity.

Current statistics include metrics such as:

* completed focus sessions
* total focus time
* distractions blocked
* saved browser sessions

## V1 Product Direction

Clearhead's V1 architecture is being redesigned around three distinct concepts:

### Spaces

Reusable working environments representing broad contexts such as:

* School Revision
* Development
* Research
* Deep Work

A Space defines the environment in which focused work takes place.

### Stacks

Recoverable groups of browser tabs.

Stacks are designed to allow users to safely:

* park current work
* restore previous work
* switch between browser contexts
* resume a previous task without reconstructing it manually

### Focus Sessions

Timed periods in which Clearhead actively protects the user's selected task.

The planned V1 model introduces multiple focus behaviours, including:

* **Strict** — restrict browsing to the sites and tabs available when the session begins
* **Check-In** — interrupt navigation to new sites and require an explicit decision
* **Standard** — apply a Space's configured blocklist

These V1 behaviours are part of the ongoing implementation and should not be considered complete in the current build.

## Architecture

Clearhead is structured as an **npm workspace monorepo**:

```text
Clearhead/
│
├── apps/
│   ├── extension/          # Chromium browser extension
│   └── web/                # Website, authentication and account management
│
├── packages/
│   ├── database/           # Drizzle/PostgreSQL schema and migrations
│   ├── entitlements/       # Feature and subscription access logic
│   └── shared/             # Shared types and validation
│
├── docs/
│   └── clearhead-v1/       # Product and architecture specifications
│
└── package.json
```

This separates browser-specific behaviour, the web application and shared domain logic while allowing them to use common types and packages.

## Browser Extension

The extension is built with:

* **TypeScript**
* **React**
* **Plasmo**
* **Chrome Manifest V3**
* **Tailwind CSS**

It interacts with browser capabilities including:

* tabs
* tab groups
* local and session storage
* side panels
* alarms
* notifications
* web navigation
* Declarative Net Request

## Web Application

The accompanying web application provides infrastructure for:

* user authentication
* account management
* email verification and password reset
* subscription management
* billing

It is built using:

* **Next.js**
* **React**
* **TypeScript**
* **Better Auth**
* **Stripe**
* **Drizzle ORM**
* **PostgreSQL**
* **Zod**
* **Resend**

## Persistence

Browser state is primarily stored locally so that core productivity functionality does not depend on a remote connection.

The broader application also includes a PostgreSQL persistence layer using **Drizzle ORM**, with schema migrations managed through Drizzle Kit.

## Testing

The project includes several levels of automated verification:

* **TypeScript type checking**
* **ESLint**
* **Vitest** unit/integration testing
* **Playwright** end-to-end browser testing
* production build verification

The root verification workflow combines type checking, linting, tests and builds across the workspace.

```bash
npm run verify
```

Extension browser workflows can additionally be tested using:

```bash
npm run test:e2e
```

## Engineering Considerations

Some of the more important engineering problems explored by Clearhead include:

* coordinating asynchronous browser APIs
* safely persisting state before destructive browser operations
* restoring browser context after task switching
* managing extension state across popup closure and browser lifecycle events
* route-aware website blocking
* designing browser operations to tolerate partial failure
* separating local-first functionality from authenticated web services
* sharing domain types across extension and web applications
* managing product entitlements across free and paid functionality
* testing behaviour that depends on real browser state

## Tech Stack

**Languages & UI**

* TypeScript
* React
* Tailwind CSS

**Browser**

* Plasmo
* Chrome Extension Manifest V3
* Chrome APIs

**Web**

* Next.js
* Better Auth
* Stripe
* Resend

**Data**

* PostgreSQL
* Drizzle ORM
* Zod

**Testing & Tooling**

* Vitest
* Playwright
* ESLint
* npm Workspaces
* Gradle

## Development

Requires **Node.js 20.9+**.

Install dependencies:

```bash
npm install
```

Run the web application:

```bash
npm run dev
```

Run the extension in development mode:

```bash
npm run dev:extension
```

Build the complete workspace:

```bash
npm run build
```

Run verification:

```bash
npm run verify
```

## Documentation

The `docs/clearhead-v1` directory contains detailed product and engineering documentation covering:

* product behaviour
* target architecture
* implementation planning
* acceptance testing
* current-state analysis
* migration from the existing implementation to V1

These documents distinguish between the **currently implemented application** and the **intended V1 product**, allowing the redesign to be developed against explicit requirements rather than ad-hoc changes.
