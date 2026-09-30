# ITWIELD PILOT RUNBOOK (V6.5)

## Pre-flight Checks
1. **Pilot prerequisites:** Ensure target provider (e.g., GitHub) is accessible.
2. **Environment checks:** Verify backend Render workers and Supabase DB connection.

## Execution Flow
3. **Founder onboarding:** Create account via normal Sign-Up flow.
4. **Company setup:** Discover basic website details into Company Brain.
5. **Connection:** Authenticate specific provider (GitHub) using OAuth.
6. **Authorization:** Explicitly grant `CREATE_ISSUE` capability for Pilot scope.
7. **Test action:** Issue natural language command to CEO to create a test tracking issue.
8. **Verification:** System automatically executes `ToolAdapter.verify()` post-execution to confirm the issue was created.

## Operational Controls
9. **Pause:** Trigger global PAUSE from Dashboard to halt subsequent worker assignments.
10. **Stop:** Trigger emergency STOP to abort all active autonomous operations.
11. **Disconnect:** Remove the provider connection via the UI.
12. **Failure handling:** Review the `action_audit_logs` if an operation bounces into `BLOCKED` or `RATE_LIMITED`.
13. **Reconciliation:** Wait for the scheduler to clear the `ceo_locked_until` lease, which will auto-trigger reconciliation.
14. **Evidence collection:** Capture the Verification output in the UI.
15. **Rollback/cleanup:** Execute V6.3 Workspace Deletion to wipe the test context.
16. **Final sign-off:** Verify success against the outcome matrix.
