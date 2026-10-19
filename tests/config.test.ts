import { describe, expect, it } from "vitest";

import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("loads OAuth configuration and strips an API suffix", () => {
    const config = loadConfig({
      SAP_CPI_BASE_URL: "https://tenant.example.test/api/v1/",
      SAP_TOKEN_URL: "https://auth.example.test/oauth/token",
      SAP_CLIENT_ID: "client",
      SAP_CLIENT_SECRET: "secret",
      SAP_ALLOW_WRITE: "true",
    });
    expect(config.baseUrl).toBe("https://tenant.example.test");
    expect(config.apiBaseUrl).toBe("https://tenant.example.test/api/v1");
    expect(config.allowWrite).toBe(true);
    expect(config.oauth?.clientId).toBe("client");
  });

  it("loads Basic authentication", () => {
    const config = loadConfig({
      SAP_CPI_BASE_URL: "https://tenant.example.test",
      SAP_AUTH_TYPE: "basic",
      SAP_USERNAME: "user",
      SAP_PASSWORD: "password",
    });
    expect(config.authType).toBe("basic");
    expect(config.basic).toEqual({ username: "user", password: "password" });
  });

  it("rejects missing credentials and invalid numeric limits", () => {
    expect(() => loadConfig({ SAP_CPI_BASE_URL: "https://tenant.example.test" }))
      .toThrow("SAP_TOKEN_URL");
    expect(() => loadConfig({
      SAP_CPI_BASE_URL: "https://tenant.example.test",
      SAP_AUTH_TYPE: "basic",
      SAP_USERNAME: "user",
      SAP_PASSWORD: "password",
      SAP_MAX_BINARY_BYTES: "0",
    })).toThrow("positive integer");
  });
});
