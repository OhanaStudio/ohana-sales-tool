"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Loader2, Check } from "lucide-react"

const steps = [
  "Fetching metrics",
  "Analysing",
  "Building report",
]

export function LoadingSteps({ onCancel }: { onCancel?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1
        return prev
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="flex items-center justify-center gap-6">
        {steps.map((step, i) => (
          <div
            key={step}
            className={cn(
              "flex items-center gap-2 transition-opacity duration-500",
              i <= currentStep ? "opacity-100" : "opacity-40"
            )}
          >
            {i < currentStep ? (
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : i === currentStep ? (
              <Loader2 className="h-4 w-4 animate-spin text-foreground shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-border shrink-0" />
            )}
            <span className="text-sm text-foreground">{step}</span>
          </div>
        ))}
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-[#C53030] hover:text-[#9B2C2C] transition-colors bg-transparent"
        >
          Stop check
        </button>
      )}
    </div>
  )
}
