# ITWIELD
## TECHNICAL REQUIREMENTS DOCUMENT

**Document ID:** TRD-ITW-V6.1
**Version:** 1.1
**Status:** Approved for Pilot
**Product:** ItWield
**Owner:** Manjunath H Annigeri
**Approver:** Manjunath H Annigeri
**Created Date:** 28 September 2026
**Last Updated Date:** 28 September 2026
**Next Review:** [TBD]
**Classification:** Internal — Technical Documentation

### DOCUMENT CHANGE HISTORY
| Version | Date | Author | Change | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1.0 | 28 Sep 2026 | Manjunath H Annigeri | Initial TRD Draft | Superseded |
| 1.1 | 28 Sep 2026 | Manjunath H Annigeri | Complete V6.1 Architecture Specification | Approved for Pilot |

---

## 1. PURPOSE AND SCOPE
**Purpose:** To strictly define the implemented technical architecture, boundaries, and execution models of ItWield V6.1.
**Technical Scope:** Covers the deployed React frontend, Node.js backend, Supabase database, and the deterministic multi-executive AI execution and verification pipeline.
**Intended Audience:** Engineering, DevOps, and Security Teams.
**In-Scope Architecture:** Control Layer, Company Brain, Autonomous Scheduler, Outcome Verification, RLS Multi-tenancy.
**Out-of-Scope Architecture:** Unbounded general AI reasoning, local file system manipulation outside defined adapters, legacy workflow builder UI.
**Current Implementation Boundary:** Operations map natural language objectives to structured external API calls via defined `ToolAdapter` classes. 
**Known Technical Limitations:** `LIVE EXECUTION NOT VERIFIED — CREDENTIALS NOT AVAILABLE`. External provider mutations depend on valid credentials which are mocked in automated pipelines.

---

## 2. SYSTEM CONTEXT
The end-to-end operational flow strictly separates LLM intent from deterministic backend validation.

**Data Flow:**
Founder → Vercel Frontend → Backend API → Company / Business Outcome Engine → CEO → COO → Specialist Executives → AI Workforce → Control Layer → Authorization → ToolAdapter → External System → Independent Verification → Company Brain → Outcome Status / Replanning

**Implemented Tech Stack:**
*   **Frontend:** React / TypeScript / Vite / Tailwind
*   **Backend:** Node.js / TypeScript / Express
*   **Database/Auth:** Supabase PostgreSQL + Supabase Auth + RLS
*   **Infrastructure:** Vercel (Web) + Render (API/Worker) + Supabase (DB)
*   **AI Providers:** OpenAI / Anthropic (via backend SDKs; currently implemented logic supports structured output generation).

---

## 3. COMPONENT ARCHITECTURE
| Component | Responsibility | Inputs | Outputs | Dependencies | Failure Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CompanyService** | Validates company readiness | workspaceId | Readiness Status | Supabase | Rejects activation |
| **BusinessGoalInterpreter** | Translates intents to targets | User prompt | Goal Target | LLM | Returns INSUFFICIENT_DATA |
| **CEOService** | Evaluates strategic priority | Goal list | Priority State | CompanyCoordination | Suspends if depth > 5 |
| **COOService** | Delegates to specialists | Priority | Delegated Tasks | CEOService | Halts on dependency block |
| **WorkerExecutionService** | Intercepts task execution | Intent JSON | API Action | AuthorizationRegistry | Traps unknown intents |
| **ControlLayerService** | Maps limits and authority | Action | Authz Decision | RLS / DB | Emits BLOCKED status |
| **OutcomeVerificationService** | Confirms real-world state | ToolAdapter | Boolean (Pass/Fail) | ToolAdapter | Rejects "Claimed Success" |
| **Scheduler** | Durable lease heartbeat | active goals | Trigger cycles | DB timestamps | Idempotent resume |

---

## 4. END-TO-END EXECUTION MODEL
1. Founder Goal → Goal Interpretation → Goal Creation.
2. Strategic Evaluation → CEO → COO → Specialist Executive → Worker Assignment.
3. Control Layer → Authorization → ToolAdapter → External Action.
4. Verification → Evidence → Company Brain → Objective Update → Replanning or Completion.
**CRITICAL RULE:** CLAIMED SUCCESS is not equivalent to VERIFIED SUCCESS. AI output alone never completes a goal.

---

## 5. COMPANY LIFECYCLE
| State | Purpose | Entry Conditions | Allowed Ops |
| :--- | :--- | :--- | :--- |
| **DRAFT** | Initial creation | User Signup | Configure |
| **DISCOVERING** | Scraping context | URL provided | System read |
| **CONFIGURING** | Context exists | Discovery done | User edit |
| **CONNECTING** | Authenticating integrations | Config complete | OAuth/API keys |
| **AUTHORIZING** | Setting risk limits | Connect complete| Auth updates |
| **READY** | Met all prerequisites | Validation pass | Activate Autopilot |
| **OPERATING** | Autonomous loop active| Autopilot ON | Full execution |
| **PAUSED** | Soft halt | User Pause | View only |
| **STOPPED** | Emergency halt | User Stop | Manual resume |
| **DEGRADED** | Failing integration | API outage | Partial execution |
| **BLOCKED** | Hard denial | Billing/Auth block| Await manual fix |

*Failure Behavior:* Transitions to DEGRADED on transient errors, BLOCKED on unrecoverable limits. PAUSE/STOP survive backend restarts.

---

## 6. OBJECTIVE / BUSINESS GOAL LIFECYCLE
**Implementation Context:** Goals transition through `DRAFT` → `ACTIVE` → `WAITING_FOR_APPROVAL` → `BLOCKED` → `STALE` → `PARTIAL` → `FAILED` → `COMPLETE`.

**Canonical Semantic Model Example:**
*   **Table:** `public.opportunities`
*   **Successful Stage:** `CONVERTED` (NOT `WON`)
*   **Metric:** `TARGET = 20`, `CURRENT = COUNT(public.opportunities WHERE stage = 'CONVERTED')`
*   Zero rows safely equate to 0, not "Data Unavailable".

---

## 7. EXECUTIVE ARCHITECTURE
*   **CEO:** Determines "What matters most". Inputs: Goal constraints. Outputs: Strategy. Delegates strictly to COO. Protects recursion (max depth 5).
*   **COO:** Operational planner. Inputs: CEO Strategy. Delegates to Specialists (CMO, CTO, CFO).
*   **CMO:** Owns acquisition (e.g., Marketing API logic).
*   **CTO:** Owns technical operations (e.g., GitHub issue resolution).
*   **CFO:** Owns financial tracking (e.g., Budget bounds).
*   *Boundary:* Executives cannot bypass the `ControlLayerService`. Shared state uses `company_coordinations` with versioned concurrency logic.

---

## 8. AI WORKFORCE ARCHITECTURE
**Worker States:** `QUEUED`, `READY`, `RUNNING`, `WAITING_FOR_APPROVAL`, `BLOCKED`, `NOT_CONNECTED`, `AUTH_REQUIRED`, `UNAVAILABLE`, `FAILED`, `COMPLETED`.
Workers are assigned via capability matching and inherit risk ceilings. Simultaneous executions are bounded by workspace concurrency limits. All worker outputs must be verified independently by the OutcomeVerificationService. 

---

## 9. CONTROL LAYER
The definitive server-side enforcer.
*   **Risk Categories:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
*   **Authority Categories:** `AUTONOMOUS`, `RECOMMEND`, `APPROVAL_REQUIRED`, `BLOCKED`
*   **Rule:** LLMs never have direct external mutation access. Prompt instructions cannot override server-side authorization. Emergency `PAUSE`/`STOP` are strictly respected.

---

## 10. AI / LLM SECURITY BOUNDARY
*   **Can Receive:** Sandboxed prompt constraints, schemas.
*   **Cannot Receive:** Database credentials, production secrets.
*   **Can Generate:** Structured JSON intents.
*   **Cannot Execute:** Raw HTTP requests or arbitrary code execution.
*   **Rule:** LLM output is an untrusted proposal. The backend deterministic layer controls execution.

---

## 11. COMPANY BRAIN
Database entity: `company_memory`
**Categories:** `FACT`, `GOAL`, `DECISION`, `STRATEGY`, `CUSTOMER_CONTEXT`, `PRODUCT_CONTEXT`, `MARKET_CONTEXT`, `FINANCIAL_CONTEXT`, `TECHNICAL_CONTEXT`, `OPERATIONAL_CONTEXT`, `LESSON`, `FAILURE`, `ASSUMPTION`, `INFERENCE`.
**Characteristics:** Retains provenance, ensures freshness, isolates across workspaces via RLS, automatically redacts recognized secrets before persistence.

---

## 12. DATABASE ARCHITECTURE
*   `workspaces`: Core tenant boundary. Scope isolation.
*   `workspace_members`: Auth linkage.
*   `company_memory`: Brain graph storage.
*   `business_goals`: Targeted outcomes.
*   `tasks` / `agents`: Execution entities.
*   `company_systems`: OAuth integrations.
*   `action_audit_logs`: Immutable ledger.
*   `approvals`: Wait-state records.
*   `company_coordinations`: Shared executive states.

*Primary Keys are UUIDs. Workspace Scope is enforced on all operational tables.*

---

## 13. MULTI-TENANCY / RLS
Row-Level Security (RLS) provides a database-level multi-tenant isolation boundary, reinforced by server-side authorization and workspace-scoped application controls.
*   Policies are bound to `auth.uid()`.
*   Cross-workspace data access evaluates to 0 rows.
*   Service roles are strictly limited to authenticated background scheduler context.

---

## 14. API ARCHITECTURE
| Endpoint | Method | Purpose | Auth | Authz | Input | Output | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/workspaces/:wsId/activate` | POST | Verify readiness | JWT | WS Member | ID | 200/400 | Not Ready |
| `/api/v1/company/autonomy-health/:wsId` | GET | System metrics | JWT | WS Member | ID | 200 JSON | 403 Forbidden |
| `/api/v1/scheduler/tick` | POST | Trigger Heartbeat | Token | Service | - | 200 Stats | 401 Unauthorized |

---

## 15. AUTHENTICATION & AUTHORIZATION
*   **Authentication:** Supabase Auth (JWT). Validates user identity.
*   **Authorization:** Control Layer (AuthorizationRegistry). Validates system rights.
Authentication establishes "who you are"; Authorization strictly limits "what the system allows you to do."

---

## 16. TOOL ADAPTER ARCHITECTURE
Standard interface: `testConnection()`, `getCapabilities()`, `execute()`, `verify()`.
*   **GitHubAdapter:** Read Repos/Issues, Create Issues.
*   **VercelAdapter:** Read Deployments, Trigger Build.
*   **SupabaseAdapter:** Read DB Schemas, Exec DML.
*   *Note:* Real mutations are simulated in automated tests pending authenticated credentials.

---

## 17. EXTERNAL ACTION IDEMPOTENCY
Implemented to prevent duplicate writes on failure.
*   Actions require deterministic payload signatures.
*   If an execution crashes, `verify()` is queried to check if the action completed (e.g., searching an exact Issue Title) before triggering `execute()` on retry. 

---

## 18. HEARTBEAT / SCHEDULER
Durable scheduler fetching active workflows.
*   **Locks:** `ceo_locked_until`, `coo_locked_until`, `cmo_locked_until`, `cto_locked_until`, `cfo_locked_until`.
*   If a backend crashes, leases expire. On the next tick, stale state recovery nullifies the lease, permitting reconciliation. 
*   Designed to provide at-most-once behavior where supported, with reconciliation for uncertain external writes.

---

## 19. CRASH RECOVERY
| Scenario | Detection | Recovery | Final State |
| :--- | :--- | :--- | :--- |
| Crash before action | Lease Expiry | Nullify lease, Retry | Action Executes |
| Crash during action | Lease Expiry | `verify()` check | Success/Retry |
| Crash after action | Timeout | `verify()` confirms | `COMPLETED` |
| Worker crash | Lease Expiry | Transition to `FAILED`/Retry | Reassigned |
| Scheduler failure | Cron Monitor | Restart scheduler | Resumes automatically |

---

## 20. RETRY ENGINE
Classifications: `TRANSIENT`, `AUTH_REQUIRED`, `PERMISSION`, `RATE_LIMIT`, `VALIDATION`, `PERMANENT`, `UNKNOWN`.
Bounded exponential backoff is applied for `TRANSIENT` and `RATE_LIMIT`. `AUTH_REQUIRED` safely aborts execution and notifies the user. Unlimited retries are prohibited.

---

## 21. CIRCUIT BREAKERS
Limits failure loops. Implementation states evaluate failure counts. If consecutive failures exceed limits, the subsystem transitions to a blocked/halted state, suspending associated workers and bubbling an alert to Autonomy Health UI.

---

## 22. OUTCOME VERIFICATION
AI-generated claims do not establish business success. Independent authoritative evidence establishes success.
When a worker claims completion, `OutcomeVerificationService` uses the target `ToolAdapter.verify()` mechanism to query canonical systems. Failure forces replanning.

---

## 23. OBSERVABILITY
Implements standard stdout logging wrapping structured JSON contexts (`workspaceId`, `taskId`, `correlationId`). Autonomy health evaluates live database stats. Dedicated tracing spans are NOT YET IMPLEMENTED.

---

## 24. AUDIT LOGGING
Table: `action_audit_logs`.
Fields: `actor`, `workspace_id`, `objective_id`, `capability`, `risk_level`, `decision`, `execution_timestamp`, `verification_result`.

---

## 25. NOTIFICATIONS
Asynchronous notification events include: approval required, emergency halt, failure block, authentication disconnected, and objective completed. (Currently surfaced in dashboard; email delivery stubbed/simulated).

---

## 26. PERFORMANCE
TARGET / NOT YET VALIDATED benchmarks:
*   API Latency: < 500ms
*   Scheduler Tick Duration: < 2s
*   Dashboard Response: < 1.5s
*   LLM Timeout: 15s

---

## 27. SCALABILITY
CURRENT TESTED SCALE: Hundreds of concurrent operations via automated E2E suites.
DESIGNED SCALE: 10,000+ concurrent companies utilizing serverless scaling on Render and pooling on Supabase.

---

## 28. AVAILABILITY / RELIABILITY
Highly available via Render stateless containers and Supabase clustering. Emergency `PAUSE`/`STOP` immediately suspend workload across all nodes. SLA not yet established.

---

## 29. BACKUP / DISASTER RECOVERY
Utilizes Supabase automated daily backups. RPO/RTO metrics are NOT YET VALIDATED under real load. Application environments are fully declarative and rebuildable via CI/CD.

---

## 30. DEPLOYMENT ARCHITECTURE
*   **Frontend:** Vercel (Edge-cached static assets)
*   **Backend:** Render (Dockerized Node.js containers)
*   **Database:** Supabase (Managed Postgres instance)
*   Environment Variables isolated securely in Vercel/Render parameter stores.

---

## 31. ENVIRONMENT MANAGEMENT
*   **Development:** Local Postgres, local mock APIs.
*   **Testing/CI:** Ephemeral Supabase test instances.
*   **Production:** Strict multi-tenant live environments. No shared credentials.

---

## 32. CI/CD
Pipeline: Commit → Unit/E2E Tests → TypeScript Compilation Check → Build → Vercel/Render Deployment.

---

## 33. DEPENDENCY MANAGEMENT
*   Node.js v20+, npm.
*   `package-lock.json` enforces exact versions. Automated vulnerability scanning NOT YET IMPLEMENTED natively in CI.

---

## 34. RATE LIMITING / RESOURCE CONTROLS
API request tracking is logically mapped. Usage ceilings on worker invocation evaluate before launching operations to prevent billing overruns. 

---

## 35. DATA RETENTION / DELETION
Cascading deletes via Supabase FKs cleanly remove associated `tasks`, `memory`, and `logs` upon Workspace deletion. Audit logs are retained structurally per policy.

---

## 36. SECURITY REFERENCES
*   SEC-001 (Security Overview)
*   RLS-001 (Row-Level Security Spec)
*   PINJ-001 (Prompt Injection Defenses)
*(Refer to external security portal for extended implementation docs)*

---

## 37. TESTING ARCHITECTURE
Architecture leverages Vitest for backend Unit/E2E testing (490/490 tests pass). Tests validate state machines, auth boundaries, idempotency limits, and multi-executive flow. Code coverage percentage is NOT explicitly calculated in this pipeline run.

---

## 38. TESTING VS LIVE VALIDATION
| Integration | Automated Tests | Credentials Available | Live Action | Independent Verification | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GitHub | Pass | No | No | No | Mocked |
| Supabase | Pass | No | No | No | Mocked |
| CRM | Pass | No | No | No | Mocked |

LIVE EXECUTION NOT VERIFIED — CREDENTIALS NOT AVAILABLE

---

## 39. V6.1 VALIDATION STATUS
*   **Backend tests:** 490 / 490 PASS
*   **Backend TypeScript:** PASS
*   **Frontend TypeScript/build:** PASS
*   **Golden User Journey:** validated according to V6.1 report
*   **Control Layer:** validated according to V6.1 report
*   **Prompt injection:** tested according to V6.1 report
*   **Emergency PAUSE/STOP:** validated according to V6.1 report
*   **Error scrubbing:** validated according to V6.1 report
*   **Fake autonomy:** eliminated according to V6.1 report
*   **Live external execution:** NOT VERIFIED — CREDENTIALS NOT AVAILABLE

Reference: `ItWield_V6.1_Validation_Report`

---

## 40. KNOWN LIMITATIONS
*   Live external execution not verified.
*   Credentials unavailable for live validation.
*   Supported integrations limited to implemented adapters.
*   Idempotency relies on reconciliation for uncertain writes (may edge-case if external verification API is down).

---

## 41. TECHNICAL ACCEPTANCE CRITERIA
*   **TR-AC-001:** All external mutations pass through the required authorization/execution boundary.
*   **TR-AC-002:** LLM output cannot directly perform arbitrary external mutations.
*   **TR-AC-003:** External actions support independent verification where applicable.
*   **TR-AC-004:** Expired executive leases are recoverable.
*   **TR-AC-005:** Uncertain external writes trigger reconciliation before blind retry.
*   **TR-AC-006:** Emergency PAUSE/STOP state survives backend restart where implemented.
*   **TR-AC-007:** Cross-workspace access is denied by the implemented authorization/RLS controls.
*   **TR-AC-008:** Secrets are not exposed to the frontend or ordinary LLM context.
*   **TR-AC-009:** Failed verification does not become successful merely because a worker reports completion.
*   **TR-AC-010:** V6.1 regression suite passes 490/490.

---

## 42. DEPENDENCIES
| Dependency | Purpose | Failure Impact | Recovery | Owner |
| :--- | :--- | :--- | :--- | :--- |
| Vercel | Web Hosting | UI Unavailable | Wait for Vercel | Vercel |
| Render | Core API / Worker | Ops Halted | Circuit Breakers | Render |
| Supabase | DB / Auth | System Outage | Wait for Supabase| Supabase |
| OpenAI/Anthropic| Reasoning | Exec Blocked | Exp. Backoff | Providers |

---

## 43. ASSUMPTIONS
*   External provider APIs remain available and specifications do not change unexpectedly.
*   Database remains accessible for heartbeat locking.
*   Verification sources remain authoritative.

---

## 44. TECHNICAL RISKS
| Risk | Severity | Probability | Technical Impact | Mitigation | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Database outage | HIGH | LOW | Global halt | Supabase clustering | Accepted |
| Credential expiration| HIGH | MEDIUM | Exec fails | Halt to AUTH_REQUIRED| Active |
| Prompt injection | CRITICAL | LOW | Auth bypass | Control Layer sandbox| Active |
| External API outage | MEDIUM | MEDIUM | Tasks block | Backoff / Circuit Break| Active |

---

## 45. RELATED DOCUMENTS
*   PRD-001
*   TRD-ITW-V6.1
*   ARC-001 (Planned)
*   SEC-001 (Planned)
*   V6.1 Validation Report
*(Documents not explicitly listed here are planned/separate documents).*
