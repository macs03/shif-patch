# Core User Experience — Tasks and Evidence

Specification: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Date: 2026-10-15

## Tasks

| ID | Requirements / criteria | Work and files | Dependencies | Status | Completion checks |
| --- | --- | --- | --- | --- | --- |
| T00 | Planning delivery / R07 | Spec, plan, tasks; index and parent task reference | None | Completed | Five documents reviewed; 20 local links valid; AC01–AC20 covered; nine IDs preserved; no new placeholders or whitespace errors |
| T01 | R01–R05,R07 / AC01, AC06–AC15, AC19–AC20 | Verify current 004 API readiness, test identity mapping, dedicated-backend access and isolated E2E data/cleanup approach | T00 | Completed | Actual smoke/contract results; backend gaps and two-eligible-nurse setup recorded; no fixture drift |
| T02 | R01,R06 / AC01–AC03, AC16, AC18 | Home/login/session shell, shared feedback, focused RTL tests | T01 for live integration | Completed | Both roles route correctly; login errors, sign-out/reload/401 and stale requests verified; exact login IDs |
| T03 | R02–R03,R06 / AC04–AC09, AC16, AC18 | Nurse cards/list, claim, authoritative reconciliation; RTL cases | T02 | Completed | Both agencies, full details/claimant, expiry/conflict/failure/pending behavior; required card/action IDs |
| T04 | R04,R06 / AC10–AC12, AC16, AC18 | Own dashboard and inline create form; RTL cases | T02 | Completed | Agency-a/b isolation; role/date/time validation, overnight support, own open/null result and create IDs |
| T05 | R05,R06 / AC13–AC16, AC18 | Filled-card cancellation and reason selector; RTL cases | T04 | Completed | Both reasons reopen/clear; foreign denial/conflict/error; exact cancel ID |
| T06 | R06 / AC17–AC18 | Hallmark-guided visual/interaction review; metadata/styles/components | T03–T05 | Completed | Keyboard, labels, live feedback, focus, reduced motion and required viewport review; no missing IDs |
| T07 | R07 / AC19 | Approved Playwright configuration, browser E2E and isolated two-nurse race | T01, T03–T05; explicit dependency approval before install | Pending | Real HTTP/backend critical flows; one eligible race winner; cleanup/fixture preservation recorded |
| T08 | R07 / AC20 | Relevant Jest suites, E2E, typecheck/lint, Node 24 build; diff/security review and evidence log | T06, T07 | Pending | Actual outcomes and limitations recorded; no secret artifacts; complete only after delivery checks |

## Coverage

| Criterion | Responsible tasks | Current evidence |
| --- | --- | --- |
| AC01–AC03 | T01, T02, T07 | RTL plus hosted login, invalid credentials, sign-out and reload. Playwright suite still pending |
| AC04–AC05 | T03, T07 | RTL and hosted nurse marketplace showed both agencies, fixture dates, open/filled and nurse-1 |
| AC06–AC09 | T01, T03, T07 | RTL covers claim, expiry, conflict, pending and uncertain results. Hosted mutations and the two-nurse race were not run |
| AC10–AC12 | T01, T04, T07 | RTL covers create validation. Hosted agency-a dashboard showed only its shifts and the create form; no shift was published |
| AC13–AC15 | T01, T05, T07 | RTL covers both cancellation reasons. Hosted filled card showed the reason control; no cancellation was submitted |
| AC16 | T02–T05 | RTL loading, empty, retry and stale-session cases passed |
| AC17 | T06 | Keyboard tab order, visible focus and no horizontal overflow at 320/375/414/768 and desktop |
| AC18 | T02–T06 | Nine test IDs asserted in RTL and present in the hosted UI |
| AC19 | T01, T07 | Playwright is not installed. Second baseline nurse remains expired, so the race is not ready |
| AC20 | T08 | Jest unit/UI, typecheck and lint passed. Build passed on Node 22.20.0. Node 24 and Playwright E2E are still pending |

## Execution log

### 2026-10-15 — T00 planning

- Actual agent: primary Codex agent only; no delegation.
- Scope: planning only for the user's core experience epic; project documents authored in English as required. Initial Git status clean.
- Reviewed constitution 1.2.0, README/templates, parent spec/plan/tasks, 004 spec/plan/tasks and actual route/auth/schema files, 003 harness evidence, package dependencies, starter UI, existing UI harness and repository rules. Read Hallmark guidance to establish future UI constraints; no design build/audit or skill utilities executed. Consulted bundled Next.js component-boundary and Playwright guides.
- Findings: UI remains starter; API code exists despite stale pending labels in 004. Historical hosted results remain attributed to 004; no backend checks rerun in this planning session. Playwright is not declared; second baseline nurse is expired, so a two-eligible-nurse race requires isolated setup.
- Decisions: one role-aware root route; memory-only access session; public nurse ID as assignment label; reuse all existing endpoints; no database change, extra modules or dependency installation in this session.
- Changed files: this feature's spec/plan/tasks, specs/README.md and parent tasks reference.
- Documentation checks: initial inline validation failed on README's intentional `{{...}}` template example; no mutation occurred. Restricted placeholder validation to new feature documents and reran successfully: five documents, 20 valid local links, AC01–AC20 defined and assigned, all nine exact IDs, no new placeholders or trailing whitespace. `git diff --check` passed for tracked changes; new files also received direct whitespace checks. Reviewed new document content and tracked cross-reference diff; no application/database changes.
- Status: T00 completed; T01–T08 pending. Next implementation step is API prerequisite and isolated test setup verification.
- Application tests, typecheck/lint/build and hosted/browser checks: not run for documentation-only scope; implementation T01–T08 pending.
- Evidence: native conversation includes prompts and tool outputs. Complete private post-turn export pending; this log is a summary, not a transcript. No shared transcript copy or redactions performed; no secrets/environment values printed. No commit/publication.

### 2026-10-15 — T01–T06 UI implementation

- Actual agent: primary Cursor Grok agent only; no delegation.
- Scope: login, in-memory session, nurse marketplace, agency dashboard, create form and cancellation UI on the existing API. Playwright was not installed.
- Files: `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `app/components/ShiftPatchApp.tsx`, `ShiftCard.tsx`, `CreateShiftForm.tsx`, `NotificationBanner.tsx`, `lib/client/api.ts`, `__tests__/ui/shift-patch-app.test.tsx`, and this feature's spec/plan/tasks plus `specs/README.md`.
- T01: hosted UI login as nurse, agency-a and admin succeeded against the dedicated backend. The nurse list showed shift-1, shift-2 and shift-3 across both agencies. Agency-a showed only its own open and filled shifts. No claim, create or cancel was submitted, so baseline rows were not mutated. `nurse-2` remains the expired fixture (`2026-06-01`); a second eligible nurse was not created. Race cleanup is therefore still blocked.
- Checks: `npx jest --no-watchman --selectProjects unit --selectProjects ui` — 5 suites, 29 tests passed, including 9 new UI tests. `npm run typecheck` and `npm run lint` passed. `npm run build` passed on Node v22.20.0 (Next.js 16.4.1). Node 24 is not installed here, so the required Node 24 build is not claimed.
- Browser: localhost dev server. Nurse marketplace, agency form and filled-card reason control rendered. Invalid login showed `Invalid email or password` and stayed on the sign-in screen. Reload cleared the in-memory session. Tab order reached the password and submit controls with a 2px focus outline. No horizontal overflow at 320, 375, 414, 768 or 1280. `localStorage`/`sessionStorage` stayed empty. The Next.js dev indicator overlaps a card in `next dev`; it is absent from the production build.
- Reduced motion is handled in CSS and was not emulated in the browser.
- T07 remains pending until Playwright installation is explicitly approved. T08 remains pending the Node 24 build and that E2E suite.
- Evidence: native conversation includes prompts and tool outputs. This log is a summary, not a transcript. No secrets or tokens were written into the repository. No commit.
