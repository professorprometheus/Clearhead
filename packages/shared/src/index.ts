export const subscriptionStatuses = ["trialing", "free", "active", "past_due", "cancel_at_period_end", "cancelled", "expired"] as const
export type SubscriptionStatus = (typeof subscriptionStatuses)[number]
export type BillingInterval = "month" | "year" | null
export type PlanName = "free" | "trial" | "pro"

export type EntitlementSnapshot = {
  plan: PlanName
  status: SubscriptionStatus
  billingInterval: BillingInterval
  trialEndsAt: string | null
  trialDaysRemaining: number
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  limits: { workspaces: number | null; sessions: number | null; blockedDomains: number | null; statisticsDays: number | null }
  features: {
    customFocusDuration: boolean
    strictMode: boolean
    scheduledFocus: boolean
    fullStatistics: boolean
    cloudSync: boolean
    advancedSearch: boolean
    tags: boolean
    recentlyDeleted: boolean
  }
}

export type AccountSnapshot = {
  user: { id: string; name: string; email: string; emailVerified: boolean; image?: string | null }
  entitlement: EntitlementSnapshot
}

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value)
const nullablePositiveInteger = (value: unknown) => value === null || (Number.isInteger(value) && Number(value) > 0)
const nullableDateString = (value: unknown) => value === null || (typeof value === "string" && Number.isFinite(Date.parse(value)))

export function isEntitlementSnapshot(value: unknown): value is EntitlementSnapshot {
  if (!record(value) || !["free", "trial", "pro"].includes(String(value.plan)) || !subscriptionStatuses.includes(value.status as SubscriptionStatus)) return false
  if (![null, "month", "year"].includes(value.billingInterval as string | null) || !nullableDateString(value.trialEndsAt) || !nullableDateString(value.currentPeriodEnd) || !Number.isInteger(value.trialDaysRemaining) || Number(value.trialDaysRemaining) < 0 || typeof value.cancelAtPeriodEnd !== "boolean") return false
  const limits = value.limits
  const features = value.features
  if (!record(limits) || !["workspaces", "sessions", "blockedDomains", "statisticsDays"].every((key) => nullablePositiveInteger(limits[key]))) return false
  if (!record(features) || !["customFocusDuration", "strictMode", "scheduledFocus", "fullStatistics", "cloudSync", "advancedSearch", "tags", "recentlyDeleted"].every((key) => typeof features[key] === "boolean")) return false
  return true
}

export function isAccountSnapshot(value: unknown): value is AccountSnapshot {
  if (!record(value) || !record(value.user) || !isEntitlementSnapshot(value.entitlement)) return false
  const user = value.user
  return typeof user.id === "string" && typeof user.name === "string" && typeof user.email === "string" && user.email.includes("@") && typeof user.emailVerified === "boolean" && (user.image === undefined || user.image === null || typeof user.image === "string")
}

export function parseAccountSnapshot(value: unknown): AccountSnapshot {
  if (!isAccountSnapshot(value)) throw new Error("The account response is invalid.")
  return value
}
