# Security and Code Quality Improvements — Specification

Feature ID: 009-security-hardening · Date: 2026-10-19 · Status: Implemented within authorized local scope; Q03–Q04 and deployed verification open

Source: user request to identify code vulnerabilities and gaps in good practices, prepare a plan and create improvement tasks. Constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0. Follows [008](../008-consistency-audit/tasks.md); preserves features 004–006 contracts and 007 verification exclusions.

## Problem and expected outcome

The previous consistency audit and stale-response corrections do not certify every security boundary. A focused review found resource-handling and failure-reporting weaknesses, plus deployed-control questions. Plan small, evidenced improvements without claiming an exploit or changing business behavior.

## Scope

- Included now: code review, bounded local diagnostics, a prioritized finding register, compatible correction proposals, verification tasks and explicit decisions for changes that affect accepted requests or API statuses.
- Also included: candidate improvements to validated form submission, unused credential state and duplicated session reset. These are maintainability opportunities, not demonstrated vulnerabilities; assess necessity before implementing them.
- The user clarified that compatibility means preserving functional flows and business rules, rather than freezing internal code or all error statuses. Implement the proposed Q01/Q02 hardening and targeted API/React readability improvements; Q03/Q04 do not authorize privilege or deployment changes. No new dependencies, scripts, paid services, database writes, external settings, commits or publication.
- Preserve login/session behavior, cross-agency reads, own-agency writes, role permissions, credential expiry, atomic claims/cancellations, exact fixtures, full response fields and test IDs.
- No cosmetic cleanup, generic architecture rewrite, speculative caching or broad helper extraction. Existing F01/F02 corrections remain intact.
- Hosted file/mutation probes, new test accounts and the withdrawn browser E2E suite remain outside current scope. A verification proposal does not authorize executing those operations.

## Requirements and acceptance criteria

| Requirement | Required outcome | Criteria |
| --- | --- | --- |
| R01 | Release upload-reader resources on rejection and completion | AC01 |
| R02 | Reject unexpected audit RPC envelopes instead of reporting false empty history | AC02 |
| R03 | Make credential cleanup failures observable without disclosing private data | AC03 |
| R04 | Define safe JSON request bounds and upstream-throttle handling before changing the API | AC04–AC05 |
| R05 | Verify the direct credential-upload boundary and deployed controls without assuming protection | AC06 |
| R06 | Preserve compatibility and prove each later correction with focused regression checks | AC07–AC08 |
| R07 | Assess and, only when justified, simplify existing validation, state and session-reset code | AC09–AC11 |

| Criterion | Scenario | Required outcome |
| --- | --- | --- |
| AC01 | An upload exceeds the existing streaming byte limit, completes or fails while reading | Cancel unread data when appropriate and release the reader lock; preserve current 400/413 errors and prevent cleanup errors from replacing the original failure |
| AC02 | Audit RPC returns an array, an empty array or an unexpected non-null object/scalar | Valid/empty arrays retain their current response; malformed data becomes the existing generic internal error, never a successful empty audit. Resolve null semantics explicitly against the RPC before implementation |
| AC03 | Superseded/orphan object removal fails, or finalization cannot be reconciled | Record a bounded server-side event without tokens, object paths, document names or raw provider errors; retain the original save/error response, never delete a possibly active document, and record manual follow-up as pending |
| AC04 | JSON login/create/claim/cancel body is read | Enforce a 65,536-byte streaming bound, including whitespace and UTF-8 bytes, irrespective of missing/understated Content-Length; larger bodies return 413 `{error:"Request body too large"}` before password login or mutation work. Protected routes still authenticate first. Preserve empty claim bodies, ordinary schemas and multipart upload limits; clean up readers without masking the primary error |
| AC05 | Supabase Auth throttles password login | Return 429 `{error:"Too many requests. Try again later."}` with no raw provider details, invented Retry-After or automatic retry. Invalid credentials remain generic 401; the UI can retry and complete login after throttling clears |
| AC06 | Direct Storage/RPC access or deployed security controls are assessed | Distinguish route validation from provider policy enforcement. Record evidence or an explicit gap for own/foreign access, file-content validation, private storage, grants and abuse limits; no claim of a deployed bypass without reproduction |
| AC07 | A later task is implemented | Evidence justifies the smallest complete correction; all callers, error paths and contracts remain compatible. Contract/permission changes stay behind a separate decision and affected-feature specification update |
| AC08 | A later task closes | Record failing baseline where applicable, passing focused regression and relevant suites, typecheck/lint, supported-runtime build outcome, limitations and private transcript status; new regressions prevent completion |
| AC09 | Create-shift submission is simplified | Submit the successful Zod parse result rather than asserting unparsed form state as `CreateShiftRequest`; preserve field-specific messages, invalid-input rejection, pending/locked behavior and overnight support |
| AC10 | Credential state is simplified | Verify `CredentialState.status` has no readers, then remove it and its writes only if the maintenance benefit justifies the change; preserve loading/error/status display, session isolation and F01/F02 guards |
| AC11 | Session-reset duplication is addressed | Assess a small shared reset for `expire` and `signOut`; preserve request invalidation, all existing cleared fields/locks and distinct notices. If consolidation is not justified, record deferral rather than requiring a refactor |

## Contracts and open decisions

User clarification authorizes the documented JSON limit/413 and login 429 behavior changes; these are security hardening, not pure refactors. Preserve successful response shapes, exact fixture/business contracts and all normal user flows. Readability refactors must retain behavior and pass existing regression tests.

| ID | Decision or prerequisite | Affected tasks | Current resolution |
| --- | --- | --- | --- |
| Q01 | JSON maximum bytes and exact oversized response across login/create/claim/cancel | T04 | Resolved by user's compatibility clarification: implement proposed 64 KiB streaming cap and generic 413; preserve functional flows |
| Q02 | Public representation of upstream Auth 429 and any retry guidance | T05 | Resolved by same clarification: generic 429 message above; no invented retry timing or new limiter |
| Q03 | Expected enforcement of file-signature validation for direct authenticated Storage/RPC callers | T06 | Assessed as a static gap. Signature checks remain route-only. No privilege change |
| Q04 | Current deployed RLS/bucket/rate-limit state and safe verification access | T05–T06 | Not inspected. No hosted probe or fixture mutation |

## Delivery condition

Planning is delivered and compatible corrections are implemented with the limits recorded in tasks.md. Verify the remaining regression gap under AC01/AC03: successful upload releases the reader, and reconciliation after a lost finalization response returns the committed credential without deleting its active document. Each task closes only with its own evidence; hosted security and production readiness cannot be certified by local source inspection or unit mocks.

R07 tasks must first pass the existing necessity/compatibility gate. A documented no-change/deferred decision is valid for a candidate that does not justify its risk; do not turn this list into a mandatory cleanup campaign.
