# Security and Code Quality Improvements — Plan

Specification: [spec.md](spec.md) · Date: 2026-10-19 · Status: Local hardening and readability changes implemented; deployed controls unverified

Reviewed constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0. Baseline: clean working tree at HEAD `36c62a2` before this planning session.

## Minimal technical decision

Use Ponytail full and existing server helpers/Jest/Zod. Prioritize reader cleanup, reliable audit failure handling and private cleanup observability. Keep JSON limit decisions, throttle semantics and direct-provider authorization questions separate from compatible internal corrections. Do not introduce a rate-limit library, database queue, monitoring vendor, custom capture utility or file scanner merely because a guide mentions it.

Skills consulted: repository Ponytail and secure-development rules; Supabase Postgres skill with least-privilege/RLS references for static migration review. Vercel/React guidance informs the maintainability candidates below, including avoiding unnecessary state; read pertinent rules before implementation. No visual change is proposed. Next.js guidance comes from installed `node_modules/next/dist/docs/`, especially Route Handlers and authentication; read pertinent guides again before implementation. No delegation.

## Finding register

Priorities are provisional engineering priorities, not CVSS scores. P2 = bounded reliability/security-hardening impact; P1 would require demonstrated serious unauthorized access or loss. No P1 exploit or cross-user data disclosure was demonstrated here.

| ID / priority | Evidence and location | Trigger and impact | Proposed disposition |
| --- | --- | --- | --- |
| S01 / P2 | `lib/server/http.ts:23`, `readJson` calls `request.text()` before parsing; callers are login/create/claim/cancel | Body is buffered without an application byte limit, even for public login. Local diagnostic accepted 128 KiB of whitespace plus `{}` before schema validation. Potential resource amplification; no load test or deployment-level DoS demonstrated | T04: decide the contract, then enforce an actual streaming byte bound at this shared boundary |
| S02 / P2 | `lib/server/credentials.ts:36`, `boundedBody` obtains a reader without cancel/finally/release | An over-limit chunk raises 413 but leaves the application reader locked and uncancelled. Reproduced with an isolated stream. Runtime/proxy cleanup is unknown | T01: cancel unread content and release lock without changing errors or upload limits |
| S03 / P2 | `lib/server/credentials.ts:150`, `removeObject` returns false; lines 203/216 ignore it; unreadable reconciliation also leaves cleanup unrecorded | Failed removal can retain private superseded/orphan documents without a server signal. No actual retained object observed | T03: observe failure/deferral safely; preserve successful finalization and reconciliation safety; no automatic cleanup job |
| S04 / P2 | `lib/server/db.ts:238`, `Array.isArray(data) ? data : []` | A malformed non-null RPC payload is serialized as successful empty audit history. Static control-flow finding, not an observed provider failure | T02: fail on unexpected envelope using existing generic error; retain valid arrays and establish null semantics |
| S05 / P2 | `lib/server/auth.ts:23`, `loginFailure`, and password sign-in at line 98 | A provider error with status 429 and its usual rate-limit code falls through to generic 500. The code has no application throttle; actual edge/provider protection not inspected | T05: map the control chain and decide public semantics before implementation. Do not call absence of an application limiter proof of unprotected login |
| V01 / assessment priority P2 | `db/migrations/008_credentials.sql:62` grants own-prefix Storage insert; line 379 grants authenticated finalization. RPC checks owner/path/date/metadata; file bytes are inspected only by `saveCredential` | Direct authenticated provider calls may bypass Next.js file-signature/filename checks. Static trust-boundary discrepancy; no hosted bypass reproduced, no foreign-file access or execution demonstrated | T06: assess exact contract and deployed controls. Any changed privileges/trusted upload architecture requires a separate approved design |

References above identify current baseline lines; refresh locations before implementing. S01/S02 have bounded local diagnostics. S03–S05 are confirmed code paths with conditional operational impact. V01 remains a verification question, not a confirmed deployed vulnerability. None of these findings justifies changing credential eligibility, which is explicitly self-declared demo eligibility rather than license verification.

## Code-quality candidates — R07

These are P3 maintainability candidates, not confirmed runtime defects. Preserve the no-breaking-change and strict-necessity rules from 008. Before implementing, refresh callers/readers and record the concrete benefit versus leaving the code unchanged. No new generic form/session framework, dependency or broad component split.

| ID / task | Current code evidence | Smallest candidate change | Required verification |
| --- | --- | --- | --- |
| C01 / T08 | `app/components/CreateShiftForm.tsx`, `validate` and submit handler: field checks and schema validation precede `onSubmit(value as CreateShiftRequest)`, discarding Zod's parsed value | Carry the successful parse result to `onSubmit` so types follow runtime validation. Preserve custom per-field messages; do not replace them with generic schema errors or parse repeatedly through a new wrapper | Existing invalid/valid create cases, impossible dates, equal times, overnight input and pending/locked behavior; new focused test only if current coverage misses an affected branch |
| C02 / T09 | `app/components/ShiftPatchApp.tsx`, `CredentialState.status`: assigned in initialization, read/error/save and resets; repository search found no `credential.status` reader. The form consumes `view`, `error` and `credentialPending` | Remove the unused property and corresponding assignments if a refreshed reader search confirms it remains unused and the maintenance benefit is justified. Keep independent save-pending state, read counters and epoch protection | Typecheck, existing credential loading/error/save and late-response/session regressions. Do not remove refs merely because React state has a similar name; refs also prevent synchronous duplicate actions |
| C03 / T10 | `app/components/ShiftPatchApp.tsx`, `expire` and `signOut`: duplicate request invalidation and clearing of session, form, list, credential/admin and lock state | Assess one small shared reset in the existing component, keeping expired-session and explicit-sign-out notices in their respective callers. No configurable reset framework or unrelated hook extraction | Existing sign-out, protected 401, stale-response and cross-user-state tests; add a focused case only for an uncovered reset invariant. Preserve callback stability and effect dependencies |

Suggested candidate order after compatible hardening: T08 first; T09/T10 only when their necessity assessment supports a change. A P3 candidate may be explicitly deferred with a reason. Do not present their existence as proof that the current business flow is broken.

## Compatible correction design

1. **T01 / R01:** add cleanup around the existing upload-reader lifecycle. Cancel on early rejection and release in all paths, retaining the original error if cancel/release fails. Preserve the 2 MiB file and existing multipart-body limits. Test normal completion, oversize without Content-Length, read failure and cleanup failure. Avoid extracting a generic request framework.
2. **T02 / R02:** validate the audit RPC envelope before mapping. Non-null non-arrays fail with the existing `500 Internal server error`; valid rows still use the current response schema. Verify actual RPC empty/null semantics first. Test array/empty array/object/scalar/null and existing forbidden/error behavior through the real route with mocked provider boundaries.
3. **T03 / R03:** inspect both object-removal results and unreconciled finalization. Emit a minimal structured server warning using fixed event/reason codes and no user/document/path/token/provider-error content. Keep successful committed uploads successful if best-effort cleanup fails, and never remove a possibly active object. Cover superseded delete failure, failed finalization/orphan removal failure and unreadable reconciliation. Record that observability does not itself remove retained files; any private manual cleanup must recheck active metadata and be separately scoped.

## Decisions and verification work

### Concrete Q01/Q02 implementation — authorized scope clarification

The user clarified on 2026-10-19 that functional flows/business rules must remain intact, while API/frontend code and error behavior may improve. Q01/Q02 below are authorized. Preserve the original planning paragraphs as history; this resolution supersedes their decision gates for these two items only.

- Q01: cap JSON request bodies at 65,536 bytes (64 KiB), including whitespace and multibyte content, across the existing `readJson` callers. This is a project choice with ample headroom for the current short form payloads, not an OWASP-mandated number. Reject larger bodies with `413 {error:"Request body too large"}`; preserve current empty-body, JSON and schema behavior below the limit. Count streamed bytes even when Content-Length is absent or understated; cancel unread input and release the reader without masking the primary error. Do not apply this JSON cap to the separately bounded multipart credential upload.
- Q02: translate upstream Auth status 429 at password login into `429 {error:"Too many requests. Try again later."}` before generic error classification. Keep credential failures generic 401. Preserve the existing error shape and no-store responses; do not invent a Retry-After duration, add automatic retries, introduce an application limiter or forward client IP headers.
- Proposed files: `lib/server/http.ts`, `lib/server/auth.ts`, focused route/unit tests, and affected 004/009 contract documents. The current client already parses `{error:string}` and can display these failures; verify retry usability in the existing UI harness without changing successful login/session behavior.
- Required tests after resolution: below/exactly/above byte limit, UTF-8 byte counting, misleading/missing Content-Length, stream cleanup/failure, no provider/mutation calls after rejection, empty claim bodies and normal requests; upstream 429 generic response with no raw provider details plus unchanged invalid-credential handling. Run unit/UI, typecheck and lint under Node 24; record build/environment outcome separately.

Implement shared bounded reading in the existing HTTP helper and reuse it for the already bounded credential upload, preserving that upload's exact limits/messages and cleanup behavior. Reuse native TextDecoder and current Zod schemas. Q03/Q04 require their own evidence and design and are not resolved by this change.

React readability scope: share the exact reset operations already duplicated by `expire` and `signOut` in a stable component-local callback, leaving each caller's notice explicit; remove the now-redundant credential error-state conditional left by T09. Keep refs, request tickets, effect dependencies and all reset behavior. This reopens T10 under the clarified request to improve readability; no global state library or generic hook. Existing session/401/stale-response tests plus a login-throttle/retry UI test verify preserved flows. No visual redesign.

4. **T04 / R04:** implement the resolved 64 KiB JSON limit at the shared reader, counting actual bytes rather than trusting Content-Length. Preserve ordinary schemas/empty claim behavior and no-write-on-rejection. This is explicitly authorized input hardening, not a pure refactor. Multipart uploads retain their independent limit and error text.
5. **T05 / R04–R05:** translate provider password-login 429 to the resolved generic response. Configured Supabase/edge limits and server-proxy behavior remain unverified without deployed access. Supabase already documents Auth rate limiting and 429, with IP-based behavior; do not assume the proxy retains end-user IP identity. Do not forward arbitrary client IP headers, add secret credentials, guess retry timing or add a per-process limiter. This task improves error handling, not deployed abuse protection.
6. **T06 / R05:** compare Next.js validation with Storage/RPC grants and deployed policies read-only first. Document whether content validation is intentionally route-only and assess own-prefix direct uploads/finalization, active-object deletion and metadata consistency. Do not claim a bypass from a policy listing alone. If a live probe is necessary, prepare a separate isolated, fixture-safe procedure and obtain authorization before any upload/mutation. No new project, credentials, migrations or permission changes in this planning request.

## Authorized regression follow-up — T11 / AC01, AC03, AC07–AC08

Review of delivered code found no further justified production refactor within the resolved scope. Add a route-level test for a committed credential whose finalize response is lost: the follow-up read returns the newly uploaded object, so the route returns its public metadata with 200 and never calls removal. Also assert that a normal valid multipart upload releases its reader. Reuse the existing mocked provider boundary and Jest harness; no database or hosted writes. Preserve Q01–Q04 and T10 deferral. Run the baseline and updated unit/UI suites, typecheck and lint; the production build already recorded for the same application changes is historical, not rerun evidence for this test-only follow-up.

## Constitution review

| Principle | Application | Exception |
| --- | --- | --- |
| I | Criteria and decisions precede future implementation | None |
| II | Preserve exact fixtures/business/API contracts; new request/status rules gated | None |
| III | Existing helpers, tests and dependencies; smallest evidenced corrections | None |
| IV | Review all exposed boundaries; no secrets or private identifiers in evidence/logging | None |
| V | Each task maps to findings/criteria and actual verification | None |
| VI | Native transcripts/private post-turn export; summaries are not originals | None |
| VII | Constitution 1.2.0 retained | None |

## Planned verification and sequence

Each compatible task first gets a small regression test against current behavior, then a focused implementation and the relevant unit/UI suites. Run sequentially on installed Node 24: `npm run typecheck`, `npm run lint`, `npm test -- --selectProjects unit --selectProjects ui --runInBand`, and `npm run build`; do not run default/hosted mutation suites. Record environmental build failures honestly; 008 recorded a Turbopack port-permission failure despite escalation. No build workaround is part of this work.

Sequence: T01–T03 and T08–T09 are delivered. User clarification resolved T04/T05 and reopened T10 for targeted readability; implement and verify those without altering business flows. T06 remains an assessment with Q03/Q04 open. T07 consolidates checks and source/spec consistency; it cannot certify hosted security. Review diff, documentation links and secret exposure without printing secret values. No blanket claim that nothing can break.

## Primary references checked on 2026-10-19

- [OWASP REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html): enforce suitable request-size bounds; this supports S01 hardening, not a claim of exploitable production DoS.
- [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html): validate content, restrict storage and bound uploads; signatures alone do not prove document safety.
- [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits): provider throttling, 429 and proxy/IP considerations; deployed settings remain unknown here.
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control) and [database functions](https://supabase.com/docs/guides/database/functions): provider APIs are governed by policies/function privileges; route-only validation does not establish enforcement on those paths.
