import React from "react"
import type { Metadata, Viewport } from "next"
import { AuthProvider } from "@/components/auth-provider"
import { LoginGate } from "@/components/login-gate"

import "./globals.css"

export const metadata: Metadata = {
  title: "Ohana Website Health Check",
  description:
    "A high-level website diagnostic using Lighthouse data and simple UX indicators.",
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F2EEE6",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/igp4zgi.css" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          <LoginGate>{children}</LoginGate>
        </AuthProvider>
      </body>
    </html>
  )
}
