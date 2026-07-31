import { Suspense } from "react"
import { AuthShell } from "@/components/AuthShell"
import { VerifyEmailCard } from "@/components/VerifyEmailCard"
export default function VerifyEmailPage(){return <AuthShell title="Check your inbox" copy="One quick step keeps your account secure."><Suspense fallback={<p>Loading…</p>}><VerifyEmailCard/></Suspense></AuthShell>}
