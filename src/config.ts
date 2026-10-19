import { z } from "zod";

import type { AppConfig, AuthType } from "./types.js";

const urlSchema = z.url({ protocol: /^https?$/ });

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function positiveInteger(
  env: NodeJS.ProcessEnv,
  name: string,
  fallback: number,
): number {
  const raw = env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function validateUrl(value: string, name: string): string {
  const parsed = urlSchema.safeParse(value);
  if (!parsed.success) throw new Error(`${name} must be an HTTP(S) URL`);
  return value.replace(/\/+$/, "");
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const rawBaseUrl = validateUrl(required(env, "SAP_CPI_BASE_URL"), "SAP_CPI_BASE_URL");
  const baseUrl = rawBaseUrl.replace(/\/api\/v1$/i, "");
  const authType = (env.SAP_AUTH_TYPE?.trim().toLowerCase() || "oauth2") as AuthType;
  if (authType !== "oauth2" && authType !== "basic") {
    throw new Error("SAP_AUTH_TYPE must be either oauth2 or basic");
  }

  const common = {
    baseUrl,
    apiBaseUrl: `${baseUrl}/api/v1`,
    authType,
    allowWrite: env.SAP_ALLOW_WRITE?.trim().toLowerCase() === "true",
    requestTimeoutMs: positiveInteger(env, "SAP_REQUEST_TIMEOUT_MS", 30_000),
    maxBinaryBytes: positiveInteger(env, "SAP_MAX_BINARY_BYTES", 25 * 1024 * 1024),
  };

  if (authType === "oauth2") {
    return {
      ...common,
      oauth: {
        tokenUrl: validateUrl(required(env, "SAP_TOKEN_URL"), "SAP_TOKEN_URL"),
        clientId: required(env, "SAP_CLIENT_ID"),
        clientSecret: required(env, "SAP_CLIENT_SECRET"),
      },
    };
  }

  return {
    ...common,
    basic: {
      username: required(env, "SAP_USERNAME"),
      password: required(env, "SAP_PASSWORD"),
    },
  };
}
