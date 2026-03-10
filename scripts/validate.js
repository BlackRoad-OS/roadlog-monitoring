#!/usr/bin/env node
/**
 * RoadLog HTML/JS Validation Script
 * Checks all HTML files for common issues and validates structure.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE = ['node_modules', '.git', '.github'];
let errors = 0;
let warnings = 0;
let filesChecked = 0;

function findHtmlFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(full));
    } else if (entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

function validateHtml(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const rel = path.relative(ROOT, filePath);
  filesChecked++;

  // Check doctype
  if (!content.trimStart().startsWith('<!DOCTYPE html>')) {
    console.error(`  ERROR: ${rel} - Missing <!DOCTYPE html>`);
    errors++;
  }

  // Check required meta tags
  if (!content.includes('<meta charset=')) {
    console.error(`  ERROR: ${rel} - Missing charset meta tag`);
    errors++;
  }
  if (!content.includes('viewport')) {
    console.warn(`  WARN:  ${rel} - Missing viewport meta tag`);
    warnings++;
  }

  // Check title
  if (!content.includes('<title>') || !content.includes('</title>')) {
    console.error(`  ERROR: ${rel} - Missing <title> tag`);
    errors++;
  }

  // Check for unclosed tags (basic)
  const openBody = (content.match(/<body/g) || []).length;
  const closeBody = (content.match(/<\/body>/g) || []).length;
  if (openBody !== closeBody) {
    console.error(`  ERROR: ${rel} - Mismatched <body> tags`);
    errors++;
  }

  // Check for empty src attributes
  if (content.match(/src=["']\s*["']/)) {
    console.error(`  ERROR: ${rel} - Empty src attribute found`);
    errors++;
  }

  // Check for empty href attributes (excluding # anchors)
  const hrefMatches = content.match(/href=["']\s*["']/g);
  if (hrefMatches) {
    console.warn(`  WARN:  ${rel} - Empty href attribute found`);
    warnings++;
  }

  console.log(`  OK:    ${rel}`);
}

function validateJs(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      validateJs(full);
    } else if (entry.name.endsWith('.js') && !entry.name.includes('validate')) {
      const content = fs.readFileSync(full, 'utf8');
      const rel = path.relative(ROOT, full);
      filesChecked++;

      // Check for console.error without handling
      if (content.includes('eval(')) {
        console.error(`  ERROR: ${rel} - Contains eval() usage`);
        errors++;
      }

      // Check for document.write
      if (content.includes('document.write(')) {
        console.warn(`  WARN:  ${rel} - Uses document.write()`);
        warnings++;
      }

      console.log(`  OK:    ${rel}`);
    }
  }
}

console.log('RoadLog Validation');
console.log('==================\n');

console.log('Checking HTML files...');
const htmlFiles = findHtmlFiles(ROOT);
htmlFiles.forEach(validateHtml);

console.log('\nChecking JS files...');
validateJs(ROOT);

console.log(`\n==================`);
console.log(`Files checked: ${filesChecked}`);
console.log(`Errors: ${errors}`);
console.log(`Warnings: ${warnings}`);

if (errors > 0) {
  console.error('\nValidation FAILED');
  process.exit(1);
}
console.log('\nValidation PASSED');
