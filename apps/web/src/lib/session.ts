import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "./auth"

export async function currentSession() { return auth.api.getSession({ headers: await headers() }) }
export async function requireSession() { const session = await currentSession(); if (!session) redirect("/sign-in"); return session }
