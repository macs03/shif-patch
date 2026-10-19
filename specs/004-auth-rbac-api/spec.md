# Supabase Authentication, Authorization and REST API — Specification

Feature ID: 004-auth-rbac-api · Date: 2026-10-15 · Status: Planned; implementation pending

Source: user request for secure authentication, three roles and six REST operations, explicitly using Supabase for authentication and authorization. Parent: [001-shiftpatch/spec.md](../001-shiftpatch/spec.md), R02–R09. Applicable constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0.

## Problem and expected outcome

ShiftPatch has hosted fixtures, a server read helper and a Jest/Zod harness, but no login or REST handlers. Nurses must browse and claim shifts, agencies must create and manage their own shifts, and admins must read all shifts. Authorization must hold inside the server and the Supabase database.

## Scope

Included: Supabase email/password login and signed access JWTs, identity mapping, role/ownership helpers, RLS and secured database mutations, six API operations, validation, serialization and automated contract/security tests.

Excluded: OAuth, registration, recovery, email verification flows, advanced user management, new UI, new administrative endpoints, uploads, audit/timesheet modules and deployment. Administrative information in this feature is limited to the existing full shift contract; additional administrative fields require a specification.

This session delivers planning documents only. Accounts, database migrations and application implementation remain future work.

## Requirements and acceptance criteria

| Requirement | Required behavior | Criteria |
| --- | --- | --- |
| R01 | Authenticate all five sample users through Supabase Auth with unchanged public identities | AC01–AC03 |
| R02 | Verify Bearer authentication on every protected route | AC04–AC06 |
| R03 | Enforce roles and ownership in server handlers and Supabase | AC07–AC09, AC14 |
| R04 | Implement global listing and own-agency creation | AC10–AC11 |
| R05 | Implement credential-aware atomic claim and cancellation | AC12–AC13 |
| R06 | Preserve full shift and error contracts, including own-agency listing | AC09, AC15–AC16 |
| R07 | Validate requests and prevent disclosure of credentials/internal errors | AC03, AC06, AC17 |
| R08 | Supply automated security/contract tests and actual verification evidence | AC18–AC19 |

| Criterion | Scenario | Required result |
| --- | --- | --- |
| AC01 | Each sample email logs in with the published trial password | 200 exactly `{token,user:{id,name,role}}`; token is a Supabase-signed access JWT; public identity matches parent fixtures |
| AC02 | Unknown email or incorrect password | 401 `{error:"Invalid email or password"}` without enumeration |
| AC03 | Inspect password storage and public responses | Supabase manages hashed passwords; no plaintext stored, hashes/refresh tokens/server keys returned or credentials logged |
| AC04 | Missing/malformed Bearer header, invalid/expired/tampered/wrong-project token on any protected route | 401 `{error:"Unauthorized"}`; no operation executes |
| AC05 | Valid Auth user without an application mapping | 403 `{error:"Forbidden"}`; no implicit user or role creation |
| AC06 | Client spoofs ID, role or agency through payload or editable metadata | Identity derives from verified token subject and protected mapping; spoofing cannot change privileges |
| AC07 | Nurse or admin creates a shift | 403 `{error:"Forbidden"}` |
| AC08 | Agency or admin claims a shift | 403 `{error:"Forbidden"}` |
| AC09 | Agency requests another agency's management list, or nurse/admin requests this endpoint | 403 `{error:"Forbidden"}`; owning agency receives only its shifts |
| AC10 | Any mapped role lists baseline shifts | 200 `{shifts:[...]}` with all three full shifts across agencies, including past dates |
| AC11 | Agency creates valid shift | 201 full open Shift, its own agency ID/name and `claimedBy:null` |
| AC12 | Nurse claims open shift | Valid credential: 200 full filled Shift with caller ID; expired/missing credential: 403 `{error:"Credential expired, cannot claim shift"}`; concurrent eligible claims have at most one success |
| AC13 | Claiming nurse or owning agency cancels filled shift with either reason | 200 full reopened Shift plus `cancellation:{reason,previousNurseId}`; claimant captured before atomic update; other nurses/agencies and admin denied with 403 |
| AC14 | Direct Supabase calls attempt forbidden reads, raw writes, RPC bypass or profile escalation | Anonymous and unmapped users denied; no hash reads or editable roles/mappings; database enforces role, ownership, credential and transition rules |
| AC15 | Every successful shift response | Full exact required properties, facility-local date/time strings and open/null invariant |
| AC16 | Known failure cases | `{error:string}` with specified status/message; no raw provider/database errors |
| AC17 | Malformed JSON, unknown fields, impossible date, invalid time/role/reason, equal start/end or nonempty claim body | 400 `{error:"Invalid request"}` before mutation; overnight shifts remain valid |
| AC18 | Automated suites exercise six operations and all roles | Positive/negative contracts, ownership, token failures, expiry boundaries and concurrency covered; real user-token hosted checks prove database authorization |
| AC19 | Delivery review | Actual tests, typecheck/lint, supported-Node build and hosted permission outcomes recorded; failures/skips/pending evidence disclosed |

## Contracts and data

Preserve the five users, two agencies, two credential expiries and three shifts in [parent fixtures](../001-shiftpatch/spec.md#r01-fixtures). Internal Supabase UUIDs must not replace public IDs: `agency-a`, `agency-b`, `nurse-1`, `nurse-2`, `admin-1`. Sample credentials must work without an email verification flow.

`Shift = {id,agencyId,agencyName,role,date,startTime,endTime,status,claimedBy}`. Role is RN/LPN, status open/filled, dates YYYY-MM-DD, times facility-local HH:mm. Open shifts have `claimedBy:null`. Preserve overnight hours and past fixture dates. Reuse existing Zod response schemas and inferred types.

| Method / path | Identity and input | Success |
| --- | --- | --- |
| POST /api/auth/login | Public; `{email,password}` | 200 `{token,user:{id,name,role}}` |
| GET /api/shifts | Any mapped role; Bearer | 200 `{shifts:Shift[]}` |
| POST /api/shifts | Agency; `{role,date,startTime,endTime}` | 201 Shift; agency derived from authenticated identity |
| POST /api/shifts/:id/claim | Nurse; empty body | 200 Shift |
| POST /api/shifts/:id/cancel | Claiming nurse or owning agency; `{reason:"no-show"|"advance"}` | 200 `{...Shift,cancellation:{reason,previousNurseId}}` |
| GET /api/agencies/:agencyId/shifts | Owning agency only | 200 `{agencyId,shifts:Shift[]}` |

Admin remains read-only and uses global listing. Baseline agency-a list is shift-1/shift-2; agency-b list is shift-3. Cancellation response is flat, matching the existing schema. Both reasons are available to either authorized cancellation role; no extra reason-specific rules are prescribed.

Additional feature error decisions: 400 `Invalid request`; 401 `Unauthorized`; 403 `Forbidden`; 404 `Shift not found`; 409 `Shift is not available` for claim of a filled shift, or `Shift is not filled` for cancellation of an open shift; 500 `Internal server error` for unexpected internal failure; 503 `Service unavailable` for detected upstream unavailability. Preserve exact packet login/credential messages. Authenticate before role checks; check authorization before returning resource details. Unsupported non-HEAD/OPTIONS methods return 405 `{error:"Method not allowed"}`; retain normal HTTP HEAD/OPTIONS semantics.

Hardening authorized on 2026-10-19 under [009](../009-security-hardening/spec.md): JSON request bodies on login/create/claim/cancel are limited to 65,536 actual bytes, including whitespace. Exceeding the limit returns 413 `{error:"Request body too large"}`; accepted bodies keep existing parsing/schema rules, including empty claim requests. Supabase password-login throttling returns generic 429 `{error:"Too many requests. Try again later."}`; no guessed Retry-After duration or automatic retry. Success payloads, role permissions and business rules remain unchanged.

## Questions and decisions

| ID | Decision | Resolution and source |
| --- | --- | --- |
| Q01 | Cancellation rights | Resolved by user 2026-10-15: claiming nurse or owning agency; admin read-only |
| Q02 | Credential expiry | Resolved by user 2026-10-15: valid through expiresOn, using America/Bogota to determine today's date |
| Q03 | Additional error codes/messages | Feature decisions above fill parent Q03 without changing packet messages |
| Q04 | Token refresh | Planning decision: return access token only; after expiry log in again; no refresh endpoint/cookie session in this scope |

Expiry tests use a fixed instant with business date 2026-10-15 so fixture assertions do not change with the wall clock; production computes the business date from trusted server/database time. Do not reject old fixture shifts based on their shift dates.

## Delivery condition

Authentication service, Supabase JWT verification utilities, authorization helpers, six operations in five route files, request schemas, ordered migrations and automated API tests with direct hosted security evidence. Unit mocks alone do not prove JWT validation or RLS. No commit/publication unless requested.

## Change history

| Date | Change | Source |
| --- | --- | --- |
| 2026-10-15 | Initial plan; cancellation and expiry decisions resolved | User request and two explicit replies |
