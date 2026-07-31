import { Crown, X } from "lucide-react"
import { openWeb } from "~/lib/account"

export function UpgradePrompt({ title, copy, onClose }: { title: string; copy: string; onClose: () => void }) {
  return <div className="upgrade-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}><section className="upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title"><button className="icon-button absolute right-3 top-3" aria-label="Close" onClick={onClose}><X size={17}/></button><span className="upgrade-icon"><Crown size={22}/></span><p className="eyebrow-extension">Clearhead Pro</p><h2 id="upgrade-title">{title}</h2><p className="muted">{copy}</p><p className="tiny">Whatever you decide, your saved research remains yours to restore or export.</p><div className="actions"><button className="btn" onClick={()=>void openWeb("/pricing")}>Explore Pro</button><button className="btn secondary" onClick={onClose}>Maybe later</button></div></section></div>
}
