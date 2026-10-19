# Security and Code Quality Improvements — Tasks and Evidence

Specification: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Date: 2026-10-19

## Tasks

| ID | Priority / findings | Requirements / criteria | Work and files | Dependencies | Status | Completion checks |
| --- | --- | --- | --- | --- | --- | --- |
| T00 | Planning | R01–R06 / planning delivery | Review code and prepare spec/plan/tasks, index and bounded diagnostics | None | Completed | Five findings and one assessment mapped; three documents/six local links and AC01–AC08 checked; diagnostics and limits recorded |
| T01 | P2 / S02 | R01,R06 / AC01, AC07–AC08 | Release/cancel upload reader in `lib/server/credentials.ts`; focused unit tests | T00 | Completed | Same 400/413 and valid-upload behavior; reader cleanup asserted including failure paths |
| T02 | P2 / S04 | R02,R06 / AC02, AC07–AC08 | Validate audit RPC envelope in `lib/server/db.ts`; route/unit tests | T00; null is not an empty audit | Completed | Malformed non-null payload fails generically; valid/empty arrays and role checks unchanged |
| T03 | P2 / S03 | R03,R06 / AC03, AC07–AC08 | Observe cleanup failure/deferral in `lib/server/credentials.ts`; tests | T00 | Completed | Sanitized server signal, no public response change or unsafe deletion; unresolved retention remains explicit |
| T04 | P2 / S01 | R04,R06 / AC04, AC07–AC08 | Implement 64 KiB bounded JSON reading using shared HTTP reader; retain multipart limits | Q01 resolved by user clarification | Completed | Streaming bytes/cleanup/no-write boundaries and normal API flows verified; 58 local tests, typecheck/lint passed |
| T05 | P2 / S05 | R04,R06 / AC05, AC07–AC08 | Implement generic upstream password-login 429; deployed controls tracked under T06 | Q02 resolved; Q04 remains under T06 | Completed | Generic 429 without provider details; normal 401/login/retry verified; deployed limits unknown |
| T06 | P2 assessment / V01 | R05–R06 / AC06–AC08 | Assess direct Storage/RPC path, deployed grants/RLS and route/content-validation coverage; no SQL edits | Q03–Q04 | Assessed | Static gap recorded. No hosted probe or privilege change |
| T07 | Verification | R06 / AC07–AC08 | Review completed task diffs, regressions and relevant feature documentation; record final checks | Implemented tasks only | Completed | Current Node 24.22.0 typecheck/lint and 58 tests passed. Current build blocked by environment, including escalated retry; earlier passing build is historical. Q03–Q04 remain open |
| T08 | P3 candidate / C01 | R06–R07 / AC07–AC09 | Use the Zod parse result in `CreateShiftForm.tsx` | T00; necessity/compatibility gate | Completed | Field errors and pending/locked behavior kept. Existing create UI tests passed |
| T09 | P3 candidate / C02 | R06–R07 / AC07–AC08, AC10 | Remove unread `CredentialState.status` and its writes in `ShiftPatchApp.tsx` | T00; reader search found no `credential.status` | Completed | Pending flag, view/error display and read tickets kept. UI credential tests passed |
| T10 | P3 / C03 | R06–R07 / AC07–AC08, AC11 | Share duplicated session-reset operations with separate caller notices | User clarified readability scope | Completed | Same cleared fields, refs, invalidation and stable effect dependencies; session/401 regressions passed |
| T11 | Regression coverage | R01,R03,R06 / AC01, AC03, AC07–AC08 | Verify reader release on valid upload and active-document preservation after a lost finalize response | T01, T03 | Completed | Saved public metadata returned with 200 and no deletion; valid-upload reader unlocked; 47 tests/typecheck/lint passed; final focused checks passed |

Statuses are task delivery status, not vulnerability severity. T04–T06 do not change contracts, provision services or mutate the database.

T08–T10 are optional code-quality assessments. Record a justified deferral/no-change decision when a refactor is not strictly necessary; do not mark a deferred implementation as completed. Their assessment can be complete while the proposed implementation remains explicitly deferred.

## Coverage

| Criterion | Tasks | Current evidence |
| --- | --- | --- |
| AC01 | T01 | Oversized stream returns 413, cancels unread bytes and unlocks the reader. Cleanup exceptions do not replace 413. A failed read stays 400 |
| AC02 | T02 | `read_audit_events` is `RETURNS TABLE`, so an empty history is `[]`. `null`, objects and scalars return 500. Empty and valid arrays stay 200 |
| AC03 | T03 | Failed superseded/orphan removal and unreadable reconciliation log `{event,reason}` only. Success and the original error stay unchanged. Active objects are not removed |
| AC04 | T04 | Actual 64 KiB byte limit and generic 413 implemented; absent/understated length, UTF-8, cleanup and no mutation/login work tested |
| AC05 | T05 | Provider password-login 429 maps to generic 429; UI retries and logs in successfully; no guessed retry timing or new limiter |
| AC06 | T06 | File signatures are checked in `saveCredential` only. Storage insert and `finalize_credential` remain authenticated own-prefix checks. Deployed policies were not queried |
| AC07–AC08 | T01–T05, T07–T11 | Current 58 unit/UI tests and typecheck/lint passed on Node 24.22.0; build outcome in current execution log. Earlier builds remain historical |
| AC09 | T08, T07 | Submit uses `parsed.data`. Field messages unchanged |
| AC10 | T09, T07 | Refreshed search found no `credential.status` reader. The property and its writes are gone |
| AC11 | T10, T07 | Shared stable reset callback implemented; logout/expiry notices remain separate and session regressions pass |

AC07–AC08 also govern any implementation arising from T08–T10; their presence does not waive compatibility or regression checks.

## Execution log

### 2026-10-19 — T00 focused review and planning

- Actual agent: primary Codex agent only; no delegation. Initial working tree clean at `36c62a2`. User requested findings, a plan and improvement tasks; application/SQL implementation not performed.
- Reviewed constitution 1.2.0, shared rules, spec index/templates, 004/006 contracts/plans and existing 008 outcomes, HTTP/auth/data/credential/client boundaries, JSON schemas, route callers, credential/audit SQL and relevant tests/config. Applied Ponytail and Supabase security/privilege guidance; read installed Next.js Route Handler guide and authentication introduction. Some oversized inspection output was truncated; subsequent targeted line-number reads supplied the cited finding locations. This was a focused review, not a full penetration test.
- Bounded local diagnostics on installed Node 24.22.0: transpiled current `readJson` in memory and passed 128 KiB whitespace plus `{}`; it buffered and accepted the body before any schema. Separately evaluated the current upload-body function in memory with an over-limit chunk; observed 413, no stream cancellation and `request.body.locked === true`. Both asserts passed. No backend calls, project utilities/files, environment values or credentials used by those diagnostics; source was not changed.
- Static findings S03–S05 and assessment V01 are documented in plan.md with conditional impact and limits. No proof of foreign access, malware execution, production DoS, retained private files or actual provider malformed responses is claimed.
- Primary OWASP/Supabase references were read to validate recommendations. Supabase Auth already has rate limits; application absence alone does not prove brute-force exposure. Actual platform settings, RLS, bucket and grants were not queried. No upload/claim/cancel/create or fixture mutation.
- Full Jest/typecheck/lint/build not rerun for documentation-only changes. Existing results in 008 remain historical. No new Next.js runtime issue encountered in this request; feedback reporting pass has no new qualifying candidate and does not repeat prior reports.
- Documentation verification: inline checks passed for three documents, six local links, AC01–AC08 and S01–S05/V01 task mapping, no placeholders or trailing whitespace. `git diff --check` passed. Reviewed new documents and the index diff, including dependencies and contract-change gates. T00 complete; T01–T07 remain pending.
- Evidence: native conversation retains prompts/tool calls/results. Complete private post-turn export pending; this log is a summary, not a transcript. No shared transcript copy/redactions, commit or publication.

### 2026-10-19 — Code-quality candidates added

- Actual agent: primary Codex agent only; no delegation. User requested adding all three previously identified code-quality opportunities to the plan.
- Updated spec first with R07/AC09–AC11, then plan/tasks with C01–C03 and T08–T10: parsed Zod submission, unused credential state and duplicated session reset. Findings are maintainability candidates, not security vulnerabilities or demonstrated business failures. Preserved strict necessity and no-breaking-change gates.
- Source evidence comes from the preceding read-only review of form handlers, credential state readers/writers, session reset paths and Vercel React guidance. No application implementation, dependencies or hosted activity in this update.
- Documentation checks passed for three documents, six local links, AC01–AC11 and C01–C03 task mapping, with no placeholders/trailing whitespace; `git diff --check` passed. Reviewed candidate scope, task dependencies and index wording. T08–T10 remain pending.
- Application tests/typecheck/lint/build not rerun for documentation-only changes. Native transcript includes prompts/tool outputs; complete private post-turn export pending. No shared transcript/redactions, delegation, commit or publication. Next.js feedback pass: no new qualifying issue; prior reports not repeated.

### 2026-10-19 — Compatible implementation

- Actual agent: primary Cursor agent only; no delegation. User asked to implement the prepared improvements. Q01–Q04 stayed unresolved, so T04–T06 were assessed and not coded.
- Null semantics for T02: `read_audit_events` returns a table. PostgREST represents zero rows as `[]`. A null, object or scalar envelope is not an empty audit and becomes the existing 500.
- T01 cancels an early-rejected upload reader and releases the lock on every path. A failed cancel or release does not replace 400/413. T03 logs only `credential_cleanup` plus a fixed reason. T08 submits the successful Zod result. T09 drops unused credential status. T10 stays deferred because the two resets differ only by notice and a helper would not fix a defect.
- Node 24.22.0: `npm test -- --selectProjects unit --selectProjects ui --runInBand` exit 0, 6 suites, 46 tests. `npm run typecheck` and `npm run lint` exit 0. `npm run build` exit 0 on Next.js 16.4.1. Build warned about an ignored `yarn.lock` outside the repo. Hosted suites not run.
- Browser on the existing `localhost:3000` server: agency sign-in showed own shifts, the post-shift dialog opened, and sign-out returned to an empty login form. The automated click could not press Publish inside the dialog; invalid-field behavior is covered by the existing UI test. No shift or credential was written.
- Next.js feedback pass: no new qualifying issue beyond reports already opened. Private native export remains pending. No commit or publication.

### 2026-10-19 — T11 compatible follow-up review and regression coverage

- Actual agent: primary Codex agent only; no delegation. User asked to implement any remaining necessary work while retaining open contract decisions. Baseline HEAD `36c62a2`; preserved existing user edits in application/server/test files and 009 documents/index.
- Reviewed delivered diffs and their callers/tests against 009 spec/plan/tasks, constitution, security/Ponytail rules and installed Next.js Jest guidance. T01–T03/T08–T09 implementations are present; T10 remains reasonably deferred. Q01–Q04 remain unchanged. No additional production correction justified by this review.
- Updated scope/delivery wording to reflect actual implementation authorization, and planned T11 under existing AC01/AC03 before adding tests. Added one route regression: simulated committed finalization with a lost response, reconciled to the newly uploaded object, returns exact public metadata with 200 and never removes the active document. Extended the existing valid-upload test to assert the body reader is unlocked. No production/SQL code authored in this turn.
- Node 24.22.0 baseline: `npm test -- --selectProjects unit --selectProjects ui --runInBand` exit 0, 6 suites/46 tests. After test additions: same command exit 0, 6 suites/47 tests, zero skipped. Used a historical expired date in the new case to avoid future expiry changing its result, then ran `npm test -- --selectProjects unit --runInBand -t 'preserves the active document|rejects a bad upload'`: exit 0, 2 selected tests passed, 28 intentionally unselected. This coverage gap did not require a failing production baseline or a logic change.
- `npm run typecheck` and `npm run lint` exited 0 on Node 24.22.0. No new build: production code remained unchanged from the user's recorded successful build; that result remains historical, not this turn's execution. No browser, hosted policy, file or mutation probes, dependencies, commit or publication.
- Next.js feedback reporting pass: no new qualifying issue observed; prior reports not duplicated. Evidence remains in native conversation; complete private post-turn export pending. This summary is not a transcript; no shared transcript copy/redactions produced.
- Final review: documentation links/placeholders/whitespace and `git diff --check` passed. Another process committed the prior compatible changes during this turn (`ecb88b7`); this agent did not create that commit. Reviewed the remaining diff against refreshed HEAD: only the new test/reader assertion and follow-up spec/plan/tasks edits remain.

### 2026-10-19 — Further logic-change scope proposal

- Actual agent: primary Codex agent only; no delegation. Initial working tree clean at HEAD `704748d`.
- User requested logic aligned with best practices. Existing compatibility constraints and explicit Q01/Q02 gates remain in force, so requested clarification on allowing a 64 KiB JSON limit/413 and generic upstream-login 429. Recorded concrete files, semantics and checks in plan.md; no runtime/API contract changes implemented pending that answer.
- Re-read affected HTTP/auth code, route callers, client error handling, route tests and 009 documents; consulted Ponytail/security rules, bundled Route Handler guidance and current primary OWASP/Supabase references. Q03/Q04 remain open. No new dependencies, hosted operations or secrets accessed.
- No application checks rerun for this proposal-only scope. Native conversation preserves prompts/tool outputs; complete private post-turn export pending. No commit/publication. Next.js feedback pass: no new qualifying issue.

### 2026-10-19 — User clarified compatibility; T04/T05/T10 implementation

- Actual agent: primary Codex agent only; no delegation. User clarified that preserving functionality/flows is the constraint, while API/frontend internals and failure handling may change for best practices/readability. This resolved the concrete Q01/Q02 proposal. Q03/Q04 remain open; no hosted or database changes.
- Updated 009 criteria/decisions and 004 API contract before implementation. Applied Ponytail and Vercel React guidance with bundled Next.js Route Handler documentation. Readability changes are narrowly justified by actual duplicate reset operations and a redundant conditional left by unused-state removal, not by a claim of a new runtime bug.
- Added shared `readBody` in `lib/server/http.ts`, reused by JSON and credential uploads. JSON has a 65,536-byte streaming cap and generic 413; existing multipart limit and `File too large` message retained. Readers cancel on rejection and release their locks; cleanup failures do not replace primary errors. Password-login provider 429 now has its generic public response, no Retry-After guess or automatic retry. Protected requests still authenticate before reading bodies.
- React: stable `resetSession` shares the exact original cleared fields/locks and request invalidation for `expire` and `signOut`, with separate notices in callers. Simplified credential error-state update without changing view/error values, counters, refs or effect lifecycle. No styles, markup, fixtures, business rules, permissions or dependencies changed.
- Tests: added byte-boundary, absent/false Content-Length, UTF-8/split-character, empty/malformed/read-failure tests; actual handler 413/no login-or-mutation work and generic 429 tests; UI login retry/logout cases after both 413 and 429. Existing credential, stale-response, expiry, create/claim/cancel and session suites retained.
- First suite run exited 1: 56 passed, 2 new UI tests failed because the test queried an always-present empty banner before its message arrived and queried a login input after successful login removed the form. Corrected synchronization and asserted cleared password after sign-out, without production workarounds. Rerun exited 0: 7 suites, 58 tests, zero skipped. After making handler-test URLs match their operations, focused oversized-route test also passed (38 intentionally unselected unit tests).
- Node 24.22.0 `npm run typecheck` and `npm run lint`: exit 0. `npm run build`: exit 1, Turbopack CSS helper could not bind a local port (Operation not permitted). Retried with `require_escalated`: same failure/exit 1. External lockfile warning also appeared. This does not establish a successful current production build. No new browser/hosted/RLS runs or fixture mutations.
- Editing/check history: two documentation patch attempts were rejected before changes (empty hunk, then stale index text); corrected and reapplied. No test outcome is inferred from these editing errors. Initial user-owned plan/tasks edits preserved; no commit/publication by this agent.
- Evidence: native conversation includes prompts/tool outputs/failures; complete private post-turn export pending. No shared transcript/redactions. Final diff/docs/feedback review recorded below.
- Final verification: `git diff --check` and audit document link/placeholder/whitespace checks passed. Reviewed all reader/reset callers and the final change set. Another process committed implementation/spec changes as `9ae135f` during this turn; this agent did not commit. Remaining changes are this execution evidence update.
- Next.js reporting pass: fetched the current feedback protocol with network access. The repeated CSS-helper port-permission panic is the same blocked issue already drafted and presented earlier in this conversation; the protocol prohibits duplicate drafts/reopening forms, so no duplicate review form or submission was made. No other qualifying candidate retained.
