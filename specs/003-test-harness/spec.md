# Test Harness — Specification

Feature ID: 003-test-harness · Date: 2026-10-14 · Status: Approved; implementation pending

Request/contract source: user request for Jest, React Testing Library, Zod, unit tests and frontend–backend integration tests. Applicable constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0. Parent contracts: [001-shiftpatch/spec.md](../001-shiftpatch/spec.md) R09.

## Problem and expected outcome

The repository has hosted data and a server read helper but no automated test runner or shared contract validation. Complete this feature when developers can run unit tests, an optional hosted integration read, and a UI integration pattern with a mocked API, with ShiftPatch packet shapes validated through Zod.

## Scope

- Included: Zod schemas for packet contracts, Jest with ts-jest, React Testing Library setup, unit tests for schemas and config failures, optional hosted `readShifts` integration, UI integration example with mocked `fetch`.
- Outside this feature's scope: implementing the six API routes, the fifteen product test IDs on real pages, Playwright E2E, MSW, Vitest, new product UI beyond a harness component.

## Scenarios and acceptance criteria

| Criterion | Requirement | Given | When | Then |
| --- | --- | --- | --- | --- |
| AC01 | R01 | Zod schemas exist for packet shapes | Invalid shift or login payloads are parsed | Validation fails with clear errors; valid trial fixtures pass |
| AC02 | R02 | Jest is configured | `npm run test:unit` runs | Schema and server config unit tests pass without network |
| AC03 | R03 | Private env has Supabase URL and server secret | `npm run test:integration` runs | Hosted read returns the three exact trial shifts or the suite skips with a clear message when env is absent |
| AC04 | R04 | A harness component fetches `/api/shifts` | RTL tests run with mocked fetch | Three shift rows render with `shift-list-item`; invalid JSON does not render as a list |
| AC05 | R05 | Application code reads shifts | `readShifts` maps hosted rows | Each returned shift satisfies the Zod shift schema |
| AC06 | R06 | Tests run in CI-like conditions | `npm test`, typecheck and lint run | All complete; no secrets appear in test output |

## Requirements

| ID | Required behavior | Acceptance criteria |
| --- | --- | --- |
| R01 | Validate packet contracts with Zod | AC01 |
| R02 | Provide Jest unit test project | AC02 |
| R03 | Provide optional hosted integration test for `readShifts` | AC03, AC05 |
| R04 | Provide RTL integration pattern with mocked backend | AC04 |
| R05 | Enforce contract on server read output | AC05 |
| R06 | Document and verify the harness | AC06 |

## Contracts and data

Reuse exact Shift, LoginRequest, LoginResponse, CreateShiftRequest, ShiftsResponse, AgencyShiftsResponse, CancelShiftRequest, CancelShiftResponse and ApiError shapes from [lib/domain/types.ts](../../lib/domain/types.ts). Facility-local `YYYY-MM-DD` and `HH:mm` strings. Open shifts require `claimedBy: null`. No real secrets in specs or committed tests.

## Open questions and assumptions

| ID | Question or assumption | Affected criteria | Resolution and source |
| --- | --- | --- | --- |
| Q01 | Which test runner? | AC02–AC04 | Resolved: Jest with ts-jest; Next 16 has no `next/jest` |
| Q02 | Hosted integration when env is missing? | AC03 | Skip test; do not fail the default `npm test` |

Assumption: integration tests load `.env.local` only in the test process; never commit credentials.

## Delivery condition

All six acceptance criteria have evidence in tasks.md, `npm test` runs three Jest projects, and Zod is the single source for inferred domain types.

## Change history

| Date | Change | Reason / source |
| --- | --- | --- |
| 2026-10-14 | Initial specification | User requested Jest, RTL, Zod and integration setup |
