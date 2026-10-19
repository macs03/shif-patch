# Role Component Split — Tasks and Evidence

Specification: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Date: 2026-10-19

Status: Local implementation complete. Build remains unverified. Native Escape and hosted mutation checks were not executed.

## Tasks

| ID | Requirements / criteria | Work and files | Dependencies | Status | Completion checks |
| --- | --- | --- | --- | --- | --- |
| T00 | R01–R05 / planning delivery | Inspect parent/callers/tests; create spec/plan/tasks/index | None | Completed | Responsibility/ownership map, explicit file changes, verification plan and document checks |
| T01 | R02–R05 / AC02–AC08 | Refresh baseline; run suites; characterize missing modal/form/session lifetime cases in __tests__/ui/shift-patch-app.test.tsx | T00 | Completed | Lifetime cases passed on Node 24.22.0 before extraction; jsdom `close` is mocked |
| T02 | R01–R03 / AC01, AC02, AC05 | Extract controlled LoginView.tsx; replace signed-out parent JSX | T01 | Completed | Signed-out markup/IDs stay in LoginView; parent keeps fields, validation, lock and reset |
| T03 | R01–R03 / AC01–AC05 | Extract ShiftBoard.tsx, NurseDashboard.tsx and AgencyDashboard.tsx; typed parent actions; existing admin reused | T02 | Completed | Parent keeps mutation/session handlers; AdminDashboard is reused without a wrapper |
| T04 | R01–R04 / AC01–AC06 | Extract PostShiftDialog.tsx with complete DOM effect/ref/guard and conditional agency mount | T03 | Completed | Dialog lifecycle lives with the portal; cleanup close is counted so a late close event cannot dismiss a reopened dialog |
| T06 | R01–R03,R05 / AC01–AC05, AC09 | Add renderAppView.tsx; centralize signed-out/role selection and shared chrome; delegate parent rendering | T04 | Completed | Parent returns one renderAppView call; role JSX branches removed; data-loading role checks remain |
| T05 | R01–R05 / AC01–AC09 | Local suites/typecheck/lint; build disposition; browser checks; diff/import/evidence review | T06 | Completed with limits | Node 24.22.0 unit/UI, typecheck and lint passed. Build not rerun. Browser limits below |

## Coverage

| Criterion | Responsible tasks | Current evidence |
| --- | --- | --- |
| AC01 | T02–T04, T06 | LoginView, NurseDashboard, AgencyDashboard, ShiftBoard, PostShiftDialog and renderAppView exist; AdminDashboard reused |
| AC02 | T01–T05 | Session, epoch, abort and locks remain in ShiftPatchApp; views receive no token. Covered by existing stale/401 tests |
| AC03 | T01, T03–T05 | settleMutation remains in the parent. Existing claim/publish/cancel/uncertain tests passed |
| AC04 | T01, T03, T05 | Nurse tab, credential authority and form-unmount tests passed |
| AC05 | T01–T05 | Agency/admin tests passed. Rerender keeps the nurse credential panel |
| AC06 | T01, T04, T05 | UI lifetime tests passed with mocked async close. Browser: modal stayed open, `dialog.close()` returned focus to Post shift. Synthetic Escape did not dismiss it. See log |
| AC07 | T01, T05 | Node 24.22.0: 9 suites, 70 tests, typecheck and lint passed. Build not run |
| AC08 | T05 | Limits recorded below. No performance or certification claim |
| AC09 | T06, T05 | renderAppView selects from SessionUser or null. Parent render has no auth/role JSX branch |

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

### 2026-10-19 — T01–T06 local implementation

- Actual agent: primary Cursor Grok session; no delegation. Node 24.22.0 via nvm. The default shell Node was 22.20.0 and was not used for the recorded checks.
- Added dialog/form/session lifetime tests, then extracted LoginView, ShiftBoard, NurseDashboard, AgencyDashboard and PostShiftDialog. Parent kept session, tickets, locks and settleMutation. Chrome fires `dialog` `close` after `close()` returns; the cleanup guard counts that event so Strict Mode does not immediately dismiss the reopened dialog. jsdom has no native `close`; tests install an async mock. That mock is not native modality or physical Escape.
- Added `app/components/renderAppView.tsx`. It returns LoginView when user is null and otherwise one exhaustive role switch inside the existing header/banner/shell. Parent rendering is a single call. Role checks that choose data loading remain in the parent. One `react-hooks/refs` disable marks that the selector forwards handlers and does not call them.
- Node 24.22.0: `npm test -- --selectProjects unit --selectProjects ui --runInBand` exit 0, 9 suites, 70 tests. `npm run typecheck` exit 0. `npm run lint` exit 0. `npm run build` was not run; earlier escalated attempts already failed on the Turbopack CSS helper port bind, and that restriction was not shown to be gone.
- Browser on the existing `next dev` at localhost:3000, no hosted publish/claim/cancel/upload. Nurse marketplace and credential tab rendered, then sign-out returned to an empty login. Agency dialog stayed modal under `document.body` at desktop and at emulated 320/414/768 without document overflow. `HTMLDialogElement.close()` removed it and restored focus to the post button. A DOM Escape event did not dismiss the native modal, so physical Escape is unverified. The sign-out control is inert while the modal is open; invoking its handler still cleared the dialog and session. Admin operations rendered in the earlier pass of this session. A hydration overlay during the first load matched Cursor-injected `data-cursor-ref` attributes, not application markup.
- No API/SQL/CSS/fixture change, dependency, commit or publication. Complete private native transcript export remains pending. Next.js feedback pass: no new qualifying framework issue.
