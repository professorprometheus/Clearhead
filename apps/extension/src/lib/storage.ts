import { normaliseDomain } from "~/lib/domains"
import { validFocusDuration } from "~/lib/time"
import { SCHEMA_VERSION, createDefaultState, type ClearheadState } from "~/types/state"

const KEY = "clearheadState"
let queue: Promise<unknown> = Promise.resolve()

export function migrateState(value: unknown): ClearheadState {
  if (!value || typeof value !== "object") return createDefaultState()
  const raw = value as any
  if (![1, SCHEMA_VERSION].includes(raw.schemaVersion) || !Array.isArray(raw.workspaces) || !Array.isArray(raw.sessions) || !raw.settings || !raw.stats || !raw.focus) return createDefaultState()
  if (!raw.workspaces.length) return createDefaultState()
  const current = raw.workspaces.some((w: any) => w.id === raw.currentWorkspaceId) ? raw.currentWorkspaceId! : raw.workspaces[0].id
  const focus = raw.focus.active ? { ...raw.focus, objective: typeof raw.focus.objective === "string" && raw.focus.objective.trim() ? raw.focus.objective.trim() : raw.workspaces.find((workspace: any) => workspace.id === raw.focus.workspaceId)?.name || "Make meaningful progress" } : { active: false }
  return { ...raw, focus, sessions: raw.sessions.map((session: any) => ({ ...session, objective: typeof session.objective === "string" ? session.objective.trim() : undefined, nextStep: typeof session.nextStep === "string" ? session.nextStep.trim() : undefined })), currentWorkspaceId: current, schemaVersion: SCHEMA_VERSION } as ClearheadState
}
export async function getState(): Promise<ClearheadState> {
  const result = await chrome.storage.local.get(KEY)
  if (!result[KEY]) {
    const state = createDefaultState()
    await chrome.storage.local.set({ [KEY]: state })
    return state
  }
  const checked = validateImport(result[KEY])
  if (!checked.ok) {
    const state = createDefaultState()
    await chrome.storage.local.set({ [KEY]: state })
    return state
  }
  return checked.state
}
export function setState(state: ClearheadState): Promise<void> {
  const task = queue.catch(() => undefined).then(() => chrome.storage.local.set({ [KEY]: state }))
  queue = task.catch(() => undefined)
  return task
}
export function updateState(mutator: (state: ClearheadState) => ClearheadState | Promise<ClearheadState>): Promise<ClearheadState> {
  const task = queue.then(async () => { const current = await getState(); const next = migrateState(await mutator(structuredClone(current))); await chrome.storage.local.set({ [KEY]: next }); return next })
  queue = task.catch(() => undefined); return task
}
export async function resetState(): Promise<ClearheadState> { const state = createDefaultState(); await setState(state); return state }
export function validateImport(value: unknown): { ok: true; state: ClearheadState } | { ok: false; error: string } {
  if (!value || typeof value !== "object") return { ok: false, error: "The file does not contain Clearhead data." }
  const raw = value as any
  if (![1, SCHEMA_VERSION].includes(raw.schemaVersion)) return { ok: false, error: "This Clearhead data version is not supported." }
  if (!Array.isArray(raw.workspaces) || !raw.workspaces.length || !Array.isArray(raw.sessions)) return { ok: false, error: "Workspaces or sessions are missing." }
  const workspacesValid = raw.workspaces.every((w: any) =>
    typeof w.id === "string" && w.id.length > 0 && typeof w.name === "string" && w.name.trim().length > 0 &&
    Number.isFinite(w.createdAt) && Number.isFinite(w.updatedAt) && Array.isArray(w.blockedDomains) &&
    w.blockedDomains.every((domain: unknown) => typeof domain === "string" && normaliseDomain(domain) === domain)
  )
  if (!workspacesValid || new Set(raw.workspaces.map((w: any) => w.id)).size !== raw.workspaces.length) return { ok: false, error: "A workspace is invalid." }
  const workspaceIds = new Set(raw.workspaces.map((w: any) => w.id))
  if (typeof raw.currentWorkspaceId !== "string" || !workspaceIds.has(raw.currentWorkspaceId)) return { ok: false, error: "The current workspace is invalid." }
  const sessionsValid = raw.sessions.every((s: any) =>
    typeof s.id === "string" && s.id.length > 0 && workspaceIds.has(s.workspaceId) && typeof s.name === "string" && s.name.trim().length > 0 &&
    Number.isFinite(s.createdAt) && Number.isFinite(s.updatedAt) && Array.isArray(s.tabs) && s.tabs.length > 0 &&
    s.tabs.every((tab: any) => typeof tab.id === "string" && typeof tab.title === "string" && typeof tab.url === "string" && tab.url.length > 0)
  )
  if (!sessionsValid || new Set(raw.sessions.map((s: any) => s.id)).size !== raw.sessions.length) return { ok: false, error: "A session is invalid." }
  if (!raw.settings || !["light", "dark", "system"].includes(raw.settings.theme) || !validFocusDuration(raw.settings.defaultFocusDuration) || typeof raw.settings.notificationsEnabled !== "boolean") return { ok: false, error: "Settings are invalid." }
  if (!raw.stats || !["completedFocusSessions", "totalFocusMinutes", "distractionsBlocked", "sessionsSaved"].every((key) => Number.isFinite(raw.stats[key]) && raw.stats[key] >= 0) || !Array.isArray(raw.stats.weekly)) return { ok: false, error: "Statistics are invalid." }
  if (!raw.focus || typeof raw.focus.active !== "boolean" || (raw.focus.active && (!workspaceIds.has(raw.focus.workspaceId) || typeof raw.focus.id !== "string" || !Number.isFinite(raw.focus.startedAt) || !Number.isFinite(raw.focus.endsAt) || raw.focus.endsAt <= raw.focus.startedAt || !Number.isFinite(raw.focus.distractionsBlocked)))) return { ok: false, error: "Focus data is invalid." }
  const state = migrateState(raw)
  state.workspaces = state.workspaces.map((workspace) => ({ ...workspace, name: workspace.name.trim(), blockedDomains: [...new Set(workspace.blockedDomains)] }))
  state.sessions = state.sessions.map((session) => ({ ...session, name: session.name.trim(), objective: session.objective?.trim(), nextStep: session.nextStep?.trim() }))
  return { ok: true, state }
}
