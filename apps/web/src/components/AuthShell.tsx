import { Check } from "lucide-react"
import { Logo } from "./Logo"

export function AuthShell({ title, copy, children }: { title: string; copy: string; children: React.ReactNode }) {
  return <main className="grid min-h-screen bg-white lg:grid-cols-[1fr_1.05fr]">
    <section className="grid place-items-center px-5 py-12"><div className="w-full max-w-md"><Logo /><h1 className="mt-12 text-4xl font-semibold tracking-[-0.04em] text-slate-950">{title}</h1><p className="mt-3 text-base leading-7 text-slate-600">{copy}</p><div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/[0.06] sm:p-7">{children}</div></div></section>
    <aside className="relative hidden overflow-hidden bg-indigo-950 p-12 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(34,211,238,.24),transparent_32%),radial-gradient(circle_at_10%_90%,rgba(99,102,241,.4),transparent_36%)]"/><p className="relative text-sm font-semibold text-indigo-200">CLEARHEAD</p><div className="relative max-w-lg"><p className="text-4xl font-semibold leading-tight tracking-[-0.04em]">Everything you need to move the work forward. Nothing you don’t.</p><div className="mt-10 space-y-4">{["30 days of every Pro feature", "No card and no automatic charge", "Your research remains yours on every plan"].map(item => <p key={item} className="flex items-center gap-3 text-sm text-indigo-100"><span className="grid size-6 place-items-center rounded-full bg-cyan-300/15 text-cyan-300"><Check className="size-3.5" /></span>{item}</p>)}</div></div><p className="relative text-xs text-indigo-300/70">Thoughtful software for focused work.</p></aside>
  </main>
}
