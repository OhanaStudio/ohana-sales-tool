import { readFileSync, writeFileSync } from 'fs'

const filePath = '/vercel/share/v0-project/app/api/audit/route.ts'
let content = readFileSync(filePath, 'utf8')

const mobileFallback = `({result:{strategy:"mobile",performanceScore:0,accessibilityScore:0,seoScore:0,bestPracticesScore:0,metrics:{lcp:null,cls:null,tbt:null,fcp:null,speedIndex:null},fieldDataAvailable:false,notes:["Lighthouse analysis failed"]},rawAudits:{}})`
const desktopFallback = `({result:{strategy:"desktop",performanceScore:0,accessibilityScore:0,seoScore:0,bestPracticesScore:0,metrics:{lcp:null,cls:null,tbt:null,fcp:null,speedIndex:null},fieldDataAvailable:false,notes:["Lighthouse analysis failed"]},rawAudits:{}})`

// Replace mobile catch
content = content.replace(
  /fetchPSI\(url,\s*"mobile"\)\.catch\(\(\)\s*=>\s*defaultPSIResult\)/,
  `fetchPSI(url, "mobile").catch(() => ${mobileFallback})`
)

// Replace desktop catch
content = content.replace(
  /fetchPSI\(url,\s*"desktop"\)\.catch\(\(\)\s*=>\s*defaultPSIResult\)/,
  `fetchPSI(url, "desktop").catch(() => ${desktopFallback})`
)

writeFileSync(filePath, content, 'utf8')

// Verify
const verify = readFileSync(filePath, 'utf8')
const remaining = (verify.match(/defaultPSIResult/g) || []).length
console.log(`Done. Remaining references to defaultPSIResult: ${remaining}`)
