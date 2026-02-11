"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface AuthContextValue {
  authenticated: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  authenticated: false,
  login: async () => false,
  logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Optimistic hydration: check the client-readable hint cookie first so we
  // never flash a login screen when navigating between pages on mobile.
  const hasHint = typeof document !== "undefined" && document.cookie.includes("ohana-auth-hint=1")
  const [authenticated, setAuthenticated] = useState(hasHint)
  const [checked, setChecked] = useState(hasHint)

  useEffect(() => {
    // Verify against the httpOnly cookie via the server.
    // If the hint cookie already authenticated us, only upgrade — never downgrade
    // (avoids a race condition on slow mobile connections where the page briefly
    // renders then gets replaced by the login screen).
    fetch("/api/auth", { credentials: "same-origin" })
      .then((res) => {
        if (res.ok) setAuthenticated(true)
        else if (!hasHint) setAuthenticated(false)
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
      // Set a client-readable hint cookie (not httpOnly) so future page loads
      // can hydrate as authenticated immediately without waiting for the API.
      document.cookie = "ohana-auth-hint=1; path=/; max-age=" + 60 * 60 * 24 * 7
      setAuthenticated(true)
      return true
    }
    return false
  }

  const logout = async () => {
    document.cookie = "ohana-auth-hint=1; path=/; max-age=0"
    await fetch("/api/auth", { method: "DELETE", credentials: "same-origin" })
    setAuthenticated(false)
  }

  if (!checked) return null

  return (
    <AuthContext.Provider value={{ authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
