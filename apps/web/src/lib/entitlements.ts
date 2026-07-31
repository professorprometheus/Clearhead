import { buildEntitlementSnapshot } from "@clearhead/entitlements"
import { subscription, userProfile } from "@clearhead/database/schema"
import { and, desc, eq, inArray } from "drizzle-orm"
import { db } from "./server-db"

export async function entitlementForUser(userId: string) {
  const [profile] = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1)
  const [paid] = await db.select().from(subscription).where(and(inArray(subscription.status, ["active", "past_due", "trialing"]), eq(subscription.referenceId, userId))).orderBy(desc(subscription.periodEnd)).limit(1)
  return buildEntitlementSnapshot({
    trialEnd: profile?.trialEnd ?? null,
    subscriptionStatus: paid?.status ?? null,
    billingInterval: paid?.billingInterval ?? null,
    currentPeriodEnd: paid?.periodEnd ?? null,
    cancelAtPeriodEnd: paid?.cancelAtPeriodEnd ?? false
  })
}
