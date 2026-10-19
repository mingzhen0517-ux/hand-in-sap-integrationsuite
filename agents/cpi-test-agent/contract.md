# cpi-test-agent 交互契约与输出规范 (Output Contract)

## 1. 契约约定 (Contract Rules)
- **拒绝主观推断**：所有关于消息是否成功的结论必须有真实 MPL `MessageGuid` 与状态支撑。
- **确定性输出**：严禁寒暄，结尾必须输出严格符合 `schema.json` 的 JSON 块。
- **缺陷闭环机制**：若测试失败，必须在 `defectReport` 字段中详细指出具体出错步骤（Step/Run）、异常堆栈与针对开发 Agent 的修复建议。

---

## 2. 最终输出样例（测试通过场景）

````markdown
# SAP 集成工件质检验收认证报告: IFlow_Async_PurchaseOrder

## 1. 运行时健康巡检
- **工件 ID**: `IFlow_Async_PurchaseOrder`
- **版本**: `1.0.1`
- **运行时状态**: `STARTED` (正常就绪)

## 2. 端到端测试执行与 MPL 追踪
- **测试用例总数**: 3
- **通过数量**: 3
- **失败数量**: 0
- **真实 MessageGuid**: `AFx98_294829104`
- **执行耗时**: 342 ms
- **诊断画像**: 步骤明细与附件校验正常，无报错

## 3. Clean Core 合规审计
- **零核心修改**: 通过
- **无敏感信息泄露**: 通过
- **标准 API 交互**: 通过 (`API_PURCHASEORDER_PROCESS_SRV`)

```json
{
  "status": "SUCCESS",
  "agentId": "cpi-test-agent",
  "taskId": "task-20261019-cpi-001",
  "targetArtifact": {
    "iflowId": "IFlow_Async_PurchaseOrder",
    "version": "1.0.1",
    "runtimeStatus": "STARTED"
  },
  "testExecution": {
    "totalCases": 3,
    "passedCases": 3,
    "failedCases": 0,
    "durationMs": 342
  },
  "mplTrace": {
    "messageGuid": "AFx98_294829104",
    "status": "COMPLETED",
    "correlationId": "CORR-PO-99120",
    "hasDiagnostics": true,
    "attachmentsCount": 1
  },
  "cleanCoreAudit": {
    "passed": true,
    "zeroPiiLeaked": true,
    "standardApiVerified": true,
    "notes": "全链路测试通过，MPL 日志无报错，符合 Clean Core 准入要求"
  },
  "reportFile": "test-reports/IFlow_Async_PurchaseOrder_test_report.md"
}
```
````

---

## 3. 最终输出样例（测试失败 / 缺陷打回场景）

````markdown
# SAP 集成工件测试缺陷通报: IFlow_Async_PurchaseOrder

## 1. 故障概要
- **工件 ID**: `IFlow_Async_PurchaseOrder`
- **MessageGuid**: `BGy77_102938472`
- **MPL 状态**: `FAILED`
- **失败步骤**: `Call Activity: SafeStreamingTransform.groovy`

## 2. 原始异常堆栈
```
groovy.lang.MissingPropertyException: No such property: CompanyCode for class: Script1
```

## 3. 修复建议 (Action for cpi-dev-agent)
在 `SafeStreamingTransform.groovy` 中第 18 行处理源报文解析时，增加空值保护 `sourcePayload?.CompanyCode ?: '1000'`。

```json
{
  "status": "FAILED",
  "agentId": "cpi-test-agent",
  "taskId": "task-20261019-cpi-001",
  "targetArtifact": {
    "iflowId": "IFlow_Async_PurchaseOrder",
    "version": "1.0.1",
    "runtimeStatus": "STARTED"
  },
  "testExecution": {
    "totalCases": 3,
    "passedCases": 2,
    "failedCases": 1,
    "durationMs": 180
  },
  "mplTrace": {
    "messageGuid": "BGy77_102938472",
    "status": "FAILED",
    "correlationId": "CORR-PO-99121",
    "hasDiagnostics": true,
    "attachmentsCount": 1
  },
  "cleanCoreAudit": {
    "passed": false,
    "zeroPiiLeaked": true,
    "standardApiVerified": true,
    "notes": "业务脚本解析异常导致流程阻断"
  },
  "defectReport": {
    "errorStep": "Call Activity: SafeStreamingTransform.groovy",
    "rootCause": "MissingPropertyException on CompanyCode",
    "rawError": "groovy.lang.MissingPropertyException: No such property: CompanyCode for class: Script1",
    "suggestedFix": "在 SafeStreamingTransform.groovy 中对 CompanyCode 增加安全导航及默认回退"
  }
}
```
````
