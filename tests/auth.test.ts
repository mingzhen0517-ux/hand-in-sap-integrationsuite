import { describe, expect, it, vi } from "vitest";

import { BasicAuthProvider, OAuthClientCredentialsProvider } from "../src/auth.js";
import type { FetchLike } from "../src/types.js";

describe("authentication providers", () => {
  it("builds a Basic authorization value", async () => {
    const provider = new BasicAuthProvider("user", "p@ss");
    expect(await provider.getAuthorization()).toBe(
      `Basic ${Buffer.from("user:p@ss").toString("base64")}`,
    );
  });

  it("caches OAuth tokens and refreshes on demand", async () => {
    let tokenNumber = 0;
    const fetchFn = vi.fn<FetchLike>(async () => new Response(JSON.stringify({
      access_token: `token-${++tokenNumber}`,
      expires_in: 3600,
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const provider = new OAuthClientCredentialsProvider({
      tokenUrl: "https://auth.example.test/oauth/token",
      clientId: "client",
      clientSecret: "secret",
    }, 1000, fetchFn);

    expect(await provider.getAuthorization()).toBe("Bearer token-1");
    expect(await provider.getAuthorization()).toBe("Bearer token-1");
    expect(await provider.getAuthorization(true)).toBe("Bearer token-2");
    expect(fetchFn).toHaveBeenCalledTimes(2);
    const headers = new Headers(fetchFn.mock.calls[0]?.[1]?.headers);
    expect(headers.get("authorization")).toMatch(/^Basic /);
  });
});
