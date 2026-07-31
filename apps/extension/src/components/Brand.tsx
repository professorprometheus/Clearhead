import { ClearheadMark } from "~/components/ClearheadMark"

export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="brand"><span className="mark"><ClearheadMark /></span>{!compact && <span>Clearhead</span>}</div>
}
