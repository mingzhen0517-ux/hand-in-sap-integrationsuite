import { SapApiError } from "./errors.js";
import type { AppConfig, FetchLike } from "./types.js";

export interface AuthProvider {
  getAuthorization(forceRefresh?: boolean): Promise<string>;
  readonly supportsRefresh: boolean;
}

export class BasicAuthProvider implements AuthProvider {
  readonly supportsRefresh = false;
  constructor(private readonly username: string, private readonly password: string) {}

  async getAuthorization(): Promise<string> {
    return `Basic ${Buffer.from(`${this.username}:${this.password}`, "utf8").toString("base64")}`;
  }
}

export class OAuthClientCredentialsProvider implements AuthProvider {
  readonly supportsRefresh = true;
  private accessToken?: string;
  private expiresAt = 0;

  constructor(
    private readonly config: NonNullable<AppConfig["oauth"]>,
    private readonly timeoutMs: number,
    private readonly fetchFn: FetchLike = fetch,
  ) {}

  async getAuthorization(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.accessToken && Date.now() < this.expiresAt) {
      return `Bearer ${this.accessToken}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const basic = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`,
        "utf8",
      ).toString("base64");
      const response = await this.fetchFn(this.config.tokenUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Basic ${basic}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ grant_type: "client_credentials" }),
        signal: controller.signal,
      });
      if (!response.ok) throw await SapApiError.fromResponse(response);
      const token = await response.json() as {
        access_token?: unknown;
        expires_in?: unknown;
      };
      if (typeof token.access_token !== "string" || !token.access_token) {
        throw new Error("OAuth token response did not contain access_token");
      }
      const expiresIn = typeof token.expires_in === "number" ? token.expires_in : 300;
      this.accessToken = token.access_token;
      this.expiresAt = Date.now() + Math.max(1, expiresIn - 30) * 1000;
      return `Bearer ${this.accessToken}`;
    } finally {
      clearTimeout(timer);
    }
  }
}

export function createAuthProvider(config: AppConfig, fetchFn: FetchLike = fetch): AuthProvider {
  if (config.authType === "oauth2" && config.oauth) {
    return new OAuthClientCredentialsProvider(config.oauth, config.requestTimeoutMs, fetchFn);
  }
  if (config.authType === "basic" && config.basic) {
    return new BasicAuthProvider(config.basic.username, config.basic.password);
  }
  throw new Error(`Incomplete ${config.authType} authentication configuration`);
}
