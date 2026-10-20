# Harness and Guidance Synchronization — Tasks and Evidence

Specification: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Date: 2026-10-19

Status: Documentation synchronization complete. Application/build/browser/hosted results were not rerun or newly certified.

| Task | Requirements / criteria | Work | Status | Completion check |
| --- | --- | --- | --- | --- |
| T00 | R01–R05 / planning | Inspect docs/source/config and define synchronization | Completed | Clean 73cf68c baseline; documentation-only scope mapped |
| T01 | R01,R04 / AC01, AC04 | Amend constitution/AGENTS and templates | Completed | 1.3.0 amendment, current owner/harness guidance and proportionate template checks; generated-block verification in T03 |
| T02 | R02–R04 / AC02–AC04 | Reconcile harness/current feature/root guidance | Completed | 003 commands/config corrected; root/MVP/UI/admin/011/012/design/index cross-references aligned; dated outcomes preserved |
| T03 | R05 / AC05 | Review and validate all documentation edits | Completed | 23 Markdown files / 97 local links checked; generated blocks/history/fixtures preserved; whitespace/doc-only checks pass |
| T04 | R06,R04–R05 / AC04–AC06 | Extend agent harness with component/API communication and project engineering conventions | Completed | Source-to-guidance map and implementation/review routine; 23 docs / 104 links validated; no runtime changes |

## Coverage

| Criterion | Responsible tasks | Evidence |
| --- | --- | --- |
| AC01 | T01, T03 | Constitution 1.3.0, aligned AGENTS ownership/harness sections; generated-block comparison |
| AC02 | T02, T03 | Current root/MVP/UI/admin/011/012/design/index descriptions match source |
| AC03 | T01–T03 | 003 current commands/config/regression guidance and verification templates |
| AC04 | T01–T03 | Dated logs/versions and fixtures preserved; explicit pending cleanup/build/browser/deployed/export evidence; withdrawn E2E not presented as promised work |
| AC05 | T03 | Final document validation below |
| AC06 | T04 | AGENTS boundary rules and canonical engineering conventions in plan; 003/README/index/template links; validation passed |

## Execution log

### 2026-10-19 — T00 inventory and plan

- Primary Codex agent only; no delegation. Initial tree clean at 73cf68c. Read AGENTS/constitution/index, affected specs/plans/task evidence/templates, README, actual Jest config/setup/test inventory, role selector and HTTP/Auth boundaries. Inspected integration env gates and cleanup source without reading actual environment values or making hosted calls.
- Some combined read output was truncated; targeted reads supplied specific current contracts/config and correction evidence. New documents copied from templates before guidance edits. No runtime changes/checks, dependency install, external action, commit or publication.
- Original prompts/tool outputs remain native/private; complete post-turn export pending. This log is a summary, not a transcript. No new Next.js feedback candidate.

### 2026-10-19 — T01–T03 delivery and verification

- Amended constitution to 1.3.0 (additive guidance, no permission/business change), AGENTS owner/harness rules and all three templates. Reconciled README/design/index, 001/003/005/006/007/011/012 summaries and 003 current regression guidance. Added 013 traceability. Corrected stale next/jest availability/env/implementation claims and clarified withdrawn E2E is not a promised 007 delivery. Repaired the 012 task table without changing its execution evidence.
- Compared actual config/source, reviewed authored changes and targeted diff sections. Some large combined diff output was truncated; original patches and targeted document reads supplied the complete changed guidance. No runtime/test setup/config, SQL, dependency or environment file changed.
- Initial document checker failed because AC03 appeared only inside a task criterion range and not as a literal mapping. Added an explicit AC01–AC05 coverage table, then reran: 23 Markdown documents and 97 local links/anchors passed; placeholders (excluding intentional template/index examples), whitespace and documentation-only scope passed. `git diff --check` passed.
- Explicit comparisons passed: both generated Next.js AGENTS blocks byte-identical to HEAD; dated 003 and 012 execution logs unchanged; exact MVP fixtures unchanged; 010/T04 still Pending. Prior plan versions and test counts remain historical. HEAD remained 73cf68c.
- Application tests/typecheck/lint/build not rerun for this documentation-only change. Last recorded local application evidence remains 012's 84 tests/typecheck/lint; it is not a fresh result. Build/native-browser/deployed controls, live CI, audit-aware hosted cleanup and complete private transcript export retain their separate open status. No browser/hosted requests, writes, commit or publication.
- Next.js reporting pass: no new qualifying framework issue; no duplicate report submitted. Native conversation retains original prompts/tool outputs; complete private post-turn export remains pending. This log is not a transcript.

### 2026-10-19 — T04 project engineering conventions

- User explicitly extended the request beyond test instructions to how components, API routes and communication follow the project's established practices. Added R06/AC06 before extending guidance. Primary Codex only; no delegation. Preserved all existing synchronization edits; HEAD remains 73cf68c.
- Inspected representative actual route handlers, client transport, schemas and server Auth/data/config boundaries in addition to the current component ownership already reviewed. Added the canonical engineering conventions/source map to this plan, concise working rules to AGENTS and the matching server-boundary principle to the still-uncommitted constitution 1.3.0 amendment. No new major/version history or prior evidence rewrite.
- Covered explicit typed props/actions, local/derived state, shared components/dialogs, parent async/session protection, validated form values, client schema/abort/uncertain handling, protected route authentication and bounded validation, verified ownership, safe public serialization/errors, caller-scoped atomic database operations, credential cleanup safety and existing verification gaps. Added a caller-path/contract review routine and template prompt; linked it from 003 harness guidance, README and index.
- Document checks passed: 23 Markdown files, 104 local links/anchors, placeholders/whitespace, generated AGENTS blocks preserved, AC01–AC06 mapped and 010/T04 still Pending. `git diff --check` passed. No application/test/config/SQL changes or new dependency. Application tests/typecheck/lint/build/browser/hosted checks not rerun for prose-only work; all prior limits remain open. No commit/publication.
- Next.js feedback pass: no qualifying new candidate. Original prompts/tool outputs remain in native history; complete private post-turn export pending. This summary does not replace the transcript.
