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
        const text = await res.text()
        if (!text) {
          console.log("[v0] useAuth: Empty response body, skipping")
          setUser(null)
          return
        }
        let data: { username?: string; name?: string }
        try {
          data = JSON.parse(text)
        } catch {
          console.log("[v0] useAuth: Invalid JSON response, skipping")
          setUser(null)
          return
        }
        console.log("[v0] useAuth: Received data:", data)
        // Store in localStorage as backup
        if (typeof window !== "undefined" && data.name) {
          localStorage.setItem("auth_user_name", data.name)
          localStorage.setItem("auth_username", data.username ?? "")
        }
        setUser({ username: data.username ?? "", name: data.name ?? "" })
        console.log("[v0] useAuth: Set user to:", { username: data.username, name: data.name })
      } else {
        console.log("[v0] useAuth: Response not ok, checking localStorage")
        // Fallback to localStorage if API fails
        if (typeof window !== "undefined") {
          const storedName = localStorage.getItem("auth_user_name")
          const storedUsername = localStorage.getItem("auth_username")
          if (storedName && storedUsername) {
            console.log("[v0] useAuth: Using localStorage fallback:", storedName)
            setUser({ username: storedUsername, name: storedName })
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
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

