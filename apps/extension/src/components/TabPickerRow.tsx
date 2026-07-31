import { Check, Circle, Pin } from "lucide-react"
import type { TabCandidate } from "~/types/messages"

function compactUrl(raw: string): string {
  try {
    const url = new URL(raw)
    return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}${url.search}`
  } catch {
    return raw
  }
}

export function TabPickerRow({ tab, checked, onChange }: { tab: TabCandidate; checked: boolean; onChange: () => void }) {
  return <label className="tab-option" title={`${tab.title}\n${tab.url}`}>
    <input className="sr-only" type="checkbox" checked={checked} onChange={onChange}/>
    <span className={`tab-check ${checked ? "selected" : ""}`}>{checked ? <Check size={13}/> : <Circle size={13}/>}</span>
    {tab.favIconUrl ? <img src={tab.favIconUrl} alt=""/> : <span className="tab-fallback"/>}
    <span className="tab-option-copy">
      <span className="tab-title">{tab.title}</span>
      <span className="tab-meta">
        <small className="tab-url">{compactUrl(tab.url)}</small>
        {tab.active && <em>Current</em>}
        {tab.pinned && <em><Pin size={9}/>Pinned</em>}
      </span>
    </span>
  </label>
}
