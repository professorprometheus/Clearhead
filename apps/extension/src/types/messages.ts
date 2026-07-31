import type { ClearheadState, SavedTab } from "./state"
export type TabCandidate = SavedTab & { tabId: number; active?: boolean }
export type Request =
  | { type: "GET_STATE" } | { type: "GET_TABS" } | { type: "OPEN_SIDE_PANEL" }
  | { type: "SAVE_SESSION"; workspaceId: string; name: string; tabIds: number[]; park: boolean }
  | { type: "RESTORE_SESSION"; sessionId: string } | { type: "START_FOCUS"; workspaceId: string; duration: number; objective?: string; resumeSessionId?: string }
  | { type: "END_FOCUS"; outcome?: "completed" | "paused"; nextStep?: string } | { type: "CLEAR_HEAD"; workspaceId: string; keepTabIds?: number[] }
  | { type: "RESET" } | { type: "IMPORT"; state: unknown }
export type Response<T = unknown> = { ok: true; data: T; message?: string } | { ok: false; error: string }
export const send = <T = unknown>(message: Request): Promise<Response<T>> => chrome.runtime.sendMessage(message)
export type StateResponse = Response<ClearheadState>
