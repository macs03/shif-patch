# Role Component Split — Tasks and Evidence

Specification: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Date: 2026-10-19

Status: Planning delivery complete; runtime implementation pending.

## Tasks

| ID | Requirements / criteria | Work and files | Dependencies | Status | Completion checks |
| --- | --- | --- | --- | --- | --- |
| T00 | R01–R05 / planning delivery | Inspect parent/callers/tests; create spec/plan/tasks/index | None | Completed | Responsibility/ownership map, explicit file changes, verification plan and document checks |
| T01 | R02–R05 / AC02–AC08 | Refresh baseline; run suites; characterize missing modal/form/session lifetime cases in __tests__/ui/shift-patch-app.test.tsx | T00 | Pending | Current supported-Node baseline recorded; added behavior tests pass before extraction |
| T02 | R01–R03 / AC01, AC02, AC05 | Extract controlled LoginView.tsx; replace signed-out parent JSX | T01 | Pending | Same markup/IDs/errors/visibility/retry; parent keeps state/validation/lock/request/reset |
| T03 | R01–R03 / AC01–AC05 | Extract ShiftBoard.tsx, NurseDashboard.tsx and AgencyDashboard.tsx; typed parent actions; existing admin reused | T02 | Pending | No new request/state owner; exact pending/hold/card keys and tab/form lifetimes; UI checks pass |
| T04 | R01–R04 / AC01–AC06 | Extract PostShiftDialog.tsx with complete DOM effect/ref/guard and conditional agency mount | T03 | Pending | Close/reopen/reset, publish success/failure, session/unmount and Strict Mode cases; native limits explicit |
| T06 | R01–R03,R05 / AC01–AC05, AC09 | Add renderAppView.tsx; centralize signed-out/role selection and shared chrome; delegate parent rendering | T04 | Pending | Typed safe profile/view props, no hooks/tokens/new requests; only selected role mounts; parent selection branches removed; existing role/lifetime checks retained |
| T05 | R01–R05 / AC01–AC09 | Local suites/typecheck/lint; build disposition; browser checks; diff/import/evidence review | T06 | Pending | Actual checks per plan; contracts/styles/fixtures unchanged; unexecuted checks stay open |

## Coverage

| Criterion | Responsible tasks | Current evidence |
| --- | --- | --- |
| AC01 | T02–T04, T06 | Planned responsibility/file map and separate selector |
| AC02 | T01–T05 | Existing safeguards inspected; post-extraction verification pending |
| AC03 | T01, T03–T05 | Current mutation/reconciliation handlers and tests inspected |
| AC04 | T01, T03, T05 | Current tabs/credential late-response cases inspected |
| AC05 | T01–T05 | Current role views/logout cases inspected; lifetime checks pending |
| AC06 | T01, T04, T05 | Current portal/dialog inspected; close/reopen/browser verification pending |
| AC07 | T01, T05 | Current baseline/post-change checks pending |
| AC08 | T05 | Runtime/browser/build/diff closure pending |
| AC09 | T06, T05 | Separate pure selector planned; runtime verification pending |

## Execution log

### 2026-10-19 — T00 planning

- Actual agent: primary Codex only; no delegation. HEAD `1294363`; preserved uncommitted audit-status documents in 008–010 and specs/README.md. User requests planning, not runtime implementation this turn.
- Read constitution/index/templates/shared rules, full 664-line parent, app/page caller, role/card/header/form components and relevant test cases/inventory. Consulted Ponytail, Vercel React state/dependency references, bundled Next.js client/testing guidance, Hallmark preservation/contract guidance and locked design.md. Combined guide output was truncated; relevant client-boundary and preservation sections were read separately. No design work performed.
- Copied repository templates. Initial apply_patch failed because delete/add targeted the same path in one patch; it applied no content. Replaced template contents with authored documents using inline file writes, without creating a utility. Plan extracts presentation and complete dialog lifecycle; shared async/session safeguards stay in parent.
- No runtime change or tests/typecheck/lint/build/browser/hosted operations, database mutation, dependency install, commit or publication. Historical 65-test pass is not a new feature baseline. Next.js feedback pass: no new qualifying framework issue.
- Native conversation retains prompts/tool results; complete private post-turn export pending. This log is a summary, not a complete transcript. No shared evidence copy/redaction.
- Planning verification: reviewed the authored documents and additive 011 index entry; `git diff --check` passed. Inline checks passed for local Markdown links, no template placeholders/trailing whitespace, AC01–AC08 definitions/coverage and T01–T05 remaining Pending. Existing audit-status edits and user staging were preserved. T00 complete; runtime implementation has not started.

### 2026-10-19 — Separate SPA view-selection amendment

- User requested a separate function that selects and returns the active component, similar to simple SPA routing, without role conditionals in the parent's JSX. Updated R01/AC01, added AC09 and T06, and amended the file map/sequence before selector implementation. Selection derives from safe user role/null; no URL routing, new dependency, independent mode state, hooks or API calls.
- Actual agent: primary Codex only; no delegation. HEAD now `dc289a3`. On inspection, existing working changes included ShiftPatchApp/test edits and five extracted components produced outside this documentation turn. Read the current parent composition and role/login prop contracts; preserved those runtime changes. This entry does not claim to have implemented or verified them, nor override another implementation session's task evidence.
- This turn changes planning documents/index only. No runtime tests/typecheck/lint/build/browser or hosted checks rerun. Complete private native transcript export remains pending. Next.js feedback pass: no new qualifying framework issue.
- Document review passed: `git diff --check`, feature links/whitespace/placeholders, AC01–AC09 definitions and coverage, and final-verification dependency on T06. Selector implementation remains pending.
