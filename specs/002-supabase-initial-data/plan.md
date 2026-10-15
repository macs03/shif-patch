# Supabase Connection and Initial Data — Plan

Specification: [spec.md](spec.md) · Date: 2026-10-14 · Status: Approved; implementation pending

Reviewed constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0.

## Minimal technical decision

Keep the existing private PostgreSQL schema and SQL migrations in the dedicated Supabase project. Apply them in the Supabase SQL Editor after confirming project identity and migration state. Do not create a local database, a second database, a direct Postgres driver, a migration wrapper, an ORM, a health endpoint or UI.

Use `@supabase/supabase-js` on the server only, with `server-only` as the import guard. The user authorized this library on 2026-10-14 and rejected `pg`. The client calls the project HTTPS Data API with `SUPABASE_URL` and a server secret key. It does not use `DATABASE_URL` or a database password.

## Constitution review

| Principle | Application | Authorized exception |
| --- | --- | --- |
| I. Spec before code | Connection approach amended in the spec before implementation | None |
| II. Exact contracts | Reuse and verify parent fixtures, IDs, bcrypt behavior, local dates/times and full Shift shape | None |
| III. Minimal scope | Existing Next.js stack, ordered Supabase migrations, one server Supabase client | None |
| IV. Security | Private server key, HTTPS, grants limited to agencies/shifts, browser roles denied | service_role bypasses RLS. Table grants, not policies, are the server access boundary. Accepted because the user required the Supabase client |
| V. Verification | Hosted SQL checks plus actual server-side read and controlled-failure checks | None |
| VI. Evidence | Record checks in tasks.md; native transcripts remain private outside the repository | None |
| VII. Governance | Constitution 1.2.0 reviewed; this feature does not amend it | None |

## Planned changes

| Requirements / criteria | Files or components | Required change |
| --- | --- | --- |
| R01–R04 / AC01–AC05 | db/migrations/001_initial.sql, 002_trial_seed.sql; Supabase SQL Editor | Inspect target/state; apply only missing migrations; verify schema and fixtures |
| R06 / AC08–AC09 | db/migrations/003_server_read_access.sql (planned); Data API exposed schemas | Grant service_role usage and SELECT only on agencies/shifts; expose shiftpatch to the Data API; no secret literals |
| R05,R07 / AC06–AC07,AC10–AC11 | lib/server/db.ts (planned), .env.example, package.json/package-lock.json | Server-only Supabase client, explicit projection, sanitized failure handling |
| R08 / AC12 | tasks.md | Record project identity, applied migrations, actual checks and evidence availability |

Preserve existing migrations once applied. Add a later migration for any required change rather than rewriting deployed history.

## Data, connection and security

### Ordered hosted setup

1. Inspect the selected project, existing schema, table counts and prior migration status. Do not reset or drop an unknown existing schema. Do not open a direct Postgres session from the application.
2. Apply 001_initial.sql once if absent, then 002_trial_seed.sql. Check where pgcrypto lives before loading fixtures; if its functions are elsewhere, resolve compatibility before execution.
3. Verify the exact 2/5/2/3 counts on a fresh dedicated baseline, all field values, password validity, constraints and RLS. Repeat only the fixture migration to verify its documented reset behavior.
4. Apply 003_server_read_access.sql and expose the `shiftpatch` schema in the Data API settings before testing the server client. Record every applied migration in tasks.md. There is no automatic migration runner.

### Server identity

The Supabase server client authenticates as `service_role`. That role bypasses RLS on hosted Supabase, so policies cannot hide rows from it. Limit it with grants:

- `USAGE` on schema `shiftpatch`
- `SELECT` on `shiftpatch.agencies` and `shiftpatch.shifts`
- no `SELECT` on `shiftpatch.users` or `shiftpatch.nurse_credentials`
- no insert, update or delete
- no grants and no policies for `anon` or `authenticated`

Do not create a separate login role or store a password in a migration. The owner places the project URL and server secret key in `.env.local`. Never put that key in a migration, spec, task log, client component or `NEXT_PUBLIC_` variable. Owner credentials stay for SQL Editor administration and private password checks.

Expose `shiftpatch` in the project's Data API schema list so PostgREST can serve the granted tables. Browser keys still fail closed because they have no grants.

### Server client

Create one Supabase client in `lib/server/db.ts`, guarded by `import "server-only"`. Disable session persistence and token refresh. Pass `db.schema: "shiftpatch"`. Reuse that client for the server process.

Read with an explicit column list and an embedded agencies relation. Map the response to the Shift shape: `id`, `agencyId`, `agencyName`, `role`, `date`, `startTime`, `endTime`, `status`, `claimedBy`. Format `date` as `YYYY-MM-DD` and times as `HH:mm` from the API strings, without JavaScript timezone conversion. Sort by id. Do not select users or password hashes.

Missing or malformed `SUPABASE_URL` or server secret key throws a controlled configuration error that does not include the key or a stack for client display. Network, auth and TLS failures stay bounded and secret-free. Do not disable certificate validation.

`.env.example` lists `SUPABASE_URL` and `SUPABASE_SECRET_KEY` with empty placeholders. `JWT_SECRET` stays deferred. `DATABASE_URL` is not an application setting for this feature.

## Planned verification

| Criteria | Check | Expected result | Evidence reference |
| --- | --- | --- | --- |
| AC01 | Confirm project and inspect migration state before writes | Known dedicated target and no unintended reset | T01 execution log |
| AC02–AC05 | Private SQL Editor checks of catalog, exact rows, constraints, bcrypt and deliberate fixture reload | Exact baseline and unchanged fixture semantics; no secrets/hashes printed | T02 execution log |
| AC08–AC09 | Inspect grants; read agencies/shifts as the server role; attempt user reads, writes and anon/authenticated reads | Server read works; user/hash reads, writes and browser roles denied | T03 execution log |
| AC06–AC07 | Invoke the helper in a server-side context and compare the three shifts | Three exact Shift objects from the hosted Data API over HTTPS | T04/T05 execution log |
| AC10–AC11 | Missing/malformed config and controlled auth or connectivity failure | Bounded errors without secrets; readiness not marked complete | T05 execution log |
| AC12 | Review evidence and task status; npm run typecheck/lint after code changes, build when the environment allows | Real outcomes recorded; environmental limits disclosed | T05 execution log |

Do not add a public diagnostics route or a one-off verification script. Historical local checks do not satisfy hosted criteria.

## Dependencies and limitations

Q01: project existence is confirmed; identity and schema state still need inspection. Q02: the server secret key and Data API exposure are still owner steps; do not ask for the key in chat. Q03 is resolved: install `@supabase/supabase-js` and `server-only` only. Do not install `pg`.

The earlier sandbox blocked Turbopack's local-port use. A blocked build remains a disclosed limitation, never a pass. No connection, grant or fixture load is claimed from this plan alone.

## Implementation sequence

1. T01: identify target and secure API access.
2. T02: apply missing baseline migrations and verify fixtures.
3. T03: grant server read access and expose the schema.
4. T04: implement the private Supabase client and verify the hosted read.
5. T05: verify failure cases, type/lint checks and evidence; update parent baseline status only when hosted criteria pass.
