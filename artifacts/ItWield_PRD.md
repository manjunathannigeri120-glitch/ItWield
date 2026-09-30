# Product Requirements Document (PRD)

## Document Control
**Document ID:** PRD-ITW-V6.1  
**Version:** 1.0  
**Status:** Approved for Pilot  
**Created Date:** 28 September 2026  
**Last Updated Date:** 28 September 2026  
**Owner:** Manjunath H Annigeri  
**Approver:** Manjunath H Annigeri  

---

## Executive Summary
**Problem:** Startups and SMEs lack the operational bandwidth to execute day-to-day business operations across isolated SaaS tools without expensive human capital.
**Solution:** ItWield is an AI operating platform that provides an autonomous, multi-agent executive suite (CEO, COO, CMO, CTO, CFO) and worker swarm to execute real business goals 24/7.
**Target Customer:** Solo Founders, Indie Hackers, and SME Operators.
**Core Value Proposition:** Turn high-level objectives into independently verified, automated business outcomes under strict security boundaries.
**Differentiation:** ItWield is not a chatbot or a static workflow builder. It is a long-running, autonomous execution engine with built-in outcome verification, crash reconciliation, and strict "No Fake Success" boundaries.

---

## Problem Statement
**What problem businesses have today:** Founders spend 80% of their time operating isolated systems (CRM, GitHub, Vercel, Email) rather than building their core product. 
**Why existing tools don't fully solve it:** Zapier/Make require rigid, manual trigger mapping. LLM Chatbots require constant prompting, hallucinate successes, lack long-running autonomous agency, and cannot verify external reality. 

---

## Product Scope
**In Scope:**
*   Company context discovery and memory persistence.
*   Autonomous planning, delegation, and multi-agent execution.
*   Secure API integrations with exact RLS-enforced capabilities.
*   Verification-first outcome measurement.
*   Failure recovery and circuit breaking.

**Out of Scope:**
*   A universal "Do Anything" agent devoid of API limits.
*   Direct manipulation of unauthorized personal local files.
*   Unbounded recursive operations bypassing budget limits.

**Current Capabilities:** V6.1 architecture deployed. Multi-Executive coordination, resilient heartbeat, verification engine, UI Command Center.
**Future Capabilities:** Native iOS/Android companion apps, custom Webhook integrations, dynamic pricing tiers.

---

## User Personas & Roles
*   **Founder:** Sets the strategic objectives, manages connections, grants authority, and monitors Autonomy Health.
*   **Company Admin:** Manages billing, user access, and API keys.
*   **Operator:** Monitors tasks, approves waiting AI actions, and manages exceptions.
*   **AI Executives (Internal):** CEO (Strategy), COO (Operations), CMO (Growth), CTO (Tech), CFO (Finance).
*   **AI Workers (Internal):** Micro-agents configured to execute singular, specialized tasks (e.g., Drafting emails, checking metrics).

---

## User Stories
*   **Founder creates company:** As a Founder, I want to input my domain so that ItWield discovers my business context automatically.
*   **Founder connects system:** As a Founder, I want to connect my CRM securely so that the AI can act on real customer data.
*   **Founder gives goal:** As a Founder, I want to type "Get me 20 customers" so that the CEO agent can build a strategy.
*   **AI operates:** As an AI, I need to break down objectives, delegate to workers, execute via adapters, and verify without human hand-holding.
*   **Founder receives alert:** As a Founder, I want to be notified if the AI requires approval to spend budget.
*   **Founder pauses/stops system:** As a Founder, I want an emergency STOP button to halt all autonomous execution instantly.

---

## Functional Requirements
*   **FR-001 (Activation):** System shall prevent transition to `OPERATING` unless the Company Brain and Connections are verified.
*   **FR-002 (Goal Parsing):** System shall map natural language objectives to measurable canonical data (e.g. `COUNT(stage='CONVERTED')`).
*   **FR-003 (Heartbeat):** System shall evaluate active goals and expired leases continuously via an idempotent background scheduler.
*   **FR-004 (Control Layer):** All worker API requests shall pass through `AuthorizationRegistry` and RLS before reaching external networks.
*   **FR-005 (Verification):** System shall not mark a goal as COMPLETE unless an independent query to a ToolAdapter verifies the external state.
*   **FR-006 (Emergency Override):** A STOP command shall persist through process restarts and block the scheduler from spinning up workers.

---

## Non-Functional Requirements
*   **Security:** Full RLS multi-tenant isolation. No plain-text secrets in memory.
*   **Performance:** UI shall load Autonomy Health metrics in < 1.5 seconds.
*   **Reliability:** Idempotent heartbeat must survive Vercel/Render restarts and database connection drops.
*   **Availability:** 99.9% uptime target for the core scheduler.
*   **Scalability:** Must support 10,000 concurrent company evaluations without scheduler deadlock.
*   **Privacy:** Complete scrubbing of user data from internal AI prompts outside the target workspace.
*   **Observability:** All actions tagged with `correlationId`, `workspaceId`, `objectiveId`.
*   **Accessibility:** Dashboard must conform to WCAG 2.1 AA standards.

---

## Company Lifecycle
*   **DRAFT:** Initial creation, missing basic context.
*   **DISCOVERING:** System actively scraping and populating Company Brain.
*   **CONFIGURING:** Context exists; awaiting user settings.
*   **CONNECTING:** API integrations being authenticated.
*   **AUTHORIZING:** Permissions being mapped to Control Layer.
*   **READY:** All dependencies met. Awaiting Autopilot activation.
*   **OPERATING:** Scheduler is actively running executive loops.
*   **PAUSED:** Soft halt; active tasks suspend, state frozen.
*   **STOPPED:** Hard halt; emergency state, requires manual reconciliation to resume.
*   **DEGRADED:** System running but failing external integrations detected.
*   **BLOCKED:** Hard block due to authorization limits or billing failure.

---

## Objective/Goal Lifecycle
*   **DRAFT:** Not active.
*   **ACTIVE:** Currently being pursued by AI executives.
*   **WAITING_FOR_APPROVAL:** Execution halted pending Founder input.
*   **BLOCKED:** Execution halted due to resource, technical, or authority conflict.
*   **STALE:** Heartbeat detected execution timeout; pending recovery.
*   **PARTIAL:** Reconciled state where some tasks succeeded, others failed.
*   **FAILED:** Terminal state after maximum retry boundaries.
*   **COMPLETE:** Independent verification proves target external reality matches intent.

---

## Worker Lifecycle
*   **QUEUED:** Assigned, awaiting lease.
*   **READY:** Leased and allocated capabilities.
*   **RUNNING:** Executing task logic against Control Layer.
*   **WAITING_FOR_APPROVAL:** Blocked by medium/high-risk capability threshold.
*   **BLOCKED:** Hard authorization denial.
*   **FAILED:** Terminal execution failure (e.g. permanent API error).
*   **COMPLETED:** Execution finished (Awaiting Verification engine).

---

## AI Executive Responsibilities
*   **CEO:** Determines "What matters most." Selects strategic priorities, resolves conflicts (e.g. Budget vs Growth), and delegates to COO. Cannot execute low-level API calls.
*   **COO:** Operational planner. Maps strategies to execution graphs, resolves dependencies, and assigns specialists (CMO, CTO, CFO).
*   **CMO:** Owns growth. Directs worker swarms for acquisition, CRMs, marketing.
*   **CTO:** Owns reliability. Manages infrastructure checks, GitHub integrations, and issue resolutions.
*   **CFO:** Owns budget. Tracks AI spend, API limits, and revenue verifications.

---

## AI Workforce Specification
*   **Worker capabilities:** Scoped by ToolAdapters (e.g., SendEmail, CreateIssue).
*   **Worker authority:** Inherited dynamically from `AuthorizationRegistry`.
*   **Worker limits:** Capped server-side based on customer billing tier.
*   **Worker concurrency:** Max 10 concurrent active workers per workspace (configurable).
*   **Worker failure behavior:** Fallback to `UNKNOWN_EXTERNAL_STATE` -> Idempotent Reconciliation.

---

## Control & Authority Model
**Authority Modes:**
*   **AUTONOMOUS:** System executes silently.
*   **APPROVAL_REQUIRED:** Notifies Founder, waits for manual YES/NO.
*   **BLOCKED:** Hard rejection. System cannot execute.
**Risk Levels:** LOW, MEDIUM, HIGH, CRITICAL. (e.g., Financial transactions are CRITICAL).
**Approval Process:** Founder sees action, expected outcome, risk, and capability used.
**Founder Override:** Founder can manually downgrade or upgrade capabilities at any time via Authority Center.

---

## Integration Matrix
See **Table 3** below.

---

## Failure & Recovery Requirements
*   **API Failure:** Bounded retry with exponential backoff.
*   **Auth Failure:** Immediate halt, notify Founder, mark `AUTH_REQUIRED`.
*   **Rate Limits:** Detect header resets, pause worker execution until window opens.
*   **Worker Failure:** Heartbeat nullifies expired lease, pushes to `RECONCILING`.
*   **Backend Crash:** No duplicate actions. Resumes via pessimistic lock evaluation.
*   **Duplicate Action:** Prevented by durable idempotency keys (`workspace_id` + `objective_id` + `task_id`).
*   **Database Failure:** Reconnect strategies; safe transition to `DEGRADED`.
*   **AI Failure:** Catch LLM hallucinations via structural response parsing (JSON) and outcome verification mismatching.

---

## Notification Requirements
*   **Approval Required:** Deduplicated, actionable alert.
*   **Emergency:** Instant email/UI flash for STOP conditions.
*   **Failure:** Digested summary after retries are exhausted.
*   **Blocked Objective:** Contextual alert detailing the blocking dependency.
*   **Integration Disconnected:** Urgent alert for invalidated OAuth tokens.
*   **Completed Objective:** Confirmed success with authoritative evidence attached.
*   **Regression:** Alert if verified outcome reverses (e.g., 20 customers drops to 17).

---

## Security Requirements
*   **Authentication:** JWT-based stateless auth via Supabase Auth.
*   **Authorization:** Centralized `AuthorizationRegistry` acting as the sole policy decision point.
*   **RLS:** Database-level Row-Level Security ensuring absolute tenant isolation.
*   **Encryption:** AES-256 for external API keys and OAuth tokens at rest.
*   **Secret Management:** No production secrets passed to frontend client context.
*   **Audit Logs:** Immutable `action_audit_logs` tracking every API mutation and LLM decision.
*   **Rate Limiting:** IP and Workspace-level API request limits to prevent DoS.

---

## AI Safety Requirements
*   **Prompt Injection:** Sandboxed context windows; external website scrapes marked explicitly as `UNTRUSTED_CONTENT`.
*   **Tool Injection:** LLMs cannot invoke raw functions; they emit intent JSON validated by Zod schemas in the Control Layer.
*   **Hallucinations:** Eradicated by OutcomeVerificationService.
*   **Fake Success:** Impossible; "I am done" does not equal "COMPLETED" without verifiable database truth.
*   **Excessive Autonomy:** Hard limit on recursion depth (`coordination_depth > 5` forces a halt).
*   **Wrong-target Actions:** Strict API constraints limit mutations to target integration objects.
*   **Human Escalation:** Built-in escalation logic when circuit breakers trip.

---

## Data Requirements
*   **Data Categories:** Operational, Authentication, Telemetry, AI Memory.
*   **Data Ownership:** Customer owns their operational context and integration data.
*   **Data Storage:** Supabase (PostgreSQL) hosted in AWS infrastructure.
*   **Data Access:** Read strictly limited to Workspace owners and scoped service_roles.
*   **Data Retention:** Audit logs kept for 1 year. Operating state kept indefinitely unless deleted.
*   **Data Deletion:** Cascading deletions upon Workspace/Company deletion request.

---

## Privacy Requirements
*   **Privacy Policy:** Transparent policy acknowledging AI processing.
*   **Data Rights:** GDPR/CCPA compliance for right-to-be-forgotten.
*   **Consent/Notice:** Clear opt-ins required for connecting integrations.
*   **Subprocessors:** OpenAI/Anthropic (via enterprise agreements preventing data usage for model training), Supabase, Vercel, Render.
*   **International:** EU instances available post-launch if required.

---

## Acceptance Criteria
*   **AC-001 (Activation):** A company must correctly resolve `checkReadiness()` before `OPERATING`.
*   **AC-002 (Verification):** An objective goal mapping `stage='CONVERTED'` must remain `ACTIVE` if the target is 20 and CRM reports 19.
*   **AC-003 (Heartbeat):** The scheduler must gracefully release and recover a lease deliberately expired in the DB.
*   **AC-004 (Isolation):** Authenticated User A attempting to fetch Workspace B's `company_memory` must receive 404 or 401.

---

## Success Metrics
*   **Activation:** 80% of sign-ups complete Company Discovery.
*   **Time-to-Value (TTV):** < 10 mins from Sign-up to AUTOPILOT ON.
*   **Reliability:** 95% of active operations survive transient failures autonomously.
*   **Verified Execution:** 100% trace rate of completed objectives back to real-world mutations.
*   **Goal Completion:** % of defined goals mathematically verified as complete.
*   **False-Success Rate:** 0% tolerance.
*   **Unauthorized-Action Rate:** 0% tolerance.

---

## Risks & Mitigations
See **Table 4** below.

---

## Dependencies
*   **Supabase:** Primary PostgreSQL DB, Auth, and Edge Functions.
*   **Render:** Backend continuous polling scheduler and API hosting.
*   **Vercel:** Frontend React hosting and edge caching.
*   **AI Provider:** OpenAI / Anthropic API for Executive and Worker reasoning.
*   **External APIs:** GitHub, Vercel, Stripe, Resend, HubSpot, etc.
*   **Payment Provider:** Stripe (for future billing abstraction realization).
*   **Email Provider:** Resend.

---

## Assumptions & Constraints
*   **Assumptions:** Target businesses operate modern SaaS stacks with API availability. LLM latency remains within acceptable execution bounds (<15s per thought cycle).
*   **Constraints:** API rate limits of connected systems dictate maximum operational speed. Hardcoded recursion depths limit runaway AI scenarios.

---

## Launch Requirements
See **Table 5** below.

---

## Pilot Requirements
*   **First Company:** Real external SME/Founder.
*   **Real Credentials:** Production API keys provided via OAuth.
*   **Real Integration:** Connectivity directly into live CRM/GitHub.
*   **Real External Action:** Sending live emails or updating live tasks.
*   **Independent Verification:** Metrics proven via separate dashboarding.
*   **Failure Testing:** Controlled API invalidation to test recovery paths.
*   **Founder Feedback:** Integrated "Report Issue" / "Feedback" loop for UI.

---

## Current Validation Status
*   **Milestone:** V6.1 Architecture Live.
*   **Tests:** 490/490 backend tests passing.
*   **Code Quality:** TypeScript checks passing; Frontend production build passing.
*   **Security:** Multi-tenant RLS, isolation, and Control Layer verified.
*   **Live Execution Status:** LIVE EXECUTION NOT VERIFIED — CREDENTIALS NOT AVAILABLE
*   **Known Limitations:** Without authenticated credentials injected in the live runtime, external mutations are inherently blocked by the Control Layer to protect system integrity.

---

## Public Claims / Product Boundaries
*   **What ItWield Can Claim:** "Operates your company objectives automatically via supported integrations." "Evidence-based execution engine." "Complete structural safety and authorization."
*   **What It Cannot Claim:** "Universal general AI." "Does anything and everything." "Replaces 100% of human reasoning without limits."
*   **Supported Integrations:** Only currently supported `ToolAdapters` (GitHub, Vercel, Supabase, CRM, Email).

---

## Related Documents
*   Technical Requirements Document (TRD)
*   Security Architecture & Threat Model
*   AI Safety Policy
*   Privacy Policy & Terms of Service, DPA
*   Incident Response & Disaster Recovery Plan
*   Launch Runbook
*   **V6.1 Validation Report**

---
---

## Tables

### Table 1 — Feature Requirements
| ID | Feature | Requirement | Priority | Acceptance |
| :--- | :--- | :--- | :--- | :--- |
| FR-001 | Heartbeat Scheduler | System evaluates goals continuously in bounded cycles | P0 | Cycles execute without infinite loops; idle workspaces bypassed |
| FR-002 | Readiness Check | Block Autopilot until Brain & Connections are configured | P0 | Activation triggers rejection if required parameters are missing |
| FR-003 | Authorization Control | Action registry strictly checks permissions before mutation | P0 | Attempted unauthorized API calls are hard-blocked by Control Layer |
| FR-004 | Outcome Verification | Goals cannot complete without independent external proof | P0 | Worker claim "Completed" leaves Goal in "Verifying" until DB proof |
| FR-005 | Emergency Stop | Founder STOP command persists across all restarts | P0 | Restarting backend does not resume a STOPPED workspace |

### Table 2 — AI Authority
| Role | Capability | Risk | Autonomous | Approval | Blocked |
| :--- | :--- | :--- | :--- | :--- | :--- |
| CEO | Prioritize Objectives | Low | Yes | No | No |
| COO | Allocate Workers | Low | Yes | No | No |
| CMO | Execute Campaign | Medium | Configurable | Default | Configurable |
| CTO | Commit Code | High | No | Yes | Configurable |
| CFO | Process Payment | Critical | No | No | Yes |

### Table 3 — Integration Capability
| System | Read | Write | Verify | Live Tested |
| :--- | :--- | :--- | :--- | :--- |
| GitHub | Issues, Repos, PRs | Create Issues, PRs | Yes | No (Creds Missing) |
| Vercel | Deployments, Domains | Trigger Build | Yes | No (Creds Missing) |
| Supabase | Database schemas | Exec DML | Yes | No (Creds Missing) |
| CRM | Opportunities, Leads | Update Stage | Yes | No (Creds Missing) |
| Email | Templates | Send Mail | No | No (Creds Missing) |

### Table 4 — Risk Register
| Risk | Severity | Probability | Mitigation | Owner |
| :--- | :--- | :--- | :--- | :--- |
| Prompt Injection grants root access | Critical | Low | Strict Control Layer sandboxing; LLM cannot alter Authority DB | Security Team |
| Runaway AI burns API usage limits | High | Medium | Bounded coordination depth (max 5); Usage budget abort limits | Backend Team |
| Backend crash duplicates external actions | High | Low | Pessimistic locking; unknown-state reconciliation via Idempotency keys | Ops Team |
| Cross-tenant data leakage | Critical | Low | Full Row-Level Security (RLS) forced at the PostgreSQL layer | DB Team |
| Fake success hallucinates completion | Medium | Medium | Verification Service mathematically validates outcomes independent of LLM | Architecture Team |

### Table 5 — Launch Gate
| Requirement | Status | Evidence | Owner |
| :--- | :--- | :--- | :--- |
| Prod Infrastructure Ready | Complete | Vercel/Render deployments green | Ops Team |
| V6.1 Regression Passed | Complete | 490/490 tests passing | QA / Engineering |
| Security & Isolation Audit | Complete | RLS policies and Control Layer tested | Security |
| Privacy & Legal Policies | Pending | Finalizing DPA and ToS | Legal |
| Monitoring & Incident Resp. | Complete | Health APIs mapped | Ops Team |
| Live Pilot Validation | Pending | Awaiting pilot Founder & real credentials | Product Team |
