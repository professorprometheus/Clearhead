export const SCHEMA_VERSION = 2;

export type Workspace = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  blockedDomains: string[];
  defaultFocusDuration?: number;
};
export type SavedTab = {
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
  pinned?: boolean;
  index?: number;
  groupId?: number;
  groupTitle?: string;
  groupColour?: string;
};
export type Session = {
  id: string;
  workspaceId: string;
  name: string;
  tabs: SavedTab[];
  createdAt: number;
  updatedAt: number;
  lastRestoredAt?: number;
  objective?: string;
  nextStep?: string;
  checkpoint?: boolean;
  outcome?: "completed" | "paused";
  focusMinutes?: number;
};
export type FocusState =
  | { active: false }
  | {
      active: true;
      id: string;
      workspaceId: string;
      objective: string;
      startedAt: number;
      endsAt: number;
      distractionsBlocked: number;
      resumedSessionId?: string;
      startingTabs?: SavedTab[];
    };
export type WeeklyStats = {
  weekStart: string;
  completedFocusSessions: number;
  totalFocusMinutes: number;
  distractionsBlocked: number;
};
export type Stats = {
  completedFocusSessions: number;
  totalFocusMinutes: number;
  distractionsBlocked: number;
  sessionsSaved: number;
  weekly: WeeklyStats[];
};
export type Settings = {
  theme: "light" | "dark" | "system";
  defaultFocusDuration: number;
  notificationsEnabled: boolean;
};
export type ClearheadState = {
  schemaVersion: number;
  currentWorkspaceId: string | null;
  workspaces: Workspace[];
  sessions: Session[];
  focus: FocusState;
  stats: Stats;
  settings: Settings;
};

export const newId = () => crypto.randomUUID();
export function createDefaultState(now = Date.now()): ClearheadState {
  const id = newId();
  return {
    schemaVersion: SCHEMA_VERSION,
    currentWorkspaceId: id,
    workspaces: [
      {
        id,
        name: "Default Workspace",
        createdAt: now,
        updatedAt: now,
        blockedDomains: [],
      },
    ],
    sessions: [],
    focus: { active: false },
    stats: {
      completedFocusSessions: 0,
      totalFocusMinutes: 0,
      distractionsBlocked: 0,
      sessionsSaved: 0,
      weekly: [],
    },
    settings: {
      theme: "dark",
      defaultFocusDuration: 25,
      notificationsEnabled: true,
    },
  };
}
