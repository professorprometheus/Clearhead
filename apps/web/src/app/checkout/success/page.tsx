import { CheckCircle2 } from "lucide-react"
import { AuthShell } from "@/components/AuthShell"
export default function CheckoutSuccess(){return <AuthShell title="Welcome to Clearhead Pro." copy="Your subscription is being confirmed securely."><div className="text-center"><CheckCircle2 className="mx-auto size-12 text-emerald-600"/><p className="mt-5 text-sm text-slate-600">Everything in Pro will be ready as soon as your payment confirmation completes.</p><a className="web-button mt-6 w-full" href="/account/billing">Continue to Clearhead</a></div></AuthShell>}
