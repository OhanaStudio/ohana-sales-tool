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
      className="no-print inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 transition-colors border"
      style={{
        background: enabled ? "var(--card)" : "var(--muted)",
        color: enabled ? "var(--muted-foreground)" : "var(--muted-foreground)",
        borderColor: enabled ? "var(--border)" : "var(--border)",
        opacity: enabled ? 1 : 0.6,
      }}
      aria-label={enabled ? `Hide ${label} section` : `Show ${label} section`}
    >
      {enabled ? (
        <Eye className="h-3 w-3" />
      ) : (
        <EyeOff className="h-3 w-3" />
      )}
      {enabled ? "Included" : "Hidden"}
    </button>
  )
}
