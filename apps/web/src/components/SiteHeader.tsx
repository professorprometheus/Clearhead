import Link from "next/link"
import { Logo } from "./Logo"

export function SiteHeader() {
  return <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
    <div className="web-shell flex h-16 items-center justify-between">
      <Logo />
      <nav className="flex items-center gap-1 text-sm font-medium text-slate-600">
        <Link className="hidden rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950 md:block" href="/#how-it-works">How it works</Link>
        <Link className="hidden rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950 sm:block" href="/pricing">Pricing</Link>
        <Link className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950" href="/sign-in">Sign in</Link>
        <Link className="web-button ml-1 min-h-9 px-4 py-2" href="/sign-up">Start free</Link>
      </nav>
    </div>
  </header>
}
