import { beforeEach, describe, expect, it, vi } from "vitest";
import { getState, updateState } from "../src/lib/storage";

const memory: Record<string, unknown> = {};

beforeEach(() => {
  for (const key of Object.keys(memory)) delete memory[key];
  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: memory[key] })),
        set: vi.fn(async (values: Record<string, unknown>) =>
          Object.assign(memory, structuredClone(values)),
        ),
      },
    },
  });
});

describe("storage repository", () => {
  it("persists a usable first-run state", async () => {
    const first = await getState();
    const second = await getState();
    expect(first.workspaces[0].name).toBe("Default Workspace");
    expect(second.currentWorkspaceId).toBe(first.currentWorkspaceId);
  });

  it("serializes rapid updates without losing writes", async () => {
    await getState();
    await Promise.all(
      Array.from({ length: 8 }, () =>
        updateState((state) => {
          state.stats.sessionsSaved++;
          return state;
        }),
      ),
    );
    expect((await getState()).stats.sessionsSaved).toBe(8);
  });

  it("repairs corrupt Clearhead-owned state", async () => {
    memory.clearheadState = {
      schemaVersion: 1,
      currentWorkspaceId: "missing",
      workspaces: [],
      sessions: [],
    };
    const repaired = await getState();
    expect(repaired.workspaces).toHaveLength(1);
    expect(repaired.currentWorkspaceId).toBe(repaired.workspaces[0].id);
  });
});
