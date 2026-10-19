# SAP Cloud Integration MCP Server

[![Node.js](https://img.shields.io/badge/node-%3E%3D20-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-1.30-purple.svg)](https://modelcontextprotocol.io/)

[ [中文](README.md) | [English](README.en.md) | **日本語** | [한국어](README.ko.md) ]

標準的な **Model Context Protocol (MCP)** に基づき、**SAP Cloud Integration (CPI / SAP Integration Suite)** 専用に設計されたエンタープライズグレードのローカル stdio サーバーです。

SAP BTP クラウド統合プラットフォームの深層機能を、最新の AI プログラミングアシスタント（OpenAI Codex、Claude Desktop、Cursor など）に解放します。**SAP Clean Core 戦略と SAP ベストプラクティスを中核とし、エンタープライズ統合のライフサイクル全般におけるインテリジェントな変革と「Vibe Coding」による迅速なデリバリーを実現します**。

### 🌟 主要ハイライト (Strategic Highlights)

1. 🏛️ **Clean Core 戦略のハブ (Keep the Core Clean)**：
   - **コアの非侵襲性**：S/4HANA / ERP コア内でのカスタム Z プログラム開発、基底物理テーブルの直接アクセス、脆弱な RFC ポイントツーポイント接続を完全に排除。システムの疎結合化、プロトコル変換、メッセージクレンジング、オーケストレーションはすべて SAP Integration Suite で担います。
   - **標準リリース済み API 優先**：[SAP Business Accelerator Hub](https://api.sap.com) で公式に公開されている標準 OData v2/v4、REST、SOAP インターフェースおよびエンタープライズイベント（SAP Event Mesh）のみを連携対象とし、コアシステムの円滑なアップデートを保証します。

2. 🏆 **SAP Integration ベストプラクティスの実践**：
   - **公式標準コンテンツの再利用**：Content Hub の事前定義済み Integration Packages を優先的に活用し、重複開発を防止。
   - **パラメータの 100% 外部化**：ホスト、パス、認証情報エイリアス、タイムアウト設定をすべて外部化パラメータ（`parameters.prop`）で管理し、ハードコーディングを完全排除。
   - **ストリームセーフな Groovy コーディング**：JVM OOM（メモリ枯渇）を防ぐため、大きなペイロードのオンメモリ展開を禁止し、ストリーミングリーダー（`Reader` / `InputStream`）を強制適用。機密データのマスク処理を徹底。
   - **高可用性と耐障害性**：Exception Subprocess、ProcessDirect マイクロモジュール、べき等レシーバー（Idempotent Receiver）、JMS によるストア＆フォワード・デッドレターキューを標準配備。

3. 🤖 **三位一体の Sub-Agent アーキテクチャ（設計・開発・テストの閉ループ）**：
   - **設計（Design）**、**開発（Dev）**、**テスト（Test）** の役割を持つ Sub-Agent が連携し、22 個の MCP ネイティブツールを協調実行します：
     - **[🏛️ アーキテクチャ＆設計 Sub-Agent (`cpi-design-agent`)](agents/cpi-design-agent.md)**：Clean Core 適合性評価、標準 API/イベント選定、外部化パラメータ設計、障害許容統合ブループリントの策定。
     - **[🛠️ 開発＆構築 Sub-Agent (`cpi-dev-agent`)](agents/cpi-dev-agent.md)**：iFlow の組み立て、ストリームセーフな Groovy 実装、Base64 ZIP パッケージング、自然言語による迅速な修正とデプロイ。
     - **[🔬 品質＆テスト Sub-Agent (`cpi-test-agent`)](agents/cpi-test-agent.md)**：稼働状態確認（`STARTED` ゲート）、E2E テスト、リアルタイム MPL トラッキング、エラー情報ドリルダウン（ErrorInformation）、ペイロード検証と Clean Core 監査。

4. 🔄 **開発・修正・デプロイ・検証の完全統合（数秒での Vibe Coding）**：
   - 「ローカルで編集 ➔ 手動圧縮 ➔ Web 画面へアップロード ➔ デプロイクリック ➔ 監視ログを手動リフレッシュ」という分断された作業を、単一の対話ループに凝縮。AI が最新コードの取得からパッチ適用、アップロード、デプロイ、稼働ログ検証まで自動完結します。

5. 🛡️ **エンタープライズセキュリティ・ガードレール**：
   - 書き込み権限の完全分離（`SAP_ALLOW_WRITE`）、セキュリティ材料とキーストアのメタデータのみの参照（パスワードや秘密鍵は一切非公開）、厳密なスキーマ検証によるインジェクション防止、バイナリ転送サイズ制限。

---

## 目次

- [主要機能一覧](#主要機能一覧)
- [SAP Clean Core 戦略とベストプラクティス原則](#sap-clean-core-戦略とベストプラクティス原則)
- [三位一体 Sub-Agent アーキテクチャ (設計・開発・テスト)](#三位一体-sub-agent-アーキテクチャ-設計開発テスト)
- [セキュリティアーキテクチャと設計](#セキュリティアーキテクチャと設計)
- [前提条件](#前提条件)
- [インストールとビルド](#インストールとビルド)
- [環境変数の設定](#環境変数の設定)
- [MCP クライアントへの導入](#mcp-クライアントへの導入)
- [Vibe Coding：SAP CPI の高速開発と検証統合](#vibe-coding-sap-cpi-の高速開発と検証統合)
  - [SAP CPI における Vibe Coding とは？](#sap-cpi-における-vibe-coding-とは)
  - [4 ステップのコアワークフロー（The Vibe Loop）](#4-ステップのコアワークフローthe-vibe-loop)
  - [実践デモ：自然言語によるホットフィックスと検証](#実践デモ自然言語によるホットフィックスと検証)
  - [効率的な Vibe Coding のヒント](#効率的な-vibe-coding-のヒント)
- [実践ユースケースと手順](#実践ユースケースと手順)
  - [ケース 1：接続確認とテナント資産の棚卸し](#ケース-1接続確認とテナント資産の棚卸し)
  - [ケース 2：iFlow のゼロからの新規作成・アップロード・デプロイ](#ケース-2iflow-のゼロからの新規作成アップロードデプロイ)
  - [ケース 3：本番メッセージのエラー診断とトラブルシューティング](#ケース-3本番メッセージのエラー診断とトラブルシューティング)
  - [ケース 4：既存 iFlow ソースコード（ZIP）のエクスポート・バックアップ](#ケース-4既存-iflow-ソースコードzipのエクスポートバックアップ)
- [ツール完全対応表](#ツール完全対応表)
- [よくある質問とトラブルシューティング](#よくある質問とトラブルシューティング)
- [貢献と開発](#貢献と開発)

---

## 主要機能一覧

合計 **22 個の専用 MCP ツール** を提供します（読み取り専用 17 ツール ＋ 書き込み・デプロイ 5 ツール）：

### 1. 資産棚卸しとテナント概要
- **接続性チェック**：OAuth2 トークン取得と SAP テナントへの通信状態を即座に確認（`cpi_check_connection`）。
- **インテグレーションパッケージ**：ID や名称でパッケージ一覧を検索・詳細取得（`cpi_list_packages`, `cpi_get_package`）。
- **セキュリティとグローバル設定**：セキュリティマテリアルのメタデータ、キーストア証明書のメタデータ、テナントグローバル変数の照会（`cpi_list_security_materials`, `cpi_list_keystore_entries`, `cpi_list_variables`）。

### 2. iFlow 設計時ライフサイクル
- **iFlow 検索**：パッケージ内の設計時成果物一覧およびバージョンメタデータの取得（`cpi_list_iflows`, `cpi_get_iflow`）。
- **ソースのインポート / エクスポート**：Base64 ZIP バンドルを用いた iFlow の新規作成・更新（`cpi_upload_iflow`）、および完全なソース ZIP のエクスポート（`cpi_download_iflow`）。

### 3. iFlow 運用管理とデプロイ
- **ワンクリックデプロイ**：設計時の指定バージョンをランタイムへデプロイ（`cpi_deploy_iflow`）。
- **ランタイム監視**：デプロイ済み成果物の実行ステータス（`STARTED` / `STOPPED` / `ERROR`）をリアルタイム取得（`cpi_list_runtime_artifacts`, `cpi_get_runtime_artifact`）。
- **ライフサイクル制御**：ランタイム成果物の起動、停止、またはアンデプロイ（`cpi_start_runtime_artifact`, `cpi_stop_runtime_artifact`, `cpi_undeploy_iflow`）。

### 4. メッセージ処理ログと診断（MPL）
- **MPL 多次元検索**：時間範囲、ステータス（`FAILED` / `COMPLETED`）、iFlow 名、`MessageGuid`、`CorrelationId` による検索（`cpi_list_message_logs`, `cpi_get_message_log`）。
- **エラースタックのドリルダウン**：エラーとなったメッセージの詳細な例外スタックトレースを直接抽出（`cpi_get_message_error`）。
- **診断パッケージと添付ファイル**：メッセージのペイロード添付ファイルを取得（`cpi_list_message_attachments`, `cpi_get_message_attachment`）、または実行ステップやカスタムヘッダーを一度に集約（`cpi_get_message_diagnostics`）。

---

## SAP Clean Core 戦略とベストプラクティス原則

現代の SAP エンタープライズアーキテクチャにおいて、**Clean Core** は S/4HANA や ERP コアの俊敏性と低コストなバージョンアップを担保する核心的アプローチです。

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SAP Clean Core 全体像                           │
├────────────────────────────────────────────────────────────────────────┤
│  [外部 SaaS / 異種システム] ──(REST / OData / Events)──┐               │
│                                                        ▼               │
│                 ┌─────────────────────────────────────────┐            │
│                 │      SAP Integration Suite (CPI)        │            │
│                 │ ─────────────────────────────────────── │            │
│                 │ • プロトコル変換 / マッピング / ルーティング│          │
│                 │ • 認証情報・セキュリティマテリアルの分離│            │
│                 │ • 非同期キューイングとべき等性の確保    │            │
│                 │ • ストリームセーフな Groovy / XSLT 処理 │            │
│                 └────────────────────┬────────────────────┘            │
│                                      │                                 │
│                   公式リリース済み API (OData v2/v4, Events)           │
│                                      ▼                                 │
│                 ┌─────────────────────────────────────────┐            │
│                 │           SAP S/4HANA (Clean Core)      │            │
│                 │ ─────────────────────────────────────── │            │
│                 │ コア業務トランザクションロジック        │            │
│                 │ [直接テーブル変更ゼロ | 独自 RFC ゼロ]  │            │
│                 └─────────────────────────────────────────┘            │
└────────────────────────────────────────────────────────────────────────┘
```

1. **コアの非侵襲性 (Zero Core Modification)**：
   システムの差異吸収、フォーマット変換、バリデーション、署名検証、リトライ処理はすべて SAP Integration Suite 側で集約・実施します。
2. **公式公開 API の徹底活用 (Released APIs First)**：
   SAP が公式に保証するリリース済み標準 API のみを使用し、SAP のアップグレードによる影響をゼロに抑えます。
3. **パラメータの 100% 外部化 (Externalization)**：
   エンドポイント、エイリアス、タイムアウト等の環境依存設定を外部化し、環境移行時のコード変更を根絶します。
4. **ストリーム処理とメモリ保護 (Safe Groovy & Streaming)**：
   メモリ消費を抑えるストリーミング処理を徹底し、ログにおける機密情報の漏洩を厳格に遮断します。

---

## 三位一体 Sub-Agent アーキテクチャ (設計・開発・テスト)

AI が単なる断片的な作業にとどまらず、統合ライフサイクル全体を自律的に遂行できるよう、標準化された **三位一体 Sub-Agent 体制** を内蔵しています（詳細は [`agents/`](agents/) および [`AGENTS.md`](AGENTS.md) 参照）：

```
               ┌─────────────────────────────────────────────────────────┐
               │              統合要件およびビジネス意図の入力           │
               └────────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │ 🏛️ cpi-design-agent (アーキテクチャ＆設計 Sub-Agent)     │
               │ • Clean Core 適合性評価と標準 API 選定 (API Hub)        │
               │ • 既存統合パッケージの再利用性評価と iFlow 設計         │
               │ • 外部化パラメータ定義・耐障害性設計                    │
               │ ➔ 成果物: 《SAP インターフェース統合設計書》             │
               └────────────────────────────┬────────────────────────────┘
                                            │ 設計ハンドオフ
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │ 🛠️ cpi-dev-agent (開発＆構築 Sub-Agent)                  │
               │ • iFlow 組み立て、パラメータバインド、例外サブプロセス  │
               │ • ストリームセーフな Groovy 実装・Base64 ZIP 生成       │
               │ • アップロード・ランタイムデプロイ実行                  │
               │ ➔ 成果物: 《デプロイ結果報告書》および変更ソースコード  │
               └────────────────────────────┬────────────────────────────┘
                                            │ デプロイハンドオフ
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │ 🔬 cpi-test-agent (品質＆テスト Sub-Agent)              │
               │ • 稼働状態確認: cpi_get_runtime_artifact (STARTED 判定) │
               │ • MPL リアルタイム追跡: cpi_list_message_logs           │
               │ • エラー詳細抽出: cpi_get_message_error, 添付ファイル検証│
               │ • 境界値テストおよび Clean Core 適合性監査              │
               │ ➔ 成果物: 《統合テスト合格認定証》 / 欠陥チケット       │
               └────────────────────────────┬────────────────────────────┘
                                            │
                   ┌────────────────────────┴────────────────────────┐
                   ▼                                                 ▼
             [テスト不合格]                                    [テスト合格]
       cpi-dev-agent へ修正フィードバック                  アーカイブおよび本番リリース
```

### 1. [🏛️ CPI Design Agent（アーキテクチャ＆設計）](agents/cpi-design-agent/prompt.md)
- **設定と規約**：[`agent.json`](agents/cpi-design-agent/agent.json) · [`prompt.md`](agents/cpi-design-agent/prompt.md) · [`contract.md`](agents/cpi-design-agent/contract.md) · [`schema.json`](agents/cpi-design-agent/schema.json)
- **静的検査スクリプト**：[`check-clean-core.mjs`](agents/cpi-design-agent/scripts/check-clean-core.mjs)
- **役割**：SAP 統合アーキテクトおよび Clean Core ガバナンスコンサルタント。
- **書き込みスコープ**：`docs/design/**` および `specs/**` に限定。テナント変更ツールの呼び出しは禁止。

### 2. [🛠️ CPI Dev Agent（開発＆構築）](agents/cpi-dev-agent/prompt.md)
- **設定と規約**：[`agent.json`](agents/cpi-dev-agent/agent.json) · [`prompt.md`](agents/cpi-dev-agent/prompt.md) · [`contract.md`](agents/cpi-dev-agent/contract.md) · [`schema.json`](agents/cpi-dev-agent/schema.json)
- **補助スクリプト**：[`check-groovy-stream.mjs`](agents/cpi-dev-agent/scripts/check-groovy-stream.mjs) · [`pack-iflow.mjs`](agents/cpi-dev-agent/scripts/pack-iflow.mjs)
- **役割**：シニア CPI 実装エンジニアおよび Vibe Coding エキスパート。
- **書き込みスコープ**：`workspace/iflows/**` および `src/scripts/**` に限定。

### 3. [🔬 CPI Test Agent（品質＆テスト）](agents/cpi-test-agent/prompt.md)
- **設定と規約**：[`agent.json`](agents/cpi-test-agent/agent.json) · [`prompt.md`](agents/cpi-test-agent/prompt.md) · [`contract.md`](agents/cpi-test-agent/contract.md) · [`schema.json`](agents/cpi-test-agent/schema.json)
- **診断整形スクリプト**：[`format-mpl-report.mjs`](agents/cpi-test-agent/scripts/format-mpl-report.mjs)
- **役割**：統合 QA エンジニアおよびランタイム診断スペシャリスト。
- **書き込みスコープ**：`test-reports/**` に限定。テナントに対しては読み取り専用診断のみ実施。

---

### 🛡️ Sub-Agent 連携における 5 つの原則

1. **境界とスコープの遵守**：各 Agent は許可されたディレクトリのみ変更可能。破壊的コマンド（`git reset --hard`、`rm -rf` など）や無断コミットは禁止。
2. **コンテキストの最小化**：全会話履歴を渡さず、目的（Objective）、対象ファイル、制約事項のみを簡潔に伝達。
3. **決定論的出力契約**：雑談を排し、各 Agent の `schema.json` に準拠した構造化 JSON ブロックを出力。
4. **サーキットブレーカー（中断条件）**：リトライは最大 3 回まで。3 連続失敗時は即座に `BLOCKED` とし、根本原因を提示してエスカレーション。
5. **排他的書き込みセット**：複数 Agent を並行実行する際、書き込み対象ファイルを完全に分離。

---

## セキュリティアーキテクチャと設計

1. **デフォルト読み取り専用保護**：
   環境変数で明示的に `SAP_ALLOW_WRITE=true` を指定しない限り、更新系ツール（`cpi_upload_iflow`, `cpi_deploy_iflow`, `cpi_undeploy_iflow` 等）は登録されません。
2. **機密情報の完全遮断**：
   Security Material や Keystore はメタデータのみを返却し、パスワードや秘密鍵の取得インターフェースは一切提供しません。
3. **厳格なパラメータ検証**：
   Zod による型検査を実施し、raw OData クエリの直接実行を防ぐため Base64URL 形式の検証を強制。
4. **メモリ保護**：
   ファイル転送サイズ上限（初期値 25 MiB: `SAP_MAX_BINARY_BYTES`）を設け、大容量データによるメモリ枯渇を防止。
5. **stdio 規格の厳守**：
   `stdout` は JSON-RPC メッセージのみを出力し、通信ログや認証ログは `stderr` へ出力します。

---

## 前提条件

- **Node.js**：20.6.0 以上（`.env` ファイルのネイティブ読み込みに対応）。
- **SAP BTP 認証情報**：
  - `Process Integration Runtime` サービスの Service Key（推奨 plan: `api`）。
  - `clientid`, `clientsecret`, `tokenurl`, および Cloud Integration テナント URL。
  - 必要なロール（`AuthGroup_Administrator`, `AuthGroup_IntegrationDeveloper` など）。

---

## インストールとビルド

```bash
# 1. プロジェクトディレクトリへ移動
cd hand-in-sap-integrationsuite

# 2. 依存関係のインストール
npm install

# 3. 型チェックとテストの実行
npm run typecheck
npm test

# 4. ビルド
npm run build
```

生成物は `dist/index.js` に出力されます。

---

## 環境変数の設定

`.env.example` をコピーして `.env` を作成します：

```bash
cp .env.example .env
```

Service Key の内容に従って設定を記述します：

```properties
# Cloud Integration テナント URL（/api/v1 は不要）
SAP_CPI_BASE_URL=https://<your-tenant>.it-cpi001.cfapps.<region>.hana.ondemand.com

# 認証タイプ: oauth2（推奨）または basic
SAP_AUTH_TYPE=oauth2

# OAuth2 認証情報
SAP_TOKEN_URL=https://<your-subdomain>.authentication.<region>.hana.ondemand.com/oauth/token
SAP_CLIENT_ID=sb-xxxx!bxxxx|it!bxxxx
SAP_CLIENT_SECRET=xxxx-xxxx-xxxx$xxxx

# 書き込みおよびデプロイツールの有効化
SAP_ALLOW_WRITE=true

# タイムアウトと転送制限
SAP_REQUEST_TIMEOUT_MS=30000
SAP_MAX_BINARY_BYTES=26214400
```

---

## MCP クライアントへの導入

### 1. Codex (CLI / Desktop) での使用

`~/.codex/config.toml` に以下を追加します：

```toml
[mcp_servers.sap_cpi]
command = "node"
args = ["/絶対パス/hand-in-sap-integrationsuite/dist/index.js"]
cwd = "/絶対パス/hand-in-sap-integrationsuite"
```

### 2. Claude Desktop での使用

`~/Library/Application Support/Claude/claude_desktop_config.json`（macOS）または `%APPDATA%\Claude\claude_desktop_config.json`（Windows）に以下を追加します：

```json
{
  "mcpServers": {
    "sap-cpi": {
      "command": "node",
      "args": ["/絶対パス/hand-in-sap-integrationsuite/dist/index.js"],
      "cwd": "/絶対パス/hand-in-sap-integrationsuite"
    }
  }
}
```

---

## Vibe Coding：SAP CPI の高速開発と検証統合

### SAP CPI における Vibe Coding とは？

従来の SAP Cloud Integration 開発では、Web 画面での多くの手作業が必要でした：
> *BTP ログイン ➔ Design タブ ➔ BPMN 要素の配置 ➔ アダプタプロパティの設定 ➔ ブラウザでの Groovy 編集 ➔ 保存＆デプロイ ➔ 監視画面へ移動 ➔ ログの手動リフレッシュ ➔ エラー確認 ➔ 再度修正……*

**本 MCP サーバーと最新の AI アシスタントにより、新たな開発スタイルが実現します：**

**「ブラウザを開くことなく、自然言語で要件を伝えるだけで、AI が Groovy 実装、BPMN 構築、ZIP パッケージング、テナント反映、デプロイ、稼働ログ確認までを数秒で自律完結します。」**

---

### 4 ステップのコアワークフロー（The Vibe Loop）

```text
  ┌──────────────────────────────────────────────────────────────┐
  │                 1. 意図駆動 (Vibe & Prompt)                   │
  │    自然言語で要件・変換ルール・例外処理ポリシーを指示        │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │             2. ローカルでの即座な変更 (In-Place Fast Patch)   │
  │    iFlow を取得 ➔ AI が Groovy/BPMN を編集 ➔ ZIP 化 ➔ アップロード │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                 3. 即時デプロイ (Instant Deploy)             │
  │    cpi_deploy_iflow 実行 ➔ 状態が STARTED になるまで自動確認 │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │         4. 自動検証と自己修復 (Self-Verify & Heal)            │
  │    テスト送信 ➔ cpi_list_message_logs で実ログを確認          │
  │    エラー時はスタックトレースを解析し自動修復                │
  └──────────────────────────────────────────────────────────────┘
```

---

### 実践デモ：自然言語によるホットフィックスと検証

#### シナリオ：既存の iFlow に電話番号のマスク処理とヘッダー付与を追加

> **開発者：**
> *「`SimpleTestIflow` を修正してください。JSON ボディ内の電話番号の中央 4 桁をマスク（138****1234）する Groovy スクリプトを追加し、ヘッダーに `X-Processed-By: Codex-AI` を設定してデプロイ・稼働確認までお願いします。」*

> **AI アシスタントの自律実行：**
> 1. `cpi_download_iflow` で現在のソースを取得。
> 2. ローカルに展開し、`src/main/resources/script/maskData.groovy` を作成：
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
> 3. `.iflw` の BPMN フローを更新してスクリプトノードを結合。
> 4. ZIP に再圧縮し、`cpi_upload_iflow` で更新。
> 5. `cpi_deploy_iflow` でデプロイを実行。
> 6. `cpi_get_runtime_artifact` でステータスが `STARTED` になったことを確認して完了報告。

---

### 効率的な Vibe Coding のヒント

1. **テスト駆動の短いサイクル**：小さな機能追加ごとにデプロイし、`cpi_list_message_logs` で動作を確認。
2. **ローカル Git での履歴管理**：AI が編集を行う前後に Git コミットを残すことで、容易な差分確認とロールバックが可能。
3. **エラーの自動自己修復**：メッセージ処理に失敗した場合は「最新のエラーメッセージを確認して原因を修正し、再デプロイして」と指示するだけで、AI が自動で自己修復します。

---

## 実践ユースケースと手順

### ケース 1：接続確認とテナント資産の棚卸し

**目的**：SAP テナントとの疎通を確認し、パッケージおよびセキュリティ設定の一覧を取得。

1. **指示**：
   > 「SAP CPI テナントの接続状況を確認し、パッケージ一覧とセキュリティ材料を表示してください。」
2. **AI の実行ツール**：
   - `cpi_check_connection`
   - `cpi_list_packages({ limit: 10 })`
   - `cpi_list_security_materials`
3. **結果**：ブラウザを開かずに、接続状況、パッケージ、設定済み認証情報メタデータを一覧表示。

---

### ケース 2：iFlow のゼロからの新規作成・アップロード・デプロイ

**目的**：パッケージ `packagemcp` 内にシンプルな中継（Pass-through）iFlow を作成してデプロイ。

1. **標準ディレクトリ構造**：
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
2. **指示**：
   > 「`packagemcp` パッケージに `SimpleTestIflow` という最小構成のフローを作成し、アップロードしてデプロイしてください。」
3. **AI の実行ツール**：
   - ZIP 作成と Base64 エンコード
   - `cpi_upload_iflow` で登録
   - `cpi_deploy_iflow` でデプロイ
   - `cpi_get_runtime_artifact` で `STARTED` を確認

---

### ケース 3：本番メッセージのエラー診断とトラブルシューティング

**目的**：直近 2 時間以内に失敗したメッセージの原因とエラースタックを特定。

1. **指示**：
   > 「過去 2 時間で `SimpleTestIflow` に失敗したメッセージはありますか？原因と詳細ログを確認してください。」
2. **AI の実行ツール**：
   - `cpi_list_message_logs({ integrationFlowName: "SimpleTestIflow", status: "FAILED", limit: 5 })`
   - `cpi_get_message_error({ messageGuid: "..." })`
   - `cpi_get_message_diagnostics`
3. **結果**：エラー発生ステップ、根本原因となった例外、改善案を要約して提示。

---

### ケース 4：既存 iFlow ソースコード（ZIP）のエクスポート・バックアップ

**目的**：指定した iFlow のソースコード一式をローカルにダウンロードして展開。

1. **指示**：
   > 「パッケージ `packagemcp` の `SimpleTestIflow` (バージョン 1.0.0) をダウンロードしてローカルに展開してください。」
2. **AI の実行ツール**：
   - `cpi_download_iflow` で Base64 ZIP を取得
   - ローカルに保存して展開

---

## ツール完全対応表

| 分類 | ツール名 | 権限 | 説明 |
|---|---|:---:|---|
| **接続確認** | `cpi_check_connection` | 読込 | OAuth 認証およびテナント疎通の確認 |
| **パッケージ** | `cpi_list_packages` | 読込 | 統合パッケージの一覧取得（ページネーション・検索対応） |
| | `cpi_get_package` | 読込 | パッケージ詳細の取得 |
| **iFlow 設計時**| `cpi_list_iflows` | 読込 | パッケージ内全 iFlow の一覧取得 |
| | `cpi_get_iflow` | 読込 | 指定バージョンの iFlow メタデータ取得 |
| | `cpi_download_iflow` | 読込 | 設計時 ZIP アーカイブのダウンロード (Base64) |
| | `cpi_upload_iflow` | **書込** | Base64 ZIP による iFlow の新規登録・更新 |
| **運用管理** | `cpi_deploy_iflow` | **書込** | iFlow のランタイムデプロイ |
| | `cpi_undeploy_iflow` | **書込** | ランタイムからのアンデプロイ |
| | `cpi_list_runtime_artifacts` | 読込 | デプロイ済み成果物と実行ステータスの一覧 |
| | `cpi_get_runtime_artifact` | 読込 | 成果物の実行ステータス取得 (STARTED / ERROR 等) |
| | `cpi_start_runtime_artifact` | **書込** | 停止中の成果物の起動 |
| | `cpi_stop_runtime_artifact` | **書込** | 実行中の成果物の停止 |
| **ログ・診断** | `cpi_list_message_logs` | 読込 | メッセージ処理ログ (MPL) の多次元検索 |
| | `cpi_get_message_log` | 読込 | MessageGuid によるログ詳細の取得 |
| | `cpi_get_message_error` | 読込 | エラー詳細および Java 例外スタックトレースの取得 |
| | `cpi_list_message_attachments` | 読込 | 添付ファイルメタデータの一覧取得 |
| | `cpi_get_message_attachment` | 読込 | 添付ファイル内容のダウンロード (Base64) |
| | `cpi_get_message_diagnostics` | 読込 | 実行ステップ、ヘッダー、アダプタプロパティの集約取得 |
| **設定・変数** | `cpi_list_variables` | 読込 | グローバル/フロー変数のキーと値の取得 |
| | `cpi_list_security_materials`| 読込 | セキュリティマテリアルのメタデータ取得 (シークレット除外) |
| | `cpi_list_keystore_entries` | 読込 | キーストアエイリアスおよび証明書メタデータの取得 |

---

## よくある質問とトラブルシューティング

### 1. `cpi_upload_iflow` や `cpi_deploy_iflow` などの書き込みツールが表示されない
- `.env` で `SAP_ALLOW_WRITE=true` が設定されているか確認し、MCP サーバーを再起動してください。

### 2. HTTP 401 Unauthorized エラーが発生する
- `SAP_TOKEN_URL`、`SAP_CLIENT_ID`、`SAP_CLIENT_SECRET` が BTP Service Key と一致しているか確認してください。Token URL に `/oauth/token` が含まれている必要があります。

### 3. HTTP 403 Forbidden エラーが発生する
- BTP Cockpit のユーザー/クライアント設定で、`AuthGroup_Administrator` や `IntegrationArtifact.Edit`、`IntegrationArtifact.Deploy` などの権限が付与されているか確認してください。

### 4. アップロード時に `Invalid value: 'undefined'` が返る
- 必須パラメータが設定されているか確認してください。SDK から直接呼び出す場合は `limit` などのパラメータを明示的に指定してください。

### 5. 通信ログやデバッグ情報を確認するには？
- MCP プロトコルは `stdout` を使用して JSON-RPC を通信します。すべての接続ログやエラーログは `stderr` に出力されるため、クライアントのデバッグコンソールから確認できます。

---

## 貢献と開発

コントリビューションやプルリクエストを歓迎します。コード変更時はテストを実行してください：

```bash
npm run typecheck
npm test
npm run build
```
