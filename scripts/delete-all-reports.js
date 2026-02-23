const { neon } = require("@neondatabase/serverless")

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required")
}

const sql = neon(databaseUrl)

async function deleteAllReports() {
  console.log("Deleting all reports from database...")
  
  try {
    const result = await sql`DELETE FROM reports`
    console.log(`✓ Deleted ${result.length} reports successfully`)
    return result.length
  } catch (error) {
    console.error("Error deleting reports:", error)
    throw error
  }
}

deleteAllReports()
  .then((count) => {
    console.log(`✓ All reports deleted (${count} total)`)
    process.exit(0)
  })
  .catch((error) => {
    console.error("✗ Failed to delete reports:", error)
    process.exit(1)
  })
