/**
 * Migration Script: Update API routes to use permissionKeys array
 * 
 * This script helps update API routes from the old permissions object pattern
 * to the new permissionKeys array pattern.
 * 
 * Run: node scripts/migrate-permissions.js
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '..', 'app', 'api');

// Patterns to replace
const replacements = [
  // Pattern 1: isAuthorized with permissions object
  {
    find: /isAuthorized\(([^,]+),\s*session\.user\.permissions\)/g,
    replace: 'isAuthorized($1, session.user.permissionKeys ?? [])'
  },
  // Pattern 2: Direct permission check with ?.allow
  {
    find: /session\.user\.permissions\?\.\["([^"]+)"\]\?\.allow/g,
    replace: '(session.user.permissionKeys ?? []).includes("$1")'
  },
  // Pattern 3: Direct permission check with bracket notation
  {
    find: /session\.user\.permissions\["([^"]+)"\]\?\.allow/g,
    replace: '(session.user.permissionKeys ?? []).includes("$1")'
  },
  // Pattern 4: Variable assignment
  {
    find: /const permissions = session\.user\.permissions \?\? \{\};/g,
    replace: 'const permissionKeys = session.user.permissionKeys ?? [];'
  },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  for (const { find, replace } of replacements) {
    content = content.replace(find, replace);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
    return true;
  }
  return false;
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      callback(filePath);
    }
  }
}

let updatedCount = 0;
walkDir(API_DIR, (filePath) => {
  if (processFile(filePath)) {
    updatedCount++;
  }
});

console.log(`\nMigration complete. Updated ${updatedCount} files.`);
