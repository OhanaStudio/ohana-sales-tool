import Image from "next/image"
import Link from "next/link"

export function TopBar() {
  return (
    <header className="flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
      <Link href="/" className="block">
        <Image src="/ohaha-logo.svg" alt="Ohana" width={85} height={44} className="h-8 w-auto" />
      </Link>
      <Link
        href="/history"
        className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors"
      >
        History
      </Link>
    </header>
  )
}
