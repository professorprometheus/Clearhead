import { ArrowRight, Check, CheckCircle2, CircleDot, Focus, Layers3, Play, ShieldCheck, Sparkles } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/Logo"
import { SiteHeader } from "@/components/SiteHeader"

const steps = [
  [CircleDot, "Decide", "Name the result you want before the browser decides for you."],
  [Layers3, "Prepare", "Bring forward the right tabs. Put everything else safely out of sight."],
  [ShieldCheck, "Protect", "Keep your outcome visible and distractions outside the room."],
  [CheckCircle2, "Continue", "Leave a clear next step, then return without rebuilding your context."],
] as const

const principles = [
  ["Your work stays yours", "Restore, export or remove your research whenever you choose."],
  ["Nothing closes by accident", "Clearhead parks your tabs in a recoverable checkpoint before making room."],
  ["Built for real work", "Projects, focus windows and restart points work together as one calm system."],
] as const

export default function Home() {
  return <main className="min-h-screen overflow-hidden">
    <SiteHeader />
    <section className="hero-grid relative border-b border-slate-200/70">
      <div className="web-shell relative py-20 text-center sm:py-28 lg:py-32">
        <div className="hero-orb" aria-hidden="true" />
        <span className="eyebrow relative"><Sparkles className="size-3.5" /> Your browser. On your side.</span>
        <h1 className="relative mx-auto mt-7 max-w-5xl text-balance text-5xl font-semibold tracking-[-0.055em] text-slate-950 sm:text-7xl lg:text-[80px] lg:leading-[0.98]">Turn open tabs into<br /><span className="text-gradient">finished work.</span></h1>
        <p className="relative mx-auto mt-7 max-w-2xl text-balance text-lg leading-8 text-slate-600 sm:text-xl">Clearhead brings the right context forward, puts distractions away and keeps your next step ready—so starting again feels effortless.</p>
        <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link className="web-button min-w-52" href="/sign-up">Start free for 30 days <ArrowRight className="size-4" /></Link>
          <a className="web-button-secondary min-w-44" href="#how-it-works"><Play className="size-4" /> See how it works</a>
        </div>
        <p className="mt-4 text-xs font-medium text-slate-500">No card required. Your saved research is always yours.</p>
        <div className="product-frame relative mx-auto mt-16 max-w-5xl text-left sm:mt-20">
          <div className="product-bar"><span /><span /><span /><p>Clearhead · Focus home</p></div>
          <div className="grid min-h-[490px] lg:grid-cols-[220px_1fr]">
            <aside className="hidden border-r border-slate-200 bg-slate-50/80 p-5 lg:block">
              <Logo />
              <nav className="mt-8 space-y-1.5">{["Focus home", "Workspaces", "Checkpoints", "Focus rules", "Settings"].map((item, index) => <div key={item} className={`rounded-xl px-3 py-2.5 text-sm ${index === 0 ? "bg-indigo-50 font-semibold text-indigo-700" : "text-slate-500"}`}>{item}</div>)}</nav>
              <div className="mt-24 rounded-2xl border border-indigo-100 bg-white p-4"><p className="kicker">Today</p><p className="mt-2 text-2xl font-semibold text-slate-950">43 min</p><p className="mt-1 text-xs text-slate-500">of protected focus</p></div>
            </aside>
            <div className="bg-white p-5 sm:p-8 lg:p-10">
              <div className="flex items-start justify-between gap-4"><div><p className="kicker">What matters now</p><h2 className="mt-2 max-w-lg text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Finish the proposal first draft</h2></div><span className="status-pill"><span />Ready</span></div>
              <div className="mt-8 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-cyan-50/50 p-5 sm:p-6">
                <p className="text-xs font-semibold text-slate-500">Your focus environment is ready</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">{["6 useful tabs ready", "17 distractions parked", "Focus rules active"].map(item => <div className="flex items-center gap-2 text-xs font-medium text-slate-700" key={item}><span className="grid size-5 place-items-center rounded-full bg-emerald-100"><Check className="size-3 text-emerald-700" /></span>{item}</div>)}</div>
                <button className="web-button mt-6 w-full"><Play className="size-4" /> Begin focus</button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="product-card"><p className="kicker">Pick up here</p><h3 className="mt-3 font-semibold text-slate-900">Continue with the evidence section</h3><p className="mt-2 text-xs leading-5 text-slate-500">Your last checkpoint has the six tabs and next step you need.</p></div>
                <div className="product-card"><p className="kicker">Clear my head</p><h3 className="mt-3 font-semibold text-slate-900">Clutter, safely out of sight</h3><p className="mt-2 text-xs leading-5 text-slate-500">Restore anything later. Bring back only what still matters.</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="web-shell py-20 sm:py-28">
      <div className="mx-auto max-w-3xl text-center"><span className="eyebrow">Made for momentum</span><h2 className="section-heading mt-5">Most tab managers save windows.<br />Clearhead saves your train of thought.</h2><p className="section-copy mx-auto mt-5 max-w-2xl">A tab is only useful when you remember why it mattered. Clearhead keeps the outcome, the context and the next move together.</p></div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">{principles.map(([title, copy], index) => <article className="web-card" key={title}><span className="number-chip">0{index + 1}</span><h3 className="mt-6 text-lg font-semibold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p></article>)}</div>
    </section>
    <section id="how-it-works" className="border-y border-slate-200 bg-white py-20 sm:py-28"><div className="web-shell"><div className="max-w-2xl"><span className="eyebrow">One uninterrupted loop</span><h2 className="section-heading mt-5">From scattered to moving.</h2><p className="section-copy mt-4">Clearhead supports the moments where momentum usually breaks: starting, resisting distraction and returning later.</p></div><div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 md:grid-cols-2 lg:grid-cols-4">{steps.map(([Icon, title, copy], index) => <article className="bg-white p-6 sm:p-7" key={title}><span className="flex items-center justify-between"><span className="feature-icon"><Icon className="size-5" /></span><span className="text-xs font-semibold text-slate-300">0{index + 1}</span></span><h3 className="mt-6 text-lg font-semibold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p></article>)}</div></div></section>
    <section className="web-shell py-20 sm:py-28"><div className="cta-panel"><Focus className="size-7 text-cyan-300" /><p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-indigo-200">Your attention is worth protecting</p><h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">Make your browser feel like a place where work gets finished.</h2><p className="mt-5 max-w-xl text-balance leading-7 text-indigo-100/75">Try every Pro feature for 30 days. Keep using Clearhead Free if it has not earned a place in your workflow.</p><Link href="/sign-up" className="web-button-light mt-8">Start your free month <ArrowRight className="size-4" /></Link></div></section>
    <footer className="border-t border-slate-200 bg-white"><div className="web-shell flex flex-col items-center justify-between gap-4 py-8 text-sm text-slate-500 sm:flex-row"><Logo /><p>Thoughtful software for focused work.</p><Link href="/pricing" className="font-semibold text-slate-700 hover:text-indigo-700">Pricing</Link></div></footer>
  </main>
}
