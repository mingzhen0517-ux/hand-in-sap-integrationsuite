#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadConfig } from "./config.js";
import { createMcpServer } from "./tools.js";

async function main(): Promise<void> {
  try {
    process.loadEnvFile?.();
  } catch {
    // Ignore when .env does not exist or environment is already supplied
  }
  const config = loadConfig();
  const server = createMcpServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `sap-cloud-integration-mcp ready (auth=${config.authType}, write=${config.allowWrite})`,
  );
}

main().catch((error: unknown) => {
  console.error(
    `sap-cloud-integration-mcp failed: ${error instanceof Error ? error.message : "unknown error"}`,
  );
  process.exitCode = 1;
});
