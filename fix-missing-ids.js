#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all TypeScript files in src/app/api
const apiDir = path.join(__dirname, 'src/app/api');

function findFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findFiles(fullPath));
    } else if (item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

const files = findFiles(apiDir);
let totalChanges = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // Fix notification.create without id
  const notificationRegex = /(await prisma\.notification\.create\(\{\s*data: \{)\s*(\n\s*userId:)/g;
  if (notificationRegex.test(content)) {
    content = content.replace(notificationRegex, '$1\n              id: crypto.randomUUID(),$2');
    changed = true;
  }
  
  // Fix comment.create without id
  const commentRegex = /(await prisma\.comment\.create\(\{\s*data: \{)\s*(\n\s*(?:content|jobId):)/g;
  if (commentRegex.test(content)) {
    content = content.replace(commentRegex, '$1\n          id: crypto.randomUUID(),$2');
    changed = true;
  }
  
  // Fix statusUpdate.create without id
  const statusUpdateRegex = /(await prisma\.statusUpdate\.create\(\{\s*data: \{)\s*(\n\s*jobId:)/g;
  if (statusUpdateRegex.test(content)) {
    content = content.replace(statusUpdateRegex, '$1\n          id: crypto.randomUUID(),$2');
    changed = true;
  }
  
  // Fix department.create without id and updatedAt
  const deptRegex = /(await prisma\.department\.create\(\{\s*data: \{)\s*(\n\s*name:)/g;
  if (deptRegex.test(content)) {
    content = content.replace(deptRegex, '$1\n        id: crypto.randomUUID(),$2');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    totalChanges++;
    console.log(`Fixed: ${path.relative(__dirname, file)}`);
  }
}

console.log(`\nTotal files fixed: ${totalChanges}`);
