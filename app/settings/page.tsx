"use client"

import { TopBar } from "@/components/top-bar"
import { BenchmarksPanel } from "@/components/admin-benchmarks-panel"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-5xl mx-auto px-5 py-10 md:px-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Manage industry benchmark defaults used in the ROI calculator.
        </p>
        <BenchmarksPanel />
      </main>
    </div>
  )
}
