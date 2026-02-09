"use client"

import type { ScreenshotData } from "@/lib/types"
import { Monitor, Smartphone } from "lucide-react"

interface SiteScreenshotsProps {
  url: string
  desktopScreenshot?: ScreenshotData
  mobileScreenshot?: ScreenshotData
}

export function SiteScreenshots({
  url,
  desktopScreenshot,
  mobileScreenshot,
}: SiteScreenshotsProps) {
  if (!desktopScreenshot && !mobileScreenshot) return null

  const hostname = (() => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  })()

  return (
    <div>
      <h3 className="font-sans text-xl text-foreground mb-2">
        Site preview
      </h3>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Desktop screenshot */}
        {desktopScreenshot && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Desktop
              </span>
            </div>
            <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-muted/30">
                <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
              </div>
              <img
                src={desktopScreenshot.data || "/placeholder.svg"}
                alt={`Desktop screenshot of ${hostname}`}
                className="w-full h-auto"
                width={desktopScreenshot.width}
                height={desktopScreenshot.height}
              />
            </div>
          </div>
        )}

        {/* Mobile screenshot */}
        {mobileScreenshot && (
          <div className="flex-shrink-0 w-full md:w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Mobile
              </span>
            </div>
            <div className="rounded-2xl border-2 border-border bg-card overflow-hidden shadow-sm mx-auto md:mx-0 max-w-[200px]">
              <div className="flex justify-center py-1.5">
                <span className="w-16 h-1 rounded-full bg-muted-foreground/15" />
              </div>
              <img
                src={mobileScreenshot.data || "/placeholder.svg"}
                alt={`Mobile screenshot of ${hostname}`}
                className="w-full h-auto"
                width={mobileScreenshot.width}
                height={mobileScreenshot.height}
              />
              <div className="flex justify-center py-2">
                <span className="w-8 h-8 rounded-full border border-muted-foreground/15" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
