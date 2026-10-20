# Harness and Guidance Synchronization — Plan

Specification: [spec.md](spec.md) · Date: 2026-10-19

Status: Documentation changes and checks complete; no application/config changes.

Reviewed constitution 1.2.0 at entry; proposed/current amendment 1.3.0. Initial Git tree clean at 73cf68c. Use Ponytail for minimal documentation changes; no runtime skill tool, dependency or delegation.

## Changes

1. Amend constitution III/V/VI and version history: explicit component ownership, shared UI confirmation/lifecycle, behavior-driven regressions and independent local/browser/hosted verification status. Align AGENTS with actual parent, renderAppView, role components, shared Dialog and safe Node 24 harness commands. Retain generated Next.js blocks exactly.
2. Correct 003 spec/plan stale implementation/env/runner claims; preserve original requirement IDs and dated evidence, append current guidance. Document ts-jest as the actual choice, not an assertion that next/jest does not exist. Explain three projects, mocks, state/async/dialog/security regression areas and hosted cleanup restriction.
3. Update README/spec index, MVP/UI/admin current summaries and 011/012 maintenance notes. Preserve original dated plans/constitution reviews, adding present amendments rather than globally replacing 1.2.0. Repair the broken 012 task table. Update templates to separate baseline/post-change and local/browser/hosted/build evidence.
4. Validate document links/anchors, placeholders and requirement coverage; compare generated AGENTS blocks to HEAD, verify diff whitespace and documentation-only scope. Do not rerun app suites for prose-only changes; refer to 012's recorded 84 tests/typecheck/lint as historical evidence.

## Engineering conventions

This is the agent harness's current technical reference, requested explicitly by the user. It records the implemented ShiftPatch patterns rather than adding another architecture. Preserve these boundaries when extending or refactoring the app; justify any required change in the selected feature spec/plan before implementation.

### Ownership and request path

| Boundary | Current owner | Responsibility / invariant |
| --- | --- | --- |
| Presentation | app/components role views, ShiftBoard, ShiftCard, RoleTabs and forms | Render typed data, own appropriate field/panel state, emit typed actions; no direct fetch, token/session props or database imports |
| Orchestration | ShiftPatchApp | Session/reset, notices, API calls, read epochs/tickets, abort controllers, synchronous pending/hold locks and mutation reconciliation |
| Selection | renderAppView | Pure signed-out/role JSX selection and chrome, no request/effect/router state or authorization |
| Transport | lib/client/api.ts | Same-origin requests, required Bearer, encoded path IDs, no-store, AbortSignal, validated response/error envelopes and uncertain-write semantics |
| Contracts | lib/domain/schemas.ts and types.ts | Shared strict request schemas, parsed values, inferred public types and response validation; keep local dates/hours and open/null invariant |
| HTTP | app/api/**/route.ts and lib/server/http.ts | Authentication entry, params/body validation, role/ownership checks, bounded bodies and exact safe HTTP contracts; reusable error/cache/method handling |
| Trusted data | lib/server/auth.ts, db.ts, credentials.ts, supabase.ts | Verified identity mapping, safe row serialization, user-scoped database/RPC access, upload/signature/metadata lifecycle and sanitized error translation |
| Persistence | Existing db/migrations and dedicated Supabase project | RLS/grants and atomic role/ownership/expiry/transition enforcement; SQL changes require Supabase guidance and direct verification |

```text
Role UI / form -> typed parent action -> lib/client/api
  -> App Router handler -> server-only auth/data -> user-scoped Supabase / RPC

Supabase / RPC -> safe serialization / HTTP response
  -> client schema check -> parent state -> view props
```

The response line describes existing data flow, not extra layers to build. UI confirmation is required before the existing shift mutation callback, but only the server/database authorizes the operation.

### Components, forms and state

- Use descriptive domain names and strict typed props/callbacks, existing module conventions and direct imports. Place definitions at module scope. Colocate prop types; reuse domain schemas/types instead of hand-maintained copies. Avoid broad any/casts/lint suppression as a substitute for correct boundaries.
- Extract a component for a real responsibility or repeated current use, not an arbitrary file size. Reuse existing RoleTabs, ShiftBoard, Dialog and forms before adding variants. No new framework, generic controller, global store, custom hook or memoization without a concrete need and authorized scope.
- Keep drafts/field errors and genuinely local panels with their owner; keep shared session/request protection in the parent. Derive filters/counts/display flags during rendering rather than synchronizing duplicate state in effects. Preserve keyed identity and conditional mounting/reset behavior.
- Forms validate input and pass the actual Zod parse result. The server repeats authoritative boundary validation; client validation is feedback only. Keep validation order/messages, accessible associations and current test IDs. Publish confirmation captures the validated request; dismissal preserves the draft.
- Mutations start from explicit user actions, never rendering or an effect. Effects synchronize initial reads or DOM lifecycle with correct dependencies and cleanup. Preserve aborts, epoch/read-ticket checks on success and error (including stale 401), synchronous locks and authoritative credential-save invalidation. Independent admin reads retain partial success rather than erasing useful data on one failure.
- Confirmation and publication compose the same Dialog shell. Keep description/title IDs, safe Cancel focus, close-event suppression under Strict Mode, native cancellation/backdrop handling and nested-event isolation. Recheck current pending/eligibility before accepting once; dismissal performs no mutation. Reuse locked CSS/tokens; do not change visuals during an unrelated refactor.

### Client, routes and server contracts

- Add endpoint operations through lib/client/api.ts, not ad hoc fetch in views. Encode path segments, pass AbortSignal, retain no-store and add Bearer only for authenticated requests. Never persist session tokens in local/session storage or log credentials/session objects. Multipart FormData owns its Content-Type boundary.
- Treat responses as untrusted: parse success and safe error shapes through shared Zod contracts. Preserve AbortError from both fetch and response-body parsing. A failed/malformed mutation response may leave an uncertain outcome; retain ApiError semantics and reconcile before a retry. No automatic POST retry or false success. 401 resets the active session, 409 reloads authoritative data, and a failed refresh retains usable previous data as currently implemented.
- Routes are orchestration, not a second database/service layer. Reuse withErrors, json, readJson, parseBody and methodNotAllowed. Protected handlers call requireCaller before reading the body; login remains public. Await dynamic params per the installed Next.js guide. Strictly validate path/body input; check verified role and resource ownership before data disclosure or side effects. Preserve endpoint-specific error precedence and HEAD/OPTIONS/405 behavior rather than mechanically reordering checks.
- Bound actual request bytes, including absent/false Content-Length: JSON limit is 65,536 bytes with its approved 413; multipart retains its existing limit/messages. Shared reader cancellation/release must not mask the original failure. Keep generic login 401/429, avoid account enumeration/provider details and do not guess Retry-After or add an automatic retry.
- Server-only modules own Auth verification/mapping, data queries/RPC and public serialization. Use caller-scoped Supabase clients, trusted identity and existing atomic functions; do not use privileged reads/writes to bypass permissions. Cross-agency nurse discovery is intentional, agency management is owned, admin APIs remain restricted. No client-controlled owner/role or separate read-then-write mutation replacing an atomic RPC.
- Project only public contract fields; preserve local YYYY-MM-DD/HH:mm, complete Shift and claimedBy null for open. Unexpected audit envelopes are generic failures rather than empty history. Credential responses exclude internal object paths. Cleanup signals use fixed codes, preserve primary responses and avoid deleting potentially active objects. Signature/size/date validation remains at its existing boundaries; direct Storage/RPC content enforcement and deployed policies remain open 009 questions.

### Implementation and review routine

1. Read the selected spec/plan/tasks, current callers, adjacent implementations and relevant installed skills/docs. Record existing user edits. Identify data/action owners and the full request/response path before editing.
2. Declare contract/business/lifetime/security invariants, actual affected consumers and a current baseline. Update spec first for approved changed behavior. Choose the smallest complete change using an existing component/helper/platform feature; avoid opportunistic unrelated cleanup.
3. Preserve all guards, validation and safe error handling when moving code. Check every affected caller; correct the shared cause rather than adding disconnected patches. Keep loading/error/empty/disabled and accessible keyboard/focus behavior consistent with existing patterns.
4. Verify observable success, rejection and boundary cases proportionately: UI-to-client request gating/payload/result, route auth/ownership/malformed/oversize/no-side-effect paths, and stale/session/duplicate/conflict/uncertain/dialog lifetimes as affected. Reuse the current Jest projects and existing meaningful assertions; no assertion weakening or redundant tests merely mirroring markup.
5. Review the complete diff/import graph and exact contracts. Record actual local tests/typecheck/lint and applicable build/browser/hosted outcomes separately. SQL/deployed checks require direct evidence, no unsafe live fixtures. Documentation work uses document checks; it is not a new app test pass. No commit/publication unless asked.

### Source-to-guidance evidence

These source paths were inspected for this amendment; they are examples to follow, not new mandatory wrappers or files.

- app/components/ShiftPatchApp.tsx and renderAppView.tsx: typed actions, shared state/request coordination and pure role composition (011).
- ShiftCard.tsx, CreateShiftForm.tsx, Dialog.tsx and ConfirmationDialog.tsx: parsed publication, single acceptance, dismissal and shared modal lifecycle (012).
- lib/client/api.ts: schema/error/abort handling, no-store/Bearer/FormData and mutation uncertainty (009–010).
- app/api/shifts/route.ts, shifts/[id]/claim/route.ts, auth/login/route.ts and credentials/route.ts: authentication, strict/bounded parsing, params, role guards, safe responses and intentionally public login (004/009).
- lib/server/http.ts, auth.ts, db.ts, credentials.ts and supabase.ts with domain schemas/types: bounded reader cleanup, generic errors/throttling, trusted mapping, safe serialization and caller-scoped data access (008–010). Static source inspection does not close deployed verification.

## Risks and limits

Do not promote 010/T04 cleanup, 009/Q03–Q04 provider/deployed controls, native modal stacking/focus/physical Escape, production build, live CI observation or complete native export to passed. Hosted mutation cleanup is audit-FK-aware follow-up, not fixed by documenting it. Tests that skip are not backend evidence. No constitution amendment changes business permissions or authorizes external actions.
