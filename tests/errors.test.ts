import { describe, expect, it } from "vitest";

import { redact, SapApiError } from "../src/errors.js";

describe("SAP error normalization", () => {
  it("extracts OData errors, request IDs, and redacts secrets", async () => {
    const response = new Response(JSON.stringify({
      error: {
        code: "CPI_ERROR",
        message: { value: "Deployment failed" },
        innererror: { clientSecret: "do-not-leak" },
      },
    }), {
      status: 500,
      headers: {
        "content-type": "application/json",
        "x-correlationid": "request-1",
      },
    });
    const error = await SapApiError.fromResponse(response);
    expect(error.toJSON()).toMatchObject({
      code: "CPI_ERROR",
      message: "Deployment failed",
      httpStatus: 500,
      requestId: "request-1",
      retryable: true,
    });
    expect(JSON.stringify(error.toJSON())).not.toContain("do-not-leak");
  });

  it("redacts sensitive fields recursively", () => {
    expect(redact({ nested: { password: "x", value: "ok" }, accessToken: "y" }))
      .toEqual({ nested: { password: "[REDACTED]", value: "ok" }, accessToken: "[REDACTED]" });
  });
});
