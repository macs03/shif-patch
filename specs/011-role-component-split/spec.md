# Role Component Split — Specification

Feature ID: 011-role-component-split · Date: 2026-10-19 · Status: Implemented locally; build and some native browser checks remain open

Source: user requests a readability refactor of app/components/ShiftPatchApp.tsx, keeping it as the parent and separating role/mode implementations into files. Follow-up: a function in a separate file must select and return the appropriate SPA view, avoiding role-selection conditionals in the parent's JSX. Constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0. Preserve contracts and audit corrections from features 001–010.

## Problem and expected outcome

At the planning baseline, ShiftPatchApp contained 664 lines: session/request orchestration, signed-out form markup, nurse/agency views, shared shift-board rendering and publishing-dialog lifecycle. AdminDashboard was already separate. The implemented split gives each role a clear component entry and keeps shared session/mutation safeguards in one owner. This is an explicitly requested maintenance improvement, not a demonstrated vulnerability or performance defect.

## Scope

Extract signed-out, nurse and agency presentation, shared shift-board rendering and publishing-dialog behavior. Reuse AdminDashboard and existing leaves. Define typed data/action props and explicit state ownership. A separate synchronous view-selection function handles signed-out/nurse/agency/admin rendering; this is SPA composition, without URL routing, history changes or a router dependency.

Preserve routes, requests/responses/errors, permissions, fixture values, local times, test IDs, copy, CSS, element order, accessibility and form mounting/reset behavior. Exclude API/server/SQL changes, new business rules/design, new dependencies, routing/session changes, stores/context, generic controller frameworks, scripts, hosted mutations, deployment, commits and publication. Shared asynchronous coordination remains in the parent; no automatic subsequent hook extraction is implied.

## Requirements and acceptance criteria

| Requirement | Required outcome | Criteria |
| --- | --- | --- |
| R01 | Readable signed-out and role composition with a separate view selector | AC01, AC09 |
| R02 | One owner for shared session/request/mutation safeguards | AC02, AC03 |
| R03 | Preserve role behavior and form lifetimes | AC04, AC05 |
| R04 | Preserve publishing-dialog behavior/accessibility | AC06 |
| R05 | Verify compatibility and record honest evidence | AC07, AC08 |

| Criterion | Scenario | Observable outcome |
| --- | --- | --- |
| AC01 | Read parent and role files | Parent delegates view selection to a separate function; it returns LoginView, NurseDashboard, AgencyDashboard or existing AdminDashboard. Role JSX lives in those files, shared board/dialog have actual consumers, no redundant admin wrapper or nested component definitions |
| AC02 | Login/logout/expiry or late request | Parent owns session/reset/epoch/controllers/read tickets/synchronous locks; existing abort/clearing and stale-response protection preserved. Children receive neither tokens nor session setters |
| AC03 | Publish/claim/cancel success/conflict/uncertain outcome | Parent retains begin/finish/settleMutation, pending/hold/reconciliation and refresh semantics; duplicates blocked and failed refresh retains data. Children call typed actions, with no new fetching effects |
| AC04 | Nurse tabs/upload/claim | Same keyboard/ARIA, marketplace, credential validation/status and authoritative saved view over old success/401 reads. Conditional mounting and current form reset behavior preserved |
| AC05 | Agency own-shift board/admin panels or session change | Same publish/reopen/both cancellation reasons and admin metrics/audit/hours/filters. Existing admin state stays local; no previous-account data or UI state leaks |
| AC06 | Open/close/reopen/publish/sign out with dialog open | Same body portal, native modality, title, close button, outside-click bounds, native Escape/close synchronization and focus return. Form mounted only while open; reopening resets as today; confirmed success closes it and failures retain current behavior; cleanup cannot reopen it or mutate a new session |
| AC07 | Before/after extraction | Preserve existing route/payload/outcome/stale/pending/uncertain/form/tab assertions; add only missing lifetime/boundary cases. Unit/UI, typecheck and lint pass with supported Node; record actual build outcome |
| AC08 | Delivery closure | Review diff/imports and actual checks including browser modal/focus and role/session lifetime. Unexecuted browser/build/hosted checks stay explicit; no claim of performance gain, zero regressions or deployed security certification |
| AC09 | Session absent/present, role changes or parent rerenders | One function in renderAppView.tsx selects the view from the safe user profile's role, including signed-out login, and returns React elements. Parent has no rendering branches for authentication/role selection. Selector has no hooks, requests, token access, independent mode state, URL/history changes or direct function calls to React components. Only the selected view mounts; existing shared chrome/DOM and child identities remain stable |

## Contracts and decisions

Current maintenance amendment under constitution 1.3.0: [012](../012-shift-action-confirmation/spec.md) extracted the PostShiftDialog native shell/lifecycle into shared Dialog, composed by both publication and ConfirmationDialog. The role/selector split and parent async ownership remain intact; the new confirm-before-mutation interaction supersedes the original immediate-action UI. Original 011 implementation evidence remains historical; [013](../013-harness-guidance-sync/tasks.md) records documentation reconciliation.

app/page.tsx keeps the named ShiftPatchApp export. Browser work remains in the existing client module graph; server/database modules stay outside it. API clients remain in lib/client/api.ts. Views receive only required data/callbacks, with existing public domain shapes. No new token props, markup, logs or storage.

Keep login fields, nursePanel and creating controlled by the parent to preserve resetSession behavior. Reuse AdminDashboard directly. Extract presentation/dialog first; moving async coordination would need a separately justified scope. No unresolved product question blocks this plan. Runtime implementation is recorded in tasks.md; build and unexecuted native checks stay open.

## Delivery condition

Planning: reviewed spec/plan/tasks, criterion mapping and feature index. Runtime implementation: AC01–AC09 evidenced in tasks.md with environmental limits explicit. Complete native evidence stays private; export availability must be honest.

## Change history

| Date | Change | Source |
| --- | --- | --- |
| 2026-10-19 | Initial parent/role component refactor plan | User request |
| 2026-10-19 | Separate pure SPA view selector, including signed-out rendering | User requested router-like selection without parent JSX role branches |
| 2026-10-19 | Local implementation of the split and renderAppView | User requested implementation |
