import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { SapCpiClient } from "./client.js";
import { normalizeError } from "./errors.js";
import type { AppConfig } from "./types.js";

export const READ_TOOL_NAMES = [
  "cpi_check_connection",
  "cpi_list_packages",
  "cpi_get_package",
  "cpi_list_iflows",
  "cpi_get_iflow",
  "cpi_download_iflow",
  "cpi_list_runtime_artifacts",
  "cpi_get_runtime_artifact",
  "cpi_list_message_logs",
  "cpi_get_message_log",
  "cpi_get_message_error",
  "cpi_list_message_attachments",
  "cpi_get_message_attachment",
  "cpi_get_message_diagnostics",
  "cpi_list_variables",
  "cpi_list_security_materials",
  "cpi_list_keystore_entries",
] as const;

export const WRITE_TOOL_NAMES = [
  "cpi_upload_iflow",
  "cpi_deploy_iflow",
  "cpi_undeploy_iflow",
  "cpi_start_runtime_artifact",
  "cpi_stop_runtime_artifact",
] as const;

const id = z.string().trim().min(1).max(512);
const version = z.string().trim().min(1).max(128);
const cursor = z.string().trim().min(1).optional();
const limit = z.number().int().min(1).max(200).default(50);
const listShape = { limit, cursor };

const readAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

function structured(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : { value };
}

async function safe(operation: () => Promise<unknown>) {
  try {
    const value = await operation();
    return {
      content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
      structuredContent: structured(value),
    };
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      isError: true,
      content: [{ type: "text" as const, text: JSON.stringify(normalized, null, 2) }],
      structuredContent: { error: normalized },
    };
  }
}

export function createMcpServer(
  config: AppConfig,
  client: SapCpiClient = new SapCpiClient(config),
): McpServer {
  const server = new McpServer({
    name: "sap-cloud-integration-mcp",
    version: "0.1.0",
  });

  server.registerTool("cpi_check_connection", {
    title: "Check CPI connection",
    description: "Validate SAP CPI authentication and API reachability without changing tenant state.",
    annotations: readAnnotations,
  }, () => safe(() => client.checkConnection()));

  server.registerTool("cpi_list_packages", {
    title: "List integration packages",
    description: "List SAP Cloud Integration design-time packages using structured filters.",
    inputSchema: z.object({
      ...listShape,
      id: id.optional(),
      name: z.string().trim().min(1).max(512).optional(),
    }),
    annotations: readAnnotations,
  }, (args) => safe(() => client.listPackages(args)));

  server.registerTool("cpi_get_package", {
    title: "Get integration package",
    description: "Get one SAP Cloud Integration package by its exact ID.",
    inputSchema: z.object({ id }),
    annotations: readAnnotations,
  }, ({ id }) => safe(() => client.getPackage(id)));

  server.registerTool("cpi_list_iflows", {
    title: "List iFlows",
    description: "List design-time integration flow artifacts in an exact package, optionally filtered by iFlow ID.",
    inputSchema: z.object({
      ...listShape,
      packageId: id,
      id: id.optional(),
    }),
    annotations: readAnnotations,
  }, (args) => safe(() => client.listIflows(args)));

  server.registerTool("cpi_get_iflow", {
    title: "Get iFlow metadata",
    description: "Get one design-time integration flow version through its package navigation.",
    inputSchema: z.object({ packageId: id, id, version }),
    annotations: readAnnotations,
  }, ({ packageId, id, version }) => safe(() => client.getIflow(packageId, id, version)));

  server.registerTool("cpi_download_iflow", {
    title: "Download iFlow ZIP",
    description: "Download an iFlow ZIP as Base64 with MIME type, byte length, and SHA-256. Enforces SAP_MAX_BINARY_BYTES.",
    inputSchema: z.object({ packageId: id, id, version }),
    annotations: readAnnotations,
  }, ({ packageId, id, version }) => safe(() => client.downloadIflow(packageId, id, version)));

  server.registerTool("cpi_list_runtime_artifacts", {
    title: "List runtime artifacts",
    description: "List deployed CPI runtime artifacts, optionally filtered by ID or status.",
    inputSchema: z.object({
      ...listShape,
      id: id.optional(),
      status: z.string().trim().min(1).max(128).optional(),
    }),
    annotations: readAnnotations,
  }, (args) => safe(() => client.listRuntimeArtifacts(args)));

  server.registerTool("cpi_get_runtime_artifact", {
    title: "Get runtime artifact",
    description: "Get the deployment and runtime status of one CPI artifact.",
    inputSchema: z.object({ id }),
    annotations: readAnnotations,
  }, ({ id }) => safe(() => client.getRuntimeArtifact(id)));

  server.registerTool("cpi_list_message_logs", {
    title: "List message processing logs",
    description: "List CPI message processing logs using bounded structured filters. Results may contain business metadata.",
    inputSchema: z.object({
      ...listShape,
      integrationFlowName: z.string().trim().min(1).max(512).optional(),
      status: z.string().trim().min(1).max(128).optional(),
      correlationId: id.optional(),
      messageGuid: id.optional(),
      from: z.iso.datetime({ offset: true }).optional(),
      to: z.iso.datetime({ offset: true }).optional(),
    }),
    annotations: readAnnotations,
  }, (args) => safe(() => client.listMessageLogs(args)));

  server.registerTool("cpi_get_message_log", {
    title: "Get message processing log",
    description: "Get a single CPI message processing log by MessageGuid.",
    inputSchema: z.object({ messageGuid: id }),
    annotations: readAnnotations,
  }, ({ messageGuid }) => safe(() => client.getMessageLog(messageGuid)));

  server.registerTool("cpi_get_message_error", {
    title: "Get message error",
    description: "Return retained error information for a CPI message processing log.",
    inputSchema: z.object({ messageGuid: id }),
    annotations: readAnnotations,
  }, ({ messageGuid }) => safe(() => client.getMessageError(messageGuid)));

  server.registerTool("cpi_list_message_attachments", {
    title: "List message log attachments",
    description: "List attachment metadata retained for a CPI message. Attachments may contain sensitive business data.",
    inputSchema: z.object({ messageGuid: id, ...listShape }),
    annotations: readAnnotations,
  }, ({ messageGuid, ...options }) => safe(
    () => client.listMessageAttachments(messageGuid, options),
  ));

  server.registerTool("cpi_get_message_attachment", {
    title: "Get message log attachment",
    description: "Return one retained message attachment as Base64. The content may contain sensitive business data.",
    inputSchema: z.object({
      messageGuid: id,
      attachmentId: id,
      name: z.string().trim().min(1).max(1024).optional(),
    }),
    annotations: readAnnotations,
  }, ({ messageGuid, attachmentId, name }) => safe(
    () => client.getMessageAttachment(messageGuid, attachmentId, name),
  ));

  server.registerTool("cpi_get_message_diagnostics", {
    title: "Get message diagnostics",
    description: "Aggregate official CPI diagnostic navigations such as custom headers, adapter attributes, attachments, and runs. Missing or unretained content is reported as unavailable.",
    inputSchema: z.object({ messageGuid: id }),
    annotations: readAnnotations,
  }, ({ messageGuid }) => safe(() => client.getMessageDiagnostics(messageGuid)));

  server.registerTool("cpi_list_variables", {
    title: "List CPI variables",
    description: "List CPI variable metadata and values exposed by the caller's SAP authorization.",
    inputSchema: z.object({
      ...listShape,
      name: z.string().trim().min(1).max(512).optional(),
      integrationFlow: id.optional(),
    }),
    annotations: readAnnotations,
  }, (args) => safe(() => client.listVariables(args)));

  server.registerTool("cpi_list_security_materials", {
    title: "List security material metadata",
    description: "List security content metadata only. This tool never requests password, secret, or private-key values.",
    inputSchema: z.object({
      ...listShape,
      name: z.string().trim().min(1).max(512).optional(),
    }),
    annotations: readAnnotations,
  }, (args) => safe(() => client.listSecurityMaterials(args)));

  server.registerTool("cpi_list_keystore_entries", {
    title: "List keystore entry metadata",
    description: "List CPI keystore entry metadata without downloading private keys.",
    inputSchema: z.object({
      ...listShape,
      alias: z.string().trim().min(1).max(512).optional(),
    }),
    annotations: readAnnotations,
  }, (args) => safe(() => client.listKeystoreEntries(args)));

  if (config.allowWrite) registerWriteTools(server, client);
  return server;
}

function registerWriteTools(server: McpServer, client: SapCpiClient): void {
  server.registerTool("cpi_upload_iflow", {
    title: "Create or update iFlow",
    description: "Create or update an iFlow from a Base64 ZIP. Only available when SAP_ALLOW_WRITE=true.",
    inputSchema: z.object({
      mode: z.enum(["create", "update"]),
      id,
      version: version.optional(),
      name: z.string().trim().min(1).max(512).optional(),
      packageId: id.optional(),
      base64: z.string().min(4),
    }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  }, (args) => safe(() => client.uploadIflow(args)));

  server.registerTool("cpi_deploy_iflow", {
    title: "Deploy iFlow",
    description: "Deploy one design-time iFlow version. Only available when SAP_ALLOW_WRITE=true.",
    inputSchema: z.object({ id, version }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  }, ({ id, version }) => safe(() => client.deployIflow(id, version)));

  server.registerTool("cpi_undeploy_iflow", {
    title: "Undeploy iFlow",
    description: "Undeploy an iFlow from the runtime. This interrupts message processing and requires SAP_ALLOW_WRITE=true.",
    inputSchema: z.object({ id }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  }, ({ id }) => safe(() => client.undeployIflow(id)));

  server.registerTool("cpi_start_runtime_artifact", {
    title: "Start runtime artifact",
    description: "Start a CPI runtime artifact. Only available when SAP_ALLOW_WRITE=true.",
    inputSchema: z.object({ id }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  }, ({ id }) => safe(() => client.startRuntimeArtifact(id)));

  server.registerTool("cpi_stop_runtime_artifact", {
    title: "Stop runtime artifact",
    description: "Stop a CPI runtime artifact. This interrupts message processing and requires SAP_ALLOW_WRITE=true.",
    inputSchema: z.object({ id }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  }, ({ id }) => safe(() => client.stopRuntimeArtifact(id)));
}
