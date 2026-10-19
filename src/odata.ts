import type { Page } from "./types.js";

export function quoteOData(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export function entityKey(value: string): string {
  return `(${quoteOData(value)})`;
}

export function artifactKey(id: string, version: string): string {
  return `(Id=${quoteOData(id)},Version=${quoteOData(version)})`;
}

export function equals(field: string, value: string): string {
  return `${field} eq ${quoteOData(value)}`;
}

export function encodeCursor(skip: number): string {
  return Buffer.from(JSON.stringify({ skip }), "utf8").toString("base64url");
}

export function decodeCursor(cursor?: string): number {
  if (!cursor) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Number.isSafeInteger((parsed as { skip?: unknown }).skip) ||
      Number((parsed as { skip: number }).skip) < 0
    ) {
      throw new Error();
    }
    return (parsed as { skip: number }).skip;
  } catch {
    throw new Error("Invalid pagination cursor");
  }
}

export function listQuery(options: {
  limit: number;
  cursor?: string;
  filters?: string[];
  orderBy?: string;
}): { query: string; skip: number } {
  const skip = decodeCursor(options.cursor);
  const params = new URLSearchParams({
    "$format": "json",
    "$top": String(options.limit),
    "$skip": String(skip),
  });
  if (options.filters?.length) params.set("$filter", options.filters.join(" and "));
  if (options.orderBy) params.set("$orderby", options.orderBy);
  return { query: params.toString(), skip };
}

export function unwrapEntity<T = unknown>(payload: unknown): T {
  if (payload && typeof payload === "object" && "d" in payload) {
    return (payload as { d: T }).d;
  }
  return payload as T;
}

export function unwrapPage<T = unknown>(
  payload: unknown,
  limit: number,
  skip: number,
): Page<T> {
  const root = unwrapEntity<unknown>(payload);
  const items = Array.isArray(root)
    ? root as T[]
    : root && typeof root === "object" && Array.isArray((root as { results?: unknown }).results)
      ? (root as { results: T[] }).results
      : [];
  return {
    items,
    ...(items.length === limit ? { nextCursor: encodeCursor(skip + items.length) } : {}),
  };
}
