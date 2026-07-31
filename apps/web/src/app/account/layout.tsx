import { CreditCard, LockKeyhole, UserRound } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/Logo"
import { SignOutButton } from "@/components/AccountActions"
import { requireSession } from "@/lib/session"

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  return <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,.1),transparent_24%)]"><div className="web-shell py-6"><header className="mb-8 flex items-center justify-between"><Logo /><span className="hidden text-sm text-slate-500 sm:block">{session.user.email}</span></header><div className="grid gap-6 lg:grid-cols-[230px_1fr]"><aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><nav className="space-y-1">{[[UserRound, "Account", "/account"], [CreditCard, "Billing", "/account/billing"], [LockKeyhole, "Security", "/account/security"]].map(([Icon, label, href]) => <Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700" href={String(href)} key={String(label)}><Icon className="size-4" />{String(label)}</Link>)}</nav><div className="mt-4 border-t border-slate-200 pt-4"><SignOutButton /></div></aside><section className="min-w-0">{children}</section></div></div></main>
}
