"use client"

import { stripeClient } from "@better-auth/stripe/client"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [stripeClient({ subscription: true })]
})
