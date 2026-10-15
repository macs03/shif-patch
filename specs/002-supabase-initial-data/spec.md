# Supabase Connection and Initial Data — Specification

Feature ID: 002-supabase-initial-data · Date: 2026-10-14 · Status: Approved; implementation pending

Source: the user's request to make the initial ShiftPatch data available in Supabase and prepare the Next.js server connection. The user confirmed a dedicated project already exists; its identity and access are not yet verified. Applicable constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0. Parent requirements: [001-shiftpatch/spec.md](../001-shiftpatch/spec.md), R01, R02 and R11.

## Problem and expected outcome

The repository has a schema migration and exact fixture migration, but no verified hosted database or application connection. Complete this feature when the dedicated Supabase database contains the required baseline and Next.js can read its three shifts through the official Supabase server client. There is one hosted database; the application does not open a direct Postgres connection.

## Scope

- Identify the existing dedicated project, inspect migration state, apply missing migrations and verify hosted data.
- Prepare a private project URL and server secret key, and a reusable server-only Supabase client over the project's HTTPS API.
- Give that server role only the read grants needed for this feature; keep browser roles denied.
- Record actual checks and pending access in tasks.md.
- Outside scope: a direct Postgres driver or pool, login/JWT implementation, shift endpoints/mutations, UI, uploads, deployment, Supabase Auth, ORM, custom scripts, new documentation folders and automated migration runners.

## Scenarios and acceptance criteria

| Criterion | Requirement | Given | When | Then |
| --- | --- | --- | --- | --- |
| AC01 | R01 | The user has an existing dedicated project | Its identity and current schema are inspected | Correct target and migration state are recorded without secrets; no unrelated database is changed |
| AC02 | R02 | Target is confirmed | Missing ordered migrations are applied | Four shiftpatch tables, references, constraints and RLS exist; pgcrypto functions used by fixtures resolve in the intended schema |
| AC03 | R03 | Schema is ready | Fixture migration completes | Agencies/users/credentials/shifts counts are 2/5/2/3 on the dedicated baseline, with every value in the tables below |
| AC04 | R03 | Trial IDs were previously loaded | Fixture migration is deliberately repeated | No duplicate IDs appear; required trial values are restored; unrelated records are not deleted |
| AC05 | R04 | Five seeded users exist | Passwords are checked privately in the database | Trial2026! validates for every user; a wrong password fails; no plaintext password is stored in users |
| AC06 | R05 | Private Supabase URL, server secret key and exposed read surface are present | The server-side helper reads agencies joined to shifts | It returns the three exact shifts with agency names, null/open assignment, YYYY-MM-DD dates and HH:mm times |
| AC07 | R05 | Server code creates the Supabase client | Readiness is checked | The call uses the project HTTPS API with certificate validation, the client is reused, and the request authenticates as the configured server role |
| AC08 | R06 | Server role grants are configured | Grants are inspected and read/denial checks run | service_role receives only USAGE on shiftpatch and SELECT on agencies/shifts; users, password hashes and mutations stay ungranted. This platform role bypasses RLS, so those grants are the access boundary |
| AC09 | R06 | anon/authenticated have no private-table policies or grants | They attempt Data API access | Private rows stay inaccessible; the server secret key never enters client code |
| AC10 | R07 | Supabase URL or server secret key is absent or malformed | Client initialization is attempted | Controlled configuration failure occurs; no key, URL credential or stack trace is exposed to the client |
| AC11 | R07 | Network, authentication or TLS fails | A read is attempted | A bounded failure is recorded without secrets; readiness stays pending and TLS verification is not disabled as a workaround |
| AC12 | R08 | Verification is performed | Task status is updated | Record target identity, applied migration filenames, real check outcomes and native evidence availability; never mark hosted readiness from prepared files or historical local tests |

## Requirements

| ID | Required behavior | Acceptance criteria |
| --- | --- | --- |
| R01 | Use the correct existing dedicated Supabase project and inspect prior migration state | AC01 |
| R02 | Create the required private schema using ordered migrations | AC02 |
| R03 | Load exact fixtures; deliberate repetition restores trial IDs without destructive resets | AC03, AC04 |
| R04 | Store bcrypt hashes and verify correct/incorrect trial passwords privately | AC05 |
| R05 | Provide a private Next.js Supabase server client and exact shift read | AC06, AC07 |
| R06 | Restrict server-role grants and deny browser access, keeping RLS enabled for browser roles | AC08, AC09 |
| R07 | Handle configuration/connectivity failures without leaking secrets or hanging indefinitely | AC10, AC11 |
| R08 | Preserve traceability and actual hosted verification evidence | AC12 |

## Contracts and exact fixtures

No new public HTTP contract or test ID is introduced. Readiness uses a private server-side execution context, not a public diagnostics endpoint. The read result follows the parent Shift shape: id, agencyId, agencyName, role, date, startTime, endTime, status, claimedBy.

Published trial password for all five users: `Trial2026!`. This fixture is not a database-role password, JWT secret or production credential.

| ID / role | Name | Email | Credential expiry |
| --- | --- | --- | --- |
| agency-a / agency | Sunrise Health Staffing | admin@sunrisehealth.example | — |
| agency-b / agency | Metro Care Partners | admin@metrocare.example | — |
| nurse-1 / nurse | Maria Lopez | maria.lopez@example.com | 2027-01-01 |
| nurse-2 / nurse | James Cook | james.cook@example.com | 2026-06-01 |
| admin-1 / admin | Alex Kim | alex.kim@example.com | — |

| Shift ID | Agency | Role | Date | Start | End | Status | claimedBy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| shift-1 | agency-a | RN | 2026-10-02 | 19:00 | 07:00 | open | null |
| shift-2 | agency-a | LPN | 2026-10-03 | 07:00 | 19:00 | filled | nurse-1 |
| shift-3 | agency-b | RN | 2026-10-04 | 19:00 | 07:00 | open | null |

Agency records use the corresponding IDs/names above. Credential rows belong to nurse-1 and nurse-2. Preserve facility-local values, including overnight shifts and past fixture dates. Bcrypt salts may differ after reloading; compare logical data and password validity, not hash byte equality.

## Open questions and assumptions

| ID | Question / assumption | Affected criteria | Resolution / source |
| --- | --- | --- | --- |
| Q01 | Which exact project is the target, and are migrations already applied? | AC01–AC05, AC08–AC09 | Resolved 2026-10-14: project ref yalgrpojxhlaihouylta. Schema was absent. Migrations 001, 002 and 003 were applied. Direct database host is IPv6-only and unreachable from this machine; admin SQL used the session pooler in ca-central-1 |
| Q02 | How will the owner provision the server secret key privately, and is the Data API reachable? | AC06–AC11 | Resolved 2026-10-14: the owner stored the server secret key in private env. The Data API is reachable and shiftpatch is exposed beside public and graphql_public |
| Q03 | Is the Supabase client library explicitly authorized? | AC06–AC11 | Resolved 2026-10-14: the user required @supabase/supabase-js and rejected a direct Postgres driver |

Assumption: use the existing private shiftpatch schema and database fixture users, not Supabase Auth. The server client uses the Data API as service_role. Resolve operational prerequisites before their dependent tasks.

## Delivery condition

All twelve acceptance criteria have actual evidence, the server helper can read the seeded hosted data, and private credentials remain outside Git/client code. Record unavoidable environmental limitations as pending; SELECT 1 alone and prepared migrations do not prove completion.

## Change history

| Date | Change | Reason / source |
| --- | --- | --- |
| 2026-10-14 | Initial feature specification | User requested a spec for the first hosted data load and Supabase connection |
| 2026-10-14 | Approved spec; replace the direct Postgres client with the Supabase server library | User approved the feature, then required one Supabase connection through its client library |
