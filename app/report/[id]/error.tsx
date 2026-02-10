"use client"

export default function ReportError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        <h1 className="font-serif text-3xl text-foreground mb-3">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          The report could not be loaded. This may be due to a data format issue
          or a temporary problem.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-lg bg-foreground text-background px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center rounded-lg border border-border bg-card text-card-foreground px-5 py-3 text-sm font-medium hover:bg-accent transition-colors"
          >
            Run a new check
          </a>
        </div>
      </div>
    </div>
  )
}
