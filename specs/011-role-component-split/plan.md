# Role Component Split — Plan

Specification: [spec.md](spec.md) · Date: 2026-10-19 · Status: Implemented locally; verification limits in tasks.md

Reviewed constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0. Baseline HEAD `1294363`; parent has 664 lines. Preserve existing uncommitted audit-status documents in 008–010 and specs/README.md.

## Minimal technical decision

Extract five components and add one view-selection function in the existing app/components directory. Keep ShiftPatchApp as session/request coordinator; renderAppView selects the UI. Do not move asynchronous code into an opaque hook just to reduce line count: the goal is clear responsibilities. AdminDashboard already supplies the admin boundary.

| File | Responsibility and inputs | State ownership |
| --- | --- | --- |
| ShiftPatchApp.tsx (modify) | Session/requests and typed view props/actions; returns renderAppView with safe user/data/callback inputs | Retains login fields/visibility/errors/pending/lock, session/notices, nursePanel, creating, list/credential/admin data, pending/hold, epoch/controllers/tickets and async handlers |
| renderAppView.tsx (new) | Pure synchronous selection of login/nurse/agency/admin; preserves existing shared header/banner/shell and admin width | No state, hooks, effects, requests, tokens or URL/history access; derives selection from user or null |
| LoginView.tsx (new) | Existing auth gate/card/form/copy and signed-out notice; controlled fields/visibility and submit/change callbacks | No duplicated state/validation/request effect |
| NurseDashboard.tsx (new) | Nurse tabs, conditional marketplace/credential panels; compose ShiftBoard and CredentialForm | Controlled panel selection; file/date state stays inside conditionally mounted CredentialForm |
| AgencyDashboard.tsx (new) | Own-shift board, post button and conditional PostShiftDialog; create/cancel/open/close callbacks | creating remains controlled; no duplicate request/mutation state |
| ShiftBoard.tsx (new) | Shared nurse/agency section, heading/refresh/loading/error/retry/empty/list and ShiftCard mapping; mode/data/pending/hold/actions | Derived card pending/locked only. Optional children insert actual agency controls after board bar, preserving DOM order |
| PostShiftDialog.tsx (new) | Body portal/dialog, native show/close effect, DOM ref and cleanup guard; existing CreateShiftForm | DOM refs/effect only; mounted while creating; pending/locked/submit/close passed as props |
| AdminDashboard.tsx (reuse) | Current admin tabs, filters, metrics/lists and refresh | Existing local state unchanged; no wrapper/refetch effect |

```text
ShiftPatchApp
  -> renderAppView(user, view props and callbacks)
       signed out -> LoginView
       signed in  -> AppHeader + NotificationBanner + role view
                       nurse  -> NurseDashboard -> RoleTabs + ShiftBoard / CredentialForm
                       agency -> AgencyDashboard -> ShiftBoard + PostShiftDialog -> CreateShiftForm
                       admin  -> AdminDashboard
```

Agency controls/dialog remain composed inside the shared board in their current element order; the dialog portal still targets document.body. No extra DOM wrappers or nested component definitions. This keeps component identity stable across parent renders.

## Simple SPA view selection — AC09

Use an exported `renderAppView` function in a .tsx file. It receives `user: SessionUser | null`, common notice/sign-out inputs and explicitly typed login/nurse/agency/admin props. Reuse each component's existing prop contract via React ComponentProps or a genuinely shared exported prop type; do not duplicate those shapes. Grouping by actual view is allowed here; do not pass a whole application controller or session token.

The function returns the login element when user is null. Otherwise, one exhaustive switch on user.role selects the nurse/agency/admin element, and shared signed-in chrome wraps that element once. Keep the existing shell-wide rule inside this file. Use ordinary JSX elements such as `<NurseDashboard {...nurseProps} />`; never call `NurseDashboard(nurseProps)` directly or define a new component type during selection. No independent active-role state, route table/factory, render callback registry, router package or custom history API.

The parent prepares props and ends with one renderAppView call. It retains role checks needed for data loading/business actions: removing presentation branches must not remove those safeguards. Since all view props may be prepared while signed out, parent action closures must safely guard missing sessions instead of using non-null assertions. Only selected elements mount; constructing props must trigger no requests or side effects. This selection is UI composition, not authorization: server role/ownership enforcement remains unchanged.

Keep nurse/admin tab selection within their existing boundaries. AC09 centralizes only top-level signed-out/role selection, not every conditional in leaf JSX.

## Props and lifecycle rules

- Explicit data/action props, domain request/shift/credential/reason types, colocated component prop types. No whole-controller object, token/session prop, copied data in state, imperative parent ref API, generic types/utilities barrel or per-role fetching hook. Export only types actually shared.
- Parent actions retain API access/notices, confirmed-publish close, uncertain-result hold/reconciliation, 409 refresh and duplicate guards. Preserve card keys and exact pending/locked expressions, including different pending identities.
- Login fields and nursePanel remain in parent so resetSession retains ownership. Preserve CredentialForm, ShiftCard, AdminDashboard and CreateShiftForm mount/reset boundaries; do not keep currently unmounted forms alive via CSS or Activity.
- Move the dialog DOM effect/ref/ignore-close guard together. Preserve Escape/close synchronization, outside-click bounds, fallback branches, cleanup and current ability to close while publishing. Check Strict Mode setup/cleanup and close/reopen/sign-out; no custom modal replacement.
- Keep the current client module graph. A file split alone does not reduce bundle size or establish a performance gain. No dynamic import, memoization, new callback layer, global store or reducer is justified here.

## Guidance and constitution

Ponytail full and shared secure-development rules: smallest requested split, real consumers, no dependencies/delegation; interpret inherited tenant rules using the cross-agency marketplace contract. Vercel React derived-state-no-effect/dependency references: derive view data, preserve useful refs/dependencies, avoid extraction-induced refetches.

Consulted bundled Next.js `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (client graph) and `01-app/02-guides/testing/jest.md` (existing client Jest/RTL coverage); re-read relevant installed guides before implementation. Hallmark loaded for preservation of locked design.md only; no design/theme/CSS change or preview utility.

Constitution 1.2.0: criteria precede code; exact contracts preserved; existing stack reused; server/client boundaries intact; checks proportional to change; private native evidence and actual failures retained. No amendment/exception needed.

## Implementation sequence and verification

1. Refresh Git/source and run current unit/UI baseline on Node 24. Inspect coverage; add only missing dialog/form/session lifetime cases and prove they pass before extraction. The historical 65-test result is not a current baseline.
2. Extract controlled LoginView. Verify validation/errors/visibility, cleared password, 413/429 retry and logout/401 reset, including signed-out banner position.
3. Extract ShiftBoard and nurse/agency dashboards with typed parent actions; reuse existing admin directly. Verify tabs, credential authority, card keys, pending/hold, loading/error/retry/empty states and form lifetimes. Run affected UI suite.
4. Extract PostShiftDialog with full DOM lifecycle. Cover close/reopen/default reset, successful/failed publish, sign-out/in-flight work and Strict Mode. Mock only unsupported native dialog methods in jsdom; mocked close is not evidence of native focus/modality/Escape.
5. Add renderAppView and delegate parent rendering to it. Verify login plus all three roles through the existing parent entry point, shared chrome/banner placement, selected-only mounting, same-role state preservation across rerenders and logout/role-switch resets. Test actual outcomes rather than mocking the selector or snapshotting its implementation.
6. Run `npm test -- --selectProjects unit --selectProjects ui --runInBand`, `npm run typecheck` and `npm run lint` with Node 24. Attempt `npm run build` when the earlier environment restriction can be resolved; otherwise retain blocked/unverified status instead of retrying the same known port-binding failure unchanged.
7. In an available browser check login/all roles, nurse tabs, agency modal close/reopen, physical Escape/focus return at 320/414/768. Native close checks need no publication/upload/claim/cancel. Do not mutate hosted data for a structural refactor; use mocked tests for mutations. Record unavailable checks.
8. Review final diff/import graph, contracts and task evidence. Confirm no API/SQL/CSS/fixture change or new credential logging/storage. Do not weaken assertions to hide regressions. No commit/publication.

Earlier build restrictions, deployed-policy questions and 010/T04 hosted cleanup remain separate open work; this refactor does not resolve them.
