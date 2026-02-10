-- Reports table: stores full audit results with URL versioning
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY,
  url TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  overall_score INTEGER NOT NULL,
  summary_text TEXT,
  result_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast URL lookups and version ordering
CREATE INDEX IF NOT EXISTS idx_reports_url ON reports (url, version DESC);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports (created_at DESC);
