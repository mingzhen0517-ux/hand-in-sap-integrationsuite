#!/usr/bin/env node
/**
 * Format raw CPI MPL logs / diagnostics into standardized QA Report JSON
 * Usage: node format-mpl-report.mjs <mpl-json-file> [output-report-file]
 */
import fs from "node:fs";
import path from "node:path";

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile) {
  console.error("Usage: node format-mpl-report.mjs <mpl-json-file> [output-report-file]");
  process.exit(1);
}

const resolvedInput = path.resolve(process.cwd(), inputFile);
if (!fs.existsSync(resolvedInput)) {
  console.error(`Error: File not found: ${resolvedInput}`);
  process.exit(1);
}

let raw;
try {
  raw = JSON.parse(fs.readFileSync(resolvedInput, "utf-8"));
} catch (err) {
  console.error(`Error: Failed to parse JSON: ${err.message}`);
  process.exit(1);
}

// Handle wrapped structuredContent or direct array/object
const data = raw.structuredContent?.value || raw.structuredContent || raw.items || (Array.isArray(raw) ? raw : [raw]);
const logs = Array.isArray(data) ? data : [data];

let completedCount = 0;
let failedCount = 0;
const processedLogs = [];

for (const item of logs) {
  const status = item.Status || item.status || "UNKNOWN";
  if (status === "COMPLETED") completedCount++;
  if (status === "FAILED") failedCount++;

  processedLogs.push({
    messageGuid: item.MessageGuid || item.messageGuid || "N/A",
    correlationId: item.CorrelationId || item.correlationId || "N/A",
    status,
    integrationFlowId: item.IntegrationFlowName || item.integrationFlowName || item.Id || "N/A",
    logStart: item.LogStart || item.logStart || "N/A",
    logEnd: item.LogEnd || item.logEnd || "N/A"
  });
}

const report = {
  summary: {
    totalLogs: processedLogs.length,
    completedCount,
    failedCount,
    overallStatus: failedCount === 0 && completedCount > 0 ? "PASSED" : "FAILED"
  },
  logs: processedLogs,
  generatedAt: new Date().toISOString()
};

const outputContent = JSON.stringify(report, null, 2);
if (outputFile) {
  const resolvedOutput = path.resolve(process.cwd(), outputFile);
  fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });
  fs.writeFileSync(resolvedOutput, outputContent, "utf-8");
  console.log(`Report written to ${resolvedOutput}`);
} else {
  console.log(outputContent);
}
