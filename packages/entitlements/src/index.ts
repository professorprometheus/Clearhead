import type { EntitlementSnapshot, SubscriptionStatus } from "@clearhead/shared"

export const FREE_LIMITS = { workspaces: 1, sessions: 5, blockedDomains: 3, statisticsDays: 7 } as const
export const PRO_LIMITS = { workspaces: null, sessions: null, blockedDomains: null, statisticsDays: null } as const

export type PlanSource = {
  trialEnd: Date | null
  subscriptionStatus?: string | null
  billingInterval?: string | null
  currentPeriodEnd?: Date | null
  cancelAtPeriodEnd?: boolean | null
}

const paidStatuses = new Set(["active", "past_due", "cancel_at_period_end"])

export function buildEntitlementSnapshot(source: PlanSource, now = new Date()): EntitlementSnapshot {
  const hasPaidPlan = paidStatuses.has(source.subscriptionStatus ?? "")
  const trialActive = !hasPaidPlan && !!source.trialEnd && source.trialEnd.getTime() > now.getTime()
  const plan = hasPaidPlan ? "pro" : trialActive ? "trial" : "free"
  const status: SubscriptionStatus = hasPaidPlan
    ? source.cancelAtPeriodEnd ? "cancel_at_period_end" : source.subscriptionStatus === "past_due" ? "past_due" : "active"
    : trialActive ? "trialing" : source.trialEnd ? "expired" : "free"
  const pro = plan !== "free"
  return {
    plan,
    status,
    billingInterval: source.billingInterval === "month" || source.billingInterval === "year" ? source.billingInterval : null,
    trialEndsAt: source.trialEnd?.toISOString() ?? null,
    trialDaysRemaining: trialActive ? Math.max(1, Math.ceil((source.trialEnd!.getTime() - now.getTime()) / 86_400_000)) : 0,
    currentPeriodEnd: source.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: !!source.cancelAtPeriodEnd,
    limits: pro ? { ...PRO_LIMITS } : { ...FREE_LIMITS },
    features: {
      customFocusDuration: pro,
      strictMode: pro,
      scheduledFocus: pro,
      fullStatistics: pro,
      cloudSync: pro,
      advancedSearch: pro,
      tags: pro,
      recentlyDeleted: pro
    }
  }
}

export const localFreeEntitlement = (): EntitlementSnapshot => buildEntitlementSnapshot({ trialEnd: null })
export const canCreateWorkspace = (entitlement: EntitlementSnapshot, count: number) => entitlement.limits.workspaces === null || count < entitlement.limits.workspaces
export const canCreateSession = (entitlement: EntitlementSnapshot, count: number) => entitlement.limits.sessions === null || count < entitlement.limits.sessions
export const canAddBlockedDomain = (entitlement: EntitlementSnapshot, count: number) => entitlement.limits.blockedDomains === null || count < entitlement.limits.blockedDomains
export const canUseCustomFocusDuration = (entitlement: EntitlementSnapshot) => entitlement.features.customFocusDuration
export const canUseStrictMode = (entitlement: EntitlementSnapshot) => entitlement.features.strictMode
export const canUseScheduledFocus = (entitlement: EntitlementSnapshot) => entitlement.features.scheduledFocus
export const canViewFullStatistics = (entitlement: EntitlementSnapshot) => entitlement.features.fullStatistics
export const canUseCloudSync = (entitlement: EntitlementSnapshot) => entitlement.features.cloudSync
export const canUseAdvancedSearch = (entitlement: EntitlementSnapshot) => entitlement.features.advancedSearch
