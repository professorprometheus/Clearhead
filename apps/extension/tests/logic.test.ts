import { describe, expect, it } from "vitest";
import {
  blockTargetRegex,
  isEligibleTabUrl,
  isRestorableUrl,
  normaliseDomain,
  splitBlockTarget,
  urlMatchesBlockTarget,
} from "../src/lib/domains";
import {
  remainingMs,
  updateWeekly,
  validFocusDuration,
  weekStart,
} from "../src/lib/time";
import { migrateState, validateImport } from "../src/lib/storage";
import {
  validateSelectedTabs,
  validateSessionName,
} from "../src/lib/validation";

describe("domains", () => {
  it("normalises domains and path-specific targets", () => {
    expect(normaliseDomain(" HTTPS://WWW.Reddit.com/ ")).toBe("reddit.com");
    expect(normaliseDomain("REDDIT.COM")).toBe("reddit.com");
    expect(normaliseDomain("old.reddit.com")).toBe("old.reddit.com");
    expect(normaliseDomain(" HTTPS://WWW.YouTube.com/SHORTS/ ")).toBe(
      "youtube.com/shorts",
    );
    expect(normaliseDomain("youtube.com//shorts///clip?feature=share")).toBe(
      "youtube.com/shorts/clip",
    );
    expect(normaliseDomain("not a domain")).toBeNull();
    expect(normaliseDomain("localhost")).toBeNull();
  });
  it("creates an exact route rule without blocking the whole site", () => {
    expect(splitBlockTarget("youtube.com/shorts")).toEqual({
      domain: "youtube.com",
      path: "/shorts",
    });
    const regex = new RegExp(blockTargetRegex("youtube.com/shorts")!);
    expect(regex.test("https://youtube.com/shorts")).toBe(true);
    expect(regex.test("https://www.youtube.com/shorts/abc?feature=share")).toBe(
      true,
    );
    expect(regex.test("https://youtube.com/watch?v=abc")).toBe(false);
    expect(regex.test("https://youtube.com/shortstuff")).toBe(false);
    expect(regex.test("https://notyoutube.com/shorts")).toBe(false);
  });
  it("matches client-side routes without over-blocking the host", () => {
    expect(
      urlMatchesBlockTarget(
        "https://www.youtube.com/shorts/abc",
        "youtube.com/shorts",
      ),
    ).toBe(true);
    expect(
      urlMatchesBlockTarget(
        "https://m.youtube.com/shorts/abc?feature=share",
        "youtube.com/shorts",
      ),
    ).toBe(true);
    expect(
      urlMatchesBlockTarget(
        "https://youtube.com/watch?v=abc",
        "youtube.com/shorts",
      ),
    ).toBe(false);
    expect(
      urlMatchesBlockTarget(
        "https://notyoutube.com/shorts/abc",
        "youtube.com/shorts",
      ),
    ).toBe(false);
    expect(
      urlMatchesBlockTarget("https://reddit.com/r/all", "reddit.com"),
    ).toBe(true);
  });
  it("validates restorable and eligible URLs", () => {
    expect(isRestorableUrl("https://example.com")).toBe(true);
    expect(isRestorableUrl("chrome://settings")).toBe(false);
    expect(isEligibleTabUrl("https://example.com")).toBe(true);
    expect(isEligibleTabUrl("chrome-extension://abc/popup.html")).toBe(false);
  });
});
describe("focus time", () => {
  it("validates duration and clamps remaining time", () => {
    expect(validFocusDuration(25)).toBe(true);
    expect(validFocusDuration(0)).toBe(false);
    expect(validFocusDuration(1.5)).toBe(false);
    expect(remainingMs(100, 200)).toBe(0);
  });
  it("updates one weekly bucket", () => {
    const now = new Date(2026, 6, 22).getTime();
    const rows = updateWeekly([], now, {
      totalFocusMinutes: 25,
      completedFocusSessions: 1,
    });
    expect(rows[0]).toMatchObject({
      weekStart: weekStart(now),
      totalFocusMinutes: 25,
      completedFocusSessions: 1,
    });
  });
});
describe("storage validation", () => {
  it("creates defaults for absent state", () => {
    const s = migrateState(null);
    expect(s.workspaces[0].name).toBe("Default Workspace");
    expect(s.currentWorkspaceId).toBe(s.workspaces[0].id);
  });
  it("rejects malformed imports without migration", () => {
    expect(
      validateImport({ schemaVersion: 1, workspaces: [], sessions: [] }),
    ).toEqual({ ok: false, error: "Workspaces or sessions are missing." });
  });
  it("accepts current state", () => {
    const s = migrateState(null);
    expect(validateImport(s).ok).toBe(true);
  });
  it("migrates active v1 focus into an objective-led session", () => {
    const legacy: any = migrateState(null);
    legacy.schemaVersion = 1;
    legacy.focus = {
      active: true,
      id: "f",
      workspaceId: legacy.currentWorkspaceId,
      startedAt: 1,
      endsAt: 2,
      distractionsBlocked: 0,
    };
    const migrated = migrateState(legacy);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.focus.active && migrated.focus.objective).toBe(
      "Default Workspace",
    );
  });
  it("rejects orphaned sessions and invalid settings", () => {
    const orphan = migrateState(null);
    orphan.sessions.push({
      id: "s",
      workspaceId: "missing",
      name: "Orphan",
      tabs: [{ id: "t", title: "Tab", url: "https://example.com" }],
      createdAt: 1,
      updatedAt: 1,
    });
    expect(validateImport(orphan)).toMatchObject({
      ok: false,
      error: "A session is invalid.",
    });
    const invalid = migrateState(null);
    invalid.settings.defaultFocusDuration = 0;
    expect(validateImport(invalid)).toMatchObject({
      ok: false,
      error: "Settings are invalid.",
    });
  });
  it("preserves expired focus state for the completion service", () => {
    const s = migrateState(null);
    s.focus = {
      active: true,
      id: "f",
      workspaceId: s.currentWorkspaceId!,
      objective: "Finish the draft",
      startedAt: 1,
      endsAt: 2,
      distractionsBlocked: 0,
    };
    const result = validateImport(s);
    expect(result.ok && result.state.focus.active).toBe(true);
  });
});
describe("session validation", () => {
  it("requires a bounded non-blank name", () => {
    expect(validateSessionName("  ")).toBe("Enter a session name.");
    expect(validateSessionName("a".repeat(81))).toContain("80");
    expect(validateSessionName(" Geometry ")).toBeNull();
  });
  it("requires valid selected tab IDs", () => {
    expect(validateSelectedTabs([])).toContain("at least one");
    expect(validateSelectedTabs([-1])).toContain("invalid");
    expect(validateSelectedTabs([1, 2])).toBeNull();
  });
});
