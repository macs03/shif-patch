# Code Consistency Audit — Tasks and Evidence

Specification: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Date: 2026-10-19

Status: Implemented within authorized local scope. T00–T08 are complete. Hosted RLS, native Escape and 320/414/768 viewport checks remain unverified; the later build environment failure remains recorded. This closes local audit/correction delivery, not deployed or browser verification.

## Tasks

| ID | Requirements / criteria | Work | Dependencies | Status | Completion checks |
| --- | --- | --- | --- | --- | --- |
| T00 | Planning delivery | Create audit spec/plan/tasks and index entry | None | Completed | Review scope, criteria, links, placeholders and whitespace |
| T01 | R01 / AC01 | Refresh Git baseline, file inventory, feature contracts and skill provenance | T00 | Completed | Record exact scope and preserve user changes |
| T02 | R03 / AC03 | Review server/client trust boundaries, domain contracts and SQL | T01 | Completed | Trace all protected flows; distinguish static/deployed evidence |
| T07 | R05 / AC06–AC08 | Audit API contract security and data exposure; record per-operation security matrix | T02 | Completed | Compare actual inputs/responses and permissions; map negative cases to evidence; record gaps and smallest corrections |
| T03 | R02–R03 / AC02–AC03 | Review React/Next.js consistency and Ponytail simplifications | T01 | Completed | Compare siblings and callers; justify each proposed change |
| T04 | R02–R03 / AC02–AC03 | Review UI consistency, keyboard/accessibility and responsive states | T03 | Completed | Hallmark audit with locked design; actual browser coverage or limits |
| T05 | R04 / AC04–AC05 | Review tests/CI/docs; run available planned quality checks | T02–T04, T07 | Completed | Actual commands/results, failures/skips and evidence limits |
| T06 | R01–R06 / AC01–AC10 | Consolidate findings; apply necessity/compatibility gate to proposals | T01–T05, T07 | Completed | Every area has a disposition; F01 has necessity evidence, callers, invariants and before/after results |
| T08 | R06 / AC10–AC11 | Close credential/admin stale-response regression gaps; invalidate old credential reads after successful save | T06 | Completed | Credential baseline reproduced; 43 unit/UI tests, typecheck and lint passed; diff reviewed. Additional build check blocked by environment, including escalated retry |

## Coverage

| Criterion | Tasks | Current evidence |
| --- | --- | --- |
| AC01 | T01, T06 | HEAD `632f77f`; working tree was the audit docs only. Node 24.22.0 used for checks |
| AC02 | T03, T04, T06 | F01: overlapping reads did not follow the existing epoch rule. Other siblings left unchanged |
| AC03 | T02–T04, T06 | Static trace of login, roles, claim, cancel, credentials and admin. Deployed RLS not probed |
| AC04 | T05, T06 | F01 below. No additional confirmed defects |
| AC05 | T05, T06 | Local quality checks passed. Hosted integration, native Escape and 320/414/768 viewports unverified |
| AC06 | T07, T06 | Matrix below. HTTP responses match the Zod contracts reviewed |
| AC07 | T07, T05, T06 | Negative auth, role, body and upload cases are implemented and covered by unit tests. Deployed enforcement unverified |
| AC08 | T07, T06 | No contract-breaking security defect. Abuse limits and deployed transport settings are gaps, not code changes |
| AC09 | T06 | F01 only. Duplicated handlers and missing arrow-key tabs do not justify edits |
| AC10 | T05, T06 | F01 baseline failed, then unit/UI, typecheck, lint and build passed |
| AC11 | T08 | Late credential success/401 and overlapping admin refreshes covered; 43 local tests passed |

## API security matrix

Static review of handlers, Zod schemas and migrations. Unit tests in `__tests__/unit/api-routes.test.ts` and `__tests__/unit/credentials-admin.test.ts` cover the negative cases named below. This matrix is not a deployed-RLS certificate.

| Method / path | Roles and ownership | Inputs | Success fields | Errors | Disposition |
| --- | --- | --- | --- | --- | --- |
| POST /api/auth/login | Public | Strict `{email,password}` | `{token,user:{id,name,role}}` | 401 generic; 403 unmapped; 503 | Matches 004. Token is the contracted access JWT. No refresh cookie |
| GET /api/shifts | Any mapped role | Bearer | `{shifts:Shift[]}` | 401/403/500/503 | Cross-agency read is contracted |
| POST /api/shifts | Agency; agency id from the token mapping | Strict create body | 201 Shift, `claimedBy:null` | 403 other roles; 400 invalid | Spoofed agency fields are not in the schema |
| POST /api/shifts/:id/claim | Nurse | Empty strict body; id pattern | Shift | 403 role or expired credential; 404; 409 | DB locks the row and checks the credential |
| POST /api/shifts/:id/cancel | Claiming nurse or owning agency | Strict reason | Shift plus cancellation | 403 admin and other owners; 409 open | Both reasons kept |
| GET /api/agencies/:agencyId/shifts | Owning agency only | Path id must equal `caller.agencyId` | `{agencyId,shifts}` | 403 otherwise | Handler checks before the query |
| GET/POST /api/credentials | Nurse only | Multipart document plus `expiresOn`; size and signature checks | Metadata and status. No object path | 403, 400, 413, 415 | `present()` drops `object_path` |
| GET /api/admin/dashboard | Admin | Bearer | Shifts and open/filled metrics | 403 | Same shift contract, no extra columns |
| GET /api/admin/audit | Admin | Bearer | At most 50 audit events | 403 | Table grants revoked; RPC checks admin |

Shared controls: Bearer parsed inside each protected handler; `Cache-Control: no-store`; unexpected JSON fields rejected by `.strict()`; data errors mapped to fixed messages; `password_hash` is not in the authenticated column grant. No application login rate limit. CORS is same-origin by default. HTTPS is required for the Supabase URL helper. Deployed bucket, RLS and platform limits were not executed.

## Finding register

### F01 — stale overlapping read

- Category: reliability. Priority: P2.
- Location: `app/components/ShiftPatchApp.tsx`, `load`, `loadCredential`, `loadAdmin`.
- Guideline: AC02. Sign-out already ignores a late response through `epoch`. Refresh did not.
- Trigger: two shift loads overlap and the older one settles last. The refresh control stays enabled after the first list is ready, so a second refresh can start immediately.
- Consequence: the board can replace the newer list with the older payload.
- Evidence: before the change, `__tests__/ui/shift-patch-app.test.tsx` rendered "Stale Agency" after the slow response resolved.
- Correction: each read channel keeps a ticket and ignores a result that is no longer current. Same routes, bodies, statuses and business outcomes.
- Callers: initial effect, refresh, and the reload after publish, claim, cancel and an uncertain result. Credential and admin use the same guard so those siblings do not keep the bug.
- Validation: the new UI test failed before the guard and passed after it. Full unit and UI suites passed.

Disposition: necessary compatible refactor, applied.

### F02 — initial credential read overwrites a saved upload

- Category: reliability. Priority: P2. Requirements: R06 / AC10–AC11; preserves 006 credential status behavior.
- Location: `app/components/ShiftPatchApp.tsx`, `onCredential` and `loadCredential`.
- Trigger: the initial credential GET remains pending while the nurse saves a document; that GET settles after the successful POST.
- Consequence: a successful old GET replaces the saved expired status with the previous valid status; an old 401 instead clears the current session despite the successful save. Server claim validation stays authoritative, but the UI becomes misleading.
- Necessity/evidence: new deferred-response cases reproduced both failures before the correction. Leaving the code unchanged preserves a demonstrated race, not merely inconsistent formatting.
- Correction: increment the existing credential read counter after a successful save and the session-epoch check, before applying the new view. Failed uploads do not invalidate the initial GET. No additional helper, state or request needed.
- Callers: initial nurse effect invokes `loadCredential`; the existing credential form invokes `onCredential`. Admin refresh retains its existing guard and now has explicit dashboard/audit regression coverage.
- Compatibility: no API, validation, permission, expiry, persistence or fixture changes. Existing upload error handling and session checks retained.
- Validation: two new credential timing cases failed before the one-line correction; all 43 unit/UI tests passed afterwards, including the original upload case and newest-admin-snapshot check.

Disposition: necessary compatible correction, applied in T08. Deployment/security checks remain outside this result.

### Reviewed and left unchanged

- Repeated 405 handlers. Shorter code alone is not a defect.
- Admin and nurse tabs are real buttons. Arrow-key roving tabindex is not required for them to be operable.
- `read_credential` can return `object_path` to the signed-in nurse through RPC. The HTTP response does not. That path is the nurse's own object, already allowed by storage policy.
- Skill lock files differ: repository `skills-lock.json` lists frontend-design, next-best-practices and ponytail; `.agents/skills-lock.json` lists hallmark, supabase-postgres-best-practices and a ponytail record. Copies exist at `.agents/skills/ponytail` and `.claude/skills/ponytail`. Not rewritten.
- Hallmark: `design.md` governs the UI. Pages have no Hallmark stamp. Adding one would not change behavior.

### Questions

- Q01. The Next.js dev overlay reported a hydration warning at the login branch while the existing dev server was open. Login, tabs, filters, credential view and the post-shift dialog still worked. The mismatch text was not isolated, so no code change is proposed.
- Q02. Synthetic Escape did not dismiss the open modal. The element was a true modal dialog (`:modal`), and the Close button returned focus to Post shift. A hardware Escape press was not observed.

## Execution log

### 2026-10-19 — Implementation status reconciliation

- User requested implementation closure across audits 008–010. Primary Codex agent only; no delegation. Initial tree clean at `1294363`. Reviewed current specifications, plans, task states and recorded checks; aligned current status summaries without rewriting historical results or closing unexecuted checks.
- Documentation-only change: no new runtime checks, hosted requests, database writes, commit or publication. Prior test/build results remain historical. Private complete native transcript export remains pending. No new Next.js feedback candidate.

### 2026-10-19 — T00 planning

- Actual agent: primary Codex agent only; no delegation.
- Reviewed constitution 1.2.0, specs README/templates, 005 spec/plan/tasks, 007 spec/plan/tasks, shared Ponytail/security rules, local skill guidance, package.json, design.md, CI workflow, Git history/status and file inventory. These were planning reads, not a full application or SQL audit.
- Baseline: HEAD `7a51670`; existing user changes in `skills-lock.json`, `.agents/skills/ponytail/` and `.claude/skills/ponytail`. No uncommitted application changes found. Preserved these changes.
- Scope decision: whole current first-party codebase with priority on recent application commits; no invented comparison branch. Planning documents in English; conversation in Spanish.
- Runtime observation: `node --version` returned `v22.20.0`; supported Node 24 availability not checked. No application checks, build, browser or hosted checks executed for documentation-only planning.
- Inspection limitation: a batched inventory command returned exit 2 because some candidate directories do not exist; existing paths were listed. Oversized combined reads were truncated; relevant 005/007 planning documents and package/design/CI files were read in smaller follow-ups. No verification pass is inferred from inventory output.
- Documentation checks: the first inline check failed because it required every criterion label literally in the plan, which groups work by task. Corrected the check to validate criterion coverage in spec/tasks and task coverage in the plan: passed for three documents and five local links, with no placeholders or trailing whitespace. `git diff --check` passed; reviewed the index diff and new document contents.
- Concurrent repository change: final HEAD was `01cd461`, containing the Ponytail installation that was initially uncommitted. This agent did not create that commit or modify those files. The plan retains its observed initial baseline and requires refreshing it at T01.
- Next.js feedback reporting pass: no qualifying Next.js issue observed during planning; no feedback command required. T00 complete; T01–T06 remain pending.
- Evidence: native conversation contains prompts/tool calls/results. Complete private post-turn export remains pending; this log is a summary, not a transcript. No shared transcript or redactions produced. No commit/publication.

### 2026-10-19 — Explicit API security planning

- Actual agent: primary Codex agent only; no delegation. User requested a dedicated security step for API contracts and data exposure.
- Updated spec first with R05/AC06–AC08, then plan and tasks with T07, a per-operation security matrix, response-field review, negative authorization/input cases and transport/token/cache/abuse-control assessment. Preserved contract fields and the planning-only scope; no application or database edits.
- Documentation verification passed: three documents, five local links, AC01–AC08 and T07 traced, no placeholders or trailing whitespace; `git diff --check` passed. Reviewed the additions and task dependencies. No application tests or security probes executed; T07 and the audit remain pending.
- Next.js feedback reporting pass: no qualifying issue observed; no feedback command required. Complete private native export remains pending; no shared transcript/redactions, commit or publication.

### 2026-10-19 — Compatibility and necessary refactors only

- Actual agent: primary Codex agent only; no delegation. User clarified that any later changes must be strictly necessary refactors, without breaking changes or altered business logic.
- Updated spec first with R06/AC09–AC10, then plan/tasks: necessity gate, affected callers and preserved contracts/business invariants, baseline/post-change regression evidence, and separate authorization for incompatible remediation. No implementation authorized or performed; no-change is a valid audit outcome.
- Documentation checks passed: three documents, five local links, AC01–AC10 mapped, no placeholders/trailing whitespace; `git diff --check` passed. Reviewed compatibility wording against existing security scope and task dependencies. Application/regression checks not run for documentation-only changes; no guarantee of defect-free behavior claimed.
- Next.js feedback reporting pass: no qualifying issue observed; no feedback command required. Complete private native export remains pending; no shared transcript/redactions, commit or publication.

### 2026-10-19 — Audit execution and F01

- Actual agent: primary Cursor agent only; no delegation. User asked to implement the prepared audit. Preserved behavior except F01.
- Baseline: HEAD `632f77f`. Working tree before this session's edits was `specs/README.md` and untracked `specs/008-consistency-audit/`. Default `node --version` was v22.20.0. Checks used `~/.nvm/versions/node/v24.22.0` (v24.22.0).
- Reviewed features 001–007 contracts against `app/api/**/route.ts`, `lib/server`, `lib/domain`, `lib/client/api.ts`, migrations 001–009, UI components, Jest tests, CI and `design.md`. SQL review is static. No hosted integration, mutation or RLS probe.
- F01 baseline: `npm test -- --selectProjects ui --runInBand -t "keeps the newer shift list"` failed because the late payload rendered "Stale Agency". After the ticket guard, the same test passed.
- Node 24.22.0: `npm run typecheck` exit 0; `npm run lint` exit 0; `npm test -- --selectProjects unit --selectProjects ui --runInBand` exit 0, 6 suites, 40 tests, 0 skipped. `npm run build` exit 0 (Next.js 16.4.1). Build loaded `.env.local` and warned that a `yarn.lock` outside the repo was ignored. No secret values copied.
- Browser on the already running `http://localhost:3000` dev server: nurse login, credential tab, sign-out cleared the password, agency list and post-shift modal, Close returned focus to Post shift, admin Operations/Audit/Scheduled hours and the Open metric filter. No claim, cancel, publish or credential upload. `127.0.0.1` did not hydrate because Next blocked the dev resource; localhost did. Login card remained usable at a 375px emulation. 320, 414 and 768 were not captured. Synthetic Escape did not close the modal.
- Next.js feedback candidates: sandbox `uv_interface_addresses` failure while starting `next dev`, and the 127.0.0.1 dev-origin block. Reporting pass follows this log.
- Evidence: this log is a summary. Private native export remains pending. No commit or publication.

### 2026-10-19 — T08 credential consistency and sibling regression coverage

- Actual agent: primary Codex agent only; no delegation. User authorized the next improvement phase while retaining compatibility and strict necessity constraints.
- Preserved existing F01 changes; extended spec/plan/tasks before implementation. Reviewed credential effect/read/upload callers, session guards, admin refresh/state, response schemas, existing tests, feature 006 contracts/plan/tasks, Ponytail, Vercel React guidance and bundled Next.js Jest documentation. No dependency or tool installation.
- F02 baseline command on Node 24.22.0: `npm test -- --selectProjects ui --runInBand -t 'initial credential read|newest admin dashboard'` exited 1: 2 failed (late credential success and late 401), 2 passed, 13 intentionally unselected. This proves an additional race beyond F01. The successful upload case now invalidates the earlier GET with one counter increment.
- After correction: `npm test -- --selectProjects unit --selectProjects ui --runInBand` exited 0, 6 suites/43 tests passed, zero skipped. `npm run typecheck` and `npm run lint` exited 0 under the installed Node 24.22.0. Existing upload test was parameterized rather than duplicated; admin snapshot test exercises the existing F01 guard without production changes there.
- Additional `npm run build` failed (exit 1) while processing CSS because Turbopack's helper could not bind a local port: Operation not permitted. Retried with `require_escalated`; same error and exit 1. Do not interpret this as a successful production build or change configuration to bypass it. The external lockfile warning also appeared. No new browser, hosted/RLS or mutation verification performed.
- Reviewed diff and documentation links/placeholders/whitespace/AC11 coverage; `git diff --check` passed. No API, business rule, permission, database, fixture or visual changes. The only production line authored here invalidates stale credential reads after a successful save.
- Concurrent repository event: another process committed the earlier audit and follow-up planning during this turn, moving HEAD from `632f77f` to `2406c20`. This agent did not commit or publish; final edits were reviewed against the refreshed HEAD.
- Next.js feedback: retained the repeated build/port-permission panic as an anonymized candidate. Feedback-instructions command first failed for missing network, then succeeded with escalated network access; a review-form draft is prepared in the final reporting pass, never submitted automatically.
- Evidence: native conversation contains original prompts, tool outputs and failures; complete private post-turn export pending. This summary does not replace the transcript. No shared transcript or redactions produced.
