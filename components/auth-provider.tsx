"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface AuthContextValue {
  authenticated: boolean
  email: string | null
  name: string | null
  login: (password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  authenticated: false,
  email: null,
  name: null,
  login: async () => false,
  logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Read the hint cookie on first render to set initial state
  const hasHint = typeof document !== "undefined" && document.cookie.includes("ohana-auth-hint=1")
  
  const [authenticated, setAuthenticated] = useState(hasHint)
  const [email, setEmail] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)

  // Fetch auth status on mount
  useEffect(() => {
    fetch("/api/auth", { credentials: "same-origin" })
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error("Not authenticated")
      })
      .then((data) => {
        setAuthenticated(true)
        setEmail(data.email || "ollie@ohana.studio")
        setName(data.name || "Ollie Brown")
      })
      .catch(() => {
        setAuthenticated(false)
      })
  }, [])

  const login = async (password: string): Promise<boolean> => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      credentials: "same-origin",
    })
    if (res.ok) {
      const data = await res.json()
      document.cookie = "ohana-auth-hint=1; path=/; max-age=" + 60 * 60 * 24 * 7
      setAuthenticated(true)
      setEmail(data.email || "ollie@ohana.studio")
      setName(data.name || "Ollie Brown")
      return true
    }
    return false
  }

  const logout = async () => {
    document.cookie = "ohana-auth-hint=1; path=/; max-age=0"
    await fetch("/api/auth", { method: "DELETE", credentials: "same-origin" })
    setAuthenticated(false)
    setEmail(null)
    setName(null)
  }

  return (
    <AuthContext.Provider value={{ authenticated, email, name, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
