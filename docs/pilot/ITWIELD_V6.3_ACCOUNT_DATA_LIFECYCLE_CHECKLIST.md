# ACCOUNT & DATA LIFECYCLE CHECKLIST (V6.3)

## Launch Gates & UX Verification

- [x] **Account Deletion UI:** Distinct, requires typing "DELETE MY ACCOUNT". Exists within the Settings -> Account layout.
- [x] **Company Deletion UI:** Distinct from Account Deletion. Explicitly notes external data is not affected.
- [x] **Data Export:** Provides structured JSON snapshot of Company Brain. Explicitly strips secrets.
- [x] **Integration Disconnect:** Clearly removes the connection mapping and halts related tool adapters.
- [x] **Session Management:** Account deletion instantly logs out all active devices/sessions.
- [x] **Autonomy Shutdown:** Deleting a workspace invokes an emergency `STOP` command under the hood, overriding the background scheduler.
- [x] **Operational Verification:** Validated end-to-end securely in `v63_data_lifecycle.test.ts`.
