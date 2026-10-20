# Test Harness — Specification

Feature ID: 003-test-harness · Date: 2026-10-14 · Status: Implemented; current harness guidance synchronized in 013

Request/contract source: user request for Jest, React Testing Library, Zod, unit tests and frontend–backend integration tests. Applicable constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.3.0 for this maintenance update (original implementation reviewed 1.2.0). Parent contracts: [001-shiftpatch/spec.md](../001-shiftpatch/spec.md) R09.

## Problem and expected outcome

The original baseline had hosted data and a read helper without a shared test runner. The implemented harness now supports offline unit/UI regressions, Zod contract checks and separate optional hosted integration. Current guidance includes the audited client/server boundaries, role composition and shared confirmation dialogs from 008–012. Original delivery evidence remains dated in tasks.md.

## Scope

- Included: Zod schemas for packet contracts, Jest with ts-jest, React Testing Library setup, unit tests for schemas and config failures, optional hosted `readShifts` integration, UI integration example with mocked `fetch`.
- Outside this feature's scope: implementing the six API routes, the fifteen product test IDs on real pages, Playwright E2E, MSW, Vitest, new product UI beyond a harness component.

## Scenarios and acceptance criteria

| Criterion | Requirement | Given | When | Then |
| --- | --- | --- | --- | --- |
| AC01 | R01 | Zod schemas exist for packet shapes | Invalid shift or login payloads are parsed | Validation fails with clear errors; valid trial fixtures pass |
| AC02 | R02 | Jest is configured | `npm run test:unit` runs | Schema and server config unit tests pass without network |
| AC03 | R03 | Configured SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY plus a real mapped admin login | `npm run test:integration` runs | User-scoped hosted read matches the three exact fixture rows while allowing unrelated rows; when env is absent the actual hosted case skips and the configuration-only assertion is not hosted evidence |
| AC04 | R04 | A harness component fetches `/api/shifts` | RTL tests run with mocked fetch | Three shift rows render with `shift-list-item`; invalid JSON does not render as a list |
| AC05 | R05 | Application code reads shifts | `readShifts` maps hosted rows | Each returned shift satisfies the Zod shift schema |
| AC06 | R06 | Offline quality checks run on Node 24 | Explicit unit/UI projects, typecheck and lint run | Record actual outcomes without backend calls or secrets; hosted/browser/build checks remain distinct |
| AC07 | R07 | Maintainer changes a role/action/dialog flow | Uses the regression guidance below | Actual role/confirmation controls, request gating, stale/session and lifetime behavior are checked as affected; native browser limits remain explicit |

## Requirements

| ID | Required behavior | Acceptance criteria |
| --- | --- | --- |
| R01 | Validate packet contracts with Zod | AC01 |
| R02 | Provide Jest unit test project | AC02 |
| R03 | Provide optional hosted integration test for `readShifts` | AC03, AC05 |
| R04 | Provide RTL integration pattern with mocked backend | AC04 |
| R05 | Enforce contract on server read output | AC05 |
| R06 | Document and verify the harness | AC06 |
| R07 | Maintain behavior-driven guidance for the implemented app | AC07 |

## Contracts and data

Reuse exact Shift, LoginRequest, LoginResponse, CreateShiftRequest, ShiftsResponse, AgencyShiftsResponse, CancelShiftRequest, CancelShiftResponse and ApiError shapes from [lib/domain/types.ts](../../lib/domain/types.ts). Facility-local `YYYY-MM-DD` and `HH:mm` strings. Open shifts require `claimedBy: null`. No real secrets in specs or committed tests.

## Open questions and assumptions

| ID | Question or assumption | Affected criteria | Resolution and source |
| --- | --- | --- | --- |
| Q01 | Which test runner? | AC02–AC04 | Resolved: existing config uses Jest with ts-jest; this is a repository choice, not a claim that next/jest is unavailable |
| Q02 | Hosted integration when env is missing? | AC03 | Skip actual hosted cases; report skips explicitly. Bare npm test still selects all projects and can contact a configured backend |

Assumption: integration tests load `.env.local` only in the test process; never commit credentials.

## Current regression guidance

The agent harness's [engineering conventions](../013-harness-guidance-sync/plan.md#engineering-conventions) define component/API/server ownership and communication. These tests verify those boundaries and the observable contract; the test harness does not replace the project's implementation guidance or server security checks.

- Offline: `npm test -- --selectProjects unit --selectProjects ui --runInBand` on Node 24. Config is [jest.config.ts](../../jest.config.ts): unit/integration use node, UI uses jsdom and [jest-dom setup](../../__tests__/setup/jest-dom.ts). The server-only test stub is a test import adapter, not proof of a production security boundary.
- Unit coverage areas: schemas/serialization, role/ownership errors, 64 KiB actual JSON bytes and reader cleanup, generic Auth 429, credential/audit failure handling and AbortError/uncertain-response semantics. Keep full response and exact fixture assertions as applicable.
- App/UI coverage: pure role selection through ShiftPatchApp, tabs, shared session reset, stale shift/admin reads and credential-save authority, duplicate/conflict/uncertain actions, validation/errors and conditional form lifetimes. See [011](../011-role-component-split/tasks.md) and [012](../012-shift-action-confirmation/tasks.md) for actual recorded evidence.
- Confirmation tests click the app dialog's Cancel or named acceptance button, not a window.confirm spy. Assert zero mutations before acceptance and after dismissal, original payloads after acceptance, safe initial focus, stale/busy guards and single acceptance. Nested confirmation dismissal must preserve the publication draft and parent dialog.
- Mock missing dialog methods only as necessary, model asynchronous close events and restore prototypes/spies. Strict Mode/cancel-event/backdrop tests are jsdom behavior evidence, not native modal stacking, physical Escape or focus-return proof.
- Hosted projects load optional .env.local only in the test process. Reads log in through mapped Auth and pass user tokens to server helpers; no server-secret read path. Mutation tests additionally gate on DB_PASSWORD and SHIFT_PATCH_HOSTED_MUTATIONS=1, but must not run until [010/T04 cleanup](../010-project-wide-review/tasks.md) is designed/verified for audit foreign keys. A flag does not authorize fixture writes; safe cleanup is not yet implemented.
- Secret-free quality CI selects unit/UI explicitly; live CI execution, build, native browser and deployed policies each need separate evidence. Do not put a fixed suite/test count in policy; counts belong to dated tasks logs.

## Delivery condition

Original AC01–AC06 evidence remains in tasks.md; current guidance AC07 is documented and linked through 013. Jest defines three projects, offline checks select two explicitly, and Zod remains the source of inferred domain types. Current hosted/build/browser limits are not closed by this documentation update.

## Change history

| Date | Change | Reason / source |
| --- | --- | --- |
| 2026-10-14 | Initial specification | User requested Jest, RTL, Zod and integration setup |

| 2026-10-19 | Reconciled implemented harness, user-scoped read/config and app-dialog regression guidance under constitution 1.3.0 | User requested current guidance synchronization in 013 |
