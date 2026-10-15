# Continuous Integration and Browser Verification — Tasks and Evidence

Specification: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Date: 2026-10-15

## Tasks

| ID | Requirements / criteria | Work and files | Dependencies | Status | Completion checks |
| --- | --- | --- | --- | --- | --- |
| T00 | R06 / AC12 planning increment | New spec/plan/tasks; current README/index and 001/004/005 status corrections | None | Completed | Documentation diff, links and criterion coverage verified; no implementation claims |
| T01 | R01 / AC01–AC02 | Node 24 quality workflow, existing commands and production build | T00 | Pending | All quality commands pass without backend settings; induced failure fails workflow |
| T02 | R04–R05 / AC08–AC10 | Dedicated CI backend, Auth mappings, two eligible race accounts, project guard and cleanup design | T00; Q03–Q04 | Pending | Direct hosted readiness, baseline snapshot, connectivity and bounded cleanup verified |
| T03 | R02,R04 / AC03–AC04, AC08 | Strict integration configuration/test changes | T01, T02 | Pending | Missing settings/skipped required tests fail; full hosted suite passes with fixture preservation |
| T04 | R03–R05 / AC05–AC09, AC11 | Approved Playwright dependency/config, real browser workflows/race, sanitized results and cleanup fixtures | T01–T03; Q02 | Pending | Chromium production-server suite passes twice; two distinct eligible nurses; failure/cleanup/recovery checks pass; closes 005/T07 only with evidence |
| T05 | R01–R02,R04–R05 / AC01–AC04, AC09–AC11 | Trusted hosted workflow, GitHub secret/check configuration and real run review | T01–T04; external access and authorized push | Pending | Actual GitHub runs, exact commits, no skipped required tests, serialization and safe missing-secret failure |
| T06 | R06 / AC12–AC13 | Final status reconciliation, README, 004/005/006 verification limits and actual evidence | T01–T05 | Pending | 005/T08 checks satisfied; delivery status matches real results; Vercel excluded |

## Coverage

| Criterion | Tasks | Current evidence |
| --- | --- | --- |
| AC01 | T01, T05 | No workflows exist; Node 24 quality run pending |
| AC02 | T01, T05 | Required-command failure propagation not verified |
| AC03 | T03, T05 | Strict configuration/skip behavior absent |
| AC04 | T03, T05 | Historical 004 hosted result: 3 suites / 4 tests; no new backend run |
| AC05 | T04 | Browser runner absent; 005/T07 remains pending |
| AC06 | T04 | Distinct-eligible-nurse browser race pending |
| AC07 | T04 | 006 manual evidence exists; automated browser regression smoke pending |
| AC08 | T02–T04 | Existing integration cleanup deletes disposable shifts; full audit cleanup not verified |
| AC09 | T02, T04, T05 | Serialization/interruption recovery not implemented |
| AC10 | T02, T05 | Trusted workflow and secret settings not implemented |
| AC11 | T04, T05 | No GitHub execution/artifact review |
| AC12 | T00, T06 | Current summaries reconciled; historical logs preserved |
| AC13 | T06 | Pending; planning completion cannot close delivery |

## Execution log

### 2026-10-15 — T00 planning and current-status reconciliation

- Actual agent: primary Codex agent only; no delegation. Initial Git status clean.
- Scope: CI/E2E implementation plan and documentation updates; user excludes Vercel/deployment. No dependency installation, SQL/application/workflow implementation or external settings changes.
- Read constitution 1.2.0, specs index/templates, 001 and 005 spec/plan/tasks, 004/006 evidence, package/Jest/integration files, fixture setup, repository rules and bundled Next.js Playwright guide. Git remote confirms GitHub and current branch main. Consulted official GitHub/Playwright documentation linked in plan.
- Findings: hosted tests currently skip without settings; mutation race uses the same nurse twice; cleanup uses psql; baseline nurse-2 must remain expired. Existing demo nurse-1 credential drift is recorded in 006 and must not be silently reset. Separate CI project and two extra eligible accounts are prerequisites, not provisioned resources.
- Baseline checks from the immediately preceding review in this native conversation: unit/UI 6 suites, 38 tests passed; typecheck and lint passed on Node 22.20.0. These are historical to this documentation increment, not Node 24, backend or E2E execution.
- Documentation validation: first inline check failed because it matched criterion IDs literally and did not expand the AC05–AC07 coverage range; coverage now lists each criterion explicitly. Rerun passed for 11 authored documentation files, 40 local links, all 13 acceptance criteria in spec/coverage, no new placeholders and no trailing whitespace. git diff --check passed; reviewed current-status changes and new spec/plan/tasks. T00 completed for planning/status corrections only; T01–T06 remain pending. No application tests rerun for documentation-only scope. Next.js feedback reporting pass found no qualifying candidate in this request; the feedback command was not needed.
- Evidence: native conversation includes prompts/tool results. Complete private post-turn export remains pending; this summary is not a transcript. No shared transcript copies/redactions, secrets printed, commit or publication.
