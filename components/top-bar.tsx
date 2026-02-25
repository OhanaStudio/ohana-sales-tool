"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import { LogOut, History, Plus, Calculator, Menu, X } from "lucide-react"

export function TopBar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await logout()
    window.location.href = "/"
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <header className="flex items-center justify-between px-5 py-4 md:px-8 md:py-5 no-print bg-black border-b border-zinc-800">
      <a href="/" className="flex items-center min-h-[44px]">
        <Image src="/ohaha-logo.svg" alt="Ohana" width={85} height={44} className="h-8 w-auto brightness-0 invert" />
      </a>

      <div className="relative" ref={menuRef}>
        {/* Burger button */}
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          className="flex items-center gap-2.5 min-h-[44px] px-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Open menu"
          aria-expanded={open}
        >
          {user?.name && (
            <span className="text-sm font-sans text-white">{user.name}</span>
          )}
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50">
            <a
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Plus className="h-4 w-4 shrink-0" />
              New report
            </a>
            <a
              href="/roi-calculator"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Calculator className="h-4 w-4 shrink-0" />
              ROI Calculator
            </a>
            <a
              href="/history"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <History className="h-4 w-4 shrink-0" />
              History
            </a>
            <div className="border-t border-zinc-800" />
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
