# Technical Requirements Document (TRD)

## Document Control
**Document ID:** TRD-ITW-V6.1  
**Version:** 1.0  
**Status:** Approved for Pilot  
**Created Date:** 28 September 2026  
**Last Updated Date:** 28 September 2026  
**Owner:** Manjunath H Annigeri  
**Approver:** Manjunath H Annigeri  

---

## 1. System Architecture Overview
ItWield V6.1 is a distributed, event-driven architecture designed to operate continuous autonomous AI loops securely. The architecture strictly isolates deterministic business logic (Control Layer, Verification) from non-deterministic logic (LLM Generation, Executive Planning). 

The system operates across three primary physical tiers:
1.  **Frontend Client:** React-based single-page application hosted on Vercel.
2.  **Backend Core:** Node.js/TypeScript background task engine and API hosted on Render.
3.  **Data & Auth:** PostgreSQL with Row-Level Security (RLS) hosted on Supabase.

## 2. Technology Stack
*   **Frontend:** React, TypeScript, Vite, Tailwind CSS.
*   **Backend:** Node.js, TypeScript, Express (for API routing).
*   **Database:** PostgreSQL (via Supabase), Prisma / Supabase Client.
*   **AI Providers:** OpenAI / Anthropic (strictly accessed via backend SDKs, never exposed to frontend).
*   **Infrastructure:** Vercel (Web), Render (Worker & API), Supabase (DB & Auth).
*   **Testing:** Vitest for E2E and unit validations.

---

## 3. Core Subsystems

### 3.1. Company Control Layer & Authorization Registry
The Control Layer is the mandatory chokepoint for all mutations and reads against external provider integrations.
*   **Mechanism:** When an AI Worker decides to invoke an action, it emits an intent payload. This payload is intercepted by the `WorkerExecutionService`.
*   **Enforcement:** The `WorkerExecutionService` validates the intent against the `AuthorizationRegistry`. If the Workspace lacks the specific capability (e.g., `CREATE_ISSUE`), or the risk level (`HIGH`) exceeds the configured threshold (`APPROVAL_REQUIRED`), the action is safely rejected or suspended.
*   **No Bypass:** The LLM does not have direct HTTP access to the internet. It can only emit valid JSON tools defined in the Control Layer.

### 3.2. Heartbeat Scheduler & Idempotency Engine
To ensure long-running autonomy, ItWield implements a durable continuous polling scheduler rather than internal `while(true)` loops within node scripts.
*   **Interval Engine:** The scheduler wakes, queries the database for active objectives and valid leases, and triggers `CEOService` or `COOService` operations.
*   **Lease Recovery:** Operations secure a timestamped lock (`ceo_locked_until`). If the backend crashes during an operation, the lock expires. On the next heartbeat, the scheduler nullifies the expired lock, allowing the objective to resume.
*   **Idempotency:** External mutations evaluate pessimistic states. If the system crashed during a GitHub API request, the recovery cycle will trigger the `ToolAdapter.verify()` method to query if the issue was actually created before attempting the action again.

### 3.3. Multi-Executive Coordination
Executives (CEO, COO, CMO, CTO, CFO) communicate through a shared state stored in the `company_coordinations` table.
*   **Shared Context:** `objectiveId`, `missionId`, and `coordinationId` are explicitly passed down the execution chain. 
*   **Recursion Prevention:** A `coordination_depth` counter explicitly halts cyclic loops (e.g., CEO -> COO -> CMO -> CEO) at a maximum depth of 5.
*   **Optimistic Concurrency:** Executive state updates use version-incrementing numeric checks to prevent stale-write collisions if two workers attempt to modify the objective simultaneously.

### 3.4. Verification Engine & Tool Adapters
*   **Abstract Adapter Pattern:** Every external connection implements a standard `ToolAdapter` interface exposing `execute()` and `verify()`.
*   **Outcome Verification:** When an AI Worker reports an outcome as complete (e.g. converting a lead), the `OutcomeVerificationService` invokes the specific adapter's `verify()` method to execute a deterministic SQL/API check against canonical data. If the check fails, the task is marked as `VERIFICATION_FAILED` and sent back for replanning.

---

## 4. Data Architecture & Security

### 4.1. Row-Level Security (RLS)
The Supabase PostgreSQL instance strictly isolates multitenant data using RLS.
*   Every table (e.g., `company_memory`, `tasks`, `business_goals`) contains a `workspace_id` column.
*   RLS policies ensure `auth.uid()` corresponds to an accepted member of the target `workspace_id`. Cross-workspace queries structurally return `0` rows.

### 4.2. Secret Management
*   Provider API keys (OpenAI, Integration OAuth tokens) are stored in encrypted columns in the database.
*   Under no circumstances do secrets traverse to the React frontend or get included in LLM prompt context headers. 
*   User-facing error handlers are wrapped to explicitly scrub stack traces and internal schema definitions before responding with HTTP 500.

---

## 5. API Definitions (Key Endpoints)

| Endpoint | Method | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| `/api/v1/scheduler/tick` | POST | Trigger the autonomous heartbeat evaluation | Server Auth |
| `/api/v1/company/autonomy-health/:wsId`| GET | Returns system health, open circuit breakers | JWT (RLS) |
| `/api/v1/workspaces/:wsId/activate` | POST | Invokes deterministic `checkReadiness` pipeline | JWT (RLS) |

---

## 6. Testing & Validation Standard
*   **Regression Requirement:** V6.1 must maintain 100% pass rates for all V5.0–V6.0 test suites (Current count: 490 tests).
*   **Mock Strictness:** External integrations may be mocked during E2E CI/CD, but the actual capability matrices must evaluate against real `ToolAdapter` logic.
*   **TypeScript:** No implicit `any` bypasses. The build fails if TS compilation fails.

---

## 7. Error Handling & Circuit Breakers
*   **External Rate Limits:** Intercepted at the Adapter level. HTTP 429 invokes an exponential backoff curve, transitioning the worker to a `BLOCKED` state until the reset window opens.
*   **Authentication Failure:** API keys failing with HTTP 401 instantly transition the company system status to `AUTH_REQUIRED`, firing an asynchronous notification to the Founder. 

---
*Technical Requirements Document (TRD) — Prepared for ItWield Engineering*
