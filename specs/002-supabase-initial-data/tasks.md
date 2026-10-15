# Supabase Connection and Initial Data — Tasks and Evidence

Specification: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Date: 2026-10-14

Specification and plan are approved. The hosted database has the baseline and the server helper reads the three shifts through the Data API. An anon-key HTTP request was not run because that key is not in the private env.

## Tasks

| ID | Requirements / criteria | Work and files | Dependencies | Status | Completion checks |
| --- | --- | --- | --- | --- | --- |
| T01 | R01 / AC01 | Identify the existing project and inspect migration state; record only non-secret identity | Q01,Q02 target access | Complete | Confirm dedicated target, current schema and applied migrations |
| T02 | R02,R03,R04 / AC02–AC05 | Apply missing 001/002 migrations in Supabase; verify exact data, bcrypt, constraints and fixture repeatability | T01 | Complete | Hosted 2/5/2/3 counts, all values, correct/wrong passwords, RLS and non-destructive fixture repetition |
| T03 | R06 / AC08–AC09 | Prepare/apply 003_server_read_access.sql and 004_expose_shiftpatch_api.sql; verify service_role grants and browser denial | T01,T02,Q02 | Grants verified; anon-key HTTP pending | Server SELECT works on agencies/shifts; user/hash reads, writes and anon/authenticated access denied |
| T04 | R05 / AC06–AC07 | Implement lib/server/db.ts with @supabase/supabase-js and placeholder config; verify the hosted read | T02,T03,Q02 | Complete | Actual helper reads all three exact shifts through the reused server client over HTTPS |
| T05 | R07,R08 / AC10–AC12 | Check safe bounded failures, type/lint, environment permitting build, and record completion evidence | T04 | Local checks passed; anon-key HTTP pending | No secret leaks, real check outcomes, native transcript status and accurate parent task update |

## Coverage

| Criterion | Responsible task | Current evidence |
| --- | --- | --- |
| AC01 | T01 | Project ref yalgrpojxhlaihouylta. Schema was absent before 001. Direct host is IPv6-only and had no route; admin SQL used the ca-central-1 session pooler |
| AC02 | T02 | 001 applied. Four tables, RLS enabled, pgcrypto functions are extensions.crypt and extensions.gen_salt. Constraints listed in the execution log |
| AC03 | T02 | Hosted counts 2/5/2/3 and the fixture fields matched the spec. Hashes were not printed |
| AC04 | T02 | A probe agency survived 002 and agency-a was restored. The probe was then deleted so the baseline stayed 2/5/2/3 |
| AC05 | T02 | Trial2026! matched all five hashes. A wrong password matched none. No plaintext password is stored |
| AC06 | T04 | readShifts() returned shift-1, shift-2 and shift-3 with the spec agency names, dates, HH:mm times, open/filled status and claimedBy null or nurse-1 |
| AC07 | T04 | The read used the project HTTPS API and the server secret key. The users request was denied as service_role. TLS verification was not disabled |
| AC08 | T03 | service_role can select agencies and shifts, cannot select users or insert, and bypasses RLS. anon and authenticated have no usage |
| AC09 | T03 | shiftpatch is exposed. SQL roles anon and authenticated are denied. Data API without a key returns 401, and service_role receives 403 on users. An anon-key request was not run |
| AC10 | T05 | Missing, blank, http, userinfo and spaced config throw "Supabase server configuration is invalid" with no secret in the message |
| AC11 | T05 | Invalid key returned "Shift read failed" in 608ms. With retries disabled, a bad certificate returned the same message in 492ms. Hosted success is not claimed |
| AC12 | T05 | typecheck, lint and build passed on Node v22.20.0. Parent T01 now records the hosted baseline. Native export is pending |

## Execution log

### 2026-10-14 — Specification preparation

- Reviewed constitution 1.2.0, the three templates, parent architecture/contracts, .env.example, package.json and both existing migrations.
- User confirmed the Supabase project already exists; no project reference or credential was supplied. No real environment file contents were read.
- Applied Supabase guidance for pooling, least privilege and RLS; consulted official Supabase and node-postgres documentation for planned connection behavior.
- Created spec.md, plan.md and tasks.md in English, preserving exact IDs, emails, names, dates, times and assignment.
- No hosted connection, SQL execution, dependency installation, schema change or application implementation occurred during specification preparation. T01–T05 remain pending.
- Native conversation is the original evidence. Post-turn private export is pending; this task log is a summary, not a complete transcript.

### 2026-10-14 — Approved connection change

- User approved the spec and plan, then required the official Supabase client instead of a direct Postgres driver. There is still one hosted database.
- Updated spec.md, plan.md and this task list before implementation. service_role bypasses RLS, so 003 will limit it with grants. Q03 is resolved. Q01 and Q02 remain open.
- No package was installed and no hosted SQL ran for this amendment. T01–T05 remain pending.
- Native conversation is the original evidence. Post-turn private export is pending; this entry is a summary.

### 2026-10-14 — Implementation

- Criteria: AC01–AC05 and AC08 passed in hosted SQL. AC10 and the failure half of AC11 passed locally. AC06, AC07 hosted identity, AC09 Data API call and AC12 parent update remain open.
- Files: db/migrations/003_server_read_access.sql, lib/server/db.ts, .env.example, package.json, package-lock.json, spec.md, plan.md, tasks.md.
- Installed @supabase/supabase-js 2.117.3 and server-only 0.0.1. Did not install pg. The application reads through the Supabase client.
- Target ref yalgrpojxhlaihouylta. Data API without a key returned HTTP 401. The direct database host has only an IPv6 address and returned "No route to host". Admin SQL used the session pooler aws-1-ca-central-1.pooler.supabase.com port 5432 as postgres. verify-full failed against the system CA, so that admin session used sslmode=require. The server client does not disable certificate checks.
- Before writes, shiftpatch was absent and pgcrypto already lived in extensions. Applied 001_initial.sql, 002_trial_seed.sql and 003_server_read_access.sql.
- Counts were 2/5/2/3. Agency, user, credential and shift fields matched the spec. All five hashes matched Trial2026!; a wrong password matched none; plaintext comparison was false. RLS is enabled on all four tables.
- Repeating 002 restored agency-a after a deliberate rename and kept probe-agency. That probe was deleted afterward. Shift count stayed 3.
- service_role is not superuser, bypasses RLS, and can select the two agencies and three shifts. Selecting users and inserting a shift were denied. anon and authenticated lack schema usage and were denied. authenticator has no pgrst.db_schemas setting, so shiftpatch is not exposed to the Data API yet.
- npm run typecheck, npm run lint and npm run build passed. Node is v22.20.0 while package engines ask for 24; npm warned EBADENGINE and the build still completed. No page imports the helper, so the browser flow was not exercised.
- SUPABASE_SECRET_KEY is not in the private env files. Hosted readShifts was not run. Parent 001 baseline was not marked complete.
- Native conversation is the original evidence. Post-turn private export is pending; this entry is a summary.

### 2026-10-14 — Hosted read

- Criteria: AC06 and AC07 passed. AC09 gained Data API exposure and a service_role denial on users. The anon-key request remains pending.
- Files: db/migrations/004_expose_shiftpatch_api.sql, spec.md, tasks.md, and the parent tasks.md status for T01.
- The owner had stored SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local. The first helper call failed because only public and graphql_public were exposed. Applied 004, which sets those schemas plus shiftpatch and reloads the API cache.
- readShifts() then returned the three exact Shift objects. A Data API read of shiftpatch.users with the server key returned 403. No secret was printed.
- Native conversation is the original evidence. Post-turn private export is pending; this entry is a summary.

Future entries must record date/task, criteria, changed files, executed checks, actual outcomes and private native-evidence completeness. Do not create custom scripts or a documentation directory.

Specification review passed: all three documents have filled template content, eight requirements and twelve acceptance criteria map to five tasks, exact fixtures match the parent specification, twenty-one local Markdown links resolve, and git diff --check passed. An initial coverage check flagged the compact R02–R04 task reference; it was expanded to explicit R02,R03,R04 IDs and the check passed. Application tests were not run for this documentation-only change.
