# ITWIELD REAL PILOT MODE (V6.4)

## 1. Pilot Boundary & Safety
The first real-world execution explicitly forces the platform into a constrained capability boundary to observe the multi-executive loops interacting safely with real provider networks. 
- **Active Provider:** GitHub (Restricted via `ToolAdapter`)
- **Permitted Capabilities:** `READ_REPOSITORY`, `CREATE_ISSUE`
- **Blocked Capabilities:** All CRM writes, deletion scopes, external communications. 

## 2. Credential Handling
No raw credentials bypass the `ToolAdapter`. 
- The React Frontend, AI Worker prompt inputs, and logging mechanisms receive sanitized JSON representations. 
- The backend `ControlLayerService` utilizes KMS-encrypted values stored in `company_systems` to execute HTTP calls directly to the provider.

## 3. Execution Idempotency & Reconciliation
Before issuing a `POST` mutation to an external provider, the Worker queries via `reconcile()` to ensure the exact deterministic artifact does not already exist (e.g. searching GitHub for `ItWield Pilot Verification — [unique-id]`). If the artifact is found, the system absorbs it as a successful completion rather than duplicating the request.

## 4. Independent Verification
A successful HTTP 201 Created from a provider is treated strictly as an *unverified intent fulfillment*. 
- The `OutcomeVerificationService` forces a subsequent independent `GET` operation using the returned identifier to prove external reality matches the intent.
- Only upon verified parity does the Company Brain record the `FACT` of completion. 

## 5. Limitation Notice
Without injected, genuine OAuth tokens belonging to a Pilot Founder, the actual HTTP execution against GitHub remains cleanly blocked to prevent falsified test reporting. The operational state for Live Execution correctly falls back to: `NOT VERIFIED — CREDENTIALS NOT AVAILABLE`.
