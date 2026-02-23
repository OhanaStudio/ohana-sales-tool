import { neon } from "@neondatabase/serverless"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required")
}

const sql = neon(databaseUrl)

async function checkDatabase() {
  console.log("Checking reports in database...")
  
  try {
    const reports = await sql`SELECT id, url, created_at FROM reports ORDER BY created_at DESC`
    console.log(`Found ${reports.length} reports in database:`)
    reports.forEach((report, i) => {
      console.log(`${i + 1}. ID: ${report.id}`)
      console.log(`   URL: ${report.url}`)
      console.log(`   Created: ${report.created_at}`)
      console.log("")
    })
    
    if (reports.length > 0) {
      console.log("⚠️  Database is NOT empty - reports still exist!")
    } else {
      console.log("✓ Database is empty")
    }
  } catch (error) {
    console.error("Error checking database:", error)
    throw error
  }
}

checkDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed:", error)
    process.exit(1)
  })
