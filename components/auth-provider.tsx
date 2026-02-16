"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface AuthContextValue {
  username: string | null
  name: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  username: null,
  name: null,
  login: async () => false,
  logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Check auth status on mount
    fetch("/api/auth", { credentials: "same-origin" })
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error("Not authenticated")
      })
      .then((data) => {
        setUsername(data.username)
        setName(data.name)
      })
      .catch(() => {
        setUsername(null)
        setName(null)
      })
      .finally(() => setIsInitialized(true))
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "same-origin",
    })
    if (res.ok) {
      const data = await res.json()
      setUsername(data.username)
      setName(data.name)
      return true
    }
    return false
  }

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE", credentials: "same-origin" })
    setUsername(null)
    setName(null)
  }

  // Provide a temporary context while initializing to prevent hydration mismatch
  return (
    <AuthContext.Provider value={{ username, name, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

