# Continuous Integration and Browser Verification — Plan

Specification: [spec.md](spec.md) · Date: 2026-10-15 · Status: Ready for implementation after listed prerequisites

Reviewed constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0.

## Minimal technical decision

Use two GitHub Actions workflows and the installed Jest/RTL/Zod stack. Add only @playwright/test after explicit approval, pin its resolved version in package-lock.json, and install Chromium using that version. Use Node 24 on Ubuntu, npm ci and npm's download cache; do not cache node_modules or share built application artifacts containing environment values between trust levels. Start with one browser and one worker, with retries disabled for mutating scenarios so retries cannot conceal data/setup failures.

### Quality workflow: .github/workflows/ci.yml

Trigger on pull_request, push to main and workflow_dispatch. No path filters initially, so documentation PRs still receive the same required check. Use permissions contents:read, pinned reviewed action revisions, a bounded timeout and per-ref concurrency with cancellation of superseded quality runs. Run npm ci, npm run lint, npm run typecheck, npm test -- --selectProjects unit ui --runInBand, then npm run build. Type generation runs before TypeScript; avoid concurrent type generation and build on the same checkout. Fail on any command error. Build should succeed without live backend credentials; test that explicitly. Account for next/font/google requiring outbound access during the build; record network failures rather than silently changing fonts.

### Hosted workflow: .github/workflows/verify-hosted.yml

Trigger on push to main and workflow_dispatch for the trusted main ref only. Run its own quality prerequisites on the exact checked-out commit, then hosted Jest integration, then browser tests against that commit's production build. Never use pull_request_target or execute an untrusted PR ref with backend secrets. Name the check distinctly from PR quality; it is a trusted-main verification, not a required PR check that never runs on PRs.

Use a constant backend-specific concurrency group with cancel-in-progress:false, plus sequential integration/E2E steps and one Playwright worker. Do not use parallel matrices against shared data. This serializes Actions runs only: reserve the backend for automation and document exclusive access during local hosted runs. Timeout/runner termination cannot guarantee teardown; make interrupted-run detection part of the next preflight.

Backend configuration is scoped to the hosted job: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and DB_PASSWORD for current integration cleanup. Validate an expected CI project reference before any administrative operation. Additional test-nurse login settings are server/test-only GitHub secrets; document names with blank placeholders in .env.example. Do not introduce service-role credentials into the application or browser. Check psql availability and TLS/network connectivity without printing connection strings before mutating tests.

## Test changes and E2E design

Current integration tests import route handlers directly: they verify real Supabase behavior but do not prove HTTP routing. Playwright must use actual browser requests to the locally running Next server, including real authorization and database operations.

1. Add an explicit strict hosted-verification mode to existing test setup/tests. Validate required settings and mutation opt-in; fail if required integration tests would skip. Preserve optional local execution when strict mode is not requested. Assert actual expected tests executed and zero required skips in the hosted run, rather than trusting exit code alone. Add meaningful tests for missing configuration and strict-mode behavior.
2. Keep existing baseline comparisons and separate their known fixture IDs from additional test rows. The current same-identity race remains useful coverage; add the distinct-identity browser race instead of relabeling it.
3. Add playwright.config.ts and e2e/core-workflows.spec.ts. Configure webServer to launch npm run start on loopback after a successful build; do not reuse a dev server in CI. Use the existing data-testid selectors scoped by data-shift-id. Wait on matching HTTP responses and assertions, not fixed sleeps.
4. Use real UI logins in independent browser contexts; no persisted storage-state exports. First test invalid login, role routing, sign-out and reload. Verify nurses see both agencies and fixture dates; each agency sees only its own dashboard.
5. Create disposable shifts through the agency UI. Claim as an eligible nurse, assert filled/claimant/banner, cancel through the owning agency with advance, then claim and cancel again with no-show. Verify reopened/null state from HTTP and the refreshed nurse screen. Try the expired fixture on a disposable open shift and assert the exact 403/banner with unchanged state. Verify other-agency denial through a real authenticated HTTP request without exposing the bearer token in output.
6. For AC06, two additional eligible nurses log in separately. Synchronize their outgoing claim requests at a test barrier, then release both. Assert [200,409], winning public ID, conflict feedback and reconciliation in both browser views. This is a synchronized state race, not a load test.
7. Add a small regression smoke for delivered 006 admin table/counts and credential form/read state. Keep document replacement, broad Storage/RLS audit and missing no-show audit evidence as explicitly separate gaps unless implementation adds focused real-backend verification. Do not claim full 006 re-certification from this smoke.

Expected package scripts: test:e2e for Playwright and test:integration:ci for strict hosted Jest. Keep existing scripts compatible; quality selects unit/ui explicitly rather than running npm test and accidentally mixing optional hosted suites. No scripts/ directory, capture wrappers, new product routes or one-off project utilities.

## Data setup and cleanup

Use a dedicated CI project with the existing ordered migrations and exact fixture seed. Provision/map Auth fixture accounts following the existing 004 process; schema migrations alone do not establish that Auth passwords/mappings are ready. Verify migrations through 009, private Storage configuration and disabled public signup directly before enabling the job.

Two additional eligible nurse accounts need stable public mappings, private test credentials and future expiry dates managed only in the CI project. Any SQL preparation belongs under db/migrations with a CI-project guard and documented application scope; read the Supabase skill/references before authoring SQL. Do not apply CI-only setup to the existing demo project. Provisioning is an explicit T02 deliverable, not something assumed available from the plan.

Implement reusable test fixtures/teardown inside e2e/ and existing integration tests, not a standalone utility. Record generated IDs per run, including immediate registration after creation. Prefer authenticated API creation and documented private administrative cleanup because there is no delete endpoint. Administrative credentials stay in the test process. Before enabling the workflow, inspect audit FKs/deletion behavior and ensure cleanup handles dependent audit rows without erasing unrelated history. Abort on project mismatch or attempts to delete baseline IDs; parameterize SQL and allowlist generated IDs. Never clean by broad prefix alone.

Snapshot baseline shifts and credential metadata before and after; fail and preserve a private incident record on drift. Do not silently restore the modified demo nurse-1 expiry or replay seed against a shared project. Guarantee normal failure teardown with test hooks and an always-run cleanup step using a private run manifest. Ignore the manifest locally; do not upload it with credentials or browser artifacts. On forced termination, the next preflight detects pending manifests/stale generated rows; reconcile them with the private run ledger before further mutations. Demonstrate normal pass, assertion failure, cleanup failure and interrupted-run recovery. Clean generated Storage objects if a future test creates them.

## Workflow security and evidence

Do not echo env files, credentials, tokens, HTTP bodies containing auth responses or database URLs. Disable Playwright trace, HAR, video and automatic screenshots for authenticated flows by default: they can capture authorization headers and credential documents. Keep sanitized test summaries/counts as CI artifacts with short retention (proposed seven days); review reporter error output to avoid secret-bearing request dumps. Full native transcripts remain private and manually preserved per constitution; CI reports supplement them.

Configure GitHub secrets and the stable quality check as a required branch check only after a successful workflow run. Repository settings/permissions are external prerequisites, not completed by adding YAML. No changes to GitHub settings, account provisioning or push are performed in this planning session. No Vercel tokens, deployment hooks or deployment jobs.

## Planned changes and traceability

| Requirements / criteria | Files or surface | Change |
| --- | --- | --- |
| R01 / AC01–AC02 | .github/workflows/ci.yml | Secret-free required quality check on Node 24 |
| R02,R04–R05 / AC03–AC04, AC08–AC11 | .github/workflows/verify-hosted.yml; integration tests/setup; .env.example | Strict hosted checks, trusted triggers, serialization and bounded cleanup |
| R03–R05 / AC05–AC11 | playwright.config.ts; e2e/; package files; .gitignore | Real browser suite, race, failure cleanup and private artifact rules |
| R06 / AC12–AC13 | README.md; specs/README.md; 001/004/005/006 status summaries; this feature tasks | Current status separated from dated historical evidence |

## Constitution review and guidance

I: this spec/plan precedes implementation. II: preserve fixtures/contracts; separate race accounts. III: existing tools plus one proposed browser dependency; no deployment. IV: hosted secrets limited to trusted code and isolated backend. V: local, hosted and GitHub execution have separate evidence. VI: retain native records privately and record failures/skips. VII: constitution 1.2.0 applies; no exception requested.

Read bundled Next.js testing/playwright.md before implementation; inspected in this session. Follow Ponytail/secure-development rules. No UI redesign or React changes are planned; load Hallmark/React skills if an actual UI fix becomes necessary. Load Supabase guidance before SQL/RLS/setup changes. No skill tools, paid services or new dependencies executed during planning.

Primary references checked for the plan: [Playwright CI](https://playwright.dev/docs/ci), [Playwright webServer](https://playwright.dev/docs/test-webserver), [GitHub workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), and [GitHub pull_request_target security](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target). Recheck action versions and version-specific Playwright behavior during implementation.

## Planned verification and sequence

1. T01: implement/run Node 24 quality commands locally and prepare the secret-free workflow; record build network/environment errors.
2. T02: verify isolated backend, test identities, permissions, connection and cleanup lifecycle. Resolve Q02 before browser dependency installation; Q03–Q04 before hosted mutation execution.
3. T03: implement strict integration mode and test absent-config failure plus successful real-backend execution.
4. T04: implement/run Playwright workflows, distinct-nurse race, admin/form smoke and failure/recovery checks. Close 005/T07 only with actual results.
5. T05: connect trusted hosted workflow, verify missing-secret failure, serialization and actual GitHub quality/hosted success after an authorized push. External settings and branch checks require available access.
6. T06: review complete diff, record counts/versions/cleanup and close eligible tasks. Node 24/full Jest/E2E evidence is required for 005/T08. Leave remaining 006 authorization/audit verification limitations explicit.

No test result, GitHub run or dependency approval is implied by this plan. A local npm run build/start used for testing does not deploy the application.
