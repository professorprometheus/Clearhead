import Link from "next/link"
import { ClearheadMark } from "./ClearheadMark"

export function Logo({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="inline-flex items-center gap-2.5 font-semibold tracking-[-0.025em] text-slate-950">
    <ClearheadMark />
    {!compact && <span className="text-lg">Clearhead</span>}
  </Link>
}
