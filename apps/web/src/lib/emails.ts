import { Resend } from "resend"

type EmailKind = "verify" | "reset" | "welcome" | "trial-7" | "trial-3" | "trial-1" | "trial-ended" | "subscription-confirmed" | "subscription-cancelled" | "payment-failed"

const content: Record<EmailKind, { subject: string; heading: string; copy: string; action?: string }> = {
  verify: { subject: "Finish setting up Clearhead", heading: "One last step", copy: "Verify your email to secure your account and keep your work connected.", action: "Verify my email" },
  reset: { subject: "Reset your Clearhead password", heading: "Reset your password", copy: "Use this secure link to choose a new password. If you did not request this, you can ignore this email.", action: "Reset password" },
  welcome: { subject: "Your Clearhead Pro trial is ready", heading: "Make room for what matters", copy: "Every Pro feature is yours for 30 days. No card is required, and the research you save remains yours on every plan.", action: "Open Clearhead" },
  "trial-7": { subject: "7 days left in your Clearhead Pro trial", heading: "A week of Pro remains", copy: "Your trial will move to Free automatically. Upgrade only if the unlimited workflow is earning its place.", action: "View plans" },
  "trial-3": { subject: "3 days left in your Clearhead Pro trial", heading: "Three focused days remain", copy: "Your saved research stays safe on Free. Upgrade to keep unlimited workspaces, history and sync.", action: "View plans" },
  "trial-1": { subject: "Your Clearhead Pro trial ends tomorrow", heading: "One day remains", copy: "Tomorrow your account moves to Free unless you choose Pro. Nothing is deleted.", action: "Choose a plan" },
  "trial-ended": { subject: "Your Clearhead account is now on Free", heading: "Your research is still safe", copy: "Your trial has ended and Clearhead has moved to Free. You can still view, restore, export and delete everything.", action: "Review your account" },
  "subscription-confirmed": { subject: "Clearhead Pro is active", heading: "Welcome to Pro", copy: "Your subscription is active. Thanks for investing in a calmer, more deliberate browser.", action: "Open account" },
  "subscription-cancelled": { subject: "Your Clearhead subscription update", heading: "Cancellation confirmed", copy: "Your billing change is confirmed. Your research remains safe and available throughout.", action: "Manage billing" },
  "payment-failed": { subject: "Action needed for your Clearhead subscription", heading: "Payment could not be completed", copy: "Please update your payment method to keep Pro active without interruption.", action: "Manage billing" }
}

function escapeHtml(value: string) { return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]!) }

export async function sendClearheadEmail(input: { to: string; kind: EmailKind; url?: string; name?: string }) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!key || !from) throw new Error("Resend is not configured.")
  const item = content[input.kind]
  const greeting = input.name ? `Hi ${escapeHtml(input.name)},` : "Hello,"
  const button = input.url && item.action ? `<a href="${escapeHtml(input.url)}" style="display:inline-block;margin-top:24px;padding:12px 20px;border-radius:10px;background:#4f46e5;color:#fff;text-decoration:none;font-weight:700">${item.action}</a>` : ""
  const html = `<div style="background:#f8fafc;padding:40px 18px;font-family:Inter,Arial,sans-serif;color:#0f172a"><div style="max-width:560px;margin:auto"><div style="font-size:20px;font-weight:800;color:#0f172a">◉ Clearhead</div><div style="margin-top:24px;padding:32px;border:1px solid #e2e8f0;border-radius:20px;background:#ffffff;box-shadow:0 16px 40px rgba(15,23,42,.07)"><p style="color:#64748b">${greeting}</p><h1 style="font-size:26px;color:#0f172a">${item.heading}</h1><p style="font-size:16px;line-height:1.7;color:#475569">${item.copy}</p>${button}</div><p style="margin-top:20px;font-size:12px;color:#94a3b8">Clearhead · Turn open tabs into finished work.</p></div></div>`
  const text = `${input.name ? `Hi ${input.name}` : "Hello"},\n\n${item.heading}\n\n${item.copy}${input.url ? `\n\n${input.url}` : ""}\n\nClearhead`
  const resend = new Resend(key)
  const result = await resend.emails.send({ from, to: input.to, subject: item.subject, html, text })
  if (result.error) throw new Error(result.error.message)
  return result.data
}
