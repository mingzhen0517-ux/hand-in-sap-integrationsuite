import { describe, expect, it, vi } from "vitest";

import { SapCpiClient, decodeBase64 } from "../src/client.js";
import type { FetchLike } from "../src/types.js";
import { basicConfig } from "./fixtures.js";

describe("SapCpiClient", () => {
  it("encodes list filters and normalizes OData pages", async () => {
    const fetchFn = vi.fn<FetchLike>(async () => new Response(JSON.stringify({
      d: { results: [{ Id: "pkg-1" }] },
    }), { status: 200 }));
    const client = new SapCpiClient(basicConfig(), fetchFn);
    const result = await client.listPackages({ limit: 50, id: "pkg'1" });
    expect(result.items).toEqual([{ Id: "pkg-1" }]);
    const url = new URL(String(fetchFn.mock.calls[0]?.[0]));
    expect(url.searchParams.get("$filter")).toBe("Id eq 'pkg''1'");
    const headers = new Headers(fetchFn.mock.calls[0]?.[1]?.headers);
    expect(headers.get("authorization")).toMatch(/^Basic /);
  });

  it("refreshes OAuth once after a 401", async () => {
    let tokenCalls = 0;
    let apiCalls = 0;
    const fetchFn: FetchLike = vi.fn(async (input) => {
      if (String(input).includes("/oauth/token")) {
        tokenCalls += 1;
        return new Response(JSON.stringify({ access_token: `token-${tokenCalls}`, expires_in: 300 }));
      }
      apiCalls += 1;
      if (apiCalls === 1) return new Response("unauthorized", { status: 401 });
      return new Response(JSON.stringify({ d: { results: [] } }), { status: 200 });
    });
    const config = basicConfig({
      authType: "oauth2",
      basic: undefined,
      oauth: {
        tokenUrl: "https://auth.example.test/oauth/token",
        clientId: "client",
        clientSecret: "secret",
      },
    });
    const client = new SapCpiClient(config, fetchFn);
    await client.listRuntimeArtifacts({ limit: 1 });
    expect(tokenCalls).toBe(2);
    expect(apiCalls).toBe(2);
  });

  it("returns Base64, MIME, length, and SHA-256 for downloads", async () => {
    const fetchFn = vi.fn<FetchLike>(async () => new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": "attachment; filename=flow.zip",
      },
    }));
    const client = new SapCpiClient(basicConfig(), fetchFn);
    const result = await client.downloadIflow("Package1", "flow", "1.0");
    expect(result).toMatchObject({
      fileName: "flow.zip",
      mimeType: "application/zip",
      sizeBytes: 3,
      base64: "AQID",
    });
    expect(result.sha256).toHaveLength(64);
    expect(String(fetchFn.mock.calls[0]?.[0]))
      .toContain("IntegrationPackages('Package1')/IntegrationDesigntimeArtifacts");
  });

  it("lists design-time artifacts through their package navigation", async () => {
    const fetchFn = vi.fn<FetchLike>(async () => new Response(JSON.stringify({
      d: { results: [{ Id: "Flow1", Version: "1.0.0" }] },
    }), { status: 200 }));
    const client = new SapCpiClient(basicConfig(), fetchFn);
    const result = await client.listIflows({ packageId: "Package1", id: "Flow1", limit: 50 });
    expect(result.items).toHaveLength(1);
    const url = new URL(String(fetchFn.mock.calls[0]?.[0]));
    expect(url.pathname).toContain("IntegrationPackages('Package1')/IntegrationDesigntimeArtifacts");
    expect(url.searchParams.get("$filter")).toBe("Id eq 'Flow1'");
  });

  it("matches an exact iFlow client-side when the tenant ignores filters", async () => {
    const fetchFn = vi.fn<FetchLike>(async () => new Response(JSON.stringify({
      d: { results: [
        { Id: "OtherFlow", Version: "1.0.0" },
        { Id: "Flow1", Version: "1.0.0" },
      ] },
    }), { status: 200 }));
    const client = new SapCpiClient(basicConfig(), fetchFn);
    await expect(client.getIflow("Package1", "Flow1", "1.0.0"))
      .resolves.toMatchObject({ Id: "Flow1", Version: "1.0.0" });
  });

  it("rejects invalid and oversized Base64 before making a request", async () => {
    expect(() => decodeBase64("not-base64", 100)).toThrow("valid padded Base64");
    expect(() => decodeBase64(Buffer.alloc(20).toString("base64"), 10)).toThrow("exceeds");
    const fetchFn = vi.fn();
    const client = new SapCpiClient(basicConfig({ maxBinaryBytes: 2 }), fetchFn);
    await expect(client.uploadIflow({
      mode: "update",
      id: "flow",
      version: "1.0",
      base64: "AQID",
    })).rejects.toThrow("exceeds");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("creates iFlows with the tenant-supported ArtifactContent JSON field", async () => {
    const fetchFn = vi.fn<FetchLike>(async () => new Response(JSON.stringify({
      d: { Id: "Flow1", Version: "1.0.0" },
    }), { status: 201 }));
    const client = new SapCpiClient(basicConfig(), fetchFn);
    await client.uploadIflow({
      mode: "create",
      id: "Flow1",
      name: "Flow 1",
      packageId: "Package1",
      base64: "AQID",
    });
    const init = fetchFn.mock.calls[0]?.[1];
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
    expect(JSON.parse(String(init?.body))).toEqual({
      Id: "Flow1",
      Name: "Flow 1",
      PackageId: "Package1",
      ArtifactContent: "AQID",
    });
  });

  it("updates iFlows through ArtifactContent instead of an unimplemented media PUT", async () => {
    const fetchFn = vi.fn<FetchLike>(async () => new Response(null, { status: 204 }));
    const client = new SapCpiClient(basicConfig(), fetchFn);
    await client.uploadIflow({
      mode: "update",
      id: "Flow1",
      version: "1.0.0",
      base64: "AQID",
    });
    expect(String(fetchFn.mock.calls[0]?.[0])).not.toContain("/$value");
    expect(JSON.parse(String(fetchFn.mock.calls[0]?.[1]?.body)))
      .toEqual({ ArtifactContent: "AQID" });
  });

  it("marks tenant-dependent diagnostics unavailable", async () => {
    const fetchFn = vi.fn(async (input) => {
      if (String(input).includes("Attachments")) {
        return new Response(JSON.stringify({ d: { results: [{ Id: "a1" }] } }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: { message: { value: "not retained" } } }), {
        status: 404,
      });
    });
    const client = new SapCpiClient(basicConfig(), fetchFn);
    const result = await client.getMessageDiagnostics("guid") as Record<string, any>;
    expect(result.attachments.available).toBe(true);
    expect(result.customHeaderProperties.available).toBe(false);
    expect(result.payload.available).toBe(false);
  });
});
