"use client"

import { Loader2 } from "lucide-react"
import Link from "next/link"
import { FormEvent, useState } from "react"
import { authClient } from "@/lib/auth-client"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const signup = mode === "sign-up"
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("")
    const data = new FormData(event.currentTarget)
    const email = String(data.get("email") ?? "").trim()
    const password = String(data.get("password") ?? "")
    if (signup) {
      const confirm = String(data.get("confirm") ?? "")
      if (password.length < 8 || !/[a-z]/i.test(password) || !/\d/.test(password)) { setMessage("Use at least 8 characters with a letter and a number."); return }
      if (password !== confirm) { setMessage("Passwords do not match."); return }
    }
    setBusy(true)
    if (signup) {
      const result = await authClient.signUp.email({ name: String(data.get("name") ?? "").trim(), email, password, callbackURL: "/verify-email" })
      setBusy(false)
      if (result.error) setMessage(result.error.message ?? "Your account could not be created.")
      else location.href = `/verify-email?email=${encodeURIComponent(email)}`
    } else {
      const result = await authClient.signIn.email({ email, password, callbackURL: "/account" })
      setBusy(false)
      if (result.error) setMessage(result.error.status === 403 ? "Verify your email before signing in. We can send a fresh link." : result.error.message ?? "Sign in failed.")
      else location.href = "/account"
    }
  }

  async function google() {
    setBusy(true); setMessage("")
    const result = await authClient.signIn.social({ provider: "google", callbackURL: "/account" })
    if (result.error) { setMessage(result.error.message ?? "Google sign in failed."); setBusy(false) }
  }

  return <div className="space-y-5"><button className="web-button-secondary w-full" disabled={busy} onClick={google}><span className="text-base font-bold text-slate-900">G</span> Continue with Google</button><div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-slate-400"><span className="h-px flex-1 bg-slate-200"/>or continue with email<span className="h-px flex-1 bg-slate-200"/></div><form className="space-y-4" onSubmit={submit}>{signup&&<Field label="Name" name="name" autoComplete="name"/>}<Field label="Email" name="email" type="email" autoComplete="email"/><Field label="Password" name="password" type="password" autoComplete={signup?"new-password":"current-password"}/>{signup&&<><Field label="Confirm password" name="confirm" type="password" autoComplete="new-password"/><p className="text-xs leading-5 text-slate-500">Use at least 8 characters, including a letter and a number.</p></>}{!signup&&<div className="text-right"><Link href="/forgot-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">Forgot password?</Link></div>}{message&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</p>}<button className="web-button w-full" disabled={busy}>{busy?<Loader2 className="size-4 animate-spin"/>:signup?"Create my account":"Sign in"}</button></form><p className="text-center text-sm text-slate-500">{signup?"Already have Clearhead?":"New to Clearhead?"} <Link className="font-semibold text-indigo-600 hover:text-indigo-500" href={signup?"/sign-in":"/sign-up"}>{signup?"Sign in":"Start free"}</Link></p></div>
}

function Field({label,name,type="text",autoComplete}:{label:string;name:string;type?:string;autoComplete:string}){return <label className="grid gap-2 text-sm font-medium text-slate-700">{label}<input className="web-input" required name={name} type={type} autoComplete={autoComplete}/></label>}
