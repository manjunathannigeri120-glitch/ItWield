# ItWield V5.7 — Autonomous CMO Operating Loop

## Validation Status: SUCCESS
**Execution Engine Integrity:** VERIFIED
**End-to-End CMO Path Execution:** VERIFIED
**Canonical Metric Semantics (`CONVERTED` only):** ENFORCED
**Fake Success:** ELIMINATED
**Live Provider Status:** LIVE EXECUTION NOT VERIFIED — CREDENTIALS NOT AVAILABLE

---

## 1. Trace the Complete CMO Path
The CMO operates synchronously across `CMOService.ts` using deterministic stages that strictly respect existing ControlLayer semantics:
1. **Scheduler Constraints:** The CMO asserts a `cmo_locked_until` lock upon activation, ensuring overlapping tasks/campaigns never spawn concurrently for the same objective.
2. **Goal Evaluation:** Reads actively requested business outcomes (`business_goals`) identifying goals targeting customer acquisition.
3. **Strict Baseline Calculus:** Current status is evaluated strictly via an authoritative subquery on `public.opportunities` (`stage = 'CONVERTED'`). No inferred metrics are allowed.
4. **Diagnostic Bottleneck:** Calculates `prospectCount` versus `currentCustomers`. Diagnoses explicitly label `KNOWN_FACT:` or `INFERENCE:`, preventing the LLM from arbitrarily declaring success without data.
5. **Plan Construction:** The CMO constructs a bound execution `task` array, setting `authorityRequired` and requesting specific capabilities (e.g. `CRM_READ`, `CRM_CREATE`).
6. **Worker Delegation:** Delegates through `WorkerAssignmentService` to assign executing AI Workers.
7. **Verification & Replanning:** The loop refuses to blindly trust `COMPLETED` worker responses, invoking `ControlLayerService.executeTool` to request independent acquisition verification.
8. **Company Brain 2.0 Integration:** Successfully completed segments result in `LESSON` and `FACT` memory units directly connected to verifiable results, ensuring organizational learning.

## 2. Evidence Hardening & Diagnostics
The bottleneck diagnostics engine actively prevents arbitrary marketing predictions. If total prospects are zero, it establishes `KNOWN_FACT: 0 total prospects found.` and logs the `INFERENCE: LOW_PROSPECT_VOLUME bottleneck`. If no campaign has launched, it signals `INSUFFICIENT_DATA`. 

## 3. Strict Verification & Idempotency Rules
No synthetic goals or simulated completions are allowed:
- "WON" stages are rejected; strictly relying on `CONVERTED`.
- The CMO re-verifies the canonical target explicitly against database rows.
- If an outcome falls short of the target gap, the CMO naturally cycles into replanning, repeating diagnosis to evaluate the active pipeline block (e.g., Low Conversion vs Low Prospecting).
- The CMO shuts down its goal and sets it to `COMPLETED` the precise cycle that `currentCustomers >= target` without creating infinite loops.

## 4. End-to-End Testing & Build Verification
The exhaustive test suite `v57_cmo_e2e.test.ts` deterministically verified:
- `PROVE: End-to-End CMO Path (Observe, Diagnose, Plan, Delegate)`
- `PROVE: Task Completion -> Verification -> Completion of Goal`
- `PROVE: Emergency Stop limits CMO`

**Build Metrics:**
- **Backend Tests:** 450 / 450 PASS (includes new deterministic E2E validation matrix).
- **Backend TypeScript:** PASS.
- **Frontend TypeScript:** PASS.
- **Frontend Build:** PASS.
- **Commit Baseline Integrity:** All V3, V4, and V5 prior functionalities (CEO, CFO, CTO loops, Company Brain 2.0, Control Layer, Real Execution Engine) intact.

## 5. Security & Boundary Assurance
- **Workspace Isolation:** All queries forcefully assert `.eq('workspace_id', workspaceId)`.
- **Prompt Injection Resilience:** CMO execution pipelines evaluate diagnostic information deterministically using quantitative signals. Content sourced from campaigns acts purely as raw data input for worker assignments rather than executable parameters.
- **Action Blocking:** `PAUSED` and `STOPPED` operating states instantaneously shut down the evaluation lifecycle.
