# Continuous Integration and Browser Verification — Tasks and Evidence

Specification: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Date: 2026-10-15

## Tasks

| ID | Requirements / criteria | Work and files | Dependencies | Status | Completion checks |
| --- | --- | --- | --- | --- | --- |
| T00 | R06 / AC12 planning increment | New spec/plan/tasks; current README/index and 001/004/005 status corrections | None | Completed | Documentation diff, links and criterion coverage verified; no implementation claims |
| T01 | R01 / AC01–AC02 | Node 24 quality workflow, existing commands and production build | T00 | Partial | Local Node 24 quality commands passed without backend settings. Workflow file exists. GitHub execution and an induced workflow failure are not yet observed |
| T02 | R04–R05 / AC08–AC10 | Dedicated CI backend, Auth mappings, two eligible race accounts, project guard and cleanup design | T00; Q03–Q04 | Out of scope | Withdrawn on 2026-10-15. No separate Supabase project |
| T03 | R02,R04 / AC03–AC04, AC08 | Strict integration configuration/test changes | T01, T02 | Out of scope | Withdrawn with the hosted backend. Local strict-mode code is not a CI job |
| T04 | R03–R05 / AC05–AC09, AC11 | Approved Playwright dependency/config, real browser workflows/race, sanitized results and cleanup fixtures | T01–T03; Q02 | Out of scope | Withdrawn. 005/T07 stays open and is not carried by this feature |
| T05 | R01–R02,R04–R05 / AC01–AC04, AC09–AC11 | Trusted hosted workflow, GitHub secret/check configuration and real run review | T01–T04; external access and authorized push | Out of scope | Hosted workflow removed. Quality workflow remains T01 |
| T06 | R06 / AC12–AC13 | Final status reconciliation, README, 004/005/006 verification limits and actual evidence | T01 | Partial | Scope withdrawal recorded. GitHub quality run still unobserved. Vercel and 005/T07 excluded |

## Coverage

| Criterion | Tasks | Current evidence |
| --- | --- | --- |
| AC01 | T01 | Local Node 24.22.0 quality commands passed, including a production build with empty backend variables. No GitHub run |
| AC02 | T01 | Quality steps have no continue-on-error. An induced GitHub failure has not been observed |
| AC03–AC09, AC11 | T02–T05 | Withdrawn. Not pending delivery |
| AC10 | T01 | Quality workflow permissions are contents:read and the job receives no backend secrets. The hosted workflow file was removed |
| AC12 | T00, T06 | Current summaries reconciled; backend verification recorded as withdrawn |
| AC13 | T06 | Quality CI is the delivery. 005/T07 and Vercel are outside this feature |

## Execution log

### 2026-10-15 — T00 planning and current-status reconciliation

- Actual agent: primary Codex agent only; no delegation. Initial Git status clean.
- Scope: CI/E2E implementation plan and documentation updates; user excludes Vercel/deployment. No dependency installation, SQL/application/workflow implementation or external settings changes.
- Read constitution 1.2.0, specs index/templates, 001 and 005 spec/plan/tasks, 004/006 evidence, package/Jest/integration files, fixture setup, repository rules and bundled Next.js Playwright guide. Git remote confirms GitHub and current branch main. Consulted official GitHub/Playwright documentation linked in plan.
- Findings: hosted tests currently skip without settings; mutation race uses the same nurse twice; cleanup uses psql; baseline nurse-2 must remain expired. Existing demo nurse-1 credential drift is recorded in 006 and must not be silently reset. Separate CI project and two extra eligible accounts are prerequisites, not provisioned resources.
- Baseline checks from the immediately preceding review in this native conversation: unit/UI 6 suites, 38 tests passed; typecheck and lint passed on Node 22.20.0. These are historical to this documentation increment, not Node 24, backend or E2E execution.
- Documentation validation: first inline check failed because it matched criterion IDs literally and did not expand the AC05–AC07 coverage range; coverage now lists each criterion explicitly. Rerun passed for 11 authored documentation files, 40 local links, all 13 acceptance criteria in spec/coverage, no new placeholders and no trailing whitespace. git diff --check passed; reviewed current-status changes and new spec/plan/tasks. T00 completed for planning/status corrections only; T01–T06 remain pending. No application tests rerun for documentation-only scope. Next.js feedback reporting pass found no qualifying candidate in this request; the feedback command was not needed.
- Evidence: native conversation includes prompts/tool results. Complete private post-turn export remains pending; this summary is not a transcript. No shared transcript copies/redactions, secrets printed, commit or publication.

### 2026-10-15 — T01 and T03–T04 implementation, hosted execution still blocked

- Actual agent: primary Cursor Grok agent only; no delegation.
- Scope: quality workflow, trusted hosted workflow, strict integration gate, audit-aware cleanup and Playwright Chromium tests. No commit, push, GitHub settings change or mutation of the existing demo project. Vercel remains excluded.
- Q02: the implementation request authorized `@playwright/test`. Installed 1.64.1 and locked it in package-lock.json. Chromium was not downloaded because the browser suite was not run.
- Q03–Q04 remain unresolved. The local env has the demo project URL and keys; it does not have `SHIFT_PATCH_CI_PROJECT_REF` or `SHIFT_PATCH_DB_HOST`. Strict mode stopped before Jest, so no hosted read or mutation ran.
- Node 24.22.0 was installed with nvm for this session. On that runtime: `npm run lint` passed; `npm run typecheck` passed; `npm test -- --selectProjects unit --selectProjects ui --runInBand` passed, 7 suites / 42 tests. `npm run build` passed with `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `DB_PASSWORD` set to empty strings (length 0), so the demo env file could not override them. Next.js still printed that `.env.local` exists. Google font fetch succeeded. A parent `yarn.lock` warning is environmental and was not changed.
- `npm run test:integration:ci` exited 1 with `Hosted verification requires SHIFT_PATCH_CI_PROJECT_REF, SHIFT_PATCH_DB_HOST` and did not start Jest. Unit tests cover missing settings, duplicate/expired race identities, skipped-report failure, baseline-id refusal, cleanup failure, baseline drift and stale preflight.
- T01–T04 are partial. T02 and T05 stay pending until a dedicated CI project, two eligible race accounts and an authorized push exist. 005/T07 and 005/T08 stay open. No GitHub run was observed, so an induced workflow failure is not claimed.
- Evidence: native conversation includes prompts and tool outputs. This log is a summary, not a transcript. No secrets, tokens or connection strings were written into the repository. No commit.

### 2026-10-15 — real-backend verification withdrawn

- Actual agent: primary Cursor Grok agent only; no delegation.
- The user excluded backend verification because a separate Supabase project can cost money. R02–R04 and the hosted criteria are withdrawn, not left pending. T02–T05 are out of scope. 005/T07 is not carried by this feature.
- Removed `.github/workflows/verify-hosted.yml`, the Playwright dependency, `e2e/`, the strict hosted runner and the integration-test changes that existed only for that verification. `.github/workflows/ci.yml` remains and does not receive backend secrets.
- No tests were rerun. No commit, push or Supabase change.
