import { auth } from "./auth"

export async function extensionSession(request: Request) { return auth.api.getSession({ headers: request.headers }) }

export function extensionCors(request: Request) {
  const origin = request.headers.get("origin")
  const allowed = process.env.NEXT_PUBLIC_EXTENSION_URL
  if (!origin || !allowed || origin !== allowed) return null
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    Vary: "Origin"
  }
}

export function optionsResponse(request: Request) { const headers = extensionCors(request); return headers ? new Response(null, { status: 204, headers }) : Response.json({ error: "Origin not allowed." }, { status: 403 }) }
