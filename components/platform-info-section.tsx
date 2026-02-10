import React from "react"
import type { PlatformInfo } from "@/lib/types"
import { Globe, HelpCircle } from "lucide-react"
import Image from "next/image"

/* Platforms with dedicated SVG icon files in /public/icons/ — maps platform name to filename */
const SVG_ICON_MAP: Record<string, string> = {
  WordPress: "wordpress",
  Shopify: "shopify",
  Squarespace: "squarespace",
  Webflow: "webflow",
  Wix: "wix",
  Sitecore: "sitecore",
  "Adobe AEM": "adobe aem",
  Contentful: "contentful",
  Prismic: "prismic",
  DatoCMS: "datocms",
  "Craft CMS": "craftcms",
}

function SvgIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      {children}
    </svg>
  )
}

const platformIcons: Record<string, React.ReactNode> = {
  HubSpot: (
    <SvgIcon>
      <path d="M16.8 9.677V7.05a2.16 2.16 0 0 0 1.247-1.947v-.065a2.16 2.16 0 0 0-2.159-2.158h-.064a2.16 2.16 0 0 0-2.16 2.158v.065c0 .846.49 1.576 1.2 1.928v2.648a4.673 4.673 0 0 0-2.135 1.123l-5.657-4.398a2.363 2.363 0 0 0 .072-.562A2.346 2.346 0 1 0 4.8 8.19l5.498 4.278a4.706 4.706 0 0 0-.076.804c0 .324.034.64.098.946l-1.946.993A1.8 1.8 0 0 0 7.02 14.4a1.8 1.8 0 1 0 1.015 3.285l2.065-1.054a4.722 4.722 0 0 0 5.76-.576 4.717 4.717 0 0 0-.078-6.709A4.692 4.692 0 0 0 16.8 9.677Zm-1.003 6.656a2.422 2.422 0 0 1-1.718.71 2.434 2.434 0 0 1-2.427-2.427 2.435 2.435 0 0 1 2.427-2.427 2.434 2.434 0 0 1 2.427 2.427 2.42 2.42 0 0 1-.71 1.717Z" />
    </SvgIcon>
  ),
  Drupal: (
    <SvgIcon>
      <path d="M12 2C9.4 5 7.2 5.5 5 7.2c-3 2.3-3.5 6.6-1.2 9.6A7.08 7.08 0 0 0 12 20.5a7.08 7.08 0 0 0 8.2-3.7c2.3-3 1.8-7.3-1.2-9.6C17 5.5 14.6 5 12 2Zm4.5 14.7c-.2.2-.4.2-.6.1-.2-.2-.2-.4-.1-.6.8-1 .5-2.4-.5-3.2-.2-.2-.2-.4-.1-.6.2-.2.4-.2.6-.1 1.3 1.1 1.6 3 .7 4.4Zm-7.1 1.6c-.7.2-1.4-.2-1.6-.9-.2-.7.2-1.4.9-1.6.7-.2 1.4.2 1.6.9.2.7-.2 1.4-.9 1.6Z" />
    </SvgIcon>
  ),
  Framer: (
    <SvgIcon>
      <path d="M5 2h14v7h-7l7 7H5v-7h7L5 2Zm0 14h7v7L5 16Z" />
    </SvgIcon>
  ),
  "Next.js": (
    <SvgIcon>
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm4.97 14.47L9.5 7.3V16h1.2V9.38l6.13 7.57a8.477 8.477 0 0 1-.86.52ZM14.4 16V9.6h1.2V16h-1.2Z" />
    </SvgIcon>
  ),
}

const confidenceLabel: Record<string, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
}

const confidenceStyle: Record<string, string> = {
  high: "bg-emerald-50 text-emerald-800",
  medium: "bg-amber-50 text-amber-800",
  low: "bg-muted text-muted-foreground",
}

export function PlatformInfoSection({ info }: { info: PlatformInfo }) {
  const platformName = info.platform ?? "Unknown"
  const svgFilename = info.platform ? SVG_ICON_MAP[info.platform] : undefined
  const inlineIcon = info.platform ? platformIcons[info.platform] : null

  const icon = svgFilename ? (
    <Image
      src={`/icons/${svgFilename}.svg`}
      alt={`${info.platform} logo`}
      width={22}
      height={22}
      className="dark:invert-0"
    />
  ) : inlineIcon ? (
    inlineIcon
  ) : info.platform ? (
    <Globe className="h-5 w-5" />
  ) : (
    <HelpCircle className="h-5 w-5" />
  )

  return (
    <div>
      <h3 className="font-sans text-2xl font-bold text-foreground mb-2">
        Platform detection
      </h3>
      <p className="text-sm text-muted-foreground italic mb-5">
        Detected from page source signatures.
      </p>

      <div className="border border-border bg-card p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-muted/50 text-foreground">
              {icon}
            </div>
            <div>
              <p className="text-lg font-bold text-card-foreground">
                {platformName}
              </p>
              {info.platform && (
                <p className="text-xs text-muted-foreground">
                  Detected platform / CMS
                </p>
              )}
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${confidenceStyle[info.confidence]}`}
          >
            {confidenceLabel[info.confidence]}
          </span>
        </div>
      </div>
    </div>
  )
}
