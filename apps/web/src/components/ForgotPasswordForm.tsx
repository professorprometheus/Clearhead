"use client"
import { FormEvent, useState } from "react"
import { authClient } from "@/lib/auth-client"

export function ForgotPasswordForm(){const [message,setMessage]=useState("");async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const email=String(new FormData(event.currentTarget).get("email")??"");await authClient.requestPasswordReset({email,redirectTo:"/reset-password"});setMessage("If an account exists for this email, reset instructions are on their way.")}return <form className="space-y-4" onSubmit={submit}><label className="grid gap-2 text-sm font-medium text-slate-700">Email<input className="web-input" required type="email" name="email" autoComplete="email"/></label>{message&&<p role="status" className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-700">{message}</p>}<button className="web-button w-full">Send reset link</button></form>}
