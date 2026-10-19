#!/usr/bin/env node
/**
 * Static analyzer for Groovy scripts in SAP Cloud Integration
 * Enforces streaming APIs, prevents OOM, checks for secret leakage
 * Usage: node check-groovy-stream.mjs <directory-or-groovy-file>
 */
import fs from "node:fs";
import path from "node:path";

const targetPath = process.argv[2];

if (!targetPath) {
  console.error("Usage: node check-groovy-stream.mjs <file-or-dir>");
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), targetPath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`Error: Path not found: ${resolvedPath}`);
  process.exit(1);
}

const groovyFiles = [];
if (fs.statSync(resolvedPath).isDirectory()) {
  function scan(dir) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        scan(full);
      } else if (item.endsWith(".groovy")) {
        groovyFiles.push(full);
      }
    }
  }
  scan(resolvedPath);
} else {
  groovyFiles.push(resolvedPath);
}

let totalViolations = 0;
const results = [];

for (const file of groovyFiles) {
  const code = fs.readFileSync(file, "utf-8");
  const issues = [];

  // 1. Check for memory-unsafe String body extraction (OOM hazard)
  if (/message\.getBody\(\s*(?:java\.lang\.)?String(?:\.class)?\s*\)/.test(code)) {
    issues.push({
      rule: "STREAMING_REQUIRED",
      severity: "ERROR",
      message: "Unsafe full-string body extraction: Avoid `message.getBody(String)` on potentially large payloads. Use `message.getBody(java.io.Reader)` or `InputStream`."
    });
  }

  // 2. Check for hardcoded credentials / tokens
  if (/(?:password|clientSecret|apiKey|bearerToken)\s*=\s*['"][a-zA-Z0-9_\-+=]{8,}['"]/i.test(code)) {
    issues.push({
      rule: "NO_HARDCODED_SECRETS",
      severity: "CRITICAL",
      message: "Potential hardcoded credential detected. Read credentials via SecureStore or Security Material."
    });
  }

  // 3. Check for infinite sleep / thread block
  if (/Thread\.sleep\(\s*\d{5,}\s*\)/.test(code)) {
    issues.push({
      rule: "NO_LONG_BLOCKING_SLEEP",
      severity: "WARN",
      message: "Long Thread.sleep() detected. Do not block Cloud Integration runtime worker threads."
    });
  }

  if (issues.length > 0) {
    totalViolations += issues.filter(i => i.severity === "ERROR" || i.severity === "CRITICAL").length;
  }

  results.push({
    file: path.relative(process.cwd(), file),
    passed: issues.length === 0,
    issues
  });
}

console.log(JSON.stringify({
  scannedFiles: groovyFiles.length,
  passed: totalViolations === 0,
  totalViolations,
  results,
  timestamp: new Date().toISOString()
}, null, 2));

process.exit(totalViolations === 0 ? 0 : 2);
