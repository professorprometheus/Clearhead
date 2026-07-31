"use client"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"

export function VerifyEmailCard(){const query=useSearchParams(),email=query.get("email"),[message,setMessage]=useState("");async function resend(){if(!email){setMessage("Return to sign in and enter your email address.");return}const result=await authClient.sendVerificationEmail({email,callbackURL:"/account"});setMessage(result.error?result.error.message??"The email could not be sent.":"A new verification email is on its way.")}return <div className="space-y-4 text-center"><p className="text-sm leading-6 text-slate-600">Open the secure link we sent{email?<> to <strong className="text-slate-900">{email}</strong></>:" to your email"}. You can close this page afterwards.</p>{message&&<p role="status" className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-700">{message}</p>}<button className="web-button-secondary w-full" onClick={resend}>Send another email</button><a className="block text-sm font-semibold text-indigo-600" href="/sign-in">Back to sign in</a></div>}
