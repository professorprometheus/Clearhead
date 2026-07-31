import { canCreateSession, canUseCustomFocusDuration } from "@clearhead/entitlements"
import { blockTargetRegex, isEligibleTabUrl, isRestorableUrl, splitBlockTarget, urlMatchesBlockTarget } from "~/lib/domains"
import { getExtensionAccount } from "~/lib/account"
import { getState, resetState, setState, updateState, validateImport } from "~/lib/storage"
import { updateWeekly, validFocusDuration } from "~/lib/time"
import { validateSelectedTabs, validateSessionName } from "~/lib/validation"
import type { Request, Response, TabCandidate } from "~/types/messages"
import { newId, type ClearheadState, type SavedTab } from "~/types/state"

const FOCUS_ALARM = "clearhead-focus-end"
const RULE_BASE = 42_000
const RULE_LIMIT = 1_000
const restoringSessions = new Set<string>()
const savingOperations = new Set<string>()
const recentBlockedAttempts = new Map<string, number>()

async function captureTabs(): Promise<TabCandidate[]> {
  const tabs = await chrome.tabs.query({ currentWindow: true })
  const groups = new Map<number, chrome.tabGroups.TabGroup>()
  const groupIds = new Set(tabs.map((tab) => tab.groupId).filter((id): id is number => id !== undefined && id >= 0))

  for (const groupId of groupIds) {
    try {
      groups.set(groupId, await chrome.tabGroups.get(groupId))
    } catch {
      // A group may disappear while the selection form is opening.
    }
  }

  return tabs
    .filter((tab) => tab.id != null && isEligibleTabUrl(tab.url))
    .map((tab) => {
      const group = tab.groupId != null ? groups.get(tab.groupId) : undefined
      return {
        tabId: tab.id!,
        id: newId(),
        title: tab.title || tab.url || "Untitled tab",
        url: tab.url!,
        favIconUrl: tab.favIconUrl,
        pinned: tab.pinned,
        index: tab.index,
        groupId: tab.groupId != null && tab.groupId >= 0 ? tab.groupId : undefined,
        groupTitle: group?.title,
        groupColour: group?.color,
        active: tab.active
      }
    })
}

function toSavedTab(candidate: TabCandidate): SavedTab {
  return {
    id: candidate.id,
    title: candidate.title,
    url: candidate.url,
    favIconUrl: candidate.favIconUrl,
    pinned: candidate.pinned,
    index: candidate.index,
    groupId: candidate.groupId,
    groupTitle: candidate.groupTitle,
    groupColour: candidate.groupColour
  }
}

async function clearRules(): Promise<void> {
  const rules = await chrome.declarativeNetRequest.getDynamicRules()
  const ids = rules.filter((rule) => rule.id >= RULE_BASE && rule.id < RULE_BASE + RULE_LIMIT).map((rule) => rule.id)
  if (ids.length) await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ids })
}

async function applyRules(workspaceId: string): Promise<void> {
  await clearRules()
  const state = await getState()
  const workspace = state.workspaces.find((candidate) => candidate.id === workspaceId)
  if (!workspace) throw new Error("Workspace not found.")
  if (workspace.blockedDomains.length > RULE_LIMIT) throw new Error("This workspace has too many blocked domains.")

  const blockedUrl = chrome.runtime.getURL("tabs/blocked.html")
  const addRules: chrome.declarativeNetRequest.Rule[] = workspace.blockedDomains.map((target, index) => {
    const { domain, path } = splitBlockTarget(target)
    const condition: chrome.declarativeNetRequest.RuleCondition = {
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
      ...(path ? { regexFilter: blockTargetRegex(target)! } : { requestDomains: [domain] })
    }
    return {
      id: RULE_BASE + index,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: { url: `${blockedUrl}?domain=${encodeURIComponent(target)}` }
      },
      condition
    }
  })

  if (addRules.length) await chrome.declarativeNetRequest.updateDynamicRules({ addRules })
}

async function finishFocus(manual: boolean, outcome: "completed" | "paused" = "paused", nextStep = ""): Promise<ClearheadState> {
  let finished = false
  const liveCheckpointTabs = (await captureTabs()).map(toSavedTab)
  const state = await updateState((current) => {
    if (!current.focus.active) return current
    const focus = current.focus
    const checkpointTabs = liveCheckpointTabs.length ? liveCheckpointTabs : focus.startingTabs ?? []
    const now = Date.now()
    const elapsed = Math.max(0, Math.min(now, focus.endsAt) - focus.startedAt)
    const minutes = Math.floor(elapsed / 60_000)
    // V1 policy: manual sessions count as complete after one full minute.
    const completed = manual ? minutes >= 1 : true
    current.stats.totalFocusMinutes += minutes
    if (completed) current.stats.completedFocusSessions++
    current.stats.weekly = updateWeekly(current.stats.weekly, now, {
      totalFocusMinutes: minutes,
      completedFocusSessions: completed ? 1 : 0
    })
    if (checkpointTabs.length) {
      current.sessions.push({
        id: newId(), workspaceId: focus.workspaceId, name: focus.objective, objective: focus.objective,
        nextStep: nextStep.trim() || (outcome === "completed" ? "Choose the next meaningful outcome" : "Continue from this checkpoint"),
        checkpoint: true, outcome, focusMinutes: minutes, tabs: checkpointTabs, createdAt: now, updatedAt: now
      })
      current.stats.sessionsSaved++
    }
    current.focus = { active: false }
    finished = true
    return current
  })

  await clearRules()
  await chrome.alarms.clear(FOCUS_ALARM)

  if (finished && state.settings.notificationsEnabled && !manual) {
    try {
      const iconPath = chrome.runtime.getManifest().icons?.["128"]
      if (iconPath) {
        await chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL(iconPath),
          title: "Momentum saved",
          message: "Your focus checkpoint is ready whenever you return."
        })
      }
    } catch {
      // Notification failures must never leave Focus Mode active.
    }
  }

  return state
}

async function saveSession(request: Extract<Request, { type: "SAVE_SESSION" }>): Promise<Response<ClearheadState>> {
  const nameError = validateSessionName(request.name)
  if (nameError) throw new Error(nameError)
  const selectionError = validateSelectedTabs(request.tabIds)
  if (selectionError) throw new Error(selectionError)
  const name = request.name.trim()

  const operationKey = `${request.workspaceId}:${request.park}:${[...request.tabIds].sort((a, b) => a - b).join(",")}:${name}`
  if (savingOperations.has(operationKey)) throw new Error("This session is already being saved.")
  savingOperations.add(operationKey)

  try {
    const entitlement = (await getExtensionAccount()).entitlement
    const currentState = await getState()
    if (!canCreateSession(entitlement, currentState.sessions.length)) throw new Error("Free includes five editable sessions. Upgrade to Clearhead Pro to save another session.")
    const candidates = await captureTabs()
    const chosen = candidates.filter((tab) => request.tabIds.includes(tab.tabId))
    if (!chosen.length) throw new Error("The selected tabs are no longer available.")

    const sessionId = newId()
    const state = await updateState((current) => {
      if (!current.workspaces.some((workspace) => workspace.id === request.workspaceId)) throw new Error("Workspace not found.")
      const now = Date.now()
      current.sessions.push({
        id: sessionId,
        workspaceId: request.workspaceId,
        name,
        tabs: chosen.map(toSavedTab),
        createdAt: now,
        updatedAt: now
      })
      current.stats.sessionsSaved++
      return current
    })

    const confirmed = (await getState()).sessions.some((session) => session.id === sessionId)
    if (!confirmed) throw new Error("Your session was not saved, so no tabs were closed.")

    let closed = 0
    let failed = 0
    if (request.park) {
      const liveTabs = await chrome.tabs.query({ currentWindow: true })
      const selected = chosen.filter((candidate) => liveTabs.some((tab) => tab.id === candidate.tabId))
      const maximumClosable = Math.max(0, liveTabs.length - 1)
      for (const tab of selected.slice(0, maximumClosable)) {
        try {
          await chrome.tabs.remove(tab.tabId)
          closed++
        } catch {
          failed++
        }
      }
      failed += Math.max(0, selected.length - maximumClosable)
    }

    return {
      ok: true,
      data: state,
      message: request.park
        ? `Your session was saved. ${closed} tab${closed === 1 ? "" : "s"} closed${failed ? `; ${failed} remained open` : ""}.`
        : "Session saved. Your tabs remain open."
    }
  } finally {
    savingOperations.delete(operationKey)
  }
}

async function restoreSession(sessionId: string): Promise<Response<ClearheadState>> {
  if (restoringSessions.has(sessionId)) throw new Error("This session is already being restored.")
  restoringSessions.add(sessionId)

  try {
    const state = await getState()
    const session = state.sessions.find((candidate) => candidate.id === sessionId)
    if (!session) throw new Error("Session not found.")
    const currentWindow = await chrome.windows.getCurrent()
    const openTabs = await chrome.tabs.query({ windowId: currentWindow.id })
    const urlKey = (url: string) => { try { const parsed = new URL(url); parsed.hash = ""; return parsed.href } catch { return url } }
    const openUrls = new Set(openTabs.map((tab) => tab.url).filter((url): url is string => !!url).map(urlKey))
    let restored = 0
    let skipped = 0
    let alreadyOpen = 0

    for (const tab of [...session.tabs].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))) {
      if (!isRestorableUrl(tab.url)) {
        skipped++
        continue
      }
      if (openUrls.has(urlKey(tab.url))) {
        alreadyOpen++
        continue
      }
      try {
        await chrome.tabs.create({ windowId: currentWindow.id, url: tab.url, pinned: tab.pinned, active: false })
        openUrls.add(urlKey(tab.url))
        restored++
      } catch {
        skipped++
      }
    }

    const nextState = await updateState((current) => {
      const restoredSession = current.sessions.find((candidate) => candidate.id === sessionId)
      if (restoredSession) {
        restoredSession.lastRestoredAt = Date.now()
        restoredSession.updatedAt = Date.now()
      }
      return current
    })

    return {
      ok: true,
      data: nextState,
      message: `${restored} tab${restored === 1 ? "" : "s"} restored.${alreadyOpen ? ` ${alreadyOpen} already open.` : ""}${skipped ? ` ${skipped} unsupported tab${skipped === 1 ? " was" : "s were"} skipped.` : ""}`
    }
  } finally {
    restoringSessions.delete(sessionId)
  }
}

async function startFocus(workspaceId: string, duration: number, objective?: string, resumeSessionId?: string): Promise<Response<ClearheadState>> {
  if (!validFocusDuration(duration)) throw new Error("Choose a duration from 1 to 1,440 minutes.")
  const entitlement = (await getExtensionAccount()).entitlement
  if (!canUseCustomFocusDuration(entitlement) && ![25, 50].includes(duration)) throw new Error("Custom focus durations are available with Clearhead Pro.")
  const now = Date.now()
  const focusId = newId()
  const endsAt = now + duration * 60_000
  const current = await getState()
  if (current.focus.active) throw new Error("Focus Mode is already active.")
  const workspace = current.workspaces.find((candidate) => candidate.id === workspaceId)
  const resolvedObjective = objective?.trim() || (resumeSessionId ? current.sessions.find((session) => session.id === resumeSessionId)?.objective : undefined) || workspace?.name || "Make meaningful progress"
  if (resumeSessionId) {
    const restored = await restoreSession(resumeSessionId)
    if (!restored.ok) throw new Error(restored.error)
  }
  const startingTabs = (await captureTabs()).map(toSavedTab)

  const state = await updateState((current) => {
    if (current.focus.active) throw new Error("Focus Mode is already active.")
    if (!current.workspaces.some((workspace) => workspace.id === workspaceId)) throw new Error("Workspace not found.")
    current.currentWorkspaceId = workspaceId
    current.focus = { active: true, id: focusId, workspaceId, objective: resolvedObjective, resumedSessionId: resumeSessionId, startingTabs, startedAt: now, endsAt, distractionsBlocked: 0 }
    return current
  })

  try {
    await chrome.alarms.create(FOCUS_ALARM, { when: endsAt })
    await applyRules(workspaceId)
    return { ok: true, data: state, message: resumeSessionId ? "Your context is ready. Stay with the outcome you chose." : "Your browser is ready. Stay with the outcome you chose." }
  } catch (error) {
    await updateState((current) => {
      if (current.focus.active && current.focus.id === focusId) current.focus = { active: false }
      return current
    })
    await chrome.alarms.clear(FOCUS_ALARM)
    await clearRules()
    throw error
  }
}

async function clearHead(workspaceId: string, requestedKeepTabIds: number[] = []): Promise<Response<ClearheadState>> {
  const candidates = await captureTabs()
  const active = candidates.find((tab) => tab.active)
  const candidateIds = new Set(candidates.map((tab) => tab.tabId))
  const keepTabIds = new Set(requestedKeepTabIds.filter((id) => candidateIds.has(id)))
  if (!keepTabIds.size && active) keepTabIds.add(active.tabId)
  const tabsToPark = candidates.filter((tab) => !keepTabIds.has(tab.tabId))
  if (!tabsToPark.length) return { ok: true, data: await getState(), message: "Everything you chose is staying open." }
  const now = Date.now()
  const state = await updateState((current) => {
    if (!current.workspaces.some((workspace) => workspace.id === workspaceId)) throw new Error("Workspace not found.")
    current.sessions.push({ id: newId(), workspaceId, name: `Cleared tabs · ${new Date(now).toLocaleDateString()}`, objective: "Review parked browser clutter", nextStep: "Restore only what still matters", checkpoint: true, outcome: "paused", tabs: tabsToPark.map(toSavedTab), createdAt: now, updatedAt: now })
    current.stats.sessionsSaved++
    return current
  })
  let parked = 0
  let remainedOpen = 0
  for (const tab of tabsToPark) {
    try { await chrome.tabs.remove(tab.tabId); parked++ } catch { remainedOpen++ }
  }
  return { ok: true, data: state, message: `${parked} tab${parked === 1 ? "" : "s"} parked safely. ${keepTabIds.size} chosen tab${keepTabIds.size === 1 ? "" : "s"} stayed open.${remainedOpen ? ` ${remainedOpen} could not be closed.` : ""}` }
}

async function handle(request: Request, sender: chrome.runtime.MessageSender): Promise<Response<unknown>> {
  try {
    if (request.type === "GET_STATE") {
      const state = await getState()
      return { ok: true, data: state.focus.active && state.focus.endsAt <= Date.now() ? await finishFocus(false) : state }
    }
    if (request.type === "GET_TABS") return { ok: true, data: await captureTabs() }
    if (request.type === "OPEN_SIDE_PANEL") {
      const windowId = sender.tab?.windowId
      if (!windowId) throw new Error("Open the side panel from the Clearhead toolbar popup.")
      await chrome.sidePanel.open({ windowId })
      return { ok: true, data: null }
    }
    if (request.type === "SAVE_SESSION") return await saveSession(request)
    if (request.type === "RESTORE_SESSION") return await restoreSession(request.sessionId)
    if (request.type === "START_FOCUS") return await startFocus(request.workspaceId, request.duration, request.objective, request.resumeSessionId)
    if (request.type === "END_FOCUS") return { ok: true, data: await finishFocus(true, request.outcome, request.nextStep), message: request.outcome === "completed" ? "Objective completed. Your momentum is saved." : "Checkpoint saved. You can return without rebuilding context." }
    if (request.type === "CLEAR_HEAD") return await clearHead(request.workspaceId, request.keepTabIds)
    if (request.type === "RESET") {
      await clearRules()
      await chrome.alarms.clear(FOCUS_ALARM)
      return { ok: true, data: await resetState(), message: "Clearhead data was reset." }
    }
    if (request.type === "IMPORT") {
      const checked = validateImport(request.state)
      if (!checked.ok) throw new Error(checked.error)
      const importedState = structuredClone(checked.state)
      // A backup cannot resume a timer that already elapsed while it was on disk.
      if (importedState.focus.active && importedState.focus.endsAt <= Date.now()) importedState.focus = { active: false }
      const previousState = await getState()
      await clearRules()
      await chrome.alarms.clear(FOCUS_ALARM)
      await setState(importedState)
      try {
        if (importedState.focus.active) {
          await applyRules(importedState.focus.workspaceId)
          await chrome.alarms.create(FOCUS_ALARM, { when: importedState.focus.endsAt })
        }
      } catch (error) {
        await clearRules()
        await chrome.alarms.clear(FOCUS_ALARM)
        await setState(previousState)
        if (previousState.focus.active) {
          await applyRules(previousState.focus.workspaceId)
          await chrome.alarms.create(FOCUS_ALARM, { when: previousState.focus.endsAt })
        }
        throw error
      }
      return { ok: true, data: importedState, message: "Clearhead data imported." }
    }
    throw new Error("Unknown request.")
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." }
  }
}

chrome.runtime.onMessage.addListener((request: Request, sender, respond) => {
  void handle(request, sender).then(respond)
  return true
})

chrome.runtime.onInstalled.addListener(() => {
  void getState()
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
})

chrome.runtime.onStartup.addListener(async () => {
  const state = await getState()
  if (!state.focus.active) {
    await clearRules()
    await chrome.alarms.clear(FOCUS_ALARM)
    return
  }
  if (state.focus.endsAt <= Date.now()) {
    await finishFocus(false)
    return
  }
  await applyRules(state.focus.workspaceId)
  await chrome.alarms.create(FOCUS_ALARM, { when: state.focus.endsAt })
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === FOCUS_ALARM) void finishFocus(false)
})

chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0 || !details.url.startsWith(chrome.runtime.getURL("tabs/blocked.html"))) return
  const state = await getState()
  if (!state.focus.active) return
  const focusId = state.focus.id
  const domain = new URL(details.url).searchParams.get("domain") || "unknown"
  const key = `${details.tabId}:${domain}`
  const now = Date.now()
  if (now - (recentBlockedAttempts.get(key) ?? 0) < 2_000) return
  recentBlockedAttempts.set(key, now)
  await updateState((current) => {
    if (!current.focus.active || current.focus.id !== focusId) return current
    current.focus.distractionsBlocked++
    current.stats.distractionsBlocked++
    current.stats.weekly = updateWeekly(current.stats.weekly, now, { distractionsBlocked: 1 })
    return current
  })
})

async function blockClientSideNavigation(details: chrome.webNavigation.WebNavigationTransitionCallbackDetails): Promise<void> {
  if (details.frameId !== 0 || details.url.startsWith(chrome.runtime.getURL(""))) return
  const state = await getState()
  if (!state.focus.active) return
  const focus = state.focus
  const workspace = state.workspaces.find((candidate) => candidate.id === focus.workspaceId)
  const target = workspace?.blockedDomains.find((candidate) => urlMatchesBlockTarget(details.url, candidate))
  if (!target) return
  await chrome.tabs.update(details.tabId, {
    url: `${chrome.runtime.getURL("tabs/blocked.html")}?domain=${encodeURIComponent(target)}`
  })
}

// Declarative Net Request catches full document navigations. YouTube Shorts and
// many modern sites change routes with history.pushState, which produces no
// network-level main-frame request, so handle that browser event explicitly.
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  void blockClientSideNavigation(details)
})
