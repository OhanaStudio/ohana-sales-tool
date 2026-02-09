import Link from "next/link"

export function TopBar() {
  return (
    <header className="flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
      <Link href="/" className="font-serif text-xl tracking-tight text-foreground">
        Ohana
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
