import { user, userProfile } from "@clearhead/database/schema"
import { and, eq, gt, lte } from "drizzle-orm"
import { sendClearheadEmail } from "@/lib/emails"
import { db } from "@/lib/server-db"

export const dynamic = "force-dynamic"
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized." }, { status: 401 })
  const now = new Date()
  let sent = 0
  const stages = [{ stage: 1, days: 7, kind: "trial-7" }, { stage: 2, days: 3, kind: "trial-3" }, { stage: 3, days: 1, kind: "trial-1" }] as const
  for (const item of stages) {
    const upper = new Date(now.getTime() + item.days * 86_400_000), lower = new Date(upper.getTime() - 86_400_000)
    const rows = await db.select({ profile: userProfile, email: user.email, name: user.name }).from(userProfile).innerJoin(user, eq(user.id, userProfile.userId)).where(and(eq(userProfile.trialReminderStage, item.stage - 1), gt(userProfile.trialEnd, lower), lte(userProfile.trialEnd, upper)))
    for (const row of rows) { await sendClearheadEmail({ to: row.email, name: row.name, kind: item.kind, url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing` }); await db.update(userProfile).set({ trialReminderStage: item.stage, updatedAt: now }).where(eq(userProfile.userId, row.profile.userId)); sent++ }
  }
  const expired = await db.select({ profile: userProfile, email: user.email, name: user.name }).from(userProfile).innerJoin(user, eq(user.id, userProfile.userId)).where(and(eq(userProfile.trialReminderStage, 3), lte(userProfile.trialEnd, now)))
  for (const row of expired) { await sendClearheadEmail({ to: row.email, name: row.name, kind: "trial-ended", url: `${process.env.NEXT_PUBLIC_APP_URL}/account` }); await db.update(userProfile).set({ trialReminderStage: 4, updatedAt: now }).where(eq(userProfile.userId, row.profile.userId)); sent++ }
  return Response.json({ sent })
}
