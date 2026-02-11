"use client"

import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { LogOut } from "lucide-react"

export function TopBar() {
  const { logout } = useAuth()

  return (
    <header className="flex items-center justify-between px-5 py-4 md:px-8 md:py-5 no-print">
      <Link href="/" className="block">
        <Image src="/ohaha-logo.svg" alt="Ohana" width={85} height={44} className="h-8 w-auto" />
      </Link>
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={logout}
          className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </header>
  )
}
