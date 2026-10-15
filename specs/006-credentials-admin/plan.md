# Credentials and Administrative Overview — Plan

Specification: [spec.md](spec.md) · Date: 2026-10-15 · Status: Implemented and manually verified

Reviewed constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0. Parent: 001-shiftpatch/T07. Dependencies: existing 004 API/RLS and 005 UI; their pending historical verification remains pending.

## Minimal technical decision

Extend the existing role-aware application at `/`. Add a nurse credential section and replace the admin scope message with a read-only dashboard. Keep memory-only Bearer sessions and the existing request/error lifecycle. No new authentication system, client database access, routes for separate pages, state library or dependencies are needed.

Reuse `requireCaller`, request-scoped Supabase clients, Zod validation, existing Shift schemas, `readShifts`, feedback components and Jest/RTL. Keep upload and admin data operations in `lib/server`. The new admin endpoint validates role before querying; the existing cross-agency marketplace remains accessible under its current contract. Compute both counts from the exact returned shift array so metrics and rows cannot disagree.

## Constitution review

| Principle | Application | Exception |
| --- | --- | --- |
| I. Spec before code | R01–R07 and AC01–AC21 precede application changes; defaults identified explicitly | None |
| II. Exact contracts | Preserve fixtures, existing Shift/error contracts, Bogota expiry and all six requested IDs | None |
| III. Minimal scope | P0 first; reuse current route, SDK and testing stack; no scripts/dependencies | None |
| IV. Security | Verified caller in each route; own-nurse document ownership; RLS; admin-only new resources | None |
| V. Verification | Focused tests plus direct hosted policy/RPC/storage checks and browser flows | None |
| VI. Evidence | Actual outcomes in tasks; unchanged private native export after the turn | None |
| VII. Governance | Constitution 1.2.0 reviewed; no amendment | None |

## Credential persistence and enforcement

1. Inspect the dedicated project, Storage availability, deployed permissions and current migration numbering. Do not print environment values. New migrations begin at `008` if numbering is still unchanged. Use only ordered SQL under `db/migrations`; never rewrite 001–007 or replay fixture seed to reset data.
2. Extend `shiftpatch.nurse_credentials` with nullable document metadata: internal object path, original display filename, MIME type, byte size and upload timestamp. Legacy fixture rows keep their exact expiry dates and null document fields. New uploaded metadata is all present or all absent. One row per nurse remains the eligibility source; no new credential type/approval workflow.
3. Configure a private `credentials` Storage bucket with the proposed size/MIME restrictions. Use the supported Storage administration interface for bucket setup; manage application schema and storage policies in migrations. Do not write file rows directly into managed `storage.objects`.
4. Upload through the authenticated Next route with the caller's existing access token. Validate role before reading the body; validate bounded request bytes, real date, one file, size, extension, MIME and a minimal file signature. Enforce an actual streaming request-size bound before multipart parsing; Content-Length alone is insufficient. Keep generic error responses and never treat a file signature as license verification or malware scanning.
5. Generate an unpredictable object name under the verified Auth UUID prefix; never use the submitted filename as a path. Storage policies must enforce the credentials bucket, mapped nurse role and own UUID prefix for insert/select/delete. No object update/upsert or public download. Limit SELECT/delete to operations needed for finalization and cleanup; deny foreign and unmapped access. The browser only uses the same-origin application API.
6. Add a narrowly scoped credential read/finalization RPC, deriving nurse identity from `auth.uid()`. Finalization validates metadata/date again, checks that the uploaded private object exists under the caller's ownership, and atomically updates the active expiry plus metadata. Use trusted storage metadata for size/type where available; clients cannot finalize nonexistent/foreign objects. A security-definer function requires empty search_path, qualified names, explicit role/ownership checks and revoked PUBLIC execution. No broad direct credential writes.
7. Storage and Postgres do not share an atomic transaction. Upload a unique object first; commit active metadata only after upload success. Serialize replacements for the same nurse in the finalization RPC. Return the superseded internal path only to server code for best-effort deletion after commit. On failed finalization, delete the new unreferenced object; a cleanup failure never changes eligibility or becomes a false success. Record orphan cleanup privately as pending; do not add a cleanup service in this scope. Ambiguous finalization outcomes must be reconciled against active metadata before deleting any object.
8. Keep the claim RPC as the authority. Its existing missing/expired checks use the trusted America/Bogota date and inclusive expiry. Review concurrent replacement/claim behavior and serialize on the nurse credential row where needed, with consistent locking order; no network calls inside database transactions. A successful upload of a future date is self-declared demo eligibility, not external verification. No document requirement is retroactively imposed on fixture rows.
9. Read current status from the server. A legacy valid credential can show that no document has been uploaded without being labelled missing. A past-date upload shows expired and continues to receive the existing exact claim rejection. Expiry does not auto-cancel already filled shifts.

## Administrative overview and secondary scope

- `GET /api/admin/dashboard`: verify admin, reuse `readShifts`, return full shifts plus open/filled counts from that snapshot. Do not restrict the existing marketplace or use a service-role client. No new privileged shift mutation rights.
- UI: semantic global table, agency/role/date/local start-end/status/claimant columns, two metric values, refresh, loading, empty and failure states. Status includes text; color alone is insufficient. Reuse current typography/tokens, responsive layout and session cancellation behavior.
- P1 audit: a separate later migration creates an append-only table with generated ID, shift reference, actor ID, action, server timestamp, and cancellation reason/previous claimant when applicable. Instrument the existing secured create/claim/cancel RPCs so event and mutation share a transaction. Failed/rolled-back transitions produce no event; no historical backfill or application user raw writes. Admin read policy and route enforce access independently. Return the latest 50 records; no pagination/filter product in this increment.
- P2 timesheets: reuse the admin snapshot to show filled assignments and scheduled duration; calculate overnight duration across midnight using unchanged local times. Clearly label scheduled hours and absence of attendance verification. No timesheet table in the database, writes, approval state or payroll calculation. No separate API needed.

## Planned changes

| Requirements / criteria | Files / resources | Change |
| --- | --- | --- |
| R01–R03 / AC01–AC10 | db/migrations/008_credentials.sql (proposed); dedicated Storage setup | Nullable legacy metadata, own-nurse read/finalization, private storage policies, claim concurrency review |
| R01–R03 | app/api/credentials/route.ts; lib/server/credentials.ts; lib/domain/schemas.ts and types.ts | Bounded multipart upload, metadata/status contracts, secured reads and finalization |
| R01–R03 | app/components/CredentialForm.tsx; ShiftPatchApp.tsx; lib/client/api.ts | File/date form, own current status, multipart request support without JSON Content-Type; preserve session/error handling |
| R04 / AC11–AC14 | app/api/admin/dashboard/route.ts; app/components/AdminDashboard.tsx; ShiftPatchApp.tsx | Admin-only snapshot, metrics, global table and state handling |
| R05 / AC15–AC17 | Later audit migration; lib/server audit read helper; app/api/admin/audit/route.ts; admin audit section | Transactional shift events and admin-only latest-50 table |
| R06 / AC18–AC19 | Admin dashboard optional section; focused duration test | Scheduled assignments preview if core and audit are verified |
| R07 / AC20–AC21 | __tests__/unit; __tests__/ui; __tests__/integration; feature tasks | Role/contract/failure tests, hosted storage/database checks and actual outcomes |

Paths are a proposed minimal ownership map; avoid adding a helper if an existing file can own the behavior clearly. No separate service architecture or one-off project utilities.

## Planned verification

| Criteria | Meaningful check | Required outcome |
| --- | --- | --- |
| AC01–AC06 | RTL form states and route tests; real private upload/read/reload; invalid/empty/oversize/signature mismatch; duplicate fields; failure between upload and finalization | Persisted complete metadata, unchanged active row on failure, no public/foreign access or false success |
| AC05, AC14 | Role matrix at HTTP and direct Supabase Storage/Data API/RPC level, including unmapped identity and spoofed paths/roles | Correct 401/403, no ownership bypass, no raw credential/audit writes or secret output |
| AC07–AC10 | Existing claim regression plus fixed-instant before/on/after expiry and Bogota-midnight checks; hosted expired/missing denial and eligible claim | Inclusive trusted date; exact error; atomic assignment; no shift mutation on rejection |
| AC09 | Two eligible test identities claim a disposable shift; replacement/claim concurrency check | At most one claim succeeds; coherent active credential/claim ordering |
| AC11–AC13 | Admin browser/table checks for both agencies; mixed/empty lists; refresh/error states; compare metrics to same response | Exact full rows, textual status and matching counts; no invented totals |
| AC15–AC17 | Real successful and denied create/claim/both cancellation reasons, transaction rollback, direct insert/update/delete/read attempts | One committed event per successful action, none for failures; admin-only immutable log |
| AC18–AC19 | Optional overnight duration and admin scheduled-preview browser checks | Correct scheduled duration and explicit scope; no verified-work claim |
| AC20–AC21 | Relevant Jest suites, npm run typecheck, npm run lint, npm run build on supported Node 24; browser and diff/security review | Actual commands/results/limits in tasks; fixtures unchanged |

Use isolated test data in the dedicated project; never upload real credential documents. Do not alter either fixture expiry to make a test pass. Both sample credential dates must be evaluated against the actual trusted date rather than assuming either nurse is currently eligible. Arrange a disposable eligible identity through supported private administration and reviewed SQL migrations if required. Coordinate hosted mutations with other suites, preserve three baseline shifts, and record private cleanup results without new scripts. Mocked tests do not prove RLS, Storage ownership or hosted RPC behavior.

## Skills and version-matched guidance

Planning consulted repository Ponytail/security rules and Supabase skill references `security-rls-basics.md` and `security-privileges.md`. No Ponytail tool is exposed; use the repository fallback. Read schema/locking and other relevant Supabase references before SQL authoring. Hallmark was consulted for future UI constraints only; no design output/audit was produced. Keep the existing design system and apply its interaction/responsive guidance during implementation. Load Vercel React guidance before React changes. No delegation.

Installed Next.js route-handler documentation was inspected for native multipart `request.formData()` handling. Re-read relevant bundled docs before code, including server/client boundaries and testing guides. Use the current Jest/RTL stack. Playwright remains undeclared and requires explicit dependency approval; browser verification can use available tooling without installing it. This plan does not authorize dependency installation.

Official Supabase sources checked 2026-10-15: [private bucket behavior and upload restrictions](https://supabase.com/docs/guides/storage/buckets/fundamentals) and [Storage access control](https://supabase.com/docs/guides/storage/security/access-control). The proposed credential lifecycle, APIs and defaults above are project decisions, not provider guarantees.

## Implementation sequence and timebox

The user's hour is a prioritization constraint. Suggested 60-minute P0 attempt, assuming working backend access and existing SDK: 0–5 minutes verify prerequisites/defaults; 5–30 private credential persistence/API/form and claim regression; 30–45 admin endpoint/table/metrics; 45–60 focused checks, hosted/browser validation and actual evidence. This is an allocation, not an estimate that security, migrations and testing will certainly fit.

If upload setup, ownership or failure handling takes longer, finish those correctly and report the remaining P0 tasks. Do not spend the verification reserve on optional views. After P0 passes, implement/verify P1 audit in a separate increment. Consider P2 only after audit. Full delivery exceeds the first-hour target when required checks cannot be completed in it.

No hosted connectivity, bucket settings, Node 24 availability or new browser dependency was verified in this planning session. Existing 005 evidence records Node 22 and pending Playwright/two-nurse race; preserve those limitations. Review defaults Q01–Q06 before dependent implementation and record any changed decisions in the spec first.
