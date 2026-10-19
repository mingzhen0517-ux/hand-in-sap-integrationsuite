# SAP Cloud Integration MCP Server

[![Node.js](https://img.shields.io/badge/node-%3E%3D20-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-1.30-purple.svg)](https://modelcontextprotocol.io/)

[ [中文](README.md) | [English](README.en.md) | [日本語](README.ja.md) | **한국어** ]

표준 **Model Context Protocol (MCP)** 기반으로 구축된 엔터프라이즈급 로컬 stdio 서버로, **SAP Cloud Integration (CPI / SAP Integration Suite)** 을 위해 특별히 설계되었습니다.

SAP BTP 클라우드 통합 플랫폼의 기능을 최신 AI 코딩 어시스턴트(OpenAI Codex, Claude Desktop, Cursor 등)에 완벽하게 제공합니다. **SAP Clean Core 전략 및 SAP Best Practice를 바탕으로 엔터프라이즈 통합 전체 수명 주기의 지능형 혁신과 "Vibe Coding" 초고속 딜리버리를 지원합니다.**

### 🌟 핵심 가치 요약 (Strategic Highlights)

1. 🏛️ **Clean Core 전략 허브 (Keep the Core Clean)**:
   - **코어 무침해 (Zero Core Modification)**: S/4HANA / ERP 코어 내에서 맞춤형 Z-프로그램 작성, 로우레벨 물리 테이블 직접 읽기/쓰기, 취약한 RFC 점대점 인터페이스 구축 관행을 완전히 배제합니다. 이기종 시스템 결합 해제, 프로토콜 변환, 메시지 정제 및 통합 오케스트레이션은 모두 SAP Integration Suite에서 담당합니다.
   - **공식 표준 API 우선 (Released Standard APIs First)**: [SAP Business Accelerator Hub](https://api.sap.com)에서 공식 발표된 표준 OData v2/v4, REST, SOAP 인터페이스 및 엔터프라이즈 비즈니스 이벤트(SAP Event Mesh)만 연동하여 코어 시스템의 무중단 업그레이드를 보장합니다.

2. 🏆 **SAP Integration Best Practice 표준 준수**:
   - **사전 구축 표준 콘텐츠 우선**: Content Hub의 사전 패키징된 Integration Packages를 최우선으로 재사용하여 중복 개발을 방지합니다.
   - **파라미터 100% 외부화 (Externalization)**: 엔드포인트, 경로, 자격 증명 식별자, 타임아웃 설정을 모두 외부화 파라미터(`parameters.prop`)로 관리하여 하드코딩을 원천 차단합니다.
   - **스트리밍 안전 Groovy 코딩 규칙**: JVM OOM(메모리 고갈)을 방지하기 위해 대용량 페이로드의 인메모리 전체 로딩을 금지하고, 스트리밍 리더(`Reader` / `InputStream`)와 방어적 null 체크, 민감 정보 마스킹을 엄격히 적용합니다.
   - **고가용성 및 복원력**: Exception Subprocess, ProcessDirect 마이크로 플로우 모듈화, 멱등성 수신자(Idempotent Receiver), JMS 기반 저장 후 전달(Store-and-Forward) 및 데드레터 큐(Dead Letter Queue)를 표준화합니다.

3. 🤖 **삼위일체 Sub-Agent 체계 (설계 · 개발 · 테스트 루프)**:
   - **설계(Design)**, **개발(Dev)**, **테스트(Test)** 역할을 전담하는 Sub-Agent를 구성하여 22개의 네이티브 MCP 도구를 매끄럽게 오케스트레이션합니다:
     - **[🏛️ 아키텍처 및 설계 Sub-Agent (`cpi-design-agent`)](agents/cpi-design-agent.md)**: Clean Core 규정 준수 평가, 표준 API/이벤트 선정, 외부화 파라미터 규약 정의 및 장애 허용 청사진 수립.
     - **[🛠️ 개발 및 빌드 Sub-Agent (`cpi-dev-agent`)](agents/cpi-dev-agent.md)**: iFlow 조립, 스트리밍 안전 Groovy 스크립팅, Base64 ZIP 패키징, 자연어 기반 Vibe Coding 핫패치 및 배포.
     - **[🔬 품질 및 테스트 Sub-Agent (`cpi-test-agent`)](agents/cpi-test-agent.md)**: 런타임 준비 점검(`STARTED` 게이트), E2E 테스트, 실시간 MPL 로그 추적, 에러 스택 상세 분석(ErrorInformation), 페이로드 첨부 파일 검증 및 Clean Core 감사.

4. 🔄 **개발/수정/배포/검증 일체화 (수초 만에 완료되는 Vibe Coding)**:
   - "로컬 작성 ➔ 수동 압축 ➔ 브라우저 업로드 ➔ 배포 클릭 ➔ 모니터링 로그 새로고침 반복"으로 이어지던 번거로운 수작업을 자연어 대화 루프 하나로 압축합니다. AI가 최신 소스를 가져와 즉시 수정, 패키징, 배포하고 실시간 런타임 MPL 로그를 분석하여 자체 검증을 완료합니다.

5. 🛡️ **엔터프라이즈급 보안 가드레일**:
   - 쓰기 권한 격리(`SAP_ALLOW_WRITE`), 보안 자격 증명 및 키저장소 메타데이터 전용 조회(비밀번호 및 개인 키 미노출), Zod 기반 스키마 인젝션 방어, 바이너리 전송 크기 제한.

---

## 목차

- [핵심 기능 일람](#핵심-기능-일람)
- [SAP Clean Core 전략 및 모범 사례 원칙](#sap-clean-core-전략-및-모범-사례-원칙)
- [삼위일체 Sub-Agent 체계 (설계 · 개발 · 테스트)](#삼위일체-sub-agent-체계-설계--개발--테스트)
- [보안 아키텍처 및 보안 설계](#보안-아키텍처-및-보안-설계)
- [환경 준비](#환경-준비)
- [설치 및 빌드](#설치-및-빌드)
- [환경 설정](#환경-설정)
- [MCP 클라이언트 설정](#mcp-클라이언트-설정)
- [Vibe Coding: SAP CPI 초고속 개발 및 배포 검증 일체화](#vibe-coding-sap-cpi-초고속-개발-및-배포-검증-일체화)
  - [SAP CPI에서의 Vibe Coding이란?](#sap-cpi에서의-vibe-coding이란)
  - [핵심 워크플로우: 4단계 루프 (The Vibe Loop)](#핵심-워크플로우-4단계-루프-the-vibe-loop)
  - [실전 시나리오: 순수 자연어를 통한 핫픽스 및 검증](#실전-시나리오-순수-자연어를-통한-핫픽스-및-검증)
  - [효율적인 Vibe Coding 팁](#효율적인-vibe-coding-팁)
- [실전 사용 사례 및 세부 절차](#실전-사용-사례-및-세부-절차)
  - [사례 1: 연결 검증 및 테넌트 자산 인벤토리 점검](#사례-1-연결-검증-및-테넌트-자산-인벤토리-점검)
  - [사례 2: 기초 iFlow 생성, 업로드 및 배포](#사례-2-기초-iflow-생성-업로드-및-배포)
  - [사례 3: 운영 메시지 장애 조사 및 에러 진단](#사례-3-운영-메시지-장애-조사-및-에러-진단)
  - [사례 4: 기존 iFlow 소스 ZIP 백업 및 다운로드](#사례-4-기존-iflow-소스-zip-백업-및-다운로드)
- [도구 전체 매트릭스](#도구-전체-매트릭스)
- [자주 묻는 질문 및 문제 해결](#자주-묻는-질문-및-문제-해결)
- [기여 및 개발](#기여-및-개발)

---

## 핵심 기능 일람

총 **22개의 전용 MCP 도구**를 제공합니다 (읽기 전용 17개 + 쓰기 및 배포 5개):

### 1. 자산 인벤토리 및 테넌트 개요
- **연결 상태 확인**: OAuth2 토큰 발급 및 SAP 테넌트 통신 상태를 1초 이내에 검증 (`cpi_check_connection`).
- **통합 패키지 (Integration Packages)**: 패키지 ID 또는 이름으로 통합 패키지 메타데이터 및 설명 조회 (`cpi_list_packages`, `cpi_get_package`).
- **보안 및 전역 설정 점검**: 보안 자료(User Credentials / OAuth Credentials) 메타데이터, 키저장소(Keystore Entries) 인증서 메타데이터 및 테넌트 전역 변수 조회 (`cpi_list_security_materials`, `cpi_list_keystore_entries`, `cpi_list_variables`).

### 2. iFlow 설계 시간(Design-Time) 라이프사이클
- **iFlow 검색**: 패키지 내 모든 설계 아티팩트 목록 검색 및 버전별 상세 메타데이터 조회 (`cpi_list_iflows`, `cpi_get_iflow`).
- **iFlow 소스 임포트/익스포트**: Base64 ZIP 패키지를 사용하여 iFlow를 **신규 생성**하거나 **업데이트** (`cpi_upload_iflow`), 전체 소스 ZIP **내보내기/다운로드** (`cpi_download_iflow`).

### 3. iFlow 런타임 운영 및 배포
- **원클릭 배포**: 설계 시간의 지정된 iFlow 버전을 런타임에 컴파일 및 배포 (`cpi_deploy_iflow`).
- **런타임 모니터링**: 배포된 아티팩트의 실시간 상태(`STARTED` / `STOPPED` / `ERROR`) 확인 (`cpi_list_runtime_artifacts`, `cpi_get_runtime_artifact`).
- **라이프사이클 제어**: 런타임 아티팩트의 시작, 중지 또는 배포 취소(Undeploy) (`cpi_start_runtime_artifact`, `cpi_stop_runtime_artifact`, `cpi_undeploy_iflow`).

### 4. 메시지 처리 로그 및 진단 (MPL 모니터링)
- **다차원 MPL 검색**: 시간 범위, 상태(`FAILED` / `COMPLETED`), iFlow 식별자, `MessageGuid`, `CorrelationId` 기준 검색 (`cpi_list_message_logs`, `cpi_get_message_log`).
- **에러 스택 드릴다운**: 실패 메시지의 상세 예외 스택 및 근본 원인 분석 (`cpi_get_message_error`).
- **진단 및 페이로드 첨부 파일**: 메시지 페이로드 첨부 파일 조회 (`cpi_list_message_attachments`, `cpi_get_message_attachment`), 커스텀 헤더, 어댑터 속성, 실행 단계 일괄 집계 (`cpi_get_message_diagnostics`).

---

## SAP Clean Core 전략 및 모범 사례 원칙

최신 엔터프라이즈 아키텍처에서 **Clean Core**는 S/4HANA 및 ERP 시스템의 지속적인 혁신과 안전한 업그레이드를 보장하는 핵심 전략입니다.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SAP Clean Core 아키텍처                         │
├────────────────────────────────────────────────────────────────────────┤
│  [외부 SaaS / 이기종 시스템] ──(REST / OData / Events)──┐              │
│                                                         ▼              │
│                 ┌─────────────────────────────────────────┐            │
│                 │      SAP Integration Suite (CPI)        │            │
│                 │ ─────────────────────────────────────── │            │
│                 │ • 프로토콜 변환 / 매핑 / 라우팅 규칙    │            │
│                 │ • 보안 자격 증명 격리 (Security Material)│            │
│                 │ • 비동기 큐잉 및 멱등성 보장 (JMS / EDA)│            │
│                 │ • 스트리밍 안전 Groovy & XSLT 처리      │            │
│                 └────────────────────┬────────────────────┘            │
│                                      │                                 │
│                   표준 발표 API (OData v2/v4, Events)                  │
│                                      ▼                                 │
│                 ┌─────────────────────────────────────────┐            │
│                 │           SAP S/4HANA (Clean Core)      │            │
│                 │ ─────────────────────────────────────── │            │
│                 │ 핵심 비즈니스 트랜잭션 로직             │            │
│                 │ [DB 직접 수정 제로 | 맞춤형 RFC 제로]   │            │
│                 └─────────────────────────────────────────┘            │
└────────────────────────────────────────────────────────────────────────┘
```

1. **코어 무침해 (Zero Core Modification)**: 시스템 간 포맷 변환, 매핑, 유효성 검증, 에러 재시도는 Integration Suite에서 전담하여 코어 시스템을 보호합니다.
2. **공식 표준 API 우선 (Released APIs First)**: SAP가 공식 보증하는 표준 인터페이스만 사용하여 SAP 업그레이드 시 발생하는 영향을 제거합니다.
3. **파라미터 100% 외부화 (Externalization)**: 모든 엔드포인트 및 타임아웃을 외부 파라미터로 관리하여 코드 수정 없는 환경 이관을 실현합니다.
4. **스트리밍 안전성 및 메모리 보호 (Safe Groovy & Streaming)**: 스트리밍 읽기를 통해 JVM OOM을 원천 차단하고 로그 내 민감 정보를 철저히 마스킹합니다.

---

## 삼위일체 Sub-Agent 체계 (설계 · 개발 · 테스트)

단순한 개별 도구 호출을 넘어 엔터프라이즈 통합 전체 수명 주기를 유기적으로 협업하기 위해 **삼위일체 Sub-Agent 체계**가 사전 구축되어 있습니다 (자세한 내용은 [`agents/`](agents/) 및 [`AGENTS.md`](AGENTS.md) 참조):

```
               ┌─────────────────────────────────────────────────────────┐
               │              비즈니스 통합 목표 및 프롬프트             │
               └────────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │ 🏛️ cpi-design-agent (아키텍처 및 설계 Sub-Agent)        │
               │ • Clean Core 적합성 평가 및 표준 API 선정 (API Hub)     │
               │ • 기존 패키지 재사용 평가 및 iFlow 아키텍처 청사진 설계 │
               │ • 외부화 파라미터 정의 및 내결함성 설계                 │
               │ ➔ 산출물: 《SAP 인터페이스 통합 아키텍처 설계서》      │
               └────────────────────────────┬────────────────────────────┘
                                            │ 설계 인계
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │ 🛠️ cpi-dev-agent (개발 및 빌드 Sub-Agent)               │
               │ • iFlow 조립, 외부화 파라미터 바인딩, 예외 서브프로세스│
               │ • 스트리밍 안전 Groovy 작성 및 Base64 ZIP 패키징        │
               │ • 업로드 및 런타임 배포 트리거                          │
               │ ➔ 산출물: 배포 결과 보고서 및 수정된 소스 코드          │
               └────────────────────────────┬────────────────────────────┘
                                            │ 배포 인계
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │ 🔬 cpi-test-agent (품질 및 테스트 Sub-Agent)            │
               │ • 런타임 준비 점검: cpi_get_runtime_artifact (STARTED) │
               │ • 실시간 MPL 추적: cpi_list_message_logs               │
               │ • 오류 상세 분석: cpi_get_message_error, 첨부 파일 검증 │
               │ • 경계값 테스트 및 Clean Core 감사                     │
               │ ➔ 산출물: 《통합 테스트 품질 인증 보고서》 / 결함 티켓 │
               └────────────────────────────┬────────────────────────────┘
                                            │
                   ┌────────────────────────┴────────────────────────┐
                   ▼                                                 ▼
             [테스트 실패]                                     [테스트 통과]
        cpi-dev-agent로 피드백 반환                        아카이브 및 운영 릴리스
```

### 1. [🏛️ CPI Design Agent (아키텍처 및 설계)](agents/cpi-design-agent/prompt.md)
- **설정 및 규약**: [`agent.json`](agents/cpi-design-agent/agent.json) · [`prompt.md`](agents/cpi-design-agent/prompt.md) · [`contract.md`](agents/cpi-design-agent/contract.md) · [`schema.json`](agents/cpi-design-agent/schema.json)
- **점검 스크립트**: [`check-clean-core.mjs`](agents/cpi-design-agent/scripts/check-clean-core.mjs)
- **역할**: SAP 통합 아키텍트 및 Clean Core 거버넌스 컨설턴트.
- **작업 범위**: `docs/design/**` 및 `specs/**` 디렉터리에 한정되며 테넌트 변경 도구 호출은 엄격히 차단됩니다.

### 2. [🛠️ CPI Dev Agent (개발 및 빌드)](agents/cpi-dev-agent/prompt.md)
- **설정 및 규약**: [`agent.json`](agents/cpi-dev-agent/agent.json) · [`prompt.md`](agents/cpi-dev-agent/prompt.md) · [`contract.md`](agents/cpi-dev-agent/contract.md) · [`schema.json`](agents/cpi-dev-agent/schema.json)
- **보조 스크립트**: [`check-groovy-stream.mjs`](agents/cpi-dev-agent/scripts/check-groovy-stream.mjs) · [`pack-iflow.mjs`](agents/cpi-dev-agent/scripts/pack-iflow.mjs)
- **역할**: 시니어 CPI 구현 엔지니어 및 Vibe Coding 스페셜리스트.
- **작업 범위**: `workspace/iflows/**` 및 `src/scripts/**` 디렉터리에 한정됩니다.

### 3. [🔬 CPI Test Agent (품질 및 테스트)](agents/cpi-test-agent/prompt.md)
- **설정 및 규약**: [`agent.json`](agents/cpi-test-agent/agent.json) · [`prompt.md`](agents/cpi-test-agent/prompt.md) · [`contract.md`](agents/cpi-test-agent/contract.md) · [`schema.json`](agents/cpi-test-agent/schema.json)
- **진단 리포팅 스크립트**: [`format-mpl-report.mjs`](agents/cpi-test-agent/scripts/format-mpl-report.mjs)
- **역할**: 통합 QA 엔지니어 및 런타임 진단 전문가.
- **작업 범위**: `test-reports/**` 디렉터리에 한정되며 읽기 전용 런타임 진단만 수행합니다.

---

### 🛡️ Sub-Agent 5대 협업 원칙

1. **엄격한 작업 경계 준수**: 각 에이전트는 허용된 디렉터리 내에서만 파일을 변경할 수 있으며, 파괴적인 명령어(`git reset --hard`, `rm -rf` 등)나 무단 커밋은 엄격히 금지됩니다.
2. **컨텍스트 최소화**: 전체 대화 기록을 덤프하지 않고, 현재 작업 목표(Objective), 참조 파일, 명확한 제약 조건만 전달합니다.
3. **결정론적 출력 계약**: 사담을 배제하고 자체 `schema.json`에 맞춘 정형화된 JSON 블록을 반환하여 오차 없는 파싱을 보장합니다.
4. **서킷 브레이커 (종료 조건)**: 재시도 횟수는 최대 3회로 제한됩니다. 3회 연속 실패 시 즉시 `BLOCKED` 상태로 전환하고 근본 원인을 에스컬레이션합니다.
5. **독립된 쓰기 세트**: 다수의 서브 에이전트가 병렬 실행될 때 쓰기 대상 디렉터리를 상호 배타적으로 격리합니다.

---

## 보안 아키텍처 및 보안 설계

1. **기본 읽기 전용 보호**:
   환경 변수 `SAP_ALLOW_WRITE=true`가 명시되지 않는 한 쓰기 및 배포 도구(`cpi_upload_iflow`, `cpi_deploy_iflow`, `cpi_undeploy_iflow` 등)는 MCP에 등록되지 않습니다.
2. **민감 자격 증명 유출 원천 차단**:
   보안 자료 및 키저장소 도구는 메타데이터만 노출하며 비밀번호나 개인 키를 내보내는 인터페이스는 일체 제공하지 않습니다.
3. **엄격한 파라미터 검증**:
   Zod를 통한 엄격한 타입 검증을 수행하며, 페이지네이션 커서는 Base64URL 유효성 검증을 거쳐 임의의 OData 인젝션을 방지합니다.
4. **메모리 및 바이너리 보호**:
   업로드/다운로드 파일 전송 크기 제한(기본값 25 MiB: `SAP_MAX_BINARY_BYTES`)을 적용하여 메모리 오버플로우를 예방합니다.
5. **stdio 프로토콜 오염 방지**:
   모든 내부 실행 로그 및 인증 재시도 메시지는 `stderr`로만 출력되며, `stdout`은 순수한 JSON-RPC 메시지만 전달합니다.

---

## 환경 준비

- **Node.js**: 20.6.0 이상 (기본 환경 변수 로드 지원).
- **SAP BTP 자격 증명**:
  - SAP BTP Cockpit에서 생성한 `Process Integration Runtime` 서비스 키 (권장 플랜: `api`).
  - `clientid`, `clientsecret`, `tokenurl`, Cloud Integration 테넌트 URL.
  - 필요한 역할 (`AuthGroup_Administrator`, `AuthGroup_IntegrationDeveloper` 등).

---

## 설치 및 빌드

```bash
# 1. 저장소 클론 및 디렉터리 이동
cd hand-in-sap-integrationsuite

# 2. 패키지 설치
npm install

# 3. 타입 체크 및 단위 테스트 실행
npm run typecheck
npm test

# 4. 빌드
npm run build
```

빌드 결과물은 `dist/index.js`에 생성됩니다.

---

## 환경 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성합니다:

```bash
cp .env.example .env
```

Service Key 정보를 기반으로 `.env`를 작성합니다:

```properties
# Cloud Integration 테넌트 URL (/api/v1 제외)
SAP_CPI_BASE_URL=https://<your-tenant>.it-cpi001.cfapps.<region>.hana.ondemand.com

# 인증 유형: oauth2 (권장) 또는 basic
SAP_AUTH_TYPE=oauth2

# OAuth2 자격 증명 (BTP Service Key 기준)
SAP_TOKEN_URL=https://<your-subdomain>.authentication.<region>.hana.ondemand.com/oauth/token
SAP_CLIENT_ID=sb-xxxx!bxxxx|it!bxxxx
SAP_CLIENT_SECRET=xxxx-xxxx-xxxx$xxxx

# 쓰기 및 배포 도구 활성화 여부
SAP_ALLOW_WRITE=true

# 타임아웃 및 전송 크기 제한
SAP_REQUEST_TIMEOUT_MS=30000
SAP_MAX_BINARY_BYTES=26214400
```

---

## MCP 클라이언트 설정

### 1. Codex (CLI / Desktop) 설정

`~/.codex/config.toml`에 다음 설정을 추가합니다:

```toml
[mcp_servers.sap_cpi]
command = "node"
args = ["/절대경로/hand-in-sap-integrationsuite/dist/index.js"]
cwd = "/절대경로/hand-in-sap-integrationsuite"
```

### 2. Claude Desktop 설정

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) 또는 `%APPDATA%\Claude\claude_desktop_config.json` (Windows)에 추가합니다:

```json
{
  "mcpServers": {
    "sap-cpi": {
      "command": "node",
      "args": ["/절대경로/hand-in-sap-integrationsuite/dist/index.js"],
      "cwd": "/절대경로/hand-in-sap-integrationsuite"
    }
  }
}
```

---

## Vibe Coding: SAP CPI 초고속 개발 및 배포 검증 일체화

### SAP CPI에서의 Vibe Coding이란?

기존의 SAP Cloud Integration 개발 방식은 반복적이고 수동적인 작업의 연속이었습니다:
> *BTP 접속 ➔ Design 이동 ➔ BPMN 노드 드래그 ➔ 어댑터 속성 수동 설정 ➔ 웹 에디터에서 Groovy 코딩 ➔ Save & Deploy 클릭 ➔ 모니터링 화면 전환 ➔ MPL 로그 새로고침 반복 ➔ 에러 확인 후 다시 수정……*

**본 MCP 서버와 최신 AI 어시스턴트를 활용하면 완전히 새로운 개발 흐름이 시작됩니다:**

**"브라우저를 열지 않고도 자연어로 요구사항을 표현하면, AI가 Groovy 스크립트 작성, BPMN 플로우 구성, ZIP 패키징, 업로드, 배포 및 실시간 MPL 로그 검증까지 수초 만에 자동으로 완료합니다."**

---

### 핵심 워크플로우: 4단계 루프 (The Vibe Loop)

```text
  ┌──────────────────────────────────────────────────────────────┐
  │                 1. 의도 및 요구사항 표현 (Vibe)             │
  │     자연어로 비즈니스 요구사항, 변환 규칙, 예외 정책 설명    │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │             2. 로컬 고속 패치 (In-Place Fast Patch)          │
  │    iFlow 소스 다운로드 ➔ AI가 Groovy/BPMN 수정 ➔ 압축 업로드 │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                 3. 즉각적인 배포 (Instant Deploy)            │
  │      cpi_deploy_iflow 실행 ➔ 런타임 상태가 STARTED 될 때까지 확인│
  └──────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │         4. 자동 검증 및 자가 치유 (Self-Verify & Heal)       │
  │    테스트 전송 ➔ cpi_list_message_logs로 실제 런타임 로그 확인 │
  │    에러 발생 시 스택 추적을 분석하여 자동으로 수정 및 재배포 │
  └──────────────────────────────────────────────────────────────┘
```

---

### 실전 시나리오: 순수 자연어를 통한 핫픽스 및 검증

#### 시나리오: 기존 iFlow에 전화번호 마스킹 및 커스텀 헤더 로직 추가

> **개발자:**
> *"기존 `SimpleTestIflow`를 수정해줘: JSON 바디의 전화번호 가운데 4자리를 마스킹(예: 138****1234)하는 Groovy 스크립트를 추가하고, 헤더에 `X-Processed-By: Codex-AI`를 넣어서 배포하고 런타임 상태까지 확인해줘."*

> **AI 어시스턴트 자율 실행:**
> 1. `cpi_download_iflow`를 호출하여 최신 소스를 다운로드.
> 2. 압축 해제 후 `src/main/resources/script/maskData.groovy` 작성:
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
> 3. BPMN `.iflw` 파일을 업데이트하여 스크립트 노드 연결.
> 4. ZIP으로 자동 압축 후 `cpi_upload_iflow`로 업로드.
> 5. `cpi_deploy_iflow`를 호출하여 배포.
> 6. `cpi_get_runtime_artifact`를 조회하여 상태가 `STARTED`로 변경된 것을 확인하고 보고.

---

### 효율적인 Vibe Coding 팁

1. **테스트 주도 반복 개발**: 기능 추가 시마다 배포를 실행하고 `cpi_list_message_logs`로 검증하여 피드백 루프를 짧게 유지하세요.
2. **로컬 Git 히스토리 관리**: AI가 수정하기 전후로 Git 커밋을 기록하면 손쉽게 변경 사항을 비교하고 롤백할 수 있습니다.
3. **에러 자동 자가 치유**: 메시지 처리가 실패했을 때 *"최근 실패한 메시지의 에러 로그를 확인하고 원인을 고쳐서 다시 배포해줘"* 라고 지시하면 AI가 에러를 읽고 스스로 코드를 수정합니다!

---

## 실전 사용 사례 및 세부 절차

### 사례 1: 연결 검증 및 테넌트 자산 인벤토리 점검

**목표**: SAP 테넌트 연결 상태를 확인하고 패키지 및 자격 증명 메타데이터를 조회합니다.

1. **프롬프트**:
   > "현재 SAP CPI 테넌트 연결 상태를 확인하고, 등록된 패키지와 보안 자격 증명 목록을 보여줘."
2. **AI 도구 호출 흐름**:
   - `cpi_check_connection`
   - `cpi_list_packages({ limit: 10 })`
   - `cpi_list_security_materials`
3. **결과**: 브라우저에 접속하지 않고도 연결 상태, 패키지 목록, 구성된 자격 증명 메타데이터를 즉시 확인.

---

### 사례 2: 기초 iFlow 생성, 업로드 및 배포

**목표**: `packagemcp` 패키지 안에 최소 구성의 패스스루 iFlow를 생성하고 배포합니다.

1. **표준 아티팩트 디렉터리 구조**:
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
2. **프롬프트**:
   > "`packagemcp` 패키지에 `SimpleTestIflow`라는 기본 플로우를 생성해서 업로드하고 배포해줘."
3. **AI 도구 호출 흐름**:
   - ZIP 압축 및 Base64 인코딩
   - `cpi_upload_iflow` 호출
   - `cpi_deploy_iflow` 호출
   - `cpi_get_runtime_artifact`로 `STARTED` 상태 검증

---

### 사례 3: 운영 메시지 장애 조사 및 에러 진단

**목표**: 최근 2시간 내 실패한 메시지의 원인 및 예외 스택을 파악합니다.

1. **프롬프트**:
   > "최근 2시간 동안 `SimpleTestIflow`에서 실패한 메시지가 있는지 확인하고 원인을 알려줘."
2. **AI 도구 호출 흐름**:
   - `cpi_list_message_logs({ integrationFlowName: "SimpleTestIflow", status: "FAILED", limit: 5 })`
   - `MessageGuid` 획득
   - `cpi_get_message_error`로 예외 스택 확인
   - `cpi_get_message_diagnostics`로 실행 단계 및 헤더 확인
3. **결과**: 오류 발생 노드, 상세 예외 내용 및 수정 가이드를 종합 요약.

---

### 사례 4: 기존 iFlow 소스 ZIP 백업 및 다운로드

**목표**: 지정된 iFlow의 소스 ZIP을 로컬에 다운로드하고 압축을 해제합니다.

1. **프롬프트**:
   > "`packagemcp` 패키지의 `SimpleTestIflow` (버전 1.0.0) 소스를 다운로드해서 로컬에 풀어줘."
2. **AI 도구 호출 흐름**:
   - `cpi_download_iflow` 호출
   - Base64 디코딩 후 로컬에 파일 생성 및 압축 해제

---

## 도구 전체 매트릭스

| 분류 | 도구 이름 | 권한 | 상세 설명 |
|---|---|:---:|---|
| **연결 확인** | `cpi_check_connection` | 읽기 | OAuth 인증 및 테넌트 런타임 연결 확인 |
| **패키지** | `cpi_list_packages` | 읽기 | 설계 패키지 목록 조회 (페이징/필터링 지원) |
| | `cpi_get_package` | 읽기 | 패키지 ID로 상세 정보 조회 |
| **iFlow 설계** | `cpi_list_iflows` | 읽기 | 패키지 내 모든 iFlow 목록 조회 |
| | `cpi_get_iflow` | 읽기 | 특정 버전 iFlow 메타데이터 조회 |
| | `cpi_download_iflow` | 읽기 | iFlow 설계 ZIP 다운로드 (Base64) |
| | `cpi_upload_iflow` | **쓰기** | Base64 ZIP을 통한 iFlow 신규 등록/업데이트 |
| **운영 및 배포**| `cpi_deploy_iflow` | **쓰기** | 특정 버전 iFlow를 런타임에 배포 |
| | `cpi_undeploy_iflow` | **쓰기** | 런타임 아티팩트 배포 취소 |
| | `cpi_list_runtime_artifacts` | 읽기 | 배포된 런타임 아티팩트 및 상태 조회 |
| | `cpi_get_runtime_artifact` | 읽기 | 특정 아티팩트 상태 조회 (STARTED / ERROR 등) |
| | `cpi_start_runtime_artifact` | **쓰기** | 중지된 런타임 아티팩트 시작 |
| | `cpi_stop_runtime_artifact` | **쓰기** | 실행 중인 런타임 아티팩트 중지 |
| **로그 및 진단**| `cpi_list_message_logs` | 읽기 | 메시지 처리 로그 (MPL) 다차원 검색 |
| | `cpi_get_message_log` | 읽기 | MessageGuid 기준 단일 메시지 로그 메타데이터 조회 |
| | `cpi_get_message_error` | 읽기 | 에러 상세 정보 및 Java 예외 스택 조회 |
| | `cpi_list_message_attachments`| 읽기 | 메시지 첨부 파일 메타데이터 목록 조회 |
| | `cpi_get_message_attachment` | 읽기 | 첨부 파일 내용 다운로드 (Base64) |
| | `cpi_get_message_diagnostics` | 읽기 | 실행 단계, 헤더, 어댑터 속성 종합 조회 |
| **보안 및 변수**| `cpi_list_variables` | 읽기 | 전역/iFlow 변수 키 및 값 조회 |
| | `cpi_list_security_materials`| 읽기 | 보안 자료 메타데이터 조회 (비밀번호 제외) |
| | `cpi_list_keystore_entries` | 읽기 | 키저장소 에일리어스 및 인증서 메타데이터 조회 |

---

## 자주 묻는 질문 및 문제 해결

### 1. `cpi_upload_iflow`, `cpi_deploy_iflow` 등 쓰기 도구가 보이지 않습니다.
- `.env`에 `SAP_ALLOW_WRITE=true`가 설정되어 있는지 확인하고 MCP 서버 프로세스를 재시작하세요.

### 2. HTTP 401 Unauthorized 오류가 발생합니다.
- `SAP_TOKEN_URL`, `SAP_CLIENT_ID`, `SAP_CLIENT_SECRET`이 BTP Service Key와 일치하는지 확인하세요. Token URL에 `/oauth/token`이 포함되어 있어야 합니다.

### 3. HTTP 403 Forbidden 오류가 발생합니다.
- BTP Cockpit의 기술 사용자 권한에 `AuthGroup_Administrator`, `IntegrationArtifact.Edit`, `IntegrationArtifact.Deploy` 등의 역할이 부여되어 있는지 확인하세요.

### 4. 업로드 시 `Invalid value: 'undefined'` 오류가 발생합니다.
- 필수 파라미터가 누락되지 않았는지 확인하세요. SDK에서 호출하는 경우 명시적으로 `limit`을 포함한 객체를 전달해야 합니다.

### 5. 통신 로그 및 디버깅 정보는 어디서 확인하나요?
- MCP는 `stdout`을 통해 JSON-RPC 데이터를 주고받습니다. 모든 디버그 로그 및 인증 에러는 `stderr`로 출력되므로 클라이언트의 개발자 콘솔에서 확인할 수 있습니다.

---

## 기여 및 개발

기여 및 풀 리퀘스트를 환영합니다! 코드 제출 전 테스트를 실행해 주세요:

```bash
npm run typecheck
npm test
npm run build
```
