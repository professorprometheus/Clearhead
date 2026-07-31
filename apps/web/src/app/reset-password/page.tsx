import { Suspense } from "react"
import { AuthShell } from "@/components/AuthShell"
import { ResetPasswordForm } from "@/components/ResetPasswordForm"
export default function ResetPasswordPage(){return <AuthShell title="Choose a new password" copy="Use a strong password you don’t reuse elsewhere."><Suspense fallback={<p className="text-sm text-zinc-500">Loading secure form…</p>}><ResetPasswordForm/></Suspense></AuthShell>}
