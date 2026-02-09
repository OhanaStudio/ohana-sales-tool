import React from "react"
import type { PlatformInfo } from "@/lib/types"
import {
  Globe,
  Code2,
  ShoppingBag,
  Paintbrush,
  Blocks,
  Server,
  HelpCircle,
} from "lucide-react"

const platformIcons: Record<string, React.ReactNode> = {
  WordPress: <Blocks className="h-5 w-5" />,
  Shopify: <ShoppingBag className="h-5 w-5" />,
  Wix: <Paintbrush className="h-5 w-5" />,
  Squarespace: <Paintbrush className="h-5 w-5" />,
  Webflow: <Paintbrush className="h-5 w-5" />,
  HubSpot: <Globe className="h-5 w-5" />,
  Drupal: <Server className="h-5 w-5" />,
  Joomla: <Server className="h-5 w-5" />,
  Magento: <ShoppingBag className="h-5 w-5" />,
  Ghost: <Code2 className="h-5 w-5" />,
  Framer: <Paintbrush className="h-5 w-5" />,
  GoDaddy: <Globe className="h-5 w-5" />,
  Weebly: <Paintbrush className="h-5 w-5" />,
  "Next.js": <Code2 className="h-5 w-5" />,
  "Nuxt.js": <Code2 className="h-5 w-5" />,
  Gatsby: <Code2 className="h-5 w-5" />,
  Angular: <Code2 className="h-5 w-5" />,
  React: <Code2 className="h-5 w-5" />,
  Laravel: <Server className="h-5 w-5" />,
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
  const icon = info.platform
    ? platformIcons[info.platform] || <Globe className="h-5 w-5" />
    : <HelpCircle className="h-5 w-5" />

  return (
    <div>
      <h3 className="font-sans text-xl text-foreground mb-1">
        Platform detection
      </h3>
      <p className="text-sm text-muted-foreground italic mb-4">
        Detected from page source signatures.
      </p>

      <div className="rounded-lg border border-border bg-card p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 text-muted-foreground">
              {icon}
            </div>
            <div>
              <p className="text-lg font-bold text-card-foreground">
                {info.platform ?? "Unknown"}
              </p>
              {info.platform && (
                <p className="text-xs text-muted-foreground">
                  Detected platform / CMS
                </p>
              )}
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${confidenceStyle[info.confidence]}`}
          >
            {confidenceLabel[info.confidence]}
          </span>
        </div>

        {info.details.length > 0 && (
          <ul className="space-y-1.5">
            {info.details.map((detail) => (
              <li
                key={detail}
                className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                {detail}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
