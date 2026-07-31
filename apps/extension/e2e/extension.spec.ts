import {
  expect,
  test,
  chromium,
  type BrowserContext,
  type Page,
  type Worker,
} from "@playwright/test";
import { createServer, type Server } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const extensionPath = path.join(process.cwd(), "build/chrome-mv3-prod");
const artifactDir = path.join(process.cwd(), "test-artifacts", "screenshots");
let server: Server;
let origin: string;

type TestEnvironment = {
  context: BrowserContext;
  extensionId: string;
  errors: string[];
};

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
  server = createServer((request, response) => {
    if (request.url === "/favicon.ico") {
      response.writeHead(204).end();
      return;
    }
    const slug = (request.url || "/page").slice(1);
    const title = slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
    response.writeHead(200, {
      "Content-Type": "text/html",
      "Cache-Control": "no-store",
    });
    response.end(
      `<!doctype html><html><head><title>${title}</title><link rel="icon" href="data:,"></head><body><h1>${title}</h1></body></html>`,
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Fixture server did not start.");
  origin = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

function trackWorker(worker: Worker, errors: string[]) {
  worker.on("console", (message) => {
    if (message.type() === "error")
      errors.push(`service worker: ${message.text()}`);
  });
}

function trackPage(page: Page, errors: string[]) {
  page.on("pageerror", (error) =>
    errors.push(`${page.url()}: ${error.message}`),
  );
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(`${page.url()}: ${message.text()}`);
  });
}

async function launchExtension(): Promise<TestEnvironment> {
  const errors: string[] = [];
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      "--headless=new",
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });
  context.on("page", (page) => trackPage(page, errors));
  context.pages().forEach((page) => trackPage(page, errors));
  context.on("serviceworker", (worker) => trackWorker(worker, errors));
  context.serviceWorkers().forEach((worker) => trackWorker(worker, errors));

  let worker = context
    .serviceWorkers()
    .find((candidate) =>
      candidate.url().includes("/static/background/index.js"),
    );
  if (!worker)
    worker = await context.waitForEvent("serviceworker", {
      predicate: (candidate) =>
        candidate.url().includes("/static/background/index.js"),
    });
  const extensionId = new URL(worker.url()).host;
  return { context, extensionId, errors };
}

async function closeEnvironment(environment: TestEnvironment) {
  await Promise.race([
    environment.context.close(),
    new Promise<void>((resolve) => setTimeout(resolve, 5_000)),
  ]);
}

async function extensionPage(
  environment: TestEnvironment,
  file: string,
): Promise<Page> {
  const page = await environment.context.newPage();
  await page.goto(`chrome-extension://${environment.extensionId}/${file}`);
  return page;
}

async function reset(page: Page) {
  const response = await page.evaluate(async () =>
    chrome.runtime.sendMessage({ type: "RESET" }),
  );
  expect(response).toMatchObject({ ok: true });
  await page.evaluate(async () =>
    chrome.storage.session.set({
      clearheadAccountCache: {
        fetchedAt: Date.now(),
        snapshot: {
          user: {
            id: "e2e-user",
            name: "Clearhead Tester",
            email: "tester@clearhead.test",
            emailVerified: true,
          },
          entitlement: {
            plan: "trial",
            status: "trialing",
            billingInterval: null,
            trialEndsAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
            trialDaysRemaining: 30,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            limits: {
              workspaces: null,
              sessions: null,
              blockedDomains: null,
              statisticsDays: null,
            },
            features: {
              customFocusDuration: true,
              strictMode: true,
              scheduledFocus: true,
              fullStatistics: true,
              cloudSync: true,
              advancedSearch: true,
              tags: true,
              recentlyDeleted: true,
            },
          },
        },
      },
    }),
  );
  await page.reload();
}

async function state(page: Page): Promise<any> {
  const response = await page.evaluate(async () =>
    chrome.runtime.sendMessage({ type: "GET_STATE" }),
  );
  expect(response.ok).toBe(true);
  return response.data;
}

async function openFixtureTabs(
  context: BrowserContext,
  prefix: string,
  count: number,
): Promise<Page[]> {
  const pages: Page[] = [];
  for (let index = 1; index <= count; index++) {
    const page = await context.newPage();
    await page.goto(`${origin}/${prefix}-${index}`);
    pages.push(page);
  }
  return pages;
}

async function createWorkspace(sidePanel: Page, name: string) {
  await sidePanel.getByRole("button", { name: "Workspaces" }).click();
  await sidePanel.getByLabel("New workspace name").fill(name);
  await sidePanel.getByRole("button", { name: "Create" }).click();
  await expect(sidePanel.getByText("Workspace created.")).toBeVisible();
  await expect(
    sidePanel.getByText(name, { exact: true }).first(),
  ).toBeVisible();
}

test("Persona D: first launch, workspace lifecycle, and side-panel gesture", async () => {
  const environment = await launchExtension();
  try {
    const popup = await extensionPage(environment, "popup.html");
    await reset(popup);
    await popup.setViewportSize({ width: 380, height: 580 });
    await expect(popup.getByText("Clearhead", { exact: true })).toBeVisible();
    await expect(
      popup.getByLabel("Current workspace").locator("option:checked"),
    ).toHaveText("Default Workspace");
    await expect(popup.getByText("0", { exact: true }).first()).toBeVisible();
    await popup.screenshot({
      path: path.join(artifactDir, "01-popup-first-launch-orange.png"),
      fullPage: true,
    });

    const openSidePanel = popup.getByRole("button", {
      name: "Open focus home",
    });
    await openSidePanel.click();
    await expect.poll(() => popup.isClosed()).toBe(true);

    const sidePanel = await extensionPage(environment, "sidepanel.html");
    await sidePanel.setViewportSize({ width: 320, height: 800 });
    await expect(
      sidePanel.getByText("Your first checkpoint will appear here"),
    ).toBeVisible();
    await sidePanel.screenshot({
      path: path.join(artifactDir, "02-dashboard-320.png"),
      fullPage: true,
    });
    await createWorkspace(sidePanel, "TMUA Prep");

    const researchCard = sidePanel.locator("section.workspace-card", {
      hasText: "Default Workspace",
    });
    sidePanel.once("dialog", (dialog) => dialog.accept("Research Hub"));
    await researchCard.getByRole("button", { name: "Rename" }).click();
    await expect(
      sidePanel.getByText("Research Hub", { exact: true }),
    ).toBeVisible();

    await createWorkspace(sidePanel, "Scratch");
    const scratchCard = sidePanel.locator("section.workspace-card", {
      hasText: "Scratch",
    });
    sidePanel.once("dialog", (dialog) => dialog.accept());
    await scratchCard.getByRole("button", { name: "Delete" }).click();
    await expect(sidePanel.getByText("Scratch", { exact: true })).toHaveCount(
      0,
    );
    await sidePanel.reload();
    await sidePanel.getByRole("button", { name: "Workspaces" }).click();
    await expect(
      sidePanel.getByText("TMUA Prep", { exact: true }).first(),
    ).toBeVisible();
    await sidePanel.screenshot({
      path: path.join(artifactDir, "02-workspaces-320.png"),
      fullPage: true,
    });

    expect((await state(sidePanel)).currentWorkspaceId).toBeTruthy();
    expect(environment.errors).toEqual([]);
  } finally {
    await closeEnvironment(environment);
  }
});

test("Persona A: save selected research tabs and persist exact session contents", async () => {
  const environment = await launchExtension();
  try {
    const sidePanel = await extensionPage(environment, "sidepanel.html");
    await reset(sidePanel);
    await createWorkspace(sidePanel, "TMUA Prep");
    const researchTabs = await openFixtureTabs(
      environment.context,
      "geometry-research",
      8,
    );
    const popup = await extensionPage(environment, "popup.html");
    await popup.setViewportSize({ width: 380, height: 580 });
    await popup.getByRole("button", { name: "Save New Session" }).click();
    await expect(popup.locator(".tab-option")).toHaveCount(8);

    await popup.getByRole("button", { name: "Clear" }).click();
    await expect(
      popup.getByRole("button", { name: "Save Session" }),
    ).toBeDisabled();
    await popup.getByRole("button", { name: "Select all" }).click();

    for (const index of [2, 5, 8]) {
      await popup
        .locator(".tab-option", { hasText: `Geometry Research ${index}` })
        .click();
    }
    await expect(popup.getByText("5 tabs selected")).toBeVisible();
    await popup.getByLabel("Session name").fill("   ");
    await expect(
      popup.getByRole("button", { name: "Save Session" }),
    ).toBeDisabled();
    await popup.getByLabel("Session name").fill("Geometry Research");
    const originalUrls = researchTabs.map((page) => page.url());
    await popup.screenshot({
      path: path.join(artifactDir, "03-save-selection.png"),
      fullPage: true,
    });
    await popup
      .getByRole("button", { name: "Save Session" })
      .evaluate((button: HTMLButtonElement) => {
        button.click();
        button.click();
      });
    await expect(
      popup.getByText("Session saved. Your tabs remain open."),
    ).toBeVisible();
    expect(researchTabs.every((page) => !page.isClosed())).toBe(true);
    expect(researchTabs.map((page) => page.url())).toEqual(originalUrls);

    await sidePanel.reload();
    await sidePanel.getByRole("button", { name: "Sessions" }).click();
    const sessionCard = sidePanel.locator("section.session-table-row", {
      hasText: "Geometry Research",
    });
    await expect(sessionCard.getByText("5 tabs")).toBeVisible();
    await sessionCard.getByRole("button", { name: "Inspect" }).click();
    await expect(
      sidePanel.getByRole("dialog").locator(".tab-detail"),
    ).toHaveCount(5);
    for (const index of [2, 5, 8])
      await expect(sidePanel.getByRole("dialog")).not.toContainText(
        `Geometry Research ${index}`,
      );
    await sidePanel.screenshot({
      path: path.join(artifactDir, "04-session-inspection.png"),
      fullPage: true,
    });
    await sidePanel.getByRole("button", { name: "Close" }).click();
    await sidePanel.reload();
    await sidePanel.getByRole("button", { name: "Sessions" }).click();
    await expect(
      sidePanel.getByText("Geometry Research", { exact: true }),
    ).toBeVisible();

    const savedState = await state(sidePanel);
    expect(savedState.sessions).toHaveLength(1);
    expect(savedState.sessions[0].tabs).toHaveLength(5);

    await sidePanel.getByRole("button", { name: "Workspaces" }).click();
    const workspaceCard = sidePanel.locator("section.workspace-card", {
      hasText: "TMUA Prep",
    });
    sidePanel.once("dialog", (dialog) => dialog.dismiss());
    await workspaceCard.getByRole("button", { name: "Delete" }).click();
    expect((await state(sidePanel)).sessions).toHaveLength(1);
    sidePanel.once("dialog", (dialog) => dialog.accept());
    await workspaceCard.getByRole("button", { name: "Delete" }).click();
    const afterDeletion = await state(sidePanel);
    expect(afterDeletion.sessions).toHaveLength(0);
    expect(
      afterDeletion.workspaces.some(
        (workspace: any) => workspace.id === afterDeletion.currentWorkspaceId,
      ),
    ).toBe(true);
    expect(environment.errors).toEqual([]);
  } finally {
    await closeEnvironment(environment);
  }
});

test("Persona B: park only selected tabs, then restore them", async () => {
  const environment = await launchExtension();
  try {
    const popup = await extensionPage(environment, "popup.html");
    await reset(popup);
    const tabs = await openFixtureTabs(
      environment.context,
      "parked-research",
      8,
    );
    const internalTab = await environment.context.newPage();
    await internalTab.goto("chrome://settings/");
    await popup.evaluate(async () => {
      const openTabs = await chrome.tabs.query({ currentWindow: true });
      const firstResearchTab = openTabs.find((tab) =>
        tab.url?.includes("/parked-research-1"),
      );
      if (!firstResearchTab?.id)
        throw new Error("Pinned test tab was not found.");
      await chrome.tabs.update(firstResearchTab.id, { pinned: true });
    });
    await popup.bringToFront();
    await popup.getByRole("button", { name: "Park Tabs" }).click();
    await expect(popup.locator(".tab-option")).toHaveCount(8);
    await expect(
      popup.locator(".tab-option", { hasText: "Settings" }),
    ).toHaveCount(0);
    for (const index of [6, 7, 8]) {
      await popup
        .locator(".tab-option", { hasText: `Parked Research ${index}` })
        .click();
    }
    await popup.getByLabel("Session name").fill("Parked Research");
    await popup.screenshot({
      path: path.join(artifactDir, "05-park-selection.png"),
      fullPage: true,
    });
    await popup.getByRole("button", { name: "Save & close tabs" }).click();
    await expect(
      popup.getByText(/Your session was saved\. 5 tabs closed/),
    ).toBeVisible();
    expect(tabs.slice(0, 5).every((page) => page.isClosed())).toBe(true);
    expect(tabs.slice(5).every((page) => !page.isClosed())).toBe(true);

    const sidePanel = await extensionPage(environment, "sidepanel.html");
    await sidePanel.getByRole("button", { name: "Sessions" }).click();
    const card = sidePanel.locator("section.session-table-row", {
      hasText: "Parked Research",
    });
    await expect(card.getByText("5 tabs")).toBeVisible();
    await card.getByRole("button", { name: "Restore" }).click();
    await expect(sidePanel.getByText("5 tabs restored.")).toBeVisible();
    await expect
      .poll(
        () =>
          environment.context
            .pages()
            .filter((page) => page.url().includes("/parked-research-")).length,
      )
      .toBe(8);
    const restoredUrls = environment.context
      .pages()
      .filter((page) => page.url().includes("/parked-research-"))
      .map((page) => page.url());
    for (let index = 1; index <= 8; index++)
      expect(
        restoredUrls.some((url) => url.endsWith(`/parked-research-${index}`)),
      ).toBe(true);
    const restoredPinned = await sidePanel.evaluate(async () => {
      const openTabs = await chrome.tabs.query({ currentWindow: true });
      return openTabs.some(
        (tab) => tab.url?.includes("/parked-research-1") && tab.pinned,
      );
    });
    expect(restoredPinned).toBe(true);
    expect(internalTab.isClosed()).toBe(false);
    await sidePanel.screenshot({
      path: path.join(artifactDir, "06-restored-session.png"),
      fullPage: true,
    });
    expect(environment.errors).toEqual([]);
  } finally {
    await closeEnvironment(environment);
  }
});

test("Persona C: focus persists, blocks the intended domain once, and cleans up", async () => {
  const environment = await launchExtension();
  try {
    const sidePanel = await extensionPage(environment, "sidepanel.html");
    await reset(sidePanel);
    await openFixtureTabs(environment.context, "focus-context", 2);
    await sidePanel.bringToFront();
    await sidePanel.getByRole("button", { name: "Workspaces" }).click();
    await sidePanel
      .getByLabel("Domain for Default Workspace")
      .fill(" HTTPS://WWW.Blocked.Test/ ");
    await sidePanel.getByRole("button", { name: "Add" }).click();
    await expect(
      sidePanel.getByText("blocked.test", { exact: true }),
    ).toBeVisible();
    await sidePanel
      .getByLabel("Domain for Default Workspace")
      .fill("blocked.test");
    await sidePanel.getByRole("button", { name: "Add" }).click();
    await expect(
      sidePanel.getByText("That domain or route is already blocked."),
    ).toBeVisible();

    await sidePanel.getByRole("button", { name: "Focus", exact: true }).click();
    await sidePanel.getByLabel("Duration").selectOption("custom");
    await sidePanel.getByLabel("Custom minutes").fill("1");
    await sidePanel
      .getByLabel("Current objective")
      .fill("Finish the research outline");
    await sidePanel.getByRole("button", { name: "Enter Focus" }).click();
    await expect(sidePanel.getByText("You are in focus")).toBeVisible();
    const duplicateStart = await sidePanel.evaluate(async () => {
      const current = await chrome.runtime.sendMessage({ type: "GET_STATE" });
      return chrome.runtime.sendMessage({
        type: "START_FOCUS",
        workspaceId: current.data.currentWorkspaceId,
        duration: 1,
      });
    });
    expect(duplicateStart).toMatchObject({
      ok: false,
      error: "Focus Mode is already active.",
    });
    const started = await state(sidePanel);
    expect(started.focus.active).toBe(true);
    const originalEndsAt = started.focus.endsAt;
    await sidePanel.reload();
    await expect(sidePanel.getByText("You are in focus")).toBeVisible();
    expect((await state(sidePanel)).focus.endsAt).toBe(originalEndsAt);

    const blockedTab = await environment.context.newPage();
    await blockedTab.goto("http://blocked.test/research");
    await expect(blockedTab).toHaveURL(
      /chrome-extension:\/\/.*\/tabs\/blocked\.html\?domain=blocked\.test/,
    );
    await expect(
      blockedTab.getByRole("heading", { name: "This is not what you chose" }),
    ).toBeVisible();
    await expect(
      blockedTab.getByText("Finish the research outline", { exact: true }),
    ).toBeVisible();
    await expect
      .poll(async () => (await state(sidePanel)).focus.distractionsBlocked)
      .toBe(1);
    await blockedTab.reload();
    await blockedTab.waitForTimeout(300);
    expect((await state(sidePanel)).focus.distractionsBlocked).toBe(1);
    await blockedTab.screenshot({
      path: path.join(artifactDir, "07-blocked-page-orange.png"),
      fullPage: true,
    });

    await blockedTab
      .getByRole("button", { name: "Pause and save my place" })
      .click();
    await expect(
      blockedTab.getByText(
        "Checkpoint saved. You can return without losing your place.",
      ),
    ).toBeVisible();
    expect((await state(sidePanel)).focus.active).toBe(false);
    const checkpointed = await state(sidePanel);
    expect(checkpointed.sessions.at(-1)).toMatchObject({
      objective: "Finish the research outline",
      checkpoint: true,
      outcome: "paused",
    });
    const statsAfterEnd = (await state(sidePanel)).stats;
    const duplicateEnd = await sidePanel.evaluate(async () =>
      chrome.runtime.sendMessage({ type: "END_FOCUS" }),
    );
    expect(duplicateEnd).toMatchObject({ ok: true });
    expect((await state(sidePanel)).stats).toEqual(statsAfterEnd);
    const rules = await sidePanel.evaluate(async () =>
      chrome.declarativeNetRequest.getDynamicRules(),
    );
    expect(rules).toHaveLength(0);

    // blocked.test deliberately has no DNS entry. With Clearhead inactive it
    // may fail at DNS, but it must no longer be redirected by an extension rule.
    const unblockedTab = await environment.context.newPage();
    await unblockedTab
      .goto("http://blocked.test/research-after-focus")
      .catch(() => undefined);
    expect(unblockedTab.url()).not.toContain("/tabs/blocked.html");
    expect((await state(sidePanel)).stats.distractionsBlocked).toBe(1);

    await createWorkspace(sidePanel, "Unblocked Work");
    await sidePanel.getByRole("button", { name: "Focus", exact: true }).click();
    await sidePanel.getByLabel("Duration").selectOption("custom");
    await sidePanel.getByLabel("Custom minutes").fill("1");
    await sidePanel
      .getByLabel("Current objective")
      .fill("Review unblocked work");
    await sidePanel.getByRole("button", { name: "Enter Focus" }).click();
    expect(
      await sidePanel.evaluate(async () =>
        chrome.declarativeNetRequest.getDynamicRules(),
      ),
    ).toHaveLength(0);
    await sidePanel.getByRole("button", { name: "I finished it" }).click();
    expect(environment.errors).toEqual([]);
  } finally {
    await closeEnvironment(environment);
  }
});

test("Clear My Head parks clutter safely and restoration never opens duplicates", async () => {
  const environment = await launchExtension();
  try {
    const popup = await extensionPage(environment, "popup.html");
    await reset(popup);
    const clutterTabs = await openFixtureTabs(
      environment.context,
      "clutter",
      4,
    );
    await popup.bringToFront();
    await popup.getByRole("button", { name: "Clear My Head" }).click();
    await expect(
      popup.getByRole("heading", { name: "Keep what matters open" }),
    ).toBeVisible();
    await expect(popup.locator(".tab-option")).toHaveCount(4);
    await popup.locator(".tab-option", { hasText: "Clutter 2" }).click();
    await expect(popup.getByText("2 staying open")).toBeVisible();
    await expect(popup.getByText("2 to park")).toBeVisible();
    await popup.getByRole("button", { name: "Park 2 tabs" }).click();
    await expect(
      popup.getByText(/2 tabs parked safely\. 2 chosen tabs stayed open/),
    ).toBeVisible();
    expect(clutterTabs.slice(0, 2).every((page) => !page.isClosed())).toBe(
      true,
    );
    expect(clutterTabs.slice(2).every((page) => page.isClosed())).toBe(true);
    const cleared = await state(popup);
    expect(cleared.sessions).toHaveLength(1);
    expect(cleared.sessions[0]).toMatchObject({
      checkpoint: true,
      objective: "Review parked browser clutter",
    });
    expect(cleared.sessions[0].tabs).toHaveLength(2);

    const firstRestore = await popup.evaluate(
      async (id) =>
        chrome.runtime.sendMessage({ type: "RESTORE_SESSION", sessionId: id }),
      cleared.sessions[0].id,
    );
    expect(firstRestore.message).toContain("2 tabs restored");
    const secondRestore = await popup.evaluate(
      async (id) =>
        chrome.runtime.sendMessage({ type: "RESTORE_SESSION", sessionId: id }),
      cleared.sessions[0].id,
    );
    expect(secondRestore.message).toContain("2 already open");
    expect(environment.errors).toEqual([]);
  } finally {
    await closeEnvironment(environment);
  }
});

test("Long titles and URLs truncate locally without creating page-level scrolling", async () => {
  const environment = await launchExtension();
  try {
    const popup = await extensionPage(environment, "popup.html");
    await reset(popup);
    const longPath = `${"research-context-".repeat(28)}?source=${"evidence".repeat(35)}`;
    const longTab = await environment.context.newPage();
    await longTab.goto(`${origin}/${longPath}`);
    await longTab.evaluate(
      (title) => {
        document.title = title;
      },
      `Finish ${"an intentionally descriptive research task ".repeat(16)}`,
    );
    await openFixtureTabs(environment.context, "overflow-control", 1);
    await popup.bringToFront();
    await popup.getByRole("button", { name: "Clear My Head" }).click();
    await expect(popup.locator(".tab-option")).toHaveCount(2);

    const popupOverflow = await popup.evaluate(() => {
      const title = document.querySelector<HTMLElement>(".tab-title")!;
      const url = document.querySelector<HTMLElement>(".tab-url")!;
      const list = document.querySelector<HTMLElement>(".tabs")!;
      return {
        documentFits:
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
        bodyFits: document.body.scrollWidth <= document.body.clientWidth,
        listFits: list.scrollWidth <= list.clientWidth,
        titleOverflow: getComputedStyle(title).overflowX,
        titleEllipsis: getComputedStyle(title).textOverflow,
        urlOverflow: getComputedStyle(url).overflowX,
        urlEllipsis: getComputedStyle(url).textOverflow,
      };
    });
    expect(popupOverflow).toMatchObject({
      documentFits: true,
      bodyFits: true,
      listFits: true,
      titleOverflow: "hidden",
      titleEllipsis: "ellipsis",
      urlOverflow: "hidden",
      urlEllipsis: "ellipsis",
    });
    await popup.screenshot({
      path: path.join(artifactDir, "09-clear-head-selection-overflow.png"),
      fullPage: true,
    });
    await popup.getByRole("button", { name: "Cancel" }).click();

    await popup.getByRole("button", { name: "Save New Session" }).click();
    await popup.getByLabel("Session name").fill("Long context");
    await popup.getByRole("button", { name: "Save Session" }).click();
    await expect(
      popup.getByText("Session saved. Your tabs remain open."),
    ).toBeVisible();

    const sidePanel = await extensionPage(environment, "sidepanel.html");
    await sidePanel.getByRole("button", { name: "Sessions" }).click();
    await sidePanel
      .getByRole("button", { name: "Inspect Long context" })
      .click();
    const dialogOverflow = await sidePanel.evaluate(() => {
      const dialog = document.querySelector<HTMLDialogElement>("dialog")!;
      const detail = document.querySelector<HTMLElement>(".tab-detail")!;
      const url = document.querySelector<HTMLElement>(".tab-detail small")!;
      return {
        documentFits:
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
        dialogFits: dialog.scrollWidth <= dialog.clientWidth,
        detailFits: detail.scrollWidth <= detail.clientWidth,
        urlOverflow: getComputedStyle(url).overflowX,
        urlEllipsis: getComputedStyle(url).textOverflow,
      };
    });
    expect(dialogOverflow).toMatchObject({
      documentFits: true,
      dialogFits: true,
      detailFits: true,
      urlOverflow: "hidden",
      urlEllipsis: "ellipsis",
    });
    await sidePanel.screenshot({
      path: path.join(artifactDir, "10-session-detail-overflow.png"),
      fullPage: true,
    });
    expect(environment.errors).toEqual([]);
  } finally {
    await closeEnvironment(environment);
  }
});

test("Focus alarm completes once and does not duplicate statistics", async () => {
  test.setTimeout(100_000);
  const environment = await launchExtension();
  try {
    const sidePanel = await extensionPage(environment, "sidepanel.html");
    await reset(sidePanel);
    await sidePanel.getByRole("button", { name: "Focus", exact: true }).click();
    await sidePanel.getByLabel("Duration").selectOption("custom");
    await sidePanel.getByLabel("Custom minutes").fill("1");
    await sidePanel
      .getByLabel("Current objective")
      .fill("Complete one focused minute");
    await sidePanel.getByRole("button", { name: "Enter Focus" }).click();
    await expect
      .poll(async () => (await state(sidePanel)).focus.active, {
        timeout: 70_000,
      })
      .toBe(false);
    const completed = await state(sidePanel);
    expect(completed.stats.completedFocusSessions).toBe(1);
    expect(completed.stats.totalFocusMinutes).toBe(1);
    await sidePanel.waitForTimeout(2_000);
    const stable = await state(sidePanel);
    expect(stable.stats.completedFocusSessions).toBe(1);
    expect(stable.stats.totalFocusMinutes).toBe(1);
    expect(
      await sidePanel.evaluate(async () =>
        chrome.declarativeNetRequest.getDynamicRules(),
      ),
    ).toHaveLength(0);
    expect(environment.errors).toEqual([]);
  } finally {
    await closeEnvironment(environment);
  }
});

test("Path-specific blocking stops YouTube Shorts without blocking YouTube", async () => {
  const environment = await launchExtension();
  try {
    const sidePanel = await extensionPage(environment, "sidepanel.html");
    await reset(sidePanel);
    await sidePanel.getByRole("button", { name: "Workspaces" }).click();
    await sidePanel
      .getByLabel("Domain for Default Workspace")
      .fill(" HTTPS://WWW.YouTube.com/SHORTS/ ");
    await sidePanel.getByRole("button", { name: "Add" }).click();
    await expect(
      sidePanel.getByText("youtube.com/shorts", { exact: true }),
    ).toBeVisible();

    await sidePanel.getByRole("button", { name: "Focus", exact: true }).click();
    await sidePanel.getByLabel("Duration").selectOption("custom");
    await sidePanel.getByLabel("Custom minutes").fill("1");
    await sidePanel
      .getByLabel("Current objective")
      .fill("Write without Shorts");
    await sidePanel.getByRole("button", { name: "Enter Focus" }).click();

    const rules = await sidePanel.evaluate(async () =>
      chrome.declarativeNetRequest.getDynamicRules(),
    );
    expect(rules).toHaveLength(1);
    expect(rules[0].condition.regexFilter).toContain("youtube\\.com/shorts");
    expect(rules[0].condition.requestDomains).toBeUndefined();

    const matchOutcomes = await sidePanel.evaluate(async () => {
      type Outcome = { matchedRules: Array<{ ruleId: number }> };
      const dnr =
        chrome.declarativeNetRequest as typeof chrome.declarativeNetRequest & {
          testMatchOutcome(request: {
            url: string;
            type: string;
          }): Promise<Outcome>;
        };
      return {
        shorts: await dnr.testMatchOutcome({
          url: "https://www.youtube.com/shorts/clearhead-path-test",
          type: "main_frame",
        }),
        watch: await dnr.testMatchOutcome({
          url: "https://www.youtube.com/watch?v=clearhead-path-test",
          type: "main_frame",
        }),
      };
    });
    expect(
      matchOutcomes.shorts.matchedRules.some(
        (rule) => rule.ruleId === rules[0].id,
      ),
    ).toBe(true);
    expect(
      matchOutcomes.watch.matchedRules.some(
        (rule) => rule.ruleId === rules[0].id,
      ),
    ).toBe(false);

    await environment.context.route(
      "https://www.youtube.com/**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: "<!doctype html><html><head><title>YouTube Watch</title></head><body><main>Allowed YouTube watch page</main></body></html>",
        });
      },
    );
    const shorts = await environment.context.newPage();
    await shorts.goto("https://www.youtube.com/watch?v=clearhead-path-test");
    await shorts.evaluate(() =>
      history.pushState({}, "", "/shorts/clearhead-path-test"),
    );
    await expect(shorts).toHaveURL(
      /chrome-extension:\/\/.*\/tabs\/blocked\.html\?domain=youtube\.com%2Fshorts/,
    );
    await expect(
      shorts.getByRole("heading", { name: "This is not what you chose" }),
    ).toBeVisible();

    await sidePanel.getByRole("button", { name: "I finished it" }).click();
    await expect
      .poll(
        async () =>
          (
            await sidePanel.evaluate(async () =>
              chrome.declarativeNetRequest.getDynamicRules(),
            )
          ).length,
      )
      .toBe(0);
    expect(environment.errors).toEqual([]);
  } finally {
    await closeEnvironment(environment);
  }
});

test("Settings persist and export, invalid import is rejected, valid import and reset work", async () => {
  const environment = await launchExtension();
  try {
    const options = await extensionPage(environment, "options.html");
    await reset(options);
    await options.setViewportSize({ width: 720, height: 850 });
    await options.getByRole("button", { name: "dark", exact: true }).click();
    await options.getByLabel("Default duration (minutes)").fill("50");
    await options.getByText("Completion notifications").click();
    await options.reload();
    await expect(
      options.getByRole("button", { name: "dark", exact: true }),
    ).toHaveClass(/active/);
    await expect(options.locator("body")).toHaveAttribute("data-theme", "dark");
    await expect(options.getByLabel("Default duration (minutes)")).toHaveValue(
      "50",
    );
    await options.screenshot({
      path: path.join(artifactDir, "08-options-dark-orange.png"),
      fullPage: true,
    });

    const downloadPromise = options.waitForEvent("download");
    await options
      .getByRole("button", { name: "Export Clearhead data" })
      .click();
    const download = await downloadPromise;
    const exportedPath = await download.path();
    expect(exportedPath).toBeTruthy();

    const invalidPath = path.join(
      process.cwd(),
      "test-artifacts",
      "invalid-import.json",
    );
    await writeFile(
      invalidPath,
      JSON.stringify({ schemaVersion: 1, workspaces: [], sessions: [] }),
    );
    await options.locator('input[type="file"]').setInputFiles(invalidPath);
    await expect(
      options.getByText("Workspaces or sessions are missing."),
    ).toBeVisible();
    await expect(
      options.getByRole("button", { name: "dark", exact: true }),
    ).toHaveClass(/active/);

    options.once("dialog", (dialog) => dialog.dismiss());
    await options.getByRole("button", { name: "Reset local data" }).click();
    await expect(
      options.getByRole("button", { name: "dark", exact: true }),
    ).toHaveClass(/active/);
    options.once("dialog", (dialog) => dialog.accept());
    await options.getByRole("button", { name: "Reset local data" }).click();
    await expect(options.getByText("Clearhead data was reset.")).toBeVisible();
    await expect(
      options.getByRole("button", { name: "dark", exact: true }),
    ).toHaveClass(/active/);

    await options.locator('input[type="file"]').setInputFiles(exportedPath!);
    await expect(options.getByText("Clearhead data imported.")).toBeVisible();
    await expect(
      options.getByRole("button", { name: "dark", exact: true }),
    ).toHaveClass(/active/);
    expect(environment.errors).toEqual([]);
  } finally {
    await closeEnvironment(environment);
  }
});
