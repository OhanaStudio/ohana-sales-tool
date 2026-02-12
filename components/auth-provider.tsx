"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface AuthContextValue {
  authenticated: boolean
  username: string | null
  login: (password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  authenticated: false,
  username: null,
  login: async () => false,
  logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hasHint = typeof document !== "undefined" && document.cookie.includes("ohana-auth-hint=1")
  const [authenticated, setAuthenticated] = useState(hasHint)
  const [username, setUsername] = useState<string | null>(null)
  const [checked, setChecked] = useState(hasHint)

  useEffect(() => {
    fetch("/api/auth", { credentials: "same-origin" })
      .then((res) => {
        if (res.ok) return res.json()
        else if (!hasHint) setAuthenticated(false)
        throw new Error("Not authenticated")
      })
      .then((data) => {
        setAuthenticated(true)
        setUsername(data.username || "Ollie Brown")
      })
      .catch(() => {})
      .finally(() => setChecked(true))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      setUsername(data.username || "Ollie Brown")
      return true
    }
    return false
  }

  const logout = async () => {
    document.cookie = "ohana-auth-hint=1; path=/; max-age=0"
    await fetch("/api/auth", { method: "DELETE", credentials: "same-origin" })
    setAuthenticated(false)
    setUsername(null)
  }

  if (!checked) return null

  return (
    <AuthContext.Provider value={{ authenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
