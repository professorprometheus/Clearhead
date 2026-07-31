import { Loader2, Sparkles, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { TabPickerRow } from "~/components/TabPickerRow"
import type { ClearheadState } from "~/types/state"
import type { TabCandidate } from "~/types/messages"
import { send } from "~/types/messages"

export function ClearHeadPicker({ workspaceId, onDone, onCancel }: { workspaceId: string; onDone: (message: string) => void; onCancel: () => void }) {
  const [tabs, setTabs] = useState<TabCandidate[]>([])
  const [keep, setKeep] = useState<number[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    void send<TabCandidate[]>({ type: "GET_TABS" }).then((response) => {
      if (response.ok) {
        setTabs(response.data)
        const protectedTabs = response.data.filter((tab) => tab.active || tab.pinned).map((tab) => tab.tabId)
        setKeep(protectedTabs.length ? protectedTabs : response.data.slice(0, 1).map((tab) => tab.tabId))
      } else setError(response.error)
      setBusy(false)
    })
  }, [])

  const parkedCount = useMemo(() => tabs.filter((tab) => !keep.includes(tab.tabId)).length, [tabs, keep])
  const currentTab = tabs.find((tab) => tab.active)

  async function submit() {
    setError("")
    setBusy(true)
    const response = await send<ClearheadState>({ type: "CLEAR_HEAD", workspaceId, keepTabIds: keep })
    setBusy(false)
    if (response.ok) onDone(response.message || "Your browser has room to think.")
    else setError(response.error)
  }

  return <section className="capture-panel clear-head-picker stack" aria-label="Choose tabs to keep open">
    <div className="row between">
      <div className="min-w-0">
        <span className="eyebrow-extension">Make room</span>
        <h2 className="section-title">What belongs with you now?</h2>
      </div>
      <button className="icon-button" aria-label="Cancel" onClick={onCancel}><X size={18}/></button>
    </div>
    <p className="muted">Keep the useful tabs in view. Clearhead will save everything else together, ready for later.</p>
    {busy && !tabs.length ? <p className="muted"><Loader2 className="inline size-4 animate-spin"/> Reading this window's tabs...</p> : <div className="tabs" aria-label="Open tabs">
      {tabs.map((tab) => <TabPickerRow key={tab.tabId} tab={tab} checked={keep.includes(tab.tabId)} onChange={() => setKeep((current) => current.includes(tab.tabId) ? current.filter((id) => id !== tab.tabId) : [...current, tab.tabId])}/>) }
    </div>}
    <div className="selection-summary">
      <span><strong>{keep.length}</strong> staying open</span>
      <span><strong>{parkedCount}</strong> to park</span>
    </div>
    <div className="row between responsive">
      <span className="tiny">Current and pinned tabs are kept by default.</span>
      <div className="row">
        {currentTab && <button className="text-button" onClick={() => setKeep([currentTab.tabId])}>Keep only this tab</button>}
        <button className="text-button" onClick={() => setKeep(keep.length === tabs.length ? (currentTab ? [currentTab.tabId] : tabs.slice(0, 1).map((tab) => tab.tabId)) : tabs.map((tab) => tab.tabId))}>{keep.length === tabs.length ? "Reset" : "Keep all"}</button>
      </div>
    </div>
    {error && <div className="notice error" role="alert">{error}</div>}
    <button className="btn" disabled={busy || !keep.length || !parkedCount} onClick={() => void submit()}>{busy ? <Loader2 className="size-4 animate-spin"/> : <><Sparkles size={16}/>Make room for focus</>}</button>
    {!busy && !parkedCount && <p className="tiny text-center">Everything in this window is selected to stay open.</p>}
  </section>
}
