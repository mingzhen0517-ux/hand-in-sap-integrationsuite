#!/usr/bin/env node
/**
 * Pack an iFlow directory into a standard CPI Base64 ZIP
 * Usage: node pack-iflow.mjs <iflow-dir> [output-zip-path]
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const targetDir = process.argv[2];
const outputZip = process.argv[3];

if (!targetDir) {
  console.error("Usage: node pack-iflow.mjs <iflow-dir> [output-zip-path]");
  process.exit(1);
}

const resolvedDir = path.resolve(process.cwd(), targetDir);
if (!fs.existsSync(resolvedDir) || !fs.statSync(resolvedDir).isDirectory()) {
  console.error(`Error: Directory not found: ${resolvedDir}`);
  process.exit(1);
}

// Basic CPI artifact structure validation
const hasResources = fs.existsSync(path.join(resolvedDir, "src", "main", "resources"));
const hasModel = fs.existsSync(path.join(resolvedDir, "src", "main", "resources", "scenarioflows", "zeromodel.xml"));

const tmpZip = outputZip
  ? path.resolve(process.cwd(), outputZip)
  : path.join("/tmp", `iflow_${Date.now()}_${path.basename(resolvedDir)}.zip`);

try {
  // Zip directory contents recursively from within the directory
  execSync(`cd "${resolvedDir}" && zip -r -q "${tmpZip}" . -x "*.DS_Store" "*.git*"`);
  const zipBuffer = fs.readFileSync(tmpZip);
  const base64 = zipBuffer.toString("base64");
  const sha256 = crypto.createHash("sha256").update(zipBuffer).digest("hex");

  console.log(JSON.stringify({
    success: true,
    artifactDirectory: resolvedDir,
    zipFile: tmpZip,
    sizeBytes: zipBuffer.length,
    sha256,
    hasStandardStructure: hasResources,
    hasZeroModel: hasModel,
    base64Snippet: base64.slice(0, 64) + "...",
    base64Length: base64.length
  }, null, 2));

  // If user didn't request a persistent output file, clean up temp zip if needed or keep for cpi_upload_iflow
} catch (err) {
  console.error(JSON.stringify({
    success: false,
    error: err.message
  }, null, 2));
  process.exit(1);
}
