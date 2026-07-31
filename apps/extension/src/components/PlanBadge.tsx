import { Crown, Sparkles } from "lucide-react"
import type { EntitlementSnapshot } from "@clearhead/shared"

export function PlanBadge({ entitlement, compact = false }: { entitlement: EntitlementSnapshot; compact?: boolean }) {
  const trial = entitlement.plan === "trial"
  const pro = entitlement.plan === "pro"
  return <span className={`plan-badge ${pro || trial ? "plan-badge-pro" : ""}`}>{trial ? <Sparkles size={13}/> : pro ? <Crown size={13}/> : null}{compact ? trial ? `${entitlement.trialDaysRemaining}d trial` : pro ? "Pro" : "Free" : trial ? `Pro trial · ${entitlement.trialDaysRemaining} days left` : pro ? `Clearhead Pro${entitlement.billingInterval === "year" ? " · Annual" : entitlement.billingInterval === "month" ? " · Monthly" : ""}` : "Clearhead Free"}</span>
}
