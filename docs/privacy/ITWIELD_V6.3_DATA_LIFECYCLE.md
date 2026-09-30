# ITWIELD DATA LIFECYCLE (V6.3)

## 1. Account Lifecycle
Accounts can be transitioned from ACTIVE to DELETED. 
- **Deletion Behavior:** The request immediately invalidates all active sessions. A durable background job transitions the account to `DELETION_REQUESTED`, suspending any active autonomy across all owned workspaces, before permanently wiping the User record.

## 2. Workspace & Company Lifecycle
Workspaces are strictly isolated.
- **Deletion Behavior:** Can be requested independently of Account Deletion.
- **Workflow:** 
  1. Operating state shifts to `STOPPED`.
  2. The `lifecycle_state` locks to `DELETION_REQUESTED`.
  3. All pending autonomous tasks (CEO, COO, CMO, CTO, CFO loops) are terminated safely without causing partial external mutations.
  4. Encrypted connections and credentials are wiped.
  5. The `workspace` and cascading `company_memory` are permanently erased.

## 3. Data Export Lifecycle
Founders may export eligible workspace data (e.g., Company Brain, goals, objectives). 
- Secrets, raw OAuth tokens, and API keys are explicitly excluded and structurally isolated from export generators.

## 4. Connection Lifecycle & External Boundaries
Deleting a connection in ItWield explicitly revokes the associated token (if supported by the provider) and zeroes the encrypted record locally. 
- **External Data Note:** ItWield does NOT systematically issue cascading deletes to external providers (e.g., deleting GitHub issues or CRM opportunities) upon disconnection.

## 5. Retention & Backups
- Active data is retained indefinitely unless explicitly deleted by the user.
- Deleted data is fully expunged from the live relational database.
- Standard disaster recovery backups automatically age out over the rolling 30-day window.
