import type { AppConfig } from "../src/types.js";

export function basicConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    baseUrl: "https://tenant.example.test",
    apiBaseUrl: "https://tenant.example.test/api/v1",
    authType: "basic",
    allowWrite: false,
    requestTimeoutMs: 1000,
    maxBinaryBytes: 1024,
    basic: { username: "user", password: "password" },
    ...overrides,
  };
}
