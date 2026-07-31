import { useCallback, useEffect, useState } from "react"
import { send } from "~/types/messages"
import type { ClearheadState } from "~/types/state"

export function applyTheme(theme: ClearheadState["settings"]["theme"]) { const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches); document.body.dataset.theme = dark ? "dark" : "light"; document.documentElement.classList.toggle("dark", dark) }
export function useClearhead() {
  const [state, setState] = useState<ClearheadState | null>(null); const [error, setError] = useState("")
  const refresh = useCallback(async () => { const r = await send<ClearheadState>({ type: "GET_STATE" }); if (r.ok) { setState(r.data); applyTheme(r.data.settings.theme) } else setError(r.error) }, [])
  useEffect(() => { void refresh(); const listener = () => void refresh(); chrome.storage.onChanged.addListener(listener); const timer = setInterval(refresh, 1000); return () => { chrome.storage.onChanged.removeListener(listener); clearInterval(timer) } }, [refresh])
  return { state, setState, error, setError, refresh }
}
