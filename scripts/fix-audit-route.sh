#!/bin/bash
sed -i 's/() => defaultPSIResult)/() => ({result:{strategy:"mobile",performanceScore:0,accessibilityScore:0,seoScore:0,bestPracticesScore:0,metrics:{lcp:null,cls:null,tbt:null,fcp:null,speedIndex:null},fieldDataAvailable:false,notes:["Lighthouse analysis failed"]},rawAudits:{}}))/g' /vercel/share/v0-project/app/api/audit/route.ts
echo "Done"
