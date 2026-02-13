"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type AuthStatus = "checking" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  status: AuthStatus
  authenticated: boolean
  email: string | null
  name: string | null
  login: (password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  status: "checking",
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
  const [status, setStatus] = useState<AuthStatus>("checking")
  const [email, setEmail] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/auth", { credentials: "same-origin" })
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error("Not authenticated")
      })
      .then((data) => {
        setStatus("authenticated")
        setEmail(data.email || "ollie@ohana.studio")
        setName(data.name || "Ollie Brown")
      })
      .catch(() => {
        setStatus("unauthenticated")
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
      setStatus("authenticated")
      setEmail(data.email || "ollie@ohana.studio")
      setName(data.name || "Ollie Brown")
      return true
    }
    return false
  }

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE", credentials: "same-origin" })
    setStatus("unauthenticated")
    setEmail(null)
    setName(null)
  }

  return (
    <AuthContext.Provider value={{ status, authenticated: status === "authenticated", email, name, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
