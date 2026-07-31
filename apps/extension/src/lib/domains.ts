export type BlockTarget = { domain: string; path: string | null }

export function normaliseDomain(input: string): string | null {
  let value = input.trim().toLowerCase()
  if (!value) return null

  try {
    if (!/^https?:\/\//.test(value)) value = `https://${value}`
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, "").replace(/\.$/, "")
    const invalidHost = !host || host === "localhost" || !host.includes(".") || !/^[a-z0-9.-]+$/.test(host) || host.split(".").some((part) => !part || part.startsWith("-") || part.endsWith("-"))
    if (invalidHost || url.username || url.password || url.port) return null

    const normalizedPath = url.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "")
    return normalizedPath && normalizedPath !== "/" ? `${host}${normalizedPath}` : host
  } catch {
    return null
  }
}

export function splitBlockTarget(target: string): BlockTarget {
  const slashIndex = target.indexOf("/")
  if (slashIndex < 0) return { domain: target, path: null }
  return { domain: target.slice(0, slashIndex), path: target.slice(slashIndex) }
}

export function blockTargetRegex(target: string): string | null {
  const { domain, path } = splitBlockTarget(target)
  if (!path) return null
  const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return `^https?://([^./]+\\.)*${escapedDomain}${escapedPath}(?:[/?#]|$)`
}

export function urlMatchesBlockTarget(url: string, target: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false
    const { domain, path } = splitBlockTarget(target)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "")
    if (host !== domain && !host.endsWith(`.${domain}`)) return false
    if (!path) return true
    const pathname = parsed.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/"
    return pathname === path || pathname.startsWith(`${path}/`)
  } catch {
    return false
  }
}

export function isRestorableUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "file:"
  } catch {
    return false
  }
}

export function isEligibleTabUrl(url?: string): boolean {
  if (!url) return false
  const extensionOrigin = typeof chrome !== "undefined" && chrome.runtime?.getURL ? chrome.runtime.getURL("") : "chrome-extension://"
  return isRestorableUrl(url) && !url.startsWith(extensionOrigin)
}
