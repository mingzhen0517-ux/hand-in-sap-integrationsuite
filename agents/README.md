# SAP Cloud Integration (CPI) Clean Core Sub-Agents 架构体系

本目录定义了专为 **SAP Cloud Integration (SAP Integration Suite)** 打造的**三位一体 Sub-Agent 体系**。该体系严格遵照 **SAP Clean Core 战略** 与 **SAP Best Practice**，采用**声明式配置 + 指令文档 + 确定性输出契约 + 辅助检测脚本**的现代化 Agent 结构，打通企业级集成的全生命周期闭环。

---

## 1. Sub-Agent 标准工程结构

每个专职 Sub-Agent 均按照工业级 Agent 规范进行标准化封装：

```
agents/
├── shared/
│   └── orchestrator-protocol.md       # 主代理调度与子代理交互协议（边界/上下文/写冲突/熔断）
├── cpi-design-agent/                   # 🏛️ 架构与设计 Sub-Agent
│   ├── agent.json                     # 声明式元数据、工具白名单、写范围与超时限制
│   ├── prompt.md / system.md          # 角色定位、核心任务、明确禁区（Never Do）、输入精简原则
│   ├── contract.md                    # 输出契约与 Markdown/JSON 结构规范（严禁闲聊）
│   ├── schema.json                    # 确定性输出 JSON Schema
│   └── scripts/check-clean-core.mjs   # Clean Core 合规性与非标代码静态核查脚本
├── cpi-dev-agent/                      # 🛠️ 开发与构建 Sub-Agent
│   ├── agent.json                     # 声明式元数据、受限写范围、重试上限
│   ├── prompt.md / system.md          # 核心任务、流式安全编码准则、明确禁区
│   ├── contract.md                    # 排他性写文件清单声明与部署成果契约
│   ├── schema.json                    # 部署交付输出 JSON Schema
│   └── scripts/
│       ├── check-groovy-stream.mjs    # Groovy 脚本内存溢出 (OOM) 与机密泄露静态扫描
│       └── pack-iflow.mjs             # iFlow 目录校验与 Base64 ZIP 打包工具
└── cpi-test-agent/                     # 🔬 质量与测试 Sub-Agent
    ├── agent.json                     # 声明式元数据、只读诊断工具白名单、熔断控制
    ├── prompt.md / system.md          # 运行时健康巡检、端到端测试、真实 MPL 追踪原则
    ├── contract.md                    # 质检验收认证报告与缺陷返修单格式
    ├── schema.json                    # 质检结果输出 JSON Schema
    └── scripts/format-mpl-report.mjs  # 真实 MPL 日志与诊断数据清洗规整工具
```

---

## 2. 核心架构协同图

```
                ┌──────────────────────────────────────────────┐
                │             用户 / 业务集成需求              │
                └──────────────────────┬───────────────────────┘
                                       │
                                       ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │ 🏛️ cpi-design-agent (设计与架构 Sub-Agent)                           │
    │ - 边界: 只读租户资产，写入限定在 docs/design/**, specs/**           │
    │ - Clean Core 评估: 零核心侵入、标准发布 API 优先、异步解耦           │
    │ - 工具: cpi_check_connection, cpi_list_packages, cpi_list_iflows    │
    │ ➔ 契约交付: 《SAP 接口集成架构设计说明书》与 schema.json 结构体     │
    └──────────────────────────────────┬──────────────────────────────────┘
                                       │ 架构交接 (仅传递规格与约束)
                                       ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │ 🛠️ cpi-dev-agent (开发与构建 Sub-Agent)                             │
    │ - 边界: 严格限定在 workspace/iflows/**, 互斥写入 (Disjoint Sets)    │
    │ - 流式安全 Groovy 编码 (防 OOM)、参数 100% 外部化、标准化异常子流程   │
    │ - Vibe Coding: 下载基线 ➔ 本地热修 ➔ Base64 打包 ➔ 自动部署          │
    │ - 工具: cpi_download_iflow, cpi_upload_iflow, cpi_deploy_iflow       │
    │ ➔ 契约交付: 已部署工件 ID、版本、修改文件清单与契约 JSON           │
    └──────────────────────────────────┬──────────────────────────────────┘
                                       │ 部署交付 (工件 ID 与版本)
                                       ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │ 🔬 cpi-test-agent (质量与测试 Sub-Agent)                            │
    │ - 边界: 只读诊断，写入限定在 test-reports/**, 严禁改动任何源码       │
    │ - 运行时就绪验证: cpi_get_runtime_artifact (STARTED 状态巡检)        │
    │ - MPL 全链路监控: cpi_list_message_logs, cpi_get_message_diagnostics│
    │ - 异常堆栈下钻: cpi_get_message_error, 报文附件校验与 Clean Core 审计│
    │ ➔ 闭环反馈: 若失败直接定位错误行打回开发 Agent；通过则签发验收报告   │
    └──────────────────────────────────┬──────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
     [测试失败 / 异常定位]                                 [全部通过 / 验收合格]
   打回 cpi-dev-agent 极速热修                          交付生产 / 结单归档
```

---

## 3. 五大工程化设计原则 (Core Principles)

### 1. 严格的边界与防踏空 (Scope & Boundaries)
- **写作用域隔离**：各 Sub-Agent 拥有白名单写入路径（如 `cpi-dev-agent` 只能写 `workspace/iflows/**`，`cpi-design-agent` 只能写 `docs/design/**`）。
- **工具权限受限**：写工具（`cpi_upload_iflow` / `cpi_deploy_iflow`）仅向 `cpi-dev-agent` 开放；`cpi-test-agent` 与 `cpi-design-agent` 严禁调用代码写入与流程修改工具。
- **全局禁止项**：严禁执行 `git reset --hard`、`git clean -fd`、`rm -rf` 等破坏性命令，严禁泄露任何真实机密。

### 2. 上下文继承与精简 (Context Minimization)
- **拒绝全量倒贴历史**：主代理向 Sub-Agent 分派任务时，只传递目标目标（Objective）、关联文件路径、入参契约与约束边界。
- **杜绝幻觉与成本膨胀**：Sub-Agent 不需要也不允许读取与当前任务无关的漫长闲聊历史。

### 3. 确定性输出契约 (Output Contract)
- **零寒暄与客套**：Sub-Agent 回复**严禁任何废话**。
- **标准机器可读**：每次输出结尾必须携带严格符合自身 `schema.json` 的 JSON 代码块，使主代理能够无缝提取状态（`SUCCESS` / `FAILED` / `BLOCKED`）、交付物列表及下一跳建议。

### 4. 停止条件与超时熔断 (Exit Condition & Circuit Breaker)
- **完成判定 (Done)**：必须满足契约中所声明的校验标准（如状态为 `STARTED` 且 MPL `COMPLETED`）。
- **熔断机制**：任何步骤遇到异常（如部署错误、测试失败），**重试修复上限严格限制为 3 次**。超过 3 次若仍未解决，严禁陷入无休止补丁循环，必须立即置为 `BLOCKED`，输出根本原因并请求人工介入。

### 5. 并行与写冲突隔离 (Disjoint Write Sets)
- **写集合互斥**：若主代理同时并行分发多个开发 Agent，各 Agent 的写入目录必须相互隔离（例如 `workspace/iflows/Flow_A/` 与 `workspace/iflows/Flow_B/`）。
- **集成由主代理主导**：子代理之间不得互相修改文件或跨分支合并，所有最终结果由主代理统一拉通整合。

---

## 4. 三大 Sub-Agent 详尽对照

| Sub-Agent | 角色定位 | 写入范围 | 核心 MCP 工具 | 辅助检测工具 |
|---|---|---|---|---|
| [**cpi-design-agent**](cpi-design-agent/prompt.md) | 架构师 & Clean Core 顾问 | `docs/design/**`<br>`specs/**` | `cpi_check_connection`<br>`cpi_list_packages`<br>`cpi_list_iflows`<br>`cpi_download_iflow` | `check-clean-core.mjs` (Clean Core 规则检测) |
| [**cpi-dev-agent**](cpi-dev-agent/prompt.md) | 资深 CPI 工程师 & Vibe Coder | `workspace/iflows/**`<br>`src/scripts/**` | `cpi_download_iflow`<br>`cpi_upload_iflow`<br>`cpi_deploy_iflow`<br>`cpi_list_variables` | `check-groovy-stream.mjs` (防 OOM 检查)<br>`pack-iflow.mjs` (Base64 ZIP 打包) |
| [**cpi-test-agent**](cpi-test-agent/prompt.md) | 集成 QA & 全链路诊断专家 | `test-reports/**`<br>`tests/e2e/**` | `cpi_get_runtime_artifact`<br>`cpi_list_message_logs`<br>`cpi_get_message_error`<br>`cpi_get_message_diagnostics` | `format-mpl-report.mjs` (MPL 报告格式化) |
