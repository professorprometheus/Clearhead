import { createAuthClient } from "better-auth/client"

const apiUrl = process.env.PLASMO_PUBLIC_API_URL

export const authClient = createAuthClient({ baseURL: apiUrl ?? "http://127.0.0.1:3000" })
export const hasAccountBackend = !!apiUrl
