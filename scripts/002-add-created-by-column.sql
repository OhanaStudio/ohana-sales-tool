-- Add created_by column to track which user ran each report
ALTER TABLE reports ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Index for filtering by user
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports (created_by);
