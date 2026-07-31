import { AuthShell } from "@/components/AuthShell"
export default function CheckoutCancelled(){return <AuthShell title="Checkout cancelled" copy="Nothing was charged and your current plan is unchanged."><div className="space-y-3"><a className="web-button w-full" href="/pricing">Return to plans</a><a className="web-button-secondary w-full" href="/account">Back to account</a></div></AuthShell>}
