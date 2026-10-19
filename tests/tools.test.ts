import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SapCpiClient } from "../src/client.js";
import { createMcpServer, READ_TOOL_NAMES, WRITE_TOOL_NAMES } from "../src/tools.js";
import { basicConfig } from "./fixtures.js";

const closeCallbacks: Array<() => Promise<void>> = [];
afterEach(async () => {
  await Promise.all(closeCallbacks.splice(0).map((close) => close()));
});

async function connectedTools(allowWrite: boolean) {
  const config = basicConfig({ allowWrite });
  const fetchFn = vi.fn(async () => new Response(JSON.stringify({ d: { results: [] } }), {
    status: 200,
  }));
  const server = createMcpServer(config, new SapCpiClient(config, fetchFn));
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  closeCallbacks.push(async () => {
    await client.close();
    await server.close();
  });
  return { client, fetchFn };
}

describe("MCP tool registration", () => {
  it("registers only read tools by default", async () => {
    const { client } = await connectedTools(false);
    const names = (await client.listTools()).tools.map((tool) => tool.name);
    expect(names.sort()).toEqual([...READ_TOOL_NAMES].sort());
    expect(names).not.toContain(WRITE_TOOL_NAMES[0]);
  });

  it("adds exactly five lifecycle tools when writes are enabled", async () => {
    const { client } = await connectedTools(true);
    const tools = (await client.listTools()).tools;
    const names = tools.map((tool) => tool.name);
    expect(names.sort()).toEqual([...READ_TOOL_NAMES, ...WRITE_TOOL_NAMES].sort());
    expect(tools.find((tool) => tool.name === "cpi_stop_runtime_artifact")?.annotations)
      .toMatchObject({ readOnlyHint: false, destructiveHint: true });
  });

  it("performs a complete MCP call and returns structured content", async () => {
    const { client, fetchFn } = await connectedTools(false);
    const result = await client.callTool({ name: "cpi_check_connection", arguments: {} });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      connected: true,
      authType: "basic",
      writeEnabled: false,
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
