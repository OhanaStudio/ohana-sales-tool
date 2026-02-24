"use client"

import { useAuth } from "@/hooks/use-auth"
import { Lock, User } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, login, loading: authLoading } = useAuth()
  const [username, setUsername] = useState("ollie")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return
    setLoading(true)
    setError("")
    const ok = await login(username, password)
    if (!ok) setError("Invalid username or password")
    setLoading(false)
  }

  // Show loading spinner while auth status is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    )
  }

  if (user) {
    return <>{children}</>
  }

  // Show login form while loading or not authenticated
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image
            src="/ohaha-logo.svg"
            alt="Ohana"
            width={85}
            height={44}
            className="h-8 w-auto mx-auto mb-6"
          />
          <h1 className="font-serif text-2xl text-foreground mb-2">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError("")
              }}
              placeholder="Username"
              className="w-full rounded-lg border border-border bg-card text-foreground pl-11 pr-4 py-3.5 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 min-h-[48px]"
              disabled={loading}
              aria-label="Username"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError("")
              }}
              placeholder="Password"
              className="w-full rounded-lg border border-border bg-card text-foreground pl-11 pr-4 py-3.5 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 min-h-[48px]"
              disabled={loading}
              autoFocus
              aria-label="Password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="rounded-lg bg-foreground text-background px-6 py-3.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 min-h-[48px]"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  )
}
