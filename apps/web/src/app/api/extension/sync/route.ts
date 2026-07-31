import { syncedClearheadState } from "@clearhead/database/schema"
import { eq } from "drizzle-orm"
import { entitlementForUser } from "@/lib/entitlements"
import { extensionCors, extensionSession, optionsResponse } from "@/lib/extension-api"
import { db } from "@/lib/server-db"

export const dynamic = "force-dynamic"
export async function OPTIONS(request: Request) { return optionsResponse(request) }

export async function GET(request: Request) {
  const cors = extensionCors(request); if (!cors) return Response.json({ error: "Origin not allowed." }, { status: 403 })
  const session = await extensionSession(request); if (!session) return Response.json({ error: "Unauthorized." }, { status: 401, headers: cors })
  const entitlement = await entitlementForUser(session.user.id); if (!entitlement.features.cloudSync) return Response.json({ error: "Cloud sync requires Clearhead Pro." }, { status: 403, headers: cors })
  const rows = await db.select().from(syncedClearheadState).where(eq(syncedClearheadState.userId, session.user.id))
  return Response.json({ devices: rows }, { headers: cors })
}

export async function PUT(request: Request) {
  const cors = extensionCors(request); if (!cors) return Response.json({ error: "Origin not allowed." }, { status: 403 })
  const session = await extensionSession(request); if (!session) return Response.json({ error: "Unauthorized." }, { status: 401, headers: cors })
  const entitlement = await entitlementForUser(session.user.id); if (!entitlement.features.cloudSync) return Response.json({ error: "Cloud sync requires Clearhead Pro." }, { status: 403, headers: cors })
  const raw = await request.text(); if (raw.length > 5_000_000) return Response.json({ error: "Sync payload is too large." }, { status: 413, headers: cors })
  let body: { deviceId?: string; revision?: number; state?: unknown }; try { body = JSON.parse(raw) } catch { return Response.json({ error: "Invalid JSON." }, { status: 400, headers: cors }) }
  if (!body.deviceId || typeof body.deviceId !== "string" || !Number.isInteger(body.revision) || !body.state || typeof body.state !== "object") return Response.json({ error: "Invalid sync payload." }, { status: 400, headers: cors })
  await db.insert(syncedClearheadState).values({ userId: session.user.id, deviceId: body.deviceId, revision: body.revision!, state: body.state }).onConflictDoUpdate({ target: [syncedClearheadState.userId, syncedClearheadState.deviceId], set: { revision: body.revision!, state: body.state, updatedAt: new Date() } })
  return Response.json({ ok: true }, { headers: cors })
}
