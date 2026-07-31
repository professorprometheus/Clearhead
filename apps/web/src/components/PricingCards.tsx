"use client"

import { Check, Loader2 } from "lucide-react"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"

const free = ["One active workspace", "Five editable checkpoints", "25 and 50 minute focus windows", "Three distraction rules", "Seven days of momentum history"]
const pro = ["Unlimited workspaces and checkpoints", "Focus windows that fit your day", "Unlimited distraction rules", "Complete, searchable history", "Cloud backup across devices"]

export function PricingCards() {
  const { data: session } = authClient.useSession()
  const [annual, setAnnual] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function upgrade() {
    if (!session) { location.href = `/sign-up?next=${encodeURIComponent("/pricing")}`; return }
    setBusy(true); setError("")
    const result = await authClient.subscription.upgrade({ plan: "pro", annual, successUrl: "/checkout/success", cancelUrl: "/checkout/cancelled", returnUrl: "/account/billing", disableRedirect: false })
    if (result.error) { setError(result.error.message ?? "Checkout could not be started."); setBusy(false) }
  }

  return <>
    <div className="mx-auto mb-9 flex w-fit items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-sm font-medium"><button className={`rounded-lg px-4 py-2 transition ${!annual ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`} onClick={() => setAnnual(false)}>Monthly</button><button className={`rounded-lg px-4 py-2 transition ${annual ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500"}`} onClick={() => setAnnual(true)}>Annual <span className={`ml-1 text-[10px] ${annual ? "text-cyan-200" : "text-emerald-600"}`}>Save 35%</span></button></div>
    {error && <p role="alert" className="mx-auto mb-5 max-w-lg rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">{error}</p>}
    <div className="grid gap-6 lg:grid-cols-3">
      <Plan title="Free" price="£0" copy="The essentials for one priority at a time. Free for as long as you need it." features={free} action={<a className="web-button-secondary w-full" href="/sign-up">Start with Free</a>} />
      <Plan title="Pro trial" price="£0" badge="30 days" copy="The complete Clearhead experience. No card. No automatic charge." features={pro} action={<a className="web-button-secondary w-full" href="/sign-up">Try everything free</a>} />
      <Plan featured title="Pro" badge="Best value" price={annual ? "£69.99" : "£8.99"} suffix={annual ? "/ year" : "/ month"} copy={annual ? "Your best work, protected for less than £5.84 a month." : "For people who want every project ready when they return."} features={pro} action={<button disabled={busy} className="web-button w-full" onClick={upgrade}>{busy ? <Loader2 className="size-4 animate-spin" /> : "Choose Pro"}</button>} />
    </div>
  </>
}

function Plan({ title, price, suffix, copy, features, badge, featured, action }: { title: string; price: string; suffix?: string; copy: string; features: string[]; badge?: string; featured?: boolean; action: React.ReactNode }) {
  return <article className={`relative rounded-3xl border p-6 ${featured ? "border-indigo-300 bg-gradient-to-b from-indigo-50 to-white shadow-xl shadow-indigo-950/[0.08]" : "border-slate-200 bg-white shadow-sm"}`}>{badge && <span className={`absolute right-5 top-5 rounded-full px-3 py-1 text-xs font-semibold ${featured ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>{badge}</span>}<h2 className="text-lg font-semibold text-slate-950">{title}</h2><p className="mt-6 text-4xl font-semibold tracking-tight text-slate-950">{price}<span className="ml-1 text-sm font-normal text-slate-500">{suffix}</span></p><p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{copy}</p><ul className="my-6 space-y-3">{features.map(item => <li key={item} className="flex gap-2 text-sm text-slate-700"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />{item}</li>)}</ul>{action}</article>
}
