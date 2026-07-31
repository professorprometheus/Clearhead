import { stripe } from "@better-auth/stripe"
import { processedStripeWebhook, schema, user as userTable, userProfile } from "@clearhead/database/schema"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { APIError } from "better-auth/api"
import { nextCookies } from "better-auth/next-js"
import { bearer } from "better-auth/plugins"
import { eq } from "drizzle-orm"
import Stripe from "stripe"
import { db } from "./server-db"
import { sendClearheadEmail } from "./emails"

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_MONTHLY_PRICE_ID && process.env.STRIPE_ANNUAL_PRICE_ID)
const stripeClient = stripeConfigured ? new Stripe(process.env.STRIPE_SECRET_KEY!) : null

const plugins: Parameters<typeof betterAuth>[0]["plugins"] = [bearer()]
if (stripeClient) {
  plugins!.push(stripe({
    stripeClient,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    createCustomerOnSignUp: true,
    subscription: {
      enabled: true,
      requireEmailVerification: true,
      plans: [{ name: "pro", priceId: process.env.STRIPE_MONTHLY_PRICE_ID!, annualDiscountPriceId: process.env.STRIPE_ANNUAL_PRICE_ID! }],
      getCheckoutSessionParams: async () => ({ params: { allow_promotion_codes: true } })
    },
    onEvent: async (event) => {
      const inserted = await db.insert(processedStripeWebhook).values({ eventId: event.id, eventType: event.type }).onConflictDoNothing().returning({ id: processedStripeWebhook.eventId })
      if (!inserted.length) return
      if (!["checkout.session.completed", "customer.subscription.deleted", "invoice.payment_failed"].includes(event.type)) return
      const object = event.data.object as { customer?: string | null }
      if (typeof object.customer !== "string") return
      const [owner] = await db.select().from(userTable).where(eq(userTable.stripeCustomerId, object.customer)).limit(1)
      if (!owner) return
      const kind = event.type === "checkout.session.completed" ? "subscription-confirmed" : event.type === "customer.subscription.deleted" ? "subscription-cancelled" : "payment-failed"
      await sendClearheadEmail({ to: owner.email, name: owner.name, kind, url: `${appUrl}/account/billing` })
    }
  }))
}
plugins!.push(nextCookies())

export const auth = betterAuth({
  appName: "Clearhead",
  baseURL: process.env.BETTER_AUTH_URL ?? appUrl,
  secret: process.env.BETTER_AUTH_SECRET ?? "clearhead-build-only-secret-that-must-not-be-used-in-production",
  database: drizzleAdapter(db, { provider: "pg", schema }),
  trustedOrigins: [appUrl, process.env.NEXT_PUBLIC_EXTENSION_URL].filter((value): value is string => !!value),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => { await sendClearheadEmail({ to: user.email, name: user.name, kind: "reset", url }) }
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => { await sendClearheadEmail({ to: user.email, name: user.name, kind: "verify", url }) }
  },
  socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } } : {},
  account: { encryptOAuthTokens: true, accountLinking: { enabled: true, trustedProviders: ["google", "email-password"], allowDifferentEmails: false } },
  user: {
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        const customerId = (user as typeof user & { stripeCustomerId?: string | null }).stripeCustomerId
        if (!stripeClient || !customerId) return
        for await (const item of stripeClient.subscriptions.list({ customer: customerId, status: "all" })) {
          if (!["canceled", "incomplete", "incomplete_expired"].includes(item.status)) throw new APIError("BAD_REQUEST", { message: "Cancel your active subscription before deleting your account." })
        }
      }
    }
  },
  databaseHooks: {
    user: { create: { after: async (user) => {
      const trialStart = new Date(), trialEnd = new Date(trialStart.getTime() + 30 * 86_400_000)
      await db.insert(userProfile).values({ userId: user.id, trialStart, trialEnd }).onConflictDoNothing()
      await sendClearheadEmail({ to: user.email, name: user.name, kind: "welcome", url: `${appUrl}/account` })
    } } }
  },
  plugins
})
