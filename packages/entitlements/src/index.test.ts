import { describe, expect, it } from "vitest"
import { buildEntitlementSnapshot, canCreateSession } from "./index"

describe("entitlements", () => {
  it("grants no-card trial access until the trial end", () => {
    const now = new Date("2026-07-25T00:00:00.000Z")
    const result = buildEntitlementSnapshot({ trialEnd: new Date("2026-08-24T00:00:00.000Z") }, now)
    expect(result.plan).toBe("trial")
    expect(result.trialDaysRemaining).toBe(30)
    expect(result.features.cloudSync).toBe(true)
  })

  it("downgrades safely to free limits after trial", () => {
    const result = buildEntitlementSnapshot({ trialEnd: new Date("2026-07-01T00:00:00.000Z") }, new Date("2026-07-25T00:00:00.000Z"))
    expect(result.plan).toBe("free")
    expect(canCreateSession(result, 5)).toBe(false)
  })

  it("keeps paid access authoritative even after the account trial", () => {
    const result = buildEntitlementSnapshot({ trialEnd: new Date("2026-07-01T00:00:00.000Z"), subscriptionStatus: "active", billingInterval: "year" })
    expect(result.plan).toBe("pro")
    expect(result.billingInterval).toBe("year")
  })
})
