# Supabase Authentication, Authorization and REST API — Plan

Specification: [spec.md](spec.md) · Date: 2026-10-15 · Status: Planned; implementation pending

Reviewed constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0. Parent tasks: 001-shiftpatch/T02–T06. Existing hosted baseline: 002-supabase-initial-data. Existing test harness: 003-test-harness.

## Minimal technical decision

Use installed `@supabase/supabase-js` for email/password login and Supabase-issued access JWTs. Use verified user-scoped requests, RLS and narrowly scoped transactional database functions for authorization. No custom JWT signer, bcrypt runtime dependency, ORM, SSR-cookie package or new test runner is needed. This supersedes the unimplemented custom-JWT parent direction at the user's request.

Keep App Router handlers thin: authenticate, authorize, validate, call server-only data operations, serialize the contract. Reuse Jest, Zod and existing domain types. Await dynamic params, as required by installed Next.js docs. Keep responses uncached and return `Cache-Control: no-store`; never share identity/session state across requests.

## Constitution review

| Principle | Application | Authorized exception / source |
| --- | --- | --- |
| I. Spec before code | Spec, plan and tasks precede implementation; cancellation/expiry resolved | None |
| II. Exact contracts | Map Auth UUID to unchanged public text ID; preserve fixture values and packet messages | None |
| III. Minimal scope | Existing SDK, Zod, Jest and Next.js; no UI/custom utilities | None |
| IV. Security | User-scoped clients, verified identity, RLS, protected mappings and secured mutation functions | Authenticated database access replaces 002's deny-all authenticated-role design under this explicit user request |
| V. Verification | Automated route contracts plus real hosted token/RLS/RPC tests | None |
| VI. Evidence | Manual native transcript/private export; actual outcomes in tasks.md | None |
| VII. Governance | Constitution 1.2.0; no amendment | None |

## Authentication and identity

1. Inspect the dedicated project's Auth settings and account state before writes. Provision the five exact fixture emails/passwords using Supabase's supported dashboard user-management flow with confirmed emails, so no verification flow is needed. Disable public signup for this trial. Do not write directly into managed Auth tables or create a provisioning utility. Application SQL stays in ordered migrations.
2. Add nullable `auth_user_id uuid UNIQUE REFERENCES auth.users(id)` to `shiftpatch.users`. After provisioning, a subsequent mapping migration links the five existing users by exact email and asserts complete, unique matches. Preserve all public IDs and existing foreign keys. Unmapped Auth users get no application permissions.
3. Retain the legacy bcrypt column during this feature to preserve migration 002 repeatability. Never use it for authentication, grant it to authenticated users or synchronize it with Auth. Supabase Auth becomes the only password verifier and owns its hashes. Removal is separate cleanup; verify the legacy column remains inaccessible.
4. Login uses `auth.signInWithPassword({email,password})` on a fresh, nonpersistent client with the project publishable key. Return `session.access_token` as `token`; load the mapped safe profile using that token and return only application ID/name/role. Never return refresh tokens. Normalize credential failures to the packet's 401; report detected provider unavailability separately without leaking details.
5. Every protected request extracts one Bearer token and calls `auth.getUser(token)` against the configured project for server-confirmed identity, rejecting expired tokens. Resolve the application profile by the verified UUID with the caller's token. Never authorize from decoded payloads, `getSession()`, editable `user_metadata` or body-supplied identity.
6. JWT `sub` remains the internal UUID and Postgres role stays `authenticated`. Application nurse/agency/admin role and agency_id come from the protected mapping. Do not overwrite Supabase's database role claim. Agency identity derives from the verified subject, never client input.
7. Create a fresh Data API client per request using the publishable key and caller Authorization header. Disable persistence, auto-refresh and URL detection. Never mutate a shared client's session/headers or use the existing privileged singleton for a protected endpoint.

Add placeholder-only `SUPABASE_PUBLISHABLE_KEY` to `.env.example`; retain `SUPABASE_URL`. Migrate `lib/server/db.ts` and its integration test to caller-token access. Remove the runtime dependency on `SUPABASE_SECRET_KEY` after migrating callers; administrative secrets are for private administration only. No `JWT_SECRET` is needed. Do not print existing env values.

## Database permissions and atomicity

Preserve deployed migrations 001–004. Proposed sequence, checked against current numbering at implementation:

- `005_auth_identity.sql`: mapping column, supporting constraints/index, safe own-profile column grants/RLS and authenticated schema usage needed by login.
- `006_auth_fixture_mapping.sql`: link provisioned accounts; abort on missing/duplicate fixture identity.
- `007_auth_permissions.sql`: marketplace read policies/grants, secured mutation functions and remaining privilege revocations.

No SQL is authored/applied during this planning session. Provision accounts between 005 and 006; applying migrations alone cannot create usable Auth identities.

| Resource | Read access | Write access |
| --- | --- | --- |
| users | Own mapped row through RLS; column-level SELECT only on id/name/role/agency_id/auth_user_id | No authenticated insert/update/delete, role or mapping edits |
| agencies | Mapped callers read ID/name for marketplace joins | No application writes |
| shifts | All mapped roles read full cross-agency marketplace | No direct insert/update/delete; secured RPCs only |
| nurse_credentials | No direct authenticated access | Functions read only for eligibility; no client writes |

Anonymous access remains denied. Own-profile RLS uses `auth.uid() = auth_user_id` without recursive self-queries; marketplace policies can check the caller's own visible mapping. Merely being `authenticated` is insufficient. Never grant table-wide users SELECT over safe column grants. Inspect view/function privileges and policy execution plans. Revoke old service-role read grants after migrating the helper; project-owner administration remains outside request handling.

Use three small transactional RPCs for create/claim/cancel because separate Data API calls cannot share one transaction. Where SECURITY DEFINER is necessary, use fixed empty search_path, fully qualified objects, no dynamic SQL, explicit auth.uid mapping/role/ownership checks and minimum safe return columns. Revoke PUBLIC execute defaults in the same transaction; grant EXECUTE only to authenticated. Unmapped users must still fail inside the functions. RLS protects normal reads; elevated functions independently enforce all mutation rules and require a privileged-code review.

- Create derives agency from the caller mapping, accepts only role/date/start/end, validates date/time rules, generates a collision-resistant text ID, inserts open/null state and returns the full shift.
- Claim verifies nurse, locks the target row, checks credential validity using trusted current date in America/Bogota, requires open state and atomically sets filled/claimant. Do not accept caller-supplied nurse or evaluation date. Credentials remain valid on expiresOn. No network work inside the transaction.
- Cancel locks the row, permits only its current claimant or owning agency, requires filled state, captures previous claimant, then reopens and clears claimedBy atomically. Both reasons work for both permitted roles. Admin remains read-only. No cancelled state/history feature is added.

RPCs must validate input even when Next.js is bypassed. Use controlled database error identifiers mapped to the spec's HTTP errors; never return raw SQL/PostgREST details. Concurrent claims/cancellations must produce valid serial transitions without partial updates.

Own-agency handler checks role and path equality before querying, then filters agency_id. Marketplace RLS intentionally permits cross-agency reads: the private management endpoint's role/path restriction is additionally enforced and tested at HTTP level.

## Planned changes

| Requirements / criteria | Files/components | Change |
| --- | --- | --- |
| R01–R03 / AC01, AC03, AC05–AC06, AC14 | db/migrations/005–007; Supabase Auth dashboard | Provision/link exact fixtures, safe profile reads, policies and mutation functions |
| R01–R03,R07 / AC01–AC09 | lib/server/auth.ts; lib/server/supabase.ts; .env.example | Login service, JWT verification, request clients, small role/ownership helpers |
| R04–R06 / AC10–AC16 | lib/server/db.ts | Replace privileged reads with caller context; reuse full-shift serialization and add RPC operations |
| R07 / AC17 | lib/domain/schemas.ts | Strict request schemas, real calendar dates, unequal times, path validation and empty claim-body checks |
| R01–R07 | app/api/auth/login/route.ts; app/api/shifts/route.ts | Login, list and create |
| R02–R07 | app/api/shifts/[id]/claim/route.ts; app/api/shifts/[id]/cancel/route.ts; app/api/agencies/[agencyId]/shifts/route.ts | Claim, cancel and own-agency list; await params |
| R06–R07 / AC16–AC17 | lib/server/http.ts if shared handling warrants it | Small error-response helper and explicit unsupported-method responses |
| R08 / AC18–AC19 | __tests__/unit; __tests__/integration; existing Jest setup as needed | API contracts, role matrix, hosted token/RLS/RPC tests; migrate existing read test |

## Planned verification

| Criteria | Check | Expected outcome |
| --- | --- | --- |
| AC01–AC06 | Five real logins; wrong/unknown credentials; missing/malformed/tampered/expired/wrong-project token; unmapped user | Exact shapes/statuses; no credential/token output; no implicit privileges |
| AC07–AC11 | All-role route matrix, both agency identities, spoofed ownership/role fields | Expected success/denial; no write on denied operation |
| AC12–AC13 | Fixed-clock expiry tests before/on/after boundary and around Bogota midnight; two eligible claimants; concurrent/repeated transitions; both cancellation reasons and all ownership combinations | Inclusive expiry, at most one claim per open state, valid serial outcomes and correct previousNurseId |
| AC14 | Hosted catalog/grant inspection plus real anon and user-token Data API/RPC calls | Denied hashes/profile escalation/raw writes/forbidden RPCs; permitted operations work |
| AC15–AC17 | Existing response schemas plus exact-key assertions; malformed JSON, impossible dates, equal/invalid times, unknown fields, wrong reason/body | Full contract and exact errors; overnight shifts accepted |
| AC18 | Offline handler tests, hosted handler/provider integration and actual local HTTP smoke for six paths | API behavior and Next route/param integration proven separately from mocks |
| AC19 | npm run test:unit; npm run test:integration; npm test; npm run typecheck; npm run lint; npm run build on Node 24 | Actual results/failures recorded in tasks.md |

Offline tests call real handlers with Request/Response and mock only provider/data boundaries. Hosted tests must use real Supabase authentication and user-scoped policies/functions; mocks cannot prove JWT validation/RLS. Use existing Jest rather than inherited generic Vitest advice; no new browser framework for this API-only feature.

Hosted mutation tests require explicit dedicated-project configuration and opt-in, never silently mutate in ordinary `npm test`. Create unique test shifts, serialize affected suites and clean up only known test-owned data through private administration. Do not replay migration 002 to erase unrelated work. A genuine two-eligible-nurses race needs a temporary dedicated-test identity/credential provisioned through supported administration and a reviewed migration; do not alter nurse-2's expired fixture. This is test data, not a sixth sample login. Missing hosted configuration is skipped/pending, never security acceptance passed. Keep normal fixture reads stable and adapt the existing secret-key read test.

## Guidance and sources

- Repository Ponytail and secure-development rules apply; no Ponytail tool is exposed here, so use the repository fallback. No delegation is authorized or used.
- Applied `.agents/skills/supabase-postgres-best-practices/SKILL.md` and references for RLS, least privilege and short transactions. Read schema/index references before SQL authoring.
- Installed Next.js guides reviewed: `01-app/01-getting-started/15-route-handlers.md` and `01-app/03-api-reference/03-file-conventions/route.md` under `node_modules/next/dist/docs/`. Read its authentication guide before implementation.
- Official Supabase docs checked 2026-10-15: [password login](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [server identity verification](https://supabase.com/docs/reference/javascript/auth-getuser), [user mapping](https://supabase.com/docs/guides/auth/managing-user-data), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Provider APIs and security boundaries follow these sources; mapping/RPC/file layout are project design decisions.

## Dependencies and limitations

Cancellation and timezone decisions are resolved. Current project Auth settings, publishable key and account state were not inspected in this planning session. Earlier hosted evidence in 002 does not establish Auth readiness. Existing grants/helper require migration; enabling Auth alone does not implement authorization. No dependencies or paid services are added.

## Implementation sequence

Hardening follow-up (2026-10-19): [009](../009-security-hardening/plan.md) owns the user-authorized 64 KiB JSON request bound and generic upstream password-login 429. Its shared server reader also preserves multipart upload bounds. Existing success payloads, roles and business flows remain intact; actual current checks and limitations are recorded in 009/tasks.md rather than inferred from this historical implementation plan.

1. Confirm hosted target/settings; add identity column, provision/link exact accounts and verify safe profile access.
2. Implement request-scoped auth, verification and login; test all sample identities and token failures.
3. Add read policies and secured mutation functions; verify directly in Supabase.
4. Implement list/create/claim/cancel/agency handlers, strict input validation and shared serialization.
5. Complete offline and hosted contract/security/concurrency checks plus HTTP smoke.
6. Run required checks, review diff and record actual results/evidence in tasks.md. Do not commit or publish without a request.
