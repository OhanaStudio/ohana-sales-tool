import { readFileSync, writeFileSync, existsSync } from 'fs';

// Try multiple possible paths
const paths = [
  '/vercel/share/v0-project/app/api/audit/route.ts',
  '/home/user/app/api/audit/route.ts',
  '/app/api/audit/route.ts',
  './app/api/audit/route.ts',
  process.cwd() + '/app/api/audit/route.ts',
];

console.log("CWD:", process.cwd());

let filePath = null;
for (const p of paths) {
  console.log("Checking:", p, "exists:", existsSync(p));
  if (existsSync(p)) {
    filePath = p;
    break;
  }
}

if (!filePath) {
  console.log("Could not find route.ts - listing cwd:");
  import('fs').then(fs => {
    try { console.log(fs.readdirSync(process.cwd())); } catch(e) { console.log("err", e.message); }
    try { console.log(fs.readdirSync('/home/user')); } catch(e) { console.log("err", e.message); }
  });
} else {
  let content = readFileSync(filePath, 'utf8');
  
  const mobileFallback = `({result:{strategy:"mobile",performanceScore:0,accessibilityScore:0,seoScore:0,bestPracticesScore:0,metrics:{lcp:null,cls:null,tbt:null,fcp:null,speedIndex:null},fieldDataAvailable:false,notes:["Lighthouse analysis failed"]},rawAudits:{}})`;
  const desktopFallback = `({result:{strategy:"desktop",performanceScore:0,accessibilityScore:0,seoScore:0,bestPracticesScore:0,metrics:{lcp:null,cls:null,tbt:null,fcp:null,speedIndex:null},fieldDataAvailable:false,notes:["Lighthouse analysis failed"]},rawAudits:{}})`;
  
  const mobilePattern = `fetchPSI(url, "mobile").catch(() => defaultPSIResult)`;
  const desktopPattern = `fetchPSI(url, "desktop").catch(() => defaultPSIResult)`;
  
  if (content.includes('defaultPSIResult')) {
    console.log("Found defaultPSIResult references");
    content = content.replace(mobilePattern, `fetchPSI(url, "mobile").catch(() => ${mobileFallback})`);
    content = content.replace(desktopPattern, `fetchPSI(url, "desktop").catch(() => ${desktopFallback})`);
  }
  
  if (content.includes('({ html: "", blocked: true })')) {
    content = content.replace('({ html: "", blocked: true })', '({ html: "", blocked: true, responseHeaders: {} })');
    console.log("Fixed fetchSiteHtml fallback");
  }

  writeFileSync(filePath, content, 'utf8');
  console.log("Done writing to:", filePath);
}
