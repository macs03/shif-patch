# ShiftPatch Development Constitution

Version: 1.2.0 · Adopted: 2026-10-14 · Last amended: 2026-10-14

This constitution governs project agents and documents under `specs/`. Explicit user instructions take precedence; the challenge contracts define functional behavior. Skill recommendations cannot change those contracts.

## I. Specification before implementation

Work in this order: spec → plan → tasks → implementation → verification and evidence. Before changing behavior, define its requirement and observable criteria in the feature specification. The plan explains the solution; tasks identify concrete changes and their verification.

Use the [_TEMPLATE_](_TEMPLATE_/spec.md) documents for new features. Resolve an open question before implementing behavior that depends on it; continue independent tasks. Do not invent requirements to close an ambiguity.

The initial database baseline was implemented before SDD was adopted. Preserve that distinction; do not claim it was spec-first retroactively.

## II. Exact contracts and data

Preserve IDs, names, emails, dates, facility-local times, roles, messages, response shapes and test IDs from the ShiftPatch packet. Keep fixture dates even if they are in the past. Do not convert local times to UTC. Every returned shift uses the full contract and `claimedBy: null` when open.

Document decisions not specified by the packet and their impact before implementation. An abbreviated example does not replace the complete contract.

## III. Minimal solution within scope

Use Next.js App Router, strict TypeScript and repository conventions. Reuse existing code and dependencies; add tools only when a task justifies them and authorization exists. Follow Ponytail and consult relevant guidance, including documentation for the installed Next.js version.

Do not create a `scripts/` directory or custom utilities for one-time work. Manage the database in Supabase; for now, keep only SQL migrations under `db/migrations/`, including fixture loading. Configuring SDD does not authorize additional features.

Write project documentation, specifications, plans, tasks, templates and session reports in English. Preserve original transcripts in their source language and byte-identical form. Keep technical decisions in feature plans and verification summaries in feature tasks. Preserve original evidence privately outside the repository; do not create a separate project documentation directory.

## IV. Server-side security

Keep secrets, connections and password hashes out of browsers and public responses. Never place real secrets in specs, shared transcripts, commits or logs. The published trial password is a fixture and is stored hashed in the database.

Authenticate and authorize inside every protected endpoint; validate external input and resource ownership. The marketplace can list both agencies as required by its contract; agency operations are scoped to verified identity. Verify RLS and data changes directly in Supabase. Consult the Supabase skill before SQL changes.

## V. Traceability and actual checks

Link each task to requirements and acceptance criteria. Identify requirements by feature folder and ID, for example `001-shiftpatch/R03`. Record affected files, dependencies, planned checks and actual results.

Verify in proportion to the change: document review for documentation; types and lint for application changes; integration checks for API contracts; Supabase verification for migrations and permissions; visual review and real flows for UI. Avoid tests that only mirror implementation. Record environmental failures and unexecuted checks as blocked or pending, never passed.

## VI. Complete evidence and honest status

Manually preserve complete prompts and original transcripts, including tool calls, results and failures, outside the repository. Use native Codex/Cursor history or a private export after the turn finishes. Record source, capture date and completeness; do not overwrite original captures. For CLI work, retain the native event stream, stderr, prompt and exit status using standard terminal facilities, without custom wrappers.

If an original export is unavailable, record it as pending. Never fabricate messages or describe a snapshot as complete. Originals remain private, unchanged and in their source language. Share only reviewed copies with documented redactions of real secrets, personal information or local paths. A standard checksum utility can document integrity. A summary does not replace a transcript; emitted events do not expose hidden reasoning.

Record scope, decisions, checks, failures and evidence availability in the feature tasks.md. These summaries supplement native history; they are not transcripts. Existing reports and snapshots were privately archived outside the repository before their former directory was removed.

Complete a task only when its criteria are satisfied and its necessary checks have evidence. An installed skill, declared type or prepared migration does not prove execution or deployment. Never invent agents, delegation, tests or results.

## VII. Amendments

When instructions conflict, follow the user's instructions and external contracts, then update affected documents. Record the date, reason and version for constitution amendments, and review their impact on templates, plans, tasks and `AGENTS.md`. Do not request additional approval for already authorized changes.

Increment the major version for incompatible principle changes, the minor version for additional guidance, and the patch version for wording clarifications. Plans identify the reviewed version and justify any authorized exception.

| Version | Date | Change |
| --- | --- | --- |
| 1.0.0 | 2026-10-14 | Adopted SDD principles and existing project decisions, including Supabase, no custom scripts and manual evidence preservation |
| 1.1.0 | 2026-10-14 | Required English project documentation and consolidated technical decisions in feature plans; retained original-language transcripts |

| 1.2.0 | 2026-10-14 | Removed the separate documentation directory; consolidated manual evidence guidance here, verification summaries in feature tasks and skill provenance under .agents |
