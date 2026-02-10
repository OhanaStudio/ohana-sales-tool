"use client"

import { EyeOff, Eye } from "lucide-react"

interface SectionToggleProps {
  label: string
  enabled: boolean
  onToggle: () => void
}

export function SectionToggle({ label, enabled, onToggle }: SectionToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="no-print inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors bg-transparent"
      style={{
        color: enabled ? "var(--muted-foreground)" : "var(--muted-foreground)",
        opacity: enabled ? 1 : 0.4,
      }}
      aria-label={enabled ? `Hide ${label} section` : `Show ${label} section`}
    >
      {enabled ? (
        <Eye className="h-4 w-4" />
      ) : (
        <EyeOff className="h-4 w-4" />
      )}
    </button>
  )
}
