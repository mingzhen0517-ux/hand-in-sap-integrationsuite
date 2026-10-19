#!/usr/bin/env node
/**
 * Clean Core Compliance Validator for Integration Specifications
 * Usage: node check-clean-core.mjs <spec-file-or-parameters-file>
 */
import fs from "node:fs";
import path from "node:path";

const targetFile = process.argv[2];

if (!targetFile) {
  console.error("Usage: node check-clean-core.mjs <filepath>");
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), targetFile);
if (!fs.existsSync(resolvedPath)) {
  console.error(`Error: File not found: ${resolvedPath}`);
  process.exit(1);
}

const content = fs.readFileSync(resolvedPath, "utf-8");

const violations = [];
const recommendations = [];

// 1. Check for forbidden legacy direct table reading or non-standard RFC patterns
const BANNED_PATTERNS = [
  { regex: /RFC_READ_TABLE/i, reason: "Direct table reading via RFC_READ_TABLE violates Clean Core. Use released CDS views or OData services." },
  { regex: /SELECT\s+.*\s+FROM\s+Z[A-Z0-9_]+/i, reason: "Direct SQL against custom Z tables detected. Use standard released APIs." },
  { regex: /password\s*=\s*['"][^'"]+['"]/i, reason: "Plaintext password detected. Store credentials in Security Material." },
  { regex: /https?:\/\/(?:[0-9]{1,3}\.){3}[0-9]{1,3}/i, reason: "Hardcoded IP address detected. Must be externalized as a named hostname parameter." },
];

for (const pattern of BANNED_PATTERNS) {
  if (pattern.regex.test(content)) {
    violations.push(pattern.reason);
  }
}

// 2. Check for Clean Core compliance markers
const hasReleasedApi = /API_[A-Z0-9_]+|OData\s+v[24]|SAP_Business_Accelerator_Hub|SAP\s+Event\s+Mesh/i.test(content);
if (!hasReleasedApi) {
  recommendations.push("Document should explicitly specify a released API from SAP Business Accelerator Hub or SAP Event Mesh.");
}

const hasExternalizedParams = /\{\{[A-Z0-9_]+\}\}|externalized/i.test(content);
if (!hasExternalizedParams) {
  recommendations.push("Ensure environment-specific properties (URLs, credential names) are explicitly flagged as externalized parameters.");
}

console.log(JSON.stringify({
  file: targetFile,
  compliant: violations.length === 0,
  violationsCount: violations.length,
  violations,
  recommendations,
  timestamp: new Date().toISOString()
}, null, 2));

process.exit(violations.length === 0 ? 0 : 2);
