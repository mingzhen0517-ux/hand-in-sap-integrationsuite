# SAP Cloud Integration API catalog

This server intentionally exposes a curated subset of the SAP Cloud Integration OData v2 API under `/api/v1`. It is not a generic URL proxy. Entity names and operations below match the public Cloud Integration API surface; availability still depends on tenant version, activated capabilities, and the roles granted to the technical user.

The canonical documentation is the **Cloud Integration OData API** section in [SAP Help Portal – Integration Suite](https://help.sap.com/docs/integration-suite) and the API specifications published in [SAP Business Accelerator Hub](https://api.sap.com/package/CloudIntegrationAPI/overview). Confirm the specification for the target tenant before enabling write tools.

## Tool mapping

| MCP tool | SAP API resource or operation | Access | Notes |
|---|---|---:|---|
| `cpi_check_connection` | `GET IntegrationRuntimeArtifacts` | Read | Requests one item to verify host, credentials, and API role. |
| `cpi_list_packages` | `GET IntegrationPackages` | Read | Structured ID/name filters and bounded paging. |
| `cpi_get_package` | `GET IntegrationPackages('{Id}')` | Read | Exact package ID. |
| `cpi_list_iflows` | `GET IntegrationPackages('{PackageId}')/IntegrationDesigntimeArtifacts` | Read | Package ID is required because the top-level entity set may be write-only. |
| `cpi_get_iflow` | Filtered package navigation | Read | Exact package, artifact ID, and design-time version. |
| `cpi_download_iflow` | `GET IntegrationPackages(...)/IntegrationDesigntimeArtifacts(...)/$value` | Read | ZIP returned as Base64; local byte limit applies. |
| `cpi_list_runtime_artifacts` | `GET IntegrationRuntimeArtifacts` | Read | Deployment/runtime inventory. |
| `cpi_get_runtime_artifact` | `GET IntegrationRuntimeArtifacts('{Id}')` | Read | Exact runtime artifact ID. |
| `cpi_list_message_logs` | `GET MessageProcessingLogs` | Read | Supports status, flow, correlation, GUID, and time filters. |
| `cpi_get_message_log` | `GET MessageProcessingLogs('{MessageGuid}')` | Read | Message-log metadata. |
| `cpi_get_message_error` | `GET MessageProcessingLogs(...)/ErrorInformation/$value` | Read | Only available when error information was retained. |
| `cpi_list_message_attachments` | `GET MessageProcessingLogs(...)/Attachments` | Read | Metadata may reveal business context. |
| `cpi_get_message_attachment` | `GET MessageProcessingLogs(...)/Attachments('{Id}')/$value` | Read | Raw attachment as Base64; may contain sensitive data. |
| `cpi_get_message_diagnostics` | MPL navigation: `CustomHeaderProperties`, `AdapterAttributes`, `Attachments`, `Runs` | Read | Each tenant-dependent navigation reports `available=false` on HTTP 400/404. Arbitrary payloads are not promised. |
| `cpi_list_variables` | `GET Variables` | Read | Returns only fields exposed by SAP and the caller's roles. |
| `cpi_list_security_materials` | `GET SecurityContent` | Read | Metadata only; no endpoint for secret/private-key values is called. |
| `cpi_list_keystore_entries` | `GET KeystoreEntries` | Read | Metadata only. |
| `cpi_upload_iflow` | `POST` or `PUT IntegrationDesigntimeArtifacts(...)` | Write | Sends the ZIP as the OData `ArtifactContent` (`Edm.Binary`) Base64 field. SAP generates the initial version. |
| `cpi_deploy_iflow` | `POST DeployIntegrationDesigntimeArtifact` | Write | Requires exact ID and version. |
| `cpi_undeploy_iflow` | `DELETE IntegrationRuntimeArtifacts('{Id}')` | Write/impact | Removes only the deployed runtime instance; it does not delete design-time content. |
| `cpi_start_runtime_artifact` | `POST IntegrationRuntimeArtifacts('{Id}')/Start` | Write | Tenant support and role required. |
| `cpi_stop_runtime_artifact` | `POST IntegrationRuntimeArtifacts('{Id}')/Stop` | Write/impact | Interrupts message processing. |

## Authentication and roles

- OAuth2 uses the client-credentials grant. The client ID and secret are sent only to `SAP_TOKEN_URL`; the resulting bearer token is cached and refreshed once after an API HTTP 401.
- Basic authentication is provided for compatible tenants. Prefer OAuth2 for production use.
- Required role collections depend on the operations used. Grant read-only monitoring/design roles for the default mode and deployment/lifecycle roles only when write tools are enabled.
- HTTP authorization headers, cookies, passwords, client secrets, and token fields are never included in normalized error details.

## Deliberate exclusions

- No arbitrary URL, raw OData filter, or generic HTTP-request tool.
- No deletion of packages, design-time iFlows, variables, credentials, certificates, or keystore entries.
- No API Management, Event Mesh, Trading Partner Management, Integration Advisor, or Open Connectors APIs.
- No promise to retrieve a business payload or trace that CPI did not persist. Payloads explicitly logged as MPL attachments can be retrieved through the attachment tool.
- No private-key, password, secure-parameter, or credential-secret retrieval.

## Tenant-dependent behavior

SAP has changed and extended the Cloud Integration API over time. An older tenant may return HTTP 400/404 for optional MPL navigations or runtime lifecycle actions. Read diagnostics represent optional content as unavailable; lifecycle failures are returned as normalized errors and are never silently ignored.
