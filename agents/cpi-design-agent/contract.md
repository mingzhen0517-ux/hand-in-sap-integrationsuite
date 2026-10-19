# cpi-design-agent 交互契约与输出规范 (Output Contract)

## 1. 契约约定 (Contract Rules)
- **零废话**：输出内容严格禁止问候、寒暄与冗长解释。
- **双重交付**：Sub-Agent 必须在回答末尾提供一段严格符合 `schema.json` 的 JSON 代码块，并生成一份 Markdown 格式的设计规范文件（保存至 `docs/design/<iflowId>_spec.md`）。

---

## 2. 最终输出样例 (Output Example)

````markdown
# SAP 集成架构设计说明书: IFlow_Async_PurchaseOrder

## 1. Clean Core 评估
- **ERP 核心侵入度**: 零修改 (Zero Modification)
- **API 选型**: SAP S/4HANA Cloud OData v2 API `API_PURCHASEORDER_PROCESS_SRV` (已在 SAP Business Accelerator Hub 发布)
- **解耦模式**: SAP Event Mesh 事件驱动异步解耦，失败走 JMS 存储转发。

## 2. iFlow 编排拓扑
- **入口**: AMQP 接收器 (Event Mesh)
- **主流程**: Content Modifier (提取 PO Number) ➔ ProcessDirect (调用鉴权与脱敏子流程) ➔ OData v2 适配器
- **异常子流程**: Exception Subprocess 记录错误并发送死信队列

## 3. 外部化参数表
| 参数名称 | 类型 | 建议默认值 | 关联 Security Material |
|---|---|---|---|
| `S4_ODATA_HOST` | URL | `https://my-s4.example.com` | - |
| `S4_CREDENTIAL_ALIAS` | Credential | `S4_COMM_USER_TECH` | `S4_COMM_USER_TECH` |
| `TIMEOUT_MS` | Integer | `30000` | - |

```json
{
  "status": "SUCCESS",
  "agentId": "cpi-design-agent",
  "taskId": "task-20261019-cpi-001",
  "cleanCoreCompliance": {
    "passed": true,
    "releasedApiUsed": "API_PURCHASEORDER_PROCESS_SRV",
    "zeroCoreModification": true,
    "asynchronousDecoupled": true,
    "notes": "符合 Clean Core 要求，全部走官方已发布 API"
  },
  "architectureBlueprint": {
    "packageId": "PKG_ORDER_INTEGRATION",
    "iflowId": "IFlow_Async_PurchaseOrder",
    "integrationPattern": "Event-Driven & Asynchronous Store-and-Forward",
    "subProcesses": ["Sub_Common_Audit", "Sub_Exception_DLQ"],
    "externalizedParameters": [
      {
        "name": "S4_ODATA_HOST",
        "category": "Endpoint",
        "defaultValue": "https://my-s4.example.com"
      },
      {
        "name": "S4_CREDENTIAL_ALIAS",
        "category": "Security",
        "defaultValue": "S4_COMM_USER_TECH",
        "credentialAlias": "S4_COMM_USER_TECH"
      }
    ]
  },
  "specificationFile": "docs/design/IFlow_Async_PurchaseOrder_spec.md",
  "nextSuggestedAgent": "cpi-dev-agent"
}
```
````
