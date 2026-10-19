# SAP Cloud Integration Agent Guidelines & Sub-Agents Architecture

本文件为工作区内所有 AI Agent（包括 Codex、Claude、Cursor 等主代理与子代理）提供架构规范、行为守则与运行契约。

---

## 1. 核心架构战略：SAP Clean Core & Best Practice

本仓库是基于 Model Context Protocol (MCP) 构建的 **SAP Cloud Integration (Integration Suite)** 企业级集成服务。
在进行任何方案设计、代码开发或测试诊断时，必须无条件遵循以下三大底层支柱：

1. **Clean Core 战略 (Keep the Core Clean)**：
   - 彻底告别侵入式修改 S/4HANA / ERP 底层代码的遗留模式。
   - 所有与外部异构系统、SaaS 平台、自研应用的集成逻辑，全部在 SAP Integration Suite (CPI) 中承载。
   - 严格采用 SAP 官方已发布的标准 API（OData v2/v4, REST, SOAP，参考 [SAP Business Accelerator Hub](https://api.sap.com)）或标准业务事件（SAP Event Mesh）。
2. **SAP Integration Suite 最佳开发实践**：
   - **参数 100% 外部化**：禁止硬编码任何端点、主机、凭证别名或超时时长，一律使用外部化配置（`parameters.prop`）。
   - **Groovy 内存安全**：禁止使用 `message.getBody(String)` 加载大报文，必须使用流式读取器（`Reader` / `InputStream`），杜绝运行时 JVM OOM。
   - **安全合规**：所有敏感凭据保存在 Security Material 中，日志中绝不暴露密码、私钥与 PII 数据。
   - **异常处理规范**：必须在 iFlow 中部署 Exception Subprocess，生成结构化错误报文并记录追溯 Header。
3. **基于 MPL 的全链路真实自检**：
   - 拒绝“凭空臆测”式的集成验证。充分利用 22 个 MCP 工具，在部署后自动拉取真实的 Message Processing Log (MPL)、错误堆栈与诊断数据完成测试自检闭环。

---

## 2. 声明式 Sub-Agent 体系结构

本仓库预置了专职化的 Sub-Agent，每个 Agent 均采用 **声明式配置 (`agent.json`) + 指令文档 (`prompt.md` / `system.md`) + 输出契约 (`contract.md` / `schema.json`) + 辅助工具 (`scripts/`)** 的规范化工程目录：

```
agents/
├── shared/
│   └── orchestrator-protocol.md          # 主代理与子代理交互协议与协同规范
├── cpi-design-agent/                      # 🏛️ 架构与设计 Sub-Agent
│   ├── agent.json                        # 声明式元数据、只读白名单、文档写范围
│   ├── prompt.md / system.md             # 角色定义、Clean Core 核心任务、明确禁区
│   ├── contract.md / schema.json         # 结构化输出契约 (架构蓝图与合规评估)
│   └── scripts/check-clean-core.mjs      # Clean Core 规则检测脚本
├── cpi-dev-agent/                         # 🛠️ 开发与构建 Sub-Agent
│   ├── agent.json                        # 声明式元数据、专属代码写范围、重试上限
│   ├── prompt.md / system.md             # 角色定义、流式安全开发、Vibe Coding 部署
│   ├── contract.md / schema.json         # 结构化输出契约 (修改文件清单与部署结果)
│   └── scripts/
│       ├── check-groovy-stream.mjs       # Groovy 内存流式与机密扫描
│       └── pack-iflow.mjs                # iFlow 目录结构校验与 Base64 ZIP 打包
└── cpi-test-agent/                        # 🔬 质量与测试 Sub-Agent
    ├── agent.json                        # 声明式元数据、运行时只读诊断工具白名单
    ├── prompt.md / system.md             # 角色定义、运行时就绪巡检、MPL 监控追踪
    ├── contract.md / schema.json         # 结构化输出契约 (测试认证报告与缺陷返修单)
    └── scripts/format-mpl-report.mjs     # MPL 原始数据规整与报告生成
```

---

## 3. 五大协作守则 (Agent Execution Rules)

1. **严格的边界与防踏空 (Scope & Boundaries)**：
   - 各 Sub-Agent 严格受限于各自的 `write_scope` 白名单（Design 写 `docs/design/**`，Dev 写 `workspace/iflows/**`，Test 写 `test-reports/**`）。
   - 严禁执行未授权的破坏性操作（如 `git reset --hard`、`git clean -fd`、`rm -rf` 或随意提交 Git Commit）。
2. **上下文继承与精简 (Context Minimization)**：
   - 主代理调度子代理时，禁止倒贴全部会话历史。只输入当前任务目标（Objective）、入参文件与约束条件。
3. **确定性输出契约 (Output Contract)**：
   - 子代理回复严禁寒暄与废话，结尾必须返回严格符合自身 `schema.json` 的 JSON 代码块，确保主代理能零误差解析。
4. **停止条件与超时控制 (Exit Condition & Circuit Breaker)**：
   - 重试修复上限为 **3 次**。连续 3 次失败必须立即置为 `BLOCKED`，输出根本原因并请求人工介入，防止死循环打补丁。
5. **并行与写冲突隔离 (Disjoint Write Sets)**：
   - 并行分发多个 Sub-Agent 时，各子代理的文件写入目录必须互斥。合并与集成由主代理集中协调。
