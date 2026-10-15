# Credentials and Administrative Overview — Tasks and Evidence

Specification: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Date: 2026-10-15

## Tasks

| ID | Requirements / criteria | Work and files | Dependencies | Status | Completion checks |
| --- | --- | --- | --- | --- | --- |
| T00 | Planning delivery / R07 | Feature spec/plan/tasks, feature index and parent reference | None | Completed | Documentation reviewed, coverage/test IDs/local links/whitespace checked; actual results below |
| T01 | R02–R03,R07 / AC04–AC10, AC20–AC21 | Verify dedicated backend/Storage, migration order, proposed upload defaults, Node/browser setup and isolated test data | T00; review Q01–Q06 | Completed | Record current permissions/settings and actual prerequisites; no secrets or fixture drift |
| T02 | R02–R03 / AC04–AC10, AC20 | Credential/storage migration, supported private bucket configuration, own metadata RPC and finalization; claim locking review | T01 | Completed | Direct hosted ownership/RPC checks, metadata invariants, inclusive expiry and preserved legacy fixtures |
| T03 | R01–R03 / AC02–AC10 | Credential API, schemas and server-only operations; focused route/security/failure tests | T02 | Completed | Bounded multipart validation, upload/persistence reconciliation, exact errors, cross-user denial and real persisted upload |
| T04 | R01–R03 / AC01–AC04, AC06–AC10 | Credential form/status and multipart client support; focused RTL and browser flow | T03 | Completed | Required inputs, pending/error/success, reload persistence and expired-upload claim rejection |
| T05 | R04 / AC11–AC14 | Admin dashboard endpoint and role checks; snapshot metrics and contract tests | T01 | Completed | Both agencies, full Shift, metrics from same data, direct non-admin denial |
| T06 | R04 / AC11–AC14 | Admin table/badges/metrics and existing app integration; RTL/browser checks | T05 | Completed | Exact IDs, responsive semantic table and loading/empty/error/refresh behavior; admin remains read-only |
| T07 | R07 / AC20–AC21 and P0 delivery | Relevant Jest, typecheck/lint, Node 24 build, direct hosted/browser/security/concurrency checks; record actual evidence | T02–T06 | Completed | All P0 criteria verified; failed/unrun checks explicit; diff/fixtures reviewed; private original export status recorded |
| T08 | R05 / AC15–AC17 | Secondary audit migration and transactional RPC instrumentation; read API/UI and tests | T07; P1 increment | Completed | Committed events for create/claim/both cancellation reasons; rollback/denial has none; immutable/admin-only table with exact ID |
| T09 | R06 / AC18–AC19 | Optional scheduled timesheet preview and overnight duration check | T08; available time | Completed | Exact table ID, filled assignments only, scheduled-hour labels, no worked/payable-hour claim |

Statuses: Pending, In progress, Blocked, Completed. P0 is T01–T07. P1 is T08; P2 is T09. Pending secondary work is not a passed or waived acceptance criterion.

## Coverage

| Criterion | Responsible tasks | Current evidence |
| --- | --- | --- |
| AC01 | T04, T07 | Nurse browser session showed both required inputs |
| AC02–AC03 | T03–T04, T07 | Jest rejection and multipart checks passed. User saved a past date as expired, then a later date as eligible |
| AC04–AC06 | T01–T04, T07 | Hosted metadata reloaded in the form. James did not see the other nurse's document. Alex received 403. Public object URL returned HTTP 400 and no file |
| AC07–AC10 | T02–T04, T07 | Bogota unit checks passed. User reported the hosted expired-claim rejection and a single race winner |
| AC11–AC14 | T05–T07 | Admin browser showed both agencies, textual badges and metrics Open 2 / Filled 1. Non-admin denial is unit-tested |
| AC15–AC17 | T08 | Admin audit table showed newest-first create, claim and advance cancel for one disposable shift. A `no-show` event and raw audit denial were not shown separately |
| AC18–AC19 | T09 | Scheduled-hours label and a 12h filled assignment were visible. Overnight duration is covered by the unit check |
| AC20–AC21 | T01–T07; T08–T09 if delivered | Seed file unchanged. Hosted nurse-1 expiry was replaced by the test upload. Node 24 build was not run |

## Execution log

### 2026-10-15 — T00 planning

- Actual agent: primary Codex agent only; no delegation. User requested a plan; implementation is outside this session.
- Initial Git status: clean. Reviewed constitution 1.2.0, README/templates, parent contracts/tasks, 004 API specification/plan and recorded expiry decisions, 005 UI spec/plan/tasks, shared repository rules, current auth/data/schema/claim/UI files, migrations and installed dependencies. Reviewed bundled Next route-handler multipart guidance; consulted Supabase skill/least-privilege/RLS references and Hallmark for future UI boundaries. Checked official Supabase Storage sources linked in the plan.
- Findings: `claim_shift` already rejects missing/expired credentials using inclusive America/Bogota expiry; documents are not stored. All mapped roles can read the existing marketplace by design. Admin UI currently shows a scope message. No audit/timesheet persistence exists in the inspected migrations. Jest/RTL and Supabase SDK are installed; Playwright is not declared. Existing evidence records pending Node 24/browser/race verification. Hosted bucket configuration and current database state were not inspected.
- Planned decisions: P0 credentials/admin first; P1 audit remains a requested secondary deliverable; P2 is an optional scheduled-hours preview. Proposed defaults are one active PDF/JPEG/PNG up to 2 MiB, private storage, automatic structural/date validation, no manual approval and legacy fixture eligibility preserved. These are documented assumptions, not user confirmations.
- Changed files: this feature's spec/plan/tasks, `specs/README.md` and `specs/001-shiftpatch/tasks.md`.
- Checks: inline read-only documentation validation passed for five documents, 20 local links, AC01–AC21 coverage, all six exact test IDs, absence of feature placeholders and trailing whitespace. `git diff --check` passed; reviewed the new feature content and tracked cross-reference diff. Only the five intended documentation files are changed/new. Application tests/typecheck/lint/build, browser flows and hosted database/storage checks were not run for documentation-only scope; they remain pending. No documentation verification failures. Next.js feedback review found no qualifying issue in this planning session.
- Evidence: native conversation contains prompts/tool outputs. Complete private post-turn native export remains pending; this summary is not a transcript. No shared transcript copy/redactions, dependency installation, code/SQL implementation, commit or publication.

### 2026-10-15 — T01–T09 implementation

- Actual agent: primary Cursor Grok agent only; no delegation. User asked to implement the feature. Q01–Q05 were adopted as already written in the spec. Q06 was not resolved.
- Node: v22.20.0. The package engine asks for Node 24, so `npm run build` was not treated as the Node 24 check and was not run.
- Hosted database: direct connection to the database host over IPv6 failed with no route. The IPv4 retry was skipped before it ran. Migrations `008_credentials.sql` and `009_audit.sql` were not applied. No fixture rows were changed.
- Application: nurse credential form and multipart API, private-bucket migration, admin dashboard, audit log and scheduled-hours preview. Admin stays read-only. Legacy credential rows stay date-eligible without a document until replaced.
- Browser on the local dev server: nurse Maria Lopez saw the credential inputs and the three marketplace shifts. `GET /api/credentials` returned 500. Admin Alex Kim saw both agencies, badges `open`/`filled`/`open`, metrics Open 2 and Filled 1, the scheduled-hours label, and shift-2 as 12h. `GET /api/admin/dashboard` returned 200. `GET /api/admin/audit` returned 500. No credential file was uploaded.
- Checks that passed: `npx jest --no-watchman --selectProjects unit` (26 tests), `npx jest --no-watchman --selectProjects ui` (12 tests), `npm run typecheck`, `npm run lint`.
- Checks not run or not passed: hosted Storage/RLS/RPC, real upload and reload, claim concurrency, audit commit/rollback, Node 24 build, full integration suite. Those remain pending. No commit or publication.
- Evidence: this session's native transcript includes the tool output. A complete private post-turn export is still pending. This log is not a transcript.

### 2026-10-15 — close 006

- Actual agent: primary Cursor Grok agent only; no delegation. The user applied migrations 008 and 009 in the Supabase SQL editor, then exercised the hosted app. This entry records that verification. It does not replace the earlier implementation log.
- Credential: a past expiration was saved and shown as expired. A later date was saved and shown as eligible through 2026-10-31, with the uploaded document name. That replaced the hosted nurse-1 fixture date 2027-01-01. The seed file was not edited.
- Access: the user confirmed another nurse does not see that document and an admin credential request returns 403. A follow-up query found `storage.buckets.public = false` for `credentials`. The public object URL returned HTTP 400 and `NoSuchBucket`; the body was not a document.
- Claims: the user reported the expired-credential rejection and the single-winner race as correct. Those runs were not repeated here.
- Audit: the admin table showed, newest first, `cancel` by `agency-a` with reason `advance` and previous nurse `nurse-1`, `claim` by `nurse-1`, and `create` by `agency-a`, all for one disposable shift. Nurse cancellation stays off the nurse screen, as specified in 005. A `no-show` audit row and a direct audit-table grant check were not captured.
- Admin overview and scheduled preview remain the earlier browser result: both agencies, badges `open`/`filled`/`open`, Open 2 and Filled 1, the scheduled-hours label, and a 12h filled assignment.
- Automated checks from the implementation session still stand: unit 26, UI 12, `npm run typecheck`, `npm run lint`, on Node v22.20.0. `npm run build` on Node 24 and the hosted mutation suite were not run. No commit or publication.
- Evidence: the user's screenshots and this session's native transcript. A complete private post-turn export is still pending. This log is not a transcript.
