# Core User Experience — Specification

Feature ID: 005-core-user-experience · Date: 2026-10-15 · Status: Implemented in the application; browser E2E runner still pending dependency approval

Source: user's main ShiftPatch experience epic, including nurse marketplace, agency management, lifecycle, nine test IDs and critical E2E tests. Parent: [001-shiftpatch/spec.md](../001-shiftpatch/spec.md), R03–R10. API dependency: [004-auth-rbac-api/spec.md](../004-auth-rbac-api/spec.md). Applicable constitution: [CONSTITUTION.md](../CONSTITUTION.md), version 1.2.0.

## Problem and expected outcome

The repository contains authentication and shift API handlers, but its home page is still the Next.js starter. Nurses need to discover and claim cross-agency shifts; agencies need to publish, inspect and reopen their own staffing opportunities through a usable interface.

## Scope

Included: login interface, role-specific nurse marketplace and agency dashboard, shift cards, create form, claim and agency cancellation actions, credential-error handling, success/error banners, accessible responsive interaction states and critical browser E2E tests.

Excluded: recommendations, automatic matching, push/email notifications, advanced scheduling, registration, password recovery, token refresh, credential uploads, audit logs, timesheets, a new admin dashboard, nurse cancellation UI, new API endpoints and deployment. Existing API cancellation rights for a claiming nurse remain unchanged. The six additional parent test IDs for deferred modules remain parent obligations; this epic implements the nine listed below.

Application implementation is in scope. Installing Playwright still requires explicit dependency approval.

## Requirements

| ID | Required behavior | Acceptance criteria |
| --- | --- | --- |
| R01 | Login through the existing API and present the appropriate experience | AC01–AC03 |
| R02 | Show full shift information across both agencies to nurses | AC04–AC05 |
| R03 | Claim through authoritative credential validation and atomic assignment | AC06–AC09 |
| R04 | List and publish shifts for the authenticated agency | AC10–AC12 |
| R05 | Cancel filled agency shifts using either reason and reopen them | AC13–AC15 |
| R06 | Provide reliable feedback, accessible states and exact test IDs | AC16–AC18 |
| R07 | Verify critical flows end to end and preserve actual evidence | AC19–AC20 |

## Scenarios and acceptance criteria

| Criterion | Requirement | Given / when | Required result |
| --- | --- | --- | --- |
| AC01 | R01 | Nurse or agency submits valid credentials | Existing login API succeeds; nurse sees marketplace and agency sees its own dashboard; password is cleared after success |
| AC02 | R01 | Invalid login or unavailable login service | Visible error banner; generic invalid-credential message retained; retry possible; no authenticated screen granted |
| AC03 | R01 | No active UI session, explicit sign-out, page reload or protected request returns 401 | Login is shown; session/previous user's data cleared; expired-session feedback displayed for 401; no automatic refresh |
| AC04 | R02 | Nurse loads the marketplace with baseline fixtures | Shifts from both agencies appear, including past fixture dates; filled shifts stay visible |
| AC05 | R02 | Any shift card renders | Agency name, RN/LPN role, date, local start/end, open/filled status and assigned nurse's public ID when filled are visible |
| AC06 | R03 | Eligible nurse claims an open shift | API returns filled shift; card displays filled status and caller's nurse ID; claim action becomes unavailable; success banner appears |
| AC07 | R03 | Nurse with expired or missing credentials attempts a claim | Server rejects with 403 and `Credential expired, cannot claim shift`; error banner appears; shift is not locally marked filled |
| AC08 | R03 | Two eligible nurses claim the same open shift concurrently | At most one succeeds; loser receives conflict feedback and reloads authoritative state; both views identify the winner |
| AC09 | R03 | Claim fails from network/server error or user repeats a pending action | No false success; pending duplicate submissions prevented; retry enabled after completion and state reconciled before another attempt when outcome is uncertain |
| AC10 | R04 | Either agency opens its dashboard | Only its own shifts appear, including open and filled states |
| AC11 | R04 | Agency opens and submits a valid create form | Role, date, start/end accepted; new open shift appears with its authenticated agency and `claimedBy:null`; success banner appears |
| AC12 | R04 | Invalid form or forged agency identity | Field validation prevents ordinary invalid submission; API remains authoritative; client cannot select another agency; rejected writes show errors without adding a card |
| AC13 | R05 | Owning agency cancels a filled shift with `advance` | Shift reopens and assigned nurse clears; success banner appears; nurse marketplace reload shows it claimable |
| AC14 | R05 | Owning agency cancels a filled shift with `no-show` | Same reopened/null result; reason sent exactly as contracted; no cancelled lifecycle state is introduced |
| AC15 | R05 | Other agency attempts management, or cancellation conflicts/fails | API denies foreign management; no foreign controls/data on own dashboard; error banner and authoritative reload on conflict; no false reopened state |
| AC16 | R06 | List loads, returns empty, fails or mutation runs | Explicit loading/empty/error states, retry for load errors, disabled pending actions, visible success/error feedback; previous user's requests cannot populate a new session |
| AC17 | R06 | Keyboard or mobile user completes critical flows | Associated labels, visible focus, status conveyed beyond color, announced notifications, usable form errors and no horizontal overflow at 320/375/414/768px plus desktop |
| AC18 | R06 | Inspect forms, cards and notification actions | All nine exact test IDs below are on their semantic elements; card action IDs scoped by shift |
| AC19 | R07 | Browser E2E suite runs against the actual application and dedicated backend | Login, cross-agency discovery, claim, expired rejection, create, both cancellations and agency isolation verified; race uses two eligible identities, not the expired fixture |
| AC20 | R07 | Delivery review | Appropriate Jest suites, E2E, typecheck, lint and supported Node 24 build have actual outcomes recorded; visual review, failures/skips and private evidence availability disclosed |

## Contracts and data

Reuse all six operations and error shapes from 004; do not change server authorization, credential expiry or fixtures. Login returns `{token,user:{id,name,role}}`. Shift responses retain `{id,agencyId,agencyName,role,date,startTime,endTime,status,claimedBy}`. API values are lowercase `open`/`filled`; the epic's OPEN → FILLED → OPEN describes these same states. Cancellation accepts `{reason:"advance"|"no-show"}` and returns the full reopened shift plus `cancellation:{reason,previousNurseId}`.

Credentials remain valid through `expiresOn`, evaluated by the server using America/Bogota. There is no credential-read endpoint in this scope; the browser must not invent eligibility from the sample user ID or its own clock. Do not reject fixture dates for being in the past or convert facility-local hours into UTC. Overnight shifts remain valid; equal start/end does not.

| data-testid | Element |
| --- | --- |
| login-email-input | Email input |
| login-password-input | Password input |
| login-submit-button | Login submit button |
| shift-list-item | Each complete shift card/list item |
| shift-claim-button | Nurse claim action on an open card |
| shift-cancel-button | Owning agency cancellation action on a filled card |
| agency-post-shift-button | Opens create form |
| agency-post-shift-submit-button | Create form submit button |
| notification-banner | Shared success/error feedback |

## Questions and assumptions

| ID | Decision / assumption | Affected criteria | Resolution and source |
| --- | --- | --- | --- |
| Q01 | UI session lasts in memory until reload/sign-out/expiry; no persistent browser token storage | AC01–AC03 | Planning decision, aligned with 004 access-token-only contract; no remembered login required by epic |
| Q02 | Assigned nurse displayed by public ID | AC05–AC08 | Existing contract supplies `claimedBy`, not nurse name; no new profile endpoint needed |
| Q03 | Agency ID for existing sample accounts equals public login user ID | AC10–AC12 | Parent fixture contract; API still independently validates ownership; revisit before onboarding different identities |
| Q04 | Admin login remains valid but this epic shows a signed-in scope message and sign-out, without mutation controls | AC01–AC03 | Planning decision; admin dashboard deferred; API admin access remains read-only |
| Q05 | Browser automation dependency | AC19–AC20 | Playwright proposed; not installed. Explicit dependency approval required before installation by repository rule; planning can finish now |

## Delivery condition

Login, nurse marketplace, agency dashboard, create form, claim/cancel flows and real E2E tests satisfy AC01–AC20. API authority, exact IDs/contracts and fixture values are preserved. Planning completion does not prove implementation, hosted readiness or browser verification. No commit/publication unless requested.

## Change history

| Date | Change | Source |
| --- | --- | --- |
| 2026-10-15 | Initial specification | User's core experience epic and existing API contracts |
| 2026-10-15 | Implementation requested; Playwright install remains gated | User asked to implement this specification |
