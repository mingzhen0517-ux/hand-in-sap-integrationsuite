# cpi-dev-agent 交互契约与输出规范 (Output Contract)

## 1. 契约约定 (Contract Rules)
- **零寒暄**：严禁废话，输出内容直接交付工程化成果与机器可读的 JSON 块。
- **排他性写入声明**：在输出中必须清晰罗列本 Agent 实际创建或修改的文件路径，供主代理核验是否与其它 Agent 产生写冲突。

---

## 2. 最终输出样例 (Output Example)

````markdown
# iFlow 构建与部署交付报告: IFlow_Async_PurchaseOrder

## 1. 工件生命周期状态
- **所属集成包**: `PKG_ORDER_INTEGRATION`
- **iFlow 唯一标识**: `IFlow_Async_PurchaseOrder`
- **构建版本**: `1.0.1`
- **部署触发状态**: `SUCCESS` (Deploy Triggered)

## 2. 代码与脚本静态检查
- **流式防 OOM 检查**: 通过 (使用 `Reader` 与流式 XML 解析器)
- **参数外部化验证**: 通过 (已绑定 3 项外部化参数)
- **零机密泄漏**: 通过 (无硬编码密码/Token)

## 3. 修改文件清单 (Disjoint Write Set)
- `workspace/iflows/IFlow_Async_PurchaseOrder/src/main/resources/scenarioflows/zeromodel.xml`
- `workspace/iflows/IFlow_Async_PurchaseOrder/src/main/resources/script/SafeStreamingTransform.groovy`
- `workspace/iflows/IFlow_Async_PurchaseOrder/src/main/resources/parameters.prop`

```json
{
  "status": "SUCCESS",
  "agentId": "cpi-dev-agent",
  "taskId": "task-20261019-cpi-001",
  "deployedArtifact": {
    "packageId": "PKG_ORDER_INTEGRATION",
    "iflowId": "IFlow_Async_PurchaseOrder",
    "version": "1.0.1",
    "name": "Async Purchase Order Integration"
  },
  "modifiedFiles": [
    "workspace/iflows/IFlow_Async_PurchaseOrder/src/main/resources/scenarioflows/zeromodel.xml",
    "workspace/iflows/IFlow_Async_PurchaseOrder/src/main/resources/script/SafeStreamingTransform.groovy",
    "workspace/iflows/IFlow_Async_PurchaseOrder/src/main/resources/parameters.prop"
  ],
  "groovyCompliance": {
    "memoryStreamingSafe": true,
    "zeroHardcodedSecrets": true,
    "nullSafeChecked": true,
    "scannedScriptCount": 1
  },
  "deploymentResult": {
    "status": "DEPLOYED",
    "uploadTimestamp": "2026-10-19T13:00:00.000Z",
    "deployTimestamp": "2026-10-19T13:00:05.000Z"
  },
  "retryCount": 0,
  "nextSuggestedAgent": "cpi-test-agent"
}
```
````
