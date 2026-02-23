import { readFileSync, writeFileSync } from 'fs';

const filePath = '/vercel/share/v0-project/app/api/audit/route.ts';
let content = readFileSync(filePath, 'utf8');

const mobileFallback = `({result:{strategy:"mobile",performanceScore:0,accessibilityScore:0,seoScore:0,bestPracticesScore:0,metrics:{lcp:null,cls:null,tbt:null,fcp:null,speedIndex:null},fieldDataAvailable:false,notes:["Lighthouse analysis failed"]},rawAudits:{}})`;
const desktopFallback = `({result:{strategy:"desktop",performanceScore:0,accessibilityScore:0,seoScore:0,bestPracticesScore:0,metrics:{lcp:null,cls:null,tbt:null,fcp:null,speedIndex:null},fieldDataAvailable:false,notes:["Lighthouse analysis failed"]},rawAudits:{}})`;

// Find the two defaultPSIResult references and replace them
const mobilePattern = `fetchPSI(url, "mobile").catch(() => defaultPSIResult)`;
const desktopPattern = `fetchPSI(url, "desktop").catch(() => defaultPSIResult)`;

if (content.includes(mobilePattern)) {
  content = content.replace(mobilePattern, `fetchPSI(url, "mobile").catch(() => ${mobileFallback})`);
  console.log("Replaced mobile defaultPSIResult");
} else {
  console.log("Mobile pattern not found");
}

if (content.includes(desktopPattern)) {
  content = content.replace(desktopPattern, `fetchPSI(url, "desktop").catch(() => ${desktopFallback})`);
  console.log("Replaced desktop defaultPSIResult");
} else {
  console.log("Desktop pattern not found");
}

// Also add responseHeaders to the fetchSiteHtml fallback if missing
if (content.includes('({ html: "", blocked: true })')) {
  content = content.replace('({ html: "", blocked: true })', '({ html: "", blocked: true, responseHeaders: {} })');
  console.log("Fixed fetchSiteHtml fallback");
}

writeFileSync(filePath, content, 'utf8');
console.log("Done writing file");
