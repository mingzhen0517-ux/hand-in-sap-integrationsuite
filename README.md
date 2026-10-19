# SAP Cloud Integration MCP Server

[![Node.js](https://img.shields.io/badge/node-%3E%3D20-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-1.30-purple.svg)](https://modelcontextprotocol.io/)

这是一个基于标准 **Model Context Protocol (MCP)** 的本地 stdio 服务端，用于连接 **SAP Cloud Integration (CPI / SAP Integration Suite)**。它允许 AI 编程助手（如 OpenAI Codex、Claude Desktop、Cursor 等）在严格的安全管控下，直接执行 SAP CPI 的设计时管理、包与工件资产盘点、自动化部署、运行时监控以及消息日志故障排查。

---

## 目录

- [核心功能一览](#核心功能一览)
- [安全架构与安全设计](#安全架构与安全设计)
- [环境准备](#环境准备)
- [安装与编译](#安装与编译)
- [配置说明](#配置说明)
- [在 MCP 客户端中配置](#在-mcp-客户端中配置)
- [实战操作案例与具体步骤](#实战操作案例与具体步骤)
  - [案例 1：连通性验证与租户资产盘点](#案例-1连通性验证与租户资产盘点)
  - [案例 2：从零创建、上传并部署一个最简 iFlow](#案例-2从零创建上传并部署一个最简-iflow)
  - [案例 3：生产消息故障排查与异常诊断](#案例-3生产消息故障排查与异常诊断)
  - [案例 4：导出/备份现有 iFlow ZIP 源码](#案例-4导出备份现有-iflow-zip-源码)
- [工具完整对照表](#工具完整对照表)
- [常见问题与排错](#常见问题与排错)

---

## 核心功能一览

服务共注册 **22 个专用 MCP 工具**（17 个默认只读查询工具 + 5 个写入与部署工具）：

### 1. 资产盘点与租户概览
- **连接探活**：秒级验证 OAuth2 令牌签发及 SAP 租户连通状态（`cpi_check_connection`）。
- **集成包（Integration Packages）**：按 ID 或名称过滤查询集成包元数据与描述（`cpi_list_packages`, `cpi_get_package`）。
- **安全与配置盘点**：查询安全材料（User Credentials / OAuth Credentials）元数据、密钥库（Keystore Entries）元数据以及租户全局变量（`cpi_list_security_materials`, `cpi_list_keystore_entries`, `cpi_list_variables`）。

### 2. iFlow 设计时全生命周期
- **iFlow 检索**：按包检索所有设计时工件列表，获取指定版本元数据（`cpi_list_iflows`, `cpi_get_iflow`）。
- **iFlow 源码导入/导出**：支持通过 Base64 ZIP 包直接**新建**或**覆盖更新** iFlow（`cpi_upload_iflow`），以及**导出下载**完整 iFlow ZIP（`cpi_download_iflow`）。

### 3. iFlow 运行时运维与部署
- **一键部署**：将设计时指定版本的 iFlow 触发编译并部署到运行时（`cpi_deploy_iflow`）。
- **运行时监控**：实时查看已部署工件的状态（`STARTED` / `STOPPED` / `ERROR`）（`cpi_list_runtime_artifacts`, `cpi_get_runtime_artifact`）。
- **生命周期干预**：按需启动、停止或反部署（Undeploy）运行时工件（`cpi_start_runtime_artifact`, `cpi_stop_runtime_artifact`, `cpi_undeploy_iflow`）。

### 4. 消息处理与故障诊断（MPL 监控）
- **消息处理日志多维检索**：支持按时间区间、状态（`FAILED` / `COMPLETED`）、iFlow 标识、`MessageGuid`、`CorrelationId` 检索（`cpi_list_message_logs`, `cpi_get_message_log`）。
- **错误堆栈下钻**：直接提取报错消息的保留错误详情（`cpi_get_message_error`）。
- **附件与诊断画像**：获取消息附带的 payload 附件元数据及内容（`cpi_list_message_attachments`, `cpi_get_message_attachment`），或一键汇聚自定义标头、适配器属性、运行步骤与子流程（`cpi_get_message_diagnostics`）。

---

## 安全架构与安全设计

1. **写保护机制（默认只读）**：
   - 默认模式下（`SAP_ALLOW_WRITE=false`），写入及破坏性工具（如 `cpi_upload_iflow`, `cpi_deploy_iflow`, `cpi_undeploy_iflow`）**不会注册**到 MCP，杜绝误操作。
   - 只有显式在环境变量中设置 `SAP_ALLOW_WRITE=true` 时，写工具才对 AI 开放。
2. **零敏感凭据泄漏**：
   - 安全材料与密钥库工具仅暴露名称、创建者、所有者、类型等元数据；**绝不调用**任何可导出密码、客户端密钥（Client Secret）或私钥的接口。
   - 规范化错误处理逻辑会滤除 HTTP Authorization 头、Token、Cookie 等机密内容。
3. **输入严格校验与结构化防注入**：
   - 所有接口参数均使用 Zod 强类型校验；分页游标经 Base64URL 结构化校验，杜绝拼接任意未经审查的 raw OData 查询语句。
4. **内存与二进制安全**：
   - 对上传与下载的 Base64 文件设定最大字节防护阀值（默认 25 MiB，`SAP_MAX_BINARY_BYTES`），防止大文件导致 Node.js 内存溢出。
5. **stdio 协议零污染**：
   - 严格遵循 MCP 规范，所有内部运行日志与认证信息只输出到 `stderr`，`stdout` 纯净传输 JSON-RPC 消息。

---

## 环境准备

- **Node.js**：20.6.0 或更高版本（支持原生环境变量加载）。
- **SAP BTP 凭据**：
  - 在 SAP BTP Cockpit 中创建 `Process Integration Runtime` 服务的 Service Key（建议 plan 为 `api`）。
  - 获取 `clientid`、`clientsecret`、`tokenurl` 以及 Cloud Integration 租户 URL。
  - 技术用户/客户端需具备相应权限（如 `AuthGroup_Administrator`、`AuthGroup_BusinessAnalyst` 或 `AuthGroup_IntegrationDeveloper`）。

---

## 安装与编译

```bash
# 1. 克隆或进入项目目录
cd hand-in-sap-integrationsuite

# 2. 安装依赖
npm install

# 3. 运行静态类型检查与单元测试
npm run typecheck
npm test

# 4. 编译构建
npm run build
```

编译生成文件位于 `dist/index.js`。

---

## 配置说明

复制根目录的 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

根据您的 SAP BTP Service Key 填写 `.env`：

```properties
# Cloud Integration 租户 URL（不带 /api/v1，若带会自动去除）
SAP_CPI_BASE_URL=https://<your-tenant>.it-cpi001.cfapps.<region>.hana.ondemand.com

# 认证类型：oauth2（强烈推荐）或 basic
SAP_AUTH_TYPE=oauth2

# OAuth2 凭据（对应 Service Key 中的 tokenurl、clientid、clientsecret）
SAP_TOKEN_URL=https://<your-subdomain>.authentication.<region>.hana.ondemand.com/oauth/token
SAP_CLIENT_ID=sb-xxxx!bxxxx|it!bxxxx
SAP_CLIENT_SECRET=xxxx-xxxx-xxxx$xxxx

# 是否启用写入与部署工具（创建/更新/部署/启停/反部署 iFlow 需设置为 true）
SAP_ALLOW_WRITE=true

# 超时时间与单文件传输上限
SAP_REQUEST_TIMEOUT_MS=30000
SAP_MAX_BINARY_BYTES=26214400
```

> **注意**：服务启动时会自动识别并优先加载当前目录下的 `.env` 文件。请勿将包含真实凭据的 `.env` 提交到公开 Git 仓库中。

---

## 在 MCP 客户端中配置

### 1. 在 Codex (CLI / Desktop) 中使用

在 `~/.codex/config.toml` 中增加以下配置项（由于服务端内置自动加载 `.env`，只需指向执行文件与工作目录即可）：

```toml
[mcp_servers.sap_cpi]
command = "node"
args = ["/绝对路径/hand-in-sap-integrationsuite/dist/index.js"]
cwd = "/绝对路径/hand-in-sap-integrationsuite"
```

*如果不想依赖本地 `.env` 文件，也可以直接在 `config.toml` 内通过 `env` 表传入变量。*

### 2. 在 Claude Desktop 中使用

在 `~/Library/Application Support/Claude/claude_desktop_config.json`（macOS）或 `%APPDATA%\Claude\claude_desktop_config.json`（Windows）中添加：

```json
{
  "mcpServers": {
    "sap-cpi": {
      "command": "node",
      "args": ["/绝对路径/hand-in-sap-integrationsuite/dist/index.js"],
      "cwd": "/绝对路径/hand-in-sap-integrationsuite"
    }
  }
}
```

---

## 实战操作案例与具体步骤

配置并启动 MCP 后，AI 助手可以直接通过对话调用本工具完成复杂的 CPI 操作。以下是四个最常用的典型业务场景。

### 案例 1：连通性验证与租户资产盘点

**目标**：确认与 SAP 租户连接正常，盘点包资产以及安全配置情况。

#### 操作步骤：
1. **向 AI 发出指令**：
   > “请帮我检查一下当前 SAP CPI 租户的连接状态，并列出有哪些集成包和配置的安全材料。”
2. **AI 工具调用流程**：
   - 步骤 1：调用 `cpi_check_connection` 检查网络与 OAuth Token 连通性。
   - 步骤 2：调用 `cpi_list_packages`（`limit: 10`）拉取租户内的设计时包列表。
   - 步骤 3：调用 `cpi_list_security_materials` 列出凭据名称与类型。
3. **预期结果**：
   AI 输出当前租户状态为 Connected，展示租户下已有的 Package（例如 `packagemcp`）及当前配置好的安全元数据，无需人工登录 SAP BTP Web UI 查找。

---

### 案例 2：从零创建、上传并部署一个最简 iFlow

**目标**：在指定的集成包中快速创建一个直通型（Pass-through）集成流并部署上线。

#### 操作步骤：
1. **准备 iFlow 构件标准文件结构**（AI 可以在临时目录自动生成）：
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
   - **`metainfo.prop`**：定义 `Bundle-SymbolicName` 与 `Bundle-Name`。
   - **`MANIFEST.MF`**：声明 OSGi 捆绑包头（`SAP-BundleType: IntegrationFlow`, `SAP-NodeType: IFLMAP`）。
   - **`SimpleTestIflow.iflw`**：标准的 BPMN 2.0 XML 格式，包含最简 Sender -> StartEvent -> EndEvent -> Receiver 流程。
2. **打包并编码**：
   将上述目录打包为 ZIP，并读取为 Base64 字符串。
3. **向 AI 发出指令**：
   > “请帮我在 `packagemcp` 包中创建一个名为 `SimpleTestIflow` 的基础集成流，上传并将其部署到运行时。”
4. **AI 工具调用流程**：
   - 步骤 1：调用 `cpi_upload_iflow`：
     ```json
     {
       "mode": "create",
       "id": "SimpleTestIflow",
       "name": "Simple Test Iflow",
       "packageId": "packagemcp",
       "base64": "<ZIP_BASE64_STRING>"
     }
     ```
     SAP CPI 接口处理后返回 `201 Created`，生成版本 `1.0.0`。
   - 步骤 2：调用 `cpi_deploy_iflow`：
     ```json
     {
       "id": "SimpleTestIflow",
       "version": "1.0.0"
     }
     ```
   - 步骤 3：调用 `cpi_get_runtime_artifact({ id: "SimpleTestIflow" })`，轮询直到确认工件状态变为 `STARTED`。

---

### 案例 3：生产消息故障排查与异常诊断

**目标**：当某个 iFlow 处理业务失败时，快速锁定失败原因及错误堆栈。

#### 操作步骤：
1. **向 AI 发出指令**：
   > “过去 2 小时内 `SimpleTestIflow` 有没有失败的消息？如果有，帮我查看失败原因和错误日志。”
2. **AI 工具调用流程**：
   - 步骤 1：调用 `cpi_list_message_logs`：
     ```json
     {
       "integrationFlowName": "SimpleTestIflow",
       "status": "FAILED",
       "limit": 5
     }
     ```
     获取到失败消息的 `MessageGuid`（例如 `AFx82Kx_1l99s0aK`）。
   - 步骤 2：调用 `cpi_get_message_error({ messageGuid: "AFx82Kx_1l99s0aK" })`，读取底层的异常堆栈（如 HTTP 500、JSON 语法错误或映射异常）。
   - 步骤 3：调用 `cpi_get_message_diagnostics({ messageGuid: "AFx82Kx_1l99s0aK" })`，检查发生故障时的 Header、路由节点与附件。
3. **预期结果**：
   AI 汇总诊断结果，指出消息在哪个节点失败、抛出的具体 Exception 根因，并给出修复建议。

---

### 案例 4：导出/备份现有 iFlow ZIP 源码

**目标**：无需打开浏览器，直接通过 MCP 下载指定 iFlow 源码并在本地解压检视。

#### 操作步骤：
1. **向 AI 发出指令**：
   > “帮我把 `packagemcp` 包下的 `SimpleTestIflow`（版本 1.0.0）源码导出来，并在本地解压。”
2. **AI 工具调用流程**：
   - 步骤 1：调用 `cpi_download_iflow`：
     ```json
     {
       "packageId": "packagemcp",
       "id": "SimpleTestIflow",
       "version": "1.0.0"
     }
     ```
     服务端返回 ZIP 的 Base64 编码数据、SHA-256 校验和以及文件大小。
   - 步骤 2：AI 将 Base64 解码并写入本地文件（如 `./SimpleTestIflow-1.0.0.zip`），并解压到指定目录供审查代码或提交到版本控制中。

---

## 工具完整对照表

| 分类 | 工具名称 | 权限 | 详细功能说明 |
|---|---|:---:|---|
| **连通测试** | `cpi_check_connection` | 只读 | 探测 SAP CPI OAuth 鉴权及运行时连通性 |
| **集成包** | `cpi_list_packages` | 只读 | 列表查询设计时包（支持分页、ID、名称过滤） |
| | `cpi_get_package` | 只读 | 按唯一 Package ID 查询包详情 |
| **iFlow 设计时**| `cpi_list_iflows` | 只读 | 列表查询指定包内的所有 iFlow |
| | `cpi_get_iflow` | 只读 | 查询单个 iFlow 指定版本的详细设计时元数据 |
| | `cpi_download_iflow` | 只读 | 下载指定 iFlow 的设计时 ZIP（Base64 格式） |
| | `cpi_upload_iflow` | **写入** | 上传 Base64 ZIP 包以**新建**或**更新** iFlow |
| **iFlow 部署运维**| `cpi_deploy_iflow` | **写入** | 触发将指定版本 iFlow 部署至运行时环境 |
| | `cpi_undeploy_iflow` | **写入** | 从运行时环境中反部署（下线）iFlow 工件 |
| | `cpi_list_runtime_artifacts` | 只读 | 盘点当前已部署的所有运行时工件及其实时运行状态 |
| | `cpi_get_runtime_artifact` | 只读 | 获取指定工件的运行状态（STARTED / ERROR 等） |
| | `cpi_start_runtime_artifact` | **写入** | 启动已处于 STOPPED 状态的运行时工件 |
| | `cpi_stop_runtime_artifact` | **写入** | 停止运行中的工件（中断消息处理） |
| **日志与诊断** | `cpi_list_message_logs` | 只读 | 结构化多维查询消息处理日志（MPL） |
| | `cpi_get_message_log` | 只读 | 按 MessageGuid 精确查询单条消息处理日志元数据 |
| | `cpi_get_message_error` | 只读 | 获取单条消息对应的详细错误信息与系统堆栈 |
| | `cpi_list_message_attachments` | 只读 | 查询失败/成功消息留存的附件列表元数据 |
| | `cpi_get_message_attachment` | 只读 | 下载指定附件内容（Base64 格式） |
| | `cpi_get_message_diagnostics` | 只读 | 一站式汇总消息的所有诊断属性与运行步骤 |
| **安全与变量** | `cpi_list_variables` | 只读 | 列出租户全局/iFlow 变量的键与内容 |
| | `cpi_list_security_materials`| 只读 | 列出配置的安全材料元数据（无敏感密文） |
| | `cpi_list_keystore_entries` | 只读 | 列出租户密钥库（Keystore）的别名与证书元数据 |

---

## 常见问题与排错

### 1. 为什么看不到 `cpi_upload_iflow`、`cpi_deploy_iflow` 等写工具？
- **检查项**：请确认 `.env` 中已配置 `SAP_ALLOW_WRITE=true`。修改配置后需重新启动 MCP 服务端进程。

### 2. 返回 HTTP 401 Unauthorized 错误？
- **检查项**：
  1. 检查 `SAP_TOKEN_URL`、`SAP_CLIENT_ID`、`SAP_CLIENT_SECRET` 是否与 BTP Service Key 保持一致。
  2. 确认 Token URL 是否包含完整的 `/oauth/token` 后缀。
  3. 服务自带 Token 缓存与自动刷新机制；若凭据已过期或被撤销，请更新 Service Key。

### 3. 返回 HTTP 403 Forbidden 错误？
- **检查项**：
  - 调用只读查询通常需要 `AuthGroup_BusinessAnalyst` 或只读角色。
  - 调用 `cpi_upload_iflow`、`cpi_deploy_iflow` 需要 `AuthGroup_Administrator` 或包含 `IntegrationArtifact.Edit`、`IntegrationArtifact.Deploy` 权限的 Role Collection。请在 BTP Cockpit 的 **Security > Users** 中为技术用户绑定对应角色。

### 4. 上传 iFlow 时报 `Invalid value: 'undefined'`？
- **检查项**：OData 查询的分页参数必须为正整数。使用 MCP 工具时系统会自动补齐默认 `limit=50`，若直接通过 SDK 调用客户端方法，请务必传入包含 `limit` 的对象（如 `{ limit: 50, packageId: "..." }`）。

### 5. 如何排查 MCP 服务与客户端通信日志？
- MCP stdio 协议仅在 `stdout` 上流式输出 JSON-RPC 数据。
- 所有的连接状态、OAuth 鉴权重试以及报错输出均写入了 `stderr`，可直接在客户端控制台（如 Codex Debug Terminal 或 Claude 开发者日志）中查看。

---

## 贡献与开发

欢迎提交 Issue 和 Pull Request！在提交代码前，请确保所有测试通过：

```bash
npm run typecheck
npm test
npm run build
```
