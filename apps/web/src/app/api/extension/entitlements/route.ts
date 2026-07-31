import type { AccountSnapshot } from "@clearhead/shared"
import { entitlementForUser } from "@/lib/entitlements"
import { extensionCors, extensionSession, optionsResponse } from "@/lib/extension-api"

export const dynamic = "force-dynamic"
export async function OPTIONS(request: Request) { return optionsResponse(request) }
export async function GET(request: Request) {
  const cors = extensionCors(request)
  if (!cors) return Response.json({ error: "Origin not allowed." }, { status: 403 })
  const session = await extensionSession(request)
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401, headers: cors })
  const body: AccountSnapshot = {
    user: { id: session.user.id, name: session.user.name, email: session.user.email, emailVerified: session.user.emailVerified, image: session.user.image },
    entitlement: await entitlementForUser(session.user.id)
  }
  return Response.json(body, { headers: { ...cors, "Cache-Control": "private, max-age=300" } })
}
