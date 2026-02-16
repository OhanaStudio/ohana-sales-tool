"use client"


import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import { LogOut } from "lucide-react"

export function TopBar() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    // Force page reload to show login screen
    window.location.href = "/"
  }

  return (
    <header className="flex items-center justify-between px-5 py-4 md:px-8 md:py-5 no-print">
      <a href="/" className="block min-h-[44px] flex items-center">
        <Image src="/ohaha-logo.svg" alt="Ohana" width={85} height={44} className="h-8 w-auto" />
      </a>
      <div className="flex items-center gap-4">
        {user?.name && (
          <div className="text-sm font-sans text-foreground">
            {user.name}
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 min-h-[44px] px-2 py-2"
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </header>
  )
}
