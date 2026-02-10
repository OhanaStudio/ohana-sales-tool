import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

console.log("Running migration: create reports table...");

await sql`
  CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY,
    url TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    overall_score INTEGER NOT NULL,
    summary_text TEXT,
    result_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`CREATE INDEX IF NOT EXISTS idx_reports_url ON reports (url, version DESC)`;
await sql`CREATE INDEX IF NOT EXISTS idx_reports_created ON reports (created_at DESC)`;

console.log("Migration complete: reports table and indexes created.");
