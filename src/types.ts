export type AuthType = "oauth2" | "basic";

export interface AppConfig {
  baseUrl: string;
  apiBaseUrl: string;
  authType: AuthType;
  allowWrite: boolean;
  requestTimeoutMs: number;
  maxBinaryBytes: number;
  oauth?: {
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
  } | undefined;
  basic?: {
    username: string;
    password: string;
  } | undefined;
}

export interface SapErrorBody {
  code: string;
  message: string;
  httpStatus: number;
  requestId?: string;
  retryable: boolean;
  sapDetails?: unknown;
}

export interface Page<T = unknown> {
  items: T[];
  nextCursor?: string;
}

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: BodyInit;
  responseType?: "json" | "text" | "bytes";
  authenticated?: boolean;
}

export interface BinaryResult {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  base64: string;
}
