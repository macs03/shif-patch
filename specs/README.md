# Spec-Driven Development in ShiftPatch

The challenge packet and the user's instructions define the functional contract. `001-shiftpatch/spec.md` describes observable behavior, `plan.md` holds technical decisions and development guidance, and `tasks.md` connects requirements, changes and verification. Verification summaries live in feature tasks; original evidence stays privately outside the repository.

## Constitution and templates

Read [CONSTITUTION.md](CONSTITUTION.md) before planning or implementing. It defines project principles, constraints and amendment rules.

For a new feature, copy the three documents from `_TEMPLATE_/` into `specs/NNN-slug/` and replace every `{{...}}` placeholder:

- [spec.md](_TEMPLATE_/spec.md): problem, scope, requirements, acceptance criteria and open questions.
- [plan.md](_TEMPLATE_/plan.md): minimal solution, constitution review, planned changes and verification.
- [tasks.md](_TEMPLATE_/tasks.md): tasks, dependencies, coverage and actual evidence.

`_TEMPLATE_` contains reusable models, not an implemented feature. Do not fill it in for a specific task. Feature folders are siblings of `_TEMPLATE_`, so `../CONSTITUTION.md` remains valid after copying. Qualify requirement and task IDs with their feature folder to distinguish them across features.

## Workflow

1. Read the constitution and the selected feature's spec, plan and tasks. Update the specification first if a criterion is missing or scope changes. Resolve questions before implementing dependent behavior; continue independent work. Existing user authorization is sufficient for work within its scope.
2. Include the task and requirement IDs in the session prompt. Identify the expected files and the verification that will demonstrate each behavior.
3. Implement only that task and its necessary checks. Apply the relevant Next.js, Ponytail, Supabase and UI guidance described in the plan.
4. Run checks, review the diff and record commands, actual results, limitations and evidence in the selected feature tasks. Keep unexecuted checks pending.
5. Close a task only when its criteria are met. Installing a skill, declaring a type or writing a report does not complete a feature.

Example next-session prompt: “Read AGENTS.md, the constitution and specs/001-shiftpatch. Work on T02 for R03/R09, resolve relevant open questions, update the plan if needed, implement and verify the login contract. Preserve the original transcript according to specs/CONSTITUTION.md.”

This workflow uses Markdown and the existing agent; Spec Kit and OpenSpec are not installed. The first database baseline existed before these documents and is recorded as documented after implementation. Future tasks follow spec → plan → tasks → code → evidence; no retrospective spec-first history is claimed.

## Feature index

- [001-shiftpatch/spec.md](001-shiftpatch/spec.md): overall MVP contracts and previously prepared baseline.
- [002-supabase-initial-data/spec.md](002-supabase-initial-data/spec.md): first hosted fixture load and private Next.js connection.
- [003-test-harness/spec.md](003-test-harness/spec.md): Jest, React Testing Library and Zod test harness.
- [004-auth-rbac-api/spec.md](004-auth-rbac-api/spec.md): implemented Supabase Auth, server/database authorization and six REST API contracts; verification limits remain.
- [005-core-user-experience/spec.md](005-core-user-experience/spec.md): login, nurse marketplace, agency management and critical browser workflows on the existing API. UI is implemented; Playwright E2E is still pending dependency approval.
- [006-credentials-admin/spec.md](006-credentials-admin/spec.md): private credential upload, admin shift overview, audit log and scheduled-hours preview. Implemented and manually verified, with the limits recorded in its tasks.
- [007-ci-e2e/spec.md](007-ci-e2e/spec.md): GitHub Actions quality workflow without a backend. Local Node 24 checks passed; a GitHub run is still unobserved. Real-backend verification and Vercel are out of scope.
- [008-consistency-audit/spec.md](008-consistency-audit/spec.md): implemented local audit and stale-response corrections; hosted RLS and some browser checks remain unverified.
- [009-security-hardening/spec.md](009-security-hardening/spec.md): implemented local hardening/readability improvements, including bounded JSON and login-throttle responses; direct-provider enforcement and deployed security verification remain open.
- [010-project-wide-review/spec.md](010-project-wide-review/spec.md): implemented whole-project static review and focused frontend/client corrections; audit-aware hosted test cleanup remains pending, alongside recorded verification gaps.
- [011-role-component-split/spec.md](011-role-component-split/spec.md): planned ShiftPatchApp split into role components with a separate pure SPA view selector, shared board and publishing dialog; parent retains session/request coordination. Implementation/verification tracked in its tasks.

Feature 004 task summaries now distinguish implementation from partial verification; dated historical results remain in its execution log. Cancellation and credential expiry decisions are resolved there.
