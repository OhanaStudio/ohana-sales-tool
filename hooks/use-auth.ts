import { useEffect, useState, useCallback } from "react"

interface AuthUser {
  username: string
  name: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    console.log("[v0] useAuth: Starting auth check")
    try {
      const res = await fetch("/api/auth", { credentials: "include" })
      console.log("[v0] useAuth: Response status:", res.status, "ok:", res.ok)
      
      if (res.ok) {
        const data = await res.json()
        console.log("[v0] useAuth: Received data:", data)
        setUser({ username: data.username, name: data.name })
        console.log("[v0] useAuth: Set user to:", { username: data.username, name: data.name })
      } else {
        console.log("[v0] useAuth: Response not ok, setting user to null")
        setUser(null)
      }
    } catch (error) {
      console.error("[v0] useAuth: Error during auth check:", error)
      setUser(null)
    } finally {
      console.log("[v0] useAuth: Setting loading to false")
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

