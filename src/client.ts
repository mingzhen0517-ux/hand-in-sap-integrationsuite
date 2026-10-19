import { createHash } from "node:crypto";

import { createAuthProvider, type AuthProvider } from "./auth.js";
import { SapApiError } from "./errors.js";
import {
  artifactKey,
  entityKey,
  equals,
  listQuery,
  quoteOData,
  unwrapEntity,
  unwrapPage,
} from "./odata.js";
import type {
  AppConfig,
  BinaryResult,
  FetchLike,
  Page,
  RequestOptions,
} from "./types.js";

export interface ListOptions {
  limit: number;
  cursor?: string | undefined;
}

export interface MessageLogFilters extends ListOptions {
  integrationFlowName?: string | undefined;
  status?: string | undefined;
  correlationId?: string | undefined;
  messageGuid?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

function fileNameFromHeader(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try { return decodeURIComponent(encoded); } catch { /* use plain filename */ }
  }
  return header.match(/filename="?([^";]+)"?/i)?.[1] ?? fallback;
}

export function decodeBase64(value: string, maxBytes: number): Buffer {
  const compact = value.replace(/\s/g, "");
  if (!compact || compact.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) {
    throw new Error("Artifact content must be valid padded Base64");
  }
  const buffer = Buffer.from(compact, "base64");
  if (buffer.byteLength > maxBytes) {
    throw new Error(`Binary content exceeds SAP_MAX_BINARY_BYTES (${maxBytes})`);
  }
  return buffer;
}

export class SapCpiClient {
  readonly auth: AuthProvider;

  constructor(
    readonly config: AppConfig,
    private readonly fetchFn: FetchLike = fetch,
    auth?: AuthProvider,
  ) {
    this.auth = auth ?? createAuthProvider(config, fetchFn);
  }

  private url(path: string): string {
    return `${this.config.apiBaseUrl}/${path.replace(/^\/+/, "")}`;
  }

  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const authenticated = options.authenticated !== false;
    const execute = async (forceRefresh = false): Promise<Response> => {
      const headers = new Headers(options.headers);
      if (!headers.has("accept")) headers.set("accept", "application/json");
      if (authenticated) {
        headers.set("authorization", await this.auth.getAuthorization(forceRefresh));
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
      try {
        return await this.fetchFn(this.url(path), {
          method: options.method ?? "GET",
          headers,
          ...(options.body !== undefined ? { body: options.body } : {}),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    };

    let response = await execute();
    if (response.status === 401 && authenticated && this.auth.supportsRefresh) {
      response = await execute(true);
    }
    if (!response.ok) throw await SapApiError.fromResponse(response);
    if (response.status === 204) return undefined as T;

    if (options.responseType === "bytes") {
      const declared = Number(response.headers.get("content-length") ?? 0);
      if (declared > this.config.maxBinaryBytes) {
        throw new Error(`Binary response exceeds SAP_MAX_BINARY_BYTES (${this.config.maxBinaryBytes})`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.byteLength > this.config.maxBinaryBytes) {
        throw new Error(`Binary response exceeds SAP_MAX_BINARY_BYTES (${this.config.maxBinaryBytes})`);
      }
      return {
        bytes,
        headers: response.headers,
      } as T;
    }
    if (options.responseType === "text") return await response.text() as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  private async list<T = unknown>(
    entity: string,
    options: ListOptions,
    filters: string[] = [],
    orderBy?: string,
  ): Promise<Page<T>> {
    const queryOptions = {
      limit: options.limit,
      ...(options.cursor ? { cursor: options.cursor } : {}),
      ...(filters.length ? { filters } : {}),
      ...(orderBy ? { orderBy } : {}),
    };
    const { query, skip } = listQuery(queryOptions);
    const payload = await this.request(`${entity}?${query}`);
    return unwrapPage<T>(payload, options.limit, skip);
  }

  async checkConnection(): Promise<unknown> {
    const page = await this.list("IntegrationRuntimeArtifacts", { limit: 1 });
    return {
      connected: true,
      baseUrl: this.config.baseUrl,
      authType: this.config.authType,
      writeEnabled: this.config.allowWrite,
      sampleRuntimeArtifactCount: page.items.length,
    };
  }

  listPackages(options: ListOptions & { id?: string | undefined; name?: string | undefined }): Promise<Page> {
    const filters = [
      ...(options.id ? [equals("Id", options.id)] : []),
      ...(options.name ? [equals("Name", options.name)] : []),
    ];
    return this.list("IntegrationPackages", options, filters, "Name asc");
  }

  async getPackage(id: string): Promise<unknown> {
    return unwrapEntity(await this.request(`IntegrationPackages${entityKey(id)}?$format=json`));
  }

  async listIflows(options: ListOptions & { packageId: string; id?: string | undefined }): Promise<Page> {
    const filters = [
      ...(options.id ? [equals("Id", options.id)] : []),
    ];
    const page = await this.list(
      `IntegrationPackages${entityKey(options.packageId)}/IntegrationDesigntimeArtifacts`,
      options,
      filters,
    );
    return options.id
      ? { ...page, items: page.items.filter((item) =>
          item && typeof item === "object" && (item as { Id?: unknown }).Id === options.id) }
      : page;
  }

  async getIflow(packageId: string, id: string, version: string): Promise<unknown> {
    const page = await this.list<Record<string, unknown>>(
      `IntegrationPackages${entityKey(packageId)}/IntegrationDesigntimeArtifacts`,
      { limit: 200 },
      [equals("Id", id), equals("Version", version)],
    );
    const artifact = page.items.find((item) => item.Id === id && item.Version === version);
    if (!artifact) {
      throw new SapApiError({
        code: "IFLOW_NOT_FOUND",
        message: `iFlow ${id} version ${version} was not found in package ${packageId}`,
        httpStatus: 404,
        retryable: false,
      });
    }
    return artifact;
  }

  async downloadIflow(packageId: string, id: string, version: string): Promise<BinaryResult> {
    const response = await this.request<{ bytes: Buffer; headers: Headers }>(
      `IntegrationPackages${entityKey(packageId)}/IntegrationDesigntimeArtifacts${artifactKey(id, version)}/$value`,
      { responseType: "bytes" },
    );
    return this.binaryResult(
      response.bytes,
      fileNameFromHeader(response.headers.get("content-disposition"), `${id}-${version}.zip`),
      response.headers.get("content-type") ?? "application/zip",
    );
  }

  listRuntimeArtifacts(options: ListOptions & { id?: string | undefined; status?: string | undefined }): Promise<Page> {
    const filters = [
      ...(options.id ? [equals("Id", options.id)] : []),
      ...(options.status ? [equals("Status", options.status)] : []),
    ];
    return this.list("IntegrationRuntimeArtifacts", options, filters, "Id asc");
  }

  async getRuntimeArtifact(id: string): Promise<unknown> {
    return unwrapEntity(
      await this.request(`IntegrationRuntimeArtifacts${entityKey(id)}?$format=json`),
    );
  }

  listMessageLogs(options: MessageLogFilters): Promise<Page> {
    const filters = [
      ...(options.integrationFlowName
        ? [equals("IntegrationFlowName", options.integrationFlowName)] : []),
      ...(options.status ? [equals("Status", options.status)] : []),
      ...(options.correlationId ? [equals("CorrelationId", options.correlationId)] : []),
      ...(options.messageGuid ? [equals("MessageGuid", options.messageGuid)] : []),
      ...(options.from ? [`LogStart ge datetime${quoteOData(options.from)}`] : []),
      ...(options.to ? [`LogStart le datetime${quoteOData(options.to)}`] : []),
    ];
    return this.list("MessageProcessingLogs", options, filters, "LogStart desc");
  }

  async getMessageLog(messageGuid: string): Promise<unknown> {
    return unwrapEntity(
      await this.request(`MessageProcessingLogs${entityKey(messageGuid)}?$format=json`),
    );
  }

  async getMessageError(messageGuid: string): Promise<unknown> {
    const path = `MessageProcessingLogs${entityKey(messageGuid)}/ErrorInformation/$value`;
    const text = await this.request<string>(path, { responseType: "text" });
    return { messageGuid, available: Boolean(text), content: text || null };
  }

  listMessageAttachments(messageGuid: string, options: ListOptions): Promise<Page> {
    return this.list(
      `MessageProcessingLogs${entityKey(messageGuid)}/Attachments`,
      options,
      [],
      "Name asc",
    );
  }

  async getMessageAttachment(
    messageGuid: string,
    attachmentId: string,
    name?: string,
  ): Promise<BinaryResult> {
    const response = await this.request<{ bytes: Buffer; headers: Headers }>(
      `MessageProcessingLogs${entityKey(messageGuid)}/Attachments${entityKey(attachmentId)}/$value`,
      { responseType: "bytes" },
    );
    return this.binaryResult(
      response.bytes,
      fileNameFromHeader(response.headers.get("content-disposition"), name ?? attachmentId),
      response.headers.get("content-type") ?? "application/octet-stream",
    );
  }

  async getMessageDiagnostics(messageGuid: string): Promise<unknown> {
    const navigation = [
      ["customHeaderProperties", "CustomHeaderProperties"],
      ["adapterAttributes", "AdapterAttributes"],
      ["attachments", "Attachments"],
      ["runs", "Runs"],
    ] as const;
    const entries = await Promise.all(navigation.map(async ([key, segment]) => {
      try {
        const payload = await this.request(
          `MessageProcessingLogs${entityKey(messageGuid)}/${segment}?$format=json`,
        );
        const value = unwrapEntity(payload);
        return [key, { available: true, data: value }] as const;
      } catch (error) {
        if (error instanceof SapApiError && [400, 404].includes(error.details.httpStatus)) {
          return [key, {
            available: false,
            reason: "This diagnostic navigation is not exposed or not retained by the tenant",
          }] as const;
        }
        throw error;
      }
    }));
    return {
      messageGuid,
      ...Object.fromEntries(entries),
      payload: {
        available: false,
        reason: "CPI only exposes payloads that the integration flow persisted as log attachments",
      },
      trace: {
        available: false,
        reason: "No portable per-message trace endpoint is exposed; inspect retained runs and attachments",
      },
    };
  }

  listVariables(options: ListOptions & { name?: string | undefined; integrationFlow?: string | undefined }): Promise<Page> {
    const filters = [
      ...(options.name ? [equals("Name", options.name)] : []),
      ...(options.integrationFlow ? [equals("IntegrationFlow", options.integrationFlow)] : []),
    ];
    return this.list("Variables", options, filters, "Name asc");
  }

  listSecurityMaterials(options: ListOptions & { name?: string | undefined }): Promise<Page> {
    const filters = options.name ? [equals("Name", options.name)] : [];
    return this.list("SecurityContent", options, filters, "Name asc");
  }

  listKeystoreEntries(options: ListOptions & { alias?: string | undefined }): Promise<Page> {
    const filters = options.alias ? [equals("Alias", options.alias)] : [];
    return this.list("KeystoreEntries", options, filters, "Alias asc");
  }

  async uploadIflow(input: {
    mode: "create" | "update";
    id: string;
    version?: string | undefined;
    name?: string | undefined;
    packageId?: string | undefined;
    base64: string;
  }): Promise<unknown> {
    const bytes = decodeBase64(input.base64, this.config.maxBinaryBytes);
    const artifactContent = bytes.toString("base64");
    if (input.mode === "create") {
      if (!input.name || !input.packageId) {
        throw new Error("name and packageId are required when mode=create");
      }
      const result = await this.request("IntegrationDesigntimeArtifacts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          Id: input.id,
          Name: input.name,
          PackageId: input.packageId,
          ArtifactContent: artifactContent,
        }),
      });
      return unwrapEntity(result);
    }
    if (!input.version) throw new Error("version is required when mode=update");
    const result = await this.request(
      `IntegrationDesigntimeArtifacts${artifactKey(input.id, input.version)}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ArtifactContent: artifactContent }),
      },
    );
    return result === undefined ? { updated: true, id: input.id, version: input.version } : unwrapEntity(result);
  }

  async deployIflow(id: string, version: string): Promise<unknown> {
    return unwrapEntity(await this.request(
      `DeployIntegrationDesigntimeArtifact?Id=${encodeURIComponent(quoteOData(id))}&Version=${encodeURIComponent(quoteOData(version))}`,
      { method: "POST" },
    ));
  }

  async undeployIflow(id: string): Promise<unknown> {
    await this.request(`IntegrationRuntimeArtifacts${entityKey(id)}`, { method: "DELETE" });
    return { undeployed: true, id };
  }

  async startRuntimeArtifact(id: string): Promise<unknown> {
    const result = await this.request(
      `IntegrationRuntimeArtifacts${entityKey(id)}/Start`,
      { method: "POST" },
    );
    return result === undefined ? { started: true, id } : unwrapEntity(result);
  }

  async stopRuntimeArtifact(id: string): Promise<unknown> {
    const result = await this.request(
      `IntegrationRuntimeArtifacts${entityKey(id)}/Stop`,
      { method: "POST" },
    );
    return result === undefined ? { stopped: true, id } : unwrapEntity(result);
  }

  private binaryResult(bytes: Buffer, fileName: string, mimeType: string): BinaryResult {
    return {
      fileName,
      mimeType,
      sizeBytes: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      base64: bytes.toString("base64"),
    };
  }
}
