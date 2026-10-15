# Continuous Integration and Browser Verification — Specification

Feature ID: 007-ci-e2e · Date: 2026-10-15 · Status: Planned; implementation not started

Source: user request to plan CI, automated verification and closure of 005 browser E2E/documentation gaps. Constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0. Dependencies: [005](../005-core-user-experience/spec.md), [004](../004-auth-rbac-api/spec.md) and [006](../006-credentials-admin/spec.md).

## Problem and expected outcome

The MVP has local Jest checks and recorded hosted checks but no repository CI workflows or declared Playwright dependency. Hosted Jest tests can skip when configuration is absent, and the existing race uses two requests from the same nurse. A reproducible pipeline must distinguish local quality, real backend verification and real browser coverage, and fail when required verification was omitted.

## Scope

- Included: GitHub Actions quality and hosted verification workflows, Node 24 build, existing Jest suites, Playwright Chromium tests against the production application running locally in the runner, isolated backend data, cleanup, truthful status/evidence and documentation reconciliation.
- Excluded: Vercel registration/configuration, hosting, preview deployments, production deployment, CD, new business features, broad browser matrices, performance/load testing and arbitrary coverage-percentage targets.
- This session delivers specifications, a plan and documentation corrections. It does not install dependencies, create workflows, configure external accounts or execute browser E2E.

## Requirements and acceptance criteria

| Requirement | Required behavior | Criteria |
| --- | --- | --- |
| R01 | Reproducible quality pipeline without backend secrets | AC01–AC02 |
| R02 | Hosted integration checks that cannot silently skip | AC03–AC04 |
| R03 | Real browser verification closing 005/T07 | AC05–AC07 |
| R04 | Isolated, repeatable data and bounded cleanup | AC08–AC09 |
| R05 | Safe workflow permissions and useful evidence | AC10–AC11 |
| R06 | Current documentation and honest delivery status | AC12–AC13 |

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
| AC10 | PR from an untrusted fork runs | Quality runs without backend secrets; hosted workflow does not execute fork code with secrets; permissions are read-only except where a specific action requires otherwise |
| AC11 | Results are recorded | Counts, versions, failed/skipped checks and cleanup outcomes available; no tokens, passwords, documents, raw backend responses or sensitive browser traces in published artifacts |
| AC12 | Existing feature documentation is reconciled | Current summaries match code and dated evidence; historical logs retained; implemented work and pending verification distinguished; no unsupported completed label |
| AC13 | Feature closure is proposed | Actual GitHub quality and hosted successes reference tested commits; 005/T07 closes only after AC05–AC06; 005/T08 closes only after its complete checks, including Node 24 build; Vercel remains excluded |

## Contracts and data

Preserve the six APIs, all 15 required test IDs, public IDs/emails/names, full Shift fields, local dates/hours, open/claimedBy:null and inclusive America/Bogota expiry. No product endpoint or permission change is planned. Baseline nurse-2 remains expired. Additional race identities must be separate test accounts with eligible credentials.

## Questions and assumptions

| ID | Decision or prerequisite | Resolution |
| --- | --- | --- |
| Q01 | CI provider | Git remote is GitHub; plan GitHub Actions |
| Q02 | Browser dependency | Propose @playwright/test plus Chromium only. Explicit dependency approval is required before installation; this planning request does not install it |
| Q03 | Hosted backend and access | Prefer a separate dedicated CI Supabase project, never a production/demo backend shared with manual use. Project availability, identity provisioning, database cleanup connectivity and GitHub secrets remain unverified prerequisites |
| Q04 | Backend mutation isolation | Keep fixture accounts unchanged; provision two additional eligible nurses and disposable shifts in the CI project. Define setup/cleanup before enabling hosted runs |
| Q05 | Hosting | Explicitly excluded by the user until a later Vercel phase |

## Delivery condition

All AC01–AC13 require actual evidence. A written workflow is not a successful CI run, a skipped integration suite is not verification, and existing same-nurse concurrency evidence does not satisfy the two-nurse browser race. Pending dependency/account access affects only dependent implementation tasks. No commit, push, publication or external setting change is part of this planning session.

## Change history

| Date | Change | Source |
| --- | --- | --- |
| 2026-10-15 | Initial plan; Vercel excluded | User request and repository review |
