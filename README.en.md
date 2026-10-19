# SAP Cloud Integration MCP Server

[![Node.js](https://img.shields.io/badge/node-%3E%3D20-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-1.30-purple.svg)](https://modelcontextprotocol.io/)

[ [中文](README.md) | **English** | [日本語](README.ja.md) | [한국어](README.ko.md) ]

An enterprise-grade local stdio server based on the standard **Model Context Protocol (MCP)**, specifically tailored for **SAP Cloud Integration (CPI / SAP Integration Suite)**.

It exposes the capabilities of the SAP BTP Cloud Integration platform directly to modern AI coding assistants (such as OpenAI Codex, Claude Desktop, Cursor, etc.). **Anchored in the SAP Clean Core strategy and SAP Best Practices, it empowers intelligent transformation across the full lifecycle of enterprise integration and accelerates "Vibe Coding" delivery.**

### 🌟 Strategic Highlights

1. 🏛️ **Clean Core Hub (Keep the Core Clean)**:
   - **Zero Core Modification**: Completely eliminate legacy habits such as writing custom Z-programs, reading/writing underlying physical tables directly in S/4HANA/ERP cores, or establishing fragile point-to-point RFC connections. Heterogeneous system decoupling, multi-protocol conversion, message sanitization, and orchestration are offloaded to SAP Integration Suite.
   - **Released Standard APIs First**: Exclusively interact with standard OData v2/v4, REST, SOAP interfaces, and enterprise business events (SAP Event Mesh) published on the [SAP Business Accelerator Hub](https://api.sap.com), ensuring smooth core system upgrades.

2. 🏆 **SAP Integration Best Practices**:
   - **Standard Content First**: Maximize reuse of pre-packaged Integration Packages from the Content Hub to avoid redundant implementation.
   - **100% Externalized Configuration**: Hostnames, paths, credentials, and timeout settings are externalized (`parameters.prop`), strictly prohibiting hardcoded values.
   - **Stream-Safe Groovy Programming**: Prohibit full-memory loading of large payloads (preventing JVM OOM); mandate streaming readers (`Reader` / `InputStream`) with defensive null-checks and strict data leak controls.
   - **High Availability & Resilience**: Standardize Exception Subprocesses, ProcessDirect micro-flow modularization, Idempotent Receivers, and JMS dead-letter store-and-forward queues.

3. 🤖 **Trinity Sub-Agent Architecture (Design · Dev · Test Closed Loop)**:
   - Specialized Sub-Agents for **Design**, **Dev**, and **Test**, orchestrating 22 native MCP tools:
     - **[🏛️ Architecture & Design Sub-Agent (`cpi-design-agent`)](agents/cpi-design-agent.md)**: Clean Core compliance evaluation, standard API/event selection, externalized parameter contracts, and resilient blueprinting.
     - **[🛠️ Development & Build Sub-Agent (`cpi-dev-agent`)](agents/cpi-dev-agent.md)**: iFlow assembly, stream-safe Groovy scripting, Base64 ZIP packaging, and natural-language-driven Vibe Coding hot-patching and deployment.
     - **[🔬 Quality & Testing Sub-Agent (`cpi-test-agent`)](agents/cpi-test-agent.md)**: Runtime readiness inspection (`STARTED` gate), end-to-end testing, live MPL tracking, error stack drill-down (ErrorInformation), payload attachment validation, and Clean Core audit.

4. 🔄 **Integrated Dev/Deploy/Verify ("Vibe Coding" in Seconds)**:
   - Condense the fragmented workflow of "local scripting ➔ manual zip ➔ web upload ➔ click deploy ➔ poll monitoring logs" into a single natural conversation loop. The AI retrieves source code, patches it in place, packs, uploads, deploys, and fetches live MPL logs for automated self-verification.

5. 🛡️ **Enterprise Security Guardrails**:
   - Write-permission gating (`SAP_ALLOW_WRITE`), read-only Security Material/Keystore metadata (never exposing passwords or private keys), strict schema validation against injections, and memory caps on binary transfers.

---

## Table of Contents

- [Core Capabilities](#core-capabilities)
- [SAP Clean Core Strategy & Best Practice Principles](#sap-clean-core-strategy--best-practice-principles)
- [Trinity Sub-Agent Architecture (Design · Dev · Test)](#trinity-sub-agent-architecture-design--dev--test)
- [Security Architecture & Governance](#security-architecture--governance)
- [Prerequisites](#prerequisites)
- [Installation & Build](#installation--build)
- [Configuration](#configuration)
- [Configuring in MCP Clients](#configuring-in-mcp-clients)
- [Vibe Coding: Rapid CPI Development & Validation](#vibe-coding-rapid-cpi-development--validation)
  - [What is Vibe Coding in SAP CPI?](#what-is-vibe-coding-in-sap-cpi)
  - [The Four-Step Vibe Loop](#the-four-step-vibe-loop)
  - [Walkthrough: Natural Language Hot-Fix](#walkthrough-natural-language-hot-fix)
  - [Pro Tips for Vibe Coding](#pro-tips-for-vibe-coding)
- [Practical Walkthroughs & Use Cases](#practical-walkthroughs--use-cases)
  - [Scenario 1: Connectivity Verification & Tenant Asset Inventory](#scenario-1-connectivity-verification--tenant-asset-inventory)
  - [Scenario 2: Creating, Uploading, and Deploying an iFlow from Scratch](#scenario-2-creating-uploading-and-deploying-an-iflow-from-scratch)
  - [Scenario 3: Production Message Troubleshooting & Diagnostics](#scenario-3-production-message-troubleshooting--diagnostics)
  - [Scenario 4: Exporting/Backing Up iFlow Source ZIP](#scenario-4-exportingbacking-up-iflow-source-zip)
- [Tool Reference Matrix](#tool-reference-matrix)
- [FAQ & Troubleshooting](#faq--troubleshooting)
- [Contributing & Development](#contributing--development)

---

## Core Capabilities

The server registers **22 dedicated MCP tools** (17 read-only discovery tools + 5 write/deploy management tools):

### 1. Asset Inventory & Tenant Overview
- **Health Check**: Validate OAuth2 token acquisition and tenant connectivity in sub-seconds (`cpi_check_connection`).
- **Integration Packages**: Query packages by ID, name, or metadata with pagination (`cpi_list_packages`, `cpi_get_package`).
- **Security & Global Configuration**: Inspect User/OAuth credentials metadata, Keystore certificates metadata, and tenant global variables (`cpi_list_security_materials`, `cpi_list_keystore_entries`, `cpi_list_variables`).

### 2. Design-Time iFlow Lifecycle
- **iFlow Discovery**: Enumerate all design-time artifacts in a package and inspect versioned metadata (`cpi_list_iflows`, `cpi_get_iflow`).
- **Source Import & Export**: Create or update iFlow artifacts using Base64-encoded ZIP bundles (`cpi_upload_iflow`), or export full source packages (`cpi_download_iflow`).

### 3. Runtime Operations & Deployment
- **Instant Deployment**: Trigger server-side compilation and deploy an iFlow to runtime (`cpi_deploy_iflow`).
- **Runtime Monitoring**: Check live artifact status (`STARTED` / `STOPPED` / `ERROR`) (`cpi_list_runtime_artifacts`, `cpi_get_runtime_artifact`).
- **Lifecycle Control**: Start, stop, or undeploy runtime artifacts on demand (`cpi_start_runtime_artifact`, `cpi_stop_runtime_artifact`, `cpi_undeploy_iflow`).

### 4. Message Processing Logs & Diagnostics (MPL)
- **Multi-Dimensional MPL Search**: Filter message logs by time range, status (`FAILED` / `COMPLETED`), iFlow identifier, `MessageGuid`, or `CorrelationId` (`cpi_list_message_logs`, `cpi_get_message_log`).
- **Error Stack Drill-Down**: Retrieve detailed root-cause error information and Java stack traces (`cpi_get_message_error`).
- **Diagnostic Bundles & Payloads**: Fetch payload attachments (`cpi_list_message_attachments`, `cpi_get_message_attachment`) or compile execution steps, adapter properties, and custom headers in one call (`cpi_get_message_diagnostics`).

---

## SAP Clean Core Strategy & Best Practice Principles

In modern enterprise architectures, **Clean Core** protects S/4HANA and ERP cores, enabling rapid innovation, low upgrade costs, and business agility.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      SAP Clean Core Architecture                       │
├────────────────────────────────────────────────────────────────────────┤
│  [External SaaS / Third-Party] ──(REST / OData / Events)──┐            │
│                                                           ▼            │
│                 ┌─────────────────────────────────────────┐            │
│                 │      SAP Integration Suite (CPI)        │            │
│                 │ ─────────────────────────────────────── │            │
│                 │ • Protocol Translation / Mapping / Routing│          │
│                 │ • Security Materials & Credential Isolation│         │
│                 │ • Async Queue Buffering & Idempotency   │            │
│                 │ • Stream-Safe Groovy & XSLT Processing  │            │
│                 └────────────────────┬────────────────────┘            │
│                                      │                                 │
│                   Released APIs (OData v2/v4, Events)                  │
│                                      ▼                                 │
│                 ┌─────────────────────────────────────────┐            │
│                 │           SAP S/4HANA (Clean Core)      │            │
│                 │ ─────────────────────────────────────── │            │
│                 │ Core Business Transaction Logic         │            │
│                 │ [Zero DB Table Hacks | Zero Custom RFC] │            │
│                 └─────────────────────────────────────────┘            │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Zero Core Modification**: Protocol bridging, field mappings, validation, signing, and retry policies are fully handled in SAP Integration Suite.
2. **Released APIs First**: Rely exclusively on SAP standard released interfaces to ensure seamless SAP upgrades.
3. **100% Parameter Externalization**: All endpoints, aliases, and timeouts must be externalized for zero-code environmental migration.
4. **Safe Groovy & Streaming**: Mandate streaming input readers to eliminate JVM OOM crashes, masking sensitive data in logs.

---

## Trinity Sub-Agent Architecture (Design · Dev · Test)

To elevate AI from simple task execution to full enterprise-grade lifecycle orchestration, this repository establishes a **Trinity Sub-Agent Architecture** (see [`agents/`](agents/) and [`AGENTS.md`](AGENTS.md)):

```
               ┌─────────────────────────────────────────────────────────┐
               │         Integration Objective & Intent Prompt           │
               └────────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │ 🏛️ cpi-design-agent (Architecture & Design Sub-Agent)   │
               │ • Clean Core compliance assessment & API selection      │
               │ • Package asset reuse check & iFlow blueprinting        │
               │ • Externalized parameters & fault tolerance design      │
               │ ➔ Deliverable: Interface Architecture Specification     │
               └────────────────────────────┬────────────────────────────┘
                                            │ Architecture Hand-off
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │ 🛠️ cpi-dev-agent (Development & Build Sub-Agent)         │
               │ • Assemble iFlow, bind parameters & Exception Subprocess│
               │ • Stream-safe Groovy coding & Base64 ZIP packaging      │
               │ • Deploy & trigger runtime compilation                  │
               │ ➔ Deliverable: Deployment Report & Modified Artifacts   │
               └────────────────────────────┬────────────────────────────┘
                                            │ Deployment Hand-off
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │ 🔬 cpi-test-agent (Quality & Testing Sub-Agent)         │
               │ • Readiness gate: cpi_get_runtime_artifact (STARTED)    │
               │ • MPL live tracking: cpi_list_message_logs              │
               │ • Error drill-down: cpi_get_message_error               │
               │ • Boundary tests & Clean Core compliance audit          │
               │ ➔ Deliverable: Test Acceptance Certification / Bug Ticket│
               └────────────────────────────┬────────────────────────────┘
                                            │
                   ┌────────────────────────┴────────────────────────┐
                   ▼                                                 ▼
             [Test Failed]                                   [Test Passed]
      Feedback to cpi-dev-agent                         Archive & Production Rollout
```

### 1. [🏛️ CPI Design Agent (Architecture & Design)](agents/cpi-design-agent/prompt.md)
- **Contracts & Specs**: [`agent.json`](agents/cpi-design-agent/agent.json) · [`prompt.md`](agents/cpi-design-agent/prompt.md) · [`contract.md`](agents/cpi-design-agent/contract.md) · [`schema.json`](agents/cpi-design-agent/schema.json)
- **Check Script**: [`check-clean-core.mjs`](agents/cpi-design-agent/scripts/check-clean-core.mjs)
- **Role**: SAP Integration Architect & Clean Core Advisor.
- **Write Scope**: Restricted to `docs/design/**` and `specs/**`. No write access to tenant tools.

### 2. [🛠️ CPI Dev Agent (Development & Build)](agents/cpi-dev-agent/prompt.md)
- **Contracts & Specs**: [`agent.json`](agents/cpi-dev-agent/agent.json) · [`prompt.md`](agents/cpi-dev-agent/prompt.md) · [`contract.md`](agents/cpi-dev-agent/contract.md) · [`schema.json`](agents/cpi-dev-agent/schema.json)
- **Helper Scripts**: [`check-groovy-stream.mjs`](agents/cpi-dev-agent/scripts/check-groovy-stream.mjs) · [`pack-iflow.mjs`](agents/cpi-dev-agent/scripts/pack-iflow.mjs)
- **Role**: Senior CPI Integration Engineer & Vibe Coding Specialist.
- **Write Scope**: Restricted to `workspace/iflows/**` and `src/scripts/**`.

### 3. [🔬 CPI Test Agent (Quality & Testing)](agents/cpi-test-agent/prompt.md)
- **Contracts & Specs**: [`agent.json`](agents/cpi-test-agent/agent.json) · [`prompt.md`](agents/cpi-test-agent/prompt.md) · [`contract.md`](agents/cpi-test-agent/contract.md) · [`schema.json`](agents/cpi-test-agent/schema.json)
- **Diagnostic Script**: [`format-mpl-report.mjs`](agents/cpi-test-agent/scripts/format-mpl-report.mjs)
- **Role**: Integration QA Engineer & Runtime Diagnostics Expert.
- **Write Scope**: Restricted to `test-reports/**`. Read-only diagnostics on tenant.

---

### 🛡️ Sub-Agent Orchestration Mandates

1. **Scope & Boundaries**: Agents must operate within disjoint, whitelisted directory boundaries. Destructive actions (`git reset --hard`, `rm -rf`, unauthorized commits) are strictly prohibited.
2. **Context Minimization**: Avoid dumping raw chat transcripts. Provide only current goals, referenced files, and precise constraints.
3. **Deterministic Output Contracts**: Responses must omit small talk and conclude with a strict JSON block validated against the respective `schema.json`.
4. **Circuit Breaker**: A hard limit of 3 consecutive retry attempts is enforced. On the 3rd failure, mark status as `BLOCKED` and escalate with root causes.
5. **Disjoint Write Sets**: Parallel agent execution requires mutually exclusive write boundaries coordinated by the orchestrator.

---

## Security Architecture & Governance

1. **Read-Only by Default**: Destructive or mutative tools (`cpi_upload_iflow`, `cpi_deploy_iflow`, `cpi_undeploy_iflow`) are omitted from registration unless `SAP_ALLOW_WRITE=true` is explicitly set.
2. **Zero Sensitive Credential Exposure**: Security Materials and Keystores expose only metadata. Secrets, passwords, and private keys cannot be exported.
3. **Strict Parameter Validation**: Built with Zod; cursor parameters are validated against Base64URL to prevent raw OData injection.
4. **Binary & Memory Limits**: Default 25 MiB cap (`SAP_MAX_BINARY_BYTES`) on ZIP transfers prevents memory exhaustion.
5. **stdio Stream Isolation**: JSON-RPC is kept clean on `stdout`; all telemetry and connection logs are directed exclusively to `stderr`.

---

## Prerequisites

- **Node.js**: >= 20.6.0 (for native `.env` loading).
- **SAP BTP Credentials**:
  - Service Key for `Process Integration Runtime` (plan: `api`).
  - Required fields: `clientid`, `clientsecret`, `tokenurl`, and tenant base URL.
  - Adequate roles (e.g. `AuthGroup_Administrator`, `AuthGroup_IntegrationDeveloper`).

---

## Installation & Build

```bash
# 1. Clone repository
cd hand-in-sap-integrationsuite

# 2. Install dependencies
npm install

# 3. Run typecheck & tests
npm run typecheck
npm test

# 4. Build executable
npm run build
```

Compiled output is located at `dist/index.js`.

---

## Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure `.env` using your Service Key details:

```properties
# Cloud Integration Tenant URL (without /api/v1)
SAP_CPI_BASE_URL=https://<your-tenant>.it-cpi001.cfapps.<region>.hana.ondemand.com

# Authentication type: oauth2 (strongly recommended) or basic
SAP_AUTH_TYPE=oauth2

# OAuth2 credentials (from BTP Service Key)
SAP_TOKEN_URL=https://<your-subdomain>.authentication.<region>.hana.ondemand.com/oauth/token
SAP_CLIENT_ID=sb-xxxx!bxxxx|it!bxxxx
SAP_CLIENT_SECRET=xxxx-xxxx-xxxx$xxxx

# Enable write & deploy tools
SAP_ALLOW_WRITE=true

# Timeouts & binary limits
SAP_REQUEST_TIMEOUT_MS=30000
SAP_MAX_BINARY_BYTES=26214400
```

---

## Configuring in MCP Clients

### 1. Codex (CLI / Desktop)

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.sap_cpi]
command = "node"
args = ["/ABSOLUTE_PATH/hand-in-sap-integrationsuite/dist/index.js"]
cwd = "/ABSOLUTE_PATH/hand-in-sap-integrationsuite"
```

### 2. Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "sap-cpi": {
      "command": "node",
      "args": ["/ABSOLUTE_PATH/hand-in-sap-integrationsuite/dist/index.js"],
      "cwd": "/ABSOLUTE_PATH/hand-in-sap-integrationsuite"
    }
  }
}
```

---

## Vibe Coding: Rapid CPI Development & Validation

### What is Vibe Coding in SAP CPI?

In traditional SAP Cloud Integration, developers navigate heavy Web UIs:
> *Open BTP ➔ Open Designer ➔ Drag BPMN nodes ➔ Configure adapter properties ➔ Debug Groovy in browser ➔ Click Deploy ➔ Switch to Monitor ➔ Refresh repeatedly for MPL logs ➔ Read errors and switch back...*

**With this MCP server and modern AI assistants, you enter the "Vibe Coding" era:**

**"Express business requirements in natural language without opening the browser. The AI writes Groovy, configures BPMN, packages ZIPs, pushes to the tenant, deploys, and verifies live MPL logs within 10 seconds."**

---

### The Four-Step Vibe Loop

```text
  ┌──────────────────────────────────────────────────────────────┐
  │                 1. Intent & Prompt (Vibe)                    │
  │    Describe integration logic, field mappings, or policies   │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │             2. In-Place Fast Patch                           │
  │  Download iFlow ➔ AI edits Groovy/BPMN ➔ Pack ZIP ➔ Upload    │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                 3. Instant Deploy                            │
  │      Trigger cpi_deploy_iflow ➔ Poll runtime until STARTED   │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │         4. Automated Verification & Healing                  │
  │   Send test message ➔ Inspect live MPL (cpi_list_message_logs)│
  │   On failure: fetch error stack & auto-heal in loop          │
  └──────────────────────────────────────────────────────────────┘
```

---

### Walkthrough: Natural Language Hot-Fix

#### Scenario: Add payload masking and tracking headers to an existing iFlow

> **Developer:**
> *"Modify `SimpleTestIflow`: Add a Groovy script to mask the middle 4 digits of phone numbers (e.g. 138****1234) in the JSON body, and set a header `X-Processed-By: Codex-AI`. Deploy it and verify runtime status."*

> **AI Assistant (Automated Execution):**
> 1. Calls `cpi_download_iflow` to download current package.
> 2. Extracts locally and creates `src/main/resources/script/maskData.groovy`:
>    ```groovy
>    import com.sap.gateway.ip.core.customdev.util.Message
>    import groovy.json.JsonSlurper
>    import groovy.json.JsonOutput
>
>    def Message processData(Message message) {
>        def body = message.getBody(String)
>        def json = new JsonSlurper().parseText(body)
>        if (json.phone && json.phone.length() == 11) {
>            json.phone = json.phone.substring(0, 3) + "****" + json.phone.substring(7)
>        }
>        message.setBody(JsonOutput.toJson(json))
>        message.setHeader("X-Processed-By", "Codex-AI")
>        return message
>    }
>    ```
> 3. Updates BPMN `.iflw` with the new script node and sequence flow.
> 4. Bundles into ZIP and calls `cpi_upload_iflow(mode: "update", id: "SimpleTestIflow", ...)`.
> 5. Calls `cpi_deploy_iflow`.
> 6. Polls `cpi_get_runtime_artifact` until status is `STARTED` and responds:
>    > *"Patch applied! Groovy script integrated, version 1.0.1 deployed successfully with status STARTED."*

> **Developer:**
> *"Send a test payload and verify the MPL log."*

> **AI Assistant:**
> 1. Sends HTTP test payload `{"phone":"13812345678"}`.
> 2. Calls `cpi_list_message_logs({ integrationFlowName: "SimpleTestIflow", limit: 1 })`.
> 3. Confirms `COMPLETED` status, checks header `X-Processed-By: Codex-AI` via `cpi_get_message_diagnostics`.
> 4. Verification completed in seconds!

---

### Pro Tips for Vibe Coding

1. **Test-Driven Iteration**: Keep test-and-deploy cycles tight. Deploy each small change and immediately check logs with `cpi_list_message_logs`.
2. **Local Git Tracking**: Commit before and after downloading or patching iFlows to easily diff and revert changes locally.
3. **Automated Error Healing**: If a message fails, simply say: *"Check the error log for the latest failed message, fix the script, and redeploy."* The AI inspects `cpi_get_message_error` and patches the root cause automatically!

---

## Practical Walkthroughs & Use Cases

### Scenario 1: Connectivity Verification & Tenant Asset Inventory

**Goal**: Verify tenant connectivity and discover packages and security credentials.

1. **Prompt**:
   > "Check the SAP CPI tenant connectivity, and list available packages and security credentials."
2. **AI Action Sequence**:
   - Calls `cpi_check_connection`.
   - Calls `cpi_list_packages({ limit: 10 })`.
   - Calls `cpi_list_security_materials`.
3. **Result**: Displays connection status, packages, and credentials metadata without opening the browser.

---

### Scenario 2: Creating, Uploading, and Deploying an iFlow from Scratch

**Goal**: Create a lightweight pass-through iFlow in package `packagemcp` and deploy it.

1. **Standard Artifact Layout**:
   ```text
   my-iflow/
   ├── metainfo.prop
   ├── parameters.prop
   ├── parameters.propdef
   ├── META-INF/
   │   └── MANIFEST.MF
   └── src/main/resources/scenarioflows/integrationflow/
       └── SimpleTestIflow.iflw
   ```
2. **Prompt**:
   > "Create a minimal pass-through integration flow named `SimpleTestIflow` in package `packagemcp`, upload it, and deploy it."
3. **AI Action Sequence**:
   - Packages files into Base64 ZIP.
   - Calls `cpi_upload_iflow`:
     ```json
     {
       "mode": "create",
       "id": "SimpleTestIflow",
       "name": "Simple Test Iflow",
       "packageId": "packagemcp",
       "base64": "<ZIP_BASE64_STRING>"
     }
     ```
   - Calls `cpi_deploy_iflow`:
     ```json
     {
       "id": "SimpleTestIflow",
       "version": "1.0.0"
     }
     ```
   - Polls `cpi_get_runtime_artifact` until status is `STARTED`.

---

### Scenario 3: Production Message Troubleshooting & Diagnostics

**Goal**: Pinpoint root causes of failed messages in the last 2 hours.

1. **Prompt**:
   > "Are there any failed messages in `SimpleTestIflow` in the last 2 hours? If so, show me the error details."
2. **AI Action Sequence**:
   - Calls `cpi_list_message_logs({ integrationFlowName: "SimpleTestIflow", status: "FAILED", limit: 5 })`.
   - Obtains `MessageGuid` (e.g. `AFx82Kx_1l99s0aK`).
   - Calls `cpi_get_message_error({ messageGuid: "AFx82Kx_1l99s0aK" })` for stack traces.
   - Calls `cpi_get_message_diagnostics` for step details and headers.
3. **Result**: Summarizes failing node, exception cause, and recommended fix.

---

### Scenario 4: Exporting/Backing Up iFlow Source ZIP

**Goal**: Export an iFlow ZIP bundle to local storage.

1. **Prompt**:
   > "Export `SimpleTestIflow` version 1.0.0 from package `packagemcp` and unpack it locally."
2. **AI Action Sequence**:
   - Calls `cpi_download_iflow`:
     ```json
     {
       "packageId": "packagemcp",
       "id": "SimpleTestIflow",
       "version": "1.0.0"
     }
     ```
   - Decodes Base64 data and writes `.zip` archive locally.

---

## Tool Reference Matrix

| Category | Tool Name | Mode | Description |
|---|---|:---:|---|
| **Connectivity** | `cpi_check_connection` | Read | Validate OAuth authentication and tenant connectivity |
| **Packages** | `cpi_list_packages` | Read | List integration packages with pagination and filtering |
| | `cpi_get_package` | Read | Fetch package details by package ID |
| **Design-Time** | `cpi_list_iflows` | Read | List all iFlows within a package |
| | `cpi_get_iflow` | Read | Fetch metadata for a specific iFlow version |
| | `cpi_download_iflow` | Read | Download design-time ZIP bundle (Base64) |
| | `cpi_upload_iflow` | **Write** | Create or update iFlow using Base64 ZIP |
| **Operations** | `cpi_deploy_iflow` | **Write** | Trigger runtime deployment of an iFlow version |
| | `cpi_undeploy_iflow` | **Write** | Undeploy an active runtime artifact |
| | `cpi_list_runtime_artifacts` | Read | Enumerate deployed runtime artifacts and statuses |
| | `cpi_get_runtime_artifact` | Read | Get status of a deployed artifact (STARTED / ERROR) |
| | `cpi_start_runtime_artifact` | **Write** | Start a stopped runtime artifact |
| | `cpi_stop_runtime_artifact` | **Write** | Stop an active runtime artifact |
| **Logs & MPL** | `cpi_list_message_logs` | Read | Query Message Processing Logs (MPL) multi-dimensionally |
| | `cpi_get_message_log` | Read | Fetch MPL metadata by MessageGuid |
| | `cpi_get_message_error` | Read | Extract error details and Java exception stack |
| | `cpi_list_message_attachments` | Read | List metadata of message attachments |
| | `cpi_get_message_attachment` | Read | Download attachment payload (Base64) |
| | `cpi_get_message_diagnostics` | Read | Aggregate execution steps, headers, and adapter properties |
| **Security & Vars** | `cpi_list_variables` | Read | Query tenant variables keys and values |
| | `cpi_list_security_materials` | Read | List security credentials metadata (no secrets) |
| | `cpi_list_keystore_entries` | Read | List keystore aliases and certificate details |

---

## FAQ & Troubleshooting

### 1. Why are write tools (`cpi_upload_iflow`, `cpi_deploy_iflow`) missing?
- Ensure `SAP_ALLOW_WRITE=true` is set in your `.env` file and restart the MCP server.

### 2. Getting HTTP 401 Unauthorized?
- Verify `SAP_TOKEN_URL`, `SAP_CLIENT_ID`, and `SAP_CLIENT_SECRET` match your BTP Service Key. Ensure the token URL includes `/oauth/token`.

### 3. Getting HTTP 403 Forbidden?
- Verify your technical user or client credentials have appropriate roles: `AuthGroup_Administrator`, `IntegrationArtifact.Edit`, and `IntegrationArtifact.Deploy` in the BTP Cockpit.

### 4. Upload returns `Invalid value: 'undefined'`?
- Ensure all required parameters are provided. When calling through code or custom wrappers, include an explicit `limit` parameter.

### 5. Where can I find connection and debug logs?
- MCP communicates via JSON-RPC on `stdout`. All debug, authentication, and error logs are printed to `stderr` and can be inspected in the client's debug terminal or console.

---

## Contributing & Development

Contributions and pull requests are welcome! Please ensure all tests pass:

```bash
npm run typecheck
npm test
npm run build
```
