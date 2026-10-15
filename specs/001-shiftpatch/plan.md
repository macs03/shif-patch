# ShiftPatch — Technical Plan

Reviewed constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0. This plan preserves the existing baseline; subsequent implementation follows the constitution.

## Architecture and data decisions

Use one Next.js 16.4.1 App Router application with strict TypeScript and existing Tailwind. Route handlers under `app/api/**/route.ts` call server-only modules under `lib/server/`; shared response types live in `lib/domain/types.ts`. Business handlers and screens are pending. No additional framework, ORM, authentication provider or test runner is needed for the first-session foundation.

Manage PostgreSQL directly in a dedicated Supabase project. Apply `db/migrations/001_initial.sql` once on a fresh database; it creates the private `shiftpatch` schema, constraints, RLS and bcrypt support through pgcrypto in `extensions`. Apply `002_trial_seed.sql` next for the exact fixture IDs. Reapplying the fixture migration restores those IDs without deleting unrelated records; use a fresh dedicated database for an exact trial start. No hosted database is connected yet.

RLS is enabled without browser policies. The future server connection needs explicit access; JWT verification, role checks and ownership checks remain mandatory even if that connection bypasses RLS. Do not expose the private schema through the public Data API.

Agency login IDs equal agency IDs. Foreign keys ensure only nurses own credentials or claim shifts. Credentials store expiry dates rather than a stale valid/expired flag. Document upload/storage is deferred. Cancellation reopens the shift; the baseline has no persisted cancelled status. Add cancellation history, audit and timesheet data when their behavior is specified and implemented.

Store facility-local date/time values. An end time earlier than start time means the following day. Preserve October 2–4 fixture dates and include them in the required flows. Serializers must return YYYY-MM-DD and HH:mm, join agencyName and return null for an open shift's claimedBy. Never return password hashes. Claim updates must condition on `status = 'open'` atomically to prevent double claims.

Superseded planning direction (2026-10-15): custom JWT signing and application password comparison were proposed but never implemented. The user now requires Supabase authentication and authorization. Follow [004-auth-rbac-api/plan.md](../004-auth-rbac-api/plan.md): Supabase-issued JWTs, internal Auth UUID mapping to unchanged public IDs, user-scoped access, RLS and secured mutation functions. The original private-schema/service-role approach elsewhere in this plan remains historical baseline context; 002 records actual hosted setup and 004 plans its replacement for authenticated APIs.

## Planned changes and verification

| Requirements | Planned implementation | Planned verification |
| --- | --- | --- |
| R01–R02 | db/migrations/001_initial.sql and 002_trial_seed.sql | Apply and verify directly in dedicated Supabase; record actual results in tasks.md |
| R03, R09 | app/api/auth/login/route.ts; server-only auth and database access | Five logins, incorrect password, signed/expired/tampered JWT, no hashes in responses |
| R04–R09 | Route handlers below; transactions/conditional updates | Authenticated contract integration, agency-a/b isolation, concurrent claims and cancellation |
| R10 | Role-specific UI and specified minimal views | Real-flow smoke checks with required IDs, success/error states and responsive review |
| R11 | Private native-session preservation and English task summaries | Original record and checksums; redactions only on a reviewed copy |

## Future route map

| Method | Route handler | Contract |
| --- | --- | --- |
| POST | app/api/auth/login/route.ts | email/password → 200 token + user; 401 Invalid email or password |
| GET | app/api/shifts/route.ts | Bearer token; all three shifts → 200 {shifts} |
| POST | app/api/shifts/route.ts | Agency only; role/date/startTime/endTime → 201 Shift; agencyId from verified identity |
| POST | app/api/shifts/[id]/claim/route.ts | Nurse token, empty body → 200 Shift; 403 Credential expired, cannot claim shift |
| POST | app/api/shifts/[id]/cancel/route.ts | reason no-show/advance → 200 Shift + cancellation {reason, previousNurseId} |
| GET | app/api/agencies/[agencyId]/shifts/route.ts | Own agency only → 200 {agencyId, shifts} |

Every error uses `{error: string}`. Every returned shift uses the full `Shift` type, including agency-scoped lists; the packet's abbreviated examples do not replace its explicit shared-shape requirement. Await dynamic params in this installed Next.js version and consult its bundled route-handler documentation before implementation.

## Development guidance

| Guide | Source / location | Use |
| --- | --- | --- |
| Next.js | node_modules/next/dist/docs + generated AGENTS.md rules | Conventions for installed Next.js 16.4.1 |
| Ponytail | Existing .cursor/rules/ponytail.mdc; Codex plugin reported by user | Smallest complete change, reuse and scope discipline |
| Supabase Postgres Best Practices | .agents/skills/supabase-postgres-best-practices/SKILL.md | Load before SQL/schema/RLS/connection changes; read pertinent references |
| Hallmark | .agents/skills/hallmark/SKILL.md | UI design and review only; preserve contracts, test IDs and approved functional scope |

These guides do not add application dependencies or connect Supabase. Sources, pinned revisions and file checksums are recorded in `.agents/skills-lock.json`. To update a skill, review a specific revision and update the registry; do not automatically track main during implementation.

Vercel retired the standalone next-best-practices skill in favor of version-matched bundled documentation; this project already uses that mechanism. Existing source reference: https://github.com/vercel-labs/next-skills . Do not use a historical copy to override installed conventions.

Preserve the user's existing Ponytail and secure-development Cursor rules. The Codex plugin was reported by the user but is not exposed in this chat; activation has not been verified. Read the repository rule as a shared fallback. No duplicate Ponytail skill remains.

Inherited security-rule references to organizacion_id and a patient portal are not ShiftPatch domain concepts. Scope agency operations through agencyId and preserve the cross-agency marketplace in R04. Do not introduce another domain model. User instructions and the challenge contracts take precedence over third-party guidance.

No third-party skill utilities or image-generation services have been executed/configured. Hallmark applies when UI work begins. Keep technical guidance in this plan, verification summaries in tasks.md and original evidence privately outside the repository, following constitution principle VI.

## Dependencies and limitations

Q01–Q03 are resolved for API implementation in [004-auth-rbac-api/spec.md](../004-auth-rbac-api/spec.md); resolve Q04 before related views/storage. Historical embedded SQL checks verified SQL, not hosted Supabase provisioning; subsequent hosted evidence is in 002. The historical build was blocked by Turbopack's local-port requirement in the sandbox.

No custom one-time scripts or additional SDD pipeline: Markdown, AGENTS and manual evidence cover this workflow. Only ordered migrations remain for the database; fixture loading is the second migration.
