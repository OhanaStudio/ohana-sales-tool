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
  const [authenticated, setAuthenticated] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem("ohana-auth")
    if (token === "true") {
      setAuthenticated(true)
    }
    setChecked(true)
  }, [])

  const login = async (password: string): Promise<boolean> => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAuthenticated(true)
      sessionStorage.setItem("ohana-auth", "true")
      return true
    }
    return false
  }

  const logout = () => {
    setAuthenticated(false)
    sessionStorage.removeItem("ohana-auth")
  }

  if (!checked) return null

  return (
    <AuthContext.Provider value={{ authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
