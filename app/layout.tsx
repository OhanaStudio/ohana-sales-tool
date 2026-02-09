import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, DM_Serif_Display } from 'next/font/google'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dm-serif',
})

export const metadata: Metadata = {
  title: 'Ohana Website Health Check',
  description: 'A high-level website diagnostic using Lighthouse data and simple UX indicators.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#F2EEE6',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable} bg-background`}>
      <body className="font-sans antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}
