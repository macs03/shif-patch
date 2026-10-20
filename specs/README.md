# Spec-Driven Development in ShiftPatch

The challenge packet and the user's instructions define the functional contract. `001-shiftpatch/spec.md` describes observable behavior, `plan.md` holds technical decisions and development guidance, and `tasks.md` connects requirements, changes and verification. Verification summaries live in feature tasks; original evidence stays privately outside the repository.

## Constitution and templates

Read [CONSTITUTION.md](CONSTITUTION.md) before planning or implementing. It defines project principles, constraints and amendment rules.

Current version: **1.3.0** (2026-10-19), synchronized after the audits, role split and shared confirmation dialogs. Earlier plans keep the versions reviewed for their original work; current amendments are explicit rather than retroactive replacements. Synchronization scope/checks are in [013](013-harness-guidance-sync/tasks.md).

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
- [003-test-harness/spec.md](003-test-harness/spec.md): implemented Jest/RTL/Zod harness; current offline/hosted commands and role/session/dialog regression guidance, with original evidence preserved.
- [004-auth-rbac-api/spec.md](004-auth-rbac-api/spec.md): implemented Supabase Auth, server/database authorization and six REST API contracts; verification limits remain.
- [005-core-user-experience/spec.md](005-core-user-experience/spec.md): implemented login, nurse marketplace and agency management. Real-backend browser E2E is unverified and withdrawn from 007 scope; the evidence gap remains explicit.
- [006-credentials-admin/spec.md](006-credentials-admin/spec.md): private credential upload, admin shift overview, audit log and scheduled-hours preview. Implemented and manually verified, with the limits recorded in its tasks.
- [007-ci-e2e/spec.md](007-ci-e2e/spec.md): GitHub Actions quality workflow without a backend. Local Node 24 checks passed; a GitHub run is still unobserved. Real-backend verification and Vercel are out of scope.
- [008-consistency-audit/spec.md](008-consistency-audit/spec.md): implemented local audit and stale-response corrections; hosted RLS and some browser checks remain unverified.
- [009-security-hardening/spec.md](009-security-hardening/spec.md): implemented local hardening/readability improvements, including bounded JSON and login-throttle responses; direct-provider enforcement and deployed security verification remain open.
- [010-project-wide-review/spec.md](010-project-wide-review/spec.md): implemented whole-project static review and focused frontend/client corrections; audit-aware hosted test cleanup remains pending, alongside recorded verification gaps.
- [011-role-component-split/spec.md](011-role-component-split/spec.md): local ShiftPatchApp split into role components and a pure SPA view selector; parent retains session/request coordination. Build and some native browser checks remain open.
- [012-shift-action-confirmation/spec.md](012-shift-action-confirmation/spec.md): shared app-dialog confirmation before claiming, reopening or publishing a shift; cancellation sends no mutation. Verification in its tasks.
- [013-harness-guidance-sync/spec.md](013-harness-guidance-sync/spec.md): agent instructions/constitution 1.3.0, harness and current feature guidance synchronized with 008–012; documentation-only verification.

## Current engineering baseline

- [AGENTS.md](../AGENTS.md) defines concrete ownership and commands; the constitution defines governing principles. [013 engineering conventions](013-harness-guidance-sync/plan.md#engineering-conventions) cover component/client/API/server communication and review; [003](003-test-harness/plan.md) is the current test-harness guide.
- [011](011-role-component-split/spec.md): ShiftPatchApp coordinates session/requests; renderAppView purely selects role elements. [012](012-shift-action-confirmation/spec.md): shared Dialog composes publication and confirmation; dismissals never mutate.
- [009](009-security-hardening/tasks.md) records body bounds, safe errors and open direct-provider/deployed questions. [010/T04](010-project-wide-review/tasks.md) remains pending audit-aware hosted-test cleanup; do not enable hosted mutations before safe cleanup is verified and execution authorized.
- The latest local application evidence is in [012](012-shift-action-confirmation/tasks.md). Native browser, build, hosted controls, live CI and complete transcript export have independent status; documentation synchronization does not close those gaps.

Feature 004 task summaries now distinguish implementation from partial verification; dated historical results remain in its execution log. Cancellation and credential expiry decisions are resolved there.
