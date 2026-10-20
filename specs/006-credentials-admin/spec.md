# Credentials and Administrative Overview — Specification

Feature ID: 006-credentials-admin · Date: 2026-10-15 · Status: Implemented and manually verified

Request/contract source: user's credential management and administrative dashboard epic, including the one-hour priority note. Applicable constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0. Parent scope: 001-shiftpatch/R10 and Q04. Existing API: 004-auth-rbac-api. Existing UI: 005-core-user-experience.

## Problem and expected outcome

Nurses need to submit a credential document and expiration date, see their current eligibility, and receive an authoritative rejection when an expired credential is used to claim a shift. Administrators need a read-only operational view of both agencies with current shift states and open/filled counts. Demonstrate these behaviors without building a verification, payroll or workforce management platform.

At the original baseline, the claim RPC checked credential expiry while uploads, credential metadata reads and the administrative interface were still pending. Those modules are now implemented, with actual evidence and limits in tasks.md; implementation does not certify all deployed controls.

Current composition follows [011](../011-role-component-split/spec.md): NurseDashboard owns credential presentation and AdminDashboard retains its local tabs/filters; ShiftPatchApp coordinates requests/session reset. Claims now require the shared confirmation defined in [012](../012-shift-action-confirmation/spec.md); credential upload itself has no added confirmation requirement. Guidance synchronization in [013](../013-harness-guidance-sync/tasks.md) does not close earlier hosted/browser gaps or alter this feature's historical constitution review.

## Scope and priority

- P0: nurse credential form, private document upload, persisted metadata, derived status, server/database eligibility enforcement, admin global shift table, status badges, counts and access restrictions.
- P1: minimal persistent audit log for successful shift creation, claim and cancellation, plus an admin-only table. This is a requested secondary deliverable; if deferred, report the epic as partial.
- P2: optional admin timesheet preview of scheduled assignments. No actual worked hours are available.
- Excluded: external verification, automated license checks, OCR, manual approval workflows, advanced reporting, payroll, attendance tracking, clock-in/out, full timesheet approval and document preview/download UI.

## Requirements

| ID | Required behavior | Acceptance criteria |
| --- | --- | --- |
| R01 | Nurse-only credential form accepting one document and an expiration date | AC01–AC03 |
| R02 | Store the document privately and persist its metadata for the authenticated nurse | AC04–AC06 |
| R03 | Derive status and enforce credential eligibility in the claim operation | AC07–AC10 |
| R04 | Admin-only operational overview across both agencies | AC11–AC14 |
| R05 | Secondary persistent audit log of relevant successful shift actions | AC15–AC17 |
| R06 | Optional read-only timesheet preview with honest scheduled-hour labels | AC18–AC19 |
| R07 | Preserve existing contracts, verify delivered scope and record actual evidence | AC20–AC21 |

## Scenarios and acceptance criteria

| Criterion | Requirement | Given / when | Observable result |
| --- | --- | --- | --- |
| AC01 | R01 | A signed-in nurse opens the application | An accessible file input and expiration date input are available with the exact required test IDs |
| AC02 | R01 | A nurse submits a supported nonempty document and real calendar date | The form shows pending/success or actionable failure feedback and prevents duplicate submission |
| AC03 | R01 | Missing/empty file, unsupported file, oversize file, invalid date or malformed multipart body | Server rejects input; active credential remains unchanged; UI does not report success |
| AC04 | R02 | An authenticated nurse uploads successfully and reloads/signs in again | Own filename, type, size, upload time, expiration date and derived status are retrieved from persistence |
| AC05 | R02 | Anonymous, agency, admin or another nurse attempts credential mutation/read or direct storage access | Anonymous receives 401 at HTTP; forbidden roles receive 403; another nurse cannot access or modify the owner's credential/document; direct provider access enforces equivalent ownership |
| AC06 | R02 | Storage or metadata persistence fails during replacement | No false success or partial active credential replacement; previous active metadata/eligibility survives; failed new-object cleanup is reported privately as pending if necessary |
| AC07 | R03 | Credential expires today in America/Bogota | Credential remains valid through today; no client-supplied clock or status controls eligibility |
| AC08 | R03 | Credential is expired or absent; nurse calls claim directly | 403 `{error:"Credential expired, cannot claim shift"}`; shift remains unchanged |
| AC09 | R03 | A valid credential owner claims an open shift | Existing atomic claim succeeds with full Shift; simultaneous claims still have at most one winner |
| AC10 | R03 | A nurse submits a past expiration date | Submission persists as expired and cannot restore claim eligibility; UI explains the expired status |
| AC11 | R04 | An admin opens the dashboard | All shifts from both agencies appear with agency, role, date, original local hours, status and claimant where filled |
| AC12 | R04 | Admin inspects shift rows | Each status uses `open` or `filled`; cancellation continues to reopen the shift; no invented cancelled state |
| AC13 | R04 | Admin loads or refreshes the overview | Open and filled metrics equal the counts in the same returned shift snapshot; empty data shows zero; loading/error is not presented as zero activity |
| AC14 | R04 | A non-admin calls administrative endpoints directly or attempts UI navigation | No administrative data is returned; missing/invalid session is 401, authenticated non-admin is 403; existing authorized marketplace access remains intact |
| AC15 | R05 | A shift is created, claimed or cancelled after audit enablement | One event commits with the successful transition, recording event ID, actor ID, shift ID, action and timestamp; cancellation includes reason and previous nurse |
| AC16 | R05 | A transition fails or rolls back, or a caller attempts raw audit mutation | No successful-action event is recorded; application users cannot insert/update/delete audit rows directly |
| AC17 | R05 | Admin loads audit, including when no events exist | Newest-first bounded log in `audit-log-table`, or explicit empty state; non-admin HTTP/provider reads denied; no fabricated historical events |
| AC18 | R06 | Optional timesheet preview is delivered | `timesheet-table` shows filled assignments with shift, nurse ID, agency, date, start/end and scheduled duration, including overnight shifts |
| AC19 | R06 | Admin inspects optional timesheet labels and permissions | View explicitly states scheduled hours, not verified work or payable hours; same admin-only resource restriction applies |
| AC20 | R07 | Existing nurse/agency flows and fixture contracts are checked | IDs, emails, names, dates, expiry fixtures, hours, full response fields and open/null invariant remain unchanged; admin stays read-only |
| AC21 | R07 | A delivery increment is declared complete | Relevant automated checks, hosted database/storage authorization and real browser flows have actual evidence; deferred/failed checks and private transcript availability are recorded |

## Proposed contracts and data

These endpoints and file limits are planning defaults, not pre-existing packet contracts. Review them before dependent implementation.

| Method / route | Identity and request | Success response |
| --- | --- | --- |
| GET `/api/credentials` | Verified nurse, no caller-selected nurse ID | 200 `{credential: CredentialMetadata \| null, status: "valid" \| "expired" \| "missing"}` |
| POST `/api/credentials` | Verified nurse; multipart fields `document` and `expiresOn` only | 200 same credential response after both private upload and metadata persistence succeed |
| GET `/api/admin/dashboard` | Verified admin | 200 `{shifts: Shift[], metrics: {open: number, filled: number}}` |
| GET `/api/admin/audit` | Verified admin; P1 | 200 `{events: AuditEvent[]}`; latest 50 events, deterministic timestamp/ID ordering |

`CredentialMetadata`: `expiresOn`, nullable legacy `documentName`, `mimeType`, `sizeBytes`, `uploadedAt`. Internal object paths and provider identifiers are omitted. Status is derived at read/claim time, never persisted as a stale boolean. A valid status means date eligibility for this demo; it does not mean a license was verified.

Proposed file policy: one PDF, JPEG or PNG, nonempty, maximum 2 MiB; reject unsupported extensions, MIME/signature mismatch and multiple file/date fields. Validate calendar dates on the server. Expired uploads are accepted and shown as expired. One active credential per nurse; no document history UI. Existing seeded credentials remain date-eligible without a document until replaced; requiring a document retroactively would change existing fixtures and is outside this plan.

Authentication/errors follow 004: Bearer access token, verified mapped identity, uncached responses, `{error:string}`, 401 Unauthorized, 403 Forbidden, 400 Invalid request, 500 Internal server error and 503 Service unavailable. Proposed upload-specific responses: 413 File too large; 415 Unsupported document type. Never accept caller-selected nurse, status, object path, actor or role. Existing shift APIs and response shapes remain intact.

| Required data-testid | Element / priority |
| --- | --- |
| `credential-upload-input` | Nurse document input / P0 |
| `credential-expiry-date-input` | Nurse date input / P0 |
| `admin-dashboard-shift-table` | Global admin shift table / P0 |
| `admin-shift-status-badge` | Each admin shift status indicator / P0 |
| `audit-log-table` | Admin audit table / P1 |
| `timesheet-table` | Optional scheduled-assignment preview / P2 |

## Open questions and assumptions

| ID | Question / assumption | Affected criteria | Resolution and source |
| --- | --- | --- | --- |
| Q01 | Does validation mean administrative/external approval? | AC07–AC10 | Planning default: automatic structural/date validation only; user excludes external verification and prioritizes a lightweight demo. No approval queue |
| Q02 | File formats, size and replacement policy | AC02–AC06 | Proposed defaults above; not user-specified constraints. Review before implementation |
| Q03 | Must seeded nurses upload before claiming? | AC07–AC09, AC20 | Preserve existing eligibility/fixture dates; legacy nullable document metadata is intentional |
| Q04 | Is an hour sufficient for the whole epic? | AC15–AC19, AC21 | P0 first; P1 secondary; P2 optional, matching the user's note. The timebox is a target, not a delivery guarantee |
| Q05 | Does a timesheet prove worked hours? | AC18–AC19 | No attendance data exists; propose an explicitly labelled scheduled-hours preview only. If actual work records are required, defer and respecify |
| Q06 | Is hosted Storage configured and accessible? | AC04–AC06, AC21 | Resolved. The user applied migrations 008 and 009 in the project SQL editor. The credentials bucket is private. A public object URL returned HTTP 400 with no file body |

## Delivery condition

P0 completes only with AC01–AC14 and AC20–AC21 verified. Completing P0 does not complete the requested audit deliverable. P1 additionally requires AC15–AC17. P2 is optional and requires AC18–AC19 if implemented. Do not add empty placeholder tables solely to satisfy deferred test IDs. No application/database implementation, dependency installation, commit or publication is authorized by this planning session.

## Verification outcome

Closed on 2026-10-15 after hosted manual checks. P0, P1 and the optional P2 preview are implemented. Recorded limits: the hosted nurse-1 expiry was replaced by a test upload, only the `advance` cancellation was shown in the audit log, raw audit-table denial was not re-queried, and the Node 24 build was not run. Details are in [tasks.md](tasks.md).

## Change history

| Date | Change | Source |
| --- | --- | --- |
| 2026-10-15 | Initial prioritized specification | User's credential/admin epic and repository inspection |
| 2026-10-15 | Adopted the documented P0–P2 defaults for implementation; Q06 remains unresolved | Implementation session |
| 2026-10-15 | Closed as implemented after hosted credential, claim, audit and private-storage checks | User verification and a public-URL request |
