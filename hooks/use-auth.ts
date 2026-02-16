import { useEffect, useState, useCallback } from "react"

interface AuthUser {
  username: string
  name: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setUser({ username: data.username, name: data.name })
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (username: string, password: string) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    })

    if (res.ok) {
      const data = await res.json()
      setUser({ username: data.username, name: data.name })
      return true
    }
    return false
  }

  const logout = async () => {
    const res = await fetch("/api/auth", { method: "DELETE", credentials: "include" })
    if (res.ok) {
      setUser(null)
      // Force a refetch to ensure other components see the logout
      await checkAuth()
    }
  }

  return { user, loading, login, logout }
}

