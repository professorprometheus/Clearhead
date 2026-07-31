import { useCallback, useEffect, useState } from "react"
import { getExtensionAccount, type ExtensionAccount } from "~/lib/account"

export function useAccount() {
  const [account, setAccount] = useState<ExtensionAccount | null>(null)
  const refreshAccount = useCallback(async (force = false) => setAccount(await getExtensionAccount(force)), [])
  useEffect(() => { void refreshAccount() }, [refreshAccount])
  return { account, refreshAccount }
}
