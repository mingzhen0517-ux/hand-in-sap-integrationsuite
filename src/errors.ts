import type { SapErrorBody } from "./types.js";

const SECRET_KEY = /authorization|password|secret|token|cookie|credential/i;

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SECRET_KEY.test(key) ? "[REDACTED]" : redact(item),
      ]),
    );
  }
  return value;
}

export class SapApiError extends Error {
  readonly details: SapErrorBody;

  constructor(details: SapErrorBody) {
    super(details.message);
    this.name = "SapApiError";
    this.details = details;
  }

  toJSON(): SapErrorBody {
    return this.details;
  }

  static async fromResponse(response: Response): Promise<SapApiError> {
    const requestId =
      response.headers.get("x-correlationid") ??
      response.headers.get("x-request-id") ??
      response.headers.get("x-vcap-request-id") ??
      undefined;
    const text = await response.text();
    let payload: unknown = text;
    try {
      payload = text ? JSON.parse(text) : undefined;
    } catch {
      // SAP gateways sometimes return HTML or plain text.
    }

    const root = payload && typeof payload === "object" ? payload as Record<string, unknown> : undefined;
    const error = root?.error && typeof root.error === "object"
      ? root.error as Record<string, unknown>
      : undefined;
    const messageValue = error?.message;
    const message =
      typeof messageValue === "string"
        ? messageValue
        : messageValue && typeof messageValue === "object" &&
            typeof (messageValue as Record<string, unknown>).value === "string"
          ? String((messageValue as Record<string, unknown>).value)
          : response.statusText || `SAP request failed with HTTP ${response.status}`;
    const code = typeof error?.code === "string" && error.code
      ? error.code
      : `HTTP_${response.status}`;

    return new SapApiError({
      code,
      message,
      httpStatus: response.status,
      ...(requestId ? { requestId } : {}),
      retryable: response.status === 408 || response.status === 429 || response.status >= 500,
      ...(payload !== undefined ? { sapDetails: redact(payload) } : {}),
    });
  }
}

export function normalizeError(error: unknown): SapErrorBody {
  if (error instanceof SapApiError) return error.toJSON();
  return {
    code: error instanceof DOMException && error.name === "AbortError"
      ? "REQUEST_TIMEOUT"
      : "INTERNAL_ERROR",
    message: error instanceof Error ? error.message : "Unknown error",
    httpStatus: 0,
    retryable: error instanceof DOMException && error.name === "AbortError",
  };
}
