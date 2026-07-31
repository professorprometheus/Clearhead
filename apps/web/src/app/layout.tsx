import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "Clearhead | Turn open tabs into finished work", template: "%s · Clearhead" },
  description: "Bring the right context forward, put distractions away and return to every project with your next step ready."
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
