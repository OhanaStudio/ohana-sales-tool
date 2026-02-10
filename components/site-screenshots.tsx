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
      <div className="flex flex-col md:flex-row gap-6 md:items-stretch">
        {/* Desktop screenshot */}
        {desktopScreenshot && (
          <div className="flex-[3] min-w-0 flex flex-col">
            <div className="border border-border bg-card overflow-hidden shadow-sm flex flex-col flex-1">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-muted/30 shrink-0">
                <span className="w-2.5 h-2.5 bg-muted-foreground/20" />
                <span className="w-2.5 h-2.5 bg-muted-foreground/20" />
                <span className="w-2.5 h-2.5 bg-muted-foreground/20" />
              </div>
              <div className="flex-1 overflow-hidden">
                <img
                  src={desktopScreenshot.data || "/placeholder.svg"}
                  alt={`Desktop screenshot of ${hostname}`}
                  className="w-full h-full object-cover object-top"
                  width={desktopScreenshot.width}
                  height={desktopScreenshot.height}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile screenshot */}
        {mobileScreenshot && (
          <div className="flex-1 max-w-[220px] flex flex-col">
            <div className="border-2 border-border bg-card overflow-hidden shadow-sm flex flex-col flex-1">
              <div className="flex justify-center py-1.5 shrink-0">
                <span className="w-16 h-1 bg-muted-foreground/30" />
              </div>
              <div className="flex-1 overflow-hidden">
                <img
                  src={mobileScreenshot.data || "/placeholder.svg"}
                  alt={`Mobile screenshot of ${hostname}`}
                  className="w-full h-full object-cover object-top"
                  width={mobileScreenshot.width}
                  height={mobileScreenshot.height}
                />
              </div>
              <div className="flex justify-center py-2 shrink-0">
                <span className="w-8 h-8 border border-muted-foreground/30" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
