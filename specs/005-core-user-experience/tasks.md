# Core User Experience — Tasks and Evidence

Specification: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Date: 2026-10-15

## Tasks

| ID | Requirements / criteria | Work and files | Dependencies | Status | Completion checks |
| --- | --- | --- | --- | --- | --- |
| T00 | Planning delivery / R07 | Spec, plan, tasks; index and parent task reference | None | Completed | Five documents reviewed; 20 local links valid; AC01–AC20 covered; nine IDs preserved; no new placeholders or whitespace errors |
| T01 | R01–R05,R07 / AC01, AC06–AC15, AC19–AC20 | Verify current 004 API readiness, test identity mapping, dedicated-backend access and isolated E2E data/cleanup approach | T00 | Pending | Actual smoke/contract results; backend gaps and two-eligible-nurse setup recorded; no fixture drift |
| T02 | R01,R06 / AC01–AC03, AC16, AC18 | Home/login/session shell, shared feedback, focused RTL tests | T01 for live integration | Pending | Both roles route correctly; login errors, sign-out/reload/401 and stale requests verified; exact login IDs |
| T03 | R02–R03,R06 / AC04–AC09, AC16, AC18 | Nurse cards/list, claim, authoritative reconciliation; RTL cases | T02 | Pending | Both agencies, full details/claimant, expiry/conflict/failure/pending behavior; required card/action IDs |
| T04 | R04,R06 / AC10–AC12, AC16, AC18 | Own dashboard and inline create form; RTL cases | T02 | Pending | Agency-a/b isolation; role/date/time validation, overnight support, own open/null result and create IDs |
| T05 | R05,R06 / AC13–AC16, AC18 | Filled-card cancellation and reason selector; RTL cases | T04 | Pending | Both reasons reopen/clear; foreign denial/conflict/error; exact cancel ID |
| T06 | R06 / AC17–AC18 | Hallmark-guided visual/interaction review; metadata/styles/components | T03–T05 | Pending | Keyboard, labels, live feedback, focus, reduced motion and required viewport review; no missing IDs |
| T07 | R07 / AC19 | Approved Playwright configuration, browser E2E and isolated two-nurse race | T01, T03–T05; explicit dependency approval before install | Pending | Real HTTP/backend critical flows; one eligible race winner; cleanup/fixture preservation recorded |
| T08 | R07 / AC20 | Relevant Jest suites, E2E, typecheck/lint, Node 24 build; diff/security review and evidence log | T06, T07 | Pending | Actual outcomes and limitations recorded; no secret artifacts; complete only after delivery checks |

## Coverage

| Criterion | Responsible tasks | Current evidence |
| --- | --- | --- |
| AC01–AC03 | T01, T02, T07 | Planned; UI not implemented |
| AC04–AC05 | T03, T07 | Planned |
| AC06–AC09 | T01, T03, T07 | API history in 004; new UI and two-identity browser proof pending |
| AC10–AC12 | T01, T04, T07 | Planned |
| AC13–AC15 | T01, T05, T07 | Planned |
| AC16 | T02–T05 | Planned |
| AC17 | T06 | Planned |
| AC18 | T02–T06 | All nine IDs specified; DOM checks pending |
| AC19 | T01, T07 | Browser runner and suitable race identities need setup |
| AC20 | T08 | Application verification pending implementation |

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
