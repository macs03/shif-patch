# Supabase Authentication, Authorization and REST API — Tasks and Evidence

Specification: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Date: 2026-10-15

## Tasks

| ID | Requirements / criteria | Work and files | Dependencies | Status | Completion checks |
| --- | --- | --- | --- | --- | --- |
| T00 | R08 / planning delivery | Spec/plan/tasks, feature index and parent cross-references | None | Completed | Seven documents reviewed, 22 local links valid, AC01–AC19 covered, no new placeholders and whitespace checks clean |
| T01 | R01–R03 / AC01, AC03, AC05–AC06, AC14 | Inspect project/Auth; identity migration; provision/link five fixtures; safe profile permissions; .env.example | T00 | Implemented; verification partial | Exact mapped identities; Auth hashes; no profile escalation/hash reads |
| T02 | R01–R03,R07 / AC01–AC08 | lib/server/auth.ts, supabase.ts, login route and focused tests | T01 | Implemented; verification partial | Five logins; exact 401; token failures; mapped roles only; no session sharing |
| T03 | R03–R07 / AC10–AC17 | Permission/function migration and caller-scoped db.ts | T01 | Implemented; verification partial | Direct hosted grants/policy/RPC checks; atomic transitions and inclusive Bogota expiry |
| T04 | R02–R04,R06–R07 / AC04–AC11, AC15–AC17 | List/create/own-agency handlers and strict request schemas | T02, T03 | Implemented; verification partial | Full responses, role/ownership denial and input validation |
| T05 | R02–R03,R05–R07 / AC04–AC08, AC12–AC17 | Claim/cancel handlers and focused tests | T02, T03 | Implemented; verification partial | Expired nurse denied; claimant/own-agency cancellation only; conflicts and both reasons |
| T06 | R08 / AC18 | Complete API role matrix, live token/RLS checks, opt-in mutation setup, races and HTTP routing smoke | T04, T05 | Verification partial | Six contracts, bypass denial, concurrent transitions and stable fixtures |
| T07 | R08 / AC19 | Application checks, diff/security review, evidence and parent task references | T06 | Verification partial | Actual tests, typecheck/lint, Node 24 build and hosted evidence; limits recorded |

T00 is documentation delivery. Implementation and hosted checks through 2026-10-15 are in the execution log. Public signup disable was shown by the user but not re-read through the API; the Node 24 build and broader verification matrix remain open. T01–T05 are implemented with partial verification; T06–T07 have partial verification. None is newly certified complete by this status correction.

## Coverage

| Criteria | Responsible tasks | Current evidence |
| --- | --- | --- |
| AC01–AC03 | T01, T02 | Five mapped logins and generic invalid-credential failures passed in the recorded hosted suite; full identity/grant audit still pending |
| AC04–AC08 | T02, T04, T05 | Route authorization implemented; hosted tampered token and role/ownership denials recorded; complete negative-token matrix not newly verified |
| AC09 | T04 | Full baseline list passed in recorded hosted checks |
| AC10–AC11 | T03, T04 | Create and agency isolation passed in recorded hosted checks |
| AC12–AC13 | T03, T05 | Expired nurse denied; both cancellations and same-nurse concurrent requests passed; distinct-nurse browser race pending |
| AC14 | T01, T03, T06 | RLS/grant implementation exists; complete direct-provider bypass checks remain unverified in this summary |
| AC15–AC17 | T03–T05 | Validation/ownership/conflict implementation exists; recorded hosted suite covers selected cases, not the full matrix |
| AC18 | T06 | Hosted Jest 3 suites / 4 tests passed historically; real HTTP/browser closure planned in 007 |
| AC19 | T07 | Typecheck/lint and Node 22 build passed historically; Node 24/full delivery checks pending |

## Execution log

### 2026-10-15 — T00 planning

- Actual agent: primary Codex agent only; no delegation or separate reviewer agent.
- Reviewed clean initial Git status, constitution 1.2.0, templates, parent feature documents, hosted setup and harness documents, repository rules, schemas/types/helper, migrations 001–004, package/Jest configuration and installed Next.js route docs.
- Applied Supabase skill references for RLS, least privilege and short transactions; consulted official Supabase authentication/mapping/RLS sources. No external service modified.
- User explicitly confirmed cancellation by claiming nurse or owning agency, admin read-only; credentials valid through expiry date in America/Bogota. Recorded in spec and verification plan.
- Decision: Supabase-issued JWTs, UUID-to-public-ID mapping, user-scoped reads and secured transactional writes, existing Jest/Zod/SDK. Unimplemented parent custom-JWT direction is superseded; historical hosted evidence retained.
- Created three documents from repository templates and updated related feature references. Initial combined patch failed validation because it attempted delete/add on the same target; no content from that patch was applied. A server restart then interrupted the turn; inspected current files before continuing and replaced copied template content directly.
- Documentation validation: first inline check failed because it treated the README's intentional template-placeholder example as an unfilled feature placeholder. Corrected the check scope to new feature files; all seven reviewed documents and 22 local links passed, AC01–AC19 have definitions and responsible tasks, constitution versions match and no new template placeholders remain.
- Reviewed the complete tracked diff and all three new documents. `git diff --check` passed; separate `git diff --no-index --check /dev/null <new-file>` checks emitted no whitespace errors (their status 1 indicates new-file differences). Review also clarified that migration 005 supplies safe profile RLS/grants before login, while 007 adds marketplace/mutation permissions.
- Application tests, typecheck/lint, build and hosted checks not run: documentation-only scope; no implementation claimed.
- Evidence: native conversation contains prompts and tool calls/results. Complete private post-turn export pending; this summary does not replace or claim a complete transcript. No shared transcript copy/redaction performed; no environment values read or copied.
- Status: T00 completed; T01–T07 pending. Next step when implementation is requested: inspect hosted Auth settings and implement the fixture identity migration/provisioning sequence. No commits or publication performed.

### 2026-10-15 — Application checks and hosted route contracts

- `npm run typecheck` and `npm run lint` passed. `npm run build` passed on Node v22.20.0 (package engines ask for Node 24). The build listed the six API routes as dynamic. No EBADENGINE line appeared in that build log.
- The publishable value in `.env.local` was stored as `SUPABASE_SERVICE_ROLE_KEY`. It was renamed to `SUPABASE_PUBLISHABLE_KEY`. No secret values were printed.
- Hosted Jest, with `SHIFT_PATCH_HOSTED_MUTATIONS=1`: `auth-api`, `read-shifts` and `auth-mutations` — 3 suites, 4 tests, all passed. The user reran `SHIFT_PATCH_HOSTED_MUTATIONS=1 npm run test:integration` locally with the same result (3 suites, 4 tests, about 23.8 s). Five logins, wrong and unknown credentials, a tampered bearer token, cross-agency denial, nurse/admin create denial, nurse-2 credential denial, both cancellation reasons, and two concurrent claims (200 and 409). The created shift was deleted and the three fixture shifts matched afterward.
- Public signup was still enabled when last read from Auth settings. On 2026-10-15 the user showed the dashboard with "Allow new users to sign up" off and Email still enabled. That setting was not re-read from the Auth API after the screenshot. Node 24 was not available for the build. No commit.
