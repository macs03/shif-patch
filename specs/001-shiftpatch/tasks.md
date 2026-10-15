# ShiftPatch — Tasks and Traceability

Completed first-session work is a baseline that predates this SDD configuration; no retrospective spec-first history is claimed. Last updated: 2026-10-14.

| Task | Requirements | Status | Evidence / completion condition |
| --- | --- | --- | --- |
| T01 Data model and fixtures | R01,R02 | Hosted baseline verified | Historical embedded checks passed for fixtures, bcrypt, relations, reset/repetition and RLS. Hosted counts, values and the server read are recorded in 002-supabase-initial-data. Utilities were removed. Original session and historical summary archived privately outside the repository |
| T02 Login and JWT | R03,R09 | Pending | Verify all five logins, 401 contract and invalid/expired token handling; never return hashes |
| T03 List and create shifts | R04,R05,R09 | Pending | Exact list and agencyId derived from token; prevent creation by other roles |
| T04 Claim | R06,R09 | Pending; resolve Q02,Q03 | Reject expired credential, accept valid claim, prevent double assignment under concurrency |
| T05 Cancellation | R07,R09 | Pending; resolve Q01,Q03 | Both reasons, original previousNurseId, reopened shift and defined permissions |
| T06 Agency view | R08,R09 | Pending | Agency isolation and full Shift response shape |
| T07 UI and minimal views | R10 | Pending; resolve Q04 | All 15 IDs on correct elements, verifiable flows, Hallmark within approved scope |
| T08 Session evidence | R11 | In progress | Historical private snapshots retained; manually export originals after closure and review copies before sharing |
| T09 SDD and skills setup | R11 | Configuration created | Spec/plan/tasks, pinned sources and hashes, existing Cursor rules preserved; historical setup summary archived privately outside the repository |

T09 includes the constitution and three templates under `specs/_TEMPLATE_/`. Agents consult them before creating features. This completes workflow documentation, not API implementation or hosted verification.

## Documentation verification history

On 2026-10-14, the initial template review confirmed three templates, seven principles in constitution v1.0.0, twelve valid local links, AGENTS references and a passing `git diff --check`. No application tests were run for that documentation-only change.

The preceding consolidation used constitution v1.1.0. Documentation has been translated to English and technical guidance consolidated in plan.md. The AI registry was subsequently relocated to .agents/skills-lock.json. Original transcripts retain their source language and bytes. Current checks passed for 13 English authored documents, 12 local links, all 11 requirements, all 15 exact test IDs, the skill registry and constitution version consistency. SHA-256 comparison confirmed 158 original transcript, application, migration, Cursor-rule, installed-skill and package files remained unchanged. git diff --check passed. API and hosted-database statuses are unchanged.

For each future task, add an entry with date, requirement/criterion, changed files, executed check, actual result, private evidence reference and transcript completeness. Do not complete a task based on an unexecuted check.

## Maintenance decisions

Custom scripts and associated commands were removed at the user's request. The database folder contains only migrations/001_initial.sql and migrations/002_trial_seed.sql. Historical checks remain evidence without their temporary utilities. Verify future database changes directly in Supabase; connecting the project and applying migrations remain pending.

## Removal of the documentation directory (2026-10-14)

At the user's request, the separate documentation directory was removed. Original reports and transcript snapshots were copied into a private archive outside the repository and verified byte for byte before removal. Existing completeness labels remain unchanged. Skill provenance is stored in .agents/skills-lock.json; manual evidence guidance lives in constitution v1.2.0, principle VI. Technical plans and execution summaries remain in the feature plan/tasks files.

Historical session 1 checks passed for TypeScript (Node 24.19.0), ESLint, exact SQL fixtures, bcrypt correct/incorrect passwords, relations, repeated fixture loading and RLS in PGlite 0.5.10. Temporary native PostgreSQL was blocked by shared-memory restrictions; the build was blocked by the sandbox's local-port restriction after an initial font network failure. Former capture utilities passed mock success/failure, byte/checksum and overwrite checks before removal. These are historical results, not hosted Supabase verification.

Historical skills checks confirmed all 107 Hallmark and 36 Supabase files matched pinned upstream revisions. This cleanup changes documentation/configuration only; implementation, fixture contracts and pending hosted verification are unchanged.

Cleanup verification: thirteen local links valid, no obsolete project-documentation references, installed skill hashes intact, all eight private archive files matched their checksums, constitution/plan versions consistent and git diff --check passed. The first inline cleanup command had a syntax error before any mutation; it was corrected and the cleanup completed. No application tests were rerun for this documentation/configuration-only change.

Hosted setup and verification for parent T01 are recorded in [002-supabase-initial-data/tasks.md](../002-supabase-initial-data/tasks.md). The hosted baseline and server read passed on 2026-10-14.

## Authentication and API planning (2026-10-15)

Parent T02–T06 are planned in [004-auth-rbac-api/tasks.md](../004-auth-rbac-api/tasks.md) using Supabase Auth and database authorization, explicitly requested by the user. Implementation remains pending. Cancellation permissions and inclusive America/Bogota credential expiry are resolved by user replies; the feature defines remaining API error decisions, migration of the privileged read helper and automated contract/security verification. Older Q01–Q03 dependency labels in the task table describe their original state and are superseded by these decisions. Historical baseline evidence above is unchanged.

## Core experience planning (2026-10-15)

The nurse/agency portion of T07 is planned in [005-core-user-experience/tasks.md](../005-core-user-experience/tasks.md): login, marketplace, claims, own-agency listing/create/cancel, nine required test IDs and browser E2E coverage. Implementation remains pending for this UI feature. Parent Q04 and the six deferred-module test IDs are outside this epic and do not block its defined screens. Feature 004 now contains API implementation and recorded hosted outcomes in its execution log despite older pending labels; verify its remaining limits before UI integration. No historical results have been reclassified as newly executed checks.
