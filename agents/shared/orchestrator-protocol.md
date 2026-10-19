# 主代理与 Sub-Agent 协同协议与交互规范 (Orchestrator Protocol)

本协议规范主代理（Main Orchestrator）与各专职 Sub-Agent（Design, Dev, Test）之间的调度、上下文精简、边界隔离、写入互斥与结果交付。

---

## 1. 严格的边界与防踏空准则 (Scope & Boundaries)

| Sub-Agent | 权限模式 | 允许读写路径 (Write Scope) | 允许调用的 MCP 工具 |
|---|---|---|---|
| **cpi-design-agent** | 只读 (Read-Only) | `docs/design/**`, `specs/**` (不可修改代码与 iFlow 资源) | `cpi_check_connection`, `cpi_list_packages`, `cpi_get_package`, `cpi_list_iflows`, `cpi_get_iflow`, `cpi_download_iflow`, `cpi_list_security_materials`, `cpi_list_keystore_entries`, `cpi_list_variables` |
| **cpi-dev-agent** | 受限写入 (Workspace Write) | `workspace/iflows/<iflow_id>/**`, `src/scripts/**` | `cpi_download_iflow`, `cpi_upload_iflow`, `cpi_deploy_iflow`, `cpi_get_iflow`, `cpi_list_variables`, `cpi_check_connection` |
| **cpi-test-agent** | 运行时与诊断读写 (Runtime & QA) | `test-reports/**`, `tests/e2e/**` | `cpi_get_runtime_artifact`, `cpi_list_runtime_artifacts`, `cpi_list_message_logs`, `cpi_get_message_log`, `cpi_get_message_error`, `cpi_get_message_diagnostics`, `cpi_list_message_attachments`, `cpi_get_message_attachment`, `cpi_start_runtime_artifact`, `cpi_stop_runtime_artifact`, `cpi_undeploy_iflow` |

### 🚨 绝对禁止项 (Global Never Do)
1. **禁止破坏性 Git 操作**：严禁执行 `git reset --hard`、`git clean -fd`、`git checkout -f` 或未经用户明确批准的 `git commit` / `git push`。
2. **禁止删除核心文件**：严禁调用 `rm -rf` 删除仓库根目录、源代码 `src/` 或现有配置文件。
3. **禁止跨界写入**：`cpi-design-agent` 绝不允许修改部署代码；`cpi-test-agent` 绝不允许修改 iFlow 编排或业务 Groovy 源码；`cpi-dev-agent` 绝不允许擅自修改设计规范书。
4. **禁止泄露凭证**：绝不在任何日志、报告或提交内容中输出实际密钥（Client Secret、私钥、密码）。

---

## 2. 上下文继承与精简原则 (Context Minimization)

主代理向 Sub-Agent 派发任务时，**严禁倾倒全量会话历史**（防止 Prompt 冗余、成本暴涨与模型幻觉）。必须采用标准化的精简输入载荷：

```json
{
  "taskId": "task-20261019-cpi-001",
  "objective": "为采购订单创建符合 Clean Core 的 S/4HANA 异步集成流",
  "targetArtifact": {
    "packageId": "PKG_ORDER_INTEGRATION",
    "iflowId": "IFlow_Async_PurchaseOrder",
    "version": "1.0.0"
  },
  "inputFiles": [
    "specs/orders/po_contract.json",
    "docs/design/arch_spec.md"
  ],
  "constraints": {
    "cleanCoreRequired": true,
    "parameterExternalization": true,
    "groovyMemorySafe": true
  }
}
```

---

## 3. 并行与写冲突隔离机制 (Disjoint Write Sets)

若主代理并行调度多个 Sub-Agent 或同一角色的多个任务实例：
1. **写集合互斥 (Strictly Disjoint)**：
   - 任务 A 与 任务 B 的目标文件路径必须无重叠。
   - 示例：`cpi-dev-agent-1` 只能操作 `workspace/iflows/IFlow_A/**`，`cpi-dev-agent-2` 只能操作 `workspace/iflows/IFlow_B/**`。
2. **禁止自主合并**：
   - 子代理不得尝试 merge 或 rebase 其他分支，所有集成与合并统一交由主代理处理。

---

## 4. 确定性输出契约 (Output Contract)

Sub-Agent 返回给主代理的最终交付内容**严禁寒暄废话（如“好的，我明白了”、“很高兴为您服务”）**，必须严格按照定义的 JSON Schema 或结构化 Markdown 块输出：

````markdown
```json
{
  "status": "SUCCESS", // 枚举: SUCCESS | FAILED | BLOCKED
  "agentId": "cpi-dev-agent",
  "taskId": "task-20261019-cpi-001",
  "summary": "已完成 iFlow 编排热修、流式安全改造与自动部署",
  "data": { ... },
  "artifacts": [ ... ],
  "nextSuggestedAgent": "cpi-test-agent"
}
```
````

---

## 5. 停止条件与熔断控制 (Exit Conditions & Circuit Breaker)

1. **成功完成条件 (Done Definition)**：
   - 所有在契约中要求的检查项、文件写入、测试用例或部署指令执行完毕，且校验通过。
2. **熔断与 Blocked 放弃门槛**：
   - **重试上限原则**：当子代理遇到错误（如 iFlow 部署报错或测试执行异常）时，**最多允许就地调整重试 3 次**。
   - 若重试 3 次后仍未恢复，必须**立即停止打补丁**，将状态标记为 `BLOCKED`，并在输出契约中详尽说明根本原因（Root Cause）、已尝试方案以及所需外部干预（如缺少 SAP BTP 角色、凭据别名未创建或租户 Quota 不足）。
