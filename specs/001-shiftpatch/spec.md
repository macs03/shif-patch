# ShiftPatch — MVP Specification

Status: known contracts documented; API and UI implementation pending. Source: ShiftPatch — Required API Routes & Test IDs provided by the user, reference conversation 6ad00660-0cc0-83e8-b679-efd146e0f0cc. External contracts take precedence over abbreviated examples and skill recommendations.

## Requirements and acceptance

| ID | Requirement | Observable criterion |
| --- | --- | --- |
| R01 | Exact initial data | Dedicated database contains the two agencies, five logins, two credential expiries and three shifts below; repeatable fixture loading without duplicate IDs |
| R02 | Model and boundaries | Bcrypt hashes, valid references, only nurses as claimants; open requires claimedBy null and filled requires a nurse; facility-local times without UTC conversion; no browser access to private tables |
| R03 | POST /api/auth/login | email/password → 200 {token, user:{id,name,role}} with JWT; incorrect credentials → 401 {error:"Invalid email or password"}; verify all five logins |
| R04 | GET /api/shifts | Valid Bearer token → 200 {shifts}, including all three shifts from both agencies even if their dates are in the past |
| R05 | POST /api/shifts | Authenticated agency creates an open shift for its own agency using role/date/startTime/endTime → 201 Shift; agencyId comes from verified identity |
| R06 | POST /api/shifts/:id/claim | Nurse identified by token, empty body; valid credential + open shift → 200 filled Shift; nurse-2 → 403 {error:"Credential expired, cannot claim shift"}; two concurrent claims cannot both succeed |
| R07 | POST /api/shifts/:id/cancel | reason no-show or advance; reopens shift and clears claimedBy; → 200 Shift + cancellation:{reason,previousNurseId}; resolve permissions before implementation |
| R08 | GET /api/agencies/:agencyId/shifts | Agency can only query its own shifts; agency-a gets shift-1/2, agency-b gets shift-3; → 200 {agencyId,shifts} using the full Shift shape |
| R09 | Shared contracts | Every Shift has id,agencyId,agencyName,role,date,startTime,endTime,status,claimedBy; all errors have {error:string}; never return hashes |
| R10 | Testable interface | The 15 data-testid values below are attached to the action element or corresponding view; success/error notifications use the same ID |
| R11 | Actual evidence | Preserve prompts, original transcripts, failures and results; keep originals private and review copies before sharing; identify incomplete snapshots honestly |

## R01 fixtures

Published trial password for all five logins: `Trial2026!`. Store only its hash in the database; do not use it as a JWT secret or production password.

| ID / role | Name | Email | Credential expiry |
| --- | --- | --- | --- |
| agency-a / agency | Sunrise Health Staffing | admin@sunrisehealth.example | — |
| agency-b / agency | Metro Care Partners | admin@metrocare.example | — |
| nurse-1 / nurse | Maria Lopez | maria.lopez@example.com | 2027-01-01 |
| nurse-2 / nurse | James Cook | james.cook@example.com | 2026-06-01 |
| admin-1 / admin | Alex Kim | alex.kim@example.com | — |

| ID | Agency | Role | Date | Start | End | Status | claimedBy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| shift-1 | agency-a | RN | 2026-10-02 | 19:00 | 07:00 | open | null |
| shift-2 | agency-a | LPN | 2026-10-03 | 07:00 | 19:00 | filled | nurse-1 |
| shift-3 | agency-b | RN | 2026-10-04 | 19:00 | 07:00 | open | null |

The 19:00–07:00 shifts cross midnight. Do not change their dates or convert timezones.

## R10 test IDs

| data-testid | Element |
| --- | --- |
| login-email-input | Email input |
| login-password-input | Password input |
| login-submit-button | Login submit button |
| shift-list-item | Each shift in the list |
| shift-claim-button | Claim button for a shift |
| shift-cancel-button | Cancel button for a claimed shift |
| credential-upload-input | Credential document file input |
| credential-expiry-date-input | Credential expiry date input |
| agency-post-shift-button | Opens the shift form |
| agency-post-shift-submit-button | Shift form submit button |
| admin-dashboard-shift-table | Admin shift table |
| admin-shift-status-badge | Each admin shift status indicator |
| audit-log-table | Audit log table |
| timesheet-table | Timesheet table |
| notification-banner | Success or error confirmation |

Credential, audit and timesheet test IDs are packet requirements; their endpoints are not prescribed. Define their minimal views before implementation. Cancellation reopens a shift; the badge example does not add cancelled to the baseline Shift contract.

## Open questions

- Q01: Which roles may cancel which shifts? The contract does not specify this.
- Q02: Is a credential valid throughout expiresOn? Define an explicit facility-local evaluation date for tests.
- Q03: Which codes/messages cover a missing ID, already-filled shift, invalid token or another agency's resources? Keep errors shaped as {error:string}.
- Q04: Minimal fields and storage for upload, audit log and timesheets, without promising advanced modules.

The extended first-session scope covers SDD and skills setup, data model and fixtures. Routes, UI, uploads, dashboards and deployment belong to later tasks. Installing guidance does not add functionality.

## Maintenance constraint

The repository has no scripts directory or custom utilities for one-time work. Manage the database in Supabase; for now keep only SQL migrations in db/migrations, including exact fixtures. Preserve evidence manually without custom wrappers. Write authored project documents in English; keep original transcripts unchanged in their source language.
