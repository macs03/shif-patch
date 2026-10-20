# Continuous Integration and Browser Verification — Specification

Feature ID: 007-ci-e2e · Date: 2026-10-15 · Status: Quality CI only. Real-backend verification withdrawn

Source: user request to plan CI, automated verification and closure of 005 browser E2E/documentation gaps. Constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0. Dependencies: [005](../005-core-user-experience/spec.md), [004](../004-auth-rbac-api/spec.md) and [006](../006-credentials-admin/spec.md).

## Problem and expected outcome

The MVP has local Jest checks and recorded hosted checks but no repository CI workflow for the checks that do not need a backend. The delivery is a reproducible quality pipeline. It does not add a paid or separate Supabase project.

## Scope

- Included: the GitHub Actions quality workflow, Node 24, npm ci, lint, typecheck, the existing unit and UI Jest suites, a production build without Supabase credentials, read-only permissions and truthful status.
- Excluded: a separate or paid Supabase project, hosted integration, Playwright runs, race accounts, GitHub database secrets, Vercel, hosting, preview deployments, production deployment, CD, new business features, broad browser matrices, performance/load testing and coverage-percentage targets.
- The original planning session delivered documents only. The quality workflow now exists, with recorded local checks and unobserved GitHub execution in tasks.md. Hosted/browser E2E remains withdrawn; no new dependency or external account is part of this scope.

## Requirements and acceptance criteria

| Requirement | Required behavior | Criteria |
| --- | --- | --- |
| R01 | Reproducible quality pipeline without backend secrets | AC01–AC02 |
| R05 | Quality workflow permissions stay read-only | AC10 |
| R06 | Current documentation and honest delivery status | AC12–AC13 |

R02–R04, AC03–AC09, AC11 and the hosted half of AC13 were withdrawn on 2026-10-15. They required a separate Supabase project. The user excluded that verification because it can cost money. This feature does not close 005/T07.

| Criterion | Given / when | Observable result |
| --- | --- | --- |
| AC01 | Pull request, push to main, or manual quality run | Node 24 and npm ci; lint, typecheck, all unit/UI suites and production build pass; no Supabase credentials required |
| AC02 | A required quality command fails | Workflow fails and identifies the failing check; no continue-on-error or empty-test success |
| AC03 | Trusted main push or manual hosted verification | Required backend/data settings validated before tests; missing configuration, skipped required hosted tests or an empty suite fails the job |
| AC04 | Hosted integration executes | Five fixture logins, generic login errors, bearer rejection, full shift contracts, own-agency isolation, role denials, expiry rejection, create/claim/both cancellations and concurrency pass against real Supabase |
| AC05 | Chromium runs against next start after a Node 24 production build | Browser login/error/sign-out/reload, both-agency nurse discovery, own-agency views, create, claim, expired rejection and both cancellation reasons pass through real HTTP/backend without mocking business responses |
| AC06 | Two separately authenticated eligible nurses race on one disposable open shift | Exactly one 200 and one 409; both views reconcile to the same winner; expired fixture nurse is not made eligible |
| AC07 | Regression smoke covers delivered 006 UI | Admin read-only table/counts, non-admin administrative denial and nurse credential form/own metadata render through real application requests; upload/security persistence remains subject to its separate recorded limits |
| AC08 | Suite sets up, runs and tears down, then runs again | Baseline shift rows, users and credential metadata remain unchanged; generated rows/accounts/objects are identified and cleaned within the isolated test backend; cleanup failure fails the run |
| AC09 | Hosted runs overlap or a run is interrupted | Shared backend runs serialize without cancelling an active mutation run; next preflight detects stale test data and requires cleanup before proceeding; no broad reseed, table wipe or silent fixture restoration |
| AC10 | Pull request, including from an untrusted fork | Quality runs without backend secrets. Permissions are contents:read. No hosted job exists |
| AC12 | Existing feature documentation is reconciled | Current summaries match code and dated evidence; historical logs retained; the withdrawn backend verification is not described as pending delivery |
| AC13 | Feature closure is proposed | The quality workflow is the CI delivery. Hosted backend success, 005/T07 and 005/T08 are not required here. Vercel remains excluded |

## Contracts and data

Preserve the six APIs, all 15 required test IDs, public IDs/emails/names, full Shift fields, local dates/hours, open/claimedBy:null and inclusive America/Bogota expiry. No product endpoint or permission change is planned. Baseline nurse-2 remains expired. No additional test accounts are created.

## Questions and assumptions

| ID | Decision or prerequisite | Resolution |
| --- | --- | --- |
| Q01 | CI provider | Git remote is GitHub; plan GitHub Actions |
| Q02 | Browser dependency | Withdrawn with the browser suite. `@playwright/test` is not a project dependency |
| Q03 | Hosted backend and access | Withdrawn. A separate Supabase project is out of scope because it can cost money |
| Q04 | Backend mutation isolation | Withdrawn with Q03. CI does not create race accounts or disposable shifts |
| Q05 | Hosting | Explicitly excluded by the user until a later Vercel phase |

## Delivery condition

AC01, AC02, AC10, AC12 and AC13 are the remaining delivery. A written workflow is not a successful GitHub run. Withdrawn criteria are not pending work. No commit, push or external setting change is required to record this scope change.

## Change history

| Date | Change | Source |
| --- | --- | --- |
| 2026-10-15 | Initial plan; Vercel excluded | User request and repository review |
| 2026-10-15 | Quality and hosted workflows, strict integration gate and Playwright suite added. Hosted runs, GitHub execution and 005/T07 remain pending | User request to implement this spec |
| 2026-10-15 | Real-backend verification withdrawn, including the separate Supabase project, hosted tests and browser E2E. Quality CI remains | User excluded it because it can cost money |
