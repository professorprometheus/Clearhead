"use client"

import { CreditCard, Loader2, LogOut, Trash2 } from "lucide-react"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"

export function SignOutButton() {
  return <button className="web-button-secondary w-full justify-start" onClick={async () => { await authClient.signOut(); location.href = "/" }}><LogOut className="size-4"/>Sign out</button>
}

export function DeleteAccountButton() {
  const [busy,setBusy]=useState(false),[error,setError]=useState("")
  return <div><button className="inline-flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300" disabled={busy} onClick={async()=>{
    if(!confirm("Permanently delete your Clearhead account? Export your local research first.")) return
    setBusy(true)
    const result=await authClient.deleteUser({callbackURL:"/"})
    if(result.error){setError(result.error.message??"The account could not be deleted.");setBusy(false)}
  }}>{busy?<Loader2 className="size-4 animate-spin"/>:<Trash2 className="size-4"/>}Delete account</button>{error&&<p className="mt-2 text-xs text-red-400">{error}</p>}</div>
}

export function BillingActions({subscriptionId,cancelAtPeriodEnd}:{subscriptionId?:string;cancelAtPeriodEnd?:boolean}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState("")
  async function run(action:"portal"|"cancel"|"restore") {
    setBusy(true); setError("")
    const result=action==="portal"
      ? await authClient.subscription.billingPortal({returnUrl:"/account/billing",disableRedirect:false})
      : action==="cancel"
        ? await authClient.subscription.cancel({subscriptionId,returnUrl:"/account/billing"})
        : await authClient.subscription.restore({subscriptionId})
    if(result.error){setError(result.error.message??"Billing could not be updated.");setBusy(false)}
    else if(action==="restore") location.reload()
  }
  return <div className="space-y-3"><button className="web-button w-full sm:w-auto" disabled={busy} onClick={()=>run("portal")}><CreditCard className="size-4"/>Manage billing</button>{subscriptionId&&(cancelAtPeriodEnd?<button className="web-button-secondary ml-0 w-full sm:ml-3 sm:w-auto" disabled={busy} onClick={()=>run("restore")}>Resume subscription</button>:<button className="ml-0 text-sm text-red-400 sm:ml-5" disabled={busy} onClick={()=>run("cancel")}>Cancel subscription</button>)}{error&&<p className="text-sm text-red-300">{error}</p>}</div>
}
