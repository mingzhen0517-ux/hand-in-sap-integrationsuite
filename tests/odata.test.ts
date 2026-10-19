import { describe, expect, it } from "vitest";

import {
  artifactKey,
  decodeCursor,
  encodeCursor,
  listQuery,
  quoteOData,
  unwrapPage,
} from "../src/odata.js";

describe("OData helpers", () => {
  it("escapes quotes in keys and filters", () => {
    expect(quoteOData("O'Reilly")).toBe("'O''Reilly'");
    expect(artifactKey("flow'1", "1.0")).toBe("(Id='flow''1',Version='1.0')");
  });

  it("round-trips opaque pagination cursors", () => {
    const cursor = encodeCursor(125);
    expect(cursor).not.toContain("125");
    expect(decodeCursor(cursor)).toBe(125);
    expect(() => decodeCursor("bad")) .toThrow("Invalid pagination cursor");
  });

  it("builds bounded OData list queries", () => {
    const { query, skip } = listQuery({
      limit: 50,
      cursor: encodeCursor(50),
      filters: ["Status eq 'FAILED'"],
      orderBy: "LogStart desc",
    });
    const params = new URLSearchParams(query);
    expect(params.get("$top")).toBe("50");
    expect(params.get("$skip")).toBe("50");
    expect(params.get("$filter")).toBe("Status eq 'FAILED'");
    expect(skip).toBe(50);
  });

  it("normalizes OData v2 pages and creates the next cursor", () => {
    const page = unwrapPage({ d: { results: [{ Id: "1" }, { Id: "2" }] } }, 2, 0);
    expect(page.items).toHaveLength(2);
    expect(decodeCursor(page.nextCursor)).toBe(2);
  });
});
