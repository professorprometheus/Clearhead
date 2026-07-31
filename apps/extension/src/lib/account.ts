import { localFreeEntitlement } from "@clearhead/entitlements"
import { isAccountSnapshot, parseAccountSnapshot, type AccountSnapshot } from "@clearhead/shared"
import { authClient, hasAccountBackend } from "~/auth/auth-client"

const CACHE_KEY = "clearheadAccountCache"
const CACHE_TTL = 15 * 60_000

export type ExtensionAccount =
  | { status: "signed-out"; entitlement: ReturnType<typeof localFreeEntitlement>; backendAvailable: boolean }
  | { status: "connected"; snapshot: AccountSnapshot; entitlement: AccountSnapshot["entitlement"]; cached: boolean }

type Cache = { snapshot: AccountSnapshot; fetchedAt: number }

async function cachedAccount(): Promise<Cache | null> {
  const result = await chrome.storage.session.get(CACHE_KEY)
  const value = result[CACHE_KEY] as Cache | undefined
  return value && Date.now() - value.fetchedAt <= CACHE_TTL && isAccountSnapshot(value.snapshot) ? value : null
}

export async function getExtensionAccount(force = false): Promise<ExtensionAccount> {
  const cached = await cachedAccount()
  if (!force && cached) return { status: "connected", snapshot: cached.snapshot, entitlement: cached.snapshot.entitlement, cached: true }
  if (!hasAccountBackend) return { status: "signed-out", entitlement: localFreeEntitlement(), backendAvailable: false }
  try {
    const session = await authClient.getSession()
    if (!session.data) { await chrome.storage.session.remove(CACHE_KEY); return { status: "signed-out", entitlement: localFreeEntitlement(), backendAvailable: true } }
    const response = await fetch(`${process.env.PLASMO_PUBLIC_API_URL}/api/extension/entitlements`, { credentials: "include", headers: { Accept: "application/json" } })
    if (!response.ok) throw new Error("Account status could not be refreshed.")
    const parsed = parseAccountSnapshot(await response.json())
    await chrome.storage.session.set({ [CACHE_KEY]: { snapshot: parsed, fetchedAt: Date.now() } satisfies Cache })
    return { status: "connected", snapshot: parsed, entitlement: parsed.entitlement, cached: false }
  } catch {
    if (cached) return { status: "connected", snapshot: cached.snapshot, entitlement: cached.snapshot.entitlement, cached: true }
    return { status: "signed-out", entitlement: localFreeEntitlement(), backendAvailable: true }
  }
}

export const webUrl = (path: string) => `${process.env.PLASMO_PUBLIC_WEB_URL ?? "http://localhost:3000"}${path}`
export const openWeb = (path: string) => chrome.tabs.create({ url: webUrl(path) })
export async function disconnectAccount() { await authClient.signOut(); await chrome.storage.session.remove(CACHE_KEY) }
