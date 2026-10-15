# Core User Experience — Plan

Specification: [spec.md](spec.md) · Date: 2026-10-15 · Status: UI implemented; Playwright E2E still pending approval

Reviewed constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0. Parent work: 001-shiftpatch/T07. API implementation/evidence: [004-auth-rbac-api/tasks.md](../004-auth-rbac-api/tasks.md). Harness: 003-test-harness.

## Minimal technical decision

Replace the starter home page with one role-aware application at `/`: login while signed out, marketplace for nurses and dashboard for agencies. Use an inline create form and a reason selector for cancellation; additional routes, modals, a global state library and direct browser Supabase access are unnecessary. Keep the existing server layout and add a focused Client Component for interactive state. The root-page choice avoids introducing cookie sessions or server route guards for a Bearer-only API.

Store token and safe public user only in component memory; clear on sign-out/reload/401. Attach Bearer headers to same-origin API fetches, disable caching and validate responses with existing Zod schemas. Do not import `lib/server` into client components, serialize secrets or persist tokens in local/session storage. The existing server endpoints remain the security boundary; UI role checks only choose controls. Agency list path uses the fixture's public agency user ID, never a selectable organization field.

Use a small shared card and notification component where both views actually reuse them. Keep list, operation and field states local. Apply successful full-shift responses immediately, then revalidate the appropriate list; keep success feedback if revalidation separately fails. On 409, reload and explain the conflict. On uncertain mutation outcomes, reconcile before allowing another mutation; never automatically retry POST requests. Mark pending at action level, prevent duplicate submissions and ignore/abort outstanding requests when identity changes. No polling, realtime subscription or optimistic claim/cancellation is required; a visible refresh/retry action supports other-session changes.

## Constitution review

| Principle | Application | Exception / source |
| --- | --- | --- |
| I. Spec before code | AC01–AC20 defined before UI; UI implemented; E2E verification remains pending | None |
| II. Exact contracts | Nine IDs; full Shift; lowercase states; fixture dates/local hours and open/null invariant | None |
| III. Minimal scope | Existing Next/React/Tailwind/Zod/Jest; one route, focused components; Playwright approval gate | None |
| IV. Security | Bearer to existing handlers; no client credentials/database imports; server authority retained | None |
| V. Verification | RTL for states, real browser workflows and hosted race proof; actual results in tasks | None |
| VI. Evidence | Manual native export outside repo; redact reviewed copies; no capture scripts | None |
| VII. Governance | Constitution 1.2.0 reviewed; no amendment required | None |

## Planned changes

Paths below are intended ownership, adjustable to avoid unnecessary files during implementation.

| Requirements / criteria | Files or components | Change |
| --- | --- | --- |
| R01 / AC01–AC03 | app/page.tsx; app/components/ShiftPatchApp.tsx | Replace starter; login/session lifecycle and role selection; sign-out; admin scope message |
| R01–R06 | lib/client/api.ts if sharing warrants it | Same-origin Bearer requests, schema parsing and normalized transport/API errors; no business authorization |
| R02–R03 / AC04–AC09 | app/components/ShiftCard.tsx; nurse view in ShiftPatchApp | Cross-agency cards, assigned nurse ID, claim action, reconcile conflicts/uncertain results |
| R04–R05 / AC10–AC15 | agency view; app/components/CreateShiftForm.tsx | Own listing, validated form, both cancellation reasons and reopen flow |
| R06 / AC16–AC18 | app/components/NotificationBanner.tsx; app/globals.css; app/layout.tsx | Accessible feedback/states, responsive styling, relevant metadata; preserve Tailwind directives |
| R07 / AC19 | __tests__/ui; e2e/core-workflows.spec.ts; playwright.config.ts; package.json/package-lock.json after approval | RTL interaction cases and real-app browser tests; private artifact ignores as needed |
| R07 / AC20 | specs/005-core-user-experience/tasks.md | Actual checks, review, limits and evidence references |

No database changes planned. If a verified API defect blocks a flow, document it under 004, load the Supabase skill before SQL changes and verify any fix directly in the dedicated project. Do not replicate server logic in the UI.

## Design and implementation guidance

Use a task-focused staffing application: readable cards, clear agency/role/schedule/status hierarchy and one primary action per card. No marketing hero, decorative imagery, invented metrics or additional modules. Preserve original hours/date strings when formatting; visibly distinguish overnight schedules without changing their data.

Load Hallmark for the UI design/implementation task and its relevant interaction/responsive references; preserve existing stylesheet directives and required explicit success/error banners even where generic skill defaults prefer silent success. Select visual tokens and review the actual rendered screens at implementation time; this plan does not claim a completed design audit. Load Vercel React guidance before writing/reviewing React. Repository rules override generic skill additions, including source-comment restrictions. Ponytail plugin tools are not exposed in this session; use the repository rule without reinstalling it.

Bundled Next.js guides inspected for this plan: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` and `01-app/02-guides/testing/playwright.md`. Re-read pertinent version-matched guides before application changes. Reuse Jest/RTL for focused component tests; the current ShiftListHarness is a test fixture, not a production authenticated client.

## Planned verification

| Criteria | Check | Expected evidence |
| --- | --- | --- |
| AC01–AC03 | Real login for both nurses and agencies; invalid login; expiry/sign-out/reload; admin scope fallback | Browser results plus RTL for deterministic session transitions; no token/password artifacts |
| AC04–AC09 | Marketplace baseline; successful claim; expired nurse; duplicate/pending; conflict, transport and server failures | Browser contracts plus RTL failure states; assigned nurse and cross-agency cards asserted |
| AC08 | Two eligible identities claim a disposable open shift concurrently through separate contexts | Exactly one success and authoritative filled assignment; existing hosted race with one identity alone does not prove this scenario |
| AC10–AC15 | Both agency dashboards; valid/invalid create; advance and no-show; foreign management request | Real UI + backend results; reopened shift claimable by nurse; foreign write denied and unchanged |
| AC16–AC18 | RTL loading/empty/retry/stale-session cases; IDs; keyboard and responsive review | Visible/announced messages and usable layouts at specified widths and desktop |
| AC19–AC20 | Focused Jest UI, full relevant Jest suites, approved Playwright suite, npm run typecheck, npm run lint, npm run build on Node 24 | Record commands, versions, actual counts, failures and skips; no claim of execution from this plan |

Run E2E against a production build where available, using real HTTP routes and the dedicated Supabase backend; mocked requests only supplement component/error-state tests. Keep credentials and tokens out of browser traces/storage-state exports and repository artifacts. Review screenshots for personal/local details before sharing.

Create test shifts using the authenticated agency API and reuse reopen transitions where possible. Do not mutate the three baseline fixtures for happy-path tests or reset the shared database while another suite runs. Before the two-nurse race, confirm availability of two eligible test identities: the second baseline nurse is expired. Reuse a verified existing isolated setup or explicitly document temporary test identity/credential preparation and restoration in the dedicated project. Do not silently alter fixture expiry dates. There is no delete API: coordinate approved private cleanup through existing database administration, without new utilities/endpoints; record created IDs and restoration outcomes. Browser E2E must not run concurrently with hosted mutation suites sharing setup.

## Dependencies and limitations

004 contains implemented handlers/migrations and recorded passing hosted checks, but its task table still marks T01–T07 pending. Its execution log records a Node 22 build and a dashboard screenshot for disabled public signup without subsequent API re-read. Treat these as evidence limits, not absence of implementation and not completed delivery. T01 below verifies the current API prerequisite and records relevant gaps without rewriting historical claims.

Playwright and browser binaries are absent from declared dependencies; installing them requires explicit dependency approval under `.cursor/rules/ponytail.mdc`. The plan does not authorize installation or claim E2E execution. UI/RTL implementation can proceed independently. No time estimate is asserted before validating backend readiness and browser setup.

## Implementation sequence

1. Verify API prerequisites and isolated test data; record remaining backend/environment limits.
2. Implement login/session shell and accessible shared states.
3. Deliver nurse marketplace and claim flow.
4. Deliver agency listing/create and cancellation with both reasons.
5. Complete responsive/accessibility and component failure-state checks.
6. After dependency approval, run real browser flows and race coverage; run required application checks, review the diff and record actual evidence.

## CI and E2E follow-up (2026-10-15)

[007-ci-e2e/plan.md](../007-ci-e2e/plan.md) owns the planned pipeline/browser verification increment. Its T04 supplies evidence for this feature T07; its T06 closes T08 only after Node 24/full checks pass. Existing UI/RTL outcomes remain valid at their recorded versions. No E2E completion, dependency installation or deployment is claimed by this follow-up.
