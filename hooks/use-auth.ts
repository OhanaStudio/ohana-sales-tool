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
        const text = await res.text()
        if (!text) { setUser(null); return }
        let data: { username?: string; name?: string }
        try { data = JSON.parse(text) } catch { setUser(null); return }
        if (typeof window !== "undefined" && data.name) {
          localStorage.setItem("auth_user_name", data.name)
          localStorage.setItem("auth_username", data.username ?? "")
        }
        setUser({ username: data.username ?? "", name: data.name ?? "" })
      } else {
        // Fallback to localStorage if cookie lost (e.g. HMR)
        if (typeof window !== "undefined") {
          const storedName = localStorage.getItem("auth_user_name")
          const storedUsername = localStorage.getItem("auth_username")
          if (storedName && storedUsername) {
            setUser({ username: storedUsername, name: storedName })
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      }
    } catch {
      // Network error - try localStorage fallback
      if (typeof window !== "undefined") {
        const storedName = localStorage.getItem("auth_user_name")
        const storedUsername = localStorage.getItem("auth_username")
        if (storedName && storedUsername) {
          setUser({ username: storedUsername, name: storedName })
        } else {
          setUser(null)
        }
      }
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
      // Store in localStorage for reliable access
      if (typeof window !== "undefined" && data.name) {
        localStorage.setItem("auth_user_name", data.name)
        localStorage.setItem("auth_username", data.username)
      }
      setUser({ username: data.username, name: data.name })
      return true
    }
    return false
  }

  const logout = async () => {
    const res = await fetch("/api/auth", { method: "DELETE", credentials: "include" })
    if (res.ok) {
      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_user_name")
        localStorage.removeItem("auth_username")
      }
      setUser(null)
      // Force a refetch to ensure other components see the logout
      await checkAuth()
    }
  }

  return { user, loading, login, logout }
}

