import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function deleteAllReports() {
  console.log("Deleting all reports from database...")
  
  try {
    const result = await sql`DELETE FROM reports`
    console.log(`✓ Deleted ${result.length} reports successfully`)
  } catch (error) {
    console.error("Error deleting reports:", error)
    throw error
  }
}

deleteAllReports()
  .then(() => {
    console.log("✓ All reports deleted")
    process.exit(0)
  })
  .catch((error) => {
    console.error("✗ Failed to delete reports:", error)
    process.exit(1)
  })
