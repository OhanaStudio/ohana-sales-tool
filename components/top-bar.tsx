"use client"


import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import { LogOut, History, Plus } from "lucide-react"

export function TopBar() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    // Force page reload to show login screen
    window.location.href = "/"
  }

  return (
    <header className="flex items-center justify-between px-5 py-4 md:px-8 md:py-5 no-print bg-black border-b border-zinc-800">
      <a href="/" className="block min-h-[44px] flex items-center">
        <Image src="/ohaha-logo.svg" alt="Ohana" width={85} height={44} className="h-8 w-auto brightness-0 invert" />
      </a>
      <div className="flex items-center gap-4">
        {user?.name && (
          <div className="text-sm font-sans text-white">
            {user.name}
          </div>
        )}
        <a 
          href="/" 
          className="text-zinc-400 hover:text-white transition-colors flex items-center min-h-[44px] px-2"
          aria-label="Run new report"
        >
          <Plus className="h-5 w-5" />
        </a>
        <a 
          href="/history" 
          className="text-zinc-400 hover:text-white transition-colors flex items-center min-h-[44px] px-2"
          aria-label="View history"
        >
          <History className="h-5 w-5" />
        </a>
        <button
          type="button"
          onClick={handleLogout}
          className="text-zinc-400 hover:text-white transition-colors flex items-center min-h-[44px] px-2"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
