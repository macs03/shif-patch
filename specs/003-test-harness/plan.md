# Test Harness — Plan

Specification: [spec.md](spec.md) · Date: 2026-10-14 · Status: Implemented; maintenance guidance synchronized in 013

Current maintenance review: [CONSTITUTION.md](../CONSTITUTION.md) 1.3.0 under [013](../013-harness-guidance-sync/plan.md). Original implementation review below used 1.2.0; dated evidence is unchanged.

## Current harness maintenance

The test harness supports the agent's broader [engineering conventions](../013-harness-guidance-sync/plan.md#engineering-conventions). Test the real typed UI-action → client → route → server contract at the affected boundary; mock external transport/provider calls where appropriate, preserving role, payload, safe-error and no-side-effect assertions. Do not reproduce domain rules inside test-only service layers or introduce new architecture to satisfy a test.

Keep the existing Jest/ts-jest config and three projects; no runner/dependency change is needed. Use Node 24 and `npm test -- --selectProjects unit --selectProjects ui --runInBand` for offline quality, plus typecheck/lint for application changes. Bare npm test includes the optional hosted project; it is not an offline alias. Zod validates boundary data; the test server-only stub never authorizes production client imports.

Exercise real role components via ShiftPatchApp and targeted boundaries, with typed callbacks and mocked fetch. Preserve stale tickets/epoch, pending locks, uncertain reconciliation, credential-save authority, validated payloads and form mount/reset behavior. For shift actions, click actual ConfirmationDialog controls; assert no request on Cancel/Close/cancel/backdrop, original payload on accept, safe initial focus and no duplicate accept. Retain Strict Mode/nested dialog tests with asynchronous close mocks restored after each test. Native focus-return/modality/Escape remain separate browser checks.

Hosted read tests use SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY and real mapped login/user-scoped helpers. Hosted mutation cleanup is still pending in 010/T04; do not enable mutation tests before audit-aware disposable-row cleanup is verified and execution authorized. CI receives no backend credentials. Read current spec AC07 and 011/012 evidence for regression scope; record new outcomes in the selected feature's tasks, not by overwriting old counts.

## Original implementation plan (historical)

The remaining sequence records the original dependency/setup work, not instructions to reinstall or create a second harness. Current runner choice is ts-jest; no claim about next/jest availability is required. The old Node 22 result is historical; new checks require Node 24.

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
