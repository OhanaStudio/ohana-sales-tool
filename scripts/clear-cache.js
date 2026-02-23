import { rmSync } from 'fs'
import { existsSync } from 'fs'

console.log("Clearing Next.js build cache...")

const cachePaths = [
  '.next',
  '.turbo',
  'node_modules/.cache'
]

let cleared = 0
for (const path of cachePaths) {
  if (existsSync(path)) {
    try {
      rmSync(path, { recursive: true, force: true })
      console.log(`✓ Deleted ${path}`)
      cleared++
    } catch (error) {
      console.log(`✗ Could not delete ${path}:`, error.message)
    }
  } else {
    console.log(`- ${path} does not exist`)
  }
}

console.log(`\n✓ Cache cleared (${cleared} directories deleted)`)
console.log("Restart the dev server to pick up changes")
