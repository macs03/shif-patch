# Test Harness — Plan

Specification: [spec.md](spec.md) · Date: 2026-10-14 · Status: Approved; implementation pending

Reviewed constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0.

## Minimal technical decision

Add `zod` as a runtime dependency and Jest + React Testing Library as dev dependencies. Use `jest.config.ts` with three projects: `unit` (node), `integration` (node), `ui` (jsdom). Transform TypeScript with `ts-jest`. Map `server-only` to an empty stub in tests. Do not add MSW or Playwright in this feature.

## Constitution review

| Principle | Application | Authorized exception |
| --- | --- | --- |
| I. Spec before code | spec/plan/tasks before harness code | None |
| II. Exact contracts | Zod mirrors 001 packet shapes and trial fixtures | None |
| III. Minimal scope | One harness component, no API routes | None |
| IV. Security | Hosted test skips without secrets; generic errors in unit config test | None |
| V. Verification | npm test, typecheck, lint | None |
| VI. Evidence | tasks.md execution log | None |
| VII. Governance | Constitution 1.2.0 | None |

## Planned changes

| Requirements / criteria | Files or components | Required change |
| --- | --- | --- |
| R01 / AC01 | lib/domain/schemas.ts, lib/domain/types.ts | Zod schemas; types from z.infer |
| R02, R05 / AC02, AC05 | lib/server/db.ts, __tests__/unit/ | Validate read output; config failure test |
| R03 / AC03 | __tests__/integration/read-shifts.test.ts | Optional hosted read |
| R04 / AC04 | __tests__/ui/, lib/testing/ShiftListHarness.tsx | Mocked fetch + RTL |
| R06 / AC06 | package.json, jest.config.ts, specs/003-test-harness/tasks.md | Scripts and evidence |

## Data, contracts and security

Schemas enforce open/filled claimedBy rules and local date/time formats. Hosted integration uses existing `readShifts`; no new database grants.

## Planned verification

| Criterion | Check | Expected result | Evidence reference |
| --- | --- | --- | --- |
| AC01 | Unit schema tests | Pass/fail on fixtures | T02 log |
| AC02 | npm run test:unit | Green | T02 log |
| AC03 | npm run test:integration | Pass or skip | T03 log |
| AC04 | npm run test with ui project | Green | T04 log |
| AC05 | readShifts + schema in integration | Three shifts valid | T03 log |
| AC06 | npm test, typecheck, lint | Green | T05 log |

## Dependencies and limitations

Requires user-authorized npm installs. Node 22 may warn against engines >=24; record if build/test still pass.

## Implementation sequence

1. Create spec documents.
2. Install deps and jest.config.ts.
3. Add schemas and wire db.ts + types.
4. Add unit, integration, and UI tests.
5. Run checks and update tasks.md.
