# Test Harness — Tasks and Evidence

Specification: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Date: 2026-10-14

Status: Harness implemented. Original evidence below is historical; current regression/command guidance synchronized under [013](../013-harness-guidance-sync/tasks.md). Hosted cleanup/build/native-browser gaps remain open.

## Tasks

| ID | Requirements / criteria | Work and files | Dependencies | Status | Completion checks |
| --- | --- | --- | --- | --- | --- |
| T01 | R06 / AC06 | spec.md, plan.md, tasks.md | None | Complete | Documents complete |
| T02 | R01,R02 / AC01,AC02 | schemas, unit tests, jest config | T01 | Complete | test:unit passes |
| T03 | R03,R05 / AC03,AC05 | integration read-shifts test | T02 | Complete | integration pass with hosted env |
| T04 | R04 / AC04 | ShiftListHarness + ui tests | T02 | Complete | ui project passes |
| T05 | R06 / AC06 | npm test, typecheck, lint, execution log | T03,T04 | Complete historically | Original 2026-10-14 results recorded; not a current build/hosted certificate |
| T06 | R06–R07 / AC06–AC07 | Reconcile current harness contracts/commands/regression guidance in 013 | T05 | Completed documentation | Actual config/setup/source reviewed; 013 document checks; no app tests rerun for prose |

## Coverage

| Criterion | Responsible task | Current evidence |
| --- | --- | --- |
| AC01 | T02 | schemas.test.ts accepts trial shifts and rejects open+claimedBy |
| AC02 | T02 | unit project: schemas + readShifts config tests |
| AC03 | T03 | integration read-shifts.test.ts matched trialShifts when .env.local present |
| AC04 | T04 | shift-list-harness.test.tsx with mocked fetch |
| AC05 | T03 | readShifts output equals trialShifts after Zod in db.ts |
| AC06 | T05, T06 | Historical 2026-10-14: 4 suites / 9 tests on Node 22. Current offline command and Node 24 policy updated; latest local app evidence belongs to 012 |
| AC07 | T06 | Documented current role/session/action/dialog regression patterns; links to 011/012 actual results |

## Execution log

### 2026-10-14 — Implementation

- Criteria: AC01–AC06 satisfied for harness scope.
- Files: lib/domain/schemas.ts, lib/domain/types.ts, lib/server/db.ts, lib/testing/ShiftListHarness.tsx, jest.config.ts, __tests__/{unit,integration,ui,fixtures,setup}, __mocks__/server-only.ts, package.json, specs/003-test-harness/*, specs/README.md.
- Installed zod 4.6.7, jest 30.5.2, ts-jest, jest-environment-jsdom, @testing-library/react, @testing-library/dom, @testing-library/jest-dom.
- npm test (--no-watchman): 4 passed suites, 9 passed tests across unit, integration and ui projects. Hosted integration ran because .env.local had Supabase URL and server secret key.
- npm run typecheck and npm run lint passed. Node v22.20.0 with engines >=24 produced EBADENGINE on install only; tests still passed.
- Native conversation is the original evidence. Post-turn private export is pending; this entry is a summary.

### 2026-10-19 — T06 current guidance reconciliation

- Primary Codex only; no delegation. Constitution maintenance review 1.3.0. Reconciled current implemented status, ts-jest choice, Node 24/offline projects, mapped user-scoped hosted reads, shared app-dialog interaction tests and native mocking limits. Original 2026-10-14 results/versions remain unchanged.
- Documentation-only verification belongs to 013/tasks.md. No current application or hosted run is claimed. 012's recorded 84-test/typecheck/lint pass is historical evidence, not a rerun here. Audit-aware hosted cleanup, build/native browser/deployed checks and complete private native export remain open.
