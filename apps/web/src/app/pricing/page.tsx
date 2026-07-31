import type { Metadata } from "next"
import { PricingCards } from "@/components/PricingCards"
import { SiteHeader } from "@/components/SiteHeader"

export const metadata: Metadata = { title: "Pricing" }
export default function PricingPage() { return <main className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.12),transparent_30%)]"><SiteHeader /><section className="web-shell py-20 sm:py-24"><div className="mx-auto mb-12 max-w-3xl text-center"><span className="eyebrow">Simple by design</span><h1 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-6xl">Invest in momentum.<br />Keep control of everything.</h1><p className="mx-auto mt-5 max-w-2xl text-balance text-lg leading-8 text-slate-600">Try the complete product for 30 days. No card, no surprise charge and no risk to the work you save.</p></div><PricingCards /><p className="mx-auto mt-8 max-w-xl text-center text-xs leading-5 text-slate-500">If Pro is not right for you, Clearhead moves to Free automatically. Your saved research remains available to restore or export.</p></section></main> }
